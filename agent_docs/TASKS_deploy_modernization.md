# Tasks: Deployment Modernization

Spec: `SPEC_deploy_modernization.md` · Plan: `PLAN_deploy_modernization.md`

> **Manual steps:** every by-hand action (SSH commands, dashboard clicks) lives in
> `CHECKLIST_manual_steps.md`, keyed to tasks: §B↔Task 7, §C↔Task 8, §D↔Task 9,
> §E↔Task 11, §F↔Task 12. Tasks below reference those sections instead of repeating commands.

## Phase 1: Backend environment-readiness

## Task 1: Env config for environment isolation

**Description:** Add `ENABLE_CRON` (boolean, default false) and `QUEUE_PREFIX` (string, default "prod") to `apps/api/src/config/env.ts` with validation; thread `QUEUE_PREFIX` into BullMQ queue/worker construction.

**Acceptance criteria:**

- [ ] `env.ts` exposes typed `ENABLE_CRON` and `QUEUE_PREFIX`; invalid values fail fast at boot
- [ ] `generation-queue.ts` and `generation-worker.ts` use the prefix; queue keys in Redis are namespaced

**Verification:**

- [ ] `bun run test` in `apps/api` passes (extend `env.test.ts`)
- [ ] Manual: boot with `QUEUE_PREFIX=staging`, enqueue a job, `redis-cli KEYS 'bull:*'` shows staging-prefixed keys

**Dependencies:** None
**Files likely touched:** `apps/api/src/config/env.ts`, `env.test.ts`, `src/queue/generation-queue.ts`, `src/queue/generation-worker.ts`
**Estimated scope:** S

## Task 2: Gate cron and outbound email by environment

**Description:** Wrap cron registration in `cronJobs.ts` behind `ENABLE_CRON`; ensure email-notification-service no-ops (with a log line) when disabled, so api-staging never duplicates jobs or sends.

**Acceptance criteria:**

- [ ] With `ENABLE_CRON=false`, boot logs "cron disabled" and no schedule registered
- [ ] With `ENABLE_CRON=true`, behavior identical to today

**Verification:**

- [ ] Unit test for the gate; `bun run test` passes
- [ ] Manual: boot both modes, check logs

**Dependencies:** Task 1
**Files likely touched:** `apps/api/src/utils/cronJobs.ts`, `src/services/email-notification-service.ts`, `src/index.ts`
**Estimated scope:** S

## Task 3: Modernize API Dockerfile

**Description:** Rewrite `apps/api/Dockerfile` as multi-stage (build stage → slim runtime with prod deps only), monorepo-aware build context, non-root user, port 3001.

**Acceptance criteria:**

- [ ] `docker build` succeeds from repo root context
- [ ] Final image runs `node dist/index.js` (no dev deps, no src) and is meaningfully smaller than current

**Verification:**

- [ ] Manual: `docker run` locally with staging env vars → `/health` responds, Redis + Atlas connect

**Dependencies:** None
**Files likely touched:** `apps/api/Dockerfile`, `.dockerignore`
**Estimated scope:** S

## Checkpoint A

- [ ] All api tests pass; image builds and boots locally against the staging Atlas URI from
      checklist §0 P3 (the DB itself is auto-created on first write — only the URI must exist)

## Phase 2: Infra as code

## Task 4: `infra/docker-compose.yml`

**Description:** New root-level compose: `api-prod` (GHCR image, env_file `.env.prod`, port 3001, mem_limit 300m, `ENABLE_CRON=true`), `api-staging` (env_file `.env.staging`, port 3002, mem_limit 250m), `redis` (existing tuned command, volume, mem_limit 160m, no published port — internal network only).

**Acceptance criteria:**

- [ ] `docker compose config` validates
- [ ] Redis is not exposed on 0.0.0.0 (current setup exposes 6379 publicly — fix) and requires a password (`requirepass` from env; both APIs updated to send it)
- [ ] Both api services reference `${GHCR_IMAGE}:tag`, no `build:` on droplet path

**Verification:**

- [ ] Manual: `docker compose up` locally with local images; both APIs healthy, isolated queues visible in redis

**Dependencies:** Tasks 1–3
**Files likely touched:** `infra/docker-compose.yml`, `infra/.env.example`
**Estimated scope:** S

## Task 5: Repo-versioned nginx config

**Description:** `infra/nginx/visual-ai.conf`: server blocks for `visual-ai.app` (root `/var/www/prod`, SPA fallback, `/api` → 127.0.0.1:3001) and `staging.visual-ai.app` (root `/var/www/staging`, `/api` → 127.0.0.1:3002); www→apex redirect; TLS via Cloudflare Origin CA cert paths; gzip + cache headers for hashed assets.

