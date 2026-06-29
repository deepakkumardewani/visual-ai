# Dark Editorial Design System — Reference & Rollout Spec

> **Purpose for the agent reading this:** The Visual AI landing page (`/`) was rebuilt
> into a dark, editorial, "premium" experience. This document records **exactly how it
> was done** and gives a **repeatable playbook** to bring the same look to the rest of
> the app — Pricing, Examples, Gallery, Contact, FAQ, Profile, Dashboard, the shared
> nav/footer, and the auth pages.
>
> Treat this as the single source of truth for the redesign. The visual tokens live in
> [`DESIGN.md`](../DESIGN.md); this file is the implementation contract and migration guide.

---

## 1. Objective

Migrate every public/app surface from the old Vuetify **purple-gradient** look to the
**warm dark editorial** system, without breaking existing functionality (auth, payments,
generation flows, stores).

- **Marketing surfaces** (landing, pricing, examples, gallery, contact, FAQ): full
  immersive treatment — dark canvas, fluid editorial type, scroll motion, custom markup,
  **no Vuetify presentational chrome**.
- **App surfaces** (dashboard, profile, history, asides): adopt the **tokens, fonts, and
  color** but keep Vuetify structure where it carries real behaviour. Use a **fixed `rem`
  type scale here, not fluid `clamp()`** (fluid type belongs on marketing pages only).
- **Never fabricate** metrics, testimonials, or logos. Use real assets and honestly
  rounded real numbers only (see §8).

---

## 2. The system at a glance (what already exists)

### 2.1 Tokens — `tailwind.config.js` (prefix `tw-`, additive — purple tokens kept)

| Group                        | Tailwind class                                                            | Value                                                  |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| Canvas                       | `tw-bg-canvas`                                                            | `#18120E`                                              |
| Surfaces                     | `tw-bg-surface-1/2/3`                                                     | `#221A14` / `#2D2319` / `#3A2E22`                      |
| Text                         | `tw-text-ink` / `tw-text-ink-muted` / `tw-text-ink-faint`                 | `#F0E8DC` / `#A89888` / `#6B5E51`                      |
| Accent (the **only** accent) | `tw-text-accent` / `tw-bg-accent` / `…-accent-hover`                      | `#C98A5A` / `#D9996A`                                  |
| Hairline / borders           | `tw-border-hairline`                                                      | `#3A2E22`                                              |
| Display font                 | `tw-font-display`                                                         | `"Young Serif", Georgia, serif` (weight 400 only)      |
| Body font                    | `tw-font-body`                                                            | `"Source Sans 3", system-ui, sans-serif` (400/500/600) |
| Type scale                   | `tw-text-display-2xl … -md`, `tw-text-body-lg/base/sm`, `tw-text-eyebrow` | fluid `clamp()` on display sizes                       |
| Radius                       | `tw-rounded-chip/card/card-lg`                                            | `6 / 12 / 20px`                                        |
| Shadows (warm)               | `tw-shadow-card/elevated/accent`                                          | see config                                             |
| Easing                       | `tw-ease-out-expo` / `tw-ease-soft`                                       | `cubic-bezier(0.16,1,0.3,1)` / `(0.4,0,0.2,1)`         |

> Tokens are **additive**: the legacy purple tokens (`darkBorder`, `vSelectDark`, …) remain
> so non-migrated pages keep working. Do not delete them until every page is migrated.

### 2.2 Fonts — `index.html`

Google Fonts preconnect + preload + stylesheet for **Young Serif** (display) and
**Source Sans 3** (body). Young Serif ships a single 400 weight — **hierarchy comes from
size, never bold**.

### 2.3 Motion stack

