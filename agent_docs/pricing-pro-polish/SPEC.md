# Spec: pricing-pro-polish

Source of truth for intent: `agent_docs/pricing-pro-polish/INTERVIEW.md` (user-confirmed 2026-11-06). This spec adds no scope beyond it.

## Objective

Pro and localized pricing just shipped (cloudinary-cost-and-pro phases 6-10). Discoverability and clarity gaps hurt conversion. Make Pro easy to find, make the pricing surfaces coherent, re-tier models, give Pro 50 daily credits, and make "history full" understandable.

Users: Free users choosing between Pro and a credit pack; Pro users managing history.
Success: every item is verifiable in the browser; server gate and credit costs match the table in item 7; vitest and Playwright green; zero real paid calls.

## Assumptions

1. Pro price stays $5/mo (`PRO_PRICE_USD_MONTHLY`); no new packs or pack prices.
2. "Pro" everywhere means `isPro()` in `apps/api/src/lib/isPro.ts` (active, or past_due/cancelled until `currentPeriodEnd`).
3. Cron timezone is pinned to UTC (`node-cron` `timezone: "UTC"`); reset = 00:00 UTC. Today it runs at server-local midnight, so the reset instant may shift once on deploy; that is accepted.
4. The shared `AppModal` backdrop change is applied globally unless the implementer finds it breaks another dialog (then add a prop, default to the new look for BuyMoreCredits only).
5. Existing users' stored credit balances are not migrated; only costs and gates change.

## Tech Stack / Commands

Bun monorepo. `apps/web` Vue 3 + Pinia + Tailwind (`tw-` prefix), `apps/api` Express + Mongo + node-cron, `packages/shared` (`@visual-ai/shared`, zod). Tooling: vite-plus.

- Unit tests: `bun run test` (= `vp test run`); scope with a path argument
- Lint/typecheck: `bun run verify` or `bun run check`
- Do NOT run `bun run check:model-docs` (`scripts/check-model-docs.mjs`): it calls the live Replicate API with `REPLICATE_API_TOKEN` and only prints aspect_ratio/output_format enums, so it checks nothing about costs and violates the mock-only rule. Cost/copy consistency is proven by unit tests and a local grep instead.
- E2E: Playwright in `apps/web/e2e` (`qa/*.spec.ts`; fixtures in `e2e/fixtures/base.ts`)
- Never run the dev server (already running). Never commit unless told.

## Project Structure (touched areas)

- `packages/shared/src/models/credits.ts` (costs, `DAILY_CREDITS`), `plans.ts` (`PREMIUM_MODEL_KEYS`, `HISTORY_CAP`), `registry.ts`
- `apps/api/src/utils/cronJobs.ts`, `lib/isPro.ts`, `payments/service.ts` (`buildSubscriptionPatch`), `payments/geo.ts`, `config/env.ts`, `routes/generate.ts` (gate at ~L139)
- `apps/web/src/components/Header/{UserMenu,CreditsChip}.vue`, `Dialogs/{BuyMoreCreditsDialog,PricingDialog}.vue`, `AppModal.vue`
- `apps/web/src/components/Dashboard/ModelPicker/{ModelPickerPanel,ModelOption}.vue`, `Dashboard/Canvas/UnsavedResultNotice.vue`
- `apps/web/src/pages/Pricing.vue`, `components/Pricing/{PricingHero,PricingProCard,PricingPacks,PricingCreditStory,PricingModelCosts}.vue`
- `apps/web/src/utils/{landing,seo,models}.ts` (`featured: true` flags live in `utils/models.ts`), `apps/web/src/utils/{generalFAQ,pricingFAQ}.json` (merged into `GENERAL_FAQS` in `utils/constants.ts`), `apps/web/src/composables/usePricingCatalog.ts`, localized `formatPrice(amountMinor, currency)` in `packages/shared/src/pricing/format.ts`

## Code Style

Per project skills: explicit over clever, functions under ~30 lines, no magic numbers (named constants), early returns, comments explain why.

