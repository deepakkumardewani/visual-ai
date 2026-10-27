# Phase 4 builder report — Webhook and idempotent grant

## T4.1 Event mapper and signature verification

**Changed:** `eventMapper.ts`, `constants.ts`, `adapter.ts`, `client.ts`, `eventMapper.test.ts`, `verify.test.ts`, `adapter.test.ts` (assertion text).

**Commands:**

- `cd apps/api && bunx vitest run payments/dodo/` → 4 files, 25 tests passed
- `bun run verify` (repo root) → pass after TS fix in verify.test.ts

**Notes:** Uses `client.webhooks.unwrap` with `DODO_PAYMENTS_WEBHOOK_KEY` on the Dodo client. Unknown Dodo event types return `null`; bad/missing/stale signatures throw `InvalidSignatureError`.

## T4.2 applyEvent with atomic idempotent grant

**Changed:** `service.ts` (`applyEvent`, helpers), `applyEvent.test.ts`, `service.test.ts` (removed stub test; mocks for User/logger), `router.test.ts` (partial payment/user mocks for importActual service).

**Commands:**

- `cd apps/api && bunx vitest run payments/applyEvent.test.ts` → 13 passed
- `cd apps/api && bun run test` → 60 files, 602 tests passed

**Notes:** Credits granted via conditional `User.updateOne` (skip when embedded payment already `completed` for same `providerPaymentId`). Checkout `Payment` row updated by `providerSessionId` when present. Mismatch amount/currency records failed without `$inc`.

## T4.3 Webhook router and mount

**Changed:** `webhookRouter.ts`, `webhookRouter.test.ts`, `app.ts`, `app.test.ts`.

**Commands:**

- `cd apps/api && bunx vitest run payments/webhookRouter.test.ts src/webhook/index.test.ts` → 12 passed
- `cd apps/api && bun run type-check` → clean

**Notes:** `POST /webhooks/payments` with `express.raw({ type: 'application/json', limit: '256kb' })` before global JSON parser. Invalid signature → 401 without `applyEvent`. Oversize body → 413. Mounted alongside existing Clerk/Razorpay webhook router.

## Decisions

- **T4.2 · clerkId vs userId ·** Spec mentions `clerkId`; User schema uses `userId` — filtered/updated on `userId`.
- **T4.2 · ParsedWebhookEvent extras ·** `providerSessionId` / `paymentMethod` carried on `ParsedWebhookEvent` (extends normalized event at runtime) without editing `types.ts`.

## Outcome

PASS — T4.1–T4.3 implementation complete; T4.4 unit gate not run (separate agent).
