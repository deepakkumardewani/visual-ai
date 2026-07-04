# Dashboard Redesign — Specification

> **Status:** Approved intent (via interview) · **Scope:** Frontend only · **Source of truth for models:** [`MODELS_COMPARISON.md`](../../MODELS_COMPARISON.md)
> Companion docs: [DASHBOARD_REDESIGN_PLAN.md](./DASHBOARD_REDESIGN_PLAN.md) · [DASHBOARD_REDESIGN_TASKS.md](./DASHBOARD_REDESIGN_TASKS.md)

---

## 1. Intent (confirmed)

- **Outcome:** Rebuild the Dashboard generator surface (`Dashboard.vue` + its sidebar/`Aside` + result column) as a custom, non-Vuetify UI that feels premium — dark, editorial, intentional — on par with Leonardo / Krea / Creen, not a templated Vuetify admin panel.
- **User:** People generating images in Visual AI who today face a generic purple form and should instead feel they're using a top-tier tool.
- **Why now:** Side-by-side with reference apps the current Vuetify layout reads as cheap; the model catalog data ([`MODELS_COMPARISON.md`](../../MODELS_COMPARISON.md)) is ready to power a richer picker.
- **Success:** Redesigned sidebar + main layout; rich **model** picker (renamed from "Mode"); AI-assisted prompt box (UI only); subtle premium-model treatment; community-generations feed as idle-canvas inspiration with Remix.
- **Constraint:** Pure frontend, **no Vuetify presentational components**, custom-built on the existing DESIGN.md tokens; premium cues must be **subtle**; AI generation + backend wiring are stubbed integration points.

### Out of scope

- Real AI prompt generation / any backend or API wiring (placeholder handlers only).
- A full social feed or a separate community route/page.
- Backend contract changes for new models (catalog is FE-facing; param adapters are a future effort — see §7).
- Rebuilding non-Dashboard pages, auth, pricing, or the global app header.

---

## 2. Current state (baseline)

| Area          | Today                                                    | File                                                                    |
| ------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Layout        | Vuetify `v-tabs-window`, 1/4 + 3/4 flex split            | [`src/pages/Dashboard.vue`](../src/pages/Dashboard.vue)                 |
| Sidebar       | `Aside` → `AIImageAside` stacks Vuetify controls         | [`src/components/Aside/`](../src/components/Aside/)                     |
| Model picker  | `v-select` labelled **"Mode"**, 5 Flux models            | [`src/components/Aside/Mode.vue`](../src/components/Aside/Mode.vue)     |
| Prompt        | `v-textarea` + "Ask Visual AI" → random from JSON        | [`src/components/Aside/Prompt.vue`](../src/components/Aside/Prompt.vue) |
| Result canvas | `ResultColumn` — empty when idle                         | [`src/components/ResultColumn.vue`](../src/components/ResultColumn.vue) |
| State         | Pinia `aside` store holds `mode`, `typingPrompt`, etc.   | [`src/stores/aside.ts`](../src/stores/aside.ts)                         |
| Catalog       | `FLUX_MODES: Mode[]` (`title,id,description,icon,isPro`) | [`src/utils/constants.ts`](../src/utils/constants.ts)                   |

**Behavior that MUST be preserved** (redesign is presentational, not functional):

- Generate flow in `AIImageAside.generateImage()` — job UUID, `ImageBody` shape, credit/signup gating, progress URL.
- Premium gating: selecting an `isPro` model as a non-pro user redirects to `/pricing`.
- `FLUX_PRO` / `FLUX_1_1_PRO` force `noOfOutputs = 1`.
- Prompt two-way binds to `asideStore.typingPrompt` → mirrored to `generateStore.promptText`.
- History tab and mobile (`xs`) tab bar continue to work.

---

## 3. Design system

Reuse the **existing** [`DESIGN.md`](../DESIGN.md) tokens — do not invent a new palette. Key tokens:

- **Canvas/surfaces:** `canvas #18120E`, `surface-1/2/3` warm near-blacks.
- **Ink:** `ink-primary #F0E8DC`, `ink-muted`, `ink-faint`.
- **Accent (ambient amber):** `accent #C98A5A` — hairlines, active indicators, icon tints.
- **Gold (precious, ≤3/viewport):** gradient + glow only — reserved for the premium-model treatment and the primary Generate CTA.
- **Type:** Young Serif (display) + Source Sans 3 (UI). Radius `sm 6 / md 12 / lg 20 / full`. Warm shadows.
- **Motion:** `duration-fast 150ms` (hover/press), `base 300ms` (state), `ease-out-expo` entrances; all motion gated by `useReducedMotion()`.

---

## 4. Functional requirements

### FR-1 — Layout & shell

- Custom two-column generator: left **control rail**, right **canvas/result**. No `v-tabs-window`, `v-divider`, `v-select`, `v-textarea`, `v-btn` in the Dashboard tree.
- Dark canvas background; control rail as an elevated `surface-1` panel with hairline borders.
- Responsive: rail collapses above canvas on mobile (`< sm`); preserves the existing mobile tab bar behavior.
- Clear visual hierarchy: prompt is the hero of the rail, then model, then secondary settings grouped.

### FR-2 — Sidebar / control rail

- Rebuild `AIImageAside` sections as custom components: prompt, model picker, and a grouped "settings" cluster (aspect ratio, format, quality, variations).
- Group secondary settings into a compact, scannable block (chips/segmented controls) instead of stacked full-width Vuetify fields — closer to Leonardo's settings panel.
- Generate button: primary CTA with gold glow (single per-viewport gold moment), disabled when prompt empty or loading, loading state with progress feedback.

