# Spec: Replace Razorpay with Dodo Payments (test mode)

Status: draft for review. Spec only; no feature code. Doc facts are from docs.dodopayments.com (fetched 2026-10-13). Anything not confirmed there is in "Open questions".

## 1. Objective

Fully replace Razorpay with Dodo Payments (test mode) for the four one-time INR credit packs. Close the security holes in the current flow: unverified webhook, client-trusted amount and credits, client-side credit bump, unauthenticated payment routes.

Users:
- Signed-in buyers on the Pricing page and the Buy Credits dialog.
- The maintainer, who may swap providers later.

User stories:
1. As a buyer I choose a pack, pay in the Dodo overlay, and see my credits and a payment record appear without reloading.
2. As a buyer I see only my own payment history.
3. As the maintainer I can swap providers by writing one adapter and changing one env value.
4. As the maintainer I know credits can only be granted by a verified, deduplicated provider webhook.

Out of scope: subscriptions (delete the dead "monthly" pack), USD or price changes, multi-provider runtime or registry, live-mode cutover, refund/dispute UI, automated e2e against the real Dodo overlay.

## 2. Decisions (fixed)

- Overlay checkout. The API creates a Checkout Session with the Node SDK `dodopayments`; the web opens the returned `checkout_url` with the Dodo checkout SDK.
- Credits are granted only by the signature-verified, idempotent `payment.succeeded` webhook. `payment.failed` records a failed payment. The webhook is the source of truth; the Get Checkout Session endpoint is used only for UI status polling.
- Pack, credits and price are resolved server-side from the shared catalog by pack id. `userId` is attached as checkout metadata by the server from the Clerk session.
- One `PaymentProvider` port. All Dodo code lives in `apps/api/src/payments/dodo/`. Nothing outside adapters imports a provider SDK. No registry.
- Catalog single source of truth in `packages/shared`. Dodo product IDs are env-mapped per pack.
- Legacy Razorpay payment rows stay readable via a `provider` field (default `'razorpay'`).
- Build agents never commit; the `/build-phases` orchestrator commits each independently verified phase (one commit per phase). Test mode only.

## 3. Assumptions (correct me if wrong)

1. Dodo products are created with INR as base currency, or the account supports an INR price on the product. This is unverified. See Open questions 1 and 2.
2. The API is deployed at a public HTTPS URL for webhooks (or a tunnel in dev).
3. The Mongo `users.payments` embedded array remains the payment store. No new collection is introduced, to keep the change small. Idempotency is enforced inside the same atomic update (see section 6).
4. Dodo credits per pack are granted once per Dodo `payment_id`.

## 4. Tech stack and commands

Stack: Bun monorepo; API Express 4, Mongoose 8, Clerk `@clerk/clerk-sdk-node`, pino, vitest; web Vue 3, Pinia, vite-plus, vitest, Playwright; shared types in `packages/shared`.

New dependencies (ask-first, listed explicitly):
- API: `dodopayments`, `standardwebhooks` (the docs show `client.webhooks.unwrap` and also list `standardwebhooks` for the webhook example; pick one, see Open question 6).
- Web: Dodo checkout SDK. The docs' package name is `dodopayments-checkout` (import `{ DodoPayments }`). The brief said `@dodopayments/checkout`; use the name the docs show unless the registry says otherwise.
- Remove: `razorpay` (API package.json, bun.lock) and any web Razorpay typings.

Commands (from repo root):
- Test: `bun run test` (= `vp test run`)
- Lint/check: `bun run verify`
- Not used here: `bun run check:model-docs` checks Replicate AI model schemas, not payments
- E2E: Playwright in `apps/web/e2e` (use the existing project command; confirm in package.json during build)
- Dev servers are always running; never start them.

## 5. Architecture

### 5.1 Shared catalog: `packages/shared/src/models/creditPacks.ts` (new)

