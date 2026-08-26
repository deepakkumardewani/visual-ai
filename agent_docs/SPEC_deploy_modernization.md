# SPEC — Deployment Modernization (Droplet, Monorepo, Staging + Prod)

Status: draft for user confirmation
Date: 2026-08-25

## 1. Objective

Keep the existing $6/mo DigitalOcean droplet (1GB RAM, IP 159.89.45.226) and modernize the entire
deployment story for the `visual-ai` monorepo:

- Reproducible infra: one repo-versioned `docker-compose` + nginx config describing everything on the box.
- Two environments on one droplet: **prod** (`visual-ai.app`) and **staging** (`staging.visual-ai.app`).
- Deploys via **GitHub Actions**: push to `master` → prod, push to `staging` → staging. Path-filtered
  per app. Builds happen on GitHub runners; the droplet never builds anything.
- **Cloudflare** takes over DNS (registrar stays Hostinger) for edge TLS/CDN and a reusable
  one-toggle **maintenance mode**.
- Safe handling of MongoDB schema changes; Atlas hosting unchanged.

**User:** solo dev, live product with paying users (Razorpay), <100 users/day.

## 2. Current state (verified in repo)

- Deploy today: `apps/web/scripts/deploy.sh` = one `scp` of `dist/*` to `/usr/share/nginx/html` — stale
  (predates monorepo; droplet nginx config actually proxies to a `vue-app` container).
- `apps/api/docker-compose.yml`: `backend` (built on droplet — violates the no-build rule) + `redis`
  (128mb maxmemory, AOF). Backend Dockerfile uses npm/yarn, port 3001.
- Redis is load-bearing: BullMQ generation queue + worker (`src/queue/*`), health checks, redis-service.
- One cron job (daily midnight) inside the API process — fine as-is.
- nginx on droplet: certbot/Let's Encrypt TLS, apex+www server blocks proxying to `vue-app`.
- No `.github/workflows` exists yet.
- Schema delta on `feature-enhancement`: two **new** collections (`collections`, `savedprompts`).
  Mongoose creates collections and indexes automatically on first use → **no manual Atlas migration
  needed**. Spec still defines the general procedure for future breaking changes.

## 3. Target architecture

```
Cloudflare (DNS, edge TLS, CDN, maintenance toggle)
        │ A records: visual-ai.app, staging.visual-ai.app → droplet
        ▼
Droplet (1GB + 2GB swap)
  nginx (single container or host nginx; config versioned in repo: infra/nginx/)
    ├─ visual-ai.app          → /var/www/prod (static FE)   + /api → api-prod:3001
    └─ staging.visual-ai.app  → /var/www/staging (static FE) + /api → api-staging:3002
  docker compose (infra/docker-compose.yml)
    ├─ api-prod     (image pulled from GHCR, mem_limit, NODE_ENV=production)
    ├─ api-staging  (same image tag from staging branch, separate env file)
    └─ redis        (shared; env isolation via BullMQ queue prefix "prod"/"staging"; 128mb LRU, AOF)
MongoDB Atlas (unchanged) — prod DB + separate staging DB (same cluster or free M0)
```

Key decisions:

- **Frontend**: stays static-on-nginx (drop the `vue-app` container indirection; serve `dist/`
  directly from nginx — simpler, less RAM).
- **Backend image**: built by GitHub Actions, pushed to **GHCR** (free), pulled on droplet.
  No source or build step on the droplet.
- **TLS**: Cloudflare edge TLS, "Full (strict)" to a **Cloudflare Origin CA cert** on nginx
  (15-year validity → certbot and its renewal cron are removed).
- **Cron/email isolation**: the in-process daily cron and outbound email are gated by an
  `ENABLE_CRON` env var — on for api-prod, off for api-staging (prevents duplicate runs/sends).
- **Staging third-party services**: Razorpay test-mode keys and Clerk dev-instance keys, with their
  own webhook endpoints registered against `staging.visual-ai.app` (or staging runs webhook-less;
  decided during implementation).
- **Frontend env baking**: `VITE_*` vars (API URL, Clerk publishable key) are build-time — the CI
  builds FE twice with separate env sets for prod and staging.
- **Maintenance mode**: Cloudflare — documented one-toggle procedure (redirect rule or Worker serving
  a static maintenance page) that blocks origin traffic while allowing your own IP through.
- **Secrets**: `.env.prod` / `.env.staging` live only on the droplet (an `.env.example` is versioned).
  GitHub Actions secrets hold only SSH key + host.

## 3b. Rollout strategy: staging first, prod second

The new stack is brought up **staging-first, alongside untouched live prod**:

1. Cloudflare takes over DNS with records mirroring today's setup (prod traffic unaffected).
2. `staging.visual-ai.app` + `api-staging` (new compose/nginx/CI path) go live first, running this
   branch's changes against a staging Atlas DB and prefixed Redis queues.