```ts
// packages/shared/src/models/credits.ts
export const DAILY_CREDITS = { free: 30, pro: 50 } as const;
export const getDailyCredits = (isPro: boolean) => (isPro ? DAILY_CREDITS.pro : DAILY_CREDITS.free);
```

## Item 7 first: Model tiers and costs (single source of truth)

Implemented in `@visual-ai/shared` only: `PREMIUM_MODEL_KEYS` (plans.ts) and `getCreditCost` (credits.ts). Web and API import; no duplicated lists in copy.

| Model key        | Old cost | New cost | Tier                                    |
| ---------------- | -------- | -------- | --------------------------------------- |
| FLUX_REALISM     | 4        | 5        | Pro-only                                |
| FLUX_KONTEXT_PRO | 1        | 5        | Pro-only                                |
| FLUX_KONTEXT_MAX | 4        | 5        | Pro-only                                |
| IMAGEN_4_ULTRA   | 4        | 5        | Pro-only                                |
| NANO_BANANA_PRO  | 5        | 5        | Pro-only                                |
| GPT_IMAGE_2      | 5        | 5        | Pro-only                                |
| FLUX_2_PRO       | 1        | 5        | Free                                    |
| FLUX_1_1_PRO     | 5        | 5        | Free                                    |
| FLUX_2_MAX       | 5        | 5        | Free (remove from `PREMIUM_MODEL_KEYS`) |
| FLUX_PRO         | 5        | 5        | Free                                    |

`PREMIUM_MODEL_KEYS` becomes exactly the six Pro-only keys. All other model costs unchanged. Add a named constant `PREMIUM_CREDIT_COST = 5` in `credits.ts` (none exists today) and use it for the ten rows above and for the item 2 image estimate. Follow-through: server gate (`generate.ts`), client lock (`ModelOption.vue` isLocked), generate store error handling for `PremiumModelRequiresProError`, model menu sections, Featured list (Flux 2 Pro stays eligible; it remains free), Pro perks copy, `PricingModelCosts.vue` table (groups by new costs, e.g. "5: ..."), `getCreditCost` doc comment, and FAQ copy that states costs (`pricingFAQ.json` says "premium generation 4–5"). Update every existing test asserting old costs/gates (shared credits/plans tests, `generate.test.ts`, `generation-service.test.ts`, `PricingModelCosts.test.ts`, ModelOption tests, e2e `pro-tier`/`pro-perks`).

Success criteria:

- Unit: a parametrized test over the table asserts `getCreditCost` and membership in `PREMIUM_MODEL_KEYS` for all 10 keys; `PREMIUM_MODEL_KEYS` length is 6.
- API: Free user POST `/generate/image` with each Pro-only key returns the premium-required error code, no credits deducted, nothing queued; Free user with FLUX_2_MAX/FLUX_2_PRO/FLUX_1_1_PRO/FLUX_PRO is accepted and charged 5; Pro user accepted for all.
- Browser: Free user sees lock + PRO badge on the six Pro-only models, clicking opens pricing; FLUX.2 Max is selectable with no lock; costs shown match table.
- No web copy or FAQ JSON states an old cost (local grep plus the item 6 consistency test).

## Item 1: Upgrade entry point

Requirements:

- Dashboard header: "Upgrade to Pro" pill next to the credits balance (`CreditsChip.vue` area) for Free users only. Pro users see a Pro badge in the same spot. Click opens pricing (`dialogStore.showPricing()`). Keep the `UserMenu.vue` entry.
- `BuyMoreCreditsDialog.vue` gets an "Upgrade to Pro" cross-sell link that opens pricing.
- Plan comes from `useUserStore().isPro` (already server-derived: `/users/:id` returns `plan` computed by `isPro()`).

Success: Browser: Free account shows pill and it opens pricing; Pro account (e2e Pro user) shows badge and no pill; dialog link present for Free. Unit: component tests for both plan states and click handlers. E2E: new `qa/upgrade-entry.spec.ts`.

Edge: pill hidden while user is loading (no flash of pill for Pro users); mobile width does not overflow the header (truncate or icon-only below the sm breakpoint).

## Item 2: Buy-more-credits dialog

Requirements:

