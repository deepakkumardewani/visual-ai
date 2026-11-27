# Verified feature inventory (for the README rewrite)

These features were verified from source on 2026-11-27. Anything not listed here must not be claimed in the README.

## Product

- **Text-to-image** (`/create`)
  - 19 Replicate models across several vendors: Flux (Schnell, Dev, Pro, 1.1 Pro, Realism, Fast, 2 Dev, 2 Pro, 2 Max, Kontext Pro, Kontext Max), Pruna P-Image and Z-Image Turbo, xAI Grok Imagine and Grok Imagine Quality, ByteDance Seedream 4, Google Nano Banana 2, Nano Banana Pro and Imagen 4 Ultra, and OpenAI GPT Image 2.
  - Source: `packages/shared/src/models/registry.ts`.
  - Models cost 1 or 5 credits. Six premium models are Pro-gated (`PREMIUM_MODEL_KEYS`).
  - Options include aspect ratio, format, resolution (1K, 2K or 4K), reference images and 15 style presets.
- **Photo tools**
  - Upscale (`/create/upscale`): 7 models, including Clarity, Real-ESRGAN, Recraft, Google, and the premium Clarity Pro and Topaz.
  - Colorize (`/create/colorize`): DeOldify or DDColor.
  - Revive (`/create/revive`): GFPGAN or Restore Old Photos.
  - Remove background (`/create/remove_bg`).
  - Chained actions run on a result: `ResultNextActions.vue`.
- **Prompt AI**
  - Improve and Random use DeepSeek. Describe-image uses Anthropic.
  - Prompts are moderated, and there is an auto-enhance picker.
- **Voice prompt:** speech-to-text through xAI. Clips are capped at 60 s and the endpoint is rate-limited.
- **Saved prompts.**
- **Assets** (`/assets`): history with favorites, bulk delete and download, and collections. The history cap is 100 on free and 500 on Pro.
- **Explore** (`/explore`, `/explore/:id`): a community feed and viewer. Pro generations stay private.
- **Share:** client-side Web Share with a copy-link fallback.
- **Credits**
  - 30 signup credits.
  - Daily credits of 30 on free or 50 on Pro, reset at 00:00 UTC by cron.
  - Referral bonus of 30 credits on both sides.
- **Pricing** (`/pricing`)
  - INR credit packs: 200, 450, 960 and 2000 credits.
  - A Pro subscription at $5/month via Dodo, shown in local currency through live FX.
  - Pro perks: priority queue, private generations, premium models and a bigger history.
- **Feedback** (new): a contextual rating popup, "Send feedback" in the user menu, and an admin triage page. See `docs/feedback/spec.md`.
- **Also:** a What's New intro and tour, dark and light theme, global shortcuts, and a `/compare` page.

**Not present:** video generation, and the media studio. The media studio is planned (`agent_docs/media-studio/SPEC.md`) and belongs on the roadmap only.

## Stack

- **Tooling:** Bun 1.3.6 workspaces (`apps/web`, `apps/api`, `packages/shared`, `packages/email`) and vite-plus (`vp`).
- **Web:** Vue 3.5, Pinia, vue-router 4, Tailwind 3 (`tw-` prefix), vue-clerk, GSAP and Lenis.
- **API:** Express 4, Mongoose 8, BullMQ and ioredis.
- **Services:** Replicate SDK, Cloudinary, Clerk, Dodo Payments, Resend with React Email, and the `ai` SDK for DeepSeek and Anthropic.
- **Tests and CI:** Vitest, Playwright, and GitHub Actions CI (`.github/workflows/ci.yml`).
- **Deploy:** self-hosted VPS with nginx and Docker (Redis), via `infra/` and `apps/web/scripts/deploy.sh`.
- **Live app:** https://visual-ai.app. **Repo:** github.com/deepakkumardewani/visual-ai.

## Architecture (generation flow)

1. The web app POSTs to `/generate/image`. The API validates with zod from shared and returns 202.
2. A BullMQ queue (Pro gets priority) hands the job to a worker running `runGenerationJob`. The worker runs the moderation and enhance pipeline, calls Replicate, uploads to Cloudinary, saves to Mongo, and deducts credits atomically, only on success.
3. The job status is written to Redis. `GET /progress` streams it over SSE, and the web app listens with `useEventSource`.

## Engineering decisions worth highlighting

- A single model registry in shared drives cost, gating and input mapping, and a script syncs it against Replicate's OpenAPI.
- A fake Replicate client serves e2e users, and the Playwright paid-call guard fails any un-stubbed paid request.
- Prerendered marketing routes ship with JSON-LD.
- Payment webhooks are idempotent and order-safe, behind a provider abstraction, with live FX and geo-based currency.
- A single Pro entitlement function is mirrored by the cron filter.
- Structured pino logs and health checks.

## Brand and licensing

- **Brand:** `apps/web/public/logo.svg` (a copper "V" on `#1c1713`), plus `og-image.png`. Existing feature shots are in `apps/web/public/email/`, `public/intro/` and `public/showcase/`.
- **No LICENSE file.** The package.json files say UNLICENSED (root and web) and ISC (api). Don't add a license badge. Say "All rights reserved" or ask the owner.
- **Stale existing docs:** the old README, and `docs/ARCHITECTURE.md` §5 on credit numbers.
