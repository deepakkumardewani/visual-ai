# Feedback system — build spec

Source brief: `~/.claude/plans/feedback-readme-build-prompt.md` (Phase 1). This file pins the decisions every builder must follow.

## Hard rules

- No real paid or outbound calls from agents or tests (Replicate, Dodo live, email). Feedback emails default to **log-only**.
- Every new env var is **optional** with a safe default. `config/env.ts` is validated with zod, and `tsx watch` restarts on each edit, so a required var crashes the running dev server.
- No magic numbers. Thresholds, cooldowns, limits and cutoffs go in `packages/shared/src/models/feedback.ts`, exported from the shared index.
- Shared resolves `src` under bun but `dist` for tsc and other tools. After editing shared, run `bun run build` in `packages/shared`.
- Follow the existing patterns: Express routes plus `asyncHandler`, `requireUserId`, zod `safeParse`, then `BadRequestError`. Mongoose models with `{timestamps:true}`. Rate limits use the `sttRateLimiter` style. Dialogs use `AppModal`, and state lives in `useDialogStore`. Styling uses the `tw-` token classes.

## Shared constants (`packages/shared/src/models/feedback.ts`)

| Constant                                      | Value                             |
| --------------------------------------------- | --------------------------------- |
| `FEEDBACK_GENERATION_THRESHOLD`               | 3                                 |
| `FEEDBACK_PROMPT_COOLDOWN_DAYS`               | 30                                |
| `FEEDBACK_FIRST_SESSION_HOURS`                | 12                                |
| `FEEDBACK_LOW_RATING_MAX`                     | 2                                 |
| `FEEDBACK_HIGH_RATING_MIN`                    | 4                                 |
| `FEEDBACK_RATING_MIN` / `FEEDBACK_RATING_MAX` | 1 / 5                             |
| `FEEDBACK_MESSAGE_MAX_LENGTH`                 | 2000                              |
| `FEEDBACK_DISPLAY_NAME_MAX_LENGTH`            | 60                                |
| `FEEDBACK_ADMIN_NOTE_MAX_LENGTH`              | 2000                              |
| `FEEDBACK_RATE_LIMIT`                         | `{ windowMs: 10 min, max: 10 }`   |
| `FEEDBACK_DIGEST_CRON`                        | `'0 9 * * 1'` (Mondays 09:00 UTC) |

Enums are `FEEDBACK_SOURCES = ['popup','menu']`, `FEEDBACK_TYPES = ['rating','bug','idea','other']`, `FEEDBACK_STATUSES = ['new','triaged','planned','done','wont_fix']` and `FEEDBACK_TRIGGERS = ['generation','download']`.

Zod schemas go in `packages/shared/src/schemas/feedback.ts`:

- `CreateFeedbackSchema`: discriminated on `source`. The popup variant requires a rating. The menu variant requires `type ∈ bug|idea|other` and a non-empty message.
- `FeedbackContextSchema`: `route`, `lastModelId`, `plan`, `creditsTier`, `appVersion`, `userAgent`, `viewport {w,h}`. Every field is optional, and strings are length-capped.
- `FeedbackEligibilityRequestSchema`: `{ trigger }`.
- `UpdateFeedbackAdminSchema`: `{ status?, adminNote? }`.
- `AdminFeedbackQuerySchema`: `type`, `status`, `rating`, `from`, `to`, `testimonial`, `page` and `limit`. The limit is capped.

Messages and notes are `trim()`ed. Message and display name are capped at the constants above.

## Decisions

1. **Generation count.** History is capped, so its length is not usable. Add `feedback.successfulGenerations` (default 0) to `UserModel` and `$inc` it in the generation worker on success, **before** the job status is set to `completed`, so the client's next eligibility call sees the new count. Only text-to-image generations count, not upscale or other transforms, unless the worker path is shared.
2. **First session.** The user's `createdAt` is less than `FEEDBACK_FIRST_SESSION_HOURS` ago. There is no session concept in the app, so this is the documented approximation.
3. **Eligibility.** The client calls `POST /feedback/eligibility {trigger}`, and the server decides. It is eligible when all of these hold:
   - the account is not in its first session;
   - the trigger is `download`, or `successfulGenerations >= THRESHOLD`;
   - `feedback.lastPromptedAt` is null or older than the cooldown.

   The claim is **atomic**: one `findOneAndUpdate` with a filter on `lastPromptedAt` that sets `lastPromptedAt=now`. Returning eligible therefore marks the prompt as shown, which handles multiple tabs and the rule that "dismiss counts as shown". The response is `{ eligible: boolean }`. Pure eligibility logic lives in its own function for unit tests.

