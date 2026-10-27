# Phase 3 verifier report (attempt a1)

Verdict: **FAIL**

Scope loaded fresh via `dashboard.mjs scope` (Phase 3 L213-308, T3.1–T3.7 + Checkpoint 3).

## Commands run (key output)

| Command                                                                                            | Result                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cd apps/api && bunx vitest run routes/payments.test.ts config/env.test.ts models/payment.test.ts` | 3 files, 44 tests passed                                                                                                                                          |
| T3.6 scoped coverage command (verbatim from TASKS)                                                 | 5 files, 44 tests passed; Stmts 100% (79/79), Branch 100% (60/60), Funcs 100% (16/16), Lines 100% (79/79)                                                         |
| T3.7 scoped coverage command (verbatim from TASKS)                                                 | 3 files, 51 tests passed; router.ts 95.23% stmts / 95.45% branch / 100% funcs / 95.23% lines (uncovered 75-76); env.ts and payment.ts 100% (hidden as full)       |
| `cd apps/api && bunx vitest run`                                                                   | 56 files, 574 tests passed                                                                                                                                        |
| `bun run test`                                                                                     | 247 files, 1620 tests passed                                                                                                                                      |
| `bun run verify`                                                                                   | **exit 1 — "Found 6 warnings and 1 error"**                                                                                                                       |
| `git diff apps/api/src/routes/index.ts`                                                            | import added; `router.use(paymentsRoute, Clerk)` replaced by `router.use(Clerk, paymentsApiRouter)` + `router.use(Clerk, paymentsRoute)`; other routers unchanged |
| `rg dodopayments apps/api/src` (git grep misses untracked files)                                   | only `payments/dodo/client.ts` imports it (plus the guard test in `adapter.test.ts`)                                                                              |
| `grep test.fail/it.fails/.skip/.only/.fixme` on `apps/api/src/payments/**/*.test.ts`               | none                                                                                                                                                              |
| `node -e "new (require('razorpay'))({key_id:undefined})"`                                          | throws "`key_id` or `oauthToken` is mandatory"                                                                                                                    |

### The `bun run verify` error

```
x typescript(TS2345): Argument of type '{ _id: string; userId: string; createdAt: string; }[]'
  is not assignable to parameter of type '(FlattenMaps<{ amount: number; createdAt: Date; ... }>)[]'
  ,-[apps/api/src/payments/router.test.ts:173:70]
