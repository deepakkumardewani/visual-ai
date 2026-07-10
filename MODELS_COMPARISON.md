# Visual-AI — Image Model Comparison & Catalog

> Research doc for expanding the model catalog in the Visual-AI UI and improving the Dashboard layout.
> Pricing & schema pulled live from the Replicate API + public model pages (Replicate). All prices in USD.
> **No code was changed** — this is reference only.

---

## 1. Current models (today)

Source: [demo-api/src/utils/constants.ts](demo-api/src/utils/constants.ts) → `MODEL_IDS`.

| Key                                    | Replicate model                               | Role                                       |
| -------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `FLUX_QUICK`                           | `black-forest-labs/flux-schnell`              | Fast text→image                            |
| `FLUX_BASIC`                           | `black-forest-labs/flux-dev`                  | Standard text→image                        |
| `FLUX_PRO`                             | `black-forest-labs/flux-pro`                  | Premium text→image (locked behind `isPro`) |
| `FLUX_1_1_PRO`                         | `black-forest-labs/flux-1.1-pro`              | Premium text→image                         |
| `FLUX_REALISM`                         | `xlabs-ai/flux-dev-realism`                   | Realism LoRA                               |
| `UPSCALE_IMAGE`                        | `philz1337x/clarity-upscaler`                 | Upscale utility                            |
| `COLORIZE_BASIC` / `COLORIZE_ADVANCED` | `deoldify` / `ddcolor`                        | Colorize utility                           |
| `REVIVE` / `OLD_PHOTOS`                | `gfpgan` / `bringing-old-photos-back-to-life` | Restore utility                            |

**How the FE feeds the BE today** (text→image path):

- UI controls: `Mode` (model), `AspectRatio`, `ImageFormat`, `OutputQuality`, `ImageVariation` (num outputs) — all in [visual-ai/src/components/Aside/](visual-ai/src/components/Aside/).
- Premium gating: items with `isPro: true` redirect non-pro users to `/pricing` (`Mode.vue`, `AspectRatio.vue`).
- BE input shape ([generateRouteHelpers.ts](demo-api/src/helpers/generateRouteHelpers.ts) `processAIImage`):
  ```ts
  input = { prompt, output_quality, aspect_ratio, output_format };
  // num_outputs added EXCEPT for FLUX_PRO / FLUX_1_1_PRO
  ```
- So the current contract assumes every model accepts `prompt`, `aspect_ratio`, `output_format`, `output_quality`, `num_outputs`. **Several new models below break this assumption** (use `resolution`/`size`/`image_input` instead) — see §4.

---

## 2. Candidate models — comparison table

Headline price = Replicate per-output price. "Typical / image" normalizes per-MP models to a 1 MP (≈1024×1024) output. ⭐ = premium tier (see §3).

