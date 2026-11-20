# /v3 plan: immersive WebGL variant of /v2

Source brief: `BUILD_PROMPT.md` (the `/v3` bullet and the constraints). Binding rules: `PLAN.md` "Advisor changes". This plan was reviewed with the advisor on 2026-11-15.

## Ground truth (already in place, do not rebuild)

- `LandingV2Page.vue` already takes `heroWall`, `showcaseMedia` and `transition` props. The hero passes `{ tiles, getProgress }` to its wall; the showcase passes `{ items, getProgress }` to its media.
- `App.vue` `CANDIDATE_LANDING_PATHS` already includes `/v3`. No shell change.
- The sitemap is static `public/sitemap.xml`, and `scripts/prerender.mjs` has its own list. Neither lists `/v2`, so nothing is added for `/v3`.
- Gallery images are same-origin (`/landing/*.webp`), so textures have no CORS problem.
- `ogl` is not installed yet.

## Hard rules

- No edits to `/`, `Landing.vue`, `components/Landing/*`, or any `components/LandingV2/*` file, unless a task names the file and explains why.
- **No new unit or e2e tests** (BUILD_PROMPT). The existing suite must stay green.
- Reduced motion: no WebGL animation, no pin or scrub, no Lenis. Below 900px, or when the WebGL check fails, `ogl` is never fetched and the /v2 DOM media stays.
- DOM animation uses transform and opacity only. GSAP comes only through `useSceneMotion`: get gating, lifecycle and the ticker from the composable, or use plain `requestAnimationFrame` inside its lifecycle. Do not import `gsap` directly in Gl components.
- At most 3 WebGL contexts per page: hero, showcase and transition. Each pauses its loop when offscreen (IntersectionObserver) and is destroyed on unmount.
- No real paid API calls. Never start the server (dev runs at https://visual-ai.localhost). Never commit.
- Load the skills impeccable, gsap-core and vue-best-practices. Never use frontend-design.

## Effects (one idea each)

- **Hero (`GlHeroWall.vue`):** one textured quad per tile, positioned with the existing pure `tileFrame()` from `heroWallLayout.ts`. A soft light follows the cursor, and there is a slight lens bulge. On exit, each tile bends a little and fans its colour channels apart in proportion to exit progress. **The canvas must sit inside HeroWall's clip and feather container** (the 9rem bottom and 6rem side feather), so the hard clip line and the tile bleed fixed on /v2 cannot come back.
- **Showcase (`GlShowcaseMedia.vue`, desktop only):** a gentle ripple plus colour separation that grows with scroll velocity and settles flat when scrolling stops. The DOM rows stay for layout, focus and labels; only their `<img>` elements are hidden. Quad positions come from each row's transform; sizes are measured on refresh, not every frame. Mobile keeps the DOM swipe rail.
- **Transition (`GlTransition.vue`):** a fixed, full-screen film-grain veil with `pointer-events: none`. It fades in during scene handovers. Render only while a handover is in progress; otherwise its loop is idle.

## Files (`apps/web/src/components/LandingV3/`)

- `useWebglSupport.ts`: checks once whether a context can be created, with `failIfMajorPerformanceCaveat`.
- `glStage.ts`: the only module that does `await import('ogl')`. Caps DPR at 2, resizes through a ResizeObserver, handles `webglcontextlost` (prevent default, dispose, show the DOM again, no restore), and exposes `dispose()`.
- `GlHeroWall.vue`, `GlShowcaseMedia.vue`, `GlTransition.vue`.
- `apps/web/src/pages/LandingV3.vue`: `<LandingV2Page :hero-wall :showcase-media :transition>`, plus `usePageSeo` with `robots: 'noindex,nofollow'` and `path: '/v3'`.
- Shared edits: a lazy `/v3` route in `router/index.ts`, and `ogl` in `apps/web/package.json`. **No `manualChunks` rule.** The dynamic import splits the chunk on its own. Add a rule only if the build output shows `ogl` landing in a shared chunk.

Async safety: every GL setup runs inside the `useSceneMotion` condition (`isDesktop && motionOk`). A `cancelled` flag stops work that resolves after an `await` once the condition has reverted. Meshes rebuild when `tiles` changes.

LCP: the DOM `HeroWall` renders first. The GL canvas fades in and the DOM wall fades out (opacity) only after the canvas and all textures are ready.

## Verification rules (apply to every GL task)

1. **Positive GL evidence, headed, on the real GPU:** run `agent-browser --headed` with its own `AGENT_BROWSER_SESSION`. Required evidence:
   - a `<canvas>` exists and `getContext` returns a live WebGL context;
   - the `ogl` module was requested;
   - the DOM wall or images have computed opacity 0 after textures load;
   - a screenshot shows the shader effect.

   "Looks like /v2 with no errors" is **not** a pass. It may mean the fallback ran.

2. **Fallback evidence:** with reduced motion emulated, and with `HTMLCanvasElement.prototype.getContext` stubbed to return null via an init script, the DOM version shows, `ogl` is not requested, and there are no console errors.
3. **Isolation against a production build:** run `vite build` from `apps/web`. This only builds; it does not serve. Show from the manifest or chunk graph that `ogl` is reachable only through LandingV3's dynamic import, and that no chunk loaded by `/` or `/v2` contains `getContext("webgl` or `webglcontextlost`. The dev server is not valid evidence, because it pre-bundles dependencies.
4. **Hero handover on /v3** at 1440x900, 1920x1080 and 1024x768, in 50px steps: no visible tile over the Tools label, no blank step, no hard clip edge.

## Tasks (in this order; hero is confirmed before the showcase starts)

1. **Route and scaffold.** Add `ogl`, the lazy `/v3` route, and `LandingV3.vue` with noindex and no overrides. _Verify:_ `/v3` matches `/v2` visually; `vue-tsc` shows no LandingV3 lines; `vp check` passes; the head has noindex; the sitemap and prerender lists are unchanged.
2. **`useWebglSupport` and `glStage`.** _Verify:_ typecheck plus a production `vite build`, with the `ogl` chunk present and only dynamically imported.
3. **`GlHeroWall`**, wired into `LandingV3.vue`. _Verify:_ rules 1, 2 and 4. Headed screenshots at hero rest, mid-exit and handover, at 1440.
4. **`GlShowcaseMedia`.** _Verify:_ rules 1 and 2. Quads stay aligned with their rows while scrolling with Lenis, with a drift of 2px or less at 3 scroll positions. Keyboard focus and labels still work. At 390 the DOM rail is shown.
5. **`GlTransition`.** _Verify:_ rule 1. The veil never blocks clicks (`elementFromPoint` returns the content under it). ScrollTrigger start and end values on /v3 match /v2. No more than 3 contexts.
6. **Gate (independent verifier).** Rule 3 isolation. Full /v3 pass at 1440 and 390 with no console errors. Fallback check. `bun run verify` and `bun run test` from the repo root. `/` unchanged.

## Notes for the final summary

- Mobile, reduced-motion and no-WebGL visitors on /v3 get exactly /v2.
- At the user's request, the /v2 Tools to Showcase gap was left at 186px at 1440 (target 120–180).
