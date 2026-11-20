# Phase 4 verifier report (a1) — Webhook and idempotent grant

Result: **FAIL**

## Commands run (apps/api unless noted)

| Command                                                                       | Result                                                                                                                                                                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bunx vitest run payments/dodo/`                                              | 4 files, 30 tests passed                                                                                                                                                 |
| `bunx vitest run payments/applyEvent.test.ts`                                 | 1 file, 21 tests passed                                                                                                                                                  |
| `bunx vitest run payments/webhookRouter.test.ts webhook/`                     | 2 files, 15 tests passed                                                                                                                                                 |
| T4.4 scoped coverage command (verbatim from TASKS)                            | 7 files, 79 tests passed; All files 99.45 stmts / 99.22 branch / 100 funcs / 99.45 lines; only row below 100: service.ts 98.96 / 98.27 / 100 / 98.96, uncovered line 195 |
| `bun run test` (repo root)                                                    | 251 files, 1664 tests passed                                                                                                                                             |
| `bun run verify` (repo root)                                                  | **exit 1 — 5 errors**, all in Phase 4 spec files                                                                                                                         |
| `grep -rnE "test\.fail\|it\.fails\|\.skip\|\.only\|\.fixme"` on Phase 4 specs | no matches                                                                                                                                                               |

### `bun run verify` errors (all must be fixed)

1. `apps/api/src/payments/dodo/adapter.test.ts:226` TS2339 `webhooks` does not exist on mock client type `{ checkoutSessions: ... }`.
2. `apps/api/src/payments/dodo/adapter.test.ts:247` same TS2339.
3. `apps/api/src/payments/dodo/adapter.test.ts:252` same TS2339.
   Fix: add `webhooks: { unwrap: vi.fn() }` to `makeMockClient()` (or type the mock as a partial DodoClient) instead of assigning a property post-hoc.
4. `apps/api/src/payments/webhookRouter.test.ts:164` TS2677 type predicate `handle is ErrorMiddleware` not assignable to the layer handle type.
5. `apps/api/src/payments/webhookRouter.test.ts:175` TS2554 expected 3 args, got 4 (consequence of #4).
   Fix: cast the found handle (`as unknown as ErrorMiddleware`) rather than a type predicate, or export the error middleware as a named function and test it directly.

T4.1, T4.3 Verify lines and Checkpoint 4 / PLAN Checkpoint 4 all require `bun run verify` green → FAIL.

## Per task

### T4.1 Event mapper and signature verification — FAIL (verify red)

- AC invalid/missing/stale signature → InvalidSignatureError: verify.test.ts passes with real signing (30 tests in payments/dodo/). OK.
- AC succeeded/failed map, unknown → null: eventMapper.test.ts passes. OK.
- Verify `bun run verify`: FAIL (errors 1-3 above, adapter.test.ts).
- Scope: `apps/api/src/payments/dodo/client.ts` modified (adds `webhookKey`) but not in T4.1 Files. Needed functionally; log under DECISIONS / add to Files, otherwise it is an out-of-scope edit.
- Quality: `adapter.ts` `catch { throw new InvalidSignatureError() }` discards the underlying error; pass it as `cause` (or log at debug with webhookId) so non-signature unwrap failures (e.g. malformed JSON) are diagnosable.

### T4.2 applyEvent with atomic idempotent grant — FAIL

- AC "10 concurrent deliveries (Promise.all) grant once": `applyEvent.test.ts:104-120` fires **3** deliveries, not 10. Also the test is tautological: the mock itself decides only the first call modifies, so it proves nothing about the guard. Fix: 10 deliveries AND assert the `User.updateOne` filter contains the completed-payment guard (`payments: { $not: { $elemMatch: { providerPaymentId, status: "completed" } } }`) and `$inc` is in the same call.
- AC "Same payment id twice grants once / new webhook-id same payment id grants once": `applyEvent.test.ts:122-128` only asserts `updateOne` called twice with mocked results; no test anywhere asserts the idempotency filter (grep for `elemMatch` in applyEvent.test.ts: 0 matches). The money-path guard is untested. Fix: assert the filter object on both calls.
- AC "Wrong amount, currency, or **pack** grants nothing and logs at **error** level": unknown pack logs at `warn` (`service.ts:284-289`), and the test asserts warn (`applyEvent.test.ts:218-224`). Fix: log unknown pack at error (missing packId with a known user is also a data-integrity error; consider error there too) and update the test.
- AC failed-then-succeeded / succeeded-then-failed: covered by tests at :150 and :168 (mock-driven); OK given guard implementation, but see guard-assertion gap.
- AC session id → pending row becomes completed/failed: `syncCheckoutPaymentRow` updates by providerSessionId; test at :69. OK.
- AC logs contain webhookId/paymentId/userId, no signature: test at :198. OK.
- Verify: applyEvent tests 21 passed; `bun run test` green.
- Quality (service.ts):
  - DRY: `applyEvent` PAYMENT_FAILED branch (service.ts:310-322) duplicates `recordFailedOutcome`'s guarded `$push` + `syncCheckoutPaymentRow` (service.ts:233-240). Extract one `recordFailedPayment(event, pack)` used by both (mismatch path just adds the error log).
  - Redundant branching: `status` is computed at :309 via `paymentStatusForEventType`, then the code branches on `event.type` at :310 and on `status` at :325. Pick one discriminator.
  - Double error logging on mismatch: :295 logs "Webhook amount or currency mismatch" and `recordFailedOutcome` (:228) logs "Webhook payment validation failed" for the same event. Keep one.
  - Dead code: `syncCheckoutPaymentRow` `if (!event.userId) return` (:194-196) is unreachable (applyEvent returns earlier on missing userId) — this is the only uncovered branch and breaks T4.4's "100% branch for applyEvent" AC. Remove it (or narrow the type so userId is `string`).
  - `applyEvent` is ~65 lines (:263-328); exceeds the ~30-line function guideline. Split validation (user/pack/amount) from dispatch.
  - `asParsedEvent` (:127-129) is an unchecked cast hiding a type gap (builder DECISION: did not edit `types.ts`). Acceptable only if logged as a decision; prefer adding the optional fields to `NormalizedPaymentEvent`.

### T4.3 Webhook router and mount — FAIL (verify red)

- AC signed body 200 + duplicate no-op, bad signature 401 no DB call, 413 over limit, 500 on transient error: webhookRouter.test.ts passes (15 tests with webhook/). OK.
- AC `/webhooks/clerk` still works: `webhook/` tests pass. OK.
- Mount: `app.ts:76` mounts `paymentsWebhookRouter` before `express.json()` at :86. OK.
- Verify `bun run verify`: FAIL (errors 4-5, webhookRouter.test.ts).
- Quality: error-middleware check uses inline magic string `"entity.too.large"` (webhookRouter.ts:49); hoist to a named constant.

### T4.4 Unit: webhook — FAIL

- Coverage (my run): eventMapper.ts, adapter.ts, webhookRouter.ts 100% all metrics; service.ts lowest **98.27% branches**, 98.96% lines/stmts, 100% funcs; uncovered line 195.
- AC "100% branch coverage for applyEvent in service.ts": NOT met — line 195 is in `syncCheckoutPaymentRow`, called only by applyEvent's paths. Engineer justified it as defensive; justification is that it's dead code → remove it (see T4.2) and the AC is met.
- AC every file ≥80%: met (lowest 98.27%).
- AC no `it.fails`: met (grep clean).
- "Real HMAC signing, no mocked verification": `adapter.test.ts:224-254` (added in this phase) mocks `client.webhooks.unwrap`; it is a header-normalisation test, tolerable, but it is also the source of the TS errors 1-3.
- Engineer report T4.4-unit-a1.md claims PASS; it did not run `bun run verify` and missed the 5 type errors it introduced.

### Checkpoint 4 — FAIL / INCONCLUSIVE

- API suite green incl. concurrent duplicate + real-signature tests: suite green, but the "concurrent duplicate" test is 3 deliveries and tautological (see T4.2).
- T4.4 coverage gate met: not met (service.ts branch 98.27%).
- Advisor audit of Phase 3-4 diff vs Spec section 6: no evidence found in PLAN "Gate results and build evidence"/Checkpoint 4 or reports. Not verifiable by me.
- Real webhook delivery deferred to T7.3 / signed e2e in T5.8: noted, nothing to verify.
- PLAN Checkpoint 4 requires `bun run verify` green: FAIL.

## Required fixes (builder retry list)

1. Fix 5 TS errors in `dodo/adapter.test.ts` (226, 247, 252) and `webhookRouter.test.ts` (164, 175); re-run `bun run verify` to green.
2. applyEvent.test.ts: concurrency test with 10 deliveries; assert the idempotency guard filter and `$push`+`$inc` in one `updateOne` for duplicate / new-webhook-id cases.
3. service.ts: unknown pack logs at error level (update test); dedupe failed-record path; single type discriminator; single mismatch error log; remove dead `!event.userId` guard in `syncCheckoutPaymentRow`; split `applyEvent`.
4. adapter.ts: preserve cause on `InvalidSignatureError` from unwrap.
5. webhookRouter.ts: name the `"entity.too.large"` constant.
6. Record `client.ts` edit (out of T4.1 Files) under DECISIONS.
7. Re-run T4.4 coverage: service.ts must reach 100% branches.