4. **Client trigger points.**
   - Generation: in `stores/app.ts` `handleEventSourceData` on `completed` for the `image` feature.
   - Download: in `utils/helpers.ts` `downloadItemImage`, which is the choke point for every single-image download, plus bulk download.
   - The client never asks while any feature is generating. It checks all `isLoading` / job states, defers until generation is idle, and asks at most once per page load.
5. **Popup UX.** A non-blocking card anchored bottom-right on desktop and as a bottom sheet on mobile, not a modal, focus-managed and dismissible with Esc or a close button.
   - Step 1 is five rating buttons with one tap each, built as a radio group with labels.
   - Step 2 branches. A rating of 2 or less asks "What went wrong or what's missing?". A rating of 3 asks "What would make it better?". A rating of 4 or more asks "What do you love?" and adds a "You can quote me on the website" checkbox plus an optional display name.
   - Text is optional, so submitting the rating alone is allowed.
   - A success state follows, then the card auto-closes.
   - Dismissing it sends nothing extra, because the claim was already recorded.
6. **Menu feedback.** Add a "Send feedback" item to `UserMenu.vue`. It opens an `AppModal` with a segmented Bug / Idea / Other choice, a message field, a context note ("We'll include your current page, browser and plan") and submit. Screenshots are out of scope.
7. **Auto-captured context.** Route path (no query string), last model used, plan and credits tier, app version, user agent and viewport. The app version comes from a vite `define` such as `__APP_VERSION__` from `apps/web/package.json`.
8. **API endpoints.** All of them use `requireAuth` and the feedback rate limiter.
   - `POST /feedback/eligibility`
   - `POST /feedback`: the email is taken from the user record, not the client.
   - `GET /feedback/admin/access` returns `{isAdmin}` and is used by the web route guard.
   - `GET /feedback/admin` returns the list with filters, pagination and `summary {avgRating, countByType, open}`. Open means status `new` or `triaged`.
   - `GET /feedback/admin/:id`
   - `PATCH /feedback/admin/:id` with `{status?, adminNote?}`.
   - The admin routes use a `requireAdmin` middleware that checks `env.ADMIN_USER_IDS` (a comma list parsed like `E2E_USER_IDS`) and returns 403 `{error}` otherwise.
9. **Model.** `FeedbackModel`, collection `feedback`. Fields:
   - `userId` (indexed), `email`, `source`, `type`, `rating?`
   - `message` (default `''`), `testimonialConsent` (default false), `displayName?`, `context`
   - `status` (default `new`), `adminNote` (default `''`), timestamps

   Indexes: `{status:1, createdAt:-1}`, `{createdAt:-1}` and `{type:1, createdAt:-1}`.

10. **Escaping.** Vue escapes interpolation, so never use `v-html` for feedback content. Templates escape via react-email. Never interpolate user text into raw HTML.
11. **Admin page.** The web route is `/admin/feedback`. The guard calls `GET /feedback/admin/access`, and non-admins are redirected home. The page has:
    - a summary strip with average rating, count by type and open items;
    - filters for type, status, rating, date range and testimonial consent;
    - a table or list with a detail panel;
    - a status select, an admin-note save action, and "Copy testimonial" (quote plus display name to the clipboard, consented items only).
12. **Email.**
    - **Templates.** `packages/email` gets `FeedbackAlert` (for a rating of 2 or less, or any bug) and `FeedbackDigest`, each with a render function exported from the index.
    - **Digest content.** Counts by type, average rating with the trend against the previous 7 days, new ideas, new consented quotes, and a link to `${APP_PUBLIC_URL}/admin/feedback`.
    - **Sending.** The API sends through a small transactional mailer that reuses the Resend client. Env vars:
      - `FEEDBACK_NOTIFY_EMAIL` is optional. When it's missing, the mailer skips and logs.
      - `FEEDBACK_EMAIL_MODE` is `log` or `send`, default `log`. Log mode writes the subject and recipient with pino and saves rendered HTML under `apps/api/.tmp/feedback-emails/` in non-production, then sends nothing.
    - **E2E users.** Submissions from `E2E_USER_IDS` never send.
    - **Failure handling.** Alert failures are logged and must never fail the feedback request.
    - **Digest schedule.** Add a job to the existing `node-cron` `utils/cronJobs.ts` (gated by `ENABLE_CRON`) using `FEEDBACK_DIGEST_CRON`. Put the digest builder in a pure, testable module, and add a CLI script `apps/api/scripts/send-feedback-digest.ts --dry-run`.