**Acceptance criteria:**

- [ ] `nginx -t` passes against the file
- [ ] SPA deep links work (fallback to index.html); `/api` proxying preserves headers (Host, X-Forwarded-For)
- [ ] Security headers set (HSTS, X-Content-Type-Options, frame-ancestors) and basic rate limiting on `/api`

**Verification:**

- [ ] Manual: run nginx in docker locally with the conf + a dummy dist; curl checks for /, deep link, /api

**Dependencies:** None
**Files likely touched:** `infra/nginx/visual-ai.conf`
**Estimated scope:** S

## Task 6: Maintenance page + env templates

**Description:** Branded static `infra/maintenance/index.html` (self-contained, matches app design); `infra/.env.example` documenting every var for prod and staging (from the current compose env list plus new vars).

**Acceptance criteria:**

- [ ] Maintenance page renders standalone (no external assets), mobile-friendly
- [ ] `.env.example` covers all vars consumed by env.ts, with staging/prod guidance comments

**Verification:**

- [ ] Manual: open the page in a browser; cross-check var list against `env.ts`

**Dependencies:** None
**Files likely touched:** `infra/maintenance/index.html`, `infra/.env.example`
**Estimated scope:** S

## Phase 3: Droplet + Cloudflare cutover

## Task 7: Droplet preparation + state snapshot

**Description:** On the droplet: archive current `/etc/nginx`, running-container list, and existing env files to a dated tarball (copied locally); create 2GB swap; create `/var/www/{prod,staging}` and `/opt/visual-ai`; `docker login ghcr.io`.

**Acceptance criteria:**

- [ ] Snapshot tarball exists locally before any modification
- [ ] `free -h` shows swap active; dirs exist; GHCR pull works

**Verification:**

- [ ] Manual over SSH; record commands in `infra/README.md` as they're run

**Dependencies:** None (can precede Phase 2)
**Files likely touched:** droplet only + notes into `infra/README.md`
**Estimated scope:** S

## Task 8: Cloudflare setup (DNS, Origin CA, maintenance toggle)

**Description:** Add site to Cloudflare; recreate all DNS records; A records for apex + staging → droplet IP (proxied); issue Origin CA cert and install on droplet; set SSL mode Full (strict); create a **disabled** redirect rule "maintenance" → maintenance page (hosted as a Cloudflare Worker asset or R2/Pages single file) with an IP-allowlist bypass for your IP; finally switch nameservers at Hostinger. Resolve the two open questions (staging webhooks; staging Atlas DB location) here.

**Acceptance criteria:**

- [ ] Site resolves through Cloudflare (proxied), TLS Full (strict), no cert warnings
- [ ] Maintenance rule exists, disabled, tested once on staging hostname
- [ ] `staging.visual-ai.app` resolves

**Verification:**

- [ ] Manual: `dig`, browser checks, toggle drill on staging

**Dependencies:** Task 7
**Files likely touched:** Cloudflare dashboard + `infra/README.md` runbook section
**Estimated scope:** M

## Task 9: Staging bring-up (prod untouched)

**Description:** Deploy only the staging half of the new stack alongside live prod: push this branch's BE image to GHCR (manual `docker push` first time); on droplet start `api-staging` (port 3002) + shared redis via `infra/docker-compose.yml`; add the staging nginx server block (leave existing prod nginx config untouched); upload staging FE dist (built from this branch with staging `VITE_*` env). Create the staging Atlas DB. Old `backend`/`vue-app` keep serving prod throughout.

**Acceptance criteria:**

- [ ] `https://staging.visual-ai.app` serves this branch end-to-end: Clerk login, generation queue, collections/saved-prompts, Razorpay test payment
- [ ] Prod (`visual-ai.app`) unaffected — verified before and after
- [ ] Staging writes land only in staging Atlas DB and "staging"-prefixed Redis keys
- [ ] Cron disabled in staging (log line present); memory <80% with old prod stack (`backend`, `vue-app`) and new staging stack (`api-staging`, `redis`) all running concurrently

**Verification:**

- [ ] Manual checklist in `infra/README.md`, executed live

**Dependencies:** Tasks 4–8
**Files likely touched:** droplet + `infra/README.md`
**Estimated scope:** M

## Phase 4: CI/CD (proven on staging)

## Task 10: `scripts/deploy.sh` (manual escape hatch)

