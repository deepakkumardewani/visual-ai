# Multi-Model Upscaler + `/compare` — Implementation Plan

**Spec:** [UPSCALER_MULTI_MODEL_SPEC.md](./UPSCALER_MULTI_MODEL_SPEC.md)
**Tasks:** [UPSCALER_MULTI_MODEL_TASKS.md](./UPSCALER_MULTI_MODEL_TASKS.md)
**Branch:** `feature-enhancement`

---

## 1. Context

The upscaler is hardcoded to a single Replicate model. `processUpscale` in
`apps/api/src/services/generation-service.ts` bypasses the shared registry entirely and
hand-builds its Replicate payload against `philz1337x/clarity-upscaler`.

Different image classes — portraits, CGI, screenshots with text, low-res photos, artwork —
respond very differently to different upscalers, and one model cannot serve all of them.
Users also have no way to judge quality before spending credits.

This work adds **six selectable upscalers** driven entirely by the registry, and a public
**`/compare`** page showing a real before/after per model.

### Two latent bugs this closes

1. **`fields.imageInput` is dead config.** It is declared on registry entries
   (`UPSCALE_IMAGE`, `SEEDREAM_4`, `NANO_BANANA_PRO`) but `buildModelInput()`
   (`apps/api/src/lib/model-input.ts:94-125`) never maps it — it handles only `prompt`,
   `aspectRatio`, `outputFormat`, `outputQuality`, `numOutputs`. Every upscaler depends on
   it, so it must be wired.
2. **`prompt` is structurally mandatory.** `ModelDefinition.fields.prompt` is typed
   `prompt: true` (required). None of the six new models accept a prompt —
   `clarity-**pro**-upscaler` dropped it. The field must become optional.

---

## 2. The central design problem

Every one of the six models expresses "scale" with a **different param name AND a different
value type**:

| Model       | scale param                           | accepted values                        |
| ----------- | ------------------------------------- | -------------------------------------- |
| Pruna       | `factor` (+ `upscale_mode: "factor"`) | number 1–8                             |
| Google      | `upscale_factor`                      | `"x2"` \| `"x4"`                       |
| Clarity Pro | `scale_factor`                        | `2` \| `4` \| `8` \| `16` (numbers)    |
| Recraft     | — none —                              | fixed                                  |
| Topaz       | `upscale_factor`                      | `"None"` \| `"2x"` \| `"4x"` \| `"6x"` |
| Real-ESRGAN | `scale`                               | number 0–10                            |

The registry's existing per-model `inputKey` pattern (used by `numOutputs`) is **not
enough** — it renames the key but cannot retype the value. We need a per-model **value
map**, expressed as data so no `if (modelKey === 'X')` branch is ever needed.

---

## 3. Decisions

Resolved with the user against the spec's §9 "Ask first" and §10 open questions.

| Question          | Decision                                                                | Rationale                                                                                                           |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Default upscaler  | **Unchanged** — legacy `UPSCALE_IMAGE` stays default                    | Existing users see zero behaviour change; the legacy entry stays in the registry but is absent from the picker list |
| Credit charging   | **Per-tier**, derived from `ModelDefinition.tier`                       | The six models span $0.002–$0.20/img — a 100x spread that a flat rate cannot absorb                                 |
| `/compare` assets | Build the script **and run it** (~$0.15–0.30 Replicate spend, approved) | The page is worthless with placeholder images                                                                       |

### 3.1 Credit tier table

Today every transform is flat: 1 credit pro / 3 free — duplicated in
`apps/api/src/utils/credit-calculator.ts` and `apps/web/src/utils/generationCredits.ts`.

Because the default stays `UPSCALE_IMAGE` (`standard` tier), the table is **anchored so
`standard` equals today's rate**. No existing user pays more than they do now:

| Tier       | Pro | Free             |
| ---------- | --- | ---------------- |
| `budget`   | 1   | 2                |
| `standard` | 1   | 3 ← today's rate |
| `premium`  | 2   | 6                |

Defined **once** in `packages/shared` as `TIER_CREDIT_COST` and consumed by both apps,
which removes the current duplicated constants.

`calculateCreditCost(featureType, isPro, modelKey?)` — **when `modelKey` is omitted it
returns today's flat cost.** This is deliberate: colorize, revive, and remove-bg share this
function and must not be silently repriced by this feature.

---

## 4. Design

### 4.1 Registry — `packages/shared/src/models/`

**`types.ts`** — add a `scale` descriptor carrying both the param name and the value map:

