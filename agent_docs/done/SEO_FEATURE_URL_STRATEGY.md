# VisualAI feature-specific URL strategy (SEO map)

**Scope:** `apps/web` (only product site). `packages/shared` supplies `FeatureType`. `docs/` is internal (PRD/architecture), not a public docs host. No separate landing/marketing app. Production: `https://visual-ai.app`. Client Vue 3 SPA (`createWebHistory`), **no SSR/SSG/prerender**, **no `useHead` / `useSeoMeta`**. All crawlers see one `index.html` shell until JS runs.

**Sources:** `apps/web/src/router/index.ts`, `apps/web/src/utils/dashboardRoutes.ts`, `apps/web/src/utils/constants.ts` (`FEATURES`), `packages/shared/src/types/domain.ts`, `apps/web/src/utils/landing.ts`, `apps/web/public/sitemap.xml`, `apps/web/public/robots.txt`, `apps/web/index.html`.

---

## 1. Feature URL map

### How feature pages are generated

Manual Vue Router (not file-based `vite-plugin-pages` despite `src/pages/*`).

| Mechanism                             | Behavior                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Path segment                          | `/create/:feature?` — optional slug; invalid slugs rewrite to `/create` keeping query/hash       |
| Default omit                          | `createFeatureLocation()` **omits** `:feature` when `FeatureType.IMAGE` → `/create`              |
| Legacy query                          | `/dashboard?feature=` or `?tool=` **client-redirects** to `/create/:feature` (image → `/create`) |
| Extra query                           | `?model=` only meaningful on **upscale** (`FeatureSelect.vue` maps to `asideStore.upscaleModel`) |
| Surfaces (same `Dashboard.vue` shell) | `/create`, `/explore`, `/assets`                                                                 |

**`FeatureType` slugs** (`packages/shared/src/types/domain.ts`):

| Enum      | URL slug    | Product title (`FEATURES`) | Public marketing URL today   |
| --------- | ----------- | -------------------------- | ---------------------------- |
| IMAGE     | `image`     | AI Image Generator         | **None** (default `/create`) |
| UPSCALE   | `upscale`   | Image Upscaler             | `/create/upscale` (app)      |
| COLORIZE  | `colorize`  | Colorize Image             | `/create/colorize`           |
| REVIVE    | `revive`    | Revive Photos              | `/create/revive`             |
| REMOVE_BG | `remove_bg` | Remove Background          | `/create/remove_bg`          |

**Not in routing:** video, text-to-video, image-to-image as a first-class feature. Image _editing_ exists as **models** (Flux Kontext / reference-image gen) inside the image generator, not as `/create/image-to-image`.

### Full public + app inventory

| URL                                      | Kind                                        | Indexable intent           | Auth                                 |
| ---------------------------------------- | ------------------------------------------- | -------------------------- | ------------------------------------ |
| `/`                                      | Marketing landing                           | Yes                        | No                                   |
| `/create`                                | App: text-to-image                          | Accidental (SPA shell)     | **No** (not in `authRequiredRoutes`) |
| `/create/upscale`                        | App: upscaler                               | Accidental                 | No                                   |
| `/create/colorize`                       | App: colorize                               | Accidental                 | No                                   |
| `/create/revive`                         | App: restore                                | Accidental                 | No                                   |
| `/create/remove_bg`                      | App: remove BG                              | Accidental                 | No                                   |
| `/create/:invalid`                       | Redirect → `/create`                        | Duplicate                  | No                                   |
| `/explore`                               | App community feed                          | Accidental                 | No                                   |
| `/explore/:id`                           | Generation viewer                           | Should not                 | **Yes**                              |
| `/assets`                                | User library                                | Should not                 | No (UI empty unless signed in)       |
| `/dashboard`                             | Redirect only                               | **Sitemap still lists it** | Redirect                             |
| `/profile`                               | Account                                     | **Sitemap lists it**       | **Yes**                              |
| `/faqs`                                  | FAQ                                         | Yes                        | No                                   |
| `/pricing`                               | Pricing + pricing FAQs                      | Yes                        | No                                   |
| `/signin` `/signup`                      | Auth                                        | Weak                       | No                                   |
| `/terms` `/privacy` `/refund` `/contact` | Legal/support                               | Yes                        | No                                   |
| `/gallery`                               | Public gallery                              | Yes                        | No                                   |
| `/examples`                              | Before/after tabs (upscale/colorize/revive) | Yes                        | No                                   |
| `/compare`                               | Upscale **model** comparison                | Yes but **not in sitemap** | No                                   |
| `/dev/primitives`                        | Dev only                                    | No                         | DEV                                  |

