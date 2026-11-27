# Build prompt: landing fixes + credit economics

Paste everything below this line to start the build.

---

Build the following, confirmed via interview on 2026-11-20. Act as the **main orchestrator**: delegate building to Sonnet/Opus subagents (one focused task each), verify every task with an independent verifier subagent, and verify UI in the browser with the `agent-browser` skill (repo-unique session). Use `impeccable` + `layout` skills for all UI work (never `frontend-design`). Do not degrade existing output; nothing may break. Mock only: no real Replicate calls, Dodo **test mode** only, no emails. Ask before creating any Dodo products.

## Part A — Landing page

1. **Showcase modal fixed size** (`apps/web/src/components/LandingV2/ShowcaseDialog.vue`, used by v3). The dialog must be one fixed size regardless of image dimensions (portrait, landscape, square). The image letterboxes (`object-fit: contain`) inside a fixed media frame; the text column never shifts. Must stay responsive (sensible fixed size per breakpoint, mobile included).
2. **Remove the "Arrow keys also work" hint** (line ~131). Keep arrow-key navigation working.
3. **CTA "Start free" moves on hover** — find the root cause (likely transform/translate, border/padding change, or magnetic-pointer effect in the final CTA scene) and fix it so the button stays put; keep a non-moving hover state (glow/colour).
4. **Make v3 the homepage**: `/` renders the current v3 landing. Delete `/v2` and `/v3` routes, `pages/Landing.vue`, `pages/LandingV2.vue`, the old `components/Landing` code **only where unused** (FeatureLanding pages `/text-to-image`, `/image-upscaler`, etc. must keep working), and all of LandingV2 that v3 doesn't use. Components v3 still uses from `LandingV2/` (e.g. ShowcaseDialog, scenes, scss) move into a neutral folder with neutral names. Final state: `grep -riE "v2|v3"` over `apps/web/src` file names, identifiers, routes, CSS classes, tests and e2e specs returns no landing-version references (unrelated tokens like `flux-2`, intro version constants are fine — judge each hit). Update/rename/remove affected unit and e2e tests; keep SEO meta, prerender script and analytics working for `/`.

## Part B — Credit economics

Current problem: credits sell for ~$0.0074 each while some models cost up to $0.067 per credit (Nano Banana 2 = 1 credit at $0.067).

1. **Credit unit**: 1 credit ≈ $0.005 of Replicate cost. Every model's credit cost = `ceil(pricePerImage / 0.005)` (min 1), derived from `pricePerImage` in `packages/shared/src/models/registry.ts` — not a hand-kept table. Add `pricePerImage` for any utility/upscaler model missing it (look up real Replicate pricing; flag uncertain ones). Expected: Schnell/Fast/P-Image 1, Flux Dev 3, Flux 2 Pro 3, Z-Image/Grok 4, Seedream 6, Flux Pro/1.1/Kontext Pro 8, Imagen Ultra 12, Nano Banana 2 14, Grok Quality 14, Kontext Max 16, Flux 2 Max 24, GPT Image 2 26, Nano Banana Pro 30. Update every place that shows/assumes costs (studio cost labels, pricing page "1–5" economy copy, studio rates table, FAQ JSON, transform cost constants, email copy) — single source of truth.
2. **Pro gate**: premium-tier models require an active Pro subscription. Enforce on the API (reject with a typed error) and in the UI (locked state in model picker + "Upgrade to Pro" prompt; Pro users unaffected). Pack credits do not unlock premium models.
3. **Packs** (4, third marked **Most popular**, visually emphasised on pricing page and wherever packs are listed):

   | Credits              | USD | INR    |
   | -------------------- | --- | ------ |
   | 300                  | $5  | ₹249   |
   | 700                  | $10 | ₹549   |
   | 1,600 ★ Most popular | $20 | ₹1,149 |
   | 4,500                | $50 | ₹2,999 |

   Savings badges computed from per-100 price vs the smallest pack. Rename pack IDs to match credit sizes.

4. **Currency**: India (country `IN`) sees and pays INR; everyone else sees and pays plain USD. Remove the INR→local-currency conversion for packs. Pack model holds separate per-currency prices (not converted). Check Dodo docs (`dodopayments` skills / docs MCP) for the right way to charge different INR/USD amounts (separate products per currency vs. per-currency pricing); map products via env (`productMap.ts`, `env.ts`) and update `.env.example`. **Ask me before creating test-mode products**, or give me the exact list to create.
5. **Existing balances**: unchanged. Add one FAQ line explaining model credit costs changed.
6. **Unchanged**: Pro $5/mo, daily credits (Free 30, Pro 50), signup 30, referral 30.

## Verification (must pass before done)

- Unit tests + typecheck + lint green for web, api, shared; e2e green with all paid endpoints mocked.
- Browser (agent-browser), desktop + mobile: modal stays identical size across ≥3 images of different aspect ratios; no hint text; Start free doesn't move on hover (compare bounding box before/after hover); `/` shows the new landing, `/v2` `/v3` 404/redirect; FeatureLanding pages render; pricing page shows 4 packs with Most popular third, INR when country=IN and USD otherwise; premium model locked for a free user and usable for Pro; studio shows new credit costs.
- Dodo test-mode checkout for one pack in each currency via webhook stub credits the right amount.
- End with the Feature Implementation Summary format from CLAUDE.md.