```ts
scale?: {
  inputKey: string;                        // 'factor' | 'upscale_factor' | 'scale_factor' | 'scale'
  values: Record<number, string | number>; // canonical 2|4|8 -> model-native value
  extraInput?: Record<string, unknown>;    // Pruna: { upscale_mode: 'factor' }
};
```

`extraInput` encodes Pruna's requirement that `upscale_mode` be `"factor"` for `factor` to
take effect. Expressing it as data — not a conditional — is what keeps per-model branches
out of the input-building layer.

Also: `prompt: true` → `prompt?: true`, and add the six keys to `CatalogModelKey`.

**`registry.ts`** — six entries, each `utility: true` and `imageInput: { inputKey: 'image' }`,
declaring **only** the fields its OpenAPI schema actually accepts:

| Key                   | Slug                                     | Tier     | Price      | scale                           |
| --------------------- | ---------------------------------------- | -------- | ---------- | ------------------------------- |
| `UPSCALE_REAL_ESRGAN` | `nightmareai/real-esrgan:<hash>`         | budget   | $0.002     | `scale`, numbers                |
| `UPSCALE_PRUNA`       | `prunaai/p-image-upscale:<hash>`         | budget   | $0.005     | `factor` + `extraInput`         |
| `UPSCALE_RECRAFT`     | `recraft-ai/recraft-crisp-upscale`       | budget   | $0.006     | **none**                        |
| `UPSCALE_GOOGLE`      | `google/upscaler`                        | standard | $0.02      | `upscale_factor`, `"x2"`/`"x4"` |
| `UPSCALE_CLARITY_PRO` | `philz1337x/clarity-pro-upscaler:<hash>` | premium  | $0.03/MP   | `scale_factor`, numbers         |
| `UPSCALE_TOPAZ`       | `topazlabs/image-upscale`                | premium  | $0.05–0.20 | `upscale_factor`, `"2x"`/`"4x"` |

Version hashes for the three community models must be **fetched live from the Replicate API
and pinned** — the spec's hashes are truncated and unusable as written. `isPro` derives from
`tier === 'premium'`; never hand-set. `premium` therefore gates behind Pro automatically.

### 4.2 Input mapping — `apps/api/src/lib/model-input.ts`

Extend `UserGenerationParams` with `imageUrl?: string` and `scale?: number`, then add two
data-driven blocks to `buildModelInput()`, mirroring the existing `numOutputs` pattern:

```ts
if (fields.imageInput) input[fields.imageInput.inputKey] = userParams.imageUrl;
if (fields.scale && userParams.scale !== undefined) {
  input[fields.scale.inputKey] = fields.scale.values[userParams.scale];
  Object.assign(input, fields.scale.extraInput ?? {});
}
```

`validateModelParams()` gains two checks in the style of the existing `aspectRatio` ones:

- 400 when `scale` is sent to a model with no `scale` field (Recraft).
- 400 when the requested value is not a key of `fields.scale.values`.

Fail fast at the boundary — never a Replicate 422, never a silent drop.

### 4.3 API surface

- `UpscaleRequestSchema` (`packages/shared/src/schemas/generate.ts`) gains
  `model: z.string().optional()`; `prompt` / `negative_prompt` / `creativity` become fully
  optional.
- `processUpscale` resolves the key from the request → falls back to a named
  `DEFAULT_UPSCALE_MODEL` constant (no magic string) → asserts the entry exists and is
  `utility` → builds its payload via `buildModelInput()` instead of the hand-rolled
  `UpscaleInput` object. Unknown key ⇒ 400.

### 4.4 Frontend — ModelPicker reuse

`ModelPicker.vue` is hardcoded to `MODELS` and `asideStore.mode` (lines 22, 29, 61).
Parameterize it:

```ts
defineProps<{ models: Model[]; selected: Model; chip?: boolean; fallback?: Model }>();
defineEmits<{ 'update:selected': [Model] }>();
```

- The pro-gate `/pricing` redirect now reverts to `fallback` rather than the hardcoded
  `FLUX_MODES[1]`.
- The `FLUX_PRO / FLUX_1_1_PRO → noOfOutputs = 1` special case **moves to the generation
  call site** — it is meaningless for upscalers and does not belong in a shared component.
- `ModelPickerPanel` / `Trigger` / `Option` / `Chip` already take props and need no change.

**This refactor must not alter generation-flow behaviour.** The existing
`ModelPicker.test.ts` is the regression guard and must pass unmodified.

