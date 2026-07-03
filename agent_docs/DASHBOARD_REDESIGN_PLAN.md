# Dashboard Redesign — Implementation Plan

> Architecture + phased strategy for [DASHBOARD_REDESIGN_SPEC.md](./DASHBOARD_REDESIGN_SPEC.md). Task checklist: [DASHBOARD_REDESIGN_TASKS.md](./DASHBOARD_REDESIGN_TASKS.md).

---

## 1. Strategy

Incremental, presentational-only rebuild. **Stores and the generate contract stay untouched**; we swap Vuetify chrome for custom components that read/write the same Pinia state. Ship in phases so each is independently verifiable and the app never breaks.

**Guiding rules**
- One responsibility per component; extract when markup > ~20 lines or it owns logic.
- New components live in `src/components/Dashboard/` (custom) to keep the old `Aside/` tree diffable until cutover.
- Tokens only from DESIGN.md via Tailwind config — no hardcoded hex in components.
- Every phase: `vp check` clean, no behavior regression, verify in browser via `agent-browser`.

---

## 2. Target component architecture

```
Dashboard.vue                     # custom shell: rail + canvas, responsive, tab switch
├─ DashboardShell.vue             # layout grid + mobile collapse
├─ ControlRail/
│  ├─ ControlRail.vue             # orchestrates sections, owns generateImage()
│  ├─ PromptBox.vue               # custom textarea + AI actions
│  │  └─ PromptAiMenu.vue         # Improve / Random / Describe popover (placeholder handlers)
│  ├─ ModelPicker.vue             # custom popover (replaces Mode.vue / v-select)
│  │  ├─ ModelPickerTrigger.vue   # selected model chip (premium-aware)
│  │  └─ ModelOption.vue          # icon + name + desc + tier badge
│  ├─ SettingsCluster.vue         # grouped aspect/format/quality/variations
│  │  ├─ SegmentedControl.vue     # reusable segmented pill (aspect, quality)
│  │  └─ Stepper.vue              # reusable +/- (variations)
│  └─ GenerateButton.vue          # gold-glow CTA + loading state
└─ Canvas/
   ├─ ResultCanvas.vue            # results when generating (wraps existing ResultColumn logic)
   └─ CommunityFeed.vue           # idle-state masonry + Remix
      └─ CommunityCard.vue        # image + author + likes + remix
```

**Shared/primitives** (reusable, token-driven): `SegmentedControl`, `Stepper`, `Popover`, `TierBadge`, `ProviderIcon`.

---

## 3. Data & state

- **Catalog:** extend `src/utils/constants.ts` → new `MODELS` (typed per spec §5) built from `MODELS_COMPARISON.md`; keep a `FLUX_MODES` alias so `aside.ts` default + `AIImageAside` keep working. Add `src/types` `Model` interface (superset of `Mode`).
- **Provider icons:** `ProviderIcon.vue` maps `provider` → real logo asset (sourced) or gradient lettermark fallback. Store logos under `src/assets/models/` or reference CDN; fallback is pure CSS.
- **Premium cue:** derive `isPremium = selectedModel.tier === 'premium'` in `ControlRail`; pass down to `ModelPickerTrigger` + `GenerateButton` for the single subtle gold cue.
- **AI prompt actions:** `src/utils/promptAi.ts` with typed placeholder async fns (`improvePrompt`, `describeImage`) returning mock after a delay — clean seam for real API. `New Random Prompt` reuses existing JSON logic.
- **Community feed:** `src/utils/communityMock.ts` typed mock array; `CommunityFeed` renders it; Remix sets `asideStore.typingPrompt`.

---

## 4. Phases

| Phase | Goal | Verifiable outcome |
| --- | --- | --- |
| **P0 — Foundation** | Token/primitive audit; confirm Tailwind tokens; build `Popover`, `SegmentedControl`, `Stepper`, `TierBadge`, `ProviderIcon` | Primitives render in isolation, tokens resolve |
| **P1 — Shell & layout** | `DashboardShell` + custom two-column layout replacing `v-tabs-window`; wire existing content in | Dashboard loads dark/custom; history + mobile still work |
| **P2 — Control rail** | `ControlRail` + `SettingsCluster` + `GenerateButton`; port generate logic; remove Vuetify from settings | Generate flow works end-to-end, no v-* in rail |
| **P3 — Model picker** | Catalog extension + `ModelPicker`; rename to "Model"; icons + descriptions + tier badges + gating | Picker matches spec; premium redirect + noOfOutputs intact |
| **P4 — AI prompt box** | `PromptBox` + `PromptAiMenu` with placeholder handlers | Improve/Random/Describe UI works; JSON fallback intact |
| **P5 — Premium cue** | Single subtle gold treatment on premium select | Toggling premium shows/removes one tasteful cue |
| **P6 — Community feed** | `CommunityFeed` idle state + Remix; results replace it on generate | Idle grid → Remix loads prompt → generate swaps to results |
| **P7 — Polish** | Micro-interactions, focus rings, reduced-motion, a11y, cleanup old `Aside` files | `vp check` + `vp build` pass; audit clean |

Dependency order: P0 → P1 → P2 → (P3, P4 parallel) → P5 → P6 → P7.

---

## 5. Skills to apply

- **ui-ux-pro-max / impeccable / frontend-design** — overall custom visual direction, avoid AI-slop.
- **layout / arrange** — rail vs canvas hierarchy, settings grouping.
- **micro-interactions / animate** — hover/press/loading feedback, premium cue, Remix.
- **vue-best-practices / vue-pinia-best-practices / typescript-best-practices** — code quality.
- **agent-browser** — visual verification each phase (NOT chrome-devtools).

---

## 6. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Breaking generate contract while removing Vuetify | Keep stores/`ImageBody` untouched; port logic verbatim into `ControlRail` |
| Premium cue drifting into "tacky" | Enforce single cue rule; review against DESIGN.md gold budget (≤3/viewport) |
| Real logos unavailable/licensing | Gradient lettermark fallback via `ProviderIcon`; never ship broken images |
| Catalog id mismatch with backend `MODEL_IDS` | Reuse existing `MODEL_IDS`; new models kept FE-display until adapters land (spec §7) |
| Mobile/history regressions | Preserve tab logic + `xs` bar; verify each phase on mobile viewport |

---

## 7. Verification per phase

1. `vp check` clean.
2. `agent-browser` screenshot dark/light + mobile.
3. Generate a test image end-to-end (flow unbroken).
4. Reduced-motion pass (no motion, content intact).
5. No Vuetify presentational components remain in touched subtree.