Landing in-page anchors (not unique URLs): `#tools`, `#showcase`, `#models`, `#pricing`, `#faq`.

### Query vs path

- **Keep path for feature** (`/create/upscale`) — already done; better than `?feature=`.
- **Keep `?model=` as non-indexable state** for upscaler SKU; do not treat as landing pages.
- **Do not** invent `/create?feature=image` — that is the discarded pattern.

---

## 2. Per-URL SEO completeness

Legend: **S** = unique title/desc in HTML; **H1** = unique H1; **C** = unique crawlable copy; **J** = page JSON-LD. Shell = shared `index.html` only.

| URL                             | Title                                                                                          | Meta desc                             | H1                                                | Unique copy                                                                                        | Schema                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| All routes (raw HTML)           | Shared: “Visual AI - AI-Powered Image Generation”                                              | Shared image-gen/upscale keyword dump | —                                                 | Empty `#app`                                                                                       | One `WebApplication` (invalid `creator.@type`: “Deepak Dewani”) |
| Canonical                       | Always `https://visual-ai.app` (homepage), **not** per-route                                   |                                       |                                                   |                                                                                                    |                                                                 |
| OG/Twitter                      | Homepage only; OG image `og-image.png`; Twitter image `twitter-card-image.jpg` (soft-404 risk) |                                       |                                                   |                                                                                                    |                                                                 |
| `/`                             | Shared                                                                                         | Shared (upscale-heavy vs H1)          | “Studio-grade images, from a sentence or a scan.” | Strong: 4 tool chapters, FAQ, pricing teaser                                                       | Shared only                                                     |
| `/create*` `/explore` `/assets` | Shared                                                                                         | Shared                                | **None**                                          | App chrome; not keyword landers                                                                    | Shared                                                          |
| `/pricing`                      | Shared                                                                                         | Shared                                | **None** (display `div`, not `h1`)                | Plans + `PRICING_FAQS`                                                                             | Shared                                                          |
| `/faqs`                         | Shared                                                                                         | Shared                                | **None**                                          | `GENERAL_FAQS` only                                                                                | Shared; no FAQPage                                              |
| `/examples`                     | Shared                                                                                         | Shared                                | **None**                                          | Visual before/after; little keyword copy; **no generate examples**; no links to `/create/:feature` | Shared                                                          |
| `/compare`                      | Shared                                                                                         | Shared                                | “Compare upscale models”                          | Unique upscale-model copy + CTA → `/create/upscale`                                                | Shared; no Product/Review                                       |
| `/gallery`                      | Shared                                                                                         | Shared                                | **None**                                          | Image grid                                                                                         | Shared                                                          |
| `/contact`                      | Shared                                                                                         | Shared                                | “Get in Touch”                                    | Form copy                                                                                          | Shared                                                          |
| Legal                           | Shared                                                                                         | Shared                                | Yes (Terms / Privacy / Refund)                    | Unique                                                                                             | Shared                                                          |
| Auth                            | Shared                                                                                         | Shared                                | Clerk widgets                                     | Thin                                                                                               | Shared                                                          |

**No blog. No public docs. No `/about`. No `/vs-*` comparison landers. No how-to articles.**

---

## 3. Duplicate content / cannibalization