- Backdrop about 60% dim plus blur (not near-black) in `AppModal.vue` shared backdrop; check other dialogs' tests/screenshots for regressions.
- Per-credit price with enough precision: show "per 100 credits" (preferred, e.g. "$X.XX per 100 credits") or 3 decimals; the 2000-pack must never render "$0.00/credit". The bug is the per-credit formatter in `usePricingCatalog.ts` (`formatPrice(amountMinor / pack.credits, currency)`); fix or replace it there using shared `formatPrice`, no parallel helper.
- Replace "≈ N budget images" with "≈ N images at 1 credit / M at 5 credits" (N = credits, M = floor(credits / `PREMIUM_CREDIT_COST`); no literal 5).
- Remove the empty vertical gap on cards without a "Save X%" line (reserve no space, or align via grid rows consistently).
- Layout/information polish within this direction (impeccable/layout skills).

Success: Browser: all pack cards equal height with no hole; no card shows $0.00; backdrop shows the page blurred and visibly dim. Unit: price-per-100 helper test across all packs in USD, INR and one zero-decimal currency (JPY); image-estimate text test; snapshot/DOM test that no empty "save" placeholder renders.

## Item 3: Model menu

Requirements:

- `ModelOption.vue` renders one line: logo, name + description, then reference-image icon (only when the model supports ref images; tooltip "Up to N reference images"; a model is ref-capable when its registry entry has `imageInput`, and N is `imageInput.max`, the same field `stores/aside.ts` uses), PRO lock badge (Pro-only, non-Pro viewers), then credit cost. No 3-line stacking; uniform row height.
- `ModelPickerPanel.vue` sections, in order: Featured / Free / Pro (Free = generation models not in `PREMIUM_MODEL_KEYS`, Pro = `PREMIUM_MODEL_KEYS`). This replaces today's company grouping (`groupModelsByCompany`) for the generation picker; upscaler/utility pickers keep their current behaviour.
- Featured keeps its current `featured: true` set (in `apps/web/src/utils/models.ts`), which includes two Pro-only models (NANO_BANANA_PRO, GPT_IMAGE_2): they show the lock for Free users in Featured too. Featured models also appear in their tier section (same as today, where they also appear under their company).
- Refine with impeccable/layout skills.

Success: Browser: rows have identical height; icon shows only for ref-capable models; tooltip text exact; sections in order; Pro section for Free users shows locks; Pro users see no lock. Unit: ModelOption and ModelPickerPanel tests for sections, icon visibility, lock, tooltip.

## Item 4: Localized currency in dev

Root cause: `apps/api/src/payments/geo.ts` `resolveCountry` finds no header locally and the loopback IP lookup fails, so it falls back to USD.

Requirements:

- Add a dev-only country override: env var `DEV_COUNTRY_OVERRIDE` (required) plus an optional `?country=` query param on `/payments/prices` (query param beats env var), both validated via `normalizeCountryCode`. Honored only when `NODE_ENV` is `development` or `test`; in `production` and `staging` both are ignored, and `config/env.ts` logs a warning at startup when the env var is set (it does not fail boot). Override has top precedence in dev, then header, then IP.
- Document in `apps/api/.env.example`.
- Tests proving the production path: request with `cf-ipcountry: IN` (no override) resolves IN, `/payments/prices` returns INR amounts, and `usePricingCatalog.ts` + `formatPrice` render the ₹ symbol. Plus a test that `NODE_ENV=production` with the override set still uses the header/IP path. The ipapi.co lookup is mocked in every unit test (no outbound calls). Existing e2e assertions on the removed approx-price note (`qa/localized-prices.spec.ts`) are updated in item 5's phase.

Success: Unit (geo.test, env.test, route test, web catalog test) green. Browser: with override `IN` set in dev, pricing and buy dialog show INR. No change to production infra.

## Item 5: Pricing modal and /pricing page, one layout

Requirements:

