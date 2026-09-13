# Manual Steps Checklist — Deployment Modernization

Everything in this file is a step **you perform by hand** (SSH or a dashboard). Everything not
listed here is created automatically by docker compose, the deploy script, or GitHub Actions.
Work top-to-bottom; each section maps to a task in `TASKS_deploy_modernization.md`.

Legend: 🔑 = needs credentials only you have · ⚠️ = touches live prod, do carefully

---

## 0. Prerequisites — run BEFORE Phase 1 starts

- [x] **P1. 🔑 Repo on GitHub:** confirm this monorepo has a GitHub remote and you can push
      (`git remote -v`). Actions + GHCR require it. If it's elsewhere, migrate first.
- [x] **P2. Close the open Redis port on the droplet (urgent, independent of the project):**
  ```bash
  ssh root@159.89.45.226 'ufw deny 6379 && ufw status'
  ```
- [x] **P3. 🔑 Decide + create the staging Mongo URI** (needed by Checkpoint A, end of Phase 1).
      Decision: same Atlas cluster, DB name `visual-ai-staging` (recommended — zero cost, auto-created
      on first write) vs. separate free M0 cluster. Note the full staging `MONGO_URI` somewhere safe.
- [x] **P4. Local tooling check:** Docker Desktop running (`docker info`), `bun` works,
      SSH to droplet works (`ssh root@159.89.45.226 true`).
- [x] **P5. 🔑 Accounts exist:** Cloudflare account (free), access to Hostinger DNS panel,
      Razorpay dashboard (test mode available), Clerk dashboard (dev instance available).
- [x] **P6. Backups dir on laptop:** `mkdir -p ~/backups` (used by B1).

## A. What is automatic vs. manual (reference)

| Thing                                                   | Created by                                                          | You do                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------- |
| Redis container + volume                                | `docker compose up`                                                 | Nothing                                 |
| api-staging / api-prod containers                       | `docker compose up` (images pulled from GHCR)                       | Nothing after first bring-up            |
| Backend images                                          | GitHub Actions → GHCR                                               | Nothing (first push is manual, step D3) |
| FE files in `/var/www/{prod,staging}`                   | deploy script / Actions (rsync)                                     | Create the empty dirs once (B4)         |
| Mongo collections & indexes                             | Mongoose, on first use                                              | Nothing                                 |
| nginx config                                            | Copied by you once (D4); later changes rare, redeployed via runbook | First copy + `nginx -s reload`          |
| `.env.prod` / `.env.staging` on droplet                 | **Never automated** (secrets)                                       | Create + maintain by hand (B5)          |
| Cloudflare / Atlas / Razorpay / Clerk / GitHub settings | —                                                                   | All manual (sections C, E)              |

---

## B. Droplet preparation (Task 7) — SSH: `ssh root@159.89.45.226`

- [x] **B1. Snapshot current state** (before touching anything):
  ```bash
  tar czf /root/pre-migration-$(date +%F).tar.gz /etc/nginx /root/.env* 2>/dev/null
  docker ps -a > /root/pre-migration-containers.txt
  ```
  Then from your laptop: `scp root@159.89.45.226:/root/pre-migration-*.tar.gz ~/backups/`
- [x] **B2. Create 2GB swap:**
  ```bash
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  free -h   # verify Swap: 2.0Gi
  ```
- [x] **B3. Close the open Redis port (do this today, independent of the project):**
  ```bash
  ufw deny 6379
  ```
- [x] **B4. Create directories:**
  ```bash
  mkdir -p /var/www/prod /var/www/staging /opt/visual-ai
  ```
- [x] **B5. 🔑 Create env files** `/opt/visual-ai/.env.prod` and `/opt/visual-ai/.env.staging`
      (template: `infra/.env.example`). Staging uses: staging Atlas URI, `QUEUE_PREFIX=staging`,
      `ENABLE_CRON=false`, Razorpay **test** keys, Clerk **dev** keys, staging `VITE`-irrelevant vars omitted.
  ```bash
  chmod 600 /opt/visual-ai/.env.*
  ```
- [x] **B6. 🔑 GHCR login** (GitHub PAT with `read:packages`):
  ```bash
  docker login ghcr.io -u <github-username>
  ```

