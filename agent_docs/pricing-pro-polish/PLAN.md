# Implementation Plan: pricing-pro-polish

Authoritative inputs: `SPEC.md` (reviewed) and `INTERVIEW.md`. This plan adds no scope. No feature code is written during planning.

## Overview

Eight spec items are sliced into 9 phases. The shared constants change (tiers, costs, per-plan daily credits, reset hour, helpers) lands first because api, web and email all import it. After that, the server-side phases (gate, cron, geo) and web phases (header, dialog, model menu, pricing layout, history notices) are vertical slices that each leave the repo green (`bun run verify`, `bun run test`). `bun run check:model-docs` is never run: it calls the live Replicate API and does not check costs.

## Architecture Decisions

- Shared is the single source of truth. `PREMIUM_MODEL_KEYS`, `PREMIUM_CREDIT_COST`, `DAILY_CREDITS`, `getDailyCredits`, `DAILY_RESET_UTC_HOUR`, `HISTORY_CAP`, `HISTORY_NEAR_FULL_RATIO` and `getHistoryFullLevel` all live in `packages/shared/src/models/*`. Web and API only import.
- `DAILY_CREDITS` changes from a scalar to `{ free, pro }`. To avoid a flag-day break, Phase 1 migrates every consumer in the same phase (TypeScript errors list them; the grep completeness check is the gate).
- The Pro definition has one home: `lib/isPro.ts` exports `isPro(user)` and a Mongo filter builder `proUsersFilter(now)`. The cron and a parity test use that builder, so they cannot drift.
- Pricing dialog and page share one layout component (`PricingLayout.vue`); `Pricing.vue` and `PricingDialog.vue` become thin wrappers (page adds footer, dialog does not).
- Dev geo override is isolated in `geo.ts`, gated on `NODE_ENV in {development,test}`, and takes precedence over header and IP only there.

## Dependency Graph

```
Phase 1 shared constants (tiers, costs, daily, reset hour, history helper)
  |-- Phase 2 API gate + cost follow-through ---- Phase 3 cron + mid-day upgrade (needs P1, isPro builder)
  |-- Phase 4 geo dev override (independent of P1; can run in parallel with P2/P3)
  |-- Phase 5 model menu (needs P1)
  |-- Phase 6 header pill + buy-credits dialog (needs P1; backdrop + price helper)
  |-- Phase 7 pricing layout (needs P1, P4 for INR check, P6 helper reuse)
  |-- Phase 8 history notices (needs P1 helper)
Phase 9 e2e + docs consistency + final gate (needs all)
```

Parallelizable after Phase 1: {2, 3}, {4}, {5}, {8}. Phases 6 and 7 are sequential (shared price helper and dialog copy). Phases that touch the same files (`PricingProCard.vue`, `generalFAQ.json`, `landing.ts`) must not run concurrently.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Changing `DAILY_CREDITS` shape breaks consumers in api, web, email (`packages/email/src/{constants.ts,V2Announcement.tsx,components/CreditsCallout.tsx}`, `landing.ts`, `seo.ts`, `models/user.ts`, `generation-service.ts`, `stores/user.ts`, Pricing/Landing/Profile/Dialog components, `generalFAQ.json`, `pricingFAQ.json`) | High | Migrate all consumers in Phase 1; typecheck whole repo; run `grep -rn DAILY_CREDITS apps packages` with `--exclude-dir=node_modules --exclude-dir=coverage` and assert no scalar use; email tests (`V2Announcement.test.ts`, `render.test.ts`) updated to `.free`. |
| Existing tests assert old costs or gates (`plans.test.ts`, `generate.test.ts`, `generation-service.test.ts`, `PricingModelCosts.test.ts`, `ModelOption.test.ts`, `PricingProCard.test.ts`, `seo.test.ts`, `featureLandings.test.ts`, `cronJobs.test.ts`, `user.test.ts`, e2e `pro-tier`/`pro-perks`) | High | Update with the code, never weaken. Parametrized table test over all 10 keys is written first (TDD). |
| FLUX_KONTEXT_PRO and FLUX_2_PRO costs jump 1 to 5; stale cost copy in `pricingFAQ.json` ("premium generation 4–5") and "no paid subscription tiers" in both FAQ JSONs | Med | Phase 1 T1.7 sweeps cost copy with a local grep; Phase 7 removes the "no paid tiers" claim. `check:model-docs` is not a cost check and calls live Replicate, so it is never run. |
| Stale Free selection of a now Pro-only model (FLUX_KONTEXT_PRO, FLUX_REALISM, etc.) yields a raw error | Med | Phase 2 maps `PremiumModelRequiresProError` to the pricing upsell in `stores/generate.ts`; test it. |
| Cron timezone pinned to UTC shifts reset instant once | Low (accepted) | Note in release notes; test asserts `{ timezone: "UTC" }`. |
| Pro filter drift between `isPro()` and cron | High | Single builder in `lib/isPro.ts` plus fixture parity test. |
| Webhook top-up: RENEWED must not top up; replays harmless | Med | `$max` on ACTIVATED only, in `payments/service.ts`; tests for 12->50, 80->80, replay, RENEWED, EXPIRED. |
| AppModal backdrop change regresses other dialogs | Med | Run all dialog tests; if any break, add a `backdrop` prop defaulting to old look except BuyMoreCredits. |
| Dev override leaking to production | High | Env gate in `geo.ts`; tests for `production` and `staging`; startup warning in `config/env.ts`. |
| Real paid calls from e2e | High | All new/changed specs stub `POST /generate/image|video`, progress, results; `paidCallGuard` stays on; no bypass or opt-out. Gate tests (Phase 2) use mocked Replicate client only. |
| Free user above 100 history after downgrade | Low | `getHistoryFullLevel` treats count >= cap as full; no deletion. |

