# Multi-Model Image Upscaler + Model Comparison Page — SPEC

**Status:** Draft for approval
**Branch:** `feature-enhancement`
**Author:** Planning phase (spec-driven workflow)

---

## 1. Objective

Expand the image upscaler from a single hardcoded Replicate model to **six selectable
models**, exposed through the same model-picker pattern the image-generation flow already
uses, and ship a **dedicated `/compare` page** that shows a real before/after for each
model so users can judge quality before spending credits.

**Target users**

- Existing dashboard users who currently get one-size-fits-all upscaling.
- Prospective users evaluating the product — `/compare` doubles as a marketing surface.

**Why now:** different image classes (portraits, CGI, text/screenshots, low-res photos,
artwork) respond very differently to different upscalers. One model cannot serve all of
them, and users currently have no way to see quality before paying.

**Success criteria**

1. All six models are selectable in the upscaler sidebar and produce a correct result
   end-to-end (upload → progress → history), with credits deducted per model tier.
2. The sidebar shows **only shared params**; model-specific knobs use backend defaults.
3. Unsupported params are rejected with a 400 by `validateModelParams`, never a
   Replicate 422 and never a silent drop.
4. `/compare` renders 6 before/after sliders from static assets with zero Replicate
   calls at request time.

---

## 2. The central design problem (discovered during schema research)

Every one of the six models expresses "scale" with a **different param name AND a
different value type**. Verified against the live Replicate OpenAPI schemas:

| Model       | Replicate slug                     | scale param                         | accepted values            | output_format                 |
| ----------- | ---------------------------------- | ----------------------------------- | -------------------------- | ----------------------------- |
| Pruna       | `prunaai/p-image-upscale`          | `factor` (+`upscale_mode:"factor"`) | number 1–8                 | `webp\|jpg\|png`              |
| Google      | `google/upscaler`                  | `upscale_factor`                    | `"x2"\|"x4"`               | — (has `compression_quality`) |
| Clarity Pro | `philz1337x/clarity-pro-upscaler`  | `scale_factor`                      | `2\|4\|8\|16` (numbers)    | `png\|jpg`                    |
| Recraft     | `recraft-ai/recraft-crisp-upscale` | **none**                            | — (fixed)                  | —                             |
| Topaz       | `topazlabs/image-upscale`          | `upscale_factor`                    | `"None"\|"2x"\|"4x"\|"6x"` | `jpg\|png`                    |
| Real-ESRGAN | `nightmareai/real-esrgan`          | `scale`                             | number 0–10                | —                             |

**Consequence:** a per-model `inputKey` alone is insufficient — the registry's existing
pattern. We also need a **per-model value map**. The design below solves this
data-driven, with no `if (modelKey === 'X')` branches, honouring the registry contract.

Two further gaps this feature must close:

- **`imageInput` is declared but never built.** `buildModelInput()` does not map
  `imageInput` into the Replicate payload today (documented in the `model-onboarding`
  skill). Every upscaler depends on it, so it must be wired.
- **None of the six models accept a `prompt`.** The current `UPSCALE_IMAGE` entry sets
  `prompt: true` because the old clarity-upscaler took one; `clarity-**pro**` does not.
  Prompt/negative-prompt must become optional for utility models and the UI must stop
  sending them for models that reject them.

---

## 3. Scope

### In scope

- Six new `MODEL_REGISTRY` entries + `ModelKey` union additions.
- A new `scale` field type in `ModelDefinition.fields`, with value mapping.
- Wiring `imageInput` and `scale` into `buildModelInput()` / `validateModelParams()`.
- `UpscaleRequestSchema` gains a `model` field; `processUpscale` honours it.
- Parameterizing `ModelPicker.vue` so it can be reused for upscalers.
- Upscaler sidebar model picker + conditional shared-param controls.
- `/compare` page + route + static before/after assets.
- A one-off script to generate the six comparison outputs.

### Out of scope

- Per-model dynamic parameter UIs (model-specific knobs stay backend defaults).
- Live/on-demand comparison generation.
- Any change to the image-generation flow beyond making `ModelPicker` reusable.
- New pricing tiers beyond `budget|standard|premium` that already exist.
- Retiring the legacy `UPSCALE_IMAGE` entry (kept for backward compatibility).