| Conflict                                       | Risk                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/` `#tools` vs `/create/:feature`             | Home ranks for “text to image / upscale / colorize / restore”; app URLs are thin SPA duplicates if indexed                                 |
| `/` `#pricing` vs `/pricing`                   | Two pricing experiences; landing teaser vs full cards                                                                                      |
| `/` `#faq` vs `/faqs`                          | Two FAQ sets (`landing.ts` FAQS vs `GENERAL_FAQS`)                                                                                         |
| `/examples` vs `/compare` vs home before/after | Same Cloudinary upscale/colorize/revive assets; `/compare` is model-level, `/examples` is feature-level — overlapping “AI upscaler” intent |
| `/gallery` vs `/explore` vs `#showcase`        | Three “see images” surfaces; `/explore` is app feed                                                                                        |
| `/dashboard` vs `/create`                      | Redirect exists; **sitemap still submits `/dashboard`**; signed-in CTAs still `to="/dashboard"` (LandingNav, LandingHero)                  |
| `/create` vs `/create/image`                   | Image slug omitted; `/create/image` is valid param and would be a **second URL** for the same tool if linked                               |
| `www` vs apex                                  | Both 200 (technical SEO); one canonical tag always apex home                                                                               |
| `remove_bg` vs landing “Four tools”            | Feature exists in app, **absent from landing TOOLS** — orphan keyword + inconsistent product story                                         |
| Sitemap vs live IA                             | Sitemap: `/dashboard`, `/profile`, auth, contact priority 0; **missing** `/create*`, `/compare`, `/explore`. Stale `lastmod` 2024-03-20    |
| `robots.txt`                                   | `Allow: /`; Disallow only `/admin/` `/api/`. **Does not** noindex app/auth. Soft-indexes SPA                                               |

---

## 4. Internal linking

**Marketing → app (weak for features):** Landing `TOOLS[].ctaTo` is **`/signup` for every tool**, not `/create/upscale` etc. Hero primary CTA: `/signup` or `/dashboard` (legacy).

**App → marketing:** Header logo `/dashboard` (redirects). Footer (`LandingFooter`): gallery, examples, pricing, FAQ, contact, legal — **no `/compare`**. `FOOTER_LINKS` in constants includes examples/pricing/FAQ (used elsewhere).

**Feature ↔ feature:** In-app `FeatureSelect` `router.push(createFeatureLocation(...))` — good crawl graph **if** Google renders JS; no `<a href="/create/upscale">` on the homepage.

**Best existing SEO link:** `/compare` → `router-link` to create + `feature: upscale`.

**Examples page:** tab UI only; **no** deep links to `/create/upscale|colorize|revive`.

---

## 5. Indexable vs auth-gated

| Index                    | Routes                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Intended marketing       | `/`, `/pricing`, `/faqs`, `/examples`, `/gallery`, `/compare`, legal, `/contact`         |
| App shell (public, thin) | `/create/:feature?`, `/explore`, `/assets` — **not auth-gated**                          |
| Auth-gated               | `profile`, `explore-image` only (`router.beforeEach`)                                    |
| Should noindex           | `/signin` `/signup` `/profile` `/assets` `/explore/:id` `/dashboard` (redirect) `/dev/*` |
| `robots.txt`             | Does not match this split                                                                |

Google can index `/create/upscale` as a JS app with shared title — **cannibalizes** a future `/image-upscaler` lander.

---

## 6. Blog, docs, comparison, pricing, about

| Content type                                   | Status                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Pricing                                        | `/pricing` + landing `#pricing`                                                    |
| FAQ                                            | `/faqs` + landing `#faq` + pricing FAQs (three buckets)                            |
| Comparison                                     | `/compare` = **upscaler models only** (not VisualAI vs Midjourney, not Flux vs SD) |
| Examples                                       | `/examples` visual only                                                            |
| Gallery                                        | `/gallery`                                                                         |
| Blog / how-tos / docs site / about / changelog | **None public** (`docs/*.md` is repo-internal)                                     |
| `llms.txt`                                     | Not in `apps/web/public`                                                           |

---

## 7. Recommended URL taxonomy (keep vs change)

**Keep (app, noindex):**

- `/create` default generator
- `/create/{upscale,colorize,revive,remove_bg}`
- `/explore`, `/assets`
- `?model=` as session state

**Change / add (indexable keyword landers — new pages, unique title/H1/copy/FAQ/schema, CTA into app):**

