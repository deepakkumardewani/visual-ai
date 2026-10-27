# Phase 6 verifier report (a1)

**Phase:** Razorpay removal, env cleanup, docs  
**Tasks:** T6.1–T6.6, Checkpoint 6  
**Date:** 2026-10-20  
**Engineer report:** phase-6-builder-a1.md (cross-checked, not trusted)

## Summary

**PASS** — All acceptance criteria and verify steps satisfied with independent command evidence.

---

## T6.1 Remove Razorpay routes and webhook from API

### Commands run

```bash
git grep -il razorpay -- apps/api/src/routes apps/api/src/webhook
# exit 1 (no matches)

git grep -c "export const PaymentModel" -- apps/api/src/models/payment.ts
# apps/api/src/models/payment.ts:1

cd apps/api && bunx vitest run
# Test Files 59 passed (59), Tests 600 passed (600)

bun run verify
# 0 errors, 6 warnings
```

### AC

- Old endpoints / `/webhooks/razorpay`: `git grep` on api routes/webhook for razorpay, order/create, verify-payment — no matches repo-wide under `apps/api`.
- 401 on remaining payments routes: `router.test.ts` has three `returns 401 when unauthenticated` cases for POST checkout, GET payments, GET status.
- `PaymentModel` export count = 1; `models/payment.test.ts` included in API vitest 600/600.
- `/webhooks/clerk`: still mounted in `webhook/index.ts`; clerk tests in `webhook/index.test.ts` pass via full API vitest.

### Notes

- `apps/api/src/routes/payments.ts` deleted (glob 0 files).
- `apps/api/src/routes/index.test.ts` updated (4-line diff) — not in Files list but required after unmounting legacy router; minimal, no quality issue.

---

## T6.2 Remove Razorpay constants, types and dependency from API

### Commands run

```bash
git grep -nE "RAZORPAY_PRODUCTS|Razorpay(Product|Subscription|Order)|new Razorpay|from ['\"]razorpay['\"]|require\(['\"]razorpay['\"]\)" -- apps/api/src
# empty

git grep -ni razorpay -- apps/api/src apps/api/package.json ':!apps/api/src/config' ':!apps/api/src/models/payment.ts' ':!apps/api/src/models/payment.test.ts' ':!apps/api/src/payments' | grep -vi legacy | grep -vE "[\"']razorpay[\"']"
# empty

grep -ci razorpay apps/api/package.json  # 0
grep -c razorpay bun.lock  # 0

cd apps/api && bunx vitest run  # 600 passed
bun run verify  # 0 errors
```

### AC

- No razorpay import/SDK/constants in `apps/api/src` (excluded paths per task).
- `bun.lock` and `package.json` clean.

---

## T6.3 Remove Razorpay from web

### Commands run

```bash
git grep -nE "RAZORPAY_PRODUCTS|Razorpay(Product|Subscription|Order)|utils/payment|checkout\.razorpay\.com|new Razorpay|from ['\"]razorpay['\"]" -- apps/web/src
# empty

git grep -ni razorpay -- apps/web/src ':!apps/web/src/utils/pricingFAQ.json' ':!apps/web/src/components/Profile/Payments.test.ts' | grep -vi legacy | grep -vE "[\"']razorpay[\"']"
# empty

bun run test  # 252 files, 1670 passed
bun run verify  # 0 errors
```

### AC

- `apps/web/src/utils/payment.ts` deleted (glob 0 files).
- Web build/tests green via monorepo test + verify.

---

## T6.3.1 Remove RazorpayProduct from packages/shared

### Commands run

```bash
git grep -n RazorpayProduct -- apps packages  # empty

git grep -ni razorpay -- packages/shared/src | grep -vi legacy | grep -vE "[\"']razorpay[\"']"
# only allowed: PaymentProviderName 'razorpay' literal (legacy provider)

bun run test  # 1670 passed
bun run verify  # 0 errors
```

---

## T6.4 Env cleanup: config and compose

### Commands run

```bash
cd apps/api && bunx vitest run config/env.test.ts
# 19 passed

git grep -ni razorpay -- apps/api/src/config/env.ts apps/api/docker-compose.yml
# exit 1

git grep -ni razorpay -- apps/api/src/config/env.test.ts | grep -v LEGACY_RAZORPAY_ENV_PREFIX
# empty
```

### AC

- `LEGACY_RAZORPAY_ENV_PREFIX` marker + absence test at lines 191–199 in `env.test.ts`; test title avoids naming Razorpay.

---

## T6.4.1 Env cleanup: tracked example files

### Commands run

```bash
git grep -inE "razorpay" -- '*.env*' '*.yml' ':!apps/web/coverage'
# exit 1

git status --short -- 'apps/*/.env*' 'infra/.env*'
# M apps/api/.env.example
# M apps/web/.env.example
# M infra/.env.example
```

### AC

- Only three tracked example files modified under env paths.
- CHECKLIST §H documents manual untracked env edits with legacy-labelled Razorpay key removal (verified in file).

---

## T6.5 User-facing copy and product docs

### Commands run

```bash
git grep -il razorpay -- apps/web/src/utils/pricingFAQ.json apps/web/public README.md docs/PRD.md
# exit 1

bun run verify  # 0 errors
```

### AC

- No Razorpay in target files.
- UPI mention in `pricingFAQ.json` aligns with SPEC §13 Q8 Answer (T0.3): UPI supported for INR in test mode.

---

## T6.6 Technical docs, checklist, and scenarios

### Commands run

```bash
git grep -ni razorpay -- docs agent_docs/CHECKLIST_manual_steps.md agent_docs/e2e-scenarios | grep -vi legacy
# empty

git grep -ni razorpay -- . [full T6.6 allowlist] | grep -vi legacy | grep -vE "[\"']razorpay[\"']"
# empty

git grep -nE "from ['\"]razorpay['\"]|\"razorpay\":" -- apps packages
# exit 1

grep -c razorpay bun.lock  # 0
```

### AC

- `docs/API_REFERENCE.md` lines 43–45, 50: POST `/payments/checkout`, GET `/payments`, GET `/payments/checkout/:sessionId/status`, POST `/webhooks/payments`.
- `profile-billing.feature.md`: Dodo flow, no razorpay grep hits.
- Checklist: legacy-labelled manual env steps only.

---

## Checkpoint 6

```bash
bun run test   # 252 files, 1670 passed
bun run verify # 0 errors, 6 warnings
grep -c razorpay bun.lock  # 0
```

Repo-wide grep (T6.6 filters) clean apart from documented allowlist.

---

## Code quality review

Reviewed changed files listed in task Files plus `routes/index.test.ts` companion fix. No dead code, swallowed errors, or incorrect Razorpay remnants found. Conventions match surrounding code.

**Quality violations:** none.

---

## Verdict

**PASS**