---

## 4. Model catalogue

Pricing verified from Replicate listings. Tier assignment follows the existing
registry convention.

| Key                   | Slug (pin hash for community models)        | Price          | Tier       | Best at                                       |
| --------------------- | ------------------------------------------- | -------------- | ---------- | --------------------------------------------- |
| `UPSCALE_REAL_ESRGAN` | `nightmareai/real-esrgan:b3ef1941…`         | $0.002/img     | `budget`   | General-purpose, faces via `face_enhance`     |
| `UPSCALE_PRUNA`       | `prunaai/p-image-upscale:b998e778…`         | $0.005/img     | `budget`   | Speed (<1s), large outputs up to 128MP        |
| `UPSCALE_RECRAFT`     | `recraft-ai/recraft-crisp-upscale`          | $0.006/img     | `budget`   | Crisp/clean web + print assets                |
| `UPSCALE_GOOGLE`      | `google/upscaler`                           | $0.02/img      | `standard` | Reliable photographic 2x/4x                   |
| `UPSCALE_CLARITY_PRO` | `philz1337x/clarity-pro-upscaler:8e33eb47…` | $0.03/MP       | `premium`  | Creative photoreal, identity-preserving skin  |
| `UPSCALE_TOPAZ`       | `topazlabs/image-upscale`                   | $0.05–0.20/img | `premium`  | Professional grade; CGI, low-res, text refine |

`premium` tier automatically gates behind Pro via `isPro()` — no separate flag.

**Note:** existing utility entries in the registry do **not** set `pricePerImage`;
utility credit cost is computed elsewhere. Implementation must confirm where upscale
credits are charged (`apps/api/src/utils/credit-calculator.ts`,
`apps/web/src/utils/generationCredits.ts`) and extend it per-model rather than
assuming `pricePerImage` is read.

---

## 5. Technical design

### 5.1 Shared registry — `packages/shared/src/models/`

`types.ts` — extend `ModelDefinition.fields` with a `scale` descriptor that carries both
the Replicate param name and the value mapping:

```ts
scale?: {
  inputKey: string;                          // 'factor' | 'upscale_factor' | ...
  values: Record<number, string | number>;   // canonical 2|4 -> model-native value
  extraInput?: Record<string, unknown>;      // e.g. Pruna's { upscale_mode: 'factor' }
};
```

`extraInput` covers Pruna's requirement that `upscale_mode` be `"factor"` for `factor` to
take effect — expressed as data, not a conditional.

Also make `prompt` genuinely optional on `ModelDefinition` so utility models can omit it.

Add the six keys to `CatalogModelKey` in `types.ts`, then the six `MODEL_REGISTRY`
entries in `registry.ts`. Each declares `utility: true`, `imageInput: { inputKey: 'image' }`,
and only the fields its schema actually accepts — e.g. `UPSCALE_RECRAFT` declares
**no** `scale` and **no** `outputFormat`.

### 5.2 Backend input mapping — `apps/api/src/lib/model-input.ts`

- `buildModelInput()` — add data-driven blocks:
  - `if (fields.imageInput) input[fields.imageInput.inputKey] = imageUrl;`
  - `if (fields.scale) { input[fields.scale.inputKey] = fields.scale.values[scale];
Object.assign(input, fields.scale.extraInput ?? {}); }`
- `validateModelParams()` — throw `BadRequestError` when `scale` is sent to a model with
  no `scale` field (Recraft), or when the requested value isn't a key of
  `fields.scale.values`. Mirror the existing `aspectRatio`/`numOutputs` checks.
- No per-model conditionals anywhere.

### 5.3 API surface

- `packages/shared/src/schemas/generate.ts` — `UpscaleRequestSchema` gains
  `model: z.string().optional()` (defaults to a named constant, not a magic string).
  `prompt`/`negative_prompt`/`creativity` become fully optional.
- `apps/api/src/services/generation-service.ts` — `processUpscale` resolves the model key
  from the request instead of hardcoding, validates it is a `utility` upscaler, and
  falls back to the default when absent. Reject unknown keys with 400.

### 5.4 Frontend — model picker reuse

