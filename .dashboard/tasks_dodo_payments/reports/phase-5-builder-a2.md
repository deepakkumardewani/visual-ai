# Phase 5 builder report (retry a2)

**Phase:** Web checkout client and UI  
**Scope:** Verifier fixes — T5.6 TS verify, T5.8 e2e stability, related verify blockers  
**Date:** 2026-10-20

---

## T5.6 (unit / verify)

**Changes:**

- `apps/web/src/payments/usePurchase.test.ts` — replaced invalid `pack_120` literals with `pack_200` (valid `CreditPackId`).
- `apps/web/src/payments/checkoutClient.test.ts` — same `pack_200` fix.

**Commands:**

- `bunx vitest run src/payments/usePurchase.test.ts src/payments/checkoutClient.test.ts` → 2 files, 14 tests passed.
- `bun run verify` (root) → 0 errors (was 13 TS2345 on pack_120).

---

## T5.3 verify collateral

**Changes:**

- `apps/web/src/composables/usePricingCatalog.test.ts` — `UPSCALE_BASIC` → `UPSCALE_REAL_ESRGAN` (removed from `ModelKey`).

---

## T5.8 (e2e)

**Root cause:** `--repeat-each=3` scheduled multiple billing tests on the shared E2E user in parallel; credit assertions saw extra grants (+900 vs +450).

**Changes:**

- `apps/web/e2e/qa/billing-purchase.spec.ts` — serial `test.describe`, credit polls use `readPaidCredits` after success toast (no reload), unused vars removed.
- `apps/web/playwright.config.ts` — `chromium-billing` project: `workers: 1`, `fullyParallel: false`, dedicated `testMatch` for billing-purchase; excluded from default `chromium` project.
- `apps/web/e2e/global.d.ts` — `Window.__VISUAL_AI_E2E_DODO__` typing for verify.

**Commands:**

- `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts --repeat-each=3` → **22 passed** (7 scenarios × 3 + setup).

---

## Other verify

- `apps/web/e2e/qa/billing-history.spec.ts` — `postSignedWebhook` param typed as `APIResponse` (fixes `.status()` in template string).

---

## Decisions

- **T5.8 · parallel repeats · default:** Dedicated Playwright project with `workers: 1` rather than only serial describe (repeat-each still parallelized across workers without it).
- **Credit assert · reload vs chip:** Poll `readPaidCredits` in-page after `getUserDetails` from success path; avoids reload races while serial execution prevents cross-test interference.

---

## Overall

**PASS** — `bun run verify` green (0 errors); T5.8 e2e green at `--repeat-each=3`.