- `PricingDialog.vue` and `pages/Pricing.vue` share one layout component; the modal no longer embeds the full page with site footer.
- Hero no longer says "Free Forever, Always" (`PricingHero.vue`); copy must not contradict the Pro upsell.
- Side-by-side Free | Pro comparison (stacked on mobile) including daily credits 30 vs 50, history cap (`HISTORY_CAP` 100 vs 500), model access, queue priority, privacy.
- Credit packs below, framed "Top up any plan".
- FAQ last. Site footer must not render before or inside the FAQ in the modal. Remove the large empty space in sections and FAQ.
- Remove the text "Approx. price; final amount in your currency is shown at checkout" (`PRICE_NOTE` in `PricingProCard.vue`), and update e2e specs that assert it (`localized-prices`, `pro-tier`, `mods-reference-image`).
- FAQ copy (`generalFAQ.json`, `pricingFAQ.json`) no longer says "There are no paid subscription tiers"; it must not contradict Pro.
- Pro perks derive the model list from shared constants (`PREMIUM_MODEL_KEYS` mapped to registry display names), not the hardcoded string at `PricingProCard.vue:20`.
- Redesign with impeccable/layout skills. Keep Pro price $5/mo and existing pack prices.

Success: Browser: modal and /pricing render the same shared layout component (asserted in a unit test), the modal without the site footer; order is comparison, packs, model costs, FAQ; no footer above FAQ in modal; the removed note is absent; Pro perks list the six Pro models. Unit: tests assert the PRICE_NOTE text is absent, perks derive from shared (change constant in test mock, perk text follows), comparison renders 30 and 50. Update `Pricing.test.ts`, `PricingProCard.test.ts`, `PricingHero.test.ts`.

## Item 6: Daily credits (Free 30, Pro 50)

Rules:

- `packages/shared`: `DAILY_CREDITS` becomes per-plan (30 free, 50 pro) with a helper; all consumers updated (`apps/api/src/models/user.ts` default, `generation-service.ts`, `stores/user.ts`, `landing.ts`, `seo.ts`, `FinalCta.vue`, `PricingTeaser.vue`, `PricingHero.vue`, `PricingCreditStory.vue`, `ProfileCreditsCard.vue`, `LowCreditsDialog.vue`, `BuyMoreCreditsDialog.vue`, `generalFAQ.json`, `pricingFAQ.json`, `ReferralCopyDialog.vue`, and `packages/email/src/{V2Announcement.tsx,components/CreditsCallout.tsx,constants.ts}`, which import `DAILY_CREDITS` and will break on the shape change; email copy uses `DAILY_CREDITS.free`, no email is sent). Completeness check: `grep -rn DAILY_CREDITS apps packages` shows no remaining scalar use. Copy derives from constants wherever it is TS/Vue; Both JSON FAQs are checked by a consistency test against the constants (the test keys on numbers adjacent to the word "daily", so "50 persistent" is not mistaken for a daily amount). `SIGNUP_CREDITS` and `REFERRAL_BONUS` unchanged.
- Cron (`cronJobs.ts`): scheduled `"0 0 * * *"` with `{ timezone: "UTC" }`. Reset per plan using the same definition as `isPro()`: Pro users get 50, everyone else 30. Implement as two `updateMany` calls whose Pro filter mirrors `isPro` (plan pro AND (status active OR (status in past_due/cancelled AND currentPeriodEnd > now))); the Free update is the complement. Prefer a single exported query-builder in `lib/isPro.ts` so the filter and the function cannot drift, with a test that cross-checks them on fixture users.
- Mid-day upgrade: on subscription ACTIVATED (not RENEWED, to avoid re-topping on renewal), set `dailyCredits = max(current, 50)` atomically (e.g. `$max`), in `service.ts` alongside `buildSubscriptionPatch`. Idempotent for webhook replays (`staleEventClause` already drops duplicates; `$max` makes a replay harmless anyway). Known accepted gap: if ACTIVATED is dropped as out-of-order behind a RENEWED, no mid-day top-up happens; the next reset gives 50.
- Lapse: no claw-back. When Pro expires, the user's current balance is untouched; the next cron reset gives 30.
- Copy states the reset time explicitly, shown in the user's local time (format 00:00 UTC via `Intl.DateTimeFormat` in the browser, e.g. "Resets daily at 5:30 AM"), from one shared constant `DAILY_RESET_UTC_HOUR = 0`.
- Comparison table shows 30/day Free, 50/day Pro.