3. All new machinery — GHCR images, deploy script, Actions workflow, maintenance toggle — is proven
   end-to-end on staging.
4. Only then is prod cut over to the new stack (single maintenance window): old `backend`/`vue-app`
   containers replaced, feature branch merged to master, prod deployed via the now-tested pipeline.

No conflicts with live prod during staging bring-up: ports (3002 vs 3001), nginx server blocks,
Atlas DBs, and queue prefixes are all disjoint.

## 4. Deliverables (repo artifacts)

| Path                                                               | Purpose                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `infra/docker-compose.yml`                                         | api-prod, api-staging, redis; mem limits; GHCR images                         |
| `infra/nginx/visual-ai.conf`                                       | prod + staging server blocks, versioned                                       |
| `infra/maintenance/index.html`                                     | branded maintenance page (used by Cloudflare rule)                            |
| `infra/README.md`                                                  | runbook: droplet setup, swap file, maintenance toggle, rollback, resize       |
| `scripts/deploy.sh`                                                | shared deploy logic (build FE / pull BE image / compose up) callable manually |
| `.github/workflows/deploy.yml`                                     | push master→prod, staging→staging; path filters `apps/web/**`, `apps/api/**`  |
| `apps/api/Dockerfile`                                              | modernized: multi-stage, bun-compatible install, prod deps only               |
| Delete: `apps/web/scripts/deploy.sh`, per-app docker-compose files | replaced by the above                                                         |

## 5. Acceptance criteria

1. Push to `master` touching `apps/web/**` → new FE live at `https://visual-ai.app` with no manual step.
2. Push to `staging` touching `apps/api/**` → new BE live behind `staging.visual-ai.app`, prod untouched.
3. Droplet memory stays under ~80% with both envs running (verified via `docker stats` / DO monitoring);
   swap file active.
4. `docker compose up -d` from a clean droplet + the runbook reproduces the whole box.
5. Maintenance mode: single documented Cloudflare action puts up the maintenance page site-wide within
   ~1 min; single action removes it. Verified once end-to-end.
6. Staging API points at a staging Atlas DB and a "staging"-prefixed BullMQ namespace — proven by
   writing test data in staging and confirming prod data and prod queues untouched.
   6b. The daily cron runs only in api-prod (staging logs show it skipped).
7. Backend image is freshly built (replaces the 14-month-old image); Stripe/Razorpay webhooks and the
   BullMQ queue verified working post-deploy.
8. Manual escape hatch: `scripts/deploy.sh` runs the same deploy from a laptop without CI.

## 6. Schema-change policy (Mongo/Atlas)

- Current branch: additive only (new collections) → deploy backend, done. No action in Atlas.
- Future breaking changes (rename/retype/required-field): write an idempotent script in
  `apps/api/scripts/migrations/`, run it manually against staging DB first, then prod during a
  maintenance window. Never auto-run migrations on boot.
- Atlas free/shared tier itself: no changes, no risk from this work.

## 7. Boundaries

**Always:** build on runners/laptop, never the droplet; keep secrets out of git; take a note of the
current live nginx/env state before overwriting it; test on staging before prod for infra changes.

**Ask first — HARD RULE, applies even when tool permissions are already granted:** the agent
states the exact command and waits for explicit user confirmation before ANY of: deleting or
dropping anything in Atlas; removing containers/images/volumes (especially `redis_data`) or files
on the droplet; overwriting live nginx or env config; DNS/nameserver changes; anything touching
Razorpay live mode; `docker prune`, `rm -rf`, `--force` on server/db resources.

**Never:** run builds on the droplet; auto-run DB migrations; commit `.env*` with real values;
touch prod Atlas data from staging; perform any destructive step without a snapshot/backup taken
first and a documented rollback.

### Additional security measures (folded into tasks)

- Redis: closed to the internet (compose: internal network only; checklist P2 `ufw deny 6379`) and
  gets a `requirepass` in the new compose (Task 4).
- Atlas: verify the Network Access IP allowlist contains only the droplet IP (and your IP), not
  0.0.0.0/0 — checked during checklist §C1.
- Cloudflare: origin lock — ufw allows 80/443 only from Cloudflare IP ranges after cutover, so the
  origin can't be hit directly (checklist §F, post-stability).
- SSH: dedicated deploy-only keypair for CI (checklist §E1); consider disabling password auth.
- nginx: security headers (HSTS exists; add X-Content-Type-Options, frame-ancestors) and basic
  rate limiting on `/api` (Task 5).
- Secrets: `.env.*` chmod 600, never in git/CI logs; GitHub secrets masked by Actions.

## 8. Out of scope

Migrating off the droplet; serverless; CI test pipelines; DB re-hosting; blue-green/zero-downtime
deploys (Cloudflare maintenance toggle covers windows).
