# Tasks: Cloudinary Cost Reduction + Pro Tier

Source: SPEC.md, PLAN.md. Branch: feature-enhancement. Never start servers (always running). No commits unless the owner asks. The project already has Playwright, Vitest, the seeded QA harness (`apps/web/e2e/qa/`, `e2e/fixtures/qa.ts`), e2e prod-server mode (`E2E_SERVER=prod`) and the required .gitignore entries, so no Phase 0 setup tasks are needed.

Commands: web `cd apps/web && bun run test` / `bun run check` / `bun run lint`; api `cd apps/api && bun run test`; e2e `cd apps/web && bunx playwright test <spec>`. There is no `typecheck` script; `bun run check` (`vp check`) covers types.

## Phase 1: Playwright Cloudinary mock

**Adds:** Every Playwright run serves Cloudinary requests from local fixtures, so tests stop burning production bandwidth. A guard fails the run if any request reaches res.cloudinary.com.
**Try in UI:** No UI change ; run `cd apps/web && bunx playwright test e2e/qa/cloudinary-mock.spec.ts` and confirm green ; run it with `E2E_SERVER=prod` and confirm green.

### ✅ T1.1 Cloudinary route mock, fixtures and test-runner config

- **Kind:** implementation
- **Files:** `apps/web/e2e/support/cloudinaryMock.ts`, `apps/web/e2e/fixtures/assets/placeholder.webp`, `apps/web/e2e/fixtures/assets/placeholder.mp4`, `apps/web/vite.config.mts`, `apps/web/playwright.config.ts`
- **Do:** Register `context.route("**/res.cloudinary.com/**")` fulfilling `video/mp4` when the path contains `/video/` or `.mp4`, else `image/webp`. Export a pure `pickMockAsset(url)` and a request recorder (requested URLs, network-reaching hits). Commit tiny binary fixtures. Add `e2e/support/**/*.test.ts` to the Vitest `test.include` (today only `src/**`) and add a top-level `testIgnore: /\.test\.ts$/` to `playwright.config.ts` so Playwright never picks up Vitest files.
- **Acceptance:** Mock registers on a browser context; video vs image selection correct; fixtures are each under 50 KB; mock exposes the list of requested URLs; `bunx playwright test --list` lists no `*.test.ts` file.
- **Verify:** `cd apps/web && bun run check`; `bun run lint`; `bunx playwright test --list | grep -c "\.test\.ts"` prints 0.

### ✅ T1.2 Shared auto fixture with guard, setup coverage

- **Kind:** implementation
- **Files:** `apps/web/e2e/fixtures/base.ts`, `apps/web/e2e/fixtures/qa.ts`, `apps/web/e2e/fixtures/generation.ts`, `apps/web/e2e/auth.setup.ts`, `apps/web/e2e/global.setup.ts`
- **Do:** New `fixtures/base.ts` extends `@playwright/test` with an auto, context-scoped fixture that installs the mock and a guard failing the test if any `res.cloudinary.com` request reaches the network, plus an explicit opt-out option (used by T4.3). `qa.ts` and `generation.ts` extend `base.ts` instead of bare `@playwright/test`. `auth.setup.ts` imports `test` from `base.ts`. `global.setup.ts` is a plain `globalSetup` function; install the mock there only if it opens a browser page.
- **Acceptance:** Every test in the setup, guest, chromium-billing and chromium projects gets the mock; guard fails when a Cloudinary request escapes (proved by a temporary negative check, then reverted).
- **Verify:** `cd apps/web && bun run check`; `bun run lint`; `bunx playwright test e2e/auth.setup.ts`.

### ✅ T1.3 Migrate specs that import bare test

- **Kind:** implementation
- **Files:** `apps/web/e2e/explore.spec.ts`, `apps/web/e2e/shell.spec.ts`, `apps/web/e2e/marketing.spec.ts`, `apps/web/e2e/assets.spec.ts`, `apps/web/e2e/auth.spec.ts`
- **Do:** One-line import edits so each spec imports `test` from `./fixtures/base` (keep `expect` and types as they are). These are the only specs importing bare `test` from `@playwright/test` (grep 2026-10-31); re-run the grep first in case more were added.
- **Acceptance:** No spec, setup or fixture file other than `fixtures/base.ts` imports `test` from `@playwright/test`; full suite green in dev and `E2E_SERVER=prod` modes.
- **Verify:** `cd apps/web && grep -rlE "import \{[^}]*\btest\b[^}]*\} from ['\"]@playwright/test" e2e` prints only `e2e/fixtures/base.ts`; `bun run test:e2e`; `E2E_SERVER=prod bun run test:e2e`.

### ✅ T1.4 Unit: Cloudinary mock helper

- **Kind:** unit
- **Files:** `apps/web/e2e/support/cloudinaryMock.ts`
- **Do:** Cover `pickMockAsset` and recorder logic (video path, `.mp4`, image, query strings, non-Cloudinary host) in `e2e/support/cloudinaryMock.test.ts`.
- **Acceptance:** Every file at least 80% lines/branches/functions/statements, target over 95%; no `it.fails` unless the source has a real bug.
- **Verify:** `cd apps/web && npx vitest run e2e/support/cloudinaryMock.test.ts --coverage --coverage.include=e2e/support/cloudinaryMock.ts --coverage.reporter=text`

### ✅ T1.5 E2E: Cloudinary mock guard