| Model                                   | Tier     | Headline price      | Typical $/img (1 MP) | Best at                                     | Max res     |
| --------------------------------------- | -------- | ------------------- | -------------------- | ------------------------------------------- | ----------- |
| `prunaai/flux-fast`                     | Budget   | $5 / 1000 imgs      | **$0.005**           | Fastest Flux, batch volume                  | 1 MP        |
| `prunaai/p-image`                       | Budget   | $5 / 1000 imgs      | **$0.005**           | Sub-1s production, LoRA support             | 1440px      |
| `xai/grok-imagine-image`                | Budget   | $0.02 / img         | **$0.02**            | Cheap, simple xAI gen                       | default     |
| `prunaai/z-image-turbo`                 | Budget   | $0.02 / output MP   | **$0.02**            | Super-fast 6B model                         | 2048px      |
| `bytedance/seedream-4`                  | Standard | $0.03 / img         | **$0.03**            | 4K + single-sentence editing (most popular) | 4096px (4K) |
| `black-forest-labs/flux-2-dev`          | Standard | $0.014 / output MP  | **$0.014**           | Quality gen+edit, open-weight               | 1440px      |
| `black-forest-labs/flux-2-pro`          | Standard | $0.015 / output MP  | **$0.015**           | Quality + up to 8 reference images          | 4 MP        |
| `black-forest-labs/flux-kontext-pro`    | Standard | $0.04 / img         | **$0.04**            | SOTA prompt-based image editing             | input-bound |
| `xai/grok-imagine-image-quality`        | Standard | $0.07 / img         | **$0.07**            | Sharper xAI, better text, 2K                | 2K          |
| `google/nano-banana-2`                  | Standard | $0.067 / img (1K)   | **$0.067**           | Fast Google gen, editing, grounding         | 4K ($0.151) |
| `google/imagen-4-ultra`                 | Standard | $0.06 / img         | **$0.06**            | Photorealism, prompt adherence              | 2K          |
| `black-forest-labs/flux-2-max` ⭐       | Premium  | $0.03 / output MP   | $0.03 (4 MP = $0.12) | Highest-fidelity Flux                       | 4 MP        |
| `black-forest-labs/flux-kontext-max` ⭐ | Premium  | $0.08 / img         | **$0.08**            | Premium editing + typography                | input-bound |
| `openai/gpt-image-2` ⭐                 | Premium  | up to $0.128 / img  | **$0.128** (high)    | Instruction following, sharp text           | 4K          |
| `google/nano-banana-pro` ⭐             | Premium  | $0.15 / img (1K/2K) | **$0.15**            | Google SOTA, character consistency          | 4K (~$0.30) |

---

## 3. Premium categorization

