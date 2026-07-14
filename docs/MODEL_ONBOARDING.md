# Model Onboarding Checklist

How to add a new Replicate model to Visual AI. The catalog lives in **two places that must stay in sync** — miss one and generation breaks silently.

Candidate models and pricing research: [MODELS_COMPARISON.md](../MODELS_COMPARISON.md).

## 1. Backend — `apps/api/src/utils/constants.ts`

- [ ] Add the model to `MODEL_IDS` with its full Replicate slug.
  - Official models (e.g. `black-forest-labs/*`): `owner/name` is enough.
  - Community models: pin the version hash — `owner/name:versionhash` (see `FLUX_REALISM`, `UPSCALE_IMAGE` for examples).
- [ ] Verify the model's input schema on Replicate. The uniform contract built by `processAIImage` in [generateRouteHelpers.ts](../apps/api/src/helpers/generateRouteHelpers.ts) sends `{ prompt, output_quality, aspect_ratio, output_format, num_outputs }`. Many newer models **do not accept this shape** (they use `resolution`, `size`, `image_input`, etc. — see MODELS_COMPARISON.md §4).
  - [ ] If the schema differs, add/extend a per-model input mapper instead of forcing the uniform payload.
  - [ ] Note the `num_outputs` exception: `FLUX_PRO` and `FLUX_1_1_PRO` omit it — check whether the new model needs the same.
- [ ] Set the credit price for the model (credits deducted per generation) so unit economics hold: `credits ≈ Replicate per-image cost × margin`.
- [ ] If the model takes a reference/input image (kontext, seedream, upscalers), wire the upload path (Cloudinary via multer) in the relevant `routes/generate.ts` endpoint.

## 2. Frontend — `apps/web/src/utils/`

- [ ] Add the key to `MODEL_IDS` in [modelIds.ts](../apps/web/src/utils/modelIds.ts) (frontend uses symbolic keys, not Replicate slugs — the API resolves the slug).
- [ ] Add a catalog entry to `MODELS` in [models.ts](../apps/web/src/utils/models.ts): `title`, `id`, `provider`, `description`, `bestAt`, `tier` (`budget` | `standard` | `premium`), `pricePerImage`, `isPro`, `iconUrl`, `companyName` (+ `featured` if it should be highlighted).
- [ ] **Pro gating**: `tier: 'premium'` models must have `isPro: true` — the model picker shows a Pro badge and redirects free users to `/pricing`. There's a test asserting isPro derivation in [models.test.ts](../apps/web/src/utils/models.test.ts).
- [ ] Add the provider icon to the assets (Cloudinary assets / `iconUrl`) if it's a new provider.

## 3. Verify

- [ ] `bun run check` and `bun run test` pass (models.test.ts validates catalog shape).
- [ ] Generate an image with the new model end-to-end: prompt → progress polling → result in history.
- [ ] Confirm credits are deducted by the expected amount.
- [ ] As a free user, confirm a premium model is locked and redirects to `/pricing`.

## Common pitfalls

- Adding the model to only one of the two `MODEL_IDS` copies.
- Forgetting the version hash on a community model (Replicate rejects the call).
- Sending `num_outputs` or `aspect_ratio` to a model that doesn't accept them (Replicate 422).
- Premium model without `isPro: true` — free users get it for free.
