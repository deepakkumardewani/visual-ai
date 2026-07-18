# Tasks: Backend Modernization Epic (visual-ai)

> Source: `agent_docs/SPEC_backend_modernization.md` · Plan: `agent_docs/PLAN_backend_modernization.md`
> Legend: ⬜ todo · 🔄 in progress · ✅ done (only after phase-verifier PASS) · ⏭️ dropped
> Every task's Verify step must pass before ✅. Never run/restart the dev server.

---

## Phase 1 — Shared workspace (T1)

### ✅ Task 1.1: Scaffold `packages/shared` and prove the pipeline

**Description:** Add `"packages/*"` to root `workspaces`; create `@visual-ai/shared` (`type: module`, `"exports": { ".": "./src/index.ts" }`, no build step) with a single dummy export. Add `"@visual-ai/shared": "workspace:*"` to both apps and import the dummy export in one API file and one web file. This proves Vite bundling, tsx/Bun execution, and API `tsc` all resolve the TS-source package before any real types move.

**Acceptance criteria:**

- [ ] `bun install` links the workspace; both apps resolve `@visual-ai/shared`
- [ ] `cd apps/api && bun run type-check` and `bun run build:api` pass with the cross-package import
- [ ] `bun run check` (web typecheck) passes

**Verification:**

- [ ] `bun install && bun run check && cd apps/api && bun run type-check && bun run build`
- [ ] `grep -r "@visual-ai/shared" apps/api/src apps/web/src` shows both imports

**Dependencies:** None
**Files likely touched:** `package.json` (root), `packages/shared/package.json`, `packages/shared/src/index.ts`, one file each in `apps/api/src`, `apps/web/src`, possibly `apps/api/tsconfig.json`
**Estimated scope:** S

---

### ✅ Task 1.2: Move shared domain types and DTOs into `packages/shared`

**Description:** Extract the types duplicated between apps into `packages/shared/src/types/` (`api.ts` DTOs, `domain.ts` for `IImageObject`, `FeatureType`, `JobStatus`, `RazorpayProduct`/`RAZORPAY_PRODUCTS`, etc.). Source material: `apps/api/src/types/index.ts` and `apps/web/src/types/model.ts` + related. API-only internals (e.g. Mongoose doc types, `ClerkUserEvent`) stay in the API. Old duplicate declarations are deleted and re-imported from shared.

**Acceptance criteria:**

- [ ] Both apps import moved types from `@visual-ai/shared`; no duplicate declarations remain
- [ ] No behavioral change — pure type relocation

**Verification:**

- [ ] `bun run check && bun run lint && vp test run` green; `cd apps/api && bun run type-check` green
- [ ] `grep -rn "IImageObject\|FeatureType" apps/web/src apps/api/src` → only shared imports (plus API-internal usages)

**Dependencies:** 1.1
**Files likely touched:** `packages/shared/src/types/{api,domain}.ts`, `packages/shared/src/index.ts`, `apps/api/src/types/index.ts`, `apps/web/src/types/*.ts`, import sites (several)
**Estimated scope:** M

---

### ✅ Task 1.3: Zod request schemas in shared; API validates with them

**Description:** Add `zod`; create `packages/shared/src/schemas/` with schemas for the generate/upscale/colorize/revive request bodies (and their response DTOs where shared). Types derive via `z.infer` — the hand-written request types from 1.2 that these replace are deleted. API routes parse bodies with the schemas (inline `.safeParse` for now; the wrapper middleware comes in T3). Web imports the inferred types.

**Acceptance criteria:**

- [ ] Invalid generate/upscale/colorize/revive bodies are rejected 400 with a structured message; valid ones behave as before
- [ ] Web request payload types come from `z.infer` via shared

**Verification:**

- [ ] Unit tests: each schema accepts a known-good payload and rejects missing/wrong-typed fields (`vp test run`)
- [ ] Manual: `ctx_execute` fetch against the running dev API — invalid body → 400, valid body → job accepted

**Dependencies:** 1.2
**Files likely touched:** `packages/shared/src/schemas/*.ts`, `packages/shared/package.json`, `apps/api/src/routes/generate.ts`, web store/API-client typings
**Estimated scope:** M

---

