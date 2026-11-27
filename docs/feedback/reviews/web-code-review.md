CHANGES · Feedback web: popup can open mid-generation after the eligibility round-trip; 3 admin-inbox correctness bugs

## PASSED

## BLOCKING

- WEB · [code] · apps/web/src/stores/feedback.ts:46-49 · (0, Medium, spec decision 4) The popup can open during an in-flight generation. `maybePrompt` checks `isGenerating` only before the request. After `await requestEligibility(trigger)` returns true, `ask()` sets `popupOpen = true` without checking again, so a generation started during the round-trip gets the card mid-generation (for example, the user downloads and then immediately clicks Generate). The deferred path goes through the same `ask()`, so it has the same gap. · The server has already claimed the prompt (30-day cooldown), so do not drop it; defer the open instead. Set a `pendingOpen` flag when `eligible && isGenerating.value`, and in the existing `isGenerating` watch set `popupOpen = true` once idle. Test it: hold the eligibility promise, set `generate.isLoading = true`, resolve, assert `popupOpen` is false, set `isLoading = false`, and assert it is true.
- WEB · [code] · apps/web/src/composables/useAdminFeedback.ts:75 + apps/web/src/components/Admin/FeedbackDetailPanel.vue:132-137 · (1, Medium) Status changes can be lost silently. `patch()` returns early when `saving.value` is set, but the status select is disabled only for `saving === 'status'`. If the admin changes status while a note save is in flight, the change is dropped and the select still shows the new value. The same stale display happens when a status PATCH fails: the prop `item.status` never changes, so Vue does not reset the native select, and it keeps showing a status that was never saved. · Disable the status select whenever `saving !== null`. On failure, force the select back to `item.status`, for example with a `saveAttempt` counter in the key (`:key="`${item.id}-${item.status}-${saveAttempt}`"`) or by resetting the select's DOM value. Add a test for each path.
- WEB · [code] · apps/web/src/utils/feedbackApi.ts:79-80 · (2, Medium) `new Date(...).toISOString()` throws `RangeError` on an invalid date. Chrome's date input accepts 6-digit years, so a typo such as `202611-11-27` reaches this code; I confirmed the throw with node. `buildAdminQuery` runs inside `load()` from the debounce `setTimeout`, so the rejection goes unhandled and `state` stays `'loading'` (skeleton or stale list) until reload. · Leave out `from`/`to` when `Number.isNaN(date.getTime())`, using a small `toIsoOrUndefined(local)` helper. Also wrap `load()` so any thrown error sets `state = 'error'`. Add a test with an invalid date.
- WEB · [code] · apps/web/src/composables/useAdminFeedback.ts:24,87 · (3, Low, but a data defect: spec decision 8 defines `open` and the strip shows a wrong count) After a status PATCH only the row is patched, so `summary.open` is stale: triaging `new` to `done` leaves "Open items" unchanged. The comment on line 24 ("All feedback endpoints share one rate limit") is also out of date, because the admin limiter is now 120/min, separate from the user 10/10min. · Update `summary.open` locally when the status moves between the open set (`new`, `triaged`) and the closed set, or refetch (cheap at 120/min). Fix the comment.

## ADVISORY

- WEB · [code] · apps/web/src/stores/feedback.ts:26,60 · (4) "Once per page load" is implemented per trigger, so up to 2 eligibility calls can happen per load (a generation "no" and then a download "yes"). The popup still shows at most once (`promptClaimed`), and this matches the server rules: download is eligible below the threshold. The spec literally says "asks at most once per page load". · Confirm the intent and update spec decision 4, or collapse to a single ask.
- WEB · [code] · apps/web/src/pages/AdminFeedback.vue:11-15 · (5) `usePageSeo` has no `robots`, so the admin route defaults to `index,follow` with a canonical tag. · Add `robots: 'noindex,nofollow'`, as Dashboard and LandingV2 do.
- WEB · [code] · apps/web/src/components/Feedback/FeedbackPopup.vue:21 + apps/web/src/components/Dialogs/FeedbackDialog.vue:20 · (6) DRY: `SUBMIT_ERROR` is duplicated. The error color `tw-text-[#e08585]` is repeated 3 times (FeedbackPopupForm.vue:83, FeedbackDialog.vue:126, FeedbackDetailPanel.vue:163). · Move the string to `utils/feedbackUi.ts` and use a semantic error token class.
- WEB · [code] · apps/web/src/components/Admin/FeedbackDetailPanel.vue:101 + apps/web/src/components/Admin/FeedbackList.vue:29 · (7) The literal `5` in "Rated … of 5" and "out of 5" is a magic number. · Use `FEEDBACK_RATING_MAX`.
- WEB · [code] · apps/web/src/components/Admin/FeedbackDetailPanel.vue:40,79 · (8) `copiedTimer` is never cleared on unmount. · Add `onBeforeUnmount(() => clearTimeout(copiedTimer))`.
- WEB · [code] · apps/web/src/components/Dialogs/FeedbackDialog.vue:46-65 · (9) Race: if the user closes and reopens the dialog during a submit, `reset()` clears `submitting`, and the old response then sets `sent = true` in the new session. · Guard with a submission sequence number, or ignore results once the dialog has closed.
- WEB · [test-quality] · apps/web/src/utils/feedbackApi.test.ts:34 · (10) It asserts `to - from > 23h` rather than the exact local end of day. The new trigger wiring has no unit test: `helpers.ts` `downloadItemImage` (prompts only on success) and `bulkDownload` (once per batch, none when nothing downloaded), and `app.ts` (`completed` for IMAGE only). · Assert `to === new Date('2026-01-10T23:59:59.999').toISOString()` and add the wiring tests.
- WEB · [code] · apps/web/src/utils/feedbackUi.ts:11 · (12) `FEEDBACK_ADMIN_PAGE_LIMIT = 25` duplicates the shared `FEEDBACK_ADMIN_DEFAULT_PAGE_SIZE`. · Import the shared constant.
- WEB · [code] · apps/web/src/pages/AdminFeedback.vue:58-60 · (11) The skeleton count `4` and `tw-h-[88px]` are minor magic values. · Use named constants.

