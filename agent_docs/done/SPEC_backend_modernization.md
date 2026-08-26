# Spec: Backend Modernization Epic (visual-ai)

> Status: DRAFT — awaiting user confirmation
> Date: 2026-07-14 · Branch: `backend-migration-hono`
> Companion docs: `agent_docs/PLAN_backend_modernization.md`, `agent_docs/TASKS_backend_modernization.md` (Phase 3)

## Objective

Modernize `apps/api` and bridge it with `apps/web` after the repo merge. Five threads, one epic, executed in dependency order:

1. **T1 — Shared workspace**: a `packages/shared` Bun workspace exposing TS types, Zod schemas, and the model registry to both apps.
2. **T2 — Structured logging**: Pino replaces every `console.*` in `apps/api/src`, with request-id correlation.
3. **T3 — API refactor**: DRY sweep + real service layer in `apps/api`; helpers dissolved into services.
4. **T4 — Hono evaluation**: written migrate/stay recommendation; migrate ONLY if zero behavior change for Clerk auth, Svix/Razorpay webhooks, and Multer uploads on Bun.
5. **T5 — Model registry**: schema-driven `MODEL_REGISTRY` (bootstrapped from `MODELS_COMPARISON.md` §3–§4) driving backend validation + Replicate input construction, and frontend sidebar field visibility + `isPro` tier derivation.

**User:** solo maintainer (Deepak) + future collaborators reading the codebase.

**Why now:** repos just merged; backend structure predates the merge; new Replicate models break the current uniform-input contract (`prompt/aspect_ratio/output_format/output_quality/num_outputs` is not universal — see §4 integration notes in MODELS_COMPARISON.md).

## Assumptions (confirmed in interview)

1. Bun 1.3.6 workspaces (`apps/*`) is the monorepo tool — we extend `workspaces` to include `packages/*`; no turbo/nx added.
2. `apps/api` currently runs Express 4 via `tsx watch` (script) though root uses `bun dev` — runtime stays Bun-compatible.
3. Global Claude skills are used as-is; **no local skill installation** unless a genuine gap appears during execution.
4. MODELS_COMPARISON.md is a one-time bootstrap for the registry; the typed registry becomes the source of truth afterward. Runtime Replicate schema fetching is out of scope.
5. Onboarding the new candidate models (flux-2-_, seedream-4, nano-banana-_, gpt-image-2, etc.) is out of scope — but the registry shape MUST express their field differences so onboarding later = adding one registry entry.

## Tech Stack

- **Runtime:** Bun 1.3.6 (workspaces, package manager). API dev currently `tsx watch`.
- **API:** Express 4 (candidate: Hono 4), Mongoose 8, ioredis, Clerk (`@clerk/clerk-sdk-node`), Multer + multer-storage-cloudinary, Cloudinary v2, Razorpay, Svix (Clerk webhooks), Replicate SDK, node-cron, nodemailer, sharp.
- **Web:** Vue 3 + Tailwind + Pinia 2, vite-plus, vue-clerk.
- **New deps (T1/T2/T5):** `zod`, `pino`, `pino-http` (or `hono/logger` + pino if migrating), `pino-pretty` (dev only).

## Commands

```bash
# root (all via Bun workspaces)
bun install
bun run dev:api          # cd apps/api && bun dev
bun run dev:web          # vp dev apps/web
bun run build:api        # tsc
bun run check            # vp check (typecheck)
bun run lint             # vp lint --fix
bun run test             # vp test run

# api-local
cd apps/api && bun run type-check   # tsc --noEmit
```

NOTE: the dev server is always running — never start it; verify via type-check/tests/manual curl-equivalent (`ctx_execute` fetch).

## Project Structure (target)

```
packages/
  shared/                      # NEW — T1
    package.json               # "@visual-ai/shared", type: module
    src/
      types/                   # moved/extracted from apps/api/src/types + apps/web/src/types
        api.ts                 # request/response DTOs (generate, credits, user, payments)
        domain.ts              # IImageObject, FeatureType, RazorpayProduct, JobStatus...
      schemas/                 # Zod schemas mirroring the DTOs (single source; types via z.infer)
      models/                  # T5 — model registry
        registry.ts            # MODEL_REGISTRY: Record<ModelKey, ModelDefinition>
        types.ts               # ModelDefinition, FieldSpec, Tier
      index.ts                 # barrel export

apps/api/src/
  index.ts                     # bootstrap only (listen, signal handling)
  app.ts                       # app wiring: middleware chain, route mounting, no business logic
  config/                      # env validation (zod), mongo, redis, cloudinary init
  middlewares/                 # clerk, multer, request-id, error-handler, logger
  routes/                      # thin: parse/validate → call service → respond
  services/                    # business logic (generation, credits, users, payments, images,
                               #   cloudinary, email, health, redis-jobs)
  models/                      # mongoose models (unchanged)
  webhook/                     # clerk (svix) + razorpay webhooks (raw-body sensitive)
  lib/
    logger.ts                  # pino instance factory
    replicate.ts               # replicate client + buildModelInput(registry-driven)

apps/web/src/
  components/Dashboard/Sidebar/   # field visibility driven by registry (T5)
  stores/aside.ts / generate.ts   # consume @visual-ai/shared registry + DTO types
```