| Artifact                           | File                                  | Role                                                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useReducedMotion()`               | `src/composables/useReducedMotion.ts` | reactive `prefers-reduced-motion` flag (wraps `@vueuse/core`).                                                                                                                                                               |
| `useLenis()` + `scrollToSection()` | `src/composables/useLenis.ts`         | Lenis momentum scroll synced to the GSAP ticker; **call `useLenis()` once at page root**. Module-scoped instance so any component can call `scrollToSection('#id')`. Disabled entirely under reduced motion (native scroll). |
| `v-reveal` directive               | `src/directives/reveal.ts`            | fade + lift on scroll, **once**. Registered globally in `src/plugins/index.ts` (`app.directive('reveal', vReveal)`). Usage: `v-reveal` or `v-reveal="{ delay: 0.1, y: 40 }"`. No-op under reduced motion.                    |
| GSAP + ScrollTrigger               | `gsap`, `gsap/ScrollTrigger`          | `ScrollTrigger` registered in the composables. Page-level timelines use `gsap.context(fn, scopeEl)` and **must `ctx.revert()` in `onBeforeUnmount`** (see `LandingHero.vue`).                                                |

Dependencies added: `gsap@3.15`, `lenis@1.3`.

### 2.4 Ambient background

`src/components/Landing/AmbientCanvas.vue` — `position: fixed; inset:0; z-index:0;
pointer-events:none`. Canvas 2D warm light-blobs drifting on lissajous paths (`lighter`
blend) + SVG film grain + vignette. Draws **one static frame** under reduced motion.
Content sits above it via `position: relative; z-index: 1` on every section; nav is `z-50`.

### 2.5 Landing components (the reference implementations)

`src/components/Landing/`:
`LandingButton` (primary/ghost, press + focus-ring micro-interaction) ·
`LandingNav` (transparent→blur on scroll, smooth-scroll anchors, mobile sheet) ·
`LandingHero` (GSAP masked word-reveal + parallax) · `ToolChapter` (alternating
asymmetric chapter) · `BeforeAfter` (themed `@img-comparison-slider/vue` wrapper) ·
`ShowcaseGallery` (CSS-columns masonry, prompt on hover) · `CapabilitiesSection`
(models + spec stats) · `PricingTeaser` · `FaqSection` (`grid-template-rows` accordion) ·
`FinalCta` · `LandingFooter`. Page assembled in `src/pages/Landing.vue`.

### 2.6 Data & copy

All landing data/copy is centralized in `src/utils/landing.ts` (STATS, SHOWCASE, TOOLS,
MODELS, CAPABILITIES, FAQS, NAV_LINKS, HERO_IMAGE). **Reuse the app's existing single
sources** (e.g. `FLUX_MODES` from `src/utils/constants.ts`) so product facts never drift.

### 2.7 Shell isolation — `src/App.vue`

`isLanding = route.path === '/'` hides the global Vuetify `AppHeader`/`AppFooter` and the
purple `v-app` gradient on `/`, applying `landing-bg` (`#18120e`) instead. The landing
ships its own `LandingNav`/`LandingFooter`.

---

## 3. Commands

```bash
# Dev server is ALWAYS RUNNING — do not start it. (Currently on http://localhost:3001)
bun add <pkg>                 # add a dependency (gsap, lenis were added this way)
bunx vue-tsc --noEmit -p tsconfig.json   # type check (must be clean)
vp check                      # project lint + typecheck (use this, not raw eslint)
```

> **Do not run `npm`/`vite` directly.** Use `bun` / `vp`. Raw `bunx vite build` fails
> (`vite` is overridden to `@voidzero-dev/vite-plus-core`). `bunx vp build` regenerates
> `src/components.d.ts` but currently dies on a **pre-existing** `manualChunks is not a
function` rolldown config error — unrelated to the design work; rely on the dev server.

---

## 4. Project structure (where new work goes)

```
src/
  components/Landing/        # reference dark-editorial components (capital "L")
  components/<Area>/         # per-area migrated components mirror this pattern
  composables/useLenis.ts, useReducedMotion.ts
  directives/reveal.ts       # global v-reveal
  utils/landing.ts           # centralized landing data — make utils/<page>.ts per page
  utils/constants.ts         # canonical product facts — reuse, never duplicate
  pages/<Page>.vue           # assembles section components, calls useLenis() if marketing
DESIGN.md                    # visual token source of truth
agent_docs/                  # this spec + future design docs
```

---

## 5. Code style & conventions (must follow)

- **No Vuetify presentational chrome** on marketing pages (`v-btn`, `v-card`, `v-chip`,
  `v-container`, `v-img`). Use semantic HTML + token classes / scoped SCSS. Vuetify is
  still fine for genuine app behaviour (dialogs, data tables, forms) on app surfaces.
- **No AI-slop tells** (per the `impeccable` skill): no gradient text (`background-clip:
text`), no colored `border-left/right` accent stripes >1px, no glassmorphism everywhere,
  no centered identical card grids, no bounce/elastic easing. Left-align and vary spacing.
- **One accent only** (`#C98A5A`), used sparingly (60/30/10 weight). Never reintroduce purple.
- **Typography:** display = Young Serif (size for hierarchy, never bold); body = Source
  Sans 3; body line-length capped (`max-w-prose` / ~68ch); fluid type on marketing,
  fixed `rem` on app UI.
- **Spacing:** section padding `clamp(4rem,8vw,7rem)`; content `max-width: 80rem`; use `gap`,
  not margins, for sibling spacing.
- **Eyebrows:** reuse the global `.eyebrow` utility (in `src/style.scss`).
- **Scoped SCSS** per component using the hex tokens (or Tailwind `tw-` classes). Keep
  components < ~30-line scripts; extract shared bits (see `LandingButton`, `BeforeAfter`).