### 🏁 Checkpoint 1 — Foundation

- [ ] `bun run check`, `bun run lint`, `vp test run`, API `type-check` + `build` all green
- [ ] Generate flow works end-to-end in browser (agent-browser skill)
- [ ] Phase-verifier PASS; human review before Phase 2

---

## Phase 2 — Pino logging (T2)

### ✅ Task 2.1: Logger factory + request-id HTTP logging

**Description:** Add `pino`, `pino-http`, `pino-pretty` (dev). Create `apps/api/src/lib/logger.ts` (pretty transport in dev, JSON in prod, redact paths for auth headers/tokens). Wire `pino-http` with `genReqId` (uuid) into `app.ts` so every request log carries `req.id`. Expose `logger.child({ module })` pattern.

**Acceptance criteria:**

- [ ] Every HTTP request produces a structured log line with `req.id`
- [ ] Auth headers/secrets are redacted; dev output pretty, prod JSON

**Verification:**

- [ ] Unit test: logger factory redacts a fake `authorization` header
- [ ] Manual: `ctx_execute` fetch to healthcheck; confirm log line with req.id in dev server output

**Dependencies:** None (parallel-safe with Phase 1)
**Files likely touched:** `apps/api/src/lib/logger.ts`, `apps/api/src/app.ts`, `apps/api/package.json`
**Estimated scope:** S

---

### ✅ Task 2.2: Console sweep — config, middlewares, utils, services, index

**Description:** Replace `console.*` with module child loggers in: `config/{mongo,redis}.ts` (7), `middlewares/{errors,clerk}.ts` (2), `utils/{cloudinary,cronJobs}.ts` (8), `services/{periodic-health-check,email-notification}-service.ts` (7), `index.ts` (4), `app.ts` (2). Delete commented-out console lines. Log with context objects, not string concatenation.

**Acceptance criteria:**

- [ ] Zero `console.*` in the listed files; errors logged with `err` + context

**Verification:**

- [ ] `grep -rEn 'console\.(log|error|warn)' apps/api/src/config apps/api/src/middlewares apps/api/src/utils apps/api/src/services apps/api/src/index.ts apps/api/src/app.ts` → 0
- [ ] `bun run type-check` green

**Dependencies:** 2.1
**Files likely touched:** 8 files above
**Estimated scope:** M

---

### ✅ Task 2.3: Console sweep — routes, helpers, webhook

**Description:** Same sweep for `routes/{image,generate,users,payments,healthcheck}.ts` (30), `helpers/{generateRouteHelpers,userRouteHelpers}.ts` (22), `webhook/index.ts` (12). Helpers get child loggers now and carry them into services when dissolved in T3.

**Acceptance criteria:**

- [ ] `grep -rE 'console\.(log|error|warn)' apps/api/src` → **0 matches repo-wide in api** (Success Criterion 2)

**Verification:**

- [ ] The grep above returns nothing; `bun run type-check` green
- [ ] Manual: trigger a generate job; job lifecycle logs appear structured with req.id/jobId

**Dependencies:** 2.2
**Files likely touched:** 8 files above
**Estimated scope:** M

---

### ✅ Task 2.4: Error-handler fix — correct status codes

**Description:** Fix the bug where ALL errors return 401 "Unauthenticated!" (`app.ts:83` + `index.ts`). Central error-handler middleware: 401 only for auth errors, 404 for not-found domain errors, 500 default; logs stack + request context via pino. Introduce a minimal typed `HttpError` (or `AppError`) the handler understands — T3 services will throw it.

**Acceptance criteria:**

- [ ] A thrown generic error returns 500 (not 401); auth failures still 401; handler logs stack + req context
- [ ] Web app still redirects to sign-in on real 401s

**Verification:**

- [ ] Integration-ish tests: routes with mocked failures assert 401/404/500 mapping
- [ ] Manual: hit a protected route without auth → 401; force a server error → 500

**Dependencies:** 2.1
**Files likely touched:** `apps/api/src/middlewares/errors.ts`, `apps/api/src/app.ts`, `apps/api/src/index.ts`, new error type file, test file
**Estimated scope:** S

---

### 🏁 Checkpoint 2 — Logging

