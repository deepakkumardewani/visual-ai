# Model Onboarding Checklist

How to add a new Replicate model to Visual AI. Model metadata lives in **one
place** — `packages/shared/src/models/registry.ts` (`MODEL_REGISTRY`) — shared
by the API and the web app via `@visual-ai/shared`. There is no longer a
separate frontend model-id file to keep in sync.

For the full walkthrough (with rationale and pitfalls), see the
`model-onboarding` skill: `.claude/skills/model-onboarding/SKILL.md`.

Candidate models and pricing research: [MODELS_COMPARISON.md](../MODELS_COMPARISON.md).

## 1. Shared registry — `packages/shared/src/models/`

- [ ] Add the model's key to `CatalogModelKey` (or `LegacyModelKey`) in
      [types.ts](../packages/shared/src/models/types.ts).
- [ ] Add an entry to `MODEL_REGISTRY` in [registry.ts](../packages/shared/src/models/registry.ts):
  - `replicateId` — the full Replicate slug.
    - Official models (e.g. `black-forest-labs/*`): `owner/name` is enough.
    - Community models: pin the version hash — `owner/name:versionhash` (see
      `FLUX_REALISM`, `UPSCALE_IMAGE` for examples).
  - `label`, `tier` (`budget` | `standard` | `premium`), `pricePerImage`
    (credits ≈ Replicate per-image cost × margin).
  - `utility: true` if it's a non-generation model (upscale/colorize/etc.).
  - `fields` — declare **only** the params the model's Replicate OpenAPI
    schema actually accepts (`aspectRatio`, `outputFormat`, `outputQuality`,
    `numOutputs`, `resolution`, `dimensions`, `imageInput`, `promptEnhance`).
    This is the capability contract that keeps unsupported params from ever
    being sent to Replicate — don't declare a field just because a similar
    model has it.
  - Do **not** set `isPro` anywhere — it's derived from `tier === 'premium'`
    by `isPro()` in the same file.

## 2. Backend input mapping — `apps/api/src/lib/model-input.ts`

- [ ] `buildModelInput()` and `validateModelParams()` currently only handle
      the `prompt`, `aspectRatio`, `outputFormat`, `outputQuality`, and
      `numOutputs` field types. If your model needs `resolution`, `dimensions`,
      or `imageInput`, you must extend both functions to map/validate that field
      — declaring it in the registry alone does **not** wire it into the
      Replicate payload.
- [ ] Keep any extension data-driven (read `fields.<field>.inputKey` from the
      registry) rather than adding a per-model `if (modelKey === 'X')` branch.
- [ ] If the model takes a reference/input image (kontext, seedream,
      upscalers), wire the upload path (Cloudinary via multer) in the relevant
      `routes/generate.ts` endpoint, following the existing
      `processUpscale`/`processColorize` pattern.

## 3. Frontend catalog — `apps/web/src/utils/models.ts`

- [ ] Add a `fromRegistry('YOUR_KEY', { ... })` entry to `MODELS` with
      presentation-only fields: `title`, `provider`, `description`, `bestAt`,
      `iconUrl`, `companyName` (+ `featured` if it should be highlighted). Do
      **not** set `id`, `tier`, `pricePerImage`, or `isPro` — `fromRegistry()`
      derives those from `MODEL_REGISTRY` so they can't drift out of sync.
- [ ] Add the provider icon to `apps/web/src/assets/models/` (and a
      `PROVIDER_DISPLAY_NAMES` entry) if it's a new provider.
- [ ] If the model exposes a field type the aside doesn't render yet
      (`resolution`, `dimensions`, `imageInput`), add the picker to
      `apps/web/src/components/Dashboard/Sidebar/ImageGenerateAside.vue` —
      it already reads `MODEL_REGISTRY[modelId].fields` to conditionally show
      aspect ratio / output format controls, follow that pattern.

## 4. Verify

- [ ] `bun run check` and `bun run test` pass (`models.test.ts` validates
      catalog shape; the `model-input` specs validate registry-driven payload
      building).
- [ ] Generate an image with the new model end-to-end: prompt → progress
      polling → result in history.
- [ ] Confirm credits are deducted by the expected amount.
- [ ] As a free user, confirm a `premium` model is locked and redirects to
      `/pricing`.
- [ ] Send a request with a param the model doesn't support and confirm the
      API returns 400 (via `validateModelParams`), not a silent drop or a
      Replicate 422.

## Common pitfalls

- Adding the registry entry but forgetting the `ModelKey` union in
  `types.ts` — TypeScript will catch this at compile time.
- Declaring `resolution`/`dimensions`/`imageInput` in `fields` without also
  wiring them into `buildModelInput` — the param is silently never sent.
- Forgetting the version hash on a community model (Replicate rejects the
  call).
- Sending `num_outputs`/`aspect_ratio`/etc. to a model that doesn't accept
  them (Replicate 422) — should be prevented by `validateModelParams`, but
  double-check the registry's `fields` match the model's actual schema.
- Manually setting `isPro` instead of letting it derive from `tier`.
