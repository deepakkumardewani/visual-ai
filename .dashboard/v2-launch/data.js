window.DASHBOARD = {
 "generatedAt": "2026-10-28T15:09:19.888Z",
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
  "tasks": 50,
  "byStatus": {
   "verified": 28,
   "ready": 22
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
   "endLine": 492,
   "adds": "A one-time \"What's new in V2\" modal per account with an optional guided tour, reopenable from the user menu.",
   "tryInUi": [
    "Sign in with an account that has not seen it and see the modal once",
    "dismiss, reload and confirm it stays gone",
    "open the user menu and choose \"What's new\"",
    "click \"Show me around\" on the last slide and step through the tour."
   ],
   "checkpoint": {
    "title": "Checkpoint 3",
    "line": 489,
    "items": [
     "Intro shows once per account, reopens from the menu, tour degrades gracefully; screenshots final."
    ]
   },
   "tasks": [
    {
     "id": "T3.1",
     "title": "Intro-seen persistence",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/shared/src/models/intro.ts (new: CURRENT_INTRO_VERSION = 'v2'",
      "KNOWN_INTRO_VERSIONS)",
      "apps/api/src/models/user.ts (locate with grep",
      "adds seenIntroVersion: { type: String",
      "default: null })",
      "apps/api/src/routes/users.ts"
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
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.2",
     "title": "Show rule and modal shell",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/composables/useIntro.ts",
      "apps/web/src/components/Intro/WhatsNewModal.vue",
      "apps/web/src/components/Intro/IntroSlide.vue",
      "apps/web/src/components/Header/UserMenu.vue",
      "apps/web/src/components/Dashboard/DashboardShell.vue (mount point)"
     ],
     "gherkin": null,
     "do": "`useIntro`: show only when logged in, profile loaded, `seenIntroVersion !== CURRENT_INTRO_VERSION` and localStorage `intro-seen:<userId>` unset (skip without waiting if the flag is set; no render before profile loads; delay until dashboard mounted; `storage` event closes a second tab). On dismiss write localStorage first, then PUT (retry once). `WhatsNewModal` with placeholder slides, `role=\"dialog\"` + `aria-roledescription=\"carousel\"`, live region, dots, prev/next, Skip, arrows, Esc = skip, focus trap, swipe, reduced-motion instant swap, full-bleed sheet under 640px. \"What's new\" item in `UserMenu.vue` opens it regardless of seen state without any DB write. Logged-out visitors never see it.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Visibility matrix correct (DB flag x localStorage x profile loading); reopen does not alter the DB; PUT failure leaves the localStorage guard in place."
     ],
     "verify": [
      "bun --cwd apps/web run test -- useIntro WhatsNewModal",
      "bun run check",
      "cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2"
     ],
     "line": 393,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.3",
     "title": "Tour anchors (`data-tour` attributes)",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Dashboard/ModelPicker/ModelPickerTrigger.vue",
      "apps/web/src/components/Header/CreditsChip.vue",
      "apps/web/src/components/Header/UserMenu.vue",
      "apps/web/src/components/Dashboard/Composer/PromptBar.vue",
      "apps/web/src/components/Dashboard/Composer/ReferenceImageControl.vue"
     ],
     "gherkin": null,
     "do": "Add stable `data-tour` attributes on the owning root elements: `model-picker`, `credits`, `user-menu`, `prompt-bar`, `ref-image` (the mic's `data-tour=\"mic\"` already exists from T2.3). T3.4's `tour.ts` keeps these names in one exported constant map that its steps use. No behaviour change.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All six anchors (`model-picker`, `prompt-bar`, `mic`, `ref-image`, `credits`, `user-menu`) are present in the rendered dashboard; existing component tests still pass."
     ],
     "verify": [
      "`grep -rn 'data-tour=' apps/web/src/components | wc -l` is at least 6",
      "bun --cwd apps/web run test -- ModelPickerTrigger CreditsChip UserMenu PromptBar ReferenceImageControl",
      "bun run check"
     ],
     "line": 404,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.4",
     "title": "Driver.js tour",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/components/Intro/tour.ts",
      "apps/web/src/components/Intro/WhatsNewModal.vue",
      "apps/web/package.json"
     ],
     "gherkin": null,
     "do": "Add `driver.js` (MIT; listed in SPEC dependencies). Steps target the `data-tour` anchors from T3.3 and T2.3 (model picker, prompt bar, mic, ref-image upload, credits chip, user menu). Filter out missing/hidden elements before start; if fewer than 2 remain, skip with a toast. Semantic-token popover, `animate: false` under reduced motion. \"Show me around\" starts the tour; both it and \"Done\" mark seen. Ready-checks for lazily rendered elements.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Step filtering correct on desktop and mobile; fewer-than-2 case toasts and skips; both final buttons mark seen."
     ],
     "verify": [
      "bun install",
      "bun --cwd apps/web run test -- tour",
      "bun run check",
      "cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2"
     ],
     "line": 415,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.5",
     "title": "Real slides and screenshots (capture last)",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/public/intro/slide-{1..6}.webp (one generated set",
      "4-6 files)",
      "apps/web/src/components/Intro/slides.ts"
     ],
     "gherkin": null,
     "do": "Finalize 4-6 slides from `git log master..feature-enhancement` (candidates: model lineup, tools, redesigned UI/themes, voice prompts, multiple reference images, payments/credits). Capture from the running app at 1440x900 (dark primary) with agent-browser (do not start the app); no emails or real user content visible. Convert to WebP (q ~80, width <= 1200, each < 150 KB) with `sharp`/`cwebp` one-off. Slides data includes `alt`, `width`, `height`; images lazy-loaded.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "4-6 slides; each file < 150 KB and <= 1200 wide; no CLS (dimensions set); no personal data visible; alt text on all."
     ],
     "verify": [
      "`find apps/web/public/intro -name \"*.webp\" -size +150k` returns nothing",
      "`cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2` (slides load, dimensions set)",
      "`agent-browser: review each slide screenshot for sensitive data` (visual check only; no `qa-seed.init.js` exists in this repo, so open the running app signed in as the QA user from `e2e/fixtures/qa.ts`)"
     ],
     "line": 427,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.6",
     "title": "Unit: intro persistence API",
     "done": false,
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
     "line": 438,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.7",
     "title": "Unit: intro logic",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/composables/useIntro.ts",
      "apps/web/src/components/Intro/tour.ts",
      "apps/web/src/components/Intro/slides.ts"
     ],
     "gherkin": null,
     "do": "Matrix of DB flag x localStorage x profile-loading; PUT retry once then localStorage guard; storage-event second tab; tour step filtering and <2 skip; slide data shape (alt, width, height, cap 6).",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/composables/useIntro.test.ts src/components/Intro --coverage --coverage.include=src/composables/useIntro.ts --coverage.include=src/components/Intro/tour.ts --coverage.include=src/components/Intro/slides.ts --coverage.reporter=text"
     ],
     "line": 446,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.8",
     "title": "Unit: intro components",
     "done": false,
     "kind": "unit",
     "depends": [],
     "files": [
      "apps/web/src/components/Intro/WhatsNewModal.vue",
      "apps/web/src/components/Intro/IntroSlide.vue",
      "apps/web/src/components/Header/UserMenu.vue"
     ],
     "gherkin": null,
     "do": "Carousel semantics, keyboard (arrows, Esc, Tab trap), dots/prev/next/Skip, final-slide buttons, reopen from the menu without a DB write, reduced-motion path.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "Every file >= 90% on all four metrics (repo threshold), target > 95%."
     ],
     "verify": [
      "cd apps/web && bunx vitest run src/components/Intro src/components/Header/UserMenu.test.ts --coverage --coverage.include=src/components/Intro/WhatsNewModal.vue --coverage.include=src/components/Intro/IntroSlide.vue --coverage.include=src/components/Header/UserMenu.vue --coverage.reporter=text"
     ],
     "line": 454,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.9",
     "title": "E2E: intro once-only and tour",
     "done": false,
     "kind": "e2e",
     "depends": [],
     "files": [],
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
     "line": 462,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T3.10",
     "title": "Gate: Phase 3",
     "done": false,
     "kind": "gate",
     "depends": [],
     "files": [],
     "gherkin": null,
     "do": "Run all evidence; regression for Phases 1-2. Cross-device \"other browser sees nothing\" needs the user to confirm with a real second browser at the checkpoint.",
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "All Phase 3 AC met; slides < 150 KB; intro once-only per account (DB + localStorage) proven by QA spec."
     ],
     "verify": [
      "`bun run test` and `bun --cwd apps/api run test`",
      "bun run verify",
      "bun run build:web",
      "cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts e2e/qa/voice-input.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=2"
     ],
     "line": 477,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 10,
   "complete": false
  },
  {
   "id": "4",
   "name": "V2 announcement email",
   "startLine": 493,
   "endLine": 616,
   "adds": "A React Email V2 announcement template, a resumable and idempotent Resend send script (dry-run, test-send, capped real send), and a working one-click unsubscribe. No real send happens in this phase's tasks.",
   "tryInUi": [
    "Open the unsubscribe confirm page from a signed link and confirm it sets opt-out",
    "run `cd apps/api && bun scripts/send-v2-announcement.ts --dry-run` and open the printed HTML preview",
    "run `bun --cwd packages/email run dev` and view the template in light and dark."
   ],
   "checkpoint": {
    "title": "Checkpoint 4",
    "line": 613,
    "items": [
     "Template, script and unsubscribe verified under mocks and dry-run; ready for the user's `--test-to` send and a separate go-ahead."
    ]
   },
   "tasks": [
    {
     "id": "T4.1",
     "title": "Email workspace scaffold and render",
     "done": false,
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
     "line": 498,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.2",
     "title": "Unsubscribe token and User fields",
     "done": false,
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
     "line": 510,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.3",
     "title": "Public unsubscribe route",
     "done": false,
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
     "line": 520,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.4",
     "title": "Send script core",
     "done": false,
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
     "line": 531,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.5",
     "title": "Modes and guards",
     "done": false,
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
     "line": 541,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.6",
     "title": "Template content and design",
     "done": false,
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
     "line": 552,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.7",
     "title": "Unit: unsubscribe token and route",
     "done": false,
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
      "cd apps/api && bunx vitest run src/lib/unsubscribe-token.test.ts src/routes/email.test.ts --coverage --coverage.include=src/lib/unsubscribe-token.ts --coverage.include=src/routes/email.ts --coverage.include=src/models/user.ts --coverage.reporter=text"
     ],
     "line": 564,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.8",
     "title": "Unit: send script libs",
     "done": false,
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
     "line": 572,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.9",
     "title": "Unit: email template",
     "done": false,
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
     "line": 580,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.10",
     "title": "E2E: unsubscribe flow",
     "done": false,
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
     "line": 588,
     "ui": true,
     "status": "ready",
     "updatedAt": null
    },
    {
     "id": "T4.11",
     "title": "Gate: Phase 4",
     "done": false,
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
     "line": 601,
     "ui": false,
     "status": "ready",
     "updatedAt": null
    }
   ],
   "verified": 0,
   "total": 11,
   "complete": false
  },
  {
   "id": "5",
   "name": "Definition of done",
   "startLine": 617,
   "endLine": 638,
   "adds": "Final bundle-wide regression and sign-off across all four tracks. No new behaviour.",
   "tryInUi": [
    "Walk the Phase 1-3 \"Try in UI\" steps once more on a fresh session",
    "confirm a new account shows 30 credits and the intro appears once."
   ],
   "checkpoint": {
    "title": "Checkpoint 5",
    "line": 637,
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
      "Setup and gates green: T0.1, T0.2, T1.16, T2.10, T3.10, T4.11.",
      "Track evidence: MOD via T1.11-T1.15; STT via T2.6-T2.9; INTRO via T3.6-T3.9; MAIL via T4.7-T4.10.",
      "No open SPEC_ISSUE; MOD-2 grep clean; no secrets or `.env` in `git status`; nothing sent to real recipients."
     ],
     "verify": [
      "bun --cwd packages/shared run build && bun run test && bun --cwd apps/api run test && bun --cwd packages/email run test",
      "`bun run verify` and `bun run check:model-docs` and `bun run build:web`",
      "cd apps/web && bunx playwright test e2e/qa --repeat-each=2",
      "`git status --short` shows no `.env` or key material"
     ],
     "line": 622,
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
 "nextCommand": "/build-phases agent_docs/v2-launch/TASKS.md phase 3",
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
  }
 ],
 "deliverables": [
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
   "at": "2026-10-28T13:13:44.043Z",
   "type": "task_built",
   "tasks": [
    "T2.3",
    "T2.4",
    "T2.5"
   ],
   "text": "7 DASH proof shots registered for UI ACs",
   "files": [
    ".dashboard/v2-launch/shots/"
   ]
  },
  {
   "at": "2026-10-28T13:05:55.299Z",
   "type": "task_started",
   "tasks": [
    "T2.3",
    "T2.4",
    "T2.5"
   ]
  },
  {
   "at": "2026-10-28T12:40:22.768Z",
   "type": "commit",
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
   "text": "feat(stt): speech-to-text in the prompt bar (phase 2)",
   "sha": "6d42f3f2a76d8b6dee3fc5c0832e713134df43aa",
   "branch": "feature-enhancement",
   "pushed": "yes",
   "evidence": "e2e 19/19 prod x3, unit lowest branches 90.38%, check pass"
  },
  {
   "at": "2026-10-28T12:40:08.468Z",
   "type": "verify_passed",
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
   "attempt": "2"
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
   "at": "2026-10-28T12:35:11.962Z",
   "type": "verify_started",
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
   "attempt": "2"
  },
  {
   "at": "2026-10-28T12:35:07.710Z",
   "type": "task_built",
   "tasks": [
    "T2.5"
   ],
   "text": "prettierignore excludes generated d.ts; check stable"
  },
  {
   "at": "2026-10-28T12:34:57.791Z",
   "type": "task_built",
   "tasks": [
    "T2.5"
   ],
   "text": "check exit 0 after vitest/build/e2e; prettierignore excludes unplugin d.ts",
   "files": [
    ".prettierignore"
   ]
  },
  {
   "at": "2026-10-28T12:33:32.556Z",
   "type": "task_started",
   "tasks": [
    "T2.5"
   ]
  },
  {
   "at": "2026-10-28T12:32:05.494Z",
   "type": "task_started",
   "tasks": [
    "T2.5"
   ],
   "attempt": "2"
  },
  {
   "at": "2026-10-28T12:32:05.433Z",
   "type": "build_started",
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
   "attempt": "2"
  },
  {
   "at": "2026-10-28T12:32:05.034Z",
   "type": "verify_failed",
   "tasks": [
    "T2.1",
    "T2.2",
    "T2.3",
    "T2.4",
    "T2.5"
   ],
   "attempt": "1",
   "text": "[type-lint] auto-imports.d.ts components.d.ts format regressed after verify runs"
  },
  {
   "at": "2026-10-28T12:25:14.443Z",
   "type": "verify_started",
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
   "attempt": "1"
  },
  {
   "at": "2026-10-28T12:25:09.232Z",
   "type": "task_built",
   "tasks": [
    "T2.10"
   ],
   "text": "gate verify green; 25 e2e repeat-each=2"
  },
  {
   "at": "2026-10-28T12:25:03.288Z",
   "type": "task_built",
   "tasks": [
    "T2.10"
   ],
   "text": "All Verify green: 1837 unit, verify 0 errors, e2e 25/25 x2, no XAI_API_KEY in web bundle",
   "files": [
    "apps/api/src/lib/logger.test.ts",
    "apps/web/e2e/qa/voice-input.spec.ts"
   ]
  },
  {
   "at": "2026-10-28T12:21:50.365Z",
   "type": "task_started",
   "tasks": [
    "T2.10"
   ]
  },
  {
   "at": "2026-10-28T12:21:42.317Z",
   "type": "task_started",
   "tasks": [
    "T2.10"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-28T12:21:42.315Z",
   "type": "task_built",
   "tasks": [
    "T2.9"
   ],
   "text": "qa fixture + prod repeat-each=3 19/19"
  },
  {
   "at": "2026-10-28T12:16:44.753Z",
   "type": "task_started",
   "tasks": [
    "T2.9"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-28T12:16:44.714Z",
   "type": "task_built",
   "tasks": [
    "T2.6"
   ],
   "text": "env.ts 100% coverage; 46 tests"
  },
  {
   "at": "2026-10-28T12:16:44.645Z",
   "type": "task_built",
   "tasks": [
    "T2.5"
   ],
   "text": "check exit 0; formatted generated d.ts"
  },
  {
   "at": "2026-10-28T12:16:00.930Z",
   "type": "task_started",
   "tasks": [
    "T2.6"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-28T12:15:52.172Z",
   "type": "task_built",
   "tasks": [
    "T2.5"
   ],
   "text": "bun run check exit 0 after formatting auto-imports.d.ts and components.d.ts",
   "files": [
    "apps/web/src/auto-imports.d.ts",
    "apps/web/src/components.d.ts"
   ]
  },
  {
   "at": "2026-10-28T12:15:34.708Z",
   "type": "task_started",
   "tasks": [
    "T2.5"
   ]
  },
  {
   "at": "2026-10-28T12:15:24.201Z",
   "type": "task_started",
   "tasks": [
    "T2.5"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-10-28T12:15:23.967Z",
   "type": "build_started",
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
   "attempt": "1"
  },
  {
   "at": "2026-10-28T12:11:00.696Z",
   "type": "blocked",
   "tasks": [
    "T2.5",
    "T2.6",
    "T2.9",
    "T2.10"
   ],
   "text": "retries exhausted",
   "unblock": "env.ts branch coverage; format auto-imports; voice-input qa fixture; prod E2E load"
  },
  {
   "at": "2026-10-28T12:11:00.603Z",
   "type": "verify_failed",
   "tasks": [
    "T2.5",
    "T2.6",
    "T2.9",
    "T2.10"
   ],
   "attempt": "3",
   "text": "BLOCKING: env branches 87.5%, check format fail, e2e baseTest + prod auth timeout"
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
   "at": "2026-10-28T12:01:49.018Z",
   "type": "verify_started",
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
   "attempt": "3"
  },
  {
   "at": "2026-10-28T12:00:56.683Z",
   "type": "task_built",
   "tasks": [
    "T2.10"
   ],
   "text": "Gate verify: 262 test files, verify pass, 25/25 QA playwright, build:web grep clean",
   "files": [
    "apps/web/src/components/Dashboard/Composer/PromptBar.test.ts",
    "apps/api/src/routes/stt.test.ts",
    "apps/web/src/composables/useVoiceInput.ts",
    "apps/web/src/composables/useAudioLevel.ts",
    "apps/web/src/composables/useAudioLevel.test.ts",
    "apps/web/src/composables/useWebSpeech.test.ts",
    "apps/web/src/composables/useGrokRecorder.test.ts",
    "apps/web/src/composables/useVoiceInput.test.ts",
    "apps/api/src/middlewares/rate-limit.test.ts"
   ]
  },
  {
   "at": "2026-10-28T11:56:38.355Z",
   "type": "task_started",
   "tasks": [
    "T2.10"
   ]
  },
  {
   "at": "2026-10-28T11:55:34.688Z",
   "type": "task_built",
   "tasks": [
    "T2.9"
   ],
   "text": "7 e2e pass; 19 with repeat-each=3"
  },
  {
   "at": "2026-10-28T11:29:04.315Z",
   "type": "task_built",
   "tasks": [
    "T2.8"
   ],
   "text": "33 component tests; 100% coverage all files"
  },
  {
   "at": "2026-10-28T11:29:04.253Z",
   "type": "task_built",
   "tasks": [
    "T2.7"
   ],
   "text": "44 composable tests; >=90% coverage"
  },
  {
   "at": "2026-10-28T11:29:04.236Z",
   "type": "task_started",
   "tasks": [
    "T2.9"
   ]
  },
  {
   "at": "2026-10-28T11:29:04.185Z",
   "type": "task_built",
   "tasks": [
    "T2.6"
   ],
   "text": "45 tests; stt/rate-limit/env coverage PASS"
  },
  {
   "at": "2026-10-28T11:27:59.710Z",
   "type": "task_built",
   "tasks": [
    "T2.5"
   ],
   "text": "Waveform.vue: removed dead bars guard; isolated coverage 100% branches (was 87.5% line 15)",
   "files": [
    "apps/web/src/components/Dashboard/Composer/VoiceInput/Waveform.vue"
   ]
  },
  {
   "at": "2026-10-28T11:27:41.484Z",
   "type": "task_started",
   "tasks": [
    "T2.5"
   ]
  },
  {
   "at": "2026-10-28T11:27:32.934Z",
   "type": "task_failed",
   "tasks": [
    "T2.8"
   ],
   "attempt": "2",
   "text": "Unit FAIL: Waveform.vue branches 87.5% (dead empty-bars branch)",
   "unblock": "Simplify Waveform bars logic or make branch reachable"
  },
  {
   "at": "2026-10-28T11:24:54.217Z",
   "type": "task_started",
   "tasks": [
    "T2.8"
   ]
  },
  {
   "at": "2026-10-28T11:24:42.785Z",
   "type": "task_built",
   "tasks": [
    "T2.5"
   ],
   "text": "No source change; useAudioLevel+Waveform tests 12/12 pass",
   "files": [
    "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue"
   ]
  },
  {
   "at": "2026-10-28T11:24:42.719Z",
   "type": "task_started",
   "tasks": [
    "T2.5"
   ]
  },
  {
   "at": "2026-10-28T11:24:42.640Z",
   "type": "task_built",
   "tasks": [
    "T2.3"
   ],
   "text": "MicButton: hoist injected refs for template unwrap; composable tests 30/30 pass",
   "files": [
    "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue"
   ]
  },
  {
   "at": "2026-10-28T11:23:17.004Z",
   "type": "task_started",
   "tasks": [
    "T2.3"
   ]
  },
  {
   "at": "2026-10-28T11:23:08.458Z",
   "type": "task_failed",
   "tasks": [
    "T2.8"
   ],
   "attempt": "1",
   "text": "Unit FAIL: MicButton Ref/ComputedRef bound as booleans; coverage below 90%",
   "unblock": "Fix MicButton.vue ref unwrapping; re-run T2.8 unit"
  },
  {
   "at": "2026-10-28T11:18:37.185Z",
   "type": "build_started",
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
   "attempt": "1"
  },
  {
   "at": "2026-10-28T11:18:24.354Z",
   "type": "task_built",
   "tasks": [
    "T2.5"
   ],
   "text": "useAudioLevel, Waveform reduced-motion, Esc/visibility cancel",
   "files": [
    "apps/web/src/composables/useAudioLevel.ts",
    "apps/web/src/components/Dashboard/Composer/VoiceInput/Waveform.vue",
    "apps/web/src/composables/useVoiceInput.ts",
    "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue"
   ]
  },
  {
   "at": "2026-10-28T11:18:24.297Z",
   "type": "task_built",
   "tasks": [
    "T2.4"
   ],
   "text": "useWebSpeech + EngineMenu with persistence and fallback",
   "files": [
    "apps/web/src/composables/useWebSpeech.ts",
    "apps/web/src/components/Dashboard/Composer/VoiceInput/EngineMenu.vue",
    "apps/web/src/composables/useVoiceInput.ts",
    "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue"
   ]
  },
  {
   "at": "2026-10-28T11:18:24.236Z",
   "type": "task_built",
   "tasks": [
    "T2.3"
   ],
   "text": "MicButton in PromptBar, useGrokRecorder/useVoiceInput, append-not-replace",
   "files": [
    "apps/web/src/composables/useGrokRecorder.ts",
    "apps/web/src/composables/useVoiceInput.ts",
    "apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue",
    "apps/web/src/components/Dashboard/Composer/PromptBar.vue",
    "apps/web/src/components/Dashboard/Composer/ComposerTextarea.vue"
   ]
  },
  {
   "at": "2026-10-28T11:18:24.166Z",
   "type": "task_built",
   "tasks": [
    "T2.2"
   ],
   "text": "POST /stt with auth, multer, xAI forward, 503 without key",
   "files": [
    "apps/api/src/routes/stt.ts",
    "apps/api/src/routes/index.ts"
   ]
  },
  {
   "at": "2026-10-28T11:18:20.594Z",
   "type": "task_built",
   "tasks": [
    "T2.1"
   ],
   "text": "shared stt constants, sttRateLimiter, optional XAI_API_KEY; api type-check OK",
   "files": [
    "packages/shared/src/models/stt.ts",
    "packages/shared/src/models/index.ts",
    "apps/api/src/middlewares/rate-limit.ts",
    "apps/api/src/config/env.ts",
    "apps/api/.env.example",
    "apps/api/package.json"
   ]
  },
  {
   "at": "2026-10-28T11:16:13.896Z",
   "type": "task_started",
   "tasks": [
    "T2.1"
   ]
  },
  {
   "at": "2026-10-27T18:20:54.522Z",
   "type": "task_built",
   "tasks": [
    "T1.9"
   ],
   "text": "Verify: build:web exit 0; Lighthouse no icon/manifest failures; agent-browser logo vs favicon screenshots",
   "files": [
    ".dashboard/v2-launch/reports/evidence/t1.9-favicon/",
    "apps/web/public/favicon.svg",
    "apps/web/index.html"
   ]
  },
  {
   "at": "2026-10-27T18:20:47.746Z",
   "type": "commit",
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
   "text": "feat(v2-launch): phase 1 Modifications",
   "sha": "2c183ccb8458e615d9c30a92a0cbb11deaa119b6",
   "branch": "feature-enhancement",
   "pushed": "yes",
   "evidence": "check pass; prod e2e 19+13 repeat-each=3; 1733 unit tests"
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
   "at": "2026-10-27T18:20:32.815Z",
   "type": "verify_passed",
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
   "attempt": "2"
  },
  {
   "at": "2026-10-27T18:18:33.276Z",
   "type": "task_started",
   "tasks": [
    "T1.9"
   ]
  },
  {
   "at": "2026-10-27T18:18:26.515Z",
   "type": "verify_failed",
   "tasks": [
    "T1.9"
   ],
   "attempt": "2",
   "text": "[AC] missing lighthouse and visual favicon comparison evidence"
  },
  {
   "at": "2026-10-27T18:18:14.352Z",
   "type": "advisory",
   "tasks": [
    "T1.16"
   ],
   "text": "bun run verify skipped (writes via --fix); bun run check exit 0"
  }
 ]
};