## C. Dashboards — Cloudflare / Hostinger / Atlas (Task 8)

- [x] **C1. 🔑 MongoDB Atlas:** create staging database. Easiest: same cluster, new DB name
      `visual-ai-staging` (just use that name in the staging `MONGO_URI`; created on first write).
      Optionally a separate free M0 cluster for harder isolation.
      While there: check **Network Access** — the IP allowlist should contain only the droplet IP
      (and optionally yours), not `0.0.0.0/0`.
- [x] **C2. 🔑 Cloudflare — add site** `visual-ai.app` (Free plan). Let it import DNS records;
      verify every existing record was imported (compare against Hostinger's DNS panel).
- [x] **C3. Add A records:** `staging` → `159.89.45.226` and `api-staging` → `159.89.45.226`, both
      proxied (orange cloud). Ensure apex, `www` and `api` are also proxied.
- [x] **C4. Origin CA cert:** Cloudflare → SSL/TLS → Origin Server → Create Certificate
      (hosts: `visual-ai.app`, `*.visual-ai.app`, 15 years). Save both PEMs on the droplet:
  ```bash
  # paste into these files:
  /etc/ssl/cloudflare/visual-ai.app.pem
  /etc/ssl/cloudflare/visual-ai.app.key   # chmod 600
  ```
  The wildcard covers all four hosts (`visual-ai.app`, `staging.`, `api.`, `api-staging.`);
  `infra/nginx/tls.conf` points at exactly these two paths.
- [x] **C5. SSL mode:** Cloudflare → SSL/TLS → set **Full (strict)**. ⚠️ Only after C4 files exist
      AND the new nginx config (which references them) is live for staging; prod stays on its
      Let's Encrypt certs untouched until cutover.
- [x] **C6. Maintenance toggle:** create a **disabled** Redirect Rule named `maintenance`
      (all hostnames → maintenance page URL, 302), plus a bypass for your home IP
      (Security → WAF skip rule or IP Access "Allow"). Host the page from `infra/maintenance/index.html`
      via a tiny Cloudflare Worker (dashboard → Workers → paste the runbook-provided worker).
- [x] **C7. 🔑 Hostinger — switch nameservers** to the two Cloudflare gives you. ⚠️ Do this last in
      this section; propagation is usually minutes but can take hours. Prod keeps working throughout
      because records are identical.
- [x] **C8. Verify:** `dig visual-ai.app` and `dig staging.visual-ai.app` return Cloudflare IPs;
      prod site loads normally.

## D. Staging bring-up (Task 9) — mix of laptop + SSH

- [x] **D1. Verify prod works** (baseline before changes): browse the live site, note everything OK.
- [x] **D2. 🔑 Razorpay test mode + Clerk dev instance:** create/locate test credentials; register
      the Clerk **dev** webhook endpoint at `https://api-staging.visual-ai.app/webhooks/clerk`
      (prod stays `https://api.visual-ai.app/webhooks/clerk`). Put its signing secret in
      `.env.staging` as `WEBHOOK_SECRET`, alongside the test Razorpay + dev Clerk keys, and set
      `ALLOWED_ORIGINS=https://staging.visual-ai.app`.
      Also fix `apps/web/.env.staging`: the `VITE_CLERK_SIGN_*` URLs still point at
      `http://localhost:3005` — they must be `https://staging.visual-ai.app/...`.
- [x] **D3. First image push (laptop):**
  ```bash
  docker build -t ghcr.io/<user>/visual-ai-api:staging -f apps/api/Dockerfile .
  docker push ghcr.io/<user>/visual-ai-api:staging
  ```
- [ ] **D4. Copy infra to droplet + start staging (laptop → SSH):**

  ```bash
  scp infra/docker-compose.yml root@159.89.45.226:/opt/visual-ai/

  # Shared snippets (TLS, proxy params, SPA behaviour, security headers).
  ssh root@159.89.45.226 'mkdir -p /etc/nginx/snippets'
  scp infra/nginx/{tls,proxy-params,sse-params,static-site,security-headers}.conf \
      root@159.89.45.226:/etc/nginx/snippets/

  # Rate-limit zones + the STAGING site only. visual-ai-prod.conf is deliberately
  # NOT copied yet — it declares the same hostnames as the live certbot config
  # and would collide. It ships at F4.
  scp infra/nginx/00-shared.conf infra/nginx/visual-ai-staging.conf \
      root@159.89.45.226:/etc/nginx/conf.d/

  ssh root@159.89.45.226 'nginx -t && nginx -s reload'
  ssh root@159.89.45.226 'cd /opt/visual-ai && docker compose pull api-staging && docker compose up -d api-staging redis'
  ```

  If `nginx -t` fails on a missing cert, C4's PEMs aren't at the paths in
  `infra/nginx/tls.conf` (`/etc/ssl/cloudflare/visual-ai.app.{pem,key}`). Prod is
  untouched either way — a failed `nginx -t` means no reload happened.

- [ ] **D5. Upload staging FE (laptop):** build with staging env, then
      `rsync -az --delete apps/web/dist/ root@159.89.45.226:/var/www/staging/`
      (or run `./scripts/deploy.sh web staging` once Task 10 exists).
- [ ] **D6. Test staging end-to-end** (Checkpoint B list in TASKS file).

## E. GitHub (Task 11)

- [ ] **E1. 🔑 Create repo Actions secrets:** `SSH_PRIVATE_KEY` (a NEW deploy-only keypair —
      `ssh-keygen -t ed25519 -f ~/.ssh/visual-ai-deploy`, add `.pub` to droplet
      `~/.ssh/authorized_keys`), `DROPLET_HOST`, plus `VITE_*` values for prod and staging
      (exact names listed in the workflow file).
- [ ] **E2. Create the** `staging` **branch** and push — watch the Actions run deploy staging.

## F. Prod cutover (Task 12) — ⚠️ maintenance window

- [ ] **F1. Enable maintenance** (Cloudflare rule ON) — verify site shows maintenance page,
      your IP bypasses it.
- [ ] **F2. Merge** feature branch → `master`, push. Actions deploys prod FE + pushes prod image.
- [ ] **F3. On droplet — swap backends:**
  ```bash
  docker stop backend            # old container, frees port 3001
  cd /opt/visual-ai && docker compose up -d api-prod
  ```
- [ ] **F4. Switch nginx fully to repo config:** remove the old certbot-managed prod conf
      (it's in the B1 snapshot), then ship the prod site file — in that order, or the duplicate
      hostnames collide:
  ```bash
  ssh root@159.89.45.226 'rm /etc/nginx/conf.d/vue-app.conf'   # confirm the real filename first
  scp infra/nginx/visual-ai-prod.conf root@159.89.45.226:/etc/nginx/conf.d/
  ssh root@159.89.45.226 'nginx -t && nginx -s reload'
  ```
- [ ] **F5. Verify prod** (with your bypassed IP): login, generate, Razorpay live webhook test event.
- [ ] **F6. Disable maintenance.** Monitor for 30 min.
- [ ] **F7. Cleanup (only after a day of stability):**
  ```bash
  docker rm backend vue-app; docker image prune -a
  crontab -l   # remove certbot renewal entry
  ```
- [ ] **F8. 🔑 Optional:** delete old FE files at `/usr/share/nginx/html` once confirmed unused.
- [ ] **F9. Origin lock (after a day of stability):** restrict 80/443 to Cloudflare IP ranges so
      the droplet can't be reached directly (exact ufw commands in `infra/README.md`; Cloudflare
      publishes its ranges). ⚠️ Test staging + prod immediately after; keep SSH (22) open to you.

---

## G. Recurring manual actions (post-project — the short list)

| Action              | How                                                          | Frequency           |
| ------------------- | ------------------------------------------------------------ | ------------------- |
| Deploy              | `git push` (staging/master)                                  | — fully automatic   |
| Maintenance mode    | Cloudflare → toggle `maintenance` rule                       | When needed         |
| Rotate/add a secret | Edit `/opt/visual-ai/.env.*`, `docker compose up -d`         | Rare                |
| nginx config change | Edit in repo → scp + `nginx -t && nginx -s reload` (runbook) | Rare                |
| OS updates          | `apt update && apt upgrade` over SSH                         | Monthly             |
| Droplet resize      | DO dashboard, inside a maintenance toggle                    | When metrics say so |
