# Dashboard v2 (Creen-style) — Task Checklist

> Spec: [DASHBOARD_CREEN_SPEC.md](./DASHBOARD_CREEN_SPEC.md) · Plan: [DASHBOARD_CREEN_PLAN.md](./DASHBOARD_CREEN_PLAN.md)
> Gate for every task: `bun run check` + `bun run test` pass. Never run the dev server; verify in browser via agent-browser.

## Phase 0 — Data & assets

- [x] ✅ **T0.1** Add `featured?: boolean` to `Model` type; mark featured set in `src/utils/models.ts` (suggested: Z-Image Turbo, GPT Image 2, Nano Banana 2, Nano Banana Pro, Seedream 4, Flux 2 Pro).
  - AC: type compiles; `MODELS.filter(m => m.featured)` returns 5–6 models.
  - Verify: `bun run check`; unit test for featured selection helper.
  - Files: `src/types/model.ts`, `src/utils/models.ts` (+ test)
- [x] ✅ **T0.2** Lift `PROVIDER_DISPLAY_NAMES` out of `ModelPicker.vue` into `src/utils/models.ts`; export a `getProviderDisplayName()`.
  - AC: v1 picker still renders identical headings (no visual change).
  - Verify: existing ModelPicker tests pass.
  - Files: `src/utils/models.ts`, `src/components/Dashboard/ControlRail/ModelPicker.vue`
- [x] ✅ **T0.3** Source correct brand logos (OpenAI, Google, Black Forest Labs, ByteDance/Seedream, xAI, Pruna, Z-Image) into `src/assets/providers/`; fix `providerLogos.ts` mappings; keep lettermark fallback.
  - AC: every provider in `MODELS` resolves to a correct logo or intentional lettermark; no broken images.
  - Verify: render check of v1 picker in browser — **manual icon review checkpoint**.
  - Files: `src/assets/providers/*`, `src/utils/providerLogos.ts` (+ test)

## Phase 1 — Header v2

- [x] ✅ **T1.1** Build `CreditsChip.vue` (count + coin icon, compact pill) extracting display logic from `Credits.vue`.
  - AC: shows live credit count; hidden/CTA state for signed-out users matches current behavior.
  - Verify: component test; browser check.
  - Files: `src/components/Header/CreditsChip.vue` (+ test)
- [x] ✅ **T1.2** Build `NavTabs.vue` — Create / Explore / Assets pills driving `appStore.tab`; accent active indicator; keyboard accessible.
  - AC: clicking updates tab; active state animates; 44px targets.
  - Verify: component test asserts store writes.
  - Files: `src/components/Header/NavTabs.vue` (+ test)
- [x] ✅ **T1.3** Build `AppHeaderV2.vue` — slim (~56–60px) translucent (`backdrop-blur`, `bg-canvas/80`, hairline border-b): logo · NavTabs (dashboard only) · CreditsChip · Upgrade (gradient-gold compact) · avatar/Sign-in. Swap into the app in place of `AppHeader.vue`; mobile: compact tab strip under header replaces `Header/Tabs.vue` usage.
  - AC: no solid purple fill anywhere; all pages render correctly; signed-in/out states work.
  - Verify: tests + browser screenshots of Landing, Dashboard, Pricing at 1440/390px.
  - Files: `src/components/Header/AppHeaderV2.vue`, app root usage, `src/pages/Dashboard.vue` (+ tests)

🔶 **CHECKPOINT 1 — human review: header look & feel across pages.** ✅ (pending human visual sign-off)

## Phase 2 — Hero composer

- [x] ✅ **T2.1** Build `ComposerTextarea.vue` from `PromptBox.vue`: auto-grow, `typingPrompt` binding, typewriter placeholder, PromptAiMenu sparkle retained.
  - AC: typing mirrors to `generateStore.promptText`; AI menu actions work as in v1.
  - Verify: port + adapt PromptBox tests.
  - Files: `src/components/Dashboard/Composer/ComposerTextarea.vue` (+ test)