- **Kind:** e2e
- **Scenarios:** `@critical` a page that requests a Cloudinary image gets the placeholder and zero network hits; `@critical` a video URL gets the mp4 fixture; `@high` the guard fails when the route is removed (negative case asserted via recorder).
- **Spec:** `apps/web/e2e/qa/cloudinary-mock.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from SPEC A1 pass; zero Cloudinary requests reach the network.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/cloudinary-mock.spec.ts --repeat-each=3`

### ✅ T1.6 Gate: Phase 1

- **Kind:** gate
- **Files:** none
- **Do:** Run the full suites as evidence.
- **Acceptance:** Full Playwright run in both modes produces 0 network requests to `res.cloudinary.com`; no test weakened; check and lint clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/cloudinary-mock.spec.ts --repeat-each=2`; `bun run test`; `bun run check`; `bun run lint`; `bun run test:e2e`; `E2E_SERVER=prod bun run test:e2e`.

🔶 **Checkpoint 1**: full e2e run makes 0 production Cloudinary requests in dev and prod-preview modes.

## Phase 2: Separate Cloudinary cloud for dev, e2e and staging

**Adds:** Dev, e2e and staging are documented and checked to use a separate free Cloudinary cloud, never production.
**Try in UI:** No UI change ; open `apps/api/.env.example` and `apps/web/.env.example` and read the dev-cloud notes ; run `node apps/web/scripts/check-cloudinary-env.mjs` and confirm it flags `ddzuitkzt` in any non-production env file.

### ✅ T2.1 Env docs and model-input tests

- **Kind:** implementation
- **Files:** `apps/api/.env.example`, `apps/web/.env.example`, `apps/api/src/lib/model-input.test.ts`, `apps/api/src/lib/model-input.ts`
- **Do:** Document the five vars that remain after Phase 4 (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_BASE_PATH` dev default `private/development/uploads`, `VITE_CLOUDINARY_BASE_URL`) plus `VITE_CLOUDINARY_ASSETS_URL` until T4.2 removes it; same dev cloud for api and web; staging and `.env.e2e-preview` must not use the production cloud; optional 70% usage alert. Parameterise model-input tests on the env cloud name.
- **Acceptance:** Both examples list the vars with comments and no real secrets; model-input accepts a dev-cloud URL and rejects another cloud.
- **Verify:** `cd apps/api && bun run test`

### ✅ T2.2 Env leak check script and owner checklist

- **Kind:** implementation
- **Files:** `apps/web/scripts/check-cloudinary-env.mjs`, `apps/web/vite.config.mts`, `agent_docs/cloudinary-cost-and-pro/GO-LIVE.md`, `apps/api/.env.example`
- **Do:** Script scans `apps/web/.env*` and `apps/api/.env*` (skips absent files) and exits non-zero if the production cloud name `ddzuitkzt` appears in any file not matching `.env.production*` (example files included). Add `scripts/**/*.test.mjs` to the Vitest `test.include`. Write the owner repoint checklist (second free account; repoint `apps/web/.env.local`, `apps/web/.env.staging`, `.env.e2e*`, `apps/api/.env`, `apps/api/.env.staging`) and reference it from `.env.example`.
- **Acceptance:** Exits 1 and names the file when a non-production env file holds `ddzuitkzt`; exits 0 when none; checklist exists and is referenced.
- **Verify:** `node apps/web/scripts/check-cloudinary-env.mjs; echo $?` (output reviewed); `cd apps/web && bun run check`.

### ✅ T2.3 Unit: env leak check

- **Kind:** unit
- **Files:** `apps/web/scripts/check-cloudinary-env.mjs`, `apps/web/scripts/check-cloudinary-env.test.mjs`
- **Do:** Cover detection, production-file exemption, missing files and exit codes using temp directories.
- **Acceptance:** Every file at least 80% lines/branches/functions/statements, target over 95%.
- **Verify:** `cd apps/web && npx vitest run scripts/check-cloudinary-env.test.mjs --coverage --coverage.include=scripts/check-cloudinary-env.mjs --coverage.reporter=text`

### ✅ T2.4 Gate: Phase 2

- **Kind:** gate
- **Files:** `packages/email/package.json`, `packages/email/tsconfig.json`, `apps/web/scripts/.gitignore`, `bun.lock`
- **Do:** Owner confirms the manual env repoint; run suites as evidence.
- **Acceptance:** Check script exits 0 on the owner machine; an upload during a dev session appears in the dev cloud (owner confirmed); tests green.
- **Verify:** `node apps/web/scripts/check-cloudinary-env.mjs`; `cd apps/api && bun run test`; `cd apps/web && bun run test`; `bun run check`.

### ✅ T2.5 E2E: reference image from configured cloud

