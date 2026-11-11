# Tasks: UI Polish, Model Picker and Header

Source: SPEC.md, PLAN.md. Branch: feature-enhancement. Never start servers (always running). No commits unless the owner asks. The project already has Playwright, Vitest, the seeded QA harness (`apps/web/e2e/qa/`, `e2e/fixtures/qa.ts`, `snap` helper), e2e prod-server mode (`E2E_SERVER=prod`, in `apps/web/playwright.config.ts`, documented in `apps/web/e2e/README.md`) and the required .gitignore entries (`test-results/`, `playwright-report/`, `coverage/`, `.dashboard/*/reports/`, `.next-e2e`), so no Phase 0 setup tasks are needed.

Commands: root `bun run verify`, `bun run test`; web `cd apps/web && bun run test` / `bun run verify`; e2e `cd apps/web && bunx playwright test <spec>`. All `Files:` paths are relative to the repo root, and every Verify command starts from the repo root (a `cd apps/web &&` prefix applies to that one command only). Coverage commands pass one `--coverage.include=<file>` flag per file: a comma-joined list matches nothing under this vite-plus vitest (checked: "All files 0").

Mock-only rule (applies to every task): no task may make a real Replicate, Dodo live or email call. Every e2e spec stubs `POST /generate/image`, `/generate/video`, progress, result URLs, Dodo and pricing endpoints via `page.route`, keeps `paidCallGuard` on and never opts out. If a real call ever seems needed, stop and ask the owner. Working tree has uncommitted edits from earlier features: read current content and merge, never overwrite. When a change breaks an existing assertion the implementation task updates it (never weakens it); new coverage comes from the dedicated Unit and E2E tasks. Visual evidence: `agent-browser` with `AGENT_BROWSER_SESSION=visual-ai`, always ended with `agent-browser close`, supplementary only. This repo has no `qa-seed.init.js`; sign in as the seeded e2e QA user from `e2e/fixtures/qa.ts`. Screenshots go under `agent_docs/qa/ui-polish-picker-header/`.

## Phase 0: Baseline screenshots and audit table

**Adds:** No product change. Captures baseline screenshots of today's UI and seeds the responsiveness audit table that later phases compare against.
**Try in UI:** No UI change ; run `ls agent_docs/qa/ui-polish-picker-header/baseline | wc -l` and confirm the set is present ; open `agent_docs/ui-polish-picker-header/AUDIT.md` and confirm a row per known finding.

### ☐ T0.1 Capture baseline screenshots

- **Kind:** dod
- **Files:** `agent_docs/qa/ui-polish-picker-header/baseline/` (screenshots only)
- **Do:** With `agent-browser` (session `visual-ai`) capture Create (banner showing on mobile), Explore, Assets, the model picker open, and the Upgrade dialog (Free only) at 360, 390, 700, 768, 1024, 1440, light and dark, Free and Pro. Sign in as the seeded e2e QA user; for Pro, activate it with `activateProViaWebhook` from `apps/web/e2e/support/proWebhook.ts` (signed local test webhook, no Dodo call) and restore it afterwards with `resetToFree` from `apps/web/e2e/support/subscriptionState.ts`. Name files `<route>-<width>-<theme>-<plan>.png`. End with `agent-browser close`.
- **Acceptance:** SPEC Part 4c baseline requirement met: every route/width/theme/plan combination above has a screenshot; the QA user is back on Free; none overwritten later.
- **Verify:** `for w in 360 390 700 768 1024 1440; do echo "$w $(ls agent_docs/qa/ui-polish-picker-header/baseline | grep -c -- "-$w-")"; done` (every width non-zero); `ls agent_docs/qa/ui-polish-picker-header/baseline | grep -c -- '-dark-'`; `ls agent_docs/qa/ui-polish-picker-header/baseline | grep -c -- '-pro'`.

### ☐ T0.2 Seed audit table

- **Kind:** dod
- **Files:** `agent_docs/ui-polish-picker-header/AUDIT.md`
- **Do:** Create the audit table (columns: width, element, symptom, fix, status) with one row per SPEC Part 4c known finding: feature dropdown vanishes at mobile/tablet, tabs left-shifted, feature name truncated ("AI I..."), picker row text fusion, no tabs at 640-767, `DashboardShell` 60px vs 64px header mismatch. Add rows for the "700px band for the unchanged 640 split", the "keyboard open" check, and "`Header/Logo.vue` still switches size at 600px" (out of the 768/1024 consolidation; decide in P11). The status column uses exactly one of the tokens `open`, `fixed`, `no issue`, `wontfix`.
- **Acceptance:** Table exists with an entry per known finding; each has status `open` and the baseline screenshot name as evidence.
- **Verify:** `grep -c '| open |' agent_docs/ui-polish-picker-header/AUDIT.md` (at least 9).

🔶 **Checkpoint 0**: baseline set complete and audit table seeded; no code touched.

## Phase 1: Shared breakpoint constants and composable

**Adds:** One source of truth for the 768/1024 breakpoints. The referral banner and the header Earn pill now switch at 768 together instead of 600.
**Try in UI:** Open Create at 700px wide and see the referral banner ; widen to 768px and see the banner gone and the Earn pill in the header ; run `grep -n "smAndUp\|600px" apps/web/src/components/Header/AppHeader.vue apps/web/src/components/Header/ReferralOffer.vue` and confirm nothing remains.

### ☐ T1.1 layout.ts and useHeaderBreakpoint

- **Kind:** implementation
- **Files:** `apps/web/src/utils/layout.ts`, `apps/web/src/composables/useHeaderBreakpoint.ts`, `apps/web/src/components/Header/AppHeader.vue`, `apps/web/src/components/Header/ReferralOffer.vue`, `apps/web/src/pages/Dashboard.vue`
- **Do:** Create `layout.ts` with `BREAKPOINT = { MOBILE_MAX: 768, DESKTOP_MIN: 1024 }` and `CREATE_LAYOUT_SM = 640` (D8, named only). Create `useHeaderBreakpoint()` over `useMediaQuery` returning `{ isMobile, isTablet, isDesktop }`. Replace `smAndUp` (600px) in `AppHeader.vue` and `(max-width: 600px)` in `ReferralOffer.vue` with it; use `CREATE_LAYOUT_SM` for the 640 in `Dashboard.vue` without changing behaviour. Update existing assertions that encode 600.
- **Acceptance:** SPEC Part 2 breakpoint requirement: banner shows below 768 and Earn pill hides below 768 together; 640 split unchanged (D8); no `600px`/`smAndUp` left in `AppHeader.vue` or `ReferralOffer.vue` (`Logo.vue` and `ImageDialog.vue` keep theirs; see AUDIT.md).
- **Verify:** `cd apps/web && npx vitest run src/components/Header src/pages/Dashboard.test.ts`; `grep -rn "smAndUp" apps/web/src` (empty); `grep -n "600px" apps/web/src/components/Header/AppHeader.vue apps/web/src/components/Header/ReferralOffer.vue` (empty); `bun run verify`.

### ☐ T1.2 Unit: breakpoint composable and banner gate

