# E2E fixtures (`apps/web/e2e/fixtures`)

Shared Playwright extensions for QA specs under `e2e/qa/`.

## `qa.ts`

Import `{ test, expect }` from here instead of `@playwright/test` when writing `e2e/qa/*.spec.ts`.

Provides:

- **Authenticated page** — uses the `chromium` project storage state from `auth.setup.ts` (configured in `playwright.config.ts`).
- **Console-error guard** — auto fixture fails the test if the page logs any `console.error` during the test.
- **`snap(name)`** — full-page screenshot attached to the report (and written under the test output dir).
- **`postSignedWebhook(payload)`** — signs a JSON body with Standard Webhooks headers and `POST`s to `{API_URL}/webhooks/payments` via Playwright `request`.

### `postSignedWebhook`

- Reads **`DODO_PAYMENTS_WEBHOOK_KEY`** from `.env.e2e.local` (via `requireEnv`). If unset, throws immediately with a clear message — never sends an unsigned request.
- Signing implementation: `e2e/support/signWebhook.ts` (algorithm documented there; matches SPEC Q6 / PLAN T0.3-item4).
- **Never log** the webhook key or signature values.

End-to-end proof that the API accepts valid signatures and rejects tampered bodies is covered by `e2e/qa/billing-purchase.spec.ts` (Phase 5).

## `generation.ts`

Legacy stub for generation SSE/API used by older specs under `e2e/*.spec.ts`. QA billing specs should use `qa.ts` and real API calls unless explicitly stubbing generation.
