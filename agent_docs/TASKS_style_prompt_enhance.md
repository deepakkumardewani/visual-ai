# Tasks: Style & Prompt Enhance Sidebar Controls

Plan: [PLAN_style_prompt_enhance.md](PLAN_style_prompt_enhance.md) · Spec: [/SPEC.md](../SPEC.md)

---

## Phase 1: Shared foundation

### Task 1: Style catalog + types in packages/shared

**Description:** Create the style preset catalog as the single source of truth: ~15 presets (None, 3D Render, Acrylic, Anime, Cinematic, Creative, Dynamic, Fashion, Game Concept, Graphic Design 2D, Graphic Design 3D, Illustration, Photography, Portrait, Raytraced, Stock Photo), each `{ id, label, promptSuffix }`, None with empty suffix. Derive `StyleId` union; export ordered list for UI rendering and a `getStylePreset(id)` lookup. Follow the `as const satisfies` pattern from `registry.ts`.

**Acceptance criteria:**

- [ ] `STYLE_PRESETS` exported from `packages/shared` with ≥15 entries incl. None (empty suffix) and Dynamic
- [ ] `StyleId` type derived from catalog; `getStylePreset` throws on unknown id
- [ ] Catalog test: unique ids, non-empty labels, None empty / others non-empty suffixes

**Verification:** `bun run test` (new `styles.test.ts` passes), `bun run check`

**Dependencies:** None · **Files:** `packages/shared/src/models/styles.ts`, `styles.test.ts`, `index.ts` · **Scope:** S

### Task 2: Enhance types + native-enhance registry hook

**Description:** Add `EnhanceMode = 'on' | 'off' | 'auto'` (+ `ENHANCE_MODES` constant) to shared types, and optional `promptEnhance?: { inputKey: string }` to `ModelDefinition.fields` as the future native pass-through hook (no registry entry uses it yet).

**Acceptance criteria:**

- [ ] `EnhanceMode` + `ENHANCE_MODES` exported from `packages/shared`
- [ ] `ModelDefinition.fields.promptEnhance` optional field compiles; registry unchanged
- [ ] Existing registry tests still pass

**Verification:** `bun run test`, `bun run check`

**Dependencies:** None · **Files:** `packages/shared/src/models/types.ts`, `index.ts` · **Scope:** XS

## Checkpoint 1 — Foundation

- [ ] `bun run test` and `bun run check` clean

---

## Phase 2: API pipeline (core risk — build before UI)

### Task 3: Provider-agnostic prompt enhancer

**Description:** Add `ai` + `@ai-sdk/deepseek` to `apps/api`. Create `apps/api/src/lib/prompt-enhancer.ts`: a model factory (env-driven: `DEEPSEEK_API_KEY`, optional `ENHANCE_MODEL`) isolated from `enhancePrompt(prompt): Promise<string>` which calls `generateText` with a tight "expand, don't reinterpret" system prompt and ~8s `AbortSignal.timeout`. Include `shouldEnhance(prompt)` using `AUTO_ENHANCE_WORD_THRESHOLD = 12`.

**Acceptance criteria:**

- [ ] Provider construction confined to one factory function; rest of module provider-agnostic
- [ ] `shouldEnhance`: true for <12 words, false at ≥12 (boundary tested), false for empty/whitespace
- [ ] `enhancePrompt` returns trimmed rewritten text; errors propagate (fallback handled by pipeline)

**Verification:** `bun run test` (unit tests with mocked `generateText`), `bun run check`

**Dependencies:** None · **Files:** `apps/api/package.json`, `apps/api/src/lib/prompt-enhancer.ts`, `prompt-enhancer.test.ts` · **Scope:** S

### Task 4: Prompt pipeline with fail-open behavior

**Description:** Create `apps/api/src/lib/prompt-pipeline.ts`: `preparePrompt({ prompt, styleId, enhanceMode, modelKey }) → Promise<string>`. Order: enhance (per mode + heuristic) then `applyStyle` (append suffix, comma-joined; None/absent = no-op). If the model's registry entry has `fields.promptEnhance`, skip local enhancement (native hook). Enhancer errors are caught, logged with context, and fall back to the original prompt — never throw.