---

## Phase 1: Shared constants (foundation)

**Goal:** One source of truth for tiers, costs, daily credits, reset hour, history thresholds; all consumers compile.

**Tasks**
1. Tests first: parametrized table test over 10 keys for `getCreditCost` and `PREMIUM_MODEL_KEYS` membership (length 6); `getDailyCredits(true|false)`; `getHistoryFullLevel` boundaries (89/90/99/100 of 100 and 500, count above cap = full, unknown/NaN = none).
2. `credits.ts`: add `PREMIUM_CREDIT_COST = 5`, use it for the 10 rows, `DAILY_CREDITS = { free: 30, pro: 50 } as const`, `getDailyCredits`, `DAILY_RESET_UTC_HOUR = 0`, update `getCreditCost` doc comment. `plans.ts`: `PREMIUM_MODEL_KEYS` = six keys (remove FLUX_2_MAX), add `HISTORY_NEAR_FULL_RATIO = 0.9` and `getHistoryFullLevel(count, cap)`; export via `models/index.ts`.
3. Migrate every `DAILY_CREDITS` consumer to `.free`/`getDailyCredits` as semantically right: `apps/api/src/models/user.ts` (+`user.test.ts`), `apps/api/src/services/generation-service.ts`, `apps/api/src/utils/cronJobs.ts` (temporary `.free`, finished in Phase 3), `apps/web/src/stores/user.ts`, `utils/landing.ts`, `utils/seo.ts` (+tests), `utils/models.ts`, Landing `FinalCta.vue`, `PricingTeaser.vue`, Pricing `PricingHero.vue`, `PricingCreditStory.vue`, Profile `ProfileCreditsCard.vue`, `LowCreditsDialog.vue`, `BuyMoreCreditsDialog.vue`, `ReferralCopyDialog.vue`, `packages/email/src/{constants.ts,V2Announcement.tsx,components/CreditsCallout.tsx}` (+ email tests).
4. Add a consistency test (shared, both FAQ JSONs, landing, seo) that parses `generalFAQ.json` and `pricingFAQ.json` for numbers adjacent to "daily".
5. Sweep cost copy in `pricingFAQ.json` to the new table (local grep for old costs).

**Acceptance:** shared tests green; repo typechecks; `grep -rn DAILY_CREDITS` shows no scalar use; no FAQ copy states an old cost.
**Verification:** `bun run test packages/shared`, `bun run verify`, `bun run test`.
**Files:** `packages/shared/src/models/{credits,plans,index}.ts` and tests, plus the consumers above, `apps/web/src/utils/{generalFAQ,pricingFAQ}.json`.
**Scope:** Large; split into 1a (shared + tests) and 1b (consumer migration) for the builder, with a single checkpoint.

### Checkpoint 1
- [ ] Repo green with shared change; no scalar `DAILY_CREDITS`; review before fan-out.

