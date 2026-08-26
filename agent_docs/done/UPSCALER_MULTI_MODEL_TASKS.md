# Multi-Model Upscaler + `/compare` — Task Breakdown

**Spec:** [UPSCALER_MULTI_MODEL_SPEC.md](./UPSCALER_MULTI_MODEL_SPEC.md)
**Plan:** [UPSCALER_MULTI_MODEL_PLAN.md](./UPSCALER_MULTI_MODEL_PLAN.md)

Each phase is a **complete vertical path** — schema through to the layer that consumes it —
not a horizontal layer. A checkpoint ends each phase: stop, verify, get sign-off before
starting the next.

**Global gate for every phase:** `bun run check` and `bun run test` pass. Web tests run via
`vp test run` in `apps/web`.

---

## Dependency graph

```
P1 registry + input mapping   (no dependencies — the foundation)
        │
        ├──> P2 API end-to-end        (needs scale/imageInput mapping + entries)
        │         │
        │         └──> P4 upscaler sidebar   (needs the API to accept `model`)
        │                   ▲
        └──> P3 ModelPicker refactor ─┘       (independent of P1/P2; must precede P4)
                                  │
                                  └──> P5 /compare   (needs entries + deep-link target)
```

P3 is independent of P1 and P2 and may be done in parallel. P4 requires both P2 and P3.

---

## Phase 1 — Registry foundation + input mapping

Closes the `imageInput` gap and introduces the `scale` value map. Nothing user-visible yet;
this is the data contract everything else reads.

### T1.1 — Verify live Replicate schemas and pin version hashes ✅

For each of the six models, fetch the current OpenAPI schema from the Replicate API and
record: the exact scale param name, its accepted values and types, `output_format` values (if
any), and the image input key. Pin full version hashes for the three community models
(Pruna, Clarity Pro, Real-ESRGAN).

- **AC:** A verified table exists for all six; three full (not truncated) version hashes
  recorded. Any deviation from the spec's §2 table is called out explicitly.
- **Verify:** Compare each finding against the spec table; flag differences before writing code.
- ⚠️ Requires `REPLICATE_API_TOKEN` in the environment. Never commit it.

### T1.2 — Extend `ModelDefinition` in `packages/shared/src/models/types.ts` ✅

Add the `scale` descriptor (`inputKey`, `values`, `extraInput`), change `prompt: true` to
`prompt?: true`, and add the six keys to `CatalogModelKey`.

- **AC:** `packages/shared` typechecks. Every existing registry entry still compiles unchanged
  (all currently set `prompt: true`, so making it optional is non-breaking).
- **Verify:** `bun run check`.

### T1.3 — Add the six entries to `registry.ts` ✅

Using T1.1's verified data. Each: `utility: true`, `imageInput: { inputKey: 'image' }`,
correct `tier` and `pricePerImage`, and **only** the fields its schema declares —
`UPSCALE_RECRAFT` gets no `scale` and no `outputFormat`; `UPSCALE_PRUNA` gets
`extraInput: { upscale_mode: 'factor' }`.

- **AC:** Six entries present; no entry declares `prompt`; `isPro` is never hand-set.
- **Verify:** Extend `registry.test.ts` — all six present, slug format valid, community models
  carry a version hash, tiers match the plan's table, `utility: true`.

### T1.4 — Wire `imageInput` and `scale` into `model-input.ts` ✅

Add `imageUrl?: string` and `scale?: number` to `UserGenerationParams`; add the two
data-driven blocks to `buildModelInput()`; add the two `scale` guards to
`validateModelParams()`.

- **AC:** No `if (modelKey === …)` anywhere in the file. Models without `imageInput` or
  `scale` produce byte-identical payloads to before this change.
- **Verify:** T1.5.

### T1.5 — Create `apps/api/src/lib/model-input.test.ts` ✅

Per-model payload assertions:

| Case                          | Expectation                                    |
| ----------------------------- | ---------------------------------------------- |
| Real-ESRGAN, scale 4          | `{ image, scale: 4 }` — numeric                |
| Pruna, scale 4                | `{ image, factor: 4, upscale_mode: 'factor' }` |
| Google, scale 4               | `{ image, upscale_factor: 'x4' }` — string     |
| Clarity Pro, scale 4          | `{ image, scale_factor: 4 }` — numeric         |
| Topaz, scale 4                | `{ image, upscale_factor: '4x' }` — string     |
| Recraft, no scale             | `{ image }` — **no** scale key of any name     |
| Recraft + scale sent          | `validateModelParams` throws `BadRequestError` |
| Google, scale 8 (unsupported) | `validateModelParams` throws `BadRequestError` |
| An existing generation model  | payload unchanged from before this phase       |

- **AC:** All cases pass; value **types** are asserted (`'x4'` vs `4` vs `'4x'`), not just
  presence.
- **Verify:** `bun run test`.

> ### ▸ Checkpoint 1
>
> `bun run check` + `bun run test` green. Grep confirms zero per-model conditionals in
> `model-input.ts` and `generation-service.ts`. No user-facing change yet — nothing in the UI
> should behave differently.

---

## Phase 2 — API accepts a model and charges per tier

First end-to-end path: a request naming a model reaches the right Replicate model with the
right payload and the right credit cost.

### T2.1 — Add `TIER_CREDIT_COST` to `packages/shared` ✅

New `models/credits.ts` exporting the table from the plan (`budget` 1/2, `standard` 1/3,
`premium` 2/6), exported from the package index.

- **AC:** Single source of truth; both apps can import it.
- **Verify:** `bun run check`.

### T2.2 — Make `calculateCreditCost` tier-aware ✅

Signature becomes `calculateCreditCost(featureType, isPro, modelKey?)`. **With `modelKey`
omitted it returns exactly today's flat cost** so colorize / revive / remove-bg are untouched.
Update `apps/web/src/utils/generationCredits.ts` to read the same shared table, deleting its
duplicated local constants.

- **AC:** Existing call sites compile and behave identically. A `standard`-tier model costs
  1/3 — matching today exactly.
- **Verify:** Unit test each tier × plan combination, plus the no-`modelKey` fallback.

### T2.3 — Add `model` to `UpscaleRequestSchema` ✅

`model: z.string().optional()`; `prompt` / `negative_prompt` / `creativity` fully optional.

- **AC:** Existing upscale requests that omit `model` still validate.
- **Verify:** `bun run check`; schema unit test for both shapes.

### T2.4 — Make `processUpscale` registry-driven ✅

Resolve the model key from the request → fall back to a named `DEFAULT_UPSCALE_MODEL`
constant (`UPSCALE_IMAGE`) → assert the entry exists and is `utility` → build the payload via
`buildModelInput()` and `getModelReplicateId()`, replacing the hand-rolled `UpscaleInput`
object. Pass the resolved key to `calculateCreditCost`.

- **AC:** Unknown or non-utility key ⇒ 400 with a clear message. Errors logged with context,
  never swallowed. No magic strings.
- **Verify:** T2.5.

### T2.5 — Verify the API path end-to-end ✅

Against the already-running server, exercise: (a) `model: 'UPSCALE_REAL_ESRGAN'`,
(b) `model` omitted, (c) `model: 'NOT_A_MODEL'`, (d) `model: 'FLUX_PRO'` (a non-utility key),
(e) Recraft with a `scale` value.

- **AC:** (a) succeeds and produces an upscaled image; (b) is byte-for-byte today's behaviour;
  (c), (d), (e) all return 400 — never a Replicate 422.
- **Verify:** Confirm credits deducted for (a) = budget tier (1 pro / 2 free), and for (b) =
  standard tier (1 pro / 3 free), i.e. unchanged.

> ### ▸ Checkpoint 2
>
> Backend fully supports all six models. The UI still sends no `model`, so the dashboard
> behaves exactly as before — confirm this explicitly.

---

## Phase 3 — Parameterize `ModelPicker` (behaviour-neutral)

