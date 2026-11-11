# Spec: ui-polish-picker-header

Status: DRAFT for review (audited against confirmed intent). Planning only, no feature code. Not committed.
Prior feature for context: `agent_docs/pricing-pro-polish/SPEC.md` (Item 3 "Model menu", line ~104, replaced company grouping with tiers).

## Objective

Restore company grouping inside the Free/Pro tiers of the generation model picker, add search, and make it a bottom sheet on mobile. Fix the app header at small widths and reorder its actions. Move the plan indicator into the avatar menu. Fix three UI issues (Upgrade-to-Pro dialog FAQ visibility, landing theme toggle on mobile, Create page responsiveness). Produce an analytics research doc during build (no analytics code).

Users: Free and Pro creators, heavy mobile/tablet use.
Why now: phase 5 (commit f00a3ab) deleted `ModelCompanyGroup.vue` / `ModelCompanySubmenu.vue`; the interview said "Sections: Featured / Free / Pro" and the spec read it as replacing company grouping. The user wants tiers AND company grouping. Header breaks below ~1024px.

## Assumptions (grounded in code)
1. Icons are FontAwesome via `apps/web/src/plugins/icons.ts` (`library.add`). Registering new FA Free solid icons (e.g. `faGem`, `faUserPlus`) there is an allowed one-line change.
2. No standalone "Pro perks" modal exists. The perks list is the `PRO_PERKS` constant inside `components/Pricing/PricingProCard.vue`.
3. Tailwind classes use the `tw-` prefix; `tailwind.config.js` has no custom `screens`, so `sm`=640, `md`=768, `lg`=1024. Tokens (`tw-bg-surface-1`, `tw-text-ink-muted`, `tw-text-gold`, `tw-text-accent`) already support dark mode.
4. Breakpoints in use today (inconsistent): `AppHeader.vue` `useMediaQuery('(min-width: 600px)')` (`smAndUp`, gates referral banner, header tabs, mobile header positioning); `pages/Dashboard.vue` `CREATE_SM_UP = 640` (gates `dashboard-mobile-tabs`, `DashboardSidebar` rail, composer placement); `CreditsChip.vue` `sm:` (640) on the Upgrade label; header `md:`/`lg:` classes; `LandingNav.vue` `@media (min-width: 900px)`. Also `(max-width: 600px)` in `Header/Logo.vue` (logo size 30 vs 34) and `Dialogs/ImageDialog.vue`; both are outside the 768/1024 consolidation (Logo is recorded as an audit item for Part 4c). Result: at 640-767px no Create/Explore/Assets tabs render at all (header center is `tw-hidden md:tw-flex`, mobile tabs hide once `isSmUp`).
5. This feature: mobile = <768px, tablet = 768-1023px, desktop = >=1024px for the header, tabs, referral banner and picker sheet, from one constants module. The Create layout split (rail/composer at 640 in `Dashboard.vue`/`DashboardShell.vue`) is NOT changed (decision D8); the audit adds a 700px check for that band.
6. Free/Pro membership is `PREMIUM_MODEL_KEYS` from `@visual-ai/shared` (as `ModelPickerPanel.vue` does today), NOT `Model.tier` (`'budget' | 'standard' | 'premium'`, unrelated).
7. `creditCost` is always set by `getCreditCost` in `utils/models.ts`, but typed optional; sort uses `creditCost ?? 1` (same fallback as `ModelOption.vue`).
8. Model entries can share `id` (variants differ by `title`); keys and selection use `id` + `title` today, so grouping, search and selection must keep that pair as identity.
9. A row's description text is `getModelBestForHint(model)` = `bestAt?.trim() || description`.
10. `DashboardShell.vue` hardcodes `calc(100vh-60px)` while the header is `tw-h-16` (64px); on mobile the header is `position: relative` (`.header-v2--dashboard-mobile`) and the referral banner sits above it.

## Out of scope
Analytics code (ledger, admin page, API or schema changes), bottom tab nav, any change to Simple Analytics, pricing or credit-cost changes, upscaler/utility pickers (`UpscaleModelPicker.vue`, `PromptAiMenu.vue`, `SavedPromptsPanel.vue`, `StylePicker.vue`, `PromptEnhancePicker.vue` behaviourally unchanged), hover flyouts and accordions (rejected), changing the Create layout's 640px rail/composer split (D8), new model or feature data fields (e.g. no `shortTitle`), RTL.