- **Kind:** unit
- **Files:** `apps/web/src/composables/useHeaderBreakpoint.ts`, `apps/web/src/components/Header/AppHeader.vue`, `apps/web/src/components/Header/ReferralOffer.vue`
- **Do:** Add `useHeaderBreakpoint.test.ts` covering mobile/tablet/desktop at 767, 768, 1023, 1024 (mock `matchMedia`); extend `AppHeader.test.ts` and `ReferralOffer.test.ts` for banner present and Earn absent below 768, inverse at 768.
- **Acceptance:** SPEC Part 2 unit criteria for banner/Earn gating; every file at least 80% lines/branches/functions/statements, target over 95%; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/composables/useHeaderBreakpoint.test.ts src/components/Header/AppHeader.test.ts src/components/Header/ReferralOffer.test.ts --coverage --coverage.include=src/composables/useHeaderBreakpoint.ts --coverage.include=src/components/Header/ReferralOffer.vue --coverage.include=src/components/Header/AppHeader.vue --coverage.reporter=text`

### ☐ T1.3 E2E: banner and Earn breakpoint

- **Kind:** e2e
- **Scenarios:** `@critical` banner visible at 390 and 700, Earn pill absent; `@critical` banner absent and Earn pill present at 768 and 1024; `@medium` no horizontal page scroll at 700.
- **Spec:** `apps/web/e2e/qa/header-responsive.spec.ts`
- **Files:** `apps/web/e2e/qa/mods-referral-favicon.spec.ts` (asserts `referral-offer-mobile`/`referral-offer-desktop`, whose split moves from 600 to 768)
- **Acceptance:** Scenarios derived from SPEC Part 2 banner criteria pass with mocked user/credits; `mods-referral-favicon.spec.ts` updated to the 768 split without weakening; `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/mods-referral-favicon.spec.ts --repeat-each=3`

### ☐ T1.4 Gate: Phase 1

- **Kind:** gate
- **Files:** none
- **Do:** Run lint, typecheck, unit and the new and updated QA specs as evidence.
- **Acceptance:** Repo green; no remaining `smAndUp` or `600px` in `AppHeader.vue`/`ReferralOffer.vue`; no test weakened.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/mods-referral-favicon.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`; `grep -rn "smAndUp" apps/web/src` (empty); `grep -n "600px" apps/web/src/components/Header/AppHeader.vue apps/web/src/components/Header/ReferralOffer.vue` (empty).

🔶 **Checkpoint 1**: breakpoints centralised at 768/1024 and the banner/Earn gate agree.

## Phase 2: Upgrade out of CreditsChip, new right cluster

**Adds:** Header right cluster reads Earn, Upgrade, credits, avatar. Below 1024 Earn and Upgrade become icon-only buttons with tooltips and new icons; the Upgrade button no longer lives inside the credits chip.
**Try in UI:** At 1440 see "Earn credits" and "Upgrade to Pro" labels left of credits ; at 900 see icon-only buttons and hover for tooltips ; at 390 see only the Upgrade icon, with Earn in the top banner.

### ☐ T2.1 HeaderActions and new icons

- **Kind:** implementation
- **Files:** `apps/web/src/components/Header/HeaderActions.vue`, `apps/web/src/components/Header/AppHeader.vue`, `apps/web/src/components/Header/CreditsChip.vue`, `apps/web/src/plugins/icons.ts`, `apps/web/src/components/Header/ReferralOffer.vue`
- **Do:** New `HeaderActions.vue` renders Earn, Upgrade (Free only), `CreditsChip`, avatar in that DOM order; Earn hidden below 768. Icon-only with `aria-label` and `Tooltip` (focus and hover) at 768-1023, labels at >=1024, Upgrade icon button below 768; tap targets >=44px. `CreditsChip.vue` stops rendering `upgrade-pill` and its `sm:` label rule; `pro-badge-header` stays until P3. Register new FA icons (proposal `faUserPlus` Earn, `faGem` Upgrade; must differ from `faGift`/`faCrown`) in `plugins/icons.ts`. `AppHeader.vue` uses `HeaderActions`; `header-end-skeleton` matches each breakpoint. Update existing assertions on `upgrade-pill`.
- **Acceptance:** SPEC Part 2 order, icon-only tooltip and aria-label, Free-only Upgrade, >=44px targets, new icons differ from `faGift`/`faCrown` (D7); skeleton matches layout.
- **Verify:** `cd apps/web && npx vitest run src/components/Header`; `bun run verify`; `grep -rn "upgrade-pill" apps/web/src/components/Header/CreditsChip.vue` (empty).

### ☐ T2.2 Unit: header actions and credits chip

- **Kind:** unit
- **Files:** `apps/web/src/components/Header/HeaderActions.vue`, `apps/web/src/components/Header/CreditsChip.vue`, `apps/web/src/components/Header/AppHeader.vue`
- **Do:** Add `HeaderActions.test.ts`; update `CreditsChip.test.ts` (no Upgrade) and `AppHeader.test.ts`: DOM order Earn, Upgrade, credits, avatar; Free vs Pro (Pro has no Upgrade); icon-only buttons have `aria-label` and tooltip; Earn absent below 768; skeleton renders.
- **Acceptance:** SPEC Part 2 unit criteria; every file at least 80% across all metrics, target over 95%; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/components/Header/HeaderActions.test.ts src/components/Header/CreditsChip.test.ts src/components/Header/AppHeader.test.ts --coverage --coverage.include=src/components/Header/HeaderActions.vue --coverage.include=src/components/Header/CreditsChip.vue --coverage.include=src/components/Header/AppHeader.vue --coverage.reporter=text`

### ☐ T2.3 E2E: right cluster order and icon-only

- **Kind:** e2e
- **Scenarios:** `@critical` at 1440 and 1024 labels visible and order Earn, Upgrade, credits, avatar by bounding-box x; `@critical` at 768 buttons icon-only with `aria-label` and tooltip on hover; `@high` Pro user has no Upgrade; `@high` at 390 Upgrade icon visible and Earn absent; `@medium` Upgrade click opens pricing dialog (mocked prices).
- **Spec:** `apps/web/e2e/qa/header-responsive.spec.ts`
- **Files:** `apps/web/e2e/qa/upgrade-entry.spec.ts`, `apps/web/e2e/qa/pricing-layout.spec.ts` (both select `upgrade-pill`)
- **Acceptance:** Scenarios from SPEC Part 2 criteria pass; stale `upgrade-pill` selectors in both existing specs updated without weakening; `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pricing-layout.spec.ts --repeat-each=3`

### ☐ T2.4 Gate: Phase 2

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence (`localized-prices.spec.ts` as a regression check, since it opens Buy Credits from `credits-chip`); `agent-browser` screenshot at 1440/768/390 as supplementary.
- **Acceptance:** Free and Pro render correctly at 1440, 768, 390; repo green.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/localized-prices.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`.

🔶 **Checkpoint 2**: right cluster order and responsive actions correct for Free and Pro.

## Phase 3: Plan pill in avatar menu and Pro perks dialog

**Adds:** The PRO chip leaves the header. The avatar menu shows a gold PRO or muted FREE pill; FREE opens the upgrade dialog and PRO opens a new Pro perks dialog.
**Try in UI:** As a Pro user open the avatar menu and click PRO to see the perks dialog ; as a Free user click FREE to see the Upgrade dialog ; confirm no PRO chip beside credits.

### ☐ T3.1 Shared PRO_PERKS and ProPerksDialog

