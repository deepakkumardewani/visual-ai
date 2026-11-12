window.DASHBOARD = {
 "generatedAt": "2026-11-09T14:56:06.724Z",
 "maxAttempts": 5,
 "feature": {
  "slug": "pricing-pro-polish",
  "title": "Pricing and Pro Polish"
 },
 "tasksFile": "agent_docs/pricing-pro-polish/TASKS.md",
 "projectRoot": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai",
 "docs": [
  {
   "name": "INTERVIEW",
   "href": "docs/INTERVIEW.html",
   "source": "agent_docs/pricing-pro-polish/INTERVIEW.md"
  },
  {
   "name": "PLAN",
   "href": "docs/PLAN.html",
   "source": "agent_docs/pricing-pro-polish/PLAN.md"
  },
  {
   "name": "SPEC",
   "href": "docs/SPEC.html",
   "source": "agent_docs/pricing-pro-polish/SPEC.md"
  },
  {
   "name": "TASKS",
   "href": "docs/TASKS.html",
   "source": "agent_docs/pricing-pro-polish/TASKS.md"
  }
 ],
 "totals": {
  "phases": 9,
  "tasks": 60,
  "byStatus": {
   "verified": 60
  }
 },
 "phases": [
  {
   "id": "1",
   "name": "Shared constants foundation",
   "startLine": 9,
   "endLine": 104,
   "adds": "Model tiers, the 5-credit cost, per-plan daily credits (30 Free, 50 Pro), the reset hour and the history-full helper live in one shared place. Every existing consumer is migrated so the repo still compiles and shows the right numbers.",
   "tryInUi": [
    "No new UI",
    "run `grep -rn DAILY_CREDITS apps packages --exclude-dir=node_modules --exclude-dir=coverage` and confirm no scalar use",
    "run `grep -n \"4–5\" apps/web/src/utils/pricingFAQ.json` and confirm no old premium cost",
    "open the dashboard and confirm Free shows 30 daily credits."
   ],
   "checkpoint": {
    "title": "Checkpoint 1",
    "line": 103,
    "items": [
     "shared constants are the single source of truth and the whole repo is green before fan-out."
    ]
   },
   "tasks": [
    {
     "id": "T1.1",
     "title": "Shared tier, cost, daily, history constants",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/shared/src/models/credits.ts",
      "packages/shared/src/models/plans.ts",
      "packages/shared/src/models/index.ts",
      "packages/shared/src/models/plans.test.ts",
      "packages/shared/src/models/registry.ts"
     ],
     "gherkin": null,
     "do": "In `credits.ts` add `PREMIUM_CREDIT_COST = 5`, use it for the ten rows of the SPEC item 7 table, make `DAILY_CREDITS = { free: 30, pro: 50 } as const`, add `getDailyCredits(isPro)` and `DAILY_RESET_UTC_HOUR = 0`, update the `getCreditCost` doc comment. In `plans.ts` make `PREMIUM_MODEL_KEYS` exactly the six Pro-only keys (remove FLUX_2_MAX), add `HISTORY_NEAR_FULL_RATIO = 0.9` and pure `getHistoryFullLevel(count, cap)` returning none/near/full (count at or above cap is full, unknown or NaN is none). Export everything via `models/index.ts`. Fix assertions in the existing `plans.test.ts` that encode old tiers. Touch `registry.ts` only if a later phase needs an `imageInput` field exposed; the `featured: true` flags live in `apps/web/src/utils/models.ts` and stay unchanged.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC items 6 and 7 constants exist exactly as specified; `PREMIUM_MODEL_KEYS` has 6 entries; shared package typechecks; no duplicated model lists."
     ],
     "verify": [
      "cd packages/shared && npx vitest run",
      "`bun run check`."
     ],
     "line": 14,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.2",
     "title": "Migrate API DAILY_CREDITS consumers",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/models/user.ts",
      "apps/api/src/models/user.test.ts",
      "apps/api/src/services/generation-service.ts",
      "apps/api/src/utils/cronJobs.ts",
      "apps/api/src/utils/cronJobs.test.ts"
     ],
     "gherkin": null,
     "do": "Replace scalar `DAILY_CREDITS` use with `DAILY_CREDITS.free` or `getDailyCredits` as semantically right (user default is Free). In `cronJobs.ts` use `.free` temporarily (Phase 3 finishes it). Update existing tests that import the old shape.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6 completeness: no scalar use in `apps/api`; API typechecks; `SIGNUP_CREDITS` and `REFERRAL_BONUS` unchanged."
     ],
     "verify": [
      "cd apps/api && bun run test",
      "bun run check",
      "`grep -rn DAILY_CREDITS apps/api/src --exclude-dir=node_modules`."
     ],
     "line": 22,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.3",
     "title": "Migrate email package consumers",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/email/src/constants.ts",
      "packages/email/src/V2Announcement.tsx",
      "packages/email/src/components/CreditsCallout.tsx",
      "packages/email/src/V2Announcement.test.ts",
      "packages/email/src/render.test.ts"
     ],
     "gherkin": null,
     "do": "Switch email copy to `DAILY_CREDITS.free` (no email is sent; tests render only). Merge with existing working-tree edits in `packages/email`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6 email consumers compile and render tests pass; no email is sent or any mail client invoked."
     ],
     "verify": [
      "cd packages/email && npx vitest run",
      "`bun run check`."
     ],
     "line": 30,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.4",
     "title": "Migrate web stores and utils",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/stores/user.ts",
      "apps/web/src/utils/landing.ts",
      "apps/web/src/utils/seo.ts",
      "apps/web/src/utils/seo.test.ts",
      "apps/web/src/utils/featureLandings.test.ts"
     ],
     "gherkin": null,
     "do": "Derive daily credit numbers from shared constants (`DAILY_CREDITS.free` / `getDailyCredits`) in the user store, landing and SEO copy. Update existing tests that assert the old scalar.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6: TS copy derives from constants; user store exposes the plan-appropriate daily amount (30 Free, 50 Pro)."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/utils/seo.test.ts src/utils/featureLandings.test.ts src/utils/landing.test.ts src/stores/user.test.ts",
      "`bun run check`."
     ],
     "line": 38,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.5",
     "title": "Migrate web components A",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Landing/FinalCta.vue",
      "apps/web/src/components/Landing/PricingTeaser.vue",
      "apps/web/src/components/Pricing/PricingHero.vue",
      "apps/web/src/components/Dialogs/LowCreditsDialog.vue",
      "apps/web/src/components/Dialogs/ReferralCopyDialog.vue"
     ],
     "gherkin": null,
     "do": "Replace scalar `DAILY_CREDITS` and hardcoded daily-credit numbers with shared constants; low-credits dialog shows the plan-appropriate amount. Update their co-located existing tests where assertions break.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6: these components compile and render 30 for Free and 50 for Pro where plan-dependent; no literal daily number remains."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Landing src/components/Pricing/PricingHero.test.ts src/components/Dialogs/LowCreditsDialog.test.ts src/components/Dialogs/ReferralCopyDialog.test.ts",
      "`bun run check`."
     ],
     "line": 46,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.6",
     "title": "Migrate web components B and FAQ JSON",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Profile/ProfileCreditsCard.vue",
      "apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue",
      "apps/web/src/components/Pricing/PricingCreditStory.vue",
      "apps/web/src/utils/generalFAQ.json",
      "apps/web/src/utils/models.ts"
     ],
     "gherkin": null,
     "do": "Same migration; profile card shows 50/day for Pro and 30/day for Free. Update `generalFAQ.json` daily-credit numbers to match the constants (JSON cannot import). Fix `models.ts` cost docs/derivations for the new 5-credit costs. Update co-located existing tests where assertions break.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6 completeness: `grep -rn DAILY_CREDITS apps packages --exclude-dir=node_modules --exclude-dir=coverage` shows no remaining scalar use; FAQ JSON matches constants."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Profile src/components/Dialogs/BuyMoreCreditsDialog.test.ts src/components/Pricing/PricingCreditStory.test.ts src/utils/models.test.ts",
      "`bun run check`."
     ],
     "line": 54,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.7",
     "title": "Pricing FAQ cost and daily copy",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/pricingFAQ.json"
     ],
     "gherkin": null,
     "do": "Update the cost sentence (\"budget generation 1 credit; premium generation 4–5\") to the SPEC item 7 table (premium generation 5) and keep the daily-credit numbers consistent with `DAILY_CREDITS` (Free 30, Pro 50). Leave the \"no paid subscription tiers\" sentence to T7.4. Do not run `check:model-docs` (live Replicate call; it does not check costs). Repo docs (`*.md`) carry no model costs, so none change.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 7: no FAQ copy states an old cost; SPEC item 6: daily numbers match the constants."
     ],
     "verify": [
      "`grep -nE \"4–5|4-5\" apps/web/src/utils/pricingFAQ.json` returns nothing",
      "`cd apps/web && npx vitest run src/utils`."
     ],
     "line": 62,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.8",
     "title": "Unit: shared constants",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "packages/shared/src/models/credits.ts",
      "packages/shared/src/models/plans.ts",
      "packages/shared/src/models/credits.test.ts",
      "packages/shared/src/models/plans.test.ts"
     ],
     "gherkin": null,
     "do": "Write `credits.test.ts` and extend `plans.test.ts`: parametrized table over all 10 model keys asserting `getCreditCost` and `PREMIUM_MODEL_KEYS` membership (length 6); `getDailyCredits(true|false)`; `getHistoryFullLevel` boundaries 89/90/99/100 of 100 and 500, count above cap is full, NaN/undefined is none.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 7 unit criterion and item 8 helper boundaries covered; every file at least 80% lines/branches/functions/statements, target over 95%; no `it.fails` unless the source has a real bug."
     ],
     "verify": [
      "cd packages/shared && npx vitest run src/models/credits.test.ts src/models/plans.test.ts --coverage --coverage.include=src/models/credits.ts,src/models/plans.ts --coverage.reporter=text"
     ],
     "line": 70,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.9",
     "title": "Unit: daily-credit copy consistency",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/utils/landing.ts",
      "apps/web/src/utils/seo.ts",
      "apps/web/src/utils/dailyCreditsConsistency.test.ts"
     ],
     "gherkin": null,
     "do": "Add `apps/web/src/utils/dailyCreditsConsistency.test.ts` that parses `generalFAQ.json` and `pricingFAQ.json` and asserts every number adjacent to the word \"daily\" agrees with `DAILY_CREDITS` (do not match \"50 persistent\"), and that landing and SEO output contain the Free amount derived from shared.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6 consistency test across shared, both FAQ JSONs, landing, seo passes and fails if a number drifts; coverage on listed files at least 80%, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/utils/dailyCreditsConsistency.test.ts src/utils/landing.test.ts src/utils/seo.test.ts --coverage --coverage.include=src/utils/landing.ts,src/utils/seo.ts --coverage.reporter=text"
     ],
     "line": 78,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.10",
     "title": "E2E: daily credits copy",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/daily-credits-copy.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC item 6 copy criteria pass; no paid endpoint reached; `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/daily-credits-copy.spec.ts --repeat-each=3"
     ],
     "line": 86,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    },
    {
     "id": "T1.11",
     "title": "Gate: Phase 1",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run the full suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Repo green; no scalar `DAILY_CREDITS`; no old cost in FAQ copy; no test weakened."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/daily-credits-copy.spec.ts --repeat-each=2",
      "bun run verify",
      "bun run test",
      "`grep -rn DAILY_CREDITS apps packages --exclude-dir=node_modules --exclude-dir=coverage`."
     ],
     "line": 95,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T13:38:59.582Z"
    }
   ],
   "verified": 11,
   "total": 11,
   "complete": true
  },
  {
   "id": "2",
   "name": "Server gate and client lock follow-through",
   "startLine": 105,
   "endLine": 160,
   "adds": "Free users are blocked from the six Pro-only models and charged 5 credits on the four free 5-credit models; the client shows the same locks and a clear upsell instead of a raw error.",
   "tryInUi": [
    "Log in as Free and open the model picker",
    "confirm lock plus PRO badge on the six Pro-only models and none on FLUX.2 Max",
    "click a locked model and see pricing open",
    "open pricing and read the model cost table grouped by 5 credits."
   ],
   "checkpoint": {
    "title": "Checkpoint 2",
    "line": 159,
    "items": [
     "server gate, charging and client lock match the SPEC item 7 table."
    ]
   },
   "tasks": [
    {
     "id": "T2.1",
     "title": "API gate and cost expectations",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/routes/generate.ts",
      "apps/api/src/services/generation-service.ts",
      "apps/api/src/routes/generate.test.ts",
      "apps/api/src/services/generation-service.test.ts"
     ],
     "gherkin": null,
     "do": "Confirm the gate (~L139) and cost lookup read only `PREMIUM_MODEL_KEYS` and `getCreditCost` with no hardcoded list; remove any found. Update existing test expectations to the new costs and gates without weakening. Merge with working-tree edits.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 7: Free requests for a Pro-only key return the premium-required error with no deduction and nothing queued; Free with FLUX_2_MAX/FLUX_2_PRO/FLUX_1_1_PRO/FLUX_PRO accepted and charged 5; Pro accepted for all; Replicate is always mocked."
     ],
     "verify": [
      "cd apps/api && bun run test src/routes/generate.test.ts src/services/generation-service.test.ts",
      "`bun run check`."
     ],
     "line": 110,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T14:41:22.668Z"
    },
    {
     "id": "T2.2",
     "title": "Web lock, upsell and cost table",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue",
      "apps/web/src/stores/generate.ts",
      "apps/web/src/components/Pricing/PricingModelCosts.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue"
     ],
     "gherkin": null,
     "do": "`isLocked` derives from `PREMIUM_MODEL_KEYS`; `PremiumModelRequiresProError` in the generate store opens pricing with a clear upsell message (no raw error); `PricingModelCosts.vue` groups by the new costs (for example \"5: ...\"); confirm Featured keeps its `featured: true` set in `apps/web/src/utils/models.ts` and Flux 2 Pro stays eligible and free. Update existing co-located tests that assert old costs or locks.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 7 follow-through: lock and PRO badge on six Pro-only models for Free, none on FLUX_2_MAX; stale Free selection of a Pro-only model gets the upsell; cost table matches the table in SPEC item 7."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker src/stores/generate.test.ts src/components/Pricing/PricingModelCosts.test.ts",
      "`bun run check`."
     ],
     "line": 118,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T14:41:22.668Z"
    },
    {
     "id": "T2.3",
     "title": "Unit: API gate and charging",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/routes/generate.ts",
      "apps/api/src/services/generation-service.ts"
     ],
     "gherkin": null,
     "do": "Add parametrized route and service tests over the SPEC item 7 table: each Pro-only key rejected for Free (error code, balance unchanged, queue untouched), each free 5-credit key accepted and charged 5, Pro accepted for all. Mocked Replicate client only.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 7 API criteria covered; every file at least 80% lines/branches/functions/statements, target over 95%; no real Replicate call."
     ],
     "verify": [
      "cd apps/api && npx vitest run src/routes/generate.test.ts src/services/generation-service.test.ts --coverage --coverage.include=src/routes/generate.ts,src/services/generation-service.ts --coverage.reporter=text"
     ],
     "line": 126,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T14:41:22.668Z"
    },
    {
     "id": "T2.4",
     "title": "Unit: web lock, store and cost table",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue",
      "apps/web/src/stores/generate.ts",
      "apps/web/src/components/Pricing/PricingModelCosts.vue"
     ],
     "gherkin": null,
     "do": "Test lock for each of the ten keys by plan, `PremiumModelRequiresProError` opening pricing, and cost table grouping.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 7 browser-facing logic covered; every file at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelOption.test.ts src/stores/generate.test.ts src/components/Pricing/PricingModelCosts.test.ts --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelOption.vue,src/stores/generate.ts,src/components/Pricing/PricingModelCosts.vue --coverage.reporter=text"
     ],
     "line": 134,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T14:41:22.668Z"
    },
    {
     "id": "T2.5",
     "title": "E2E: model tiers and gating",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/pro-perks.spec.ts",
      "apps/web/e2e/qa/dev-cloud-reference.spec.ts",
      "apps/web/e2e/qa/mods-reference-image.spec.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/pro-tier.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC item 7 browser criteria pass; `paidCallGuard` reports zero un-intercepted paid calls; no real Replicate call."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/pro-perks.spec.ts e2e/qa/dev-cloud-reference.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=3"
     ],
     "line": 142,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T14:41:22.668Z"
    },
    {
     "id": "T2.6",
     "title": "Gate: Phase 2",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 7 success criteria met; API and web tests green; no test weakened."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/pro-perks.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run check`."
     ],
     "line": 151,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T14:41:22.668Z"
    }
   ],
   "verified": 6,
   "total": 6,
   "complete": true
  },
  {
   "id": "3",
   "name": "Plan-aware daily reset and mid-day upgrade",
   "startLine": 161,
   "endLine": 224,
   "adds": "Pro users get 50 daily credits and Free users 30, reset at 00:00 UTC. Subscribing to Pro mid-day tops the balance up to 50 once, never on renewal or webhook replay.",
   "tryInUi": [
    "Log in as Free and note the chip shows up to 30",
    "activate Pro through the signed test webhook and see the balance rise to 50 if it was lower",
    "reload and confirm it does not top up again."
   ],
   "checkpoint": {
    "title": "Checkpoint 3",
    "line": 223,
    "items": [
     "plan-aware UTC reset and idempotent mid-day top-up verified."
    ]
   },
   "tasks": [
    {
     "id": "T3.1",
     "title": "Single Pro filter builder",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/lib/isPro.ts"
     ],
     "gherkin": null,
     "do": "Export `proUsersFilter(now)` mirroring `isPro` (plan pro AND (status active OR (status in past_due/cancelled AND currentPeriodEnd > now))) and a complement helper for Free (legacy users lacking plan fields count as Free). `isPro` stays the single definition of Pro; document why the two must not drift.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6: one exported builder used by the cron; `isPro` behaviour unchanged."
     ],
     "verify": [
      "cd apps/api && bun run test src/lib/isPro.test.ts",
      "`bun run check`."
     ],
     "line": 166,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:15:50.397Z"
    },
    {
     "id": "T3.2",
     "title": "Cron per-plan reset in UTC",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/utils/cronJobs.ts",
      "apps/api/src/utils/cronJobs.test.ts"
     ],
     "gherkin": null,
     "do": "Schedule `\"0 0 * * *\"` with `{ timezone: \"UTC\" }` (derive the hour from `DAILY_RESET_UTC_HOUR`). Two `updateMany` calls: Pro filter sets `getDailyCredits(true)`, complement sets `getDailyCredits(false)`. Update existing cron test expectations.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6: Pro get 50, everyone else 30, timezone pinned to UTC; past_due/cancelled within period still Pro; after period end 30."
     ],
     "verify": [
      "cd apps/api && bun run test src/utils/cronJobs.test.ts",
      "`bun run check`."
     ],
     "line": 174,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:15:50.397Z"
    },
    {
     "id": "T3.3",
     "title": "Mid-day upgrade top-up on ACTIVATED",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/payments/service.ts"
     ],
     "gherkin": null,
     "do": "On subscription ACTIVATED only (not RENEWED), apply `$max: { dailyCredits: DAILY_CREDITS.pro }` atomically alongside `buildSubscriptionPatch`. EXPIRED leaves the balance untouched (no claw-back).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6: current 12 becomes 50, current 80 stays 80, replay unchanged, RENEWED no top-up, EXPIRED leaves balance."
     ],
     "verify": [
      "cd apps/api && bun run test src/payments/service.test.ts src/payments/service.subscription.test.ts",
      "`bun run check`."
     ],
     "line": 182,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:15:50.397Z"
    },
    {
     "id": "T3.4",
     "title": "Unit: Pro filter and cron",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/lib/isPro.ts",
      "apps/api/src/utils/cronJobs.ts"
     ],
     "gherkin": null,
     "do": "Parity test cross-checking `isPro` against `proUsersFilter` on fixture users (active, past_due in and out of period, cancelled in and out, legacy no-plan-fields, free); cron test asserts both update filters and values and the `timezone: \"UTC\"` option and `\"0 0 * * *\"` schedule.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6 cron and parity criteria; every file at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/api && npx vitest run src/lib/isPro.test.ts src/utils/cronJobs.test.ts --coverage --coverage.include=src/lib/isPro.ts,src/utils/cronJobs.ts --coverage.reporter=text"
     ],
     "line": 190,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:15:50.397Z"
    },
    {
     "id": "T3.5",
     "title": "Unit: subscription top-up",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/payments/service.ts"
     ],
     "gherkin": null,
     "do": "Webhook-level tests: ACTIVATED with current 12 gives 50; 80 stays 80; replay of the same event leaves balance unchanged; RENEWED does not top up; EXPIRED leaves balance; same-day cancel, expire and re-subscribe tops up again. Dodo client mocked.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6 webhook criteria and edge cases; file at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/api && npx vitest run src/payments/service.test.ts src/payments/service.subscription.test.ts src/payments/webhookLifecycle.test.ts --coverage --coverage.include=src/payments/service.ts --coverage.reporter=text"
     ],
     "line": 198,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:15:50.397Z"
    },
    {
     "id": "T3.6",
     "title": "E2E: Pro daily credits and mid-day top-up",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/support/proWebhook.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/daily-credits.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC item 6 browser criteria pass; Pro state set only via the signed test webhook (no Dodo live); no paid endpoint reached."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/daily-credits.spec.ts --repeat-each=3"
     ],
     "line": 206,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T15:15:50.397Z"
    },
    {
     "id": "T3.7",
     "title": "Gate: Phase 3",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6 server criteria met; cron, filter parity and webhook tests green."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/daily-credits.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run check`."
     ],
     "line": 215,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:15:50.397Z"
    }
   ],
   "verified": 7,
   "total": 7,
   "complete": true
  },
  {
   "id": "4",
   "name": "Dev country override",
   "startLine": 225,
   "endLine": 280,
   "adds": "In local development the API can be told which country to price for, so INR and other currencies are testable. Production and staging ignore the override entirely.",
   "tryInUi": [
    "Set `DEV_COUNTRY_OVERRIDE=IN` in the API env (owner action, server already running)",
    "open pricing and the buy-credits dialog and see rupee prices",
    "remove it and confirm USD again."
   ],
   "checkpoint": {
    "title": "Checkpoint 4",
    "line": 279,
    "items": [
     "dev override works and is provably inert in production and staging."
    ]
   },
   "tasks": [
    {
     "id": "T4.1",
     "title": "Geo override and prices route",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/payments/geo.ts",
      "apps/api/src/payments/router.ts"
     ],
     "gherkin": null,
     "do": "In `resolveCountry` add override precedence: `?country=` query beats `DEV_COUNTRY_OVERRIDE`, then header, then IP; honoured only when `NODE_ENV` is development or test; both validated with `normalizeCountryCode`; invalid code (for example \"ZZ\") ignored with a log and falls through. Pass `req.query.country` from the `/payments/prices` route.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 4: override works in dev and test, is ignored in production and staging; invalid codes fall through to header/IP."
     ],
     "verify": [
      "cd apps/api && bun run test src/payments/geo.test.ts src/payments/router.test.ts",
      "`bun run check`."
     ],
     "line": 230,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:53:20.663Z"
    },
    {
     "id": "T4.2",
     "title": "Env schema, startup warning and docs",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/config/env.ts",
      "apps/api/.env.example"
     ],
     "gherkin": null,
     "do": "Add optional `DEV_COUNTRY_OVERRIDE` validated via `normalizeCountryCode`; log a warning at startup when set (does not fail boot); document it in `.env.example`. Merge carefully with working-tree edits.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 4: env var documented and validated; warning logged when set; boot never fails because of it."
     ],
     "verify": [
      "cd apps/api && bun run test src/config/env.test.ts",
      "`bun run check`."
     ],
     "line": 238,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:53:20.663Z"
    },
    {
     "id": "T4.3",
     "title": "Unit: geo, env and prices route",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/payments/geo.ts",
      "apps/api/src/payments/router.ts",
      "apps/api/src/config/env.ts"
     ],
     "gherkin": null,
     "do": "Tests: query beats env var beats header beats IP in dev and test; `NODE_ENV=production` and `staging` with the override set still use header/IP; `cf-ipcountry: IN` with no override resolves IN and `/payments/prices` returns INR amounts; invalid \"ZZ\" ignored with log; env warning emitted. ipapi.co mocked in every test (no outbound calls).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 4 unit criteria; every file at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/api && npx vitest run src/payments/geo.test.ts src/payments/router.test.ts src/config/env.test.ts --coverage --coverage.include=src/payments/geo.ts,src/payments/router.ts,src/config/env.ts --coverage.reporter=text"
     ],
     "line": 246,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:53:20.663Z"
    },
    {
     "id": "T4.4",
     "title": "Unit: web INR rendering",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/composables/usePricingCatalog.ts"
     ],
     "gherkin": null,
     "do": "Test that an INR catalog flows through `usePricingCatalog` and the shared `formatPrice(amountMinor, currency)` (`packages/shared/src/pricing/format.ts`; not the USD-only one in `utils/models.ts`) and renders the rupee symbol; USD stays unchanged; JPY zero-decimal formatting.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 4 web catalog test; files at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/composables/usePricingCatalog.test.ts --coverage --coverage.include=src/composables/usePricingCatalog.ts --coverage.reporter=text"
     ],
     "line": 254,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:53:20.663Z"
    },
    {
     "id": "T4.5",
     "title": "E2E: localized currency",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/localized-prices.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC item 4 pass; country is set via the `cf-ipcountry` header or dev `?country=` (the always-running API is `NODE_ENV=development`, also under `E2E_SERVER=prod`, which only builds the web app); no paid call; the header-less case may hit the existing free ipapi.co fallback in the running API (not a paid call; unit tests mock it)."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/localized-prices.spec.ts --repeat-each=3"
     ],
     "line": 262,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T15:53:20.663Z"
    },
    {
     "id": "T4.6",
     "title": "Gate: Phase 4",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 4 success criteria met; override cannot act in production."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/localized-prices.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run check`."
     ],
     "line": 271,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T15:53:20.663Z"
    }
   ],
   "verified": 6,
   "total": 6,
   "complete": true
  },
  {
   "id": "5",
   "name": "Model menu",
   "startLine": 281,
   "endLine": 328,
   "adds": "The model picker shows one tidy line per model (logo, name and description, reference-image icon, PRO lock, cost) and groups models into Featured, Free and Pro sections.",
   "tryInUi": [
    "Open the model picker as Free",
    "confirm equal row heights and sections in order Featured, Free, Pro",
    "hover the reference-image icon to see \"Up to N reference images\"",
    "log in as Pro and confirm no locks."
   ],
   "checkpoint": {
    "title": "Checkpoint 5",
    "line": 327,
    "items": [
     "model menu rows and tier sections match SPEC item 3."
    ]
   },
   "tasks": [
    {
     "id": "T5.1",
     "title": "Single-line ModelOption",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue",
      "apps/web/src/components/Dashboard/ModelPicker/PremiumLockBadge.vue"
     ],
     "gherkin": null,
     "do": "One line: logo, name plus description, reference-image icon only when the model's registry entry has `imageInput` (tooltip \"Up to N reference images\", N = `imageInput.max`, the field `stores/aside.ts` uses), PRO lock badge for Pro-only models for non-Pro viewers, then credit cost. Uniform row height; refine with the impeccable and layout skills. Update existing ModelOption tests broken by the change.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 3: rows have identical height, icon only for ref-capable models, exact tooltip text, Pro users see no lock."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelOption.test.ts",
      "`bun run check`."
     ],
     "line": 286,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T16:32:25.089Z"
    },
    {
     "id": "T5.2",
     "title": "Featured / Free / Pro sections",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelCompanyGroup.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelCompanySubmenu.vue"
     ],
     "gherkin": null,
     "do": "Replace `groupModelsByCompany` with sections Featured, Free (generation models not in `PREMIUM_MODEL_KEYS`), Pro (`PREMIUM_MODEL_KEYS`) for the generation picker only. Featured keeps its `featured: true` set (including the two Pro-only models, which show the lock for Free) and those models also appear in their tier section. Upscaler and utility pickers keep current behaviour. Delete the company components only if usages are checked and none remain; otherwise leave them.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 3: sections in that order; Pro section shows locks for Free users; no change to `UpscaleModelPicker.vue` behaviour."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker",
      "`bun run check`."
     ],
     "line": 294,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T16:32:25.089Z"
    },
    {
     "id": "T5.3",
     "title": "Unit: model picker",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue",
      "apps/web/src/components/Dashboard/ModelPicker/PremiumLockBadge.vue"
     ],
     "gherkin": null,
     "do": "Tests for sections and their order, Featured duplicates in tier sections, icon visibility by capability, tooltip text, lock for Free vs none for Pro, upscaler picker unchanged.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 3 unit criteria; files at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelOption.vue,src/components/Dashboard/ModelPicker/ModelPickerPanel.vue,src/components/Dashboard/ModelPicker/PremiumLockBadge.vue --coverage.reporter=text"
     ],
     "line": 302,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T16:32:25.089Z"
    },
    {
     "id": "T5.4",
     "title": "E2E: model menu",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/model-menu.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC item 3 browser criteria pass; generation endpoints stubbed; `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts --repeat-each=3"
     ],
     "line": 310,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-07T16:32:25.089Z"
    },
    {
     "id": "T5.5",
     "title": "Gate: Phase 5",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 3 success criteria met."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run check`."
     ],
     "line": 319,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-07T16:32:25.089Z"
    }
   ],
   "verified": 5,
   "total": 5,
   "complete": true
  },
  {
   "id": "6",
   "name": "Upgrade entry point and buy-credits dialog",
   "startLine": 329,
   "endLine": 400,
   "adds": "Free users see an \"Upgrade to Pro\" pill next to their credits and a cross-sell in the buy-credits dialog; Pro users see a Pro badge. The dialog gets a lighter blurred backdrop, readable per-100-credit prices, clearer image estimates and aligned cards.",
   "tryInUi": [
    "As Free see the pill beside credits and click it to open pricing",
    "open Buy more credits and check equal-height cards, \"per 100 credits\" prices and the Upgrade link",
    "as Pro see the badge instead of the pill",
    "shrink to mobile width and confirm no header overflow."
   ],
   "checkpoint": {
    "title": "Checkpoint 6",
    "line": 399,
    "items": [
     "upgrade entry point and buy-credits dialog polished; repo green."
    ]
   },
   "tasks": [
    {
     "id": "T6.1",
     "title": "Header pill and Pro badge",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/CreditsChip.vue",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/UserMenu.vue"
     ],
     "gherkin": null,
     "do": "Free-only \"Upgrade to Pro\" pill beside the credits balance calling `dialogStore.showPricing()`; Pro badge in the same spot; plan from `useUserStore().isPro`; hidden while the user is loading (no flash for Pro); icon-only or truncated below the `sm` breakpoint; keep the `UserMenu.vue` entry. Update existing header tests broken by the change.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 1: pill for Free, badge for Pro, none while loading, no mobile overflow, click opens pricing."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header",
      "`bun run check`."
     ],
     "line": 334,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T11:03:34.362Z"
    },
    {
     "id": "T6.2",
     "title": "Shared modal backdrop",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/AppModal.vue"
     ],
     "gherkin": null,
     "do": "Backdrop about 60% dim plus blur instead of near-black. Run every dialog test; if any other dialog regresses add a `backdrop` prop defaulting to the old look except BuyMoreCredits.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 2 and assumption 4: backdrop dim and blurred, no dialog regression."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dialogs src/components/AppModal.test.ts",
      "`bun run check`."
     ],
     "line": 342,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T11:03:34.362Z"
    },
    {
     "id": "T6.3",
     "title": "Price-per-100-credits helper",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/pricePerCredits.ts",
      "apps/web/src/composables/usePricingCatalog.ts"
     ],
     "gherkin": null,
     "do": "Pure helper returning the localized \"per 100 credits\" price using shared `formatPrice(amountMinor, currency)` and catalog amounts; no sub-cent rounding for zero-decimal currencies; the 2000-pack never renders \"$0.00\". Replace the buggy per-credit formatter in `usePricingCatalog.ts` (`formatPrice(amountMinor / pack.credits, currency)`) with this helper rather than keeping both. Also export the image-estimate pair (N images at 1 credit, M = floor(credits / `PREMIUM_CREDIT_COST`) at 5 credits) with no literal 5.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 2 price and estimate rules: helper exported and typed, `usePricingCatalog` no longer divides to a per-credit amount, repo typechecks (behaviour proven in T6.6)."
     ],
     "verify": [
      "cd apps/web && bun run check",
      "`cd apps/web && npx vitest run src/composables/usePricingCatalog.test.ts`."
     ],
     "line": 350,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-09T11:03:34.362Z"
    },
    {
     "id": "T6.4",
     "title": "Buy-more-credits dialog layout",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue"
     ],
     "gherkin": null,
     "do": "Add the \"Upgrade to Pro\" cross-sell link (Free only) opening pricing; use the per-100 helper and image-estimate text \"≈ N images at 1 credit / M at 5 credits\"; remove the empty gap on cards without \"Save X%\" (grid rows or reserved-free layout) so all cards are equal height; polish with impeccable, layout and polish skills. Update existing dialog tests.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 2 and item 1 dialog link: no card shows $0.00, no empty save placeholder, cards equal height, link present for Free only."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dialogs/BuyMoreCreditsDialog.test.ts",
      "`bun run check`."
     ],
     "line": 358,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T11:03:34.362Z"
    },
    {
     "id": "T6.5",
     "title": "Unit: header",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/CreditsChip.vue",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/UserMenu.vue"
     ],
     "gherkin": null,
     "do": "Tests for Free pill, Pro badge, loading state hides both, click handler calls `showPricing`, UserMenu entry retained.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 1 unit criteria; files at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header --coverage --coverage.include=src/components/Header/CreditsChip.vue,src/components/Header/AppHeader.vue,src/components/Header/UserMenu.vue --coverage.reporter=text"
     ],
     "line": 366,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T11:03:34.362Z"
    },
    {
     "id": "T6.6",
     "title": "Unit: price helper, dialog and modal",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/utils/pricePerCredits.ts",
      "apps/web/src/composables/usePricingCatalog.ts",
      "apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue",
      "apps/web/src/components/AppModal.vue",
      "apps/web/src/utils/pricePerCredits.test.ts"
     ],
     "gherkin": null,
     "do": "Helper tests across all packs in USD, INR and JPY (2000-pack never \"$0.00\"); image-estimate text test; DOM test that no empty \"save\" placeholder renders; Upgrade link by plan; AppModal backdrop classes.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 2 unit criteria; files at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/utils/pricePerCredits.test.ts src/composables/usePricingCatalog.test.ts src/components/Dialogs/BuyMoreCreditsDialog.test.ts src/components/AppModal.test.ts --coverage --coverage.include=src/utils/pricePerCredits.ts,src/composables/usePricingCatalog.ts,src/components/Dialogs/BuyMoreCreditsDialog.vue,src/components/AppModal.vue --coverage.reporter=text"
     ],
     "line": 374,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T11:03:34.362Z"
    },
    {
     "id": "T6.7",
     "title": "E2E: upgrade entry and buy dialog",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/upgrade-entry.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC items 1 and 2 browser criteria pass; no checkout or Dodo live call (checkout endpoints stubbed); `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/upgrade-entry.spec.ts --repeat-each=3"
     ],
     "line": 382,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T11:03:34.362Z"
    },
    {
     "id": "T6.8",
     "title": "Gate: Phase 6",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC items 1 and 2 success criteria met; other dialog tests unaffected by the backdrop."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/upgrade-entry.spec.ts e2e/qa/localized-prices.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run check`."
     ],
     "line": 391,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-09T11:03:34.362Z"
    }
   ],
   "verified": 8,
   "total": 8,
   "complete": true
  },
  {
   "id": "7",
   "name": "Unified pricing layout and daily-credit copy",
   "startLine": 401,
   "endLine": 472,
   "adds": "The pricing modal and the /pricing page share one layout: Free vs Pro comparison, packs framed as \"Top up any plan\", model costs, then FAQ. The \"Free Forever\" claim and the approximate-price note are gone, Pro perks list the real Pro models, and reset times show in local time.",
   "tryInUi": [
    "Open pricing from the header pill and visit /pricing",
    "confirm the same layout with the footer only on the page",
    "read Free 30 vs Pro 50 daily credits and history 100 vs 500",
    "confirm the six Pro models in perks and no \"Approx. price\" note."
   ],
   "checkpoint": {
    "title": "Checkpoint 7",
    "line": 471,
    "items": [
     "one pricing layout, no contradictory copy, daily-credit copy consistent."
    ]
   },
   "tasks": [
    {
     "id": "T7.1",
     "title": "Shared PricingLayout and wrappers",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Pricing/PricingLayout.vue",
      "apps/web/src/pages/Pricing.vue",
      "apps/web/src/components/Dialogs/PricingDialog.vue"
     ],
     "gherkin": null,
     "do": "New `PricingLayout.vue` (hero, comparison, packs, model costs, FAQ last). `Pricing.vue` renders layout plus site footer; `PricingDialog.vue` renders layout with no footer. Remove large empty space in sections and the FAQ. Update existing Pricing and dialog tests broken by the change.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 5: both surfaces render the same layout component; order comparison, packs, model costs, FAQ; no footer before or inside the FAQ in the modal."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/pages/Pricing.test.ts src/components/Dialogs/PricingDialog.test.ts",
      "`bun run check`."
     ],
     "line": 406,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:21:40.662Z"
    },
    {
     "id": "T7.2",
     "title": "Comparison, hero and packs",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Pricing/PricingComparison.vue",
      "apps/web/src/components/Pricing/PricingHero.vue",
      "apps/web/src/components/Pricing/PricingPacks.vue"
     ],
     "gherkin": null,
     "do": "New side-by-side Free | Pro comparison (stacked on mobile) with daily credits from `DAILY_CREDITS` (30 vs 50), history from `HISTORY_CAP` (100 vs 500), model access, queue priority, privacy. Hero drops \"Free Forever, Always\" and any copy contradicting the Pro upsell. Packs framed \"Top up any plan\"; keep pack prices and Pro $5/mo. Use impeccable, layout, typeset and polish skills.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 5 and item 6 comparison: numbers derive from shared constants; hero copy does not contradict the upsell."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Pricing",
      "`bun run check`."
     ],
     "line": 414,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:21:40.662Z"
    },
    {
     "id": "T7.3",
     "title": "Pro card perks from shared",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Pricing/PricingProCard.vue",
      "apps/web/e2e/qa/localized-prices.spec.ts",
      "apps/web/e2e/qa/pro-tier.spec.ts",
      "apps/web/e2e/qa/mods-reference-image.spec.ts"
     ],
     "gherkin": null,
     "do": "Remove `PRICE_NOTE` (\"Approx. price; final amount in your currency is shown at checkout\"). Derive the Pro model list from `PREMIUM_MODEL_KEYS` mapped to registry display names instead of the hardcoded string; keep $5/mo. Update existing e2e assertions that expect the approx note or the old hardcoded perk string (for example the `localized-prices` test \"…with the approx. note\") to the new copy, without weakening them.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 5: removed note absent; perks list the six Pro models and follow the constant; the three existing specs pass against the new copy."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Pricing/PricingProCard.test.ts",
      "bun run check",
      "`cd apps/web && bunx playwright test e2e/qa/localized-prices.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/mods-reference-image.spec.ts`."
     ],
     "line": 422,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:21:40.662Z"
    },
    {
     "id": "T7.4",
     "title": "Local-time reset copy",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/dailyReset.ts",
      "apps/web/src/components/Profile/ProfileCreditsCard.vue",
      "apps/web/src/components/Pricing/PricingCreditStory.vue",
      "apps/web/src/utils/generalFAQ.json",
      "apps/web/src/utils/pricingFAQ.json"
     ],
     "gherkin": null,
     "do": "Helper formats `DAILY_RESET_UTC_HOUR` (00:00 UTC) in the browser's local time via `Intl.DateTimeFormat` (for example \"Resets daily at 5:30 AM\"); use it in the credit story (replacing \"Refreshed at midnight\") and profile card; both FAQ JSONs state a consistent reset statement (00:00 UTC) and drop \"There are no paid subscription tiers\" so they do not contradict Pro (the JSON consistency test from Phase 1 must still pass).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6: reset time shown explicitly in local time from one shared constant; Pro profile 50/day, Free 30/day; SPEC item 5: no FAQ says there are no paid tiers."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Profile src/components/Pricing/PricingCreditStory.test.ts src/utils/dailyCreditsConsistency.test.ts",
      "`bun run check`."
     ],
     "line": 430,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:21:40.662Z"
    },
    {
     "id": "T7.5",
     "title": "Unit: pricing layout, comparison and perks",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Pricing/PricingLayout.vue",
      "apps/web/src/components/Pricing/PricingComparison.vue",
      "apps/web/src/components/Pricing/PricingProCard.vue",
      "apps/web/src/pages/Pricing.vue",
      "apps/web/src/components/Dialogs/PricingDialog.vue"
     ],
     "gherkin": null,
     "do": "Assert page and dialog both render `PricingLayout`; dialog has no footer and FAQ is last; comparison renders 30, 50, 100, 500; `PRICE_NOTE` text absent; perks follow a changed mocked `PREMIUM_MODEL_KEYS`; hero no longer contains \"Free Forever\". Update `Pricing.test.ts`, `PricingProCard.test.ts`, `PricingHero.test.ts`, `PricingPacks.test.ts`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 5 unit criteria; files at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/pages/Pricing.test.ts src/components/Dialogs/PricingDialog.test.ts src/components/Pricing --coverage --coverage.include=src/components/Pricing/PricingLayout.vue,src/components/Pricing/PricingComparison.vue,src/components/Pricing/PricingProCard.vue,src/pages/Pricing.vue,src/components/Dialogs/PricingDialog.vue --coverage.reporter=text"
     ],
     "line": 438,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:21:40.662Z"
    },
    {
     "id": "T7.6",
     "title": "Unit: reset time helper and hero",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/utils/dailyReset.ts",
      "apps/web/src/components/Pricing/PricingHero.vue",
      "apps/web/src/components/Pricing/PricingCreditStory.vue"
     ],
     "gherkin": null,
     "do": "Test `dailyReset` across several timezones including half-hour offsets (for example Asia/Kolkata gives 5:30 AM) using a stubbed timezone; hero and credit story copy tests.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 6 reset copy criteria; files at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/utils/dailyReset.test.ts src/components/Pricing/PricingHero.test.ts src/components/Pricing/PricingCreditStory.test.ts --coverage --coverage.include=src/utils/dailyReset.ts,src/components/Pricing/PricingHero.vue,src/components/Pricing/PricingCreditStory.vue --coverage.reporter=text"
     ],
     "line": 446,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:21:40.662Z"
    },
    {
     "id": "T7.7",
     "title": "E2E: pricing layout",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/pricing-layout.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC items 5 and 6 browser criteria pass; checkout stubbed; `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/pricing-layout.spec.ts --repeat-each=3"
     ],
     "line": 454,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:21:40.662Z"
    },
    {
     "id": "T7.8",
     "title": "Gate: Phase 7",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC items 5 and 6 copy criteria met; FAQ consistency test green."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/pricing-layout.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/localized-prices.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run check`."
     ],
     "line": 463,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-09T13:21:40.662Z"
    }
   ],
   "verified": 8,
   "total": 8,
   "complete": true
  },
  {
   "id": "8",
   "name": "History-full notices",
   "startLine": 473,
   "endLine": 520,
   "adds": "The not-saved notice explains why with real numbers and has icon buttons for Download and Dismiss. A persistent note near Generate warns when history is nearly full or full, with an Upgrade link for Free users.",
   "tryInUi": [
    "As Free with 100 images see \"History full\" near Generate",
    "as Pro with 500 see the same without an Upgrade link",
    "with under 90 images see nothing",
    "trigger a not-saved result and use the icon Download and X Dismiss buttons."
   ],
   "checkpoint": {
    "title": "Checkpoint 8",
    "line": 519,
    "items": [
     "history-full notices correct for both plans."
    ]
   },
   "tasks": [
    {
     "id": "T8.1",
     "title": "UnsavedResultNotice copy and icon buttons",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.vue"
     ],
     "gherkin": null,
     "do": "Copy such as \"History full (500/500) - this image wasn't saved. Download it within ~1 hour.\" with the real count and `HISTORY_CAP` by plan; Download becomes an icon button (aria-label \"Download image\"); Dismiss an X icon button (aria-label \"Dismiss\"); remove \"Delete images to free space\"; Free keeps \"Upgrade to Pro (500 history)\" with the number from `HISTORY_CAP`. Update the existing test.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 8 notice requirements; Pro sees no upgrade link."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/Canvas/UnsavedResultNotice.test.ts",
      "`bun run check`."
     ],
     "line": 478,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:51:27.232Z"
    },
    {
     "id": "T8.2",
     "title": "Persistent HistoryFullNote",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/Canvas/HistoryFullNote.vue",
      "apps/web/src/components/Dashboard/Canvas/ResultCanvas.vue",
      "apps/web/src/components/Dashboard/Composer/PromptBar.vue",
      "apps/web/src/stores/history.ts"
     ],
     "gherkin": null,
     "do": "New component using `getHistoryFullLevel(count, HISTORY_CAP[plan])`: near-full wording \"History almost full (N/cap). Delete old images to keep saving new ones.\", full wording \"History full - new creations won't be saved. Delete old images to make room.\"; Free also sees an Upgrade link. Nothing when the count is unknown or loading. Count from the server-returned history length; re-evaluate after a generation completes and after single or bulk delete. Downgraded users over the Free cap are treated as full. Mount near the Generate button or history header (confirm placement by reading the components). Use impeccable and layout skills.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 8: note appears at 90% and 100% for both plans, none under 90%, re-evaluates after generate and delete."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/Canvas src/stores/history.test.ts",
      "`bun run check`."
     ],
     "line": 486,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:51:27.232Z"
    },
    {
     "id": "T8.3",
     "title": "Unit: notices",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.vue",
      "apps/web/src/components/Dashboard/Canvas/HistoryFullNote.vue",
      "apps/web/src/stores/history.ts"
     ],
     "gherkin": null,
     "do": "Component tests for copy, aria-labels \"Download image\" and \"Dismiss\", absence of any delete button, upgrade link by plan, near and full wording, count unknown shows nothing, over-cap downgrade shows full; store test for count re-evaluation after delete. Helper boundaries already covered in T1.8.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 8 unit criteria; files at least 80% across all metrics, target over 95%."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/Canvas/UnsavedResultNotice.test.ts src/components/Dashboard/Canvas/HistoryFullNote.test.ts src/stores/history.test.ts --coverage --coverage.include=src/components/Dashboard/Canvas/UnsavedResultNotice.vue,src/components/Dashboard/Canvas/HistoryFullNote.vue,src/stores/history.ts --coverage.reporter=text"
     ],
     "line": 494,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:51:27.232Z"
    },
    {
     "id": "T8.4",
     "title": "E2E: history-full notices",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/api/tools/seed-e2e-user.ts",
      "apps/web/e2e/support/proPerksSeed.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/history-full.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC item 8 browser criteria pass; seeding merges with working-tree edits; generation endpoints stubbed; `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/history-full.spec.ts --repeat-each=3"
     ],
     "line": 502,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T13:51:27.232Z"
    },
    {
     "id": "T8.5",
     "title": "Gate: Phase 8",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC item 8 success criteria met."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/history-full.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run check`."
     ],
     "line": 511,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-09T13:51:27.232Z"
    }
   ],
   "verified": 5,
   "total": 5,
   "complete": true
  },
  {
   "id": "9",
   "name": "End-to-end gate and walkthrough",
   "startLine": 521,
   "endLine": 559,
   "adds": "Final proof that every spec item works together with zero real paid calls, plus a documented walkthrough.",
   "tryInUi": [
    "Run `cd apps/web && bunx playwright test e2e/qa/paid-call-guard.spec.ts` and confirm green",
    "walk the header pill, model menu, buy dialog, pricing, profile credits and history note as Free and Pro",
    "confirm INR with the dev override set."
   ],
   "checkpoint": {
    "title": "Checkpoint 9",
    "line": 558,
    "items": [
     "all eight SPEC items verified; no real paid calls; owner review."
    ]
   },
   "tasks": [
    {
     "id": "T9.1",
     "title": "Final consistency sweep",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run `grep -rn DAILY_CREDITS apps packages --exclude-dir=node_modules --exclude-dir=coverage` (no scalar use), grep Pricing components for hardcoded model display names (none outside shared-derived lists), confirm the FAQ JSON consistency test, and grep web copy and FAQ JSON for old costs. Do not run `check:model-docs` (live Replicate call).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Boundaries: no duplicated model or tier lists in web copy; no scalar `DAILY_CREDITS`; docs consistent."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/paid-call-guard.spec.ts e2e/qa/pricing-layout.spec.ts --repeat-each=2",
      "cd apps/web && npx vitest run src/utils/dailyCreditsConsistency.test.ts",
      "bun run verify",
      "`bun run test`."
     ],
     "line": 526,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-09T14:56:06.720Z"
    },
    {
     "id": "T9.2",
     "title": "Gate: full e2e in both server modes",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run all affected QA specs and the full suite in dev and prod-preview modes.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "`paid-call-guard.spec.ts` passes and the guard reports zero un-intercepted paid calls; all new and changed specs green; no test weakened."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/pro-perks.spec.ts e2e/qa/model-menu.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/history-full.spec.ts e2e/qa/daily-credits.spec.ts e2e/qa/localized-prices.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/subscription-lifecycle.spec.ts e2e/qa/paid-call-guard.spec.ts --repeat-each=2",
      "cd apps/web && bun run test:e2e",
      "`cd apps/web && E2E_SERVER=prod bun run test:e2e`."
     ],
     "line": 534,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-09T14:56:06.720Z"
    },
    {
     "id": "T9.3",
     "title": "Walkthrough: all spec items",
     "done": true,
     "kind": "walkthrough",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Walk SPEC items 1 to 8 as Free and Pro using the seeded QA specs as evidence; optional `agent-browser` visual pass (`AGENT_BROWSER_SESSION` = repo basename, signed in as the seeded e2e QA user from `e2e/fixtures/qa.ts`; this repo has no `qa-seed.init.js`; ended with `agent-browser close`) for layout polish only, never as sole evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every SPEC item is verifiable in the browser through its QA spec; screenshots of modal, /pricing, model menu and header pill reviewed against the owner's reference screenshots."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/model-menu.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/history-full.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run check`."
     ],
     "line": 542,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-09T14:56:06.720Z"
    },
    {
     "id": "T9.4",
     "title": "Definition of done",
     "done": true,
     "kind": "dod",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run every suite and map evidence to each SPEC success criterion; list manual owner items (set `DEV_COUNTRY_OVERRIDE=IN` locally to see INR; note the one-time reset-instant shift from pinning cron to UTC; nothing committed).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All code-verifiable SPEC success criteria for items 1 to 8 met; `bun run verify`, `bun run test` and e2e green in both server modes; zero real paid calls; owner reviews the remaining manual items."
     ],
     "verify": [
      "cd apps/api && bun run test",
      "cd apps/web && bun run test",
      "bun run verify",
      "cd apps/web && bun run test:e2e",
      "`cd apps/web && E2E_SERVER=prod bun run test:e2e`."
     ],
     "line": 550,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-09T14:56:06.720Z"
    }
   ],
   "verified": 4,
   "total": 4,
   "complete": true
  }
 ],
 "current": null,
 "nextCommand": null,
 "questions": [
  {
   "at": "2026-11-06T17:33:59.537Z",
   "type": "question",
   "tasks": [],
   "id": "Q1",
   "text": "check:model-docs calls live Replicate — drop it from this feature entirely?",
   "default": "Drop it entirely",
   "alternatives": "Keep as manual owner-only step; build an offline cost checker",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-06T17:33:59.577Z",
   "type": "question",
   "tasks": [],
   "id": "Q2",
   "text": "generalFAQ.json says 50 persistent credits but SIGNUP_CREDITS=30 — fix the copy?",
   "default": "Leave as is (signup credits out of scope)",
   "alternatives": "Fix copy in T1.6 and add to consistency test",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-06T17:33:59.618Z",
   "type": "question",
   "tasks": [],
   "id": "Q3",
   "text": "Upgrade link in Buy-more-credits dialog: Free users only?",
   "default": "Free users only",
   "alternatives": "Pro users see a Pro badge there instead",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-07T13:41:41.739Z",
   "type": "question",
   "tasks": [
    "T2.2"
   ],
   "id": "Q4",
   "text": "Upsell message on PREMIUM_MODEL_REQUIRES_PRO?",
   "default": "kept: pricing dialog opens, no raw error (existing test asserts errMsg undefined)",
   "alternatives": "also set a feature error text",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-09T11:55:04.326Z",
   "type": "question",
   "tasks": [
    "T7.5",
    "T7.6"
   ],
   "id": "Q5",
   "text": "Preflight flags 3 new unit test files (PricingComparison.test.ts, PricingLayout.test.ts, dailyReset.test.ts) as stray: not in tasks Files lists. They are the intended T7.5/T7.6 outputs.",
   "answer": null,
   "answeredAt": null
  }
 ],
 "stuck": [],
 "commits": [
  {
   "at": "2026-11-09T14:56:06.720Z",
   "ok": true,
   "phase": "9",
   "tasks": [
    "T9.1",
    "T9.2",
    "T9.3",
    "T9.4"
   ],
   "attempt": "1",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 227/227 dev and prod (3 skipped), api 1088, web 1482",
   "error": null,
   "sha": "f13199a4420b20a733cc707f6143a92c692dbbf5",
   "shortSha": "f13199a",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/f13199a4420b20a733cc707f6143a92c692dbbf5",
   "subject": "feat(pricing-pro-polish): phase 9 end-to-end gate and walkthrough",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-09T20:25:58+05:30",
   "filesChanged": 2,
   "added": 5,
   "removed": 5
  },
  {
   "at": "2026-11-09T13:51:27.232Z",
   "ok": true,
   "phase": "8",
   "tasks": [
    "T8.1",
    "T8.2",
    "T8.3",
    "T8.4",
    "T8.5"
   ],
   "attempt": "4",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 15/15 prod x2, unit coverage 100%",
   "error": null,
   "sha": "c0917038b5c4be7cd15f5c28e9e19abc934e39e0",
   "shortSha": "c091703",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/c0917038b5c4be7cd15f5c28e9e19abc934e39e0",
   "subject": "feat(pricing-pro-polish): phase 8 history-full notices",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-09T19:21:19+05:30",
   "filesChanged": 12,
   "added": 585,
   "removed": 128
  },
  {
   "at": "2026-11-09T13:21:40.662Z",
   "ok": true,
   "phase": "7",
   "tasks": [
    "T7.1",
    "T7.2",
    "T7.3",
    "T7.4",
    "T7.5",
    "T7.6",
    "T7.7",
    "T7.8"
   ],
   "attempt": "1",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 160/160 x3, unit coverage 100%",
   "error": null,
   "sha": "2f5c58f21ce011f057486195ee4ff26a6d406606",
   "shortSha": "2f5c58f",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/2f5c58f21ce011f057486195ee4ff26a6d406606",
   "subject": "feat(pricing-pro-polish): phase 7 unified pricing layout and daily-credit copy",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-09T18:51:33+05:30",
   "filesChanged": 28,
   "added": 757,
   "removed": 160
  },
  {
   "at": "2026-11-09T11:03:34.362Z",
   "ok": true,
   "phase": "6",
   "tasks": [
    "T6.1",
    "T6.2",
    "T6.3",
    "T6.4",
    "T6.5",
    "T6.6",
    "T6.7",
    "T6.8"
   ],
   "attempt": "2",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 46/46 x3 prod, unit 2671 pass, lowest unit coverage 82.75% branches (AppModal, pre-existing gaps)",
   "error": null,
   "sha": "44aef592f3b65e2adcfa8ca8078df9ef3e58fce5",
   "shortSha": "44aef59",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/44aef592f3b65e2adcfa8ca8078df9ef3e58fce5",
   "subject": "feat(pricing-pro-polish): phase 6 upgrade entry and buy dialog",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-09T16:33:23+05:30",
   "filesChanged": 17,
   "added": 568,
   "removed": 58
  },
  {
   "at": "2026-11-07T16:32:25.089Z",
   "ok": true,
   "phase": "5",
   "tasks": [
    "T5.1",
    "T5.2",
    "T5.3",
    "T5.4",
    "T5.5"
   ],
   "attempt": "3",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 15/15, unit lowest 100%",
   "error": null,
   "sha": "f00a3ab5a2876fd7f7491f2e03cf69d2e243129b",
   "shortSha": "f00a3ab",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/f00a3ab5a2876fd7f7491f2e03cf69d2e243129b",
   "subject": "feat(pricing-pro-polish): phase 5 model menu",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-07T22:02:18+05:30",
   "filesChanged": 13,
   "added": 366,
   "removed": 388
  },
  {
   "at": "2026-11-07T15:53:20.663Z",
   "ok": true,
   "phase": "4",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6"
   ],
   "attempt": "3",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 25/25 (x3), unit coverage 100% geo/router/env, 98.9% usePricingCatalog",
   "error": null,
   "sha": "3f7422a9fe90f6ffcf9047c9862cd81dd0ca2353",
   "shortSha": "3f7422a",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/3f7422a9fe90f6ffcf9047c9862cd81dd0ca2353",
   "subject": "feat(pricing-pro-polish): phase 4 dev country override",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-07T21:23:13+05:30",
   "filesChanged": 10,
   "added": 529,
   "removed": 16
  },
  {
   "at": "2026-11-07T15:15:50.397Z",
   "ok": true,
   "phase": "3",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5",
    "T3.6",
    "T3.7"
   ],
   "attempt": "2",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 15/15 + 11/11 gate, lowest unit coverage 96% branches (service.ts), 100% cron/isPro",
   "error": null,
   "sha": "c8fb0a72eedbb75300b0e31fcb50f05ede49f38a",
   "shortSha": "c8fb0a7",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/c8fb0a72eedbb75300b0e31fcb50f05ede49f38a",
   "subject": "feat(pricing-pro-polish): phase 3 plan-aware daily reset and mid-day upgrade",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-07T20:45:18+05:30",
   "filesChanged": 11,
   "added": 618,
   "removed": 58
  },
  {
   "at": "2026-11-07T14:41:22.668Z",
   "ok": true,
   "phase": "2",
   "tasks": [
    "T2.1",
    "T2.2",
    "T2.3",
    "T2.4",
    "T2.5",
    "T2.6"
   ],
   "attempt": "2",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 85/85 x3, unit 2544 pass, lowest cov 94.7% branches",
   "error": null,
   "sha": "49992ffe5b83e861e912201e4b14eea58e64fab8",
   "shortSha": "49992ff",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/49992ffe5b83e861e912201e4b14eea58e64fab8",
   "subject": "feat(pricing-pro-polish): phase 2 server gate and client lock follow-through",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-07T20:11:15+05:30",
   "filesChanged": 15,
   "added": 685,
   "removed": 92
  },
  {
   "at": "2026-11-07T13:38:59.582Z",
   "ok": true,
   "phase": "1",
   "tasks": [
    "T1.1",
    "T1.2",
    "T1.3",
    "T1.4",
    "T1.5",
    "T1.6",
    "T1.7",
    "T1.8",
    "T1.9",
    "T1.10",
    "T1.11"
   ],
   "attempt": "3",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 13/13 x3; root tests 2504; credits.ts 92.85% lines",
   "error": null,
   "sha": "2ba927026b15db7ad5f76ae72fd0bdc32c096f88",
   "shortSha": "2ba9270",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/2ba927026b15db7ad5f76ae72fd0bdc32c096f88",
   "subject": "feat(pricing-pro-polish): phase 1 shared constants foundation",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-07T19:08:50+05:30",
   "filesChanged": 30,
   "added": 426,
   "removed": 69
  }
 ],
 "shots": [
  {
   "taskId": "T1.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Landing teaser and final CTA show 30 daily credits",
   "annotations": [],
   "at": "2026-11-07T13:22:42.533Z",
   "file": "1/T1.5-1.png",
   "phase": "1",
   "href": "shots/1/T1.5-1.png"
  },
  {
   "taskId": "T1.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pricing hero shows 30 daily credits",
   "annotations": [],
   "at": "2026-11-07T13:22:42.586Z",
   "file": "1/T1.5-2.png",
   "phase": "1",
   "href": "shots/1/T1.5-2.png"
  },
  {
   "taskId": "T1.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Low-credits dialog shows Free daily amount (30)",
   "annotations": [],
   "at": "2026-11-07T13:22:42.640Z",
   "file": "1/T1.5-3.png",
   "phase": "1",
   "href": "shots/1/T1.5-3.png"
  },
  {
   "taskId": "T1.5",
   "kind": "proof",
   "step": "PricingTeaser renders DAILY_CREDITS.free",
   "attempt": 2,
   "caption": "Landing pricing teaser shows 30 daily credits for Free (verifier retake)",
   "annotations": [
    {
     "x": 10.7,
     "y": 45.1,
     "w": 35.8,
     "h": 2.8,
     "label": "30 daily credits (unused reset)"
    },
    {
     "x": 26,
     "y": 8.5,
     "w": 48,
     "h": 6,
     "label": "Start with 30 persistent credits and 30 daily"
    }
   ],
   "at": "2026-11-07T13:34:39.455Z",
   "file": "1/T1.5-4.png",
   "phase": "1",
   "href": "shots/1/T1.5-4.png"
  },
  {
   "taskId": "T1.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Profile credits card shows 30/30 daily",
   "annotations": [],
   "at": "2026-11-07T13:22:42.693Z",
   "file": "1/T1.6-1.png",
   "phase": "1",
   "href": "shots/1/T1.6-1.png"
  },
  {
   "taskId": "T1.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pricing credit story: 30 daily, 1-5 cost range",
   "annotations": [],
   "at": "2026-11-07T13:22:42.747Z",
   "file": "1/T1.6-2.png",
   "phase": "1",
   "href": "shots/1/T1.6-2.png"
  },
  {
   "taskId": "T1.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Profile card shows 30/30 daily for Free",
   "annotations": [],
   "at": "2026-11-07T13:22:42.322Z",
   "file": "1/T1.10-1.png",
   "phase": "1",
   "href": "shots/1/T1.10-1.png"
  },
  {
   "taskId": "T1.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Low-credits dialog: plan refreshes 30 credits every day",
   "annotations": [],
   "at": "2026-11-07T13:22:42.374Z",
   "file": "1/T1.10-2.png",
   "phase": "1",
   "href": "shots/1/T1.10-2.png"
  },
  {
   "taskId": "T1.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pricing page: 30 daily credits, 1-5 cost copy",
   "annotations": [],
   "at": "2026-11-07T13:22:42.428Z",
   "file": "1/T1.10-3.png",
   "phase": "1",
   "href": "shots/1/T1.10-3.png"
  },
  {
   "taskId": "T1.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Landing: 30 daily credits copy",
   "annotations": [],
   "at": "2026-11-07T13:22:42.481Z",
   "file": "1/T1.10-4.png",
   "phase": "1",
   "href": "shots/1/T1.10-4.png"
  },
  {
   "taskId": "T2.2",
   "kind": "proof",
   "step": "cost table matches SPEC item 7",
   "attempt": 2,
   "caption": "Cost table blurb now reads \"A few flagship models cost 5.\"",
   "annotations": [
    {
     "x": 10,
     "y": 47,
     "w": 19,
     "h": 6,
     "label": "blurb shows 5, not \"4 or 5\""
    }
   ],
   "at": "2026-11-07T14:10:56.125Z",
   "file": "2/T2.2-1.png",
   "phase": "2",
   "href": "shots/2/T2.2-1.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free: Pro-only models locked with PRO badge",
   "annotations": [],
   "at": "2026-11-07T13:53:30.435Z",
   "file": "2/T2.5-1.png",
   "phase": "2",
   "href": "shots/2/T2.5-1.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free: Flux 2 Max unlocked, cost 5",
   "annotations": [],
   "at": "2026-11-07T13:53:30.512Z",
   "file": "2/T2.5-2.png",
   "phase": "2",
   "href": "shots/2/T2.5-2.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pro: no locks in model picker",
   "annotations": [],
   "at": "2026-11-07T13:53:30.570Z",
   "file": "2/T2.5-3.png",
   "phase": "2",
   "href": "shots/2/T2.5-3.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pricing cost table 5-credit group",
   "annotations": [],
   "at": "2026-11-07T13:53:30.629Z",
   "file": "2/T2.5-4.png",
   "phase": "2",
   "href": "shots/2/T2.5-4.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": "Free can select FLUX.2 Max with no lock and cost shows 5",
   "attempt": 1,
   "caption": "Non-Pro picker (signed-out session, Free rules): Flux 2 Max has no lock and costs 5, while Flux Kontext Pro shows the PRO lock",
   "annotations": [
    {
     "x": 35.8,
     "y": 89.3,
     "w": 29.2,
     "h": 7.6,
     "label": "Flux 2 Max unlocked, cost 5"
    },
    {
     "x": 35.8,
     "y": 79,
     "w": 29.2,
     "h": 8.5,
     "label": "Flux Kontext Pro locked with PRO badge"
    }
   ],
   "at": "2026-11-07T14:03:50.357Z",
   "file": "2/T2.5-5.png",
   "phase": "2",
   "href": "shots/2/T2.5-5.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free: lock and PRO badge on Pro-only models",
   "annotations": [],
   "at": "2026-11-07T14:21:06.618Z",
   "file": "2/T2.5-6.png",
   "phase": "2",
   "href": "shots/2/T2.5-6.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free: Flux 2 Max visible, unlocked, cost 5",
   "annotations": [],
   "at": "2026-11-07T14:21:06.694Z",
   "file": "2/T2.5-7.png",
   "phase": "2",
   "href": "shots/2/T2.5-7.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Clicking a locked model opens the Pro upsell dialog",
   "annotations": [],
   "at": "2026-11-07T14:21:06.757Z",
   "file": "2/T2.5-8.png",
   "phase": "2",
   "href": "shots/2/T2.5-8.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Stale Flux Realism selection: 403 opens upsell, no raw error",
   "annotations": [],
   "at": "2026-11-07T14:21:06.816Z",
   "file": "2/T2.5-9.png",
   "phase": "2",
   "href": "shots/2/T2.5-9.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pro: no locks in the picker",
   "annotations": [],
   "at": "2026-11-07T14:21:06.876Z",
   "file": "2/T2.5-10.png",
   "phase": "2",
   "href": "shots/2/T2.5-10.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pricing cost table: flat 5-credit premium band",
   "annotations": [],
   "at": "2026-11-07T14:21:06.937Z",
   "file": "2/T2.5-11.png",
   "phase": "2",
   "href": "shots/2/T2.5-11.png"
  },
  {
   "taskId": "T3.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free profile card shows 30/30 daily",
   "annotations": [],
   "at": "2026-11-07T15:03:25.177Z",
   "file": "3/T3.6-1.png",
   "phase": "3",
   "href": "shots/3/T3.6-1.png"
  },
  {
   "taskId": "T3.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Credits chip shows 50 daily after the signed activation webhook",
   "annotations": [],
   "at": "2026-11-07T15:03:25.266Z",
   "file": "3/T3.6-2.png",
   "phase": "3",
   "href": "shots/3/T3.6-2.png"
  },
  {
   "taskId": "T3.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pro profile card shows 50/50 daily",
   "annotations": [],
   "at": "2026-11-07T15:03:25.337Z",
   "file": "3/T3.6-3.png",
   "phase": "3",
   "href": "shots/3/T3.6-3.png"
  },
  {
   "taskId": "T4.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pricing page packs in rupees (cf-ipcountry IN)",
   "annotations": [],
   "at": "2026-11-07T15:35:30.017Z",
   "file": "4/T4.5-1.png",
   "phase": "4",
   "href": "shots/4/T4.5-1.png"
  },
  {
   "taskId": "T4.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Buy dialog packs in rupees (cf-ipcountry IN)",
   "annotations": [],
   "at": "2026-11-07T15:35:30.152Z",
   "file": "4/T4.5-2.png",
   "phase": "4",
   "href": "shots/4/T4.5-2.png"
  },
  {
   "taskId": "T4.5",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pricing page packs in USD with no country header",
   "annotations": [],
   "at": "2026-11-07T15:35:30.265Z",
   "file": "4/T4.5-3.png",
   "phase": "4",
   "href": "shots/4/T4.5-3.png"
  },
  {
   "taskId": "T4.5",
   "kind": "proof",
   "step": "@critical cf-ipcountry IN shows rupee prices in the buy dialog",
   "attempt": 1,
   "caption": "Buy more credits dialog showing all four packs in rupees (cf-ipcountry IN, prod build)",
   "annotations": [
    {
     "x": 22.5,
     "y": 16.2,
     "w": 55,
     "h": 67.7,
     "label": "Buy dialog pack prices in INR (130.00 to 900.00 rupees)"
    }
   ],
   "at": "2026-11-07T15:46:03.760Z",
   "file": "4/T4.5-4.png",
   "phase": "4",
   "href": "shots/4/T4.5-4.png"
  },
  {
   "taskId": "T5.1",
   "kind": "after",
   "step": "rows have identical height",
   "attempt": null,
   "caption": "Model rows are single-line with identical height",
   "annotations": [],
   "at": "2026-11-07T16:15:07.369Z",
   "file": "5/T5.1-1.png",
   "phase": "5",
   "href": "shots/5/T5.1-1.png"
  },
  {
   "taskId": "T5.1",
   "kind": "after",
   "step": "icon only for ref-capable, exact tooltip",
   "attempt": null,
   "caption": "Reference-image icon shows tooltip \"Up to N reference images\" only for ref-capable models",
   "annotations": [],
   "at": "2026-11-07T16:15:07.464Z",
   "file": "5/T5.1-2.png",
   "phase": "5",
   "href": "shots/5/T5.1-2.png"
  },
  {
   "taskId": "T5.1",
   "kind": "after",
   "step": "PRO lock for non-Pro",
   "attempt": null,
   "caption": "Free viewer sees PRO lock on Pro-only models",
   "annotations": [],
   "at": "2026-11-07T16:15:07.556Z",
   "file": "5/T5.1-3.png",
   "phase": "5",
   "href": "shots/5/T5.1-3.png"
  },
  {
   "taskId": "T5.1",
   "kind": "after",
   "step": "Pro users see no lock",
   "attempt": null,
   "caption": "Pro viewer sees no lock badges",
   "annotations": [],
   "at": "2026-11-07T16:15:07.651Z",
   "file": "5/T5.1-4.png",
   "phase": "5",
   "href": "shots/5/T5.1-4.png"
  },
  {
   "taskId": "T5.1",
   "kind": "after",
   "step": "Single-line row: name plus description, ref icon, PRO lock, credits",
   "attempt": 3,
   "caption": "Each model row shows the name and its description separated by a space, on one uniform-height line",
   "annotations": [
    {
     "x": 2.2,
     "y": 30,
     "w": 33,
     "h": 3.5,
     "label": "Name and description separated (Z-Image Turbo Super-fast 6B model)"
    },
    {
     "x": 2.2,
     "y": 68.5,
     "w": 33,
     "h": 3.5,
     "label": "Flux Lightning Fastest generation, gap restored"
    },
    {
     "x": 27.7,
     "y": 53,
     "w": 4.5,
     "h": 3.5,
     "label": "PRO lock for Free viewer"
    }
   ],
   "at": "2026-11-07T16:25:47.484Z",
   "file": "5/T5.1-5.png",
   "phase": "5",
   "href": "shots/5/T5.1-5.png"
  },
  {
   "taskId": "T5.2",
   "kind": "after",
   "step": "sections in that order",
   "attempt": null,
   "caption": "Sections appear in order Featured, Free, Pro",
   "annotations": [],
   "at": "2026-11-07T16:15:07.743Z",
   "file": "5/T5.2-1.png",
   "phase": "5",
   "href": "shots/5/T5.2-1.png"
  },
  {
   "taskId": "T5.2",
   "kind": "after",
   "step": "Pro section locks for Free",
   "attempt": null,
   "caption": "Pro section shows locks for Free users",
   "annotations": [],
   "at": "2026-11-07T16:15:07.835Z",
   "file": "5/T5.2-2.png",
   "phase": "5",
   "href": "shots/5/T5.2-2.png"
  },
  {
   "taskId": "T5.2",
   "kind": "after",
   "step": "Pro viewer, no locks",
   "attempt": null,
   "caption": "Pro users see the Pro section without locks",
   "annotations": [],
   "at": "2026-11-07T16:15:07.924Z",
   "file": "5/T5.2-3.png",
   "phase": "5",
   "href": "shots/5/T5.2-3.png"
  },
  {
   "taskId": "T5.2",
   "kind": "after",
   "step": "Pro section shows locks for Free users",
   "attempt": 2,
   "caption": "Free viewer: Pro section heading with PRO lock on Flux Realism (bottom of the scrolled menu)",
   "annotations": [
    {
     "x": 2,
     "y": 66,
     "w": 34,
     "h": 7,
     "label": "Pro section with PRO lock badge"
    }
   ],
   "at": "2026-11-07T16:20:52.896Z",
   "file": "5/T5.2-4.png",
   "phase": "5",
   "href": "shots/5/T5.2-4.png"
  },
  {
   "taskId": "T5.2",
   "kind": "after",
   "step": "Pro section shows locks for Free users",
   "attempt": 3,
   "caption": "Menu scrolled to the Pro section: seven Pro-only models, each with a PRO lock badge for a Free user.",
   "annotations": [
    {
     "x": 1.3,
     "y": 36.9,
     "w": 34.4,
     "h": 36.6,
     "label": "Pro section rows all carry PRO lock badges"
    }
   ],
   "at": "2026-11-07T16:28:41.968Z",
   "file": "5/T5.2-5.png",
   "phase": "5",
   "href": "shots/5/T5.2-5.png"
  },
  {
   "taskId": "T5.2",
   "kind": "after",
   "step": "Sections in order Featured, Free, Pro",
   "attempt": 3,
   "caption": "Top of the model menu showing Featured then Free sections, ahead of the Pro section.",
   "annotations": [],
   "at": "2026-11-07T16:28:42.082Z",
   "file": "5/T5.2-6.png",
   "phase": "5",
   "href": "shots/5/T5.2-6.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Menu sections in order Featured, Free, Pro",
   "annotations": [],
   "at": "2026-11-07T16:13:22.382Z",
   "file": "5/T5.4-1.png",
   "phase": "5",
   "href": "shots/5/T5.4-1.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "All model rows share one height",
   "annotations": [],
   "at": "2026-11-07T16:09:17.050Z",
   "file": "5/T5.4-2.png",
   "phase": "5",
   "href": "shots/5/T5.4-2.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Reference icon tooltip: Up to 8 reference images",
   "annotations": [],
   "at": "2026-11-07T16:09:17.141Z",
   "file": "5/T5.4-3.png",
   "phase": "5",
   "href": "shots/5/T5.4-3.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free user sees Pro locks in Featured and Pro",
   "annotations": [],
   "at": "2026-11-07T16:09:17.234Z",
   "file": "5/T5.4-4.png",
   "phase": "5",
   "href": "shots/5/T5.4-4.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pro user sees no locks",
   "annotations": [],
   "at": "2026-11-07T16:13:22.773Z",
   "file": "5/T5.4-5.png",
   "phase": "5",
   "href": "shots/5/T5.4-5.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Desktop width, no overflow",
   "annotations": [],
   "at": "2026-11-07T16:09:17.418Z",
   "file": "5/T5.4-6.png",
   "phase": "5",
   "href": "shots/5/T5.4-6.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Mobile width, no overflow",
   "annotations": [],
   "at": "2026-11-07T16:09:17.511Z",
   "file": "5/T5.4-7.png",
   "phase": "5",
   "href": "shots/5/T5.4-7.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "All rows share one height",
   "annotations": [],
   "at": "2026-11-07T16:13:22.498Z",
   "file": "5/T5.4-8.png",
   "phase": "5",
   "href": "shots/5/T5.4-8.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Reference icon tooltip",
   "annotations": [],
   "at": "2026-11-07T16:13:22.590Z",
   "file": "5/T5.4-9.png",
   "phase": "5",
   "href": "shots/5/T5.4-9.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free user lock badges",
   "annotations": [],
   "at": "2026-11-07T16:13:22.682Z",
   "file": "5/T5.4-10.png",
   "phase": "5",
   "href": "shots/5/T5.4-10.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Desktop menu no overflow",
   "annotations": [],
   "at": "2026-11-07T16:13:22.865Z",
   "file": "5/T5.4-11.png",
   "phase": "5",
   "href": "shots/5/T5.4-11.png"
  },
  {
   "taskId": "T5.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Mobile menu no overflow",
   "annotations": [],
   "at": "2026-11-07T16:13:22.961Z",
   "file": "5/T5.4-12.png",
   "phase": "5",
   "href": "shots/5/T5.4-12.png"
  },
  {
   "taskId": "T6.1",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free user sees Upgrade to Pro pill (note: clipped under avatar at 1280px)",
   "annotations": [],
   "at": "2026-11-09T10:38:53.280Z",
   "file": "6/T6.1-1.png",
   "phase": "6",
   "href": "shots/6/T6.1-1.png"
  },
  {
   "taskId": "T6.1",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pro user sees badge, no pill",
   "annotations": [],
   "at": "2026-11-09T10:38:53.379Z",
   "file": "6/T6.1-2.png",
   "phase": "6",
   "href": "shots/6/T6.1-2.png"
  },
  {
   "taskId": "T6.1",
   "kind": "after",
   "step": "Pill for Free, no overlap",
   "attempt": null,
   "caption": "Free user at 1280px (prod build): Upgrade to Pro pill beside the credits balance, fully left of the avatar.",
   "annotations": [
    {
     "x": 81.3,
     "y": 1.7,
     "w": 10.9,
     "h": 5.6,
     "label": "Upgrade to Pro pill"
    }
   ],
   "at": "2026-11-09T10:52:25.189Z",
   "file": "6/T6.1-3.png",
   "phase": "6",
   "href": "shots/6/T6.1-3.png"
  },
  {
   "taskId": "T6.2",
   "kind": "after",
   "step": "Backdrop about 60% dim plus blur",
   "attempt": null,
   "caption": "Buy credits dialog over a dimmed, blurred page (shared AppModal backdrop).",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 22,
     "h": 100,
     "label": "Page behind is blurred and dimmed, still visible"
    }
   ],
   "at": "2026-11-09T10:52:25.321Z",
   "file": "6/T6.2-1.png",
   "phase": "6",
   "href": "shots/6/T6.2-1.png"
  },
  {
   "taskId": "T6.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Buy more credits dialog layout for Free user",
   "annotations": [],
   "at": "2026-11-09T10:38:53.479Z",
   "file": "6/T6.4-1.png",
   "phase": "6",
   "href": "shots/6/T6.4-1.png"
  },
  {
   "taskId": "T6.4",
   "kind": "after",
   "step": "SPEC item 2: equal-height cards, no hole",
   "attempt": 2,
   "caption": "Buy dialog cards stack from the top: 200 card has no empty band, equal heights",
   "annotations": [
    {
     "x": 23,
     "y": 34,
     "w": 52,
     "h": 28,
     "label": "four package cards, content stacked from top"
    }
   ],
   "at": "2026-11-09T10:54:46.810Z",
   "file": "6/T6.4-2.png",
   "phase": "6",
   "href": "shots/6/T6.4-2.png"
  },
  {
   "taskId": "T6.4",
   "kind": "proof",
   "step": null,
   "attempt": 2,
   "caption": "Verifier a2 (prod build): four equal-height cards, rows stacked with no inner gap, no $0.00, per-100 text, Upgrade to Pro link; spare height sits below the 200 card estimate",
   "annotations": [
    {
     "x": 24.5,
     "y": 33.5,
     "w": 12.5,
     "h": 30.5,
     "label": "200 card, no Save line, no inner hole"
    },
    {
     "x": 24.5,
     "y": 67.5,
     "w": 16.5,
     "h": 2.8,
     "label": "Upgrade to Pro link"
    }
   ],
   "at": "2026-11-09T11:01:06.204Z",
   "file": "6/T6.4-3.png",
   "phase": "6",
   "href": "shots/6/T6.4-3.png"
  },
  {
   "taskId": "T6.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free header shows Upgrade to Pro pill beside credits",
   "annotations": [],
   "at": "2026-11-09T10:38:52.853Z",
   "file": "6/T6.7-1.png",
   "phase": "6",
   "href": "shots/6/T6.7-1.png"
  },
  {
   "taskId": "T6.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pro (webhook-activated) header shows Pro badge, no pill",
   "annotations": [],
   "at": "2026-11-09T10:38:52.978Z",
   "file": "6/T6.7-2.png",
   "phase": "6",
   "href": "shots/6/T6.7-2.png"
  },
  {
   "taskId": "T6.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Buy dialog: Upgrade link, equal-height cards, per-100 and image estimates",
   "annotations": [],
   "at": "2026-11-09T10:38:53.079Z",
   "file": "6/T6.7-3.png",
   "phase": "6",
   "href": "shots/6/T6.7-3.png"
  },
  {
   "taskId": "T6.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Mobile 375px header without horizontal overflow",
   "annotations": [],
   "at": "2026-11-09T10:38:53.179Z",
   "file": "6/T6.7-4.png",
   "phase": "6",
   "href": "shots/6/T6.7-4.png"
  },
  {
   "taskId": "T6.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Free user header with the Upgrade pill left of the avatar",
   "annotations": [],
   "at": "2026-11-09T10:57:04.297Z",
   "file": "6/T6.7-5.png",
   "phase": "6",
   "href": "shots/6/T6.7-5.png"
  },
  {
   "taskId": "T6.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pro user header with the PRO badge and no Upgrade pill",
   "annotations": [],
   "at": "2026-11-09T10:57:04.434Z",
   "file": "6/T6.7-6.png",
   "phase": "6",
   "href": "shots/6/T6.7-6.png"
  },
  {
   "taskId": "T6.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Buy credits dialog for Free: four equal-height cards, per-100 text, Upgrade link",
   "annotations": [],
   "at": "2026-11-09T10:57:04.541Z",
   "file": "6/T6.7-7.png",
   "phase": "6",
   "href": "shots/6/T6.7-7.png"
  },
  {
   "taskId": "T6.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "375px header with icon-only upgrade pill, no overflow",
   "annotations": [],
   "at": "2026-11-09T10:57:04.645Z",
   "file": "6/T6.7-8.png",
   "phase": "6",
   "href": "shots/6/T6.7-8.png"
  },
  {
   "taskId": "T6.8",
   "kind": "after",
   "step": "Upgrade entry point, no overlap",
   "attempt": null,
   "caption": "Free user at 1280px: Upgrade to Pro pill sits fully left of the avatar, label intact.",
   "annotations": [
    {
     "x": 81.3,
     "y": 2.8,
     "w": 10.2,
     "h": 7.6,
     "label": "Upgrade pill with full label"
    }
   ],
   "at": "2026-11-09T10:44:24.981Z",
   "file": "6/T6.8-1.png",
   "phase": "6",
   "href": "shots/6/T6.8-1.png"
  },
  {
   "taskId": "T6.8",
   "kind": "after",
   "step": "Buy dialog polished",
   "attempt": null,
   "caption": "Buy credits dialog: equal-height cards, per-100-credits text, Upgrade to Pro link, blurred backdrop.",
   "annotations": [
    {
     "x": 24.5,
     "y": 33.5,
     "w": 51,
     "h": 30,
     "label": "Pack cards with per 100 credits"
    },
    {
     "x": 24.5,
     "y": 66,
     "w": 15,
     "h": 3.5,
     "label": "Upgrade to Pro link"
    }
   ],
   "at": "2026-11-09T10:44:25.120Z",
   "file": "6/T6.8-2.png",
   "phase": "6",
   "href": "shots/6/T6.8-2.png"
  },
  {
   "taskId": "T6.8",
   "kind": "after",
   "step": "Pro badge",
   "attempt": null,
   "caption": "Pro user sees the Pro badge and no upgrade pill.",
   "annotations": [
    {
     "x": 81,
     "y": 2.8,
     "w": 8,
     "h": 7.6,
     "label": "Pro badge"
    }
   ],
   "at": "2026-11-09T10:44:25.226Z",
   "file": "6/T6.8-3.png",
   "phase": "6",
   "href": "shots/6/T6.8-3.png"
  },
  {
   "taskId": "T6.8",
   "kind": "proof",
   "step": "SPEC item 2: cards equal height, no hole",
   "attempt": null,
   "caption": "Buy-credits dialog: four equal-height cards, content stacked from the top with no empty band, per-100-credit text, Upgrade to Pro link, dimmed and blurred backdrop.",
   "annotations": [
    {
     "x": 24,
     "y": 34,
     "w": 52,
     "h": 32,
     "label": "equal-height pack cards without a gap"
    }
   ],
   "at": "2026-11-09T10:58:37.874Z",
   "file": "6/T6.8-4.png",
   "phase": "6",
   "href": "shots/6/T6.8-4.png"
  },
  {
   "taskId": "T6.8",
   "kind": "proof",
   "step": "SPEC item 1: upgrade entry point",
   "attempt": null,
   "caption": "Free user header: Upgrade to Pro pill sits left of the avatar, credits chip beside it.",
   "annotations": [
    {
     "x": 81,
     "y": 2,
     "w": 12,
     "h": 6,
     "label": "Upgrade to Pro pill"
    }
   ],
   "at": "2026-11-09T10:58:38.011Z",
   "file": "6/T6.8-5.png",
   "phase": "6",
   "href": "shots/6/T6.8-5.png"
  },
  {
   "taskId": "T7.1",
   "kind": "proof",
   "step": "Unified layout on /pricing",
   "attempt": null,
   "caption": "/pricing hero with Free-to-Pro copy; comparison follows",
   "annotations": [
    {
     "x": 4,
     "y": 18,
     "w": 50,
     "h": 55,
     "label": "new hero, no Free Forever"
    }
   ],
   "at": "2026-11-09T11:43:15.885Z",
   "file": "7/T7.1-1.png",
   "phase": "7",
   "href": "shots/7/T7.1-1.png"
  },
  {
   "taskId": "T7.2",
   "kind": "proof",
   "step": "Comparison numbers derive from DAILY_CREDITS and HISTORY_CAP",
   "attempt": null,
   "caption": "Free | Pro comparison side by side: 30 vs 50 daily credits, 100 vs 500 history, models, queue, privacy",
   "annotations": [
    {
     "x": 5,
     "y": 24,
     "w": 44,
     "h": 76,
     "label": "Free column, 30 per day and 100 images"
    },
    {
     "x": 51,
     "y": 24,
     "w": 44,
     "h": 76,
     "label": "Pro column, 50 per day and 500 images"
    }
   ],
   "at": "2026-11-09T12:37:14.758Z",
   "file": "7/T7.2-1.png",
   "phase": "7",
   "href": "shots/7/T7.2-1.png"
  },
  {
   "taskId": "T7.2",
   "kind": "proof",
   "step": "Packs framed \"Top up any plan\"",
   "attempt": null,
   "caption": "Packs section reframed as \"Top up any plan\" for Free or Pro",
   "annotations": [
    {
     "x": 5,
     "y": 46,
     "w": 45,
     "h": 8,
     "label": "Top up any plan heading"
    },
    {
     "x": 5,
     "y": 57,
     "w": 31,
     "h": 14,
     "label": "copy says packs work on Free or Pro"
    }
   ],
   "at": "2026-11-09T12:37:14.893Z",
   "file": "7/T7.2-2.png",
   "phase": "7",
   "href": "shots/7/T7.2-2.png"
  },
  {
   "taskId": "T7.3",
   "kind": "proof",
   "step": "Perks list the six Pro models; removed note absent",
   "attempt": null,
   "caption": "Pro card at $5.00/month lists the six premium models and has no Approx. price note",
   "annotations": [
    {
     "x": 7,
     "y": 36,
     "w": 10,
     "h": 5,
     "label": "$5.00 / month, no approx note below"
    },
    {
     "x": 7,
     "y": 50,
     "w": 59,
     "h": 4,
     "label": "six premium models from PREMIUM_MODEL_KEYS"
    }
   ],
   "at": "2026-11-09T12:37:14.994Z",
   "file": "7/T7.3-1.png",
   "phase": "7",
   "href": "shots/7/T7.3-1.png"
  },
  {
   "taskId": "T7.4",
   "kind": "proof",
   "step": "Reset time shown explicitly in local time",
   "attempt": null,
   "caption": "Credit story shows the reset time in local time (5:30 AM in Asia/Kolkata for 00:00 UTC)",
   "annotations": [
    {
     "x": 38,
     "y": 41,
     "w": 57,
     "h": 19,
     "label": "Resets daily at 5:30 AM in your local time"
    }
   ],
   "at": "2026-11-09T12:37:15.092Z",
   "file": "7/T7.4-1.png",
   "phase": "7",
   "href": "shots/7/T7.4-1.png"
  },
  {
   "taskId": "T7.4",
   "kind": "proof",
   "step": "Free profile 30/day with local-time reset text",
   "attempt": null,
   "caption": "Free profile card: 30/30 daily and \"Resets daily at 5:30 AM\" in local time (prod e2e run, Asia/Kolkata)",
   "annotations": [
    {
     "x": 64,
     "y": 16,
     "w": 11,
     "h": 7,
     "label": "30/30 daily and Resets daily at 5:30 AM"
    }
   ],
   "at": "2026-11-09T12:42:22.787Z",
   "file": "7/T7.4-2.png",
   "phase": "7",
   "href": "shots/7/T7.4-2.png"
  },
  {
   "taskId": "T7.4",
   "kind": "proof",
   "step": "Pro profile 50/day",
   "attempt": null,
   "caption": "Pro profile card: 50/50 daily and the same local-time reset line",
   "annotations": [
    {
     "x": 64,
     "y": 16,
     "w": 11,
     "h": 7,
     "label": "50/50 daily and Resets daily at 5:30 AM"
    }
   ],
   "at": "2026-11-09T12:42:22.914Z",
   "file": "7/T7.4-3.png",
   "phase": "7",
   "href": "shots/7/T7.4-3.png"
  },
  {
   "taskId": "T7.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pricing modal: comparison, packs, costs, FAQ order, no footer",
   "annotations": [],
   "at": "2026-11-09T11:49:15.929Z",
   "file": "7/T7.7-1.png",
   "phase": "7",
   "href": "shots/7/T7.7-1.png"
  },
  {
   "taskId": "T7.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "/pricing page section order",
   "annotations": [],
   "at": "2026-11-09T11:49:16.091Z",
   "file": "7/T7.7-2.png",
   "phase": "7",
   "href": "shots/7/T7.7-2.png"
  },
  {
   "taskId": "T7.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "/pricing footer after FAQ",
   "annotations": [],
   "at": "2026-11-09T11:49:16.224Z",
   "file": "7/T7.7-3.png",
   "phase": "7",
   "href": "shots/7/T7.7-3.png"
  },
  {
   "taskId": "T7.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "30 vs 50 daily, 100 vs 500 history",
   "annotations": [],
   "at": "2026-11-09T11:49:16.355Z",
   "file": "7/T7.7-4.png",
   "phase": "7",
   "href": "shots/7/T7.7-4.png"
  },
  {
   "taskId": "T7.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Pro card lists six premium models",
   "annotations": [],
   "at": "2026-11-09T11:49:16.508Z",
   "file": "7/T7.7-5.png",
   "phase": "7",
   "href": "shots/7/T7.7-5.png"
  },
  {
   "taskId": "T7.7",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "375px stacked comparison, no overflow",
   "annotations": [],
   "at": "2026-11-09T11:49:16.638Z",
   "file": "7/T7.7-6.png",
   "phase": "7",
   "href": "shots/7/T7.7-6.png"
  },
  {
   "taskId": "T8.1",
   "kind": "after",
   "step": "Notice with icon Download and Dismiss",
   "attempt": null,
   "caption": "Unsaved-result notice shows 100/100 with visible download and dismiss icons",
   "annotations": [
    {
     "x": 92,
     "y": 38,
     "w": 6,
     "h": 6,
     "label": "Download icon renders"
    },
    {
     "x": 95.5,
     "y": 38,
     "w": 3,
     "h": 6,
     "label": "Dismiss icon renders"
    }
   ],
   "at": "2026-11-09T13:44:33.593Z",
   "file": "8/T8.1-1.png",
   "phase": "8",
   "href": "shots/8/T8.1-1.png"
  },
  {
   "taskId": "T8.2",
   "kind": "after",
   "step": "Full note with count from saved entries",
   "attempt": null,
   "caption": "Free user at 100 sees the history-full note with info icon and Upgrade",
   "annotations": [
    {
     "x": 23,
     "y": 29,
     "w": 48,
     "h": 5,
     "label": "History full note with icon and Upgrade"
    }
   ],
   "at": "2026-11-09T13:44:33.721Z",
   "file": "8/T8.2-1.png",
   "phase": "8",
   "href": "shots/8/T8.2-1.png"
  },
  {
   "taskId": "T8.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "history-full free-full",
   "annotations": [],
   "at": "2026-11-09T13:32:00.781Z",
   "file": "8/T8.4-1.png",
   "phase": "8",
   "href": "shots/8/T8.4-1.png"
  },
  {
   "taskId": "T8.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "history-full pro-full",
   "annotations": [],
   "at": "2026-11-09T13:32:00.954Z",
   "file": "8/T8.4-2.png",
   "phase": "8",
   "href": "shots/8/T8.4-2.png"
  },
  {
   "taskId": "T8.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "history-full free-near",
   "annotations": [],
   "at": "2026-11-09T13:32:01.091Z",
   "file": "8/T8.4-3.png",
   "phase": "8",
   "href": "shots/8/T8.4-3.png"
  },
  {
   "taskId": "T8.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "history-full unsaved-notice",
   "annotations": [],
   "at": "2026-11-09T13:32:01.228Z",
   "file": "8/T8.4-4.png",
   "phase": "8",
   "href": "shots/8/T8.4-4.png"
  },
  {
   "taskId": "T8.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Unsaved-result notice at 100/100 with SVG Download and Dismiss icon buttons",
   "annotations": [],
   "at": "2026-11-09T13:45:34.065Z",
   "file": "8/T8.4-5.png",
   "phase": "8",
   "href": "shots/8/T8.4-5.png"
  },
  {
   "taskId": "T8.5",
   "kind": "proof",
   "step": "Free at 100/100 shows the full note with an Upgrade link",
   "attempt": null,
   "caption": "Free at 100/100 shows the full note with an Upgrade link",
   "annotations": [],
   "at": "2026-11-09T13:35:52.432Z",
   "file": "8/T8.5-1.png",
   "phase": "8",
   "href": "shots/8/T8.5-1.png"
  },
  {
   "taskId": "T8.5",
   "kind": "proof",
   "step": "Pro at 500/500 shows the full note with no Upgrade link",
   "attempt": null,
   "caption": "Pro at 500/500 shows the full note with no Upgrade link",
   "annotations": [],
   "at": "2026-11-09T13:35:52.605Z",
   "file": "8/T8.5-2.png",
   "phase": "8",
   "href": "shots/8/T8.5-2.png"
  },
  {
   "taskId": "T8.5",
   "kind": "proof",
   "step": "Free at 90/100 shows the near-full wording",
   "attempt": null,
   "caption": "Free at 90/100 shows the near-full wording",
   "annotations": [],
   "at": "2026-11-09T13:35:52.742Z",
   "file": "8/T8.5-3.png",
   "phase": "8",
   "href": "shots/8/T8.5-3.png"
  },
  {
   "taskId": "T8.5",
   "kind": "proof",
   "step": "Not-saved result shows icon Download and Dismiss, no delete button",
   "attempt": null,
   "caption": "Not-saved result shows icon Download and Dismiss, no delete button",
   "annotations": [],
   "at": "2026-11-09T13:35:52.878Z",
   "file": "8/T8.5-4.png",
   "phase": "8",
   "href": "shots/8/T8.5-4.png"
  },
  {
   "taskId": "T9.3",
   "kind": "proof",
   "step": "pricing layout",
   "attempt": null,
   "caption": "/pricing shows the Free vs Pro comparison first.",
   "annotations": [
    {
     "x": 10,
     "y": 15,
     "w": 80,
     "h": 40,
     "label": "comparison section"
    }
   ],
   "at": "2026-11-09T14:29:02.221Z",
   "file": "9/T9.3-1.png",
   "phase": "9",
   "href": "shots/9/T9.3-1.png"
  },
  {
   "taskId": "T9.3",
   "kind": "proof",
   "step": "Upgrade/buy modal",
   "attempt": null,
   "caption": "Buy more credits modal for Free user: 4 equal-height packs, per-100 text, Upgrade to Pro link.",
   "annotations": [
    {
     "x": 25.6,
     "y": 18.6,
     "w": 48.9,
     "h": 62.9,
     "label": "Buy modal with equal-height pack cards and Upgrade to Pro link"
    }
   ],
   "at": "2026-11-09T14:30:20.123Z",
   "file": "9/T9.3-2.png",
   "phase": "9",
   "href": "shots/9/T9.3-2.png"
  },
  {
   "taskId": "T9.3",
   "kind": "proof",
   "step": "Header pill",
   "attempt": null,
   "caption": "Header shows the gold Upgrade to Pro pill for a Free user.",
   "annotations": [
    {
     "x": 83.3,
     "y": 1.2,
     "w": 9.6,
     "h": 4.7,
     "label": "Upgrade to Pro pill"
    }
   ],
   "at": "2026-11-09T14:30:20.261Z",
   "file": "9/T9.3-3.png",
   "phase": "9",
   "href": "shots/9/T9.3-3.png"
  },
  {
   "taskId": "T9.3",
   "kind": "proof",
   "step": "Model menu",
   "attempt": null,
   "caption": "Model menu: Featured, then Free sections; Pro-only models show a PRO lock for Free.",
   "annotations": [
    {
     "x": 1.1,
     "y": 21.9,
     "w": 30.7,
     "h": 45.3,
     "label": "Sectioned model menu with uniform rows and PRO badges"
    }
   ],
   "at": "2026-11-09T14:30:20.395Z",
   "file": "9/T9.3-4.png",
   "phase": "9",
   "href": "shots/9/T9.3-4.png"
  },
  {
   "taskId": "T9.3",
   "kind": "proof",
   "step": "pricing layout: comparison first",
   "attempt": 1,
   "caption": "/pricing shows the Free or Pro comparison right after the hero: 30 vs 50 daily, 100 vs 500 history (verifier retake).",
   "annotations": [
    {
     "x": 10,
     "y": 8.9,
     "w": 80,
     "h": 66.5,
     "label": "Free or Pro comparison section"
    }
   ],
   "at": "2026-11-09T14:51:52.289Z",
   "file": "9/T9.3-5.png",
   "phase": "9",
   "href": "shots/9/T9.3-5.png"
  }
 ],
 "deliverables": [
  {
   "at": "2026-11-09T14:55:50.168Z",
   "type": "deliverable",
   "tasks": [
    "T9.1",
    "T9.2",
    "T9.3",
    "T9.4"
   ],
   "text": "Final e2e gate green in dev and prod, walkthrough shots, DoD evidence mapped",
   "files": [
    "apps/web/e2e/qa/daily-credits-copy.spec.ts"
   ]
  },
  {
   "at": "2026-11-09T13:51:09.251Z",
   "type": "deliverable",
   "tasks": [
    "T8.1",
    "T8.2",
    "T8.3",
    "T8.4",
    "T8.5"
   ],
   "text": "History-full notices: unsaved notice rework, HistoryFullNote, saved-count store, unit + e2e",
   "files": [
    "apps/web/src/components/Dashboard/Canvas/HistoryFullNote.vue",
    "apps/web/src/stores/history.ts"
   ]
  },
  {
   "at": "2026-11-09T13:21:26.780Z",
   "type": "deliverable",
   "tasks": [
    "T7.1",
    "T7.2",
    "T7.3",
    "T7.4",
    "T7.5",
    "T7.6",
    "T7.7",
    "T7.8"
   ],
   "text": "Unified pricing layout (hero, Free|Pro comparison, Pro card, packs, credit story, model costs, FAQ) shared by /pricing and modal; local-time daily reset copy; FAQ fixes"
  },
  {
   "at": "2026-11-09T11:03:09.518Z",
   "type": "deliverable",
   "tasks": [
    "T6.1",
    "T6.2",
    "T6.3",
    "T6.4",
    "T6.5",
    "T6.6",
    "T6.7",
    "T6.8"
   ],
   "text": "Free Upgrade pill/Pro badge, blurred dim backdrop, per-100 pricing helpers and buy dialog polish, unit + e2e tests",
   "files": [
    "apps/web/src/components/Header/CreditsChip.vue",
    "apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue"
   ]
  },
  {
   "at": "2026-11-07T16:32:08.095Z",
   "type": "deliverable",
   "tasks": [
    "T5.1",
    "T5.2",
    "T5.3",
    "T5.4",
    "T5.5"
   ],
   "text": "Model menu: single-line rows, Featured/Free/Pro sections, unit+e2e coverage",
   "files": [
    "apps/web/src/components/Dashboard/ModelPicker",
    "apps/web/e2e/qa/model-menu.spec.ts"
   ]
  },
  {
   "at": "2026-11-07T15:53:01.799Z",
   "type": "deliverable",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6"
   ],
   "text": "Dev country override (query/env), env validation+warning, unit+e2e localized currency",
   "files": [
    "apps/api/src/payments/geo.ts",
    "apps/api/src/payments/router.ts",
    "apps/api/src/config/env.ts",
    "apps/api/.env.example"
   ]
  },
  {
   "at": "2026-11-07T15:15:03.024Z",
   "type": "deliverable",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5",
    "T3.6",
    "T3.7"
   ],
   "text": "Plan-aware UTC daily reset and idempotent mid-day Pro top-up",
   "files": [
    "apps/api/src/lib/isPro.ts",
    "apps/api/src/utils/cronJobs.ts",
    "apps/api/src/payments/service.ts"
   ]
  },
  {
   "at": "2026-11-07T14:30:26.537Z",
   "type": "deliverable",
   "tasks": [
    "T2.1",
    "T2.2",
    "T2.3",
    "T2.4",
    "T2.5",
    "T2.6"
   ],
   "text": "Server gate, charging and client lock verified; useFetch premium-403 fix; e2e stubbed",
   "files": [
    "apps/web/src/composables/useFetch/index.ts",
    "apps/web/src/composables/usePricingCatalog.ts",
    "apps/api/src/utils/credit-calculator.ts",
    "apps/web/e2e/qa/pro-tier.spec.ts"
   ]
  },
  {
   "at": "2026-11-07T13:38:38.559Z",
   "type": "deliverable",
   "tasks": [
    "T1.1",
    "T1.2",
    "T1.3",
    "T1.4",
    "T1.5",
    "T1.6",
    "T1.7",
    "T1.8",
    "T1.9",
    "T1.10",
    "T1.11"
   ],
   "text": "Shared DAILY_CREDITS {free:30,pro:50}, premium cost 5, FAQ/copy migrated, unit+e2e green",
   "files": [
    "packages/shared",
    "apps/api",
    "packages/email",
    "apps/web"
   ]
  }
 ],
 "advisories": [
  {
   "at": "2026-11-09T14:52:07.418Z",
   "type": "advisory",
   "tasks": [
    "T9.3"
   ],
   "text": "Shot T9.3-1 caption claimed the comparison section but showed only the hero; verifier added T9.3-5 showing the Free or Pro comparison."
  },
  {
   "at": "2026-11-09T14:52:07.304Z",
   "type": "advisory",
   "tasks": [
    "T9.2"
   ],
   "text": "Working tree holds non-phase-9 changes (apps/api replicate/generate/generation-service, packages/email, e2e/fixtures/base.ts, CLAUDE.md, SPEC/PLAN docs); phase 9 itself only touched e2e/qa/daily-credits-copy.spec.ts. Stage deliberately when committing."
  },
  {
   "at": "2026-11-09T13:48:57.803Z",
   "type": "advisory",
   "tasks": [
    "T8.2"
   ],
   "text": "PromptBar composer blur/click-miss on notice Dismiss (known, out of scope); spec uses dispatchEvent"
  },
  {
   "at": "2026-11-09T13:48:57.678Z",
   "type": "advisory",
   "tasks": [
    "T8.4"
   ],
   "text": "shots/8/T8.4-4.png is a stale pre-fix shot (19:02) showing a blank Download square and no X; superseded by T8.4-5, should be removed or retaken"
  },
  {
   "at": "2026-11-09T13:48:57.519Z",
   "type": "advisory",
   "tasks": [
    "T8.4"
   ],
   "text": "shots/8/T8.4-1..5, T8.1-1, T8.2-1: proof shots have no annotation boxes"
  },
  {
   "at": "2026-11-09T13:42:24.959Z",
   "type": "advisory",
   "tasks": [
    "T8.4"
   ],
   "text": "Registered shots T8.4-1..4 have no annotations and generic captions; T8.4-4/T8.5-4 caption claims icon buttons that render blank"
  },
  {
   "at": "2026-11-09T13:42:24.835Z",
   "type": "advisory",
   "tasks": [
    "T8.3"
   ],
   "text": "Verify line comma-separated --coverage.include yields 0/0 report; repeated --coverage.include flags give 100% (34/34 stmts, 21/21 br); store delete test uses splice instead of the real deleteImage path"
  },
  {
   "at": "2026-11-09T13:42:24.703Z",
   "type": "advisory",
   "tasks": [
    "T8.2"
   ],
   "text": "Gate-reported (not re-verified): mousedown on controls under composer blurs textarea 72px->36px, shifting layout 80px so real clicks on notice Dismiss miss; spec uses dispatchEvent"
  },
  {
   "at": "2026-11-09T13:42:24.578Z",
   "type": "advisory",
   "tasks": [
    "T8.2"
   ],
   "text": "UI task (.vue Files, no Design field) has no registered proof shot; HistoryFullNote fa-circle-info <i> renders nothing (webfont not loaded, faCircleInfo not registered)"
  },
  {
   "at": "2026-11-09T13:42:24.401Z",
   "type": "advisory",
   "tasks": [
    "T8.1"
   ],
   "text": "UI task (.vue Files, no Design field) has no registered proof shot; states covered only by T8.4/T8.5 shots"
  },
  {
   "at": "2026-11-09T11:01:36.405Z",
   "type": "advisory",
   "tasks": [
    "T6.4"
   ],
   "text": "shots/6/T6.4-2.png was captured mid-fade (page bleeds through the dialog); verifier registered T6.4-3.png from the prod run"
  },
  {
   "at": "2026-11-09T11:01:36.293Z",
   "type": "advisory",
   "tasks": [
    "T6.4"
   ],
   "text": "BuyMoreCreditsDialog.vue .pkg-meta: rows are not subgrid-aligned; the 200 card per-100 row sits one line higher than the other cards and its spare height falls below the estimate (no inner hole, so SPEC item 2 holds)"
  },
  {
   "at": "2026-11-09T10:52:36.272Z",
   "type": "advisory",
   "tasks": [
    "T6.2"
   ],
   "text": "No engineer-registered proof shot; verifier registered T6.2-1"
  },
  {
   "at": "2026-11-09T10:52:36.174Z",
   "type": "advisory",
   "tasks": [
    "T6.7"
   ],
   "text": "BuyMoreCreditsDialog mounted twice (AppHeader + Dashboard), pre-existing"
  },
  {
   "at": "2026-11-09T10:52:36.072Z",
   "type": "advisory",
   "tasks": [
    "T6.5"
   ],
   "text": "Verify comma-form --coverage.include yields empty report; repeated flags needed"
  },
  {
   "at": "2026-11-09T10:52:35.972Z",
   "type": "advisory",
   "tasks": [
    "T6.6"
   ],
   "text": "AppModal.test.ts new backdrop test asserts class+z-index only, passes on HEAD; AppModal.vue branches 82.75% from pre-existing gaps (L40/73 SSR guards, L54/81/84, unused isOpen setter L44 misattributed in engineer report)"
  },
  {
   "at": "2026-11-09T10:52:35.862Z",
   "type": "advisory",
   "tasks": [
    "T6.7"
   ],
   "text": "upgrade-entry.spec.ts:47 orphan comment about a removed test.fail marker"
  },
  {
   "at": "2026-11-07T16:31:10.990Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "unit task on UI files has no registered proof shot (no Design field)"
  },
  {
   "at": "2026-11-07T16:31:10.892Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "TASKS.md T5.3 Verify comma-separated --coverage.include reports 0/0; use repeated flags or a glob"
  },
  {
   "at": "2026-11-07T16:31:10.790Z",
   "type": "advisory",
   "tasks": [
    "T5.2"
   ],
   "text": "apps/web/src/utils/models.ts groupModelsByCompany and getModelSpeedHint have no remaining callers (outside Files)"
  },
  {
   "at": "2026-11-07T16:31:10.668Z",
   "type": "advisory",
   "tasks": [
    "T5.2"
   ],
   "text": "shots/5/T5.2-5.png caption says seven Pro-only models; PREMIUM_MODEL_KEYS has six and six are in frame; T5.1-5/T5.2-5/T5.2-6 carry no annotation boxes"
  },
  {
   "at": "2026-11-07T16:21:03.808Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "UI-file unit task has no registered proof shot (no Design field)"
  },
  {
   "at": "2026-11-07T16:21:03.719Z",
   "type": "advisory",
   "tasks": [
    "T5.2"
   ],
   "text": "Proof shots T5.2-1 (claims 3 sections) and T5.2-3 (claims Pro section) frame only Featured+Free; listbox needs scrolling before shot; all shots lack --annotate boxes"
  },
  {
   "at": "2026-11-07T16:21:03.631Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "Verify line comma-separated --coverage.include reports 0/0; repeated flags/glob needed (verifier used glob: 100% all metrics)"
  },
  {
   "at": "2026-11-07T16:21:03.539Z",
   "type": "advisory",
   "tasks": [
    "T5.2"
   ],
   "text": "apps/web/src/utils/models.ts:309,382 groupModelsByCompany and getModelSpeedHint have no remaining callers (dead exports; outside Files)"
  },
  {
   "at": "2026-11-07T15:52:43.783Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "T4.3 Verify uses comma-joined --coverage.include which matches nothing in vitest 4; use repeated flags"
  },
  {
   "at": "2026-11-07T15:50:12.135Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "T4.3 Verify comma-joined --coverage.include matches nothing in vitest 4; per-file flags used (100% all metrics)"
  },
  {
   "at": "2026-11-07T15:46:04.181Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "router.test.ts mocks ../lib/logger.js twice (lines 27 and 63); drop one"
  },
  {
   "at": "2026-11-07T15:46:04.104Z",
   "type": "advisory",
   "tasks": [
    "T4.5"
   ],
   "text": "localized-prices.spec.ts snap(localized-prices-inr-buy-dialog) fires during the dialog enter transition, so the frame shows no dialog; wait for the transition before snapping (verifier retook the shot)"
  },
  {
   "at": "2026-11-07T15:46:04.026Z",
   "type": "advisory",
   "tasks": [
    "T4.1"
   ],
   "text": "geo.ts parseOverride: an env DEV_COUNTRY_OVERRIDE=ZZ logs a warn on every /payments/prices request in dev (noisy); consider rejecting unknown regions once at startup"
  },
  {
   "at": "2026-11-07T15:46:03.944Z",
   "type": "advisory",
   "tasks": [
    "T4.1"
   ],
   "text": "Verify names bun run check in apps/api, which has no check script; root check (exit 0) and apps/api tsc --noEmit (clean) used instead"
  },
  {
   "at": "2026-11-07T15:46:03.864Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "Verify line uses comma-joined --coverage.include which matches nothing in vitest 4; use one --coverage.include per file"
  },
  {
   "at": "2026-11-07T15:11:26.088Z",
   "type": "advisory",
   "tasks": [
    "T3.2"
   ],
   "text": "Earlier cron-order advisory withdrawn: no race, the Free $nor filter is evaluated at write time so a user activated between the two updateMany calls is skipped by the Free update."
  },
  {
   "at": "2026-11-07T15:09:09.623Z",
   "type": "advisory",
   "tasks": [
    "T3.6"
   ],
   "text": "Proof shots T3.6-1..3 have no --annotate boxes; T3.6-2 captures the chip menu mid fade-in (semi-transparent) though 50 daily is legible."
  },
  {
   "at": "2026-11-07T15:09:09.552Z",
   "type": "advisory",
   "tasks": [
    "T3.4"
   ],
   "text": "isPro.test.ts parity uses a hand-rolled Mongo matcher, not a real Mongo engine; semantics checked manually and match for the fixtures. T3.4 engineer report (T3.4-unit-a1.md) is absent."
  },
  {
   "at": "2026-11-07T15:09:09.482Z",
   "type": "advisory",
   "tasks": [
    "T3.4"
   ],
   "text": "cronJobs.test.ts asserts values via getDailyCredits(true/false), not literal 50/30, so a wrong helper value would pass; also Verify line comma-joined --coverage.include matches nothing (empty table); separate --coverage.include flags give isPro.ts and cronJobs.ts 100% all metrics."
  },
  {
   "at": "2026-11-07T15:09:09.393Z",
   "type": "advisory",
   "tasks": [
    "T3.2"
   ],
   "text": "cronJobs.ts:20-25 Pro update runs before Free update; a user activated between the two calls is reset to 30 after the $max top-up. Running the Free update first closes that window."
  },
  {
   "at": "2026-11-07T14:29:44.712Z",
   "type": "advisory",
   "tasks": [
    "T2.6"
   ],
   "text": "PricingProCard.vue:16 perk copy lists FLUX.2 Max under Premium models (visible in T2.5-8/T2.5-9); owned by a later phase"
  },
  {
   "at": "2026-11-07T14:29:44.655Z",
   "type": "advisory",
   "tasks": [
    "T2.2"
   ],
   "text": "useFetch/index.ts:46 logs failed POSTs as GET when ctx.options is absent (pro-tier.spec.ts:282 regex encodes \"GET .* 403\")"
  },
  {
   "at": "2026-11-07T14:29:44.594Z",
   "type": "advisory",
   "tasks": [
    "T2.5"
   ],
   "text": "shots/2/T2.5-2.png still registered with caption \"Flux 2 Max unlocked\" but image does not show Flux 2 Max; superseded by T2.5-7"
  },
  {
   "at": "2026-11-07T14:29:44.521Z",
   "type": "advisory",
   "tasks": [
    "T2.5"
   ],
   "text": "pro-perks.spec.ts:98 and dev-cloud-reference.spec.ts:58 now assert the outcome of their own /generate/image stub (tautological); real 403/no-deduction and cloud validation live in API unit tests"
  },
  {
   "at": "2026-11-07T14:08:21.034Z",
   "type": "advisory",
   "tasks": [
    "T2.1"
   ],
   "text": "apps/api/src/utils/credit-calculator.ts:10 doc comment still says 4-5 (premium)"
  },
  {
   "at": "2026-11-07T14:08:20.969Z",
   "type": "advisory",
   "tasks": [
    "T2.6"
   ],
   "text": "Gate (Files: none) ran check --fix, reformatting 4 test files (formatting only)"
  },
  {
   "at": "2026-11-07T14:08:20.901Z",
   "type": "advisory",
   "tasks": [
    "T2.4"
   ],
   "text": "UI task with no registered proof shot (no Design field)"
  },
  {
   "at": "2026-11-07T14:08:20.832Z",
   "type": "advisory",
   "tasks": [
    "T2.2"
   ],
   "text": "UI task with no registered proof shot (no Design field)"
  },
  {
   "at": "2026-11-07T14:08:20.766Z",
   "type": "advisory",
   "tasks": [
    "T2.5"
   ],
   "text": "Shot T2.5-2 shows the wrong menu (no Flux 2 Max), superseded by T2.5-5; T2.5 shots have no annotations"
  },
  {
   "at": "2026-11-07T14:08:20.698Z",
   "type": "advisory",
   "tasks": [
    "T2.4"
   ],
   "text": "generate.test.ts:264 mocks useFetch so it cannot catch the onFetchError TypeError; T2.4 engineer report missing"
  },
  {
   "at": "2026-11-07T14:08:20.619Z",
   "type": "advisory",
   "tasks": [
    "T2.4"
   ],
   "text": "Verify comma-separated --coverage.include reports 0%; use a brace glob + json-summary"
  },
  {
   "at": "2026-11-07T14:08:20.538Z",
   "type": "advisory",
   "tasks": [
    "T2.3"
   ],
   "text": "Verify comma-separated --coverage.include reports 0%; use a brace glob + json-summary"
  },
  {
   "at": "2026-11-07T13:38:14.706Z",
   "type": "advisory",
   "tasks": [
    "T1.1"
   ],
   "text": "credits.ts:50 comment \"Standard generation: 1 credit (FLUX_2_PRO and FLUX_KONTEXT_PRO are 5)\" omits IMAGEN_4_ULTRA (line 63), also 5 in that group"
  },
  {
   "at": "2026-11-07T13:34:53.797Z",
   "type": "advisory",
   "tasks": [
    "T1.3"
   ],
   "text": "email .tsx files changed with no registered proof shot (render tests only; no Design field)"
  },
  {
   "at": "2026-11-07T13:34:53.752Z",
   "type": "advisory",
   "tasks": [
    "T1.6"
   ],
   "text": "ProfileCreditsCard dailyCredits/dailyAllowance can read 50/30 after a Pro lapse (no claw-back per SPEC)"
  },
  {
   "at": "2026-11-07T13:34:53.707Z",
   "type": "advisory",
   "tasks": [
    "T1.9"
   ],
   "text": "consistency test accepts only DAILY_CREDITS.free; FAQ copy mentioning Pro 50 daily (Phase 7) will need .pro support"
  },
  {
   "at": "2026-11-07T13:34:53.663Z",
   "type": "advisory",
   "tasks": [
    "T1.10"
   ],
   "text": "chip assertion checks the stubbed 30 balance, not the allowance; drift is caught only by the profile-card 30/30 assertion"
  },
  {
   "at": "2026-11-07T13:34:53.619Z",
   "type": "advisory",
   "tasks": [
    "T1.10"
   ],
   "text": "T1.5/T1.6/T1.10 shots registered without annotations; T1.5-1 full landing shot did not show the teaser copy (verifier retook as T1.5-4)"
  },
  {
   "at": "2026-11-07T13:34:53.574Z",
   "type": "advisory",
   "tasks": [
    "T1.11"
   ],
   "text": "bun run verify runs --fix; verifier ran vp lint/vp check without fix (0 errors, 7 out-of-scope warnings)"
  },
  {
   "at": "2026-11-07T13:34:53.528Z",
   "type": "advisory",
   "tasks": [
    "T1.1"
   ],
   "text": "credits.ts:50 comment 'Standard generation: 1 credit' now groups FLUX_2_PRO/FLUX_KONTEXT_PRO/IMAGEN_4_ULTRA at PREMIUM_CREDIT_COST (5)"
  },
  {
   "at": "2026-11-07T13:34:53.484Z",
   "type": "advisory",
   "tasks": [
    "T1.1"
   ],
   "text": "Verify 'cd packages/shared && npx vitest run' fails on root setupFiles path; root run passes 143/143"
  }
 ],
 "activity": [
  {
   "at": "2026-11-09T14:56:06.720Z",
   "type": "commit",
   "tasks": [
    "T9.1",
    "T9.2",
    "T9.3",
    "T9.4"
   ],
   "attempt": "1",
   "text": "feat(pricing-pro-polish): phase 9 end-to-end gate and walkthrough",
   "sha": "f13199a4420b20a733cc707f6143a92c692dbbf5",
   "branch": "feature-enhancement",
   "pushed": "yes",
   "evidence": "e2e 227/227 dev and prod (3 skipped), api 1088, web 1482"
  },
  {
   "at": "2026-11-09T14:55:50.168Z",
   "type": "deliverable",
   "tasks": [
    "T9.1",
    "T9.2",
    "T9.3",
    "T9.4"
   ],
   "text": "Final e2e gate green in dev and prod, walkthrough shots, DoD evidence mapped",
   "files": [
    "apps/web/e2e/qa/daily-credits-copy.spec.ts"
   ]
  },
  {
   "at": "2026-11-09T14:55:47.606Z",
   "tasks": [
    "T9.4"
   ],
   "attempt": "1",
   "type": "verify_passed",
   "evidence": "api test 76 files/1088; web test 1482; check/lint clean; e2e dev and prod 227/3 skipped; SPEC items 1-8 each map to a green QA spec (upgrade-entry, model-menu, localized-prices, pricing-layout, daily-credits(+copy), pro-tier/pro-perks, history-full); manual owner items listed by builder",
   "fingerprint": "b8a8a0be07878096f274e8a21d3b066c572171d6a2ddf1621143d600c0f4ed16"
  },
  {
   "at": "2026-11-09T14:55:47.606Z",
   "tasks": [
    "T9.3"
   ],
   "attempt": "1",
   "type": "verify_passed",
   "evidence": "pro-tier/model-menu/upgrade-entry/pricing-layout/history-full x2 green; web test 214 files/1482; check 0 errors; shots reviewed T9.3-2 modal, T9.3-3 header pill, T9.3-4 model menu (boxes on the right elements), T9.3-5 /pricing comparison (verifier retake)",
   "fingerprint": "90931d9d12732a2bc7d2fc702e422b366e721e120909ce2c82246bfbe90c50fd"
  },
  {
   "at": "2026-11-09T14:55:47.606Z",
   "tasks": [
    "T9.2"
   ],
   "attempt": "1",
   "type": "verify_passed",
   "evidence": "11 listed QA specs + daily-credits-copy x2 dev 149/149; full e2e dev 227 passed/3 skipped (pre-existing assets.spec fixme); E2E_SERVER=prod full 227 passed/3 skipped after one EADDRNOTAVAIL in Clerk globalSetup (network, before any test); paid-call auto fixture asserts zero hits per test, all green; daily-credits-copy edit is an exact copy swap to the phase-7 hero text, not weakened",
   "fingerprint": "6067083e69c0388caac9010073e605d06a55cf1712f9e23076cc90a0431e1b7e"
  },
  {
   "at": "2026-11-09T14:55:47.606Z",
   "tasks": [
    "T9.1"
   ],
   "attempt": "1",
   "type": "verify_passed",
   "evidence": "no scalar DAILY_CREDITS (grep: only .free/.pro, multiline imports, object-equality asserts); no model names in components/Pricing; pricingFAQ.json costs match credits.ts (1/5/2/4); dailyCreditsConsistency 9/9; root test 298 files/2708 tests; vp check + vp lint 0 errors (8 warnings); paid-call-guard + pricing-layout x2 green (inside 149/149 dev run)",
   "fingerprint": "243832fc11e6563fe45b98d0e7dc53da873acbc0d80d31baf363e114c6a137ca"
  },
  {
   "at": "2026-11-09T14:52:07.418Z",
   "type": "advisory",
   "tasks": [
    "T9.3"
   ],
   "text": "Shot T9.3-1 caption claimed the comparison section but showed only the hero; verifier added T9.3-5 showing the Free or Pro comparison."
  },
  {
   "at": "2026-11-09T14:52:07.304Z",
   "type": "advisory",
   "tasks": [
    "T9.2"
   ],
   "text": "Working tree holds non-phase-9 changes (apps/api replicate/generate/generation-service, packages/email, e2e/fixtures/base.ts, CLAUDE.md, SPEC/PLAN docs); phase 9 itself only touched e2e/qa/daily-credits-copy.spec.ts. Stage deliberately when committing."
  },
  {
   "at": "2026-11-09T14:30:29.672Z",
   "type": "verify_started",
   "tasks": [
    "T9.1",
    "T9.2",
    "T9.3",
    "T9.4"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-11-09T14:29:02.807Z",
   "type": "task_built",
   "tasks": [
    "T9.4"
   ],
   "text": "gate/dod verify green",
   "files": []
  },
  {
   "at": "2026-11-09T14:29:02.670Z",
   "type": "task_built",
   "tasks": [
    "T9.3"
   ],
   "text": "gate/dod verify green",
   "files": []
  },
  {
   "at": "2026-11-09T14:29:02.535Z",
   "type": "task_built",
   "tasks": [
    "T9.2"
   ],
   "text": "gate/dod verify green",
   "files": []
  },
  {
   "at": "2026-11-09T14:29:02.398Z",
   "type": "task_built",
   "tasks": [
    "T9.1"
   ],
   "text": "gate/dod verify green",
   "files": []
  },
  {
   "at": "2026-11-09T14:09:27.376Z",
   "type": "task_started",
   "tasks": [
    "T9.4"
   ]
  },
  {
   "at": "2026-11-09T14:09:27.243Z",
   "type": "task_started",
   "tasks": [
    "T9.3"
   ]
  },
  {
   "at": "2026-11-09T14:09:27.114Z",
   "type": "task_started",
   "tasks": [
    "T9.2"
   ]
  },
  {
   "at": "2026-11-09T14:09:26.975Z",
   "type": "task_started",
   "tasks": [
    "T9.1"
   ]
  },
  {
   "at": "2026-11-09T14:09:13.443Z",
   "type": "task_started",
   "tasks": [
    "T9.1",
    "T9.2",
    "T9.3",
    "T9.4"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-11-09T14:09:13.272Z",
   "type": "build_started",
   "tasks": [
    "T9.1",
    "T9.2",
    "T9.3",
    "T9.4"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-11-09T14:09:09.939Z",
   "type": "run_started",
   "tasks": [
    "T9.1",
    "T9.2",
    "T9.3",
    "T9.4"
   ],
   "baseline": {
    "head": "c0917038b5c4be7cd15f5c28e9e19abc934e39e0",
    "status": " M CLAUDE.md\u0000 M agent_docs/pricing-pro-polish/INTERVIEW.md\u0000 M agent_docs/pricing-pro-polish/PLAN.md\u0000 M agent_docs/pricing-pro-polish/SPEC.md\u0000 M apps/api/src/lib/replicate.test.ts\u0000 M apps/api/src/lib/replicate.ts\u0000 M apps/api/src/routes/generate.ts\u0000 M apps/api/src/services/generation-service.ts\u0000 M apps/api/tools/seed-e2e-user.ts\u0000 M apps/web/e2e/fixtures/base.ts\u0000 M bun.lock\u0000 M packages/email/package.json\u0000 M packages/email/src/V2Announcement.test.ts\u0000 M packages/email/src/V2Announcement.tsx\u0000 M packages/email/src/components/Highlight.test.ts\u0000 M packages/email/src/components/Highlight.tsx\u0000 M packages/email/src/constants.ts\u0000 M packages/email/tsconfig.json\u0000?? .dashboard/cloudinary-cost-and-pro/data.js\u0000?? .dashboard/cloudinary-cost-and-pro/docs/GO-LIVE.html\u0000?? .dashboard/cloudinary-cost-and-pro/docs/PLAN.html\u0000?? .dashboard/cloudinary-cost-and-pro/docs/SPEC.html\u0000?? .dashboard/cloudinary-cost-and-pro/docs/TASKS.html\u0000?? .dashboard/cloudinary-cost-and-pro/events.jsonl\u0000?? .dashboard/cloudinary-cost-and-pro/index.html\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.2-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.2-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-3.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-4.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-5.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-6.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-7.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-8.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/3/T3.4-9.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/4/T4.3-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/4/T4.3-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/4/T4.3-3.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/4/T4.3-4.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/4/T4.3-5.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/4/T4.3-6.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/5/T5.5-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/5/T5.5-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/5/T5.5-3.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/6/T6.6-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/6/T6.6-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/6/T6.6-3.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/7/T7.10-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/7/T7.10-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/7/T7.10-3.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/7/T7.10-4.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/7/T7.10-5.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/7/T7.3-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/7/T7.3-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.2-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.3-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.3-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-1.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-10.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-11.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-2.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-3.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-4.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-5.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-6.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-7.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-8.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/9/T9.7-9.png\u0000?? .dashboard/cloudinary-cost-and-pro/shots/manifest.json\u0000?? .dashboard/pricing-pro-polish/data.js\u0000?? .dashboard/pricing-pro-polish/docs/INTERVIEW.html\u0000?? .dashboard/pricing-pro-polish/docs/PLAN.html\u0000?? .dashboard/pricing-pro-polish/docs/SPEC.html\u0000?? .dashboard/pricing-pro-polish/docs/TASKS.html\u0000?? .dashboard/pricing-pro-polish/events.jsonl\u0000?? .dashboard/pricing-pro-polish/index.html\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.10-1.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.10-2.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.10-3.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.10-4.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.5-1.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.5-2.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.5-3.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.5-4.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.6-1.png\u0000?? .dashboard/pricing-pro-polish/shots/1/T1.6-2.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.2-1.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-1.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-10.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-11.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-2.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-3.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-4.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-5.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-6.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-7.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-8.png\u0000?? .dashboard/pricing-pro-polish/shots/2/T2.5-9.png\u0000?? .dashboard/pricing-pro-polish/shots/3/T3.6-1.png\u0000?? .dashboard/pricing-pro-polish/shots/3/T3.6-2.png\u0000?? .dashboard/pricing-pro-polish/shots/3/T3.6-3.png\u0000?? .dashboard/pricing-pro-polish/shots/4/T4.5-1.png\u0000?? .dashboard/pricing-pro-polish/shots/4/T4.5-2.png\u0000?? .dashboard/pricing-pro-polish/shots/4/T4.5-3.png\u0000?? .dashboard/pricing-pro-polish/shots/4/T4.5-4.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.1-1.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.1-2.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.1-3.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.1-4.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.1-5.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.2-1.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.2-2.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.2-3.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.2-4.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.2-5.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.2-6.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-1.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-10.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-11.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-12.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-2.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-3.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-4.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-5.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-6.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-7.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-8.png\u0000?? .dashboard/pricing-pro-polish/shots/5/T5.4-9.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.1-1.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.1-2.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.1-3.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.2-1.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.4-1.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.4-2.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.4-3.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.7-1.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.7-2.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.7-3.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.7-4.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.7-5.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.7-6.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.7-7.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.7-8.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.8-1.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.8-2.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.8-3.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.8-4.png\u0000?? .dashboard/pricing-pro-polish/shots/6/T6.8-5.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.1-1.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.2-1.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.2-2.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.3-1.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.4-1.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.4-2.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.4-3.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.7-1.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.7-2.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.7-3.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.7-4.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.7-5.png\u0000?? .dashboard/pricing-pro-polish/shots/7/T7.7-6.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.1-1.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.2-1.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.4-1.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.4-2.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.4-3.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.4-4.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.4-5.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.5-1.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.5-2.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.5-3.png\u0000?? .dashboard/pricing-pro-polish/shots/8/T8.5-4.png\u0000?? .dashboard/pricing-pro-polish/shots/manifest.json\u0000"
   }
  },
  {
   "at": "2026-11-09T13:51:27.232Z",
   "type": "commit",
   "tasks": [
    "T8.1",
    "T8.2",
    "T8.3",
    "T8.4",
    "T8.5"
   ],
   "attempt": "4",
   "text": "feat(pricing-pro-polish): phase 8 history-full notices",
   "sha": "c0917038b5c4be7cd15f5c28e9e19abc934e39e0",
   "branch": "feature-enhancement",
   "pushed": "yes",
   "evidence": "e2e 15/15 prod x2, unit coverage 100%"
  },
  {
   "at": "2026-11-09T13:51:09.251Z",
   "type": "deliverable",
   "tasks": [
    "T8.1",
    "T8.2",
    "T8.3",
    "T8.4",
    "T8.5"
   ],
   "text": "History-full notices: unsaved notice rework, HistoryFullNote, saved-count store, unit + e2e",
   "files": [
    "apps/web/src/components/Dashboard/Canvas/HistoryFullNote.vue",
    "apps/web/src/stores/history.ts"
   ]
  },
  {
   "at": "2026-11-09T13:51:05.984Z",
   "tasks": [
    "T8.3"
   ],
   "attempt": "4",
   "type": "verify_passed",
   "evidence": "3 files 25/25 pass; coverage with three repeated --coverage.include flags 100% stmts 36/36, branches 15/15, funcs 11/11, lines 32/32; history.test.ts:44 formatting fixed; no skip/only/fails markers",
   "fingerprint": "934a1627d354084fbf0bd424cc7517010eaf01058184d0d55a69c7dba0224b9c"
  },
  {
   "at": "2026-11-09T13:51:05.983Z",
   "tasks": [
    "T8.1"
   ],
   "attempt": "4",
   "type": "verify_passed",
   "evidence": "`bun run check` (apps/web) exit 0, \"Found 0 errors and 5 warnings in 535 files\", none in phase-8 files (evidence/phase-8/a4-bun-run-check.log); UnsavedResultNotice.test.ts 10/10 pass; a3 formatting blocker fixed (Array.from args wrapped, test file mtime 19:19); component unchanged since a3 (19:13, font-awesome download/xmark verified there); shot T8.1-1 registered",
   "fingerprint": "a45744bfc4627bb92d77aaefd4e3158b7e7c1a20faa3be32f1d34fc06914e77a"
  },
  {
   "at": "2026-11-09T13:49:48.943Z",
   "type": "verify_started",
   "tasks": [
    "T8.1",
    "T8.3"
   ],
   "attempt": "4"
  },
  {
   "at": "2026-11-09T13:49:44.561Z",
   "type": "task_built",
   "tasks": [
    "T8.1",
    "T8.3"
   ],
   "attempt": "4",
   "text": "vp fmt; check exit 0",
   "files": [
    "apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.test.ts",
    "apps/web/src/stores/history.test.ts"
   ]
  },
  {
   "at": "2026-11-09T13:49:23.710Z",
   "type": "task_started",
   "tasks": [
    "T8.1",
    "T8.3"
   ],
   "attempt": "4"
  },
  {
   "at": "2026-11-09T13:49:23.578Z",
   "type": "build_started",
   "tasks": [
    "T8.1",
    "T8.3"
   ],
   "attempt": "4"
  },
  {
   "at": "2026-11-09T13:49:21.014Z",
   "tasks": [
    "T8.4"
   ],
   "attempt": "3",
   "type": "verify_passed",
   "evidence": "E2E_SERVER=prod history-full.spec.ts --repeat-each=3 -> 22/22 pass (setup + 7 scenarios x3, 34.1s); Download image / Dismiss now assert a visible svg (spec:142-145); generation and delete stubbed",
   "fingerprint": "a3ec70533c3e787725922181882b12c0727e654a827902ca2bebbfe8ab8e25ee"
  },
  {
   "at": "2026-11-09T13:49:21.014Z",
   "tasks": [
    "T8.2"
   ],
   "attempt": "3",
   "type": "verify_passed",
   "evidence": "vitest Canvas + history.test.ts 9 files 65/65 pass; history.ts:19 savedCount filters on `_id` and drives historyFullLevel and both notices (a2 count-drift fixed); circle-info icon renders (faInfoCircle alias registered; shot T8.2-1 / evidence/phase-8/a3-free-full-note.png); e2e \"unsaved result does not push 89 into near-full\" passes; T8.2 files clean in bun run check",
   "fingerprint": "f8509a05f5aa2cd60ab5ea69bdd99afabe52639c9d58d4881a70ed1216020684"
  },
  {
   "at": "2026-11-09T13:49:21.014Z",
   "tasks": [
    "T8.3"
   ],
   "attempt": "3",
   "type": "verify_failed",
   "category": "type-lint",
   "text": "[type-lint] · apps/web/src/stores/history.test.ts:44 · `bun run check` flags formatting: the one-line `useUserStore().history = Array.from({ length: count }, ...)` exceeds print width (preflight a3 missed it). Tests otherwise good: 3 files 25/25 pass, coverage with repeated --coverage.include 100% stmts 36/36, branches 15/15, funcs 11/11, lines 32/32 · run `vp fmt` on history.test.ts (and UnsavedR",
   "files": [
    "apps/web/src/stores/history.test.ts"
   ],
   "sigs": [
    "T8.3|type-lint|apps/web/src/stores/history.test.ts"
   ]
  },
  {
   "at": "2026-11-09T13:49:21.013Z",
   "tasks": [
    "T8.1"
   ],
   "attempt": "3",
   "type": "verify_failed",
   "category": "type-lint",
   "text": "[type-lint] · apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.test.ts:28,46 · T8.1 Verify `bun run check` exits 1 (\"Formatting issues found\", reproduced twice; evidence/phase-8/a3-bun-run-check.log): the one-line `user.history = Array.from({ length: HISTORY_CAP[...] }, (_, i) => ({ _id: String(i) }) as IImageObject);` exceeds print width; formatter wraps the Array.from args over 3 lin",
   "files": [
    "apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.test.ts"
   ],
   "sigs": [
    "T8.1|type-lint|apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.test.ts"
   ]
  },
  {
   "at": "2026-11-09T13:48:57.803Z",
   "type": "advisory",
   "tasks": [
    "T8.2"
   ],
   "text": "PromptBar composer blur/click-miss on notice Dismiss (known, out of scope); spec uses dispatchEvent"
  },
  {
   "at": "2026-11-09T13:48:57.678Z",
   "type": "advisory",
   "tasks": [
    "T8.4"
   ],
   "text": "shots/8/T8.4-4.png is a stale pre-fix shot (19:02) showing a blank Download square and no X; superseded by T8.4-5, should be removed or retaken"
  },
  {
   "at": "2026-11-09T13:48:57.519Z",
   "type": "advisory",
   "tasks": [
    "T8.4"
   ],
   "text": "shots/8/T8.4-1..5, T8.1-1, T8.2-1: proof shots have no annotation boxes"
  },
  {
   "at": "2026-11-09T13:45:44.238Z",
   "type": "verify_started",
   "tasks": [
    "T8.1",
    "T8.2",
    "T8.3",
    "T8.4"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-09T13:45:40.810Z",
   "type": "task_built",
   "tasks": [
    "T8.4"
   ],
   "attempt": "3",
   "text": "svg assertions + unsaved-count scenario; 22/22 x3 prod",
   "files": [
    "apps/web/e2e/qa/history-full.spec.ts"
   ]
  },
  {
   "at": "2026-11-09T13:44:43.281Z",
   "type": "task_started",
   "tasks": [
    "T8.4"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-09T13:44:30.666Z",
   "type": "task_built",
   "tasks": [
    "T8.2"
   ],
   "text": "savedCount computed (entries with _id) drives level, message, notice",
   "files": [
    "apps/web/src/stores/history.ts",
    "apps/web/src/components/Dashboard/Canvas/HistoryFullNote.vue"
   ]
  },
  {
   "at": "2026-11-09T13:44:30.494Z",
   "type": "task_built",
   "tasks": [
    "T8.1"
   ],
   "text": "font-awesome-icon for download/xmark; unit 65 pass, 100% cov",
   "files": [
    "apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.vue"
   ]
  },
  {
   "at": "2026-11-09T13:43:19.389Z",
   "type": "task_started",
   "tasks": [
    "T8.1",
    "T8.2"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-09T13:43:19.261Z",
   "type": "build_started",
   "tasks": [
    "T8.1",
    "T8.2",
    "T8.4"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-09T13:43:16.512Z",
   "tasks": [
    "T8.5"
   ],
   "attempt": "2",
   "type": "verify_passed",
   "evidence": "E2E_SERVER=prod history-full.spec --repeat-each=2 13/13 pass; bun run test exit 0 (298 files, 2705 tests); bun run check exit 0 (0 errors, 8 pre-existing warnings, none in phase-8 files)",
   "fingerprint": "de5a675c4d8237cee83bdae6f0703a9a18cd9b492901c20a92c164e3a6d00bf5"
  },
  {
   "at": "2026-11-09T13:43:16.512Z",
   "tasks": [
    "T8.3"
   ],
   "attempt": "2",
   "type": "verify_passed",
   "evidence": "vitest 3 files 22/22 pass; coverage (repeated --coverage.include flags) 100% stmts 34/34, branches 21/21, funcs 10/10, lines 31/31 across UnsavedResultNotice.vue, HistoryFullNote.vue, history.ts",
   "fingerprint": "4121713014e3af837322ddd9770d901db6f71628c601006cd64a17e2c305a97e"
  },
  {
   "at": "2026-11-09T13:43:16.512Z",
   "tasks": [
    "T8.4"
   ],
   "attempt": "2",
   "type": "verify_failed",
   "category": "test-quality",
   "text": "[test-quality] · e2e/qa/history-full.spec.ts:141-142 · scenario \"icon Download and X Dismiss\" only asserts toBeVisible on the buttons, which passes on padded empty buttons, so the blank-icon bug shipped green (19/19 x3 prod) · assert a visible `svg` inside each of the Download image and Dismiss buttons",
   "files": [
    "e2e/qa/history-full.spec.ts"
   ],
   "sigs": [
    "T8.4|test-quality|e2e/qa/history-full.spec.ts"
   ]
  },
  {
   "at": "2026-11-09T13:43:16.512Z",
   "tasks": [
    "T8.2"
   ],
   "attempt": "2",
   "type": "verify_failed",
   "category": "code-bug",
   "text": "[code-bug] · stores/history.ts:20, HistoryFullNote.vue:16 · count is `userStore.history.length`, but stores/app.ts:115/135 push unsaved (no `_id`) results into that array (shot T8.5-4 shows \"Your creations 101\" at cap 100); after Free at 100 makes an unsaved result and deletes one image the server has 99 but the note still says \"History full - new creations won't be saved\", and near-full numbers a",
   "files": [
    "stores/history.ts"
   ],
   "sigs": [
    "T8.2|code-bug|stores/history.ts"
   ]
  },
  {
   "at": "2026-11-09T13:43:16.511Z",
   "tasks": [
    "T8.1"
   ],
   "attempt": "2",
   "type": "verify_failed",
   "category": "code-bug",
   "text": "[code-bug] · UnsavedResultNotice.vue:65,74 (Download/Dismiss icon buttons) · icons use `<i class=\"fa-solid fa-download|fa-xmark\">` but the app only loads SVG-core vue-fontawesome (no webfont CSS); in the prod build Download renders as a blank orange square and Dismiss has no visible content (evidence/phase-8/unsaved-notice-buttons-crop.png, shots/8/T8.5-4.png) · use `<font-awesome-icon icon=\"fa-so",
   "files": [
    "UnsavedResultNotice.vue"
   ],
   "sigs": [
    "T8.1|code-bug|UnsavedResultNotice.vue"
   ]
  },
  {
   "at": "2026-11-09T13:42:24.959Z",
   "type": "advisory",
   "tasks": [
    "T8.4"
   ],
   "text": "Registered shots T8.4-1..4 have no annotations and generic captions; T8.4-4/T8.5-4 caption claims icon buttons that render blank"
  },
  {
   "at": "2026-11-09T13:42:24.835Z",
   "type": "advisory",
   "tasks": [
    "T8.3"
   ],
   "text": "Verify line comma-separated --coverage.include yields 0/0 report; repeated --coverage.include flags give 100% (34/34 stmts, 21/21 br); store delete test uses splice instead of the real deleteImage path"
  },
  {
   "at": "2026-11-09T13:42:24.703Z",
   "type": "advisory",
   "tasks": [
    "T8.2"
   ],
   "text": "Gate-reported (not re-verified): mousedown on controls under composer blurs textarea 72px->36px, shifting layout 80px so real clicks on notice Dismiss miss; spec uses dispatchEvent"
  },
  {
   "at": "2026-11-09T13:42:24.578Z",
   "type": "advisory",
   "tasks": [
    "T8.2"
   ],
   "text": "UI task (.vue Files, no Design field) has no registered proof shot; HistoryFullNote fa-circle-info <i> renders nothing (webfont not loaded, faCircleInfo not registered)"
  },
  {
   "at": "2026-11-09T13:42:24.401Z",
   "type": "advisory",
   "tasks": [
    "T8.1"
   ],
   "text": "UI task (.vue Files, no Design field) has no registered proof shot; states covered only by T8.4/T8.5 shots"
  },
  {
   "at": "2026-11-09T13:37:16.945Z",
   "type": "verify_started",
   "tasks": [
    "T8.1",
    "T8.2",
    "T8.3",
    "T8.4",
    "T8.5"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-11-09T13:37:13.341Z",
   "type": "task_built",
   "tasks": [
    "T8.1",
    "T8.2",
    "T8.3",
    "T8.4",
    "T8.5"
   ],
   "attempt": "2",
   "text": "stray helper moved into proPerksSeed.ts; specs green",
   "files": [
    "apps/web/e2e/support/proPerksSeed.ts",
    "apps/web/e2e/qa/history-full.spec.ts",
    "apps/web/e2e/qa/pro-tier.spec.ts"
   ]
  },
  {
   "at": "2026-11-09T13:36:12.172Z",
   "type": "task_failed",
   "tasks": [
    "T8.5"
   ],
   "attempt": "1",
   "text": "stray untracked file outside scope files: apps/web/e2e/support/unsavedGeneration.ts",
   "sigs": [
    "T8.5|preflight|stray"
   ]
  },
  {
   "at": "2026-11-09T13:36:12.037Z",
   "type": "task_failed",
   "tasks": [
    "T8.4"
   ],
   "attempt": "1",
   "text": "stray untracked file outside scope files: apps/web/e2e/support/unsavedGeneration.ts",
   "sigs": [
    "T8.4|preflight|stray"
   ]
  },
  {
   "at": "2026-11-09T13:36:11.894Z",
   "type": "task_failed",
   "tasks": [
    "T8.3"
   ],
   "attempt": "1",
   "text": "stray untracked file outside scope files: apps/web/e2e/support/unsavedGeneration.ts",
   "sigs": [
    "T8.3|preflight|stray"
   ]
  },
  {
   "at": "2026-11-09T13:36:11.750Z",
   "type": "task_failed",
   "tasks": [
    "T8.2"
   ],
   "attempt": "1",
   "text": "stray untracked file outside scope files: apps/web/e2e/support/unsavedGeneration.ts",
   "sigs": [
    "T8.2|preflight|stray"
   ]
  },
  {
   "at": "2026-11-09T13:36:11.593Z",
   "type": "task_failed",
   "tasks": [
    "T8.1"
   ],
   "attempt": "1",
   "text": "stray untracked file outside scope files: apps/web/e2e/support/unsavedGeneration.ts",
   "sigs": [
    "T8.1|preflight|stray"
   ]
  },
  {
   "at": "2026-11-09T13:36:06.374Z",
   "type": "task_built",
   "tasks": [
    "T8.5"
   ],
   "text": "e2e 13 pass, vitest 2705 pass, check 0 errors",
   "files": [
    "apps/web/e2e/support/proPerksSeed.ts"
   ]
  }
 ]
};
