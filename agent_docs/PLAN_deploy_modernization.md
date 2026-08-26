# Implementation Plan: Deployment Modernization

Spec: `agent_docs/SPEC_deploy_modernization.md` (confirmed 2026-08-25)
Tasks: `agent_docs/TASKS_deploy_modernization.md`

## Overview

Modernize deployment on the existing $6 DigitalOcean droplet: repo-versioned infra (`infra/`),
prod + staging environments behind Cloudflare, GHCR-built backend images, GitHub Actions deploys
(master→prod, staging→staging), a one-toggle maintenance mode, and updated project docs.

## Architecture Decisions

- **Build off-box, run on-box**: GitHub runners (7GB) build FE dist and BE image; the 1GB droplet only pulls/serves. Swap file as safety net.
- **GHCR for images**: free with the repo; droplet does `docker compose pull`.
- **Single nginx, hostname routing**: `visual-ai.app` → prod, `staging.visual-ai.app` → staging; static FE served directly (the old `vue-app` container is removed).
- **Cloudflare owns DNS/TLS/maintenance**: Origin CA cert on nginx replaces certbot; maintenance = one Cloudflare redirect-rule toggle.
- **Env isolation**: separate Atlas DBs, BullMQ queue prefix per env, `ENABLE_CRON` gate, Razorpay test / Clerk dev keys in staging, per-env `VITE_*` FE builds.
- **Order rationale**: code-level env gating first (deployable via old flow, zero risk), then infra files, then Cloudflare cutover (the only risky step, behind maintenance mode), then CI, then docs.

## Phases

### Phase 1: Backend environment-readiness (code only, no infra risk)

Tasks 1–3: env config additions (`ENABLE_CRON`, BullMQ prefix), cron/email gating, modernized multi-stage Dockerfile. Verifiable locally via tests + `docker build`.

### Checkpoint A

Tests pass; image builds and boots locally against staging Atlas DB.

### Phase 2: Infra as code (`infra/`)

Tasks 4–6: docker-compose (api-prod, api-staging, redis, mem limits), nginx config (prod+staging server blocks, Origin CA paths), maintenance page + env templates.

### Phase 3: Staging bring-up (prod untouched)

Tasks 7–9: droplet prep (snapshot, swap, dirs, GHCR login), Cloudflare DNS + Origin CA + maintenance toggle (records mirror today's routing — prod unaffected), then deploy the **staging** half of the new stack (`api-staging` on 3002, staging nginx block, staging FE) running this feature branch against the staging Atlas DB.

### Phase 4: CI/CD, proven on staging

Tasks 10–11: `scripts/deploy.sh` and `.github/workflows/deploy.yml`; the `staging` branch → staging path is exercised for real; the prod path is written but idle.

### Checkpoint B (staging sign-off)

Full app tested on `staging.visual-ai.app` — login, generation queue, payments (test mode), collections/saved-prompts features from this branch; maintenance-toggle drill passed on staging; deploys land via push to `staging`.

### Phase 5: Prod cutover (maintenance window)

Task 12: enable maintenance mode, merge to `master`, deploy prod via the proven pipeline, migrate prod traffic to new nginx/compose, remove old `backend`/`vue-app` containers and certbot, verify prod end-to-end, disable maintenance.

### Phase 6: Docs

Task 13: update `docs/ARCHITECTURE.md`, root `README.md`, `apps/api/README.md`, `apps/web/README.md`, write `infra/README.md` runbook; delete stale deploy files.

### Checkpoint C (complete)

All spec acceptance criteria 1–8 verified; docs match reality.

## Risks and Mitigations

| Risk                                                 | Impact | Mitigation                                                                                                    |
| ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| DNS propagation breaks prod during nameserver switch | High   | Keep droplet IP unchanged; add records in Cloudflare before switching NS; do it inside the maintenance window |
| 1GB RAM pressure with 2 API containers               | Med    | mem_limit per container, 2GB swap, `docker stats` check in AC; stop staging when idle                         |
| Old droplet state (nginx/env) lost during cleanup    | Med    | Task 7 snapshots `/etc/nginx`, env files, and container list to a local archive before any change             |
| Razorpay/Clerk webhook breakage post-cutover         | High   | Explicit post-cutover verification step; Cloudflare proxies same IP so URLs unchanged                         |
| BullMQ prefix change strands in-flight jobs          | Low    | Deploy during maintenance window with empty queue; verify queue drain first                                   |

## Open Questions

- Staging webhooks: register Razorpay-test/Clerk-dev endpoints, or run staging webhook-less? (Resolve during checklist §D2; spec allows either.)
- Staging Atlas DB location: decided in checklist §0 P3 **before Phase 1** (recommended: same cluster, `visual-ai-staging` DB).

## Prerequisites

Before starting Phase 1, complete `CHECKLIST_manual_steps.md` §0 (P1–P6): GitHub remote confirmed,
Redis port closed on droplet, staging Mongo URI decided, local Docker/SSH working, dashboard
accounts available.
