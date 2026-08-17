---
name: model-onboarding
description: >
  Use this skill when adding a new Replicate image-generation (or utility) model
  to Visual AI, or when asked to "onboard a model", "add a new model", "wire up
  a model", or similar. Walks through the registry-driven architecture in
  packages/shared/src/models — the single source of truth for model metadata,
  pricing, tier/Pro gating, and which Replicate input params a model accepts.
  Ensures only params the model actually supports are ever sent to Replicate.
---

# Model Onboarding

`docs/MODEL_ONBOARDING.md` in this repo describes an older two-file architecture
(`apps/api/src/utils/constants.ts` + `apps/web/src/utils/modelIds.ts`) that **no
longer exists**. The real architecture is a single shared registry. This skill
reflects the current code — treat it as the source of truth over that doc.

## Architecture — one registry, not two

Everything about a model lives in **`packages/shared/src/models/registry.ts`**
(`MODEL_REGISTRY`), typed by **`packages/shared/src/models/types.ts`**
(`ModelDefinition`, `ModelKey`). Both the API and the web app import from
`@visual-ai/shared` — there is no separate frontend model-id file anymore.

The registry's `fields` object is the **capability contract**: it declares
exactly which Replicate input params a model accepts. Two consumers read it:

- `apps/api/src/lib/model-input.ts` → `buildModelInput()` builds the Replicate
  payload by only adding keys for fields present in the registry entry.
  `validateModelParams()` rejects (400) any request param the model doesn't
  support. **This is the "only send supported params" contract** — do not
  bypass it with per-model conditionals in the route/service layer.
- `apps/web/src/components/Dashboard/Sidebar/ImageGenerateAside.vue` reads
  `MODEL_REGISTRY[modelId].fields` to decide which pickers (aspect ratio,
  output format, etc.) to render for the selected model.

## ⚠️ Known gap — not every field type is wired end-to-end yet

`ModelDefinition.fields` supports `prompt`, `aspectRatio`, `outputFormat`,
`outputQuality`, `numOutputs`, `resolution`, `dimensions`, `imageInput`, and
`promptEnhance`. But `buildModelInput()` in `apps/api/src/lib/model-input.ts`
currently only maps **`prompt`, `aspectRatio`, `outputFormat`, `outputQuality`,
`numOutputs`**. `resolution`, `dimensions`, and `imageInput` are declared on
existing registry entries (e.g. `SEEDREAM_4`, `NANO_BANANA_PRO`) for
documentation/typing purposes but are **not yet built into the Replicate
input** by that function, and the aside has no UI for them either.

If the model you're onboarding needs one of those fields, you must extend
`buildModelInput()` (and `validateModelParams()`, and the FE picker) yourself
— declaring the field in the registry alone is not enough to make it work.
Don't skip this and assume the registry entry is sufficient.

## Steps

### 1. Get the Replicate schema

Confirm the model's input schema on Replicate before writing anything:

- Official models (`black-forest-labs/*`, `google/*`, `openai/*`, `xai/*`,
  `bytedance/*`): `owner/name` slug is enough.
- Community models: pin the version hash — `owner/name:versionhash` (see
  `FLUX_REALISM`, `UPSCALE_IMAGE` in the registry for the format).

Cross-check against `MODELS_COMPARISON.md` in the repo root for known param
shapes per model family.

### 2. Add the key — `packages/shared/src/models/types.ts`

Add the model's key to `CatalogModelKey` (or `LegacyModelKey` if it's a legacy
Flux-1 model). This is the only place the key is declared as a type.

### 3. Add the registry entry — `packages/shared/src/models/registry.ts`

Add an entry to `MODEL_REGISTRY` keyed by that same string:

- `replicateId` — the slug from step 1.
- `label`, `tier` (`budget` | `standard` | `premium`), `pricePerImage`
  (credits ≈ Replicate per-image cost × margin).