## Phase 2: Server gate and client lock follow-through (Item 7 vertical)

**Goal:** Free users blocked on the six Pro-only models, charged 5 on the four free 5-credit models; client shows same.

**Tasks**
1. `apps/api/src/routes/generate.ts` (gate ~L139) already reads `PREMIUM_MODEL_KEYS`; verify no hardcoded list, update `generate.test.ts` per spec (Free + each Pro-only key: error code, no deduction, nothing queued; Free + FLUX_2_MAX/FLUX_2_PRO/FLUX_1_1_PRO/FLUX_PRO accepted and charged 5; Pro accepted for all). `generation-service.test.ts` cost expectations.
2. Web: `ModelOption.vue` isLocked (from shared), `stores/generate.ts` `PremiumModelRequiresProError` handling opens pricing with clear upsell (+`generate.test.ts`), `PricingModelCosts.vue` grouping by new costs (+test), Pro-perks copy hook for Phase 7, Featured list check in `ModelPickerPanel.vue`/`apps/web/src/utils/models.ts` (`featured: true` unchanged).
3. e2e `pro-tier.spec.ts`, `pro-perks.spec.ts`, `dev-cloud-reference.spec.ts`, `mods-reference-image.spec.ts` updated for new costs/gates, paid endpoints stubbed.

**Acceptance:** spec Item 7 success criteria; stale Free selection of a Pro-only model gets upsell.
**Verification:** `bun run test apps/api/src/routes apps/api/src/services`, web store/model tests, targeted Playwright (`pro-tier`, `pro-perks`).
**Files:** `apps/api/src/routes/generate.ts(+test)`, `apps/api/src/services/generation-service.ts(+test)`, `apps/web/src/stores/generate.ts(+test)`, `ModelOption.vue(+test)`, `PricingModelCosts.vue(+test)`, e2e specs above.
**Scope:** Medium-Large.

## Phase 3: Plan-aware daily reset and mid-day upgrade (Item 6 server)

**Tasks**
1. `lib/isPro.ts`: export `proUsersFilter(now)` mirroring `isPro` (plan pro AND (active OR (past_due/cancelled AND currentPeriodEnd > now))); parity test with fixture users (active, past_due in/out of period, cancelled in/out, legacy no plan fields).
2. `utils/cronJobs.ts`: schedule `"0 0 * * *"` with `{ timezone: "UTC" }`; two `updateMany`: Pro set 50, complement set 30 (`$nor`/`$not` of the same filter). Update `cronJobs.test.ts` to assert both filters/values and timezone.
3. `payments/service.ts`: on ACTIVATED only, apply `$max: { dailyCredits: DAILY_CREDITS.pro }` with the `buildSubscriptionPatch` update; tests: 12->50, 80->80, replay unchanged, RENEWED no top-up, EXPIRED leaves balance.

**Acceptance:** Item 6 unit criteria. **Verification:** `bun run test apps/api/src/utils apps/api/src/lib apps/api/src/payments`; `bun run verify`.
**Files:** `apps/api/src/lib/isPro.ts(+test)`, `apps/api/src/utils/cronJobs.ts(+test)`, `apps/api/src/payments/service.ts(+test)`.
**Scope:** Medium. Depends on Phase 1.

## Phase 4: Dev country override (Item 4)

**Tasks**
1. TDD `apps/api/src/payments/geo.ts`: precedence override (query `?country=` over `DEV_COUNTRY_OVERRIDE`) then header then IP, only when `NODE_ENV` is development or test; invalid code ("ZZ") ignored with log; production and staging ignore both. All ipapi.co calls mocked.
2. `config/env.ts` (+`env.test.ts`): add `DEV_COUNTRY_OVERRIDE` schema via `normalizeCountryCode`, startup warning when set; `.env.example` doc (currently modified, merge carefully with working-tree edits).
3. `/payments/prices` route (`apps/api/src/payments/router.ts`): pass `req.query.country`; route test: `cf-ipcountry: IN` resolves INR; production + override uses header/IP path.
4. Web: `apps/web/src/composables/usePricingCatalog.ts` + shared `formatPrice` (`packages/shared/src/pricing/format.ts`) test rendering the rupee symbol for INR catalog.

