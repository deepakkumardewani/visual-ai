window.DASHBOARD = {
 "generatedAt": "2026-11-18T11:38:09.522Z",
 "maxAttempts": 5,
 "feature": {
  "slug": "ui-polish-picker-header",
  "title": "UI Polish, Model Picker and Header"
 },
 "tasksFile": "agent_docs/ui-polish-picker-header/TASKS.md",
 "projectRoot": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai",
 "docs": [
  {
   "name": "AUDIT",
   "href": "docs/AUDIT.html",
   "source": "agent_docs/ui-polish-picker-header/AUDIT.md"
  },
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
 "costUsd": 20.1617,
 "elapsedMs": 174080033,
 "costByRole": {
  "e2e": 1.869,
  "builder": 4.7395,
  "verifier": 12.0532,
  "unit": 1.5
 },
 "totals": {
  "phases": 14,
  "tasks": 61,
  "byStatus": {
   "verified": 23,
   "ready": 38
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
     "done": true,
     "kind": "dod",
     "depends": [],
     "files": [
      "agent_docs/qa/ui-polish-picker-header/baseline/"
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
     "status": "verified",
     "updatedAt": "2026-11-16T09:43:49.155Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": null,
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.5083,
     "costApprox": true,
     "elapsedMs": 749637,
     "summary": []
    },
    {
     "id": "T0.2",
     "title": "Seed audit table",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-16T09:43:49.155Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.5083,
     "costApprox": true,
     "elapsedMs": 749638,
     "summary": []
    }
   ],
   "verified": 2,
   "total": 2,
   "complete": true,
   "costUsd": 1.0166,
   "elapsedMs": 749638
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
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/layout.ts",
      "apps/web/src/composables/useHeaderBreakpoint.ts",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/ReferralOffer.vue",
      "apps/web/src/pages/Dashboard.vue",
      "apps/web/src/App.vue",
      "apps/web/src/components/Dashboard/DashboardShell.vue"
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
     "status": "verified",
     "updatedAt": "2026-11-16T10:18:01.900Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.5575,
     "costApprox": true,
     "elapsedMs": 1550517,
     "summary": []
    },
    {
     "id": "T1.2",
     "title": "Unit: breakpoint composable and banner gate",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-16T10:18:01.900Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.5344,
     "costApprox": true,
     "elapsedMs": 721339,
     "summary": []
    },
    {
     "id": "T1.3",
     "title": "E2E: banner and Earn breakpoint",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/mods-referral-favicon.spec.ts",
      "apps/web/e2e/qa/header-responsive.spec.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-16T10:18:01.900Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.1402,
     "costApprox": true,
     "elapsedMs": 1439883,
     "summary": []
    },
    {
     "id": "T1.4",
     "title": "Gate: Phase 1",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-16T10:18:01.900Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.4655,
     "costApprox": true,
     "elapsedMs": 542129,
     "summary": []
    }
   ],
   "verified": 4,
   "total": 4,
   "complete": true,
   "costUsd": 3.6976,
   "elapsedMs": 1550518
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
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/HeaderActions.vue",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/CreditsChip.vue",
      "apps/web/src/plugins/icons.ts",
      "apps/web/src/components/Header/ReferralOffer.vue",
      "apps/web/src/components.d.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-16T10:52:01.187Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.7699,
     "costApprox": true,
     "elapsedMs": 1414221,
     "summary": []
    },
    {
     "id": "T2.2",
     "title": "Unit: header actions and credits chip",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/HeaderActions.vue",
      "apps/web/src/components/Header/CreditsChip.vue",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/ReferralOffer.vue",
      "apps/web/src/components/Header/ReferralOffer.test.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-16T10:52:01.187Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.2752,
     "costApprox": true,
     "elapsedMs": 1435663,
     "summary": []
    },
    {
     "id": "T2.3",
     "title": "E2E: right cluster order and icon-only",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/upgrade-entry.spec.ts",
      "apps/web/e2e/qa/pricing-layout.spec.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-16T10:52:01.187Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.7275,
     "costApprox": true,
     "elapsedMs": 1227065,
     "summary": []
    },
    {
     "id": "T2.4",
     "title": "Gate: Phase 2",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-16T10:52:01.187Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.6119,
     "costApprox": true,
     "elapsedMs": 772112,
     "summary": []
    }
   ],
   "verified": 4,
   "total": 4,
   "complete": true,
   "costUsd": 3.3845,
   "elapsedMs": 1522723
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
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-16T12:09:41.677Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.7108,
     "costApprox": true,
     "elapsedMs": 1364374,
     "summary": [
      "T3.1: `PRO_PERKS` moved to `apps/web/src/utils/proPerks.ts` (single hit for `PRO_PERKS =`), `ProPerksDialog.vue` on AppModal (no CTA), `showProPerksDialog`/`showProPerks`/`hideProPerks` in `stores/dia",
      "T3.2: `UserMenu.vue` plan pill (`data-testid=\"plan-pill\"`, gold PRO / muted FREE, only when `isReady`, closes menu, FREE -> showPricing, PRO -> showProPerks), `<ProPerksDialog />` mounted beside `<Pri",
      "Tests updated: `UserMenu.test.ts` (pill/ready/dialogs; stubbed PricingDialog), `CreditsChip.test.ts`.",
      "Evidence: `npx vitest run src/components/Header src/components/Dialogs src/components/Pricing src/stores` 40 files / 392 tests pass; `bun run verify` exit 0."
     ]
    },
    {
     "id": "T3.2",
     "title": "UserMenu pill and chip removal",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/UserMenu.vue",
      "apps/web/src/components/Header/CreditsChip.vue",
      "apps/web/src/components/Header/CreditsChip.test.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-16T12:09:41.677Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.8969,
     "costApprox": true,
     "elapsedMs": 1955771,
     "summary": [
      "T3.1: `PRO_PERKS` moved to `apps/web/src/utils/proPerks.ts` (single hit for `PRO_PERKS =`), `ProPerksDialog.vue` on AppModal (no CTA), `showProPerksDialog`/`showProPerks`/`hideProPerks` in `stores/dia",
      "T3.2: `UserMenu.vue` plan pill (`data-testid=\"plan-pill\"`, gold PRO / muted FREE, only when `isReady`, closes menu, FREE -> showPricing, PRO -> showProPerks), `<ProPerksDialog />` mounted beside `<Pri",
      "Tests updated: `UserMenu.test.ts` (pill/ready/dialogs; stubbed PricingDialog), `CreditsChip.test.ts`.",
      "Evidence: `npx vitest run src/components/Header src/components/Dialogs src/components/Pricing src/stores` 40 files / 392 tests pass; `bun run verify` exit 0."
     ]
    },
    {
     "id": "T3.3",
     "title": "Unit: plan pill and perks dialog",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-16T12:09:41.677Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.9352,
     "costApprox": true,
     "elapsedMs": 1814193,
     "summary": [
      "T3.1: `PRO_PERKS` moved to `apps/web/src/utils/proPerks.ts` (single hit for `PRO_PERKS =`), `ProPerksDialog.vue` on AppModal (no CTA), `showProPerksDialog`/`showProPerks`/`hideProPerks` in `stores/dia",
      "T3.2: `UserMenu.vue` plan pill (`data-testid=\"plan-pill\"`, gold PRO / muted FREE, only when `isReady`, closes menu, FREE -> showPricing, PRO -> showProPerks), `<ProPerksDialog />` mounted beside `<Pri",
      "Tests updated: `UserMenu.test.ts` (pill/ready/dialogs; stubbed PricingDialog), `CreditsChip.test.ts`.",
      "Evidence: `npx vitest run src/components/Header src/components/Dialogs src/components/Pricing src/stores` 40 files / 392 tests pass; `bun run verify` exit 0."
     ]
    },
    {
     "id": "T3.4",
     "title": "E2E: plan pill",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/plan-status.spec.ts",
      "apps/web/e2e/qa/pro-tier.spec.ts",
      "apps/web/e2e/qa/upgrade-entry.spec.ts",
      "apps/web/e2e/qa/header-responsive.spec.ts",
      "apps/web/e2e/support/planPill.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-16T12:09:41.677Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.9919,
     "costApprox": true,
     "elapsedMs": 1744854,
     "summary": [
      "T3.1: `PRO_PERKS` moved to `apps/web/src/utils/proPerks.ts` (single hit for `PRO_PERKS =`), `ProPerksDialog.vue` on AppModal (no CTA), `showProPerksDialog`/`showProPerks`/`hideProPerks` in `stores/dia",
      "T3.2: `UserMenu.vue` plan pill (`data-testid=\"plan-pill\"`, gold PRO / muted FREE, only when `isReady`, closes menu, FREE -> showPricing, PRO -> showProPerks), `<ProPerksDialog />` mounted beside `<Pri",
      "Tests updated: `UserMenu.test.ts` (pill/ready/dialogs; stubbed PricingDialog), `CreditsChip.test.ts`.",
      "Evidence: `npx vitest run src/components/Header src/components/Dialogs src/components/Pricing src/stores` 40 files / 392 tests pass; `bun run verify` exit 0."
     ]
    },
    {
     "id": "T3.5",
     "title": "Gate: Phase 3",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-16T12:09:41.677Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.7151,
     "costApprox": true,
     "elapsedMs": 1394836,
     "summary": [
      "T3.1: `PRO_PERKS` moved to `apps/web/src/utils/proPerks.ts` (single hit for `PRO_PERKS =`), `ProPerksDialog.vue` on AppModal (no CTA), `showProPerksDialog`/`showProPerks`/`hideProPerks` in `stores/dia",
      "T3.2: `UserMenu.vue` plan pill (`data-testid=\"plan-pill\"`, gold PRO / muted FREE, only when `isReady`, closes menu, FREE -> showPricing, PRO -> showProPerks), `<ProPerksDialog />` mounted beside `<Pri",
      "Tests updated: `UserMenu.test.ts` (pill/ready/dialogs; stubbed PricingDialog), `CreditsChip.test.ts`.",
      "Evidence: `npx vitest run src/components/Header src/components/Dialogs src/components/Pricing src/stores` 40 files / 392 tests pass; `bun run verify` exit 0."
     ]
    }
   ],
   "verified": 5,
   "total": 5,
   "complete": true,
   "costUsd": 4.2499,
   "elapsedMs": 1955772
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
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Header/NavTabs.vue",
      "apps/web/src/components/Header/FeatureSelect.vue",
      "apps/web/src/pages/Dashboard.vue",
      "apps/web/src/components.d.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-17T09:40:08.038Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 5,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.0039,
     "costApprox": true,
     "elapsedMs": 76539600,
     "summary": []
    },
    {
     "id": "T4.2",
     "title": "Unit: tabs and feature select",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Header/NavTabs.vue",
      "apps/web/src/components/Header/FeatureSelect.vue",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/pages/Dashboard.vue",
      "apps/web/src/components.d.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-17T09:40:08.038Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.0307,
     "costApprox": true,
     "elapsedMs": 76449077,
     "summary": []
    },
    {
     "id": "T4.3",
     "title": "E2E: tabs and feature select across widths",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-17T09:40:08.038Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 5,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.1413,
     "costApprox": true,
     "elapsedMs": 76350404,
     "summary": []
    },
    {
     "id": "T4.4",
     "title": "Gate: Phase 4",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-17T09:40:08.038Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": null,
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.6704,
     "costApprox": true,
     "elapsedMs": 1036618,
     "summary": []
    }
   ],
   "verified": 4,
   "total": 4,
   "complete": true,
   "costUsd": 3.8463,
   "elapsedMs": 76539601
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
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/utils/layout.ts",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/components/Dashboard/DashboardShell.vue",
      "apps/web/src/pages/Dashboard.vue",
      "apps/web/src/pages/Examples.vue",
      "apps/web/src/App.vue",
      "apps/web/src/App.test.ts"
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
     "status": "verified",
     "updatedAt": "2026-11-18T11:38:09.505Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": null,
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 4,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.2762,
     "costApprox": true,
     "elapsedMs": 91761779,
     "summary": []
    },
    {
     "id": "T5.2",
     "title": "Unit: shell height",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-18T11:38:09.505Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.5991,
     "costApprox": true,
     "elapsedMs": 91240497,
     "summary": []
    },
    {
     "id": "T5.3",
     "title": "E2E: composer stays on screen",
     "done": true,
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
     "status": "verified",
     "updatedAt": "2026-11-18T11:38:09.505Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": null,
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.0259,
     "costApprox": true,
     "elapsedMs": 91207336,
     "summary": []
    },
    {
     "id": "T5.4",
     "title": "Gate: Phase 5",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [
      "apps/web/src/composables/useLenis.test.ts"
     ],
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
     "status": "verified",
     "updatedAt": "2026-11-18T11:38:09.505Z",
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": [],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "FAIL",
       "slop": null,
       "reviews": {},
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.0658,
     "costApprox": true,
     "elapsedMs": 90484588,
     "summary": []
    }
   ],
   "verified": 4,
   "total": 4,
   "complete": true,
   "costUsd": 3.967,
   "elapsedMs": 91761781
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T6.7",
     "title": "E2E: picker sections and company headers",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/pro-tier.spec.ts"
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 8,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 6,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 5,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
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
      "agent_docs/qa/ui-polish-picker-header/after/"
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 5,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 2,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T13.3",
     "title": "Walkthrough: all spec parts",
     "done": false,
     "kind": "walkthrough",
     "depends": [],
     "files": [
      "agent_docs/qa/ui-polish-picker-header/"
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
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
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": null,
     "surfaces": null,
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 4,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
  }
 ],
 "current": null,
 "nextCommand": "/build-phases agent_docs/ui-polish-picker-header/TASKS.md phase 6",
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
  },
  {
   "at": "2026-11-16T09:36:51.718Z",
   "type": "question",
   "tasks": [
    "T0.1"
   ],
   "id": "Q5",
   "text": "Local MongoDB down (ECONNREFUSED 27017); baseline screenshots cannot be captured. Needs mongod started.",
   "answer": "Builder may start mongod manually against /opt/homebrew/var/mongodb",
   "answeredAt": "2026-11-16T09:39:12.598Z"
  },
  {
   "at": "2026-11-16T12:44:50.663Z",
   "type": "question",
   "tasks": [
    "T4.1",
    "T4.3"
   ],
   "id": "Q6",
   "text": "SPEC conflict at 1024: tabs centered (SPEC:116) vs Earn/Upgrade labelled (SPEC:125). Built: centered in free slot (86px left of midpoint). Choose: (a) accept free-slot centering and reword SPEC/AUDIT, (b) viewport-center where it fits (fix at 1440, 1024 exempt), (c) icon-only Earn/Upgrade up to wider breakpoint.",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T16:28:23.804Z",
   "type": "question",
   "tasks": [
    "T4.1",
    "T4.3"
   ],
   "id": "Q7",
   "text": "spec_issue: SPEC:116 centered tabs vs SPEC:125 labelled Earn/Upgrade at 1024; tabs 86px left of midpoint at 1024, 34px at 1440. See reports/phase-4-verifier-a4.md",
   "answer": "Re Q7: option (a) free-slot centering accepted; SPEC/AUDIT reworded. Free-slot e2e assertion is correct.",
   "answeredAt": "2026-11-17T09:31:20.441Z"
  },
  {
   "at": "2026-11-17T10:55:47.905Z",
   "type": "question",
   "tasks": [
    "T5.4"
   ],
   "id": "Q8",
   "text": "Gate builder (attempt 3) was stopped by the user before reporting; unsure whether to resume",
   "answer": null,
   "answeredAt": null
  }
 ],
 "stuck": [],
 "commits": [
  {
   "at": "2026-11-17T09:40:08.038Z",
   "ok": true,
   "phase": "4",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4"
   ],
   "attempt": "7",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 73/73 x3, unit 130/130, lowest coverage 81.8%",
   "error": null,
   "sha": "238d18821d7e429ca9767c7fd061e5d9a048ec92",
   "shortSha": "238d188",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/238d18821d7e429ca9767c7fd061e5d9a048ec92",
   "subject": "feat(web): tabs into the header, centered in free space with pinned mobile row",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-17T15:06:36+05:30",
   "filesChanged": 19,
   "added": 1933,
   "removed": 510
  },
  {
   "at": "2026-11-16T12:09:41.677Z",
   "ok": true,
   "phase": "3",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5"
   ],
   "attempt": "5",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 145/145, unit 58 tests, lowest coverage 87.5% branches (98.41% lines)",
   "error": null,
   "sha": "0b2ee6aa03feb851e8656de382e79f57e694aee0",
   "shortSha": "0b2ee6a",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/0b2ee6aa03feb851e8656de382e79f57e694aee0",
   "subject": "feat(web): plan pill in avatar menu and Pro perks dialog",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-16T17:39:35+05:30",
   "filesChanged": 18,
   "added": 529,
   "removed": 60
  },
  {
   "at": "2026-11-16T10:52:01.187Z",
   "ok": true,
   "phase": "2",
   "tasks": [
    "T2.1",
    "T2.2",
    "T2.3",
    "T2.4"
   ],
   "attempt": "2",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 106/106 x3, unit lowest 100%",
   "error": null,
   "sha": "481d16fa9dbf04d53d7ae25b9b6b4e57b537860c",
   "shortSha": "481d16f",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/481d16fa9dbf04d53d7ae25b9b6b4e57b537860c",
   "subject": "feat(web): header right cluster with Upgrade and Earn",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-16T16:21:53+05:30",
   "filesChanged": 17,
   "added": 1289,
   "removed": 459
  },
  {
   "at": "2026-11-16T10:18:01.900Z",
   "ok": true,
   "phase": "1",
   "tasks": [
    "T1.1",
    "T1.2",
    "T1.3",
    "T1.4"
   ],
   "attempt": "3",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 58/58 prod x3, unit lowest file 100% lines",
   "error": null,
   "sha": "d205a96912d42a30d27227aaf922cf8920cac285",
   "shortSha": "d205a96",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/d205a96912d42a30d27227aaf922cf8920cac285",
   "subject": "feat(web): shared header breakpoint at 768",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-16T15:47:54+05:30",
   "filesChanged": 15,
   "added": 1193,
   "removed": 211
  },
  {
   "at": "2026-11-16T09:43:49.155Z",
   "ok": true,
   "phase": "0",
   "tasks": [
    "T0.1",
    "T0.2"
   ],
   "attempt": "2",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "no e2e/unit in scope; 108 shots verified",
   "error": null,
   "sha": "a4f94c9da1c3d950c22e642112c160b1f4ae25fb",
   "shortSha": "a4f94c9",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/a4f94c9da1c3d950c22e642112c160b1f4ae25fb",
   "subject": "docs(ui-polish-picker-header): phase 0 baseline screenshots and audit table",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-16T15:13:42+05:30",
   "filesChanged": 9,
   "added": 1361,
   "removed": 166
  }
 ],
 "shots": [
  {
   "taskId": "T1.1",
   "kind": "proof",
   "step": "Banner below 768; 640 split unchanged",
   "attempt": 1,
   "caption": "At 700px the banner shows and Earn is gone, but a ~55px empty band sits between header and content and the page grows to 996px in a 900px viewport",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 100,
     "h": 3.6,
     "label": "Referral banner shown below 768"
    },
    {
     "x": 0,
     "y": 10,
     "w": 100,
     "h": 5.5,
     "label": "New empty band (in-flow mobile header + pt-14 stacked on sm layout)"
    }
   ],
   "at": "2026-11-16T10:04:05.486Z",
   "file": "1/T1.1-1.png",
   "phase": "1",
   "href": "shots/1/T1.1-1.png"
  },
  {
   "taskId": "T1.1",
   "kind": "proof",
   "step": "Earn pill shown from 768",
   "attempt": 1,
   "caption": "At 768px no banner and the Earn credits chip is in the header; content sits directly under the header",
   "annotations": [
    {
     "x": 45.2,
     "y": 1.6,
     "w": 15,
     "h": 3.8,
     "label": "Earn credits chip in header"
    }
   ],
   "at": "2026-11-16T10:04:05.562Z",
   "file": "1/T1.1-2.png",
   "phase": "1",
   "href": "shots/1/T1.1-2.png"
  },
  {
   "taskId": "T1.1",
   "kind": "after",
   "step": "Banner below 768; 640 split unchanged, nothing cut off",
   "attempt": 3,
   "caption": "At 700x600 (640-767 band) the banner shows, Earn is absent, the shell starts right under the header and the options rail scrolled to its end shows the Format row fully inside the viewport",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 100,
     "h": 6,
     "label": "Referral banner below 768, no Earn pill"
    },
    {
     "x": 0,
     "y": 87,
     "w": 37,
     "h": 12,
     "label": "Last rail control (Format) fully visible, not clipped"
    }
   ],
   "at": "2026-11-16T10:16:40.881Z",
   "file": "1/T1.1-3.png",
   "phase": "1",
   "href": "shots/1/T1.1-3.png"
  },
  {
   "taskId": "T1.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Header at banner-390",
   "annotations": [],
   "at": "2026-11-16T09:55:34.276Z",
   "file": "1/T1.3-1.png",
   "phase": "1",
   "href": "shots/1/T1.3-1.png"
  },
  {
   "taskId": "T1.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Header at banner-700",
   "annotations": [],
   "at": "2026-11-16T09:55:34.370Z",
   "file": "1/T1.3-2.png",
   "phase": "1",
   "href": "shots/1/T1.3-2.png"
  },
  {
   "taskId": "T1.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Header at earn-pill-768",
   "annotations": [],
   "at": "2026-11-16T09:55:34.451Z",
   "file": "1/T1.3-3.png",
   "phase": "1",
   "href": "shots/1/T1.3-3.png"
  },
  {
   "taskId": "T1.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Header at earn-pill-1024",
   "annotations": [],
   "at": "2026-11-16T09:55:34.530Z",
   "file": "1/T1.3-4.png",
   "phase": "1",
   "href": "shots/1/T1.3-4.png"
  },
  {
   "taskId": "T2.1",
   "kind": "proof",
   "step": "Order Earn, Upgrade, credits, avatar; labels at >=1024",
   "attempt": 1,
   "caption": "Free user at 1440: Earn credits and Upgrade to Pro show icon plus label, left of the credits pill and avatar",
   "annotations": [
    {
     "x": 69.4,
     "y": 1.1,
     "w": 8.2,
     "h": 4.9,
     "label": "Earn credits (faUserPlus) first"
    },
    {
     "x": 78.4,
     "y": 1.1,
     "w": 9.3,
     "h": 4.9,
     "label": "Upgrade to Pro (faGem) second"
    },
    {
     "x": 88.6,
     "y": 1.1,
     "w": 4.3,
     "h": 4.9,
     "label": "Credits pill third"
    },
    {
     "x": 93.75,
     "y": 1.3,
     "w": 4.6,
     "h": 4.4,
     "label": "Avatar menu last"
    }
   ],
   "at": "2026-11-16T10:46:12.512Z",
   "file": "2/T2.1-1.png",
   "phase": "2",
   "href": "shots/2/T2.1-1.png"
  },
  {
   "taskId": "T2.1",
   "kind": "proof",
   "step": "Icon-only with aria-label and tooltip at 768-1023, 44px targets",
   "attempt": 1,
   "caption": "Free user at 768: Earn and Upgrade are 44x44 icon-only buttons; keyboard focus on Upgrade shows the Upgrade to Pro tooltip",
   "annotations": [
    {
     "x": 66.6,
     "y": 1.1,
     "w": 5.7,
     "h": 4.9,
     "label": "Earn icon-only, 44x44"
    },
    {
     "x": 73.4,
     "y": 1.1,
     "w": 5.7,
     "h": 4.9,
     "label": "Upgrade icon-only, 44x44, focused"
    },
    {
     "x": 67.9,
     "y": 6.9,
     "w": 16.7,
     "h": 3.6,
     "label": "Tooltip on focus"
    }
   ],
   "at": "2026-11-16T10:46:12.607Z",
   "file": "2/T2.1-2.png",
   "phase": "2",
   "href": "shots/2/T2.1-2.png"
  },
  {
   "taskId": "T2.1",
   "kind": "proof",
   "step": "Below 768: Upgrade icon button, Earn only in the banner",
   "attempt": 1,
   "caption": "Free user at 390: the header has an icon-only Upgrade button and no Earn pill; Earn lives in the top referral banner",
   "annotations": [
    {
     "x": 47.6,
     "y": 5.1,
     "w": 11.3,
     "h": 4.9,
     "label": "Upgrade icon button, 44x44"
    },
    {
     "x": 0,
     "y": 0,
     "w": 100,
     "h": 4,
     "label": "Referral banner replaces Earn"
    }
   ],
   "at": "2026-11-16T10:46:12.686Z",
   "file": "2/T2.1-3.png",
   "phase": "2",
   "href": "shots/2/T2.1-3.png"
  },
  {
   "taskId": "T2.1",
   "kind": "proof",
   "step": "Upgrade shown to Free users only",
   "attempt": 1,
   "caption": "Pro user at 768: no Upgrade button; Earn icon, credits, PRO badge (stays until P3) and avatar",
   "annotations": [
    {
     "x": 64.2,
     "y": 1.1,
     "w": 5.7,
     "h": 4.9,
     "label": "Earn icon-only"
    },
    {
     "x": 70.9,
     "y": 1.1,
     "w": 8.1,
     "h": 4.9,
     "label": "Credits pill directly after Earn, no Upgrade"
    }
   ],
   "at": "2026-11-16T10:46:12.767Z",
   "file": "2/T2.1-4.png",
   "phase": "2",
   "href": "shots/2/T2.1-4.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Header cluster-1440",
   "annotations": [],
   "at": "2026-11-16T10:36:50.497Z",
   "file": "2/T2.3-1.png",
   "phase": "2",
   "href": "shots/2/T2.3-1.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Header cluster-1024",
   "annotations": [],
   "at": "2026-11-16T10:36:50.582Z",
   "file": "2/T2.3-2.png",
   "phase": "2",
   "href": "shots/2/T2.3-2.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Header icon-only-768",
   "annotations": [],
   "at": "2026-11-16T10:36:50.664Z",
   "file": "2/T2.3-3.png",
   "phase": "2",
   "href": "shots/2/T2.3-3.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Header upgrade-icon-390",
   "annotations": [],
   "at": "2026-11-16T10:36:50.746Z",
   "file": "2/T2.3-4.png",
   "phase": "2",
   "href": "shots/2/T2.3-4.png"
  },
  {
   "taskId": "T3.1",
   "kind": "proof",
   "step": "One PRO_PERKS source; dialog has no buy CTA",
   "attempt": 4,
   "caption": "Pro perks dialog lists the four shared PRO_PERKS items and offers only a Close button, no buy CTA.",
   "annotations": [
    {
     "x": 33.3,
     "y": 35.6,
     "w": 33.3,
     "h": 28.9,
     "label": "Perks dialog: 4 perks, only Close control"
    }
   ],
   "at": "2026-11-16T11:56:01.885Z",
   "file": "3/T3.1-1.png",
   "phase": "3",
   "href": "shots/3/T3.1-1.png"
  },
  {
   "taskId": "T3.2",
   "kind": "proof",
   "step": "No PRO chip in header",
   "attempt": 4,
   "caption": "Pro user at 1440: header right cluster shows Earn credits, credits and avatar only, with no PRO chip and no Upgrade pill.",
   "annotations": [
    {
     "x": 79.2,
     "y": 0.8,
     "w": 19.2,
     "h": 6,
     "label": "No PRO chip beside credits"
    }
   ],
   "at": "2026-11-16T11:56:02.002Z",
   "file": "3/T3.2-1.png",
   "phase": "3",
   "href": "shots/3/T3.2-1.png"
  },
  {
   "taskId": "T3.2",
   "kind": "proof",
   "step": "Pill by plan: PRO",
   "attempt": 4,
   "caption": "Pro user opens the avatar menu and sees the gold PRO pill under their email.",
   "annotations": [
    {
     "x": 83,
     "y": 12.7,
     "w": 2.7,
     "h": 2.4,
     "label": "Gold PRO pill"
    }
   ],
   "at": "2026-11-16T11:56:02.092Z",
   "file": "3/T3.2-2.png",
   "phase": "3",
   "href": "shots/3/T3.2-2.png"
  },
  {
   "taskId": "T3.2",
   "kind": "proof",
   "step": "Pill by plan: FREE",
   "attempt": 4,
   "caption": "Free user opens the avatar menu and sees the muted FREE pill under their email.",
   "annotations": [
    {
     "x": 83,
     "y": 12.7,
     "w": 2.9,
     "h": 2.4,
     "label": "Muted FREE pill"
    }
   ],
   "at": "2026-11-16T11:56:02.179Z",
   "file": "3/T3.2-3.png",
   "phase": "3",
   "href": "shots/3/T3.2-3.png"
  },
  {
   "taskId": "T3.2",
   "kind": "proof",
   "step": "FREE opens pricing dialog",
   "attempt": 4,
   "caption": "Clicking FREE closes the menu and opens the existing Upgrade to Pro pricing dialog.",
   "annotations": [
    {
     "x": 22.9,
     "y": 7.8,
     "w": 54.2,
     "h": 6.7,
     "label": "Pricing dialog title"
    }
   ],
   "at": "2026-11-16T11:56:02.269Z",
   "file": "3/T3.2-4.png",
   "phase": "3",
   "href": "shots/3/T3.2-4.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-360-light",
   "annotations": [],
   "at": "2026-11-16T11:45:59.977Z",
   "file": "3/T3.4-1.png",
   "phase": "3",
   "href": "shots/3/T3.4-1.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-360-dark",
   "annotations": [],
   "at": "2026-11-16T11:46:00.077Z",
   "file": "3/T3.4-2.png",
   "phase": "3",
   "href": "shots/3/T3.4-2.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-1440-light",
   "annotations": [],
   "at": "2026-11-16T11:46:00.170Z",
   "file": "3/T3.4-3.png",
   "phase": "3",
   "href": "shots/3/T3.4-3.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-1440-dark",
   "annotations": [],
   "at": "2026-11-16T11:46:00.265Z",
   "file": "3/T3.4-4.png",
   "phase": "3",
   "href": "shots/3/T3.4-4.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill pro-perks-dialog",
   "annotations": [],
   "at": "2026-11-16T12:01:59.240Z",
   "file": "3/T3.4-5.png",
   "phase": "3",
   "href": "shots/3/T3.4-5.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": "Pro clicks PRO and the perks dialog opens with no buy button",
   "attempt": 4,
   "caption": "Replaces the mid-fade pro-perks-dialog shot: clicking PRO opens the settled perks dialog with only a Close button.",
   "annotations": [
    {
     "x": 33.3,
     "y": 35.6,
     "w": 33.3,
     "h": 28.9,
     "label": "Perks dialog, no buy button"
    }
   ],
   "at": "2026-11-16T11:56:02.360Z",
   "file": "3/T3.4-6.png",
   "phase": "3",
   "href": "shots/3/T3.4-6.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-free-1440-dark",
   "annotations": [],
   "at": "2026-11-16T12:01:58.466Z",
   "file": "3/T3.4-7.png",
   "phase": "3",
   "href": "shots/3/T3.4-7.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-free-1440-light",
   "annotations": [],
   "at": "2026-11-16T12:01:58.572Z",
   "file": "3/T3.4-8.png",
   "phase": "3",
   "href": "shots/3/T3.4-8.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-free-360-dark",
   "annotations": [],
   "at": "2026-11-16T12:01:58.668Z",
   "file": "3/T3.4-9.png",
   "phase": "3",
   "href": "shots/3/T3.4-9.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-free-360-light",
   "annotations": [],
   "at": "2026-11-16T12:01:58.764Z",
   "file": "3/T3.4-10.png",
   "phase": "3",
   "href": "shots/3/T3.4-10.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-pro-1440-dark",
   "annotations": [],
   "at": "2026-11-16T12:01:58.859Z",
   "file": "3/T3.4-11.png",
   "phase": "3",
   "href": "shots/3/T3.4-11.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-pro-1440-light",
   "annotations": [],
   "at": "2026-11-16T12:01:58.954Z",
   "file": "3/T3.4-12.png",
   "phase": "3",
   "href": "shots/3/T3.4-12.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-pro-360-dark",
   "annotations": [],
   "at": "2026-11-16T12:01:59.050Z",
   "file": "3/T3.4-13.png",
   "phase": "3",
   "href": "shots/3/T3.4-13.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "plan pill menu-pro-360-light",
   "annotations": [],
   "at": "2026-11-16T12:01:59.146Z",
   "file": "3/T3.4-14.png",
   "phase": "3",
   "href": "shots/3/T3.4-14.png"
  },
  {
   "taskId": "T4.1",
   "kind": "after",
   "step": "Tabs at every width including 640-767",
   "attempt": 1,
   "caption": "At 700px (the old 640-767 gap) Create, Explore and Assets render as the full-width row 2 under the header.",
   "annotations": [
    {
     "x": 2.3,
     "y": 12,
     "w": 95.4,
     "h": 6,
     "label": "tabs row visible at 700"
    }
   ],
   "at": "2026-11-16T12:43:54.928Z",
   "file": "4/T4.1-1.png",
   "phase": "4",
   "href": "shots/4/T4.1-1.png"
  },
  {
   "taskId": "T4.1",
   "kind": "after",
   "step": "Sticky row 2 below 768; feature select on Create at all widths",
   "attempt": 1,
   "caption": "At 390px: banner, row 1 with compact feature select, row 2 equal-thirds segmented tabs.",
   "annotations": [
    {
     "x": 14.9,
     "y": 5.7,
     "w": 29.6,
     "h": 4.7,
     "label": "compact feature select on Create"
    },
    {
     "x": 0,
     "y": 11.8,
     "w": 100,
     "h": 8.4,
     "label": "row 2 segmented tabs"
    }
   ],
   "at": "2026-11-16T12:43:55.041Z",
   "file": "4/T4.1-2.png",
   "phase": "4",
   "href": "shots/4/T4.1-2.png"
  },
  {
   "taskId": "T4.1",
   "kind": "after",
   "step": "Row 2 stays at the viewport top while content scrolls",
   "attempt": 1,
   "caption": "Explore at 390px after scrolling: row 1 and banner scrolled away, tabs row pinned at y=0.",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 100,
     "h": 8.4,
     "label": "tabs pinned at top after scroll"
    }
   ],
   "at": "2026-11-16T12:43:55.145Z",
   "file": "4/T4.1-3.png",
   "phase": "4",
   "href": "shots/4/T4.1-3.png"
  },
  {
   "taskId": "T4.1",
   "kind": "after",
   "step": "Tabs centered at 768+ (spec-issue evidence)",
   "attempt": 1,
   "caption": "At 1024px the tabs center sits at x=426, 86px left of the viewport midpoint (512): same as the baseline left-shift.",
   "annotations": [
    {
     "x": 28.1,
     "y": 0.6,
     "w": 26.9,
     "h": 6,
     "label": "tabs center 86px left of midpoint"
    }
   ],
   "at": "2026-11-16T12:43:55.251Z",
   "file": "4/T4.1-4.png",
   "phase": "4",
   "href": "shots/4/T4.1-4.png"
  },
  {
   "taskId": "T4.1",
   "kind": "after",
   "step": "Tabs centered at 768+ (spec-issue evidence)",
   "attempt": 1,
   "caption": "At 1440px the tabs center sits at x=686, 34px left of the viewport midpoint (720).",
   "annotations": [
    {
     "x": 32.1,
     "y": 0.6,
     "w": 31.1,
     "h": 6,
     "label": "tabs center 34px left of midpoint"
    }
   ],
   "at": "2026-11-16T12:43:55.354Z",
   "file": "4/T4.1-5.png",
   "phase": "4",
   "href": "shots/4/T4.1-5.png"
  },
  {
   "taskId": "T4.1",
   "kind": "proof",
   "step": "Centered at 768+ (in the free space between feature select and right cluster, Q7 option a)",
   "attempt": 7,
   "caption": "At 768px (prod build, signed-in Free user) the tabs sit centered between the feature select and the Earn icon button, gaps about 9px and 12px.",
   "annotations": [
    {
     "x": 34.3,
     "y": 0.6,
     "w": 30.7,
     "h": 6,
     "label": "tabs centered in the free slot"
    },
    {
     "x": 8,
     "y": 1.3,
     "w": 25.3,
     "h": 4.6,
     "label": "feature select, left edge of slot"
    },
    {
     "x": 66.6,
     "y": 1.3,
     "w": 6,
     "h": 4.6,
     "label": "Earn button, right edge of slot"
    }
   ],
   "at": "2026-11-17T09:35:48.667Z",
   "file": "4/T4.1-6.png",
   "phase": "4",
   "href": "shots/4/T4.1-6.png"
  },
  {
   "taskId": "T4.1",
   "kind": "proof",
   "step": "Centered at 768+ (in the free space between feature select and right cluster, Q7 option a)",
   "attempt": 7,
   "caption": "At 1024px the tabs sit centered between the feature select and the labelled Earn credits button, gaps about 25px and 20px (within the 4px e2e tolerance of the slot center).",
   "annotations": [
    {
     "x": 28.1,
     "y": 0.6,
     "w": 26.9,
     "h": 6,
     "label": "tabs centered in the free slot"
    },
    {
     "x": 6.8,
     "y": 1.3,
     "w": 18.9,
     "h": 4.6,
     "label": "feature select, left edge of slot"
    },
    {
     "x": 57,
     "y": 1.3,
     "w": 13,
     "h": 4.6,
     "label": "Earn credits, right edge of slot"
    }
   ],
   "at": "2026-11-17T09:35:48.770Z",
   "file": "4/T4.1-7.png",
   "phase": "4",
   "href": "shots/4/T4.1-7.png"
  },
  {
   "taskId": "T4.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "390px: two rows, equal thirds, feature select, banner",
   "annotations": [],
   "at": "2026-11-16T12:27:23.209Z",
   "file": "4/T4.3-1.png",
   "phase": "4",
   "href": "shots/4/T4.3-1.png"
  },
  {
   "taskId": "T4.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "360px: two rows, equal thirds, feature select, banner",
   "annotations": [],
   "at": "2026-11-16T12:27:23.335Z",
   "file": "4/T4.3-2.png",
   "phase": "4",
   "href": "shots/4/T4.3-2.png"
  },
  {
   "taskId": "T4.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "360px with 4-digit credits, no horizontal scroll",
   "annotations": [],
   "at": "2026-11-16T12:27:23.440Z",
   "file": "4/T4.3-3.png",
   "phase": "4",
   "href": "shots/4/T4.3-3.png"
  },
  {
   "taskId": "T5.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Composer fully on screen at 768x1024",
   "annotations": [],
   "at": "2026-11-17T10:21:08.428Z",
   "file": "5/T5.3-1.png",
   "phase": "5",
   "href": "shots/5/T5.3-1.png"
  },
  {
   "taskId": "T5.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Composer fully on screen at 1440x900",
   "annotations": [],
   "at": "2026-11-17T10:21:08.560Z",
   "file": "5/T5.3-2.png",
   "phase": "5",
   "href": "shots/5/T5.3-2.png"
  },
  {
   "taskId": "T5.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "header responsive two-rows-360",
   "annotations": [],
   "at": "2026-11-17T10:24:43.667Z",
   "file": "5/T5.3-3.png",
   "phase": "5",
   "href": "shots/5/T5.3-3.png"
  },
  {
   "taskId": "T5.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "header responsive two-rows-390",
   "annotations": [],
   "at": "2026-11-17T10:24:43.904Z",
   "file": "5/T5.3-4.png",
   "phase": "5",
   "href": "shots/5/T5.3-4.png"
  },
  {
   "taskId": "T5.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "header responsive composer-360x640",
   "annotations": [],
   "at": "2026-11-17T10:24:44.056Z",
   "file": "5/T5.3-5.png",
   "phase": "5",
   "href": "shots/5/T5.3-5.png"
  },
  {
   "taskId": "T5.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "header responsive composer-390x844",
   "annotations": [],
   "at": "2026-11-17T10:24:44.223Z",
   "file": "5/T5.3-6.png",
   "phase": "5",
   "href": "shots/5/T5.3-6.png"
  },
  {
   "taskId": "T5.3",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "header responsive four-digit-360",
   "annotations": [],
   "at": "2026-11-17T10:24:44.384Z",
   "file": "5/T5.3-7.png",
   "phase": "5",
   "href": "shots/5/T5.3-7.png"
  },
  {
   "taskId": "T5.3",
   "kind": "proof",
   "step": "@medium no vertical overflow regression after banner dismissal",
   "attempt": 12,
   "caption": "At 390x844 on the prod build, after the banner offer dialog is dismissed, the full page is still 844px tall and the prompt bar and Generate button sit fully on screen",
   "annotations": [
    {
     "x": 3,
     "y": 75,
     "w": 94,
     "h": 24,
     "label": "Composer and Generate fully inside the viewport after dismissal"
    }
   ],
   "at": "2026-11-18T11:35:33.032Z",
   "file": "5/T5.3-8.png",
   "phase": "5",
   "href": "shots/5/T5.3-8.png"
  }
 ],
 "deliverables": [
  {
   "at": "2026-11-18T11:38:09.505Z",
   "type": "deliverable",
   "tasks": [
    "T5.1",
    "T5.2",
    "T5.3",
    "T5.4"
   ],
   "text": "Header height from a single source: layout.ts constants, no 100vh-60px, prod build green",
   "files": [
    "apps/web/src/utils/layout.ts"
   ]
  },
  {
   "at": "2026-11-17T09:36:32.726Z",
   "type": "deliverable",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4"
   ],
   "text": "Tabs moved into the header: centered in free space at 768+, pinned segmented row 2 below 768",
   "files": [
    "apps/web/src/components/Header/AppHeader.vue"
   ]
  },
  {
   "at": "2026-11-16T12:09:25.138Z",
   "type": "deliverable",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5"
   ],
   "text": "Plan pill in avatar menu, Pro perks dialog, header PRO chip removed, unit and e2e coverage",
   "files": [
    "apps/web/src/components/Header/UserMenu.vue"
   ]
  },
  {
   "at": "2026-11-16T10:51:41.886Z",
   "type": "deliverable",
   "tasks": [
    "T2.1",
    "T2.2",
    "T2.3",
    "T2.4"
   ],
   "text": "Header right cluster: Earn, Upgrade, credits, avatar; icon-only at 768; unit+e2e+gate green",
   "files": [
    "apps/web/src/components/Header/HeaderActions.vue"
   ]
  },
  {
   "at": "2026-11-16T10:17:41.673Z",
   "type": "deliverable",
   "tasks": [
    "T1.1",
    "T1.2",
    "T1.3",
    "T1.4"
   ],
   "text": "Shared breakpoint constants + useHeaderBreakpoint; header/banner split moved 600->768; 640-767 shell sizing fixed; unit + e2e coverage",
   "files": [
    "apps/web/src/utils/layout.ts"
   ]
  },
  {
   "at": "2026-11-16T09:43:36.375Z",
   "type": "deliverable",
   "tasks": [
    "T0.1",
    "T0.2"
   ],
   "text": "108 baseline screenshots captured and AUDIT.md with 9 open rows",
   "files": [
    "agent_docs/ui-polish-picker-header/AUDIT.md"
   ]
  }
 ],
 "advisories": [
  {
   "at": "2026-11-18T11:37:38.867Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "Proof shots 5/T5.3-3,-4,-7 (two-rows, four-digit) match no T5.3 scenario; captions are generic"
  },
  {
   "at": "2026-11-18T11:37:38.738Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "header-responsive.spec.ts:166 TS2488 under e2e tsconfig on spread of rail?.children (pre-existing at baseline)"
  },
  {
   "at": "2026-11-18T11:37:38.608Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "header-responsive.spec.ts:388 Explore at 390 tabs rest at y=100 after scroll, held as test.fail (out-of-scope app bug)"
  },
  {
   "at": "2026-11-18T11:37:38.451Z",
   "type": "advisory",
   "tasks": [
    "T5.2"
   ],
   "text": "Scoped T5.2 coverage cmd exits 1: global 90% functions threshold applies to the 3-file run; Dashboard.vue funcs 81.81% (per-file 80% policy met)"
  },
  {
   "at": "2026-11-17T10:54:26.379Z",
   "type": "advisory",
   "tasks": [
    "T5.2"
   ],
   "text": "Scoped coverage Verify cmd exits 1 on the global 90% funcs threshold (Dashboard.vue 81.81%); per-file 80% met"
  },
  {
   "at": "2026-11-17T10:53:22.527Z",
   "type": "advisory",
   "tasks": [
    "T5.1"
   ],
   "text": "Tailwind content scans *.test.ts; real height class only generated because tests contain the literal"
  },
  {
   "at": "2026-11-17T10:53:22.420Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "TS2488 at header-responsive.spec.ts:166 (pre-existing rail children spread), not caught by verify"
  },
  {
   "at": "2026-11-17T10:53:22.306Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "Explore at 390: tabs rest at y=100 after scroll; held as test.fail() (accepted, out of scope)"
  },
  {
   "at": "2026-11-17T09:35:56.425Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "Engineer report T4.3-e2e-a11.md named in the brief does not exist; verified by re-running the spec instead."
  },
  {
   "at": "2026-11-17T09:35:56.327Z",
   "type": "advisory",
   "tasks": [
    "T4.1"
   ],
   "text": "Shots 4/T4.1-4 and -5 frame 1024/1440 as spec-issue offsets from the viewport midpoint; superseded by 4/T4.1-6 and -7 under Q7 option a."
  },
  {
   "at": "2026-11-17T09:35:56.231Z",
   "type": "advisory",
   "tasks": [
    "T4.1"
   ],
   "text": "Dashboard.vue working-tree diff also carries useStudioPromptPrefill wiring from the unrelated prefill work (3eb3a20); commit it with that work, not as phase 4."
  },
  {
   "at": "2026-11-17T09:35:56.128Z",
   "type": "advisory",
   "tasks": [
    "T4.1"
   ],
   "text": "Root bun run test: useLenis.test.ts fails deterministically (expects scrollTo offset only; source from commit 3eb3a20 now passes onComplete). Outside phase 4 files; fix the stale test."
  },
  {
   "at": "2026-11-16T12:44:00.693Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "[flaky-env] prod build regenerated apps/web/src/components.d.ts (+ProPerksDialog entry); left in place for the orchestrator"
  },
  {
   "at": "2026-11-16T12:44:00.587Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "[test-quality] 4-digit credits test writes the shared e2e user credits to Mongo (restored in finally) instead of mocking the credits response"
  },
  {
   "at": "2026-11-16T12:44:00.467Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "[flaky-env] vp check (no --fix) fails on formatting of untracked node-jiti/ cache files; phase files check clean; add node-jiti/ to .gitignore"
  },
  {
   "at": "2026-11-16T12:08:48.489Z",
   "type": "advisory",
   "tasks": [
    "T3.2"
   ],
   "text": "components.d.ts regenerates a ProPerksDialog entry on build/test; verifier reverted it; decide whether to commit"
  },
  {
   "at": "2026-11-16T12:08:48.393Z",
   "type": "advisory",
   "tasks": [
    "T3.5"
   ],
   "text": "Untracked node-jiti/ cache is the only vp check format failure; gitignore it"
  },
  {
   "at": "2026-11-16T12:08:48.298Z",
   "type": "advisory",
   "tasks": [
    "T3.4"
   ],
   "text": "Engineer report T3.4-e2e-a5.md was never written; verified from the spec and a fresh prod run instead"
  },
  {
   "at": "2026-11-16T12:08:48.186Z",
   "type": "advisory",
   "tasks": [
    "T3.4"
   ],
   "text": "Stale attempt-null shots T3.4-1..4 (Free-only, pre-settle) still in manifest; superseded by T3.4-7..14 and T3.4-5"
  },
  {
   "at": "2026-11-16T11:58:31.540Z",
   "type": "advisory",
   "tasks": [
    "T3.2"
   ],
   "text": "components.d.ts regenerates with a ProPerksDialog entry on build; decide whether to commit it (verifier reverted its own regeneration)"
  },
  {
   "at": "2026-11-16T11:58:31.446Z",
   "type": "advisory",
   "tasks": [
    "T3.4"
   ],
   "text": "plan-pill.spec.ts:118 pill-absent-until-ready asserts pill count 0 while the menu is closed; also assert header-end-skeleton visible or user-menu-trigger hidden while gated"
  },
  {
   "at": "2026-11-16T11:58:31.351Z",
   "type": "advisory",
   "tasks": [
    "T3.5"
   ],
   "text": "AUDIT.md diff is whitespace-only table reformatting (vp check --fix), outside T3 Files; revert or accept"
  },
  {
   "at": "2026-11-16T11:58:31.237Z",
   "type": "advisory",
   "tasks": [
    "T3.5"
   ],
   "text": "node-jiti/ (untracked jiti cache at repo root) is the only vp check format failure; add it to .gitignore"
  },
  {
   "at": "2026-11-16T10:46:42.591Z",
   "type": "advisory",
   "tasks": [
    "T2.4"
   ],
   "text": "[flaky-env] untracked node-jiti/ at repo root (jiti cache of tailwind config written by vitest/lint) fails vp check formatting; gitignore it"
  },
  {
   "at": "2026-11-16T10:46:42.497Z",
   "type": "advisory",
   "tasks": [
    "T2.3"
   ],
   "text": "[evidence] T2.3 proof shots have step null, no annotations and filename captions; verifier added annotated T2.1 shots"
  },
  {
   "at": "2026-11-16T10:46:42.400Z",
   "type": "advisory",
   "tasks": [
    "T2.2"
   ],
   "text": "[evidence] T2.2-unit-a1.md per-file test counts (CreditsChip 13, AppHeader 14) do not match the run (10 and 17); total 34 matches"
  },
  {
   "at": "2026-11-16T10:46:42.280Z",
   "type": "advisory",
   "tasks": [
    "T2.2"
   ],
   "text": "[test-quality] CreditsChip.test.ts:150-172 only asserts the retired upgrade-pill id is absent; also assert no Upgrade to Pro button/text so a renamed id cannot slip back in"
  },
  {
   "at": "2026-11-16T10:46:42.149Z",
   "type": "advisory",
   "tasks": [
    "T2.2"
   ],
   "text": "[type-lint] HeaderActions.test.ts:116 await on dispatchEvent (boolean) triggers typescript-eslint await-thenable warning; drop the await"
  },
  {
   "at": "2026-11-16T10:17:11.026Z",
   "type": "advisory",
   "tasks": [
    "T1.1"
   ],
   "text": "smAndUp remains only as test variable names (15 hits in *.test.ts); Verify grep apps/web/src is not literally empty"
  },
  {
   "at": "2026-11-16T10:10:20.440Z",
   "type": "advisory",
   "tasks": [
    "T1.1"
   ],
   "text": "header-responsive 700 band test cannot detect clipping under overflow-hidden; assert .dashboard-shell bottom <= viewport"
  },
  {
   "at": "2026-11-16T10:04:31.219Z",
   "type": "advisory",
   "tasks": [
    "T1.2"
   ],
   "text": "ReferralOffer.test width cases set mobile = width < 768 on mocked useMediaQuery; 767/768 labels cosmetic"
  },
  {
   "at": "2026-11-16T10:01:10.369Z",
   "type": "advisory",
   "tasks": [
    "T1.1"
   ],
   "text": "vitest/playwright create untracked node-jiti/ and playwright-transform-cache-502/ at repo root; vp check fails formatting on node-jiti; gitignore them"
  },
  {
   "at": "2026-11-16T10:01:10.301Z",
   "type": "advisory",
   "tasks": [
    "T1.3"
   ],
   "text": "Proof shots lack --step and --annotate boxes; captions generic"
  },
  {
   "at": "2026-11-16T10:01:10.227Z",
   "type": "advisory",
   "tasks": [
    "T1.4"
   ],
   "text": "Verify grep smAndUp in apps/web/src hits only test-local smAndUpRef names; scope grep to AppHeader.vue/ReferralOffer.vue, rename AppHeader.test smAndUpRef"
  },
  {
   "at": "2026-11-16T09:43:07.190Z",
   "type": "advisory",
   "tasks": [
    "T0.2"
   ],
   "text": "AUDIT row \"Feature name truncated AI I...\" cites create-360-light-free.png, which shows no feature name at all (dropdown hidden); recheck evidence in P4"
  },
  {
   "at": "2026-11-16T09:43:07.121Z",
   "type": "advisory",
   "tasks": [
    "T0.1"
   ],
   "text": "Baseline captured with a temporary Playwright spec instead of agent-browser as Do specified; shots and naming meet AC"
  }
 ],
 "activity": [
  {
   "at": "2026-11-18T11:38:09.505Z",
   "type": "deliverable",
   "tasks": [
    "T5.1",
    "T5.2",
    "T5.3",
    "T5.4"
   ],
   "text": "Header height from a single source: layout.ts constants, no 100vh-60px, prod build green",
   "files": [
    "apps/web/src/utils/layout.ts"
   ]
  },
  {
   "at": "2026-11-18T11:38:06.976Z",
   "tasks": [
    "T5.4"
   ],
   "attempt": "12",
   "type": "verify_passed",
   "evidence": "Checkpoint 5 met. prod build OK; prod e2e (x3, covers x2) 88/88; `bun run test` 218 files / 1559 tests; vp lint/check 0 errors; 100vh-60px absent; useLenis.test.ts is a test-only change",
   "fingerprint": "54d22665f87af6e610cb28376aca40b30105bdee85b6bee1dc1b3d1a5e74538f",
   "report": ".dashboard/ui-polish-picker-header/reports/phase-5-verifier-a14.md"
  },
  {
   "at": "2026-11-18T11:38:06.975Z",
   "tasks": [
    "T5.3"
   ],
   "attempt": "12",
   "type": "verify_passed",
   "evidence": "E2E_SERVER=prod header-responsive --repeat-each=3: 88 passed (1.5m), 0 flaky; dev --repeat-each=3: 88 passed (1.8m). Composer @critical 360x640/390x844, @high 768x1024/1440x900 and @medium after-dismiss each 3/3 on prod. Proof shots 5/T5.3-1,-2,-5,-6 checked; I added the missing after-dismiss shot (5/T5.3-8, prod, 390x844, full page = viewport)",
   "fingerprint": "f4dba4174b865ada76c421c47af465c512eddf054a61a779b0e2965fab2fd945",
   "report": ".dashboard/ui-polish-picker-header/reports/phase-5-verifier-a14.md"
  },
  {
   "at": "2026-11-18T11:38:06.975Z",
   "tasks": [
    "T5.2"
   ],
   "attempt": "12",
   "type": "verify_passed",
   "evidence": "3 files / 18 tests pass (with layout.test.ts); DashboardShell.vue 100/100/100/100, layout.ts 100/100/100/100, Dashboard.vue stmts 93.75 / branch 95.65 / funcs 81.81 / lines 96.55 (all >=80%); no it.fails/skip/only in the unit specs",
   "fingerprint": "0cda0f1a3376b10408134218ec3e5f66514627f1292e390c69b912521f59dcef",
   "report": ".dashboard/ui-polish-picker-header/reports/phase-5-verifier-a14.md"
  },
  {
   "at": "2026-11-18T11:38:06.974Z",
   "tasks": [
    "T5.1"
   ],
   "attempt": "12",
   "type": "verify_passed",
   "evidence": "prod `bun run build` exit 0 (was failing in a11); layout.ts:20 HEIGHT_BELOW_HEADER_CLASS is now a plain literal; dist CSS emits `.tw-h-[calc(100dvh-var(--app-header-h,64px))]{height:calc(100dvh - var(--app-header-h,64px))}` with 0 `${` occurrences; vitest Dashboard scope 43 files / 336 tests pass; vp lint + vp check 0 errors; `grep -rn \"100vh-60px\" apps/web/src` empty; composer on screen at 360/39",
   "fingerprint": "f0caa540bbb0d557bbae5d530be0e06baea3b8d4810d5ed986af1c2ec9b5cc89",
   "report": ".dashboard/ui-polish-picker-header/reports/phase-5-verifier-a14.md"
  },
  {
   "at": "2026-11-18T11:37:38.867Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "Proof shots 5/T5.3-3,-4,-7 (two-rows, four-digit) match no T5.3 scenario; captions are generic"
  },
  {
   "at": "2026-11-18T11:37:38.738Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "header-responsive.spec.ts:166 TS2488 under e2e tsconfig on spread of rail?.children (pre-existing at baseline)"
  },
  {
   "at": "2026-11-18T11:37:38.608Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "header-responsive.spec.ts:388 Explore at 390 tabs rest at y=100 after scroll, held as test.fail (out-of-scope app bug)"
  },
  {
   "at": "2026-11-18T11:37:38.451Z",
   "type": "advisory",
   "tasks": [
    "T5.2"
   ],
   "text": "Scoped T5.2 coverage cmd exits 1: global 90% functions threshold applies to the 3-file run; Dashboard.vue funcs 81.81% (per-file 80% policy met)"
  },
  {
   "at": "2026-11-18T11:32:42.510Z",
   "type": "verify_started",
   "tasks": [
    "T5.1",
    "T5.2",
    "T5.3",
    "T5.4"
   ],
   "attempt": "12"
  },
  {
   "at": "2026-11-18T11:32:40.374Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.2"
   ],
   "fingerprint": "0cda0f1a3376b10408134218ec3e5f66514627f1292e390c69b912521f59dcef"
  },
  {
   "at": "2026-11-18T11:32:40.374Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.1"
   ],
   "fingerprint": "f0caa540bbb0d557bbae5d530be0e06baea3b8d4810d5ed986af1c2ec9b5cc89"
  },
  {
   "at": "2026-11-18T11:32:36.656Z",
   "type": "dirty_snapshot",
   "tasks": [],
   "hashes": {
    "agent_docs/ui-polish-picker-header/AUDIT.md": "0910025210047b12cca8e572ee88af226701a9af",
    "agent_docs/ui-polish-picker-header/TASKS.md": "117341ca2a5f4602f834ca29be072e91e3017914",
    "apps/web/e2e/qa/header-responsive.spec.ts": "3e4c3dd2b1765104e5567e2e7d9608f58f8a0437",
    "apps/web/src/App.test.ts": "1fd1e64ff4c0ac0747b9a946d107e906a787e038",
    "apps/web/src/App.vue": "b6fdab36817f88e78282ac3a2b7c9cbe47dd2c5a",
    "apps/web/src/components/Dashboard/DashboardShell.test.ts": "35029e529221b23f576a821dc936cab0c3ab397d",
    "apps/web/src/components/Dashboard/DashboardShell.vue": "6f27e7b7451ddba1b301f224a39b028e9367e678",
    "apps/web/src/components/Header/AppHeader.vue": "7cee62dd260e50a9b298339af3b8072d38cd91fc",
    "apps/web/src/composables/useLenis.test.ts": "f365cabd2261fc158fd3a433cda749e909354be1",
    "apps/web/src/pages/Dashboard.test.ts": "87c397975b3b0d8c97f8b98ab9d235f4d7c28b0a",
    "apps/web/src/pages/Dashboard.vue": "a729ce7597dc61cf872b6a19da8d2db2675323e1",
    "apps/web/src/pages/Examples.vue": "a097a935f8e31fb432514a760eb60534230fd418",
    "apps/web/src/utils/layout.ts": "a432b838c0714fa98fb09ada6d544c8742e4f2ff",
    "apps/web/src/utils/layout.test.ts": "c62a85a11726b686ff11b8538c0c791e77e09db4"
   }
  },
  {
   "at": "2026-11-18T11:32:36.550Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.4"
   ],
   "fingerprint": "54d22665f87af6e610cb28376aca40b30105bdee85b6bee1dc1b3d1a5e74538f"
  },
  {
   "at": "2026-11-18T11:27:39.640Z",
   "type": "task_started",
   "tasks": [
    "T5.4"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-18T11:27:37.937Z",
   "type": "build_started",
   "tasks": [
    "T5.4"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-18T11:27:37.774Z",
   "type": "run_started",
   "tasks": [
    "T5.1",
    "T5.2",
    "T5.3",
    "T5.4"
   ],
   "pipeline": 2
  },
  {
   "at": "2026-11-17T10:55:47.905Z",
   "type": "question",
   "tasks": [
    "T5.4"
   ],
   "id": "Q8",
   "text": "Gate builder (attempt 3) was stopped by the user before reporting; unsure whether to resume"
  },
  {
   "at": "2026-11-17T10:55:25.143Z",
   "type": "task_started",
   "tasks": [
    "T5.4"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-17T10:55:25.013Z",
   "type": "build_started",
   "tasks": [
    "T5.4"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-17T10:55:22.103Z",
   "type": "dirty_snapshot",
   "tasks": [],
   "hashes": {
    "agent_docs/ui-polish-picker-header/AUDIT.md": "0910025210047b12cca8e572ee88af226701a9af",
    "agent_docs/ui-polish-picker-header/TASKS.md": "117341ca2a5f4602f834ca29be072e91e3017914",
    "apps/web/e2e/qa/header-responsive.spec.ts": "3e4c3dd2b1765104e5567e2e7d9608f58f8a0437",
    "apps/web/src/App.test.ts": "1fd1e64ff4c0ac0747b9a946d107e906a787e038",
    "apps/web/src/App.vue": "b6fdab36817f88e78282ac3a2b7c9cbe47dd2c5a",
    "apps/web/src/components/Dashboard/DashboardShell.test.ts": "1bc0ca303f5eaaea49c92f6876d992416db84fd5",
    "apps/web/src/components/Dashboard/DashboardShell.vue": "6f27e7b7451ddba1b301f224a39b028e9367e678",
    "apps/web/src/components/Header/AppHeader.vue": "7cee62dd260e50a9b298339af3b8072d38cd91fc",
    "apps/web/src/composables/useLenis.test.ts": "f365cabd2261fc158fd3a433cda749e909354be1",
    "apps/web/src/pages/Dashboard.test.ts": "77682e8176cd4f5fd3f88a9defdf4ba7d18775bd",
    "apps/web/src/pages/Dashboard.vue": "a729ce7597dc61cf872b6a19da8d2db2675323e1",
    "apps/web/src/pages/Examples.vue": "a097a935f8e31fb432514a760eb60534230fd418",
    "apps/web/src/utils/layout.ts": "26bb4c2598b76977a6f8cbc4626b77b8f38a53f3",
    "apps/web/src/utils/layout.test.ts": "418e6498f8fdd1b4989abc39a3b87275e45b5aae"
   }
  },
  {
   "at": "2026-11-17T10:55:21.993Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.1"
   ],
   "fingerprint": "b495e67733b1709c3a3b040d43d7e4cbc0bf3c36cc9dcf3d0558a63160789d47"
  },
  {
   "at": "2026-11-17T10:54:37.729Z",
   "type": "task_started",
   "tasks": [
    "T5.1"
   ],
   "attempt": "4"
  },
  {
   "at": "2026-11-17T10:54:37.619Z",
   "type": "build_started",
   "tasks": [
    "T5.1"
   ],
   "attempt": "4"
  },
  {
   "at": "2026-11-17T10:54:35.399Z",
   "tasks": [
    "T5.2"
   ],
   "attempt": "11",
   "type": "verify_passed",
   "evidence": "vitest DashboardShell/Dashboard/layout tests 18/18; coverage-summary.json: DashboardShell.vue 100/100/100/100, layout.ts 100/100/100/100, Dashboard.vue lines 96.55 / stmts 93.75 / branches 95.65 / funcs 81.81 (all >=80; uncovered line 124 = stubbed MobileSettingsSheet slot + v-model handler, pre-existing, justified); no it.fails/skip in unit specs",
   "fingerprint": "3e7948b3d1ebef2b5865b0dbaad15e4d148a151b0bab3fc61e001385de86dec9",
   "report": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai/.dashboard/ui-polish-picker-header/reports/phase-5-verifier-a11.md"
  },
  {
   "at": "2026-11-17T10:54:35.399Z",
   "tasks": [
    "T5.3"
   ],
   "attempt": "11",
   "type": "verify_inconclusive",
   "text": "The spec passes 88/88 x3 on E2E_SERVER=dev (1 expected-fail held as test.fail); the required prod run could not start because the build fails (T5.1). The composer scenarios cannot be confirmed on prod until the build is fixed. Proof shots 5 and 6 prove the banner-showing composer AC at 360 and 390. Shots 3, 4 and 7 match no T5.3 scenario, and no shot covers the @medium after-dismiss scenario",
   "sigs": [
    "T5.3|inconclusive|build"
   ],
   "report": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai/.dashboard/ui-polish-picker-header/reports/phase-5-verifier-a11.md"
  },
  {
   "at": "2026-11-17T10:54:35.399Z",
   "tasks": [
    "T5.4"
   ],
   "attempt": "11",
   "type": "verify_failed",
   "category": "code-bug",
   "text": "[code-bug] · Acceptance \"Repo green\" / Checkpoint 5 · Unit (218 files, 1559 tests), lint and check are green and `100vh-60px` is gone, but the production build fails (see T5.1), so the repo is not green and the e2e gate cannot run on prod · Fix T5.1, then rerun `E2E_SERVER=prod` header-responsive --repeat-each=2",
   "files": [
    "acceptance \"repo green\" / checkpoint 5"
   ],
   "sigs": [
    "T5.4|code-bug|acceptance \"repo green\" / checkpoint 5"
   ],
   "report": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai/.dashboard/ui-polish-picker-header/reports/phase-5-verifier-a11.md"
  },
  {
   "at": "2026-11-17T10:54:35.398Z",
   "tasks": [
    "T5.1"
   ],
   "attempt": "11",
   "type": "verify_failed",
   "category": "code-bug",
   "text": "[code-bug] · apps/web/src/utils/layout.ts:17 (HEIGHT_BELOW_HEADER_CLASS) · Tailwind's content scanner reads the template literal source text and emits `.tw-h-[calc(100dvh-var(${APP_HEADER_HEIGHT_VAR},${HEADER_BAR_PX}px))]`; lightningcss minify then fails (\"Unexpected token Delim('$')\"), so `vp build` (prod and e2e-preview) fails. Baseline 238d188 builds fine; the same build with the current src fa",
   "files": [
    "apps/web/src/utils/layout.ts"
   ],
   "sigs": [
    "T5.1|code-bug|apps/web/src/utils/layout.ts"
   ],
   "report": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai/.dashboard/ui-polish-picker-header/reports/phase-5-verifier-a11.md"
  },
  {
   "at": "2026-11-17T10:54:26.379Z",
   "type": "advisory",
   "tasks": [
    "T5.2"
   ],
   "text": "Scoped coverage Verify cmd exits 1 on the global 90% funcs threshold (Dashboard.vue 81.81%); per-file 80% met"
  },
  {
   "at": "2026-11-17T10:53:22.527Z",
   "type": "advisory",
   "tasks": [
    "T5.1"
   ],
   "text": "Tailwind content scans *.test.ts; real height class only generated because tests contain the literal"
  },
  {
   "at": "2026-11-17T10:53:22.420Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "TS2488 at header-responsive.spec.ts:166 (pre-existing rail children spread), not caught by verify"
  },
  {
   "at": "2026-11-17T10:53:22.306Z",
   "type": "advisory",
   "tasks": [
    "T5.3"
   ],
   "text": "Explore at 390: tabs rest at y=100 after scroll; held as test.fail() (accepted, out of scope)"
  },
  {
   "at": "2026-11-17T10:48:45.294Z",
   "type": "verify_started",
   "tasks": [
    "T5.1",
    "T5.2",
    "T5.3",
    "T5.4"
   ],
   "attempt": "11"
  },
  {
   "at": "2026-11-17T10:48:42.707Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.4"
   ],
   "fingerprint": "54d22665f87af6e610cb28376aca40b30105bdee85b6bee1dc1b3d1a5e74538f"
  },
  {
   "at": "2026-11-17T10:48:42.707Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.3"
   ],
   "fingerprint": "f4dba4174b865ada76c421c47af465c512eddf054a61a779b0e2965fab2fd945"
  },
  {
   "at": "2026-11-17T10:48:42.707Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.2"
   ],
   "fingerprint": "3e7948b3d1ebef2b5865b0dbaad15e4d148a151b0bab3fc61e001385de86dec9"
  },
  {
   "at": "2026-11-17T10:48:39.458Z",
   "type": "task_built",
   "tasks": [
    "T5.4"
   ],
   "text": "gate green: playwright x2 59 pass, verify 0 errors, 302 files/2785 tests, grep empty; useLenis.test.ts expectation fixed",
   "files": [
    "apps/web/src/composables/useLenis.test.ts"
   ]
  },
  {
   "at": "2026-11-17T10:44:39.928Z",
   "type": "task_started",
   "tasks": [
    "T5.4"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-11-17T10:44:39.756Z",
   "type": "build_started",
   "tasks": [
    "T5.4"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-11-17T10:44:39.547Z",
   "type": "answered",
   "tasks": [],
   "id": "Q-gate",
   "text": "Re gate: fix useLenis.test.ts expectation (test-only); Re Explore tabs: keep test.fail, log as advisory"
  },
  {
   "at": "2026-11-17T10:32:48.945Z",
   "type": "task_failed",
   "tasks": [
    "T5.4"
   ],
   "attempt": "1",
   "text": "bun run test: useLenis.test.ts:66 expects scrollTo offset only but useLenis.ts now passes onComplete (pre-existing from commit 3eb3a20, unrelated to this feature); rest of gate green",
   "unblock": "update expectation to { offset: -8, onComplete: expect.any(Function) }",
   "files": [
    "apps/web/src/composables/useLenis.test.ts"
   ],
   "sigs": [
    "T5.4|other|apps/web/src/composables/useLenis.test.ts"
   ]
  },
  {
   "at": "2026-11-17T10:30:02.388Z",
   "type": "task_started",
   "tasks": [
    "T5.4"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-11-17T10:29:59.950Z",
   "type": "task_built",
   "tasks": [
    "T5.3"
   ],
   "text": "e2e 29/29, x3 clean; reports 1 app bug (Explore tabs y=100) held as test.fail; spec tsc error line 166",
   "files": [
    "apps/web/e2e/qa/header-responsive.spec.ts"
   ]
  },
  {
   "at": "2026-11-17T10:24:54.284Z",
   "type": "task_started",
   "tasks": [
    "T5.3"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-17T10:24:54.156Z",
   "type": "build_started",
   "tasks": [
    "T5.3"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-17T10:24:52.175Z",
   "type": "task_failed",
   "tasks": [
    "T5.3"
   ],
   "attempt": "2",
   "text": "T4.3 test \"Explore at 390px keeps tabs at viewport top after scrolling\" fails 3/3: Explore renders empty state in e2e so nothing scrolls; needs mocked community items. 28/29 else pass",
   "unblock": "mock community items for Explore scroll test",
   "files": [
    "apps/web/e2e/qa/header-responsive.spec.ts"
   ],
   "sigs": [
    "T5.3|e2e-fixture|apps/web/e2e/qa/header-responsive.spec.ts"
   ]
  },
  {
   "at": "2026-11-17T10:22:16.171Z",
   "type": "task_started",
   "tasks": [
    "T5.3"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-11-17T10:22:16.044Z",
   "type": "build_started",
   "tasks": [
    "T5.3"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-11-17T10:22:13.786Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.1"
   ],
   "fingerprint": "bcfb608d38dccecabdeb47e3867123de455fe673ef71f9997027eac6f3f7077c"
  },
  {
   "at": "2026-11-17T10:21:24.501Z",
   "type": "task_started",
   "tasks": [
    "T5.1"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-17T10:21:24.377Z",
   "type": "build_started",
   "tasks": [
    "T5.1"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-17T10:21:22.093Z",
   "type": "task_failed",
   "tasks": [
    "T5.1"
   ],
   "attempt": "2",
   "text": "e2e (T5.3 report) shows --app-header-h omits the 36px mobile banner: 136px vs 172px at 390x844/360x640, composer overflows viewport",
   "unblock": "make --app-header-h include banner height",
   "files": [
    "apps/web/src/components/Header/AppHeader.vue"
   ],
   "sigs": [
    "T5.1|other|apps/web/src/components/Header/AppHeader.vue"
   ]
  },
  {
   "at": "2026-11-17T10:21:17.152Z",
   "type": "task_failed",
   "tasks": [
    "T5.3"
   ],
   "attempt": "1",
   "text": "App bug: --app-header-h is 136px not 172px with 36px mobile banner at 390/360; composer overflows (shell ends 880 in 844 viewport). 3 tests test.fail(); also T4.3 Explore 390px tabs test fails 3/3 and tsc error at spec line 129",
   "unblock": "Fix header height var to include banner, then remove test.fail markers",
   "files": [
    "apps/web/e2e/qa/header-responsive.spec.ts",
    "apps/web/src/components/Header/AppHeader.vue"
   ]
  },
  {
   "at": "2026-11-17T10:17:59.639Z",
   "type": "task_started",
   "tasks": [
    "T5.3"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-11-17T10:17:59.508Z",
   "type": "task_built",
   "tasks": [
    "T5.2"
   ],
   "text": "unit PASS: lowest file 96.55% lines, shuffle clean",
   "files": [
    "apps/web/src/components/Dashboard/DashboardShell.test.ts",
    "apps/web/src/pages/Dashboard.test.ts"
   ]
  },
  {
   "at": "2026-11-17T10:17:26.478Z",
   "type": "task_started",
   "tasks": [
    "T5.2"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-11-17T10:17:26.355Z",
   "type": "build_started",
   "tasks": [
    "T5.2",
    "T5.3",
    "T5.4"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-11-17T10:17:22.131Z",
   "type": "preflight_passed",
   "tasks": [
    "T5.1"
   ],
   "fingerprint": "542ec705f1543912ec0a1996404754a2127be36cb3774f32ee8167b2b782fab5"
  },
  {
   "at": "2026-11-17T10:16:52.888Z",
   "type": "task_started",
   "tasks": [
    "T5.1"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-11-17T10:16:52.747Z",
   "type": "build_started",
   "tasks": [
    "T5.1"
   ],
   "attempt": "2"
  }
 ]
};