## Tech Stack
Vue 3 + Pinia + vue-router, Tailwind (`tw-` prefix) + scoped SCSS, FontAwesome, Clerk (`SignedIn`/`SignedOut`), GSAP (`directives/reveal.ts`), Vitest (`vp test run`), Playwright e2e (`apps/web/e2e`), Bun workspace, shared package `@visual-ai/shared` (`MODEL_REGISTRY`, `PREMIUM_MODEL_KEYS`, read-only). No `apps/api` changes in this feature.

## Commands
Run from `/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai/apps/web`:
- Unit: `bun run test` (= `vp test run`); coverage: `bun run test:coverage`
- Lint/typecheck: `bun run verify` (= `vp lint --fix && vp check --fix`)
- E2E: `bun run test:e2e` (single file: `bunx playwright test e2e/qa/<file>.spec.ts`)
- Do NOT start the server; it is always running. Browser checks use the `agent-browser` skill with a repo-unique session (`AGENT_BROWSER_SESSION=visual-ai`) and `agent-browser close` at the end.

## Project Structure (grounded)
- `apps/web/src/components/Dashboard/ModelPicker/`: `ModelPicker.vue` (wraps shared `components/primitives/Popover.vue`), `ModelPickerTrigger.vue`, `ModelPickerPanel.vue` (sections Featured/Free/Pro today), `ModelOption.vue` (row; `NAME_SEPARATOR` text-node workaround), `PremiumLockBadge.vue`, `Heading.vue`. New files here: `ModelPickerSearch.vue`, `ModelCompanyHeader.vue` (logo logic as in the deleted `ModelCompanyGroup.vue`: `getModelLogoUrl(models[0]?.iconUrl)`, see `git show f00a3ab^:apps/web/src/components/Dashboard/ModelPicker/ModelCompanyGroup.vue`), sheet wrapper (`ModelPickerSheet.vue`) chosen inside `ModelPicker.vue` by breakpoint.
- `components/primitives/Popover.vue`: shared by ~9 consumers. On open it focuses the first `button:not([disabled]), [role="option"], [role="menuitem"]`; its panel keydown handles ArrowUp/Down/Home/End over that selector and Escape. Any behaviour change must be an opt-in prop with defaults identical to today.
- `apps/web/src/utils/models.ts`: `groupModelsByCompany` (line ~309, no callers today; returns Featured + alphabetical company map, no tiers), `getModelLogoUrl`, `getModelBestForHint`. Replace/extend `groupModelsByCompany` with the tier+company grouping (no parallel helper), plus pure sort and search helpers, tests in `utils/models.test.ts`.
- `packages/shared`: `PREMIUM_MODEL_KEYS`, `MODEL_REGISTRY` (do not change).
- Header: `components/Header/AppHeader.vue` (159 lines; fixed `tw-h-16`; `FeatureSelect` only on Create surface and `tw-hidden md:tw-block`; `ReferralOffer` mobile banner above header when <600px, desktop "Earn credits" pill (`tw-h-9`, `faGift`) in the right cluster otherwise; signed-out `ThemeButton`), `NavTabs.vue`, `FeatureSelect.vue` (titles from `FEATURES` in `utils/constants.ts`: "AI Image Generator", "Image Upscaler", "Colorize Image", "Revive Photos", "Remove Background"), `CreditsChip.vue` (credits button, then PRO chip `pro-badge-header` or "Upgrade to Pro" `upgrade-pill` with `faCrown`, to the RIGHT of credits), `ReferralOffer.vue`, `UserMenu.vue` (`pro-badge` next to name; theme toggle item `user-menu-item-theme`), `ThemeButton.vue`, `Logo.vue`/`LogoMark.vue`.
- `pages/Dashboard.vue`: renders `NavTabs` in `dashboard-mobile-tabs` when <640px. `components/Dashboard/DashboardShell.vue`: `calc(100vh-60px)` height.
- Dialogs: `components/Dialogs/PricingDialog.vue` (fullscreen `AppModal` wrapping `PricingLayout`; mounted only in `Header/UserMenu.vue`), `components/Pricing/PricingLayout.vue` (FAQ via `Landing/FaqSection.vue` heading "Before you buy.", `:deep(.faq)` overrides), `components/AppModal.vue` (`.app-modal--fullscreen .app-modal__panel { height:100%; overflow:auto }`), `stores/dialog.ts` (`showPricing`).
- `components/Landing/FaqSection.vue`: every item has `v-reveal`; `directives/reveal.ts` sets `opacity: 0` and reveals via GSAP ScrollTrigger (default scroller = window).
- Landing: `components/Landing/LandingNav.vue` (`ThemeButton` in `.nav__actions`, which is hidden below 900px, and again as `nav__sheet-theme-btn` inside the open sheet).
- Tests: co-located `*.test.ts`; e2e in `apps/web/e2e/qa/*.spec.ts`, fixtures in `e2e/fixtures/{base,qa,generation}.ts` (`snap` screenshot helper writes under `agent_docs/qa/<feature>/`).