- **Accessibility:** focus ring `outline: 2px solid #C98A5A; outline-offset: 3px;` on every
  interactive element; min touch target 44×44px; AA contrast (4.5:1 body / 3:1 large).
- **DRY data:** one `utils/<page>.ts` per page; reuse `constants.ts`; never hard-code a
  product fact that already lives in a store/constant.

### Motion rules (non-negotiable)

- Every hover/scale/transform effect is wrapped in `@media (prefers-reduced-motion: reduce)`
  that disables it.
- Scroll reveals via `v-reveal` only; stagger via incremental `delay`.
- `useLenis()` is called **once** per marketing page root, never inside child components.
- GSAP `gsap.context(...)` is **reverted in `onBeforeUnmount`**.

---

## 6. Rollout playbook (apply to the next page)

1. **Classify the page** — marketing (immersive dark) vs app (tokens-only, keep Vuetify
   behaviour). Pick the fluid vs fixed type scale accordingly.
2. **Create `src/utils/<page>.ts`** for that page's copy/data; pull product facts from
   `constants.ts`. No fabricated numbers.
3. **Build/migrate section components** under `src/components/<Area>/`, mirroring the
   Landing components. Replace Vuetify presentational tags with token-styled markup on
   marketing pages.
4. **Shell:** for nav/footer, generalize `LandingNav`/`LandingFooter` into shared
   components (or extend `AppHeader`/`AppFooter` to a dark token theme) so migrated pages
   don't show purple chrome. Update the `isLanding` guard in `App.vue` to cover newly
   migrated routes (or remove the guard once the global shell itself is migrated).
5. **Motion:** add `v-reveal` to entrance elements; call `useLenis()` at the page root if
   it's a long scrolling marketing page. Always honor reduced motion.
6. **Background:** reuse `AmbientCanvas` (or a lighter static variant) where an immersive
   feel is wanted; app surfaces can use a flat `tw-bg-canvas`.
7. **Verify** (see §7) before considering the page done.

---

## 7. Testing & verification strategy

1. `bunx vue-tsc --noEmit` → **must be clean** (no `error TS`).
2. `vp check` for lint.
3. **Visual pass with the `agent-browser` skill** (never chrome-devtools): open the route
   on the running dev server (`http://localhost:3001`), scroll through so `v-reveal` /
   ScrollTrigger fire, screenshot each section.
4. **AI-slop test:** "If someone said an AI made this, would they believe it instantly?"
   If yes, add design intention.
5. **Reduced-motion test:** emulate `prefers-reduced-motion: reduce` — content must be
   fully visible, Lenis off, no transform animation.
6. **Responsive test:** check mobile width — adapt layout, don't just shrink; nothing
   critical hidden.

---

## 8. Boundaries

**Always:**

- Reuse existing tokens, composables, the `v-reveal` directive, and `constants.ts` facts.
- Keep the purple tokens until the whole app is migrated.
- Gate all motion behind `prefers-reduced-motion`.
- Use real assets (`gallery.json`, `examples/{upscale,colorize,revive}/*`, `assets/*`).

**Ask first:**

- Changing the accent color, fonts, or any token value in `DESIGN.md` / `tailwind.config.js`.
- Migrating the global `App.vue` shell (affects every route at once).
- Touching auth/payment/generation logic while restyling.
- Adding heavy new dependencies.

**Never:**

- Fabricate metrics, testimonials, user counts, or partner logos. Honest rounding of real
  figures only (real traction: in production since 2023, 500+ users, thousands of
  generations — round, never inflate ~10×).
- Reintroduce purple, gradient text, or colored side-stripe accents.
- Run the dev server (it is always running) or commit without explicit instruction.
- Duplicate a product fact that already lives in a store/constant.

---

## 9. Known gotchas (learned while building the landing page)

- **macOS case-insensitive FS + `unplugin-vue-components`:** keep the component directory
  case consistent (`components/Landing`, capital L). `src/components.d.ts` is
  auto-generated; a stale entry can cause `TS1149 … differs only in casing`. Fix: force the
  dir case (`mv Landing __tmp && mv __tmp Landing`), delete `src/components.d.ts`, run
  `bunx vp build` to regenerate it.
- **Components auto-register** (no explicit import needed) — but if you do import, match the
  casing exactly.
- **Build is currently broken** at the bundling step (`manualChunks is not a function`,
  vite-plus/rolldown) — pre-existing, not caused by the design work. Verify via the dev
  server + `vue-tsc`, not `vp build`.
- **ESLint 9** flat-config isn't set up; use `vp check`, not raw `eslint`.
