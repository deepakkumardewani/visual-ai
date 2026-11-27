# Phase 1 (feedback system): independent verification

**Verdict: FAIL** (1 blocking keyboard/focus defect in the rating popup; everything else passes)

Date 2026-11-27, branch `feat/feedback-readme-demo` (uncommitted). Browser session `visual-ai-verify`, signed in as the e2e user from `apps/web/playwright/.auth/user.json`.
No paid or outbound calls were made. In the browser, `window.fetch` was patched to stub `POST /feedback/eligibility`, `POST /feedback` and (for the non-admin case) `GET /feedback/admin/access`, and to block every `POST /generate/*`. Admin reads and PATCHes went to the real API. `apps/api/.env` does not set `FEEDBACK_EMAIL_MODE`, so it defaults to `log`.

## Test runs (re-run by verifier)

| Command                                                                                                          | Result                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/api` `bunx vitest run`                                                                                     | 84 files, **1161/1161 pass**                                                                    |
| `packages/email` `bunx vitest run`                                                                               | 4 files, **29/29 pass**                                                                         |
| root `bunx vitest run packages/shared/src/schemas/feedback.test.ts`                                              | **12/12 pass**                                                                                  |
| `apps/web` `bunx vp check`                                                                                       | **0 errors**, 9 warnings, all in pre-existing files (none in feedback files); formatting passes |
| `apps/web` `bunx vp test run`                                                                                    | 230 files, **1747/1747 pass**                                                                   |
| `apps/web` `bunx playwright test e2e/feedback.spec.ts --workers=1`                                               | **10/10 pass** (auth setup plus 9 feedback tests, 18.8s)                                        |
| Weakening grep (`test.fail\|it.fails\|.skip\|.only\|.fixme\|waitForTimeout`) over all 19 new feedback test files | **0 hits**                                                                                      |

## Criteria

### Hard constraints: PASS

- No paid calls: e2e uses the `generationStub` fixture. Mailer sends only when `FEEDBACK_EMAIL_MODE==="send"` and `NODE_ENV!=="test"` (`apps/api/src/lib/feedback/mailer.ts:86`). Alerts skip `E2E_USER_IDS` (`services/feedback-service.ts:144`). Env mode defaults to `log` and uses `.catch("log")`.
- Constants live in `packages/shared/src/models/feedback.ts:3-45` (threshold 3, cooldown 30d, first session 12h, rating cutoffs 2/4, length caps, rate limits, digest cron), exported from `packages/shared/src/models/index.ts:10`.

### 1a Contextual rating popup: FAIL (1 blocking)

- PASS, server-side eligibility: `lib/feedback/eligibility.ts:20-38` covers first session (<12h), download OR >=3 generations, and the 30-day cooldown. The atomic CAS claim on `lastPromptedAt` is in `services/feedback-service.ts:58-82`, so "dismiss counts as shown" holds because the claim happens before display. The counter `$inc` runs before `completed` (`generation-service.ts:303,327`) and only for images.
- PASS, never while in flight (browser): with `generate.isLoading=true`, `maybePrompt('generation')` made 0 eligibility calls and the popup stayed closed. When loading went false, exactly 1 call `{trigger:"generation"}` was made and the popup opened.
- PASS, branches (browser): rating 2 shows "What went wrong or what's missing? (optional)". Rating 3 shows "What would make it better? (optional)". Ratings 4 and 5 show "What do you love?" plus the "You can quote me on the website" checkbox. The "Name to show" field appears after consent. Payload for rating 5: `{rating:5, message, testimonialConsent:true, displayName:"Dee K."}` with full context. Success shows "Thanks, that genuinely helps." and the card auto-closes after about 5s.
- PASS: Esc on open and the close button both dismiss with no extra request. A 429 shows a dedicated "wait a few minutes" message and keeps the text.
- PASS, focus return (browser): I focused the real "Explore" nav button, then opened the popup, which took focus on the `Share feedback` card. After Esc, focus was back on Explore. After the close button, focus was back on Explore. After rating, Send and auto-close (about 5s), focus was back on Explore and the card was unmounted.
- PASS: "Change" works by keyboard. Focus returns to the radio group (`1 of 5, Poor`), and the arrows move both focus and selection.
- **FAIL, keyboard focus after choosing a rating.** Steps: Tab → arrows → Enter (or Space, or a mouse click) on a rating, then `document.activeElement` is `BODY`. After that, Esc does nothing (popup stays open) because Esc is handled on the card. This also happens with a mouse click. Vue Test Utils stubs `<Transition>`, and `FeedbackPopup.test.ts` has no test for choosing a rating and then focusing the textarea, which is why unit tests miss it. Root cause: `apps/web/src/components/Feedback/FeedbackPopup.vue:90` focuses the textarea in `nextTick`, but the step `<Transition mode="out-in">` (line 169) has not mounted the detail step yet, so `querySelector('textarea')` returns null. The focused radio is then removed. The "Change" path does this correctly through `onStepEntered` (after-enter). Fix: focus the textarea from `onStepEntered` when the step is `detail` (same pattern as `pendingRatingFocus`), and add a unit test that renders the real transition, or an e2e `toBeFocused` assertion.
- Screenshots: `popup-step1-desktop-dark.png`, `popup-step1-desktop-light.png`, `popup-step1-mobile-light.png`, `popup-rating2-detail-desktop-dark.png`, `popup-rating3-detail-desktop-dark.png`, `popup-rating5-consent-desktop-light.png`, `popup-rating4-consent-mobile-light.png`, `popup-rating4-consent-mobile-dark.png`, `popup-sending-desktop-dark.png`, `popup-sending-desktop-light.png` (submitting state), `popup-success-desktop-light.png` (success state). On mobile the popup is a full-width bottom sheet (rect x0 w375 bottom 812).

### 1b Menu "Send feedback": PASS

- User menu item `user-menu-item-feedback` opens the "Send feedback" dialog with Bug / Idea / Other choices, a message field (maxlength 2000, counter) and the note "We'll include your current page, browser and plan."
- Validation: Send is disabled when the message is empty or whitespace only.
- Submitted payloads were `{source:"menu", type:"idea"|"bug", message, context:{route:"/create/image", lastModelId, plan, creditsTier, appVersion:"2.0.0", userAgent, viewport}}`. Success reads "Thanks, that genuinely helps. We read every message." Esc closes the dialog and focus returns to `user-menu-trigger`.
- Screenshots: `user-menu-desktop-light.png`, `menu-dialog-desktop-light.png`, `menu-dialog-desktop-dark.png`, `menu-dialog-mobile-light.png`, `menu-dialog-mobile-dark.png`, `menu-dialog-filled-mobile-dark.png`, `menu-dialog-success-mobile-dark.png`.

### 1c API + storage: PASS

- Model `apps/api/src/models/feedback.ts:50-70` has all required fields. Indexes are `{status:1,createdAt:-1}`, `{createdAt:-1}` and `{type:1,createdAt:-1}`. The `email` field is not required (the earlier review blocker is fixed).
- Routes `routes/feedback.ts`: zod `safeParse` → 400. The email comes from the user record. Admin routes use `feedbackAdminRateLimiter` + `requireAdmin` (403 `{error}`). Everything is mounted behind `requireAuth` (`routes/index.ts:33`). Without auth, every feedback endpoint was denied (`{"error":"Unauthenticated"}`).
- Validation caps (`packages/shared/src/schemas/feedback.ts`): message 2000 (trimmed), display name 60, admin note 2000, context strings 300, viewport ≤20000, rating 1–5 int, list limit ≤100, page ≤10000, enums for type and status.
- Rate limits are 10 per 10 min per user for submit and eligibility, and 120 per min for admin, each returning 429 `{message}` with `Retry-After` (`middlewares/feedback-rate-limit.ts`).
- Escaping: no `v-html` or `dangerouslySetInnerHTML` in feedback UI or templates. `packages/email/src/feedback.test.ts:38` asserts that `<script>` comes out escaped.

### 1d Notifications: PASS (code + unit tests)

- Alert for rating ≤2 or bug (`feedback-service.ts:121-157`) is caught and logged, never fails the request (tested). Weekly digest cron `FEEDBACK_DIGEST_CRON` is in `utils/cronJobs.ts` inside `ENABLE_CRON`. There is a `scripts/send-feedback-digest.ts --dry-run` script, and the digest builder is pure and tested.
- Env vars `ADMIN_USER_IDS`, `FEEDBACK_NOTIFY_EMAIL` and `FEEDBACK_EMAIL_MODE=log` are documented in `apps/api/.env.example:93-100`, and all are optional in `config/env.ts`.

### 1e Admin triage: PASS

- `/admin/feedback` (real API): the summary strip shows average rating 5.0, open 9, and counts by type (rating 4 / bug 0 / idea 5 / other 0). All five filters were exercised on real data. Type=Rating left only rating items. Status=Planned left exactly the one planned item. Rating=5 left only the four 5-star items. From=2026-12-31 gave 0 items with "Nothing matches these filters." From=today gave all 9, and From=today with To=yesterday gave 0. Quotable only left the four consented items. The detail panel shows message, consent and context. Changing status New → Planned persisted after reload, and open items went from 9 to 8. The admin note saved and showed "Saved". "Copy testimonial" (with an in-page list stub supplying a quote) copied `"Colorize brought my grandparents back to life." — Dee K.` and announced "Copied". It is disabled when there is no message.
- Non-admin (stubbed `/feedback/admin/access` → `{isAdmin:false}`): router push to `/admin/feedback` ended at `/`, and the admin UI never rendered. The API returns 403 for non-admins (`require-admin.ts:11-17`, `routes/feedback.test.ts:147`).
- Screenshots: `admin-desktop-light.png`, `admin-filtered-quotable-desktop-light.png`, `admin-filter-empty-desktop-light.png`, `admin-detail-desktop-light.png`, `admin-detail-status-note-desktop-light.png`, `admin-copy-testimonial-desktop-light.png`, `admin-detail-desktop-dark.png`, `admin-mobile-dark.png`, `admin-mobile-dark-full.png`, `admin-mobile-light.png`, `non-admin-blocked-desktop.png`. There is no horizontal overflow at 375 (scrollWidth 375).

### 1f Tests: PASS

- Unit tests cover eligibility (first-session boundary, threshold, download, cooldown, CAS claim and losing the race), zod validation, `requireAdmin` (admin, non-admin, empty list, missing id), routes, the digest builder, and the mailer in log mode. Web tests cover the popup, the dialog, the store (in-flight deferral), the guard and the admin composable. E2E covers the popup shown or not shown, in flight, low and high ratings, download, menu, admin triage and non-admin.
- Gap: no test asserts focus after choosing a rating, which is why the 1a defect got through.

### No regression in generation and downloads: PASS

- `recordSuccessfulGeneration` catches its own errors (`feedback-service.ts:42-52`, test "logs and swallows a database failure"), and `generation-service.test.ts:377-383` covers the counter rejecting while the job still completes.
- On the web side, `maybePrompt` is fire-and-forget (`void`) in `stores/app.ts` and `utils/helpers.ts`. `requestEligibility` never throws (`useFetch` plus `toResult`), and `ask()` catches. `downloadItemImage` returns the download result whatever feedback does.

## Advisory (non-blocking)

- `components/primitives/SegmentedControl.vue` (existing primitive used by the dialog): ArrowRight changes the selection but does not move focus, and every option has tabIndex 0, which is not the roving-tabindex radio pattern. It is still keyboard-operable with Tab plus Enter or Space.
- Unauthenticated requests return HTTP 500 `{"error":"Unauthenticated"}` instead of 401 across the API. This is existing behaviour, not caused by the feedback work.
- The e2e "Admin can triage" test creates a real feedback row each run (as the spec intends), so rows build up in the dev DB. `bun run reset:e2e-feedback` cleans them.
- The verifier's walkthrough edits (status `planned` plus an admin note on one e2e-user rating item) were reverted through the UI: status is back to `new`, the note is cleared, and open items are back to 9.
