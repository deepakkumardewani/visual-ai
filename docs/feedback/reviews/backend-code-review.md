CHANGES · feedback backend is close to the spec and well tested; 2 blocking correctness gaps (an empty email fails the feedback save; testimonial consent is not enforced)

No tasks file exists for this work, so the ids below are review areas:

- B1 shared constants and schemas
- B2 email templates
- B3 eligibility and generation counter
- B4 routes, admin and rate limit
- B5 mailer, digest and cron
- B6 env, tooling and scripts

Test runs (done by the reviewer):

- `cd apps/api && bunx vitest run`: 83 files, 1148 tests, all pass.
- `cd packages/email && bunx vitest run`: 4 files, 29 tests, all pass.
- `packages/shared/src/schemas/feedback.test.ts` from the repo root (`bunx vitest run <file>`): 11 pass. Running vitest inside `packages/shared` fails on the root `setupFiles` path. That is a repo setup quirk, not a regression.

## PASSED

- B2 · `renderElement` removes the duplicated render logic. `EmailShell` is shared by both templates. User text is rendered only through react-email text nodes, and the "escapes user-supplied markup" test checks this. `renderFeedbackAlert` and `renderFeedbackDigest` are exported from the index. The digest covers counts by type, average rating with trend, ideas, quotes and the admin link.
- B4 · The STT limiter is unchanged. The key function body is identical (only renamed to `userOrIpRateLimitKey`), and the prefix still resolves to `${QUEUE_PREFIX}:stt-rl:`. The feedback limiter uses its own `feedback-rl` prefix and returns 429 `{message}`. `requireAdmin` returns 403 `{error}`, and an empty list or missing id is denied; the tests assert `next` and the status. `/feedback/admin/access` is registered before `/:id`, and a test pins that order. Every route uses `safeParse` then `BadRequestError`. A bad ObjectId returns 400, a missing item 404, and an empty patch 400. Zod strips a client-sent `email` (tested at the route), and the service takes the email from the user record (tested).
- B5 · `deliverFeedbackEmail` (`lib/feedback/mailer.ts:77-94`) reaches Resend only when `FEEDBACK_EMAIL_MODE === "send"` and `FEEDBACK_NOTIFY_EMAIL` is set. `forceLog` (`--dry-run`) overrides send mode. A missing recipient means skip and log. Log mode writes the preview only outside production, and a failed write is logged as a warning. The log-mode test asserts that neither the Resend constructor nor `send` is called. `notifyFeedbackAlert` (`feedback-service.ts:135-149`) catches render and send errors and skips `E2E_USER_IDS`, so the request never fails (tested). The cron job is inside the `ENABLE_CRON` guard and uses `FEEDBACK_DIGEST_CRON`; it catches and logs errors (tested). `buildFeedbackDigest` is pure and tested for windows, trend, caps and quote filtering.
- B6 · All three new env vars are optional with safe defaults (`config/env.ts:103-115`). `FEEDBACK_EMAIL_MODE` uses `.catch("log")`, so a typo can never switch sending on. `.env.example` documents them. `.gitignore` covers `.tmp/` and un-ignores the digest script. `reset-e2e-feedback.ts` follows the `seed-e2e-user.ts` pattern, touches only the e2e user, and validates its argument. The `send-feedback-digest.ts --dry-run` script disconnects in a `finally` block.
- B3 (rules) · Spec rules met in `lib/feedback/eligibility.ts:20-38`:
  - First session is `< FEEDBACK_FIRST_SESSION_HOURS`.
  - The threshold check is `>=`, and the download trigger skips the count.
  - The cooldown is `< 30 days`.
  - Boundary tests cover the exact edge and 1 ms inside for both windows.

  The claim (`feedback-service.ts:57-81`) is a compare-and-set `findOneAndUpdate({userId, "feedback.lastPromptedAt": <read value>})`. Two tabs cannot both win, and the null filter also matches older users with no `feedback` subdoc.

  `recordSuccessfulGeneration` runs before `status: "completed"` on both paths: `generation-service.ts:303` (history cap) and `:327` (before `finalizeJob`). It is limited to `FeatureType.IMAGE`, costs one `updateOne`, and catches and logs its own errors, so it cannot fail or noticeably slow a paid generation.

## BLOCKING

