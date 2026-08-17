# Remaining Vuetify inventory (apps/web)

Snapshot: 2026-08-17. No other apps (api, packages, shared) depend on Vuetify. No Nuxt.

## 1. Dependencies

| Package               | Declared   | Resolved (bun.lock)                                                                                                            | Location                                  |
| --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `vuetify`             | `^3.6.11`  | `vuetify@3.12.9` (also `>=3` peer; stale `vuetify@2.1.3` string is the **vite-plugin-vuetify** package version, not Vuetify 2) | `apps/web/package.json` `dependencies`    |
| `@mdi/font`           | `7.4.47`   | `@mdi/font@7.4.47`                                                                                                             | `apps/web/package.json` `dependencies`    |
| `vite-plugin-vuetify` | `^2.0.3`   | `vite-plugin-vuetify@2.1.3`                                                                                                    | `apps/web/package.json` `devDependencies` |
| `webfontloader`       | **absent** | not in `bun.lock`                                                                                                              | —                                         |
| `@mdi/js`             | **absent** | —                                                                                                                              | —                                         |

Root `package.json`, `apps/api`, `packages/*`: no Vuetify-related deps.

## 2. Plugin / bootstrap

| File                              | Role                                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/main.ts`            | Comment: bootstraps Vuetify; calls `registerPlugins(app)`; eager `useAppStore()` for theme sync; waits `router.isReady()` because `v-main` transitions                                                                                |
| `apps/web/src/plugins/index.ts`   | `import vuetify from './vuetify'`; `app.use(vuetify).use(router).use(pinia)`                                                                                                                                                          |
| `apps/web/src/plugins/vuetify.ts` | `createVuetify` from `'vuetify'`; `import 'vuetify/styles'`; icons: **`vuetify/iconsets/fa-svg`** (`defaultSet: 'fa'`), custom aliases from `@/components/icons`; light/dark theme color maps                                         |
| `apps/web/vite.config.mts`        | `import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'`; `Vuetify({ autoImport: true, styles: { configFile: 'src/styles/settings.scss' } })`; Vue `transformAssetUrls`; manual chunk `node_modules/vuetify` → `'vuetify'` |
| `apps/web/src/stores/app.ts`      | `import vuetify from '@/plugins/vuetify'`; `vuetify.theme.global.name.value = dark ? 'dark' : 'light'` (~L258)                                                                                                                        |
| `apps/web/src/router/index.ts`    | `localStorage` key `vuetify:dynamic-reload` (Vite/Vuetify HMR guard, ~L164–177)                                                                                                                                                       |
| Root `vite.config.ts`             | no Vuetify                                                                                                                                                                                                                            |

Not used: `vuetify/components` or `vuetify/directives` barrel imports (autoImport via vite-plugin). No `useTheme()` in production source.

## 3. Source files with Vuetify components / APIs

**Tag occurrences: 110** in **14 `.vue` files** (opening tags). Dashboard subtree: **0**.

### Shell / global

