# Spec: Cloudinary Cost Reduction + Pro Tier

Status: DRAFT for owner review. Branch context: feature-enhancement.

## Objective

Two workstreams.

**A. Bring Cloudinary back under the free plan (25 credits/month).** (1 credit = 1 GB bandwidth, or 1 GB storage, or 1K transformations.)

October usage: 24.6 GB bandwidth + 1.07 GB storage (3.85K assets) + 401 transformations = 25.82 credits.

- ~72% of bandwidth came from localhost origins (127.0.0.1:4173 vite preview 9.8 GB, localhost:3005 5.1 GB, visual-ai.localhost 1.6 GB), caused by heavy Playwright e2e runs. Production visual-ai.app was only 6.6 GB.
- 62% of bandwidth was raw PNG with no q_auto. Top asset `revive-1.png` (2.69 MB, landing asset) served ~1200x = 3.2 GB. Demo MP4s = 5.3 GB.

**B. Re-add a Pro tier.** $5/month, perks only. Generations still cost credits (credit packs remain). Zero paying users today; total infra < $30/month (Replicate + DigitalOcean).

Users: owner (stop the bill), then visual-ai.app users.

### Success criteria

- Production Cloudinary <= ~4 credits/month (measured on the Cloudinary dashboard after a full month; interim check: 7-day bandwidth < 1 GB).
- A full Playwright run (dev and e2e-preview modes) produces 0 requests to `res.cloudinary.com` (asserted by a test, see Testing).
- Dev and e2e consume 0 production Cloudinary credits: no dev/e2e env file (`apps/web/.env.local`, `.env.e2e*`, `apps/api/.env`) contains the production cloud name, and uploads made during dev/e2e land in the dev cloud.
- Landing/marketing pages request no Cloudinary URLs.
- Pro purchasable via Dodo; every perk enforced server-side (client UI is cosmetic only). Each perk has a test that calls the API as a free user and gets the free behaviour (403 for premium model, `savedToHistory:false` at cap, optimized download URL, lower queue priority, public visibility).
- Cost goal: total infra (Replicate + DigitalOcean + Cloudinary) stays < $30/month; Cloudinary stays on the free plan ($0).
- Webhook lifecycle (activate, renew, cancel, fail) correctly flips `plan` with idempotency.

## Out of scope

Switching image provider (ImageKit etc.), migrating existing images, unlimited plans, annual plans, local-storage adapter.

## Current-state findings (from code)

- Uploads: `apps/api/src/utils/cloudinary.ts` applies no transformations on upload. Keep as is.
- `apps/api/src/lib/model-input.ts` validates reference URLs against `env.CLOUDINARY_CLOUD_NAME`; works per-env with no change.
- `apps/api/src/services/explore-service.ts:~103` already builds `q_auto,f_auto` URLs for the community feed.
- Landing asset URLs come from `apps/web/src/utils/landing.ts` via `VITE_CLOUDINARY_ASSETS_URL`; hard-coded Cloudinary URLs live in `utils/communityMock.ts` (10) and `utils/gallery.json` (98); `components/Dialogs/SignupDialog.vue` also uses the var. `pages/Examples.vue` and `components/Landing/*` consume these modules. No current source references a Cloudinary MP4 (intro videos are already self-hosted under `/intro/`), so the October MP4 bandwidth came from older deployed builds or user content.
- Web host: nginx (`apps/web/nginx/conf/spa.conf`, copied by `apps/web/Dockerfile`). Its static-file regex has no `mp4`/`webm` and sets no cache headers.
- Security: `GET /users/update/plan?userId=&plan=` (`routes/users.ts`, `updateUserPlan`) lets any signed-in user set any user's `plan`. It has no callers. Once `plan` is a real field it would grant free Pro, so it is removed in B.
- Own-user fetch is `GET /users/:id` (web `stores/user.ts`); there is no `/users/me`.
- Playwright config: `apps/web/playwright.config.ts`, tests in `apps/web/e2e/`, support in `apps/web/e2e/support/`. Modes: dev (default, app already running) and prod preview (`E2E_SERVER`, port 4173).
- Payments: provider abstraction in `apps/api/src/payments/` (`service.ts`, `router.ts`, `webhookRouter.ts`, `dodo/{adapter,eventMapper,productMap,constants,client}.ts`). Today the mapper handles only `payment.succeeded` / `payment.failed` (one-off credit packs, `getDodoProductIdForPack`). There is no subscription concept.
- Queue: BullMQ `apps/api/src/queue/generation-queue.ts` (`enqueueGeneration`, `generationQueue.add(kind, data, { jobId })`), worker `generation-worker.ts` with `GENERATION_CONCURRENCY`. No priority set.
- History: `User.history` is an embedded array of `ImageObjectSchema` in `apps/api/src/models/user.ts`; written in `services/generation-service.ts`; deleted in `image-service.ts`; Explore reads `history` via aggregation in `services/explore-service.ts` (filter at ~:146).
- Models defined in `packages/shared/src/models/registry.ts` (`ModelDefinition`, `ModelKey`); credit packs in `packages/shared/src/models/creditPacks.ts`.

