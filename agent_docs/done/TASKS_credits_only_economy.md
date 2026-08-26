# Tasks: Credits-Only Economy (Pro Removal)

Spec: `agent_docs/SPEC_credits_only_economy.md` · Plan: `agent_docs/PLAN_credits_only_economy.md`

---

## Phase 1: Shared Foundation

## Task 1: Shared credit constants + integer model costs

**Description:** Add `SIGNUP_CREDITS = 50`, `DAILY_CREDITS = 30`, `REFERRAL_BONUS = 50` to packages/shared. Replace the free/pro tier cost table in `packages/shared/src/models/credits.ts` with a single integer `creditCost` per model in the registry: budget/standard 1, premium (FLUX Pro/Max, Imagen Ultra) 4–5, utilities (upscale/colorize/revive/remove-bg) 2, premium upscalers (Clarity Pro, Topaz) 6–8. Remove `isPro()` helper from `registry.ts:598-600` (keep `tier` if used for grouping).

**Acceptance criteria:**

- [x] ✅ Every model in the registry resolves an integer creditCost; no free/pro cost variants remain in shared
- [x] ✅ Constants exported from packages/shared and importable by both apps

**Verification:**

- [x] ✅ `npm test -w packages/shared` (or api tests covering registry) + typecheck pass

**Dependencies:** None
**Files:** `packages/shared/src/models/credits.ts`, `packages/shared/src/models/registry.ts`, shared constants file
**Scope:** S

---

## Task 2: User schema — dailyCredits, signup 50, remove Pro fields

**Description:** In `apps/api/src/models/user.ts`: add `dailyCredits` (default `DAILY_CREDITS`), change `credits` default to `SIGNUP_CREDITS`, remove `plan`, `isPro`, `monthlyCredits`, `subscriptionId`, `subscriptionStatus`, `subscriptionEnd`. Update `signUpHandler` (`user-service.ts:64-105`) and any user-response serialization to return both buckets (and stop returning isPro/plan).

**Acceptance criteria:**

- [x] ✅ New user doc: `credits: 50`, `dailyCredits: 30`, no Pro/subscription fields
- [x] ✅ User API response includes `credits` and `dailyCredits`

**Verification:**

- [x] ✅ API unit tests for signup handler pass; typecheck passes

**Dependencies:** Task 1
**Files:** `apps/api/src/models/user.ts`, `apps/api/src/services/user-service.ts`, user routes/serializers
**Scope:** S

---

## Task 3: Atomic two-bucket credit deduction

**Description:** Rewrite `credit-calculator.ts` to return the model's integer cost (no isPro param). Rewrite `updateAndGetUserCredits` (`generation-service.ts:124-134`) to deduct daily-first with persistent overflow via one conditional `findOneAndUpdate` (filter re-checks both balances; null → insufficient). Treat missing `dailyCredits` as 0. Remove all isPro branches in generation-service (~lines 377, 408, 438, 469).

**Acceptance criteria:**

- [x] ✅ Cost ≤ daily → daily only; cost > daily → split; combined < cost → rejected, no partial deduction
- [x] ✅ Concurrent deductions cannot drive either bucket negative
- [x] ✅ No isPro references remain in generation path

**Verification:**

- [x] ✅ New vitest cases: daily-only, split, insufficient, race simulation; `npm test -w apps/api` passes

**Dependencies:** Tasks 1–2
**Files:** `apps/api/src/utils/credit-calculator.ts`, `apps/api/src/services/generation-service.ts`, `generation-service.test.ts`
**Scope:** M

---

## Task 4: Crons — daily reset 30, remove monthly Pro cron

**Description:** In `apps/api/src/utils/cronJobs.ts`: daily job becomes unconditional `$set: { dailyCredits: DAILY_CREDITS }` for all users (no longer touches `credits`); delete the monthly Pro top-up job.

**Acceptance criteria:**

- [x] ✅ Daily job resets dailyCredits to exactly 30 for every user; persistent credits untouched
- [x] ✅ Monthly job gone

