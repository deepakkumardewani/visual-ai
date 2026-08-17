# Vuetify removal — verification plan (`apps/web`)

Inspection only. No app files were changed.

## Test harness (current)

| Item                      | Finding                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scripts                   | `test` = `vp test run`; `check` = `vp check` (vite-plus typecheck, uses `vue-tsc`); `verify` = lint + `vp check --fix`. No dedicated `vue-tsc` script.   |
| Vitest                    | In `vite.config.mts`: `environment: happy-dom`, `setupFiles: src/test/setup.ts`, include `src/**/*.{test,spec}.{ts,tsx}`. **No separate vitest.config.** |
| `src/test/setup.ts`       | Registers FontAwesome only. **Does not install Vuetify.** Removing the plugin does not require setup changes unless FA aliases move.                     |
| `global.plugins` in tests | Always **Pinia**, never `createVuetify`. `plugins: [pinia]` is safe to keep.                                                                             |

## 1. Unit/component tests that will fail when Vuetify is removed

### Will fail (hard)

These `vi.mock('vuetify', async (importOriginal) => { ... importOriginal() })` calls resolve the real package. After uninstall, Vitest fails with **Cannot find module 'vuetify'**.

| File                                      | Why                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/pages/Dashboard.test.ts`             | Mocks `useDisplay` / `useTheme`. **Still needed:** `Dashboard.vue` imports `useDisplay` from `vuetify`. |
| `src/components/Header/AppHeader.test.ts` | Same mock. **Stale:** `AppHeader.vue` already uses `@vueuse/core` `useMediaQuery`, not Vuetify.         |
| `src/components/Header/NavTabs.test.ts`   | Mocks `useTheme`. **Stale:** `NavTabs.vue` has no Vuetify import.                                       |

### Will not fail from plugin removal

| File                                                                                                            | Why                                                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/components/Dashboard/dashboardPolish.test.ts`                                                              | Source audit: Dashboard subtree must not contain `<v-*>`. Passes today; keep as a guard.                         |
| Composer / ModelPicker / PromptAiMenu / CommunityCard / CreditsChip / ImageGenerateAside / DashboardShell tests | `global.plugins: [pinia]` only; query `data-testid` / native tags. Composer already asserts **no** `v-textarea`. |

There are **no** tests that `mount(..., { global: { plugins: [vuetify] } })` and **no** `v-btn` queries. Dashboard UI tests already assume native markup.

Indirect fail: if `Dashboard.vue` still calls `useDisplay()` after the package is gone, even a rewritten mock cannot import `vuetify` — migrate the SUT first.

## 2. How to rewrite tests without a Vuetify plugin

**Do not** add `createVuetify` to `setup.ts`. Copy the primitive pattern:

### Pattern: Popover (`src/components/primitives/Popover.test.ts`)

- `mount(Component, { attachTo: document.body, slots })` — no `plugins` except Pinia when stores are used.
- Teleported UI: query `document.body` / `DOMWrapper(document.body)`, not `wrapper.html()`.
- `afterEach` → `unmount()` + clear `document.body.innerHTML`.
- Assert native roles (`[role="dialog"]`), `data-testid`, Tailwind classes (`tw-min-h-11`).
- Keyboard: `trigger('keydown', { key })` or `dispatchEvent` on the teleported node.

`Tooltip.vue` has **no** test; copy Popover (teleport + role). `CustomButton.vue` is already a native `<button data-testid="header-dashboard-btn">` with **no** dedicated test; AppHeader stubs it as `<button>Dashboard</button>`. If you add a test: mount with `global.plugins: [vue-router mock]` and click → `push('/create')`.

### Per-file rewrites

1. **Dashboard.test.ts** — After replacing `useDisplay` in `Dashboard.vue` with `useMediaQuery('(min-width: 640px)')` (comment already says do not use Vuetify `xs` 600px): delete the `vi.mock('vuetify')` block; mock `@vueuse/core` `useMediaQuery` like AppHeader/CreditsChip (`smAndUpRef` / width ref). Keep child stubs + `data-testid` assertions. Keep “does not render `v-tabs-window` / `v-divider`”.
2. **AppHeader.test.ts / NavTabs.test.ts** — Delete `vi.mock('vuetify')` entirely. Keep Pinia + clerk/router mocks. Continue asserting `data-testid` (`app-header-v2`, `nav-tab-*`, `aria-selected`).
3. **dashboardPolish.test.ts** — Keep. After full removal, optionally extend `collectVueFiles` to `src/` (or pages + landing) so leftover `<v-*>` fail CI.
4. **setup.ts** — No Vuetify registration. Optional: `config.global.config.warnHandler` to fail on `[Vue warn]: Failed to resolve component: V*`.

Command: `bun run test` in `apps/web` (or `vp test run`).

## 3. Manual UI checklist by route

App shell today: `App.vue` is `<v-app>` + `<v-main>` + `<v-snackbar>`. Landing hides that chrome. History = `/assets` (not `/history`).

