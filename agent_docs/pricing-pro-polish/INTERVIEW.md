# pricing-pro-polish — confirmed interview restate (user said explicit "Yes" on 2026-11-06)

## Outcome
1. **Upgrade entry point**: "Upgrade to Pro" pill in the dashboard header next to the credits balance, shown to Free users only; Pro users see a Pro badge instead. Also an "Upgrade to Pro" link/cross-sell inside the Buy-more-credits dialog. (Today Pro is only reachable via `apps/web/src/components/Header/UserMenu.vue`.)
2. **Buy-more-credits dialog** (`apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue`, backdrop via `AppModal`):
   - Backdrop ~60% dim + blur, not fully dark (applies to AppModal backdrop generally unless that breaks other dialogs — spec decides; default: shared AppModal backdrop).
   - Per-credit price shown with enough precision (3 decimals, or "per 100 credits") — fixes the "$0.00/credit" rounding bug on the 2000 pack.
   - Replace "≈ N budget images" jargon with "≈ N images at 1 credit / M at 5 credits".
   - Fix the empty vertical gap on the 200-credit card (cards without a "Save X%" line leave a hole).
   - General layout/info improvement using impeccable/layout skills within this direction.
3. **Model menu** (`apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`, `ModelOption.vue`):
   - One-line row: logo, name + description, then a reference-image icon (only for models that support ref images) with tooltip "Up to N reference images", a PRO lock badge for Pro-only models, then credit cost. Today PRO + tier + cost stack onto 3 lines and rows are uneven.
   - Sections: Featured / Free / Pro.
   - Refine with impeccable/layout skills.
4. **Localized currency**: user saw $ on **localhost dev** from India. Root cause: `apps/api/src/payments/geo.ts` — no `cf-ipcountry`/`x-vercel-ip-country` header locally and IP lookup on loopback fails → USD fallback. Fix = dev-only country override (env var and/or query param, never active in production) so INR can be verified locally, plus tests proving the prod header/IP path resolves IN → INR end-to-end (`/payments/prices`, `usePricingCatalog.ts`, `formatPrice`). Not a prod infra change.
5. **Pricing modal + /pricing page — one layout** (`apps/web/src/components/Dialogs/PricingDialog.vue` currently renders `pages/Pricing.vue` inside, fullscreen; `PricingProCard.vue`, `PricingHero.vue` "Free Forever, Always", `PricingCreditStory.vue`):
   - Side-by-side **Free | Pro** comparison (resolves "Free Forever" contradicting the Pro upsell).
   - Credit packs below, framed as "Top up any plan".
   - FAQ last; remove the large empty space in sections and FAQ; the site footer must NOT render before/inside the FAQ in the modal (screenshot shows footer, then FAQ).
   - Remove text "Approx. price; final amount in your currency is shown at checkout".
   - Pro perks list the updated Pro model set (currently hardcoded "Premium models: Nano Banana Pro, GPT Image 2, FLUX.2 Max" in `PricingProCard.vue:20` — derive from shared constants).
   - Redesign layout using impeccable/layout skills.
6. **Daily credits**: Pro gets **50** daily credits, Free stays **30**. Today `DAILY_CREDITS = 30` in `packages/shared/src/models/credits.ts`; cron `apps/api/src/utils/cronJobs.ts` does `User.updateMany({}, {dailyCredits: DAILY_CREDITS})` at "0 0 * * *" server time.
   - Cron resets per plan (Pro users → 50, others → 30), using the same isPro definition as `apps/api/src/lib/isPro.ts`.
   - When a user becomes Pro mid-day (subscription activation webhook), daily balance is topped up to 50 (max(current, 50)). When Pro lapses, the next reset gives 30 (no immediate claw-back).
   - Reset time stated explicitly in copy, shown in the user's local time (pin cron timezone, e.g. UTC, so it is deterministic).
   - Comparison table shows 30/day for Free and 50/day for Pro. All copy (landing FAQ `apps/web/src/utils/landing.ts`, seo.ts, PricingHero, PricingCreditStory) must stay consistent with constants.
7. **Model tiers & costs** (single source of truth in `@visual-ai/shared`: `PREMIUM_MODEL_KEYS` in `packages/shared/src/models/plans.ts`, costs in `getCreditCost` in `credits.ts`):
   - **Pro-only, 5 credits**: FLUX_REALISM (was 4), FLUX_KONTEXT_PRO (was 1), FLUX_KONTEXT_MAX (was 4), IMAGEN_4_ULTRA (was 4), NANO_BANANA_PRO (5), GPT_IMAGE_2 (5).
   - **Free (ungated), 5 credits**: FLUX_2_PRO (was 1), FLUX_1_1_PRO (5), FLUX_2_MAX (5, **remove its current Pro gate**), FLUX_PRO (5).
   - Server gate (`apps/api/src/routes/generate.ts:139`), client lock (`ModelOption.vue:35`), generate store error handling, model menu sections, Featured list (Flux 2 Pro stays allowed in Featured since it remains free), pricing copy, and the credit-cost table on /pricing (screenshot shows "4: Flux Realism, Kontext Max, Imagen 4 Ultra / 5: ...") all follow the new table.
   - Existing tests asserting old costs/gates must be updated.
8. **Not-saved notice** (`apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.vue`, shown when a result could not be saved because history is at cap `HISTORY_CAP` free 100 / pro 500):
   - Clearer copy, e.g. "History full (500/500) — this image wasn't saved. Download it within ~1 hour."
   - Download becomes an icon button (accessible label), Dismiss becomes an X icon button (aria-label).
   - Remove the "Delete images to free space" button. Free users keep an "Upgrade to Pro (500 history)" link.
   - New persistent inline note near the Generate button / history header, for both plans, shown when history is ≥90% of cap and (stronger wording) at 100%: "History full — new creations won't be saved. Delete old images to make room." Free users also get an Upgrade link in that note.

## User
Free users deciding whether to upgrade to Pro or buy a credit pack; Pro users managing their history.

## Why now
Pro + localized pricing just shipped (cloudinary-cost-and-pro phases 6–10); discoverability and clarity gaps hurt conversion.

## Success
Every item above is verifiable in the browser; server gating and credit costs match the table in item 7; unit (vitest) and e2e (Playwright) tests green; no real paid calls.

## Constraints
- Mock-only: never call real Replicate, Dodo live mode, or email in tests/agents (see project CLAUDE.md; e2e paid-call guard exists at `apps/web/e2e/support/paidCallGuard.ts`).
- One source of truth for tier and cost lists in `@visual-ai/shared`; no duplicated model lists in web copy.
- Vue 3 + Pinia + Tailwind (`tw-` prefix) frontend; Express/Mongo API; Bun monorepo.
- Never run the dev server (always running).

## Out of scope
Changing the Pro price ($5/mo), new credit packs or pack prices, Dodo checkout UI, production geo/CDN infrastructure changes, video models.

## Screenshots (user-provided)
~/Desktop/screenshots/visualai-dev/Screenshot 2026-11-06 at 7.36.30 PM.png, 7.37.08 PM.png, 7.45.30 PM.png, 7.41.15 PM.png, 7.41.24 PM.png, 7.40.32 PM.png — buy-credits dialog, model menu, Pro card, empty pricing section, footer-before-FAQ, full pricing modal.