## Code Style
Project rules: DRY, named constants (no magic numbers: breakpoints, header heights, section names live in one constants module), functions under ~30 lines, extract components when markup exceeds ~20 lines or has own state, early returns, comment why not what. Example target for the pure helper:

```ts
// Named PICKER_SECTION to avoid colliding with the existing `ModelTier` type.
export const PICKER_SECTION = { FEATURED: 'Featured', FREE: 'Free', PRO: 'Pro' } as const;

export function sortByCostThenName(a: Model, b: Model): number {
  return (a.creditCost ?? 1) - (b.creditCost ?? 1) || a.title.localeCompare(b.title);
}
```
Follow `~/.claude/skills/{code-style,typescript-best-practices,vue-best-practices}`. Design pass uses the impeccable and layout skills; reuse existing tokens, no new colors beyond existing `gold`/`accent`.

---

## Part 1: Model picker (generation picker only)

### Requirements
1. Sections in order: Featured, Free, Pro. Featured keeps the existing `featured: true` set and its current order (including Pro-only models, which show the lock for non-Pro users; Pro users also see Featured). Featured models also appear in their tier/company group.
2. Free and Pro each contain models grouped by company (`model.companyName ?? model.provider`), each group preceded by an inline sticky sub-header (company logo + name). One scrolling list, same panel component and code path at all widths.
3. Order inside a company group: credit cost ascending, then title (`localeCompare`). Company order within a tier: alphabetical (D3).
4. A company with both free and Pro models appears in both tiers, showing only that tier's models in each.
5. <768px: picker opens as a full-width bottom sheet (backdrop, rounded top, max-height 85dvh, `env(safe-area-inset-bottom)` padding, body scroll locked while open). Dismiss on backdrop tap, Escape, or selecting a model; no drag-to-dismiss (no new dependency); a decorative grab handle is optional. Focus is trapped in the sheet and returns to the trigger on close. >=768px: existing anchored `Popover`. Crossing 768 while open closes the picker (no re-layout mid-open).
6. Search input at top of the panel, sticky above section headers. Case-insensitive substring match on trimmed query against title, company name, and description (`bestAt` and `description`). Applies to all three sections including Featured. Sections and company headers with no matches are removed from the DOM (not `v-show`, since keyboard nav queries `[role=option]`). Zero matches shows the empty state with copy exactly "No models match" plus the echoed query and a clear button. The query resets when the picker closes. Autofocus the input only when `matchMedia('(hover: hover) and (pointer: fine)')` matches AND width >=768; otherwise nothing auto-opens the on-screen keyboard (on touch, focus goes to the selected option or the panel, never the input).
7. Keyboard (popover and sheet alike): ArrowDown from the search input moves to the first visible option; ArrowUp/Down move through visible options only (headers and the clear button are skipped); Home/End move to first/last option except while the input has focus (caret keeps Home/End); Enter selects; Escape closes and returns focus to the trigger. After filtering, the active option is the first visible one. Implement via an opt-in `Popover` prop (or a picker-local handler) so other `Popover` consumers are unchanged.
8. Row bug fix: name and description must be visually separated ("Flux Fast" / "Fastest Flux, batch volume"); fix by layout (separate elements with a gap), not by whitespace text nodes (remove `NAME_SEPARATOR`); the accessible name still reads "name, description" naturally.
9. Row stays one line, uniform height (`tw-h-11`): logo, name + description (truncate, full text in `title`), ref-image icon with tooltip "Up to N reference images" (only when `imageInput`), PRO lock badge (Pro-only and viewer not Pro), credit cost. Locked click still opens pricing.
10. Sticky headers: tier header (Featured/Free/Pro) sticks at the top of the scroll area (below the search bar), company header sticks directly below the tier header (D5). Opaque backgrounds in light and dark so rows don't show through. At 360x640 the stacked sticky chrome (search + tier + company) leaves at least 4 rows visible in the sheet.
11. A model shown twice (Featured and its company group) is selected/highlighted in both places; DOM ids/keys stay unique per section.
12. Design quality: run the impeccable critique/audit and layout skills on the picker; every finding is resolved or recorded with a reason in `agent_docs/ui-polish-picker-header/AUDIT.md`.

