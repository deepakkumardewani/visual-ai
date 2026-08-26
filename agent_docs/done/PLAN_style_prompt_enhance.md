# Implementation Plan: Style & Prompt Enhance Sidebar Controls

Spec: [/SPEC.md](../SPEC.md)

## Overview

Two new sidebar controls for text-to-image generation: a **Style** preset dropdown (~15 curated presets, default Dynamic) implemented as model-agnostic prompt-suffix tokens, and a **Prompt Enhance** dropdown (On/Off/Auto, default Auto) that rewrites prompts API-side via the Vercel AI SDK (DeepSeek default, provider-swappable). Both visible only for t2i models, persisted in the generate store.

## Architecture Decisions

- **Style catalog in `packages/shared/src/models/styles.ts`** — same `as const satisfies` pattern as `registry.ts`; typed `StyleId` union derived from it. Web renders the dropdown from it; API resolves suffixes from it. One source of truth, no drift.
- **Prompt pipeline on the API, not the client** — `apps/api/src/lib/prompt-pipeline.ts` runs `enhance → applyStyle` (enhance first, so the LLM never sees/duplicates style tokens) inside `generation-service.ts` just before `buildModelInput`. The client only ships `styleId` + `enhanceMode` fields.
- **Provider-agnostic enhancer** — `apps/api/src/lib/prompt-enhancer.ts` exposes `enhancePrompt(prompt)` built on the Vercel AI SDK `generateText`. Provider/model construction isolated in one factory reading env (`DEEPSEEK_API_KEY`, optional `ENHANCE_MODEL`). Swapping providers = editing one factory.
- **Fail-open enhancement** — any enhancer error (timeout, key missing, provider down) logs with context and falls back to the raw prompt. A generation must never fail because enhancement failed. Timeout guard (~8s) via `AbortSignal.timeout`.
- **Auto heuristic** — `shouldEnhance(prompt)`: word count < `AUTO_ENHANCE_WORD_THRESHOLD` (12), named constant in the enhancer module.
- **Optional API fields, backward compatible** — `styleId`/`enhanceMode` optional in the generate request; absent ⇒ `none`/`off` behavior, so existing clients are unaffected. Validation in `model-input.ts`'s `validateModelParams` rejects unknown values.
- **Native-enhance hook only** — add optional `fields.promptEnhance?: { inputKey: string }` to `ModelDefinition`; no registry entry uses it yet. Pipeline checks it first and defers to the model when present (future-proofing, trivially cheap now).
- **UI** — two new components `StylePicker.vue` / `PromptEnhancePicker.vue` in `Dashboard/Sidebar/`, styled after `AspectRatioPicker.vue` conventions; mounted only in `ImageGenerateAside.vue` (the other asides are utility flows), which satisfies "t2i only" without runtime capability checks. State + persistence follow the existing pattern in `stores/generate.ts`.

## Task List

### Phase 1: Shared foundation

- [ ] Task 1: Style catalog + types in packages/shared
- [ ] Task 2: Enhance types + native-enhance registry hook

**Checkpoint 1:** `bun run test` + `bun run check` clean; catalog tests pass.

### Phase 2: API pipeline (core risk)

- [ ] Task 3: Provider-agnostic prompt enhancer (Vercel AI SDK + DeepSeek)
- [ ] Task 4: Prompt pipeline (applyStyle + enhance orchestration) with fail-open behavior
- [ ] Task 5: Wire pipeline into generation-service + request validation

**Checkpoint 2:** unit tests prove on/off/auto paths, style suffixing, failure fallback; a real generation request with styleId/enhanceMode reaches Replicate with the transformed prompt (verified via logs/tests). Human review before UI.

### Phase 3: Web UI

- [ ] Task 6: Generate store state + payload (styleId, enhanceMode, persistence)
- [ ] Task 7: StylePicker + PromptEnhancePicker components mounted in ImageGenerateAside

**Checkpoint 3 (final):** all tests + typecheck pass; browser verification — dropdowns match screenshot UX, defaults Dynamic/Auto, selections survive reload, hidden on utility asides, end-to-end generation reflects chosen style.

## Dependency Graph

```
Task 1 (styles catalog) ─┬→ Task 4 (pipeline) ─→ Task 5 (service wiring)
Task 2 (types/hook) ─────┤                          │
Task 3 (enhancer) ───────┘                          │
Task 1 + Task 2 ─→ Task 6 (store) ─→ Task 7 (UI) ──┴→ final checkpoint
```

Tasks 3 and (1,2) are parallelizable; Task 6 can start once Phase 1 lands.

## Risks and Mitigations

| Risk                                         | Impact | Mitigation                                                              |
| -------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Enhancer latency/failure degrades generation | High   | Fail-open fallback + 8s timeout; Phase 2 built and tested before UI     |
| LLM rewrites drift from user intent          | Med    | Tight system prompt ("expand, don't reinterpret"); Off always available |
| Style tokens fight certain models            | Low    | Curated short suffixes; None opt-out; catalog is one tuneable file      |
| New deps (`ai`, `@ai-sdk/deepseek`)          | Low    | Only these two, per spec boundary; pinned versions                      |

## Open Questions

- Final wording of the 13 non-None/Dynamic preset suffixes — Task 1 proposes a Leonardo-inspired list; tune later in one file.
- `DEEPSEEK_API_KEY` must be provisioned in the API env before Phase 2 verification against the real provider (tests use a mock).
