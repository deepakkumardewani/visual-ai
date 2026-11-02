# Implementation Plan: Cloudinary Cost Reduction + Pro Tier

Source: `SPEC.md` (reviewed, final). Branch: feature-enhancement. No servers are started by any task (always running). No commits unless the owner asks.

## Overview

Two workstreams delivered as vertical phases. Phases 1-4 (Workstream A) stop the Cloudinary bill and are fully independent of Pro. Phases 5-10 (Workstream B) add the $5/month Pro tier, one perk per slice, then localized pricing and UI. Cost wins ship first (fastest value, lowest risk).

## Architecture Decisions

- One source of truth for plan logic: `packages/shared/src/models/plans.ts` (constants, `PREMIUM_MODEL_KEYS`, caps, priority) plus a single API helper `isPro(user, now)`. Every perk calls it; no perk reads `user.plan` directly.
- Reuse the existing payments `PaymentProvider` adapter and webhook idempotency; add subscription methods, not a parallel stack.
- All perks enforced server-side; UI is cosmetic. Each perk ships with a "free user gets free behaviour" API test.
- Display prices are estimates only; charging always uses Dodo product IDs.
- Playwright Cloudinary mock is applied via a single shared fixture and a config-level hook so no spec can bypass it.
- Ask-first items (spec Boundaries): Mongoose changes beyond `plan`, `subscription`, `isPrivate`; new dependencies (an IP-lookup or FX source may need one); any change to premium list; going live.

## Dependency Graph

```
A1 e2e mock+guard ──┐
A2 env split/docs ──┼─(independent)── A4 thumbnails      (A5 client downloads = Task 7.6, after P5)
A3 landing assets ──┘

B1 shared plans.ts + User model + isPro ── B2 Dodo product + env
        │                                       │
        │                                  B3 subscribe + webhooks (plan flips)
        │                                       │
        ├── P1 premium gate ─────────────────────┤  (perks need only B1; tested with
        ├── P2 priority queue                    │   plan set directly; B3 gives real flip)
        ├── P3 history cap (+ savedToHistory)    │
        ├── P4 private generations + explore     │
        └── P5 full-quality download endpoint ── A5 (client switch to endpoint)
                         │
                 C1 localized pricing API ── UI pricing dialog (needs B3 + C1)
                         │
                 UI: lock badges, history banner, Pro badge (need P1, P3, plan field)
                         │
                      E2E + go-live checklist
```

Parallelism: Phases 1, 2, 3 touch mostly disjoint files (Phase 1 and Task 2.2 both edit `apps/web/vite.config.mts` test include; serialize those two) and may run in parallel sessions. After Phase 5 (B1), Tasks 6.x (Dodo) and 7.x (perks) can proceed in parallel; perks do not need real webhooks.

---

# Workstream A: Cloudinary cost

## Phase 1: Playwright Cloudinary mock (fastest cost win)

### Task 1.1: Cloudinary route mock fixture

**Description:** Add `e2e/support/cloudinaryMock.ts` routing `**/res.cloudinary.com/**` to local fixtures (mp4 if path has `/video/` or `.mp4`, else webp). Add tiny binary fixtures.
**Acceptance criteria:**

- [ ] Mock registers on browser context; video vs image selection correct
- [ ] Fixtures `placeholder.webp` / `placeholder.mp4` committed under `apps/web/e2e/fixtures/assets/`
- [ ] Unit-style test of the mime-selection function
      **Verification:** `cd apps/web && bun run test` (vp test) for the helper; `bun run check`.
      **Dependencies:** None
      **Files:** `apps/web/e2e/support/cloudinaryMock.ts`, `apps/web/e2e/fixtures/assets/*`, `apps/web/vite.config.mts` (Vitest include `e2e/support/**/*.test.ts`), `apps/web/playwright.config.ts` (`testIgnore` `*.test.ts`), helper test
      **Scope:** Small

### Task 1.2: Apply globally to all four projects + guard