**Verification:**

- [x] ✅ Unit test on cron handler function; typecheck passes

**Dependencies:** Task 2
**Files:** `apps/api/src/utils/cronJobs.ts`
**Scope:** XS

## Checkpoint 1

- [x] ✅ `npm test -w apps/api` + typecheck clean; review deduction tests with user

---

## Phase 2: Backend Pro Removal

## Task 5: Referral — credits only

**Description:** In `apps/api/src/routes/users.ts:132-189`: keep the 50/50 grant (use `REFERRAL_BONUS`), remove the Pro upgrade (`plan: "pro", isPro: true` at ~178). Grants go to persistent `credits`. Verify one-use-per-user and self-referral guards exist; add if missing.

**Acceptance criteria:**

- [x] ✅ Applying a valid code: +50 persistent to both users, no plan change
- [x] ✅ Reapplying / self-referral rejected

**Verification:**

- [x] ✅ Unit tests for the referral route pass

**Dependencies:** Task 2
**Files:** `apps/api/src/routes/users.ts`, tests
**Scope:** S

---

## Task 6: Payments — one-time orders only

**Description:** Remove `/payments/subscription/create` (payments.ts:24-58) and any cancel-subscription endpoint. In webhook `payment.captured` handler (`webhook/index.ts:76-130`), remove the `subscribe: "true"` branch; keep the credit-increment path targeting persistent `credits`.

**Acceptance criteria:**

- [x] ✅ Subscription endpoints return 404; order creation + capture → persistent credits still works
- [x] ✅ Webhook never sets Pro flags

**Verification:**

- [x] ✅ API tests pass; grep for `subscription` in apps/api shows no live logic

**Dependencies:** Task 2
**Files:** `apps/api/src/routes/payments.ts`, `apps/api/src/webhook/index.ts`
**Scope:** S

## Checkpoint 2

- [x] ✅ `grep -ri "isPro" apps/api packages` → no live logic; all API tests pass

---

## Phase 3: Frontend Pro Removal

## Task 7: Strip isPro + delete Pro dialogs

**Description:** Remove `isPro` from `stores/user.ts` (19, 62, 124), `types/model.ts:12`, `utils/models.ts`, `composables/useViewerTransform.ts`. Delete `ProUpgradeDialog.vue`, `PremiumDialog.vue`, `ConfirmCancelSubDialog.vue` and their `stores/dialog.ts` actions and imports (incl. `AppHeader.vue:13`). Remove subscribe branch from `utils/payment.ts:36-53` and `cancelSubscription` from helpers. Store `dailyCredits` alongside `credits`.

**Acceptance criteria:**

- [x] ✅ No isPro references in apps/web src; deleted dialogs unreferenced; app compiles
- [x] ✅ User store exposes credits + dailyCredits

**Verification:**

- [x] ✅ `npm test -w apps/web` + typecheck pass

**Dependencies:** Task 1 (shared costs)
**Files:** stores, types, utils, composables, dialog components (~8 files — removal sweep, mostly deletions)
**Scope:** L (deletion-heavy; acceptable)

---

## Task 8: CreditsChip + LowCreditsDialog

**Description:** `CreditsChip.vue`: show combined balance, tooltip breakdown ("30 daily · resets at midnight" + "N credits"), single "Buy credits" CTA. `LowCreditsDialog.vue`: integer cost messaging, "Buy credits" only.

**Acceptance criteria:**

- [x] ✅ Chip shows dailyCredits + credits combined with breakdown tooltip; no Pro CTA anywhere

**Verification:**

- [x] ✅ Component tests updated + pass; visual check via agent-browser

**Dependencies:** Task 7
**Files:** `components/Header/CreditsChip.vue`, `components/Dialogs/LowCreditsDialog.vue`, tests
**Scope:** S

---

## Task 9: Model picker credit-cost chips

**Description:** Replace Pro badges/locks in ModelPicker/ModelOption with a per-model credit-cost chip sourced from the shared registry. All models selectable by everyone.

**Acceptance criteria:**