- [x] ✅ **T2.2** Build `ComposerChip.vue` + `SettingsPopovers.vue`: aspect-ratio, quality, count (Stepper), `⚙` advanced (format + outputQuality) — reusing SegmentedControl/Stepper inside Popovers, all bound to `asideStore`.
  - AC: each chip shows current value; changes write to store; popovers keyboard/Esc friendly.
  - Verify: component tests per chip.
  - Files: `src/components/Dashboard/Composer/ComposerChip.vue`, `SettingsPopovers.vue` (+ tests)
- [x] ✅ **T2.3** Build `GenerateArrow.vue` — circular CTA; **move `generateImage()` body verbatim** from `GenerateButton.vue` (job UUID, ImageBody, credit/signup gating, progress URL); disabled when prompt empty/loading; loading animation.
  - AC: end-to-end generate works; credits dialogs still trigger.
  - Verify: adapt GenerateButton tests to GenerateArrow; browser smoke of generate flow.
  - Files: `src/components/Dashboard/Composer/GenerateArrow.vue` (+ test)
- [x] ✅ **T2.4** Build `HeroComposer.vue` + `ModelChip.vue` (ProviderIcon + name + chevron; opens v1 picker panel for now) and rewrite `Dashboard.vue`: centered composer (max-w ~800px, upper third), feed region below; **ControlRail/DashboardShell no longer rendered**; mobile = full-width composer, wrapping chip row.
  - AC: no left rail at any viewport; all v1 rail capabilities reachable from composer.
  - Verify: Dashboard page test; browser screenshots 1440/390px.
  - Files: `src/components/Dashboard/Composer/HeroComposer.vue`, `ModelChip.vue`, `src/pages/Dashboard.vue` (+ tests)

## Phase 3 — Feed & tabs

- [ ] **T3.1** Build `ShimmerCard.vue` + `CreationCard.vue` (image, prompt snippet, model badge, hover actions: download/favorite/delete reusing existing handlers).
  - AC: cards match DESIGN.md surfaces/radii; actions call existing store logic.
  - Verify: component tests.
  - Files: `src/components/Dashboard/Feed/ShimmerCard.vue`, `CreationCard.vue` (+ tests)
- [ ] **T3.2** Build `CreationsFeed.vue` — own generations grid (same data source as History grid), newest-first; while `generateStore.isLoading`, prepend `noOfOutputs` ShimmerCards; resolve into results.
  - AC: fresh generation appears at top without reload; feed = history parity for browsing.
  - Verify: test simulating generate lifecycle.
  - Files: `src/components/Dashboard/Feed/CreationsFeed.vue` (+ test)
- [ ] **T3.3** Build `EmptyState.vue` — headline + community picks strip (CommunityCard reuse) with Remix seeding the composer prompt + focus.
  - AC: shows only when user has zero creations; Remix fills prompt.
  - Verify: component test.
  - Files: `src/components/Dashboard/Feed/EmptyState.vue` (+ test)
- [ ] **T3.4** Wire tabs in `Dashboard.vue`: 1 Create (composer+feed), 2 Explore (CommunityFeed restyled full-bleed), 3 Assets (`History.vue` as-is, relabeled). Remove History tab semantics, `ResultCanvas`/`ResultColumn` usage on dashboard.
  - AC: Explore Remix jumps to Create with prompt filled; Assets bulk actions intact.
  - Verify: page-level test per tab; browser walkthrough.
  - Files: `src/pages/Dashboard.vue`, `src/components/Dashboard/Canvas/CommunityFeed.vue` (+ tests)

🔶 **CHECKPOINT 2 — human review: composer + feed experience end-to-end.**

## Phase 4 — Model picker v2

- [ ] **T4.1** Build `ModelRow.vue` — icon + name + one-line desc, gold ✦ when `isPro`; **no price/tier/bestAt**; selected state.
  - AC: row shows exactly icon/name/desc(+✦); 44px target.
  - Verify: component test.
  - Files: `src/components/Dashboard/ModelPickerV2/ModelRow.vue` (+ test)
