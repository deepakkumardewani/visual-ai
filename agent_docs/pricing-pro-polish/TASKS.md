# Tasks: Pricing and Pro Polish

Source: SPEC.md, PLAN.md. Branch: feature-enhancement. Never start servers (always running). No commits unless the owner asks. The project already has Playwright, Vitest, the seeded QA harness (`apps/web/e2e/qa/`, `e2e/fixtures/qa.ts`), e2e prod-server mode (`E2E_SERVER=prod`, documented in `apps/web/e2e/README.md`) and the required .gitignore entries (`test-results/`, `playwright-report/`, `coverage/`, `.dashboard/*/reports/`, `.next-e2e`), so no Phase 0 setup tasks are needed.

Commands: root `bun run verify`, `bun run test`; web `cd apps/web && bun run test` / `bun run check`; api `cd apps/api && bun run test`; shared `cd packages/shared && npx vitest run`; e2e `cd apps/web && bunx playwright test <spec>`.

Mock-only rule (applies to every task): no task may make a real Replicate, Dodo live or email call. Every e2e spec stubs `POST /generate/image`, `/generate/video`, progress and result URLs, keeps `paidCallGuard` on and never opts out. API tests use the mocked Replicate client and mocked ipapi.co. Never run `bun run check:model-docs`: it calls the live Replicate API with `REPLICATE_API_TOKEN` and does not check costs. Working tree already has uncommitted edits in `generate.ts`, `generation-service.ts`, `env.ts`, `.env.example`, `seed-e2e-user.ts` and several e2e specs: read current content and merge, never overwrite. When a change breaks an existing test assertion, the implementation task updates that assertion (never weakens it); new coverage is written by the dedicated Unit/E2E tasks.

## Phase 1: Shared constants foundation

**Adds:** Model tiers, the 5-credit cost, per-plan daily credits (30 Free, 50 Pro), the reset hour and the history-full helper live in one shared place. Every existing consumer is migrated so the repo still compiles and shows the right numbers.
**Try in UI:** No new UI ; run `grep -rn DAILY_CREDITS apps packages --exclude-dir=node_modules --exclude-dir=coverage` and confirm no scalar use ; run `grep -n "4–5" apps/web/src/utils/pricingFAQ.json` and confirm no old premium cost ; open the dashboard and confirm Free shows 30 daily credits.

### ✅ T1.1 Shared tier, cost, daily, history constants

- **Kind:** implementation
- **Files:** `packages/shared/src/models/credits.ts`, `packages/shared/src/models/plans.ts`, `packages/shared/src/models/index.ts`, `packages/shared/src/models/plans.test.ts`, `packages/shared/src/models/registry.ts`
- **Do:** In `credits.ts` add `PREMIUM_CREDIT_COST = 5`, use it for the ten rows of the SPEC item 7 table, make `DAILY_CREDITS = { free: 30, pro: 50 } as const`, add `getDailyCredits(isPro)` and `DAILY_RESET_UTC_HOUR = 0`, update the `getCreditCost` doc comment. In `plans.ts` make `PREMIUM_MODEL_KEYS` exactly the six Pro-only keys (remove FLUX_2_MAX), add `HISTORY_NEAR_FULL_RATIO = 0.9` and pure `getHistoryFullLevel(count, cap)` returning none/near/full (count at or above cap is full, unknown or NaN is none). Export everything via `models/index.ts`. Fix assertions in the existing `plans.test.ts` that encode old tiers. Touch `registry.ts` only if a later phase needs an `imageInput` field exposed; the `featured: true` flags live in `apps/web/src/utils/models.ts` and stay unchanged.
- **Acceptance:** SPEC items 6 and 7 constants exist exactly as specified; `PREMIUM_MODEL_KEYS` has 6 entries; shared package typechecks; no duplicated model lists.
- **Verify:** `cd packages/shared && npx vitest run`; `bun run check`.

### ✅ T1.2 Migrate API DAILY_CREDITS consumers

- **Kind:** implementation
- **Files:** `apps/api/src/models/user.ts`, `apps/api/src/models/user.test.ts`, `apps/api/src/services/generation-service.ts`, `apps/api/src/utils/cronJobs.ts`, `apps/api/src/utils/cronJobs.test.ts`
- **Do:** Replace scalar `DAILY_CREDITS` use with `DAILY_CREDITS.free` or `getDailyCredits` as semantically right (user default is Free). In `cronJobs.ts` use `.free` temporarily (Phase 3 finishes it). Update existing tests that import the old shape.
- **Acceptance:** SPEC item 6 completeness: no scalar use in `apps/api`; API typechecks; `SIGNUP_CREDITS` and `REFERRAL_BONUS` unchanged.
- **Verify:** `cd apps/api && bun run test`; `bun run check`; `grep -rn DAILY_CREDITS apps/api/src --exclude-dir=node_modules`.

### ✅ T1.3 Migrate email package consumers

- **Kind:** implementation
- **Files:** `packages/email/src/constants.ts`, `packages/email/src/V2Announcement.tsx`, `packages/email/src/components/CreditsCallout.tsx`, `packages/email/src/V2Announcement.test.ts`, `packages/email/src/render.test.ts`
- **Do:** Switch email copy to `DAILY_CREDITS.free` (no email is sent; tests render only). Merge with existing working-tree edits in `packages/email`.
- **Acceptance:** SPEC item 6 email consumers compile and render tests pass; no email is sent or any mail client invoked.
- **Verify:** `cd packages/email && npx vitest run`; `bun run check`.

### ✅ T1.4 Migrate web stores and utils

- **Kind:** implementation
- **Files:** `apps/web/src/stores/user.ts`, `apps/web/src/utils/landing.ts`, `apps/web/src/utils/seo.ts`, `apps/web/src/utils/seo.test.ts`, `apps/web/src/utils/featureLandings.test.ts`
- **Do:** Derive daily credit numbers from shared constants (`DAILY_CREDITS.free` / `getDailyCredits`) in the user store, landing and SEO copy. Update existing tests that assert the old scalar.
- **Acceptance:** SPEC item 6: TS copy derives from constants; user store exposes the plan-appropriate daily amount (30 Free, 50 Pro).
- **Verify:** `cd apps/web && npx vitest run src/utils/seo.test.ts src/utils/featureLandings.test.ts src/utils/landing.test.ts src/stores/user.test.ts`; `bun run check`.

### ✅ T1.5 Migrate web components A

