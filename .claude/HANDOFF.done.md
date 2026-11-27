# HANDOFF — Landing + credit economics (agent_docs/intent/landing-and-credit-economics.md)

Saved: 2026-11-26T20:25+05:30 · Repo: /Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai · Model: claude-opus-5-5 · Effort: medium
Mode: freeform · Branch: feat/landing-and-credit-economics

## Context discipline (mandatory for the resuming session)

Main session orchestrates only. Delegate exploration, implementation, review and
verification to subagents, one task per subagent. Keep raw output out of main context.

## Where we are

Implementing the intent doc above. All parts built (A1–A4 landing, B1 derived credit costs,
B2 Pro gate, B3/B4 USD/INR packs + FAQ). Independent verifier: all behaviour checks PASS;
run FAILED only on stale e2e tests + formatting + one security advisory. Fixing those now.

## Done this session

- A1–A3: fixed-size showcase dialog, arrow-key hint removed, "Start free" magnetic hover removed.
- A4: v3 landing is `/` (components/Home/, pages/Home.vue); v2/v3 + 30 unused files deleted; catch-all → `/`.
- B1: getCreditCost = ceil(price/0.005); 4 utility prices marked `// TODO verify price`.
- B2: requiresPro(key) in shared plans.ts; API 403 PREMIUM_MODEL_REQUIRES_PRO; picker locks; usePremiumModelFallback.
- B3/B4: packs 300/700/1600/4500 with USD+INR prices; server-side currency; webhook validates recorded currency; legacy pack ids resolvable. 8 Dodo TEST products created, ids in apps/api/.env.
- Post-verify fixes: geo.ts now trusts only `cf-ipcountry` (geo.test.ts updated); PricingCreditStory uses creditEconomyPhrase (fixes "is" grammar); PricingModelCosts row chips get aria-label "N credits"; pro-tier.spec.ts range-label assertion removed.

## Next step (exact)

1. `apps/web/e2e/qa/daily-credits-copy.spec.ts:71-73` still expects "Premium upscalers are 4 and premium generation is 5" — update to the new copy rendered by PricingCreditStory (creditEconomyPhrase, apps/web/src/utils/creditCopy.ts).
2. `bunx vp check --fix apps/web/e2e/qa/pro-tier.spec.ts apps/web/src/components/Pricing/*.vue`, then `bun run check`, `bun run lint`, `bunx vp test run` (rebuild shared dist first), api geo tests.
3. Re-run e2e: qa/pro-tier, qa/daily-credits-copy, qa/pricing-layout (paid endpoints stay mocked).
4. Delete/gitignore stray `*.tsbuildinfo` (apps/web, packages/shared). Then final summary to user (format in CLAUDE.md). Do NOT commit unless told.

## In flight when stopped

none

## Uncommitted changes

~207 entries in git status (all branch work, uncommitted by design).

## Open questions for the user

- Pro-gated set changed vs old list (now also FLUX_PRO, FLUX_1_1_PRO, FLUX_2_MAX; no longer KONTEXT_PRO, IMAGEN_4_ULTRA) — confirm or retier in registry.
- Catch-all redirect to `/` vs a real 404 page.
- User must add 8 live-mode DODO*PRODUCT_ID_PACK*{300,700,1600,4500}\_{USD,INR} to .env.production/.env.staging.
- Known unrelated failure: .dashboard/media-studio/.../speech-route.test.ts.