- **Kind:** e2e
- **Scenarios:** `@high` a reference image URL from the configured cloud is accepted; `@high` a URL from another cloud is rejected with an error; `@medium` empty reference input is ignored.
- **Spec:** `e2e/qa/dev-cloud-reference.spec.ts`
- **Files:** `apps/web/e2e/qa/dev-cloud-reference.spec.ts`
- **Acceptance:** Scenarios derived from the SPEC acceptance criteria pass with zero Cloudinary network hits.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/dev-cloud-reference.spec.ts --repeat-each=3`

🔶 **Checkpoint 2**: no non-production env file points at the production cloud; owner confirmed.

## Phase 3: Thumbnails

**Adds:** Grids load small optimized thumbnails instead of full-size images, cutting bandwidth. The image dialog still shows full size.
**Try in UI:** Open History and inspect an image request URL for `w_400` ; open Collections and the dashboard generations grid and check the same ; open an image in the dialog and confirm it loads the full-size URL.

### ✅ T3.1 thumbUrl helper

- **Kind:** implementation
- **Files:** `apps/web/src/utils/cloudinaryUrl.ts`
- **Do:** `thumbUrl(url)` inserts `q_auto,f_auto,w_400,c_limit` after `/upload/` for Cloudinary URLs only; passthrough otherwise; idempotent. Use named constants.
- **Acceptance:** Handles Cloudinary, already-transformed, non-Cloudinary, video and malformed URLs without throwing.
- **Verify:** `cd apps/web && bun run check`; `bun run lint`.

### ✅ T3.2 Use thumbnails in grids

- **Kind:** implementation
- **Files:** `apps/web/src/components/History/History.vue`, `apps/web/src/components/Dashboard/Feed/UserGenerationsGrid.vue`, `apps/web/src/components/History/CollectionsStrip.vue`
- **Do:** Apply `thumbUrl` to grid `<img>` sources; leave `Dialogs/ImageDialog.vue` full size.
- **Acceptance:** Thumbnail `src` contains `w_400`; dialog image is unchanged; existing component tests still pass.
- **Verify:** `cd apps/web && bun run check`; `bun run test`.

### ✅ T3.3 Unit: thumbUrl

- **Kind:** unit
- **Files:** `apps/web/src/utils/cloudinaryUrl.ts`, `apps/web/src/utils/cloudinaryUrl.test.ts`
- **Do:** Cover Cloudinary URL, already-transformed, non-Cloudinary, video, malformed, empty.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/utils/cloudinaryUrl.test.ts --coverage --coverage.include=src/utils/cloudinaryUrl.ts --coverage.reporter=text`

### ✅ T3.4 E2E: thumbnail requests

