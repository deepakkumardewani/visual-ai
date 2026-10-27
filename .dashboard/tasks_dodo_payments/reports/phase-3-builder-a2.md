# Phase 3 builder report (attempt a2)

Verdict: **PASS** (implementation T3.1–T3.5; verifier retry)

## Verifier fixes applied

1. **TS2345** — `router.test.ts`: lean payment rows cast via `unknown`; JSON expectation uses ISO date strings.
2. **T3.1** — Single Clerk mount: `router.use(Clerk, paymentsApiRouter, paymentsRoute)`; `index.test.ts` updated (`flatMap` for router names). Removed tautological `Clerk auth mount order` block from `routes/payments.test.ts`.
3. **T3.2/T3.3** — `asProviderApiError` in `errors.ts`; `MINOR_UNITS_PER_MAJOR`, `DODO_API_PAYMENT_STATUS`, `PAYMENTS_MESSAGES` in `constants.ts`; service + adapter use helpers/constants.
4. **T3.4** — Razorpay lazy init + verify-payment rejects missing secret (`routes/payments.ts`, out-of-T3.4-Files — required for optional Razorpay env AC).
5. **T3.5** — `getUserIdOrRespondUnauthorized` in `router.ts`; shared message constants.

## DECISIONS

- **`Payment.userId` + standalone `Payment` collection:** Checkout pending/history rows live in the `Payment` collection (`createCheckout`, `listPaymentsForUser`, status by `providerSessionId`). Spec 5.5 credit grants update embedded `User.payments`. **Phase 4 must** either update the same `Payment` collection row on webhook completion or align reads so status/history see terminal state (documented for advisor).
- **`routes/payments.ts` edit:** Not in T3.4 Files list; changed only to satisfy “Razorpay optional at boot” without forgeable empty HMAC.

## Per task

### T3.1

- **Files:** `routes/index.ts`, `routes/index.test.ts`, `routes/payments.test.ts` (removed bogus auth block)
- **Commands:** `bunx vitest run routes/payments.test.ts routes/index.test.ts` — 8+3 tests pass

### T3.2

- **Files:** `constants.ts`, `errors.ts`, `service.ts`
- **Commands:** `bun run verify` — 0 errors; `vitest` service/errors tests pass

### T3.3

- **Files:** `dodo/adapter.ts`, `constants.ts`, `errors.ts`
- **Commands:** `bunx vitest run payments/dodo/` — pass; `bun run verify` — pass

### T3.4

- **Files:** (model unchanged this retry) `routes/payments.ts` for Razorpay boot/HMAC
- **Commands:** `bunx vitest run config/env.test.ts models/payment.test.ts` — pass

### T3.5

- **Files:** `payments/router.ts`, `routes/index.ts`, `service.ts` (messages)
- **Commands:** `bunx vitest run payments/router.test.ts routes/payments.test.ts` — pass; `bun run verify` — 0 errors, 6 pre-existing warnings

## Evidence (key output)

```
bun run verify → Found 0 errors and 6 warnings in 586 files
bunx vitest run (8 files scoped) → 97 passed
```