| Route     | Path                           | Vuetify leftover                                                                                     | Check                                                                                                                                                     |
| --------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home      | `/`                            | Indirect via Hero/Features/About/MiniGallery (`v-container/row/col/btn/chip/card/img`, `useDisplay`) | Hero CTA, feature chips, gallery hover/cards, About parallax, no broken layout without `v-app`.                                                           |
| Dashboard | `/create`, `/create/:feature?` | `useDisplay` in `Dashboard.vue` only; subtree already native                                         | Desktop rail + canvas; mobile tabs (`dashboard-mobile-tabs`), settings sheet, composer dock; generate / model picker / Popover teleport; snackbar toasts. |
| History   | `/assets`                      | None in History                                                                                      | Grid, collections strip, selection actions, empty state.                                                                                                  |
| Explore   | `/explore`, `/explore/:id`     | None in ExploreImage                                                                                 | Feed, viewer, header hidden on `:id`.                                                                                                                     |
| Compare   | `/compare`                     | None                                                                                                 | Cards, comparison slider.                                                                                                                                 |
| Auth      | `/signin`, `/signup`           | None (AuthShell)                                                                                     | Clerk forms; no header/footer; no `v-app` dependency.                                                                                                     |
| Pricing   | `/pricing`                     | `v-row`/`v-col` + **PricingCard** (`v-card`, `v-btn`, `v-tooltip`, `v-icon`)                         | Plan cards, CTA, tooltips. Also Gallery `/gallery`, Examples `/examples` (`v-tabs`), Contact `/contact` (`v-form`/`v-btn`).                               |

Cross-cutting: theme toggle (was synced to Vuetify theme), header CustomButton on marketing pages, referral/credits dialogs, `/dev/primitives` playground.

## 4. Will `vue-tsc` / `vp check` fail?

**Yes**, until remaining imports and tags are gone.

- `tsconfig.json`: `"types": ["vite/client", "vite-plugin-vue-layouts/client"]` — **vuetify is not in `types`**. `"skipLibCheck": true` so Vuetify’s own `.d.ts` is not the issue.
- `components.d.ts` / `auto-imports.d.ts` / `vite-env.d.ts`: **no Vuetify globals**. Runtime V\* tags come from **`vite-plugin-vuetify` `autoImport: true`**.
- Explicit imports that will error `Cannot find module 'vuetify'`:
  - `src/plugins/vuetify.ts`
  - `src/pages/Dashboard.vue` (`useDisplay`)
  - `components/Home/{Features,About,MiniGallery}.vue`
  - `components/ResultColumn.vue`
- `plugins/index.ts` `app.use(vuetify)` fails once the plugin file is deleted.
- Tests: `typeof import('vuetify')` in the three mocks if those files are typechecked (included via `src/**/*`).
- `<v-*>` after removing the Vite plugin: vue-tsc/Volar typically treat unknown tags as custom elements (may **not** fail typecheck). **Build** still emits unresolved components unless tags are replaced. Use the polish-style source test to catch leftovers.
- `settings.scss` only has a commented `@use 'vuetify/settings'` — deleting the file is type-safe if the Vite plugin `styles.configFile` is removed.

## 5. Bundle / dependency removal steps

1. **`apps/web/package.json`**
   - Remove deps: `vuetify`, `@mdi/font` (not imported anywhere in `src`; icons are FontAwesome / `vuetify/iconsets/fa-svg`).
   - Remove devDep: `vite-plugin-vuetify`.
   - Consider `roboto-fontface` (listed, unused in scanned src). Keep `sass` while any SCSS remains.
2. **`vite.config.mts`**
   - Drop `import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'`.
   - Remove `Vuetify({ autoImport, styles: { configFile: 'src/styles/settings.scss' } })`.
   - `Vue({ template: { transformAssetUrls } })` → default Vue plugin (or Vuetify-free `transformAssetUrls` if still needed for images).
   - Remove `manualChunks` branch `node_modules/vuetify` → `'vuetify'`.
3. **Delete / stop using**
   - `src/plugins/vuetify.ts`
   - `src/styles/settings.scss` (Vuetify SASS hook; currently unused)
   - `app.use(vuetify)` in `src/plugins/index.ts`
4. **Replace shell + marketing**
   - `App.vue`: `v-app` / `v-main` / `v-snackbar` → native layout + existing toast store UI.
   - Remaining 14 Vue files with `<v-*>` (Contact, MiniGallery, ResultColumn, Examples, PricingCard, Hero, Gallery, Pricing, App, About, FAQ, ReferralCode, Features, Chip).
   - Replace `useDisplay()` with `useMediaQuery` / CSS.
5. **Verify size**
   - Production build; confirm no `assets/js/vuetify-*.js` chunk.
   - Compare `dist` before/after; grep `dist` for `vuetify` / `mdi`.
   - `bun install` at repo root so `bun.lock` drops the packages.

## Suggested verification order

1. Rewrite/delete the three `vi.mock('vuetify')` tests (migrate `Dashboard.vue` `useDisplay` first).
2. `bun run test` in `apps/web`.
3. Remove plugin + packages; `vp check` / `vp build`.
4. Extend polish audit beyond Dashboard.
5. Manual pass on the routes table (especially home, pricing, contact, examples, gallery — still Vuetify-heavy).
