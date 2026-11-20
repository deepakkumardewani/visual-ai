# `/v2` scene plan (cinematic landing candidate)

Brief: `agent_docs/landing-v2/BUILD_PROMPT.md`. Dev URL: `https://visual-ai.localhost/v2` (server is always running).

## Direction

A dark gallery at night: the canvas is near-black and warm, the images are the only colour, type is large Young Serif set editorially (left-aligned, asymmetric), copper for small labels, gold as a solid colour on at most one moment per viewport. No gradient text, no glass cards, no identical card grids, no side-stripe borders. Each scene uses a different kind of motion so the page never repeats itself.

| #   | Scene                         | Motion type                                  |
| --- | ----------------------------- | -------------------------------------------- |
| 1   | Hero: prompt to wall          | Load timeline, then pinned scrub exit        |
| 2   | Tools: five passes            | Pinned, scrubbed stage                       |
| 3   | Showcase: counter-moving rows | Unpinned scroll-linked drift + hover/focus   |
| 4   | Models: the roster            | One-shot typographic assemble + cursor light |
| 5   | Pricing: credits              | One-shot digit roll                          |
| 6   | FAQ                           | Quiet (existing component)                   |
| 7   | Final CTA                     | Unpinned converge + magnetic button          |

## Shell and shared pieces

- `pages/LandingV2.vue`: thin composition surface. Root `<div class="lv2 tw-dark">` so the dark tokens and Tailwind `dark:` variants apply to this subtree only; the app theme store is not touched. Calls `useLenis()` (already reduced-motion aware) and `usePageSeo({ robots: 'noindex,nofollow', path: '/v2' })`. Not added to `sitemap.xml` or `MARKETING_PRERENDER_ROUTES`.
- Reuses `LandingNav` (theme toggle hidden on this page with a scoped `:deep` rule, since the page is dark-only), `LandingFooter`, `LandingButton`, `BeforeAfter`, `FaqSection`.
- Section ids `#tools #showcase #models #pricing #faq` are kept so `NAV_LINKS` still resolve.
- `composables/useSceneMotion.ts`: one wrapper around `gsap.matchMedia()` scoped to a root ref, with named conditions `isDesktop: (min-width: 900px)` and `motionOk: (prefers-reduced-motion: no-preference)`; reverts on unmount. Every scene uses it, so pin/scrub exists only when `isDesktop && motionOk`.
- `composables/useMagnetic.ts`, `composables/usePointerLight.ts`: pointer-fine and motion-ok only, transform/opacity (light is a translated radial element, not an animated background).
- `/v3` seam: `HeroScene` and `ShowcaseScene` expose a named slot for their media layer (`#wall`, `#media`) and pass scroll progress and items as slot props. `/v2` uses the DOM default; `/v3` fills the slots with WebGL components that render the DOM default when WebGL is missing.

## Scenes

### 1. Hero: prompt to wall (`HeroScene.vue`, `HeroWall.vue`, `HeroPrompt.vue`)

- Purpose: prove in three seconds that a sentence becomes an image, with real output.
- Paint state: eyebrow, h1, sub-copy and both CTAs are in the DOM at full opacity with no entrance animation. CTA logic as today (`auth` store: "Open studio" to `/create`, else "Start free" to `/signin`; secondary scrolls to `#tools`).
- Motion: a prompt bar types one real `gallery.json` prompt; that prompt's own image blooms first and largest, then about 13 more real images bloom outward into three depth layers around the headline and drift slowly; desktop pointer adds slight parallax per layer. On scroll the section pins for about one viewport and the tiles fly outward and scale past the camera while the copy fades; the tools scene is revealed underneath.
- Data: `gallery.json` via `utils/landing.ts` exports. Tile positions come from a typed constant layout table, not random.
- Mobile: six tiles in two layers above and below the copy, no pin; a short unpinned scrub spreads them as the hero leaves.
- Reduced motion: full prompt shown, wall composed and static, no pin.
- Performance: fixed aspect-ratio boxes, the prompt's image eager with `fetchpriority="high"`, others lazy; drift loop paused when the hero is offscreen.

### 2. Tools: five passes (`ToolsScene.vue`, `ToolStage.vue`, `ToolChapterCopy.vue`)

- Purpose: show what each tool does to a real photo, not describe it.
- Motion (desktop): one pinned stage. Scrolling steps through `TOOLS`; copy on the left swaps per chapter with a 01 to 05 rail; on the right the three `compare` chapters (upscale, colorize, restore) wipe from the real before to the real after with a transform-only wipe (translated mask wrapper and counter-translated image). The two `gallery` chapters (generate, remove background) fan in their real gallery images. No fabricated cutout: there is no background-removal pair in `public/landing`.
- Data: `TOOLS` (title, body, points, CTA, media).
- Mobile and reduced motion: stacked chapters, each with the existing interactive `BeforeAfter` slider or image cluster; mobile gets a light one-shot reveal, reduced motion gets none.

### 3. Showcase: counter-moving rows (`ShowcaseScene.vue`, `ShowcaseTile.vue`)

- Purpose: breadth of what people made, with the exact prompt behind each image.
- Motion (desktop): two rows of real images drift in opposite directions tied to scroll position, not pinned. Each tile is a focusable button; hover or focus lifts it and surfaces its prompt with a "Copy prompt" action (`useShareActions`). Link to `/gallery`.
- Data: `SHOWCASE`.
- Mobile: one native scroll-snap rail, prompt shown under each tile. Reduced motion: static rows, prompts still reachable.

