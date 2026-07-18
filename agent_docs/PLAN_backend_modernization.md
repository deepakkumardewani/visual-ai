# Implementation Plan: Backend Modernization Epic (visual-ai)

> Source spec: `agent_docs/SPEC_backend_modernization.md` (DRAFT)
> Companion: `agent_docs/TASKS_backend_modernization.md`
> Date: 2026-07-14 · Branch: `backend-migration-hono`

## Overview

Modernize `apps/api` and bridge it with `apps/web` across five threads: shared workspace package (T1), Pino structured logging (T2), API service-layer refactor (T3), a Hono migrate/stay decision gate (T4), and a schema-driven model registry consumed by both apps (T5). Behavior of auth, webhooks, uploads, credits, and payments must be identical at the end.

## Dependency Graph

```
T1 packages/shared (workspace + types + zod schemas)
    │
    ├── T3 API refactor (routes validate with shared schemas; services layer)
    │       │
    │       └── T4 Hono evaluation (decision gate; migration only if all 5 gates pass)
    │
    └── T5 Model registry (registry lives in shared)
            ├── T5-backend: buildModelInput + request validation
            └── T5-frontend: sidebar visibility + isPro from tier
T2 Pino logging — independent of T1; lands before T3 so refactored code is born with pino
```

Execution order: **T1 → T2 → T3 → T4 → T5.** T2 could run parallel to T1 (no file overlap except `app.ts`), but sequential keeps checkpoints clean for a solo maintainer.

## Architecture Decisions

- **Shared package ships TS source** (`"exports": { ".": "./src/index.ts" }`), no build step: Vite bundles it for web; Bun/tsx executes it for API. Verify API `tsc` build still passes (may need `paths`/`composite` tweak) — this is Task 1.1's risk.
- **Zod schemas are the single source**: DTO types via `z.infer`; hand-written duplicates deleted, not kept in parallel.
- **T3 is framework-agnostic**: services take plain params and return data/throw typed errors — no `req`/`res` inside services. This is what makes T4 cheap to evaluate and safe to skip.
- **T4 is a decision gate, not a commitment**: migration tasks (4.2) exist but are isolated; if any of the 5 gates fails, they're dropped and Express + T3's refactor is the final state.
- **Registry is the only place with per-model knowledge** (T5): backend input construction and frontend control visibility both read `fields`; the `FLUX_PRO`/`FLUX_1_1_PRO` special-case in `processImage` and web's `MODEL_IDS`/`FLUX_MODES` duplicates are deleted.

## Current-State Facts (recon 2026-07-14)

- Root `workspaces` is `["apps/*"]` only; no `packages/`.
- `console.*` occurrences: **93 across 18 files** in `apps/api/src` (top: generateRouteHelpers 12, webhook 12, userRouteHelpers 10, generate/payments 8 each).
- Helpers to dissolve: `helpers/generateRouteHelpers.ts` (processImage/processUpscale/processColorize/processRevive + Replicate client), `helpers/userRouteHelpers.ts` (Clerk/Cloudinary user lifecycle).
- Sidebar controls (AspectRatio/ImageFormat/OutputQuality/ImageVariation) live **inside** `apps/web/src/components/Dashboard/Sidebar/ImageGenerateAside.vue` — not separate files yet; T5 may extract them per the 20-line JSX/markup rule.
- Web model constants: `utils/modelIds.ts`, `utils/models.ts`, re-exported via `utils/constants.ts`; `stores/aside.ts` imports `FLUX_MODES`.
- API deps include dead weight: `@vercel/node`, `bluebird`, `nodemon`, `ts-node`, `axios@0.17`, `typescript@4.7` — removal is **ask-first** (Task 3.6).

## Phases

### Phase 1 — Shared workspace foundation (T1)

Scaffold `packages/shared`, wire both apps, move duplicated types, add Zod request schemas. Ends with both apps importing from `@visual-ai/shared` and all checks green.

### Phase 2 — Structured logging (T2)

Pino logger factory + `pino-http` request-id middleware; replace all 93 `console.*`; fix the error handler so generic errors stop returning 401. Ends with `grep console.` → 0 and status-code tests passing.

### Phase 3 — Service layer refactor (T3)

Env validation, `getUserOrThrow`, async route wrapper, helpers dissolved into services, `runGenerationJob` core deduping the four `process*` functions, thin routes validating with shared schemas. Dependency cleanup is a separate ask-first task.

### Phase 4 — Hono decision gate (T4)

Evaluation spike against the 5 gates → `agent_docs/DECISION_hono.md`. Migration (4.2) executes **only** on explicit sign-off; otherwise dropped.

### Phase 5 — Model registry (T5)

Registry types + seeded `MODEL_REGISTRY` in shared; backend `buildModelInput` + validation; frontend stores/sidebar consume registry; duplicates deleted; end-to-end manual verification.

## Risks and Mitigations

| Risk                                                                      | Impact | Mitigation                                                                                                                       |
| ------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Shared TS-source package breaks API `tsc` build                           | High   | Task 1.1 proves the pipeline with one dummy export before moving any types                                                       |
| Raw-body webhook handling breaks (Svix/Razorpay) during T3 route thinning | High   | Webhook routes refactored last in Phase 3; manual signature verification per checkpoint; never change body-parser mounting order |
| Error-handler fix changes web-visible status codes                        | Med    | Web treats 401 as "re-auth"; verify web interceptors before shipping 2.4                                                         |
| `runGenerationJob` abstraction subtly changes credit math                 | High   | Credit calc extracted with unit tests **before** dedupe; semantics are a Never-touch boundary                                    |
| Hono migration scope creep                                                | Med    | Gate: DECISION doc + user sign-off required; migration tasks isolated in 4.2                                                     |
| Registry mis-transcribed from MODELS_COMPARISON                           | Med    | Unit tests assert per-model input construction incl. `num_outputs` inputKey exceptions                                           |

## Parallelization

Solo-maintainer sequential by default. If parallelizing with subagents: 2.2/2.3 (console sweep halves) are safe in parallel; 5.2 (backend) and 5.3/5.4 (frontend) can run in parallel once 5.1 lands the registry contract.

## Checkpoints

A checkpoint follows every phase (see TASKS file). Every checkpoint requires: `bun run check`, `bun run lint`, `vp test run` green, plus the phase's manual verification. **Never run/restart the dev server** — it is always running; verify via type-check/tests/`ctx_execute` fetch. Phase-verifier agent signs off before any task is marked ✅.

## Open Questions (carried from spec — resolve at the flagged task)

1. TS 4.7→5.x bump: bundled into Task 3.6, ask-first.
2. Dead-dep removal list: proposed at Task 3.6, ask-first.
3. `output_quality` slider disappearing for models that ignore it: confirm at Task 5.4.
