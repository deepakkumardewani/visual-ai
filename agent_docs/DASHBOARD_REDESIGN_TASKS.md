# Dashboard Redesign — Task Checklist

> Ordered, verifiable tasks for [DASHBOARD_REDESIGN_PLAN.md](./DASHBOARD_REDESIGN_PLAN.md). Each task: small, single-responsibility, independently checkable. Mark `[x]` when its acceptance check passes.

Legend: **AC** = acceptance check.

---

## Phase 0 — Foundation & primitives

- [ ] **T0.1** Audit `tailwind.config.js` — confirm all DESIGN.md tokens (canvas, surfaces, ink, accent, gold, radii, shadows, motion) are present; add any missing.
  - AC: every token in spec §3 resolves in a scratch component.
- [ ] **T0.2** Build `Popover.vue` primitive (trigger + floating panel, click-outside, keyboard esc, focus trap).
  - AC: opens/closes via mouse + keyboard; focus ring visible.
- [ ] **T0.3** Build `SegmentedControl.vue` (token-driven pill group, v-model).
  - AC: selecting emits value; active state uses accent.
- [ ] **T0.4** Build `Stepper.vue` (+/- with min/max, v-model).
  - AC: clamps at bounds; keyboard operable.
- [ ] **T0.5** Build `TierBadge.vue` (Budget / Standard / Premium — premium uses gold gradient).
  - AC: three variants render per DESIGN.md; premium is gradient not flat.
- [ ] **T0.6** Build `ProviderIcon.vue` (real logo by `provider`, gradient lettermark fallback).
  - AC: known provider → logo; unknown → lettermark; never broken img.

## Phase 1 — Shell & layout

- [ ] **T1.1** Create `DashboardShell.vue` — custom two-column grid (rail + canvas), dark canvas, responsive collapse.
  - AC: renders without any `v-*` component.
- [ ] **T1.2** Rewrite `Dashboard.vue` to use `DashboardShell`; remove `v-tabs-window`/`v-divider`; keep tab switch (generate/history) + mobile `xs` bar via store.
  - AC: both tabs work; mobile bar shows; history unchanged.
- [ ] **T1.3** Wrap existing result content in `ResultCanvas.vue` (port `ResultColumn` usage) so canvas side renders.
  - AC: generating still shows results as before.

## Phase 2 — Control rail

- [ ] **T2.1** Create `ControlRail.vue`; port `generateImage()` + gating/watchers verbatim from `AIImageAside.vue`.
  - AC: generate produces same `ImageBody`; credit/signup dialogs fire.
- [ ] **T2.2** Build `SettingsCluster.vue` grouping aspect ratio, format, quality, variations using `SegmentedControl`/`Stepper`; bind to `aside` store.
  - AC: each control writes the same store refs; no `v-select`/`v-btn`.
- [ ] **T2.3** Build `GenerateButton.vue` — gold-glow CTA, disabled when prompt empty/loading, loading affordance.
  - AC: disabled logic matches today; one gold moment per viewport.
- [ ] **T2.4** Delete/retire Vuetify settings components once ported (`AspectRatio`, `ImageFormat`, `OutputQuality`, `ImageVariation`).
  - AC: no references remain; `vp check` clean.

## Phase 3 — Model picker

- [ ] **T3.1** Add `Model` interface (spec §5) to `src/types`; extend catalog in `constants.ts` → `MODELS` from `MODELS_COMPARISON.md` (provider, tier, price, bestAt, description); keep `FLUX_MODES` alias.
  - AC: catalog typed, no `any`; existing default model still loads.
- [ ] **T3.2** Source real provider logos (OpenAI, Google, BFL/Flux, ByteDance/Seedream, xAI/Grok, Pruna, z-image) into `ProviderIcon`; lettermark fallback for any missing.
  - AC: each catalog model shows a logo or clean lettermark.
- [ ] **T3.3** Build `ModelOption.vue` (icon + name + model-specific description + `TierBadge` + optional best-at/price).
  - AC: matches spec FR-3 content per model.
- [ ] **T3.4** Build `ModelPicker.vue` + `ModelPickerTrigger.vue` using `Popover`; label **"Model"**; grouped by provider/tier; replace `Mode.vue`.
  - AC: no `v-select`; label reads "Model" everywhere.
- [ ] **T3.5** Port select side effects: premium non-pro → `/pricing`; `FLUX_PRO`/`FLUX_1_1_PRO` → `noOfOutputs = 1`.
  - AC: gating + noOfOutputs behavior identical to today.

## Phase 4 — AI prompt box

- [ ] **T4.1** Build `PromptBox.vue` — custom textarea (no `v-textarea`), two-way bind `typingPrompt`, keep typewriter reveal + info tooltip.
  - AC: typing mirrors to `generateStore.promptText`; parity with old behavior.
- [ ] **T4.2** Create `src/utils/promptAi.ts` — typed placeholder `improvePrompt()` / `describeImage()` (mock + delay), clean API seam.
  - AC: functions typed, return mock, documented as placeholder.
- [ ] **T4.3** Build `PromptAiMenu.vue` (sparkle) — Improve Prompt, New Random Prompt (existing JSON), Describe with image (upload→describe); loading/streaming affordance.
  - AC: all three actions run; random JSON fallback intact; loading shown.

## Phase 5 — Premium cue

- [ ] **T5.1** Derive `isPremium` in `ControlRail`; apply exactly one subtle gold cue (chip hairline or CTA warm) on premium model; baseline amber otherwise.
  - AC: toggling premium adds/removes one tasteful cue; not tacky; reduced-motion safe.

## Phase 6 — Community feed

- [ ] **T6.1** Create `src/utils/communityMock.ts` typed feed items (`id,imageUrl,author,likes,prompt,aspectRatio`).
  - AC: typed mock, ~8–12 items.
- [ ] **T6.2** Build `CommunityCard.vue` (image + author + likes + Remix) and `CommunityFeed.vue` (masonry/grid).
  - AC: renders grid; lazy images; a11y labels.
- [ ] **T6.3** Wire feed as `ResultCanvas` idle state; results replace it on generate; Remix sets `typingPrompt`.
  - AC: idle → feed; generate → results; Remix loads prompt into box.

## Phase 7 — Polish & verify

- [ ] **T7.1** Micro-interactions: hover/press/focus states across rail, picker, buttons, cards.
  - AC: feedback present; timings per DESIGN.md.
- [ ] **T7.2** Accessibility pass: focus rings, 44px targets, keyboard nav for picker + AI menu, AA contrast.
  - AC: keyboard-only walkthrough works; contrast passes.
- [ ] **T7.3** Reduced-motion pass: gate all motion via `useReducedMotion()`.
  - AC: `prefers-reduced-motion` → no motion, content intact.
- [ ] **T7.4** Remove remaining retired Vuetify components in Dashboard subtree; final cleanup.
  - AC: zero `v-*` presentational components in Dashboard tree.
- [ ] **T7.5** Run `vp check` + `vp build`; `agent-browser` verify desktop dark/light + mobile.
  - AC: both pass; screenshots match spec acceptance criteria (§8).

---

## Definition of done

All spec §8 acceptance criteria met, `vp check`/`vp build` green, no behavior regression in generate/history/mobile, and a browser-verified premium dark UI free of Vuetify chrome.