- **Kind:** implementation
- **Files:** `apps/web/src/utils/proPerks.ts`, `apps/web/src/components/Pricing/PricingProCard.vue`, `apps/web/src/components/Dialogs/ProPerksDialog.vue`, `apps/web/src/stores/dialog.ts`
- **Do:** Move `PRO_PERKS` out of `PricingProCard.vue` into `utils/proPerks.ts` (no copy change). New `ProPerksDialog.vue` on `AppModal` renders every perk, no purchase button. Add `showProPerks`/close state to `stores/dialog.ts`. Update existing tests broken by the move.
- **Acceptance:** SPEC Part 3 D1: one `PRO_PERKS` source used by card and dialog; no new perk copy; dialog has no buy CTA.
- **Verify:** `cd apps/web && npx vitest run src/components/Pricing src/stores/dialog.test.ts`; `bun run verify`; `grep -rn "PRO_PERKS =" apps/web/src` (one hit).

### ☐ T3.2 UserMenu pill and chip removal

- **Kind:** implementation
- **Files:** `apps/web/src/components/Header/UserMenu.vue`, `apps/web/src/components/Header/CreditsChip.vue`
- **Do:** In `UserMenu.vue` replace `pro-badge` with a `button` pill (PRO `tw-bg-gold/15 tw-text-gold`, FREE muted), rendered only when `userStore.isReady`; FREE calls `dialogStore.showPricing()`, PRO calls `showProPerks`; menu closes on click; long names truncate without hiding the pill. Mount `<ProPerksDialog />` at the template root of `UserMenu.vue` next to the existing `<PricingDialog />` (the only `PricingDialog` mount in the app, beside `ReferralDialog` and `ReferralCopyDialog`). Remove `pro-badge-header` from `CreditsChip.vue`. `Profile/UserDetails.vue` untouched.
- **Acceptance:** SPEC Part 3: no PRO chip in header; pill by plan, nothing before ready; correct dialog opens; `profile-pro-status` unchanged; pill flips reactively after subscribe.
- **Verify:** `cd apps/web && npx vitest run src/components/Header src/components/Dialogs`; `bun run verify`; `grep -rn "pro-badge-header" apps/web/src --include=*.vue` (empty).

### ☐ T3.3 Unit: plan pill and perks dialog

- **Kind:** unit
- **Files:** `apps/web/src/components/Header/UserMenu.vue`, `apps/web/src/components/Dialogs/ProPerksDialog.vue`, `apps/web/src/components/Pricing/PricingProCard.vue`, `apps/web/src/stores/dialog.ts`
- **Do:** Update `UserMenu.test.ts` (stale `pro-badge`): PRO/FREE by `isPro`, nothing before `isReady`, pill flips from FREE to PRO when `isPro` becomes true without remount, a long name truncates while the pill stays rendered, click handlers call the right dialog and close the menu, `ProPerksDialog` is mounted. Add `ProPerksDialog.test.ts` (every `PRO_PERKS` item, no purchase button). Update `PricingProCard` test (same perks), `CreditsChip.test.ts` (no chip) and `dialog.test.ts` (`showProPerks` open/close).
- **Acceptance:** SPEC Part 3 unit criteria; every file at least 80% across metrics, target over 95%; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/components/Header/UserMenu.test.ts src/components/Dialogs/ProPerksDialog.test.ts src/components/Pricing/PricingProCard.test.ts src/components/Header/CreditsChip.test.ts src/stores/dialog.test.ts --coverage --coverage.include=src/components/Header/UserMenu.vue --coverage.include=src/components/Dialogs/ProPerksDialog.vue --coverage.include=src/components/Pricing/PricingProCard.vue --coverage.include=src/stores/dialog.ts --coverage.reporter=text`

### ☐ T3.4 E2E: plan pill

- **Kind:** e2e
- **Scenarios:** `@critical` Free clicks FREE and the pricing dialog opens; `@critical` Pro clicks PRO and the perks dialog opens with no buy button; `@high` Escape closes and focus returns to the avatar button; `@high` no PRO chip in the header; `@medium` pill absent until user data ready; `@medium` open menu at 360 and 1440 light/dark via `snap`.
- **Spec:** `apps/web/e2e/qa/plan-pill.spec.ts`
- **Files:** `apps/web/e2e/qa/plan-status.spec.ts`, `apps/web/e2e/qa/pro-tier.spec.ts`, `apps/web/e2e/qa/upgrade-entry.spec.ts` (all select `pro-badge`; `upgrade-entry` also `pro-badge-header`)
- **Acceptance:** SPEC Part 3 e2e criteria pass; stale `pro-badge`/`pro-badge-header` selectors in the three existing specs updated without weakening; mocked APIs only.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/plan-pill.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/upgrade-entry.spec.ts --repeat-each=3`

### ☐ T3.5 Gate: Phase 3

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** No Pro indicator regression; repo green; no test weakened.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/plan-pill.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/upgrade-entry.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`; `grep -rn "pro-badge-header" apps/web/src apps/web/e2e` (empty).

🔶 **Checkpoint 3**: plan indicator lives in the avatar menu for Free and Pro.

## Phase 4: Tabs into the header

**Adds:** Create, Explore and Assets tabs are always visible: centered on tablet and desktop, and a full-width second row on mobile that stays at the top while scrolling. The feature dropdown shows at every width on Create.
**Try in UI:** At 390 see two header rows and equal-thirds tabs ; scroll Explore and see tabs stay at the top ; at 768 see the feature name untruncated and tabs centered.

### ☐ T4.1 Header tabs, segmented variant, FeatureSelect

- **Kind:** implementation
- **Files:** `apps/web/src/components/Header/AppHeader.vue`, `apps/web/src/components/Header/NavTabs.vue`, `apps/web/src/components/Header/FeatureSelect.vue`, `apps/web/src/pages/Dashboard.vue`
- **Do:** Render tabs in `AppHeader` using `useHeaderBreakpoint`: centered at >=768; below 768 a row-2 full-width equal-thirds segmented control (`NavTabs` segmented variant), sticky at the viewport top. Remove `dashboard-mobile-tabs` from `Dashboard.vue`. `FeatureSelect` renders at all widths on Create: icon + full title at 768-1023, compact below 768 (icon and chevron never hidden, title ellipsizes). Tabs skeleton matches. Update stale `dashboard-mobile-tabs` assertions.
- **Acceptance:** SPEC Part 2: tabs at every width including 640-767; centered at 768+; sticky row 2 below 768; feature select on Create at all widths; `dashboard-mobile-tabs` gone.
- **Verify:** `cd apps/web && npx vitest run src/components/Header src/pages/Dashboard.test.ts`; `bun run verify`; `grep -rn "dashboard-mobile-tabs" apps/web/src --include=*.vue` (empty).

### ☐ T4.2 Unit: tabs and feature select

- **Kind:** unit
- **Files:** `apps/web/src/components/Header/NavTabs.vue`, `apps/web/src/components/Header/FeatureSelect.vue`, `apps/web/src/components/Header/AppHeader.vue`, `apps/web/src/pages/Dashboard.vue`
- **Do:** Update `NavTabs.test.ts`, `FeatureSelect.test.ts`, `AppHeader.test.ts`, `Dashboard.test.ts`: segmented variant below 768, centered at 768+, `dashboard-mobile-tabs` absent, feature select on Create at all widths and absent on Explore/Assets, tabs skeleton.
- **Acceptance:** SPEC Part 2 unit criteria; every file at least 80% across metrics, target over 95%; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/components/Header/NavTabs.test.ts src/components/Header/FeatureSelect.test.ts src/components/Header/AppHeader.test.ts src/pages/Dashboard.test.ts --coverage --coverage.include=src/components/Header/NavTabs.vue --coverage.include=src/components/Header/FeatureSelect.vue --coverage.include=src/components/Header/AppHeader.vue --coverage.include=src/pages/Dashboard.vue --coverage.reporter=text`