```ts
export const CREDIT_PACK_CURRENCY = 'INR' as const;
export interface CreditPack {
  id: CreditPackId;          // 'pack_200' etc., stable, replaces id1..id4
  credits: number;
  priceMinor: number;        // paise: 13000, 29000, 50000, 90000
  currency: typeof CREDIT_PACK_CURRENCY;
  savingsPercent: number;    // 0, 10, 20, 30
  description: string;
}
export const CREDIT_PACKS: readonly CreditPack[];
export const getCreditPack(id: string): CreditPack | undefined;
```

Both `RAZORPAY_PRODUCTS` copies, the `RazorpayProduct` type (defined in `packages/shared/src/types/domain.ts`, re-exported by the shared, API and web `types/index.ts`), the web `RazorpaySubscription`/`RazorpayOrder` types, and the dead monthly pack are deleted. `usePricingCatalog.ts` consumes `CREDIT_PACKS`. Keep existing savings labels (10/20/30%).

### 5.2 API `apps/api/src/payments/` (new module)

```
payments/
  types.ts            PaymentProvider port, CheckoutRequest, CheckoutResult, NormalizedPaymentEvent
  constants.ts        PAYMENT_PROVIDER (names), PAYMENT_STATUS, NORMALIZED_EVENT_TYPE, header names
  errors.ts           typed errors: InvalidSignatureError, UnknownPackError, ProviderApiError
  service.ts          createCheckout(userId, packId), applyEvent(event) (provider-agnostic)
  providerFactory.ts  reads env PAYMENT_PROVIDER, returns the adapter (single switch, no registry)
  router.ts           authenticated routes
  webhookRouter.ts    raw-body webhook route(s)
  dodo/
    client.ts         DodoPayments instance (test_mode/live_mode from env)
    adapter.ts        implements PaymentProvider
    productMap.ts     packId -> DODO_PRODUCT_ID_* env
    eventMapper.ts    Dodo event -> NormalizedPaymentEvent
    constants.ts      Dodo event type strings ('payment.succeeded', 'payment.failed')
```

Port:

```ts
interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(req: { userId: string; pack: CreditPack; email?: string; returnUrl: string }): Promise<{ checkoutUrl: string; sessionId: string }>;
  verifyAndParseWebhook(rawBody: Buffer, headers: IncomingHttpHeaders): NormalizedPaymentEvent | null; // throws InvalidSignatureError; null = ignored event type
  getSessionStatus(sessionId: string): Promise<{ paymentId: string | null; status: PaymentStatus }>;
  // refund-ready (types only, not implemented): refundPayment?(paymentId: string, amountMinor?: number)
}
interface NormalizedPaymentEvent {
  providerEventId: string;   // webhook-id header
  type: 'payment.succeeded' | 'payment.failed';  // named constants
  providerPaymentId: string;
  userId: string | null;     // from metadata
  packId: string | null;     // from metadata (used only as a cross-check, see 6)
  amountMinor: number; currency: string;
  occurredAt: Date;
}
```

Domain code (`service.ts`, routers) imports only `types.ts`. A lint/grep check in tests asserts no import of `dodopayments` outside `payments/dodo/`.

### 5.3 Endpoints (all under Clerk auth except the webhook)

| Method and path | Auth | Request | Response |
|---|---|---|---|
| `POST /payments/checkout` | Clerk | `{ packId: string }` | `201 { checkoutUrl, sessionId }`. 400 unknown pack. 401 no session. 502 provider error (no secrets leaked). |
| `GET /payments` | Clerk | none | `200 { payments: PaymentRecord[] }` for the caller only, newest first. Replaces `POST /payments` with body id. |
| `GET /payments/checkout/:sessionId/status` | Clerk | none | `200 { status: 'pending' \| 'succeeded' \| 'failed', credits?: number }`. Verifies the session belongs to the caller (see 6). Reads the caller's DB record for the session first (webhook-written status wins); falls back to the provider's session status only while pending. |
| `POST /webhooks/payments` (provider-neutral path; confirm Dodo endpoint URL accordingly) | signature only | raw body + `webhook-id`, `webhook-timestamp`, `webhook-signature` | `200 {received:true}` on success or duplicate; `400/401` invalid signature; `500` on transient DB failure so Dodo retries. |

