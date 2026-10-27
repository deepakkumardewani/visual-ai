# Visual AI

AI image generation studio: type a prompt, pick a model (FLUX family via [Replicate](https://replicate.com)), and generate images — plus photo utilities to upscale, colorize, and restore old photos. Monetized with a freemium credit system and one-time INR credit packs (Dodo Payments).

## Overview

Bun-workspaces monorepo with two apps:

| App                    | Package          | Stack                                                                                                                        |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [`apps/web`](apps/web) | `@visual-ai/web` | Vue 3 (Composition API), Vite 7 via [vite-plus](https://www.npmjs.com/package/vite-plus), Tailwind, Pinia, Clerk (vue-clerk) |
| [`apps/api`](apps/api) | `@visual-ai/api` | Express 4 (ESM, tsx), MongoDB (Mongoose), Redis (ioredis), Replicate SDK, Cloudinary, Dodo Payments, Clerk                   |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design, [docs/PRD.md](docs/PRD.md) for product requirements, and [docs/MODEL_ONBOARDING.md](docs/MODEL_ONBOARDING.md) for adding new models to the catalog.

## Features

- **Text → image** with FLUX models (schnell, dev, pro, 1.1-pro, realism); premium models are Pro-gated
- **Photo utilities** — upscale (clarity-upscaler), colorize (deoldify/ddcolor), restore old photos (gfpgan)
- **Live progress** — Redis-backed generation progress polling
- **History & gallery** — per-user history with favorites and bulk actions, plus a public community feed
- **Credits & billing** — daily free-credit refill and one-time credit packs via Dodo Payments
- **Auth** — Clerk end-to-end with webhook-synced user lifecycle

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- [portless](https://github.com/vercel-labs/portless) (installed as a dev dependency; run `bunx portless trust` once after install)
- MongoDB and Redis instances (local or hosted)
- Accounts/keys for: [Replicate](https://replicate.com), [Clerk](https://clerk.com), [Cloudinary](https://cloudinary.com), [Dodo Payments](https://dodopayments.com) (test mode for development)

## Getting started

```bash
# 1. Install dependencies (root)
bun install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# fill in the values — see docs/ARCHITECTURE.md §6 for what each variable does

# 3. Start MongoDB (if using a local URI on :27017)
cd apps/api && docker compose up -d mongo redis

# 4. Run the apps via portless (stable HTTPS URLs)
bunx portless trust   # once: trust the local CA
bun run dev           # web + API, or dev:web / dev:api separately
```

**Local URLs (portless):** web `https://visual-ai.localhost`, API `https://api.visual-ai.localhost`. Configure `apps/web/.env.local` → `VITE_API_BASEPATH=https://api.visual-ai.localhost` (see `.env.example`).

**MongoDB `ECONNREFUSED :27017`:** the API reads `MONGO_URI` from `apps/api/.env`. That error means Mongo is not running or the URI is wrong. Use `mongodb://127.0.0.1:27017/visual-ai?directConnection=true` and start Mongo (`docker compose up -d mongo` in `apps/api`), or point `MONGO_URI` at MongoDB Atlas.

**Bypass portless:** `bun run dev:direct:web` / `dev:direct:api` (ports 3005 / 3006) and set `VITE_API_BASEPATH=http://localhost:3006`.

## Scripts

| Command                                     | Description                          |
| ------------------------------------------- | ------------------------------------ |
| `bun run dev`                               | Start web + API via portless         |
| `bun run dev:web` / `bun run dev:api`       | Start one app via portless           |
| `bun run dev:direct:web` / `dev:direct:api` | Dev without portless (fixed ports)   |
| `bun run build:web` / `bun run build:api`   | Production builds                    |
| `bun run check`                             | Typecheck (`vp check`)               |
| `bun run lint`                              | Lint with autofix (`vp lint --fix`)  |
| `bun run test`                              | Run tests (Vitest via `vp test run`) |

## Documentation

| Doc                                                  | Purpose                                                |
| ---------------------------------------------------- | ------------------------------------------------------ |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | System design, data model, env vars, known constraints |
| [docs/PRD.md](docs/PRD.md)                           | Product requirements, personas, roadmap                |
| [docs/MODEL_ONBOARDING.md](docs/MODEL_ONBOARDING.md) | Checklist for adding a Replicate model                 |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md)       | API endpoints reference                                |
| [MODELS_COMPARISON.md](MODELS_COMPARISON.md)         | Candidate model research and pricing                   |

> [!NOTE]
> The model catalog (`MODEL_IDS`) is duplicated in `apps/api/src/utils/constants.ts` and `apps/web/src/utils/modelIds.ts` — keep both in sync when adding models.