Higher-priced / flagship models are flagged **Premium** (suggested `isPro: true` gate, mirroring today's `FLUX_PRO` handling). Threshold: ≥ ~$0.08 per typical image **or** a vendor flagship.

| Tier           | $/img band         | Models                                                                                                                        |
| -------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Budget**     | ≤ $0.02            | `flux-fast`, `p-image`, `grok-imagine-image`, `z-image-turbo`                                                                 |
| **Standard**   | $0.03 – $0.07      | `seedream-4`, `flux-2-dev`, `flux-2-pro`, `flux-kontext-pro`, `imagen-4-ultra`, `nano-banana-2`, `grok-imagine-image-quality` |
| **Premium** ⭐ | ≥ $0.08 / flagship | `flux-2-max`, `flux-kontext-max`, `gpt-image-2`, `nano-banana-pro`                                                            |

> Suggested catalog shape: add a `tier: "budget" \| "standard" \| "premium"` field and a numeric `pricePerImage` to each mode constant, so the Dashboard can show a price/tier badge and the `isPro` gate can derive from `tier === "premium"`.

---

## 4. Supported properties (schema) — what each model accepts

✅ = supported · — = not supported. Custom W×H = accepts raw `width`/`height` ints. "Edit/Ref" = accepts input image(s) for editing or reference.

| Model                      | prompt | Custom W×H   | Resolution preset      | Aspect ratio     | Output format | Edit / Ref input       | Multi-output          |
| -------------------------- | ------ | ------------ | ---------------------- | ---------------- | ------------- | ---------------------- | --------------------- |
| flux-fast                  | ✅     | —            | `image_size` (int)     | ✅ 11            | png/jpg/webp  | —                      | —                     |
| p-image                    | ✅     | ✅ 256–1440  | —                      | ✅ 8 (+custom)   | —             | LoRA weights           | —                     |
| grok-imagine-image         | ✅     | —            | —                      | ✅ 15 (+auto)    | —             | ✅ `image`             | —                     |
| z-image-turbo              | ✅     | ✅ 64–2048   | —                      | —                | png/jpg/webp  | —                      | —                     |
| seedream-4                 | ✅     | ✅ 1024–4096 | `size` 1K/2K/4K        | ✅ 8             | —             | ✅ `image_input`       | ✅ `max_images`       |
| flux-2-dev                 | ✅     | ✅ 256–1440  | —                      | ✅ 11            | webp/jpg/png  | ✅ `input_images`      | —                     |
| flux-2-pro                 | ✅     | ✅ 256–2048  | 0.5–4 MP               | ✅ 11            | webp/jpg/png  | ✅ `input_images` (×8) | —                     |
| flux-kontext-pro           | ✅     | —            | —                      | ✅ 13            | jpg/png       | ✅ `input_image`       | —                     |
| grok-imagine-image-quality | ✅     | —            | `resolution` 1k/2k     | ✅ 15            | —             | —                      | —                     |
| nano-banana-2              | ✅     | —            | `resolution` 1K/2K/4K  | ✅ 14            | jpg/png       | ✅ `image_input`       | —                     |
| imagen-4-ultra             | ✅     | —            | `image_size` 1K/2K     | ✅ 5             | jpg/png       | —                      | —                     |
| flux-2-max ⭐              | ✅     | ✅ 256–2048  | 0.5–4 MP               | ✅ 11            | webp/jpg/png  | ✅ `input_images`      | —                     |
| flux-kontext-max ⭐        | ✅     | —            | —                      | ✅ 13            | jpg/png       | ✅ `input_image`       | —                     |
| gpt-image-2 ⭐             | ✅     | —            | exact sizes via aspect | ✅ + pixel sizes | png/jpeg/webp | ✅ `input_images`      | ✅ `number_of_images` |
| nano-banana-pro ⭐         | ✅     | —            | `resolution` 1K/2K/4K  | ✅ 10            | jpg/png       | ✅ `image_input`       | —                     |

### Integration notes for Visual-AI (current contract vs. new models)

- **Drop-in (match today's `aspect_ratio` + `output_format` contract):** `flux-2-dev`, `flux-2-pro`, `flux-2-max`, `flux-fast`, `kontext-pro`, `kontext-max`, `imagen-4-ultra`, `grok-imagine-image`.
- **Need a param adapter** (no `output_format`, or use `resolution`/`size`/`image_size` instead of `aspect_ratio`): `z-image-turbo` (no aspect, uses W×H), `seedream-4` (`size`), `nano-banana-2` / `nano-banana-pro` (`resolution`, no quality), `grok-imagine-image-quality` (`resolution`).
- **`num_outputs` is not universal** — only `seedream-4` (`max_images`) and `gpt-image-2` (`number_of_images`) batch; most new models return a single image (same exception you already special-case for `FLUX_PRO`).
- **Editing-capable models** (`kontext-*`, `seedream-4`, `nano-banana-*`, `gpt-image-2`, `flux-2-*`) accept image input — these could power a future "edit / reference image" mode beyond the current text-only `Prompt`.
- **`output_quality`** (the FE `OutputQuality` slider) is only meaningful for the Flux-1 family; most new models ignore it.

---

## 5. Quick strengths summary

- **Cheapest / fastest:** `flux-fast`, `p-image` ($0.005), then `grok-imagine-image` / `z-image-turbo` ($0.02). Good free-tier / high-volume defaults.
- **Best value quality:** `seedream-4` ($0.03, 4K, editing — by far the highest run count, ~37M) and `flux-2-pro` ($0.015/MP).
- **Best editing:** `flux-kontext-pro/max`, `nano-banana-pro`, `gpt-image-2`.
- **Best photoreal / prompt adherence:** `imagen-4-ultra`, `nano-banana-pro`.
- **Best text rendering in image:** `gpt-image-2`, `flux-kontext-max`, `grok-imagine-image-quality`.
- **Flagship / premium showcase:** `nano-banana-pro` ($0.15), `gpt-image-2` ($0.128), `flux-2-max`, `flux-kontext-max`.

---

## 6. Source notes

- Schemas & descriptions: `GET https://api.replicate.com/v1/models/{model}` (`latest_version.openapi_schema`).
- Per-image prices: `billingConfig` block embedded in each public `replicate.com/{model}` page. The API's own `pricing` field returns `null` for these official models — pricing is only on the page.
- Per-MP models bill by output megapixels (and input MP for edits); flat models bill per output image. Tiered models (`gpt-image-2` by quality, `nano-banana-*` by resolution) priced at their headline tier.