- **Kind:** e2e
- **Scenarios:** `@high` History grid image request URL contains `w_400`; `@high` collections strip image request URL contains `w_400`; `@high` ImageDialog requests the non-thumbnail URL; `@medium` empty history renders no image requests.
- **Spec:** `apps/web/e2e/qa/thumbnails.spec.ts`
- **Files:** none
- **Acceptance:** Mock recorder confirms requested URLs per scenario.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/thumbnails.spec.ts --repeat-each=3`

🔶 **Checkpoint 3**: grids request `w_400` thumbnails, dialog full size, unit and e2e green.

## Phase 4: Self-host landing assets

**Adds:** Landing and marketing pages serve optimized images (and any demo videos) from the web host instead of Cloudinary.
**Try in UI:** Open `/` and watch the network tab for zero `res.cloudinary.com` requests ; open `/gallery` and a feature landing page and check the same ; open the signup dialog and confirm its images load.

### ✅ T4.1 Optimise and relocate media, cache headers

- **Kind:** implementation
- **Files:** `apps/web/public/landing/*`, `apps/web/nginx/conf/spa.conf`
- **Do:** Download every Cloudinary asset referenced by `utils/landing.ts`, `utils/communityMock.ts`, `utils/gallery.json` and `Dialogs/SignupDialog.vue`; convert images to WebP (revive-1 at most ~150 KB), hashed filenames. No current source references a Cloudinary MP4 (intro videos already live in `/intro/`); re-encode demo MP4s (H.264, CRF ~28, faststart, no audio, poster) only if the download list contains any. In `spa.conf` (the conf the Dockerfile copies), add a `location /landing/` block with `Cache-Control: public, max-age=31536000, immutable`, and add `mp4|webm` to the static-extension regex so videos are not served the SPA shell. Existing Cloudinary copies stay.
- **Acceptance:** Every image at most ~150 KB (revive-1 included); any MP4 at most ~1 MB with a poster; `spa.conf` serves `/landing/*` with the immutable header.
- **Verify:** `ls -lh apps/web/public/landing`; `grep -n "landing\|immutable\|mp4" apps/web/nginx/conf/spa.conf`.

### ✅ T4.2 Repoint references and remove env var

- **Kind:** implementation
- **Files:** `apps/web/src/utils/landing.ts`, `apps/web/src/utils/communityMock.ts`, `apps/web/src/utils/gallery.json`, `apps/web/src/components/Dialogs/SignupDialog.vue`, `apps/web/.env.example`
- **Do:** Point to `/landing/...`; remove `VITE_CLOUDINARY_ASSETS_URL` from source and `apps/web/.env.example` once unused (`pages/Examples.vue` and the `Landing/*` components consume these modules and need no edit; re-grep to confirm). Remove the var from `vite-env.d.ts` if declared there.
- **Acceptance:** Only user-content code paths (History, grids, collections, ImageDialog, helpers) still reference Cloudinary; `VITE_CLOUDINARY_ASSETS_URL` no longer appears in `apps/web/src`.
- **Verify:** `grep -rn "res.cloudinary.com\|CLOUDINARY_ASSETS_URL" apps/web/src`; `cd apps/web && bun run check`; `bun run test`.

### ✅ T4.5 Unit: landing asset references

- **Kind:** unit
- **Files:** `apps/web/src/utils/landing.ts`
- **Do:** Assert every exported landing URL resolves under `/landing/` and none contains `res.cloudinary.com`.
- **Acceptance:** Every file at least 80% lines/branches/functions/statements, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/utils/landing.test.ts --coverage --coverage.include=src/utils/landing.ts --coverage.reporter=text`

### ✅ T4.3 E2E: marketing pages make no Cloudinary requests

- **Kind:** e2e
- **Scenarios:** `@critical` `/` attempts 0 requests to `res.cloudinary.com` (mock opted out, attempted requests counted and aborted); `@high` `/gallery`, `/examples`, `/pricing` and one feature landing attempt 0; `@high` the signup dialog images load from `/landing/`.
- **Spec:** `apps/web/e2e/qa/landing-no-cloudinary.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios from SPEC A3 pass; the spec opts out of the global mock explicitly and documents why.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/landing-no-cloudinary.spec.ts --repeat-each=3`

### ✅ T4.4 Gate: Workstream A

- **Kind:** gate
- **Files:** none
- **Do:** Run all suites as evidence for Workstream A.
- **Acceptance:** Unit, check, lint and e2e all green; owner reviews before Workstream B. Post-deploy interim measurement (7-day bandwidth under 1 GB) is tracked in GO-LIVE, not a build gate.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/landing-no-cloudinary.spec.ts e2e/qa/cloudinary-mock.spec.ts e2e/qa/thumbnails.spec.ts --repeat-each=2`; `bun run test`; `bun run check`; `bun run lint`; `bun run test:e2e`.

🔶 **Checkpoint 4**: Workstream A code complete, landing makes 0 Cloudinary requests, human review before Workstream B.

## Phase 5: Plan foundation

**Adds:** The data model and a single `isPro` helper for free and Pro plans, and the old unguarded plan-change route is closed; nothing else changes for existing users.
**Try in UI:** No UI change ; call `GET /users/<your id>` and confirm `plan`, `periodEnd`, `cancelAtPeriodEnd` appear with `plan: "free"` ; call `GET /users/update/plan?plan=pro` and confirm 404 ; run `cd apps/api && bun run test` and confirm the `isPro` tests pass.

### ✅ T5.1 Shared plan constants and types

- **Kind:** implementation
- **Files:** `packages/shared/src/models/plans.ts`, `packages/shared/src/models/index.ts`, `packages/shared/src/types/domain.ts`
- **Do:** Export `PLAN`, `HISTORY_CAP`, `PRO_PRICE_USD_MONTHLY`, `PREMIUM_MODEL_KEYS` (explicit constant: `NANO_BANANA_PRO`, `GPT_IMAGE_2`, `FLUX_2_MAX`), `QUEUE_PRIORITY`, `PlanSchema`, `SubscriptionStatus` from the models barrel. Add `plan`, `periodEnd`, `cancelAtPeriodEnd` to `IUser` and optional `isPrivate` to `IImageObject`.
- **Acceptance:** Constants match SPEC; premium keys typed as `ModelKey`; importable from `@visual-ai/shared`.
- **Verify:** `bun run check`.

### ✅ T5.2 User model fields, isPro, plan status and closing the legacy plan route

- **Kind:** implementation
- **Files:** `apps/api/src/models/user.ts`, `apps/api/src/models/image.ts`, `apps/api/src/lib/isPro.ts`, `apps/api/src/routes/users.ts`, `apps/api/src/services/user-service.ts`
- **Do:** Add `plan` (default free) and `subscription{providerSubscriptionId,status,currentPeriodEnd,cancelAtPeriodEnd}` to the user schema; add `isPrivate` to `ImageObjectSchema` (embedded in `User.history`); implement `isPro(user, now)`; return `plan`, `periodEnd`, `cancelAtPeriodEnd` from the existing own-user route `GET /users/:id`. Delete the unguarded `GET /users/update/plan` route and `updateUserPlan` (no callers; any signed-in user could self-grant Pro once `plan` exists).
- **Acceptance:** Legacy docs without the fields behave as free; `GET /users/:id` returns plan fields; `GET /users/update/plan` returns 404; no perk reads `user.plan` directly.
- **Verify:** `cd apps/api && bun run test`; `bun run check`; `grep -rn "updateUserPlan\|update/plan" apps/api/src` prints nothing.

### ✅ T5.3 Unit: plans constants

- **Kind:** unit
- **Files:** `packages/shared/src/models/plans.ts`
- **Do:** Assert caps, price, priority, and that each premium key exists in the registry.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `npx vitest run packages/shared/src/models/plans.test.ts --coverage --coverage.include=packages/shared/src/models/plans.ts --coverage.reporter=text`

### ✅ T5.4 Unit: isPro and plan status route

- **Kind:** unit
- **Files:** `apps/api/src/lib/isPro.ts`, `apps/api/src/routes/users.ts`
- **Do:** Cover free, pro active, past_due before/after period end, boundary equals, cancelled with future end, missing subscription, legacy doc; route returns plan fields and the removed plan route 404s.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/lib/isPro.test.ts src/routes/users.test.ts --coverage --coverage.include=src/lib/isPro.ts,src/routes/users.ts --coverage.reporter=text`

### ✅ T5.5 E2E: plan status for free users

- **Kind:** e2e
- **Scenarios:** `@critical` a free user sees no Pro badge and `/users/me` reports plan free; `@high` a legacy user without plan fields behaves as free; `@medium` plan state persists after reload.
- **Spec:** `e2e/qa/plan-status.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from the SPEC acceptance criteria pass with zero Cloudinary network hits.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/plan-status.spec.ts --repeat-each=3`

🔶 **Checkpoint 5**: api and shared tests, check, lint green; legacy plan route gone; no behaviour change for existing users.

## Phase 6: Dodo subscription end to end

**Adds:** Users can subscribe to Pro ($5/month) through Dodo checkout, and webhooks activate, renew, cancel and expire the plan.
**Try in UI:** No UI yet (UI is Phase 9) ; run `cd apps/api && bun run test` and confirm the webhook lifecycle tests pass ; owner: complete a Dodo test-mode subscription and confirm `GET /users/<your id>` shows `plan: "pro"`.

### ✅ T6.1 Dodo Pro product and env

- **Kind:** implementation
- **Files:** `apps/api/src/config/env.ts`, `apps/api/.env.example`, `agent_docs/cloudinary-cost-and-pro/GO-LIVE.md`
- **Do:** With the dodopayments MCP `execute`, create "Visual AI Pro" ($5 USD monthly subscription) in test mode; confirm exact subscription event names and payload fields via `search_docs` and record them in GO-LIVE.md. Add `DODO_PRODUCT_ID_PRO` to the env schema and example. Live product is a go-live step (ask first).
- **Acceptance:** Test-mode product exists via MCP product list; env schema validates the new var; event-name list recorded; no secret committed.
- **Verify:** `cd apps/api && bun run test`; MCP product list shows the product.

### ✅ T6.2 Subscription checkout (POST /payments/subscribe)

- **Kind:** implementation
- **Files:** `apps/api/src/payments/service.ts`, `apps/api/src/payments/router.ts`, `apps/api/src/payments/types.ts`, `apps/api/src/payments/dodo/adapter.ts`, `apps/api/src/payments/dodo/productMap.ts`
- **Do:** Add subscription methods to the existing `PaymentProvider` interface (`types.ts`) and Dodo adapter; checkout carries `metadata.userId`; auth required (router is already mounted behind `requireAuth`); 409 when already Pro with an active non-cancelled subscription.
- **Acceptance:** Returns checkout URL; 401 unauthenticated; 409 for active Pro; no parallel payment stack.
- **Verify:** `cd apps/api && bun run test`; `bun run check`.

### ✅ T6.3 Subscription webhook lifecycle

- **Kind:** implementation
- **Files:** `apps/api/src/payments/dodo/eventMapper.ts`, `apps/api/src/payments/service.ts`, `apps/api/src/payments/webhookRouter.ts`, `apps/api/src/payments/dodo/constants.ts`
- **Do:** Handle active, renewed, cancelled, failed/on_hold, expired per SPEC using the event names recorded in T6.1; reuse signature verification and event-id idempotency.
- **Acceptance:** Active sets pro and period end; renewed extends; cancelled sets `cancelAtPeriodEnd` and stays Pro until period end; failed marks `past_due` with grace until period end; expired sets free; duplicate event id is a no-op; out-of-order events do not regress state.
- **Verify:** `cd apps/api && bun run test`; `bun run check`.

### ✅ T6.4 Unit: Dodo adapter and subscribe service

- **Kind:** unit
- **Files:** `apps/api/src/payments/dodo/adapter.ts`, `apps/api/src/payments/dodo/productMap.ts`, `apps/api/src/payments/service.ts`, `apps/api/src/payments/router.ts`
- **Do:** Mock the Dodo client; cover subscription checkout creation, 401, 409, error mapping.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/payments --coverage --coverage.include=src/payments/dodo/adapter.ts,src/payments/dodo/productMap.ts,src/payments/service.ts,src/payments/router.ts --coverage.reporter=text`

### ✅ T6.5 Unit: webhook event mapper and applyEvent

- **Kind:** unit
- **Files:** `apps/api/src/payments/dodo/eventMapper.ts`, `apps/api/src/payments/webhookRouter.ts`
- **Do:** Cover each subscription event, duplicate event id, out-of-order events, unknown events, and a signed-payload integration test for the full lifecycle (`apps/web/e2e/support/signWebhook.ts` pattern).
- **Acceptance:** Every file at least 80% across all metrics, target over 95%; lifecycle integration test included.
- **Verify:** `cd apps/api && npx vitest run src/payments --coverage --coverage.include=src/payments/dodo/eventMapper.ts,src/payments/webhookRouter.ts --coverage.reporter=text`

### ✅ T6.6 E2E: subscription lifecycle

- **Kind:** e2e
- **Scenarios:** `@critical` signed active webhook flips the user to Pro; `@high` cancelled webhook keeps Pro until period end; `@high` expired webhook returns to free; `@medium` duplicate event id is a no-op; `@medium` subscribe while already Pro returns 409.
- **Spec:** `e2e/qa/subscription-lifecycle.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from the SPEC acceptance criteria pass with zero Cloudinary network hits.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/subscription-lifecycle.spec.ts --repeat-each=3`

🔶 **Checkpoint 6**: lifecycle tests green; owner-assisted Dodo test-mode subscribe flips plan.

## Phase 7: Perks (server-side)

**Adds:** Pro perks enforced by the API: premium models, priority queue, 500 history cap (free 100), private generations, full-quality downloads.
**Try in UI:** As a free user try a premium model and confirm it is rejected ; generate with a full history and confirm the result is not saved but downloadable ; download an image as free (optimized) and Pro (original).

### ☐ T7.1 Premium model gate

- **Kind:** implementation
- **Files:** `apps/api/src/routes/generate.ts`, `apps/api/src/services/generation-service.ts`, `apps/api/src/lib/errors.ts`
- **Do:** Reject `PREMIUM_MODEL_KEYS` requests from non-Pro with a typed 403 (subclass or code on the existing `ForbiddenError`, e.g. `PREMIUM_MODEL_REQUIRES_PRO`) before queueing and before credit deduction, via `isPro`.
- **Acceptance:** Non-Pro gets 403 with the typed code and credits unchanged; Pro succeeds; non-premium models unaffected.
- **Verify:** `cd apps/api && bun run test`; `bun run check`.

### ☐ T7.2 Priority queue

- **Kind:** implementation
- **Files:** `apps/api/src/queue/generation-queue.ts`, `apps/api/src/queue/generation-worker.ts`
- **Do:** `enqueueGeneration` sets BullMQ `priority` from `QUEUE_PRIORITY` using `isPro`; retries keep priority; carry the plan flag in job data.
- **Acceptance:** Pro jobs get priority 1, free 10; retry options preserve priority.
- **Verify:** `cd apps/api && bun run test`; `bun run check`.

### ☐ T7.3 History cap, atomic guard and unsaved path

- **Kind:** implementation
- **Files:** `apps/api/src/services/generation-service.ts`, `apps/api/src/models/user.ts`, `packages/shared/src/types/domain.ts`
- **Do:** Conditional update using `$expr` size check against `HISTORY_CAP`; at cap skip the Cloudinary upload, return the Replicate URL with `savedToHistory:false` (add the field to the generation progress/result type in `domain.ts`), still charge credits, no cleanup job.
- **Acceptance:** Cap-1 saves; at cap not saved; concurrent jobs never exceed cap; over-cap path makes 0 Cloudinary upload calls and returns the Replicate URL; grandfathered free users with over 100 can read and delete but not add.
- **Verify:** `cd apps/api && bun run test`; `bun run check`.

### ☐ T7.4 Private generations and Explore filter

- **Kind:** implementation
- **Files:** `apps/api/src/services/generation-service.ts`, `apps/api/src/services/explore-service.ts`, `apps/api/src/routes/explore.ts`
- **Do:** Pro generations stored `isPrivate:true`; Explore aggregation adds `"history.isPrivate": { $ne: true }` (matches legacy docs missing the field); enforce on any single-image public fetch in the explore routes. Downgrade keeps existing private images private.
- **Acceptance:** Pro images private, free not; Explore excludes private and includes legacy; single-image public fetch of a private image returns 404.
- **Verify:** `cd apps/api && bun run test`; `bun run check`.

### ☐ T7.5 Server download endpoint

- **Kind:** implementation
- **Files:** `apps/api/src/routes/image.ts`, `apps/api/src/services/download-service.ts`
- **Do:** Add `GET /images/:imageId/download` to the existing auth-mounted image routes, returning the optimized URL (`q_auto,f_auto,w_2048,c_limit`) for free users and the original for Pro; owner-only.
- **Acceptance:** Free gets derivative; Pro gets original; unauthenticated (401) and non-owner (404) rejected.
- **Verify:** `cd apps/api && bun run test`; `bun run check`.

### ☐ T7.6 Client downloads use the endpoint

- **Kind:** implementation
- **Files:** `apps/web/src/utils/helpers.ts`, `apps/web/src/components/Dialogs/ImageDialog.vue`, `apps/web/src/components/History/SelectActionButtons.vue`
- **Do:** Switch `getDownloadImageUrl`, `downloadImage`, `bulkDownload` to the server endpoint, including bulk (selection actions); update existing download tests.
- **Acceptance:** No client-built original URLs remain; single and bulk download go through the endpoint.
- **Verify:** `cd apps/web && bun run test`; `bun run check`; `grep -n "upload/" apps/web/src/utils/helpers.ts` shows no URL construction for downloads.

### ☐ T7.7 Unit: premium gate and priority queue

- **Kind:** unit
- **Files:** `apps/api/src/routes/generate.ts`, `apps/api/src/queue/generation-queue.ts`
- **Do:** Free vs Pro for premium and non-premium models (403 before credit deduction); assert options passed to `generationQueue.add`.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/routes src/queue --coverage --coverage.include=src/routes/generate.ts,src/queue/generation-queue.ts --coverage.reporter=text`

### ☐ T7.8 Unit: history cap and private generations

- **Kind:** unit
- **Files:** `apps/api/src/services/generation-service.ts`, `apps/api/src/services/explore-service.ts`, `apps/api/src/routes/explore.ts`
- **Do:** Cap-1, cap, concurrent saves, grandfathered users, 0 upload calls over cap, `savedToHistory:false`, private flag, Explore filter incl. legacy docs, single-image private 404.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/services src/routes/explore.test.ts --coverage --coverage.include=src/services/generation-service.ts,src/services/explore-service.ts,src/routes/explore.ts --coverage.reporter=text`

### ☐ T7.9 Unit: download service and client helpers

- **Kind:** unit
- **Files:** `apps/api/src/services/download-service.ts`, `apps/api/src/routes/image.ts`, `apps/web/src/utils/helpers.ts`
- **Do:** Free derivative vs Pro original, non-owner rejection, client single and bulk download via the endpoint.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/services/download-service.test.ts src/routes/image.test.ts --coverage --coverage.include=src/services/download-service.ts,src/routes/image.ts --coverage.reporter=text`; `cd apps/web && npx vitest run src/utils/helpers.test.ts --coverage --coverage.include=src/utils/helpers.ts --coverage.reporter=text`

### ☐ T7.10 E2E: Pro perks enforced

- **Kind:** e2e
- **Scenarios:** `@critical` free user gets 403 for a premium model and credits are unchanged; `@high` history at cap returns an unsaved result with Download; `@high` Pro generation hidden from Explore; `@high` free download is optimized and Pro download is original; `@medium` legacy docs still appear in Explore.
- **Spec:** `e2e/qa/pro-perks.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from the SPEC acceptance criteria pass with zero Cloudinary network hits.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pro-perks.spec.ts --repeat-each=3`

🔶 **Checkpoint 7**: every perk has a passing free-user API test; api and web tests, check, lint green.

## Phase 8: Localized pricing

**Adds:** Visitors see an approximate Pro and credit pack price in their local currency, falling back to USD; Dodo Adaptive Currency handles actual checkout.
**Try in UI:** No UI yet (UI is Phase 9) ; call `GET /payments/prices` with a geo country header and confirm local currency ; call without the header and confirm USD ; owner: in Dodo test checkout from a non-US billing address confirm local currency.

### ☐ T8.1 Currency mapping and formatter (pure)

- **Kind:** implementation
- **Files:** `packages/shared/src/pricing/currencyMap.ts`, `packages/shared/src/pricing/convert.ts`, `packages/shared/src/pricing/format.ts`, `packages/shared/src/index.ts`
- **Do:** Static country-to-currency table, price conversion and `Intl.NumberFormat` helpers, USD fallback rules; export from the shared index.
- **Acceptance:** Unknown or missing country gives USD; unsupported currency gives USD; formatting per locale.
- **Verify:** `bun run check`.

### ☐ T8.2 FX table, country resolution and GET /payments/prices

- **Kind:** implementation
- **Files:** `apps/api/src/payments/prices.ts`, `apps/api/src/payments/fx.ts`, `apps/api/src/payments/geo.ts`, `apps/api/src/payments/router.ts`
- **Do:** Daily FX refresh cached in Redis (stale over 48h gives USD); country from geo header with IP lookup fallback (confirm production header at build time; a new dependency requires asking first); response `{ country, currency, isEstimate: true, pro: { amountMinor, currency }, packs: [{ id, amountMinor, currency }] }`. Display only, never used for charging. The route must be reachable without auth (pricing page is public), so mount it outside `requireAuth`.
- **Acceptance:** Contract matches SPEC; stale FX, failed lookup and unknown country give USD; unauthenticated request returns 200; checkout code does not import `prices.ts` (grep).
- **Verify:** `cd apps/api && bun run test`; `bun run check`; `grep -rn "prices" apps/api/src/payments/service.ts` prints nothing.

### ☐ T8.3 Enable Adaptive Currency (owner, manual)

- **Kind:** walkthrough
- **Files:** none
- **Do:** Owner enables Adaptive Currency in the Dodo dashboard (test, then live) and confirms support for subscriptions.
- **Acceptance:** Test checkout from a non-US billing address shows local currency for a pack and for Pro.
- **Verify:** Owner confirmation recorded in GO-LIVE.md; supporting evidence `cd apps/api && bun run test`.

### ☐ T8.4 Unit: pricing helpers

- **Kind:** unit
- **Files:** `packages/shared/src/pricing/currencyMap.ts`, `packages/shared/src/pricing/convert.ts`, `packages/shared/src/pricing/format.ts`
- **Do:** Header mapping, unknown to USD, unsupported currency to USD, formatter per locale, rounding.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `npx vitest run packages/shared/src/pricing --coverage --coverage.include=packages/shared/src/pricing/currencyMap.ts,packages/shared/src/pricing/convert.ts,packages/shared/src/pricing/format.ts --coverage.reporter=text`

### ☐ T8.5 Unit: prices endpoint services

- **Kind:** unit
- **Files:** `apps/api/src/payments/prices.ts`, `apps/api/src/payments/fx.ts`, `apps/api/src/payments/geo.ts`
- **Do:** Contract shape, stale FX to USD, failed lookup to USD, header precedence over IP lookup, Redis cache hit and miss.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/api && npx vitest run src/payments --coverage --coverage.include=src/payments/prices.ts,src/payments/fx.ts,src/payments/geo.ts --coverage.reporter=text`

### ☐ T8.6 E2E: localized prices

- **Kind:** e2e
- **Scenarios:** `@high` a mocked country header shows local currency with the approx. note; `@high` no header shows USD; `@medium` stale FX shows USD.
- **Spec:** `e2e/qa/localized-prices.spec.ts`
- **Files:** none
- **Acceptance:** Scenarios derived from the SPEC acceptance criteria pass with zero Cloudinary network hits.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/localized-prices.spec.ts --repeat-each=3`

🔶 **Checkpoint 8**: prices contract tested with USD fallbacks; Adaptive Currency verified by the owner.

## Phase 9: Web UI

**Adds:** Pro badge, pricing and upgrade dialog with local currency, lock badges on premium models, and a not-saved notice with Download for over-cap results.
**Try in UI:** As a free user open the pricing dialog and see the Pro price in local currency ; pick a locked premium model and see the upsell ; fill history and generate to see the not-saved notice with Download ; as Pro open the user menu and see the Pro badge.

### ☐ T9.1 Plan state and Pro badge

- **Kind:** implementation
- **Files:** `apps/web/src/stores/user.ts`, `apps/web/src/components/Header/UserMenu.vue`, `apps/web/src/components/Profile/UserDetails.vue`
- **Do:** Store `plan`, `periodEnd`, `cancelAtPeriodEnd` from the existing `GET /users/:id` fetch; expose an `isPro` getter; Pro badge in the user menu; Dodo customer portal link on the profile.
- **Acceptance:** Free users see no badge; Pro users see badge and portal link; state updates on refetch.
- **Verify:** `cd apps/web && bun run check`; `bun run test`.

### ☐ T9.2 Pricing and upgrade dialog

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dialogs/PricingDialog.vue`, `apps/web/src/components/Pricing/PricingProCard.vue`, `apps/web/src/composables/usePricingCatalog.ts`, `apps/web/src/payments/usePurchase.ts`, `apps/web/src/payments/checkoutClient.ts`
- **Do:** Extend the existing pricing dialog and catalog (no parallel dialog or store): new `PricingProCard.vue` with perk list, localized Pro price and the note "Approx. price; final amount in your currency is shown at checkout"; `usePricingCatalog` fetches `GET /payments/prices` and formats credit pack prices too; subscribe calls `POST /payments/subscribe`; 409 handled gracefully.
- **Acceptance:** Local currency with a geo header, USD without; 409 shows a friendly "already Pro" message; pack prices localized.
- **Verify:** `cd apps/web && bun run check`; `bun run test`.

### ☐ T9.3 Premium lock badges

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue`, `apps/web/src/components/Dashboard/ModelPicker/PremiumLockBadge.vue`, `apps/web/src/stores/generate.ts`
- **Do:** Lock badge and upsell on `PREMIUM_MODEL_KEYS` for non-Pro; on a 403 `PREMIUM_MODEL_REQUIRES_PRO` from generate, open the pricing dialog.
- **Acceptance:** Free users see locks and upsell; Pro users see none; 403 opens the pricing dialog instead of a generic error.
- **Verify:** `cd apps/web && bun run check`; `bun run test`.

### ☐ T9.4 Unsaved result notice

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.vue`, `apps/web/src/components/Dashboard/Canvas/ResultCanvas.vue`, `apps/web/src/stores/generate.ts`
- **Do:** On `savedToHistory:false`, show the persistent notice "Not saved to history. This link expires in about 1 hour, download it now." with Download; free sees "Upgrade to Pro (500 history)" CTA, Pro at cap sees "Delete images to free space".
- **Acceptance:** Notice persists until dismissed or navigated away; CTAs differ by plan; Download uses the Replicate URL.
- **Verify:** `cd apps/web && bun run check`; `bun run test`.

### ☐ T9.5 Unit: plan, pricing and generate state

- **Kind:** unit
- **Files:** `apps/web/src/stores/user.ts`, `apps/web/src/composables/usePricingCatalog.ts`, `apps/web/src/stores/generate.ts`
- **Do:** Plan state and `isPro`, pricing fetch with USD fallback, unsaved-result state, 403 premium handling.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/stores src/composables --coverage --coverage.include=src/stores/user.ts,src/composables/usePricingCatalog.ts,src/stores/generate.ts --coverage.reporter=text`

### ☐ T9.6 Unit: UI components with logic

- **Kind:** unit
- **Files:** `apps/web/src/components/Pricing/PricingProCard.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue`, `apps/web/src/components/Dashboard/Canvas/UnsavedResultNotice.vue`
- **Do:** Component tests for the Pro card (409, price display), lock rendering, notice CTA per plan.
- **Acceptance:** Every file at least 80% across all metrics, target over 95%.
- **Verify:** `cd apps/web && npx vitest run src/components --coverage --coverage.include=src/components/Pricing/PricingProCard.vue,src/components/Dashboard/ModelPicker/ModelOption.vue,src/components/Dashboard/Canvas/UnsavedResultNotice.vue --coverage.reporter=text`

### ☐ T9.7 E2E: Pro tier

- **Kind:** e2e
- **Scenarios:** `@critical` free user sees locked premium model and upsell; `@critical` webhook-simulated Pro can select a premium model; `@high` not-saved notice with Download and correct CTA per plan; `@high` Pro generation hidden from Explore; `@high` mocked geo header shows local currency, no header shows USD; `@medium` 409 on subscribing while already Pro; `@medium` Pro badge persists after reload.
- **Spec:** `apps/web/e2e/qa/pro-tier.spec.ts`
- **Files:** `apps/web/e2e/support/signWebhook.ts`
- **Acceptance:** Scenarios derived from SPEC Workstream B pass; Pro state set only via signed webhook.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts --repeat-each=3`

🔶 **Checkpoint 9**: component, store and Pro-tier e2e tests pass.

## Phase 10: Walkthrough and go-live

**Adds:** A full walkthrough of the Pro experience and the owner go-live checklist.
**Try in UI:** Run `cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts` ; as free open a premium model and see the lock ; open `/` and confirm no Cloudinary requests.

### ☐ T10.1 Walkthrough: Pro tier UI

- **Kind:** walkthrough
- **Files:** none
- **Do:** Walk pricing dialog, lock badges, not-saved notice and Pro badge using the seeded QA specs.
- **Acceptance:** Every Phase 9 UI behaviour confirmed; evidence from the QA spec run.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts e2e/qa/landing-no-cloudinary.spec.ts --repeat-each=2`; `bun run test`; `bun run check`; `bun run lint`.

### ☐ T10.2 Go-live checklist (owner)

- **Kind:** walkthrough
- **Files:** `agent_docs/cloudinary-cost-and-pro/GO-LIVE.md`
- **Do:** Complete checklist: second Cloudinary account and env repoint with 70% usage alert; Dodo live Adaptive Currency on, live Pro product (ask first), `DODO_PRODUCT_ID_PRO` in prod, webhook subscribed to subscription events; production geo header confirmed; 7-day bandwidth under 1 GB; full-month Cloudinary at most ~4 credits; total infra under $30/month.
- **Acceptance:** Every SPEC success criterion maps to a checklist line with an owner action or command.
- **Verify:** Review GO-LIVE.md against SPEC success criteria.

### ☐ T10.3 Definition of done

- **Kind:** dod
- **Files:** none
- **Do:** Run every suite and map evidence to each SPEC success criterion.
- **Acceptance:** All code-verifiable SPEC success criteria met; unit, check, lint and e2e green in both server modes; owner reviews remaining manual items.
- **Verify:** `cd apps/api && bun run test`; `cd apps/web && bun run test`; `bun run check`; `bun run lint`; `bun run test:e2e`; `E2E_SERVER=prod bun run test:e2e`.

🔶 **Checkpoint 10**: all SPEC success criteria met; owner review.