## Tech stack

Bun monorepo; apps/api Express + TS + Mongoose + BullMQ/Redis; apps/web Vue 3 + Vite (vp); packages/shared (zod schemas, registry); Dodo Payments (`dodopayments` SDK); Cloudinary; Playwright; Vitest.

## Commands

Verified against package.json (2026-10-31). There is no `typecheck` script; `vp check` covers type/format checks.

- Install: `bun install`
- Lint (auto-fixes): `bun run lint` (root/web: `vp lint --fix`)
- Check (types/format): `bun run check` (root/web: `vp check`)
- Unit: root/web `bun run test` (`vp test run`); api `cd apps/api && bun run test` (`vitest run`)
- E2E: `cd apps/web && bun run test:e2e` (`playwright test`; projects: setup, guest, chromium-billing, chromium)
- Do NOT start servers (always running).

## Project structure (touch points)

```
apps/api/src/config/env.ts            env schema (new Dodo Pro vars)
apps/api/src/payments/                subscription events, plan mapping
apps/api/src/models/user.ts           plan fields
apps/api/src/queue/                   priority
apps/api/src/services/                generation (history cap, privacy, model gate), explore (private filter), download
apps/api/src/routes/                  users.ts (plan status, remove legacy plan route), image.ts (download), explore.ts
packages/shared/src/models/           PRO constants, plan types, premium model list
apps/web/e2e/support/                 cloudinaryMock.ts
apps/web/e2e/fixtures/assets/          placeholder.webp, placeholder.mp4 (binary fixtures)
apps/web/playwright.config.ts + fixtures  global route mock
apps/web/public/landing/              self-hosted marketing assets
apps/web/src/{utils/landing.ts,utils/communityMock.ts,utils/gallery.json,components/Dialogs/SignupDialog.vue}
apps/web/nginx/conf/spa.conf          /landing/* cache headers, mp4 static rule
```

## Code style

Follow `~/.claude/skills/code-style` and `typescript-best-practices`: named constants (no magic numbers), functions <~30 lines, early returns, no empty catch. Example:

```ts
// packages/shared/src/models/plans.ts
export const PLAN = { FREE: 'free', PRO: 'pro' } as const;
export const HISTORY_CAP = { [PLAN.FREE]: 100, [PLAN.PRO]: 500 } as const;
export const PRO_PRICE_USD_MONTHLY = 5;
export const PREMIUM_MODEL_KEYS: readonly ModelKey[] = [
  'NANO_BANANA_PRO',
  'GPT_IMAGE_2',
  'FLUX_2_MAX',
];
export const QUEUE_PRIORITY = { PRO: 1, FREE: 10 } as const; // BullMQ: lower = sooner
```

---

## Workstream A: Cloudinary cost

### A1. Playwright global Cloudinary mock

