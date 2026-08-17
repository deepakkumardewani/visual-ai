# Spec: Credits-Only Economy (Pro Removal)

## Objective

Retire the Pro subscription entirely. Visual AI becomes **free forever** with a pure credit economy:

- All features unlocked for everyone (4 variations, all formats, high quality, every model).
- Credits are the only meter. Two buckets:
  - **Daily credits** — 30/day, reset daily at midnight (cron), no carryover. Spent first.
  - **Persistent credits** — 50 on signup + purchases + referral bonuses. Never expire. Spent after daily credits are exhausted.
- Per-model `creditCost` in the shared model registry (single cost per model; no free/pro variants). Premium models cost more credits. Cost shown in model picker.
- Referral: **+50 persistent credits to both** referrer and referred user (replaces "1 month of Pro"). No Pro upgrade.
- Buy-credits modal redesigned with proper UX (balance context, value framing, best-value highlight).
- `/pricing` page repurposed as a **credits page**: free-forever messaging, how credits work, credit packs, per-model costs. Human-sounding copy (use `copywriting` + `humanizer` skills).

No real subscribers exist → clean removal, no migration tooling.

## Tech Stack

Monorepo: Vue 3 + Pinia + Vue Router (apps/web), Hono + MongoDB/Mongoose (apps/api), shared model registry (packages/shared). Auth via Clerk webhooks. Payments via Razorpay (one-time orders only after this change).

## Commands

- API tests: `npm test -w apps/api` (vitest)
- Web tests: `npm test -w apps/web` (vitest)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (or per-workspace tsc)
- Dev servers: **already running — never start them**

## Current State (from exploration)

### Backend (apps/api)

- `src/models/user.ts` — fields: `credits` (default 20), `monthlyCredits` (unused), `plan: "free"|"pro"`, `isPro`, `subscriptionId`, `subscriptionStatus`, `subscriptionEnd`, `referralCode`, `referralsUsed`, `referrals`.
- `src/utils/credit-calculator.ts` + `packages/shared/src/models/credits.ts` — tier-based fractional costs with free/pro variants (budget 0.5/1, standard 0.33/1, premium 0.167/2); utilities 3 (free) vs 1 (pro).
- `src/services/generation-service.ts:124-134` — `updateAndGetUserCredits` deducts; isPro branches at ~377, 408, 438, 469.
- `src/routes/users.ts:132-189` — apply referral: already grants 50/50 credits **and** upgrades referrer to Pro (line ~178) — the Pro upgrade goes.
- `src/routes/payments.ts` — `/payments/subscription/create` (remove), `/payments/order/create` (keep).
- `src/webhook/index.ts` — Clerk `user.created` → `signUpHandler` (user-service.ts:64-105, default 20 credits); Razorpay `payment.captured` → credit increment or Pro flag (`subscribe: "true"` branch removed).
- `src/utils/cronJobs.ts` — daily reset free users to 20 if below; monthly +500 for Pro (remove monthly).
- `packages/shared/src/models/registry.ts:598-600` — `isPro()` for premium-tier models.

### Frontend (apps/web)

- `src/stores/user.ts` — `isPro` ref (lines 19, 62, 124), `credits`.
- `src/components/Header/CreditsChip.vue` — balance display; "Subscribe to Pro" CTA when !isPro.
- `src/pages/Pricing.vue` + `src/components/PricingCard.vue` + `STARTER_PLAN`/`PRO_PLAN` in `src/utils/constants.ts`.
- Dialogs: `BuyMoreCreditsDialog.vue`, `ReferralOfferDialog.vue`, `ReferralDialog.vue`, `ProUpgradeDialog.vue`, `PremiumDialog.vue`, `LowCreditsDialog.vue`, `ConfirmCancelSubDialog.vue`; `src/stores/dialog.ts` actions.
- `src/utils/payment.ts` — `initiatePayment` with subscribe branch (remove branch).
- `src/utils/models.ts` + `src/types/model.ts:12` — `isPro` on Model; model picker badges.
- `src/composables/useViewerTransform.ts` — isPro-dependent credit costs.
- Nav/landing: pricing links in `constants.ts:368`, `PricingTeaser.vue`, `landing.ts:155`.

## Target Design

### Data model (user.ts)

- `credits: number` — persistent bucket (rename semantics only; keep field). Signup default **50**.
- `dailyCredits: number` — new field, default **30**, reset to 30 daily by cron for all users.
- Remove: `plan`, `isPro`, `monthlyCredits`, `subscriptionId`, `subscriptionStatus`, `subscriptionEnd`. (Mongoose: drop from schema; stale fields in existing docs are harmless.)
- Keep referral fields; add `referredBy?: string` if needed for idempotency (verify existing `referralsUsed` covers it).

### Credit spend