| File                               | APIs / components               | Context                                                                               |
| ---------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/web/src/App.vue`             | `v-app`, `v-main`, `v-snackbar` | L58, L60, L73 — app chrome + toast                                                    |
| `apps/web/src/pages/Dashboard.vue` | `useDisplay` from `'vuetify'`   | L4, L41 `{ xs, width }` — comment: match Tailwind sm not Vuetify xs; **no v-\* tags** |

### Home / marketing

| File                                           | APIs / components                                                                                                                                                   | Context                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------- |
| `apps/web/src/components/Home/Hero.vue`        | `v-container`×2, `v-row`×2, `v-col`×2, `v-btn`, `v-img`                                                                                                             | L45–149                                  |
| `apps/web/src/components/Home/Features.vue`    | `useDisplay`; `v-chip`                                                                                                                                              | L4, L16, L79                             |
| `apps/web/src/components/Home/Chip.vue`        | `v-chip`                                                                                                                                                            | 1 tag                                    |
| `apps/web/src/components/Home/About.vue`       | `useDisplay`; `v-row`, `v-col`, `v-parallax`                                                                                                                        | L3, L7, L15–51                           |
| `apps/web/src/components/Home/MiniGallery.vue` | `useDisplay`; `v-row`×4, `v-col`×2, `v-btn`×2, `v-hover`, `v-card`×2, `v-img`×2, `v-progress-circular`×2, `v-expand-transition`, `v-fade-transition`, `v-card-text` | L6, L18, L29–129 (**18 tags**, heaviest) |
| `apps/web/src/components/FAQ.vue`              | `v-row`, `v-col`                                                                                                                                                    | layout only                              |
| `apps/web/src/components/PricingCard.vue`      | `v-card` + `v-card-item/title/subtitle/text`, `v-btn`, `v-divider`, `v-icon`×2, `v-tooltip`                                                                         | L47–100                                  |
| `apps/web/src/pages/Pricing.vue`               | `v-row`×3, `v-col`×4                                                                                                                                                | grid                                     |
| `apps/web/src/pages/Examples.vue`              | `v-tabs`, `v-tab`×3, `v-tabs-window`, `v-tabs-window-item`×3, `v-container`×3                                                                                       | tabbed examples                          |
| `apps/web/src/pages/Contact.vue`               | `v-container`, `v-row`×2, `v-col`×7, `v-form`, **`v-text-field`×4**, `v-textarea`, `v-btn`×2, `v-snackbar`                                                          | L103–182                                 |
| `apps/web/src/pages/Gallery.vue`               | `v-container`, `v-card`×2, `v-img`×2, `v-progress-circular`, **`v-dialog`**, `v-btn`; CSS `:deep(.v-overlay\_\_scrim                                                | \_\_content)`                            | L60–140, L204 |
| `apps/web/src/components/ReferralCode.vue`     | `v-btn`, `v-snackbar`                                                                                                                                               | L31, L36                                 |
| `apps/web/src/components/ResultColumn.vue`     | `useDisplay`; `v-alert`, `v-skeleton-loader`×3, `v-hover`×3, `v-img`×3, `v-btn`×3, `v-icon`×3 (`fas fa-download`), `v-snackbar`                                     | L4, L17, L194–316                        |

### Component frequency (opening tags)

`v-col` 17, `v-row` 13, `v-btn` 11, `v-img` 8, `v-container` 7, `v-card` 5, `v-icon` 5, `v-snackbar` 4, `v-text-field` 4, `v-hover` 4, `v-tab` 3, `v-tabs-window-item` 3, `v-skeleton-loader` 3, `v-progress-circular` 3, then 1–2: `v-app`, `v-main`, `v-chip`, `v-parallax`, transitions, card subcomponents, `v-divider`, `v-tooltip`, `v-alert`, `v-dialog`, `v-form`, `v-textarea`, `v-tabs`, `v-tabs-window`.

**Not found as tags:** `v-menu`, `v-overlay` (only `.v-overlay__*` CSS in Gallery), `v-navigation-drawer`, `v-list`, `v-select`. **No Vuetify directives** (`v-ripple`, `v-click-outside`, `v-intersect`, etc.).

`useDisplay` production: Features, About, MiniGallery, ResultColumn, Dashboard.vue.

## 4. Global styles / CSS

| File                                | Notes                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/plugins/vuetify.ts`   | `import 'vuetify/styles'`                                                                                                               |
| `apps/web/src/styles/settings.scss` | Intended Vuetify SASS overrides; **`@use 'vuetify/settings'` is commented out** — empty config wired by vite-plugin `styles.configFile` |
| `apps/web/src/style.scss`           | no Vuetify import                                                                                                                       |
| `apps/web/src/pages/Gallery.vue`    | `:deep(.v-overlay__content)`, `:deep(.v-card)`, `.v-overlay__scrim` class check                                                         |

## 5. MDI / icons

- `@mdi/font` is **declared but never imported**. No `mdi-*` classes, no `@mdi/js`, no `vuetify/iconsets/mdi`.
- Runtime icons: Font Awesome SVG via `vuetify/iconsets/fa-svg` + `apps/web/src/plugins/icons.ts` (`@fortawesome/*`) + `@/components/icons` aliases.
- `v-icon` uses FA strings e.g. `fas fa-download` (ResultColumn, PricingCard).

## 6. Tests

| File                                                        | Dependency                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/web/src/test/setup.ts`                                | **Does not** install Vuetify; only FontAwesome                   |
| `apps/web/src/components/Header/NavTabs.test.ts`            | `vi.mock('vuetify')` wrapping `importOriginal`; stubs `useTheme` |
| `apps/web/src/components/Header/AppHeader.test.ts`          | same; stubs `useDisplay` + `useTheme`                            |
| `apps/web/src/pages/Dashboard.test.ts`                      | same; asserts HTML has **no** `<v-tabs-window` / `<v-divider`    |
| `apps/web/src/components/Dashboard/dashboardPolish.test.ts` | scans Dashboard `*.vue`; **forbids** `/<v-[a-z]/`                |

Header production components do not import Vuetify; tests mock it because of plugin/auto-import or shared setup.

## 7. Remaining vs already-custom

| Area                                                  | Status                                                                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/components/Dashboard/**` (37 Vue files) | **Migrated** — 0 `v-*` tags (enforced by `dashboardPolish.test.ts`). `MobileSettingsSheet.vue` comment: custom sheet, not Vuetify             |
| Custom replacements                                   | `CustomButton.vue`, `primitives/Popover.vue`, `primitives/Tooltip.vue`, plus SegmentedControl, Stepper, ProviderIcon, TierBadge, TokenScratch |
| Remaining Vuetify UI                                  | **14 Vue files, 110 opening tags** — mostly Home, Pricing, Contact, Gallery, Examples, FAQ, ReferralCode, ResultColumn, App shell             |
| Remaining composable coupling                         | `useDisplay` in 5 files; theme via `createVuetify` instance in `stores/app.ts`                                                                |
| Dead dep                                              | `@mdi/font`                                                                                                                                   |

Docs-only mentions (not runtime): `README.md`, `docs/ARCHITECTURE.md`, `apps/web/DESIGN.md`, `apps/web/agent_docs/SIDEBAR_*`, `agent_docs/REPO_SURVEY_FEATURE_UX.md`, `agent_docs/SPEC_backend_modernization.md`.
