# Visual AI — Architecture

> AI image generation SaaS: text→image (Flux family via Replicate) plus photo utilities (upscale, colorize, restore), with a credits/subscription business model.

## 1. High-Level Overview

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  apps/web (Vue 3 SPA)   │  HTTP  │  apps/api (Express)      │
│  Vite + Tailwind +      │ ─────► │  tsx runtime, ESM        │
│  Pinia                  │        │                          │
│  Auth: vue-clerk        │        │  Auth: Clerk middleware  │
└─────────────────────────┘        └────────┬─────────────────┘
                                            │
              ┌───────────────┬─────────────┼───────────────┬──────────────┐
              ▼               ▼             ▼               ▼              ▼
         MongoDB          Redis        Replicate       Cloudinary      Razorpay
        (mongoose)     (ioredis,     (image models)   (image CDN /    (payments /
         users/images   progress/                      storage)        subscriptions)
         /payments      caching)
```

Monorepo: Bun workspaces (`apps/*`), no turbo/nx. Tooling via **vite-plus** (`vp dev|build|lint|check|test`).

## 2. Apps

### apps/web — Vue 3 SPA (`@visual-ai/web`)

- **Stack**: Vue 3 (Composition API, `<script setup>`), Vite 7 (vite-plus), Tailwind 3, Pinia, vue-router 4, GSAP + Lenis + @vueuse/motion (animation), Vitest + happy-dom.
- **Auto-imports**: `unplugin-auto-import` (Vue APIs like `ref`/`computed` are global) and `unplugin-vue-components` (components auto-registered — see `auto-imports.d.ts` / `components.d.ts`).
- **Auth**: Clerk via `vue-clerk`; router guard in [router/index.ts](apps/web/src/router/index.ts) protects `profile`.
- **Analytics**: TelemetryDeck (`appStore.sendSignal(...)`).

Key directories under [apps/web/src](apps/web/src):

| Path                                                     | Purpose                                                                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages/`                                                 | Route-level views: Landing, Dashboard, Gallery, Pricing, Profile, Signin/Signup, legal pages                                                                         |
| `components/Dashboard/`                                  | The core app UI: `Sidebar/`, `Composer/` (PromptBar, ModelChip, GenerateCTA), `ModelPicker/`, `Canvas/` (ResultCanvas, CommunityFeed), `Feed/` (UserGenerationsGrid) |
| `components/History/`                                    | Generation history: filters, image action buttons, bulk select                                                                                                       |
| `components/Header/`, `Dialogs/`, `Landing/`, `Profile/` | Shell, modals, marketing, account                                                                                                                                    |
| `components/primitives/`                                 | In-house UI primitives (playground at `/dev/primitives` in dev)                                                                                                      |
| `stores/`                                                | Pinia stores: `generate` (generation lifecycle), `history`, `user`, `app` (signals/UI), `auth`, `aside`, `dialog`                                                    |
| `composables/useFetch/`                                  | Fetch wrapper hitting `VITE_API_BASEPATH`                                                                                                                            |
| `utils/constants.ts`                                     | `MODEL_IDS` — frontend copy of the model catalog                                                                                                                     |

**Generation flow (frontend)**: PromptBar → `generateStore.generateImage()` → POST `/generate/image` with `{ jobId, userId, modelId, prompt, imageType, numOfOutputs, outputQuality, ... }` → progress polled via GET `/progress` (Redis-backed) → results land in `images` / history.

### apps/api — Express API (`@visual-ai/api`)

- **Stack**: Express 4 (ESM, `tsx watch`), Mongoose 8 (MongoDB), ioredis, Replicate SDK, Cloudinary (storage via multer-storage-cloudinary), Razorpay, Clerk backend SDK, svix (webhook verification), node-cron, nodemailer, sharp/probe-image-size.

Layout under [apps/api/src](apps/api/src):

| Path                              | Purpose                                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts` / `app.ts`             | Bootstrap, error + 404 handlers, listens on `APP_PORT`                                                                                                    |
| `routes/index.ts`                 | Mounts routers; `generate` is first (unauthenticated position), the rest behind `ClerkExpressRequireAuth`                                                 |
| `routes/generate.ts`              | POST endpoints per feature (text→image, upscale, colorize, revive) + GET `/progress`                                                                      |
| `routes/users.ts`                 | Profile, history, username/fullname update, referral, contact                                                                                             |
| `routes/credits.ts`               | Balance lookup, daily free-credit top-up                                                                                                                  |
| `routes/image.ts`                 | Favorite, delete, bulk delete                                                                                                                             |
| `routes/payments.ts`              | Razorpay order/subscription create, verify, cancel                                                                                                        |
| `webhook/index.ts`                | Clerk (svix) user webhooks + Razorpay payment webhooks                                                                                                    |
| `helpers/generateRouteHelpers.ts` | `processAIImage` — builds Replicate input `{ prompt, output_quality, aspect_ratio, output_format, num_outputs* }` (\*omitted for FLUX_PRO / FLUX_1_1_PRO) |
| `models/`                         | Mongoose schemas (see §4)                                                                                                                                 |
| `utils/constants.ts`              | `MODEL_IDS` — canonical model catalog (backend source of truth)                                                                                           |
| `utils/cronJobs.ts`               | Daily free-credit refill (to 20), monthly pro refill (+500, cap 2000)                                                                                     |
| `services/`                       | Redis service, health-check + periodic health-check, email notifications                                                                                  |
| `config/`                         | `mongo.ts`, `redis.ts`                                                                                                                                    |

## 3. Model Catalog

Defined in `MODEL_IDS` (both apps — **keep in sync**). Current Replicate models:

- Text→image: `flux-schnell` (FLUX_QUICK), `flux-dev` (FLUX_BASIC), `flux-pro` / `flux-1.1-pro` (premium, `isPro` gated), `xlabs-ai/flux-dev-realism`.
- Utilities: `clarity-upscaler` (upscale), `deoldify`/`ddcolor` (colorize), `gfpgan`/`bringing-old-photos-back-to-life` (restore).

Candidate expansion models + pricing: see [MODELS_COMPARISON.md](MODELS_COMPARISON.md). ⚠️ Several candidates break the current uniform input contract (they use `resolution`/`size`/`image_input` instead of `aspect_ratio`/`num_outputs`) — a per-model input mapper is required before adding them.

## 4. Data Model (MongoDB, embedded-document style)

- **User** ([models/user.ts](apps/api/src/models/user.ts)): `userId` (Clerk id), `userName`, `email`, `plan` (`free`|`pro`), `credits` (default 20), `monthlyCredits`, `isPro`, `subscriptionId/Status/End`, `referralCode` + `referrals`, and **embedded** `payments[]` and `history[]` (ImageObject) arrays plus `activities[]`.
- **ImageObject** ([models/image.ts](apps/api/src/models/image.ts)): `{ userId, prompt, featureType, modelName, imageType, isFavorite, images[] }` where each image carries Cloudinary public ids/URLs, dimensions, format, bytes, aspectRatio.
- **Payment** ([models/payment.ts](apps/api/src/models/payment.ts)): transactionId, amount, status, paymentMethod.

Note: history is embedded in the User document (not a separate collection queried independently) — a scaling constraint to be aware of.

## 5. Cross-Cutting Concerns

- **Auth**: Clerk end-to-end. Frontend session via vue-clerk; API validates with `ClerkExpressRequireAuth`; user lifecycle synced through svix-verified Clerk webhooks (`/webhooks/*`).
- **Credits**: generation decrements credits; free plan refilled to 20 daily, pro +500/month capped at 2000 (cron in `utils/cronJobs.ts`). Subscription webhook adds 1000 monthly / resets to 10 on cancel.
- **Payments**: Razorpay orders + subscriptions, signature verification at `/payments/verify-payment`, webhook reconciliation.
- **Progress tracking**: Replicate generation progress cached in Redis, polled by the frontend at `/progress?jobId=...`.
- **Media**: outputs uploaded to Cloudinary; frontend builds URLs from `VITE_CLOUDINARY_BASE_URL`.

## 6. Environment Variables

**API**: `APP_PORT`, `APP_SERVER`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_JWT_KEY`, `REPLICATE_API_TOKEN`, `REDIS_HOST`, `REDIS_PORT`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `EMAIL_USER`, `EMAIL_PASSWORD` (+ Mongo URI, Cloudinary creds via config).

**Web** (`VITE_*`): `API_BASEPATH`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SIGN_IN/UP_FORCE_REDIRECT_URL`, `CLOUDINARY_BASE_URL`, `CLOUDINARY_ASSETS_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_PLAN_ID`, `TELEMETRYDECK_APP_ID`, `TELEMETRYDECK_DEBUG`, `LOG_LEVEL`.

## 7. Commands

```bash
bun install           # root
bun run dev:web       # vp dev apps/web
bun run dev:api       # tsx watch (do NOT run — assumed always running)
bun run check         # typecheck (vp check)
bun run lint          # vp lint --fix
bun run test          # vitest via vp test run
```

## 8. Known Constraints / Tech Debt

- Duplicate `MODEL_IDS` constants in web and api — must be updated together.
- `history` embedded in User document limits pagination/scale.
- API uses TypeScript 4.7 with very old `axios@0.17` and `@types/node@17`; web is on TS 5.4 — version skew between apps.
- Uniform Replicate input contract will not survive new-model onboarding (see MODELS_COMPARISON.md §4).
- `routes/index.ts` applies Clerk middleware as the _second_ argument to `router.use(route, middleware)` — middleware runs after the router, so it is effectively not protecting those routes as intended.
