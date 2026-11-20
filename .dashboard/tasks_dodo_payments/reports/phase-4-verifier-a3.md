# Phase 4 verifier report (a3): Webhook and idempotent grant

Result: **PASS**. All Verify commands green; all four a2 quality issues (Q1-Q4) are fixed.

## Commands run (apps/api unless noted)

| Command                                                                                                                  | Result                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `bunx vitest run payments/dodo/`                                                                                         | 4 files, 29 passed (was 30; the dead `paymentStatusForEventType` test was removed per Q3)                                     |
| `bunx vitest run payments/applyEvent.test.ts`                                                                            | 1 file, 21 passed                                                                                                             |
| `bunx vitest run payments/webhookRouter.test.ts webhook/`                                                                | 2 files, 15 passed                                                                                                            |
| T4.4 scoped coverage (verbatim Verify)                                                                                   | 7 files, 78 passed; 100% stmts 180/180, branches 125/125, funcs 28/28, lines 180/180 (per-file table empty = every file 100%) |
| `bun run test` (root)                                                                                                    | exit 0; 251 files, 1663 passed                                                                                                |
| `bun run verify` (root)                                                                                                  | exit 0; 0 errors, 6 warnings, none in apps/api/src/payments                                                                   |
| `grep -rnE "test\.fail\|it\.fails\|\.skip\|\.only\|\.fixme"` on dodo/\*.test.ts, applyEvent, webhookRouter, service.test | no matches                                                                                                                    |

## Regression check against verifier a2

| a2 item                             | Status                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 failed/mismatch idempotency      | fixed: `noExistingPaymentGuard` (service.ts:188-198) used by `recordFailedPayment` (:234-243); success path keeps `completedPaymentGuard`, so failed-then-succeeded still grants and succeeded-then-failed is a no-op. Tests applyEvent.test.ts:299-339 assert the filter and simulate first-write/then-no-op (no longer tautological). |
| Q2 duplicate body-limit constant    | fixed: only `PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES` remains (dodo/constants.ts:2), used by webhookRouter.ts:19 and its 413 test                                                                                                                                                                                                             |
| Q3 dead `paymentStatusForEventType` | fixed: no references left in apps/api/src                                                                                                                                                                                                                                                                                               |
| Q4 redundant param                  | fixed: `dispatchWebhookPayment(parsed, pack)` (service.ts:297)                                                                                                                                                                                                                                                                          |

## Per task

- T4.1 PASS: invalid/missing/stale signature -> InvalidSignatureError via real signing in verify.test.ts; succeeded/failed map to NormalizedPaymentEvent, unknown -> null.
- T4.2 PASS: each pack, duplicate, 10 concurrent, new-webhook-id, mismatch at error level, failed->succeeded, succeeded->failed, session-id row update, log context all covered in 21 tests.
- T4.3 PASS: 200 + grant once, duplicate no-op, 401 no DB, 413, 500, /webhooks/clerk (15 tests).
- T4.4 PASS: 100% on all 4 files, all metrics; no it.fails. T4.4-unit-a3 report matches my run (78 tests, 125/125 branches).

## Checkpoint 4

- API suite green incl. concurrent duplicate + real-signature tests; T4.4 gate met: yes.
- SPEC §6 audit: present in PLAN_dodo_payments.md "Checkpoint 4 notes (2026-10-20, builder a3)" (§6.1-6.9 all PASS). I spot-checked items 1, 2, 5, 9 against the code and they hold. Note: the audit was written by the builder, not a separate advisor; PLAN was already dirty at the orchestrator snapshot so it won't be staged by the phase commit — orchestrator should confirm it is acceptable.
- Real tunnel delivery deferred to T7.3/T5.8: nothing to verify.

## Not blocking (noted)

- service.ts:206-217 `rowUpdate` still repeats ~8 fields of `buildEmbeddedPaymentRecord` (:152-173) (carried over from a2's non-blocking note).
- Failed-then-succeeded leaves both a failed and a completed embedded row for one payment id; acceptable under the AC, but Phase 5 history should display by latest status.