1. B4 · [code] High · `apps/api/src/models/feedback.ts:53` with `apps/api/src/services/feedback-service.ts:158`. `email` is `{ required: true, default: "" }`, and `submitFeedback` passes `user.email ?? ""`. Mongoose's String required check (`SchemaString._checkRequired = v => ... && v.length`) rejects `""`. `UserModel.email` is optional with a `""` default (`models/user.ts:29`). So for any user without an email, `FeedbackModel.create` throws a ValidationError and `POST /feedback` returns 500 instead of 201. Fix: drop `required: true`, keep `default: ""`, and make `email` an optional string in `IFeedback` if needed. Add a service test that a user with `email: ""` or no email still gets their feedback stored. The current tests mock `FeedbackModel.create`, so they cannot catch this. A model-level `validateSync()` test on a `new FeedbackModel({... email: ""})` would pin it.
2. B1 · [code] Medium · `packages/shared/src/schemas/feedback.ts:35-42` with `apps/api/src/services/feedback-service.ts:100-102`. Popup feedback stores `testimonialConsent: true` and `displayName` for any rating, including 1 or 2. Spec decision 5 offers consent only for ratings of `FEEDBACK_HIGH_RATING_MIN` (4) or more, and decision 11's testimonial filter and "Copy testimonial" rely on the flag. The digest already guards with `rating >= FEEDBACK_HIGH_RATING_MIN` (`lib/feedback/digest.ts:70`), which shows the invariant was intended but is not enforced when the record is written. Fix: in `toFeedbackFields`, set `const consent = body.rating >= FEEDBACK_HIGH_RATING_MIN && (body.testimonialConsent ?? false)`, store `testimonialConsent: consent`, and keep `displayName` only when `consent` is true. Add a service test: a 2-star submission with consent true is stored with `testimonialConsent: false` and no `displayName`.

## ADVISORY

3. Medium · `apps/api/src/routes/feedback.ts:51-52`. Admin and user routes share one 10-per-10-minutes bucket per user. An admin triaging about 4 items (access check, list, then detail plus patch per item) gets 429s. The spec requires the feedback limiter on every endpoint, so this follows the spec. Recommend a spec amendment: give `adminGuards` a separate, looser admin limiter.
4. Medium · `packages/shared/src/schemas/feedback.ts:70` with `apps/api/src/services/feedback-service.ts:179-183`. `to: z.coerce.date()` combined with `$lte` excludes the whole selected end day when the web sends a date-only `YYYY-MM-DD` (midnight UTC). Either have the web send end-of-day, or treat `to` as exclusive next-day midnight. Agree the contract with the web agent.
5. Low · `apps/api/src/services/feedback-service.ts:159`. `submitFeedback` awaits `notifyFeedbackAlert`. In send mode, Resend latency delays the 201. It never throws, so `void notifyFeedbackAlert(...)` (fire-and-forget) keeps the response fast.
6. Low · `apps/api/src/services/generation-service.ts:15` imports the counter from `feedback-service.ts`. That pulls `@visual-ai/email` (react and react-email render) and the mailer into the generation worker's module graph. Move `recordSuccessfulGeneration` into a small `lib/feedback/generation-counter.ts` (UserModel and logger only).
7. Low · test gap. No test pins decision 1's ordering, which is that the counter runs before `setStatus({status:"completed"})` on both branches. `generation-service.test.ts` neither mocks nor asserts `recordSuccessfulGeneration`. Add a call-order assertion for the normal path and the history-cap path.
8. Low DRY · `apps/api/src/config/env.ts:104-113` (`ADMIN_USER_IDS`) duplicates the comma-list transform of `E2E_USER_IDS` (`:58-66`). Extract a `commaSeparatedIds` zod helper and use it for both.
9. Low DRY · `apps/api/src/middlewares/feedback-rate-limit.ts:9-21` copies the STT limiter config and handler (Retry-After plus JSON 429). A `createUserRateLimiter({ windowMs, max, message, prefix })` in `rate-limit.ts` would serve both. `requireUserId` (`routes/feedback.ts:27`) also duplicates `routes/saved-prompts.ts:15`; move it to `lib/`.
10. Low DRY · `MS_PER_DAY` is defined in both `apps/api/src/lib/feedback/eligibility.ts:9` and `apps/api/src/lib/feedback/digest.ts:11`. Define it once.
11. Low magic values:
    - `packages/email/src/FeedbackAlert.tsx:45,51` and `FeedbackDigest.tsx:61` hardcode `/5`. The email package already depends on `@visual-ai/shared`, so use `FEEDBACK_RATING_MAX`.
    - `FeedbackDigest.tsx:64` hardcodes "previous 7 days". Derive it from `DIGEST_WINDOW_DAYS`, which would move to shared.
    - `apps/api/src/services/feedback-service.ts:25` `DEFAULT_APP_URL` repeats the domain in `middlewares/clerk.ts:28`.
