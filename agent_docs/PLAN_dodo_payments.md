# Implementation Plan: Replace Razorpay with Dodo Payments (test mode)

Source spec: `agent_docs/SPEC_dodo_payments.md`. Phase numbers here differ from `TASKS_dodo_payments.md`, which is authoritative for execution order and IDs (Plan 0 = Tasks 0, 0b = 1, 1 = 2, 2 = 3, 3 = 4, 4 = 5, 5 = 6, 6 = 7; the Plan 6 e2e spec became TASKS Phase 5 `E2E:` tasks T5.8/T5.9, so TASKS Phase 7 starts at T7.2 and there is no T7.1). Planning only. Rules for every phase: never commit yourself (the /build-phases orchestrator commits each verified phase, one commit per phase), never start the dev server (always running), test mode only, never prompt the user (subagents cannot; anything outside the listed files or pre-approved decisions FAILs with unblock steps).

Execution model (see TASKS header): a one-time manual pre-flight (plugin install, session restart, `dodopayments-api` OAuth, test API key, public webhook URL) happens before `/build-phases`; Phase 0 tasks only check it and FAIL with instructions. A `Setup: test harness` pair (TASKS T2.0/T2.0.1, e2e root `apps/web`) creates the seeded QA harness before any e2e task. Implementation tasks create no new spec files except the test-first money-path tasks T4.1-T4.3 (webhook signature, idempotent credit grant, webhook router); every other new spec belongs to a dedicated `Unit:` task. Dedicated `Unit:` tasks (coverage gate, ≥80% per file required, >95% target) and `E2E:` tasks (one per user flow, `--repeat-each=3`) own coverage, ordered implementation -> Unit -> E2E -> checkpoint.

## Overview

Replace Razorpay with Dodo Payments overlay checkout. API creates a Checkout Session behind a `PaymentProvider` port (Dodo adapter in `apps/api/src/payments/dodo/`), credits are granted only by the signature-verified, idempotent `payment.succeeded` webhook, and the web opens the returned checkout URL in the Dodo overlay then polls session status and refetches the user. Catalog moves to `packages/shared`.

## Repo verification (spec paths vs reality)

All 17 paths named in the brief exist. `packages/shared/src` has `models/ schemas/ types/ index.ts` (index re-exports all three). `apps/web/e2e` is flat `*.spec.ts` plus `fixtures/`, `support/`, `auth.setup.ts`, `global.setup.ts`; there is NO billing spec yet. Corrections and findings the plan depends on:

