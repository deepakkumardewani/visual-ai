# Dashboard v2 (Creen-style) — Implementation Plan

> Spec: [DASHBOARD_CREEN_SPEC.md](./DASHBOARD_CREEN_SPEC.md) · Tasks: [DASHBOARD_CREEN_TASKS.md](./DASHBOARD_CREEN_TASKS.md)

## 1. Strategy

v1 already did the hard de-Vuetify work; v2 is a **restructure, not a rewrite**. Reuse everything below the layout: Popover, SegmentedControl, Stepper, ProviderIcon primitives; PromptBox binding logic; ModelPicker selection/gating logic; CommunityFeed/CommunityCard; generate flow. Build the new shell (header + composer + feed) alongside v1 components, cut over `Dashboard.vue` in one commit per phase, delete v1 components only after their replacement has parity + tests.

Rule of thumb: **move logic, rebuild presentation.**

## 2. Target component architecture

```
src/components/Header/
  AppHeaderV2.vue                 # slim translucent header (replaces AppHeader on all pages)
    NavTabs.vue                   # Create / Explore / Assets → appStore.tab
    CreditsChip.vue               # extract from existing Credits.vue

src/components/Dashboard/
  Composer/
    HeroComposer.vue              # card: textarea + chip row + generate arrow
    ComposerTextarea.vue          # from ControlRail/PromptBox.vue (binding + typewriter kept)
    ComposerChip.vue              # generic chip trigger (icon + label + chevron)
    ModelChip.vue                 # ProviderIcon + name; gold border when isPro
    SettingsPopovers.vue          # aspect / quality / count / ⚙ advanced popovers
    GenerateArrow.vue             # circular CTA; ports generateImage() from GenerateButton
  ModelPickerV2/
    ModelPickerPanel.vue          # search + featured + parent list
    ModelSearchInput.vue
    FeaturedSection.vue           # flat ModelRow list
    ParentRow.vue                 # brand row, opens flyout
    ModelFlyout.vue               # side submenu (desktop) / accordion (mobile)
    ModelRow.vue                  # icon + name + desc (+ ✦ if isPro) — replaces ModelOption
  Feed/
    CreationsFeed.vue             # own generations grid; shimmer cards during load
    CreationCard.vue              # image + prompt snippet + model + actions
    ShimmerCard.vue               # loading skeleton w/ shimmer sweep
    EmptyState.vue                # headline + community picks strip (reuses CommunityCard)
  Canvas/ (kept)
    CommunityFeed.vue             # restyled; hosts Explore tab
    CommunityCard.vue

REMOVED after cutover: DashboardShell.vue, ControlRail/* (all), Canvas/ResultCanvas.vue,
Header/Tabs.vue (desktop role), ResultColumn.vue usage on dashboard.
```

## 3. Data & state

- `Model` type: add `featured?: boolean`; mark ~5–6 flagship models in `src/utils/models.ts`. Add `PROVIDER_DISPLAY_NAMES` map to `models.ts` (lift out of ModelPicker).
- Provider logos: download correct SVGs/PNGs to `src/assets/providers/`; update `providerLogos.ts` mappings; lettermark fallback unchanged.
- Stores untouched except semantics: `app.tab` → 1 Create · 2 Explore · 3 Assets.
- Own-creations feed reads the same source the History grid uses (existing history fetch), newest-first, plus in-flight shimmer entries from `generateStore.isLoading` + `asideStore.noOfOutputs`.

## 4. Phases

| Phase                     | Goal                                                                                                                                    | Verifiable outcome                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **P0 — Data & assets**    | `featured` flag, provider display-name map, correct brand logos in assets, providerLogos fixes                                          | Catalog compiles; icons render correctly in v1 picker (regression-safe)                     |
| **P1 — Header v2**        | AppHeaderV2 + NavTabs + CreditsChip; translucent styling; purple bar gone; mobile strip                                                 | All pages render new header; tab nav drives dashboard; auth/credits intact                  |
| **P2 — Hero composer**    | HeroComposer + chips + popovers + GenerateArrow; port PromptBox + generate logic; new `Dashboard.vue` layout (composer above feed area) | Generate works end-to-end from the composer; rail no longer rendered                        |
| **P3 — Feed & tabs**      | CreationsFeed + CreationCard + ShimmerCard + EmptyState; Explore = CommunityFeed; Assets = History; delete History tab                  | New result lands animated at feed top; Remix seeds composer; bulk actions live under Assets |
| **P4 — Model picker v2**  | Panel with search/featured/parent flyouts; ModelRow (icon+name+desc, ✦); wire to ModelChip                                              | Picker matches spec; gating + noOfOutputs verified by tests                                 |
| **P5 — Premium cue**      | Gold ModelChip border + composer glow on isPro selection                                                                                | Toggle premium ⇄ standard shows/removes cue; gold budget audit                              |
| **P6 — Wow pass**         | Shimmer sweep, progressive reveal, card entrance springs, chip/popover/nav micro-interactions; reduced-motion                           | Motion audit vs DESIGN.md timings; reduced-motion disables all                              |
| **P7 — Cleanup & verify** | Delete v1 components + dead tests; replace `useDisplay` w/ media composable; full a11y/keyboard pass                                    | `vp check` + `vp test run` + `vp build` green; zero dead files                              |

Dependency order: **P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7.** (P1 can run parallel with P0; P4 only needs P2's ModelChip.)

## 5. Risks & mitigations

- **Generate-flow regression while porting from GenerateButton** → move the function body verbatim first, restyle after; keep its test suite running against GenerateArrow.
- **History parity loss** (bulk ops) → History component is _moved_ (Assets tab), never rewritten in this effort.
- **Flyout usability on touch/small screens** → accordion degradation below `md`; covered by explicit AC in T4.4.
- **Header change leaks to non-Dashboard pages** → AppHeaderV2 swaps in one place; visual-check Landing/Pricing/Profile after P1.
- **Gold overuse** → single audit checklist item in P5/P7: max 3 gold moments per viewport (Upgrade btn, ModelChip, composer glow — exactly the budget).
- **Wrong brand logos again** → P0 includes a manual visual review checkpoint of every provider icon before any picker work.

## 6. Skills to apply

`incremental-implementation` per phase · `frontend-design`/`impeccable` for composer + header craft · `micro-interactions` + `animate` in P6 · `write-component-tests` throughout · `verify` (agent-browser) at each 🔶 checkpoint.

## 7. Verification per phase

Every phase: `bun run check` + `bun run test` green, plus the phase's browser check via agent-browser (screenshots at 1440px and 390px). 🔶 human checkpoints after P1, P2+P3, and P6 (visual taste calls).
