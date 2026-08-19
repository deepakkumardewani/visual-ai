# Visual AI Repo Survey — Feature & UX Inventory

**Repo:** `/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai`  
**Surveyed:** 2026-08-12  
**Sources:** `docs/ARCHITECTURE.md`, `.impeccable.md`, `apps/web`, `apps/api`, `packages/shared`, `agent_docs/*`, uncommitted git status

---

## (a) Feature inventory

### Architecture (high level)

- Bun monorepo: `apps/web` (Vue 3 + Vite + Tailwind + Pinia + vue-clerk), `apps/api` (Express + tsx + Mongoose + Redis + Replicate + Cloudinary + Razorpay + Clerk), `packages/shared` (model registry, Zod schemas, credits).
- Docs: `docs/ARCHITECTURE.md` (present), `.impeccable.md` (atelier aesthetic: warm/refined/quiet).

### Pages (`apps/web/src/pages` + `apps/web/src/router/index.ts`)

| Route                                                | Page                                              |
| ---------------------------------------------------- | ------------------------------------------------- |
| `/`                                                  | Landing                                           |
| `/dashboard`                                         | Dashboard (main create/explore/history workspace) |
| `/explore/:id`                                       | ExploreImage (full viewer)                        |
| `/gallery`                                           | Gallery                                           |
| `/examples`                                          | Examples                                          |
| `/compare`                                           | Compare (upscaler before/after marketing)         |
| `/pricing`                                           | Pricing                                           |
| `/profile`                                           | Profile                                           |
| `/signin`, `/signup`                                 | Auth                                              |
| `/faqs`, `/contact`, `/terms`, `/privacy`, `/refund` | Marketing/legal                                   |
| `/dev/primitives`                                    | PrimitivesPlayground                              |

### Generation / product features

1. **Text-to-image** — multi-model catalog (Flux family + Grok Imagine, Seedream, Nano Banana, Imagen, GPT Image, etc.) via Replicate; aspect ratio, format, quality, num outputs, optional reference image.
2. **Upscale** — legacy `UPSCALE_IMAGE` + **six selectable upscalers** (Real-ESRGAN, Pruna, Recraft, Google, Clarity Pro, Topaz); tiered credits.
3. **Colorize** — basic/advanced models.
4. **Revive** (old photos).
5. **Remove background**.
6. **Credits / Pro** — daily free credits, Razorpay subscriptions/orders, LowCredits/ProUpgrade/Pricing dialogs.
7. **Prompt AI** — improve / random / describe-image (new `prompt` API).
8. **Remix** — community feed + explore viewer load prompt into Create.
9. **History / Assets** — user history grid, filter by feature, bulk favorite/delete/download.
10. **Explore** — public feed + `/explore/:id` viewer (filmstrip, remix, share).
11. **Compare** — static showcase of 6 upscalers (`/compare`).
12. **Referrals** — referral dialogs/code.

Feature switcher: `FEATURES` in `apps/web/src/utils/constants.ts` — IMAGE, UPSCALE, COLORIZE, REVIVE, REMOVE_BG (`Header/FeatureSelect.vue` + sidebar asides).

### Major UI areas

- **Dashboard:** `Composer/` (ComposerTextarea + Prompt AI), `ModelPicker/` (ModelPicker, UpscaleModelPicker, PromptAiMenu, PromptAiMenuItem), `Sidebar/` (ImageGenerateAside, UpscaleImageAside, + colorize/revive/remove-bg asides), `Canvas/` (ResultCanvas, CommunityFeed, CommunityCard, UserGenerationsGrid).
- **History:** History, Filter, ImageActionButtons, SelectActionButtons, NoResults.
- **Explore:** ImageViewer, ViewerDetails, ViewerFilmstrip, ViewerStage.
- **Compare:** ComparisonCard + `pages/Compare.vue`.
- **Dialogs:** ImageDialog, credits/pricing/premium/referral/signup/delete/colorize confirms.