**Description:** Wire the mock through a custom auto `test` fixture and/or `use` hook; migrate raw `@playwright/test` imports; cover `auth.setup.ts` and `global.setup.ts`; add guard counting requests that reach `res.cloudinary.com` and failing if > 0.
**Acceptance criteria:**

- [ ] setup, guest, chromium-billing, chromium all covered; no spec bypasses
- [ ] Guard test fails if a Cloudinary request reaches network (prove by temporary negative check)
- [ ] Works in dev mode and e2e-preview (`E2E_SERVER`) mode
      **Verification:** `cd apps/web && bun run test:e2e` in both modes; `grep -rlE "import \{[^}]*\btest\b[^}]*\} from ['\"]@playwright/test" e2e` prints only `e2e/fixtures/base.ts`.
      **Dependencies:** 1.1
      **Files:** new `apps/web/e2e/fixtures/base.ts`, `fixtures/qa.ts`, `fixtures/generation.ts`, `auth.setup.ts`, `global.setup.ts`; then import edits in the five specs that import bare `test` (`explore`, `shell`, `marketing`, `assets`, `auth`). Split into two tasks in TASKS.md (≤5 files each).
      **Scope:** Medium

### Checkpoint: Phase 1

- [ ] Full Playwright run (both modes) produces 0 `res.cloudinary.com` network hits
- [ ] No test weakened; check/lint clean

## Phase 2: Dev/e2e/staging on a separate Cloudinary cloud

### Task 2.1: Env docs and example files

**Description:** Document the dev-cloud setup in `apps/api/.env.example` and `apps/web/.env.example` (same dev cloud for api+web, dev default `CLOUDINARY_BASE_PATH`, staging/e2e-preview must not use prod cloud, optional 70% usage alert).
**Acceptance criteria:**

- [ ] Both examples list all six vars with comments; no real secrets
- [ ] `model-input.ts` tests parameterised: accept dev-cloud URL, reject other cloud
      **Verification:** `cd apps/api && bun run test` (model-input tests).
      **Dependencies:** None
      **Files:** `apps/api/.env.example`, `apps/web/.env.example`, `apps/api/src/lib/model-input.test.ts`
      **Scope:** Small

### Task 2.2: Owner manual env repoint checklist (no commit of secrets)

**Description:** Provide the checklist: create second free account; repoint `apps/web/.env.local`, `.env.staging`, `.env.e2e*`, `apps/api/.env`, `apps/api/.env.staging`. Add a lightweight repo check script/test that fails if non-production env files contain the prod cloud name (reads local files, skips if absent).
**Acceptance criteria:**

- [ ] Checklist in this plan (see Go-live) and referenced from `.env.example`
- [ ] Check flags `ddzuitkzt` in any non-`.env.production*` file
      **Verification:** Run check; owner confirms manual step done.
      **Dependencies:** 2.1
      **Files:** `apps/web/scripts/check-cloudinary-env.mjs`, `apps/web/vite.config.mts` (include `scripts/**/*.test.mjs`), `GO-LIVE.md`, `apps/api/.env.example`
      **Scope:** Small

### Checkpoint: Phase 2

- [ ] Owner confirmed env files repointed; uploads during a dev session appear in dev cloud

## Phase 3: Thumbnails (A4)

### Task 3.1: `thumbUrl` helper

**Description:** `apps/web/src/utils/cloudinaryUrl.ts` inserting `q_auto,f_auto,w_400,c_limit` after `/upload/`; passthrough for non-Cloudinary; idempotent.
**Acceptance criteria:**

- [ ] Unit tests: Cloudinary URL, already-transformed, non-Cloudinary, video URL, malformed
      **Verification:** `bun run test`; `bun run check`.
      **Dependencies:** None
      **Files:** `apps/web/src/utils/cloudinaryUrl.ts`, `cloudinaryUrl.test.ts`
      **Scope:** XS

### Task 3.2: Use thumbnails in grids

**Description:** Apply `thumbUrl` in `components/History/History.vue`, `components/Dashboard/Feed/UserGenerationsGrid.vue`, `components/History/CollectionsStrip.vue`; ImageDialog stays full size.
**Acceptance criteria:**

