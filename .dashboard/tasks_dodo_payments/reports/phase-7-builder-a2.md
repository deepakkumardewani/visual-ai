# Phase 7 builder report (a2)

## T7.2 GATE — PASS (sanity re-run + Playwright fix)

### Verify commands

| Command                                                                                                              | Exit | Key output                               |
| -------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------- |
| `bun run test`                                                                                                       | 0    | Test Files 252 passed; Tests 1671 passed |
| `bun run verify`                                                                                                     | 0    | Found 0 errors and 6 warnings            |
| `cd apps/api && bunx vitest run`                                                                                     | 0    | 59 files, 600 tests passed               |
| `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts e2e/qa/billing-history.spec.ts --repeat-each=3` | 0    | 34 passed (after config fix)             |
| `cd apps/web && bun run test:e2e`                                                                                    | 0    | 98 passed, 3 skipped                     |

### Fix applied (gate regression)

- **`apps/web/playwright.config.ts`** — Moved `billing-history.spec.ts` into the `chromium-billing` project (with `billing-purchase.spec.ts`) and excluded both from `chromium`. The T7.2 Verify line runs both specs in one invocation; previously they ran in parallel projects and raced on the single E2E Clerk user (+200 credit drift).

### Notes

- Initial billing Verify runs failed intermittently (expected `creditsBefore + N`, received +200 extra) until billing specs were serialized.

---

## T7.3 WALKTHROUGH — FAIL

### Checklist

- Read `agent_docs/CHECKLIST_manual_steps.md` (226 lines): sections 0–H cover deployment modernization and Dodo env cutover only. **No Section I / Phase 7 run log with date, payment id, credits delta, or webhook replay observation.**

### API data confirmation (local dev Mongo)

- `MONGO_URI`: `mongodb://localhost:27017`
- Dodo payments: **300** rows, all `providerPaymentId` prefixed `pay_e2e_` (automated e2e), **0** real (non-e2e) Dodo payment ids.
- E2E user `E2E_CLERK_USER_ID`: **327** embedded dodo payments, all e2e ids; `credits` **52490** at query time.
- **Cannot corroborate** “real test-mode purchase credits +N exactly once; one row for payment id; replay adds no credit” on the database the running local API uses.

### T7.3 automated Verify (run anyway)

| Command                          | Exit | Key output |
| -------------------------------- | ---- | ---------- |
| Billing Playwright ×3            | 0    | 34 passed  |
| `cd apps/api && bunx vitest run` | 0    | 600 passed |

### Unblock

Perform the real test-mode purchase per `agent_docs/CHECKLIST_manual_steps.md`, **record the result and date there** (payment id, pack, credits before/after, webhook delivery + replay), then re-run /build-phases for Phase 7. If the purchase was against **staging** Atlas/API, either point local dev at that data for verification or repeat once against local with the public webhook URL from pre-flight.

---

## T7.4 DOD — not completed

Blocked on T7.3.

Draft audit notes (for orchestrator when T7.3 passes):

| Spec §12             | Evidence (existing)                                            |
| -------------------- | -------------------------------------------------------------- |
| 1 Plugin/MCP         | T0.1–T0.2 PLAN lines; phase 0 commit                           |
| 2 Products/env       | T1.1–T1.3; `apps/api/.env.example`                             |
| 3 Test-card purchase | **T7.3 manual** + T5.8/T5.9 e2e (@critical purchase scenarios) |
| 4 Rejected/tamper    | T4.x webhook tests; billing e2e invalid sig / duplicate        |
| 5 Automated suites   | T7.2 outputs                                                   |
| 6 Clerk auth         | T2.1 index tests; payments routes 401                          |
| 7 Razorpay removed   | T6.6 grep; `grep razorpay bun.lock` → 0                        |

**Dependencies:** API `dodopayments`; web `dodopayments-checkout`; `razorpay` removed from API `package.json` and lockfile.

**Commits:** `git log --oneline master..feature/payments` → 10 commits; `events.jsonl` has 11 `commit` events (phases 0–6 plus ancillary docs/commits).

---

## DECISIONS

- **T7.3 vs user message** · User stated walkthrough done ~30m ago · **FAIL per task rule** (checklist is source of truth; file has no dated run log) · Alternative: accept verbal confirmation (rejected — AC requires checklist record + API match).
- **T7.2 Playwright** · Parallel billing projects raced on shared user · Serial `chromium-billing` testMatch for both billing QA specs · Alternative: re-run until green (rejected after 4 failures with same +200 pattern).