## Code Style

Existing conventions hold (4-space API, ESLint via vp, `type: module`, `.js` import suffixes in API TS). Registry example — the style bar for T5:

```ts
// packages/shared/src/models/types.ts
export type Tier = 'budget' | 'standard' | 'premium';

export interface ModelDefinition {
  key: ModelKey; // e.g. "FLUX_BASIC"
  replicateId: `${string}/${string}` | `${string}/${string}:${string}`;
  label: string; // UI display name
  tier: Tier; // isPro derives from tier === "premium"
  pricePerImage?: number; // USD, from MODELS_COMPARISON §2
  fields: {
    prompt: true; // universal
    aspectRatio?: { values: string[] };
    outputFormat?: { values: Array<'png' | 'jpg' | 'webp'> };
    outputQuality?: { min: number; max: number }; // Flux-1 family only
    numOutputs?: { max: number; inputKey: 'num_outputs' | 'max_images' | 'number_of_images' };
    resolution?: { values: string[]; inputKey: 'resolution' | 'size' | 'image_size' };
    dimensions?: { min: number; max: number }; // raw width/height models
    imageInput?: {
      inputKey: 'image' | 'image_input' | 'input_image' | 'input_images';
      max?: number;
    };
  };
}
```

Backend consumes `fields` to build the Replicate `input` object (only keys the model supports, mapped through `inputKey`); frontend consumes the same `fields` to decide which sidebar controls render. One entry per model — no per-model `if` chains anywhere else (the current `FLUX_PRO`/`FLUX_1_1_PRO` special-case in `processImage` dies here).

## Thread Details & Decisions

### T1 — packages/shared

- Add `"packages/*"` to root `workspaces`; create `@visual-ai/shared` consumed via `"@visual-ai/shared": "workspace:*"` in both apps.
- Move duplicated types: API's `src/types/index.ts` DTOs + web's `@/types/model` + web's `@/utils/constants` `MODEL_IDS` duplicate → shared.
- Zod schemas for the generate/upscale/colorize/revive request bodies; API validates with them, web infers types from them.
- Also shareable: `RAZORPAY_PRODUCTS` catalog, job-status types, feature-type enums.
- Web builds via Vite (bundles workspace source directly); API runs TS via Bun/tsx — shared package ships TS source (`"exports": { ".": "./src/index.ts" }`), no build step. Verify `tsc` build for API still works (may need `composite`/paths adjustment).

### T2 — Pino logging

- `pino` base logger in `apps/api/src/lib/logger.ts`; `pino-pretty` transport in dev, JSON in prod.
- `pino-http` middleware with `genReqId` (uuid) → every request log carries `req.id`; child loggers per module (`logger.child({ module: "generate" })`).
- Replace ALL `console.log/error/warn` in `apps/api/src` (≈40+ occurrences incl. webhook, config, cron, helpers). Delete commented-out console lines.
- Error-handler middleware logs via pino with stack + request context; fixes the current bug where ALL errors return 401 "Unauthenticated!" (app.ts:83 and index.ts) — errors get correct status codes (401 only for auth errors, 500 default).

### T3 — API refactor (framework-agnostic; lands before Hono decision)

- Dissolve `helpers/generateRouteHelpers.ts` + `helpers/userRouteHelpers.ts` into `services/` (generation-service, credit-service, ...).
- Dedupe: the four `process*` functions share job-status/credit/upload/error scaffolding → one `runGenerationJob(definition, input)` core; Cloudinary delete flows in routes/image.ts unified into cloudinary service; repeated `User.findOne + 404` guard → `getUserOrThrow`.
- Routes become thin: validate (zod from shared) → service call → typed response. Try/catch boilerplate per-route replaced by an async error wrapper + central error handler.
- Env access centralized in `config/env.ts` with zod validation (fail fast on boot).
- Fix incidental debt if touched: `typescript@4.7` → align with web (5.x), remove unused deps (`@vercel/node`, `bluebird`, `nodemon`, `ts-node`, `axios@0.17`?) — **Ask first** per boundary rules.

### T4 — Hono evaluation (decision gate, after T3)

Deliverable: `agent_docs/DECISION_hono.md` with a migrate/stay recommendation. Evaluation criteria (all must pass to migrate):