```

`vi.mocked(service.listPaymentsForUser).mockResolvedValue(rows)` — the fixture rows don't match the lean Payment type (`createdAt` is a string, required fields missing). Fix: type the fixture properly (e.g. build full rows with `createdAt: new Date(...)` and required fields, or cast via `as unknown as Awaited<ReturnType<typeof service.listPaymentsForUser>>`). The 6 warnings are pre-existing in unrelated files.

## Per task

### T3.1 — Clerk auth mount order — FAIL (quality)

- AC1 unauthenticated 401: structurally proven by `routes/index.test.ts` (`["clerk-auth","paymentsApiRouter"]`, `["clerk-auth","paymentsRoute"]`). OK.
- AC2 existing authenticated tests pass: yes (44/44).
- AC3 diff only the payments line: yes (plus import and the T3.5 mount).
- Quality:
  - `apps/api/src/routes/payments.test.ts` new "Clerk auth mount order" block: `dispatchWithAuth` manually chains the mocked `ClerkExpressRequireAuth` in front of `paymentsRoute`. It never touches `routes/index.ts`, so it passes against the old buggy mount too — it is not the "failing test first" the task asked for and proves nothing about mount order. Fix: either delete it (index.test.ts is the real proof) or make it a supertest against `router` from `routes/index.ts` with only the Clerk middleware mocked.
  - `apps/api/src/routes/index.ts:25-26`: `ClerkExpressRequireAuth({})` instantiated twice, so legacy payments requests that fall through `paymentsApiRouter` are authenticated twice. Fix: `router.use(ClerkExpressRequireAuth({}) as any, paymentsApiRouter, paymentsRoute)` (single mount; update index.test.ts accordingly).

### T3.2 — Port, constants, errors, service — FAIL

- Verify `bun run verify`: exit 1 (error above, from T3.7's spec; the whole phase cannot pass verify).
- AC (proven by T3.6): unknown pack → `UnknownPackError` (service.test.ts:57), catalog-only provider call (service.test.ts:64, router.test.ts:271). OK.
- Quality: `apps/api/src/payments/service.ts:36-44` and `:108-116` are identical "rethrow ProviderApiError else wrap with fallback message" blocks; the same pattern appears again in `dodo/adapter.ts:54-61` and `:76-80`. Four copies → extract one helper (e.g. `toProviderApiError(error, fallbackMessage)` in `errors.ts`) and use it everywhere. Also `service.ts:53` `pack.priceMinor / 100` is a magic number — name it (e.g. `MINOR_UNITS_PER_MAJOR`).

### T3.3 — Dodo adapter — FAIL (verify only)

- `dodopayments@^2.55.0` added to apps/api/package.json; SDK imported only in `payments/dodo/client.ts`. OK.
- AC proven by T3.6 adapter tests (product id/env, metadata, return_url, ProviderApiError redaction, architecture guard). OK.
- Verify `bun run verify` fails (see above).
- Quality: `dodo/adapter.ts:12,15` raw Dodo status strings `"succeeded" | "paid" | "failed" | "cancelled"` — move to named constants. Duplicated wrap logic (see T3.2).

### T3.4 — Env + payment model — FAIL

- `cd apps/api && bunx vitest run config/env.test.ts models/payment.test.ts`: pass. AC1–AC3 covered.
- Scope: `apps/api/src/models/payment.ts:12-15` adds a `userId` field (indexed). Spec 5.4 does not list it; the task says "if a schema change beyond it is needed, make no change and FAIL with the needed change under DECISIONS". Not logged under DECISIONS. Related design concern for the builder/advisor: `PaymentSchema` is embedded in `User.payments` (user.ts:37) and spec 5.5 grants via `User.updateOne(... payments.providerPaymentId ...)`, but `service.createCheckout` writes pending rows to the standalone `Payment` collection and `getCheckoutSessionStatus` / `listPaymentsForUser` read that collection. Once Phase 4 writes completed records into `User.payments`, the status endpoint's "DB record wins" path and `GET /payments` will not see them. Either store the pending record in `User.payments` (no `userId` needed) or record this as a DECISION that Phase 4 must update the `Payment` collection row too.
- Correctness: Razorpay vars are now optional in env, but `apps/api/src/routes/payments.ts:15-18` still does `new Razorpay({ key_id: env.RAZORPAY_KEY_ID, ... })` at module load, which throws when the key is missing (verified). The API therefore still crashes at boot without Razorpay vars, so "make Razorpay vars optional" is not actually achieved. Also `routes/payments.ts:63` `env.RAZORPAY_KEY_SECRET ?? ""` makes the legacy verify-payment HMAC forgeable with an empty key when the secret is absent. Fix: construct Razorpay lazily / only when the keys exist, and reject verify-payment when the secret is missing. (`routes/payments.ts` is outside every Files list — log it under DECISIONS.)

### T3.5 — Payments router — FAIL

- `routes/payments.test.ts` pass; `bun run test` pass (1620); `bun run verify` **fails** (TS2345 at router.test.ts:173).
- ACs proven by T3.7 tests: 201/400/401/502, extra fields ignored, caller-only newest first, cross-user 403/404, completed DB row → succeeded without provider. OK.
- Quality:
  - `payments/router.ts:14-18, 49-53, 63-67`: identical `if (!userId) res.status(401)...` guard three times (rule: three times is mandatory extraction). Extract a small `requireUserId(req)` helper or throw `UnauthorizedError` (already exists in `lib/errors.ts`).
  - `payments/router.ts:38,79`: `"Payment provider temporarily unavailable"` duplicated; `"Checkout session not found"` appears in router.ts:75 and service.ts:87,90. Make them named constants.

### T3.6 — Unit: payments core — PASS

- Scoped coverage: 100% stmts/branches/functions/lines on all 5 files (79/79, 60/60, 16/16). 44 tests.
- Unknown pack, catalog-only provider args, SDK args from env/metadata/return_url, ProviderApiError redaction, architecture guard (`adapter.test.ts:243`) all present with real expects. No `.skip/.only/it.fails`.

### T3.7 — Unit: payments API surface — FAIL

- Scoped coverage: lowest router.ts 95.23% lines (75-76 uncovered); env.ts and payment.ts 100%. Gate met numerically.
- **`router.test.ts:173` type error makes `bun run verify` fail.** Fix as described above.
- Uncovered 75-76 justification ("duplicate module identity") is doubtful: the cross-user test hits the generic error handler (so returns 403 `{error}`), not the router's own 404 branch, which is why the test accepts `[403,404]` and `message ?? error`. Tighten: assert the router's 404 + `{message: "Checkout session not found"}` and make the branch reachable (or drop the redundant router branch and let the error handler map ForbiddenError → 404).

### Checkpoint 3

- `cd apps/api && bunx vitest run` green (574); `bun run test` green (1620). OK.
- 401 coverage for payments routes: index.test.ts mount order + router.test.ts in-handler 401. OK (see T3.1 note on the tautological test).
- T3.6/T3.7 coverage gates met.
- Optional real Dodo session: not run (no Clerk token available to verifier).
- Advisor review: manual, not verifiable here.

## Fix list for the builder (retry)

1. Fix TS2345 in `apps/api/src/payments/router.test.ts:173` so `bun run verify` exits 0.
2. `routes/index.ts`: single Clerk mount for both payment routers; update index.test.ts.
3. Remove or rewrite the tautological 401 block in `routes/payments.test.ts`.
4. Extract the ProviderApiError wrap helper (service.ts x2, adapter.ts x2); name `/ 100` and the Dodo status strings.
5. Router: extract the 401 guard; name the duplicated message strings.
6. Resolve the `userId` / standalone `Payment` collection vs `User.payments` decision (spec 5.4/5.5) and log it under DECISIONS.
7. Make the Razorpay client lazy so missing Razorpay vars do not crash boot; refuse verify-payment without a secret; log the out-of-Files edit to `routes/payments.ts`.