### Success criteria (testable)
- Unit (`utils/models.test.ts`): grouping returns Featured, Free, Pro in order; Featured preserves source order; each tier's keys are companies in alphabetical order; a company with free+Pro models appears in both tiers with disjoint models; sort is cost asc then title; search matches title, company, `bestAt` and `description` case-insensitively with trimmed query; no-match returns empty; empty sections/companies are dropped; undefined `creditCost` sorts as 1; same-`id` variants stay distinct.
- Unit (`ModelPickerPanel.test.ts`): renders company headers with logo+name inside Free/Pro; header count matches grouping; typing filters and removes empty headers; "No models match" renders with the query; ArrowDown from input focuses first visible option; Enter selects after filtering; autofocus only when the desktop media query matches.
- Unit (`ModelOption.test.ts`): name and description are separate elements with a gap class and no `NAME_SEPARATOR` text node; lock only for non-Pro + premium; ref icon only when `imageInput`.
- Unit (`Popover.test.ts`): with the new prop unset, behaviour is identical to today (the file stays unmodified and passes). New opt-in prop cases go in a separate `Popover.optIn.test.ts`.
- E2E (`e2e/qa/model-menu.spec.ts` updated, mocked APIs): at 1440 popover shows sections in order and company headers; scrolling the list keeps the current company header pinned; at 390 opens a bottom sheet with `boundingBox().width === viewport.width`, search not focused, Escape closes and focus returns to the trigger; search "flux" shows only matching rows; a nonsense query shows "No models match"; Free user sees lock on Pro rows and on Featured Pro models; keyboard ArrowDown/Enter selects at 1440.
- agent-browser screenshots: 360/390/768/1024/1440, light + dark, picker open, and with search active.