- [ ] Thumbnail `<img>` src contains `w_400`; dialog unchanged
- [ ] E2E asserts thumbnail request URL contains `w_400` (mock records requested URL)
      **Verification:** component tests + the e2e assertion.
      **Dependencies:** 3.1, 1.2
      **Files:** 3 Vue components, e2e spec
      **Scope:** Medium

## Phase 4: Self-host landing assets (A3)

### Task 4.1: Optimise and relocate media

**Description:** Convert images to WebP (revive-1 <= ~150 KB); re-encode demo MP4s (H.264 CRF ~28, faststart, capped size, no audio, posters) only if any are still referenced (none in current source); place under `apps/web/public/landing/` with hashed names. Existing Cloudinary copies stay.
**Acceptance criteria:**

- [ ] Size targets met; poster per video
- [ ] `apps/web/nginx/conf/spa.conf` has a `/landing/` block with immutable long-cache headers and `mp4|webm` in its static regex
      **Verification:** file size listing; host header config reviewed.
      **Dependencies:** None
      **Files:** `apps/web/public/landing/*`, `apps/web/nginx/conf/spa.conf`
      **Scope:** Medium (assets)

### Task 4.2: Repoint references and remove env var

**Description:** Update `utils/landing.ts`, `utils/communityMock.ts`, `utils/gallery.json`, `components/Dialogs/SignupDialog.vue` to `/landing/...`; remove `VITE_CLOUDINARY_ASSETS_URL` from source and `apps/web/.env.example` if unused.
**Acceptance criteria:**

- [ ] `grep -rn "res.cloudinary.com\|CLOUDINARY_ASSETS_URL" apps/web/src` hits only user-content paths
- [ ] E2E (mock disabled for this check, counting attempted requests) on `/` and marketing routes: 0 Cloudinary requests
      **Verification:** grep + e2e; `bun run check`.
      **Dependencies:** 4.1 (e2e piece: 1.2)
      **Files:** the four files above + `apps/web/.env.example`
      **Scope:** Medium

### Checkpoint: Workstream A (code complete)

- [ ] Unit, check, lint, e2e all green
- [ ] Owner deploys; interim measurement: 7-day Cloudinary bandwidth < 1 GB (post-deploy, not a build gate)
- [ ] Human review before Workstream B

---

# Workstream B: Pro tier

## Phase 5: Plan foundation (B1)

### Task 5.1: Shared plan constants and types

**Description:** `packages/shared/src/models/plans.ts`: `PLAN`, `HISTORY_CAP`, `PRO_PRICE_USD_MONTHLY`, `PREMIUM_MODEL_KEYS` (explicit constant), `QUEUE_PRIORITY`, `PlanSchema`, `SubscriptionStatus`. Export from shared index.
**Acceptance criteria:**

- [ ] Constants match spec; premium keys typed as `ModelKey` and each exists in the registry (test)
      **Verification:** shared tests; `bun run check`.
      **Dependencies:** None
      **Files:** `packages/shared/src/models/plans.ts`, `plans.test.ts`, `models/index.ts`, `types/domain.ts` (IUser plan fields, IImageObject.isPrivate)
      **Scope:** Small

### Task 5.2: User model fields and `isPro`

**Description:** Add `plan`, `subscription{providerSubscriptionId,status,currentPeriodEnd,cancelAtPeriodEnd}` to `models/user.ts`; add `isPrivate` to `ImageObjectSchema` in `models/image.ts` (ask-first approved by spec scope); implement `isPro(user, now)`; return `plan`, `periodEnd`, `cancelAtPeriodEnd` from the existing own-user `GET /users/:id`; delete the unguarded `GET /users/update/plan` route and `updateUserPlan`.
**Acceptance criteria:**

