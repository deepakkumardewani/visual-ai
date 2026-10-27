# Phase 5 builder report (T5.1–T5.5)

## T5.1 Overlay wrapper and checkout client

- Added `dodopayments-checkout@2.0.0` to `apps/web/package.json`.
- `apps/web/src/payments/dodoOverlay.ts`: sole SDK import; `initDodoOverlay()` + `openDodoCheckout()`.
- `apps/web/src/payments/checkoutClient.ts`: `POST /payments/checkout`, `GET /payments/checkout/:sessionId/status`.
- `apps/web/src/main.ts`: calls `initDodoOverlay()` before app mount.
- **Verify:** `bun run verify` → 0 errors. `rg dodopayments-checkout apps/web/src` → only `dodoOverlay.ts`.

## T5.2 usePurchase

- `apps/web/src/payments/constants.ts`: `PAYMENT_POLL_INTERVAL_MS` (2000), `PAYMENT_POLL_TIMEOUT_MS` (60000), toast copy.
- `apps/web/src/payments/usePurchase.ts`: checkout → overlay → poll; success → `getUserDetails()` + toast; no `setCredits`.
- **Verify:** `rg setCredits apps/web/src/payments` → no matches.

## T5.3 Pricing catalog + PricingPacks

- `usePricingCatalog.ts`: `CREDIT_PACKS` instead of `RAZORPAY_PRODUCTS`.
- `PricingPacks.vue`: `CreditPack` props, `usePurchase.start(pack.id)`.
- Updated unit tests for four INR packs and Dodo purchase mock.
- **Verify:** `cd apps/web && bunx vitest run src/composables/usePricingCatalog.test.ts src/components/Pricing/` → 10/10 pass.

## T5.4 Buy dialog + Profile payments

- `BuyMoreCreditsDialog.vue`: `CREDIT_PACKS`, `usePurchase`, Dodo trust line.
- `Payments.vue`: row `:key` via `providerPaymentId ?? transactionId`.
- Tests updated (Dodo trust line; legacy + Dodo rows).
- **Verify:** dialog/payments vitest 13/13; `rg -ni razorpay BuyMoreCreditsDialog.vue BuyMoreCreditsDialog.test.ts` → none; `bun run test` → 1664 pass.

## T5.5 Return URL handler — N/A

- **Citation:** PLAN `T0.3-item5`: no dedicated overlay success event; use `checkout.status` with `manualRedirect` and confirm via webhook / Get Checkout Session — not SPA `return_url` completion.
- No `PaymentReturn.vue` or router route added.

## DECISIONS

- **T5.5:** Skipped return route per gate citation above.
- **BuyMoreCreditsDialog:** Kept select-then-buy UX; purchase calls `start(selectedPack.id)` only (not per-pack instant buy).