Removed: `POST /payments/order/create`, `POST /payments/verify-payment`, `GET /payments/:id`, `POST /payments`, `/webhooks/razorpay`. `/webhooks/clerk` (svix, express.raw) is untouched.

Auth fix: in `routes/index.ts` register `ClerkExpressRequireAuth` before `paymentsRoute` (mount-order bug). `userId` is always `req.auth.userId`; never read from body, query, or params.

Session ownership: `createCheckout` stores `{ sessionId, userId, packId }` with a pending record (see 5.4) so the status endpoint can authorize the caller without trusting the client.

### 5.4 Data model

`apps/api/src/models/payment.ts` changes:
- Add `provider: enum ['razorpay','dodo'], default 'razorpay'` (legacy rows read as razorpay).
- Add `providerPaymentId` (Dodo `payment_id`; legacy rows keep `transactionId`), `providerSessionId` (optional), `packId` (optional), `credits` (optional; legacy rows may lack it), `currency` (default 'INR').
- Generalize `paymentMethod`: replace the credit_card|paypal|stripe enum with a free-form normalized string or extend the enum with `'card'`, `'upi'`, `'other'` plus legacy values. Do not break reads of old rows. Dodo method mapping is an Open question.
- `status` keeps pending|completed|failed; provider status mapping lives in the adapter (`succeeded` -> completed, `failed` -> failed).
- Unique, sparse index guarantee: see idempotency below.

Mongoose migration: none required. Missing `provider` reads as default; add a note in the checklist, not a backfill script (decision: lazy default).

### 5.5 Webhook flow and idempotency

1. Router mounted before `express.json` using `express.raw({ type: 'application/json' })` (as the Clerk webhook does).
2. `adapter.verifyAndParseWebhook(rawBody, headers)` verifies Standard Webhooks signature (secret `DODO_PAYMENTS_WEBHOOK_KEY`; `whsec_` prefix handled by the library) and timestamp tolerance (libraries allow 5 minutes). Invalid or missing headers -> 401, no DB access.
3. Unhandled event types -> 200 (ack, ignore).
4. `service.applyEvent(event)`:
   - Resolve `userId` from event metadata. If missing or the user does not exist -> log with context, return 200 (acking avoids infinite retries; this is a data problem, flagged for manual review).
   - Resolve credits from the server catalog. Primary key: `packId` from metadata -> catalog. Cross-check `amountMinor` and `currency` equal the catalog price; on mismatch do NOT grant credits, record the payment as failed with a reason, log at error level.
   - Idempotent grant in one atomic Mongo update:
     `User.updateOne({ clerkId: userId, 'payments.providerPaymentId': { $ne: paymentId } }, { $push: { payments: record }, $inc: { credits: pack.credits } })`.
     `modifiedCount === 0` with the user existing means duplicate -> 200 no-op. This makes grant and record a single atomic write; no separate dedupe collection is needed. `webhook-id` is logged but dedupe is keyed on the payment id so that a Dashboard replay with a new webhook-id also cannot double-credit.
   - `payment.failed`: upsert a failed record with the same `$ne` guard; no credits change. A later `payment.succeeded` for the same payment id after a failed record must still grant (guard uses status: only block when an existing record for that id has status `completed`). Spec the exact query during build and test it.
5. Respond 2xx only after the DB write commits. DB error -> 500 (Dodo retries up to 8 times with backoff: 0s, 5s, 5m, 30m, 2h, 5h, 10h, 10h).

### 5.6 Web

```
apps/web/src/payments/
  checkoutClient.ts     provider-agnostic: initCheckout(), openCheckout(checkoutUrl, handlers)
  dodoOverlay.ts        only file importing the Dodo checkout SDK
  usePurchase.ts        composable: start(packId) -> api.checkout -> openCheckout -> poll status -> refetch user credits
```