- [ ] `isPro` tests: free, pro active, pro past_due before/after period end, boundary equals, cancelled with future end, missing subscription
- [ ] Legacy user docs (no fields) behave as free
- [ ] `GET /users/:id` returns plan fields
- [ ] `GET /users/update/plan` returns 404; `updateUserPlan` removed
      **Verification:** `cd apps/api && bun run test`.
      **Dependencies:** 5.1
      **Files:** `models/user.ts`, `models/image.ts`, `lib/isPro.ts` (+test), `routes/users.ts`, `services/user-service.ts`; shared `types/domain.ts` (in 5.1)
      **Scope:** Medium

### Checkpoint: Phase 5

- [ ] api + shared tests, check, lint green; no behaviour change for existing users

## Phase 6: Dodo subscription end to end (B2, B3)

### Task 6.1: Create Dodo Pro product and env

**Description:** Use dodopayments MCP `execute` to create "Visual AI Pro" ($5 USD monthly subscription) in test mode; confirm exact subscription event names via `search_docs`. Add `DODO_PRODUCT_ID_PRO` to env schema and `.env.example`. Live product is a go-live step (ask first).
**Acceptance criteria:**

- [ ] Test-mode product exists; ID recorded in checklist (not committed secret)
- [ ] Env schema validates the new var; event-name list written into the task notes
      **Verification:** MCP list of products shows it; api tests for env.
      **Dependencies:** 5.1
      **Files:** `config/env.ts`, `.env.example`
      **Scope:** Small

### Task 6.2: Subscription checkout (`POST /payments/subscribe`)

**Description:** Extend adapter/service/router with subscription checkout carrying `metadata.userId`; auth required; 409 if already Pro active and not cancelled.
**Acceptance criteria:**

- [ ] Returns checkout URL; 401 unauthenticated; 409 for active Pro
- [ ] Adapter unit tests with mocked Dodo client
      **Verification:** api tests.
      **Dependencies:** 5.2, 6.1
      **Files:** `payments/{service,router,types}.ts`, `dodo/{adapter,productMap}.ts`, tests
      **Scope:** Medium

### Task 6.3: Subscription webhook lifecycle

**Description:** Extend `eventMapper.ts` and `applyEvent` for active, renewed, cancelled, failed/on_hold, expired; reuse signature verification and event-id idempotency.
**Acceptance criteria:**

- [ ] Each event sets plan/status/period fields per spec; cancelled stays Pro until period end; failed grace until period end
- [ ] Duplicate event id is a no-op; out-of-order events do not regress state (compare by period/timestamp)
- [ ] Integration test with signed payloads for the full lifecycle (`signWebhook.ts` pattern)
      **Verification:** api tests incl. webhook route integration.
      **Dependencies:** 6.2
      **Files:** `dodo/eventMapper.ts`, `payments/service.ts`, `webhookRouter.ts`, tests
      **Scope:** Medium

### Checkpoint: Phase 6

- [ ] Lifecycle tests green; manual Dodo test-mode subscribe flips plan (owner-assisted)

## Phase 7: Perks (each vertical: server + test; UI in Phase 9). Tasks 7.1-7.5 mutually independent after Phase 5.

### Task 7.1: Premium model gate

**Acceptance criteria:**

- [ ] Non-Pro request for any `PREMIUM_MODEL_KEYS` model returns 403 typed error before queueing and before credit deduction (credits unchanged assertion)
- [ ] Pro succeeds; non-premium unaffected
      **Verification:** api tests as free and Pro user.
      **Dependencies:** 5.2
      **Files:** `routes/generate.ts`, `services/generation-service.ts`, `lib/errors.ts`, tests
      **Scope:** Small

### Task 7.2: Priority queue

**Acceptance criteria:**

- [ ] `enqueueGeneration` sets BullMQ `priority` from `QUEUE_PRIORITY` using `isPro`; retries keep priority
- [ ] Unit test on options passed to `generationQueue.add`
      **Dependencies:** 5.2
      **Files:** `queue/generation-queue.ts`, job data type, test
      **Scope:** Small

### Task 7.3: History cap with atomic guard and unsaved path

**Description:** Free 100 / Pro 500. Conditional update using `$expr` size check; at cap skip Cloudinary upload, return Replicate URL, `savedToHistory:false`, credits still charged.
**Acceptance criteria:**