- **Kind:** implementation
- **Files:** `apps/web/src/components/Landing/FinalCta.vue`, `apps/web/src/components/Landing/PricingTeaser.vue`, `apps/web/src/components/Pricing/PricingHero.vue`, `apps/web/src/components/Dialogs/LowCreditsDialog.vue`, `apps/web/src/components/Dialogs/ReferralCopyDialog.vue`
- **Do:** Replace scalar `DAILY_CREDITS` and hardcoded daily-credit numbers with shared constants; low-credits dialog shows the plan-appropriate amount. Update their co-located existing tests where assertions break.
- **Acceptance:** SPEC item 6: these components compile and render 30 for Free and 50 for Pro where plan-dependent; no literal daily number remains.
- **Verify:** `cd apps/web && npx vitest run src/components/Landing src/components/Pricing/PricingHero.test.ts src/components/Dialogs/LowCreditsDialog.test.ts src/components/Dialogs/ReferralCopyDialog.test.ts`; `bun run check`.

### ✅ T1.6 Migrate web components B and FAQ JSON

- **Kind:** implementation
- **Files:** `apps/web/src/components/Profile/ProfileCreditsCard.vue`, `apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue`, `apps/web/src/components/Pricing/PricingCreditStory.vue`, `apps/web/src/utils/generalFAQ.json`, `apps/web/src/utils/models.ts`
- **Do:** Same migration; profile card shows 50/day for Pro and 30/day for Free. Update `generalFAQ.json` daily-credit numbers to match the constants (JSON cannot import). Fix `models.ts` cost docs/derivations for the new 5-credit costs. Update co-located existing tests where assertions break.
- **Acceptance:** SPEC item 6 completeness: `grep -rn DAILY_CREDITS apps packages --exclude-dir=node_modules --exclude-dir=coverage` shows no remaining scalar use; FAQ JSON matches constants.
- **Verify:** `cd apps/web && npx vitest run src/components/Profile src/components/Dialogs/BuyMoreCreditsDialog.test.ts src/components/Pricing/PricingCreditStory.test.ts src/utils/models.test.ts`; `bun run check`.

### ✅ T1.7 Pricing FAQ cost and daily copy

- **Kind:** implementation
- **Files:** `apps/web/src/utils/pricingFAQ.json`
- **Do:** Update the cost sentence ("budget generation 1 credit; premium generation 4–5") to the SPEC item 7 table (premium generation 5) and keep the daily-credit numbers consistent with `DAILY_CREDITS` (Free 30, Pro 50). Leave the "no paid subscription tiers" sentence to T7.4. Do not run `check:model-docs` (live Replicate call; it does not check costs). Repo docs (`*.md`) carry no model costs, so none change.
- **Acceptance:** SPEC item 7: no FAQ copy states an old cost; SPEC item 6: daily numbers match the constants.
- **Verify:** `grep -nE "4–5|4-5" apps/web/src/utils/pricingFAQ.json` returns nothing; `cd apps/web && npx vitest run src/utils`.

### ✅ T1.8 Unit: shared constants

- **Kind:** unit
- **Files:** `packages/shared/src/models/credits.ts`, `packages/shared/src/models/plans.ts`, `packages/shared/src/models/credits.test.ts`, `packages/shared/src/models/plans.test.ts`
- **Do:** Write `credits.test.ts` and extend `plans.test.ts`: parametrized table over all 10 model keys asserting `getCreditCost` and `PREMIUM_MODEL_KEYS` membership (length 6); `getDailyCredits(true|false)`; `getHistoryFullLevel` boundaries 89/90/99/100 of 100 and 500, count above cap is full, NaN/undefined is none.
- **Acceptance:** SPEC item 7 unit criterion and item 8 helper boundaries covered; every file at least 80% lines/branches/functions/statements, target over 95%; no `it.fails` unless the source has a real bug.
- **Verify:** `cd packages/shared && npx vitest run src/models/credits.test.ts src/models/plans.test.ts --coverage --coverage.include=src/models/credits.ts,src/models/plans.ts --coverage.reporter=text`

### ✅ T1.9 Unit: daily-credit copy consistency

- **Kind:** unit
- **Files:** `apps/web/src/utils/landing.ts`, `apps/web/src/utils/seo.ts`, `apps/web/src/utils/dailyCreditsConsistency.test.ts`
- **Do:** Add `apps/web/src/utils/dailyCreditsConsistency.test.ts` that parses `generalFAQ.json` and `pricingFAQ.json` and asserts every number adjacent to the word "daily" agrees with `DAILY_CREDITS` (do not match "50 persistent"), and that landing and SEO output contain the Free amount derived from shared.
- **Acceptance:** SPEC item 6 consistency test across shared, both FAQ JSONs, landing, seo passes and fails if a number drifts; coverage on listed files at least 80%, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/utils/dailyCreditsConsistency.test.ts src/utils/landing.test.ts src/utils/seo.test.ts --coverage --coverage.include=src/utils/landing.ts,src/utils/seo.ts --coverage.reporter=text`

### ✅ T1.10 E2E: daily credits copy

- **Kind:** e2e
- **Scenarios:** `@critical` Free dashboard credit chip and profile card show 30 daily credits; `@high` landing and /pricing copy mention 30 daily credits; `@high` low-credits dialog shows the Free amount; `@medium` the app still loads with the migrated constants after reload.
- **Spec:** `apps/web/e2e/qa/daily-credits-copy.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from SPEC item 6 copy criteria pass; no paid endpoint reached; `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/daily-credits-copy.spec.ts --repeat-each=3`

### ✅ T1.11 Gate: Phase 1

