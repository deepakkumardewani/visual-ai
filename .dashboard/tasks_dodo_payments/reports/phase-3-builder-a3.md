# Phase 3 builder report (attempt a3) — T3.2 quality fix

Scope: Verifier issue A only (phase-3-verifier-a2.md). No T3.7/router work.

## T3.2 — Deduplicate provider failure message

**Change**

- `apps/api/src/payments/constants.ts`: Added `PROVIDER_REQUEST_FAILED: "Payment provider request failed"` to `PAYMENTS_MESSAGES`.
- `apps/api/src/payments/service.ts`: Replaced literal at `createCheckout` catch (~39) and `getCheckoutSessionStatus` catch (~105) with `PAYMENTS_MESSAGES.PROVIDER_REQUEST_FAILED`.

**Verify**

```text
cd apps/api && bunx vitest run src/payments/service.test.ts
→ 1 file, 21 tests passed
```

**Acceptance (issue A)**

- No duplicated `"Payment provider request failed"` literals in `service.ts`; single source in `PAYMENTS_MESSAGES`.

## Result

PASS · T3.2 quality fix (verifier issue A)