- `Initialize({ mode: 'test', displayType: 'overlay', onEvent })` once at app load (docs warn against per-checkout init). Mode comes from a Vite env var.
- `utils/payment.ts` (Razorpay loader and `successHandler`) is deleted. No code path calls `userStore.setCredits` with a computed value after payment; the UI refetches `/users/me` (or the existing user endpoint) after status becomes `succeeded`.
- Overlay-to-webhook gap: on overlay close or a success event, poll `GET /payments/checkout/:sessionId/status` every `PAYMENT_POLL_INTERVAL_MS` up to `PAYMENT_POLL_TIMEOUT_MS` (named constants, suggested 2s and 60s). On `succeeded` refetch credits and payments, show success toast. On `failed` show error. On timeout show "payment processing; credits will appear shortly" and keep the dialog state recoverable (Profile -> Payments shows the record once the webhook lands).
- Update `components/Dialogs/BuyMoreCreditsDialog.vue`, `components/Pricing/PricingPacks.vue`, `components/Profile/Payments.vue` (render `provider`-agnostic record; legacy rows display normally) and their tests. `Payments.vue` reads payments from the Pinia user store (filled by the user fetch), so it needs no endpoint switch; the web never called `POST /payments`.

### 5.7 Environment variables

API (`apps/api/src/config/env.ts` + `env.test.ts`, `.env.example`, docker-compose, infra env):
- `PAYMENT_PROVIDER=dodo`
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_ENVIRONMENT=test_mode` (SDK takes `test_mode` / `live_mode`; confirm exact live value)
- `DODO_PAYMENTS_WEBHOOK_KEY`
- `DODO_PRODUCT_ID_PACK_200`, `_450`, `_960`, `_2000`
- `PAYMENT_RETURN_URL` (or derive from existing web origin config)
- Remove `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

Web: `VITE_DODO_CHECKOUT_MODE=test`. Remove any `VITE_RAZORPAY_*`.

Env validation fails fast at boot if `PAYMENT_PROVIDER=dodo` and any Dodo var is missing. `.env.example` has placeholders only; real values never committed.

## 6. Security requirements

1. Webhook: reject unless Standard Webhooks signature and timestamp validate against the raw body. Test with real signing.
2. Credits and amount come only from the server catalog; client sends only `packId`. Webhook amount and currency must equal the catalog price or credits are withheld.
3. `userId` only from Clerk session (checkout creation) and from server-written metadata (webhook). Metadata is trusted only because the signature is verified.
4. All `/payments/*` routes require Clerk auth, registered before the routers. `GET /payments` returns only the caller's rows. Status endpoint checks session ownership.
5. Idempotent on Dodo payment id (atomic), with `webhook-id` logged.
6. Webhook secret, API key never reach the client or logs. Error responses to clients are generic. pino logs include `webhookId`, `paymentId`, `userId`, never headers' signature or secrets.
7. Rate limiting `POST /payments/checkout` is out of scope (no limiter exists in the repo); logged as a follow-up (Open question 12).
8. Single-use checkout URLs: create a fresh session per attempt (Dodo docs: `checkout_url` is not reusable; sessions expire after 24h).
9. Webhook body size limit set on `express.raw`.

## 7. Testing strategy

Vitest (API and web); Playwright for e2e. Follow existing colocated `*.test.ts` convention.

API unit/integration (supertest where routes involved):
- Adapter: `verifyAndParseWebhook` with real Standard Webhooks signing (generate signature in the test using the `standardwebhooks` `Webhook` class or HMAC per the docs algorithm `{id}.{timestamp}.{body}`). Cases: valid; tampered body; wrong secret; missing headers; stale timestamp; unknown event type.
- Service: grants correct credits per pack; duplicate payment id grants once (call twice and also concurrently with `Promise.all`); replay with a new `webhook-id` still once; amount or currency mismatch withholds credits; unknown pack id; missing metadata; `payment.failed` records without credits; failed-then-succeeded still grants.
- Routes: unauthenticated -> 401 for all payment routes; tampered `packId` -> 400; extra body fields like `amount` or `credits` are ignored (assert the provider is called with catalog values); `GET /payments` returns only own rows; status endpoint 403/404 for another user's session.
- Legacy rows: a user document with a Razorpay-shaped payment (no `provider`) serializes with `provider: 'razorpay'`.
- Env: `env.test.ts` covers missing Dodo vars and the absence of Razorpay vars.
- Architecture guard test: no `dodopayments` import outside `payments/dodo/`.
- Dodo SDK is mocked at the `client.ts` boundary only.

