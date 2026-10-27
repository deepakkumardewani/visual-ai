# Phase 3 verifier report (attempt a4)

Verdict: **FAIL** — T3.1 / Checkpoint 3 missing legacy-route 401 supertests in `routes/payments.test.ts`.

Scope: T3.1–T3.7 + Checkpoint 3 (L213–308). Builder fix a4 (NotFoundError cross-user, router hack removed) verified.

## Commands run

| Command                                                                    | Result                                                                                                                                                                |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ------------------------------- | ---- |
| `cd apps/api && bunx vitest run routes/payments.test.ts`                   | 1 file, 7 passed                                                                                                                                                      |
| `git diff apps/api/src/routes/index.ts`                                    | +`paymentsApiRouter` import; `router.use(Clerk, paymentsApiRouter, paymentsRoute)`; other router lines unchanged                                                      |
| `bun run verify`                                                           | exit 0, 0 errors / 6 warnings                                                                                                                                         |
| `git grep -n "from 'dodopayments'" apps/api/src`                           | exit 1, no output (payments paths largely untracked); `grep -rn dodopayments apps/api/src` → only `payments/dodo/client.ts` + architecture guard in `adapter.test.ts` |
| `cd apps/api && bunx vitest run config/env.test.ts models/payment.test.ts` | 2 files, 32 passed                                                                                                                                                    |
| T3.6 scoped coverage (verbatim)                                            | 5 files, 44 passed; Stmts/Branch/Funcs/Lines 100%                                                                                                                     |
| T3.7 scoped coverage (verbatim)                                            | 3 files, 53 passed; Stmts 100% (72/72), Branch 100% (32/32), Funcs 100% (16/16), Lines 100% (71/71)                                                                   |
| `bun run test` (1st)                                                       | **FAIL** — `apps/api/src/lib/logger.test.ts:43` mockPino assertion (unrelated to Phase 3)                                                                             |
| `bun run test` (2nd)                                                       | 247 files, 1617 passed                                                                                                                                                |
| `cd apps/api && bunx vitest run`                                           | 56 files, 571 passed                                                                                                                                                  |
| `grep -rnE "test\.fail                                                     | it\.fails                                                                                                                                                             | \.skip | \.only | \.fixme" apps/api/src/payments` | none |

## Per task

### T3.1 — FAIL

- **AC:** Unauthenticated calls to every payments route return 401; proven via supertest in `routes/payments.test.ts` (task Do/Verify).
- **Observed:** `apps/api/src/routes/payments.test.ts` (200 lines) has zero 401/unauthenticated tests. It dispatches handlers directly without Clerk middleware. Mount order fix is present in `index.ts:25` and covered by `index.test.ts:56`, but that does not prove 401 on legacy routes.
- **Fix:** Add supertest (or equivalent) against app/router with Clerk mock returning 401 for unauthenticated requests for all four legacy routes: `POST /payments`, `GET /payments/:id`, `POST /payments/order/create`, `POST /payments/verify-payment`.

### T3.2 — PASS

- `bun run verify` green. T3.6 proves UnknownPackError and catalog-only provider args.

### T3.3 — PASS

- `bun run verify` green. SDK import only under `payments/dodo/client.ts`; T3.6 architecture guard passes.

### T3.4 — PASS

- 32 tests green; env fail-fast and model defaults covered at 100% in T3.7 scoped run.

### T3.5 — PASS

- `routes/payments.test.ts` green; `bun run verify` green; `bun run test` green on re-run. T3.7 proves all behavioural ACs including NotFoundError → 404 for cross-user session (no router string hack). `router.ts` reviewed: ProviderApiError → 502 only; NotFoundError propagates.

### T3.6 — PASS

- 44/44 tests; 100% coverage on all five Files.

### T3.7 — PASS

- 53/53 tests; 100% coverage on router.ts, env.ts, payment.ts; no skip/fail markers.

### Checkpoint 3 — FAIL

- API vitest 571/571 green; T3.6/T3.7 coverage gates met; `bun run test` green on re-run (one flaky logger failure on first run).
- **AC:** “401 test covers every payments route” — only new Dodo routes (3) have 401 tests in `router.test.ts`; legacy four routes lack 401 tests (same gap as T3.1).
- Optional live Dodo session: not run (no Clerk token). Advisor review: manual.

## Code quality (Phase 3 files)

- a3 issue C **resolved**: `service.ts:85-86` throws `NotFoundError`; `router.ts` has no `isCheckoutSessionNotFoundError`.
- No concrete hygiene/correctness violations in scoped source files on review.

## Builder a4

Confirmed: cross-user status uses NotFoundError; router hack removed; T3.7 router.ts at 100% coverage.