**Acceptance criteria:**

- [ ] `on` always enhances; `off`/absent never; `auto` only when `shouldEnhance` is true
- [ ] Style suffix appended for non-None styles; prompt untouched for None/absent
- [ ] Enhancer rejection ⇒ original (styled) prompt returned + error logged; generation path never throws

**Verification:** `bun run test` (pipeline tests, enhancer mocked), `bun run check`

**Dependencies:** Tasks 1, 2, 3 · **Files:** `apps/api/src/lib/prompt-pipeline.ts`, `prompt-pipeline.test.ts` · **Scope:** S

### Task 5: Wire pipeline into generation-service + validation

**Description:** Accept optional `styleId`/`enhanceMode` in the generate request body, validate them in `model-input.ts` (`validateModelParams`: reject unknown values), and call `preparePrompt` in `generation-service.ts` before `buildModelInput` for the t2i generation path only (not upscale/colorize/revive paths).

**Acceptance criteria:**

- [ ] Request without the new fields behaves exactly as today (backward compatible)
- [ ] Unknown `styleId`/`enhanceMode` rejected with a clear validation error
- [ ] Transformed prompt is what reaches `buildModelInput`/Replicate (asserted in service test); utility paths untouched

**Verification:** `bun run test` (generation-service tests extended), `bun run check`

**Dependencies:** Task 4 · **Files:** `apps/api/src/lib/model-input.ts`, `apps/api/src/services/generation-service.ts`, their tests · **Scope:** M

## Checkpoint 2 — API pipeline (human review before UI)

- [ ] All Phase 2 tests green; `bun run check` clean
- [ ] With `DEEPSEEK_API_KEY` set, a real request with `styleId: 'dynamic', enhanceMode: 'on'` logs a rewritten+styled prompt
- [ ] Human sign-off on enhancement quality (spot-check 2–3 rewrites)

---

## Phase 3: Web UI

### Task 6: Generate store state + payload

**Description:** Add `styleId` (default `'dynamic'`) and `enhanceMode` (default `'auto'`) to `stores/generate.ts` following the existing settings pattern (incl. the same persistence mechanism used for model/aspectRatio), and include both fields in the t2i generation request payload.

**Acceptance criteria:**

- [ ] Defaults Dynamic + Auto on fresh state; values persist across reload like existing settings
- [ ] Generation payload includes `styleId` + `enhanceMode` for t2i requests only

**Verification:** `bun run test` (store test), `bun run check`

**Dependencies:** Tasks 1, 2 · **Files:** `apps/web/src/stores/generate.ts` (+ test) · **Scope:** S

### Task 7: StylePicker + PromptEnhancePicker in ImageGenerateAside

**Description:** Two new dropdown components in `Dashboard/Sidebar/`, visually consistent with `AspectRatioPicker.vue` and the screenshots: StylePicker lists all presets from the shared catalog with check on selected; PromptEnhancePicker shows On/Off/Auto with the descriptive sublabels from the screenshot. Mount both in `ImageGenerateAside.vue` only, bound to the store.

**Acceptance criteria:**

- [ ] Both dropdowns render from shared catalog/constants (no hardcoded duplicate lists), show current selection, update the store
- [ ] Present in `ImageGenerateAside`; absent from Colorize/Upscale/Revive asides
- [ ] Component tests: options render, selection emits/updates, defaults correct; `ImageGenerateAside.test.ts` extended

**Verification:** `bun run test`, `bun run check`, agent-browser check (defaults, selection persists after reload, hidden on utility asides)

**Dependencies:** Task 6 · **Files:** `StylePicker.vue`, `PromptEnhancePicker.vue`, `ImageGenerateAside.vue`, tests · **Scope:** M

## Checkpoint 3 — Final

- [ ] `bun run test` + `bun run check` clean
- [ ] Browser E2E: pick a style + enhance mode, generate, image reflects style; reload keeps selections
- [ ] Spec success criteria 1–6 all verified