**Acceptance:** Item 4 unit criteria; browser with override `IN` shows INR in pricing and buy dialog (set by the user in env; do not start the server).
**Verification:** `bun run test apps/api/src/payments apps/api/src/config`, web catalog test.
**Files:** `apps/api/src/payments/geo.ts(+test)`, `apps/api/src/payments/router.ts(+test)`, `apps/api/src/config/env.ts(+test)`, `apps/api/.env.example`, `apps/web/src/composables/usePricingCatalog.ts(+test)`.
**Scope:** Medium. Independent of Phase 1.

## Phase 5: Model menu (Item 3)

**Skills:** `impeccable`, `layout` for row refinement; follow `vue-best-practices`.
**Tasks**
1. `ModelOption.vue`: single-line row (logo, name+description, ref-image icon with tooltip "Up to N reference images" only when the registry entry has `imageInput`, N = `imageInput.max`; `PremiumLockBadge` for Pro-only viewed by non-Pro; credit cost), uniform height.
2. `ModelPickerPanel.vue`: sections Featured / Free / Pro from shared (`PREMIUM_MODEL_KEYS` split); replace `groupModelsByCompany` for the generation picker only; upscaler/utility pickers unchanged (`UpscaleModelPicker.vue`). Retire or keep `ModelCompanyGroup`/`ModelCompanySubmenu` only if still used elsewhere (check usages before deleting).
3. Tests: `ModelOption.test.ts`, `ModelPickerPanel.test.ts`, `ModelPicker.test.ts` (sections, icon visibility, lock, tooltip text, Pro users no lock).

**Acceptance:** Item 3 success. **Verification:** web unit tests; agent-browser check (repo-unique session) of identical row heights, locks for Free, no lock for Pro.
**Files:** `ModelOption.vue`, `ModelPickerPanel.vue`, `PremiumLockBadge.vue`, related tests. **Scope:** Medium. Depends on Phase 1.

## Phase 6: Upgrade entry point + Buy-credits dialog (Items 1 and 2)

**Skills:** `impeccable`, `layout`, `polish`.
**Tasks**
1. Header: Free-only "Upgrade to Pro" pill next to `CreditsChip.vue`, Pro badge for Pro users, hidden while user loading, icon-only below `sm`; click calls `dialogStore.showPricing()`; keep `UserMenu.vue` entry. Wire in `AppHeader.vue`. Tests for both plan states and click.
2. `AppModal.vue` backdrop ~60% dim + blur (check all dialog tests; fall back to prop if regression).
3. `BuyMoreCreditsDialog.vue`: Upgrade link (Free), per-100-credit price (fix the per-credit formatter in `composables/usePricingCatalog.ts` via a pure helper using shared `formatPrice`; tested for USD, INR, JPY, 2000 pack never "$0.00"), "≈ N images at 1 credit / M at 5 credits" using `PREMIUM_CREDIT_COST`, remove empty Save-% gap via grid rows; tests including no empty save placeholder.
4. e2e: new `qa/upgrade-entry.spec.ts` for pill/badge and dialog link; rerun `qa/localized-prices.spec.ts`.

**Acceptance:** Item 1 and Item 2 success. **Verification:** unit + targeted Playwright + agent-browser visual check at mobile and desktop widths.
**Files:** `Header/{CreditsChip,AppHeader,UserMenu}.vue(+tests)`, `AppModal.vue`, `Dialogs/BuyMoreCreditsDialog.vue(+test)`, `utils/pricePerCredits.ts`, `composables/usePricingCatalog.ts`, `e2e/qa/upgrade-entry.spec.ts`. **Scope:** Large; split into 6a (header) and 6b (dialog).

### Checkpoint 2 (after Phases 2-6)
- [ ] `bun run verify`, `bun run test` green; Free/Pro gating works in browser; reset-time copy waits for Phase 7.

## Phase 7: Unified pricing layout + daily-credit copy (Items 5 and 6 copy)