## Summary

- Spec compliance verified:
  - The generation trigger fires only on `completed` with `feature === FeatureType.IMAGE` (app.ts:138-143).
  - The download trigger fires for single downloads through `downloadItemImage`, only when the download succeeds, and once per batch in `bulkDownload` when at least one image downloaded.
  - `isGenerating` covers every in-flight flag in the generate store (`isLoading`, upscale, colorize, revive, removeBg). The web app has no video flow.
  - A prompt that arrives during a generation is deferred through a watch and sent once generation is idle.
  - The server decides eligibility; the client only gates on sign-in, in-flight state and once per load.
- No regressions:
  - `downloadItemImage` returns the same boolean and propagates errors as before.
  - `bulkDownload` keeps its per-item try/catch.
  - `maybePrompt` cannot throw: `useFetch` never throws, and `ask()` catches and logs. Feedback failures therefore cannot break generation or download.
- Security verified:
  - No `v-html` anywhere in the feedback or admin UI; all user text is interpolated.
  - The route guard checks `GET /feedback/admin/access` and sends users home on false, an error or a Clerk timeout. The API's `requireAdmin` is the real enforcement.
  - No admin ids are in the bundle; the only new `define` is `__APP_VERSION__`.
  - The clipboard copy uses `navigator.clipboard.writeText` with plain text, for consented items only.
  - Context uses `route.path` plus `stripQuery`, clips strings to `FEEDBACK_CONTEXT_STRING_MAX_LENGTH` and clamps the viewport.
  - Logs carry only the status, trigger or error, never the message or email.
- Test quality: FeedbackDialog.test.ts covers blank and whitespace blocking, the maxlength cap, the trimmed payload with type and context, and the error path keeping the text. adminGuard.test.ts covers admin, signed-out to signin with redirect, non-admin home, waiting for Clerk, and the Clerk timeout. A failed access check returns false and is covered by the non-admin case. No tautologies were found.
- Date range `to`: no mismatch, because the server does not shift `to` (`AdminFeedbackQuerySchema` and the `GET /feedback/admin` handler only coerce it to a Date). The client sends local 00:00:00.000 for `from` and local 23:59:59.999 for `to` as ISO. The API coerces both to Date and uses `$gte`/`$lte`, so the end day is included in full. The day boundaries follow the admin's browser timezone, not UTC; consider documenting that.
- Commands:
  - `bunx vp test run` on the 9 feedback-related files: 84/84 pass. Full web suite: 229 files and 1727 tests, all pass.
  - `bunx vp check` reports only formatting issues, in `e2e/feedback.spec.ts` (out of scope, being written) and `e2e/scenarios/feedback.feature.md`; run `vp check --fix`.
- Pinia/Vue practice is fine: a setup store with `storeToRefs`, `defineModel`, `useId`, a debounced deep watch with a stale-response guard (`requestSeq`), and components each under about 175 lines.

## Fixes applied

- 0 (blocking) `stores/feedback.ts`: after the eligibility response, `ask()` re-checks `isGenerating`. If busy it keeps the claim and sets `pendingOpen`; the `isGenerating` watch opens the popup once idle. Test: "defers opening when a generation starts during the eligibility round-trip".
- 1 (blocking) `useAdminFeedback.ts`: writes are serialised through a promise queue, so a status change during a note save is applied afterwards. `FeedbackDetailPanel.vue` disables the status select while any save runs and resets a local `statusDraft` to `item.status` on every failed save (`failedSaves` counter). Tests: queue ordering (composable), select revert and disabled state (new `FeedbackDetailPanel.test.ts`).
- 2 (blocking) `feedbackApi.ts`: `toIsoOrUndefined` drops invalid dates; `fetchAdminFeedback` catches throws, and `load()` also catches, so errors land in `state = 'error'`. Tests: invalid dates in `buildAdminQuery`, rejected fetch gives the error state.
- 3 (blocking) `summary.open` is adjusted on every status change between open (`new`, `triaged`) and closed sets; stale rate-limit comment replaced. Test: open count follows triage.
- 5 `AdminFeedback.vue` has `robots: 'noindex,nofollow'`.
- 6 `SUBMIT_ERROR` is now `FEEDBACK_SUBMIT_ERROR` in `utils/feedbackUi.ts`; the error colour is one `FEEDBACK_ERROR_TEXT_CLASS` (`tw-text-red-400`, the app-wide pattern) instead of 3 hex literals.
- 7 `FEEDBACK_RATING_MAX` used in the detail panel and list.
- 8 `copiedTimer` cleared on unmount.
- 9 FeedbackDialog: submission sequence number; a response landing after close/reopen is ignored. Test added.
- 10 Exact end-of-day assertion; wiring tests for `downloadItemImage`, `bulkDownload` (once per batch, none when nothing downloaded) and `app.ts` (`completed` for IMAGE only).
- 11 Skeleton count and height named/tokenised. 12 `FEEDBACK_ADMIN_DEFAULT_PAGE_SIZE` imported from shared.
- `vp check --fix` run: formatting passes (0 errors).

Not changed: 4 (once per load vs once per trigger) needs a spec decision.
