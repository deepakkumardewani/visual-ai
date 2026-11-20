# Phase 5 verifier report (independent)

**Phase:** Web checkout client and UI  
**Tasks:** T5.1–T5.9, Checkpoint 5  
**Date:** 2026-10-20

---

## T5.1 Overlay wrapper and checkout client

**Commands:**

- `bun run verify` (repo root) → exit **1**, `Found 7 warnings and 13 errors` (includes `apps/web/src/payments/usePurchase.test.ts` TS2345).
- `git grep -nE "dodopayments-checkout|@dodopayments/checkout" -- apps/web/src` → **no output** (exit 0 with `|| true`). `git status` shows `?? apps/web/src/payments/` (entire dir untracked), so git grep cannot prove SDK isolation.
- Workspace grep: real import only in `dodoOverlay.ts`; string `dodopayments-checkout` also in `dodoOverlay.test.ts` (`vi.mock(...)`).

**AC:**

- SDK once / open-with-URL / API error: unit tests exist (T5.6) and **20/20 pass**; not re-litigated here beyond T5.6 coverage run.
- SDK import only in `dodoOverlay.ts`: **git grep inconclusive** (untracked); mock string in test file matches pattern if tracked later.

**Result:** FAIL on Verify (`bun run verify` not green).

---

## T5.2 `usePurchase`

**Commands:**

- `bun run verify` → exit 1 (see T5.1).
- `grep setCredits apps/web/src/payments` → **no matches**.

**AC:** Behaviors delegated to T5.6 tests (pass). Poll constants in `constants.ts`.

**Result:** FAIL on Verify (`bun run verify`).

---

## T5.3 Pricing catalog

**Commands:**

- `cd apps/web && bunx vitest run src/composables/usePricingCatalog.test.ts src/components/Pricing/` → **5 files, 15 tests passed**.
- `bun run verify` → exit 1.
- No Razorpay in `usePricingCatalog.ts`, `PricingPacks.vue`.

**Result:** FAIL on Verify line only; implementation tests green.

---

## T5.4 Buy dialog and Profile payments

**Commands:**

- `bunx vitest run BuyMoreCreditsDialog.test.ts Payments.test.ts` → **2 files, 16 tests passed**.
- `grep -ni razorpay BuyMoreCreditsDialog.vue BuyMoreCreditsDialog.test.ts` → **none**.
- `cd apps/web && bun run test` → **191 files, 1042 tests passed**.
- `bun run verify` → exit 1.

**Result:** FAIL on Verify (`bun run verify` at root).

---

## T5.5 Return URL

**Evidence:** `PaymentReturn.vue` **absent** (`test -f` would fail). Builder N/A cites PLAN T0.3 overlay completion via status/webhook, not SPA return URL.

**Result:** PASS (N/A path).

---

## T5.6 Unit: web purchase

**Commands:**

- Scoped vitest+coverage per task → **3 files, 20 tests passed**.
- Coverage table: `dodoOverlay.ts` **85.29%** lines, **88.88%** branches, **87.5%** funcs (uncovered 44, 59–62); summary **94.44%** statements (all ≥80%).
- `grep test.fail|skip|only|fixme src/payments` → **none**.

**Note:** Engineer report claimed 100% per-file; verifier run shows dodoOverlay below 90% and only one file row in text reporter (aggregate still ≥80%).

**Result:** PASS (tests + ≥80% gates).

---

## T5.7 Unit: pricing UI

**Commands (T5.5 N/A command):**

- Vitest → **4 files, 28 tests passed**.
- Coverage: BuyMoreCreditsDialog 98.24% stmts / 95.34% branch; PricingPacks 96.96% / 94.44%; Payments 100% / 97.14%; `usePricingCatalog.ts` alone → **100%** all metrics.
- No skip/fail markers in scoped specs.

**Result:** PASS.

---

## T5.8 E2E: purchase credits

**Commands:**

- `bunx playwright test e2e/qa/billing-purchase.spec.ts --repeat-each=3` → **16 passed, 6 failed**.
- Failures (each failed all 3 repeats):
  - `@critical` Signed payment success grants credits + Profile row (timeout/assertion ~line 253).
  - `@critical` Duplicate webhook delivery is a no-op (credit poll `.toBe(creditsBefore + pack.credits)` ~line 295).
- Isolated `-g "Signed payment success" --repeat-each=1` → **passed once**; `--repeat-each=3` → **3/3 failed** (flakiness + AC requires 3 green).
- `-g "Duplicate webhook" --repeat-each=3` → **3/3 failed**.
- Spec has **7** `test()` blocks matching scenarios; no `.skip` / `test.fail`.

**Result:** FAIL.

---

## T5.9 E2E: payment history

**Commands:**

- `bunx playwright test e2e/qa/billing-history.spec.ts --repeat-each=3` → **13 passed** (4 scenarios × 3 + setup).
- No skip/fail markers.

**Result:** PASS (`e2e 12/12 scenario runs + setup`).

---

## Checkpoint 5

- `bun run test` (root) → **254 files, 1692 tests passed**.
- `bun run verify` → **exit 1**, 13 errors (payment test TS2345 on invalid `CreditPackId` literals like `'pack_120'`).
- Razorpay path still in repo (`utils/payment.ts`, etc.) — OK for checkpoint note.
- T5.8 **not** green `--repeat-each=3`; T5.6/T5.7 coverage gates met.

**Result:** FAIL.

---

## Code quality (phase files)

- `apps/web/src/payments/usePurchase.test.ts`: multiple **TS2345** — `'pack_120'` not assignable to `CreditPackId` (lines 58, 81, 97, 112, 127, 151, 152 per `bun run verify`). Fix: use valid catalog ids (e.g. `pack_200`) or typed constants.

No other concrete violations in reviewed `usePurchase.ts`, `checkoutClient.ts`, `dodoOverlay.ts`, `main.ts`.

---

## Engineer reports (sanity)

- T5.6/T5.7 unit reports claim PASS; verifier confirms tests pass but T5.6 coverage differs from claimed 100%.
- T5.8 e2e report **overstates** green; full `--repeat-each=3` fails.
- Builder T5.5 N/A aligns with absent `PaymentReturn.vue`.

---

## Overall: **FAIL**

Primary blockers: **`bun run verify` red**, **T5.8 e2e not stable/green at repeat-each=3** (signed success + duplicate webhook).