- [ ] **T4.2** Build `ModelSearchInput.vue` + `FeaturedSection.vue` (flat featured rows under "✦ FEATURED" eyebrow).
  - AC: search filters all models flat (featured + grouped hidden while searching).
  - Verify: filter unit tests.
  - Files: `ModelPickerV2/ModelSearchInput.vue`, `FeaturedSection.vue` (+ tests)
- [ ] **T4.3** Build `ParentRow.vue` + `ModelFlyout.vue` — brand rows ("ALL MODELS") opening side flyout (desktop ≥md) / accordion (<md); flyout lists that brand's ModelRows.
  - AC: hover/click opens; Esc closes flyout then panel; arrow-key navigation.
  - Verify: interaction tests incl. keyboard.
  - Files: `ModelPickerV2/ParentRow.vue`, `ModelFlyout.vue` (+ tests)
- [ ] **T4.4** Build `ModelPickerPanel.vue` composing search/featured/parents; wire to `ModelChip`; port selection logic (pricing redirect, `noOfOutputs` forcing, close-on-select) from v1 `ModelPicker.vue`; then delete v1 `ModelPicker/ModelOption/ModelPickerTrigger` + tests.
  - AC: spec FR-4 fully met; gating behaviors covered by ported tests.
  - Verify: full picker test suite; browser check desktop + mobile.
  - Files: `ModelPickerV2/ModelPickerPanel.vue`, `Composer/ModelChip.vue`, deletions (+ tests)

## Phase 5 — Premium cue

- [ ] **T5.1** ModelChip premium state: gradient-gold border + ✦ badge (tokens: `gradient-gold`, `gold.muted`).
  - AC: appears only while selected model `isPro`; reverts instantly.
  - Verify: component test toggling model.
  - Files: `Composer/ModelChip.vue`
- [ ] **T5.2** Composer glow: faint `shadow-gold-glow` (reduced opacity) on HeroComposer while premium active; gold-budget audit (≤3/viewport: Upgrade, ModelChip, glow).
  - AC: subtle (no flat gold fills); budget respected.
  - Verify: visual check + test asserting class binding.
  - Files: `Composer/HeroComposer.vue`

## Phase 6 — Wow pass

- [ ] **T6.1** Generate moment: shimmer sweep on ShimmerCards, progressive blur-up/fade image reveal, spring entrance of new cards into the grid (DESIGN.md timings/easings).
  - AC: full lifecycle feels continuous: press → shimmer → reveal → settle.
  - Verify: browser recording of a generate; reduced-motion run shows no animation.
  - Files: `Feed/ShimmerCard.vue`, `CreationCard.vue`, `CreationsFeed.vue`
- [ ] **T6.2** Micro-interactions: chip hover/press, popover + flyout transitions, generate-arrow press feedback, card hover lift, nav active transition — all `prefers-reduced-motion` gated.
  - AC: every interactive element has hover/active/focus states; motion audit vs DESIGN.md.
  - Verify: browser pass over each element; a11y focus-ring check.
  - Files: composer/picker/feed/header components (styles only)

🔶 **CHECKPOINT 3 — human review: wow factor & motion taste.**

## Phase 7 — Cleanup & verify

- [ ] **T7.1** Delete dead v1 files: `DashboardShell.vue`, `ControlRail/*`, `Canvas/ResultCanvas.vue`, dashboard `ResultColumn` usage, `Header/Tabs.vue` (if fully absorbed), old `AppHeader.vue` + their tests; replace `useDisplay` in `Dashboard.vue` with a media-query composable (drop the Vuetify exception).
  - AC: zero unreferenced Dashboard files; no Vuetify imports in Dashboard subtree.
  - Verify: `grep -r "v-\|vuetify" src/components/Dashboard src/pages/Dashboard.vue`; `bun run check`.
- [ ] **T7.2** Full verification: `bun run check`, `bun run test`, `bun run build`; keyboard + AA contrast pass; agent-browser walkthrough (generate, remix, tabs, premium toggle, mobile 390px) against spec §10 success criteria.
  - AC: all 7 success criteria demonstrably met.

## Definition of done

All tasks checked · spec §10 criteria verified in browser · no v1 leftovers · check/test/build green · three 🔶 checkpoints approved by human.