- [ ] `grep -rE 'console\.(log|error|warn)' apps/api/src` → 0
- [ ] Status-code tests green; all root scripts green
- [ ] Phase-verifier PASS; human review before Phase 3

---

## Phase 3 — API refactor (T3)

### ✅ Task 3.1: `config/env.ts` — zod-validated environment

**Description:** Centralize all `process.env` access into `apps/api/src/config/env.ts` validated with zod at boot (fail fast with a clear message listing missing vars). No `.env` variable names change (boundary). Replace scattered `process.env.X` reads across the codebase.

**Acceptance criteria:**

- [ ] Boot fails immediately with a named-variable error when a required env is missing
- [ ] `grep -rn "process.env" apps/api/src` → only `config/env.ts`

**Verification:**

- [ ] Unit test: env schema rejects missing `REPLICATE_API_TOKEN` etc.
- [ ] The grep above; `bun run type-check` green

**Dependencies:** Checkpoint 2
**Files likely touched:** `apps/api/src/config/env.ts` + every file reading `process.env` (~10)
**Estimated scope:** M

---

### ✅ Task 3.2: `getUserOrThrow` + async route wrapper; pilot on users/credits routes

**Description:** Add `getUserOrThrow(clerkUserId)` (replaces the repeated `User.findOne` + 404 guard, throws `HttpError(404)`) and an `asyncHandler` wrapper that removes per-route try/catch by delegating to the 2.4 error handler. Convert `routes/users.ts` and `routes/credits.ts` to the thin pattern as the template for the rest.

**Acceptance criteria:**

- [ ] users/credits routes have no try/catch boilerplate and no inline `User.findOne` guards
- [ ] Response shapes and status codes unchanged

**Verification:**

- [ ] Unit tests: `getUserOrThrow` (found/not-found); route tests assert unchanged status codes
- [ ] Manual: profile + credits pages load correctly in browser

**Dependencies:** 2.4
**Files likely touched:** `apps/api/src/services/user-service.ts` (or lib), `apps/api/src/lib/async-handler.ts`, `apps/api/src/routes/{users,credits}.ts`
**Estimated scope:** M

---

### ✅ Task 3.3: Dissolve `userRouteHelpers` into services (user lifecycle + webhook handlers)

**Description:** Move `helpers/userRouteHelpers.ts` (signup/delete handlers, Clerk + Cloudinary user data deletion) into `services/user-service.ts` and `services/cloudinary-service.ts`. The Clerk webhook (`webhook/index.ts`, Svix) calls services; **raw-body handling and Svix signature verification are not touched**. Delete the helpers file.

**Acceptance criteria:**

- [ ] `helpers/userRouteHelpers.ts` deleted; webhook handlers call services
- [ ] Svix signature verification behaves identically

**Verification:**

- [ ] Tests for signup handler logic (username fallbacks) with mocked models
- [ ] Manual: replay a recorded Svix payload → 200; tampered signature → 400
      **Dependencies:** 3.2
      **Files likely touched:** `apps/api/src/services/{user-service,cloudinary-service}.ts`, `apps/api/src/webhook/index.ts`, delete `apps/api/src/helpers/userRouteHelpers.ts`
      **Estimated scope:** M

---

### ✅ Task 3.4: `runGenerationJob` core — dedupe the four `process*` functions

**Description:** In `helpers/generateRouteHelpers.ts`, `processImage`/`processUpscale`/`processColorize`/`processRevive` share job-status/credit/upload/error scaffolding. Extract one `runGenerationJob(definition, input)` core in `services/generation-service.ts`; each feature becomes a small definition (model id, input builder, credit cost). Extract credit calculation **with unit tests first** — credit math semantics must not change. Move the Replicate client to `lib/replicate.ts`. Keep the `FLUX_PRO`/`FLUX_1_1_PRO` special-case for now (T5 kills it). Delete the helpers file.

**Acceptance criteria:**

- [ ] One shared job core; four thin feature definitions; `helpers/generateRouteHelpers.ts` deleted
- [ ] Credit deductions and job-status transitions identical to before (test-asserted)

**Verification:**

- [ ] Unit tests: credit calc per feature; job-status transition sequence with mocked Redis/Replicate
- [ ] Manual: run generate + upscale end-to-end in browser; credits deduct correctly

