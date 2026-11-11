window.DASHBOARD = {
 "generatedAt": "2026-11-11T13:53:51.373Z",
 "maxAttempts": 5,
 "feature": {
  "slug": "ui-polish-picker-header",
  "title": "UI Polish, Model Picker and Header"
 },
 "tasksFile": "agent_docs/ui-polish-picker-header/TASKS.md",
 "projectRoot": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai",
 "docs": [
  {
   "name": "PLAN",
   "href": "docs/PLAN.html",
   "source": "agent_docs/ui-polish-picker-header/PLAN.md"
  },
  {
   "name": "SPEC",
   "href": "docs/SPEC.html",
   "source": "agent_docs/ui-polish-picker-header/SPEC.md"
  },
  {
   "name": "TASKS",
   "href": "docs/TASKS.html",
   "source": "agent_docs/ui-polish-picker-header/TASKS.md"
  }
 ],
 "totals": {
  "phases": 14,
  "tasks": 61,
  "byStatus": {
   "ready": 61
  }
 },
 "phases": [
  {
   "id": "0",
   "name": "Baseline screenshots and audit table",
   "startLine": 9,
   "endLine": 31,
   "adds": "No product change. Captures baseline screenshots of today's UI and seeds the responsiveness audit table that later phases compare against.",
   "tryInUi": [
    "No UI change",
    "run `ls agent_docs/qa/ui-polish-picker-header/baseline | wc -l` and confirm the set is present",
    "open `agent_docs/ui-polish-picker-header/AUDIT.md` and confirm a row per known finding."
   ],
   "checkpoint": {
    "title": "Checkpoint 0",
    "line": 30,
    "items": [
     "baseline set complete and audit table seeded; no code touched."
    ]
   },
   "tasks": [
    {
     "id": "T0.1",
     "title": "Capture baseline screenshots",
     "done": false,
     "kind": "dod",
     "depends": [],
     "files": [
      "agent_docs/qa/ui-polish-picker-header/baseline/ (screenshots only)"
     ],
     "gherkin": null,
     "do": "With `agent-browser` (session `visual-ai`) capture Create (banner showing on mobile), Explore, Assets, the model picker open, and the Upgrade dialog (Free only) at 360, 390, 700, 768, 1024, 1440, light and dark, Free and Pro. Sign in as the seeded e2e QA user; for Pro, activate it with `activateProViaWebhook` from `apps/web/e2e/support/proWebhook.ts` (signed local test webhook, no Dodo call) and restore it afterwards with `resetToFree` from `apps/web/e2e/support/subscriptionState.ts`. Name files `<route>-<width>-<theme>-<plan>.png`. End with `agent-browser close`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4c baseline requirement met: every route/width/theme/plan combination above has a screenshot; the QA user is back on Free; none overwritten later."
     ],
     "verify": [
      "`for w in 360 390 700 768 1024 1440; do echo \"$w $(ls agent_docs/qa/ui-polish-picker-header/baseline | grep -c -- \"-$w-\")\"; done` (every width non-zero)",
      "ls agent_docs/qa/ui-polish-picker-header/baseline | grep -c -- '-dark-'",
      "`ls agent_docs/qa/ui-polish-picker-header/baseline | grep -c -- '-pro'`."
     ],
     "line": 14,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T0.2",
     "title": "Seed audit table",
     "done": false,
     "kind": "dod",
     "depends": [],
     "files": [
      "agent_docs/ui-polish-picker-header/AUDIT.md"
     ],
     "gherkin": null,
     "do": "Create the audit table (columns: width, element, symptom, fix, status) with one row per SPEC Part 4c known finding: feature dropdown vanishes at mobile/tablet, tabs left-shifted, feature name truncated (\"AI I...\"), picker row text fusion, no tabs at 640-767, `DashboardShell` 60px vs 64px header mismatch. Add rows for the \"700px band for the unchanged 640 split\", the \"keyboard open\" check, and \"`Header/Logo.vue` still switches size at 600px\" (out of the 768/1024 consolidation; decide in P11). The status column uses exactly one of the tokens `open`, `fixed`, `no issue`, `wontfix`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Table exists with an entry per known finding; each has status `open` and the baseline screenshot name as evidence."
     ],
     "verify": [
      "`grep -c '| open |' agent_docs/ui-polish-picker-header/AUDIT.md` (at least 9)."
     ],
     "line": 22,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 2,
   "complete": false
  },
  {
   "id": "1",
   "name": "Shared breakpoint constants and composable",
   "startLine": 32,
   "endLine": 71,
   "adds": "One source of truth for the 768/1024 breakpoints. The referral banner and the header Earn pill now switch at 768 together instead of 600.",
   "tryInUi": [
    "Open Create at 700px wide and see the referral banner",
    "widen to 768px and see the banner gone and the Earn pill in the header",
    "run `grep -n \"smAndUp\\|600px\" apps/web/src/components/Header/AppHeader.vue apps/web/src/components/Header/ReferralOffer.vue` and confirm nothing remains."
   ],
   "checkpoint": {
    "title": "Checkpoint 1",
    "line": 70,
    "items": [
     "breakpoints centralised at 768/1024 and the banner/Earn gate agree."
    ]
   },
   "tasks": [
    {
     "id": "T1.1",
     "title": "layout.ts and useHeaderBreakpoint",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/layout.ts",
      "apps/web/src/composables/useHeaderBreakpoint.ts",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/ReferralOffer.vue",
      "apps/web/src/pages/Dashboard.vue"
     ],
     "gherkin": null,
     "do": "Create `layout.ts` with `BREAKPOINT = { MOBILE_MAX: 768, DESKTOP_MIN: 1024 }` and `CREATE_LAYOUT_SM = 640` (D8, named only). Create `useHeaderBreakpoint()` over `useMediaQuery` returning `{ isMobile, isTablet, isDesktop }`. Replace `smAndUp` (600px) in `AppHeader.vue` and `(max-width: 600px)` in `ReferralOffer.vue` with it; use `CREATE_LAYOUT_SM` for the 640 in `Dashboard.vue` without changing behaviour. Update existing assertions that encode 600.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 breakpoint requirement: banner shows below 768 and Earn pill hides below 768 together; 640 split unchanged (D8); no `600px`/`smAndUp` left in `AppHeader.vue` or `ReferralOffer.vue` (`Logo.vue` and `ImageDialog.vue` keep theirs; see AUDIT.md)."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header src/pages/Dashboard.test.ts",
      "`grep -rn \"smAndUp\" apps/web/src` (empty)",
      "`grep -n \"600px\" apps/web/src/components/Header/AppHeader.vue apps/web/src/components/Header/ReferralOffer.vue` (empty)",
      "`bun run verify`."
     ],
     "line": 37,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T1.2",
     "title": "Unit: breakpoint composable and banner gate",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/composables/useHeaderBreakpoint.ts",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/ReferralOffer.vue"
     ],
     "gherkin": null,
     "do": "Add `useHeaderBreakpoint.test.ts` covering mobile/tablet/desktop at 767, 768, 1023, 1024 (mock `matchMedia`); extend `AppHeader.test.ts` and `ReferralOffer.test.ts` for banner present and Earn absent below 768, inverse at 768.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 unit criteria for banner/Earn gating; every file at least 80% lines/branches/functions/statements, target over 95%; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/composables/useHeaderBreakpoint.test.ts src/components/Header/AppHeader.test.ts src/components/Header/ReferralOffer.test.ts --coverage --coverage.include=src/composables/useHeaderBreakpoint.ts --coverage.include=src/components/Header/ReferralOffer.vue --coverage.include=src/components/Header/AppHeader.vue --coverage.reporter=text"
     ],
     "line": 45,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T1.3",
     "title": "E2E: banner and Earn breakpoint",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/mods-referral-favicon.spec.ts (asserts referral-offer-mobile/referral-offer-desktop",
      "whose split moves from 600 to 768)"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/header-responsive.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios derived from SPEC Part 2 banner criteria pass with mocked user/credits; `mods-referral-favicon.spec.ts` updated to the 768 split without weakening; `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/mods-referral-favicon.spec.ts --repeat-each=3"
     ],
     "line": 53,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T1.4",
     "title": "Gate: Phase 1",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run lint, typecheck, unit and the new and updated QA specs as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Repo green; no remaining `smAndUp` or `600px` in `AppHeader.vue`/`ReferralOffer.vue`; no test weakened."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/mods-referral-favicon.spec.ts --repeat-each=2",
      "bun run verify",
      "bun run test",
      "`grep -rn \"smAndUp\" apps/web/src` (empty)",
      "`grep -n \"600px\" apps/web/src/components/Header/AppHeader.vue apps/web/src/components/Header/ReferralOffer.vue` (empty)."
     ],
     "line": 62,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false
  },
  {
   "id": "2",
   "name": "Upgrade out of CreditsChip, new right cluster",
   "startLine": 72,
   "endLine": 111,
   "adds": "Header right cluster reads Earn, Upgrade, credits, avatar. Below 1024 Earn and Upgrade become icon-only buttons with tooltips and new icons; the Upgrade button no longer lives inside the credits chip.",
   "tryInUi": [
    "At 1440 see \"Earn credits\" and \"Upgrade to Pro\" labels left of credits",
    "at 900 see icon-only buttons and hover for tooltips",
    "at 390 see only the Upgrade icon, with Earn in the top banner."
   ],
   "checkpoint": {
    "title": "Checkpoint 2",
    "line": 110,
    "items": [
     "right cluster order and responsive actions correct for Free and Pro."
    ]
   },
   "tasks": [
    {
     "id": "T2.1",
     "title": "HeaderActions and new icons",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/HeaderActions.vue",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/CreditsChip.vue",
      "apps/web/src/plugins/icons.ts",
      "apps/web/src/components/Header/ReferralOffer.vue"
     ],
     "gherkin": null,
     "do": "New `HeaderActions.vue` renders Earn, Upgrade (Free only), `CreditsChip`, avatar in that DOM order; Earn hidden below 768. Icon-only with `aria-label` and `Tooltip` (focus and hover) at 768-1023, labels at >=1024, Upgrade icon button below 768; tap targets >=44px. `CreditsChip.vue` stops rendering `upgrade-pill` and its `sm:` label rule; `pro-badge-header` stays until P3. Register new FA icons (proposal `faUserPlus` Earn, `faGem` Upgrade; must differ from `faGift`/`faCrown`) in `plugins/icons.ts`. `AppHeader.vue` uses `HeaderActions`; `header-end-skeleton` matches each breakpoint. Update existing assertions on `upgrade-pill`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 order, icon-only tooltip and aria-label, Free-only Upgrade, >=44px targets, new icons differ from `faGift`/`faCrown` (D7); skeleton matches layout."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header",
      "bun run verify",
      "`grep -rn \"upgrade-pill\" apps/web/src/components/Header/CreditsChip.vue` (empty)."
     ],
     "line": 77,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T2.2",
     "title": "Unit: header actions and credits chip",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/HeaderActions.vue",
      "apps/web/src/components/Header/CreditsChip.vue",
      "apps/web/src/components/Header/AppHeader.vue"
     ],
     "gherkin": null,
     "do": "Add `HeaderActions.test.ts`; update `CreditsChip.test.ts` (no Upgrade) and `AppHeader.test.ts`: DOM order Earn, Upgrade, credits, avatar; Free vs Pro (Pro has no Upgrade); icon-only buttons have `aria-label` and tooltip; Earn absent below 768; skeleton renders.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 unit criteria; every file at least 80% across all metrics, target over 95%; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header/HeaderActions.test.ts src/components/Header/CreditsChip.test.ts src/components/Header/AppHeader.test.ts --coverage --coverage.include=src/components/Header/HeaderActions.vue --coverage.include=src/components/Header/CreditsChip.vue --coverage.include=src/components/Header/AppHeader.vue --coverage.reporter=text"
     ],
     "line": 85,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T2.3",
     "title": "E2E: right cluster order and icon-only",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/upgrade-entry.spec.ts",
      "apps/web/e2e/qa/pricing-layout.spec.ts (both select upgrade-pill)"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/header-responsive.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Scenarios from SPEC Part 2 criteria pass; stale `upgrade-pill` selectors in both existing specs updated without weakening; `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pricing-layout.spec.ts --repeat-each=3"
     ],
     "line": 93,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T2.4",
     "title": "Gate: Phase 2",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence (`localized-prices.spec.ts` as a regression check, since it opens Buy Credits from `credits-chip`); `agent-browser` screenshot at 1440/768/390 as supplementary.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Free and Pro render correctly at 1440, 768, 390; repo green."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/localized-prices.spec.ts --repeat-each=2",
      "bun run verify",
      "`bun run test`."
     ],
     "line": 102,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false
  },
  {
   "id": "3",
   "name": "Plan pill in avatar menu and Pro perks dialog",
   "startLine": 112,
   "endLine": 159,
   "adds": "The PRO chip leaves the header. The avatar menu shows a gold PRO or muted FREE pill; FREE opens the upgrade dialog and PRO opens a new Pro perks dialog.",
   "tryInUi": [
    "As a Pro user open the avatar menu and click PRO to see the perks dialog",
    "as a Free user click FREE to see the Upgrade dialog",
    "confirm no PRO chip beside credits."
   ],
   "checkpoint": {
    "title": "Checkpoint 3",
    "line": 158,
    "items": [
     "plan indicator lives in the avatar menu for Free and Pro."
    ]
   },
   "tasks": [
    {
     "id": "T3.1",
     "title": "Shared PRO_PERKS and ProPerksDialog",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/proPerks.ts",
      "apps/web/src/components/Pricing/PricingProCard.vue",
      "apps/web/src/components/Dialogs/ProPerksDialog.vue",
      "apps/web/src/stores/dialog.ts"
     ],
     "gherkin": null,
     "do": "Move `PRO_PERKS` out of `PricingProCard.vue` into `utils/proPerks.ts` (no copy change). New `ProPerksDialog.vue` on `AppModal` renders every perk, no purchase button. Add `showProPerks`/close state to `stores/dialog.ts`. Update existing tests broken by the move.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 3 D1: one `PRO_PERKS` source used by card and dialog; no new perk copy; dialog has no buy CTA."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Pricing src/stores/dialog.test.ts",
      "bun run verify",
      "`grep -rn \"PRO_PERKS =\" apps/web/src` (one hit)."
     ],
     "line": 117,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.2",
     "title": "UserMenu pill and chip removal",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/UserMenu.vue",
      "apps/web/src/components/Header/CreditsChip.vue"
     ],
     "gherkin": null,
     "do": "In `UserMenu.vue` replace `pro-badge` with a `button` pill (PRO `tw-bg-gold/15 tw-text-gold`, FREE muted), rendered only when `userStore.isReady`; FREE calls `dialogStore.showPricing()`, PRO calls `showProPerks`; menu closes on click; long names truncate without hiding the pill. Mount `<ProPerksDialog />` at the template root of `UserMenu.vue` next to the existing `<PricingDialog />` (the only `PricingDialog` mount in the app, beside `ReferralDialog` and `ReferralCopyDialog`). Remove `pro-badge-header` from `CreditsChip.vue`. `Profile/UserDetails.vue` untouched.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 3: no PRO chip in header; pill by plan, nothing before ready; correct dialog opens; `profile-pro-status` unchanged; pill flips reactively after subscribe."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header src/components/Dialogs",
      "bun run verify",
      "`grep -rn \"pro-badge-header\" apps/web/src --include=*.vue` (empty)."
     ],
     "line": 125,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.3",
     "title": "Unit: plan pill and perks dialog",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/UserMenu.vue",
      "apps/web/src/components/Dialogs/ProPerksDialog.vue",
      "apps/web/src/components/Pricing/PricingProCard.vue",
      "apps/web/src/stores/dialog.ts"
     ],
     "gherkin": null,
     "do": "Update `UserMenu.test.ts` (stale `pro-badge`): PRO/FREE by `isPro`, nothing before `isReady`, pill flips from FREE to PRO when `isPro` becomes true without remount, a long name truncates while the pill stays rendered, click handlers call the right dialog and close the menu, `ProPerksDialog` is mounted. Add `ProPerksDialog.test.ts` (every `PRO_PERKS` item, no purchase button). Update `PricingProCard` test (same perks), `CreditsChip.test.ts` (no chip) and `dialog.test.ts` (`showProPerks` open/close).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 3 unit criteria; every file at least 80% across metrics, target over 95%; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header/UserMenu.test.ts src/components/Dialogs/ProPerksDialog.test.ts src/components/Pricing/PricingProCard.test.ts src/components/Header/CreditsChip.test.ts src/stores/dialog.test.ts --coverage --coverage.include=src/components/Header/UserMenu.vue --coverage.include=src/components/Dialogs/ProPerksDialog.vue --coverage.include=src/components/Pricing/PricingProCard.vue --coverage.include=src/stores/dialog.ts --coverage.reporter=text"
     ],
     "line": 133,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.4",
     "title": "E2E: plan pill",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/plan-status.spec.ts",
      "apps/web/e2e/qa/pro-tier.spec.ts",
      "apps/web/e2e/qa/upgrade-entry.spec.ts (all select pro-badge",
      "upgrade-entry also pro-badge-header)"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/plan-pill.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 3 e2e criteria pass; stale `pro-badge`/`pro-badge-header` selectors in the three existing specs updated without weakening; mocked APIs only."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/plan-pill.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/upgrade-entry.spec.ts --repeat-each=3"
     ],
     "line": 141,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.5",
     "title": "Gate: Phase 3",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "No Pro indicator regression; repo green; no test weakened."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/plan-pill.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/upgrade-entry.spec.ts --repeat-each=2",
      "bun run verify",
      "bun run test",
      "`grep -rn \"pro-badge-header\" apps/web/src apps/web/e2e` (empty)."
     ],
     "line": 150,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 5,
   "complete": false
  },
  {
   "id": "4",
   "name": "Tabs into the header",
   "startLine": 160,
   "endLine": 199,
   "adds": "Create, Explore and Assets tabs are always visible: centered on tablet and desktop, and a full-width second row on mobile that stays at the top while scrolling. The feature dropdown shows at every width on Create.",
   "tryInUi": [
    "At 390 see two header rows and equal-thirds tabs",
    "scroll Explore and see tabs stay at the top",
    "at 768 see the feature name untruncated and tabs centered."
   ],
   "checkpoint": {
    "title": "Checkpoint 4",
    "line": 198,
    "items": [
     "header layout complete at every width."
    ]
   },
   "tasks": [
    {
     "id": "T4.1",
     "title": "Header tabs, segmented variant, FeatureSelect",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/NavTabs.vue",
      "apps/web/src/components/Header/FeatureSelect.vue",
      "apps/web/src/pages/Dashboard.vue"
     ],
     "gherkin": null,
     "do": "Render tabs in `AppHeader` using `useHeaderBreakpoint`: centered at >=768; below 768 a row-2 full-width equal-thirds segmented control (`NavTabs` segmented variant), sticky at the viewport top. Remove `dashboard-mobile-tabs` from `Dashboard.vue`. `FeatureSelect` renders at all widths on Create: icon + full title at 768-1023, compact below 768 (icon and chevron never hidden, title ellipsizes). Tabs skeleton matches. Update stale `dashboard-mobile-tabs` assertions.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2: tabs at every width including 640-767; centered at 768+; sticky row 2 below 768; feature select on Create at all widths; `dashboard-mobile-tabs` gone."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header src/pages/Dashboard.test.ts",
      "bun run verify",
      "`grep -rn \"dashboard-mobile-tabs\" apps/web/src --include=*.vue` (empty)."
     ],
     "line": 165,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.2",
     "title": "Unit: tabs and feature select",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/NavTabs.vue",
      "apps/web/src/components/Header/FeatureSelect.vue",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/pages/Dashboard.vue"
     ],
     "gherkin": null,
     "do": "Update `NavTabs.test.ts`, `FeatureSelect.test.ts`, `AppHeader.test.ts`, `Dashboard.test.ts`: segmented variant below 768, centered at 768+, `dashboard-mobile-tabs` absent, feature select on Create at all widths and absent on Explore/Assets, tabs skeleton.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 unit criteria; every file at least 80% across metrics, target over 95%; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Header/NavTabs.test.ts src/components/Header/FeatureSelect.test.ts src/components/Header/AppHeader.test.ts src/pages/Dashboard.test.ts --coverage --coverage.include=src/components/Header/NavTabs.vue --coverage.include=src/components/Header/FeatureSelect.vue --coverage.include=src/components/Header/AppHeader.vue --coverage.include=src/pages/Dashboard.vue --coverage.reporter=text"
     ],
     "line": 173,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.3",
     "title": "E2E: tabs and feature select across widths",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/header-responsive.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 e2e criteria pass with mocked user/credits; `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts --repeat-each=3"
     ],
     "line": 181,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.4",
     "title": "Gate: Phase 4",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Tabs visible at every width 360-1440; repo green."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts --repeat-each=2",
      "bun run verify",
      "`bun run test`."
     ],
     "line": 190,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false
  },
  {
   "id": "5",
   "name": "Header height from a single source",
   "startLine": 200,
   "endLine": 239,
   "adds": "The dashboard height follows the real header (including the two-row mobile header and banner) using dynamic viewport units, so the composer is never pushed off-screen.",
   "tryInUi": [
    "At 390 with the banner showing open Create and see the composer fully visible at the bottom",
    "at 1440 confirm no extra scroll",
    "run `grep -rn \"100vh-60px\" apps/web/src` and confirm nothing remains."
   ],
   "checkpoint": {
    "title": "Checkpoint 5",
    "line": 238,
    "items": [
     "header height has one source and the composer is always reachable."
    ]
   },
   "tasks": [
    {
     "id": "T5.1",
     "title": "Header height variable and dvh shell",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/layout.ts",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Dashboard/DashboardShell.vue",
      "apps/web/src/pages/Dashboard.vue"
     ],
     "gherkin": null,
     "do": "Define `--app-header-h` (and the mobile row heights) once from `layout.ts` constants; replace `calc(100vh-60px)` in `DashboardShell.vue` and the two `Dashboard.vue` uses with `dvh` plus the variable; reconcile 60 vs 64px and the banner/two-row mobile case. Prove by e2e, not arithmetic.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 height requirement: one source, `dvh`, composer never off-screen with banner; `100vh-60px` gone."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard src/pages/Dashboard.test.ts",
      "bun run verify",
      "`grep -rn \"100vh-60px\" apps/web/src` (empty)."
     ],
     "line": 205,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T5.2",
     "title": "Unit: shell height",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/utils/layout.ts",
      "apps/web/src/components/Dashboard/DashboardShell.vue",
      "apps/web/src/pages/Dashboard.vue"
     ],
     "gherkin": null,
     "do": "Update `Dashboard.test.ts` and the existing `DashboardShell.test.ts`, asserting the height classes/styles use the shared variable and `dvh` and that `layout.ts` constants are the values consumed.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 unit criteria for height; every file at least 80% across metrics; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/DashboardShell.test.ts src/pages/Dashboard.test.ts --coverage --coverage.include=src/components/Dashboard/DashboardShell.vue --coverage.include=src/utils/layout.ts --coverage.include=src/pages/Dashboard.vue --coverage.reporter=text"
     ],
     "line": 213,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T5.3",
     "title": "E2E: composer stays on screen",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/header-responsive.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 2 e2e composer criterion passes; mocked generation endpoints only."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts --repeat-each=3"
     ],
     "line": 221,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T5.4",
     "title": "Gate: Phase 5",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites and greps as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Repo green; `100vh-60px` absent."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts --repeat-each=2",
      "bun run verify",
      "bun run test",
      "`grep -rn \"100vh-60px\" apps/web/src`."
     ],
     "line": 230,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false
  },
  {
   "id": "6",
   "name": "Picker grouping, company headers, row fix",
   "startLine": 240,
   "endLine": 311,
   "adds": "The model picker is grouped by Featured, Free and Pro, with company sub-headers (logo and name) inside Free and Pro, sorted by cost then name. Model rows no longer fuse name and description.",
   "tryInUi": [
    "Open the picker and see Featured, Free, Pro with company headers",
    "scroll and see the current company header stay pinned",
    "see \"Flux Fast\" separated from its description."
   ],
   "checkpoint": {
    "title": "Checkpoint 6",
    "line": 310,
    "items": [
     "grouped desktop picker with company headers and fixed rows."
    ]
   },
   "tasks": [
    {
     "id": "T6.1",
     "title": "Tier and company grouping helpers",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/models.ts"
     ],
     "gherkin": null,
     "do": "Rewrite `groupModelsByCompany` in place (keep the name; it has no callers today) to return tier+company grouping: add `PICKER_SECTION`, pure `sortByCostThenName`, Featured in source order, Free/Pro from `PREMIUM_MODEL_KEYS`, companies alphabetical by `companyName ?? provider`, identity `id`+`title`, `creditCost ?? 1`. No parallel helper.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 reqs 1-4, the identity part of req 11, and assumptions 6-8: sections in order, company in both tiers shows disjoint models, same-`id` variants stay distinct."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/utils/models.test.ts",
      "bun run verify",
      "`grep -c \"^export function group\" apps/web/src/utils/models.ts` (exactly 1)."
     ],
     "line": 245,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T6.2",
     "title": "Company header and panel rendering",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelCompanyHeader.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue",
      "apps/web/src/components/Dashboard/ModelPicker/Heading.vue"
     ],
     "gherkin": null,
     "do": "New `ModelCompanyHeader.vue` (logo via `getModelLogoUrl(models[0]?.iconUrl)` per `git show f00a3ab^:apps/web/src/components/Dashboard/ModelPicker/ModelCompanyGroup.vue`, fallback `ProviderIcon`). `ModelPickerPanel.vue` renders tier headers sticky at the top and company headers sticky below them with opaque backgrounds in light and dark; unique keys per section; a model in Featured and its group is highlighted in both.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 reqs 2, 10, 11: sticky tier then company headers, opaque, truncation with `title`, missing-logo fallback."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker",
      "`bun run verify`."
     ],
     "line": 253,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T6.3",
     "title": "Row layout fix",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue"
     ],
     "gherkin": null,
     "do": "Render name and description as separate elements with a gap; remove `NAME_SEPARATOR`; keep one-line `tw-h-11` row, truncation with full text in `title`, ref-image icon tooltip \"Up to N reference images\" only when `imageInput`, PRO lock for non-Pro, credit cost; accessible name reads \"name, description\".",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 reqs 8-9; locked click still opens pricing."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelOption.test.ts",
      "`grep -rn \"NAME_SEPARATOR\" apps/web/src` (empty)",
      "`bun run verify`."
     ],
     "line": 261,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T6.4",
     "title": "Design pass: picker",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "agent_docs/ui-polish-picker-header/AUDIT.md"
     ],
     "gherkin": null,
     "do": "Run the impeccable critique/audit and layout skills on the desktop picker (screenshots 1440 light/dark); log every finding in `AUDIT.md` as a row whose element column starts with `picker design-pass`, with its resolution or reason; apply fixes only inside the picker files from T6.1-T6.3.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 req 12: every finding resolved or recorded with a reason (no design-pass row left `open`)."
     ],
     "verify": [
      "`grep -c 'picker design-pass' agent_docs/ui-polish-picker-header/AUDIT.md` (non-zero)",
      "`grep 'picker design-pass' agent_docs/ui-polish-picker-header/AUDIT.md | grep -c '| open |'` (0)",
      "`bun run verify`."
     ],
     "line": 269,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T6.5",
     "title": "Unit: grouping and sort",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/utils/models.ts"
     ],
     "gherkin": null,
     "do": "Extend `utils/models.test.ts`: Featured, Free, Pro order; Featured preserves source order; companies alphabetical; company with free+Pro appears in both with disjoint models; sort cost asc then title; undefined `creditCost` sorts as 1; same-`id` variants distinct; empty sections dropped.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 unit criteria for grouping; the new helpers at least 90% line coverage (SPEC Testing Strategy), target over 95%, and `models.ts` at least 80% across metrics; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/utils/models.test.ts --coverage --coverage.include=src/utils/models.ts --coverage.reporter=text"
     ],
     "line": 277,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T6.6",
     "title": "Unit: picker panel and row",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelOption.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelCompanyHeader.vue"
     ],
     "gherkin": null,
     "do": "Update `ModelPickerPanel.test.ts` (stale `model-section-*`), `ModelOption.test.ts` (no `NAME_SEPARATOR` text node, separate elements with gap class, lock only non-Pro + premium, ref icon only with `imageInput`); add `ModelCompanyHeader.test.ts`; panel renders company headers with logo+name and header count matches grouping.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 unit criteria for panel/row; every file at least 80% across metrics, target over 95%; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelPickerPanel.test.ts src/components/Dashboard/ModelPicker/ModelOption.test.ts src/components/Dashboard/ModelPicker/ModelCompanyHeader.test.ts --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelPickerPanel.vue --coverage.include=src/components/Dashboard/ModelPicker/ModelOption.vue --coverage.include=src/components/Dashboard/ModelPicker/ModelCompanyHeader.vue --coverage.reporter=text"
     ],
     "line": 285,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T6.7",
     "title": "E2E: picker sections and company headers",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/pro-tier.spec.ts (drives the model picker)"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/model-menu.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 e2e criteria pass with mocked APIs; stale selectors in `model-menu.spec.ts` and `pro-tier.spec.ts` updated without weakening."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts e2e/qa/pro-tier.spec.ts --repeat-each=3"
     ],
     "line": 293,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T6.8",
     "title": "Gate: Phase 6",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence, including the non-QA specs that drive the picker (`create-image.spec.ts`, `create-transforms.spec.ts`) as regression.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Repo green; desktop picker matches design pass; no test weakened."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts e2e/qa/pro-tier.spec.ts e2e/create-image.spec.ts e2e/create-transforms.spec.ts --repeat-each=2",
      "bun run verify",
      "`bun run test`."
     ],
     "line": 302,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 8,
   "complete": false
  },
  {
   "id": "7",
   "name": "Picker search and keyboard navigation",
   "startLine": 312,
   "endLine": 367,
   "adds": "A sticky search box filters models by name, company and description, with a \"No models match\" state, and arrow keys move through visible options.",
   "tryInUi": [
    "Open the picker and type \"flux\" to see only matching rows",
    "type nonsense to see \"No models match\" and clear it",
    "press ArrowDown from the input then Enter to select."
   ],
   "checkpoint": {
    "title": "Checkpoint 7",
    "line": 366,
    "items": [
     "search and keyboard work and other Popover consumers are unchanged."
    ]
   },
   "tasks": [
    {
     "id": "T7.1",
     "title": "Search filter helper and component",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/models.ts",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerSearch.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue"
     ],
     "gherkin": null,
     "do": "Add a pure filter helper in `utils/models.ts` (trimmed, case-insensitive substring over title, company, `bestAt`, `description`; empty sections/companies removed). `ModelPickerSearch.vue` sticky above the headers, clear button; panel removes empty sections from the DOM (not `v-show`), shows \"No models match\" with echoed query and a clear button, resets the query on close, autofocuses only when `(hover: hover) and (pointer: fine)` matches and width >=768.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 req 6 and edge cases (spaces-only is empty, company-name match shows all that company's models in the tier)."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/utils/models.test.ts src/components/Dashboard/ModelPicker",
      "`bun run verify`."
     ],
     "line": 317,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T7.2",
     "title": "Popover opt-in keyboard props",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/primitives/Popover.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPicker.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue"
     ],
     "gherkin": null,
     "do": "Add opt-in `Popover` props (for example `navigateOptionsFromInput`, `autofocusSelector`) so ArrowDown from the search input moves to the first visible option, Up/Down skip headers and the clear button, Home/End ignored while the input is focused, active option resets to the first visible after filtering; defaults identical to today. Wire from the picker.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 req 7; with props unset all ~9 `Popover` consumers behave identically and their tests pass unmodified."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/primitives src/components/Dashboard",
      "bun run verify",
      "`git diff --stat -- apps/web/src/components/primitives/Popover.test.ts` (no changes)."
     ],
     "line": 325,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T7.3",
     "title": "Unit: search helper",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/utils/models.ts"
     ],
     "gherkin": null,
     "do": "Extend `utils/models.test.ts`: match on title, company, `bestAt`, `description`, case-insensitive, trimmed and spaces-only query, no-match returns empty, empty sections/companies dropped, company-name-only match.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 unit criteria for search; the filter helper at least 90% line coverage, target over 95%, `models.ts` at least 80% across metrics; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/utils/models.test.ts --coverage --coverage.include=src/utils/models.ts --coverage.reporter=text"
     ],
     "line": 333,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T7.4",
     "title": "Unit: search panel and Popover",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerSearch.vue",
      "apps/web/src/components/primitives/Popover.vue"
     ],
     "gherkin": null,
     "do": "Update `ModelPickerPanel.test.ts` (typing filters and removes empty headers, \"No models match\" with query, clear resets, ArrowDown from input focuses first visible option, Enter selects after filtering, autofocus only when desktop media query matches); add `ModelPickerSearch.test.ts`; put the new opt-in prop cases in a new `Popover.optIn.test.ts` and leave `Popover.test.ts` byte-for-byte unchanged (it is the proof that defaults are unchanged).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 unit criteria for panel and Popover; `Popover.test.ts` unmodified and passing; every file at least 80% across metrics, target over 95%; no `it.fails`."
     ],
     "verify": [
      "`git diff --stat -- apps/web/src/components/primitives/Popover.test.ts` (empty)",
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelPickerPanel.test.ts src/components/Dashboard/ModelPicker/ModelPickerSearch.test.ts src/components/primitives/Popover.test.ts src/components/primitives/Popover.optIn.test.ts --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelPickerPanel.vue --coverage.include=src/components/Dashboard/ModelPicker/ModelPickerSearch.vue --coverage.include=src/components/primitives/Popover.vue --coverage.reporter=text"
     ],
     "line": 341,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T7.5",
     "title": "E2E: search and keyboard",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/model-menu.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 e2e criteria for search/keyboard pass with mocked APIs."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts --repeat-each=3"
     ],
     "line": 349,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T7.6",
     "title": "Gate: Phase 7",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run the full web unit suite so every other `Popover` consumer (`UpscaleModelPicker`, `PromptAiMenu`, `StylePicker`, etc.) is exercised unmodified.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Repo green; no existing consumer test edited; no test weakened."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts e2e/qa/pro-tier.spec.ts e2e/create-image.spec.ts e2e/create-transforms.spec.ts --repeat-each=2",
      "bun run verify",
      "bun run test",
      "`git diff --stat -- apps/web/src/components/primitives/Popover.test.ts apps/web/src/components/Dashboard/ModelPicker/UpscaleModelPicker.test.ts apps/web/src/components/Dashboard/ModelPicker/PromptAiMenu.test.ts apps/web/src/components/Dashboard/Sidebar apps/web/src/components/Dashboard/Composer/ReferenceImageControl.test.ts apps/web/src/components/History` (empty)."
     ],
     "line": 358,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 6,
   "complete": false
  },
  {
   "id": "8",
   "name": "Bottom sheet below 768",
   "startLine": 368,
   "endLine": 407,
   "adds": "On phones the model picker opens as a full-width bottom sheet with a backdrop, focus trap and scroll lock; tablets and desktops keep the anchored popover.",
   "tryInUi": [
    "At 390 open the picker and see a bottom sheet",
    "tap the backdrop or press Escape to close",
    "at 768 see the anchored popover."
   ],
   "checkpoint": {
    "title": "Checkpoint 8",
    "line": 406,
    "items": [
     "picker is a sheet below 768 and a popover above, both with search."
    ]
   },
   "tasks": [
    {
     "id": "T8.1",
     "title": "ModelPickerSheet and breakpoint switch",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerSheet.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPicker.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerPanel.vue"
     ],
     "gherkin": null,
     "do": "`ModelPickerSheet.vue`: full-width, backdrop, rounded top, `max-height: 85dvh`, `env(safe-area-inset-bottom)` padding, body scroll lock, focus trap via `composables/useFocusTrap.ts`, focus returns to the trigger, dismiss on backdrop, Escape or select, no drag, no slide animation under reduced motion (`useReducedMotion`). `ModelPicker.vue` chooses `Popover` (>=768) or the sheet (<768) via `useHeaderBreakpoint` and closes when crossing 768. Sticky chrome (search + tier + company) leaves >=4 rows at 360x640. No new dependency.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 req 5 and req 10 height budget; same panel component and code path at all widths."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker",
      "bun run verify",
      "`git diff --stat -- apps/web/package.json` (no dependency change)."
     ],
     "line": 373,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T8.2",
     "title": "Unit: sheet and picker switch",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerSheet.vue",
      "apps/web/src/components/Dashboard/ModelPicker/ModelPicker.vue"
     ],
     "gherkin": null,
     "do": "Add `ModelPickerSheet.test.ts` and update `ModelPicker.test.ts`: sheet below 768 and popover at or above, backdrop/Escape/select dismiss, focus returns to the trigger, body scroll locked while open and released on close, closes when the breakpoint is crossed while open, reduced motion disables the animation class.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 req 5 unit coverage; every file at least 80% across metrics, target over 95%; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Dashboard/ModelPicker/ModelPickerSheet.test.ts src/components/Dashboard/ModelPicker/ModelPicker.test.ts --coverage --coverage.include=src/components/Dashboard/ModelPicker/ModelPickerSheet.vue --coverage.include=src/components/Dashboard/ModelPicker/ModelPicker.vue --coverage.reporter=text"
     ],
     "line": 381,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T8.3",
     "title": "E2E: bottom sheet",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/model-menu.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 1 e2e criteria for the sheet pass with mocked APIs."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts --repeat-each=3"
     ],
     "line": 389,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T8.4",
     "title": "Gate: Phase 8 with picker screenshots",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence; capture picker open and searching screenshots at 360/390/768/1024/1440, light and dark, into `agent_docs/qa/ui-polish-picker-header/` named `picker-<open|search>-<width>-<theme>.png` (supplementary).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Repo green; sheet behaviour proven by QA spec; screenshots exist."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/model-menu.spec.ts e2e/qa/pro-tier.spec.ts e2e/create-image.spec.ts --repeat-each=2",
      "bun run verify",
      "bun run test",
      "`ls agent_docs/qa/ui-polish-picker-header | grep -c picker`."
     ],
     "line": 398,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false
  },
  {
   "id": "9",
   "name": "FAQ visibility in the Upgrade dialog",
   "startLine": 408,
   "endLine": 455,
   "adds": "The \"Before you buy.\" FAQ in the Upgrade to Pro dialog is visible and expandable instead of stuck invisible.",
   "tryInUi": [
    "Open Upgrade to Pro, scroll the dialog to the bottom and see the FAQ heading and questions",
    "click a question and see the answer expand",
    "visit /pricing and the landing page and see their reveal animations still run."
   ],
   "checkpoint": {
    "title": "Checkpoint 9",
    "line": 454,
    "items": [
     "Upgrade dialog FAQ verified visible at all widths in both themes."
    ]
   },
   "tasks": [
    {
     "id": "T9.1",
     "title": "Reproduce and root-cause",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "agent_docs/ui-polish-picker-header/AUDIT.md"
     ],
     "gherkin": null,
     "do": "Reproduce at 1440 and 390 with `agent-browser` (mocked prices), saving `faq-repro-<width>.png` under `agent_docs/qa/ui-polish-picker-header/`, then record the root cause in an `AUDIT.md` row whose element column is `FAQ`. Lead hypothesis: `v-reveal` in `FaqSection` waits on a window ScrollTrigger while the fullscreen `AppModal` panel is the scroller. Check `PricingLayout` `:deep(.faq)` overrides and `dvh` too.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4a: bug reproduced with screenshots before any fix; root cause stated."
     ],
     "verify": [
      "`grep -n \"FAQ\" agent_docs/ui-polish-picker-header/AUDIT.md` (root cause recorded)",
      "`ls agent_docs/qa/ui-polish-picker-header | grep -i faq`."
     ],
     "line": 413,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T9.2",
     "title": "Fix reveal inside the modal",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/directives/reveal.ts",
      "apps/web/src/components/Landing/FaqSection.vue",
      "apps/web/src/components/Pricing/PricingLayout.vue",
      "apps/web/src/components/AppModal.vue"
     ],
     "gherkin": null,
     "do": "Fix at the root cause found in T9.1 (for the lead hypothesis: opt-in scroller option for `v-reveal` or disable reveal inside the modal). Keep `/pricing` and landing reveals working; default behaviour unchanged.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4a: FAQ heading and every question visible in the dialog at opacity 1; `/pricing` and landing animations unaffected."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/directives src/components/Landing src/components/Pricing",
      "`bun run verify`."
     ],
     "line": 421,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T9.3",
     "title": "Unit: reveal regression",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/directives/reveal.ts",
      "apps/web/src/components/Landing/FaqSection.vue",
      "apps/web/src/components/Pricing/PricingLayout.vue"
     ],
     "gherkin": null,
     "do": "Add a test that fails against the pre-fix behaviour and passes now (FAQ items inside the modal are not left at `opacity: 0`); keep default-scroller reveal covered; update `PricingLayout.test.ts` if affected.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4a unit criterion; every file at least 80% across metrics, target over 95%; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/directives src/components/Landing/FaqSection.test.ts src/components/Pricing/PricingLayout.test.ts --coverage --coverage.include=src/directives/reveal.ts --coverage.include=src/components/Landing/FaqSection.vue --coverage.include=src/components/Pricing/PricingLayout.vue --coverage.reporter=text"
     ],
     "line": 429,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T9.4",
     "title": "E2E: dialog FAQ",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/pricing-layout.spec.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/pricing-dialog-faq.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4a e2e criteria pass; `pricing-layout.spec.ts` regression green; no Dodo call (prices mocked)."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/pricing-dialog-faq.spec.ts e2e/qa/pricing-layout.spec.ts --repeat-each=3"
     ],
     "line": 437,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T9.5",
     "title": "Gate: Phase 9",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites; supplementary screenshots at 360/390/768/1440 light and dark.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Repo green; landing and `/pricing` reveals intact."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/pricing-dialog-faq.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/localized-prices.spec.ts --repeat-each=2",
      "bun run verify",
      "`bun run test`."
     ],
     "line": 446,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 5,
   "complete": false
  },
  {
   "id": "10",
   "name": "Landing nav theme toggle",
   "startLine": 456,
   "endLine": 495,
   "adds": "On phones and small tablets the landing page theme toggle sits in the top bar next to the menu button instead of inside the open menu.",
   "tryInUi": [
    "Open the landing page at 390 and see the theme toggle beside the hamburger with the menu closed",
    "tap it and see the theme flip",
    "at 1440 see one toggle in the actions."
   ],
   "checkpoint": {
    "title": "Checkpoint 10",
    "line": 494,
    "items": [
     "landing theme toggle correct at every width."
    ]
   },
   "tasks": [
    {
     "id": "T10.1",
     "title": "LandingNav toggle placement",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Landing/LandingNav.vue"
     ],
     "gherkin": null,
     "do": "Below 900px render `ThemeButton` in the bar next to the hamburger; at >=900 only in `.nav__actions`; exactly one visible toggle at any width. Remove `nav__sheet-theme-btn` and its SCSS from the sheet. Tap target >=44px. Update stale assertions.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4b: one visible toggle per width; no `ThemeButton` in the open sheet; no overflow at 360."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Landing/LandingNav.test.ts",
      "`grep -rn \"nav__sheet-theme-btn\" apps/web/src` (empty)",
      "`bun run verify`."
     ],
     "line": 461,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T10.2",
     "title": "Unit: LandingNav",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Landing/LandingNav.vue"
     ],
     "gherkin": null,
     "do": "Update `LandingNav.test.ts`: no `ThemeButton` inside the sheet, bar toggle present below 900, actions toggle at or above 900, exactly one visible per width.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4b unit criterion; at least 80% across metrics, target over 95%; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/components/Landing/LandingNav.test.ts --coverage --coverage.include=src/components/Landing/LandingNav.vue --coverage.reporter=text"
     ],
     "line": 469,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T10.3",
     "title": "E2E: landing theme toggle",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/landing-nav-theme.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4b e2e criteria pass on the guest landing page, no API calls needed."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/landing-nav-theme.spec.ts --repeat-each=3"
     ],
     "line": 477,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T10.4",
     "title": "Gate: Phase 10",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites as evidence.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Repo green; `user-menu-item-theme` and signed-out header `ThemeButton` unchanged."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/landing-nav-theme.spec.ts --repeat-each=2",
      "bun run verify",
      "`bun run test`."
     ],
     "line": 486,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false
  },
  {
   "id": "11",
   "name": "Create page responsiveness audit and fixes",
   "startLine": 496,
   "endLine": 543,
   "adds": "Create page works cleanly from 360 to 1440: no horizontal scroll, no clipped controls, 44px tap targets, composer always visible.",
   "tryInUi": [
    "Open Create at 360, 390, 700, 768 and 1024 and scroll for horizontal overflow",
    "open the composer with the on-screen keyboard emulated and see it stay visible",
    "compare 1440 to the baseline and see only header and picker changes."
   ],
   "checkpoint": {
    "title": "Checkpoint 11",
    "line": 542,
    "items": [
     "audit table resolved and Create is responsive at every audited width."
    ]
   },
   "tasks": [
    {
     "id": "T11.1",
     "title": "Audit against baseline and record",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "agent_docs/ui-polish-picker-header/AUDIT.md",
      "agent_docs/qa/ui-polish-picker-header/after/ (screenshots only)"
     ],
     "gherkin": null,
     "do": "Re-capture the Phase 0 matrix into `after/`, compare, and record each finding (width, element, symptom, fix) for header, bottom-pinned composer, aside/options, picker trigger, generated grid, history and dialogs, including the 700px band for the unchanged 640 split. Record a manual keyboard-open check. If the 700px band breaks, stop and ask the owner before touching the 640 split (D8).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4c: every audited element has a recorded finding or an explicit \"no issue\"; D8 respected."
     ],
     "verify": [
      "grep -c '^|' agent_docs/ui-polish-picker-header/AUDIT.md",
      "`ls agent_docs/qa/ui-polish-picker-header/after | wc -l`."
     ],
     "line": 501,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T11.2",
     "title": "Fix audit findings",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/pages/Dashboard.vue",
      "apps/web/src/components/Dashboard/DashboardShell.vue",
      "agent_docs/ui-polish-picker-header/AUDIT.md"
     ],
     "gherkin": null,
     "do": "The files depend on what T11.1 finds, so `Dashboard.vue` and `DashboardShell.vue` are only the expected set. Before coding, rewrite this task's **Files** line with the real files from the open `AUDIT.md` rows; if more than 5 are needed, add a `T11.2b` task for the remainder and extend T11.3 accordingly. Fix each open finding and set its status to `fixed` (with the change), `no issue` or `wontfix` (with a reason).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4c: no horizontal scroll at audited widths, no clipped/overlapping controls, tap targets >=44px, composer fully visible with banner; audit table fully resolved or reasoned."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/pages src/components/Dashboard",
      "bun run verify",
      "`grep -c '| open |' agent_docs/ui-polish-picker-header/AUDIT.md` (0)."
     ],
     "line": 509,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T11.3",
     "title": "Unit: logic-changing fixes",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/pages/Dashboard.vue",
      "apps/web/src/components/Dashboard/DashboardShell.vue"
     ],
     "gherkin": null,
     "do": "Add or update tests only for the T11.2 fixes that change logic (classes/conditions); if a fix is CSS-only, assert its class/attribute contract.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Each logic-changing fix has a test; every file at least 80% across metrics; no `it.fails`."
     ],
     "verify": [
      "cd apps/web && npx vitest run src/pages/Dashboard.test.ts src/components/Dashboard/DashboardShell.test.ts --coverage --coverage.include=src/pages/Dashboard.vue --coverage.include=src/components/Dashboard/DashboardShell.vue --coverage.reporter=text"
     ],
     "line": 517,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T11.4",
     "title": "E2E: Create responsiveness",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/create-responsive.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 4c e2e criteria pass with mocked generation and credits; `paidCallGuard` clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/create-responsive.spec.ts --repeat-each=3"
     ],
     "line": 525,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T11.5",
     "title": "Gate: Phase 11",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run suites; side-by-side review of 1440 baseline vs `after/` recorded in `AUDIT.md`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "At 1440 the only diffs from baseline are the intended header and picker changes; repo green."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/create-responsive.spec.ts e2e/qa/header-responsive.spec.ts --repeat-each=2",
      "bun run verify",
      "`bun run test`."
     ],
     "line": 534,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 5,
   "complete": false
  },
  {
   "id": "12",
   "name": "Analytics research doc",
   "startLine": 544,
   "endLine": 566,
   "adds": "A research document (no code) on per-user analytics options with a single recommendation and effort estimate.",
   "tryInUi": [
    "No UI",
    "open `agent_docs/ui-polish-picker-header/ANALYTICS.md` and confirm the four questions are answered with links",
    "run `git status --short apps packages | diff /tmp/ui-polish-p12-before.txt -` and confirm this phase touched no code."
   ],
   "checkpoint": {
    "title": "Checkpoint 12",
    "line": 565,
    "items": [
     "analytics research delivered with a recommendation."
    ]
   },
   "tasks": [
    {
     "id": "T12.1",
     "title": "Write ANALYTICS.md",
     "done": false,
     "kind": "dod",
     "depends": [],
     "files": [
      "agent_docs/ui-polish-picker-header/ANALYTICS.md"
     ],
     "gherkin": null,
     "do": "First snapshot the tree (it already carries uncommitted `apps/`/`packages/` edits from earlier work): `git status --short apps packages > /tmp/ui-polish-p12-before.txt`. Then answer SPEC Part 5 questions with linked official sources: (1) whether Simple Analytics can do per-user custom analytics (images per user per date, cost per user); (2) comparison of PostHog free tier, Umami, Plausible and others on per-user identity, custom events with properties, cost, privacy/consent, self-host burden, query/export; (3) first-party Mongo usage ledger plus admin page (fields, indexes, idempotency per prediction, refund/failure handling, note that `apps/api/src/models/image.ts` has no credits or cost so history cannot be backfilled accurately); (4) one recommendation and rough effort. Research via docs fetch only; no paid or outbound product calls.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Part 5: doc exists, each question answered with linked sources, recommendation explicit, no code or API changes."
     ],
     "verify": [
      "`grep -c \"http\" agent_docs/ui-polish-picker-header/ANALYTICS.md` (links present)",
      "`grep -n -i \"recommend\" agent_docs/ui-polish-picker-header/ANALYTICS.md`."
     ],
     "line": 549,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T12.2",
     "title": "DoD: analytics diff clean",
     "done": false,
     "kind": "dod",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Confirm this phase changed only the doc.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Diff for `ANALYTICS.md` only; no code, schema or API changes from this phase."
     ],
     "verify": [
      "`git status --short apps packages | diff /tmp/ui-polish-p12-before.txt -` (no output)",
      "`ls agent_docs/ui-polish-picker-header/ANALYTICS.md`."
     ],
     "line": 557,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 2,
   "complete": false
  },
  {
   "id": "13",
   "name": "Final gate and walkthrough",
   "startLine": 567,
   "endLine": 605,
   "adds": "Final proof that header, picker, plan pill and fixes work together with zero real paid calls, plus final screenshots.",
   "tryInUi": [
    "Run `cd apps/web && bunx playwright test e2e/qa/paid-call-guard.spec.ts` and confirm green",
    "walk Create, Explore and Assets at 360/390/768/1024/1440 as Free and Pro",
    "open the picker, plan pill, Upgrade dialog FAQ and landing nav."
   ],
   "checkpoint": {
    "title": "Checkpoint 13",
    "line": 604,
    "items": [
     "all SPEC parts verified; no real paid calls; owner review."
    ]
   },
   "tasks": [
    {
     "id": "T13.1",
     "title": "Final stale-test and grep sweep",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Sweep every file named in SPEC Testing Strategy (unit and e2e) for stale assertions; grep that none of `smAndUp`, `100vh-60px`, `dashboard-mobile-tabs`, `pro-badge-header`, `upgrade-pill`, `NAME_SEPARATOR`, `nav__sheet-theme-btn` remain in `apps/web/src` or `apps/web/e2e`, and that `600px` is gone from `AppHeader.vue` and `ReferralOffer.vue` (`Logo.vue` and `ImageDialog.vue` are out of scope; Logo's outcome is in AUDIT.md).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC Testing Strategy: no stale test left; all greps empty; no test weakened."
     ],
     "verify": [
      "`grep -rnE \"smAndUp|100vh-60px|dashboard-mobile-tabs|pro-badge-header|upgrade-pill|NAME_SEPARATOR|nav__sheet-theme-btn\" apps/web/src apps/web/e2e` (empty)",
      "`grep -n \"600px\" apps/web/src/components/Header/AppHeader.vue apps/web/src/components/Header/ReferralOffer.vue` (empty)",
      "bun run verify",
      "`bun run test`."
     ],
     "line": 572,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T13.2",
     "title": "Gate: full e2e in both server modes",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run all new and updated QA specs, then the full suite in dev and prod-preview modes.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "`paid-call-guard.spec.ts` green with zero un-intercepted paid calls; all new and changed specs green; no test weakened."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/plan-pill.spec.ts e2e/qa/model-menu.spec.ts e2e/qa/pricing-dialog-faq.spec.ts e2e/qa/landing-nav-theme.spec.ts e2e/qa/create-responsive.spec.ts e2e/qa/upgrade-entry.spec.ts e2e/qa/pro-tier.spec.ts e2e/qa/plan-status.spec.ts e2e/qa/pricing-layout.spec.ts e2e/qa/mods-referral-favicon.spec.ts e2e/qa/localized-prices.spec.ts e2e/qa/paid-call-guard.spec.ts --repeat-each=2",
      "cd apps/web && bun run test:e2e",
      "`cd apps/web && E2E_SERVER=prod bun run test:e2e`."
     ],
     "line": 580,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T13.3",
     "title": "Walkthrough: all spec parts",
     "done": false,
     "kind": "walkthrough",
     "depends": [],
     "files": [
      "agent_docs/qa/ui-polish-picker-header/ (screenshots only)"
     ],
     "gherkin": null,
     "do": "Walk SPEC Parts 1 to 4 as Free and Pro using the seeded QA specs as evidence; capture final screenshots at 360/390/768/1024/1440, light and dark, for Create/Explore/Assets, picker open and searching, open avatar menu, Upgrade dialog FAQ and landing nav; `agent-browser` (session `visual-ai`, ended with `agent-browser close`) is for layout polish only, never sole evidence. Resolve or record impeccable/layout findings.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every SPEC part verifiable in the browser through its QA spec; screenshots reviewed against baseline; no horizontal scroll at any audited width."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/header-responsive.spec.ts e2e/qa/model-menu.spec.ts e2e/qa/plan-pill.spec.ts e2e/qa/pricing-dialog-faq.spec.ts e2e/qa/landing-nav-theme.spec.ts e2e/qa/create-responsive.spec.ts --repeat-each=2",
      "bun run test",
      "`bun run verify`."
     ],
     "line": 588,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T13.4",
     "title": "Definition of done",
     "done": false,
     "kind": "dod",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run every suite and map evidence to each SPEC success criterion; confirm `ANALYTICS.md` exists and no analytics code was added; list manual owner items (keyboard-open check, final icon choice for Earn/Upgrade, nothing committed).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All SPEC per-part and summary success criteria met; `bun run verify`, `bun run test` and e2e green in both server modes; zero real paid calls; owner reviews remaining manual items."
     ],
     "verify": [
      "cd apps/web && bun run test",
      "bun run verify",
      "cd apps/web && bun run test:e2e",
      "cd apps/web && E2E_SERVER=prod bun run test:e2e",
      "`ls agent_docs/ui-polish-picker-header/ANALYTICS.md`."
     ],
     "line": 596,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false
  }
 ],
 "current": null,
 "nextCommand": "/build-phases agent_docs/ui-polish-picker-header/TASKS.md phase 0",
 "questions": [
  {
   "at": "2026-11-11T13:53:51.240Z",
   "type": "question",
   "tasks": [],
   "id": "Q1",
   "text": "Logo.vue still switches size at 600px — align to 768/1024?",
   "default": "Leave out of scope; record as AUDIT.md row decided in Phase 11",
   "alternatives": "Align to 768 now",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-11T13:53:51.285Z",
   "type": "question",
   "tasks": [],
   "id": "Q2",
   "text": "How does Phase 0 capture Pro baselines?",
   "default": "Flip QA user via activateProViaWebhook (local signed test webhook, no Dodo call), then resetToFree",
   "alternatives": "Skip Pro baselines",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-11T13:53:51.328Z",
   "type": "question",
   "tasks": [],
   "id": "Q3",
   "text": "T11.2 file list unknown until audit",
   "default": "Dashboard.vue + DashboardShell.vue; replace from T11.1 findings, split into T11.2b if >5 files",
   "alternatives": "Re-plan Phase 11 after audit",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-11T13:53:51.370Z",
   "type": "question",
   "tasks": [],
   "id": "Q4",
   "text": "Earn/Upgrade icons",
   "default": "faUserPlus (Earn) and faGem (Upgrade), final pick in design pass",
   "alternatives": "faGift / faWandMagicSparkles",
   "answer": null,
   "answeredAt": null
  }
 ],
 "stuck": [],
 "commits": [],
 "shots": [],
 "deliverables": [],
 "advisories": [],
 "activity": [
  {
   "at": "2026-11-11T13:53:51.370Z",
   "type": "question",
   "tasks": [],
   "id": "Q4",
   "text": "Earn/Upgrade icons",
   "default": "faUserPlus (Earn) and faGem (Upgrade), final pick in design pass",
   "alternatives": "faGift / faWandMagicSparkles"
  },
  {
   "at": "2026-11-11T13:53:51.328Z",
   "type": "question",
   "tasks": [],
   "id": "Q3",
   "text": "T11.2 file list unknown until audit",
   "default": "Dashboard.vue + DashboardShell.vue; replace from T11.1 findings, split into T11.2b if >5 files",
   "alternatives": "Re-plan Phase 11 after audit"
  },
  {
   "at": "2026-11-11T13:53:51.285Z",
   "type": "question",
   "tasks": [],
   "id": "Q2",
   "text": "How does Phase 0 capture Pro baselines?",
   "default": "Flip QA user via activateProViaWebhook (local signed test webhook, no Dodo call), then resetToFree",
   "alternatives": "Skip Pro baselines"
  },
  {
   "at": "2026-11-11T13:53:51.240Z",
   "type": "question",
   "tasks": [],
   "id": "Q1",
   "text": "Logo.vue still switches size at 600px — align to 768/1024?",
   "default": "Leave out of scope; record as AUDIT.md row decided in Phase 11",
   "alternatives": "Align to 768 now"
  }
 ]
};
