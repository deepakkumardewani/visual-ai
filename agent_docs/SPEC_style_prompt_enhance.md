# Spec: Style & Prompt Enhance Sidebar Controls

## Objective

Add two generation-shaping controls to the text-to-image sidebar (`ImageGenerateAside.vue`):

1. **Style dropdown** — ~15 curated presets (default **Dynamic**, with a **None** opt-out). Selecting a style appends curated, model-agnostic style tokens to the user's prompt before it reaches the image model.
2. **Prompt Enhance dropdown** — **On / Off / Auto** (default **Auto**). _On_ always rewrites the prompt via an LLM; _Off_ passes it through verbatim; _Auto_ rewrites only short prompts (heuristic: fewer than 12 words).

Both controls are visible **only for text-to-image models** (hidden on colorize/upscale/revive/utility asides), and persist across reloads.

**User story:** As a user, I pick "3D Render" and leave enhance on Auto; my 5-word prompt becomes a rich, styled prompt and the resulting image visibly matches the chosen aesthetic — without me hand-crafting anything.

## Tech Stack

- Existing monorepo: Bun workspaces, Vue 3 + Pinia (`apps/web`), Express API (`apps/api`), shared types/registry (`packages/shared`).
- **New:** Vercel AI SDK (`ai`) + `@ai-sdk/deepseek` in `apps/api`, wrapped behind a provider-agnostic module so the LLM is swappable via config/env.

## Commands

```
Dev web:   bun run dev:web        (server already running — do NOT start it)
Dev api:   bun run dev:api        (already running)
Test:      bun run test
Lint:      bun run lint
Typecheck: bun run check
```

## Project Structure (touched areas)

```
packages/shared/src/models/styles.ts        → NEW: style preset catalog (id, label, promptSuffix) — single source of truth
packages/shared/src/models/types.ts         → add EnhanceMode ('on'|'off'|'auto'), StyleId types; optional native-enhance hook on ModelDefinition.fields
packages/shared/src/models/index.ts         → export styles
apps/web/src/components/Dashboard/Sidebar/StylePicker.vue          → NEW dropdown component
apps/web/src/components/Dashboard/Sidebar/PromptEnhancePicker.vue  → NEW dropdown component
apps/web/src/components/Dashboard/Sidebar/ImageGenerateAside.vue   → mount both pickers
apps/web/src/stores/generate.ts             → styleId + enhanceMode state, sent with generation payload, persisted like existing settings
apps/api/src/lib/prompt-enhancer.ts         → NEW: provider-agnostic Vercel AI SDK wrapper (DeepSeek default) + shouldEnhance() heuristic
apps/api/src/lib/prompt-pipeline.ts         → NEW: applyStyle() + enhance orchestration; called before buildModelInput
apps/api/src/lib/model-input.ts             → accept styleId/enhanceMode in UserGenerationParams validation
apps/api/src/services/generation-service.ts → run prompt pipeline before dispatching to Replicate
```

## Code Style

Follow existing repo conventions (see `registry.ts` / `model-input.ts`). Example shape for the style catalog:

```ts
export const STYLE_PRESETS = {
  NONE: { id: 'none', label: 'None', promptSuffix: '' },
  DYNAMIC: {
    id: 'dynamic',
    label: 'Dynamic',
    promptSuffix: 'dynamic composition, dramatic lighting, high contrast, vivid detail',
  },
  // ...~13 more
} as const satisfies Record<string, StylePreset>;
```

- Named constants, no magic strings; typed unions derived from the catalog.
- Pure functions in the prompt pipeline (`applyStyle(prompt, styleId)` returns a new string).
- Provider wrapper exposes `enhancePrompt(prompt): Promise<string>`; DeepSeek model id and provider construction isolated in one place, selectable via env (`ENHANCE_MODEL`, `DEEPSEEK_API_KEY`).
- Enhancement failure must **not** fail generation: log with context, fall back to the original prompt.

## Testing Strategy

- Vitest via `bun run test` (existing setup: colocated `*.test.ts`).
- Unit tests: `styles` catalog integrity (unique ids, None empty, Dynamic present), `applyStyle`, `shouldEnhance` heuristic boundaries, prompt pipeline with enhancer mocked (on/off/auto paths, failure fallback).
- Component tests: pickers render options, emit selection, defaults correct; extend `ImageGenerateAside.test.ts` for visibility.
- Manual browser check via agent-browser for UX (dropdown look matching screenshots, persistence across reload).

## Boundaries

- **Always:** run `bun run test` and `bun run check` before declaring a task done; keep style catalog the single source of truth in `packages/shared`; fall back to the raw prompt on enhancer errors.
- **Ask first:** adding any dependency beyond `ai` + `@ai-sdk/deepseek`; changing the generation API request/response contract beyond adding the two optional fields; changing default presets list.
- **Never:** commit; start dev servers; call the LLM client-side; hard-fail a generation because enhancement failed; commit API keys.

## Core Risk

The enhance pipeline degrading generations (latency, mangled prompts, hard failures). First milestone: the API-side pipeline (style + enhance with mocked provider) fully unit-tested and failure-tolerant **before** any UI work.

## Success Criteria

1. Style selection changes the prompt sent to Replicate (verifiable in logs/tests); "None" leaves it untouched.
2. Enhance On always rewrites; Off never modifies; Auto rewrites only prompts < 12 words.
3. Enhancer provider swappable by changing one module/env value — no other code changes.
4. Controls hidden for utility models; visible for all t2i models; defaults Dynamic + Auto; selections survive reload.
5. Enhancement failure logs an error and generation proceeds with the original (styled) prompt.
6. All tests pass; typecheck clean.

## Open Questions

- Exact wording of the ~13 non-None/Dynamic presets (will propose a Leonardo-inspired list in PLAN; tuneable later since it's one config file).
- Whether the enhance heuristic threshold (12 words) should be configurable — default: hardcoded constant.