### ☐ T4.3 E2E: tabs and feature select across widths

- **Kind:** e2e
- **Scenarios:** `@critical` at 700 tabs visible; `@critical` at 390/360 two rows, segmented thirds equal within 1px, feature select visible, Earn absent, banner present; `@critical` feature title `scrollWidth <= clientWidth` at 768 for "AI Image Generator" and "Remove Background"; `@high` on Explore at 390 after scrolling tabs stay in the viewport top; `@high` no horizontal page scroll at 360/390, including at 360 with a mocked 4-digit credit balance; `@medium` tabs centered at 768 and 1024.
- **Spec:** `apps/web/e2e/qa/header-responsive.spec.ts`
- **Files:** none
- **Acceptance:** SPEC Part 2 e2e criteria pass with mocked user/credits; `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts --repeat-each=3`

### ☐ T4.4 Gate: Phase 4

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** Tabs visible at every width 360-1440; repo green.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`.

🔶 **Checkpoint 4**: header layout complete at every width.

## Phase 5: Header height from a single source

**Adds:** The dashboard height follows the real header (including the two-row mobile header and banner) using dynamic viewport units, so the composer is never pushed off-screen.
**Try in UI:** At 390 with the banner showing open Create and see the composer fully visible at the bottom ; at 1440 confirm no extra scroll ; run `grep -rn "100vh-60px" apps/web/src` and confirm nothing remains.

### ☐ T5.1 Header height variable and dvh shell

- **Kind:** implementation
- **Files:** `apps/web/src/utils/layout.ts`, `apps/web/src/components/Header/AppHeader.vue`, `apps/web/src/components/Dashboard/DashboardShell.vue`, `apps/web/src/pages/Dashboard.vue`
- **Do:** Define `--app-header-h` (and the mobile row heights) once from `layout.ts` constants; replace `calc(100vh-60px)` in `DashboardShell.vue` and the two `Dashboard.vue` uses with `dvh` plus the variable; reconcile 60 vs 64px and the banner/two-row mobile case. Prove by e2e, not arithmetic.
- **Acceptance:** SPEC Part 2 height requirement: one source, `dvh`, composer never off-screen with banner; `100vh-60px` gone.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard src/pages/Dashboard.test.ts`; `bun run verify`; `grep -rn "100vh-60px" apps/web/src` (empty).

### ☐ T5.2 Unit: shell height

- **Kind:** unit
- **Files:** `apps/web/src/utils/layout.ts`, `apps/web/src/components/Dashboard/DashboardShell.vue`, `apps/web/src/pages/Dashboard.vue`
- **Do:** Update `Dashboard.test.ts` and the existing `DashboardShell.test.ts`, asserting the height classes/styles use the shared variable and `dvh` and that `layout.ts` constants are the values consumed.
- **Acceptance:** SPEC Part 2 unit criteria for height; every file at least 80% across metrics; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/DashboardShell.test.ts src/pages/Dashboard.test.ts --coverage --coverage.include=src/components/Dashboard/DashboardShell.vue --coverage.include=src/utils/layout.ts --coverage.include=src/pages/Dashboard.vue --coverage.reporter=text`

### ☐ T5.3 E2E: composer stays on screen

- **Kind:** e2e
- **Scenarios:** `@critical` on Create at 360 and 390 with the banner showing the composer bottom is `<= innerHeight`; `@high` same at 1440 and 768; `@medium` no vertical overflow regression after banner dismissal.
- **Spec:** `apps/web/e2e/qa/header-responsive.spec.ts`
- **Files:** none
- **Acceptance:** SPEC Part 2 e2e composer criterion passes; mocked generation endpoints only.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts --repeat-each=3`

### ☐ T5.4 Gate: Phase 5

- **Kind:** gate
- **Files:** none
- **Do:** Run suites and greps as evidence.
- **Acceptance:** Repo green; `100vh-60px` absent.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`; `grep -rn "100vh-60px" apps/web/src`.

🔶 **Checkpoint 5**: header height has one source and the composer is always reachable.

## Phase 6: Picker grouping, company headers, row fix

**Adds:** The model picker is grouped by Featured, Free and Pro, with company sub-headers (logo and name) inside Free and Pro, sorted by cost then name. Model rows no longer fuse name and description.
**Try in UI:** Open the picker and see Featured, Free, Pro with company headers ; scroll and see the current company header stay pinned ; see "Flux Fast" separated from its description.

### ☐ T6.1 Tier and company grouping helpers

- **Kind:** implementation
- **Files:** `apps/web/src/utils/models.ts`
- **Do:** Rewrite `groupModelsByCompany` in place (keep the name; it has no callers today) to return tier+company grouping: add `PICKER_SECTION`, pure `sortByCostThenName`, Featured in source order, Free/Pro from `PREMIUM_MODEL_KEYS`, companies alphabetical by `companyName ?? provider`, identity `id`+`title`, `creditCost ?? 1`. No parallel helper.
- **Acceptance:** SPEC Part 1 reqs 1-4, the identity part of req 11, and assumptions 6-8: sections in order, company in both tiers shows disjoint models, same-`id` variants stay distinct.
- **Verify:** `cd apps/web && npx vitest run src/utils/models.test.ts`; `bun run verify`; `grep -c "^export function group" apps/web/src/utils/models.ts` (exactly 1).

### ☐ T6.2 Company header and panel rendering

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelCompanyHeader.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`, `apps/web/src/components/Dashboard/ModelPicker/Heading.vue`
- **Do:** New `ModelCompanyHeader.vue` (logo via `getModelLogoUrl(models[0]?.iconUrl)` per `git show f00a3ab^:apps/web/src/components/Dashboard/ModelPicker/ModelCompanyGroup.vue`, fallback `ProviderIcon`). `ModelPickerPanel.vue` renders tier headers sticky at the top and company headers sticky below them with opaque backgrounds in light and dark; unique keys per section; a model in Featured and its group is highlighted in both.
- **Acceptance:** SPEC Part 1 reqs 2, 10, 11: sticky tier then company headers, opaque, truncation with `title`, missing-logo fallback.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker`; `bun run verify`.

### ☐ T6.3 Row layout fix

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue`
- **Do:** Render name and description as separate elements with a gap; remove `NAME_SEPARATOR`; keep one-line `tw-h-11` row, truncation with full text in `title`, ref-image icon tooltip "Up to N reference images" only when `imageInput`, PRO lock for non-Pro, credit cost; accessible name reads "name, description".
- **Acceptance:** SPEC Part 1 reqs 8-9; locked click still opens pricing.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelOption.test.ts`; `grep -rn "NAME_SEPARATOR" apps/web/src` (empty); `bun run verify`.

### ☐ T6.4 Design pass: picker

- **Kind:** implementation
- **Files:** `agent_docs/ui-polish-picker-header/AUDIT.md`
- **Do:** Run the impeccable critique/audit and layout skills on the desktop picker (screenshots 1440 light/dark); log every finding in `AUDIT.md` as a row whose element column starts with `picker design-pass`, with its resolution or reason; apply fixes only inside the picker files from T6.1-T6.3.
- **Acceptance:** SPEC Part 1 req 12: every finding resolved or recorded with a reason (no design-pass row left `open`).
- **Verify:** `grep -c 'picker design-pass' agent_docs/ui-polish-picker-header/AUDIT.md` (non-zero); `grep 'picker design-pass' agent_docs/ui-polish-picker-header/AUDIT.md | grep -c '| open |'` (0); `bun run verify`.

### ☐ T6.5 Unit: grouping and sort

- **Kind:** unit
- **Files:** `apps/web/src/utils/models.ts`
- **Do:** Extend `utils/models.test.ts`: Featured, Free, Pro order; Featured preserves source order; companies alphabetical; company with free+Pro appears in both with disjoint models; sort cost asc then title; undefined `creditCost` sorts as 1; same-`id` variants distinct; empty sections dropped.
- **Acceptance:** SPEC Part 1 unit criteria for grouping; the new helpers at least 90% line coverage (SPEC Testing Strategy), target over 95%, and `models.ts` at least 80% across metrics; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/utils/models.test.ts --coverage --coverage.include=src/utils/models.ts --coverage.reporter=text`

