# Phase 1 builder report (retry) — T1.1, T1.2, T1.3

## T1.1 Create four test-mode products

- **Action:** Sanity-check only (prior build); no MCP create calls.
- **Evidence:** `grep -c '^T1.1-product:'` → 4; lines list pack_200/450/960/2000, INR minor units 13000/29000/50000/90000, `one_time_price`, `test_mode`.
- **Files:** none changed.

## T1.2 Create webhook endpoint

- **Action:** Listed webhooks via Dodo MCP; reused endpoint at ngrok URL with `payment.succeeded` and `payment.failed`.
- **PLAN:** Added `T1.2-endpoint:` line (id `ep_3KxCY74VR8TTHSRLnFwndSW7Ksi`, reused).
- **Manual:** `retrieveSecret` via MCP; wrote `DODO_PAYMENTS_WEBHOOK_KEY` to gitignored `apps/api/.env` (value not recorded here).
- **Verify:** T1.2-endpoint line present; `git check-ignore apps/api/.env` OK; webhook key line count 1; `grep -c whsec_ PLAN` → 0; `git grep whsec_` on tracked paths (exclusions per task) → empty.

## T1.3 Record IDs and placeholders

- **Action:** Updated `.env.example` files with Dodo placeholders; added four product IDs + webhook key to `apps/api/.env`; copied webhook key to `apps/web/.env.e2e.local`.
- **Files changed (tracked):** `apps/api/.env.example`, `apps/web/.env.example`, `apps/web/.env.e2e.example`.
- **Manual:** `apps/api/.env`, `apps/web/.env.e2e.local`.
- **Verify:** `git diff` on three examples shows placeholders only; `git check-ignore` both gitignored env files OK; 4 `DODO_PRODUCT_ID_PACK_` lines; webhook key count 1 in api and e2e.local; each PLAN product id appears once in api `.env`; `git grep -nE "(sk_|whsec_)"` on three examples → empty.
- **Blocker:** `DODO_PAYMENTS_API_KEY` is **not** in `apps/api/.env` (pre-flight step 4). Task **Do** requires FAIL until added. Acceptance bullets for T1.3 do not list the API key, but builder must follow **Do**.

## Result

**FAIL** on T1.3 until pre-flight step 4 is satisfied.

**Unblock:** Put the test-mode `DODO_PAYMENTS_API_KEY` in gitignored `apps/api/.env`, then re-run T1.3 (or full Phase 1 verify).

## DECISIONS

- T1.3 · Missing `DODO_PAYMENTS_API_KEY` in local `.env` despite working Dodo MCP OAuth · completed all other T1.3 work · unblock: user adds key per TASKS pre-flight step 4.
