# Phase 4 builder report (a2) — T4.1, T4.2, T4.3 retry

Result: **PASS**

## T4.1 Event mapper and signature verification

**Changes**

- `apps/api/src/payments/dodo/adapter.test.ts`: `makeMockClient()` includes `webhooks.unwrap`; header test uses mock instead of post-hoc assignment (fixes 3 TS2339 errors).
- `apps/api/src/payments/dodo/adapter.ts`: unwrap failures throw `InvalidSignatureError` with `{ cause: error }`.
- `apps/api/src/payments/errors.ts`: `InvalidSignatureError` accepts optional `{ cause }` (required for adapter fix; not in T4.1 Files — see DECISIONS).

**Commands**

- `cd apps/api && bunx vitest run payments/dodo/` — 4 files, 30 tests passed.
- `bun run verify` (repo root) — exit 0.

## T4.2 applyEvent with atomic idempotent grant

**Changes**

- `apps/api/src/payments/service.ts`: split `resolveWebhookGrant` / `dispatchWebhookPayment`; unified `recordFailedPayment`; unknown pack logs at **error**; removed unreachable `syncCheckoutPaymentRow` userId guard; single discriminator on `event.type` (succeeded/failed).
- `apps/api/src/payments/applyEvent.test.ts`: 10 concurrent deliveries with filter + `$push`/`$inc` assertions; duplicate webhook-id test asserts `elemMatch` guard on both calls; unknown pack expects `logger.error`.

**Commands**

- `cd apps/api && bunx vitest run payments/applyEvent.test.ts` — 21 tests passed.
- Scoped coverage (T4.4 command): service.ts **100%** branches/lines (180/180 stmts, 127/127 branches).

## T4.3 Webhook router and mount

**Changes**

- `apps/api/src/payments/webhookRouter.ts`: `EXPRESS_PAYLOAD_TOO_LARGE` constant for 413 handler.
- `apps/api/src/payments/webhookRouter.test.ts`: error middleware found via cast `as ErrorMiddleware | undefined` (fixes TS2677/TS2554).

**Commands**

- `cd apps/api && bunx vitest run payments/webhookRouter.test.ts webhook/` — 15 tests passed.
- `bun run verify` — exit 0.

## DECISIONS

- **T4.1 · `errors.ts` edit** · default taken: extend `InvalidSignatureError` for `cause` · alternatives: swallow cause or cast in adapter only.
- **T4.1 · `client.ts` (prior phase)** · already modified for webhookKey per verifier a1; no change this run.

## Files touched (this run)

`adapter.ts`, `adapter.test.ts`, `errors.ts`, `service.ts`, `applyEvent.test.ts`, `webhookRouter.ts`, `webhookRouter.test.ts`