Deliberately isolated: this is the only phase that touches the live generation flow, so any
regression is unambiguously attributable to it.

### T3.1 — Refactor `ModelPicker.vue` to props + emit ✅

Add `models`, `selected`, `fallback` props alongside the existing `chip`; emit
`update:selected`. Remove the `MODELS` / `asideStore.mode` / `FLUX_MODES` imports. The
pro-gate reverts to `fallback` instead of the hardcoded `FLUX_MODES[1]`.

- **AC:** The component no longer imports any store or the `MODELS` array.
- **Verify:** T3.3.

### T3.2 — Update the generation call sites ✅

Pass `:models="MODELS"`, `v-model:selected="mode"`, `:fallback="FLUX_MODES[1]"`. Move the
`FLUX_PRO / FLUX_1_1_PRO → noOfOutputs = 1` rule out of the picker and into the generation
call site (or the aside store), where it belongs.

- **AC:** Every `<ModelPicker` call site updated — including the `chip` variant.
- **Verify:** Grep for `<ModelPicker` and confirm each passes the new props.

### T3.3 — Regression-guard the refactor ✅

`ModelPicker.test.ts` must pass **unmodified** except for the mount props the refactor
requires. Add a new case driving the component with a second model list.

- **AC:** All pre-existing assertions (render, popover open, keyboard nav, pro redirect,
  `noOfOutputs` behaviour) still pass.
- **Verify:** `vp test run` in `apps/web`.

> ### ▸ Checkpoint 3
>
> Manual check in the running app: the **generation** flow is visually and behaviourally
> identical — model list, chip, pro gate, keyboard nav. The upscaler is untouched so far.

---

## Phase 4 — Upscaler sidebar

The user-facing payoff: six models selectable, with controls that adapt to each model's real
schema.

### T4.1 — Add `UPSCALER_MODELS` and provider assets ✅

Six `fromRegistry()` entries in `apps/web/src/utils/models.ts` with presentation-only
overrides (`title`, `provider`, `description`, `bestAt`, `iconUrl`, `companyName`). Add
`pruna` / `recraft` / `topaz` SVGs to `apps/web/src/assets/models/` and matching
`PROVIDER_DISPLAY_NAMES` entries.

- **AC:** No hand-set `id`, `tier`, `pricePerImage`, or `isPro` — all derived.
- **Verify:** Extend `models.test.ts` — shape assertions plus "premium ⇒ `isPro === true`".

### T4.2 — Add `upscaleModel` to `stores/aside.ts` ✅

Separate from the generation `mode`, defaulting to the `UPSCALE_IMAGE`-backed entry so
existing users see no change. Add a computed exposing the selected model's registry `fields`,
following the existing `selectedModelFields` pattern.

- **AC:** Selecting an upscaler never mutates `mode`, and vice versa.
- **Verify:** Switch tools back and forth in the running app; both selections persist
  independently.

### T4.3 — Rebuild `UpscaleImageAside.vue` controls ✅

Render `<ModelPicker :models="UPSCALER_MODELS" v-model:selected="upscaleModel" />`. Derive
controls from the registry: scale segmented control only when `fields.scale` exists (options
from `Object.keys(fields.scale.values)`); format control only when `fields.outputFormat`
exists (options from its `values`). **Delete** the prompt, negative-prompt, and creativity
controls. Premium models follow the existing `isPro` → `/pricing` redirect.

- **AC:** Recraft shows no scale control. Clarity Pro's format list excludes `webp`. No
  prompt-related control remains. Credit estimate shown reflects the selected model's tier.
- **Verify:** T4.5 plus a component test — scale hidden for Recraft, format options derived
  from the registry, free user selecting a premium model redirects to `/pricing`.

### T4.4 — Send the model key from `stores/generate.ts` ✅

`upscaleImage()` includes the selected model key in its payload.

- **AC:** Network payload contains the key; the API resolves it (verified in Phase 2).
- **Verify:** DevTools Network tab on a real upscale.

### T4.5 — End-to-end manual pass