- [ ] Tests: cap-1 saves, cap not saved, concurrent jobs never exceed cap
- [ ] Over-cap path makes 0 Cloudinary upload calls; response has `savedToHistory:false` + Replicate URL
- [ ] Grandfathered free users with > 100 can read/delete, cannot add
      **Dependencies:** 5.2
      **Files:** `services/generation-service.ts`, `models/user.ts`, shared `types/domain.ts`, tests
      **Scope:** Medium

### Task 7.4: Private generations and Explore filter

**Acceptance criteria:**

- [ ] Pro generations stored `isPrivate:true`; free not
- [ ] Explore aggregation excludes private, includes legacy docs missing the field; any single-image public fetch also enforced
- [ ] Downgrade keeps existing private images private
      **Dependencies:** 5.2
      **Files:** `generation-service.ts`, `explore-service.ts`, `routes/explore.ts`, tests
      **Scope:** Medium

### Task 7.5: Server download endpoint (perk c)

**Description:** Endpoint returning/redirecting to optimized (`q_auto,f_auto,w_2048,c_limit`) for free, original for Pro.
**Acceptance criteria:**

- [ ] Free gets derivative URL; Pro gets original; unauthenticated/not-owner rejected
      **Dependencies:** 5.2
      **Files:** `routes/image.ts` (`GET /images/:imageId/download`), `services/download-service.ts`, tests
      **Scope:** Small-Medium

### Task 7.6 (A5): Client downloads use the endpoint

**Description:** Switch `getDownloadImageUrl`/`downloadImage`/`bulkDownload` in `utils/helpers.ts` (used by `ImageDialog.vue`) to the server endpoint, including bulk.
**Acceptance criteria:**

- [ ] No client-built original URLs remain; bulk works; existing download tests updated
      **Dependencies:** 7.5
      **Files:** `utils/helpers.ts`, `Dialogs/ImageDialog.vue`, `History/SelectActionButtons.vue`, tests
      **Scope:** Medium

### Checkpoint: Phase 7

- [ ] Each perk has a free-user test passing; api/web tests, check, lint green

## Phase 8: Localized pricing (C1)

### Task 8.1: Currency mapping and formatter (pure)

**Description:** Static country-to-currency table in `packages/shared`; price-conversion and `Intl.NumberFormat` helpers; USD fallback rules.
**Acceptance criteria:**

- [ ] Tests: header mapping, unknown/missing -> USD, unsupported currency -> USD, formatter per locale
      **Dependencies:** 5.1
      **Files:** shared `pricing/*` + tests
      **Scope:** Small

### Task 8.2: FX table + country resolution + `GET /payments/prices`

**Description:** Daily FX refresh cached in Redis (stale > 48h -> USD); country from geo header, IP lookup fallback (confirm production header at build time; new dependency requires asking first); endpoint shape per spec with `isEstimate:true`; public route (outside `requireAuth`).
**Acceptance criteria:**

- [ ] Contract matches spec; stale FX -> USD; failed lookup -> USD
- [ ] Never used for charging (code path review)
      **Dependencies:** 8.1, 6.1
      **Files:** `payments/prices*.ts`, router, Redis helper, tests
      **Scope:** Medium

### Task 8.3: Enable Adaptive Currency (owner/manual)

**Description:** Dodo dashboard toggle in test then live; verify supports subscriptions.
**Acceptance:** Test checkout from non-US billing address shows local currency for a pack and Pro.
**Dependencies:** 6.2
**Scope:** XS (manual)

## Phase 9: Web UI

### Task 9.1: Plan store and Pro badge

**Description:** Store plan fields from `GET /users/:id`; Pro badge in `Header/UserMenu.vue`; Dodo customer portal link in `Profile/UserDetails.vue`.
**Acceptance:** Free sees no badge; Pro sees badge and portal link.
**Dependencies:** 5.2
**Files:** `stores/user.ts`, `Header/UserMenu.vue`, `Profile/UserDetails.vue`, tests
**Scope:** Small-Medium