- **Kind:** gate
- **Files:** none
- **Do:** Run the full suites as evidence.
- **Acceptance:** Repo green; no scalar `DAILY_CREDITS`; no old cost in FAQ copy; no test weakened.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/daily-credits-copy.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`; `grep -rn DAILY_CREDITS apps packages --exclude-dir=node_modules --exclude-dir=coverage`.

🔶 **Checkpoint 1**: shared constants are the single source of truth and the whole repo is green before fan-out.

## Phase 2: Server gate and client lock follow-through

**Adds:** Free users are blocked from the six Pro-only models and charged 5 credits on the four free 5-credit models; the client shows the same locks and a clear upsell instead of a raw error.
**Try in UI:** Log in as Free and open the model picker ; confirm lock plus PRO badge on the six Pro-only models and none on FLUX.2 Max ; click a locked model and see pricing open ; open pricing and read the model cost table grouped by 5 credits.

### ✅ T2.1 API gate and cost expectations

- **Kind:** implementation
- **Files:** `apps/api/src/routes/generate.ts`, `apps/api/src/services/generation-service.ts`, `apps/api/src/routes/generate.test.ts`, `apps/api/src/services/generation-service.test.ts`
- **Do:** Confirm the gate (~L139) and cost lookup read only `PREMIUM_MODEL_KEYS` and `getCreditCost` with no hardcoded list; remove any found. Update existing test expectations to the new costs and gates without weakening. Merge with working-tree edits.
- **Acceptance:** SPEC item 7: Free requests for a Pro-only key return the premium-required error with no deduction and nothing queued; Free with FLUX_2_MAX/FLUX_2_PRO/FLUX_1_1_PRO/FLUX_PRO accepted and charged 5; Pro accepted for all; Replicate is always mocked.
- **Verify:** `cd apps/api && bun run test src/routes/generate.test.ts src/services/generation-service.test.ts`; `bun run check`.

### ✅ T2.2 Web lock, upsell and cost table

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue`, `apps/web/src/stores/generate.ts`, `apps/web/src/components/Pricing/PricingModelCosts.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`
- **Do:** `isLocked` derives from `PREMIUM_MODEL_KEYS`; `PremiumModelRequiresProError` in the generate store opens pricing with a clear upsell message (no raw error); `PricingModelCosts.vue` groups by the new costs (for example "5: ..."); confirm Featured keeps its `featured: true` set in `apps/web/src/utils/models.ts` and Flux 2 Pro stays eligible and free. Update existing co-located tests that assert old costs or locks.
- **Acceptance:** SPEC item 7 follow-through: lock and PRO badge on six Pro-only models for Free, none on FLUX_2_MAX; stale Free selection of a Pro-only model gets the upsell; cost table matches the table in SPEC item 7.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker src/stores/generate.test.ts src/components/Pricing/PricingModelCosts.test.ts`; `bun run check`.

### ✅ T2.3 Unit: API gate and charging

- **Kind:** unit
- **Files:** `apps/api/src/routes/generate.ts`, `apps/api/src/services/generation-service.ts`
- **Do:** Add parametrized route and service tests over the SPEC item 7 table: each Pro-only key rejected for Free (error code, balance unchanged, queue untouched), each free 5-credit key accepted and charged 5, Pro accepted for all. Mocked Replicate client only.
- **Acceptance:** SPEC item 7 API criteria covered; every file at least 80% lines/branches/functions/statements, target over 95%; no real Replicate call.
- **Verify:** `cd apps/api && npx vitest run src/routes/generate.test.ts src/services/generation-service.test.ts --coverage --coverage.include=src/routes/generate.ts,src/services/generation-service.ts --coverage.reporter=text`

### ✅ T2.4 Unit: web lock, store and cost table

- **Kind:** unit
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue`, `apps/web/src/stores/generate.ts`, `apps/web/src/components/Pricing/PricingModelCosts.vue`
- **Do:** Test lock for each of the ten keys by plan, `PremiumModelRequiresProError` opening pricing, and cost table grouping.
- **Acceptance:** SPEC item 7 browser-facing logic covered; every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelOption.test.ts src/stores/generate.test.ts src/components/Pricing/PricingModelCosts.test.ts --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelOption.vue,src/stores/generate.ts,src/components/Pricing/PricingModelCosts.vue --coverage.reporter=text`

### ✅ T2.5 E2E: model tiers and gating

- **Kind:** e2e
- **Scenarios:** `@critical` Free sees lock and PRO badge on the six Pro-only models and clicking opens pricing; `@critical` Free can select FLUX.2 Max with no lock and cost shows 5; `@critical` Pro sees no locks; `@high` stale Pro-only selection for Free shows the upsell not a raw error (generate endpoint stubbed to return the premium-required error); `@high` existing specs `pro-perks`, `dev-cloud-reference`, `mods-reference-image` updated for new costs and gates with paid endpoints stubbed; `@medium` cost table shows the 5-credit group.
- **Spec:** `apps/web/e2e/qa/pro-tier.spec.ts`
- **Files:** `apps/web/e2e/qa/pro-perks.spec.ts`, `apps/web/e2e/qa/dev-cloud-reference.spec.ts`, `apps/web/e2e/qa/mods-reference-image.spec.ts`
- **Acceptance:** Scenarios derived from SPEC item 7 browser criteria pass; `paidCallGuard` reports zero un-intercepted paid calls; no real Replicate call.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/pro-perks.spec.ts e2e/qa/dev-cloud-reference.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=3`

### ✅ T2.6 Gate: Phase 2

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** SPEC item 7 success criteria met; API and web tests green; no test weakened.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/pro-perks.spec.ts --repeat-each=2`; `bun run test`; `bun run check`.

🔶 **Checkpoint 2**: server gate, charging and client lock match the SPEC item 7 table.

## Phase 3: Plan-aware daily reset and mid-day upgrade

**Adds:** Pro users get 50 daily credits and Free users 30, reset at 00:00 UTC. Subscribing to Pro mid-day tops the balance up to 50 once, never on renewal or webhook replay.
**Try in UI:** Log in as Free and note the chip shows up to 30 ; activate Pro through the signed test webhook and see the balance rise to 50 if it was lower ; reload and confirm it does not top up again.

### ✅ T3.1 Single Pro filter builder

- **Kind:** implementation
- **Files:** `apps/api/src/lib/isPro.ts`
- **Do:** Export `proUsersFilter(now)` mirroring `isPro` (plan pro AND (status active OR (status in past_due/cancelled AND currentPeriodEnd > now))) and a complement helper for Free (legacy users lacking plan fields count as Free). `isPro` stays the single definition of Pro; document why the two must not drift.
- **Acceptance:** SPEC item 6: one exported builder used by the cron; `isPro` behaviour unchanged.
- **Verify:** `cd apps/api && bun run test src/lib/isPro.test.ts`; `bun run check`.

### ✅ T3.2 Cron per-plan reset in UTC

- **Kind:** implementation
- **Files:** `apps/api/src/utils/cronJobs.ts`, `apps/api/src/utils/cronJobs.test.ts`
- **Do:** Schedule `"0 0 * * *"` with `{ timezone: "UTC" }` (derive the hour from `DAILY_RESET_UTC_HOUR`). Two `updateMany` calls: Pro filter sets `getDailyCredits(true)`, complement sets `getDailyCredits(false)`. Update existing cron test expectations.
- **Acceptance:** SPEC item 6: Pro get 50, everyone else 30, timezone pinned to UTC; past_due/cancelled within period still Pro; after period end 30.
- **Verify:** `cd apps/api && bun run test src/utils/cronJobs.test.ts`; `bun run check`.

### ✅ T3.3 Mid-day upgrade top-up on ACTIVATED

- **Kind:** implementation
- **Files:** `apps/api/src/payments/service.ts`
- **Do:** On subscription ACTIVATED only (not RENEWED), apply `$max: { dailyCredits: DAILY_CREDITS.pro }` atomically alongside `buildSubscriptionPatch`. EXPIRED leaves the balance untouched (no claw-back).
- **Acceptance:** SPEC item 6: current 12 becomes 50, current 80 stays 80, replay unchanged, RENEWED no top-up, EXPIRED leaves balance.
- **Verify:** `cd apps/api && bun run test src/payments/service.test.ts src/payments/service.subscription.test.ts`; `bun run check`.

### ✅ T3.4 Unit: Pro filter and cron

- **Kind:** unit
- **Files:** `apps/api/src/lib/isPro.ts`, `apps/api/src/utils/cronJobs.ts`
- **Do:** Parity test cross-checking `isPro` against `proUsersFilter` on fixture users (active, past_due in and out of period, cancelled in and out, legacy no-plan-fields, free); cron test asserts both update filters and values and the `timezone: "UTC"` option and `"0 0 * * *"` schedule.
- **Acceptance:** SPEC item 6 cron and parity criteria; every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/lib/isPro.test.ts src/utils/cronJobs.test.ts --coverage --coverage.include=src/lib/isPro.ts,src/utils/cronJobs.ts --coverage.reporter=text`