13. **Env docs.** Add `ADMIN_USER_IDS`, `FEEDBACK_NOTIFY_EMAIL` and `FEEDBACK_EMAIL_MODE` to `apps/api/.env.example` with comments.
14. **E2E reset.** Add `apps/api/tools/reset-e2e-feedback.ts`, in the style of `seed-e2e-user.ts`. It clears the e2e user's `feedback.lastPromptedAt`, sets `successfulGenerations` and deletes its feedback docs. Call it from the e2e global setup, or have each spec stub `/feedback/eligibility` through Playwright routes. Prefer route stubs for the UI flows, plus one real-API flow.

## Implemented API contract

Every endpoint requires auth and is rate-limited to 10 requests per 10 minutes per user. A rate-limited request returns 429 `{message}`.

| Endpoint                     | Request                                                                                                                                                                                                                                                                                  | Response                                                                                                                                                                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /feedback/eligibility` | `{trigger:"generation"\|"download"}`                                                                                                                                                                                                                                                     | 200 `{eligible}`. `true` also claims the prompt (marks it shown). A bad trigger returns 400 `{message}`.                                                                                                                                                                                                            |
| `POST /feedback`             | Popup: `{source:"popup", rating:1-5, message?, testimonialConsent?, displayName?, context?}`. Menu: `{source:"menu", type:"bug"\|"idea"\|"other", message (non-empty), context?}`. `context` is `{route?, lastModelId?, plan?, creditsTier?, appVersion?, userAgent?, viewport?:{w,h}}`. | 201 `{id}`, or 400 `{message}`                                                                                                                                                                                                                                                                                      |
| `GET /feedback/admin/access` |                                                                                                                                                                                                                                                                                          | 200 `{isAdmin}`                                                                                                                                                                                                                                                                                                     |
| `GET /feedback/admin`        | Query: `type, status, rating, from, to, testimonial=true\|false, page=1, limit=25` (max 100)                                                                                                                                                                                             | `{items, total, page, limit, summary:{avgRating\|null, countByType:{rating,bug,idea,other}, open}}`. Each item is `{id, userId, email, source, type, rating?, message, testimonialConsent, displayName?, context, status, adminNote, createdAt, updatedAt}`. The summary covers all feedback, not the filtered set. |
| `GET /feedback/admin/:id`    |                                                                                                                                                                                                                                                                                          | `{item}`. A bad id returns 400 and a missing item 404.                                                                                                                                                                                                                                                              |
| `PATCH /feedback/admin/:id`  | `{status?, adminNote?}`                                                                                                                                                                                                                                                                  | `{item}`. A non-admin gets 403 `{error}`.                                                                                                                                                                                                                                                                           |

The reset tool is `cd apps/api && bun run reset:e2e-feedback [-- N]`.

## Tests

- **API (vitest).** Cover:
  - eligibility: first session, below and at threshold, download trigger, the cooldown, and claim-sets-lastPrompted;
  - zod validation;
  - `requireAdmin` (admin, non-admin, empty list);
  - the routes (supertest or the existing pattern);
  - the digest builder;
  - the mailer in log mode, which must not call Resend.
- **Web (vitest).** Cover the popup branching, the menu dialog, and the eligibility composable (in-flight deferral, once per page load).
- **E2E (Playwright).** Every paid endpoint is stubbed with the `generationStub` fixture. Cover:
  - the popup appears after a completed generation when eligible, and does not appear when eligibility is false or a generation is in flight;
  - submitting a low and a high rating;
  - menu feedback;
  - an admin triaging an item;
  - a non-admin being blocked (stub `/feedback/admin/access`).
- **Baseline.** These suites already fail before this work: web has 36 failures in 6 files (pricing, ModelPicker, models) and the API has 65 in 9 files (payments, generate, credit-calculator). Do not count them as regressions, and add no new failures.