**Description:** Root script: `./scripts/deploy.sh <web|api> <prod|staging>`. web: builds FE with the right `VITE_*` env file, rsyncs dist to `/var/www/<env>`; api: builds+pushes image to GHCR, SSH `docker compose pull && up -d <service>`. Fails fast on missing env/SSH.

**Acceptance criteria:**

- [ ] Each of the 4 combinations deploys successfully from a laptop
- [ ] No build ever runs on the droplet

**Verification:**

- [ ] Manual: run `web staging` and `api staging`, confirm live

**Dependencies:** Task 9
**Files likely touched:** `scripts/deploy.sh`, delete `apps/web/scripts/deploy.sh`
**Estimated scope:** S

## Task 11: GitHub Actions workflow

**Description:** `.github/workflows/deploy.yml`: on push to `master` (→prod) and `staging` (→staging); path filters `apps/web/**` and `apps/api/**` select jobs; jobs call the same logic as `scripts/deploy.sh` (checkout, bun install, build with env-specific VITE secrets, rsync/ssh via `SSH_PRIVATE_KEY`/`DROPLET_HOST` secrets; api job uses docker/build-push-action → GHCR then SSH pull+up).

**Acceptance criteria:**

- [ ] Push touching only `apps/web/**` to staging deploys only FE-staging
- [ ] Prod path is written (master→prod) but remains unexercised until Task 12
- [ ] A push touching neither app deploys nothing; secrets documented in `infra/README.md`

**Verification:**

- [ ] Manual: real pushes to `staging`; check Actions logs + staging site

**Dependencies:** Task 10
**Files likely touched:** `.github/workflows/deploy.yml`
**Estimated scope:** M

## Checkpoint B — Staging sign-off (gate before prod)

- [ ] Full manual test pass on staging: auth, generation, payments (test mode), new branch features
- [ ] Maintenance-toggle drill passed on staging hostname
- [ ] Push-to-`staging` deploys work for both apps
- [ ] Human sign-off to proceed to prod cutover

## Phase 5: Prod cutover (maintenance window)

## Task 12: Prod cutover via the proven pipeline

**Description:** Enable maintenance mode on prod; merge feature branch to `master`; let the Actions prod path (or `scripts/deploy.sh <app> prod`) deploy FE to `/var/www/prod` and start `api-prod` (port 3001 — stop the old `backend` container first); switch prod nginx server blocks to the repo-versioned config; verify end-to-end; remove old `backend`/`vue-app` containers, old images, certbot cron; disable maintenance mode.

**Acceptance criteria:**

- [ ] Prod works end-to-end post-cutover: Clerk login, generation queue, live Razorpay webhook, cron enabled only on prod
- [ ] Prod data intact (new collections appear as users use the features; existing data untouched)
- [ ] Old containers/certbot gone; memory <80%; maintenance toggle verified on prod during window
- [ ] Rollback path documented and available (old image kept until sign-off)

**Verification:**

- [ ] Manual checklist in `infra/README.md`, executed live during the window

**Dependencies:** Checkpoint B
**Files likely touched:** droplet + `infra/README.md`
**Estimated scope:** M

## Phase 6: Documentation

## Task 13: Update all project docs to match new reality

**Description:** Write `infra/README.md` (full runbook: droplet bootstrap, deploy flows, maintenance toggle, rollback = redeploy previous GHCR tag / previous dist, droplet resize, schema-change policy from spec §6). Update `docs/ARCHITECTURE.md` (deployment/topology section: Cloudflare → nginx → containers diagram, env isolation), root `README.md` (deploy section, infra layout, badge/links), `apps/api/README.md` and `apps/web/README.md` (remove stale deploy instructions, point to `infra/README.md` and `scripts/deploy.sh`). Delete stale per-app `docker-compose.yml` files and any remaining references.

**Acceptance criteria:**

- [ ] `grep -ri "scp\|vue-app\|certbot" docs/ README.md apps/*/README.md` returns no stale instructions
- [ ] ARCHITECTURE.md deployment section matches the shipped topology
- [ ] infra/README.md lets a fresh reader reproduce the droplet from scratch (spec AC 4)

**Verification:**

- [ ] Manual doc review against live setup

**Dependencies:** Task 12
**Files likely touched:** `infra/README.md`, `docs/ARCHITECTURE.md`, `README.md`, `apps/api/README.md`, `apps/web/README.md`, delete `apps/api/docker-compose.yml`, `apps/web/docker-compose.yml`, `apps/web/Dockerfile`, `apps/web/nginx/`
**Estimated scope:** M

## Checkpoint C — Complete

- [ ] All spec acceptance criteria 1–8 verified
- [ ] Docs reviewed; stale files deleted
- [ ] Human sign-off