- `utility: true` if it's a non-generation model (upscale/colorize/etc.).
- `fields` — declare **only** what the model's OpenAPI schema actually
  accepts. Every field is optional except `prompt: true`. Don't declare a
  field just because a similar model has it.
  - `aspectRatio: { values: [...] }` — extract the enum from Replicate docs.
    If a model has a large enum, factor it into a named constant near the top
    of the file (follow the existing `*_ASPECT_RATIOS` pattern) rather than
    inlining it.
  - `outputFormat: { values: [...] }` — use the OpenAPI enum values verbatim;
    note some models use `jpeg` not `jpg` (see `PNG_JPEG_WEBP` vs
    `PNG_JPG_WEBP`/`JPG_PNG` constants — reuse one instead of inlining).
  - `outputQuality: { min, max }` — Flux-1 family only, most newer models
    don't have this.
  - `numOutputs: { max, inputKey }` — `inputKey` varies per model
    (`num_outputs` / `max_images` / `number_of_images`) — check the schema.
  - `resolution: { values, inputKey }`, `dimensions: { min, max }`,
    `imageInput: { inputKey, max? }`, `promptEnhance: { inputKey }` — declare
    if applicable, but see the gap warning above before relying on them.

Do **not** hand-roll `isPro` — it's derived from `tier === 'premium'` by
`isPro()`. Setting `tier: 'premium'` is sufficient; there's no separate flag
to remember.

### 4. Extend `buildModelInput` / `validateModelParams` if needed

Only required if the model needs a field type not already mapped (see the gap
section). Edit `apps/api/src/lib/model-input.ts`:

- `validateModelParams()` — add a check that throws `BadRequestError` if the
  param is sent but unsupported (mirror the existing `aspectRatio`/
  `outputQuality`/`numOutputs` checks).
- `buildModelInput()` — add an `if (fields.<field>) { input[<inputKey>] = ... }`
  block, using `fields.<field>.inputKey` for the Replicate param name so it
  stays data-driven instead of a hardcoded string.

Keep changes generic (driven by the `fields` shape), not a per-model
`if (modelKey === 'X')` branch — that reintroduces the exact per-model
conditional sprawl the registry was built to eliminate.

### 5. Add the frontend catalog entry — `apps/web/src/utils/models.ts`

Add a `fromRegistry('YOUR_KEY', { ... })` entry to the `MODELS` array with
**presentation-only** fields: `title`, `provider`, `description`, `bestAt`,
`iconUrl`, `companyName`, `featured?`. Do not set `id`, `tier`,
`pricePerImage`, or `isPro` — `fromRegistry()` derives those from the registry
so they can't drift out of sync.

If it's a new provider, add its icon to `apps/web/src/assets/models/` and an
entry to `PROVIDER_DISPLAY_NAMES` in the same file.

### 6. Wire reference-image upload if the model takes one

If `fields.imageInput` is set (kontext/seedream/grok-style editing models),
the model needs an uploaded image forwarded to Replicate. Check
`apps/web/src/components/Dashboard/Composer/ReferenceImageControl.vue` and the
relevant `apps/api/src/routes/generate.ts` endpoint for the existing
multer/Cloudinary upload pattern used by `processUpscale`/`processColorize`/etc.,
and follow the same shape — don't invent a new upload path.

### 7. Verify

- `bun run check` and `bun run test` (`apps/web/src/utils/models.test.ts` and
  `apps/api/src/lib/model-input.test.ts`-equivalent specs assert registry
  shape and input building).
- Generate an image with the new model end-to-end: prompt → progress
  polling → result in history.
- Confirm credits are deducted by the expected amount.
- As a free user, confirm a `premium` model is locked and redirects to
  `/pricing` (this falls out of `isPro()` automatically — just confirm it).
- Send a request with a param the model doesn't support and confirm the API
  returns 400 via `validateModelParams`, not a silent drop or a Replicate 422.

## Common pitfalls

- Adding the registry entry but forgetting the `ModelKey` union in
  `types.ts` — TypeScript will catch this, don't ignore the error.
- Declaring `resolution`/`dimensions`/`imageInput` in `fields` without also
  wiring them into `buildModelInput` — the param is silently never sent, and
  it looks like the model "isn't respecting" the setting when actually the
  code never built it into the payload.
- Forgetting the version hash on a community model — Replicate rejects the
  call.
- Using the wrong `inputKey` for `numOutputs`/`resolution` — check the
  model's actual OpenAPI schema, don't assume it matches a sibling model.
- Manually setting `isPro` in the frontend catalog entry instead of letting
  `fromRegistry()` derive it from `tier`.