### Task 9.2: Pricing/upgrade dialog

**Description:** Extend existing `Dialogs/PricingDialog.vue` + `composables/usePricingCatalog.ts` + `payments/usePurchase.ts` (new `Pricing/PricingProCard.vue`): perk list, localized Pro price and "approx." note, subscribe button calling `/payments/subscribe`; also localize credit packs.
**Acceptance:** Shows local currency with mocked geo header, USD without; 409 handled gracefully.
**Dependencies:** 6.2, 8.2, 9.1
**Scope:** Medium

### Task 9.3: Premium lock badges

**Description:** Lock badge and upsell on premium models for non-Pro in `Dashboard/ModelPicker/ModelOption.vue`; on 403 open the pricing dialog.
**Acceptance:** Free sees locks; Pro sees none; 403 opens pricing dialog.
**Dependencies:** 7.1, 9.1
**Scope:** Small-Medium

### Task 9.4: Unsaved result notice

**Description:** `Dashboard/Canvas/UnsavedResultNotice.vue` shown by `ResultCanvas.vue` on `savedToHistory:false`: persistent notice with expiry copy and Download button; free sees Upgrade CTA, Pro sees "Delete images to free space".
**Acceptance:** Notice persists until dismissed; CTA differs by plan.
**Dependencies:** 7.3, 9.1
**Scope:** Medium

### Task 9.5: Pro e2e suite (`e2e/qa/pro-tier.spec.ts`)

**Description:** Webhook-simulated Pro: locked premium model for free, selectable for Pro, not-saved notice, Pro generation hidden from Explore, local currency display, 409 when already Pro.
**Dependencies:** 9.1-9.4
**Scope:** Medium

### Checkpoint: Phase 9

- [ ] Component, store and Pro e2e tests pass

## Phase 10: Walkthrough and go-live

### Task 10.1: Walkthrough

**Description:** Walk the Pro UI using the seeded QA specs (pro-tier, landing-no-cloudinary) as evidence.
**Dependencies:** all above
**Scope:** Small

### Task 10.2: Go-live checklist (owner)

- [ ] Second Cloudinary account created; all non-prod env files repointed; usage alert at 70%
- [ ] Dodo live: Adaptive Currency on; live Pro product created (ask first); `DODO_PRODUCT_ID_PRO` set in prod; webhook endpoint subscribed to subscription events
- [ ] Production geo header confirmed
- [ ] Full month Cloudinary check <= ~4 credits; total infra < $30/month

### Checkpoint: Complete

- [ ] All SPEC success criteria met; unit + check + lint + e2e (dev and `E2E_SERVER=prod`) green; owner review

## Risks and Mitigations

| Risk                                                              | Impact | Mitigation                                         |
| ----------------------------------------------------------------- | ------ | -------------------------------------------------- |
| Spec event names differ from Dodo reality                         | High   | Task 6.1 confirms via `search_docs` before 6.3     |
| Playwright spec bypasses mock via raw imports                     | High   | Config-level hook plus guard test (1.2)            |
| Concurrent jobs exceed history cap                                | Med    | Atomic conditional update + concurrency test (7.3) |
| Out-of-order webhooks regress plan                                | Med    | Ordering check + tests (6.3)                       |
| Geo header not provided by DigitalOcean                           | Med    | Build-time check; IP lookup fallback; USD default  |
| IP-lookup/FX needs new dependency                                 | Low    | Ask first per Boundaries                           |
| Original asset URLs publicly guessable                            | Low    | Accepted (Assumption 3)                            |
| Legacy `GET /users/update/plan` lets any signed-in user grant Pro | High   | Removed in Task 5.2 with a 404 test                |
| nginx serves SPA shell for `.mp4` and sets no cache headers       | Med    | `spa.conf` edited in Task 4.1                      |
| Landing media re-encode degrades quality                          | Low    | Visual review before removing Cloudinary refs      |

## Open Questions (build-time only)

- Exact Dodo subscription event names (6.1)
- Production geo header (8.2)
- Adaptive Currency support for subscriptions in this account (8.3)