`ModelPicker.vue` is currently hardcoded to `MODELS` and `asideStore.mode`. Refactor to
accept its data instead of reaching for it:

```ts
defineProps<{ models: Model[]; selected: Model; chip?: boolean; fallback?: Model }>();
defineEmits<{ 'update:selected': [Model] }>();
```

The existing generation call site passes `MODELS` + `v-model:selected="mode"`, keeping
behaviour identical. `ModelPickerPanel/Trigger/Option/Chip` already take props and need
no change. **This refactor must not alter generation-flow behaviour** — its existing
tests are the regression guard.

Add `UPSCALER_MODELS` to `apps/web/src/utils/models.ts` via `fromRegistry()`, with
presentation-only `title`, `provider`, `description`, `bestAt`, `iconUrl`, `companyName`.
New provider icons (Pruna, Recraft, Topaz) go in `apps/web/src/assets/models/` with
matching `PROVIDER_DISPLAY_NAMES` entries.

### 5.5 Frontend — upscaler sidebar

`UpscaleImageAside.vue`:

- Renders `<ModelPicker :models="UPSCALER_MODELS" v-model:selected="upscaleModel" />`.
- Selected model persists in `stores/aside.ts` as `upscaleModel` (separate from the
  generation `mode`).
- Reads `MODEL_REGISTRY[id].fields` to decide which shared controls to show:
  - Scale segmented control only when `fields.scale` exists → hidden for Recraft.
  - Format control only when `fields.outputFormat` exists, and its options come from
    `fields.outputFormat.values` (so Clarity Pro never offers `webp`).
  - Prompt / negative-prompt / creativity controls are **removed** — no selectable model
    accepts them.
- Premium models follow the existing `isPro` → `/pricing` redirect pattern.
- `generateStore.upscaleImage()` sends the selected model key.

### 5.6 Comparison page

- Route `/compare` (name `compare`) in `apps/web/src/router/index.ts`, lazy-loaded, public.
- `apps/web/src/pages/Compare.vue` renders six cards from a
  `apps/web/src/utils/upscalerShowcase.ts` data module: model title, provider icon,
  description, tier badge, "best at" line, and `<BeforeAfter :before :after />` reusing
  the existing `apps/web/src/components/Landing/BeforeAfter.vue`.
- Card markup lives in its own `ComparisonCard.vue` (per repo component-extraction rule).
- Each card links through to the dashboard with that model preselected.

**Source images** — six CC0/royalty-free images chosen to showcase each model's stated
strength, each downscaled to a genuinely low-res source so the upscale is visible:

| Model       | Source image subject               | Why                                  |
| ----------- | ---------------------------------- | ------------------------------------ |
| Real-ESRGAN | Portrait photo                     | Exercises `face_enhance`             |
| Pruna       | Wide landscape                     | Demonstrates speed at large output   |
| Recraft     | Product shot / logo on flat bg     | "Crisp, print-ready" claim           |
| Google      | Everyday photo                     | Reliable general photographic 2x/4x  |
| Clarity Pro | Close-up skin/texture portrait     | Identity-preserving photoreal claim  |
| Topaz       | CGI render or screenshot with text | `CGI` / `Text Refine` enhance models |

**Asset pipeline** — `apps/web/scripts/generate-upscaler-showcase.ts`, run manually
once, reads sources from `apps/web/public/showcase/upscalers/source/`, calls each model
via Replicate, writes outputs alongside, and emits the data module. Committed static
output means `/compare` makes zero API calls. The script is a dev tool, not part of the
build. Outputs must be compressed (target < 400 KB each) so the page stays fast.

---

## 6. Project structure (files touched)

**Modified**

```
packages/shared/src/models/types.ts        # scale field type, 6 keys, prompt optional
packages/shared/src/models/registry.ts     # 6 entries
packages/shared/src/schemas/generate.ts    # UpscaleRequestSchema.model
apps/api/src/lib/model-input.ts            # imageInput + scale mapping, validation
apps/api/src/services/generation-service.ts# processUpscale model resolution
apps/web/src/utils/models.ts               # UPSCALER_MODELS, provider names
apps/web/src/stores/aside.ts               # upscaleModel state
apps/web/src/stores/generate.ts            # send model key
apps/web/src/components/Dashboard/ModelPicker/ModelPicker.vue   # parameterize
apps/web/src/components/Dashboard/Sidebar/UpscaleImageAside.vue # picker + conditional controls
apps/web/src/router/index.ts               # /compare route
```