### ✅ T3.5 Unit: subscription top-up

- **Kind:** unit
- **Files:** `apps/api/src/payments/service.ts`
- **Do:** Webhook-level tests: ACTIVATED with current 12 gives 50; 80 stays 80; replay of the same event leaves balance unchanged; RENEWED does not top up; EXPIRED leaves balance; same-day cancel, expire and re-subscribe tops up again. Dodo client mocked.
- **Acceptance:** SPEC item 6 webhook criteria and edge cases; file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/payments/service.test.ts src/payments/service.subscription.test.ts src/payments/webhookLifecycle.test.ts --coverage --coverage.include=src/payments/service.ts --coverage.reporter=text`

### ✅ T3.6 E2E: Pro daily credits and mid-day top-up

- **Kind:** e2e
- **Scenarios:** `@critical` Free account shows 30/day on the profile credits card (local-time reset text is Phase 7, covered by T7.7); `@critical` signed ACTIVATED webhook raises a low balance to 50 and the chip updates; `@high` a replayed or RENEWED webhook does not change the balance; `@high` Pro profile shows 50/day; `@medium` a balance above 50 is unchanged by activation.
- **Spec:** `apps/web/e2e/qa/daily-credits.spec.ts`
- **Files:** `apps/web/e2e/support/proWebhook.ts`
- **Acceptance:** Scenarios derived from SPEC item 6 browser criteria pass; Pro state set only via the signed test webhook (no Dodo live); no paid endpoint reached.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/daily-credits.spec.ts --repeat-each=3`

### ✅ T3.7 Gate: Phase 3

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** SPEC item 6 server criteria met; cron, filter parity and webhook tests green.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/daily-credits.spec.ts --repeat-each=2`; `bun run test`; `bun run check`.

🔶 **Checkpoint 3**: plan-aware UTC reset and idempotent mid-day top-up verified.

## Phase 4: Dev country override

**Adds:** In local development the API can be told which country to price for, so INR and other currencies are testable. Production and staging ignore the override entirely.
**Try in UI:** Set `DEV_COUNTRY_OVERRIDE=IN` in the API env (owner action, server already running) ; open pricing and the buy-credits dialog and see rupee prices ; remove it and confirm USD again.

### ✅ T4.1 Geo override and prices route

- **Kind:** implementation
- **Files:** `apps/api/src/payments/geo.ts`, `apps/api/src/payments/router.ts`
- **Do:** In `resolveCountry` add override precedence: `?country=` query beats `DEV_COUNTRY_OVERRIDE`, then header, then IP; honoured only when `NODE_ENV` is development or test; both validated with `normalizeCountryCode`; invalid code (for example "ZZ") ignored with a log and falls through. Pass `req.query.country` from the `/payments/prices` route.
- **Acceptance:** SPEC item 4: override works in dev and test, is ignored in production and staging; invalid codes fall through to header/IP.
- **Verify:** `cd apps/api && bun run test src/payments/geo.test.ts src/payments/router.test.ts`; `bun run check`.

### ✅ T4.2 Env schema, startup warning and docs

- **Kind:** implementation
- **Files:** `apps/api/src/config/env.ts`, `apps/api/.env.example`
- **Do:** Add optional `DEV_COUNTRY_OVERRIDE` validated via `normalizeCountryCode`; log a warning at startup when set (does not fail boot); document it in `.env.example`. Merge carefully with working-tree edits.
- **Acceptance:** SPEC item 4: env var documented and validated; warning logged when set; boot never fails because of it.
- **Verify:** `cd apps/api && bun run test src/config/env.test.ts`; `bun run check`.

### ✅ T4.3 Unit: geo, env and prices route

- **Kind:** unit
- **Files:** `apps/api/src/payments/geo.ts`, `apps/api/src/payments/router.ts`, `apps/api/src/config/env.ts`
- **Do:** Tests: query beats env var beats header beats IP in dev and test; `NODE_ENV=production` and `staging` with the override set still use header/IP; `cf-ipcountry: IN` with no override resolves IN and `/payments/prices` returns INR amounts; invalid "ZZ" ignored with log; env warning emitted. ipapi.co mocked in every test (no outbound calls).
- **Acceptance:** SPEC item 4 unit criteria; every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/payments/geo.test.ts src/payments/router.test.ts src/config/env.test.ts --coverage --coverage.include=src/payments/geo.ts,src/payments/router.ts,src/config/env.ts --coverage.reporter=text`

### ✅ T4.4 Unit: web INR rendering

- **Kind:** unit
- **Files:** `apps/web/src/composables/usePricingCatalog.ts`
- **Do:** Test that an INR catalog flows through `usePricingCatalog` and the shared `formatPrice(amountMinor, currency)` (`packages/shared/src/pricing/format.ts`; not the USD-only one in `utils/models.ts`) and renders the rupee symbol; USD stays unchanged; JPY zero-decimal formatting.
- **Acceptance:** SPEC item 4 web catalog test; files at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/composables/usePricingCatalog.test.ts --coverage --coverage.include=src/composables/usePricingCatalog.ts --coverage.reporter=text`

### ✅ T4.5 E2E: localized currency

- **Kind:** e2e
- **Scenarios:** `@critical` request with `cf-ipcountry: IN` shows rupee prices in pricing and the buy dialog; `@high` no header shows USD; `@high` `/payments/prices?country=ZZ` ignored and falls back to header or USD; `@medium` dev `?country=IN` on `/payments/prices` returns INR amounts.
- **Spec:** `apps/web/e2e/qa/localized-prices.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from SPEC item 4 pass; country is set via the `cf-ipcountry` header or dev `?country=` (the always-running API is `NODE_ENV=development`, also under `E2E_SERVER=prod`, which only builds the web app); no paid call; the header-less case may hit the existing free ipapi.co fallback in the running API (not a paid call; unit tests mock it).
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/localized-prices.spec.ts --repeat-each=3`

### ✅ T4.6 Gate: Phase 4

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** SPEC item 4 success criteria met; override cannot act in production.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/localized-prices.spec.ts --repeat-each=2`; `bun run test`; `bun run check`.

