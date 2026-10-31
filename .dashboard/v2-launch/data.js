window.DASHBOARD = {
 "generatedAt": "2026-10-31T10:21:11.220Z",
 "feature": {
  "slug": "v2-launch",
  "title": "Visual AI V2 Launch Bundle"
 },
 "tasksFile": "agent_docs/v2-launch/TASKS.md",
 "projectRoot": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai",
 "docs": [
  {
   "name": "PLAN",
   "href": "docs/PLAN.html",
   "source": "agent_docs/v2-launch/PLAN.md"
  },
  {
   "name": "SPEC",
   "href": "docs/SPEC.html",
   "source": "agent_docs/v2-launch/SPEC.md"
  },
  {
   "name": "TASKS",
   "href": "docs/TASKS.html",
   "source": "agent_docs/v2-launch/TASKS.md"
  }
 ],
 "totals": {
  "phases": 6,
  "tasks": 53,
  "byStatus": {
   "verified": 52,
   "ready": 1
  }
 },
 "phases": [
  {
   "id": "0",
   "name": "Test harness and e2e server mode",
   "startLine": 12,
   "endLine": 51,
   "adds": "Test-infrastructure only: an opt-in production-server mode for Playwright and the missing gitignore entries. No user-facing change.",
   "tryInUi": [
    "No UI. Run `cd apps/web && E2E_SERVER=prod E2E_PROD_PORT=4173 bunx playwright test --list`",
    "run `git check-ignore -v apps/web/.next-e2e .dashboard/x/reports/a coverage/a` and confirm all are ignored."
   ],
   "checkpoint": {
    "title": "Checkpoint 0",
    "line": 48,
    "items": [
     "Playwright prod-server mode is selectable and artifacts are ignored; default e2e behaviour unchanged."
    ]
   },
   "tasks": [
    {
     "id": "T0.1",
     "title": "Setup: e2e prod-server mode",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [
      "apps/web/playwright.config.ts",
      "apps/web/e2e/README.md"
     ],
     "gherkin": null,
     "do": "Add `E2E_SERVER=dev|prod` selection. Unset or `dev` keeps today's behaviour (no `webServer`; app already running, never started by tests). `prod` sets `webServer` to build then `vp preview` on `E2E_PROD_PORT` with `reuseExistingServer: false` and points `baseURL` at it. Document the convention in `e2e/README.md`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Default run (no env) is behaviourally unchanged.",
      "`E2E_SERVER=prod` config resolves a `webServer` with the build + preview command and `reuseExistingServer: false`.",
      "`e2e/README.md` documents `E2E_SERVER` and `E2E_PROD_PORT`."
     ],
     "verify": [
      "`cd apps/web && bunx playwright test --list` lists specs with no env set.",
      "`cd apps/web && bun -e \"const c=(await import('./playwright.config.ts')).default; if (c.webServer) process.exit(1)\"` exits 0 (default has no `webServer`).",
      "`cd apps/web && E2E_SERVER=prod E2E_PROD_PORT=4173 bun -e \"const c=(await import('./playwright.config.ts')).default; const w=[].concat(c.webServer ?? [])[0]; if (!w || w.reuseExistingServer !== false || !String(w.url ?? w.port).includes('4173')) process.exit(1)\"` exits 0 (fails on today's config).",
      "`cd apps/web && E2E_SERVER=prod E2E_PROD_PORT=4173 bunx playwright test --list` loads without config error (do not run the suite).",
      "grep -q E2E_PROD_PORT apps/web/e2e/README.md && grep -q E2E_SERVER apps/web/e2e/README.md",
      "bun run check"
     ],
     "line": 21,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T15:11:24.098Z"
    },
    {
     "id": "T0.2",
     "title": "Gitignore check",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [
      ".gitignore"
     ],
     "gherkin": null,
     "do": "Add any missing: `test-results/`, `playwright-report/`, `coverage/`, `.dashboard/*/reports/`, `.next-e2e` (also `apps/web/.next-e2e`).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All five patterns are ignored at the repo root and under `apps/web`; no tracked file becomes ignored."
     ],
     "verify": [
      "`for p in test-results/a playwright-report/a coverage/a .dashboard/x/reports/a .next-e2e apps/web/test-results/a apps/web/playwright-report/a apps/web/coverage/a apps/web/.next-e2e; do git check-ignore -q \"$p\" || echo \"MISSING $p\"; done` prints nothing (fails on today's repo).",
      "`git ls-files -ci --exclude-standard` prints nothing (no tracked file is ignored)."
     ],
     "line": 38,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T15:11:24.098Z"
    }
   ],
   "verified": 2,
   "total": 2,
   "complete": true
  },
  {
   "id": "1",
   "name": "Modifications",
   "startLine": 52,
   "endLine": 258,
   "adds": "New accounts and referrals get 30 credits (copy follows the constants), reference images in the prompt bar are actually sent to the model (up to the model's max), the favicon matches the logo, and the referral dialog is redesigned.",
   "tryInUi": [
    "Open the referral dialog in dark and light themes and copy the code",
    "pick a multi-image model, add 8 reference images and confirm a 9th is blocked, then generate",
    "switch to a single-image then a no-image model and watch the toasts",
    "compare the browser tab icon with the header logo."
   ],
   "checkpoint": {
    "title": "Checkpoint 1",
    "line": 255,
    "items": [
     "30-credit grants and copy consistent, reference images reach Replicate in the right shape, favicon and referral dialog verified in both themes and at 375px."
    ]
   },
   "tasks": [
    {
     "id": "T1.1",
     "title": "Credits constants and referral grant",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/shared/src/models/credits.ts",
      "apps/api/src/routes/users.ts",
      "apps/api/src/routes/users.test.ts (existing assertions only)"
     ],
     "gherkin": null,
     "do": "SIGNUP_CREDITS and REFERRAL_BONUS to 30 (DAILY_CREDITS stays 30). Replace both hardcoded `$inc: { credits: 50 }` (about lines 176 and 190) with `REFERRAL_BONUS`. Audit the signup path for other literals. No migration, nothing touches existing balances. Rebuild shared.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "New user schema default is 30 (via `SIGNUP_CREDITS`).",
      "Referral `$inc` for both parties equals `REFERRAL_BONUS`.",
      "`grep -rn \"credits: 50\" apps/api/src` is empty; no script or migration alters existing `credits`."
     ],
     "verify": [
      "bun --cwd packages/shared run build",
      "`grep -rn \"credits: 50\" apps/api/src` returns nothing",
      "`bun --cwd apps/api run test -- users` (existing assertions that hard-code 50 updated to the constant)",
      "bun run check"
     ],
     "line": 57,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.2",
     "title": "Copy derives from constants (web source)",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dialogs/ReferralOfferDialog.vue",
      "apps/web/src/components/Dialogs/ReferralCopyDialog.vue",
      "apps/web/src/utils/featureLandings.ts",
      "apps/web/src/utils/seo.ts"
     ],
     "gherkin": null,
     "do": "Interpolate `SIGNUP_CREDITS` / `REFERRAL_BONUS` from `@visual-ai/shared` in dialog copy (\"50 free credits\", \"50 bonus credits\", \"Give 50 credits and earn 50 credits\"), the FAQ in `featureLandings.ts` and the JSON-LD built via `seo.ts`. Do not touch `creditPacks.ts`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "No literal 50 for signup/referral remains in these files; rendered values follow the constants."
     ],
     "verify": [
      "`grep -rniE \"\\b50 (free |bonus )?credits\" apps/web/src` shows no signup/referral hits",
      "bun run check"
     ],
     "line": 72,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.3",
     "title": "Copy derives from constants (static files and stale assertions)",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/public/pricing.md",
      "apps/web/public/llms.txt",
      "apps/web/src/utils/seo.test.ts",
      "apps/web/src/components/Dialogs/ReferralOfferDialog.test.ts"
     ],
     "gherkin": null,
     "do": "Edit the Signup row in `pricing.md:11` and any matching `llms.txt` text to 30. Update existing assertions in `seo.test.ts` and `ReferralOfferDialog.test.ts` that hard-code 50 so they compare to the shared constants (new coverage goes in Unit tasks). Rebuild prerender via `bun run build:web`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "SPEC MOD-2 grep returns nothing referring to signup/referral; credit-pack copy untouched; existing tests green."
     ],
     "verify": [
      "`grep -rniE \"\\b50 (free |bonus )?credits\" apps packages --exclude-dir=node_modules --exclude-dir=dist` shows nothing signup/referral related",
      "bun run test",
      "bun run build:web"
     ],
     "line": 82,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.4",
     "title": "Shared image limits and reference-image upload endpoint",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/shared/src/models/image-limits.ts (new",
      "exported from shared index)",
      "apps/api/src/middlewares/multer.ts",
      "apps/api/src/routes/generate.ts",
      "apps/web/src/composables/useImageDrop.ts"
     ],
     "gherkin": null,
     "do": "Move `MAX_IMAGE_BYTES` (5 MB) and accepted types (jpeg/png/webp) to shared. Add `POST /generate/reference-images` with `requireAuth` applied on the route itself (`generateRoute` is mounted before router-level auth at `routes/index.ts:16`), using Cloudinary `upload.array(\"images\", max)` and the shared limits; returns `{ urls: string[] }`. `useImageDrop.ts` imports the shared constants. Rebuild shared.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "401 when unauthenticated; 400 for wrong type, oversize, or more files than allowed; success returns Cloudinary URLs.",
      "Client and API use the same constants (no duplicate literal)."
     ],
     "verify": [
      "bun --cwd packages/shared run build",
      "bun --cwd apps/api run test -- generate",
      "bun run check"
     ],
     "line": 93,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.5",
     "title": "Registry `imageInput.array` and input shaping",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/shared/src/models/types.ts (ModelDefinition.fields.imageInput",
      "~line 77)",
      "packages/shared/src/models/registry.ts",
      "apps/api/src/lib/model-input.ts",
      "docs/MODEL_ONBOARDING.md"
     ],
     "gherkin": null,
     "do": "Add explicit `imageInput.array: boolean` to `ModelDefinition.fields.imageInput`. Set it per model from its verified Replicate schema (check each schema; only the `max: 8` model, `input_images`, is multi-image unless a schema proves otherwise). `buildModelInput` writes `input[inputKey]` as an array or a string by the flag, never inferred from `max`. Update `MODEL_ONBOARDING.md`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Array model receives an array; string model receives a string; zero URLs omits the key.",
      "Each model's flag is justified by its schema (note the source in the PR description or `MODEL_ONBOARDING.md`)."
     ],
     "verify": [
      "bun run check:model-docs",
      "bun --cwd apps/api run test -- model-input",
      "bun --cwd packages/shared run build"
     ],
     "line": 106,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.6",
     "title": "`referenceImageUrls` through route, queue and service",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/routes/generate.ts",
      "apps/api/src/queue/generation-queue.ts (job data type)",
      "apps/api/src/queue/generation-worker.ts",
      "apps/api/src/services/generation-service.ts"
     ],
     "gherkin": null,
     "do": "Accept optional `referenceImageUrls: string[]` on `POST /generate/image`. Validate count <= model `imageInput.max ?? 1`, and that every URL is our Cloudinary origin, returning 400 before any credit deduction. Thread the URLs through the queue job data to `generation-service.ts` (~line 353) and into `buildModelInput`. Field optional so old clients work.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Invalid URL, wrong host, over-max, or model without `imageInput` returns 400 and deducts nothing.",
      "Valid URLs reach `buildModelInput`; request without the field behaves exactly as before."
     ],
     "verify": [
      "bun --cwd apps/api run test -- generate",
      "bun --cwd apps/api run test -- generation-service",
      "bun run check"
     ],
     "line": 119,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.7",
     "title": "Reference images store: array, trim, upload-then-send",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/stores/aside.ts",
      "apps/web/src/stores/generate.ts"
     ],
     "gherkin": null,
     "do": "Root cause first (MOD-3.0): confirm whether selecting a model from the left-sidebar picker updates `aside.mode`/`supportsImageInput`; fix if not. Replace `referenceImage` with `referenceImages: ReferenceImage[]`, add `imageInputMax` (`max ?? 1`), revoke object URLs on remove/clear. Model switch replaces the silent clear (~line 152): lower max keeps the first N with a toast naming the removed count; no imageInput clears all with a toast; equal/higher keeps all, no toast. `generateImage()` uploads files to `POST /generate/reference-images` then sends `referenceImageUrls`. Upload failure shows an error toast, sends no generation, deducts no credits. Removing an image while its upload is in flight drops it from `referenceImageUrls` (SPEC MOD-3 edge case). Orphaned Cloudinary uploads after a failed generation are acceptable (note in code comment).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All three model-switch branches behave as above; zero images still generates.",
      "Object URLs are revoked on remove, clear and trim.",
      "Failed upload: no generate request issued.",
      "An image removed during upload is not sent."
     ],
     "verify": [
      "bun --cwd apps/web run test -- aside generate",
      "bun run check"
     ],
     "line": 132,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.8",
     "title": "Prompt bar multi-image UI",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/Composer/PromptBar.vue",
      "apps/web/src/components/Dashboard/Composer/ReferenceImageControl.vue",
      "apps/web/src/components/Dashboard/Composer/ReferenceThumbnails.vue (new",
      "extracted strip)"
     ],
     "gherkin": null,
     "do": "Enable the control when the model has `imageInput`; keep disabled + tooltip (`data-testid=\"reference-image-disabled\"`) otherwise. Thumbnail strip with an accessible per-image remove button; multi-select picker when `max > 1`; extras beyond max rejected with an inline \"This model accepts up to N images\"; wrong type/oversize messages from shared limits. Same file added twice is allowed. Add `data-testid`s for the QA spec.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Max-8 model accepts 8 and blocks a 9th with the inline message.",
      "Each thumbnail has a labelled remove button reachable by keyboard.",
      "Disabled state retained for non-imageInput models."
     ],
     "verify": [
      "bun --cwd apps/web run test -- Composer",
      "bun run check",
      "Seeded QA spec from T1.14: `cd apps/web && bunx playwright test e2e/qa/mods-reference-image.spec.ts --repeat-each=2`"
     ],
     "line": 146,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.9",
     "title": "Favicon refresh",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/public/{favicon.ico",
      "favicon.svg",
      "apple-touch-icon.png",
      "icon-192.png",
      "icon-512.png} (one generated icon set from a single master SVG)",
      "apps/web/public/site.webmanifest",
      "apps/web/index.html"
     ],
     "gherkin": null,
     "do": "Compare `favicon.ico`, `logo.svg`, `index.html` links against `Header/LogoMark.vue` (copper V on #1c1713 rounded square). If mismatched, render a master SVG and generate `favicon.ico` (16/32/48), `favicon.svg`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` (generated PNGs also under `apps/web/public/`); use `sharp` as a dev-only one-off (ask-first dependency, do not add to runtime). Add `site.webmanifest` (none exists) with theme color; add a versioned query to icon links in `index.html`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Icons visually match the header logo mark.",
      "Every referenced icon/manifest URL returns 200.",
      "`index.html` links reference versioned URLs; build regenerates prerendered pages with them.",
      "Lighthouse reports no icon/manifest warnings (SPEC MOD-4)."
     ],
     "verify": [
      "`cd apps/web && bunx playwright test e2e/qa/mods-referral-favicon.spec.ts --repeat-each=2` (icon requests 200)",
      "bun run build:web",
      "`lighthouse-cli` skill against the running web URL: no icon/manifest warnings",
      "Visual comparison of tab icon vs header logo: `agent-browser: screenshot of header logo and favicon.svg` (exploratory only)"
     ],
     "line": 160,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:54.522Z"
    },
    {
     "id": "T1.10",
     "title": "ReferralOfferDialog redesign",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dialogs/ReferralOfferDialog.vue",
      "apps/web/src/components/AppModal.vue (only if needed)"
     ],
     "gherkin": null,
     "do": "Redesign using the `impeccable` and `layout` skills on `AppModal.vue`, semantic tokens only (no hex). Fix: flat mustard slab, low-contrast body, off-token tan copy button, duplicate close affordances (default: drop the \"Close\" pill). Content: headline from `REFERRAL_BONUS` (\"you both get 30 free credits\"), code in a code well, \"Copy code\" button with \"Copied\" feedback (aria-live polite, reverts after ~2s), short how-it-works line. No new features. A11y: `role=\"dialog\"`, `aria-labelledby`/`describedby`, focus trap and restore, Esc closes, contrast >= 4.5:1, 44px targets, reduced motion respected. Add stable `data-testid`s.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "No hardcoded hex in the component.",
      "Single close affordance; Copy writes the code to the clipboard and shows \"Copied\" then reverts.",
      "Dark, light and 375px layouts verified; axe check clean."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/mods-referral-favicon.spec.ts --repeat-each=2",
      "`grep -nE \"#[0-9a-fA-F]{3,8}\" apps/web/src/components/Dialogs/ReferralOfferDialog.vue` returns nothing",
      "bun --cwd apps/web run test -- ReferralOfferDialog"
     ],
     "line": 176,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.11",
     "title": "Unit: API credits and reference-image wiring",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/routes/users.ts",
      "apps/api/src/routes/generate.ts",
      "apps/api/src/lib/model-input.ts",
      "apps/api/src/services/generation-service.ts",
      "apps/api/src/middlewares/multer.ts"
     ],
     "gherkin": null,
     "do": "Cover the new/changed logic per T1.1, T1.4, T1.5, T1.6 (referral `$inc` equals `REFERRAL_BONUS` for both parties; 401/400 paths of the upload endpoint with mocked Cloudinary; array vs string input per model; zero images; non-Cloudinary URL 400 before credit deduction; over-max 400).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% lines/branches/functions/statements (repo threshold), target > 95%; no `it.fails` unless the source has a real bug."
     ],
     "verify": [
      "cd apps/api && bunx vitest run src/routes/users.test.ts src/routes/generate.test.ts src/lib/model-input.test.ts src/services/generation-service.test.ts --coverage --coverage.include=src/routes/users.ts --coverage.include=src/routes/generate.ts --coverage.include=src/lib/model-input.ts --coverage.include=src/services/generation-service.ts --coverage.include=src/middlewares/multer.ts --coverage.reporter=text"
     ],
     "line": 190,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.12",
     "title": "Unit: web reference images",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/stores/aside.ts",
      "apps/web/src/stores/generate.ts",
      "apps/web/src/composables/useImageDrop.ts",
      "apps/web/src/components/Dashboard/Composer/ReferenceImageControl.vue",
      "apps/web/src/components/Dashboard/Composer/ReferenceThumbnails.vue"
     ],
     "gherkin": null,
     "do": "Cover trim logic (lower max, no imageInput, equal/higher), over-max rejection, URL revocation, upload-failure aborts generation, image removed during upload not sent, wrong type/size messages, control enabled/disabled state, remove button accessibility.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%; no `it.fails` unless real bug."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/stores/aside.test.ts src/stores/generate.test.ts src/composables/useImageDrop.test.ts src/components/Dashboard/Composer --coverage --coverage.include=src/stores/aside.ts --coverage.include=src/stores/generate.ts --coverage.include=src/composables/useImageDrop.ts --coverage.include=src/components/Dashboard/Composer/ReferenceImageControl.vue --coverage.include=src/components/Dashboard/Composer/ReferenceThumbnails.vue --coverage.reporter=text"
     ],
     "line": 198,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.13",
     "title": "Unit: referral dialogs and constant-driven copy",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dialogs/ReferralOfferDialog.vue",
      "apps/web/src/components/Dialogs/ReferralCopyDialog.vue",
      "apps/web/src/utils/featureLandings.ts",
      "apps/web/src/utils/seo.ts"
     ],
     "gherkin": null,
     "do": "Assert rendered credit values equal `SIGNUP_CREDITS`/`REFERRAL_BONUS`; clipboard write, \"Copied\" feedback via fake timers (reverts ~2s), single close, Esc closes, aria attributes; FAQ and JSON-LD use constants.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/components/Dialogs/ReferralOfferDialog.test.ts src/components/Dialogs/ReferralCopyDialog.test.ts src/utils/seo.test.ts src/utils/featureLandings.test.ts --coverage --coverage.include=src/components/Dialogs/ReferralOfferDialog.vue --coverage.include=src/components/Dialogs/ReferralCopyDialog.vue --coverage.include=src/utils/featureLandings.ts --coverage.include=src/utils/seo.ts --coverage.reporter=text"
     ],
     "line": 206,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.14",
     "title": "E2E: reference image flow",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`e2e/qa/mods-reference-image.spec.ts` (seeded; includes any seed data it needs; intercepts the upload and generate routes)",
     "filesDeclared": true,
     "acceptance": [
      "Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/mods-reference-image.spec.ts --repeat-each=3"
     ],
     "line": 214,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.15",
     "title": "E2E: referral dialog, credits copy and favicon",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`e2e/qa/mods-referral-favicon.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/mods-referral-favicon.spec.ts --repeat-each=3"
     ],
     "line": 229,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    },
    {
     "id": "T1.16",
     "title": "Gate: Phase 1",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run the full Phase 1 evidence, reviewing each AC above; confirm shared `dist` is rebuilt and an existing user's balance is untouched (no script modifies `credits`).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All Phase 1 task AC met; MOD-2 grep clean; real generation with a reference image is checked manually by the user at the checkpoint (note: needs the user, since it spends credits)."
     ],
     "verify": [
      "bun --cwd packages/shared run build",
      "`bun run test` and `bun --cwd apps/api run test`",
      "`bun run verify` and `bun run check:model-docs`",
      "cd apps/web && bunx playwright test e2e/qa/mods-reference-image.spec.ts e2e/qa/mods-referral-favicon.spec.ts --repeat-each=2",
      "grep -rniE \"\\b50 (free |bonus )?credits\" apps packages --exclude-dir=node_modules --exclude-dir=dist"
     ],
     "line": 242,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-27T18:20:47.746Z"
    }
   ],
   "verified": 16,
   "total": 16,
   "complete": true
  },
  {
   "id": "2",
   "name": "Speech-to-text in the prompt bar",
   "startLine": 259,
   "endLine": 376,
   "adds": "A mic button in the prompt bar that dictates into the prompt using the browser's speech recognition or the Grok transcription service, with a live waveform and clear errors.",
   "tryInUi": [
    "Click the mic in the prompt bar, speak, and watch text append to the prompt",
    "open the chevron and switch the engine (Firefox defaults to Grok)",
    "record past 50s and see the countdown and auto-stop",
    "deny mic permission and read the error message."
   ],
   "checkpoint": {
    "title": "Checkpoint 2",
    "line": 373,
    "items": [
     "Mic works with both engines under mocks, API hardened (auth, rate limit, limits, timeouts), Phase 1 behaviour intact."
    ]
   },
   "tasks": [
    {
     "id": "T2.1",
     "title": "STT constants, rate limiter and env",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/shared/src/models/stt.ts (new: STT_MAX_CLIP_SECONDS",
      "STT_RATE_LIMIT",
      "STT_MAX_BYTES)",
      "apps/api/src/middlewares/rate-limit.ts",
      "apps/api/src/config/env.ts",
      "apps/api/.env.example",
      "apps/api/package.json"
     ],
     "gherkin": null,
     "do": "Add the shared constants. Add `express-rate-limit` and `rate-limit-redis` (both SPEC-listed; the store is chosen at runtime) and a per-user limiter keyed by `req.auth.userId` (Redis store via `config/redis.ts` when configured, else memory). Add optional `XAI_API_KEY` to the env zod schema and `.env.example`; API must still boot without it.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Limiter allows 20 requests per 10 minutes per user then returns 429 with `Retry-After`; boot works with `XAI_API_KEY` unset."
     ],
     "verify": [
      "bun install",
      "bun --cwd packages/shared run build",
      "bun --cwd apps/api run test -- rate-limit",
      "bun run check"
     ],
     "line": 266,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-28T12:40:22.768Z"
    },
    {
     "id": "T2.2",
     "title": "`POST /stt` route",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/routes/stt.ts",
      "apps/api/src/routes/index.ts"
     ],
     "gherkin": null,
     "do": "`requireAuth`, audio multer (`audio/*` plus `video/webm`, 5 MB cap), the limiter, forward to `https://api.x.ai/v1/stt` with `file` appended last, 30s upstream timeout, return `{ text }` only. 503 when `XAI_API_KEY` unset. Never log audio or the key.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "401 unauthenticated; 429 over limit; 413 oversize; 400 bad type; 502 upstream failure/timeout; 503 key unset; `file` is the last multipart field; body contains only `text`."
     ],
     "verify": [
      "bun --cwd apps/api run test -- stt",
      "`grep -rn \"XAI_API_KEY\" apps/web` returns nothing (key stays server-side)",
      "bun run check"
     ],
     "line": 278,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-28T12:40:22.768Z"
    },
    {
     "id": "T2.3",
     "title": "Grok recording path and mic button",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/composables/useGrokRecorder.ts",
      "apps/web/src/composables/useVoiceInput.ts",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue",
      "apps/web/src/components/Dashboard/Composer/PromptBar.vue",
      "apps/web/src/components/Dashboard/Composer/ComposerTextarea.vue"
     ],
     "gherkin": null,
     "do": "FontAwesome microphone button on the right of the prompt bar (`aria-label`, `aria-pressed`, `data-testid`, and `data-tour=\"mic\"` for the Phase 3 tour, INTRO-6). `useGrokRecorder`: MediaRecorder preferring `audio/webm;codecs=opus`, fallback `audio/mp4`; on stop upload to `${VITE_API_BASEPATH}/stt` (API routes have no `/api` prefix), append returned text (separator handled, existing text never replaced, text typed meanwhile preserved); \"Transcribing...\" state disables the mic; cancel supported; 60s auto-stop with countdown from 10s; error mapping per STT-8 (permission denied, no device, empty text, network, 5xx/timeout, 429 with Retry-After minutes, unsupported) shown via toast/inline, never silent. Concurrent recordings blocked.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Append-not-replace; auto-stop at `STT_MAX_CLIP_SECONDS`; every error branch surfaces a message; mic disabled while transcribing."
     ],
     "verify": [
      "bun --cwd apps/web run test -- useGrokRecorder useVoiceInput MicButton",
      "bun run check",
      "cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=2"
     ],
     "line": 289,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-28T13:13:44.043Z"
    },
    {
     "id": "T2.4",
     "title": "Web Speech engine and engine menu",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/composables/useWebSpeech.ts",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/EngineMenu.vue",
      "apps/web/src/composables/useVoiceInput.ts",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue"
     ],
     "gherkin": null,
     "do": "`useWebSpeech`: continuous with interim results previewed live and committed on finalize, appended to existing text, `lang` from `navigator.language`. Chevron menu (Web Speech / Grok), engine persisted in localStorage (try/catch, SSR-safe). If `SpeechRecognition`/`webkitSpeechRecognition` is missing: default to Grok and show Web Speech disabled with \"Not supported in this browser\". Privacy note near the menu that Chrome sends audio to Google. Menu disabled while recording.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Engine choice persists across reload; fallback default is Grok when unsupported; interim text never replaces existing prompt text."
     ],
     "verify": [
      "bun --cwd apps/web run test -- useWebSpeech EngineMenu",
      "bun run check",
      "cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=2"
     ],
     "line": 300,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-28T13:13:44.043Z"
    },
    {
     "id": "T2.5",
     "title": "Waveform and accessibility polish",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/composables/useAudioLevel.ts",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/Waveform.vue",
      "apps/web/src/composables/useVoiceInput.ts",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue"
     ],
     "gherkin": null,
     "do": "`useAudioLevel` (getUserMedia + AnalyserNode + rAF; stop tracks and close AudioContext on stop/unmount). `Waveform.vue` animates with live volume; `prefers-reduced-motion` uses an opacity-only level meter. aria-live announces \"Recording\"/\"Transcribing\"; Esc cancels; visible focus ring; recording stops when the tab is hidden or model/route changes. If a second `getUserMedia` for Web Speech conflicts, fall back to a non-reactive indicator.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "No leaked tracks or AudioContext after stop/unmount; reduced-motion variant renders; Esc cancels; visibility change stops recording."
     ],
     "verify": [
      "bun --cwd apps/web run test -- useAudioLevel Waveform",
      "bun run check",
      "cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=2"
     ],
     "line": 311,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-28T13:13:44.043Z"
    },
    {
     "id": "T2.6",
     "title": "Unit: STT API",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/routes/stt.ts",
      "apps/api/src/middlewares/rate-limit.ts",
      "apps/api/src/config/env.ts"
     ],
     "gherkin": null,
     "do": "Mock xAI. Cover 401, 429 (Retry-After), 413, 400, 502, 503, field order (`file` last), response shape, limiter keyed per user and window reset (fake timers), env optional key.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/api && bunx vitest run src/routes/stt.test.ts src/middlewares/rate-limit.test.ts src/config/env.test.ts --coverage --coverage.include=src/routes/stt.ts --coverage.include=src/middlewares/rate-limit.ts --coverage.include=src/config/env.ts --coverage.reporter=text"
     ],
     "line": 322,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-28T12:40:22.768Z"
    },
    {
     "id": "T2.7",
     "title": "Unit: voice composables",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/composables/useVoiceInput.ts",
      "apps/web/src/composables/useGrokRecorder.ts",
      "apps/web/src/composables/useWebSpeech.ts",
      "apps/web/src/composables/useAudioLevel.ts"
     ],
     "gherkin": null,
     "do": "Mock `getUserMedia`, `MediaRecorder`, `SpeechRecognition`, AudioContext. Cover append-not-replace, engine persistence/fallback, 60s auto-stop (fake timers), every STT-8 error branch, mime fallback, cleanup, concurrent block, typing during transcribe.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/composables/useVoiceInput.test.ts src/composables/useGrokRecorder.test.ts src/composables/useWebSpeech.test.ts src/composables/useAudioLevel.test.ts --coverage --coverage.include=src/composables/useVoiceInput.ts --coverage.include=src/composables/useGrokRecorder.ts --coverage.include=src/composables/useWebSpeech.ts --coverage.include=src/composables/useAudioLevel.ts --coverage.reporter=text"
     ],
     "line": 330,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-28T12:40:22.768Z"
    },
    {
     "id": "T2.8",
     "title": "Unit: voice components",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/EngineMenu.vue",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/Waveform.vue"
     ],
     "gherkin": null,
     "do": "aria-pressed/aria-live states, disabled while transcribing, disabled Web Speech option text, menu disabled while recording, reduced-motion variant, keyboard operation and Esc.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/components/Dashboard/Composer/VoiceInput --coverage --coverage.include=src/components/Dashboard/Composer/VoiceInput/MicButton.vue --coverage.include=src/components/Dashboard/Composer/VoiceInput/EngineMenu.vue --coverage.include=src/components/Dashboard/Composer/VoiceInput/Waveform.vue --coverage.reporter=text"
     ],
     "line": 338,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-28T12:40:22.768Z"
    },
    {
     "id": "T2.9",
     "title": "E2E: voice input",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`e2e/qa/voice-input.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=3"
     ],
     "line": 346,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-28T12:40:22.768Z"
    },
    {
     "id": "T2.10",
     "title": "Gate: Phase 2",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run all evidence; Phase 1 regression suite must stay green. Real-microphone dictation in Chrome and the Firefox default-to-Grok check cannot be automated here and are left to the user at the checkpoint.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All Phase 2 AC met; STT-6 free (no credit check); key absent from web bundle."
     ],
     "verify": [
      "`bun run test` and `bun --cwd apps/api run test`",
      "bun run verify",
      "cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=2",
      "`bun run build:web` then `grep -rn \"XAI_API_KEY\" apps/web/src apps/web/dist` returns nothing"
     ],
     "line": 361,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-28T12:40:22.768Z"
    }
   ],
   "verified": 10,
   "total": 10,
   "complete": true
  },
  {
   "id": "3",
   "name": "V2 intro (carousel and tour)",
   "startLine": 377,
   "endLine": 540,
   "adds": "A one-time \"What's new in V2\" large split modal per account (10 feature slides with short video loops, clickable jump-to list, icon prev/next navigation) with an optional guided tour, reopenable from the user menu; plus mic polish (stop icon, pill waveform, spinner, silence and empty-transcript toasts).",
   "tryInUi": [
    "Sign in with an account that has not seen it and see the modal once",
    "dismiss, reload and confirm it stays gone",
    "open the user menu and choose \"What's new\"",
    "click a feature in the list to jump, use the chevron icons to step through all 10",
    "click \"Show me around\" on the last slide and step through the tour",
    "click the mic, see the stop icon and pill waveform, stop and see the spinner, and record silence to see the \"We didn't hear anything\" toast."
   ],
   "checkpoint": {
    "title": "Checkpoint 3",
    "line": 537,
    "items": [
     "Intro shows once per account in the large split modal with 10 video-loop slides, reopens from the menu, tour degrades gracefully, mic polish (stop icon, pill waveform, spinner, silence and empty toasts) verified, size budgets met; clips final."
    ]
   },
   "tasks": [
    {
     "id": "T3.1",
     "title": "Intro-seen persistence",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/shared/src/models/intro.ts (new: CURRENT_INTRO_VERSION = 'v2'",
      "KNOWN_INTRO_VERSIONS)",
      "apps/api/src/models/user.ts (locate with grep",
      "adds seenIntroVersion: { type: String",
      "default: null })",
      "apps/api/src/routes/users.ts",
      "packages/shared/src/models/index.ts (re-export)",
      "packages/shared/src/models/intro.ts"
     ],
     "gherkin": null,
     "do": "Add `PUT /users/intro-seen` (router-level `requireAuth`; identity from `req.auth.userId`, any body id ignored; version validated against the known list, else 400). The profile GET returns `seenIntroVersion`. Rebuild shared.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "401 unauthenticated; writes only the caller's document even if a body id is sent; 400 unknown version; profile GET includes the field."
     ],
     "verify": [
      "bun --cwd packages/shared run build",
      "bun --cwd apps/api run test -- users",
      "bun run check"
     ],
     "line": 382,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.2",
     "title": "Show rule and large split modal shell",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/composables/useIntro.ts",
      "apps/web/src/components/Intro/WhatsNewModal.vue",
      "apps/web/src/components/Intro/IntroSlide.vue (video stage with placeholder media)",
      "apps/web/src/components/Intro/FeatureList.vue",
      "apps/web/src/components/Intro/slides.ts (10 placeholder entries",
      "final in T3.6)",
      "apps/web/src/components/Header/UserMenu.vue",
      "apps/web/src/components/Dashboard/DashboardShell.vue (mount point)"
     ],
     "gherkin": null,
     "do": "`useIntro`: show only when logged in, profile loaded, `seenIntroVersion !== CURRENT_INTRO_VERSION` and localStorage `intro-seen:<userId>` unset (skip without waiting if the flag is set; no render before profile loads; delay until dashboard mounted; `storage` event closes a second tab). On dismiss write localStorage first, then PUT (retry once). `WhatsNewModal`: LARGE split modal about 1040x620 (max-width clamps to the viewport). Left about 62% is the video stage (`IntroSlide.vue`); right column holds `FeatureList.vue` (all 10 slides, clickable jump-to, active item highlighted), the active slide title and one-line description, and a footer with \"n / 10\" and prev/next chevron ICON buttons (clear contrast, `aria-label`s \"Previous feature\"/\"Next feature\"). Header shows \"What's new in V2\" plus Skip/close. Only the current slide is visible (no adjacent slide bleed at the edges). The last slide shows \"Show me around\" (starts the tour, T3.4) and \"Done\"; both mark seen. Keep a11y: `role=\"dialog\"` + `aria-roledescription=\"carousel\"`, live region, arrow keys, Esc = skip, focus trap, swipe, reduced-motion instant swap. Under 640px it becomes a full-screen sheet: media on top, list collapses to dots/segmented progress, icon buttons stay. \"What's new\" item in `UserMenu.vue` opens it regardless of seen state without any DB write. Logged-out visitors never see it.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Visibility matrix correct (DB flag x localStorage x profile loading); reopen does not alter the DB; PUT failure leaves the localStorage guard in place; at 1440x900 the modal is about 1040x620 with a video stage and a list of 10 items; prev/next are icon buttons with aria-labels and no neighbouring slide is visible; at 375px it is a full-screen sheet."
     ],
     "verify": [
      "bun --cwd apps/web run test -- useIntro WhatsNewModal FeatureList",
      "bun run check",
      "cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2"
     ],
     "line": 393,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.3",
     "title": "Tour anchors (`data-tour` attributes)",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerTrigger.vue",
      "apps/web/src/components/Dashboard/Sidebar/StylePicker.vue",
      "apps/web/src/components/Dashboard/Sidebar/AspectRatioPicker.vue",
      "apps/web/src/components/Dashboard/Composer/PromptBar.vue",
      "apps/web/src/components/Dashboard/ModelPicker/PromptAiMenu.vue",
      "apps/web/src/components/Dashboard/Composer/ReferenceImageControl.vue",
      "apps/web/src/components/Header/NavTabs.vue"
     ],
     "gherkin": null,
     "do": "Add stable `data-tour` attributes as string literals in the templates (static `data-tour=\"...\"`; in the `NavTabs.vue` `v-for`, a conditional bound literal on the Explore tab only) on the owning root elements: `model-picker` (ModelPickerTrigger), `style-picker` (StylePicker), `sizes` (AspectRatioPicker), `prompt-bar` (PromptBar), `prompt-tools` (the wand/prompt-tools trigger in PromptAiMenu), `ref-image` (ReferenceImageControl), `explore-tab` (the Explore tab in NavTabs). The mic's `data-tour=\"mic\"` in `VoiceInput/MicButton.vue` already exists from T2.3. T3.4's `tour.ts` keeps these names in one exported constant map used for its step selectors (templates keep the literals so the grep check below holds). No behaviour change.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All 8 anchors (`model-picker`, `style-picker`, `sizes`, `prompt-bar`, `mic`, `prompt-tools`, `ref-image`, `explore-tab`) are present in the rendered dashboard; existing component tests still pass."
     ],
     "verify": [
      "`for a in model-picker style-picker sizes prompt-bar mic prompt-tools ref-image explore-tab; do grep -rh --include='*.vue' 'data-tour' apps/web/src/components | grep -q -- \"$a\" || echo \"missing $a\"; done` prints nothing",
      "bun --cwd apps/web run test -- ModelPickerTrigger StylePicker AspectRatioPicker PromptBar PromptAiMenu ReferenceImageControl NavTabs",
      "bun run check"
     ],
     "line": 404,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.4",
     "title": "Driver.js tour with custom token-styled popover",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Intro/tour.ts",
      "apps/web/src/components/Intro/TourPopover.vue (custom popover",
      "mounted via onPopoverRender)",
      "apps/web/src/components/Intro/WhatsNewModal.vue",
      "apps/web/package.json"
     ],
     "gherkin": null,
     "do": "Add `driver.js` (MIT; listed in SPEC dependencies; react-joyride is React-only and rejected). Steps target the T3.3 anchors (model picker, style picker, sizes, prompt bar + mic, prompt tools, ref-image upload, Explore tab). Render a CUSTOM popover through driver.js popover hooks (`onPopoverRender`) using semantic tokens: step counter \"x / y\", progress bar, prev/next icon buttons (aria-labelled), Skip and close. Filter out missing/hidden elements before start; if fewer than 2 remain, skip with a toast. `animate: false` under reduced motion. \"Show me around\" starts the tour; both it and \"Done\" mark seen. Ready-checks for lazily rendered elements. Logic stays in `tour.ts`.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Step filtering correct on desktop and mobile; fewer-than-2 case toasts and skips; popover shows \"x / y\", a progress bar, icon prev/next, Skip and close; both final buttons mark seen."
     ],
     "verify": [
      "bun install",
      "bun --cwd apps/web run test -- tour",
      "bun run check",
      "cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2"
     ],
     "line": 415,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.5",
     "title": "STT polish (mic to stop, pill waveform, spinner, silence skip and two toasts)",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/Waveform.vue",
      "apps/web/src/composables/useGrokRecorder.ts",
      "apps/web/src/composables/useAudioLevel.ts",
      "apps/web/src/composables/useVoiceInput.ts",
      "packages/shared/src/models/stt.ts (named STT_SILENCE_LEVEL_THRESHOLD",
      "beside the existing STT limits)"
     ],
     "gherkin": null,
     "do": "Clicking the mic turns the button in place into a STOP (square) icon button. The waveform becomes a rounded PILL vertically centred in the prompt bar with the countdown inside it. Keep the small X cancel (discards, no `/stt` call, no API cost). Pressing stop shows a spinner on the button while transcribing, then the text is appended to the prompt and the button returns to the mic icon. Silence: `useAudioLevel` tracks the peak level during recording; if it never crossed `STT_SILENCE_LEVEL_THRESHOLD`, skip the `/stt` request and `showToast` \"We didn't hear anything. Try again and speak a little closer to the mic.\". An empty Grok response (sound present, empty text; `empty_text` code in `useGrokRecorder.ts`) shows `showToast` \"Couldn't make out any words. Try again.\" instead of the inline/sr-only error (the `grokErrorMessage` `empty_text` copy \"No speech detected. Try speaking closer to the mic.\" is replaced by this text; update the existing assertions of the old copy in `useGrokRecorder.test.ts` and `e2e/qa/voice-input.spec.ts` as an intended spec change). Both leave the prompt unchanged. Existing a11y (aria-pressed, aria-live, Esc cancel, reduced-motion meter) is kept.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "While recording, the mic button shows a stop icon (not the mic icon) and the waveform pill is visible with the countdown inside.",
      "After stop, a spinner shows until transcription ends, then the mic icon returns and text is appended.",
      "Silent recording: no `/stt` request is made and the silence toast text appears; prompt unchanged.",
      "Empty transcript response: the \"Couldn't make out any words\" toast appears; prompt unchanged.",
      "Cancel (X) makes no `/stt` request.",
      "The threshold is a named exported constant, not a literal."
     ],
     "verify": [
      "bun --cwd packages/shared run build",
      "bun --cwd apps/web run test -- MicButton Waveform useGrokRecorder useAudioLevel useVoiceInput",
      "bun run check",
      "cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=2"
     ],
     "line": 427,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.6",
     "title": "Feature video loops and posters for 10 slides (capture last)",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/public/intro/slide-{1..10}.webm",
      "apps/web/public/intro/slide-{1..10}.mp4",
      "apps/web/public/intro/slide-{1..10}.webp (posters)",
      "apps/web/src/components/Intro/slides.ts",
      "apps/web/src/components/Intro/IntroSlide.vue",
      "apps/web/public/intro/slide-1.webm",
      "apps/web/public/intro/slide-1.mp4",
      "apps/web/public/intro/slide-1.webp",
      "apps/web/public/intro/slide-2.webm",
      "apps/web/public/intro/slide-2.mp4",
      "apps/web/public/intro/slide-2.webp",
      "apps/web/public/intro/slide-3.webm",
      "apps/web/public/intro/slide-3.mp4",
      "apps/web/public/intro/slide-3.webp",
      "apps/web/public/intro/slide-4.webm",
      "apps/web/public/intro/slide-4.mp4",
      "apps/web/public/intro/slide-4.webp",
      "apps/web/public/intro/slide-5.webm",
      "apps/web/public/intro/slide-5.mp4",
      "apps/web/public/intro/slide-5.webp",
      "apps/web/public/intro/slide-6.webm",
      "apps/web/public/intro/slide-6.mp4",
      "apps/web/public/intro/slide-6.webp",
      "apps/web/public/intro/slide-7.webm",
      "apps/web/public/intro/slide-7.mp4",
      "apps/web/public/intro/slide-7.webp",
      "apps/web/public/intro/slide-8.webm",
      "apps/web/public/intro/slide-8.mp4",
      "apps/web/public/intro/slide-8.webp",
      "apps/web/public/intro/slide-9.webm",
      "apps/web/public/intro/slide-9.mp4",
      "apps/web/public/intro/slide-9.webp",
      "apps/web/public/intro/slide-10.webm",
      "apps/web/public/intro/slide-10.mp4",
      "apps/web/public/intro/slide-10.webp"
     ],
     "gherkin": null,
     "do": "Capture AFTER T3.5 so the voice clip shows the new mic. Slides in order (deliberate change: dashboard first, models second; media files keep their original slide-N numbers, decoupled from display order via a mediaId in `slides.ts`): 1 New dashboard, 2 New models, 3 Style picker, 4 More sizes, 5 Voice dictation, 6 Improve / Generate / Save prompts, 7 Explore tab and page, 8 Tools (Upscale, Remove background), 9 Reference images, 10 Remove background. Record 10 clips of 4-6s from the running app with agent-browser (do not start the app; sign in as the QA user from `e2e/fixtures/qa.ts`), dark theme, tightly cropped to the one feature shown, no personal data. Encode one-off with ffmpeg to WebM + MP4 plus a WebP poster per slide. Budgets: each clip <= 400 KB, each poster < 100 KB. `slides.ts` entries carry `title`, `description`, video sources, `poster`, `alt`, `width`, `height`. `IntroSlide.vue` renders `<video muted autoplay loop playsinline>` with WebM then MP4 sources and the poster; lazy-load only the current and next slide and pause inactive slides; under reduced motion show the poster only with no autoplay.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Exactly 10 slides in the order above; each clip is 4-6s, <= 400 KB; each poster < 100 KB; no CLS (dimensions set); alt text on all; no personal data visible; reduced motion shows posters only; inactive slides are not loaded or playing."
     ],
     "verify": [
      "`find apps/web/public/intro -name \"*.webm\" -size +400k` returns nothing",
      "`find apps/web/public/intro -name \"*.mp4\" -size +400k` returns nothing",
      "`find apps/web/public/intro -name \"*.webp\" -size +100k` returns nothing",
      "`ls apps/web/public/intro | wc -l` is 30",
      "`for f in apps/web/public/intro/*.webm apps/web/public/intro/*.mp4; do ffprobe -v error -show_entries format=duration -of csv=p=0 \"$f\" | awk -v f=\"$f\" '$1<4 || $1>6 {print \"out of range\", f, $1}'; done` prints nothing",
      "`cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2` (media attributes, lazy-load, reduced-motion poster)",
      "`agent-browser: review each clip poster for sensitive data` (visual check only; no `qa-seed.init.js` exists in this repo, so use the running app signed in as the QA user from `e2e/fixtures/qa.ts`)"
     ],
     "line": 445,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.7",
     "title": "Unit: intro persistence API",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/routes/users.ts",
      "apps/api/src/models/user.ts"
     ],
     "gherkin": null,
     "do": "401 unauthenticated; caller-only write with a spoofed body id; 400 unknown version; profile GET returns the field; default null.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/api && bunx vitest run src/routes/users.test.ts --coverage --coverage.include=src/routes/users.ts --coverage.include=src/models/user.ts --coverage.reporter=text"
     ],
     "line": 460,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.8",
     "title": "Unit: intro logic (useIntro, tour.ts, slides.ts)",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/composables/useIntro.ts",
      "apps/web/src/components/Intro/tour.ts",
      "apps/web/src/components/Intro/slides.ts",
      "apps/web/src/components/Intro/tour.test.ts",
      "apps/web/src/components/Intro/slides.test.ts",
      "apps/web/src/composables/useIntro.test.ts"
     ],
     "gherkin": null,
     "do": "Matrix of DB flag x localStorage x profile-loading; PUT retry once then localStorage guard; storage-event second tab; tour step filtering over the 8 anchors, <2 skip toast, `animate: false` under reduced motion, popover step counter and progress value; slide data shape (exactly 10, in order, with title, description, video sources, poster, alt, width, height).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/composables/useIntro.test.ts src/components/Intro --coverage --coverage.include=src/composables/useIntro.ts --coverage.include=src/components/Intro/tour.ts --coverage.include=src/components/Intro/slides.ts --coverage.reporter=text"
     ],
     "line": 468,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.9",
     "title": "Unit: intro components",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Intro/WhatsNewModal.vue",
      "apps/web/src/components/Intro/IntroSlide.vue",
      "apps/web/src/components/Intro/FeatureList.vue",
      "apps/web/src/components/Intro/TourPopover.vue",
      "apps/web/src/components/Header/UserMenu.vue",
      "apps/web/src/components/Intro/WhatsNewModal.test.ts",
      "apps/web/src/components/Intro/IntroSlide.test.ts",
      "apps/web/src/components/Intro/FeatureList.test.ts",
      "apps/web/src/components/Intro/TourPopover.test.ts"
     ],
     "gherkin": null,
     "do": "Carousel semantics, keyboard (arrows, Esc, Tab trap), feature-list jump-to and active state, icon prev/next with aria-labels and \"n / 10\", Skip/close, final-slide buttons, video attributes (muted, loop, playsinline, poster), lazy-load of current+next only, reduced-motion poster-only path, tour popover rendering, reopen from the menu without a DB write.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/components/Intro src/components/Header/UserMenu.test.ts --coverage --coverage.include=src/components/Intro/WhatsNewModal.vue --coverage.include=src/components/Intro/IntroSlide.vue --coverage.include=src/components/Intro/FeatureList.vue --coverage.include=src/components/Intro/TourPopover.vue --coverage.include=src/components/Header/UserMenu.vue --coverage.reporter=text"
     ],
     "line": 476,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.10",
     "title": "Unit: STT polish (MicButton, Waveform, useGrokRecorder, useAudioLevel/silence)",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue",
      "apps/web/src/components/Dashboard/Composer/VoiceInput/Waveform.vue",
      "apps/web/src/composables/useGrokRecorder.ts",
      "apps/web/src/composables/useAudioLevel.ts"
     ],
     "gherkin": null,
     "do": "Stop icon while recording, spinner while transcribing, pill waveform with countdown, cancel path; silence detection around `STT_SILENCE_LEVEL_THRESHOLD` (below skips `/stt` and toasts A, at or above proceeds); empty-text response toasts B; prompt unchanged in both; mocked `getUserMedia`, `MediaRecorder`, AudioContext.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/components/Dashboard/Composer/VoiceInput src/composables/useGrokRecorder.test.ts src/composables/useAudioLevel.test.ts --coverage --coverage.include=src/components/Dashboard/Composer/VoiceInput/MicButton.vue --coverage.include=src/components/Dashboard/Composer/VoiceInput/Waveform.vue --coverage.include=src/composables/useGrokRecorder.ts --coverage.include=src/composables/useAudioLevel.ts --coverage.reporter=text"
     ],
     "line": 484,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.11",
     "title": "E2E: intro once-only, layout, tour",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/qa/v2-intro.spec.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`e2e/qa/v2-intro.spec.ts` (seed data for the profile flag included)",
     "filesDeclared": true,
     "acceptance": [
      "Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=3"
     ],
     "line": 492,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.12",
     "title": "E2E: STT polish",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [
      "apps/web/e2e/support/voiceMocks.ts (add a silent analyser mode",
      "the default mock level stays audible so Phase 2 scenarios still reach **/stt)"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`e2e/qa/voice-input.spec.ts` (extend the existing spec)",
     "filesDeclared": true,
     "acceptance": [
      "Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass; existing Phase 2 scenarios in the spec still pass (the Phase 2 empty-text scenario now expects toast B, per STT-POLISH-5)."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=3"
     ],
     "line": 511,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    },
    {
     "id": "T3.13",
     "title": "Gate: Phase 3",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run all evidence; regression for Phases 1-2. Cross-device \"other browser sees nothing\" needs the user to confirm with a real second browser at the checkpoint.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All Phase 3 AC met; clips <= 400 KB and posters < 100 KB; intro once-only per account (DB + localStorage) proven by QA spec; STT polish proven by the extended voice spec."
     ],
     "verify": [
      "`bun run test` and `bun --cwd apps/api run test`",
      "bun run verify",
      "bun run build:web",
      "`find apps/web/public/intro \\( -name \"*.webm\" -o -name \"*.mp4\" \\) -size +400k` and `find apps/web/public/intro -name \"*.webp\" -size +100k` return nothing",
      "cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts e2e/qa/voice-input.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=2"
     ],
     "line": 524,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-29T09:45:12.601Z"
    }
   ],
   "verified": 13,
   "total": 13,
   "complete": true
  },
  {
   "id": "4",
   "name": "V2 announcement email",
   "startLine": 541,
   "endLine": 664,
   "adds": "A React Email V2 announcement template, a resumable and idempotent Resend send script (dry-run, test-send, capped real send), and a working one-click unsubscribe. No real send happens in this phase's tasks.",
   "tryInUi": [
    "Open the unsubscribe confirm page from a signed link and confirm it sets opt-out",
    "run `cd apps/api && bun scripts/send-v2-announcement.ts --dry-run` and open the printed HTML preview",
    "run `bun --cwd packages/email run dev` and view the template in light and dark."
   ],
   "checkpoint": {
    "title": "Checkpoint 4",
    "line": 661,
    "items": [
     "Template, script and unsubscribe verified under mocks and dry-run; ready for the user's `--test-to` send and a separate go-ahead."
    ]
   },
   "tasks": [
    {
     "id": "T4.1",
     "title": "Email workspace scaffold and render",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/email/package.json (@visual-ai/email)",
      "packages/email/src/V2Announcement.tsx (skeleton)",
      "packages/email/src/render.ts",
      "packages/email/tsconfig.json",
      "packages/email/src/index.ts"
     ],
     "gherkin": null,
     "do": "New workspace with `@react-email/components`, `react-email`, `@react-email/render` (SPEC-listed deps). Export `renderV2Announcement(data): Promise<{ html, text }>` (async: `@react-email/render` v1+ `render()` returns a Promise). Scripts: `dev` runs the React Email preview, `test` runs `vitest run` (tsconfig `jsx: react-jsx`). No coupling to the web app. MJML only if install or rendering fails.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "`bun install` resolves in the workspace; render resolves to html < 102 KB and a non-empty plain-text alternative; `bun --cwd packages/email run test` is a valid script."
     ],
     "verify": [
      "bun install",
      "bun run check",
      "`bun -e \"const m = await import('@visual-ai/email'); const r = await m.renderV2Announcement({ firstName: 'A', unsubscribeUrl: 'https://example.test/u', postalAddress: 'Test address' }); if (!(r.html.length < 102400 && r.text.length > 0)) process.exit(1)\"` exits 0",
      "`node -e \"process.exit(require('./packages/email/package.json').scripts?.test ? 0 : 1)\"` exits 0"
     ],
     "line": 546,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.2",
     "title": "Unsubscribe token and User fields",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/models/user.ts",
      "apps/api/src/lib/unsubscribe-token.ts",
      "apps/api/src/config/env.ts",
      "apps/api/.env.example"
     ],
     "gherkin": null,
     "do": "User gets `emailOptOut: { type: Boolean, default: false }` and `announcements.v2: { sentAt, resendId }`. HMAC-signed token (userId + purpose, secret `UNSUBSCRIBE_SECRET`, no expiry) with sign/verify using timing-safe compare. Add `UNSUBSCRIBE_SECRET`, `APP_PUBLIC_URL`, `API_PUBLIC_URL` (API origin for unsubscribe links), `RESEND_API_KEY`, `MAIL_FROM`, `EMAIL_REPLY_TO`, `MAIL_POSTAL_ADDRESS` to `.env.example`; script-only vars stay optional in the zod schema so the API boots without them.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Valid token verifies; tampered/other-purpose token fails; schema fields default correctly; API boots without mail env."
     ],
     "verify": [
      "bun --cwd apps/api run test -- unsubscribe-token",
      "bun run check"
     ],
     "line": 558,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.3",
     "title": "Public unsubscribe route",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/routes/email.ts",
      "apps/api/src/routes/index.ts"
     ],
     "gherkin": null,
     "do": "`GET /email/unsubscribe?token=` renders a confirm page; `POST` (also the RFC 8058 one-click target) sets `emailOptOut=true`, idempotent. Invalid token (or `UNSUBSCRIBE_SECRET` unset) returns 400 with a friendly page. Mount it in `routes/index.ts` above line 19 (`router.use(requireAuth, userRoutes)` and later mounts apply auth to every following request), so it is public. Served from the API origin (`API_PUBLIC_URL`, routes at `/`, no `/api` prefix). Pages carry stable markup for the QA spec.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Reachable without auth; repeat POST is a no-op success; invalid/missing token 400 friendly page; user excluded from later sends."
     ],
     "verify": [
      "bun --cwd apps/api run test -- email",
      "cd apps/web && bunx playwright test e2e/qa/v2-email-unsubscribe.spec.ts --repeat-each=2",
      "bun run check"
     ],
     "line": 568,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.4",
     "title": "Send script core",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/scripts/send-v2-announcement.ts (thin CLI entry)",
      "apps/api/src/lib/v2-announcement/recipients.ts",
      "apps/api/src/lib/v2-announcement/batching.ts",
      "apps/api/src/lib/v2-announcement/resend-client.ts",
      "apps/api/package.json"
     ],
     "gherkin": null,
     "do": "Add `resend` (SPEC-listed). Logic lives under `src/lib/v2-announcement/` because API vitest only collects `src/**/*.test.ts`; the script only parses args and wires the libs. Recipient selection excludes `emailOptOut`, invalid/empty emails, already-sent, and dedupes shared emails; name falls back to \"Hi there\". Resend batch API (<=100), throttle ~2 requests/s, exponential backoff on 429/5xx, per-item `announcements.v2` write after each success, batch idempotency key `v2-announce-<sorted-ids-hash>`. `--daily-cap` default 100, values above 100 rejected; `--limit N`; stop cleanly at cap and print remaining. `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers on every message. Failed items not marked and reported.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Rerun after a simulated crash sends no duplicates; partial failure marks only successes; cap and limit honoured."
     ],
     "verify": [
      "bun --cwd apps/api run test -- v2-announcement",
      "bun run check"
     ],
     "line": 579,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.5",
     "title": "Modes and guards",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/scripts/send-v2-announcement.ts",
      "apps/api/src/lib/v2-announcement/modes.ts",
      "apps/api/src/lib/v2-announcement/preview.ts"
     ],
     "gherkin": null,
     "do": "`--dry-run`: render the template, print recipient count and a sample, write the HTML preview to a temp file; sends and writes nothing. `--test-to <email>`: one send, marks nobody; both work with placeholder env. A real send requires `--confirm` plus a printed summary and refuses (non-zero exit, clear message) unless `MAIL_FROM` and `MAIL_POSTAL_ADDRESS` are non-empty. Never send to real recipients in verification.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Each mode behaves as stated; missing env with `--confirm` exits non-zero; `--confirm` absent never sends to the user base."
     ],
     "verify": [
      "bun --cwd apps/api run test -- v2-announcement",
      "`cd apps/api && RESEND_API_KEY= bun scripts/send-v2-announcement.ts --dry-run` (prints count and preview path; with the key blanked no Resend call is possible)",
      "`cd apps/api && RESEND_API_KEY= MAIL_FROM= MAIL_POSTAL_ADDRESS= bun scripts/send-v2-announcement.ts --confirm; echo $?` prints non-zero (key also blanked so a broken guard still cannot send)"
     ],
     "line": 589,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.6",
     "title": "Template content and design",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/email/src/V2Announcement.tsx",
      "packages/email/src/components/Highlight.tsx",
      "packages/email/src/render.ts",
      "apps/web/public/email/*.png (one generated image set: hero plus 3-5 highlight images",
      "each < ~200 KB)"
     ],
     "gherkin": null,
     "do": "Hero (logo, headline, image), 3-5 highlights with absolute HTTPS image URLs on the production domain, benefits, \"30 free credits every day\" from `DAILY_CREDITS`, primary CTA \"Try V2 now\" (bulletproof button, UTM params), secondary links (pricing, explore, support), footer with unsubscribe, sender identity and postal address from `MAIL_POSTAL_ADDRESS` (never hardcoded). 600px max, single column under 480px, web-safe font fallbacks, preheader, plain-text alternative, `color-scheme` meta, transparent PNG logo with light-safe background, explicit button colors, images < ~200 KB, html < 102 KB.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "MAIL-3 checklist met; no hardcoded address or credit number; all image URLs absolute HTTPS with alt and fixed widths."
     ],
     "verify": [
      "bun --cwd packages/email run test",
      "`find apps/web/public/email -size +200k` returns nothing",
      "`grep -rnE \"src=\\\"(http:|/)\" packages/email/src` returns nothing",
      "`agent-browser: open React Email preview (bun --cwd packages/email run dev already running or user-started) in light and dark` (visual only)"
     ],
     "line": 600,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.7",
     "title": "Unit: unsubscribe token and route",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/lib/unsubscribe-token.ts",
      "apps/api/src/routes/email.ts",
      "apps/api/src/models/user.ts"
     ],
     "gherkin": null,
     "do": "Sign/verify roundtrip, tamper, wrong purpose, missing secret; GET page, POST idempotency, invalid token 400, public (no auth), opt-out persisted.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/api && bunx vitest run src/lib/unsubscribe-token.test.ts src/routes/email.test.ts src/models/user.test.ts --coverage --coverage.include=src/lib/unsubscribe-token.ts --coverage.include=src/routes/email.ts --coverage.include=src/models/user.ts --coverage.reporter=text"
     ],
     "line": 612,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.8",
     "title": "Unit: send script libs",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/api/src/lib/v2-announcement/recipients.ts",
      "apps/api/src/lib/v2-announcement/batching.ts",
      "apps/api/src/lib/v2-announcement/resend-client.ts",
      "apps/api/src/lib/v2-announcement/modes.ts",
      "apps/api/src/lib/v2-announcement/preview.ts"
     ],
     "gherkin": null,
     "do": "Mock Resend and Mongo. Selection (opt-out, invalid, sent, dup emails, no-name), batching of 100, throttle, backoff on 429/5xx, partial failure, idempotency key stability, daily cap (>100 rejected), `--limit`, crash-and-rerun no duplicates, each mode, `--confirm` refusal, test-to marks nobody.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/api && bunx vitest run src/lib/v2-announcement --coverage --coverage.include=src/lib/v2-announcement/recipients.ts --coverage.include=src/lib/v2-announcement/batching.ts --coverage.include=src/lib/v2-announcement/resend-client.ts --coverage.include=src/lib/v2-announcement/modes.ts --coverage.include=src/lib/v2-announcement/preview.ts --coverage.reporter=text"
     ],
     "line": 620,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.9",
     "title": "Unit: email template",
     "done": true,
     "kind": "unit",
     "depends": [],
     "files": [
      "packages/email/src/V2Announcement.tsx",
      "packages/email/src/components/Highlight.tsx",
      "packages/email/src/render.ts"
     ],
     "gherkin": null,
     "do": "Render snapshot; html < 102 KB; text alternative present; absolute HTTPS images with alt; unsubscribe link and postal address from props; \"Hi there\" fallback; `DAILY_CREDITS` interpolated.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (matching the repo threshold), target > 95%."
     ],
     "verify": [
      "cd packages/email && bunx vitest run --coverage --coverage.include=src/V2Announcement.tsx --coverage.include=src/components/Highlight.tsx --coverage.include=src/render.ts --coverage.reporter=text"
     ],
     "line": 628,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.10",
     "title": "E2E: unsubscribe flow",
     "done": true,
     "kind": "e2e",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`e2e/qa/v2-email-unsubscribe.spec.ts` (seed generates a valid token via the test secret; pages are on the API origin, so the spec navigates to the API base URL, not the web `baseURL`)",
     "filesDeclared": true,
     "acceptance": [
      "Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass."
     ],
     "verify": [
      "cd apps/web && bunx playwright test e2e/qa/v2-email-unsubscribe.spec.ts --repeat-each=3"
     ],
     "line": 636,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    },
    {
     "id": "T4.11",
     "title": "Gate: Phase 4",
     "done": true,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run all evidence. Items requiring the user (not done here): domain SPF/DKIM/DMARC verification in Resend, `--test-to` send and Gmail web/mobile light/dark check, and the separate explicit go-ahead before any `--confirm` send. This task never sends a real email.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All Phase 4 AC met; dry-run excludes opted-out; crash-and-rerun idempotency proven by tests; unsubscribe route public and idempotent."
     ],
     "verify": [
      "`bun run test` and `bun --cwd apps/api run test` and `bun --cwd packages/email run test`",
      "bun run verify",
      "cd apps/api && RESEND_API_KEY= bun scripts/send-v2-announcement.ts --dry-run",
      "cd apps/web && bunx playwright test e2e/qa/v2-email-unsubscribe.spec.ts --repeat-each=2"
     ],
     "line": 649,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-10-31T10:21:11.216Z"
    }
   ],
   "verified": 11,
   "total": 11,
   "complete": true
  },
  {
   "id": "5",
   "name": "Definition of done",
   "startLine": 665,
   "endLine": 686,
   "adds": "Final bundle-wide regression and sign-off across all four tracks. No new behaviour.",
   "tryInUi": [
    "Walk the Phase 1-3 \"Try in UI\" steps once more on a fresh session",
    "confirm a new account shows 30 credits and the intro appears once."
   ],
   "checkpoint": {
    "title": "Checkpoint 5",
    "line": 685,
    "items": [
     "Every SPEC success criterion has evidence; user-only items (real generation, real mic, second browser, Gmail test send, deploy-then-send) are listed for sign-off."
    ]
   },
   "tasks": [
    {
     "id": "T5.1",
     "title": "DoD: V2 launch bundle",
     "done": false,
     "kind": "dod",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Verify every SPEC success criterion has passing evidence; list items needing the user (real generation with reference, real mic, second-browser intro check, Gmail test send, deploy-then-send ordering).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Setup and gates green: T0.1, T0.2, T1.16, T2.10, T3.13, T4.11.",
      "Track evidence: MOD via T1.11-T1.15; STT via T2.6-T2.9; INTRO and STT polish via T3.7-T3.12; MAIL via T4.7-T4.10.",
      "No open SPEC_ISSUE; MOD-2 grep clean; no secrets or `.env` in `git status`; nothing sent to real recipients."
     ],
     "verify": [
      "bun --cwd packages/shared run build && bun run test && bun --cwd apps/api run test && bun --cwd packages/email run test",
      "`bun run verify` and `bun run check:model-docs` and `bun run build:web`",
      "cd apps/web && bunx playwright test e2e/qa --repeat-each=2",
      "`git status --short` shows no `.env` or key material"
     ],
     "line": 670,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 1,
   "complete": false
  }
 ],
 "current": null,
 "nextCommand": "/build-phases agent_docs/v2-launch/TASKS.md phase 5",
 "questions": [
  {
   "at": "2026-10-27T14:11:40.591Z",
   "type": "question",
   "tasks": [],
   "id": "Q1",
   "text": "Phase 0 setup tasks (T0.1/T0.2) use Kind gate — OK?",
   "default": "Keep as gate",
   "alternatives": "Relax linter for config-only phases; fold into Phase 1",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-10-27T14:11:40.624Z",
   "type": "question",
   "tasks": [],
   "id": "Q2",
   "text": "Unsubscribe link host?",
   "default": "New API_PUBLIC_URL env",
   "alternatives": "Proxy route on APP_PUBLIC_URL (web domain)",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-10-27T14:11:40.658Z",
   "type": "question",
   "tasks": [],
   "id": "Q3",
   "text": "Where should email send-script logic live?",
   "default": "apps/api/src/lib/v2-announcement/ (thin CLI in scripts/)",
   "alternatives": "Widen API test config to include scripts/",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-10-27T14:11:40.694Z",
   "type": "question",
   "tasks": [],
   "id": "Q4",
   "text": "STT rate-limit store?",
   "default": "rate-limit-redis when Redis configured, memory fallback",
   "alternatives": "Memory only",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-10-27T14:11:40.728Z",
   "type": "question",
   "tasks": [],
   "id": "Q5",
   "text": "Guard filter-based Verify steps that match zero tests?",
   "default": "No; Unit tasks carry coverage checks",
   "alternatives": "Add fail-on-no-tests guard per step",
   "answer": null,
   "answeredAt": null
  }
 ],
 "stuck": [],
 "commits": [
  {
   "at": "2026-10-31T10:21:11.216Z",
   "ok": true,
   "phase": "4",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "3",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 16/16 x3 dev+prod, lowest unit coverage 90% (recipients.ts branches), root 2097/2097, api 837",
   "error": null,
   "sha": "6567f51dd046142ddc62b80411ad70f12dc5e011",
   "shortSha": "6567f51",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/6567f51dd046142ddc62b80411ad70f12dc5e011",
   "subject": "feat(v2-launch): phase 4 V2 announcement email",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-10-31T15:50:55+05:30",
   "filesChanged": 76,
   "added": 5200,
   "removed": 567
  },
  {
   "at": "2026-10-29T09:45:12.601Z",
   "ok": true,
   "phase": "3",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5",
    "T3.6",
    "T3.7",
    "T3.8",
    "T3.9",
    "T3.10",
    "T3.11",
    "T3.12",
    "T3.13"
   ],
   "attempt": "3",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 40/40 v2-intro, 27/27 voice x3 dev+prod; lowest unit coverage 93.8% branches",
   "error": null,
   "sha": "34aa078fa69b7ed9340b6f8cb982e2059aac1104",
   "shortSha": "34aa078",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/34aa078fa69b7ed9340b6f8cb982e2059aac1104",
   "subject": "feat(v2-launch): phase 3 intro carousel, tour and STT polish",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-10-29T15:15:03+05:30",
   "filesChanged": 79,
   "added": 2847,
   "removed": 91
  },
  {
   "at": "2026-10-28T12:40:22.768Z",
   "ok": true,
   "phase": "2",
   "tasks": [
    "T2.1",
    "T2.2",
    "T2.3",
    "T2.4",
    "T2.5",
    "T2.6",
    "T2.7",
    "T2.8",
    "T2.9",
    "T2.10"
   ],
   "attempt": "2",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "e2e 19/19 prod x3, unit lowest branches 90.38%, check pass",
   "error": null,
   "sha": "6d42f3f2a76d8b6dee3fc5c0832e713134df43aa",
   "shortSha": "6d42f3f",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/6d42f3f2a76d8b6dee3fc5c0832e713134df43aa",
   "subject": "feat(stt): speech-to-text in the prompt bar (phase 2)",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-10-28T18:10:13+05:30",
   "filesChanged": 41,
   "added": 3980,
   "removed": 164
  },
  {
   "at": "2026-10-27T18:20:47.746Z",
   "ok": true,
   "phase": "1",
   "tasks": [
    "T1.1",
    "T1.2",
    "T1.3",
    "T1.4",
    "T1.5",
    "T1.6",
    "T1.7",
    "T1.8",
    "T1.9",
    "T1.10",
    "T1.11",
    "T1.12",
    "T1.13",
    "T1.14",
    "T1.15",
    "T1.16"
   ],
   "attempt": "2",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "check pass; prod e2e 19+13 repeat-each=3; 1733 unit tests",
   "error": null,
   "sha": "2c183ccb8458e615d9c30a92a0cbb11deaa119b6",
   "shortSha": "2c183cc",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/2c183ccb8458e615d9c30a92a0cbb11deaa119b6",
   "subject": "feat(v2-launch): phase 1 Modifications",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-10-27T23:50:38+05:30",
   "filesChanged": 67,
   "added": 2394,
   "removed": 215
  },
  {
   "at": "2026-10-27T15:11:24.098Z",
   "ok": true,
   "phase": "0",
   "tasks": [
    "T0.1",
    "T0.2"
   ],
   "attempt": "3",
   "branch": "feature-enhancement",
   "pushed": true,
   "evidence": "gate verify: bun run check exit 0; playwright --list 101 tests",
   "error": null,
   "sha": "e6be1545c5dbb4dc64ca050995b0c2672d120bf3",
   "shortSha": "e6be154",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/e6be1545c5dbb4dc64ca050995b0c2672d120bf3",
   "subject": "feat(v2-launch): test harness and e2e server mode",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-10-27T20:41:16+05:30",
   "filesChanged": 7,
   "added": 1193,
   "removed": 5
  }
 ],
 "shots": [
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "Mic in prompt bar with aria-label and data-tour mic anchor",
   "attempt": null,
   "caption": "Microphone control sits on the right side of the composer prompt bar, idle and ready.",
   "annotations": [
    {
     "x": 80.5,
     "y": 15.3,
     "w": 2.8,
     "h": 6.2,
     "label": "Mic button in prompt bar"
    },
    {
     "x": 26.3,
     "y": 14.7,
     "w": 51,
     "h": 6.2,
     "label": "Composer prompt input"
    }
   ],
   "at": "2026-10-28T13:12:17.287Z",
   "file": "2/T2.3-1.png",
   "phase": "2",
   "href": "shots/2/T2.3-1.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "Grok recording path with MediaRecorder and aria-pressed recording state",
   "attempt": null,
   "caption": "Grok recording active: mic pressed and waveform visible beside the prompt.",
   "annotations": [
    {
     "x": 80.5,
     "y": 15.3,
     "w": 2.8,
     "h": 6.2,
     "label": "Recording: aria-pressed true"
    },
    {
     "x": 75.2,
     "y": 16.4,
     "w": 2.5,
     "h": 4.2,
     "label": "Live waveform while recording"
    }
   ],
   "at": "2026-10-28T13:12:22.152Z",
   "file": "2/T2.3-2.png",
   "phase": "2",
   "href": "shots/2/T2.3-2.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "Mic disabled while transcribing; append-not-replace after completion",
   "attempt": null,
   "caption": "After stop, transcribing state disables the mic until STT completes.",
   "annotations": [
    {
     "x": 80.5,
     "y": 15.3,
     "w": 2.8,
     "h": 6.2,
     "label": "Mic disabled while transcribing"
    }
   ],
   "at": "2026-10-28T13:12:26.214Z",
   "file": "2/T2.3-3.png",
   "phase": "2",
   "href": "shots/2/T2.3-3.png"
  },
  {
   "taskId": "T2.4",
   "kind": "proof",
   "step": "Engine choice menu with Web Speech / Grok and privacy note",
   "attempt": null,
   "caption": "Engine menu lists Web Speech and Grok with privacy note for Chrome.",
   "annotations": [
    {
     "x": 63,
     "y": 21.6,
     "w": 17.2,
     "h": 25.1,
     "label": "Engine menu with Web Speech and Grok"
    },
    {
     "x": 78,
     "y": 16,
     "w": 2.2,
     "h": 4.9,
     "label": "Chevron engine trigger"
    }
   ],
   "at": "2026-10-28T13:12:42.793Z",
   "file": "2/T2.4-1.png",
   "phase": "2",
   "href": "shots/2/T2.4-1.png"
  },
  {
   "taskId": "T2.4",
   "kind": "proof",
   "step": "Web Speech interim results previewed live without replacing existing text",
   "attempt": null,
   "caption": "Web Speech shows interim dictation appended after existing prompt text.",
   "annotations": [
    {
     "x": 26.3,
     "y": 14.7,
     "w": 51,
     "h": 6.2,
     "label": "Interim + existing text appended"
    },
    {
     "x": 80.5,
     "y": 15.3,
     "w": 2.8,
     "h": 6.2,
     "label": "Web Speech recording"
    }
   ],
   "at": "2026-10-28T13:12:47.688Z",
   "file": "2/T2.4-2.png",
   "phase": "2",
   "href": "shots/2/T2.4-2.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": "Waveform animates with live volume during Grok recording",
   "attempt": null,
   "caption": "Recording shows reactive multi-bar waveform driven by audio level.",
   "annotations": [
    {
     "x": 75.2,
     "y": 16.4,
     "w": 2.5,
     "h": 4.2,
     "label": "Animated multi-bar waveform"
    },
    {
     "x": 80.5,
     "y": 15.3,
     "w": 2.8,
     "h": 6.2,
     "label": "Recording with Esc cancel available"
    }
   ],
   "at": "2026-10-28T13:13:08.684Z",
   "file": "2/T2.5-1.png",
   "phase": "2",
   "href": "shots/2/T2.5-1.png"
  },
  {
   "taskId": "T2.5",
   "kind": "proof",
   "step": "Reduced-motion variant renders opacity-only level meter",
   "attempt": null,
   "caption": "With prefers-reduced-motion, waveform collapses to a single opacity level meter.",
   "annotations": [
    {
     "x": 75.2,
     "y": 16.4,
     "w": 2.5,
     "h": 4.2,
     "label": "Reduced-motion opacity meter"
    }
   ],
   "at": "2026-10-28T13:13:29.455Z",
   "file": "2/T2.5-2.png",
   "phase": "2",
   "href": "shots/2/T2.5-2.png"
  },
  {
   "taskId": "T3.2",
   "kind": "after",
   "step": "Modal about 1040x620, 10 items",
   "attempt": null,
   "caption": "Large split modal at 1440x900 with video stage, 10-item feature list, prev/next icon buttons and n / 10.",
   "annotations": [
    {
     "x": 14,
     "y": 16,
     "w": 72,
     "h": 84,
     "label": "Modal 1040x620 with ~62% stage and feature list"
    }
   ],
   "at": "2026-10-29T05:10:47.565Z",
   "file": "3/T3.2-1.png",
   "phase": "3",
   "href": "shots/3/T3.2-1.png"
  },
  {
   "taskId": "T3.2",
   "kind": "after",
   "step": "Full-screen sheet at 375px",
   "attempt": null,
   "caption": "At 375px the intro is a full-screen sheet with segmented progress and icon buttons.",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 100,
     "h": 100,
     "label": "Full-screen sheet"
    }
   ],
   "at": "2026-10-29T05:10:47.678Z",
   "file": "3/T3.2-2.png",
   "phase": "3",
   "href": "shots/3/T3.2-2.png"
  },
  {
   "taskId": "T3.2",
   "kind": "proof",
   "step": "Video stage plus list of 10 items; prev/next are icon buttons; no neighbouring slide visible",
   "attempt": 2,
   "caption": "Split modal with the slide 1 video loop on the left, the 10-item feature list, title and description, and icon prev/next with 1 / 10 (1280x720 viewport; 1440x900 size asserted by the e2e layout test).",
   "annotations": [
    {
     "x": 9.4,
     "y": 7,
     "w": 50.4,
     "h": 86,
     "label": "Video stage shows only the current slide"
    },
    {
     "x": 61.3,
     "y": 16.4,
     "w": 27.7,
     "h": 46.8,
     "label": "Feature list with all 10 items, active one highlighted"
    },
    {
     "x": 81.8,
     "y": 84.4,
     "w": 7.6,
     "h": 6,
     "label": "Icon prev/next buttons"
    }
   ],
   "at": "2026-10-29T09:24:14.940Z",
   "file": "3/T3.2-3.png",
   "phase": "3",
   "href": "shots/3/T3.2-3.png"
  },
  {
   "taskId": "T3.4",
   "kind": "after",
   "step": "Custom popover",
   "attempt": null,
   "caption": "Tour popover with x / y counter, progress bar, icon prev/next, Skip and close.",
   "annotations": [
    {
     "x": 19,
     "y": 16,
     "w": 27,
     "h": 42,
     "label": "Custom popover with counter, progress, icon buttons"
    }
   ],
   "at": "2026-10-29T05:10:47.765Z",
   "file": "3/T3.4-1.png",
   "phase": "3",
   "href": "shots/3/T3.4-1.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "recording",
   "attempt": null,
   "caption": "Recording: stop icon, pill waveform with countdown",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 10,
     "h": 10,
     "label": "pill"
    }
   ],
   "at": "2026-10-29T05:27:36.040Z",
   "file": "3/T3.5-1.png",
   "phase": "3",
   "href": "shots/3/T3.5-1.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "Recording shows the stop icon and the waveform pill",
   "attempt": 2,
   "caption": "While recording, the mic is replaced by a stop (square) button and a rounded waveform pill sits centred in the prompt bar, with the X cancel beside it.",
   "annotations": [
    {
     "x": 76.6,
     "y": 9.6,
     "w": 3,
     "h": 4.4,
     "label": "Waveform pill"
    },
    {
     "x": 79.9,
     "y": 10.3,
     "w": 1.6,
     "h": 3,
     "label": "X cancel"
    },
    {
     "x": 83,
     "y": 10.4,
     "w": 1.9,
     "h": 3,
     "label": "Stop (square) icon in place of the mic"
    }
   ],
   "at": "2026-10-29T09:24:15.049Z",
   "file": "3/T3.5-2.png",
   "phase": "3",
   "href": "shots/3/T3.5-2.png"
  },
  {
   "taskId": "T3.6",
   "kind": "proof",
   "step": "poster",
   "attempt": null,
   "caption": "Slide 9 poster",
   "annotations": [],
   "at": "2026-10-29T05:27:36.179Z",
   "file": "3/T3.6-1.webp",
   "phase": "3",
   "href": "shots/3/T3.6-1.webp"
  },
  {
   "taskId": "T3.11",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "New account sees the What's new modal at 1440x900 with the 10-item feature list",
   "annotations": [],
   "at": "2026-10-29T09:07:35.886Z",
   "file": "3/T3.11-1.png",
   "phase": "3",
   "href": "shots/3/T3.11-1.png"
  },
  {
   "taskId": "T3.11",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Show me around starts the tour with the custom popover (1 / n, progress)",
   "annotations": [],
   "at": "2026-10-29T09:07:35.990Z",
   "file": "3/T3.11-2.png",
   "phase": "3",
   "href": "shots/3/T3.11-2.png"
  },
  {
   "taskId": "T3.11",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "At 375px the intro is a full-screen sheet with progress bars",
   "annotations": [],
   "at": "2026-10-29T09:07:36.074Z",
   "file": "3/T3.11-3.png",
   "phase": "3",
   "href": "shots/3/T3.11-3.png"
  },
  {
   "taskId": "T3.12",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Mic replaced by waveform pill with cancel and stop",
   "annotations": [],
   "at": "2026-10-29T09:07:55.936Z",
   "file": "3/T3.12-1.png",
   "phase": "3",
   "href": "shots/3/T3.12-1.png"
  },
  {
   "taskId": "T3.12",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Spinner on mic while stt pending",
   "annotations": [],
   "at": "2026-10-29T09:07:56.025Z",
   "file": "3/T3.12-2.png",
   "phase": "3",
   "href": "shots/3/T3.12-2.png"
  },
  {
   "taskId": "T3.12",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Silence toast, prompt unchanged",
   "annotations": [],
   "at": "2026-10-29T09:07:56.104Z",
   "file": "3/T3.12-3.png",
   "phase": "3",
   "href": "shots/3/T3.12-3.png"
  },
  {
   "taskId": "T4.6",
   "kind": "proof",
   "step": "Template content and design",
   "attempt": null,
   "caption": "Rendered V2 email at 1440 wide, single 600px column",
   "annotations": [
    {
     "x": 30,
     "y": 2,
     "w": 40,
     "h": 8,
     "label": "hero and CTA"
    }
   ],
   "at": "2026-10-29T14:42:12.403Z",
   "file": "4/T4.6-1.png",
   "phase": "4",
   "href": "shots/4/T4.6-1.png"
  },
  {
   "taskId": "T4.6",
   "kind": "proof",
   "step": "Single column under 480px",
   "attempt": null,
   "caption": "Rendered V2 email at 375 wide, single column with CTA, highlights, credits and footer",
   "annotations": [
    {
     "x": 28,
     "y": 20,
     "w": 45,
     "h": 4,
     "label": "Try V2 now CTA"
    }
   ],
   "at": "2026-10-29T14:42:12.511Z",
   "file": "4/T4.6-2.png",
   "phase": "4",
   "href": "shots/4/T4.6-2.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Confirm page for a signed link",
   "annotations": [],
   "at": "2026-10-29T14:54:37.374Z",
   "file": "4/T4.10-1.png",
   "phase": "4",
   "href": "shots/4/T4.10-1.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Missing token shows friendly 400 page",
   "annotations": [],
   "at": "2026-10-29T14:54:37.478Z",
   "file": "4/T4.10-2.png",
   "phase": "4",
   "href": "shots/4/T4.10-2.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Invalid token shows friendly 400 page",
   "annotations": [],
   "at": "2026-10-29T14:54:37.567Z",
   "file": "4/T4.10-3.png",
   "phase": "4",
   "href": "shots/4/T4.10-3.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Confirm page at 375px, unauthenticated",
   "annotations": [],
   "at": "2026-10-29T14:54:37.659Z",
   "file": "4/T4.10-4.png",
   "phase": "4",
   "href": "shots/4/T4.10-4.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "unsubscribe 01-confirm",
   "annotations": [],
   "at": "2026-10-29T14:56:39.831Z",
   "file": "4/T4.10-5.png",
   "phase": "4",
   "href": "shots/4/T4.10-5.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "unsubscribe 02-success",
   "annotations": [],
   "at": "2026-10-29T14:56:39.939Z",
   "file": "4/T4.10-6.png",
   "phase": "4",
   "href": "shots/4/T4.10-6.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "unsubscribe 03-repeat-success",
   "annotations": [],
   "at": "2026-10-29T14:56:40.034Z",
   "file": "4/T4.10-7.png",
   "phase": "4",
   "href": "shots/4/T4.10-7.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "unsubscribe 04-missing-token",
   "annotations": [],
   "at": "2026-10-29T14:56:40.127Z",
   "file": "4/T4.10-8.png",
   "phase": "4",
   "href": "shots/4/T4.10-8.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "unsubscribe 05-invalid-token",
   "annotations": [],
   "at": "2026-10-29T14:56:40.221Z",
   "file": "4/T4.10-9.png",
   "phase": "4",
   "href": "shots/4/T4.10-9.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "unsubscribe 06-confirm-375",
   "annotations": [],
   "at": "2026-10-29T14:56:40.316Z",
   "file": "4/T4.10-10.png",
   "phase": "4",
   "href": "shots/4/T4.10-10.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "unsubscribe 07-success-375",
   "annotations": [],
   "at": "2026-10-29T14:56:40.409Z",
   "file": "4/T4.10-11.png",
   "phase": "4",
   "href": "shots/4/T4.10-11.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Signed link GET shows the confirm page; user is not opted out yet",
   "annotations": [],
   "at": "2026-10-29T15:13:27.837Z",
   "file": "4/T4.10-12.png",
   "phase": "4",
   "href": "shots/4/T4.10-12.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Clicking confirm shows 'You are unsubscribed' and sets emailOptOut",
   "annotations": [],
   "at": "2026-10-29T15:13:27.939Z",
   "file": "4/T4.10-13.png",
   "phase": "4",
   "href": "shots/4/T4.10-13.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Confirming a second time still shows success (idempotent)",
   "annotations": [],
   "at": "2026-10-29T15:13:28.026Z",
   "file": "4/T4.10-14.png",
   "phase": "4",
   "href": "shots/4/T4.10-14.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Missing token returns a friendly 400 invalid-link page",
   "annotations": [],
   "at": "2026-10-29T15:13:28.113Z",
   "file": "4/T4.10-15.png",
   "phase": "4",
   "href": "shots/4/T4.10-15.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Tampered or wrong-purpose token returns the 400 invalid-link page",
   "annotations": [],
   "at": "2026-10-29T15:13:28.203Z",
   "file": "4/T4.10-16.png",
   "phase": "4",
   "href": "shots/4/T4.10-16.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Confirm page fits a 375px viewport with no session",
   "annotations": [],
   "at": "2026-10-29T15:13:28.290Z",
   "file": "4/T4.10-17.png",
   "phase": "4",
   "href": "shots/4/T4.10-17.png"
  },
  {
   "taskId": "T4.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Success page fits a 375px viewport with no horizontal scroll",
   "annotations": [],
   "at": "2026-10-29T15:13:28.380Z",
   "file": "4/T4.10-18.png",
   "phase": "4",
   "href": "shots/4/T4.10-18.png"
  }
 ],
 "deliverables": [
  {
   "at": "2026-10-31T10:20:40.420Z",
   "type": "deliverable",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "text": "V2 announcement email: template, unsubscribe flow, send script with durable batch replay, gate fix for Node 26 webstorage",
   "files": [
    "packages/email",
    "apps/api",
    "apps/web",
    "vite.config.ts"
   ]
  },
  {
   "at": "2026-10-29T09:44:48.491Z",
   "type": "deliverable",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5",
    "T3.6",
    "T3.7",
    "T3.8",
    "T3.9",
    "T3.10",
    "T3.11",
    "T3.12",
    "T3.13"
   ],
   "text": "V2 intro carousel + tour, intro-seen API, STT polish, 10 slide clips, unit+e2e specs",
   "files": [
    "apps/web/src/components/Intro",
    "apps/api/src/routes/users.ts",
    "packages/shared/src/models/intro.ts"
   ]
  },
  {
   "at": "2026-10-27T18:20:32.888Z",
   "type": "deliverable",
   "tasks": [
    "T1.1",
    "T1.2",
    "T1.3",
    "T1.4",
    "T1.5",
    "T1.6",
    "T1.7",
    "T1.8",
    "T1.9",
    "T1.10",
    "T1.11",
    "T1.12",
    "T1.13",
    "T1.14",
    "T1.15",
    "T1.16"
   ],
   "text": "Phase 1 Modifications: 30 credits, multi reference images, favicons, prod e2e",
   "files": [
    "agent_docs/v2-launch/TASKS.md"
   ]
  },
  {
   "at": "2026-10-27T15:11:08.864Z",
   "type": "deliverable",
   "tasks": [
    "T0.1",
    "T0.2"
   ],
   "text": "E2E prod server mode, gitignore artifacts, prettierignore for dashboard sync",
   "files": [
    "apps/web/playwright.config.ts",
    "apps/web/e2e/README.md",
    ".gitignore",
    ".prettierignore"
   ]
  }
 ],
 "advisories": [
  {
   "at": "2026-10-31T10:16:23.624Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "partial provider ids leave remainder replayed under same key with different payload: noisy reconcile, no duplicate risk"
  },
  {
   "at": "2026-10-31T10:16:23.500Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "light/dark not checked visually (needs user-started React Email dev preview)"
  },
  {
   "at": "2026-10-31T10:16:23.380Z",
   "type": "advisory",
   "tasks": [
    "T4.1"
   ],
   "text": "T4.1/T4.9 no proof shots of their own (template shots under T4.6); no Design field"
  },
  {
   "at": "2026-10-31T10:16:23.258Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "no proof shots of its own (covered by T4.10); no Design field"
  },
  {
   "at": "2026-10-31T10:16:23.137Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "spec has 5 tests for 4 scenarios (@medium split in two); acceptable"
  },
  {
   "at": "2026-10-31T10:16:23.015Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "stale shots T4.10-1..11 still registered (filename captions, no boxes); 12-18 are good"
  },
  {
   "at": "2026-10-31T10:16:22.855Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "send-script.test.ts:127-139 order test passes even without awaiting connect (mock connect pushes synchronously); use a deferred connect"
  },
  {
   "at": "2026-10-31T10:16:22.678Z",
   "type": "advisory",
   "tasks": [
    "T4.11"
   ],
   "text": "bun run verify runs lint/check with --fix (mutating); verifier ran non-mutating bun run check + vp lint (0 errors)"
  },
  {
   "at": "2026-10-31T10:08:47.200Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "partial provider ids leave a shrunken pending batch under the same key; replay likely rejected until stale"
  },
  {
   "at": "2026-10-31T10:08:47.121Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "light/dark not visually checked; color-scheme light only"
  },
  {
   "at": "2026-10-31T10:08:47.046Z",
   "type": "advisory",
   "tasks": [
    "T4.9"
   ],
   "text": "T4.1/T4.9 have no shots of their own; template shots under T4.6"
  },
  {
   "at": "2026-10-31T10:08:46.966Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "no shots of its own; covered by T4.10-12..18"
  },
  {
   "at": "2026-10-31T10:08:46.842Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "stale shots T4.10-1..11 still registered (filename captions, no boxes)"
  },
  {
   "at": "2026-10-31T10:01:05.588Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "light/dark React Email preview not visually reviewed (needs user-started dev preview); template uses color-scheme light only"
  },
  {
   "at": "2026-10-31T10:01:05.483Z",
   "type": "advisory",
   "tasks": [
    "T4.7"
   ],
   "text": "Verify line omits src/models/user.test.ts so user.ts shows 0%; with it all 3 files 100%"
  },
  {
   "at": "2026-10-31T10:01:05.380Z",
   "type": "advisory",
   "tasks": [
    "T4.9"
   ],
   "text": "T4.1/T4.9 have no shots of their own (template shots under T4.6); no Design field"
  },
  {
   "at": "2026-10-31T10:01:05.278Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "no shots of its own (server-rendered pages covered by T4.10-12..18); no Design field"
  },
  {
   "at": "2026-10-31T10:01:05.179Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "stale shots T4.10-1..11 (filename captions, no boxes) still registered; 12-18 are good"
  },
  {
   "at": "2026-10-31T10:01:05.053Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "pickRunRecipients subtracts pending count: a pending batch that fails every run (4xx or payload drift -> key mismatch) zeroes fresh allowance forever; campaign stalls"
  },
  {
   "at": "2026-10-29T15:19:16.493Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "color-scheme light only; light/dark preview not visually verified"
  },
  {
   "at": "2026-10-29T15:19:16.401Z",
   "type": "advisory",
   "tasks": [
    "T4.7"
   ],
   "text": "Verify command omits user.test.ts so user.ts shows 0%; with it 100%"
  },
  {
   "at": "2026-10-29T15:19:16.306Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "stale shots T4.10-1..11 still registered with filename captions, no boxes"
  },
  {
   "at": "2026-10-29T15:19:16.188Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "no T4.3 shots; unsubscribe pages covered by T4.10-12..18"
  },
  {
   "at": "2026-10-29T15:19:15.976Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "batching.ts:92-96 comment overclaims rerun idempotency (holds only if the eligible set is unchanged)"
  },
  {
   "at": "2026-10-29T15:19:15.802Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "recipients.ts:38-43 order-dependent dedupe: lower-_id unsent account sharing an address with a later sent/opted-out account is mailed"
  },
  {
   "at": "2026-10-29T15:07:33.861Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "color-scheme meta is light only and card/button text use pure #ffffff; MAIL-3 asks dark-mode safe with no pure-white dependency; light/dark preview not visually verified"
  },
  {
   "at": "2026-10-29T15:07:33.772Z",
   "type": "advisory",
   "tasks": [
    "T4.11"
   ],
   "text": "Verify lines bun --cwd <dir> run test only print bun help; ran via cd <dir> && bun run test. bun run verify (--fix) replaced by vp lint + bun run check"
  },
  {
   "at": "2026-10-29T15:07:33.683Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "apps/api/src/app.ts CORS exemption is outside every Files list (orchestrator-directed); NON_PUBLIC_EMAIL_PATH name is misleading (it matches all non-/email paths)"
  },
  {
   "at": "2026-10-29T15:07:33.593Z",
   "type": "advisory",
   "tasks": [
    "T4.7"
   ],
   "text": "Verify command omits src/models/user.test.ts so user.ts reports 0%; with it all three files are 100%"
  },
  {
   "at": "2026-10-29T15:07:33.506Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "400 test bypasses the console guard via browser.newContext (fixture has no allowlist hook); consider an expected-error hook"
  },
  {
   "at": "2026-10-29T15:07:33.414Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "Proof shots T4.10-1..11 have no annotation boxes; 5-11 captions are filenames and 1-4 duplicate them"
  },
  {
   "at": "2026-10-29T15:07:33.325Z",
   "type": "advisory",
   "tasks": [
    "T4.9"
   ],
   "text": "UI task by heuristic (.tsx) with no registered proof shot and no Design field (unit task)"
  },
  {
   "at": "2026-10-29T15:07:33.228Z",
   "type": "advisory",
   "tasks": [
    "T4.1"
   ],
   "text": "UI task by heuristic (.tsx) with no registered proof shot and no Design field; template shots live under T4.6"
  },
  {
   "at": "2026-10-29T09:42:45.378Z",
   "type": "advisory",
   "tasks": [
    "T3.13"
   ],
   "text": "[flaky-env] mods-reference-image.spec.ts:201 failed once in prod x3 (CORS preflight to the live dev API failed while a concurrent shared rebuild ran); serial prod re-run 18/18 clean"
  },
  {
   "at": "2026-10-29T09:39:26.248Z",
   "type": "advisory",
   "tasks": [
    "T3.11"
   ],
   "text": "[test-quality] v2-intro.spec.ts:126,262 negative toBeHidden after reload has no positive sync on the intro decision (only profile response + composer visible); a late-opening modal could slip past"
  },
  {
   "at": "2026-10-29T09:28:02.307Z",
   "type": "advisory",
   "tasks": [
    "T3.10"
   ],
   "text": "[test-quality] UI task (lists .vue files, no Design field) has no registered proof shot in shots/manifest.json"
  },
  {
   "at": "2026-10-29T09:28:02.232Z",
   "type": "advisory",
   "tasks": [
    "T3.9"
   ],
   "text": "[test-quality] UI task (lists .vue files, no Design field) has no registered proof shot in shots/manifest.json"
  },
  {
   "at": "2026-10-29T09:28:02.137Z",
   "type": "advisory",
   "tasks": [
    "T3.3"
   ],
   "text": "[test-quality] UI task (lists .vue files, no Design field) has no registered proof shot in shots/manifest.json"
  },
  {
   "at": "2026-10-29T09:24:56.587Z",
   "type": "advisory",
   "tasks": [
    "T3.6"
   ],
   "text": "[test-quality] shots/3/T3.6-1.webp has no annotation; voice clip (slide 5) is wide, not tightly cropped to the mic"
  },
  {
   "at": "2026-10-29T09:24:56.513Z",
   "type": "advisory",
   "tasks": [
    "T3.13"
   ],
   "text": "[flaky-env] bun run verify not run by verifier (it applies --fix); substituted vp lint + bun run check: 0 errors, 6 warnings in test files"
  },
  {
   "at": "2026-10-29T09:24:56.440Z",
   "type": "advisory",
   "tasks": [
    "T3.3"
   ],
   "text": "[code-bug] scope: Composer/ModelChip.vue (model-picker anchor) and shared types/domain.ts (T3.1) edited outside Files; documented builder decisions"
  },
  {
   "at": "2026-10-29T09:24:56.364Z",
   "type": "advisory",
   "tasks": [
    "T3.11"
   ],
   "text": "[test-quality] v2-intro.spec.ts:6 expected titles/alt/poster come from production slides.ts, not independent literals; PUT failure simulated as 200 non-JSON, retry not asserted in e2e"
  },
  {
   "at": "2026-10-29T09:24:56.286Z",
   "type": "advisory",
   "tasks": [
    "T3.6"
   ],
   "text": "[test-quality] Verify says v2-intro.spec covers media attributes and lazy-load; it does not (only unit WhatsNewModal.test.ts:96, IntroSlide.test.ts:37)"
  },
  {
   "at": "2026-10-29T09:24:56.213Z",
   "type": "advisory",
   "tasks": [
    "T3.6"
   ],
   "text": "[code-bug] IntroSlide.vue:40 video has no autoplay attribute (plays via play()); IntroSlide.vue:29 .catch(() => undefined) silently swallows the play() rejection"
  },
  {
   "at": "2026-10-29T09:24:56.138Z",
   "type": "advisory",
   "tasks": [
    "T3.7"
   ],
   "text": "[test-quality] Verify command omits src/models/user.test.ts, so user.ts reports 0% with it; 100% on all metrics when user.test.ts is included"
  },
  {
   "at": "2026-10-29T09:24:56.046Z",
   "type": "advisory",
   "tasks": [
    "T3.11"
   ],
   "text": "[flaky-env] e2e/qa/v2-intro.spec.ts:42 route.fetch fails under E2E_SERVER=prod (self-signed API cert, prod config sets ignoreHTTPSErrors false): 33/33 v2-intro tests fail in prod; verified in dev 40/40 x3"
  },
  {
   "at": "2026-10-28T12:39:46.392Z",
   "type": "advisory",
   "tasks": [
    "T2.7"
   ],
   "text": "Branch coverage 90.38–93.65% on voice composables; uncovered branches are defensive (SSR, empty samples, optional headers). Lines/functions ≥99%."
  },
  {
   "at": "2026-10-28T12:10:50.495Z",
   "type": "advisory",
   "tasks": [
    "T2.7"
   ],
   "text": "Branch coverage 90-94% (floor met, target >95 not): useVoiceInput 90.38, useWebSpeech 91.66, useGrokRecorder 93.65, useAudioLevel 93.33"
  },
  {
   "at": "2026-10-27T18:18:14.352Z",
   "type": "advisory",
   "tasks": [
    "T1.16"
   ],
   "text": "bun run verify skipped (writes via --fix); bun run check exit 0"
  },
  {
   "at": "2026-10-27T18:18:14.277Z",
   "type": "advisory",
   "tasks": [
    "T1.12"
   ],
   "text": "generate.ts branches 90.32% and ReferenceImageControl funcs 93.33% (threshold met)"
  },
  {
   "at": "2026-10-27T18:18:14.201Z",
   "type": "advisory",
   "tasks": [
    "T1.11"
   ],
   "text": "generation-service branches 94.44% (target >95%, threshold met)"
  },
  {
   "at": "2026-10-27T18:11:14.088Z",
   "type": "advisory",
   "tasks": [
    "T1.12"
   ],
   "text": "Coverage >=90 but under >95 target on generate.ts branches and ReferenceImageControl funcs"
  },
  {
   "at": "2026-10-27T18:07:10.553Z",
   "type": "advisory",
   "tasks": [
    "T1.12"
   ],
   "text": "generate.ts branches 90.32% meets 90 and misses the >95 target (unit-a3, not re-run)."
  },
  {
   "at": "2026-10-27T18:07:10.472Z",
   "type": "advisory",
   "tasks": [
    "T1.11"
   ],
   "text": "generation-service.ts branches 94.44% meets 90 and misses the >95 target (unit-a3, not re-run)."
  },
  {
   "at": "2026-10-27T18:07:10.389Z",
   "type": "advisory",
   "tasks": [
    "T1.9"
   ],
   "text": "Lighthouse best-practices was not run; icon/manifest HTTP check failed on repeat 3 after preview exit 143."
  },
  {
   "at": "2026-10-27T17:44:14.711Z",
   "type": "advisory",
   "tasks": [
    "T1.14"
   ],
   "text": "Upload-failure e2e uses baseTest and skips the QA console guard."
  },
  {
   "at": "2026-10-27T17:44:14.632Z",
   "type": "advisory",
   "tasks": [
    "T1.9"
   ],
   "text": "Lighthouse icon/manifest check was not run; icon URL 200s passed in Playwright only."
  },
  {
   "at": "2026-10-27T17:09:29.919Z",
   "type": "advisory",
   "tasks": [
    "T1.1"
   ],
   "text": "bun --cwd packages/shared run build exited ENOENT; cd packages/shared && bun run build exited 0."
  },
  {
   "at": "2026-10-27T17:09:29.845Z",
   "type": "advisory",
   "tasks": [
    "T1.9"
   ],
   "text": "Lighthouse icon/manifest check and visual favicon comparison were not run; icon URL test passed 3/3 on prod."
  },
  {
   "at": "2026-10-27T17:09:29.766Z",
   "type": "advisory",
   "tasks": [
    "T1.12"
   ],
   "text": "Branch coverage is above the 90% bar but under the 95% target (generate.ts 90.32, ReferenceImageControl.vue 92.5, aside.ts 93.61)."
  },
  {
   "at": "2026-10-27T16:29:01.977Z",
   "type": "advisory",
   "tasks": [
    "T1.9"
   ],
   "text": "prod preview never listened; lighthouse and favicon visual compare not run"
  },
  {
   "at": "2026-10-27T16:29:01.901Z",
   "type": "advisory",
   "tasks": [
    "T1.12"
   ],
   "text": "branch coverage under 95 target: generate.ts 90.32, aside.ts 93.61, ReferenceImageControl.vue 92.5 funcs 93.33"
  },
  {
   "at": "2026-10-27T16:29:01.825Z",
   "type": "advisory",
   "tasks": [
    "T1.11"
   ],
   "text": "generation-service.ts branches 94.44% (threshold 90, target >95)"
  }
 ],
 "activity": [
  {
   "at": "2026-10-31T10:21:11.216Z",
   "type": "commit",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "3",
   "text": "feat(v2-launch): phase 4 V2 announcement email",
   "sha": "6567f51dd046142ddc62b80411ad70f12dc5e011",
   "branch": "feature-enhancement",
   "pushed": "yes",
   "evidence": "e2e 16/16 x3 dev+prod, lowest unit coverage 90% (recipients.ts branches), root 2097/2097, api 837"
  },
  {
   "at": "2026-10-31T10:20:40.420Z",
   "type": "deliverable",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "text": "V2 announcement email: template, unsubscribe flow, send script with durable batch replay, gate fix for Node 26 webstorage",
   "files": [
    "packages/email",
    "apps/api",
    "apps/web",
    "vite.config.ts"
   ]
  },
  {
   "at": "2026-10-31T10:20:40.318Z",
   "type": "verify_passed",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-31T10:19:24.737Z",
   "type": "task_started",
   "tasks": [
    "T4.11"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-31T10:19:24.612Z",
   "type": "build_started",
   "tasks": [
    "T4.11"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-31T10:17:02.505Z",
   "type": "blocked",
   "tasks": [
    "T4.11"
   ],
   "text": "retries exhausted",
   "unblock": "Pin Node<=25 (or disable webstorage in vitest config) then re-run gate root bun run test"
  },
  {
   "at": "2026-10-31T10:17:02.376Z",
   "type": "verify_failed",
   "tasks": [
    "T4.11"
   ],
   "attempt": "3",
   "text": "flaky-env: root bun run test fails under Node 26 (localStorage), passes 2097/2097 with NODE_OPTIONS=--no-experimental-webstorage"
  },
  {
   "at": "2026-10-31T10:16:23.624Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "partial provider ids leave remainder replayed under same key with different payload: noisy reconcile, no duplicate risk"
  },
  {
   "at": "2026-10-31T10:16:23.500Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "light/dark not checked visually (needs user-started React Email dev preview)"
  },
  {
   "at": "2026-10-31T10:16:23.380Z",
   "type": "advisory",
   "tasks": [
    "T4.1"
   ],
   "text": "T4.1/T4.9 no proof shots of their own (template shots under T4.6); no Design field"
  },
  {
   "at": "2026-10-31T10:16:23.258Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "no proof shots of its own (covered by T4.10); no Design field"
  },
  {
   "at": "2026-10-31T10:16:23.137Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "spec has 5 tests for 4 scenarios (@medium split in two); acceptable"
  },
  {
   "at": "2026-10-31T10:16:23.015Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "stale shots T4.10-1..11 still registered (filename captions, no boxes); 12-18 are good"
  },
  {
   "at": "2026-10-31T10:16:22.855Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "send-script.test.ts:127-139 order test passes even without awaiting connect (mock connect pushes synchronously); use a deferred connect"
  },
  {
   "at": "2026-10-31T10:16:22.678Z",
   "type": "advisory",
   "tasks": [
    "T4.11"
   ],
   "text": "bun run verify runs lint/check with --fix (mutating); verifier ran non-mutating bun run check + vp lint (0 errors)"
  },
  {
   "at": "2026-10-31T10:10:52.787Z",
   "type": "verify_started",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-31T10:10:02.804Z",
   "type": "task_started",
   "tasks": [
    "T4.4",
    "T4.5"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-31T10:10:02.724Z",
   "type": "build_started",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-31T10:10:02.619Z",
   "type": "verify_failed",
   "tasks": [
    "T4.4",
    "T4.5"
   ],
   "attempt": "2",
   "text": "code-bug: loadPendingBatches runs before mongoose.connect so real --confirm buffers 10s and dies"
  },
  {
   "at": "2026-10-31T10:08:47.200Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "partial provider ids leave a shrunken pending batch under the same key; replay likely rejected until stale"
  },
  {
   "at": "2026-10-31T10:08:47.121Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "light/dark not visually checked; color-scheme light only"
  },
  {
   "at": "2026-10-31T10:08:47.046Z",
   "type": "advisory",
   "tasks": [
    "T4.9"
   ],
   "text": "T4.1/T4.9 have no shots of their own; template shots under T4.6"
  },
  {
   "at": "2026-10-31T10:08:46.966Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "no shots of its own; covered by T4.10-12..18"
  },
  {
   "at": "2026-10-31T10:08:46.842Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "stale shots T4.10-1..11 still registered (filename captions, no boxes)"
  },
  {
   "at": "2026-10-31T10:03:40.145Z",
   "type": "verify_started",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-10-31T10:01:48.614Z",
   "type": "task_started",
   "tasks": [
    "T4.4"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-10-31T10:01:48.528Z",
   "type": "build_started",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-10-31T10:01:48.428Z",
   "type": "verify_failed",
   "tasks": [
    "T4.4"
   ],
   "attempt": "1",
   "text": "code-bug: pendingKey replayed with no age limit; Resend idempotency keys expire (~24h), late replay duplicates and mails opted-out users"
  },
  {
   "at": "2026-10-31T10:01:05.588Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "light/dark React Email preview not visually reviewed (needs user-started dev preview); template uses color-scheme light only"
  },
  {
   "at": "2026-10-31T10:01:05.483Z",
   "type": "advisory",
   "tasks": [
    "T4.7"
   ],
   "text": "Verify line omits src/models/user.test.ts so user.ts shows 0%; with it all 3 files 100%"
  },
  {
   "at": "2026-10-31T10:01:05.380Z",
   "type": "advisory",
   "tasks": [
    "T4.9"
   ],
   "text": "T4.1/T4.9 have no shots of their own (template shots under T4.6); no Design field"
  },
  {
   "at": "2026-10-31T10:01:05.278Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "no shots of its own (server-rendered pages covered by T4.10-12..18); no Design field"
  },
  {
   "at": "2026-10-31T10:01:05.179Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "stale shots T4.10-1..11 (filename captions, no boxes) still registered; 12-18 are good"
  },
  {
   "at": "2026-10-31T10:01:05.053Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "pickRunRecipients subtracts pending count: a pending batch that fails every run (4xx or payload drift -> key mismatch) zeroes fresh allowance forever; campaign stalls"
  },
  {
   "at": "2026-10-31T09:56:38.987Z",
   "type": "verify_started",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-31T09:56:13.733Z",
   "type": "task_built",
   "tasks": [
    "T4.4"
   ],
   "text": "durable pending-batch reservation (announcements.v2.pendingKey) replayed first; opt-out + changed-flag rerun tests; bun run check exit 0; 137 tests pass",
   "files": [
    "apps/api/src/lib/v2-announcement/batching.ts",
    "apps/api/src/lib/v2-announcement/modes.ts",
    "apps/api/src/lib/v2-announcement/recipients.ts",
    "apps/api/scripts/send-v2-announcement.ts",
    "apps/api/src/models/user.ts"
   ]
  },
  {
   "at": "2026-10-31T09:53:58.846Z",
   "type": "task_started",
   "tasks": [
    "T4.4"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-31T09:53:58.751Z",
   "type": "build_started",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-29T15:19:39.907Z",
   "type": "blocked",
   "tasks": [
    "T4.4",
    "T4.8",
    "T4.10"
   ],
   "text": "retries exhausted",
   "unblock": "Persist accepted batch (key + userIds) or per-user pending marker before calling Resend and replay it on rerun; add tests for opt-out between runs and changed flags; prettier the two files"
  },
  {
   "at": "2026-10-29T15:19:39.702Z",
   "type": "verify_failed",
   "tasks": [
    "T4.4",
    "T4.8",
    "T4.10"
   ],
   "attempt": "3",
   "text": "[code-bug] crash-rerun idempotency key not persisted (opt-out or changed flags between runs duplicates sends); [type-lint] bun run check formatting in modes.test.ts and v2-email-unsubscribe.spec.ts"
  },
  {
   "at": "2026-10-29T15:19:16.493Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "color-scheme light only; light/dark preview not visually verified"
  },
  {
   "at": "2026-10-29T15:19:16.401Z",
   "type": "advisory",
   "tasks": [
    "T4.7"
   ],
   "text": "Verify command omits user.test.ts so user.ts shows 0%; with it 100%"
  },
  {
   "at": "2026-10-29T15:19:16.306Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "stale shots T4.10-1..11 still registered with filename captions, no boxes"
  },
  {
   "at": "2026-10-29T15:19:16.188Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "no T4.3 shots; unsubscribe pages covered by T4.10-12..18"
  },
  {
   "at": "2026-10-29T15:19:15.976Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "batching.ts:92-96 comment overclaims rerun idempotency (holds only if the eligible set is unchanged)"
  },
  {
   "at": "2026-10-29T15:19:15.802Z",
   "type": "advisory",
   "tasks": [
    "T4.4"
   ],
   "text": "recipients.ts:38-43 order-dependent dedupe: lower-_id unsent account sharing an address with a later sent/opted-out account is mailed"
  },
  {
   "at": "2026-10-29T15:13:51.457Z",
   "type": "verify_started",
   "tasks": [
    "T4.1",
    "T4.2",
    "T4.3",
    "T4.4",
    "T4.5",
    "T4.6",
    "T4.7",
    "T4.8",
    "T4.9",
    "T4.10",
    "T4.11"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-29T15:13:44.575Z",
   "type": "task_built",
   "tasks": [
    "T4.10"
   ],
   "text": "e2e 16/16 x3 under dev and prod",
   "files": [
    "apps/web/e2e/qa/v2-email-unsubscribe.spec.ts"
   ]
  },
  {
   "at": "2026-10-29T15:12:19.738Z",
   "type": "task_started",
   "tasks": [
    "T4.10"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-29T15:12:19.652Z",
   "type": "task_built",
   "tasks": [
    "T4.8"
   ],
   "text": "unit lowest 96.15% branches (5 files, 110 tests)",
   "files": [
    "apps/api/src/lib/v2-announcement/recipients.test.ts",
    "apps/api/src/lib/v2-announcement/modes.test.ts",
    "apps/api/src/lib/v2-announcement/send-script.test.ts",
    "apps/api/src/lib/v2-announcement/batching.test.ts"
   ]
  },
  {
   "at": "2026-10-29T15:10:50.804Z",
   "type": "task_started",
   "tasks": [
    "T4.8"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-29T15:10:35.064Z",
   "type": "task_built",
   "tasks": [
    "T4.4"
   ],
   "text": "retry: gitignore exception, email dedupe incl sent/opted-out, atomic bulk markBatchSent",
   "files": [
    "apps/api/scripts/send-v2-announcement.ts",
    "apps/api/src/lib/v2-announcement/batching.ts",
    "apps/api/src/lib/v2-announcement/recipients.ts"
   ]
  },
  {
   "at": "2026-10-29T15:08:24.114Z",
   "type": "task_started",
   "tasks": [
    "T4.4"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-29T15:08:24.025Z",
   "type": "build_started",
   "tasks": [
    "T4.4",
    "T4.8",
    "T4.10"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-10-29T15:08:23.935Z",
   "type": "verify_failed",
   "tasks": [
    "T4.4",
    "T4.8",
    "T4.10"
   ],
   "attempt": "2",
   "text": "[code-bug] CLI script gitignored; dedupe vs already-sent emails; crash-rerun idempotency unproven; [test-quality] e2e fails under E2E_SERVER=prod (self-signed cert on request ctx)"
  },
  {
   "at": "2026-10-29T15:07:33.861Z",
   "type": "advisory",
   "tasks": [
    "T4.6"
   ],
   "text": "color-scheme meta is light only and card/button text use pure #ffffff; MAIL-3 asks dark-mode safe with no pure-white dependency; light/dark preview not visually verified"
  },
  {
   "at": "2026-10-29T15:07:33.772Z",
   "type": "advisory",
   "tasks": [
    "T4.11"
   ],
   "text": "Verify lines bun --cwd <dir> run test only print bun help; ran via cd <dir> && bun run test. bun run verify (--fix) replaced by vp lint + bun run check"
  },
  {
   "at": "2026-10-29T15:07:33.683Z",
   "type": "advisory",
   "tasks": [
    "T4.3"
   ],
   "text": "apps/api/src/app.ts CORS exemption is outside every Files list (orchestrator-directed); NON_PUBLIC_EMAIL_PATH name is misleading (it matches all non-/email paths)"
  },
  {
   "at": "2026-10-29T15:07:33.593Z",
   "type": "advisory",
   "tasks": [
    "T4.7"
   ],
   "text": "Verify command omits src/models/user.test.ts so user.ts reports 0%; with it all three files are 100%"
  },
  {
   "at": "2026-10-29T15:07:33.506Z",
   "type": "advisory",
   "tasks": [
    "T4.10"
   ],
   "text": "400 test bypasses the console guard via browser.newContext (fixture has no allowlist hook); consider an expected-error hook"
  }
 ]
};