**Skills:** `impeccable`, `layout`, `typeset`, `polish`; `vue-best-practices`.
**Tasks**
1. New `components/Pricing/PricingLayout.vue` (hero, Free|Pro comparison, packs "Top up any plan", model costs, FAQ last); `pages/Pricing.vue` = layout + site footer; `Dialogs/PricingDialog.vue` = layout, no footer. Unit test asserts both render `PricingLayout`.
2. New `PricingComparison.vue` (30 vs 50 daily, `HISTORY_CAP` 100 vs 500, model access, queue priority, privacy; stacked on mobile); `PricingProCard.vue` perks derived from `PREMIUM_MODEL_KEYS` mapped to registry names, remove `PRICE_NOTE` and update e2e assertions on it (`localized-prices`, `pro-tier`, `mods-reference-image`); `PricingHero.vue` drop "Free Forever, Always"; drop "no paid subscription tiers" from both FAQ JSONs; tighten spacing in sections and FAQ.
3. Reset-time copy: helper formatting `DAILY_RESET_UTC_HOUR` in local time via `Intl.DateTimeFormat`, used in credit story, profile card, FAQ-driven text; confirm `generalFAQ.json` consistent.
4. Update `Pricing.test.ts`, `PricingProCard.test.ts` (perk follows mocked constant, PRICE_NOTE absent), `PricingHero.test.ts`, `PricingCreditStory.test.ts`, `PricingPacks.test.ts`; add comparison test (30 and 50).

**Acceptance:** Item 5 and Item 6 copy criteria. **Verification:** unit; agent-browser on modal and `/pricing`, desktop and mobile; screenshots against the six user screenshots.
**Files:** `pages/Pricing.vue`, `Dialogs/PricingDialog.vue`, `components/Pricing/*`, `generalFAQ.json`, `pricingFAQ.json`, `landing.ts`, `seo.ts`, e2e specs asserting the removed note. **Scope:** Large; split 7a layout/comparison, 7b perks/copy/reset time.

## Phase 8: History-full notices (Item 8)

**Skills:** `impeccable`, `layout` for the inline note.
**Tasks**
1. `UnsavedResultNotice.vue`: new copy with real count/cap from `HISTORY_CAP` by plan, icon Download button (aria-label "Download image"), X Dismiss (aria-label "Dismiss"), remove "Delete images to free space"; Free-only "Upgrade to Pro (500 history)" link from `HISTORY_CAP`.
2. New `HistoryFullNote.vue` using `getHistoryFullLevel` (none/near/full) with exact wordings; Free sees Upgrade link; no note when count unknown/loading. Mount near Generate button / history header (`ResultCanvas.vue` and the prompt/generate area; confirm placement by reading components). Count from history store length; re-evaluated after generation and single/bulk delete (`stores/history.ts`).
3. Tests: helper boundaries (done in Phase 1), component copy/aria/absent delete/upgrade by plan; downgraded-over-cap case treated as full. E2E seeded Free 100 and Pro 500 with stubbed paid endpoints.

**Acceptance:** Item 8 success. **Verification:** unit + Playwright + agent-browser.
**Files:** `Dashboard/Canvas/UnsavedResultNotice.vue(+test)`, new `HistoryFullNote.vue(+test)`, `ResultCanvas.vue`, `stores/history.ts`, `e2e/qa/` new spec, `apps/api/tools/seed-e2e-user.ts` only if seeding is needed (existing working-tree edits; merge carefully). **Scope:** Medium. Depends on Phase 1 only.

## Phase 9: End-to-end gate and docs

**Tasks**
1. Full e2e pass of affected specs (pro-tier, pro-perks, localized-prices, plan-status, subscription-lifecycle, new history spec); confirm `paidCallGuard` reports zero un-intercepted paid calls and `paid-call-guard.spec.ts` still passes.
2. Final consistency: `grep -rn DAILY_CREDITS` clean, no duplicated model lists in web copy (grep for model display names in Pricing components), FAQ JSON consistency test.
3. No new docs; repo docs carry no model costs today (checked).
4. Browser walkthrough of the whole spec via the seeded QA specs; optional agent-browser visual pass (session name = repo basename), then `agent-browser close`.

**Acceptance:** every spec item verifiable in browser; `bun run verify`, `bun run test` green; independent verifier (phase-verifier) PASS per phase.
**Scope:** Small-Medium.

### Checkpoint: Complete
- [ ] All 8 items' success criteria met; no real paid calls; nothing committed unless instructed.

## Open Questions
None blocking; defaults per SPEC Assumptions (UTC cron, global AppModal backdrop, dev override via env var plus `?country=`). Working tree already has uncommitted edits in `generate.ts`, `generation-service.ts`, `env.ts`, `.env.example`, `seed-e2e-user.ts` and several e2e specs from the previous (paid-call-guard) work; implementers must read current content and merge, not overwrite.
