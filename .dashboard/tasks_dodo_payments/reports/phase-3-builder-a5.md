# Phase 3 builder report (attempt a5)

Verdict: **PASS** — T3.1 legacy-route 401 supertests added.

## Scope

Fix T3.1 per `phase-3-verifier-a4.md`. Sanity T3.2–T3.7 only.

## T3.1 — Fix legacy payments 401 supertests

### Changes

**File:** `apps/api/src/routes/payments.test.ts`

- Mocked `ClerkExpressRequireAuth` (401 when `req.auth?.userId` missing).
- Stubbed `paymentsApiRouter` as empty Express router (same triple mount as `index.ts`).
- Added `createMountedLegacyPaymentsApp()` using:
  `app.use(ClerkExpressRequireAuth({}), paymentsApiRouter, paymentsRoute)`.
- Added four supertest cases (unauthenticated):
  - `POST /payments`
  - `GET /payments/:id`
  - `POST /payments/order/create`
  - `POST /payments/verify-payment`
- Each expects `401` and `{ message: "Unauthorized" }`; list/detail/order assert downstream mocks not called.

**File:** `apps/api/src/routes/index.ts` — unchanged (mount order already correct from prior work).

### Commands

| Command                                                            | Result                                       |
| ------------------------------------------------------------------ | -------------------------------------------- |
| `cd apps/api && bunx vitest run routes/payments.test.ts`           | 1 file, **11 passed** (was 7; +4 legacy 401) |
| T3.2–T3.7 sanity (router, env, payment model, payments unit specs) | 8 files, **97 passed**                       |

## T3.2–T3.7 sanity

Not modified. Scoped vitest run green (same suite family as verifier a4).

## Decisions

- **paymentsApiRouter in mount test:** empty stub router — preserves `index.ts` mount arity/order without pulling checkout service mocks into `payments.test.ts`. Legacy 401 is enforced by Clerk middleware before either router.

## Unblocks verifier

- T3.1 AC: unauthenticated supertest 401 on all four legacy routes via mounted app.
- Checkpoint 3 partial: legacy four now covered; Dodo three remain in `payments/router.test.ts`.