### FR-3 — Model picker (renamed "Mode" → "Model")

- Custom dropdown/popover, **not** `v-select`. Label reads **"Model"** everywhere user-facing.
- Each row shows: **provider icon**, **model name**, **one-line description specific to that model**, **tier badge** (Budget / Standard / Premium), and optionally price/best-at.
- Grouped by provider or tier (like Krea's "Featured / All models" and Creen's provider list).
- Content sourced from [`MODELS_COMPARISON.md`](../../MODELS_COMPARISON.md); extend the catalog constant (see §5).
- **Icons:** source real provider logos from the internet (OpenAI, Google, Black Forest Labs/Flux, ByteDance/Seedream, xAI/Grok, Pruna, z-image); where a real logo can't be found, render a tasteful gradient lettermark glyph so nothing looks broken.
- Preserve premium gating + `noOfOutputs` side effects on select.

### FR-4 — AI-assisted prompt box

- Custom textarea (no `v-textarea`) with an **AI actions** affordance (sparkle button/menu) modeled on Leonardo: **Improve Prompt**, **New Random Prompt**, **Describe with image** (upload → describe).
- Keep the existing local "random prompt from JSON" working as the offline fallback behind **New Random Prompt**.
- AI actions (Improve / Describe) call **placeholder async handlers** with realistic loading/streaming affordance; leave a clean, typed integration seam for the real API later. No real API calls.
- Retain the typewriter reveal feel; keep two-way bind to `typingPrompt`.

### FR-5 — Premium-model treatment (subtle)

- When the selected model is `tier: premium`, apply a **subtle, restrained** shift: e.g. a thin gold gradient hairline on the model chip, a small gem/gold accent, or the CTA accent warming to gold. **One** cue, not many.
- Must never read as loud/tacky (no glowing borders everywhere, no "PREMIUM!!" badges). Non-premium selection returns to the ambient amber baseline.
- Respect reduced-motion (cue may be static).

### FR-6 — Community generations (idle-canvas inspiration)

- Show a **community feed** in the result canvas **empty state** (before the user has generated anything), replaced by the user's results once they generate.
- Masonry/grid of community images with author + like count (Leonardo-style), each with a **Remix** action that loads that item's prompt back into the prompt box.
- Data via a **placeholder/mock source** (typed) — not a real API, not a new route.
- Not a social network: no comments, following, or profiles.

---

## 5. Data model changes

Extend the FE model catalog to carry the richer `MODELS_COMPARISON.md` content. Suggested `Model` shape (superset of current `Mode`, backward compatible):

```ts
interface Model {
  title: string;
  id: string; // MODEL_IDS key (keep existing ids working)
  provider: "openai" | "google" | "bfl" | "bytedance" | "xai" | "pruna" | "zimage";
  description: string; // model-specific, from MODELS_COMPARISON §5
  bestAt?: string; // short strength line
  tier: "budget" | "standard" | "premium";
  pricePerImage?: number; // typical $/img
  iconUrl?: string; // real logo if sourced
  icon?: string; // existing glyph token / lettermark fallback
  isPro: boolean; // derive from tier === "premium"
}
```

- Keep `FLUX_MODES` working or migrate to a new `MODELS` constant with an alias so `aside.ts` / `AIImageAside.ts` keep functioning.
- Community feed item: `{ id, imageUrl, author, likes, prompt, aspectRatio }` from a mock module.

---

## 6. Non-functional requirements

- **No Vuetify presentational components** in the Dashboard subtree (logic/stores unchanged).
- Follow `vue-best-practices` + `vue-pinia-best-practices`; TypeScript strict, no `any` in new code.
- Accessibility: visible focus rings (`outline 2px #C98A5A`), 44px targets, AA contrast, keyboard-navigable model picker & prompt menu.
- Motion gated by `useReducedMotion()`; respect `prefers-reduced-motion`.
- No behavior regression in generate/history/mobile flows.
- Tooling: `bun`, `vp check`, `vp build` (never `npm`). Do not run the dev server.

---

## 7. Known follow-ups (explicitly deferred)

- Backend param adapters for non-Flux models (`resolution`/`size`/`image_input`) — see `MODELS_COMPARISON.md` §4.
- Real AI prompt endpoints (Improve / Describe-from-image).
- Real community feed API + Remix analytics.
- Edit/reference-image mode for editing-capable models.

---

## 8. Acceptance criteria

1. Dashboard renders with zero Vuetify presentational components in its subtree; layout is dark/custom per DESIGN.md.
2. Control label reads **"Model"**; picker shows icon + model-specific description + tier badge for each model, grouped, sourced from `MODELS_COMPARISON.md`.
3. Real provider logos appear where sourced; clean gradient lettermark fallback otherwise — none broken.
4. Prompt box has AI actions menu (Improve / Random / Describe) with loading affordance and placeholder handlers; random-from-JSON still works.
5. Selecting a premium model produces exactly one subtle, tasteful UI cue; deselecting returns to baseline.
6. Idle canvas shows a community grid; generating replaces it; Remix loads a prompt into the box.
7. Generate flow, premium `/pricing` redirect, `noOfOutputs` rules, history tab, and mobile layout all still work.
8. `vp check` and `vp build` pass; reduced-motion respected.
