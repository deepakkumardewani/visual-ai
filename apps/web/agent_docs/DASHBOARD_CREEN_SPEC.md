# Dashboard v2 (Creen-style) — Specification

> **Status:** Approved intent (interview 2026-07-03) · **Scope:** Frontend only · **Supersedes:** [DASHBOARD_REDESIGN_SPEC.md](./DASHBOARD_REDESIGN_SPEC.md) (v1, implemented)
> Companion docs: [DASHBOARD_CREEN_PLAN.md](./DASHBOARD_CREEN_PLAN.md) · [DASHBOARD_CREEN_TASKS.md](./DASHBOARD_CREEN_TASKS.md)

## 1. Objective

- **Outcome:** Restructure the Dashboard from the v1 two-column (control rail + canvas) layout into a **Creen-style** experience: a centered hero composer (prompt + inline setting chips + generate arrow) with the user's own creations feed below it. Slim translucent header replaces the solid purple bar. No sidebar anywhere.
- **User:** People generating images who should feel they're in a top-tier consumer AI product (Creen/Leonardo class), not a form-driven admin panel.
- **Why now:** v1 removed Vuetify chrome but kept the left-panel paradigm; side-by-side with Creen the panel itself reads as dated. Interview confirmed the layout paradigm — not any single component — is the gap.
- **Success:** Composer-centric layout live; header slim/translucent with purple demoted to accent; own-creations feed doubles as history (History tab gone); Explore tab hosts community; flyout model picker with featured section and correct brand icons; gold premium cue on the composer; generate moment + micro-interactions deliver the "wow".

## 2. Tech Stack

Vue 3.4 (`<script setup>` + TS strict) · Pinia · vue-router 4 · Tailwind (`tw-` prefix) + SCSS · vite-plus (`vp`) · bun 1.3 · gsap/@vueuse/motion available · Clerk auth. Vuetify remains installed for other pages but is **forbidden in the Dashboard subtree** (already true in v1; `useDisplay` in `Dashboard.vue` is the one allowed exception until replaced with a media-query composable).

## 3. Commands

```bash
bun install          # deps (NEVER npm)
bun run check        # vp check — types + lint (primary gate)
bun run test         # vp test run — unit tests
bun run build        # NODE_ENV=production vp build
# NEVER run `bun run dev` — the dev server is always already running.
```

## 4. Current state (v1 baseline — implemented)

| Area       | Today                                                                                           | File                                               |
| ---------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Page       | Tabs: 1 = shell(rail+canvas), 2 = History                                                       | `src/pages/Dashboard.vue`                          |
| Shell      | 1fr/3fr grid: `#rail` + `#canvas` slots                                                         | `src/components/Dashboard/DashboardShell.vue`      |
| Rail       | PromptBox, PromptAiMenu, ModelPicker, SettingsCluster, GenerateButton, MobileSettingsMenu       | `src/components/Dashboard/ControlRail/`            |
| Canvas     | CommunityFeed idle → ResultColumn on results                                                    | `src/components/Dashboard/Canvas/ResultCanvas.vue` |
| Picker     | Popover grouped by provider; ModelOption rows w/ TierBadge                                      | `ControlRail/ModelPicker.vue`                      |
| Catalog    | `MODELS: Model[]` (provider, tier, pricePerImage, bestAt, isPro)                                | `src/utils/models.ts`, `src/types/model.ts`        |
| Primitives | Popover, SegmentedControl, Stepper, TierBadge, ProviderIcon (+ tests)                           | `src/components/primitives/`                       |
| Header     | `AppHeader.vue` — solid purple bar + `Header/Tabs.vue`                                          | `src/components/Header/`                           |
| State      | `aside` (mode, typingPrompt, settings), `generate` (promptText, isLoading, images), `app` (tab) | `src/stores/`                                      |

**Behavior that MUST be preserved (unchanged from v1):**

