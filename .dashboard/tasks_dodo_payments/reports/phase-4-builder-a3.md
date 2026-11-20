# Phase 4 builder report (a3) — verifier retry

## Result: PASS (pending independent verifier)

## Verifier a2 fixes

### Q1 — `recordFailedPayment` idempotency

- Added `noExistingPaymentGuard`: blocks when any embedded row exists for `providerPaymentId` (any status).
- Success path unchanged: `completedPaymentGuard` still allows grant after a failed row.
- Updated `applyEvent.test.ts`: duplicate `payment.failed` and duplicate amount-mismatch tests simulate first-write-then-no-op with filter assertions (no tautological `modifiedCount: 0` mock).

### Q2 — single body limit constant

- Removed `PAYMENTS_WEBHOOK_BODY_LIMIT` string from `dodo/constants.ts`.
- `webhookRouter.ts` uses `PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES` (number) for `express.raw`.

### Q3 — dead export

- Removed `paymentStatusForEventType` from `eventMapper.ts` and its test.

### Q4 — redundant param

- `dispatchWebhookPayment(parsed, pack)` only; uses `parsed` for type, amount, logging.

### Checkpoint 4 — SPEC §6 audit

- Appended table to `agent_docs/PLAN_dodo_payments.md` under "Checkpoint 4 notes (2026-10-20, builder a3)" with PASS per §6.1–6.9.

## Files changed

- `apps/api/src/payments/service.ts`
- `apps/api/src/payments/applyEvent.test.ts`
- `apps/api/src/payments/dodo/constants.ts`
- `apps/api/src/payments/webhookRouter.ts`
- `apps/api/src/payments/dodo/eventMapper.ts`
- `apps/api/src/payments/dodo/eventMapper.test.ts`
- `agent_docs/PLAN_dodo_payments.md`

## Commands

| Command                                                                                                                                            | Outcome                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `cd apps/api && bunx vitest run payments/dodo/ payments/applyEvent.test.ts payments/webhookRouter.test.ts payments/service.test.ts --coverage ...` | 7 files, 78 passed; 100% coverage all metrics        |
| `bun run test` (root)                                                                                                                              | 251 files, 1663 passed                               |
| `bun run verify` (root)                                                                                                                            | 0 errors, 6 warnings (pre-existing, outside Phase 4) |

## DECISIONS

- Failed/mismatch dedupe: any existing row with payment id → no-op (not completed-only guard).