🔶 **Checkpoint 4**: dev override works and is provably inert in production and staging.

## Phase 5: Model menu

**Adds:** The model picker shows one tidy line per model (logo, name and description, reference-image icon, PRO lock, cost) and groups models into Featured, Free and Pro sections.
**Try in UI:** Open the model picker as Free ; confirm equal row heights and sections in order Featured, Free, Pro ; hover the reference-image icon to see "Up to N reference images" ; log in as Pro and confirm no locks.

### ✅ T5.1 Single-line ModelOption

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue`, `apps/web/src/components/Dashboard/ModelPicker/PremiumLockBadge.vue`
- **Do:** One line: logo, name plus description, reference-image icon only when the model's registry entry has `imageInput` (tooltip "Up to N reference images", N = `imageInput.max`, the field `stores/aside.ts` uses), PRO lock badge for Pro-only models for non-Pro viewers, then credit cost. Uniform row height; refine with the impeccable and layout skills. Update existing ModelOption tests broken by the change.
- **Acceptance:** SPEC item 3: rows have identical height, icon only for ref-capable models, exact tooltip text, Pro users see no lock.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelOption.test.ts`; `bun run check`.

### ✅ T5.2 Featured / Free / Pro sections

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelCompanyGroup.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelCompanySubmenu.vue`
- **Do:** Replace `groupModelsByCompany` with sections Featured, Free (generation models not in `PREMIUM_MODEL_KEYS`), Pro (`PREMIUM_MODEL_KEYS`) for the generation picker only. Featured keeps its `featured: true` set (including the two Pro-only models, which show the lock for Free) and those models also appear in their tier section. Upscaler and utility pickers keep current behaviour. Delete the company components only if usages are checked and none remain; otherwise leave them.
- **Acceptance:** SPEC item 3: sections in that order; Pro section shows locks for Free users; no change to `UpscaleModelPicker.vue` behaviour.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker`; `bun run check`.

### ✅ T5.3 Unit: model picker

- **Kind:** unit
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`, `apps/web/src/components/Dashboard/ModelPicker/PremiumLockBadge.vue`
- **Do:** Tests for sections and their order, Featured duplicates in tier sections, icon visibility by capability, tooltip text, lock for Free vs none for Pro, upscaler picker unchanged.
- **Acceptance:** SPEC item 3 unit criteria; files at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelOption.vue,src/components/Dashboard/ModelPicker/ModelPickerPanel.vue,src/components/Dashboard/ModelPicker/PremiumLockBadge.vue --coverage.reporter=text`

### ✅ T5.4 E2E: model menu

- **Kind:** e2e
- **Scenarios:** `@critical` sections appear in order Featured, Free, Pro; `@critical` all rows share one height; `@high` reference icon only on ref-capable models with exact tooltip; `@high` Free sees locks in Featured and Pro sections, Pro sees none; `@medium` desktop and mobile widths do not overflow.
- **Spec:** `apps/web/e2e/qa/model-menu.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from SPEC item 3 browser criteria pass; generation endpoints stubbed; `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts --repeat-each=3`

### ✅ T5.5 Gate: Phase 5

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** SPEC item 3 success criteria met.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts --repeat-each=2`; `bun run test`; `bun run check`.

🔶 **Checkpoint 5**: model menu rows and tier sections match SPEC item 3.

## Phase 6: Upgrade entry point and buy-credits dialog

**Adds:** Free users see an "Upgrade to Pro" pill next to their credits and a cross-sell in the buy-credits dialog; Pro users see a Pro badge. The dialog gets a lighter blurred backdrop, readable per-100-credit prices, clearer image estimates and aligned cards.
**Try in UI:** As Free see the pill beside credits and click it to open pricing ; open Buy more credits and check equal-height cards, "per 100 credits" prices and the Upgrade link ; as Pro see the badge instead of the pill ; shrink to mobile width and confirm no header overflow.

### ✅ T6.1 Header pill and Pro badge

- **Kind:** implementation
- **Files:** `apps/web/src/components/Header/CreditsChip.vue`, `apps/web/src/components/Header/AppHeader.vue`, `apps/web/src/components/Header/UserMenu.vue`
- **Do:** Free-only "Upgrade to Pro" pill beside the credits balance calling `dialogStore.showPricing()`; Pro badge in the same spot; plan from `useUserStore().isPro`; hidden while the user is loading (no flash for Pro); icon-only or truncated below the `sm` breakpoint; keep the `UserMenu.vue` entry. Update existing header tests broken by the change.
- **Acceptance:** SPEC item 1: pill for Free, badge for Pro, none while loading, no mobile overflow, click opens pricing.
- **Verify:** `cd apps/web && npx vitest run src/components/Header`; `bun run check`.

### ✅ T6.2 Shared modal backdrop

- **Kind:** implementation
- **Files:** `apps/web/src/components/AppModal.vue`
- **Do:** Backdrop about 60% dim plus blur instead of near-black. Run every dialog test; if any other dialog regresses add a `backdrop` prop defaulting to the old look except BuyMoreCredits.
- **Acceptance:** SPEC item 2 and assumption 4: backdrop dim and blurred, no dialog regression.
- **Verify:** `cd apps/web && npx vitest run src/components/Dialogs src/components/AppModal.test.ts`; `bun run check`.

### ✅ T6.3 Price-per-100-credits helper

