# Build prompt: cinematic landing candidates `/v2` and `/v3`

Paste everything below this line into a fresh session in the `visual-ai` repo.

---

Build two new dark-only landing page candidates for Visual AI in `apps/web`: `/v2` and `/v3`. I will compare them in the browser and later pick one to replace `/`. You are the orchestrator: you plan, delegate building and verifying to subagents, and judge the result yourself. The intent below was settled in an interview, so do not re-ask it.

## Why this exists

The current landing (`apps/web/src/pages/Landing.vue`) is accurate and tidy but calm. Every section enters with the same 32px fade-up, so nothing surprises a visitor. I want a first-time visitor to feel "wow" in the first three seconds and again at each scene as they scroll, while the page stays honest: it only shows what the product really does and what creators really made.

Visual AI is an image studio: generate from a prompt with models from several labs, then upscale, colorize, restore old photos and remove backgrounds, on a free-plus-credits model. Read the current landing and `apps/web/src/utils/landing.ts` first so you understand the product before designing.

## The two pages

- **`/v2` (cinematic):** a scroll-driven rebuild using GSAP ScrollTrigger and Lenis, both already installed. Three or four pinned, scrubbed set-pieces carry the wow; the rest is confident editorial layout.
- **`/v3` (immersive):** the same layout, sections and copy as `/v2`, with a WebGL layer swapped in for the hero, the gallery and transitions (shader image distortion, depth, cursor-reactive light). It must reuse `/v2`'s section components rather than fork them. Add one WebGL library (prefer `ogl` for size; `three` if you need it) and lazy-load it so it ships only in the `/v3` chunk. If WebGL is unavailable, `/v3` falls back to the `/v2` versions.

Finish and verify `/v2` completely before starting `/v3`.

## Hero (decided)

A real prompt from `gallery.json` types itself out, then real gallery images bloom into a large, depth-layered, slowly drifting wall around the headline. On scroll the wall parts and flies past the camera into the next section. Use only real images with their real prompts. The headline, sub-copy and CTAs must be readable the moment the page paints, before any animation finishes. The primary CTA keeps today's logic: signed-in users get "Open studio" to `/create`, everyone else "Start free" to `/signin`.

## The rest of the page (your call)

Today's sections are: hero, gallery strip, five tool chapters, showcase, models, pricing teaser, FAQ, final CTA, footer. You may merge, reorder, redesign or drop sections and rewrite headlines and sub-copy. Think about what each section is for before keeping it. Ideas worth considering, not requirements:

- The five tools as one pinned sequence where a real photo is visibly transformed as you scroll, using the real before/after pairs in `public/landing` (upscale, colorize, restore, background removal).
- The showcase as a horizontal or depth-parallax gallery where prompts surface on hover or focus.
- Model roster and credit numbers that count or assemble in rather than fade.
- Magnetic CTAs, cursor-aware light on cards, section transitions that hand one scene to the next.

Vary the motion. If every scene is pinned and scrubbed, the page feels as monotonous as the fade-ups do now.

## Design language

Follow `apps/web/DESIGN.md` for colour, typography (Young Serif display, Source Sans 3 body), radius, shadow, the amber and gold accent budget, focus rings, touch targets and contrast. Use the existing CSS tokens (`--tw-canvas`, `--tw-ink-primary` and friends in `apps/web/src/style.scss`); where the doc and the tokens disagree, the tokens in code win. The one section you are released from is section 7's "motion never entertains" and "32px fade-up, trigger once" rule. Its reduced-motion stance still applies in full.

Both pages are dark regardless of the user's theme setting, scoped to these pages so the rest of the app's theme is unaffected. Load the `frontend-design`, `gsap-core` and `vue-best-practices` skills, and follow my global code-style and TypeScript rules.

## Honesty rules

Facts are frozen. Every number, price, credit amount, model or lab name, FAQ, link and image must come from an existing source: `utils/landing.ts`, `utils/gallery.json`, `utils/models.ts`, `utils/generationCredits.ts`, `@visual-ai/shared` and `public/landing`. Import these values; do not retype them. Do not add testimonials, customer logos, press mentions, ratings, new statistics, capabilities the app lacks, or product UI mockups. Every link must resolve to a real route or anchor. Rewritten copy may rephrase what is already claimed and may not claim anything new.

## Constraints

- Do not modify `/`, `Landing.vue`, the feature landing pages, or the existing `components/Landing/*` components and their tests. Reuse them by import where they fit (for example `LandingButton`, `LandingNav`, `LandingFooter`, `BeforeAfter`); put new work in `components/LandingV2/` and `components/LandingV3/`, with pages `LandingV2.vue` and `LandingV3.vue` lazy-loaded in `router/index.ts`.
- Set `robots: 'noindex,nofollow'` via `usePageSeo` on both pages and keep them out of `sitemap.xml`.
- Reduced motion: no pinning, scrubbing, WebGL animation or Lenis; all content is still present and readable in a static layout.
- Mobile is a first-class target. Simplify or replace heavy scenes on small screens rather than shrinking the desktop version. No horizontal page scroll, no layout shift from late-loading images.
- Animate transform and opacity only, lazy-load offscreen images, pause canvases and loops when offscreen, and clean up every GSAP context, ScrollTrigger and WebGL context on unmount.
- The dev server is always running; never start it. Never commit. Make no real Replicate, Dodo or email calls; a landing page needs none.
- No new unit or e2e tests for these candidates. The existing suite must stay green.

## How to run the build

1. Explore, then write a short scene-by-scene plan for `/v2` (the purpose of each scene, its motion, its data source, its mobile and reduced-motion behaviour) and check it with the advisor before building.
2. Delegate building to Opus subagents for the hero and set-pieces and Sonnet subagents for simpler sections, at most one scene or a small group of related sections per subagent. Give each the full context it needs: purpose, the honesty rules, the files to read, and what done looks like.
3. After each scene, have a separate subagent that did not build it verify it in the browser with the `agent-browser` skill, using a repo-unique session. It captures screenshots at 1440px and 390px at the start, middle and end of each scene, checks the console for errors, and checks the reduced-motion version. Look at the screenshots yourself; do not accept a pass on a report alone.
4. Judge the work against one question: would a visitor stop and say wow, and is everything they see true? Send weak scenes back with specific direction. Do not let quality slide to get to the end.
5. Repeat for `/v3`, then run `bun run verify` and `bun run test` from the repo root.

## Done means

- `/v2` and `/v3` render with no console errors at 1440px and 390px, with every scene verified by screenshot.
- The reduced-motion versions of both show all content.
- `/v3` loads no WebGL code on `/v2` or `/`, and falls back cleanly without WebGL.
- Lint, typecheck and the existing test suite pass; `/` is unchanged.
- You finish with my standard implementation summary and browser verification steps, plus a short note on what differs between `/v2` and `/v3` and which you would ship.