- Generate flow (job UUID, `ImageBody` shape, credit/signup gating, progress URL) — currently in ControlRail/GenerateButton; moves to the composer.
- Premium gating: selecting `isPro` model as non-pro user → `/pricing` redirect.
- `FLUX_PRO` / `FLUX_1_1_PRO` force `noOfOutputs = 1`.
- Prompt two-way binds `asideStore.typingPrompt` → `generateStore.promptText`.
- Credits dialogs (BuyMoreCredits / LowCredits), mobile usability.

## 5. Functional requirements

### FR-1 — Hero composer (replaces ControlRail)

- Centered composer card, max-width ~720–840px, sitting in the upper third of the viewport: multi-line auto-growing prompt textarea (reuses PromptBox binding + typewriter/placeholder behavior), PromptAiMenu sparkle retained.
- Bottom row of the composer = inline **chips**: `[ModelChip ▾] [AspectRatio] [Quality] [Count] [⚙ advanced]` + circular **generate arrow** button (right-aligned), replacing the full-width Generate button. Chips open small Popovers reusing SegmentedControl/Stepper internals; `⚙` holds format + anything secondary.
- Generate arrow: disabled when prompt empty/loading; loading state animates (spinner/pulse).
- `ControlRail`, `SettingsCluster`, `GenerateButton`, `MobileSettingsMenu`, `DashboardShell` are removed once parity is reached; generate logic ports verbatim into the composer.
- Mobile: composer full-width with chips wrapping into a scrollable row; no separate mobile settings menu.

### FR-2 — Header (AppHeader v2)

- Slim (~56–60px) translucent dark header: `backdrop-blur`, `bg-canvas/80`, hairline bottom border. **No solid purple fill** — purple/amber only as accent (active link indicator, logo mark).
- Left: logo. Center/left: nav — **Create · Explore · Assets** (drive `appStore.tab`; active state = accent underline/pill). Right: credits chip (count + coin icon), **Upgrade** button (compact, gradient-gold per DESIGN.md budget), avatar/Sign-in.
- Old `Header/Tabs.vue` dashboard tab bar is absorbed by the nav; mobile keeps a compact tab strip under the header.

### FR-3 — Main area: own creations feed + Explore + Assets

- **Create tab (default):** below the composer, the user's own creations feed — newest first, masonry/grid of generation cards (image, prompt snippet, model badge, actions). Fresh results animate in at the top; the in-flight generation shows shimmer placeholder cards (one per `noOfOutputs`). This feed **is** the history — the History _tab_ is removed.
- **Empty state (no creations yet):** headline + a curated strip of community picks (reuses CommunityCard) with Remix to seed the prompt.
- **Explore tab:** full CommunityFeed (existing component, restyled to fit) with Remix intact.
- **Assets tab:** existing `History/History.vue` (bulk select/favorite/delete/download, filters) mounted as-is under the "Assets" label — bulk management survives, only the naming/placement changes.
- Remix (Explore or empty state) fills the composer prompt and scrolls/focuses it.

### FR-4 — Model picker v2 (flyout)

- Trigger = the composer's ModelChip (ProviderIcon + model name + chevron).
- Panel: **search input** on top → **FEATURED** section (flat rows) → **ALL MODELS** as parent-brand rows (Creen AI-style) that open a **side flyout submenu** with that brand's models on hover/click (desktop); on mobile/narrow, flyout degrades to accordion expansion.
- Row content = **brand icon + name + one-line description ONLY**. No pricePerImage, no cost, no "bestAt" chip, no Budget/Standard tier badges in the UI (data stays in the catalog). Premium rows show a small gold ✦ only.
- Catalog: add `featured: boolean` to `Model`; featured set (~5–6) chosen from flagship/popular models in `MODELS_COMPARISON.md`. Parent grouping via existing `groupModelsByProvider` + display names.
- **Icons:** correct brand logos (OpenAI, Google, Black Forest Labs, ByteDance/Seedream, xAI, Pruna, Z-Image) sourced from the web/Replicate into `src/assets/providers/`; ProviderIcon's gradient lettermark stays as the fallback. Fix any currently-wrong mappings.
- Search filters across all models (flat results while searching). Keyboard navigable; Esc closes flyout then panel.
- Selection side effects preserved: `/pricing` redirect, `noOfOutputs` forcing, close-on-select.