### Pinia stores (`apps/web/src/stores`)

| Store               | Role                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate.ts`       | `generateImage`, `upscaleImage`, `colorizeImage`, `reviveOldImage`, `removeBgImage`; per-feature in-progress flags; `errMsg`; favoriting/deleting |
| `aside.ts`          | Active model, **upscaleModel**, prompt, aspect/format/quality/outputs, reference image                                                            |
| `history.ts`        | Search, feature filters, bulk delete/favorite/download                                                                                            |
| `explore.ts`        | Explore feed/cursor                                                                                                                               |
| `user.ts`           | Profile/credits/plan                                                                                                                              |
| `dialog.ts`         | Modal orchestration                                                                                                                               |
| `auth.ts`, `app.ts` | Auth + app shell                                                                                                                                  |

### API routes (`apps/api/src/routes`)

| Area                  | Endpoints                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate.ts`         | GET `/progress`; POST `/generate/image`, `/generate/upscale/image`, `/generate/revive/image`, `/generate/colorize/image`, `/generate/remove-bg/image` |
| `prompt.ts` **(new)** | POST `/prompt/improve`, `/prompt/random`, `/prompt/describe`                                                                                          |
| `image.ts`            | PUT favorite; DELETE single/bulk                                                                                                                      |
| `credits.ts`          | POST balance; GET daily update                                                                                                                        |
| `explore.ts`          | GET feed; GET item by id                                                                                                                              |
| `users.ts`            | Profile, history, username/fullname, referral, contact                                                                                                |
| `payments.ts`         | Razorpay order/subscription create/verify/cancel                                                                                                      |
| `healthcheck.ts`      | Health                                                                                                                                                |

Shared model registry: `packages/shared/src/models/registry.ts` (+ new `credits.ts` for `TIER_CREDIT_COST`).

---

## (b) Notable UX patterns and gaps

### Patterns observed

- **Generation flow:** Aside params → `generate` store → FormData/JSON to API → Redis progress polling (`/progress`) → history/canvas update; credit gates via LowCredits/Pro dialogs.
- **Model selection:** Shared `ModelPicker` (props/emit) for create; dedicated `UpscaleModelPicker` for upscalers; fields driven by `MODEL_REGISTRY`.
- **Prompt AI:** Popover menu on composer — Improve / Random / Describe (file upload); loading pulse on menu items (`PromptAiMenuItem.vue`).
- **History gallery:** Filter + bulk actions; per-image download/favorite/delete (`ImageActionButtons.vue`); detail via `ImageDialog.vue`.
- **Remix:** Community card + Explore viewer → loads prompt into aside / switches Create tab.
- **Share:** Native `navigator.share` in Explore viewer only (`ImageViewer.vue`).
- **Loading:** Per-feature in-progress flags; `ResultCanvas` / `ResultColumn` / CommunityFeed skeletons (`animate-pulse`, `v-skeleton-loader`).
- **Empty:** `History/NoResults.vue`; CommunityFeed empty copy (“Remix a community prompt…”); ResultCanvas empty state.
- **Keyboard:** Explore viewer nav (`useExploreViewerNav.ts`: arrows; `c`/`r` actions); Popover/FocusTrap; Stepper arrows — no global generate shortcut suite beyond composer Enter patterns.
- **Mobile:** Heavy `sm:`/`md:`/`lg:` Tailwind usage across dashboard; responsive but dashboard remains dense.
- **Design intent (`.impeccable.md`):** Atelier feel; images as artwork; chrome recedes; copper/warm accents.

### Gaps / friction

- **Share** limited to Explore; History/ImageDialog emphasize download/favorite/delete, not share.
- **Image viewer UX plan** (`agent_docs/PLAN_image_viewer_ux.md`) still notes migrating fav/download into page chrome and use-as-reference polish — partially deferred.
- **No repo-wide TODO/FIXME comments** found; debt lives in docs instead.
- **Clerk middleware mounting quirk** (ARCHITECTURE §8) — auth protection may not apply as intended on some routers.
- **History embedded in User document** — pagination/scale limit.
- Style/prompt-enhance: 6 open verification tasks remain (human sign-off, E2E, etc.).

