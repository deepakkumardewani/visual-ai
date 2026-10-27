# Phase 4 verifier report (a2): Webhook and idempotent grant

Result: **FAIL**. Every Verify command is green. The failure comes from 4 concrete code-quality and correctness issues in service.ts, eventMapper.ts and dodo/constants.ts.

## Commands run (apps/api unless noted)

| Command                                                                                                                  | Result                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bunx vitest run payments/dodo/`                                                                                         | 4 files, 30 passed                                                                                                                                      |
| `bunx vitest run payments/applyEvent.test.ts`                                                                            | 1 file, 21 passed                                                                                                                                       |
| `bunx vitest run payments/webhookRouter.test.ts webhook/`                                                                | 2 files, 15 passed                                                                                                                                      |
| T4.4 scoped coverage (verbatim)                                                                                          | 7 files, 79 passed; summary 100% stmts 180/180, branches 127/127, funcs 28/28, lines 180/180 (every file 100%, so the table is empty)                   |
| `bun run test` (root)                                                                                                    | exit 0; 251 files, 1664 tests passed                                                                                                                    |
| `bun run verify` (root)                                                                                                  | exit 0; 0 errors, 6 warnings (all in files outside Phase 4: email-notification-service.test, generation-service.test, web logger.test, web router test) |
| `grep -rnE "test\.fail\|it\.fails\|\.skip\|\.only\|\.fixme"` on dodo/\*.test.ts, applyEvent, webhookRouter, service.test | no matches                                                                                                                                              |

## Regression check against verifier a1

| a1 item                                                            | Status                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 5 TS errors (adapter.test 226/247/252, webhookRouter.test 164/175) | fixed (verify exit 0)                                                                    |
| 10 concurrent deliveries + guard filter assertion                  | fixed (applyEvent.test.ts:118-137, asserts filter + $push/$inc on every call)            |
| new webhook-id asserts guard filter                                | fixed (:139-152)                                                                         |
| unknown pack at error level                                        | fixed (service.ts:274)                                                                   |
| dead `!event.userId` in syncCheckoutPaymentRow                     | removed; service.ts 100% branches                                                        |
| single mismatch log                                                | fixed (recordFailedPayment no longer logs)                                               |
| failed-record DRY                                                  | fixed (`recordFailedPayment`)                                                            |
| applyEvent split                                                   | fixed (resolveWebhookGrant / dispatchWebhookPayment)                                     |
| unwrap cause preserved                                             | fixed (adapter.ts `{ cause: error }`; errors.ts accepts options, logged under DECISIONS) |
| `"entity.too.large"` constant                                      | fixed (webhookRouter.ts:13)                                                              |
| client.ts outside Files                                            | logged under DECISIONS in builder a2                                                     |

## Per task

### T4.1: PASS on Acceptance and Verify; quality issue Q2 is in this task's files

- Invalid, missing or stale signature throws InvalidSignatureError: verify.test.ts uses real signing; 30 pass.
- succeeded/failed map to NormalizedPaymentEvent and unknown maps to null: eventMapper.test.ts passes.
- `bun run verify` green.

### T4.2: Acceptance met, but FAIL on quality (Q1, Q3, Q4)

- Each pack grants exactly its credits (:94). Duplicate, 10 concurrent and new-webhook-id cases are tested with the guard filter asserted. Mismatch logs at error. Failed-then-succeeded and succeeded-then-failed are tested. Session id updates the pending row. Log context is tested. Verify commands green.

### T4.3: PASS on Acceptance and Verify

- 200 + grant once, duplicate no-op, 401 with no DB call, 413, 500, and /webhooks/clerk all pass (15 tests). app.ts mounts paymentsWebhookRouter before express.json.
- Quality issue Q2 (the duplicated body-limit constant) is consumed here.

### T4.4: PASS

- Coverage is 100% on all 4 files and all metrics, so the applyEvent branch AC is met. No it.fails. Engineer report T4.4-unit-a2 matches my run.

### Checkpoint 4: FAIL / INCONCLUSIVE

- API suite green and coverage gate met: yes.
- "Advisor audits the Phase 3-4 diff against Spec section 6": no audit evidence in PLAN "Gate results and build evidence" or in any report. I cannot verify this; the orchestrator or user must do it.
- Real webhook delivery deferred to T7.3 and T5.8: nothing to verify.

## Quality violations (builder retry list)

**Q1 (correctness, money-path idempotency): service.ts:221-230 and :175-186.**

- `recordFailedPayment` uses `completedPaymentGuard`, which only blocks when a _completed_ row exists.
- So a duplicate `payment.failed` delivery, or a re-delivered amount-mismatch event, pushes a second failed row into `user.payments` and re-syncs the Payment row. That breaks T4.3's "Duplicate: 200 no-op", and Phase 5 history would show duplicate failed rows.
- The test "skips checkout sync when payment.failed is a duplicate delivery" (applyEvent.test.ts:291) is tautological. It mocks `modifiedCount: 0`, which the real guard would never return for a repeated failed event.
- Fix: for failed outcomes, guard on "no row with this providerPaymentId" (`$elemMatch: { providerPaymentId }` with no status). Success must still be allowed after a failure: either `$set` the existing failed row to completed with `arrayFilters`, or keep the completed-only guard on the success path.
- Then assert the failed-path filter in the test instead of mocking the outcome.

**Q2 (DRY): dodo/constants.ts:2 and :4.**

- `PAYMENTS_WEBHOOK_BODY_LIMIT = "256kb"` and `PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES = 256 * 1024` are two sources of truth for one value.
- Fix: keep only the bytes constant. `express.raw({ limit })` accepts a number, so webhookRouter.ts:19 can use it directly.

**Q3 (dead export): dodo/eventMapper.ts:81-87.**

- `paymentStatusForEventType` is no longer used by production code; only eventMapper.test.ts:72-73 calls it after builder a2 removed its use in service.ts.
- Fix: delete it and its test.

**Q4 (redundant parameter): service.ts:284-288 and :322.**

- `dispatchWebhookPayment(parsed, pack, event)` receives the same object twice: `parsed` is just `asParsedEvent(event)`.
- Fix: pass only `parsed`, which is a superset of `event`, and drop the third parameter.

## Not blocking (noted)

- service.ts:193-204 `rowUpdate` repeats 8 fields from `buildEmbeddedPaymentRecord` (:157-172). Consider deriving one from the other while fixing Q1.
- Missing packId with a known user still logs at warn (:268). The AC only requires error level for an unknown pack, so this is acceptable.