Upscale one image with **each** of the six models: progress → result → history entry.

- **AC:** All six succeed. Credits deducted match the tier table. As a free user, Clarity Pro
  and Topaz redirect to `/pricing` and cannot be used.
- **Verify:** Use the **agent-browser** skill for the browser walkthrough.

> ### ▸ Checkpoint 4
>
> The feature is shippable without `/compare`. Confirm the generation flow is still
> unaffected before proceeding.

---

## Phase 5 — `/compare` page ✅

### T5.1 — Source six low-res CC0 images ✅

Per the spec's §5 table — portrait (Real-ESRGAN), wide landscape (Pruna), product/logo on
flat background (Recraft), everyday photo (Google), close-up skin texture (Clarity Pro), CGI
render or screenshot with text (Topaz). Each downscaled enough that the upscale is obviously
visible.

- **AC:** Six CC0/royalty-free sources in `public/showcase/upscalers/source/`, each genuinely
  low-res. Licences noted.
- **Verify:** Eyeball each at full size — if the "before" already looks sharp, the slider will
  demonstrate nothing.
- **Approved deviation:** All six sources were sourced (including `google-source.jpg`), but
  Google's showcase entry is unused downstream — see T5.3.

### T5.2 — Write `apps/web/scripts/generate-upscaler-showcase.ts` ✅

Reads the sources, calls each model through Replicate with that model's registry-derived
params, writes compressed outputs alongside, and emits `utils/upscalerShowcase.ts`. A dev
tool — not wired into the build.

- **AC:** Idempotent and re-runnable per model. Reads the token from env; never logs or
  commits it. Adds no new dependency.
- **Verify:** Dry-run mode (or a single model) before the full run.

### T5.3 — Run the script ✅

Approved spend, ~$0.15–0.30 total.

- **AC:** Twelve committed assets (6 source + 6 upscaled), each output **< 400 KB**.
- **Verify:** Check file sizes; confirm each output visibly improves on its source.
- **Approved deviation:** `google/upscaler` on Replicate failed consistently server-side
  (repeated `ReadTimeout`, confirmed across 2 input methods and Replicate's own prediction
  history — not a bug in this repo's script). Flagged to the user via AskUserQuestion; user
  chose to skip Google and ship the other five. Actual committed total: **eleven assets (6
  source + 5 upscaled)**, all outputs < 400 KB.

### T5.4 — Build `Compare.vue` + `ComparisonCard.vue` + route ✅

Public lazy route named `compare` in `apps/web/src/router/index.ts`, **not** added to
`authRequiredRoutes`. `Compare.vue` maps the data module onto `ComparisonCard.vue` (extracted
per the repo's component rule) — title, provider icon, description, tier badge, "best at"
line, and `<BeforeAfter :before :after />`. Each card deep-links to the dashboard with that
model preselected.

- **AC:** Six cards render with working sliders. **Zero** network calls to the API on load.
  Card markup lives in its own component, not inlined in the page.
- **Verify:** Load `/compare` signed out via the **agent-browser** skill; drag every slider;
  confirm an empty API request list in DevTools; click a card and confirm the dashboard opens
  with that model selected.
- **Approved deviation:** Renders **five** cards (Google excluded — see T5.3). All five have
  working sliders; zero generation/upscale/Replicate calls fire on load.

---

## Final acceptance

1. All six models selectable and working end-to-end — upload → progress → result → history.
2. Credits deducted match the tier table; the default path costs exactly what it did before.
3. Free users cannot use Clarity Pro or Topaz.
4. Sidebar shows only the shared params each model's schema actually declares.
5. Unsupported params return a 400 from `validateModelParams` — never a Replicate 422, never
   a silent drop.
6. `/compare` renders six before/after sliders from static assets with zero Replicate calls.
   **Approved deviation:** renders five — Google excluded due to a confirmed, persistent
   server-side failure on Replicate's `google/upscaler` model (see T5.3).
7. The generation flow is unchanged.
8. `bun run check` and `bun run test` pass.