`UPSCALER_MODELS` is added to `apps/web/src/utils/models.ts` via the existing
`fromRegistry()` helper, with presentation-only overrides. New Pruna / Recraft / Topaz icons
go in `apps/web/src/assets/models/` with matching `PROVIDER_DISPLAY_NAMES` entries.

### 4.5 Frontend — upscaler sidebar

`UpscaleImageAside.vue` binds the picker to a new `upscaleModel` in `stores/aside.ts`, kept
separate from the generation `mode`. All controls derive from `MODEL_REGISTRY[id].fields`:

- **Scale** segmented control renders only when `fields.scale` exists → hidden for Recraft;
  its options are `Object.keys(fields.scale.values)`.
- **Format** control renders only when `fields.outputFormat` exists, with options from
  `fields.outputFormat.values` → Clarity Pro never offers `webp`.
- **Prompt / negative-prompt / creativity are removed** — no selectable model accepts them.

Premium models follow the existing `isPro` → `/pricing` redirect pattern.

### 4.6 `/compare`

Public lazy route matching the existing style in `apps/web/src/router/index.ts` (not added
to `authRequiredRoutes`). `Compare.vue` maps over a static `utils/upscalerShowcase.ts` data
module, rendering `ComparisonCard.vue` — extracted per the repo's component rule — each
wrapping the existing `components/Landing/BeforeAfter.vue` (`:before :after`). Zero API calls
at request time. Each card deep-links to the dashboard with that model preselected.

`apps/web/scripts/generate-upscaler-showcase.ts` is a manual dev tool, not part of the build:
reads six low-res CC0 sources from `public/showcase/upscalers/source/`, calls each model,
writes compressed outputs (<400 KB each), and emits the data module.

---

## 5. Files touched

**Modified**

```
packages/shared/src/models/types.ts          # scale field, prompt optional, 6 keys
packages/shared/src/models/registry.ts       # 6 entries
packages/shared/src/schemas/generate.ts      # UpscaleRequestSchema.model
apps/api/src/lib/model-input.ts              # imageInput + scale mapping, validation
apps/api/src/services/generation-service.ts  # processUpscale model resolution
apps/api/src/utils/credit-calculator.ts      # optional modelKey -> tier cost
apps/web/src/utils/generationCredits.ts      # reads shared TIER_CREDIT_COST
apps/web/src/utils/models.ts                 # UPSCALER_MODELS, provider names
apps/web/src/stores/aside.ts                 # upscaleModel state
apps/web/src/stores/generate.ts              # send model key
apps/web/src/components/Dashboard/ModelPicker/ModelPicker.vue
apps/web/src/components/Dashboard/Sidebar/UpscaleImageAside.vue
apps/web/src/router/index.ts                 # /compare route
```

**Created**

```
packages/shared/src/models/credits.ts        # TIER_CREDIT_COST
apps/api/src/lib/model-input.test.ts
apps/web/src/pages/Compare.vue
apps/web/src/components/Compare/ComparisonCard.vue
apps/web/src/utils/upscalerShowcase.ts
apps/web/src/assets/models/{pruna,recraft,topaz}.svg
apps/web/public/showcase/upscalers/**        # 6 source + 6 upscaled
apps/web/scripts/generate-upscaler-showcase.ts
```

---

## 6. Constraints

**Always**

- Follow `.claude/skills/model-onboarding/SKILL.md` — authoritative over the stale
  `docs/MODEL_ONBOARDING.md`.
- Verify each Replicate OpenAPI schema before writing its registry entry.
- Pin version hashes for community models (Pruna, Clarity Pro, Real-ESRGAN).
- Keep all field handling data-driven from the registry.
- Tailwind with the `tw-` prefix, matching existing sidebar markup.

**Never**

- Add `if (modelKey === 'X')` branches in the route, service, or input-building layers.
- Hand-set `isPro` — it derives from `tier`.
- Send a param a model's schema does not declare.
- Commit the Replicate API token or generated `.env` content.
- Run the app server — it is always running.

---

## 7. Risks

- **The `ModelPicker` refactor touches the live generation flow.** Isolated into its own
  phase (Phase 3) with the existing test suite as the guard, so a regression is attributable.
- **Clarity Pro is priced per megapixel**, not per image. A 4x upscale of a large source can
  materially exceed what the tier estimate implies. Flagged rather than guessed — a scale cap
  or cost warning may warrant a follow-up.
- **Live schema drift.** Every registry entry is written only after verifying the model's
  current schema; the spec's table is a starting point, not the source of truth.
- **Showcase asset quality.** If the chosen source images are not genuinely low-res, the
  sliders will show no visible difference and the page fails its purpose.
