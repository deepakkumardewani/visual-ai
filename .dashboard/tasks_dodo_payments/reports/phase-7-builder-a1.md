# Phase 7 builder report (a1)

## T7.2 GATE — PASS (with gate fixes)

### Verify commands (final run)

| Command                                                                                                              | Exit | Key output                               |
| -------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------- |
| `bun run test`                                                                                                       | 0    | Test Files 252 passed; Tests 1671 passed |
| `bun run verify`                                                                                                     | 0    | Found 0 errors and 6 warnings            |
| `cd apps/api && bunx vitest run`                                                                                     | 0    | 59 files, 600 tests passed               |
| `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts e2e/qa/billing-history.spec.ts --repeat-each=3` | 0    | 34 passed                                |
| `cd apps/web && bun run test:e2e`                                                                                    | 0    | 98 passed, 3 skipped                     |

### Gate fixes applied (not in T7.2 Files — required for green suite)

1. **`apps/web/e2e/marketing.spec.ts`** — Route stub targets `${API_URL}/users/contact` (cross-origin), fixing contact failure e2e.
2. **`apps/web/src/utils/helpers.ts`** — `contactForm` throws when `response.ok` is false (500 without fetch error).
3. **`apps/web/src/utils/helpers.test.ts`** — Mocks include `response.ok`; new test for non-ok without fetch error.
4. **`apps/web/playwright.config.ts`** — `chromium` project `workers: 1`, `fullyParallel: false` (shared real API + one Clerk user; matches billing project).

### Notes

- First `bun run test` hit flaky `apps/api/src/lib/logger.test.ts` (pino mock order); passed on retry without code change.
- Billing credit assertion failed once under parallel load; passed on re-run.

---

## T7.3 WALKTHROUGH — FAIL

**Reason:** `agent_docs/CHECKLIST_manual_steps.md` has no dated record of a real test-mode Dodo card purchase, webhook delivery/replay, or observed credits/payment row (sections H1–H4 are env cutover only; no Phase 7 run log).

**Unblock:** Perform the real test-mode purchase per `agent_docs/CHECKLIST_manual_steps.md`, record the result and date there, then re-run /build-phases for Phase 7.

Automated Verify for T7.3 was **not** run (blocked on manual prerequisite).

---

## T7.4 DOD — not started

**Blocked:** dependency T7.3 incomplete.

---

## DECISIONS

- **T7.2** · Gate failures in marketing contact e2e and parallel profile timeouts · Fixed stub + `contactForm` ok check + serial chromium workers · Alternative: only re-run flaky suite (rejected — verify requires consistent green).