- **Kind:** implementation
- **Files:** `apps/web/src/utils/pricePerCredits.ts`, `apps/web/src/composables/usePricingCatalog.ts`
- **Do:** Pure helper returning the localized "per 100 credits" price using shared `formatPrice(amountMinor, currency)` and catalog amounts; no sub-cent rounding for zero-decimal currencies; the 2000-pack never renders "$0.00". Replace the buggy per-credit formatter in `usePricingCatalog.ts` (`formatPrice(amountMinor / pack.credits, currency)`) with this helper rather than keeping both. Also export the image-estimate pair (N images at 1 credit, M = floor(credits / `PREMIUM_CREDIT_COST`) at 5 credits) with no literal 5.
- **Acceptance:** SPEC item 2 price and estimate rules: helper exported and typed, `usePricingCatalog` no longer divides to a per-credit amount, repo typechecks (behaviour proven in T6.6).
- **Verify:** `cd apps/web && bun run check`; `cd apps/web && npx vitest run src/composables/usePricingCatalog.test.ts`.

### ✅ T6.4 Buy-more-credits dialog layout

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue`
- **Do:** Add the "Upgrade to Pro" cross-sell link (Free only) opening pricing; use the per-100 helper and image-estimate text "≈ N images at 1 credit / M at 5 credits"; remove the empty gap on cards without "Save X%" (grid rows or reserved-free layout) so all cards are equal height; polish with impeccable, layout and polish skills. Update existing dialog tests.
- **Acceptance:** SPEC item 2 and item 1 dialog link: no card shows $0.00, no empty save placeholder, cards equal height, link present for Free only.
- **Verify:** `cd apps/web && npx vitest run src/components/Dialogs/BuyMoreCreditsDialog.test.ts`; `bun run check`.

### ✅ T6.5 Unit: header

- **Kind:** unit
- **Files:** `apps/web/src/components/Header/CreditsChip.vue`, `apps/web/src/components/Header/AppHeader.vue`, `apps/web/src/components/Header/UserMenu.vue`
- **Do:** Tests for Free pill, Pro badge, loading state hides both, click handler calls `showPricing`, UserMenu entry retained.
- **Acceptance:** SPEC item 1 unit criteria; files at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/components/Header --coverage --coverage.include=src/components/Header/CreditsChip.vue,src/components/Header/AppHeader.vue,src/components/Header/UserMenu.vue --coverage.reporter=text`

### ✅ T6.6 Unit: price helper, dialog and modal

- **Kind:** unit
- **Files:** `apps/web/src/utils/pricePerCredits.ts`, `apps/web/src/composables/usePricingCatalog.ts`, `apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue`, `apps/web/src/components/AppModal.vue`, `apps/web/src/utils/pricePerCredits.test.ts`
- **Do:** Helper tests across all packs in USD, INR and JPY (2000-pack never "$0.00"); image-estimate text test; DOM test that no empty "save" placeholder renders; Upgrade link by plan; AppModal backdrop classes.
- **Acceptance:** SPEC item 2 unit criteria; files at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/utils/pricePerCredits.test.ts src/composables/usePricingCatalog.test.ts src/components/Dialogs/BuyMoreCreditsDialog.test.ts src/components/AppModal.test.ts --coverage --coverage.include=src/utils/pricePerCredits.ts,src/composables/usePricingCatalog.ts,src/components/Dialogs/BuyMoreCreditsDialog.vue,src/components/AppModal.vue --coverage.reporter=text`

### ✅ T6.7 E2E: upgrade entry and buy dialog

- **Kind:** e2e
- **Scenarios:** `@critical` Free shows the pill and click opens pricing; `@critical` Pro (activated by signed test webhook) shows the badge and no pill; `@high` buy dialog has Upgrade link for Free, cards equal height, no "$0.00", per-100 text; `@high` backdrop is blurred and dim; `@medium` mobile width has no horizontal overflow; `@medium` no pill flash while loading.
- **Spec:** `apps/web/e2e/qa/upgrade-entry.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from SPEC items 1 and 2 browser criteria pass; no checkout or Dodo live call (checkout endpoints stubbed); `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/upgrade-entry.spec.ts --repeat-each=3`

