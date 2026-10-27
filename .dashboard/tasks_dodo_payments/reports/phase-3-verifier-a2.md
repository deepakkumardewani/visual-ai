# Phase 3 verifier report (attempt a2)

Verdict: **FAIL** (two small quality items; every Verify command passes)

Scope loaded via `dashboard.mjs scope` (Phase 3 L213-308, T3.1–T3.7 + Checkpoint 3).

## Commands run (key output)

| Command                                                        | Result                                                                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------------- | ---- |
| `bun run verify` (root)                                        | exit 0 — "Found 0 errors and 6 warnings in 586 files" (warnings pre-existing, unrelated files)                                      |
| T3.6 scoped coverage (verbatim)                                | 5 files, 44 tests passed; Stmts 100% (75/75), Branch 100% (50/50), Funcs 100% (17/17), Lines 100% (75/75)                           |
| T3.7 scoped coverage (verbatim)                                | 51 tests passed; router.ts 95.45% stmts / 95.83% branch / 100% funcs / 95.45% lines (uncovered 82-83); env.ts, payment.ts 100%      |
| `bunx vitest run routes/payments.test.ts routes/index.test.ts` | 2 files, 10 tests passed                                                                                                            |
| `cd apps/api && bunx vitest run`                               | 56 files, 569 tests passed                                                                                                          |
| `bun run test`                                                 | 247 files, 1615 tests passed                                                                                                        |
| `git diff apps/api/src/routes/index.ts`                        | import + `router.use(paymentsRoute, Clerk)` -> `router.use(Clerk, paymentsApiRouter, paymentsRoute)`; no other router lines changed |
| Grep `dodopayments` in apps/api/src                            | only `payments/dodo/client.ts` (+ guard test `adapter.test.ts`)                                                                     |
| Grep `test.fail                                                | it.fails                                                                                                                            | .skip( | .only( | .fixme` on phase specs | none |

## Previous fix list (a1) — status

1. TS2345 in router.test.ts — FIXED (verify exit 0).
2. Single Clerk mount + index.test.ts updated — FIXED.
3. Tautological 401 block in routes/payments.test.ts — REMOVED.
4. `asProviderApiError` helper, `MINOR_UNITS_PER_MAJOR`, `DODO_API_PAYMENT_STATUS` — FIXED.
5. `getUserIdOrRespondUnauthorized`, `PAYMENTS_MESSAGES` — FIXED.
6. Payment collection vs User.payments — logged as DECISION in phase-3-builder-a2.md (Phase 4 must update the Payment row). Accepted; advisor to confirm.
7. Razorpay lazy client + verify-payment 503 without secret — FIXED (routes/payments.ts, out-of-Files edit logged).

## Per task

- T3.1 PASS — 401 proven by index.test.ts mount order `["clerk-auth","paymentsApiRouter","paymentsRoute"]` + router.test.ts in-handler 401s; existing tests green; diff limited to payments line + import.
- T3.2 FAIL (quality) — see issue A. ACs proven by T3.6 (UnknownPackError, catalog-only provider args).
- T3.3 PASS — dodopayments dep present, SDK only in dodo/client.ts, adapter uses constants + shared wrap helper; verify green.
- T3.4 PASS — env/model tests pass; Razorpay optional at boot now real.
- T3.5 PASS on ACs; router branch issue tracked under T3.7 (issue B).
- T3.6 PASS — 100% on all 5 files, 44 tests, guard test present, no skips.
- T3.7 FAIL — issue B.
- Checkpoint 3 — suites green (569 / 1615); coverage gates met numerically. Optional real Dodo session not run (no Clerk token). Advisor review manual.

## Issues (fix needed)

### A. `apps/api/src/payments/service.ts:39` and `:105` — duplicated magic string

`asProviderApiError(error, "Payment provider request failed")` appears twice with the same literal. Add `PROVIDER_REQUEST_FAILED: "Payment provider request failed"` to `PAYMENTS_MESSAGES` in constants.ts and use it in both places.

### B. `apps/api/src/payments/router.test.ts:187-200` + `router.ts:81-84` — production 404 path never tested

The cross-user test uses `vi.importActual("./service.js")`, which loads a second copy of `lib/errors.js`. The service's `ForbiddenError` is therefore not `instanceof` the router's `ForbiddenError`, so the router's `catch` branch (lines 81-84, the only uncovered lines) is skipped and the test-local error handler answers `403 {error}`. In production the identity matches, so the real response is `404 {message: "Checkout session not found"}`, a shape no test asserts. The test hides this by accepting `[403, 404]` and `message ?? error`. The a1 verifier asked for this to be tightened, and it was not.
Fix (pick one):

- (preferred, simplest) Add router-level tests that mock the service with errors imported statically from `../lib/errors.js` (the same module instance the router uses), for example `vi.mocked(service.getCheckoutSessionStatus).mockRejectedValue(new ForbiddenError(PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND))` and the same with `NotFoundError`. Assert exactly `404` and `{ message: "Checkout session not found" }`. Keep the importActual tests as the service integration path. If the engineer's claim holds that this still returns 403, that points to a real module-identity problem, so investigate it instead of skipping it.
- or remove the router's ForbiddenError/NotFoundError catch, have the service throw `NotFoundError` for both the missing and the cross-user case (so session existence never leaks), let the app error handler map it, and assert the exact status and body.
  Either way, router.ts should reach 100% or have no dead branch, and the test should assert a single status and body shape.

## Not verified

- Optional live Dodo test session (needs Clerk token).
- Advisor review (manual).
