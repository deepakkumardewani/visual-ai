# Visual AI

AI image generation studio: type a prompt, pick a model (FLUX family via [Replicate](https://replicate.com)), and generate images — plus photo utilities to upscale, colorize, and restore old photos. Monetized with a freemium credit system and a Pro subscription (Razorpay).

## Overview

Bun-workspaces monorepo with two apps:

| App                    | Package          | Stack                                                                                                                                    |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/web`](apps/web) | `@visual-ai/web` | Vue 3 (Composition API), Vite 7 via [vite-plus](https://www.npmjs.com/package/vite-plus), Vuetify 3 + Tailwind, Pinia, Clerk (vue-clerk) |
| [`apps/api`](apps/api) | `@visual-ai/api` | Express 4 (ESM, tsx), MongoDB (Mongoose), Redis (ioredis), Replicate SDK, Cloudinary, Razorpay, Clerk                                    |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design, [docs/PRD.md](docs/PRD.md) for product requirements, and [docs/MODEL_ONBOARDING.md](docs/MODEL_ONBOARDING.md) for adding new models to the catalog.

## Features

- **Text → image** with FLUX models (schnell, dev, pro, 1.1-pro, realism); premium models are Pro-gated
- **Photo utilities** — upscale (clarity-upscaler), colorize (deoldify/ddcolor), restore old photos (gfpgan)
- **Live progress** — Redis-backed generation progress polling
- **History & gallery** — per-user history with favorites and bulk actions, plus a public community feed
- **Credits & billing** — daily free-credit refill, Pro subscription and one-time purchases via Razorpay
- **Auth** — Clerk end-to-end with webhook-synced user lifecycle

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- MongoDB and Redis instances (local or hosted)
- Accounts/keys for: [Replicate](https://replicate.com), [Clerk](https://clerk.com), [Cloudinary](https://cloudinary.com), [Razorpay](https://razorpay.com)

## Getting started

```bash
# 1. Install dependencies (root)
bun install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# fill in the values — see docs/ARCHITECTURE.md §6 for what each variable does

# 3. Run the apps (separate terminals)
bun run dev:api     # Express API (tsx watch)
bun run dev:web     # Vue SPA (vp dev)
```

The web app expects the API at `VITE_API_BASEPATH` (default `http://localhost:3000`).

## Scripts

| Command                                   | Description                          |
| ----------------------------------------- | ------------------------------------ |
| `bun run dev:web` / `bun run dev:api`     | Start web / API in dev mode          |
| `bun run build:web` / `bun run build:api` | Production builds                    |
| `bun run check`                           | Typecheck (`vp check`)               |
| `bun run lint`                            | Lint with autofix (`vp lint --fix`)  |
| `bun run test`                            | Run tests (Vitest via `vp test run`) |

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
