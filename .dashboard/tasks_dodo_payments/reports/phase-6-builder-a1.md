# Phase 6 builder report (a1)

## Summary

Razorpay routes, webhooks, SDK dependency, web checkout loader, shared `RazorpayProduct`, env vars, tracked examples, user copy, and technical docs updated for Dodo. Checkpoint 6: **1670 tests**, **lint 0 errors**, `bun.lock` has 0 `razorpay` matches.

## Per task

### T6.1

- **Changed:** Removed `apps/api/src/routes/payments.ts`, `payments.test.ts`; stripped `/webhooks/razorpay` from `webhook/index.ts` + tests; unmounted legacy router in `routes/index.ts`.
- **Also (keep green):** `apps/api/src/routes/index.test.ts` — dropped `paymentsRoute` mock/expectations.
- **Verify:** `git grep` routes/webhook clean; `PaymentModel` count 1; `cd apps/api && bunx vitest run` → 602 passed; `bun run lint` → 0 errors.

### T6.2

- **Changed:** Cleared `RAZORPAY_PRODUCTS` from `utils/constants.ts`; slimmed `constants.test.ts`; removed `RazorpayProduct` re-export; removed `razorpay` from `package.json`; `bun install`.
- **Verify:** API src grep clean (excluded paths); `grep -ci razorpay apps/api/package.json` → 0; `grep razorpay bun.lock` → 0; API vitest 600 passed.

### T6.3

- **Changed:** Deleted `apps/web/src/utils/payment.ts`, `payment.test.ts`; removed `RAZORPAY_PRODUCTS` and Razorpay types from web constants/types.
- **Verify:** Web src grep clean (allowed exclusions); `bun run test` → 1670 passed.

### T6.3.1

- **Changed:** Removed `RazorpayProduct` from `packages/shared` domain + index.
- **Verify:** `git grep RazorpayProduct` empty; lint clean.

### T6.4

- **Changed:** Removed `RAZORPAY_*` from `env.ts`, `docker-compose.yml`; `PAYMENT_PROVIDER` enum is `dodo` only; `LEGACY_RAZORPAY_ENV_PREFIX` absence test in `env.test.ts`.
- **Verify:** `vitest run config/env.test.ts` → 19 passed; env.ts/compose grep clean; env.test.ts grep filter clean.

### T6.4.1

- **Changed:** Removed Razorpay placeholders from three tracked `.env.example` files; added Dodo block to `infra/.env.example`.
- **Verify:** `git grep razorpay` on tracked env/yml clean; `git status` shows only the three example files under env paths.
- **Manual (untracked, not edited):** See DECISIONS + CHECKLIST section H.

### T6.5

- **Changed:** Dodo/UPI/pack copy in `pricingFAQ.json`, `pricing.md`, `llms.txt`, `README.md`, `PRD.md`.
- **Verify:** Target file grep clean; lint 0 errors.

### T6.6

- **Changed:** `API_REFERENCE.md`, `ARCHITECTURE.md`, `CHECKLIST_manual_steps.md` (section H + Dodo wording), `profile-billing.feature.md`.
- **Verify:** Docs/scenarios grep with legacy filter clean; `from 'razorpay'` / `"razorpay":` grep empty; `bun.lock` clean; full test + lint green.

### Checkpoint 6

- `bun run test` → 252 files, 1670 passed
- `bun run lint` → 0 errors, 6 warnings

## DECISIONS

- **T6.4.1 untracked env:** Per task, did not edit gitignored env files. Manual steps in CHECKLIST §H1–H3: remove legacy `RAZORPAY_*` / `VITE_RAZORPAY_*` and set Dodo variables from SPEC §5.7 in `apps/api/.env`, `apps/api/.env.staging`, `apps/api/.env.production`, `apps/web/.env.local`, `.env.staging`, `.env.production`, `infra/.env.staging`, `infra/.env.prod`, and droplet `/opt/visual-ai/.env.*`.
- **T6.1 index.test.ts:** Updated outside listed Files to match router mount after deleting `paymentsRoute` (required for vitest green).
