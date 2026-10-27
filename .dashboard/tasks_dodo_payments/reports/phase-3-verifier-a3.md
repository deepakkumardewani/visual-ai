# Phase 3 verifier report (attempt a3)

Verdict: **FAIL** (one quality item in router.ts; every Verify command and coverage gate passes)

Scope: `dashboard.mjs scope ... "phase 3"` -> T3.1-T3.7 + Checkpoint 3 (L213-308).
Read: phase-3-verifier-a2.md, phase-3-builder-a3.md, T3.7-unit-a3.md.

## Commands run (key output)

- `bun run verify` -> exit 0, "Found 0 errors and 6 warnings in 586 files" (warnings pre-existing).
- T3.6 scoped coverage (verbatim Verify cmd) -> 5 files, 44 tests passed; Stmts 100% (75/75), Branch 100% (50/50), Funcs 100% (17/17), Lines 100% (75/75).
- T3.7 scoped coverage (verbatim Verify cmd) -> 3 files, 53 tests passed; All files 98.71/97.43/100/98.7; router.ts 97.87 stmts / 96.29 branch / 100 funcs / 97.87 lines (uncovered L14); env.ts, payment.ts 100%.
- `bunx vitest run routes/payments.test.ts routes/index.test.ts` -> 2 files, 10 tests passed.
- `cd apps/api && bunx vitest run` -> 56 files, 571 tests passed.
- `bun run test` -> 247 files, 1617 tests passed.
- `git diff apps/api/src/routes/index.ts` -> +import paymentsApiRouter; `router.use(paymentsRoute, Clerk)` -> `router.use(Clerk, paymentsApiRouter, paymentsRoute)`. No other router lines touched.
- SDK import grep (grep -rn, since payments/ files are untracked so `git grep` returns nothing) -> only `payments/dodo/client.ts:1`. Dep `dodopayments ^2.55.0` in apps/api/package.json.
- `grep -rnE "test\.fail|it\.fails|\.skip|\.only|\.fixme"` on payments/, env.test, payment.test, routes/payments.test, routes/index.test -> none.

## a2 issues - status

- A (duplicated "Payment provider request failed" literal in service.ts) -> FIXED: `PAYMENTS_MESSAGES.PROVIDER_REQUEST_FAILED` used at service.ts:39 and :105.
- B (untested production 404 path) -> tests now assert exact 404 + `{message}` for ForbiddenError/NotFoundError (router.test.ts:188-210). BUT achieved by changing production code in a fragile way, see issue C.

## Per task

- T3.1 PASS - mount order verified by index.test.ts; 401s per route in router.test.ts; diff limited to payments line + import.
- T3.2 PASS - issue A fixed; UnknownPackError + catalog-only provider args proven by T3.6 (service.test.ts) and router integration test.
- T3.3 PASS - SDK only behind dodo/client.ts; adapter ACs proven by adapter.test.ts incl. guard test.
- T3.4 PASS - env/model tests green, 100% coverage.
- T3.5 FAIL (quality, router.ts) - see C. All behavioural ACs proven by router.test.ts.
- T3.6 PASS - 44 tests, 100% on all 5 files, no skips.
- T3.7 FAIL - coverage passes (lowest 96.29% branches router.ts), but the unit engineer edited production router.ts to work around a test-harness problem (C).
- Checkpoint 3 - suites green (571 api / 1617 root); coverage gates met. Optional live Dodo session not run (no Clerk token). Advisor review is manual.

## Issue C (fix needed) - apps/api/src/payments/router.ts:12-20

```
function isCheckoutSessionNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    return (error.name === "ForbiddenError" || error.name === "NotFoundError") &&
        error.message === PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND
}
```

Problems:

1. Stringly-typed error matching: hard-codes the class names "ForbiddenError"/"NotFoundError" as magic strings (duplicating `this.name` in lib/errors.ts:41,51) and also couples on the exact message text. Renaming a class or rewording the message silently drops the 404 mapping. A cross-user ForbiddenError would then reach app.ts's handler as **403**, which leaks that the session exists.
2. Production code was changed only to suit a Vitest module-identity quirk (T3.7-unit-a3 calls it a "source bug", but production used `instanceof` correctly). The a2 report said to investigate the root cause, not work around it. Unit tasks should report source bugs, not reshape source to fit the harness.
3. It leaves a defensive dead branch (L14, the only uncovered line).

Fix (preferred, simplest; removes the problem entirely):

- service.ts:85: throw `NotFoundError(PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND)` for the cross-user case too, so missing and foreign sessions are identical and existence never leaks. Drop the `ForbiddenError` import if unused.
- router.ts: delete `isCheckoutSessionNotFoundError` and its branch in the status handler. Let the NotFoundError propagate; app.ts:96-99 maps it to `404 {error: "Checkout session not found"}`. Keep the ProviderApiError -> 502 branch.
- router.test.ts:188-210: assert exact `404` and `{ error: "Checkout session not found" }` (the test app's error handler mirrors app.ts). Update the integration test at :289 ("throws ForbiddenError when session belongs to another user") to expect NotFoundError. Update service.test.ts if it asserts ForbiddenError.
- Re-run the T3.6 + T3.7 scoped coverage commands; router.ts should reach 100%.
  Alternative: restore `instanceof` and fix the harness instead (e.g. move the `vi.importActual` service integration tests out of router.test.ts so only one errors.js instance loads). Only acceptable if the 404 body is asserted exactly and router.ts has no dead branch.

## Not verified

- Optional live Dodo test session (needs a Clerk token).
- Advisor review (manual).