- Total available = `dailyCredits + credits`. Deduct from `dailyCredits` first, overflow into `credits`, atomically (single findOneAndUpdate or transaction; guard against negative balances and concurrent generations).
- Costs become **integers** per model in `packages/shared` registry: single `creditCost` per model. Confirmed mapping: budget/standard 1, premium models (FLUX Pro/Max, Imagen Ultra) 4–5, utilities (upscale/colorize/revive/remove-bg) 2, premium upscalers (Clarity Pro, Topaz) 6–8. Each model individually overridable in registry config. No free/pro variants anywhere.
- API returns both buckets to FE; FE shows combined balance with breakdown tooltip.

### Referral

- Both sides +50 **persistent** credits. Remove Pro upgrade at users.ts:178. Keep one-use-per-user validation. Update all copy.

### Payments

- Remove subscription endpoints, FE subscribe branch, webhook `subscribe` branch, cancel-subscription flow + dialog. Keep one-time order flow; purchased credits → persistent bucket.

### Crons

- Daily: reset `dailyCredits` to 30 for **all** users (unconditional set, not top-up).
- Remove monthly Pro cron.

### Frontend

- Delete: ProUpgradeDialog, PremiumDialog, ConfirmCancelSubDialog, PricingCard, plan constants. ReferralOfferDialog/ReferralDialog stay but re-copy for credits.
- `isPro` removed from user store, model type, models util, composables, CreditsChip, LowCreditsDialog (single integer costs now).
- Model picker: show per-model credit cost chip instead of Pro badge/lock.
- CreditsChip: combined balance; tooltip breakdown "30 daily (resets midnight) + N purchased"; "Buy credits" CTA only.
- BuyMoreCreditsDialog redesign: current balance shown, pack cards with per-credit value + "≈ N images", most-popular/best-value highlight, savings %, trust line (secure Razorpay), success state adds credits with animation. Use `frontend-design` skill.
- Pricing page → `/credits` (or reuse `/pricing` route with redirect): hero "free forever", how credits work (daily 30 + persistent), model cost table, credit packs, FAQ. Copy via `copywriting`/`humanizer` skills.
- Referral header button: "Earn credits" instead of "Free Pro".

## Edge Cases

1. Concurrent generations racing the two-bucket deduction — atomic conditional update; reject if insufficient combined balance.
2. Cost > dailyCredits remaining but combined balance sufficient — split deduction must work.
3. Existing users with old fields / <50 credits — no retro grant (they keep current persistent credits); daily bucket applies to everyone from first cron run. Existing "pro" users simply become normal users (their doc fields ignored/removed).
4. Refund/failed Razorpay payment — unchanged behavior (credits only on `payment.captured`).
5. Referral idempotency — code applied once per user; self-referral blocked (verify existing checks).
6. Daily cron downtime — reset is `set: 30`, self-healing next run; deduction never depends on cron having run (missing `dailyCredits` treated as 0).
7. Fractional legacy costs in history/UI — all displays move to integers; generation records unaffected.
8. FE cached `isPro` during rollout — FE and BE ship together; API ignores unknown fields.

## Code Style

Follow existing repo conventions; shared constants in `packages/shared` (e.g. `SIGNUP_CREDITS = 50`, `DAILY_CREDITS = 30`, `REFERRAL_BONUS = 50`) — single source of truth used by BE and FE. No magic numbers.

## Testing Strategy

- Vitest unit tests: credit-calculator (integer costs per model), two-bucket deduction (split, insufficient, race guard), referral handler (both-sides grant, idempotency, no Pro upgrade), signup handler (50 credits + 30 daily).
- Update existing tests that assert isPro behavior (generation-service.test.ts, models.test.ts, dialog/component tests).
- Manual browser verification via agent-browser skill for modal, credits page, model picker chips.

## Boundaries

- **Always:** run affected workspace tests + typecheck before marking a task done; keep credit constants in packages/shared; atomic credit deduction.
- **Ask first:** changing credit pack prices/amounts, DB migration scripts, deleting any route still referenced by deployed FE.
- **Never:** commit, run dev servers, grant retroactive credits without approval, leave silent isPro leftovers.

## Core Risk

The two-bucket atomic deduction under concurrency, and a silent Pro leftover (a stray `isPro` check that blocks a feature or miscosts credits). First implementation phase must land the data model + deduction with tests before any UI work.

## Success Criteria

1. `grep -ri "isPro\|plan.*pro\|subscription" apps packages` returns no live logic (copy/history aside).
2. New signup → 50 persistent + 30 daily credits; daily resets to exactly 30.
3. Generation deducts model's integer cost, daily bucket first; blocked only when combined balance < cost.
4. Referral applies once, grants +50 to both, no plan change.
5. Buy flow credits persistent bucket; subscription endpoints gone.
6. Model picker shows credit cost per model; no locks/badges for Pro.
7. Redesigned buy-credits modal and credits page pass manual review (judge: user, in browser).
8. All workspace tests and typecheck pass.

## Resolved Decisions

1. Model costs: budget/standard 1, premium 4–5, utilities 2, premium upscalers 6–8 (higher premium spread; per-model overridable).
2. Route stays `/pricing`, content becomes the credits page.
3. No retroactive top-up for existing users.