- [x] ✅ Every model shows its integer cost; no locks/Pro badges; selection ungated

**Verification:**

- [x] ✅ `ModelOption.test.ts` / `ModelPicker.test.ts` updated + pass; visual check

**Dependencies:** Tasks 1, 7
**Files:** `components/Dashboard/ModelPicker/*`, `utils/models.ts`, tests
**Scope:** S

## Checkpoint 3

- [x] ✅ Web tests + typecheck clean; generate/upscale flows work in browser with correct deduction

---

## Phase 4: Referral & Copy

## Task 10: Referral re-copy

**Description:** `ReferralOfferDialog.vue`: "Refer a friend — you both get 50 free credits" (replace Pro copy). `ReferralDialog.vue` success messaging → credits. Header `ReferralOffer.vue` button: "Earn credits" instead of "Free Pro".

**Acceptance criteria:**

- [x] ✅ No Pro mentions in referral UI; copy reflects +50 both sides

**Verification:**

- [x] ✅ Visual check; apply-code flow grants credits end-to-end (dev)

**Dependencies:** Tasks 5, 7
**Files:** 3 dialog/header components
**Scope:** S

---

## Phase 5: Design Deliverables

## Task 11: Buy-credits modal redesign

**Description:** Redesign `BuyMoreCreditsDialog.vue` using the frontend-design skill: current balance context, pack cards with per-credit value + "≈ N images" framing, best-value/most-popular highlight, savings %, secure-Razorpay trust line, success state with credit count animation. Packs/prices unchanged.

**Acceptance criteria:**

- [x] ✅ All four packs purchasable; balance shown; value framing present; success state animates new balance

**Verification:**

- [x] ✅ Visual review via agent-browser; component tests pass

**Dependencies:** Tasks 7–8
**Files:** `components/Dialogs/BuyMoreCreditsDialog.vue` (+ extracted subcomponents), tests
**Scope:** M

## Iterate: buy-modal feel

**Judge:** user, in browser. **Timebox:** 2 rounds. **Exit:** sign-off or rescope.

---

## Task 12: /pricing → credits page

**Description:** Rebuild `pages/Pricing.vue` as the credits page: "free forever" hero, how credits work (30/day free + persistent never-expire), per-model cost table from shared registry, credit packs, short FAQ. Delete `PricingCard.vue` + `STARTER_PLAN`/`PRO_PLAN`. Copy written with copywriting + humanizer skills. Update nav/landing links (`constants.ts:368`, `PricingTeaser.vue`, `landing.ts:155`) to credits framing.

**Acceptance criteria:**

- [x] ✅ No plan comparison/Pro mentions; costs sourced from registry (not hardcoded); copy reads human

**Verification:**

- [x] ✅ Visual review via agent-browser; typecheck + tests pass

**Dependencies:** Tasks 1, 7
**Files:** `pages/Pricing.vue`, `components/PricingCard.vue` (delete), `utils/constants.ts`, `components/Landing/PricingTeaser.vue`, `utils/landing.ts`
**Scope:** M

## Iterate: credits-page feel

**Judge:** user, in browser. **Timebox:** 2 rounds. **Exit:** sign-off or rescope.

## Checkpoint 4 (feel)

- [ ] User reviews modal + credits page → go / iterate

---

## Phase 6: Sweep & Verify

## Task 13: Repo-wide sweep + final verification

**Description:** Grep whole repo for `isPro`, `plan.*pro`, `subscription`, `Upgrade`, "Pro access" — remove leftovers (code + copy, incl. landing page, .env.example subscription vars, unused Razorpay plan env). Run all workspace tests, typecheck, lint. Walk spec Success Criteria 1–8.

**Acceptance criteria:**

- [x] ✅ Grep clean of live Pro logic; all tests/typecheck/lint pass; success criteria checklist done

**Verification:**

- [x] ✅ `npm test` all workspaces; `npm run lint`; manual criteria walkthrough with user

**Dependencies:** All prior
**Files:** misc
**Scope:** S