### ☐ T6.6 Unit: picker panel and row

- **Kind:** unit
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelCompanyHeader.vue`
- **Do:** Update `ModelPickerPanel.test.ts` (stale `model-section-*`), `ModelOption.test.ts` (no `NAME_SEPARATOR` text node, separate elements with gap class, lock only non-Pro + premium, ref icon only with `imageInput`); add `ModelCompanyHeader.test.ts`; panel renders company headers with logo+name and header count matches grouping.
- **Acceptance:** SPEC Part 1 unit criteria for panel/row; every file at least 80% across metrics, target over 95%; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelPickerPanel.test.ts src/components/Dashboard/ModelPicker/ModelOption.test.ts src/components/Dashboard/ModelPicker/ModelCompanyHeader.test.ts --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelPickerPanel.vue --coverage.include=src/components/Dashboard/ModelPicker/ModelOption.vue --coverage.include=src/components/Dashboard/ModelPicker/ModelCompanyHeader.vue --coverage.reporter=text`

### ☐ T6.7 E2E: picker sections and company headers

- **Kind:** e2e
- **Scenarios:** `@critical` at 1440 popover shows Featured, Free, Pro in order with company headers; `@high` scrolling keeps the current company header pinned; `@critical` Free user sees lock on Pro rows and on Featured Pro models; `@high` Pro user sees no locks; `@medium` row name and description visually separated.
- **Spec:** `apps/web/e2e/qa/model-menu.spec.ts`
- **Files:** `apps/web/e2e/qa/pro-tier.spec.ts` (drives the model picker)
- **Acceptance:** SPEC Part 1 e2e criteria pass with mocked APIs; stale selectors in `model-menu.spec.ts` and `pro-tier.spec.ts` updated without weakening.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts e2e/qa/pro-tier.spec.ts --repeat-each=3`

### ☐ T6.8 Gate: Phase 6

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence, including the non-QA specs that drive the picker (`create-image.spec.ts`, `create-transforms.spec.ts`) as regression.
- **Acceptance:** Repo green; desktop picker matches design pass; no test weakened.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts e2e/qa/pro-tier.spec.ts e2e/create-image.spec.ts e2e/create-transforms.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`.

🔶 **Checkpoint 6**: grouped desktop picker with company headers and fixed rows.

## Phase 7: Picker search and keyboard navigation

**Adds:** A sticky search box filters models by name, company and description, with a "No models match" state, and arrow keys move through visible options.
**Try in UI:** Open the picker and type "flux" to see only matching rows ; type nonsense to see "No models match" and clear it ; press ArrowDown from the input then Enter to select.

### ☐ T7.1 Search filter helper and component