**Dependencies:** 3.2
**Files likely touched:** `apps/api/src/services/generation-service.ts`, `apps/api/src/lib/replicate.ts`, `apps/api/src/routes/generate.ts`, delete `apps/api/src/helpers/generateRouteHelpers.ts`
**Estimated scope:** L → watch closely; split credit-calc extraction into its own commit

---

### ✅ Task 3.5: Thin remaining routes; unify Cloudinary delete flows

**Description:** Convert `routes/{image,payments,generate}.ts` to the thin pattern (validate with shared zod → service → typed response). Unify the duplicated Cloudinary delete flows in `routes/image.ts` into `cloudinary-service`. Razorpay webhook raw-body verification untouched. `app.ts` becomes wiring-only; `index.ts` bootstrap-only (listen + SIGTERM).

**Acceptance criteria:**

- [ ] No business logic or try/catch boilerplate in route files; one Cloudinary delete path
- [ ] Razorpay signature verification and payment flows unchanged

**Verification:**

- [ ] Route tests with mocked services (status codes incl. 404/401/500)
- [ ] Manual: delete an image; purchase flow reaches Razorpay checkout; history loads

**Dependencies:** 3.3, 3.4
**Files likely touched:** `apps/api/src/routes/{image,payments,generate,index}.ts`, `apps/api/src/services/{image,payment,cloudinary}-service.ts`, `apps/api/src/{app,index}.ts`
**Estimated scope:** L → if it swells, split payments out

---

### ✅ Task 3.6: 🔒 ASK-FIRST — TS 5.x bump + dead-dependency removal

**Description:** Propose to the user: `typescript@4.7 → 5.x` (align with web), remove `@vercel/node`, `bluebird`, `nodemon`, `ts-node`, `axios@0.17`, misplaced `@types/*` in dependencies. Execute only what is approved.

**Acceptance criteria:**

- [ ] User approved an explicit list; only approved changes applied
- [ ] Build/type-check/dev workflow unaffected

**Verification:**

- [ ] `bun install && bun run check && cd apps/api && bun run type-check && bun run build`; `grep` package.json for removed deps

**Dependencies:** 3.5
**Files likely touched:** `apps/api/package.json`, `apps/api/tsconfig.json`, `bun.lock`
**Estimated scope:** S

---

### 🏁 Checkpoint 3 — Refactor

- [ ] `helpers/` directory gone; routes thin; all scripts green
- [ ] Manual matrix: generate, upscale, colorize, revive, credits, payments, history, both webhooks — all behave identically
- [ ] Phase-verifier PASS; human review before Phase 4

---

## Phase 4 — Hono decision gate (T4)

### ⬜ Task 4.1: Hono evaluation spike → `agent_docs/DECISION_hono.md`

**Description:** Read-only spike (throwaway branch/scratch code allowed, nothing merged). Evaluate the five gates from the spec: (1) Clerk auth parity via `@hono/clerk-auth`; (2) Svix + Razorpay raw-body signature verification parity; (3) Multer replacement (`c.req.parseBody()` + Cloudinary streaming) matching field names/size limits/mime filtering; (4) cookie-parser/CORS/node-cron/health-check/SIGTERM equivalents; (5) `Bun.serve` benefit (nice-to-have). Write `DECISION_hono.md` with per-gate evidence and a definitive migrate/stay recommendation.

**Acceptance criteria:**

- [ ] `agent_docs/DECISION_hono.md` exists with evidence per gate and one recommendation
- [ ] No production code changed

**Verification:**

- [ ] `git status` clean except the decision doc; all five gates have a PASS/FAIL verdict

**Dependencies:** Checkpoint 3
**Files likely touched:** `agent_docs/DECISION_hono.md` only
**Estimated scope:** M (research-heavy)

---

### ⬜ Task 4.2: 🔒 GATED — Execute Hono migration (only on "migrate" + user sign-off)

**Description:** Only if 4.1 recommends migrate AND the user signs off. Port middleware chain, routes (thin services make this mechanical), webhooks (raw-body!), upload handling, cron/health/SIGTERM to Hono; re-run the full Checkpoint 3 manual matrix. If 4.1 says stay → mark ⏭️ dropped.