Success: Unit: cron test asserts both update filters/values and timezone option; isPro filter parity test; webhook test for ACTIVATED with current 12 -> 50, current 80 -> 80, replay unchanged; EXPIRED leaves balance; consistency test across shared, both FAQ JSONs, landing, seo. Browser: Pro profile shows 50/day, Free 30/day, reset time text in local time. Credit-chip and low-credits dialogs show plan-appropriate amount.

## Item 8: Not-saved notice and history-full note

Requirements:

- `UnsavedResultNotice.vue`: clearer copy, e.g. "History full (500/500) - this image wasn't saved. Download it within ~1 hour." with real count and cap from `HISTORY_CAP` by plan. Download becomes an icon button (aria-label "Download image"); Dismiss becomes an X icon button (aria-label "Dismiss"). Remove "Delete images to free space". Free users keep an "Upgrade to Pro (500 history)" link (number from `HISTORY_CAP`).
- New persistent inline note near the Generate button / history header for both plans: shown when history count is at least 90% of cap (softer wording) and at 100% (stronger): "History full - new creations won't be saved. Delete old images to make room." Free users also see an Upgrade link. Extract to its own component with a pure threshold helper (e.g. `getHistoryFullLevel(count, cap)` returning none/near/full, threshold as a named constant `HISTORY_NEAR_FULL_RATIO = 0.9`). Near-full wording: "History almost full (N/cap). Delete old images to keep saving new ones." Cap = `HISTORY_CAP` for the user's plan.
- Count source: the length of the user's history as returned by the server (history lives in the user doc, capped server-side in `generation-service.ts`); the note re-evaluates after a generation completes and after single or bulk delete.

Success: Unit: helper boundary tests (89/90/99/100 of 100 and 500); component tests for copy, aria-labels, absence of delete button, upgrade link by plan. Browser: Free at 100 and Pro at 500 (e2e seeded) show notices; Pro sees no upgrade link; under 90% nothing shows.

## Testing Strategy

- Vitest co-located `*.test.ts` for shared, api, web components. TDD for shared constants, cron, geo, helpers.
- Playwright `apps/web/e2e/qa/*`: Pro/Free gating, header pill, pricing layout, notices. All paid endpoints (`POST /generate/image`, `/generate/video`, progress, results) stubbed; the `paidCallGuard` must stay on.
- Browser verification via the agent-browser skill with a repo-unique session.

## Boundaries

- Always: update tests with code; use shared constants; run `bun run verify`, `bun run test`; accessible labels on icon buttons.
- Ask first: new dependencies, DB schema changes beyond reading existing fields, changing CI.
- Never: call real Replicate/Dodo live/email (this includes `bun run check:model-docs`); commit without being told; run the dev server; duplicate model/tier lists in web copy; let the currency override act in production; weaken failing tests.

## Edge Cases

- Past_due/cancelled Pro within paid period: still Pro (50 at reset, no lock). After period end: 30.
- User with dailyCredits above 50 mid-day upgrade stays unchanged.
- Webhook replay or RENEWED does not double-top-up.
- Unknown/invalid override code (e.g. "ZZ") is ignored with a log, falls through to header/IP.
- Currency without 3-decimal support: price-per-100 avoids sub-cent rounding in JPY etc.
- Legacy users lacking plan fields count as Free in the cron.
- Free user holding a stale FLUX_2_MAX selection works; Free user with a stale Pro-only selection gets a clear upsell, not a raw error.
- History count unknown/loading: show no note.
- User downgraded from Pro with more than 100 images: count exceeds the Free cap; treat as full (no deletion of existing images).
- Same-day cancel, expire and re-subscribe: a new ACTIVATED tops up to 50 again via `$max`; accepted.

## Out of Scope

Pro price change, new credit packs or prices, Dodo checkout UI, production geo/CDN infra, video models, migration of existing balances.

## Open Questions

None blocking; defaults are stated in Assumptions (UTC cron, global AppModal backdrop) and in item 4 (`DEV_COUNTRY_OVERRIDE` env var plus dev-only `?country=`).