1. Clerk: `@hono/clerk-auth` (or middleware port) authenticates identically to current `clerk.ts` middleware.
2. Webhooks: Svix signature verification needs the **raw body**; Razorpay ditto. Hono's `c.req.raw`/`c.req.text()` must reproduce Express's raw-body handling exactly.
3. Uploads: Multer doesn't exist on Hono — `c.req.parseBody()` + manual Cloudinary streaming must match multer-storage-cloudinary behavior (field names, size limits, mime filtering).
4. cookie-parser, CORS allowlist, node-cron, periodic health check, SIGTERM handling all have Hono/Bun equivalents with no behavior change.
5. Bun-native `Bun.serve` via Hono measurably simplifies or speeds up dev/prod (nice-to-have, not a gate).
   If any gate fails → recommendation is **stay on Express**, T3's refactor stands as the deliverable, and migration tasks are dropped (they are isolated in TASKS so nothing else breaks).

### T5 — Model registry (depends on T1; benefits from T3/T4 outcome)

- `MODEL_REGISTRY` in `packages/shared` seeded with the **current** catalog (FLUX_QUICK/BASIC/PRO/1.1_PRO/REALISM + utility models), field specs per MODELS_COMPARISON §4 semantics, `tier` + `pricePerImage` per §2–§3.
- Backend: `buildModelInput(modelKey, userParams)` constructs the Replicate input from registry field specs (drops unsupported params, maps `inputKey` variants); request validation rejects params the model doesn't support.
- Frontend sidebar (`ImageGenerateAside.vue` + child controls): each control (`AspectRatio`, `ImageFormat`, `OutputQuality`, `ImageVariation`) renders only if the selected model's registry entry declares that field; option lists (aspect ratios, formats) come from the registry values. `isPro` gating derives from `tier === "premium"` instead of a hardcoded flag.
- Aside/generate Pinia stores read model metadata from shared registry — web's duplicate `MODEL_IDS`/`FLUX_MODES` constants deleted.
- Sidebar controls for fields current models don't have (resolution presets, image input, dimensions) are **implemented as registry-driven visibility** but naturally hidden for the current catalog — they light up when a future model entry declares them.

## Testing Strategy

- Framework: vitest via `vp test run` (workspace root). API currently has no tests — T2/T3/T5 add them.
- **Unit (required):** `buildModelInput` (per-model input construction incl. num_outputs exceptions, inputKey mapping), zod request schemas (accept/reject), credit calculation, `getUserOrThrow`.
- **Unit (web):** sidebar field-visibility computed logic per registry entry (Vue Test Utils, happy-dom — already configured).
- **Integration-ish:** route handlers with mocked services for status codes (404 user, 401 auth, 500 default) — especially the error-handler fix.
- **Manual verification (documented per task):** webhook signature check against a recorded Svix payload; upload flow; generate flow end-to-end in browser via agent-browser skill.
- Coverage bar: no numeric gate; every new service/registry function ships with tests; every task's Verify step must pass before ✅ (phase-verifier agent).

## Boundaries

- **Always:** run `bun run check` + `vp test run` before marking a task done; keep `.js` import suffixes in API; keep Bun runtime; keep behavior identical for auth/webhooks/uploads; update this spec when decisions change.
- **Ask first:** removing/upgrading dependencies (TS 4→5, dead deps), changing Mongoose schemas, changing any API response shape the web consumes, changing `.env` variable names, executing the Hono migration (gated on DECISION_hono.md sign-off).
- **Never:** run/restart the dev server; commit without explicit instruction; touch payment amounts/credit math semantics; delete failing tests; change CORS allowlist origins; log secrets/tokens (pino redact paths for auth headers).

## Success Criteria

1. `packages/shared` exists; both apps import types/schemas/registry from `@visual-ai/shared`; zero duplicated model constants between apps (`grep MODEL_IDS apps/web/src` → only shared imports).
2. `grep -rE 'console\.(log|error|warn)' apps/api/src` returns 0 matches; logs are structured JSON with `req.id` in prod, pretty in dev.
3. Generic errors no longer return 401; error handler assigns correct status codes and logs stack + request context.
4. `agent_docs/DECISION_hono.md` exists with a definitive recommendation and evidence per the five gates; if "migrate", all routes pass the same manual verification matrix as pre-migration.
5. `MODEL_REGISTRY` drives both: (a) API builds Replicate inputs with no per-model conditionals outside the registry, (b) sidebar shows/hides `AspectRatio`/`ImageFormat`/`OutputQuality`/`ImageVariation` per selected model, (c) premium gate derives from `tier`.
6. All existing user-facing flows (generate, upscale, colorize, revive, credits, payments, history, webhooks) behave identically — verified manually per the testing strategy.
7. `bun run check`, `bun run lint`, `vp test run` all green at epic end.

## Open Questions

1. **TS version bump** (api on 4.7, web on 5.4): bundle into T3 or defer? (Default: bundle, ask-first at the task.)
2. **Dead-dependency removal** (`@vercel/node`, `bluebird`, `nodemon`, `ts-node`, old `axios`): include in T3 cleanup? (Default: propose list, ask-first.)
3. **`output_quality` UX**: for models that ignore it, hide the slider (registry says so) — confirm you're OK with the slider disappearing for FLUX_PRO-class models where Replicate ignores it.
