# Implementation Plan: Credits-Only Economy (Pro Removal)

Spec: `agent_docs/SPEC_credits_only_economy.md`

## Overview

Replace the Pro subscription with a pure credit economy. Foundation first (shared constants + integer model costs + two-bucket data model + atomic deduction), then Pro removal sweeps (BE, then FE), then referral re-copy, then the two design deliverables (buy-credits modal, /pricing credits page).

## Architecture Decisions

- **Single source of truth in `packages/shared`**: `SIGNUP_CREDITS = 50`, `DAILY_CREDITS = 30`, `REFERRAL_BONUS = 50`, and per-model integer `creditCost` in the registry (standard/budget 1, premium 4–5, utilities 2, premium upscalers 6–8). BE and FE both import; no duplicated cost tables.
- **Two-bucket deduction is one atomic Mongo update**: compute split (`fromDaily = min(cost, dailyCredits)`, remainder from `credits`), apply via conditional `findOneAndUpdate` that re-checks both balances in the filter; null result = insufficient/raced → reject. Missing `dailyCredits` treated as 0.
- **Schema removal, no migration**: drop `plan`, `isPro`, `monthlyCredits`, `subscription*` from the Mongoose schema; stale fields in existing docs are inert. Daily cron does `$set: { dailyCredits: 30 }` for all users (self-healing).
- **BE and FE ship together** in one branch; API tolerates old FE payloads by ignoring unknown fields.
- **Route stays `/pricing`**, content becomes the credits page.

## Phases

### Phase 1: Shared Foundation (BE-critical, highest risk first)

- Task 1: Shared credit constants + integer per-model creditCost in registry
- Task 2: User schema — dailyCredits field, signup 50, remove Pro/subscription fields
- Task 3: Atomic two-bucket deduction in generation-service + credit-calculator rewrite
- Task 4: Crons — daily reset to 30 for all users; delete monthly Pro cron

**Checkpoint 1:** `npm test -w apps/api` + typecheck pass; new deduction tests cover split/insufficient/race.

### Phase 2: Backend Pro Removal

- Task 5: Referral — remove Pro upgrade, keep 50/50 grant, verify idempotency/self-referral guards
- Task 6: Payments — remove subscription endpoints + webhook subscribe branch; keep one-time orders

**Checkpoint 2:** API tests pass; `grep -ri "isPro\|subscription" apps/api packages` shows no live logic.

### Phase 3: Frontend Pro Removal

- Task 7: Strip isPro from user store, model types/utils, composables; delete Pro dialogs (ProUpgrade, Premium, ConfirmCancelSub) + dialog-store actions + payment.ts subscribe branch
- Task 8: CreditsChip + LowCreditsDialog — combined balance w/ breakdown tooltip, credit-only CTAs, integer costs
- Task 9: Model picker — credit-cost chips replace Pro badges/locks

**Checkpoint 3:** `npm test -w apps/web` + typecheck pass; dashboard flows work in browser (agent-browser).

### Phase 4: Referral & Copy

- Task 10: Referral dialogs + header button re-copy ("Earn credits", +50 both sides)

### Phase 5: Design Deliverables

- Task 11: Buy-credits modal redesign (frontend-design skill)
- Task 12: /pricing → credits page (frontend-design + copywriting/humanizer skills)

**Checkpoint 4 (feel):** User reviews modal + credits page in browser — go / iterate.

- Iterate budget: up to 2 rounds each on Tasks 11–12; judge: user.

### Phase 6: Sweep & Verify

- Task 13: Repo-wide Pro-reference sweep, landing/nav copy, full test + typecheck + lint, success-criteria verification

## Risks and Mitigations

| Risk                                           | Impact | Mitigation                                                             |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Deduction race → negative/double-spend         | High   | Conditional atomic update; unit tests simulate races (Task 3, Phase 1) |
| Stray isPro check blocks a feature or miscosts | High   | grep gates at Checkpoints 2/3 and Task 13; tests updated not deleted   |
| Old FE cached against new API mid-deploy       | Med    | API ignores unknown fields; costs only served from shared registry     |
| Cron misses a day                              | Low    | Unconditional `$set: 30`; deduction treats missing dailyCredits as 0   |

## Parallelization

Tasks 5–6 parallel after Phase 1. Tasks 7–9 parallel after Task 1 (FE only needs shared constants). Tasks 11–12 parallel. Phase 1 is strictly sequential.