### Edge cases
Company with both tiers; a company whose models are all featured; search matching only a company name (shows all that company's models in that tier); search matching nothing; query with leading/trailing spaces or only spaces (treated as empty); very long model/company name (truncate with `title`); Pro user (no locks); touch laptop with width >=768 (no autofocus); sheet with on-screen keyboard open (`dvh`, search stays visible); reduced motion (no sheet slide animation); dark mode sticky header contrast; company with missing logo (fallback `ProviderIcon`); viewport resize across 768 while open.

---

## Part 2: App header (create/explore/assets shell)

### Requirements
Order, left to right: logo, feature dropdown (Create surface only, as today), tabs (Create/Explore/Assets), then right cluster: Earn, Upgrade, credits pill, avatar dropdown. The Upgrade button moves out of `CreditsChip.vue` into the right cluster (today it renders to the right of credits) so the order becomes Earn, Upgrade, credits, avatar. Upgrade is shown to Free users only. Theme switching is unchanged: signed-out header `ThemeButton` stays; signed-in users keep the avatar-menu theme item (D4).

- >=1024px: single row; Earn and Upgrade show icon + label ("Earn credits", "Upgrade to Pro").
- 768-1023px: single row; Earn and Upgrade are icon-only buttons with `aria-label` and a hover/focus `Tooltip`; feature dropdown shows icon + full title with no truncation (today it shows "AI I..."); tabs visible and centered.
- New icons for Earn and Upgrade, chosen in the design pass from FontAwesome Free solid, must differ from today's `faGift` (Earn) and `faCrown` (Upgrade) (D7). Proposals: Upgrade `faGem`, Earn `faUserPlus`. Register in `plugins/icons.ts`.
- <768px: two rows. Row 1: logo, compact feature dropdown on the Create surface (icon + title, title may truncate with ellipsis, chevron and icon always visible, never hidden), Upgrade icon button (Free only), credits, avatar. Row 2: Create/Explore/Assets as a full-width segmented control in equal thirds. Earn is NOT in the header; the existing top banner (`ReferralOffer` "Refer a friend and earn credits") covers it and now shows below 768px (D2). `dashboard-mobile-tabs` in `Dashboard.vue` is removed in favour of the header's row 2.
- Sticky behaviour <768px: row 2 (tabs) stays visible at the top of the viewport while page content scrolls; banner and row 1 may scroll away as today.
- Tabs centered at 768-1023 and >=1024 (today left-shifted).
- Breakpoints for header, tabs and banner come from one constants module at 768/1024 (remove the 600px `smAndUp` split and the `sm:` label rule in `CreditsChip`).
- Header height comes from one source (constant or CSS variable per breakpoint) used by `DashboardShell.vue` instead of `calc(100vh-60px)`, using `dvh`, and accounting for the banner and two-row mobile header so the bottom-pinned composer is never pushed off-screen.
- Icon-only buttons have tap targets >=44px (today's Earn pill is `tw-h-9`).
- Suggested structure: extract `HeaderActions.vue` and a `useHeaderBreakpoint` composable to keep `AppHeader.vue` small.

### Success criteria
- Unit (`AppHeader.test.ts`, `FeatureSelect.test.ts`, `NavTabs.test.ts`, `CreditsChip.test.ts`, `ReferralOffer.test.ts`, `Dashboard.test.ts`): DOM order of right cluster is Earn, Upgrade, credits, avatar; Free vs Pro rendering (Pro: no Upgrade, no PRO chip); `CreditsChip` no longer renders Upgrade or PRO chip; Earn absent and banner present below 768; icon-only buttons have `aria-label` and tooltip; feature select renders on Create at all widths; `dashboard-mobile-tabs` gone.
- E2E (`e2e/qa/header-responsive.spec.ts`, mocked user/credits): at 1440 and 1024 labels visible and order correct by bounding-box x; at 768 buttons icon-only, feature title not truncated (`scrollWidth <= clientWidth`) for "AI Image Generator" and "Remove Background"; at 700 tabs visible; at 390/360 two rows, segmented control thirds equal width (+/-1px), feature select visible, Earn absent, banner present, no horizontal page scroll (`documentElement.scrollWidth <= innerWidth`); on Explore at 390 after scrolling the content, tabs remain within the viewport top; on Create at 360/390 with banner showing, composer bottom <= `innerHeight`.
- Screenshots 360/390/768/1024/1440 light + dark, Free and Pro, Create/Explore/Assets routes.

### Edge cases
Free user below 1024 (icon button with `aria-label="Upgrade to Pro"`, tooltip on hover/focus, touch relies on `aria-label`); Pro user (no Upgrade, no PRO chip); longest feature titles ("AI Image Generator", "Remove Background") at 768 and 360; 360px with 4-digit credits and animated counter; Clerk not loaded (skeleton `header-end-skeleton` and tabs skeleton match the new layout at each breakpoint); signed-out state (Sign In, theme button) unchanged; Explore/Assets routes (no feature dropdown; layout stays aligned); low-credits state; dark mode.

---

## Part 3: Plan pill

### Requirements
- Remove the PRO chip from the header (`pro-badge-header` in `CreditsChip.vue`).
- In `UserMenu.vue`, replace the small `pro-badge` next to the name with a `button` pill: Pro users see a gold "PRO" pill (existing `tw-bg-gold/15 tw-text-gold` styling); Free users see a muted "FREE" pill. Neither renders until `userStore.isReady`.
- Click PRO opens the Pro perks modal (Pro benefits, no buy CTA). Click FREE opens the existing Upgrade to Pro modal (`dialogStore.showPricing()`). The menu closes on click.
- Perks modal (D1): new `ProPerksDialog.vue` on `AppModal`, mounted at the template root of `Header/UserMenu.vue` next to `<PricingDialog />` (its only mount today); move `PRO_PERKS` out of `PricingProCard.vue` into a shared module used by both, so there is one source of truth. No new perk copy.
- `Profile/UserDetails.vue` (`profile-pro-status`) is unchanged.

### Success criteria
Unit: `CreditsChip`/header has no PRO chip for Pro; UserMenu shows PRO/FREE by `isPro` and nothing before `isReady`; click handlers call the correct dialog; perks dialog renders every `PRO_PERKS` item and has no purchase button; `PricingProCard` still renders the same perks. E2E: Free click FREE opens pricing dialog; Pro click PRO opens perks dialog; Escape closes and focus returns to the avatar button. Screenshots of the open menu in light/dark at 360 and 1440, Free and Pro.
Edge cases: user data not ready (no pill flash); just-subscribed state (pill flips to PRO reactively); long name truncation must not hide the pill; keyboard focus order.

---

## Part 4: Fixes

### 4a. Upgrade-to-Pro dialog FAQs not visible
Reproduce first at 1440 and 390 with agent-browser, then root-cause and fix at the source. Lead hypothesis from code: `FaqSection` items use `v-reveal`, which sets `opacity: 0` and waits for a GSAP ScrollTrigger on the window scroller; inside the fullscreen `AppModal` panel (`overflow: auto`) the window never scrolls, so items stay invisible. Other candidates: `PricingLayout`'s `:deep(.faq)` overrides, panel height/clipping, `dvh` vs 100% on mobile.
Success: a unit test that fails before the fix and passes after; e2e opens the dialog (mocked prices), scrolls the panel to the bottom, asserts the heading "Before you buy." and every question are visible (`toBeVisible` plus computed `opacity === '1'` and in-viewport check), and an answer expands. Verified at 360/390/768/1440 light+dark. The `/pricing` page FAQ and landing-page reveal animations still work (regression check).

### 4b. Landing mobile theme toggle
`LandingNav.vue`: below 900px (where `.nav__actions` is hidden) show `ThemeButton` in the header bar next to the hamburger; at >=900 it stays in `.nav__actions`; exactly one visible toggle at any width. Remove `nav__sheet-theme-btn` and its duplicated SCSS from the open menu.
Success: unit test asserts no `ThemeButton` inside the sheet; e2e at 390 and 800 shows the toggle visible with the menu closed, toggling changes the theme class/attribute, tap target >=44px, no header overflow at 360; at 1440 one toggle in the actions.

### 4c. Create page responsiveness audit
Before any change, capture baseline screenshots at 360, 390, 700, 768, 1024, 1440 (light+dark, Free and Pro). Audit header, composer (bottom-pinned), aside/options, model picker trigger, generated grid, history, dialogs. Record each finding in a table (width, element, symptom, fix, status) in `agent_docs/ui-polish-picker-header/AUDIT.md`. Known: feature dropdown vanishes at mobile/tablet, tabs left-shifted, feature name truncated ("AI I..."), picker row text fusion, no tabs at 640-767, `DashboardShell` 60px vs 64px header mismatch.
Success: no horizontal scroll at any audited width; no clipped/overlapping controls; tap targets >=44px; composer fully visible with banner showing (e2e) and with the on-screen keyboard open (manual agent-browser check, recorded); e2e `create-responsive.spec.ts` with an assertion per fixed finding plus screenshots; at 1440 the only visual differences from baseline are the intended header and picker changes (side-by-side review recorded).

---

## Part 5: Analytics (research only, deliverable written during build)
Deliver `agent_docs/ui-polish-picker-header/ANALYTICS.md` (no code, no schema migration). Must answer:
1. Can Simple Analytics (current tool) do per-user custom analytics (images per user per date, total cost/price per user)? Hypothesis: no user identification by design; confirm from official docs with citations.
2. Compare free options: PostHog free tier, Umami, Plausible (self-host/CE), others; criteria: per-user identity, custom events with properties, cost, privacy/consent, self-host burden, query/export (SQL/API).
3. First-party approach: Mongo usage ledger (userId, model, imageCount, creditsCharged, Replicate USD cost from prediction metrics, status, createdAt) plus an admin-only page. Note current `apps/api/src/models/image.ts` has `userId`, `modelName`, `createdAt` but no credits or cost, so history cannot be backfilled accurately; describe indexes, idempotency per prediction, and refund/failure handling.
4. End with one recommendation and a rough effort estimate.
Success: doc exists, each question answered with linked sources, recommendation explicit, no code or API changes in the diff.

---

## Testing Strategy
- Vitest unit tests alongside each changed component/util (per the lists above); target >=90% line coverage on new pure helpers.
- Playwright e2e in `apps/web/e2e/qa/`, using fixtures in `e2e/fixtures`. ALL paid/outbound APIs mocked: `POST /generate/image`, `/generate/video`, progress, result URLs, Dodo, email. The harness fails un-intercepted paid calls; do not bypass. Pricing endpoints mocked with `page.route`.
- Visual: agent-browser screenshots at 360/390/768/1024/1440 (plus 700 for the audit), light + dark, saved under `agent_docs/qa/ui-polish-picker-header/` (same convention as the `snap` fixture).
- Existing tests to update (testids `pro-badge-header`, `upgrade-pill`, `pro-badge`, `dashboard-mobile-tabs`, `model-section-*`, referral offer): unit `ModelPickerPanel.test.ts`, `ModelOption.test.ts`, `AppHeader.test.ts`, `CreditsChip.test.ts`, `UserMenu.test.ts`, `ReferralOffer.test.ts`, `Dashboard.test.ts`, `LandingNav.test.ts`, `PricingProCard` tests; e2e (checked by selector grep) `model-menu.spec.ts` and `pro-tier.spec.ts` (picker; `pro-tier` also `pro-badge`), `upgrade-entry.spec.ts` (`upgrade-pill`, `pro-badge-header`, `pro-badge`), `plan-status.spec.ts` (`pro-badge`), `pricing-layout.spec.ts` (`upgrade-pill`), `mods-referral-favicon.spec.ts` (`referral-offer-mobile`/`-desktop` at the 600 split), non-QA `create-image.spec.ts` and `create-transforms.spec.ts` (picker), and `localized-prices.spec.ts` as a `credits-chip` regression. `pro-perks.spec.ts` uses none of the changed selectors.

## Boundaries
- Always: mock paid APIs; run `bun run verify` and unit tests before declaring a phase done; named constants for breakpoints/sections/header heights; keep upscaler/utility pickers and other `Popover` consumers behaviourally identical; verify light and dark.
- Ask first: adding dependencies (e.g. a bottom-sheet library; default is none), changing `@visual-ai/shared`, any API/schema change, adding new Pro-perk copy, changing the Create layout's 640 split.
- Never: call real Replicate/Dodo-live/email; change credit costs or pricing; commit outside WORKFLOW rules; start/restart the server; reintroduce hover flyouts or accordions; add a bottom nav; write analytics code.

## Success Criteria (summary)
All per-part criteria above pass; `bun run test` and `bun run verify` green; Playwright specs green with mocks only; screenshots reviewed at 360/390/768/1024/1440 in both themes; no horizontal scroll at any audited width; impeccable/layout design findings resolved or recorded; ANALYTICS.md present with recommendation.

## Decisions (resolved former Open Questions)
- D1. Pro perks modal: none exists; build `ProPerksDialog.vue` on `AppModal`, mounted in `Header/UserMenu.vue` beside `<PricingDialog />`, with `PRO_PERKS` shared with `PricingProCard.vue` (confirmed intent permits this).
- D2. Referral banner switches at 768 (confirmed intent: on mobile <768 Earn lives in the banner).
- D3. Company order within a tier: alphabetical (prior behaviour of `groupModelsByCompany`).
- D4. Theme: signed-out header `ThemeButton` unchanged; signed-in users keep `user-menu-item-theme` in the avatar menu (verified in `UserMenu.vue`).
- D5. Both tier and company headers sticky, tier above company (a company can appear in both tiers, so the tier label is needed context); height budget in Part 1 req 10.
- D6. Featured visible to Pro users too (confirmed intent: Featured keeps its existing set).
- D7. Icons: final pick in the design pass, must differ from `faCrown`/`faGift`.
- D8. The Create layout's 640px rail/composer split stays; only header, tabs, banner and picker sheet move to 768. The audit covers 700px.

## Open Questions
None blocking. (Only revisit D8's 640 split if the 700px audit shows the rail/composer breaking under the new header.)