### ✅ T6.8 Gate: Phase 6

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** SPEC items 1 and 2 success criteria met; other dialog tests unaffected by the backdrop.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/upgrade-entry.spec.ts e2e/qa/localized-prices.spec.ts --repeat-each=2`; `bun run test`; `bun run check`.

🔶 **Checkpoint 6**: upgrade entry point and buy-credits dialog polished; repo green.

## Phase 7: Unified pricing layout and daily-credit copy

**Adds:** The pricing modal and the /pricing page share one layout: Free vs Pro comparison, packs framed as "Top up any plan", model costs, then FAQ. The "Free Forever" claim and the approximate-price note are gone, Pro perks list the real Pro models, and reset times show in local time.
**Try in UI:** Open pricing from the header pill and visit /pricing ; confirm the same layout with the footer only on the page ; read Free 30 vs Pro 50 daily credits and history 100 vs 500 ; confirm the six Pro models in perks and no "Approx. price" note.

### ☐ T7.1 Shared PricingLayout and wrappers

- **Kind:** implementation
- **Files:** `apps/web/src/components/Pricing/PricingLayout.vue`, `apps/web/src/pages/Pricing.vue`, `apps/web/src/components/Dialogs/PricingDialog.vue`
- **Do:** New `PricingLayout.vue` (hero, comparison, packs, model costs, FAQ last). `Pricing.vue` renders layout plus site footer; `PricingDialog.vue` renders layout with no footer. Remove large empty space in sections and the FAQ. Update existing Pricing and dialog tests broken by the change.
- **Acceptance:** SPEC item 5: both surfaces render the same layout component; order comparison, packs, model costs, FAQ; no footer before or inside the FAQ in the modal.
- **Verify:** `cd apps/web && npx vitest run src/pages/Pricing.test.ts src/components/Dialogs/PricingDialog.test.ts`; `bun run check`.

### ☐ T7.2 Comparison, hero and packs

- **Kind:** implementation
- **Files:** `apps/web/src/components/Pricing/PricingComparison.vue`, `apps/web/src/components/Pricing/PricingHero.vue`, `apps/web/src/components/Pricing/PricingPacks.vue`
- **Do:** New side-by-side Free | Pro comparison (stacked on mobile) with daily credits from `DAILY_CREDITS` (30 vs 50), history from `HISTORY_CAP` (100 vs 500), model access, queue priority, privacy. Hero drops "Free Forever, Always" and any copy contradicting the Pro upsell. Packs framed "Top up any plan"; keep pack prices and Pro $5/mo. Use impeccable, layout, typeset and polish skills.
- **Acceptance:** SPEC item 5 and item 6 comparison: numbers derive from shared constants; hero copy does not contradict the upsell.
- **Verify:** `cd apps/web && npx vitest run src/components/Pricing`; `bun run check`.

### ☐ T7.3 Pro card perks from shared

- **Kind:** implementation
- **Files:** `apps/web/src/components/Pricing/PricingProCard.vue`, `apps/web/e2e/qa/localized-prices.spec.ts`, `apps/web/e2e/qa/pro-tier.spec.ts`, `apps/web/e2e/qa/mods-reference-image.spec.ts`
- **Do:** Remove `PRICE_NOTE` ("Approx. price; final amount in your currency is shown at checkout"). Derive the Pro model list from `PREMIUM_MODEL_KEYS` mapped to registry display names instead of the hardcoded string; keep $5/mo. Update existing e2e assertions that expect the approx note or the old hardcoded perk string (for example the `localized-prices` test "…with the approx. note") to the new copy, without weakening them.
- **Acceptance:** SPEC item 5: removed note absent; perks list the six Pro models and follow the constant; the three existing specs pass against the new copy.
- **Verify:** `cd apps/web && npx vitest run src/components/Pricing/PricingProCard.test.ts`; `bun run check`; `cd apps/web && bunx playwright test e2e/qa/localized-prices.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/mods-reference-image.spec.ts`.

### ☐ T7.4 Local-time reset copy

- **Kind:** implementation
- **Files:** `apps/web/src/utils/dailyReset.ts`, `apps/web/src/components/Profile/ProfileCreditsCard.vue`, `apps/web/src/components/Pricing/PricingCreditStory.vue`, `apps/web/src/utils/generalFAQ.json`, `apps/web/src/utils/pricingFAQ.json`
- **Do:** Helper formats `DAILY_RESET_UTC_HOUR` (00:00 UTC) in the browser's local time via `Intl.DateTimeFormat` (for example "Resets daily at 5:30 AM"); use it in the credit story (replacing "Refreshed at midnight") and profile card; both FAQ JSONs state a consistent reset statement (00:00 UTC) and drop "There are no paid subscription tiers" so they do not contradict Pro (the JSON consistency test from Phase 1 must still pass).
- **Acceptance:** SPEC item 6: reset time shown explicitly in local time from one shared constant; Pro profile 50/day, Free 30/day; SPEC item 5: no FAQ says there are no paid tiers.
- **Verify:** `cd apps/web && npx vitest run src/components/Profile src/components/Pricing/PricingCreditStory.test.ts src/utils/dailyCreditsConsistency.test.ts`; `bun run check`.

### ☐ T7.5 Unit: pricing layout, comparison and perks

- **Kind:** unit
- **Files:** `apps/web/src/components/Pricing/PricingLayout.vue`, `apps/web/src/components/Pricing/PricingComparison.vue`, `apps/web/src/components/Pricing/PricingProCard.vue`, `apps/web/src/pages/Pricing.vue`, `apps/web/src/components/Dialogs/PricingDialog.vue`
- **Do:** Assert page and dialog both render `PricingLayout`; dialog has no footer and FAQ is last; comparison renders 30, 50, 100, 500; `PRICE_NOTE` text absent; perks follow a changed mocked `PREMIUM_MODEL_KEYS`; hero no longer contains "Free Forever". Update `Pricing.test.ts`, `PricingProCard.test.ts`, `PricingHero.test.ts`, `PricingPacks.test.ts`.
- **Acceptance:** SPEC item 5 unit criteria; files at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/pages/Pricing.test.ts src/components/Dialogs/PricingDialog.test.ts src/components/Pricing --coverage --coverage.include=src/components/Pricing/PricingLayout.vue,src/components/Pricing/PricingComparison.vue,src/components/Pricing/PricingProCard.vue,src/pages/Pricing.vue,src/components/Dialogs/PricingDialog.vue --coverage.reporter=text`

### ☐ T7.6 Unit: reset time helper and hero

- **Kind:** unit
- **Files:** `apps/web/src/utils/dailyReset.ts`, `apps/web/src/components/Pricing/PricingHero.vue`, `apps/web/src/components/Pricing/PricingCreditStory.vue`
- **Do:** Test `dailyReset` across several timezones including half-hour offsets (for example Asia/Kolkata gives 5:30 AM) using a stubbed timezone; hero and credit story copy tests.
- **Acceptance:** SPEC item 6 reset copy criteria; files at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/utils/dailyReset.test.ts src/components/Pricing/PricingHero.test.ts src/components/Pricing/PricingCreditStory.test.ts --coverage --coverage.include=src/utils/dailyReset.ts,src/components/Pricing/PricingHero.vue,src/components/Pricing/PricingCreditStory.vue --coverage.reporter=text`

### ☐ T7.7 E2E: pricing layout

- **Kind:** e2e
- **Scenarios:** `@critical` modal and /pricing show comparison, packs, model costs, FAQ in that order; `@critical` modal has no site footer, page has it after the FAQ; `@high` comparison shows 30 vs 50 daily credits and 100 vs 500 history; `@high` "Approx. price" note and "Free Forever, Always" absent; `@high` Pro perks list the six Pro models; `@medium` mobile stacks the comparison without overflow; `@medium` local-time reset text visible.
- **Spec:** `apps/web/e2e/qa/pricing-layout.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from SPEC items 5 and 6 browser criteria pass; checkout stubbed; `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pricing-layout.spec.ts --repeat-each=3`

