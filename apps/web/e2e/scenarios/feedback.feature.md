# Feedback system (rating popup, menu feedback, admin triage)

# evidence: stores/feedback.ts, components/Feedback/\*, components/Dialogs/FeedbackDialog.vue, pages/AdminFeedback.vue, router/adminGuard.ts, docs/feedback/spec.md

## Rules

- `POST /generate/image` is stubbed with the `generationStub` fixture, along with every other paid endpoint.
- No real email is ever sent. The API defaults to log mode, and the e2e user is skipped anyway.

## @critical Popup appears after a completed image generation when the server says eligible

- Stub `**/feedback/eligibility` with `{eligible:true}`, then complete a stubbed generation.
- Assert that the rating popup becomes visible.

## @critical Popup does not appear when not eligible

- With eligibility `{eligible:false}`, a completed generation shows no popup.

## @critical Popup does not ask while a generation is in flight

- No eligibility request is sent before the generation completes.

## @high Low rating (≤2) shows "what went wrong", then submits and shows success

- Assert that the `POST /feedback` payload has `source:"popup"` and the rating.
- Assert that the consent checkbox is absent.

## @high High rating (≥4) shows "what do you love" with the testimonial-consent checkbox and display name

- Submit with consent.
- Assert that the payload has `testimonialConsent:true` and the display name.

## @high Download trigger

- Downloading an asset from `/assets` sends an eligibility request with `trigger:"download"`.

## @critical Menu "Send feedback"

- Open the user menu and choose "Send feedback".
- Pick Bug, type a message and submit.
- Assert that the payload has `source:"menu"`, `type:"bug"`, and `context.route` without a query string.
- Assert that the success state shows.

## @critical Admin can triage

- The e2e user is in `ADMIN_USER_IDS`. This is one real-API flow.
- Seed a feedback item through `POST /feedback` with a unique message.
- Open `/admin/feedback` and filter to the item.
- Change its status to `triaged` and save an admin note.
- Reload and assert that both persisted.

## @critical Non-admin is blocked

- Stub `**/feedback/admin/access` with `{isAdmin:false}`.
- Visiting `/admin/feedback` redirects home and shows no admin UI.