### 4. Models: the roster (`ModelsScene.vue`)

- Purpose: answer "which models?" as a credible roster, not a logo wall.
- Motion: lab names set large in serif assemble line by line once on enter (masked rise), featured models listed beside them with their credit cost; a soft pointer light follows the cursor across the list on desktop.
- Data: `MODELS`, `getFeaturedModels`, `groupModelsByCompany`, `UPSCALER_MODELS`, `getTransformCreditCost`, `getTierCreditLabel`.
- Mobile: same content, single column. Reduced motion: final state.

### 5. Pricing: credits (`PricingScene.vue`, `RollingNumber.vue`)

- Purpose: make "free plus credits" unmistakable.
- Motion: `SIGNUP_CREDITS` and `DAILY_CREDITS.free` roll in as large digit columns once on enter; two editorial columns (Free, Buy credits), no cards.
- Data: `@visual-ai/shared` (`SIGNUP_CREDITS`, `DAILY_CREDITS`, `CREDIT_PACKS` and the shared price formatter). The "from" price and any saving figure are derived from `CREDIT_PACKS`; if a figure cannot be derived it is left out, never retyped. Links: `/signin`, `/pricing#packs`.
- Reduced motion: final numbers shown.

### 6. FAQ

- Reuse `FaqSection` unchanged: a deliberate quiet beat before the close.

### 7. Final CTA (`FinalCtaScene.vue`)

- Purpose: bookend the hero and ask for the click.
- Motion: as the section enters, a handful of the hero's real images converge from the edges toward the headline (unpinned scrub); the primary CTA is magnetic on desktop. Same auth-aware CTA as the hero.
- Mobile and reduced motion: static cluster and plain button.

### Dropped from today's page

- `GalleryStrip` (the hero wall does its job) and the hero stat row (the model count moves into scene 4).

## Advisor changes (binding, they override anything above that conflicts)

1. **Marketing shell.** `App.vue` hides `AppHeader`/`AppFooter` only for `/` and `seo-*` routes. Extend that check for `/v2` and `/v3` with a named constant; do not rename routes to `seo-*`.
2. **Dark scope beyond the subtree.** While a candidate page is mounted, add a class to `html` (removed on unmount) that sets the dark token variables, a dark background and `color-scheme: dark`, so overscroll, the teleported scroll-top button and the global toast are dark too. Never touch the theme store.
3. **Theme toggle.** Hide both `.nav__theme-btn` and `.nav__sheet-theme-btn` with a `:deep` rule from the page; `LandingNav` is not edited.
4. **`useMagnetic` already exists** at `composables/useMagnetic.ts`; reuse it. New shared code lives in `components/LandingV2/` (composables in `components/LandingV2/composables/`).
5. **Pricing figures are derived, never copied from `PricingTeaser`** (its "₹99" and "31%" disagree with `CREDIT_PACKS`). Price: lowest `priceMinor` pack through `usePricingCatalog().formatPackPrice(pack)`. Saving: `Math.max(...CREDIT_PACKS.map((p) => p.savingsPercent))`. Credits: `SIGNUP_CREDITS`, `DAILY_CREDITS.free`.
6. **ScrollTrigger hygiene.** After page mount: `ScrollTrigger.sort()` then one `ScrollTrigger.refresh()` on `document.fonts.ready`. `ScrollTrigger.config({ ignoreMobileResize: true })`, `invalidateOnRefresh` on pins. Every image sits in a fixed-ratio box from its `aspectRatio`. Scene contexts revert before Lenis is destroyed. Scene gating comes from `gsap.matchMedia`, not a mount-time read.
7. **`/v3` seam.** One shared `LandingV2Page.vue` holds the composition and takes media overrides (`heroWall`, `showcaseMedia`, `transition` components as props); `LandingV2.vue` and `LandingV3.vue` are thin wrappers. Scroll progress reaches media layers as a non-reactive getter (or the ScrollTrigger handle), never a per-frame reactive ref. The wall's look is a pure function of (items, progress, pointer) in a shared module, so the hero timeline never targets tile DOM directly and a WebGL wall can consume the same function.
8. **Honesty.** Never import `STATS`/`getLandingStats`. The model count is a live count of `MODELS`. The remove-background chapter shows ordinary gallery images and must not look like a cutout.
9. **Gallery index ranges** (one typed constant module, `galleryRanges.ts`): tools use 0-5 (as `TOOLS` already does), showcase 0-11 (`SHOWCASE`), hero 12-31, final CTA 32-43. No image repeats between hero and the next two scenes.
10. **Motion variety.** Pricing is a scroll-scrubbed count (unpinned), not a one-shot, so it differs from models. Final CTA converge uses a different pace and easing from the hero exit.

## Build order

1. Shell, shared composables and hero (one Opus subagent), then browser verification by a separate subagent.
2. In parallel, one component set each and no edits to shared files: tools (Opus), showcase (Opus), models and pricing (Sonnet), final CTA (Sonnet). The orchestrator wires them into `LandingV2.vue`.
3. A separate verifier per scene: 1440px and 390px at start, middle and end, console errors, reduced motion.
4. Full-page pass, then `/v3`.