**Created**

```
apps/web/src/pages/Compare.vue
apps/web/src/components/Compare/ComparisonCard.vue
apps/web/src/utils/upscalerShowcase.ts
apps/web/src/assets/models/{pruna,recraft,topaz}.svg
apps/web/public/showcase/upscalers/**       # 6 source + 6 upscaled
apps/web/scripts/generate-upscaler-showcase.ts
```

---

## 7. Code style

Follows the repo's existing conventions and the global engineering rules:

- Registry stays the single source of truth; **no per-model conditionals** in route,
  service, or input-building layers.
- No magic strings — model keys and the default upscaler come from named constants.
- Tailwind with the `tw-` prefix, matching existing sidebar markup.
- Components stay single-responsibility; comparison card extracted rather than inlined.
- Fail fast: validate the model key and scale value at the schema/validation boundary.
- Errors logged with context; never swallowed.

---

## 8. Testing strategy

**Unit**

- `packages/shared/src/models/registry.test.ts` — all six entries present, valid slugs,
  community models carry a version hash, tiers set, `utility: true`.
- `apps/api/src/lib/model-input.test.ts` — for each model, `buildModelInput` produces the
  exact expected Replicate payload; `scale` maps to the right key **and value type**
  (`"x2"` vs `2` vs `"2x"`); Pruna also receives `upscale_mode: "factor"`; Recraft
  receives no scale key; `validateModelParams` throws 400 when scale is sent to Recraft
  or an out-of-range value is requested.
- `apps/web/src/utils/models.test.ts` — `UPSCALER_MODELS` shape, no hand-set
  `id`/`tier`/`isPro`.

**Component**

- `ModelPicker.test.ts` — existing generation tests must still pass after the props
  refactor (regression guard), plus a case driving it with `UPSCALER_MODELS`.
- `UpscaleImageAside` — scale control hidden for Recraft, format options derived from the
  registry, premium model redirects a free user to `/pricing`.

**Manual / E2E**

- Upscale one image with each of the six models: progress → result → history.
- Confirm credits deducted match the model's tier.
- Free user cannot select Clarity Pro or Topaz.
- `/compare` loads with six working sliders and makes zero network calls to the API.

**Gate:** `bun run check` and `bun run test` pass.

---

## 9. Boundaries

**Always**

- Follow `.claude/skills/model-onboarding/SKILL.md` (authoritative over the stale
  `docs/MODEL_ONBOARDING.md`).
- Verify each Replicate schema before writing a registry entry.
- Pin version hashes for community models (Pruna, Clarity Pro, Real-ESRGAN).
- Keep field handling data-driven from the registry.

**Ask first**

- Changing the default upscaler away from the current model for existing users.
- Assigning a tier that moves an upscaler behind the Pro paywall differently than
  specified in §4.
- Spending real Replicate credits to generate showcase assets (the script bills the
  project's account — roughly $0.15–0.30 total for 6 images, but confirm before running).
- Adding any dependency not already in the repo.

**Never**

- Add `if (modelKey === 'X')` branches in the service or route layer.
- Hand-set `isPro` — it derives from `tier`.
- Send a param a model's schema does not declare.
- Commit the Replicate API token or any generated `.env` content.
- Run the app server (it is always running).

---

## 10. Open questions

1. **Credit charging for utility models** — existing utility entries omit
   `pricePerImage`. Implementation must locate where upscale credits are computed and
   extend it per model. Flagged rather than guessed.
2. **Default upscaler** — spec assumes the legacy `UPSCALE_IMAGE` remains default so
   existing behaviour is unchanged. Switching the default to a cheaper/faster model
   (e.g. Pruna) is a product call, listed under "Ask first".
3. **Clarity Pro is priced per megapixel**, not per image — a 4x upscale of a large
   source can be materially more expensive than the table suggests. May warrant a scale
   cap or a cost warning.