- **Kind:** implementation
- **Files:** `apps/web/src/utils/models.ts`, `apps/web/src/components/Dashboard/ModelPicker/ModelPickerSearch.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`
- **Do:** Add a pure filter helper in `utils/models.ts` (trimmed, case-insensitive substring over title, company, `bestAt`, `description`; empty sections/companies removed). `ModelPickerSearch.vue` sticky above the headers, clear button; panel removes empty sections from the DOM (not `v-show`), shows "No models match" with echoed query and a clear button, resets the query on close, autofocuses only when `(hover: hover) and (pointer: fine)` matches and width >=768.
- **Acceptance:** SPEC Part 1 req 6 and edge cases (spaces-only is empty, company-name match shows all that company's models in the tier).
- **Verify:** `cd apps/web && npx vitest run src/utils/models.test.ts src/components/Dashboard/ModelPicker`; `bun run verify`.

### ☐ T7.2 Popover opt-in keyboard props

- **Kind:** implementation
- **Files:** `apps/web/src/components/primitives/Popover.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPicker.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`
- **Do:** Add opt-in `Popover` props (for example `navigateOptionsFromInput`, `autofocusSelector`) so ArrowDown from the search input moves to the first visible option, Up/Down skip headers and the clear button, Home/End ignored while the input is focused, active option resets to the first visible after filtering; defaults identical to today. Wire from the picker.
- **Acceptance:** SPEC Part 1 req 7; with props unset all ~9 `Popover` consumers behave identically and their tests pass unmodified.
- **Verify:** `cd apps/web && npx vitest run src/components/primitives src/components/Dashboard`; `bun run verify`; `git diff --stat -- apps/web/src/components/primitives/Popover.test.ts` (no changes).

### ☐ T7.3 Unit: search helper

- **Kind:** unit
- **Files:** `apps/web/src/utils/models.ts`
- **Do:** Extend `utils/models.test.ts`: match on title, company, `bestAt`, `description`, case-insensitive, trimmed and spaces-only query, no-match returns empty, empty sections/companies dropped, company-name-only match.
- **Acceptance:** SPEC Part 1 unit criteria for search; the filter helper at least 90% line coverage, target over 95%, `models.ts` at least 80% across metrics; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/utils/models.test.ts --coverage --coverage.include=src/utils/models.ts --coverage.reporter=text`

### ☐ T7.4 Unit: search panel and Popover

- **Kind:** unit
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPickerSearch.vue`, `apps/web/src/components/primitives/Popover.vue`
- **Do:** Update `ModelPickerPanel.test.ts` (typing filters and removes empty headers, "No models match" with query, clear resets, ArrowDown from input focuses first visible option, Enter selects after filtering, autofocus only when desktop media query matches); add `ModelPickerSearch.test.ts`; put the new opt-in prop cases in a new `Popover.optIn.test.ts` and leave `Popover.test.ts` byte-for-byte unchanged (it is the proof that defaults are unchanged).
- **Acceptance:** SPEC Part 1 unit criteria for panel and Popover; `Popover.test.ts` unmodified and passing; every file at least 80% across metrics, target over 95%; no `it.fails`.
- **Verify:** `git diff --stat -- apps/web/src/components/primitives/Popover.test.ts` (empty); `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelPickerPanel.test.ts src/components/Dashboard/ModelPicker/ModelPickerSearch.test.ts src/components/primitives/Popover.test.ts src/components/primitives/Popover.optIn.test.ts --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelPickerPanel.vue --coverage.include=src/components/Dashboard/ModelPicker/ModelPickerSearch.vue --coverage.include=src/components/primitives/Popover.vue --coverage.reporter=text`

### ☐ T7.5 E2E: search and keyboard

- **Kind:** e2e
- **Scenarios:** `@critical` search "flux" shows only matching rows; `@critical` nonsense query shows "No models match" and clear restores the list; `@high` keyboard ArrowDown then Enter selects at 1440; `@high` query resets after close and reopen; `@medium` company-name query shows all that company's models in the tier.
- **Spec:** `apps/web/e2e/qa/model-menu.spec.ts`
- **Files:** none
- **Acceptance:** SPEC Part 1 e2e criteria for search/keyboard pass with mocked APIs.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts --repeat-each=3`

### ☐ T7.6 Gate: Phase 7

- **Kind:** gate
- **Files:** none
- **Do:** Run the full web unit suite so every other `Popover` consumer (`UpscaleModelPicker`, `PromptAiMenu`, `StylePicker`, etc.) is exercised unmodified.
- **Acceptance:** Repo green; no existing consumer test edited; no test weakened.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts e2e/qa/pro-tier.spec.ts e2e/create-image.spec.ts e2e/create-transforms.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`; `git diff --stat -- apps/web/src/components/primitives/Popover.test.ts apps/web/src/components/Dashboard/ModelPicker/UpscaleModelPicker.test.ts apps/web/src/components/Dashboard/ModelPicker/PromptAiMenu.test.ts apps/web/src/components/Dashboard/Sidebar apps/web/src/components/Dashboard/Composer/ReferenceImageControl.test.ts apps/web/src/components/History` (empty).

🔶 **Checkpoint 7**: search and keyboard work and other Popover consumers are unchanged.

## Phase 8: Bottom sheet below 768

**Adds:** On phones the model picker opens as a full-width bottom sheet with a backdrop, focus trap and scroll lock; tablets and desktops keep the anchored popover.
**Try in UI:** At 390 open the picker and see a bottom sheet ; tap the backdrop or press Escape to close ; at 768 see the anchored popover.

### ☐ T8.1 ModelPickerSheet and breakpoint switch

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelPickerSheet.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPicker.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue`
- **Do:** `ModelPickerSheet.vue`: full-width, backdrop, rounded top, `max-height: 85dvh`, `env(safe-area-inset-bottom)` padding, body scroll lock, focus trap via `composables/useFocusTrap.ts`, focus returns to the trigger, dismiss on backdrop, Escape or select, no drag, no slide animation under reduced motion (`useReducedMotion`). `ModelPicker.vue` chooses `Popover` (>=768) or the sheet (<768) via `useHeaderBreakpoint` and closes when crossing 768. Sticky chrome (search + tier + company) leaves >=4 rows at 360x640. No new dependency.
- **Acceptance:** SPEC Part 1 req 5 and req 10 height budget; same panel component and code path at all widths.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker`; `bun run verify`; `git diff --stat -- apps/web/package.json` (no dependency change).

### ☐ T8.2 Unit: sheet and picker switch

- **Kind:** unit
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelPickerSheet.vue`, `apps/web/src/components/Dashboard/ModelPicker/ModelPicker.vue`
- **Do:** Add `ModelPickerSheet.test.ts` and update `ModelPicker.test.ts`: sheet below 768 and popover at or above, backdrop/Escape/select dismiss, focus returns to the trigger, body scroll locked while open and released on close, closes when the breakpoint is crossed while open, reduced motion disables the animation class.
- **Acceptance:** SPEC Part 1 req 5 unit coverage; every file at least 80% across metrics, target over 95%; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelPickerSheet.test.ts src/components/Dashboard/ModelPicker/ModelPicker.test.ts --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelPickerSheet.vue --coverage.include=src/components/Dashboard/ModelPicker/ModelPicker.vue --coverage.reporter=text`

### ☐ T8.3 E2E: bottom sheet

- **Kind:** e2e
- **Scenarios:** `@critical` at 390 picker opens a sheet with `boundingBox().width === viewport.width`; `@critical` search input not focused on open at 390; `@critical` Escape closes and focus returns to the trigger; `@high` at 360x640 at least 4 option rows visible with sticky chrome; `@high` backdrop tap closes; `@medium` selecting a model closes the sheet; `@medium` at 768 the anchored popover is used.
- **Spec:** `apps/web/e2e/qa/model-menu.spec.ts`
- **Files:** none
- **Acceptance:** SPEC Part 1 e2e criteria for the sheet pass with mocked APIs.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts --repeat-each=3`

### ☐ T8.4 Gate: Phase 8 with picker screenshots

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence; capture picker open and searching screenshots at 360/390/768/1024/1440, light and dark, into `agent_docs/qa/ui-polish-picker-header/` named `picker-<open|search>-<width>-<theme>.png` (supplementary).
- **Acceptance:** Repo green; sheet behaviour proven by QA spec; screenshots exist.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts e2e/qa/pro-tier.spec.ts e2e/create-image.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`; `ls agent_docs/qa/ui-polish-picker-header | grep -c picker`.

🔶 **Checkpoint 8**: picker is a sheet below 768 and a popover above, both with search.

## Phase 9: FAQ visibility in the Upgrade dialog

**Adds:** The "Before you buy." FAQ in the Upgrade to Pro dialog is visible and expandable instead of stuck invisible.
**Try in UI:** Open Upgrade to Pro, scroll the dialog to the bottom and see the FAQ heading and questions ; click a question and see the answer expand ; visit /pricing and the landing page and see their reveal animations still run.

### ☐ T9.1 Reproduce and root-cause

- **Kind:** implementation
- **Files:** `agent_docs/ui-polish-picker-header/AUDIT.md`
- **Do:** Reproduce at 1440 and 390 with `agent-browser` (mocked prices), saving `faq-repro-<width>.png` under `agent_docs/qa/ui-polish-picker-header/`, then record the root cause in an `AUDIT.md` row whose element column is `FAQ`. Lead hypothesis: `v-reveal` in `FaqSection` waits on a window ScrollTrigger while the fullscreen `AppModal` panel is the scroller. Check `PricingLayout` `:deep(.faq)` overrides and `dvh` too.
- **Acceptance:** SPEC Part 4a: bug reproduced with screenshots before any fix; root cause stated.
- **Verify:** `grep -n "FAQ" agent_docs/ui-polish-picker-header/AUDIT.md` (root cause recorded); `ls agent_docs/qa/ui-polish-picker-header | grep -i faq`.

### ☐ T9.2 Fix reveal inside the modal

- **Kind:** implementation
- **Files:** `apps/web/src/directives/reveal.ts`, `apps/web/src/components/Landing/FaqSection.vue`, `apps/web/src/components/Pricing/PricingLayout.vue`, `apps/web/src/components/AppModal.vue`
- **Do:** Fix at the root cause found in T9.1 (for the lead hypothesis: opt-in scroller option for `v-reveal` or disable reveal inside the modal). Keep `/pricing` and landing reveals working; default behaviour unchanged.
- **Acceptance:** SPEC Part 4a: FAQ heading and every question visible in the dialog at opacity 1; `/pricing` and landing animations unaffected.
- **Verify:** `cd apps/web && npx vitest run src/directives src/components/Landing src/components/Pricing`; `bun run verify`.

### ☐ T9.3 Unit: reveal regression

- **Kind:** unit
- **Files:** `apps/web/src/directives/reveal.ts`, `apps/web/src/components/Landing/FaqSection.vue`, `apps/web/src/components/Pricing/PricingLayout.vue`
- **Do:** Add a test that fails against the pre-fix behaviour and passes now (FAQ items inside the modal are not left at `opacity: 0`); keep default-scroller reveal covered; update `PricingLayout.test.ts` if affected.
- **Acceptance:** SPEC Part 4a unit criterion; every file at least 80% across metrics, target over 95%; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/directives src/components/Landing/FaqSection.test.ts src/components/Pricing/PricingLayout.test.ts --coverage --coverage.include=src/directives/reveal.ts --coverage.include=src/components/Landing/FaqSection.vue --coverage.include=src/components/Pricing/PricingLayout.vue --coverage.reporter=text`

### ☐ T9.4 E2E: dialog FAQ

- **Kind:** e2e
- **Scenarios:** `@critical` open the Upgrade dialog (mocked prices), scroll the panel to the bottom, "Before you buy." and every question visible with computed opacity 1 and in viewport; `@high` an answer expands on click; `@high` same at 390; `@medium` `/pricing` page FAQ still reveals; `@medium` landing page `v-reveal` sections reach opacity 1 after scrolling (signed out).
- **Spec:** `apps/web/e2e/qa/pricing-dialog-faq.spec.ts`
- **Files:** `apps/web/e2e/qa/pricing-layout.spec.ts`
- **Acceptance:** SPEC Part 4a e2e criteria pass; `pricing-layout.spec.ts` regression green; no Dodo call (prices mocked).
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pricing-dialog-faq.spec.ts e2e/qa/pricing-layout.spec.ts --repeat-each=3`

### ☐ T9.5 Gate: Phase 9

- **Kind:** gate
- **Files:** none
- **Do:** Run suites; supplementary screenshots at 360/390/768/1440 light and dark.
- **Acceptance:** Repo green; landing and `/pricing` reveals intact.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/pricing-dialog-faq.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/localized-prices.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`.

🔶 **Checkpoint 9**: Upgrade dialog FAQ verified visible at all widths in both themes.

## Phase 10: Landing nav theme toggle

**Adds:** On phones and small tablets the landing page theme toggle sits in the top bar next to the menu button instead of inside the open menu.
**Try in UI:** Open the landing page at 390 and see the theme toggle beside the hamburger with the menu closed ; tap it and see the theme flip ; at 1440 see one toggle in the actions.

### ☐ T10.1 LandingNav toggle placement

- **Kind:** implementation
- **Files:** `apps/web/src/components/Landing/LandingNav.vue`
- **Do:** Below 900px render `ThemeButton` in the bar next to the hamburger; at >=900 only in `.nav__actions`; exactly one visible toggle at any width. Remove `nav__sheet-theme-btn` and its SCSS from the sheet. Tap target >=44px. Update stale assertions.
- **Acceptance:** SPEC Part 4b: one visible toggle per width; no `ThemeButton` in the open sheet; no overflow at 360.
- **Verify:** `cd apps/web && npx vitest run src/components/Landing/LandingNav.test.ts`; `grep -rn "nav__sheet-theme-btn" apps/web/src` (empty); `bun run verify`.

### ☐ T10.2 Unit: LandingNav

- **Kind:** unit
- **Files:** `apps/web/src/components/Landing/LandingNav.vue`
- **Do:** Update `LandingNav.test.ts`: no `ThemeButton` inside the sheet, bar toggle present below 900, actions toggle at or above 900, exactly one visible per width.
- **Acceptance:** SPEC Part 4b unit criterion; at least 80% across metrics, target over 95%; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/components/Landing/LandingNav.test.ts --coverage --coverage.include=src/components/Landing/LandingNav.vue --coverage.reporter=text`

### ☐ T10.3 E2E: landing theme toggle

- **Kind:** e2e
- **Scenarios:** `@critical` at 390 and 800 toggle visible with the menu closed and clicking flips the theme attribute; `@high` tap target >=44px; `@high` no header overflow at 360; `@medium` at 1440 exactly one toggle, in the actions; `@medium` signed-out header ThemeButton elsewhere unchanged.
- **Spec:** `apps/web/e2e/qa/landing-nav-theme.spec.ts`
- **Files:** none
- **Acceptance:** SPEC Part 4b e2e criteria pass on the guest landing page, no API calls needed.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/landing-nav-theme.spec.ts --repeat-each=3`

### ☐ T10.4 Gate: Phase 10

- **Kind:** gate
- **Files:** none
- **Do:** Run suites as evidence.
- **Acceptance:** Repo green; `user-menu-item-theme` and signed-out header `ThemeButton` unchanged.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/landing-nav-theme.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`.

🔶 **Checkpoint 10**: landing theme toggle correct at every width.

## Phase 11: Create page responsiveness audit and fixes

**Adds:** Create page works cleanly from 360 to 1440: no horizontal scroll, no clipped controls, 44px tap targets, composer always visible.
**Try in UI:** Open Create at 360, 390, 700, 768 and 1024 and scroll for horizontal overflow ; open the composer with the on-screen keyboard emulated and see it stay visible ; compare 1440 to the baseline and see only header and picker changes.

### ☐ T11.1 Audit against baseline and record

- **Kind:** implementation
- **Files:** `agent_docs/ui-polish-picker-header/AUDIT.md`, `agent_docs/qa/ui-polish-picker-header/after/` (screenshots only)
- **Do:** Re-capture the Phase 0 matrix into `after/`, compare, and record each finding (width, element, symptom, fix) for header, bottom-pinned composer, aside/options, picker trigger, generated grid, history and dialogs, including the 700px band for the unchanged 640 split. Record a manual keyboard-open check. If the 700px band breaks, stop and ask the owner before touching the 640 split (D8).
- **Acceptance:** SPEC Part 4c: every audited element has a recorded finding or an explicit "no issue"; D8 respected.
- **Verify:** `grep -c '^|' agent_docs/ui-polish-picker-header/AUDIT.md`; `ls agent_docs/qa/ui-polish-picker-header/after | wc -l`.

### ☐ T11.2 Fix audit findings

- **Kind:** implementation
- **Files:** `apps/web/src/pages/Dashboard.vue`, `apps/web/src/components/Dashboard/DashboardShell.vue`, `agent_docs/ui-polish-picker-header/AUDIT.md`
- **Do:** The files depend on what T11.1 finds, so `Dashboard.vue` and `DashboardShell.vue` are only the expected set. Before coding, rewrite this task's **Files** line with the real files from the open `AUDIT.md` rows; if more than 5 are needed, add a `T11.2b` task for the remainder and extend T11.3 accordingly. Fix each open finding and set its status to `fixed` (with the change), `no issue` or `wontfix` (with a reason).
- **Acceptance:** SPEC Part 4c: no horizontal scroll at audited widths, no clipped/overlapping controls, tap targets >=44px, composer fully visible with banner; audit table fully resolved or reasoned.
- **Verify:** `cd apps/web && npx vitest run src/pages src/components/Dashboard`; `bun run verify`; `grep -c '| open |' agent_docs/ui-polish-picker-header/AUDIT.md` (0).

### ☐ T11.3 Unit: logic-changing fixes

- **Kind:** unit
- **Files:** `apps/web/src/pages/Dashboard.vue`, `apps/web/src/components/Dashboard/DashboardShell.vue`
- **Do:** Add or update tests only for the T11.2 fixes that change logic (classes/conditions); if a fix is CSS-only, assert its class/attribute contract.
- **Acceptance:** Each logic-changing fix has a test; every file at least 80% across metrics; no `it.fails`.
- **Verify:** `cd apps/web && npx vitest run src/pages/Dashboard.test.ts src/components/Dashboard/DashboardShell.test.ts --coverage --coverage.include=src/pages/Dashboard.vue --coverage.include=src/components/Dashboard/DashboardShell.vue --coverage.reporter=text`

### ☐ T11.4 E2E: Create responsiveness

- **Kind:** e2e
- **Scenarios:** `@critical` no horizontal scroll at 360, 390, 700, 768, 1024, 1440; `@critical` composer bottom within the viewport with the banner showing at 360/390; `@high` interactive controls >=44px tall on mobile; `@high` one assertion per fixed audit finding (feature dropdown, tab placement, picker trigger, 700px band); `@medium` screenshots via `snap` at each width.
- **Spec:** `apps/web/e2e/qa/create-responsive.spec.ts`
- **Files:** none
- **Acceptance:** SPEC Part 4c e2e criteria pass with mocked generation and credits; `paidCallGuard` clean.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/create-responsive.spec.ts --repeat-each=3`

### ☐ T11.5 Gate: Phase 11

- **Kind:** gate
- **Files:** none
- **Do:** Run suites; side-by-side review of 1440 baseline vs `after/` recorded in `AUDIT.md`.
- **Acceptance:** At 1440 the only diffs from baseline are the intended header and picker changes; repo green.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/create-responsive.spec.ts e2e/qa/header-responsive.spec.ts --repeat-each=2`; `bun run verify`; `bun run test`.

🔶 **Checkpoint 11**: audit table resolved and Create is responsive at every audited width.

## Phase 12: Analytics research doc

**Adds:** A research document (no code) on per-user analytics options with a single recommendation and effort estimate.
**Try in UI:** No UI ; open `agent_docs/ui-polish-picker-header/ANALYTICS.md` and confirm the four questions are answered with links ; run `git status --short apps packages | diff /tmp/ui-polish-p12-before.txt -` and confirm this phase touched no code.

### ☐ T12.1 Write ANALYTICS.md

- **Kind:** dod
- **Files:** `agent_docs/ui-polish-picker-header/ANALYTICS.md`
- **Do:** First snapshot the tree (it already carries uncommitted `apps/`/`packages/` edits from earlier work): `git status --short apps packages > /tmp/ui-polish-p12-before.txt`. Then answer SPEC Part 5 questions with linked official sources: (1) whether Simple Analytics can do per-user custom analytics (images per user per date, cost per user); (2) comparison of PostHog free tier, Umami, Plausible and others on per-user identity, custom events with properties, cost, privacy/consent, self-host burden, query/export; (3) first-party Mongo usage ledger plus admin page (fields, indexes, idempotency per prediction, refund/failure handling, note that `apps/api/src/models/image.ts` has no credits or cost so history cannot be backfilled accurately); (4) one recommendation and rough effort. Research via docs fetch only; no paid or outbound product calls.
- **Acceptance:** SPEC Part 5: doc exists, each question answered with linked sources, recommendation explicit, no code or API changes.
- **Verify:** `grep -c "http" agent_docs/ui-polish-picker-header/ANALYTICS.md` (links present); `grep -n -i "recommend" agent_docs/ui-polish-picker-header/ANALYTICS.md`.

### ☐ T12.2 DoD: analytics diff clean

- **Kind:** dod
- **Files:** none
- **Do:** Confirm this phase changed only the doc.
- **Acceptance:** Diff for `ANALYTICS.md` only; no code, schema or API changes from this phase.
- **Verify:** `git status --short apps packages | diff /tmp/ui-polish-p12-before.txt -` (no output); `ls agent_docs/ui-polish-picker-header/ANALYTICS.md`.

🔶 **Checkpoint 12**: analytics research delivered with a recommendation.

## Phase 13: Final gate and walkthrough

**Adds:** Final proof that header, picker, plan pill and fixes work together with zero real paid calls, plus final screenshots.
**Try in UI:** Run `cd apps/web && bunx playwright test e2e/qa/paid-call-guard.spec.ts` and confirm green ; walk Create, Explore and Assets at 360/390/768/1024/1440 as Free and Pro ; open the picker, plan pill, Upgrade dialog FAQ and landing nav.

### ☐ T13.1 Final stale-test and grep sweep

- **Kind:** gate
- **Files:** none
- **Do:** Sweep every file named in SPEC Testing Strategy (unit and e2e) for stale assertions; grep that none of `smAndUp`, `100vh-60px`, `dashboard-mobile-tabs`, `pro-badge-header`, `upgrade-pill`, `NAME_SEPARATOR`, `nav__sheet-theme-btn` remain in `apps/web/src` or `apps/web/e2e`, and that `600px` is gone from `AppHeader.vue` and `ReferralOffer.vue` (`Logo.vue` and `ImageDialog.vue` are out of scope; Logo's outcome is in AUDIT.md).
- **Acceptance:** SPEC Testing Strategy: no stale test left; all greps empty; no test weakened.
- **Verify:** `grep -rnE "smAndUp|100vh-60px|dashboard-mobile-tabs|pro-badge-header|upgrade-pill|NAME_SEPARATOR|nav__sheet-theme-btn" apps/web/src apps/web/e2e` (empty); `grep -n "600px" apps/web/src/components/Header/AppHeader.vue apps/web/src/components/Header/ReferralOffer.vue` (empty); `bun run verify`; `bun run test`.

### ☐ T13.2 Gate: full e2e in both server modes

- **Kind:** gate
- **Files:** none
- **Do:** Run all new and updated QA specs, then the full suite in dev and prod-preview modes.
- **Acceptance:** `paid-call-guard.spec.ts` green with zero un-intercepted paid calls; all new and changed specs green; no test weakened.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/plan-pill.spec.ts e2e/qa/model-menu.spec.ts e2e/qa/pricing-dialog-faq.spec.ts e2e/qa/landing-nav-theme.spec.ts e2e/qa/create-responsive.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/mods-referral-favicon.spec.ts e2e/qa/localized-prices.spec.ts e2e/qa/paid-call-guard.spec.ts --repeat-each=2`; `cd apps/web && bun run test:e2e`; `cd apps/web && E2E_SERVER=prod bun run test:e2e`.

### ☐ T13.3 Walkthrough: all spec parts

- **Kind:** walkthrough
- **Files:** `agent_docs/qa/ui-polish-picker-header/` (screenshots only)
- **Do:** Walk SPEC Parts 1 to 4 as Free and Pro using the seeded QA specs as evidence; capture final screenshots at 360/390/768/1024/1440, light and dark, for Create/Explore/Assets, picker open and searching, open avatar menu, Upgrade dialog FAQ and landing nav; `agent-browser` (session `visual-ai`, ended with `agent-browser close`) is for layout polish only, never sole evidence. Resolve or record impeccable/layout findings.
- **Acceptance:** Every SPEC part verifiable in the browser through its QA spec; screenshots reviewed against baseline; no horizontal scroll at any audited width.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/model-menu.spec.ts e2e/qa/plan-pill.spec.ts e2e/qa/pricing-dialog-faq.spec.ts e2e/qa/landing-nav-theme.spec.ts e2e/qa/create-responsive.spec.ts --repeat-each=2`; `bun run test`; `bun run verify`.

### ☐ T13.4 Definition of done

- **Kind:** dod
- **Files:** none
- **Do:** Run every suite and map evidence to each SPEC success criterion; confirm `ANALYTICS.md` exists and no analytics code was added; list manual owner items (keyboard-open check, final icon choice for Earn/Upgrade, nothing committed).
- **Acceptance:** All SPEC per-part and summary success criteria met; `bun run verify`, `bun run test` and e2e green in both server modes; zero real paid calls; owner reviews remaining manual items.
- **Verify:** `cd apps/web && bun run test`; `bun run verify`; `cd apps/web && bun run test:e2e`; `cd apps/web && E2E_SERVER=prod bun run test:e2e`; `ls agent_docs/ui-polish-picker-header/ANALYTICS.md`.

🔶 **Checkpoint 13**: all SPEC parts verified; no real paid calls; owner review.