### FR-5 — Premium cue (composer-scoped)

- While an `isPro` model is selected: ModelChip gets a **gradient-gold border** + small ✦ badge; the composer card border picks up a **faint warm gold glow** (`shadow-gold-glow` at reduced opacity). Deselect → baseline instantly.
- Stays within DESIGN.md's gold budget (≤3 gold moments/viewport; the Upgrade button is one of them). No page-wide theme shift, no banners.

### FR-6 — Wow: generate moment + micro-interactions

- **Generate moment:** shimmer skeleton cards while loading → progressive image reveal (blur-up/fade) → new cards animate into the grid (spring translate+fade, ~250–350ms, DESIGN.md easings).
- **Micro-interactions everywhere:** chip hover/press states, popover open/close transitions, picker flyout slide, generate arrow press feedback, card hover lift, nav active-state transition.
- All motion gated by `prefers-reduced-motion` (existing `useReducedMotion` pattern). **No ambient animated hero background.**

## 6. Data model changes

```ts
// src/types/model.ts — add:
featured?: boolean;   // shown in FEATURED section of picker v2
```

No store shape changes. `app.tab` semantics become: 1 = Create, 2 = Explore, 3 = Assets.

## 7. Code style

Follow v1 conventions (see existing `ControlRail/ModelPicker.vue`): `<script setup lang="ts">`, `storeToRefs`, `tw-` utilities + scoped SCSS only for what Tailwind can't express, `data-testid` on every structural node, colocated `*.test.ts` per component, no `any`, functions <30 lines, constants over magic numbers.

## 8. Testing strategy

`vp test run` (Vitest + happy-dom + @vue/test-utils). Every new/changed component gets a colocated test covering: render, key interaction, and preserved behavior (gating/redirect/noOfOutputs). Update — don't delete — v1 tests for components that survive; delete tests only together with their removed component.

## 9. Boundaries

- **Always:** `bun run check` + `bun run test` green before marking any task done; preserve §4 behaviors; DESIGN.md tokens only; reduced-motion gates on all animation.
- **Ask first:** new dependencies; changing store shapes beyond §6; touching non-Dashboard pages besides AppHeader; changing any backend request payload.
- **Never:** run the dev server; use npm; commit without being asked; use Vuetify presentational components in the Dashboard subtree; remove failing tests to go green; flat gold fills.

## 10. Success criteria

1. Dashboard shows centered composer with inline chips + generate arrow; no left rail/panel at any viewport.
2. Header is slim + translucent, nav Create/Explore/Assets works, credits + Upgrade + avatar present; no solid purple bar.
3. Generating produces shimmer placeholders that resolve into animated-in cards at the top of the own-creations feed; feed persists as history; History tab is gone; Assets tab retains bulk actions.
4. Explore tab shows community feed; Remix (Explore + empty state) fills the composer.
5. Picker: search → Featured → parents with flyouts; rows show icon/name/desc only; correct brand logos with lettermark fallback; premium rows show ✦ only.
6. Premium model selected → gold chip border + composer glow; deselect reverts; gold budget respected.
7. All §4 preserved behaviors verified by tests; `vp check`, `vp test run`, `vp build` all pass; reduced-motion honored.

## 11. Out of scope

Backend/API changes · video tools · pricing/upgrade flow redesign · ambient animated hero background · real AI prompt-improve wiring (placeholders stay) · new routes (tabs stay in `/dashboard`) · non-Dashboard pages except AppHeader.

## 12. Open questions

None blocking — layout, feed, picker, premium, and wow decisions were all confirmed in the 2026-07-03 interview.