Web unit:
- `checkoutClient`/`usePurchase`: opens overlay with returned URL; polls then refetches credits; never calls local credit increment; timeout path; error path. Dodo SDK mocked in `dodoOverlay.ts`.
- Component tests updated for the three components; pricing catalog test uses shared `CREDIT_PACKS`.

E2E (Playwright, `apps/web/e2e`): stub the overlay module (route/init script replaces the checkout SDK open call), create checkout through the real API, POST a locally signed webhook (test-only signing key from env) to the API, assert credits increase by the pack amount once, a second identical POST changes nothing, and Profile -> Payments shows the row. Update `agent_docs/e2e-scenarios/profile-billing.feature.md`.

E2E mocking rules (the browser and the Playwright test process never contact Dodo; there is no CI e2e job, and no e2e run may hit Dodo from CI if one is added):
- Stub the checkout SDK with `page.addInitScript`, replacing `window.DodoPayments.Checkout.open` with a recorder the test reads back. If T0.3 shows the SDK is module-only (no `window` global), `dodoOverlay.ts` exposes the equivalent test seam on `window`.
- Block any real Dodo network from the page with `page.route('**/checkouts/**')` (abort or fulfil).
- Create the checkout through the real API (the API's own server-side Dodo test-mode call is the one allowed provider call), then sign the webhook in Node: Standard Webhooks HMAC-SHA256 of `{id}.{timestamp}.{body}` with the test webhook key, POSTed to `/webhooks/payments` via Playwright `request`.
- Fast-forward the 60s poll timeout with `page.clock`, never real waits.

Coverage policy: every logic file under a `Unit:` task is ≥80% lines/branches/functions/statements (required) with a >95% target, measured with a scoped `--coverage.include` run; the API and web vitest configs also enforce 90% global thresholds. Webhook path: 100% of branches (`webhookRouter.ts`, `applyEvent`).

Section 12 criteria mapped to e2e scenario tags (specs `apps/web/e2e/qa/billing-purchase.spec.ts`, `billing-history.spec.ts`):

| Criterion | E2E scenarios | Non-e2e evidence |
|---|---|---|
| 1 Plugin and MCPs | none (not browser-observable) | pre-flight checks |
| 2 Products and env | none | product creation record, env placeholder grep |
| 3 Purchase flow | @critical 4 packs listed; @critical signed success grants exactly N; @medium overlay closed then timeout shows processing; @high Dodo and legacy rows render; @medium persists after reload; @medium deep link to Profile > Payments; @medium empty state | manual test-mode run |
| 4 Rejections | @critical checkout sends pack id only; @critical duplicate webhook is a no-op; @high invalid signature gets 401, credits unchanged; @high failed payment shows an error | API unit: tampered price, missing/stale signature |
| 5 Suites pass | all of the above, `--repeat-each=3` | Vitest suites and coverage gates; manual run log |
| 6 Auth | none (API-level) | API 401 tests on every payments route |
| 7 Razorpay removed | none | repo-wide grep |

Manual (documented in `agent_docs/CHECKLIST_manual_steps.md`): real test-mode purchase with the Dodo test card (card number from Dodo docs test-mode page; not retrieved here) and a webhook tunnel (Dodo CLI forwarding is documented, or an ngrok/cloudflared tunnel).

Coverage: new module lines/branches at the repo's existing threshold and the per-file policy above; the webhook path should be covered at 100% of branches.

## 8. Dodo Agent Plugin and product setup (build prerequisites)

1. Install at project scope: `claude plugins marketplace add dodopayments/dodo-agent-plugin` then `claude plugins install dodopayments@dodopayments` with project scope so it writes to the project `.claude/settings.json` (verify the scope flag during build). Confirm `dodopayments-api` (OAuth) and `dodo-knowledge` MCPs and the skills load.
2. Only after the INR gate passes (Open question 1; if INR is not a supported base currency, STOP: the gate task FAILs with the options for the user to decide before re-running, no automatic fallback), via the Dodo API MCP create four test-mode one-time products (INR) matching the catalog; record IDs in `apps/api/.env` and placeholders in `.env.example`.
3. Create the webhook endpoint in the Dodo test-mode dashboard (or via MCP), subscribe to `payment.succeeded` and `payment.failed`, copy the secret into `DODO_PAYMENTS_WEBHOOK_KEY`.

## 9. Migration and removal checklist

- [ ] `packages/shared`: add `creditPacks.ts`; add provider-agnostic payment types to `types/domain.ts`; delete `RazorpayProduct` from `types/domain.ts` and `types/index.ts` once the API and web re-exports are gone (TASKS T6.3.1).
- [ ] API: delete Razorpay routes, `new Razorpay`, `/webhooks/razorpay`, `RAZORPAY_PRODUCTS`, `RazorpayProduct`, old payments tests; add `payments/` module; fix Clerk mount order; update `app.ts` webhook mounting; update `models/payment.ts`.
- [ ] API deps: remove `razorpay`; add `dodopayments` (+ `standardwebhooks` if used); refresh `bun.lock`.
- [ ] Web: delete `utils/payment.ts` and its test, the duplicate `RAZORPAY_PRODUCTS` and types; add `payments/`; update 3 components and tests, `usePricingCatalog.ts`.
- [ ] Env: `apps/api/.env*`, `apps/web/.env*`, `infra/.env*`, `apps/api/docker-compose.yml`, `config/env.ts` and `env.test.ts`.
- [ ] Copy and docs: `pricingFAQ.json` (payment method wording), `public/pricing.md`, `public/llms.txt`, `README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, `agent_docs/CHECKLIST_manual_steps.md`, `agent_docs/e2e-scenarios/profile-billing.feature.md`. Mention merchant of record and Dodo accurately; remove UPI/Razorpay claims unless Dodo supports them (see Open question 8).
- [ ] Verification: no Razorpay import, type, constant, route, env var or dependency remains. `git grep -i razorpay` hits only legacy-labelled items: the `'razorpay'` provider literal for legacy rows (API payment model and its test, `payments/constants.ts`, shared `PaymentProviderName`), the `LEGACY_RAZORPAY_ENV_PREFIX` absence marker in `env.test.ts`, legacy-row test fixtures/titles, legacy-labelled manual steps, and historical `agent_docs/` records (exact allowlist in TASKS T6.6).

## 10. Boundaries

- Always: write the failing test first for webhook/idempotency logic; use named constants for event names, statuses, provider names, header names; keep functions under about 30 lines; run `bun run verify` and `bun run test` before declaring done.
- Ask first (during `/build-phases` agents cannot prompt, so they make no change and FAIL with the request): new dependencies beyond those listed, schema changes beyond section 5.4, adding a new Mongo collection, rate-limiter changes, CI changes.
- Never: commit from a build agent (only the orchestrator commits verified phases), run the server, log or return secrets, grant credits from a client-sent value, import a provider SDK outside an adapter, delete or overwrite DB/DNS/payment resources without explicit confirmation.

## 11. Risks

| Risk | Mitigation |
|---|---|
| INR pricing may not be supported as a product base currency, or INR may only come via adaptive currency (price drift from catalog) | Verify first (Open Q1/Q2). If unsupported, STOP (gate FAILs with the options for the user); no automatic fallback. |
| Webhook arrives before the pending record exists, or never arrives | Idempotent grant does not depend on a pending record; polling timeout UX; Dodo retries 8 times. |
| Missing metadata on the webhook payload | Open Q3. Fallback: look up the session record by `providerSessionId` or payment id. |
| Lost credits on transient DB failure | Return 500 so Dodo retries; atomic update. |
| Duplicate webhooks racing | Atomic conditional update; concurrent test. |
| Express mount order regressions | Test asserts unauthenticated 401 on every payments route and raw body at the webhook. |
| Embedded `payments` array growth | Accepted for now; note for later extraction to a collection. |

## 12. Success criteria (testable)

1. Dodo plugin installed at project scope; both MCPs and skills available.
2. Four test-mode products exist; IDs in API env and `.env.example` placeholders.
3. Test-card purchase: overlay opens, webhook credits the correct amount exactly once, Profile -> Payments shows the record, UI refetches (never locally adds) credits, poll handles the webhook gap.
4. Rejected: tampered pack or price, invalid or missing signature, replayed or duplicate webhook.
5. Vitest API and web suites pass including real-signature tests; Playwright e2e with stubbed overlay and signed webhook passes; manual test-mode run documented.
6. All payment routes need Clerk auth; `userId` only from session; `GET /payments` replaces `POST /payments`.
7. `razorpay` absent from code, deps, `bun.lock`, env, copy, and docs, other than the legacy-labelled items allowlisted in section 9 (legacy provider literal, env absence marker, legacy-row test fixtures, legacy-labelled manual steps).

## 13. Open questions / verify during build

14 questions. TASKS T0.3 answers Q1-11 in place, each with an indented line starting `Answer (T0.3):` carrying a source URL or "unverifiable" plus the proposed handling (Q11 is answered from the T0.1 check). Q12-14 keep their recorded defaults.

1. Can a Dodo product have INR as its base price currency, or must it be USD/EUR/GBP with INR via Adaptive Currency (live FX, price drift) or Localized Pricing (fixed per-currency price)? Docs only confirm `billing_currency` accepts `INR` and that PWYW needs USD/GBP/EUR base.
   Answer (T0.3): YES, INR can be the product base currency (any currency Dodo can charge). Source: https://docs.dodopayments.com/features/adaptive-currency ; https://docs.dodopayments.com/miscellaneous/faq. Create products with INR base; confirm in dashboard at creation.
2. If Adaptive Currency is used, is the INR amount guaranteed to equal the catalog (130/290/500/900)? Determines whether the webhook amount cross-check can be strict.
   Answer (T0.3): With an INR base, INR buyers are charged the catalog amount directly (INR→INR, no FX), so the strict webhook cross-check is valid. Non-INR buyers would see converted prices via Adaptive Currency, so force `billing_currency: 'INR'`. Source: https://docs.dodopayments.com/features/adaptive-currency.
3. Exact `payment.succeeded` payload shape: is checkout-session `metadata` echoed on `data.metadata`? Field names for `payment_id`, `total_amount`, `currency`, `checkout_session_id`, payment method. The docs sample shows only `payload_type`, `payment_id`, `total_amount`.
   Answer (T0.3): `data` is the payment object: `payment_id`, `total_amount` (minor units), `currency`, `status`, `payment_method`, `checkout_session_id` (null for renewals), and `metadata` at `data.metadata.<key>`; the full succeeded sample is not shown, so verify on the first test webhook. Source: https://docs.dodopayments.com/developer-resources/handle-payment-failures ; https://docs.dodopayments.com/integrations/datafast.
4. Exact Node SDK checkout call: `client.checkoutSessions.create({ product_cart, metadata, return_url, ... })` is documented; confirm `metadata` is a supported create param and the response field names (`checkout_url`, `session_id`).
   Answer (T0.3): `metadata` is a supported `checkoutSessions.create` param; response fields are `session_id` and `checkout_url` (plus optional `payment_id`, `client_secret`, `publishable_key`). Source: https://docs.dodopayments.com/api-reference/checkout-sessions/create.
5. Get Checkout Session response: docs say `payment_id` and `payment_status` (null until submitted) via `GET /checkouts/{id}`; confirm the SDK method name (likely `checkoutSessions.retrieve`).
   Answer (T0.3): SDK method is `client.checkoutSessions.retrieve(id)` (GET /checkouts/{id}), returning `payment_id` (null until details submitted) and `payment_status`. Source: https://docs.dodopayments.com/api-reference/checkout-sessions/get-checkouts.
6. Verification path: `client.webhooks.unwrap(body, {headers})` (needs `webhookKey` in client constructor) versus the `standardwebhooks` package. Choose one; `unwrap` is preferred if it throws on bad signature/timestamp. Confirm timestamp tolerance behavior and header casing in Express (lowercase).
   Answer (T0.3): Choose `client.webhooks.unwrap(rawBody, {headers})` with `webhookKey`; it verifies signature and timestamp (5 min tolerance per Standard Webhooks); use `express.raw` on the route; headers `webhook-id`, `webhook-signature`, `webhook-timestamp`. Source: https://docs.dodopayments.com/developer-resources/webhooks.
7. Package name and API of the checkout SDK: docs show `dodopayments-checkout` with `DodoPayments.Initialize({ mode, displayType, onEvent })` and `DodoPayments.Checkout.open({ checkoutUrl })`. Confirm the brief's `@dodopayments/checkout` is not a different package. Confirm event names (docs list `checkout.opened`, `checkout.closed`, `checkout.error`; whether a payment-success event is emitted to `onEvent`, since the docs say completion redirects to `return_url`). Decide how `return_url` interacts with the overlay and the SPA route (likely a route that triggers polling).
   Answer (T0.3): Package is `dodopayments-checkout` (`@dodopayments/checkout` undocumented); `DodoPayments.Initialize({mode,displayType,onEvent})`, `Checkout.open({checkoutUrl})`; module-only on npm (CDN global is `DodoPaymentsCheckout.DodoPayments`), so `dodoOverlay.ts` must expose a `window` test seam for the e2e stub; no plain success event (use `checkout.status` with `manualRedirect` plus webhook confirmation). Source: https://docs.dodopayments.com/developer-resources/overlay-checkout.
8. Payment method values Dodo reports (card, UPI, wallets) for `paymentMethod` mapping; whether UPI is available for INR in test mode (affects `pricingFAQ.json` copy).
   Answer (T0.3): Sample `payment_method` value is "card"; the full value list is unverifiable, so treat it as an opaque string and map loosely (card/upi*). UPI works for INR in test mode (`success@upi`, needs billing country IN + currency INR; offered as `upi_intent`), so FAQ copy may mention UPI. Source: https://docs.dodopayments.com/features/payment-methods/india.
9. Test card numbers and test-mode behaviors (not retrieved here); webhook tunnel approach (Dodo CLI forwarding exists per docs).
   Answer (T0.3): Indian test cards: Visa 4576238912771450 (success) / 4706131211212123 (declined), Mastercard 5409162669381034 / 5105105105105100, exp 06/32 CVV 123; UPI `success@upi`/`failure@upi`. Webhook tunnel: `dodo wh listen <url>` (CLI). Source: https://docs.dodopayments.com/features/payment-methods/india ; https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode.
10. SDK `environment` values: docs show `test_mode`; confirm the live value string.
   Answer (T0.3): SDK `environment` values are `test_mode` and `live_mode` (default `live_mode`). Source: https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode.
11. Dodo Agent Plugin: exact project-scope flag for `claude plugins install`, and whether the OAuth step can be completed non-interactively.
   Answer (T0.3): Plugin installed with `claude plugins install dodopayments@dodopayments --scope project`; OAuth for `dodopayments-api` is interactive (user-completed), not non-interactive. Source: T0.1-plugin evidence in PLAN.
12. Rate limiter: none exists in the repo. Default: out of scope; log as follow-up.
13. The same Clerk mount-order bug on the users/explore/credits/image/collections routers (`routes/index.ts`). Default: out of scope; log as follow-up (only payments is fixed here).
14. Webhook path: whether to keep the provider-specific URL (`/webhooks/dodo`) for operational clarity versus the neutral `/webhooks/payments`. Default: `/webhooks/payments`.