| Keep app                      | Add marketing URL                                                                | Primary keyword                               |
| ----------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| `/create`                     | `/text-to-image` (or `/ai-image-generator`)                                      | text to image, AI image generator, Flux       |
| (models in same UI)           | `/image-to-image`                                                                | image to image, AI image editor, Flux Kontext |
| `/create/upscale`             | `/image-upscaler`                                                                | AI image upscaler, 4K upscale                 |
| `/create/colorize`            | `/colorize-photo`                                                                | colorize black and white photo                |
| `/create/revive`              | `/photo-restorer`                                                                | restore old photos, AI photo repair           |
| `/create/remove_bg`           | `/remove-background`                                                             | AI background remover                         |
| `/compare`                    | keep path; add to sitemap; optional `/upscaler-models` alias later               | compare AI upscalers                          |
| `/examples`                   | keep; add `/examples/{upscale,colorize,revive}` **or** fold into feature landers | —                                             |
| `/pricing` `/faqs` `/gallery` | keep                                                                             | —                                             |
| `/dashboard`                  | drop from sitemap; point CTAs at `/create`                                       | —                                             |
| `/`                           | keep as brand + hub; unique vs feature landers                                   | Visual AI, AI image studio                    |

**Redirects:** keep `/dashboard?feature=` → `/create/:feature`. 301 `/create/image` → `/create` if it ever gets links. Do **not** 301 `/create/upscale` → marketing URL (app bookmark); use `rel=canonical` on app to the lander **or** `noindex` the app.

**Slug hygiene:** `remove_bg` is ugly for SEO; marketing slug `remove-background`, app can stay `remove_bg` or migrate both.

**Do not** create `/video` until the product exists.

---

## 8. Content gaps

1. **Per-feature landers** with H1, 300–800w unique copy, how-to, FAQPage, SoftwareApplication/HowTo schema, OG per URL.
2. **Image-to-image / AI editor** page (Kontext / reference images) — demand exists, URL does not.
3. **How-tos:** prompt guide, upscale vs enlarge, colorize vs restore, credits explainer (partially in FAQs).
4. **Comparisons:** VisualAI vs Midjourney/DALL·E/Magnific; Flux Lightning vs Pro (model picker is in-app).
5. **Unify FAQ** into one source; emit FAQPage JSON-LD.
6. **About / brand** page (E-E-A-T).
7. **Blog or changelog** for model launches.
8. **Sitemap rebuild:** marketing URLs only; drop `/dashboard` `/profile` `/signin`; add `/compare` and new landers.
9. **Internal links:** landing tool CTAs → landers or `/create/:feature`; examples → matching lander; footer include `/compare`.
10. **SSR or prerender** for landers (or split a static marketing site) — SPA shell blocks unique titles today.
11. **Landing vs FEATURES:** add remove-bg chapter or hide the feature from SEO claims.
12. Fix JSON-LD `creator.@type`, per-URL canonical, Twitter image 404, www duplicate.

---

## 9. Keyword clusters → URLs

| Cluster                                          | Current URL                                     | Target URL                                                   | Notes                                              |
| ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| Brand / AI image studio                          | `/`                                             | `/`                                                          | H1 is brand-poetic; meta is upscale-biased — align |
| Text to image, Flux generator, prompt to image   | `/` tools + `/create`                           | `/text-to-image`                                             | Highest gap                                        |
| Image to image, AI photo editor, inpainting/edit | **none**                                        | `/image-to-image`                                            | Models exist; no feature slug                      |
| AI upscaler, 4K, image enhancer                  | `/`, `/examples`, `/compare`, `/create/upscale` | `/image-upscaler` + keep `/compare` for “best upscale model” | Strongest existing assets                          |
| Colorize B&W                                     | `/` + `/examples`                               | `/colorize-photo`                                            |                                                    |
| Restore / revive old photos                      | `/` + `/examples`                               | `/photo-restorer`                                            | “Revive” is brand; “restore” is query              |
| Background remover                               | `/create/remove_bg` only                        | `/remove-background`                                         | Missing on home                                    |
| Pricing / credits                                | `/pricing`, `#pricing`                          | `/pricing`                                                   | Canonicalize teaser                                |
| FAQ                                              | `/faqs`, `#faq`                                 | `/faqs`                                                      |                                                    |
| Social proof / examples                          | `/gallery`, `/examples`, `#showcase`            | keep; differentiate copy                                     |                                                    |
| Upscale model comparison                         | `/compare`                                      | `/compare`                                                   | Add sitemap + meta                                 |
| Video                                            | —                                               | do not rank                                                  | Not a product                                      |

**Indexation rule:** one **primary** URL per cluster. App `/create/*` → `noindex,follow` (or canonical to lander) so they do not steal the cluster.