---

## (c) In-progress / uncommitted work

Large dirty tree (~48 files, +1559/−787) centered on:

### 1. Multi-model upscaler + `/compare` (mostly marked ✅ in tasks)

- Spec/plan/tasks: `agent_docs/UPSCALER_MULTI_MODEL_{SPEC,PLAN,TASKS}.md`
- Phases 1–5 largely ✅ in task file; **T4.5 end-to-end manual pass** called out in phase text; Phase 5 compare page marked done.
- New/changed: registry upscaler entries, `packages/shared/src/models/credits.ts`, `model-input.ts` (+ tests), `generation-service` / credit-calculator, `UpscaleModelPicker.vue`, `UpscaleImageAside.vue`, `Compare.vue`, `ComparisonCard.vue`, showcase assets under `apps/web/public/showcase/upscalers/`.
- Open product questions (spec §10, decided in plan): keep legacy `UPSCALE_IMAGE` default; per-tier credits; Clarity Pro $/MP cost warning risk.

### 2. Prompt AI menus (uncommitted, actively evolving)

- New: `apps/api/src/routes/prompt.ts`, `apps/api/src/lib/prompt-actions.ts`
- Web: `PromptAiMenu.vue`, `PromptAiMenuItem.vue`, `utils/promptAi.ts` (+ tests), Composer wiring
- Related: `TASKS_style_prompt_enhance.md` — 21 done / **6 open** (live DeepSeek check, human QA, component tests, full test/check, browser E2E, spec criteria).

### 3. Other dirty / untracked noise

- `?? --full-page`, `?? --selector` (likely accidental CLI args as files)
- `.claude/skills/model-onboarding/`
- Docs: `docs/MODEL_ONBOARDING.md` updates

### Related half-built plans (docs)

- `PLAN_image_viewer_ux.md` — explore viewer polish still “later”
- `PLAN_backend_modernization.md` / Hono decision — separate modernization track

---

## (d) TODOs / FIXMEs

- **Inline `TODO`/`FIXME`/`HACK`/`WIP` in `apps|packages|docs|agent_docs`:** none found via search.
- **Documented debt** (`docs/ARCHITECTURE.md` §8):
  - Duplicate `MODEL_IDS` web/api
  - Embedded history scalability
  - API TS/axios age skew vs web
  - Uniform Replicate input contract fragility (onboarding)
  - Clerk `router.use(route, middleware)` order bug
- **Open checklist items:**
  - Style/prompt enhance: 6 unchecked verification tasks (`agent_docs/TASKS_style_prompt_enhance.md`)
  - Upscaler: Clarity Pro MP pricing UX; manual E2E confidence
  - Image viewer plan: migrate dialog chrome; use-as-reference

---

## Key file index

| Path                                                     | Why                          |
| -------------------------------------------------------- | ---------------------------- |
| `docs/ARCHITECTURE.md`                                   | System map + tech debt       |
| `.impeccable.md`                                         | Design context               |
| `apps/web/src/router/index.ts`                           | Routes                       |
| `apps/web/src/utils/constants.ts`                        | FEATURES list                |
| `apps/web/src/utils/models.ts`                           | FLUX_MODES / UPSCALER_MODELS |
| `apps/web/src/stores/{generate,aside,history}.ts`        | Core UX state                |
| `apps/api/src/routes/{generate,prompt,image,credits}.ts` | API surface                  |
| `packages/shared/src/models/{registry,credits,types}.ts` | Model SSOT                   |
| `agent_docs/UPSCALER_MULTI_MODEL_*.md`                   | In-progress epic             |
| `agent_docs/TASKS_style_prompt_enhance.md`               | Prompt AI remaining          |
| `agent_docs/PLAN_image_viewer_ux.md`                     | Viewer UX backlog            |