| Spec said                                                             | Reality                                                                                                                                                                                                                                                                                                                                                                                                | Plan impact                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared catalog at `packages/shared/src/models/creditPacks.ts`         | `models/` exists (credits.ts, index.ts, registry.ts, styles.ts, types.ts).                                                                                                                                                                                                                                                                                                                             | Path valid. Add file and export from `models/index.ts`.                                                                                                                                                                                                                                                                                                                                                                                                  |
| Catalog source                                                        | API `utils/constants.ts` `RAZORPAY_PRODUCTS` has 5 entries: 4 `single` (200/130, 450/290, 960/500, 2000/900 INR) plus id 5 `monthly` 300 credits/100 INR. Web `utils/constants.ts:256` duplicates it.                                                                                                                                                                                                  | New catalog = the 4 singles only. Monthly entry is dropped (user confirmed). Prices are whole rupees; decide minor units (x100) in the catalog and keep one conversion helper.                                                                                                                                                                                                                                                                           |
| `RazorpayProduct` / Razorpay types                                    | `RazorpayProduct` is defined in `packages/shared/src/types/domain.ts:67` and re-exported by `packages/shared/src/types/index.ts:10`, `apps/api/src/types/index.ts` and `apps/web/src/types/index.ts`; the web file also defines `RazorpaySubscription` and `RazorpayOrder`.                                                                                                                            | Removal touches the API and web type files (TASKS T6.2/T6.3), then the two shared files (TASKS T6.3.1, after the re-exports are gone).                                                                                                                                                                                                                                                                                                                   |
| Mount-order bug                                                       | Confirmed: `routes/index.ts:24` `router.use(paymentsRoute, ClerkExpressRequireAuth({}))` puts auth AFTER the router, so payments routes are unauthenticated. Same pattern on lines 19-23 for users/explore/credits/image/collections (out of scope, but flag to the user as a separate finding). Also `routes/payments.ts:25` reads `req.body.id` as userId (any caller can list any user's payments). | Fix is a P0 security item, done in Phase 2 with a failing test first.                                                                                                                                                                                                                                                                                                                                                                                    |
| `POST /payments` replaced by `GET /payments`, `Payments.vue` switches | Web never calls `/payments` list. `Payments.vue` renders `payments` from the Pinia user store (`stores/user.ts` fills from the user fetch; `userData.payments`). Only `/payments/verify-payment` and `/payments/order/create` are called (`utils/payment.ts`).                                                                                                                                         | `GET /payments` is optional API surface. `Payments.vue` needs only field changes (key by `providerPaymentId ?? transactionId`, provider-neutral labels), not an endpoint switch. Keep `GET /payments` (spec) but web wiring is not required.                                                                                                                                                                                                             |
| Webhook mount                                                         | `webhook/index.ts` exports `webhookRouter` (Clerk svix on `express.raw`, plus `/webhooks/razorpay` with `express.json()` at line 76). `app.ts:74` mounts it before `express.json`.                                                                                                                                                                                                                     | Mount the new `payments/webhookRouter` next to it, same position. Delete razorpay handler.                                                                                                                                                                                                                                                                                                                                                               |
| Rate limiter reuse (Open Q12)                                         | No rate-limit code or dependency in `apps/api/src` or `package.json`.                                                                                                                                                                                                                                                                                                                                  | Out of scope (spec 6.7): no limiter is added and the user is not asked during build; logged as a follow-up.                                                                                                                                                                                                                                                                                                                                              |
| `models/payment.ts`                                                   | `PaymentSchema` (embedded in `User.payments`) and `PaymentModel` (separate "Payment" model, used by `routes/payments.ts`). `paymentMethod` is a required enum `credit_card                                                                                                                                                                                                                             | paypal                                                                                                                                                                                                                                                                                                                                                                                                                                                   | stripe`. | Idempotent write targets the embedded array on `User` (spec). Keep `PaymentModel` as a legacy model: the "Payment" collection holds historical Razorpay payments and `payment.test.ts` imports it. Razorpay removal (TASKS T6.1) deletes its route/webhook importers but not the model. |
| Env files                                                             | API: `.env`, `.env.example`, `.env.production`, `.env.staging`, `docker-compose.yml:26-27`, `config/env.ts:56-57`, `env.test.ts`. Web: `.env.example` (`VITE_RAZORPAY_KEY_ID`, `VITE_RAZORPAY_PLAN_ID`), `.env.local/.staging/.production`, `.env.e2e.example`. Infra: `infra/.env.example`, `infra/.env.prod`, `infra/.env.staging`.                                                                  | The build edits only tracked env files (`.env.example` files, `docker-compose.yml`, `config/env.ts`) plus, in Phase 1 only, the gitignored dev files `apps/api/.env` (TASKS T1.2 writes the webhook key, T1.3 the product ids) and `apps/web/.env.e2e.local` (T1.3) (test-mode values, never printed, never staged). Prod/staging and other untracked env files are never edited by the build; their edits are listed for the user (TASKS T6.4.1, T6.6). |
| Docs with Razorpay                                                    | `README.md`, `docs/{PRD,ARCHITECTURE,API_REFERENCE}.md`, `web/public/{pricing.md,llms.txt}`, `web/src/utils/pricingFAQ.json`, `agent_docs/e2e-scenarios/profile-billing.feature.md`; `apps/web/coverage/**` is generated (ignore, do not edit). `agent_docs/CHECKLIST_manual_steps.md` exists.                                                                                                         | Matches spec 9. Exclude `coverage/`, `dist/` from the final grep.                                                                                                                                                                                                                                                                                                                                                                                        |
| Test commands                                                         | Root: `bun run test` (`vp test run`), `bun run verify` (`vp lint` + `vp check`). API: `vitest run`. Web: `bun run test:e2e` (`playwright test`) in `apps/web`. `bun run check:model-docs` fetches Replicate AI model schemas, unrelated to payments.                                                                                                                                                   | Use these in checkpoints; never use `check:model-docs` as payments evidence.                                                                                                                                                                                                                                                                                                                                                                             |
| Project plugin config                                                 | `.claude/settings.json` exists, currently `enabledPlugins: { "cloudflare@cloudflare": true }`; also `.claude/settings.local.json`. Both are gitignored (`.gitignore:27-28`).                                                                                                                                                                                                                           | Project-scope install writes `dodopayments@dodopayments` into this file; it is a local-only change, never committed. Verify it did not land in user scope.                                                                                                                                                                                                                                                                                               |

## Architecture decisions

- Port and adapter, one `providerFactory.ts` switch, no registry. Only `payments/dodo/*` imports `dodopayments`; only `web/src/payments/dodoOverlay.ts` imports the checkout SDK. An architecture-guard test enforces both.
- Webhook is the only credit-granting path. Idempotency is a single conditional `User.updateOne` keyed on `payments.providerPaymentId` (grant and record atomic). Status polling never grants.
- Server catalog is the only source of pack, credits and price; client sends `packId` only. `userId` comes from Clerk session at creation and from signed metadata in the webhook.
- Legacy rows: `provider` defaults to `'razorpay'`; no backfill.
- Webhook URL: provider-neutral `POST /webhooks/payments` (spec default). Finalize when creating the Dodo endpoint (Task 0.4).

## Dependency graph

```
Phase 0 tooling + GATE (INR, SDK facts)
   |
   +-- Phase 0b products + env ids (only after gate PASS)
   |
Phase 1 shared catalog + types
   |
Phase 2 provider port + Dodo adapter + checkout endpoints + auth fix  (needs 0 facts, 0b ids, 1)
   |
Phase 3 webhook + idempotent grant + model changes                    (needs 2 service/port)
   |
Phase 4 web checkout client + 3 components + status polling           (needs 2 endpoints, 1 catalog; webhook for real end-to-end)
   |
Phase 5 Razorpay removal + docs + env cleanup                         (needs 2-4 replacing every consumer)
   |
Phase 6 e2e + manual test-mode run                                    (needs all)
```

Parallelizable after Phase 2 contract is fixed: web Task 4.x (against mocked API) alongside Phase 3. Docs drafting alongside Phase 4. Everything else is sequential.

---

## Phase 0: Tooling setup and GATE (first slice, no repo feature code)

### Task 0.1: Install Dodo Agent Plugin at project scope

**Description:** Add the marketplace and install the plugin for this project only, not global.
**Steps:** done by the user in the manual pre-flight: `claude plugins marketplace add dodopayments/dodo-agent-plugin`, then `claude plugins install dodopayments@dodopayments --scope project` (flag confirmed via `--help`). TASKS T0.1 only checks the result and FAILs with these commands if missing.
**Acceptance:**

- [ ] `.claude/settings.json` in this repo lists `dodopayments@dodopayments` under `enabledPlugins`; `~/.claude/settings.json` does not.
- [ ] If the flag differs or the marketplace add is user-scoped by default, record exactly what was run in the checkpoint notes.
      **Verification:** `claude plugins list`; `grep dodopayments .claude/settings.json` (the file is gitignored, so `git diff` shows nothing; the change is local-only and never committed).
      **Dependencies:** None. **Files:** `.claude/settings.json`. **Scope:** XS.

### Task 0.2: Confirm MCPs and skills

**Acceptance:**

- [ ] `dodo-knowledge` MCP answers a docs query.
- [ ] `dodopayments-api` MCP is authenticated via OAuth (done by the user in the pre-flight).
- [ ] Dodo skills are loaded. The verifier cannot see the builder's skill or MCP listing, so the builder records them verbatim as `T0.2-*` evidence lines (see "Gate results and build evidence" below).
      If the MCPs are missing or unauthenticated, the task FAILs with the unblock steps (restart the session, complete OAuth, re-run /build-phases).
      **Dependencies:** 0.1. **Scope:** XS.

### Task 0.3: GATE, verify open questions via dodo-knowledge / docs

Resolve each of these with a cited doc snippet, recorded in a short "Gate results" block appended to this plan:

1. **INR as product base currency** (Open Q1/Q2). Also Adaptive Currency vs Localized Pricing semantics.
2. `metadata` as a `checkoutSessions.create` param and the create response field names; whether it is echoed on the `payment.succeeded` payload and the exact path (Q3, Q4).
3. Payload field names: payment id, amount, currency, status, `checkout_session_id`/session id, payment method; payment-method values and UPI for INR in test mode (Q3, Q8).
4. Verification API: `client.webhooks.unwrap` vs `standardwebhooks` (Q6); decide one, so only one dependency is added. Timestamp tolerance, Express lowercase headers.
5. Overlay SDK: package name `dodopayments-checkout` vs `@dodopayments/checkout`, `onEvent` event names, whether a success event exists, `return_url` behavior with an SPA (Q7).
6. Test cards and test-mode behavior (Q9); live environment string (Q10); webhook retry behavior; Get Checkout Session SDK method name and response fields (Q5).
   TASKS T0.3 writes exactly one `Answer (T0.3):` line per SPEC question Q1-11 (Q3 merges items 2 and 3; Q11 comes from the T0.1 evidence).
   **GATE decision:**

- INR supported as base currency -> proceed to Phase 0b.
- INR NOT supported (USD/EUR/GBP only, INR via adaptive or localized pricing) -> the gate task FAILs (blocked) and the build stops. Do NOT create products and do NOT fall back automatically. The failure output lists the options and consequences (price drift vs catalog cross-check, change catalog currency, localized pricing) for the user to decide before re-running.
  **Acceptance:** all six items answered with a source, or explicitly listed as "unverifiable" with a proposed handling.
  **Dependencies:** 0.2. **Scope:** S (research only).

### Checkpoint 0

- [ ] Plugin project-scoped; MCPs reachable; gate PASS recorded (or gate FAIL with options returned).
- [ ] SPEC section 13 (14 questions): Q1-11 answered with a source or "unverifiable" handling (TASKS T0.3 writes them); Q12-14 keep their defaults. No repo source files touched.

## Phase 0b: Products and env (only after gate PASS)

### Task 0.4: Create four test-mode products via Dodo API MCP

**Description:** Create 4 one-time products matching the catalog (200/450/960/2000 credits; INR 130/290/500/900, minor units as Dodo requires). Test mode only. Names and prices are pre-approved (TASKS "Pre-approved decisions"); no overwrite/delete of existing resources; reuse a same-name product only if price and type match, otherwise the task FAILs.
**Acceptance:**

- [ ] 4 product IDs returned from MCP and recorded in the gate results (IDs are not secrets).
- [ ] Webhook endpoint created in test mode (via MCP or dashboard) subscribed to `payment.succeeded` and `payment.failed`, URL `<webhook-url>/webhooks/payments` from the pre-flight; the secret is written without printing, only to the gitignored `apps/api/.env` (TASKS T1.2), from which T1.3 copies it to `apps/web/.env.e2e.local`.
      **Dependencies:** 0.3 PASS. **Scope:** S.

### Task 0.5: Record IDs in env files

**Files:** `apps/api/.env.example` (placeholders: `PAYMENT_PROVIDER=dodo`, `DODO_PAYMENTS_API_KEY=`, `DODO_PAYMENTS_ENVIRONMENT=test_mode`, `DODO_PAYMENTS_WEBHOOK_KEY=`, `DODO_PRODUCT_ID_PACK_200/_450/_960/_2000=`, `PAYMENT_RETURN_URL=`), `apps/web/.env.example` (`VITE_DODO_CHECKOUT_MODE=test`), `apps/web/.env.e2e.example` (`DODO_PAYMENTS_WEBHOOK_KEY=` placeholder). Manual (gitignored, untracked, never staged): `apps/api/.env` gets the real test-mode product ids, and `apps/web/.env.e2e.local` gets the real test-mode webhook key for the e2e signer (TASKS T1.3). Do not touch Razorpay vars yet (removed in Phase 5 so the app keeps booting).
**Acceptance:** `.env.example` has placeholders only; `git diff` shows no real keys in tracked files; `.env` confirmed gitignored (`git check-ignore apps/api/.env`).
**Dependencies:** 0.4. **Scope:** XS.

### Checkpoint 0b

- [ ] 4 IDs in `apps/api/.env`; placeholders in `.env.example`; nothing secret tracked.

---

## Phase 1: Shared catalog

### Task 1.1: `CREDIT_PACKS` in `packages/shared`

**Description:** Add `packages/shared/src/models/creditPacks.ts` exporting `CreditPack` type, `CREDIT_PACKS` (4 packs, stable string ids e.g. `pack_200`), `getCreditPack(id)`, price in minor units + currency `INR`. Export from `models/index.ts`. The legacy monthly 300/100 entry is dropped (confirmed).
**Acceptance:**

- [ ] 4 packs, ids unique, credits/prices match legacy singles.
- [ ] `getCreditPack('nope')` returns undefined.
      **Verification:** colocated `creditPacks.test.ts` (pattern: `registry.test.ts`); `bun run test`; `bun run verify`.
      **Dependencies:** none (can run in parallel with Phase 0 research, but do after gate since currency depends on it). **Files:** `models/creditPacks.ts`, `models/index.ts`, test. **Scope:** S.

### Task 1.2: Add shared payment types

**Description:** Add `PaymentProviderName`, `PaymentStatus`, `PaymentRecord` (provider-agnostic, `provider` optional for legacy) to `types/domain.ts`. Do not delete Razorpay types yet.
**Acceptance:** web and api type-check against the new types. **Scope:** S.

### Checkpoint 1

- [ ] `bun run test` and `bun run verify` green; web/API still use old code paths unchanged.

---

## Phase 2: Provider port, Dodo adapter, checkout endpoints, auth fix

### Task 2.1: Auth mount-order fix (security, test first)

**Description:** In `routes/index.ts`, put `ClerkExpressRequireAuth({})` before `paymentsRoute`. Write the failing supertest first: unauthenticated request to every payments route returns 401. Flag to user that lines 19-23 (users, explore, credits, image, collections) share the same bug; do not fix without approval, as it changes behavior outside scope.
**Acceptance:**

- [ ] Unauthenticated request to old and new payments routes -> 401.
- [ ] Existing authenticated tests still pass.
      **Files:** `routes/index.ts`, `routes/payments.test.ts` (or new router test). **Dependencies:** none. **Scope:** XS.

### Task 2.2: Port, constants, errors, service skeleton

**Files:** `apps/api/src/payments/{types,constants,errors,service,providerFactory}.ts` + tests. `createCheckout(userId, packId)` validates pack via shared catalog (UnknownPackError -> 400) and calls the provider with catalog values only.
**Acceptance:** tests prove client-supplied price/credits cannot reach the provider; unknown pack throws typed error. **Dependencies:** 1.1. **Scope:** M.

### Task 2.3: Dodo adapter (checkout creation + session status)

**Files:** `payments/dodo/{client,adapter,productMap,constants}.ts` + tests; `config/env.ts` + `env.test.ts` (add Dodo vars, fail fast when `PAYMENT_PROVIDER=dodo` and any missing; Razorpay vars made optional here, removed in Phase 5). Add dependency `dodopayments` (ask-first dependency; user already approved in spec, still list it in the report).
**Acceptance:**

- [ ] Session create passes `product_cart` from env map, `metadata {userId, packId}`, `return_url`, customer email when available, fresh session each call.
- [ ] Provider errors map to `ProviderApiError`, no secrets in message.
- [ ] Architecture guard test: no `dodopayments` import outside `payments/dodo/`.
      **Dependencies:** 0.5, 2.2. **Scope:** M.

### Task 2.4: Authenticated router (`POST /payments/checkout`, `GET /payments`, `GET /payments/checkout/:sessionId/status`)

**Description:** Add a minimal pending record `{sessionId, userId, packId}` at checkout for ownership checks (storage form decided here: embedded pending payment with `providerSessionId`, consistent with Task 3.1; if not, a small pending store; choose the one that keeps the idempotent `$ne` guard simple). `userId` is only `req.auth.userId`. Status endpoint returns 404/403 for sessions not owned by caller. Mount in `routes/index.ts` behind auth. Status reads the DB record for the session first, provider status only as a fallback while pending. Rate limiting: out of scope, follow-up only.
**Acceptance:**

- [ ] 201 `{checkoutUrl, sessionId}`; 400 unknown pack; 401 without session; 502 generic on provider failure.
- [ ] `GET /payments` returns only the caller's rows, newest first.
- [ ] Other user's `sessionId` -> 403/404.
- [ ] Old routes (`/payments/order/create`, `/verify-payment`, `/:id`, `POST /payments`) still present until Phase 5 only if web still uses them; remove with Phase 4 swap.
      **Dependencies:** 2.1, 2.3, 3.1 model fields (do 3.1 first if embedded pending approach). **Scope:** M.

### Checkpoint 2

- [ ] `cd apps/api && bunx vitest run` and `bun run test` green; 401 test on every payments route.
- [ ] Manual (no server start): `curl`-free check via supertest only; optionally exercise the live running API with the sandboxed HTTP tool using a Clerk token to confirm a real Dodo test session URL is returned.
- [ ] Review with user before proceeding (money path).

---

## Phase 3: Webhook, idempotent grant

### Task 3.1: Payment model changes

**Files:** `models/payment.ts`. Add `provider` (enum razorpay|dodo, default razorpay), `providerPaymentId`, `providerSessionId`, `packId`, `credits`, `currency` (default INR); relax `paymentMethod` (currently required enum `credit_card|paypal|stripe`) to include `card|upi|other` plus legacy; keep `transactionId` readable for old rows (relax `required` carefully: new rows set it to the provider payment id so legacy readers keep working). Sparse/unique index note for embedded array cannot be enforced by Mongo unique across array elements, so atomicity relies on the conditional update (document this).
**Acceptance:** legacy-shaped document (no `provider`) serializes as `provider: 'razorpay'`; new record validates. **Dependencies:** 1.2. **Scope:** S.

### Task 3.2: Event mapper + signature verification

**Files:** `payments/dodo/eventMapper.ts`, adapter `verifyAndParseWebhook`. Use the single verification path chosen in the gate. Tests sign payloads for real (`{id}.{timestamp}.{body}` HMAC or library); cases: valid, tampered, wrong secret, missing headers, stale timestamp, unknown event type.
**Dependencies:** 0.3, 2.3. **Scope:** M.

### Task 3.3: `applyEvent` + webhook router

**Files:** `payments/service.ts` (`applyEvent`), `payments/webhookRouter.ts` (`express.raw({type:'application/json', limit})`), `app.ts` (mount beside `webhookRouter`, before `express.json`). Flow per spec 5.5: resolve userId from signed metadata; pack from catalog; cross-check amount+currency (mismatch -> record failed with reason, no credits, error log); atomic `User.updateOne({clerkId, 'payments.providerPaymentId': {$ne}}, {$push, $inc})`; duplicate -> 200 no-op; transient DB error -> 500; invalid signature -> 401 with no DB access; unhandled event -> 200; `payment.failed` -> failed record with same guard, later success still grants.
**Acceptance:**

- [ ] Each pack grants exactly its credits.
- [ ] Same payment id twice, and 10 concurrent deliveries, grant once.
- [ ] New webhook-id with same payment id grants once.
- [ ] Wrong amount/currency/pack grants nothing.
- [ ] Missing user -> logged, 200 (no retry storm) per spec.
- [ ] Logs include `webhookId`, `paymentId`, `userId`; never signature header or secrets.
      **Dependencies:** 3.1, 3.2. **Scope:** M. Replaces `/webhooks/razorpay` later (Phase 5).

### Checkpoint 3

- [ ] API suite green incl. concurrent duplicate test and real-signature tests.
- [ ] Optional: send a real Dodo test-mode payment to the webhook through a tunnel is deferred to Phase 6; it uses the pre-flight public URL.
- [ ] Review with advisor/user (money path audit).

---

## Phase 4: Web checkout client and UI

### Task 4.1: Checkout client + composable

**Files:** `apps/web/src/payments/{checkoutClient,dodoOverlay,usePurchase}.ts` + tests. Add `dodopayments-checkout` (name per gate). `Initialize` once at app load (e.g. in `main.ts`/app setup; locate during build), mode from `VITE_DODO_CHECKOUT_MODE`. `usePurchase.start(packId)`: `POST /payments/checkout` -> open overlay -> on close/success event poll `GET /payments/checkout/:sessionId/status` every `PAYMENT_POLL_INTERVAL_MS` (2s) until `PAYMENT_POLL_TIMEOUT_MS` (60s) -> on `succeeded` refetch user (via the `stores/user.ts` fetch, which also refreshes `payments`) -> toast. Never call `setCredits` with a computed value.
**Acceptance:** unit tests for open, poll-then-refetch, timeout, failed, error; SDK mocked only in `dodoOverlay.ts`. **Dependencies:** 2.4, 1.1. **Scope:** M.

### Task 4.2: Wire three components + catalog

**Files:** `BuyMoreCreditsDialog.vue` (+test), `PricingPacks.vue`, `Profile/Payments.vue`, `composables/usePricingCatalog.ts` (+test), `stores/user.ts` only if a refetch helper is needed. Replace `RAZORPAY_PRODUCTS` usage (`usePricingCatalog.ts:179`, `BuyMoreCreditsDialog.vue:23`) with shared `CREDIT_PACKS`. `Payments.vue` keys rows by `providerPaymentId ?? transactionId`, renders legacy and Dodo rows; no endpoint change (it reads the store). Extract inline JSX/template to component if it grows beyond ~20 lines.
**Acceptance:** pack click calls `usePurchase.start(pack.id)`; legacy row renders; Dodo row renders; component tests pass. **Dependencies:** 4.1. **Scope:** M (split into Tasks T5.3 catalog/Pricing and T5.4 dialog/Payments; real paths are `components/Dialogs/`, `components/Pricing/`, `components/Profile/`).

### Task 4.3: Return-url route (only if gate shows overlay needs it)

Small route/handler that triggers polling when `return_url` lands in the SPA. **Scope:** S, conditional.

### Checkpoint 4

- [ ] `bun run test`, `bun run verify` green.
- [ ] Browser evidence comes from the seeded QA specs `e2e/qa/billing-purchase.spec.ts` and `e2e/qa/billing-history.spec.ts` (Tasks T5.8/T5.9, re-run in T7.2); agent-browser is optional for exploration only, never evidence.

---

## Phase 5: Razorpay removal and docs

### Task 5.1: Code removal

Delete: `routes/payments.ts` Razorpay endpoints (old tests), `/webhooks/razorpay` in `webhook/index.ts` (+test), `RAZORPAY_PRODUCTS`/`RazorpayProduct`/`RazorpaySubscription`/`RazorpayOrder` in API, web and shared types/constants, `apps/web/src/utils/payment.ts` + `payment.test.ts`, `new Razorpay`, `constants.test.ts` cases. Remove `razorpay` from `apps/api/package.json` and refresh `bun.lock` with the project's package manager (bun). Keep the single `'razorpay'` legacy provider literal.
**Dependencies:** 4.2. **Scope:** L (split into Tasks T6.1 API routes/webhook, T6.2 API constants/types/deps, T6.3 web, T6.3.1 shared `RazorpayProduct`).

### Task 5.2: Env cleanup

The only untracked env writes in the whole build are the Phase 1 test-mode dev values (TASKS T1.2/T1.3, see Task 0.5 and the env-files row above: `apps/api/.env` and `apps/web/.env.e2e.local`). This cleanup task edits only tracked files: `config/env.ts` + `env.test.ts` (remove Razorpay vars, assert absence), `apps/api/docker-compose.yml:26-27`, and the tracked examples `apps/api/.env.example`, `apps/web/.env.example`, `infra/.env.example` (remove `RAZORPAY_*`/`VITE_RAZORPAY_*`, keep Dodo placeholders; never real secrets). During cleanup, untracked env files (`apps/api/.env`, `.env.production`, `.env.staging`; `apps/web/.env.local|.staging|.production`; `infra/.env.prod|.staging`) are never opened or edited. Instead the build lists the manual edits for the user, per file: delete each `RAZORPAY_*` / `VITE_RAZORPAY_*` line and add the Dodo variable names from SPEC 5.7 with the user's own values (live keys only for production, at cutover). The list goes in the task result under DECISIONS (TASKS T6.4.1) and in `agent_docs/CHECKLIST_manual_steps.md` (TASKS T6.6).
**Scope:** M.

### Task 5.3: Copy and docs

`pricingFAQ.json`, `public/pricing.md`, `public/llms.txt`, `README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, `agent_docs/CHECKLIST_manual_steps.md` (add Dodo dashboard/webhook/live-mode steps), `agent_docs/e2e-scenarios/profile-billing.feature.md`. Remove UPI/Razorpay claims unless gate confirmed Dodo supports them. Mention merchant of record accurately.
**Scope:** M.

### Checkpoint 5

- [ ] Repo-wide `git grep -i razorpay` is clean apart from the legacy-labelled allowlist in TASKS T6.6 (legacy provider literal, env absence marker, legacy-row test fixtures, legacy-labelled manual steps, historical records).
- [ ] `bun.lock` has no `razorpay`; `bun run test` and `bun run verify` green.

---

## Phase 6: E2E and manual test-mode run

### Task 6.1: Playwright billing spec

Superseded in TASKS by `E2E: purchase credits` (T5.8, `apps/web/e2e/qa/billing-purchase.spec.ts`) and `E2E: payment history` (T5.9, `apps/web/e2e/qa/billing-history.spec.ts`), using the harness and signing helper from T2.0/T2.0.1; the notes below are the original intent.
**Files:** `apps/web/e2e/billing.spec.ts` (new, matches flat spec layout), helper in `apps/web/e2e/support/` for signing and posting a webhook to the API (`standardwebhooks` signing with the test webhook key from e2e env) and for stubbing the overlay module (init script replaces the SDK open call). Uses existing `auth.setup.ts` storage state and the seeded e2e Clerk user (`apps/api` seed script). Scenarios from `profile-billing.feature.md`: buy pack -> overlay stubbed -> signed webhook -> poll resolves -> credits updated exactly once -> Profile -> Payments row visible; duplicate delivery no double credit; failed payment shows error. Use the `e2e-engineer` agent flow; report real app bugs rather than weakening tests.
**Verification:** `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts e2e/qa/billing-history.spec.ts --repeat-each=3`. Playwright against the already running servers; do not start them.
**Dependencies:** Phases 2-5. **Scope:** M.

### Task 6.2: Manual real test-mode run

Done by the user before Phase 7, with the pre-flight public webhook URL (never create a tunnel); TASKS T7.3 checks the recorded result and FAILs with instructions if it is missing: real overlay, Dodo test card from the gate results, observe webhook delivery in the Dodo dashboard, credits +N once, Profile -> Payments row, replay delivery from dashboard -> no extra credit, tamper checks. Record results and date in `agent_docs/CHECKLIST_manual_steps.md`.
**Scope:** S.

### Checkpoint 6 (done)

- [ ] All spec section 12 criteria 1-7 verified; advisor audit of the full diff; findings resolved or reported; implementation summary in the required format; committed per phase by the orchestrator.

---

## Risks and mitigations

| Risk                                                                                    | Impact | Mitigation                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INR not a valid base currency                                                           | High   | Gate (TASKS T0.4) records `T0.4-gate: FAIL` with the three options and FAILs, blocking the build; it never prompts. The user picks an option and re-runs; no auto fallback; no product creation before decision. |
| Metadata not echoed in `payment.succeeded`                                              | High   | Gate verifies; fallback is lookup via stored `providerSessionId` pending record (hence pending record in 2.4).                                                                                                   |
| Auth bug leaves payments data exposed until fixed                                       | High   | Task 2.1 first in Phase 2; flag identical pattern on 5 other routers to user.                                                                                                                                    |
| Double credit via retries/concurrency                                                   | High   | Atomic conditional update keyed on payment id; concurrent test.                                                                                                                                                  |
| Embedded `payments` array cannot hold a unique index across docs                        | Med    | Conditional `$ne` update is the guard; accepted growth risk noted.                                                                                                                                               |
| Dev/test SDK package name differs (`dodopayments-checkout` vs `@dodopayments/checkout`) | Med    | Gate item 5; registry check before install.                                                                                                                                                                      |
| Overlay gives no success event, only redirect                                           | Med    | Poll on close; optional return route 4.3.                                                                                                                                                                        |
| No rate limiter in repo                                                                 | Med    | Out of scope; logged as follow-up.                                                                                                                                                                               |
| Plugin installs at user scope by mistake                                                | Low    | In 0.1, `grep dodopayments .claude/settings.json` on the local (gitignored, so no diff) file finds it, and `grep dodopayments ~/.claude/settings.json` finds nothing.                                            |
| Mutating the external Dodo account                                                      | Med    | Confirm product names/prices before create; test mode only; no deletes.                                                                                                                                          |
| Webhook cannot reach local dev                                                          | Med    | Needs tunnel/staging URL, supplied in the pre-flight (`webhook-url=` note). Automated coverage uses signed local posts.                                                                                          |
| Monthly legacy product (id 5) dropped                                                   | Low    | User confirmed; removed with the catalog.                                                                                                                                                                        |

## Rollback

- The orchestrator makes one commit per verified phase on `feature/payments`; roll back a phase with `git revert <phase commit>` (a human decision, never done by the build agents).
- Phases 1-4 are additive (Razorpay path still works until Phase 5), so stopping after any of them leaves production behavior unchanged. Razorpay removal is deliberately last.
- Data: no migration; legacy rows untouched; new fields are optional. `PAYMENT_PROVIDER` env flips the adapter; Dodo products/webhook endpoints are test-mode and can be disabled in the Dodo dashboard (deletion requires explicit user confirmation).
- If Phase 5 is regretted before commit: `git restore` the deleted files plus `bun install` to restore `razorpay`.

## Open questions needing human input

- Gate outcome if INR unsupported.
- Rate limiter: default out of scope; log as follow-up.
- Other five unprotected-mount routers: default out of scope; log as follow-up.
- Pending-record shape and session linking (see TASKS Open question 3).
- Webhook path (`/webhooks/payments` vs `/webhooks/dodo`) and tunnel/staging URL for the manual run.
- Untracked prod/staging env files (`.env.production`/`.env.staging`, `infra/.env.prod|staging`): resolved, the build never edits them; the user applies the manual edit list from TASKS T6.4.1/T6.6.

## Gate results and build evidence

Filled during `/build-phases` Phases 0-1 (empty until then). One line per fact, starting with the exact label so the read-only verifier can grep it. Never write secrets here (no API keys, no webhook signing secrets); product and endpoint ids are fine.

| Label                           | Written by | Content                                                                                                    |
| ------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `T0.1-plugin:`                  | T0.1       | `claude plugins list` line for `dodopayments@dodopayments`, verbatim, plus the scope flag used             |
| `T0.2-mcp-list:`                | T0.2       | the two Dodo lines of `claude mcp list`, verbatim                                                          |
| `T0.2-mcp-tools:`               | T0.2       | Dodo MCP tool names available to the builder, verbatim                                                     |
| `T0.2-skills:`                  | T0.2       | Dodo skill names as listed in the builder's available skills (`dodopayments:<name>`)                       |
| `T0.2-docs-query:`              | T0.2       | question, one-line answer, source URL                                                                      |
| `T0.2-products:`                | T0.2       | pre-gate test-mode product count and names                                                                 |
| `T0.3-item1:` ... `T0.3-item6:` | T0.3       | answer, cited snippet, source URL or "unverifiable" plus handling                                          |
| `T0.4-gate:`                    | T0.4       | `PASS` or `FAIL`, citation; on FAIL the three options and consequences                                     |
| `T1.1-product:` (x4)            | T1.1       | `<packId> \| <name> \| <product id> \| <price minor> <currency> \| <type> \| test_mode \| created\|reused` |
| `T1.2-endpoint:`                | T1.2       | `<endpoint id> \| <url> \| <events> \| test_mode \| created\|reused`                                       |
| `T1.2-local-endpoint:`          | T1.2       | `<endpoint id> \| <url> \| <events> \| test_mode \| created\|reused` (local ngrok dev)                     |

### Checkpoint 0 notes

T0.1-plugin: PASS - `claude plugins list`: "dodopayments@dodopayments, Version: 0.6.5, Scope: project, Status: enabled" (installed with `--scope project`); repo `.claude/settings.json` line 4 `"dodopayments@dodopayments": true` under enabledPlugins; `~/.claude/settings.json` has no enabledPlugins entry for it (only the marketplace source in extraKnownMarketplaces, line 233).

T0.2-mcp-list: plugin:dodopayments:dodopayments-api: https://mcp.dodopayments.com/mcp (HTTP) - Connected | plugin:dodopayments:dodo-knowledge: https://knowledge.dodopayments.com/mcp (HTTP) - Connected
T0.2-mcp-tools: NONE available to the phase-builder agent; evidence gathered by the orchestrator with mcp**plugin_dodopayments_dodo-knowledge**search_docs and mcp**plugin_dodopayments_dodopayments-api**execute (read-only calls, user-approved fallback)
T0.2-skills: dodopayments:better-auth-integration, dodopayments:billing-sdk, dodopayments:checkout-integration, dodopayments:credit-based-billing, dodopayments:customer-management, dodopayments:discounts-and-promotions, dodopayments:dodo-best-practices, dodopayments:dodo-mcp-usage, dodopayments:framework-adapters, dodopayments:license-keys, dodopayments:localized-pricing, dodopayments:mobile-checkout, dodopayments:product-catalog-management, dodopayments:refunds-and-disputes, dodopayments:subscription-integration, dodopayments:testing-and-go-live, dodopayments:usage-based-billing, dodopayments:webhook-integration
T0.2-docs-query: Q: "Which currencies are supported as base currency for products, is INR supported?" A: a product's base price can be set in any currency Dodo can charge, so check that the product's base currency is INR; INR payments have a minimum of ₹5.00 (https://docs.dodopayments.com/miscellaneous/faq ; https://docs.dodopayments.com/features/payment-methods/india)
T0.2-products: 0 products listed via dodopayments-api client.products.list() (authenticated; the MCP session is assumed test mode, mode not exposed by the API call) - no names
T0.3-item1: INR as product base currency: YES (docs-supported). "Your base currency is whatever you priced the product or add-on in — it can be any currency Dodo Payments can charge, not just USD." (https://docs.dodopayments.com/features/adaptive-currency); FAQ: "check that the product's base currency is INR" (https://docs.dodopayments.com/miscellaneous/faq); "INR → INR transactions are always treated as inclusive" (adaptive-currency). Adaptive Currency = auto-converts base price at live FX (customer sees converted amount); Localized Pricing = fixed per-currency/country price you set, falls back to base price (https://docs.dodopayments.com/features/localized-pricing). With an INR base, no conversion applies for INR buyers. Final confirmation happens when the product is created in the dashboard.
T0.3-item2: checkoutSessions.create supports `metadata` (example `metadata: { order_ref: 'ORD-12345' }`, https://docs.dodopayments.com/features/checkout; request-body field `metadata` in https://docs.dodopayments.com/api-reference/checkout-sessions/create). Response fields: `session_id` (required), `checkout_url` (nullable), plus `payment_id`, `client_secret`, `publishable_key` (only with confirm:true). Echo on payment.succeeded: payment metadata is read at `data.metadata.<key>` (webhook payload `data` = payment object; DataFast handler uses `webhook.payload.data.metadata.datafast_visitor_id`, https://docs.dodopayments.com/integrations/datafast). Not shown in a full payment.succeeded sample; verify in the first test-mode webhook.
T0.3-item3: payment payload (`data`, payload_type Payment) fields: `payment_id`, `status`, `currency`, `total_amount` (minor units, e.g. 400 = $4.00), `payment_method` (sample value "card"), `customer.{customer_id,email,name}`, `metadata`, `subscription_id`, and `checkout_session_id` (null for renewals) (https://docs.dodopayments.com/developer-resources/handle-payment-failures ; https://docs.dodopayments.com/integrations/datafast). Full set of `payment_method` values: UNVERIFIABLE from docs retrieved; handling: store as opaque string, map only 'card'/'upi\*' loosely for display. UPI for INR in test mode: YES - test IDs `success@upi` / `failure@upi`; needs billing country IN and billing currency INR; checkout offers UPI only as `upi_intent` (https://docs.dodopayments.com/features/payment-methods/india ; https://docs.dodopayments.com/miscellaneous/testing-process).
T0.3-item4: Use ONE path: `client.webhooks.unwrap(rawBody, {headers})` with `webhookKey` / `DODO_PAYMENTS_WEBHOOK_KEY` (recommended SDK path; `unsafeUnwrap` is test-only; throws on invalid signature) (https://docs.dodopayments.com/developer-resources/webhooks). Headers (lowercase in Express `req.headers`): `webhook-id`, `webhook-signature` (`v1,<base64>`), `webhook-timestamp`. Replay tolerance: Standard Webhooks libraries allow 5 minutes (same page). Raw body required: `express.raw({type:'application/json'})` on the webhook route, mounted before `express.json()`; pass `req.body.toString()`. Use `webhook-id` for idempotency.
T0.3-item5: npm package is `dodopayments-checkout` (`import { DodoPayments } from "dodopayments-checkout"`); `@dodopayments/checkout` is not documented (https://docs.dodopayments.com/developer-resources/overlay-checkout). API: `DodoPayments.Initialize({mode:'test'|'live', displayType, onEvent})`, `DodoPayments.Checkout.open({checkoutUrl})`. onEvent `event.event_type` values: checkout.opened, checkout.form_ready, checkout.payment_page_opened, checkout.customer_details_submitted, checkout.closed, checkout.redirect, checkout.error, checkout.link_expired; with `manualRedirect:true` also `checkout.status` (payment outcome) and `checkout.redirect_requested`. No dedicated success event otherwise: use checkout.status with manualRedirect, and confirm via webhook/Get Checkout Session. return_url: customer is redirected with query params payment_id/subscription_id, status, email, license_key (https://docs.dodopayments.com/features/checkout); SPA-specific behavior UNVERIFIABLE; handling: land on a route that re-reads status from our API, never trust the query params. window global: npm build is module-only; only the CDN build exposes `DodoPaymentsCheckout.DodoPayments` (not `window.DodoPayments`), so dodoOverlay.ts must expose a test seam on `window` for the e2e stub.
T0.3-item6: Test cards (Indian-issued): Visa success 4576238912771450, declined 4706131211212123; Mastercard success 5409162669381034, declined 5105105105105100; expiry 06/32, CVV 123 (https://docs.dodopayments.com/features/payment-methods/india). SDK environment strings: `test_mode` / `live_mode` (default live_mode) (https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode ; Ruby example in get-checkouts reference). Webhook retries: exponential backoff, 8 attempts: immediately, 5s, 5m, 30m, 2h, 5h, 10h, 10h; 30s timeout (https://docs.dodopayments.com/developer-resources/webhooks). Get Checkout Session: GET /checkouts/{id}, SDK `client.checkoutSessions.retrieve(id)`, response `id`, `payment_id` (null until details submitted), `payment_status`, customer_email/name, created_at (https://docs.dodopayments.com/api-reference/checkout-sessions/get-checkouts).

### Gate results

T0.4-gate: PASS - INR is supported as product base currency (T0.3-item1): "Your base currency is whatever you priced the product or add-on in — it can be any currency Dodo Payments can charge, not just USD." (https://docs.dodopayments.com/features/adaptive-currency). No products created in Phase 0 (T0.2-products: 0); no create calls made.

### Checkpoint 1 notes

T1.1-product: pack_200 | 200 credits | pdt_0Nq8kJOKsz8HkOMA1c4W8 | 13000 INR | one_time_price | test_mode | created
T1.1-product: pack_450 | 450 credits | pdt_0Nq8kJQnTzvtrAhn3eQmg | 29000 INR | one_time_price | test_mode | created
T1.1-product: pack_960 | 960 credits | pdt_0Nq8kJRvk0XVhagsLjbk9 | 50000 INR | one_time_price | test_mode | created
T1.1-product: pack_2000 | 2000 credits | pdt_0Nq8kJT0DphjbFE2obFPF | 90000 INR | one_time_price | test_mode | created
T1.2-endpoint: ep_3KxCY74VR8TTHSRLnFwndSW7Ksi | https://api-staging.visual-ai.app/webhooks/payments | payment.succeeded, payment.failed | test_mode | reused
T1.2-local-endpoint: ep_3KxEU3NsicWiuj4q4Jc5QJfVdjD | https://9741-103-163-67-159.ngrok-free.app/webhooks/payments | payment.succeeded, payment.failed | test_mode | created

### Checkpoint 4 notes (2026-10-20, builder a3)

Phase 3–4 diff audited against SPEC §6 (Security requirements). Evidence: `apps/api/src/payments/` (Phases 3–4), `apps/api/src/routes/payments.ts`, `apps/api/src/routes/index.ts`, Vitest suites cited in TASKS T4.4 Verify.

| SPEC §6 item                                       | Result          | Evidence                                                                                                                                  |
| -------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Webhook signature + raw body                     | PASS            | `dodo/adapter.ts` unwrap; `verify.test.ts` real Standard Webhooks signing; `webhookRouter.ts` uses `express.raw` before JSON              |
| 2 Catalog-only credits/amount                      | PASS            | `service.ts` `getCreditPack` + amount/currency cross-check; mismatch → failed record, no `$inc`                                           |
| 3 userId from server metadata only                 | PASS            | Checkout metadata from Clerk session (Phase 3); webhook reads metadata after verified signature                                           |
| 4 Clerk auth on `/payments/*`, caller-scoped reads | PASS            | `routes/index.ts` mounts `ClerkExpressRequireAuth` before payments router; status endpoint ownership checks in `service.ts`               |
| 5 Idempotent on Dodo `payment_id`                  | PASS            | `completedPaymentGuard` on grant; `noExistingPaymentGuard` on failed/mismatch paths; concurrent + duplicate tests in `applyEvent.test.ts` |
| 6 Secrets not exposed                              | PASS            | 401/500 generic JSON; pino context uses `webhookId`/`paymentId`/`userId` only                                                             |
| 7 Checkout rate limit out of scope                 | PASS (deferred) | Logged in SPEC Open question 12; no limiter added                                                                                         |
| 8 Fresh checkout session per attempt               | PASS            | `createCheckout` always `Payment.create` + provider `createCheckout`                                                                      |
| 9 Webhook body size limit                          | PASS            | `PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES` on `express.raw`; 413 test in `webhookRouter.test.ts`                                                 |

T4.4-gate: PASS — scoped coverage 100% stmts/branches/funcs/lines (78 tests); `bun run test` 1663 passed; `bun run verify` 0 errors.