- Add `e2e/support/cloudinaryMock.ts` registering `context.route("**/res.cloudinary.com/**", ...)` and fulfilling with a local fixture: video requests (path contains `/video/` or `.mp4`) -> tiny `video/mp4`; else `image/webp` (or png) placeholder. Binary fixtures committed under `apps/web/e2e/fixtures/assets/` (`e2e/fixtures/` already holds `generation.ts`, `qa.ts` test fixtures).
- Apply globally via a custom `test` fixture (auto: true, `context` scope) or Playwright `use` hook so every spec, including those using raw `@playwright/test` imports, is covered. Migrate imports as needed so no spec bypasses it. Also cover the setup project (`auth.setup.ts`) and `global.setup.ts`; all four projects (setup, guest, chromium-billing, chromium) must be covered.
- Cache-Control on fulfilled responses is irrelevant (never hits network).
- Add a guard test: record any request whose host is `res.cloudinary.com` that reaches the network (`context.on("request")` after routing, or `route.fallback` spy) and fail the run if > 0.
- Server-side uploads during e2e go to the dev cloud (A2), never production.

### A2. Separate free Cloudinary cloud for dev

- Env-only. No local-storage adapter.
- apps/api: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_BASE_PATH` (dev default `private/development/uploads`).
- apps/web: `VITE_CLOUDINARY_BASE_URL`, `VITE_CLOUDINARY_ASSETS_URL`.
- Repoint local env files that currently hold the production cloud (`ddzuitkzt` is in `apps/web/.env.local`, `apps/web/.env.staging`, `apps/api/.env.staging`; `.env.production` files are correct). `apps/web/.env.local` is the main dev leak and must move to the dev cloud. Env files are not committed with secrets (see Boundaries); this is a manual owner step listed in the checklist.
- Document in `apps/api/.env.example` and `apps/web/.env.example`: create a second free Cloudinary account, copy the cloud name/key/secret, set both api and web vars to the SAME dev cloud. Include note that `.env.staging`/`.env.e2e-preview` must not point at the production cloud (owner decision: staging uses the dev cloud).
- Verify `model-input.ts` accepts dev-cloud URLs and rejects the other cloud (existing tests parameterised on env).
- Optional doc: set a Cloudinary usage alert at 70% (Settings > Account > Usage alerts, via email).

### A3. Move landing/marketing assets to `apps/web/public`

- Assets: `revive-1.png` and other `assets/` folder images, and everything referenced by `utils/landing.ts`, `utils/communityMock.ts`, `utils/gallery.json` (~98 Cloudinary URLs), and `components/Dialogs/SignupDialog.vue` (uses `VITE_CLOUDINARY_ASSETS_URL`). Demo MP4s only if any are still referenced (none found in current source).
- Images -> WebP (AVIF optional with `<picture>` fallback), responsive widths where displayed small. Target: revive-1 <= ~150 KB. MP4s re-encoded (H.264, CRF ~28, no audio if unused, `+faststart`, capped resolution to displayed size), with `preload="metadata"` and poster images; target each <= ~1 MB where possible.
- Served from `/landing/...` with long-cache headers (immutable, hashed names) via a `location /landing/` block in `apps/web/nginx/conf/spa.conf`; add `mp4|webm` to its static-extension regex.
- Replace `VITE_CLOUDINARY_ASSETS_URL` usage for landing; remove var if unused afterwards.
- Verify: `grep -rn "res.cloudinary.com\|CLOUDINARY_ASSETS_URL" apps/web/src` returns only user-content code paths (History, grid, collections, ImageDialog, helpers); an e2e test on `/` and other marketing routes asserts 0 requests to `res.cloudinary.com` (with the mock disabled for that check, counting attempted requests).
- Existing Cloudinary copies are left in place (no migration; may delete later, frees storage).

### A4. Thumbnails

- Add a single helper (e.g. `apps/web/src/utils/cloudinaryUrl.ts`) `thumbUrl(url)` that inserts `q_auto,f_auto,w_400,c_limit` after `/upload/` for Cloudinary URLs only (pass through otherwise; idempotent if already transformed).
- Use in `components/History/History.vue`, `components/Dashboard/Feed/UserGenerationsGrid.vue`, `components/History/CollectionsStrip.vue`.
- Unchanged: `ImageDialog` shows full size for everyone. Downloads: see A5.
- Note: each unique transformation counts toward transformation quota (1K = 1 credit); one fixed thumbnail variant keeps this small (derived URLs are cached after the first request).

### A5. Free-tier downloads (links to B)

Downloads today are built client-side by `getDownloadImageUrl` / `downloadImage` / `bulkDownload` in `apps/web/src/utils/helpers.ts` (used by `Dialogs/ImageDialog.vue` and `History/SelectActionButtons.vue`). These switch to the server download endpoint (B perk c), including bulk download. Free users get optimized download (`q_auto,f_auto`, capped width, e.g. `w_2048,c_limit`); Pro gets original. See B perk (c). Explore/community images already `q_auto,f_auto`.

---

## Workstream B: Pro tier

### Plan model

- `User.plan: "free" | "pro"` (default free), `User.subscription: { providerSubscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd }`.
- Single helper `isPro(user, now)` = `plan === "pro"` AND (`status` active OR `now < currentPeriodEnd`). All perks call this one function.
- Constants in `packages/shared/src/models/plans.ts` (see Code style).
- Remove the unguarded `GET /users/update/plan` route and `updateUserPlan` (see Current-state findings); `plan` changes only via the webhook path. Test: the route returns 404.

### Perks (all enforced server-side)

a. **Priority queue.** `enqueueGeneration` passes `priority` (BullMQ: lower number = higher priority) from `QUEUE_PRIORITY` based on `isPro`. Needs user lookup/flag in job data. Retries keep priority.
b. **History cap.** Free 100, Pro 500. In the generation save step: if `history.length >= cap`, do NOT push to history and do NOT upload-retain beyond what is needed to return the result; user still sees and downloads the result. When the cap is reached the result is not saved (per confirmed intent), the generation still succeeds, and credits are still charged. Return a flag (`savedToHistory: false`) so the UI shows "History full - upgrade / delete to save". Need an atomic guard (e.g. conditional update with `$expr: { $lt: [{ $size: "$history" }, cap] }`) to prevent races between concurrent jobs. Unsaved result handling (owner decision): skip the Cloudinary upload and return the Replicate output URL; no cleanup job. The UI shows a persistent, clearly visible notice on that result: "Not saved to history. This link expires in about 1 hour, download it now." with a Download button. Free users also see an "Upgrade to Pro (500 history)" CTA; Pro users at cap see "Delete images to free space". Test: the over-cap path makes 0 Cloudinary upload calls and the response carries `savedToHistory:false` plus the Replicate URL.
c. **Full-quality downloads.** Free: optimized derivative; Pro: original asset. Enforced by a server download endpoint (`GET /images/:imageId/download`, owner-only, in `routes/image.ts`) that returns/redirects to the appropriate URL (the client must not be able to construct the original URL from the grid). Caveat: originals remain publicly addressable by URL if known; acceptable (see Assumptions).
d. **Private generations.** Pro generations get `isPrivate: true` by default (user can't toggle in v1; per-image toggle is future work) on the image object (user-wide default on for Pro, per-image toggle optional later). Explore aggregation adds `"history.isPrivate": { $ne: true }` (must also handle missing field for legacy docs). Enforce in explore-service queries and any single-image public fetch.
e. **Premium models.** `PREMIUM_MODEL_KEYS` = `NANO_BANANA_PRO` ($0.15/image), `GPT_IMAGE_2` ($0.128), `FLUX_2_MAX` ($0.12): the image models in `packages/shared/src/models/registry.ts` with `pricePerImage >= $0.10` (owner decision: most expensive models). The list is an explicit constant, not computed from the threshold, so registry price edits don't silently change the gate. Server rejects (403, typed error code `PREMIUM_MODEL_REQUIRES_PRO` on the existing `ForbiddenError` in `lib/errors.ts`) a premium model request from non-Pro in the generate route before queueing or charging credits. Web UI shows lock badge and upsell.

### Dodo Payments

- Build task: create product "Visual AI Pro" ($5 USD / month, subscription, monthly interval) via the dodopayments MCP (`execute`). Store ID in new env `DODO_PRODUCT_ID_PRO`; document in `.env.example` and the manual-steps checklist. Create in test mode first, then live; verify using the dodopayments skills (`subscription-integration`, `webhook-integration`).
- Checkout (authenticated users only; `409` if already Pro with an active, non-cancelled subscription): extend payments service/router with `POST /payments/subscribe` creating a subscription checkout session with `metadata.userId`. Reuse existing provider abstraction (`PaymentProvider` adapter); add subscription methods rather than a parallel stack.
- Webhooks (extend `eventMapper.ts` + `applyEvent`; reuse signature verification and event-id idempotency):
  - `subscription.active` -> plan=pro, set period end.
  - `subscription.renewed` -> extend `currentPeriodEnd`.
  - `subscription.cancelled` -> `cancelAtPeriodEnd=true`; remain Pro until period end.
  - `subscription.failed` / `subscription.on_hold` / payment failure on renewal -> mark `past_due`; downgrade at period end (grace = until `currentPeriodEnd`).
  - `subscription.expired` -> plan=free.
  - Verify exact Dodo event names via `search_docs` at build time.
- Downgrade enforcement does not rely on a cron: `isPro` evaluates `currentPeriodEnd` lazily; a daily job may normalise `plan` for hygiene.
- Cancel/manage: link to Dodo customer portal (no custom UI v1).
- Pro does not grant credits; credit packs unchanged.

### Downgrade behaviour (assumptions flagged)

- History above 100 is kept (never deleted); no new saves until count < 100. User can delete to get under.
- Existing private images STAY private (avoids surprise exposure); new generations are public-eligible as free users. Owner may switch to "make public on downgrade".
- Premium-model history items remain viewable.
- Resubscribe restores all perks instantly.

### Localized pricing (credit packs + Pro)

Owner decision: show prices in the visitor's local currency. Source: Dodo docs, Adaptive Currency (docs.dodopayments.com/features/adaptive-currency) and Localized Pricing (/features/localized-pricing).

- **Checkout: Dodo Adaptive Currency.** Enable it in Dodo dashboard (Settings > Business) in test, then live. Dodo detects the country from the billing address, defaults checkout to the local currency at live FX for supported countries, lets the customer switch to base currency, and shows local payment methods. It works for both one-time packs and the Pro subscription. Base prices stay as they are: Pro $5 USD, packs in INR. No per-currency Dodo products. Dodo Localized Pricing (fixed price per country) and PPP are out of scope for v1.
- **Pricing page display.** The API resolves the visitor's country, first from the CDN/proxy geo header (e.g. `CF-IPCountry` if behind Cloudflare; confirm what the DigitalOcean setup actually sends at build time), then from a request IP lookup if no header. It maps country to currency with a static table in `packages/shared` and converts base prices with an FX rate table refreshed daily and cached in Redis. Fallback for an unknown country, an unsupported currency, a failed lookup, or stale FX older than 48h: show USD (Pro $5; packs converted INR->USD).
- Endpoint: `GET /payments/prices` (public, no auth: mounted outside `requireAuth` because the pricing page is public) returns `{ country, currency, isEstimate: true, pro: { amountMinor, currency }, packs: [{ id, amountMinor, currency }] }`. Format with `Intl.NumberFormat`. Show "Approx. price; final amount in your currency is shown at checkout" because Dodo's live FX can differ from ours.
- Never use the displayed price for charging: checkout always uses the Dodo product IDs; the amount comes from Dodo.
- Tests: country header -> currency mapping; missing/unknown header -> USD; stale FX -> USD; formatter per locale; e2e with a mocked geo header shows local currency, and without it shows USD. Manual: Dodo test checkout from a non-US billing address shows local currency for both a pack and Pro.

### Web UI

- Pricing/upgrade dialog (Pro price localized per the section above, with perk list), lock badges on premium models, history-full banner, Pro badge in account, plan status from fields added to the existing own-user `GET /users/:id` response (`plan`, `periodEnd`, `cancelAtPeriodEnd`). Extend the existing `Dialogs/PricingDialog.vue` and `composables/usePricingCatalog.ts` rather than adding a parallel dialog or store.

---

## Testing strategy

- Unit (Vitest): `isPro` edge cases (period end boundary, past_due), history-cap atomic guard (cap-1, cap, concurrent), premium gate (403 before credit deduction), priority mapping, explore filter excludes private incl. legacy docs, thumbUrl helper (idempotent, non-Cloudinary passthrough), event mapper + applyEvent for each subscription event incl. duplicate event id and out-of-order events.
- Integration: webhook route with signed payloads (`apps/web/e2e/support/signWebhook.ts` pattern) for full lifecycle; legacy plan route returns 404.
- E2E (Playwright): Cloudinary mock guard (0 network hits); landing page has no Cloudinary requests; free user sees locked premium model; Pro (webhook-simulated) can select it; not-saved notice with Download; Pro generation hidden from Explore; thumbnails request contains `w_400`.
- Manual: Dodo test-mode checkout end to end; Cloudinary dashboard after 7 days.

## Boundaries

- Always: server-side enforcement; reuse payments abstraction and webhook idempotency; run unit + `bun run check` + lint before reporting done; keep dev traffic on the dev cloud.
- Ask first: Mongoose schema changes beyond `plan`, `subscription`, `isPrivate`; new dependencies; changing which models are premium; deleting any existing Cloudinary asset; going live (Dodo live-mode product).
- Never: commit secrets or production cloud keys into `.env.*`; delete user history on downgrade; run the server; point e2e/staging at the production cloud; add Claude attribution to commits.

## Suggested task order (for PLAN/TASKS phase)

1. A1 Playwright mock + guard (fastest cost win). 2. A2 env/docs + dev cloud. 3. A4 thumbnails. 4. A3 landing assets. (A5 client download switch ships with perk c in step 7, since it needs the endpoint.) 5. B shared constants + user model + `isPro`. 6. Dodo product + subscription checkout + webhooks. 7. Perks a-e (one task each). 8. Web UI. 9. E2E + go-live checklist.

## Assumptions

1. Free plan limits remain unchanged except history cap 100 (applying cap to existing free users with > 100 is read-only grandfathering).
2. Unsaved (over-cap) results: return the Replicate output URL, no Cloudinary upload, no cleanup job (owner decision). Replicate URLs expire after ~1h.
3. "Original" asset URLs are not secret; perk (c) is soft enforcement via the download endpoint, not signed/authenticated delivery.
4. Private images stay private after downgrade.
5. Premium models: NANO_BANANA_PRO, GPT_IMAGE_2, FLUX_2_MAX (confirmed). Changing the list requires asking first.
6. Pro base price is $5 USD/month; credit packs keep their existing INR base prices (`CREDIT_PACK_CURRENCY`). Visitors see and pay local currency via the Localized pricing section; Dodo handles regional tax.
7. Lazy period-end evaluation of `isPro`; payment-failure grace = until current period end.
8. One free dev Cloudinary account is shared by dev, e2e, and staging (owner decision). Staging cannot display prod images; acceptable.
9. Redis/BullMQ priority is sufficient for ordering (no separate queue).

## Open questions

Resolved by owner (2026-10-31): staging uses the dev cloud; over-cap results return the Replicate URL with an expiry notice; premium models = NANO_BANANA_PRO, GPT_IMAGE_2, FLUX_2_MAX; local-currency pricing via Dodo Adaptive Currency plus geo-localized display (base $5 USD).
Remaining (build-time checks, no owner decision needed):

- Exact Dodo subscription event names/fields (confirm with MCP `search_docs`).
- Which geo header the production host provides (Cloudflare vs DigitalOcean); choose the IP-lookup fallback accordingly.
- Confirm Adaptive Currency is supported for subscriptions in the account's region/plan (docs imply yes).