12. Low · `apps/api/src/routes/feedback.ts:42-49`. `toDto` spreads the lean document, so responses include `__v`, which the spec contract does not list. Destructure `__v` out as well.
13. Low · `apps/api/scripts/send-feedback-digest.ts`. With `--dry-run` and `FEEDBACK_NOTIFY_EMAIL` unset, `deliverFeedbackEmail` returns "skipped" and writes no preview, so the dry run produces nothing to inspect. Consider writing the preview on dry runs even without a recipient.
14. Low test-quality:
    - `apps/api/src/utils/cronJobs.test.ts:96,99` hardcodes `"0 9 * * 1"`. That is acceptable as an independent literal, but it duplicates the shared constant.
    - The eligibility tests derive their boundaries from the shared constants, so changing a constant's value is not caught. One assertion pinning the spec values (3, 30, 12) would catch an accidental edit.
15. Nit · `apps/api/src/routes/feedback.ts:61,75,92,115` repeat `parsed.error.issues[0]?.message ?? "..."`. A small `parseOrThrow(schema, input, fallback)` helper would remove the repetition.

## Summary

The spec's hard rules hold. The generation counter sits before `completed` on both paths, is limited to image generations, and cannot throw into or slow a job. The STT limiter behaves exactly as before. The mailer sends only in explicit `send` mode with a recipient configured, and alert failures never reach the request. All new env vars are optional with safe defaults. The eligibility rules match the spec, including `>=`, the cooldown boundary and the atomic CAS claim.

The tests were checked against test-quality.md. They contain no skip, only or fail markers, the boundaries are exact, the one loop iterates a non-empty literal array, and the log-mode test proves Resend is untouched.

Two blocking items:

- The `email` required plus `""` mismatch makes `POST /feedback` return 500 for users without an email.
- Testimonial consent and display name must be stored only for ratings of 4 or more.

Advisory 3 (admin rate limit) and 4 (the date `to` boundary) need a decision with the spec owner or the web agent.

## Fixes applied

Blocking:

1. `models/feedback.ts`: removed `required: true` from `email` (kept `default: ""`). New `models/feedback.test.ts` runs `validateSync()` on a user with an empty and a missing email.
2. `feedback-service.ts` `toFeedbackFields`: `testimonialConsent` and `displayName` are stored only when `rating >= FEEDBACK_HIGH_RATING_MIN`. Tests cover the boundary (4 stores, 3 drops).

Advisory:

- 3 (admin limiter): new `FEEDBACK_ADMIN_RATE_LIMIT` (1 min, 120) in `packages/shared`. `feedback-rate-limit.ts` builds both limiters from one factory (also closes the limiter half of 9), with the `feedback-admin-rl` store prefix. All four admin routes, including `/feedback/admin/access`, use it. User routes keep `FEEDBACK_RATE_LIMIT`. A route test pins which limiter each route uses. Shared was rebuilt.
- 2 (plan in alerts): `submitFeedback` selects `plan` from the user record and passes it to `notifyFeedbackAlert`. The alert no longer reads `context.plan`. Tests cover both a user with a plan and one without.
- 3 (page cap, review item 3 of the security list): `FEEDBACK_ADMIN_MAX_PAGE = 10000` caps `page` in `AdminFeedbackQuerySchema`. Schema test added, including `1e300`.
- 11 (magic values): the email templates use `FEEDBACK_RATING_MAX` and `FEEDBACK_DIGEST_WINDOW_DAYS`. The digest window constant moved to shared and `digest.ts` imports it.
- 8 (DRY env): `commaSeparatedList` helper in `config/env.ts` serves `E2E_USER_IDS` and `ADMIN_USER_IDS`.
- 5 (mail guard): `deliverFeedbackEmail` never sends when `NODE_ENV === "test"`, even with mode `send`. Test added.
- 7 (ordering test): `generation-service.test.ts` pins that `recordSuccessfulGeneration` is awaited before the `completed` status on both the saved and history-cap paths. It also checks that completion waits while the counter is pending.

Skipped:

- Alert flooding budget (security 1), preview allowlist (security 4), digest lock (6), `/users` IDOR and global error handler (pre-existing, out of scope): they need design decisions or touch files outside this work.
- Date `to` boundary (4): needs a contract agreed with the web agent.
- `void notifyFeedbackAlert` (5), generation-counter move (6), shared `createUserRateLimiter` and `requireUserId` (9), `MS_PER_DAY` dedupe (10), `DEFAULT_APP_URL`, `__v` in the DTO (12), dry-run preview (13), cron-literal and spec-value pin tests (14), `parseOrThrow` (15): not trivial or not requested.

Verification: `apps/api` vitest 84 files / 1161 tests pass; `packages/email` 29 pass; `packages/shared` feedback schema test 12 pass; API `tsc` shows no errors besides the pre-existing TS6142 ones.