**Acceptance criteria:**

- [ ] All routes pass the same manual verification matrix as pre-migration; zero behavior change for auth/webhooks/uploads

**Verification:**

- [ ] Full Checkpoint 3 matrix repeated; all scripts green

**Dependencies:** 4.1 + explicit user approval
**Estimated scope:** L (own sub-plan inside DECISION doc if it proceeds)

---

### 🏁 Checkpoint 4 — Decision

- [ ] DECISION_hono.md reviewed by human; 4.2 executed or formally dropped
- [ ] All scripts green

---

## Phase 5 — Model registry (T5)

### ⬜ Task 5.1: Registry types + seeded `MODEL_REGISTRY` in shared

**Description:** Create `packages/shared/src/models/types.ts` (`ModelDefinition`, `FieldSpec`, `Tier` — per the spec's style example) and `registry.ts` seeded with the current catalog (FLUX_QUICK/BASIC/PRO/1.1_PRO/REALISM + utility models) from `MODELS_COMPARISON.md` §2–§4: field specs, `inputKey` variants, `tier`, `pricePerImage`. Registry shape must express the candidate models' differences (resolution/dimensions/imageInput field specs exist even if unused by current catalog).

**Acceptance criteria:**

- [ ] Every current model has a registry entry matching MODELS_COMPARISON semantics
- [ ] `isPro`-equivalent derivable from `tier === "premium"` matches today's hardcoded flags

**Verification:**

- [ ] Unit tests: registry entries typecheck against `ModelDefinition`; tier→isPro mapping equals current `MODELS` flags

**Dependencies:** Checkpoint 1 (Phase 4 outcome determines API framework, but registry is framework-neutral)
**Files likely touched:** `packages/shared/src/models/{types,registry}.ts`, `packages/shared/src/index.ts`, test file
**Estimated scope:** M

---

### ⬜ Task 5.2: Backend — `buildModelInput` + registry-driven validation

**Description:** `buildModelInput(modelKey, userParams)` in `lib/replicate.ts` builds the Replicate input purely from the registry's `fields` (drops unsupported params, maps `inputKey` variants like `num_outputs`/`max_images`). Request validation rejects params the selected model doesn't support. Delete the `FLUX_PRO`/`FLUX_1_1_PRO` special-case left in 3.4 — **no per-model conditionals outside the registry**.

**Acceptance criteria:**

- [ ] Replicate inputs for every current model byte-match the pre-registry behavior (test-asserted)
- [ ] `grep -rn "FLUX_PRO\|FLUX_1_1_PRO" apps/api/src` → no conditional logic hits (registry key strings only)

**Verification:**

- [ ] Unit tests per model: input construction incl. output_quality omission and inputKey exceptions; validation rejects unsupported params
- [ ] Manual: generate with FLUX_BASIC and FLUX_1.1_PRO in browser; outputs arrive

**Dependencies:** 5.1 (+ 4.2 outcome if migrated)
**Files likely touched:** `apps/api/src/lib/replicate.ts`, `apps/api/src/services/generation-service.ts`, shared schemas, `apps/api/src/utils/constants.ts` (MODEL_IDS removal), tests
**Estimated scope:** M

---

### ⬜ Task 5.3: Frontend — stores consume registry; delete duplicate constants

**Description:** `stores/aside.ts` and `stores/generate.ts` read model metadata from `@visual-ai/shared` registry. Delete web's duplicate `utils/modelIds.ts` and the `MODEL_IDS`/`FLUX_MODES`/`MODELS` duplicates in `utils/models.ts`/`constants.ts` (keep pure-UI presentation data local if any). `isPro` gating derives from `tier === "premium"`.

**Acceptance criteria:**

- [ ] `grep -rn "MODEL_IDS" apps/web/src` → only shared imports (Success Criterion 1)
- [ ] Model picker, premium gating, and generation requests behave identically

**Verification:**

- [ ] Existing web tests (`models.test.ts`, ModelPicker tests) updated and green
- [ ] Manual: model picker lists same models; premium lock identical for free user

**Dependencies:** 5.1
**Files likely touched:** `apps/web/src/stores/{aside,generate}.ts`, `apps/web/src/utils/{modelIds,models,constants}.ts`, `apps/web/src/types/model.ts`, affected components/tests
**Estimated scope:** M

---

### ⬜ Task 5.4: Sidebar field visibility driven by registry

**Description:** `ImageGenerateAside.vue` controls (AspectRatio, ImageFormat, OutputQuality, ImageVariation) render only if the selected model's registry entry declares the field; option lists come from registry `values`. Extract controls into child components if markup exceeds ~20 lines (code-style rule). Controls for future-model fields (resolution, imageInput, dimensions) are visibility-wired but naturally hidden for the current catalog. ⚠️ Resolves Open Question 3: confirm with user that the OutputQuality slider disappearing for models that ignore it is acceptable — ask before shipping.

**Acceptance criteria:**

- [ ] Each control shows/hides per selected model's registry entry; options sourced from registry
- [ ] No hardcoded per-model conditionals in sidebar components

**Verification:**

- [ ] Component tests (Vue Test Utils/happy-dom): visibility computed per registry entry for at least 3 models
- [ ] Manual (agent-browser): switch models; controls appear/disappear correctly; generate still works

**Dependencies:** 5.3
**Files likely touched:** `apps/web/src/components/Dashboard/Sidebar/ImageGenerateAside.vue` (+ extracted children), tests
**Estimated scope:** M

---

### ⬜ Task 5.5: Epic-end verification sweep

**Description:** Run the full success-criteria audit from the spec §Success Criteria (1–7): greps for duplicated constants and console.\*, error-code behavior, DECISION doc existence, registry-driven behavior on both sides, and the full manual flow matrix (generate, upscale, colorize, revive, credits, payments, history, webhooks) via agent-browser.

**Acceptance criteria:**

- [ ] All 7 spec success criteria verified with evidence recorded in this file

**Verification:**

- [ ] `bun run check && bun run lint && vp test run` green; every criterion checked off with the command/observation that proved it

**Dependencies:** 5.2, 5.4
**Estimated scope:** S (verification only)

---

### 🏁 Checkpoint 5 — Epic complete

- [ ] All success criteria met with evidence; phase-verifier PASS
- [ ] Spec updated if any decision changed during execution
- [ ] Human review + sign-off

---

## Task Summary

| #   | Task                                     | Size | Depends on     | Status |
| --- | ---------------------------------------- | ---- | -------------- | ------ |
| 1.1 | Scaffold packages/shared, prove pipeline | S    | —              | ⬜     |
| 1.2 | Move shared types/DTOs                   | M    | 1.1            | ⬜     |
| 1.3 | Zod request schemas                      | M    | 1.2            | ⬜     |
| 2.1 | Pino factory + request-id                | S    | —              | ⬜     |
| 2.2 | Console sweep: config/utils/services     | M    | 2.1            | ⬜     |
| 2.3 | Console sweep: routes/helpers/webhook    | M    | 2.2            | ⬜     |
| 2.4 | Error-handler status-code fix            | S    | 2.1            | ⬜     |
| 3.1 | Zod-validated env config                 | M    | CP2            | ✅     |
| 3.2 | getUserOrThrow + asyncHandler pilot      | M    | 2.4            | ✅     |
| 3.3 | Dissolve userRouteHelpers                | M    | 3.2            | ✅     |
| 3.4 | runGenerationJob dedupe                  | L    | 3.2            | ✅     |
| 3.5 | Thin remaining routes                    | L    | 3.3, 3.4       | ✅     |
| 3.6 | 🔒 TS bump + dead deps (ask-first)       | S    | 3.5            | ✅     |
| 4.1 | Hono evaluation → DECISION doc           | M    | CP3            | ⬜     |
| 4.2 | 🔒 Hono migration (gated)                | L    | 4.1 + sign-off | ⬜     |
| 5.1 | Registry types + seed                    | M    | CP1            | ⬜     |
| 5.2 | buildModelInput (backend)                | M    | 5.1            | ⬜     |
| 5.3 | Stores consume registry (frontend)       | M    | 5.1            | ⬜     |
| 5.4 | Sidebar visibility (frontend)            | M    | 5.3            | ⬜     |
| 5.5 | Epic-end verification sweep              | S    | 5.2, 5.4       | ⬜     |
