# Public URL / SEO map (web)

## Router (not file-based)

`unplugin-vue-router` is **not** used. Routes are a hand-written `RouteRecordRaw[]` in `apps/web/src/router/index.ts` via `createRouter` + `createWebHistory`. Pages live under `apps/web/src/pages/*.vue` but filenames are **not** URL paths (e.g. `Frequent.vue` → `/faqs`). Vite auto-imports `useRoute`/`useRouter` from `vue-router/auto` in `apps/web/vite.config.mts` only.

## Exact public paths

| Path                | Route name                      | Component                                                                      |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `/`                 | `landing`                       | Landing.vue                                                                    |
| `/create/:feature?` | `create` (`APP_SURFACE.CREATE`) | Dashboard.vue                                                                  |
| `/explore`          | `explore`                       | Dashboard.vue                                                                  |
| `/assets`           | `assets`                        | Dashboard.vue                                                                  |
| `/dashboard`        | `dashboard`                     | **redirect** via `dashboardRedirectLocation` → `/create` or `/create/:feature` |
| `/explore/:id`      | `explore-image`                 | ExploreImage.vue (auth)                                                        |
| `/profile`          | `profile`                       | Profile.vue (auth)                                                             |
| `/faqs`             | `faqs`                          | Frequent.vue                                                                   |
| `/pricing`          | `pricing`                       | Pricing.vue                                                                    |
| `/signin`           | `signin`                        | Signin.vue                                                                     |
| `/signup`           | `signup`                        | Signup.vue                                                                     |
| `/terms`            | `terms`                         | Terms.vue                                                                      |
| `/privacy`          | `privacy`                       | PrivacyPolicy.vue                                                              |
| `/refund`           | `refund`                        | RefundPolicy.vue                                                               |
| `/contact`          | `contact`                       | Contact.vue                                                                    |
| `/gallery`          | `gallery`                       | Gallery.vue                                                                    |
| `/examples`         | `examples`                      | Examples.vue                                                                   |
| `/compare`          | `compare`                       | Compare.vue                                                                    |
| `/dev/primitives`   | `dev-primitives`                | DEV only                                                                       |

Invalid `:feature` redirects to `/create` (query/hash preserved).

## Feature URLs (not `/text-to-image`)

Slugs = `FeatureType` in `packages/shared/src/types/domain.ts`:

- `/create` — default image (`FeatureType.IMAGE = 'image'`; param omitted)
- `/create/upscale`
- `/create/colorize`
- `/create/revive`
- `/create/remove_bg`

There is **no** `video` / `text-to-image` / `text-to-video` route. `FEATURE_ROUTES` does not exist. Mapping: `apps/web/src/utils/dashboardRoutes.ts` (`createFeatureLocation`, `isValidFeatureParam`) + `FEATURES` in `apps/web/src/utils/constants.ts`. Nav footer paths in same constants (`/examples`, `/contact`, `/privacy`, `/terms`, `/refund`, `/pricing`, `/faqs`). Landing tool CTAs go to `/signup`, not feature URLs (`apps/web/src/utils/landing.ts` `TOOLS`).

Legacy: `/dashboard?feature=` or `?tool=` redirects to `/create/:id`.

## Title / description

**SPA, no unhead.** Zero `useHead` / `useSeoMeta` / `@unhead`. No per-route `document.title`.

Static tags only in `apps/web/index.html`:

- `<title>` / `og:title` / `twitter:title`: `Visual AI - AI-Powered Image Generation`
- `description`: `Visual AI - Advanced AI-powered image generation and editing.`
- `og:description` / `twitter:description`: `Transform your images with cutting-edge AI technology for superior quality and resolution.`
- canonical + `og:url`: `https://visual-ai.app` (always homepage)
- JSON-LD Organization `url`: `https://visual-ai.app`

Crawlers of JS-less HTML get the same tags on every path.

## Marketing page copy (on-page, not meta)

- Landing: H1 “Studio-grade images, from a sentence or a scan.”; sub “Generate, upscale to 4K, colorize, and restore…” (`LandingHero.vue`). Tools copy in `landing.ts` (`TOOLS`, `STATS`). FAQ: `FaqSection` + landing FAQs.
- Compare: H1 “Compare upscale models”; CTA `createFeatureLocation(UPSCALE)`.
- Examples: upscale before/after; no H1/meta.
- Pricing: visible “Unlock the Full Power of Visual AI”; `PRICING_FAQS`.
- Frequent (`/faqs`): `GENERAL_FAQS` only.

## Domain mismatches

Canonical domain in HTML/legal: **https://visual-ai.app**. CORS also allows **https://www.visual-ai.app**. Clerk `authorizedParties` is `localhost:3000` + `https://visual-ai.app` only (**no www**).

`apps/web/public/sitemap.xml`: lists `/`, `/dashboard` (redirect), profile, faqs, pricing, auth, legal, gallery, examples. **Missing:** `/create`, `/create/*`, `/explore`, `/assets`, `/compare`. Stale `lastmod` 2024-03-20. `robots.txt` sitemap URL uses visual-ai.app.

Hero CTA still links signed-in users to `/dashboard` (redirects).

## Files to change for per-route SEO

1. Add `@unhead/vue` (or vue-router afterEach + `document.title`) and call `useHead`/`useSeoMeta` in each public page (or a `router.afterEach` map).
2. `apps/web/index.html` — keep defaults; stop treating canonical as always `/`.
3. `apps/web/public/sitemap.xml` — add `/create`, `/create/upscale`, etc., `/compare`; drop or de-prioritize `/dashboard`.
4. Optional: `dashboardRoutes.ts` / `FEATURES` as source of truth for sitemap generation.
5. Legal pages already hardcode visual-ai.app; keep in sync with canonical.

SSR/prerender is not set up; dynamic head still needs prerender or SSR for social crawlers.