### ☐ T7.8 Gate: Phase 7

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** SPEC items 5 and 6 copy criteria met; FAQ consistency test green.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pricing-layout.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/localized-prices.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=2`; `bun run test`; `bun run check`.

🔶 **Checkpoint 7**: one pricing layout, no contradictory copy, daily-credit copy consistent.

## Phase 8: History-full notices

**Adds:** The not-saved notice explains why with real numbers and has icon buttons for Download and Dismiss. A persistent note near Generate warns when history is nearly full or full, with an Upgrade link for Free users.
**Try in UI:** As Free with 100 images see "History full" near Generate ; as Pro with 500 see the same without an Upgrade link ; with under 90 images see nothing ; trigger a not-saved result and use the icon Download and X Dismiss buttons.

### ☐ T8.1 UnsavedResultNotice copy and icon buttons

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.vue`
- **Do:** Copy such as "History full (500/500) - this image wasn't saved. Download it within ~1 hour." with the real count and `HISTORY_CAP` by plan; Download becomes an icon button (aria-label "Download image"); Dismiss an X icon button (aria-label "Dismiss"); remove "Delete images to free space"; Free keeps "Upgrade to Pro (500 history)" with the number from `HISTORY_CAP`. Update the existing test.
- **Acceptance:** SPEC item 8 notice requirements; Pro sees no upgrade link.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/Canvas/UnsavedResultNotice.test.ts`; `bun run check`.

### ☐ T8.2 Persistent HistoryFullNote

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/Canvas/HistoryFullNote.vue`, `apps/web/src/components/Dashboard/Canvas/ResultCanvas.vue`, `apps/web/src/components/Dashboard/Composer/PromptBar.vue`, `apps/web/src/stores/history.ts`
- **Do:** New component using `getHistoryFullLevel(count, HISTORY_CAP[plan])`: near-full wording "History almost full (N/cap). Delete old images to keep saving new ones.", full wording "History full - new creations won't be saved. Delete old images to make room."; Free also sees an Upgrade link. Nothing when the count is unknown or loading. Count from the server-returned history length; re-evaluate after a generation completes and after single or bulk delete. Downgraded users over the Free cap are treated as full. Mount near the Generate button or history header (confirm placement by reading the components). Use impeccable and layout skills.
- **Acceptance:** SPEC item 8: note appears at 90% and 100% for both plans, none under 90%, re-evaluates after generate and delete.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/Canvas src/stores/history.test.ts`; `bun run check`.

### ☐ T8.3 Unit: notices

- **Kind:** unit
- **Files:** `apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.vue`, `apps/web/src/components/Dashboard/Canvas/HistoryFullNote.vue`, `apps/web/src/stores/history.ts`
- **Do:** Component tests for copy, aria-labels "Download image" and "Dismiss", absence of any delete button, upgrade link by plan, near and full wording, count unknown shows nothing, over-cap downgrade shows full; store test for count re-evaluation after delete. Helper boundaries already covered in T1.8.
- **Acceptance:** SPEC item 8 unit criteria; files at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/Canvas/UnsavedResultNotice.test.ts src/components/Dashboard/Canvas/HistoryFullNote.test.ts src/stores/history.test.ts --coverage --coverage.include=src/components/Dashboard/Canvas/UnsavedResultNotice.vue,src/components/Dashboard/Canvas/HistoryFullNote.vue,src/stores/history.ts --coverage.reporter=text`

### ☐ T8.4 E2E: history-full notices

- **Kind:** e2e
- **Scenarios:** `@critical` Free seeded at 100 shows the full note with an Upgrade link; `@critical` Pro seeded at 500 shows the full note without an Upgrade link; `@high` count at 90 shows the near-full wording; `@high` under 90 shows no note; `@high` a stubbed not-saved result shows the icon Download and X Dismiss and no delete button; `@medium` deleting images lowers the level without reload.
- **Spec:** `apps/web/e2e/qa/history-full.spec.ts`
- **Files:** `apps/api/tools/seed-e2e-user.ts`, `apps/web/e2e/support/proPerksSeed.ts`
- **Acceptance:** Scenarios derived from SPEC item 8 browser criteria pass; seeding merges with working-tree edits; generation endpoints stubbed; `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/history-full.spec.ts --repeat-each=3`

### ☐ T8.5 Gate: Phase 8

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** SPEC item 8 success criteria met.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/history-full.spec.ts --repeat-each=2`; `bun run test`; `bun run check`.

🔶 **Checkpoint 8**: history-full notices correct for both plans.

## Phase 9: End-to-end gate and walkthrough

**Adds:** Final proof that every spec item works together with zero real paid calls, plus a documented walkthrough.
**Try in UI:** Run `cd apps/web && bunx playwright test e2e/qa/paid-call-guard.spec.ts` and confirm green ; walk the header pill, model menu, buy dialog, pricing, profile credits and history note as Free and Pro ; confirm INR with the dev override set.

### ☐ T9.1 Final consistency sweep

- **Kind:** gate
- **Files:** none
- **Do:** Run `grep -rn DAILY_CREDITS apps packages --exclude-dir=node_modules --exclude-dir=coverage` (no scalar use), grep Pricing components for hardcoded model display names (none outside shared-derived lists), confirm the FAQ JSON consistency test, and grep web copy and FAQ JSON for old costs. Do not run `check:model-docs` (live Replicate call).
- **Acceptance:** SPEC Boundaries: no duplicated model or tier lists in web copy; no scalar `DAILY_CREDITS`; docs consistent.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/paid-call-guard.spec.ts e2e/qa/pricing-layout.spec.ts --repeat-each=2`; `cd apps/web && npx vitest run src/utils/dailyCreditsConsistency.test.ts`; `bun run verify`; `bun run test`.

### ☐ T9.2 Gate: full e2e in both server modes

- **Kind:** gate
- **Files:** none
- **Do:** Run all affected QA specs and the full suite in dev and prod-preview modes.
- **Acceptance:** `paid-call-guard.spec.ts` passes and the guard reports zero un-intercepted paid calls; all new and changed specs green; no test weakened.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/pro-perks.spec.ts e2e/qa/model-menu.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/history-full.spec.ts e2e/qa/daily-credits.spec.ts e2e/qa/localized-prices.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/subscription-lifecycle.spec.ts e2e/qa/paid-call-guard.spec.ts --repeat-each=2`; `cd apps/web && bun run test:e2e`; `cd apps/web && E2E_SERVER=prod bun run test:e2e`.

### ☐ T9.3 Walkthrough: all spec items

- **Kind:** walkthrough
- **Files:** none
- **Do:** Walk SPEC items 1 to 8 as Free and Pro using the seeded QA specs as evidence; optional `agent-browser` visual pass (`AGENT_BROWSER_SESSION` = repo basename, signed in as the seeded e2e QA user from `e2e/fixtures/qa.ts`; this repo has no `qa-seed.init.js`; ended with `agent-browser close`) for layout polish only, never as sole evidence.
- **Acceptance:** Every SPEC item is verifiable in the browser through its QA spec; screenshots of modal, /pricing, model menu and header pill reviewed against the owner's reference screenshots.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/model-menu.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/history-full.spec.ts --repeat-each=2`; `bun run test`; `bun run check`.

### ☐ T9.4 Definition of done

- **Kind:** dod
- **Files:** none
- **Do:** Run every suite and map evidence to each SPEC success criterion; list manual owner items (set `DEV_COUNTRY_OVERRIDE=IN` locally to see INR; note the one-time reset-instant shift from pinning cron to UTC; nothing committed).
- **Acceptance:** All code-verifiable SPEC success criteria for items 1 to 8 met; `bun run verify`, `bun run test` and e2e green in both server modes; zero real paid calls; owner reviews the remaining manual items.
- **Verify:** `cd apps/api && bun run test`; `cd apps/web && bun run test`; `bun run verify`; `cd apps/web && bun run test:e2e`; `cd apps/web && E2E_SERVER=prod bun run test:e2e`.

🔶 **Checkpoint 9**: all eight SPEC items verified; no real paid calls; owner review.
