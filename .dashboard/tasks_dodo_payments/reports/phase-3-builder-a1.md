# Phase 3 builder report (T3.1–T3.5)

## T3.1 — Clerk auth mount order

**Changes:** `apps/api/src/routes/index.ts` mounts `ClerkExpressRequireAuth` before `paymentsApiRouter` and legacy `paymentsRoute`. `apps/api/src/routes/payments.test.ts` adds auth-order tests (401 unauthenticated, 200 authenticated).

**Commands:**

- `cd apps/api && bunx vitest run routes/payments.test.ts` → 4 files / 37 tests passed (includes index + env + payment)
- `git diff apps/api/src/routes/index.ts` → auth-first mount for both payment routers

## T3.2 — Payment port, constants, errors, service

**Changes:** New `apps/api/src/payments/{types,constants,errors,service}.ts` — `PaymentProvider` port, `NormalizedPaymentEvent`, typed errors, `createCheckout(userId, packId)` using shared catalog only.

**Commands:** `bun run verify` → 0 errors

## T3.3 — Dodo adapter

**Changes:** `apps/api/src/payments/dodo/{client,adapter,productMap}.ts`, `providerFactory.ts`, `dodopayments@2.55.0` in `apps/api/package.json`.

**Commands:**

- `bun run verify` → pass
- `grep dodopayments apps/api/src` → only `payments/dodo/client.ts`

## T3.4 — Env + payment model

**Changes:** Dodo env vars + `superRefine` when `PAYMENT_PROVIDER=dodo`; Razorpay optional; payment schema extended per spec 5.4 (provider, session/payment ids, pack, credits, currency, payment methods).

**Commands:**

- `cd apps/api && bunx vitest run config/env.test.ts models/payment.test.ts` → pass
- `bun run verify` → pass

## T3.5 — Authenticated payments router

**Changes:** `apps/api/src/payments/router.ts` — `POST /payments/checkout`, `GET /payments`, `GET /payments/checkout/:sessionId/status`; mounted in `routes/index.ts`; service list/status helpers.

**Commands:**

- `cd apps/api && bunx vitest run routes/payments.test.ts` → pass
- `bun run test` → 241 files / 1547 tests passed
- `bun run verify` → pass

## Extra (test hygiene, not task Files)

- `apps/api/src/routes/index.test.ts` — mount expectations for new router + auth-first payments
- `apps/api/src/routes/payments.ts` + `payments.test.ts` — optional Razorpay secret typing
- Rebuilt `packages/shared` dist so `getCreditPack` / `CreditPack` types resolve in `vp check`

## DECISIONS

- **T3.4:** `PAYMENT_PROVIDER` defaults to `razorpay` when `NODE_ENV=test` (otherwise `dodo`) so Vitest suites that load `env.ts` without a full Dodo `.env` still boot. Dodo fail-fast is covered by explicit `PAYMENT_PROVIDER=dodo` in `env.test.ts`.

## Dependency

- Added **`dodopayments@2.55.0`** (no `standardwebhooks` — webhook verification deferred to Phase 4).
