# Tasks: Visual AI V2 Launch Bundle

Source: `SPEC.md`, `PLAN.md` (read-only). Conventions: `~/.claude/docs/task-conventions.md`.
Rules: never start a server (web and API are always running); browser checks use the seeded QA harness (`apps/web/e2e/qa/`, fixtures in `apps/web/e2e/fixtures/qa.ts`); never commit unless told; no Claude attribution; no real mail send outside `--test-to`.
Legend: ☐ todo, ✅ done. QA command (run from `apps/web`): `bunx playwright test e2e/qa/<spec> --repeat-each=2`.
Phase order: 0 Setup, 1 Modifications, 2 Speech-to-text, 3 V2 intro, 4 V2 email.
Verify timing: an implementation task's Verify that names a test filter or a QA spec is evidence at phase verification, after that phase's `Unit:`/`E2E:` tasks have written those specs (the builder only typechecks and runs specs it touched).
Unit coverage: run with `bunx vitest run` from the package dir; web and api enforce a 90% global coverage threshold, so Unit acceptance is >= 90% (target > 95%). API vitest collects only `src/**/*.test.ts`.

---

## Phase 0: Test harness and e2e server mode

**Adds:** Test-infrastructure only: an opt-in production-server mode for Playwright and the missing gitignore entries. No user-facing change.
**Try in UI:** No UI. Run `cd apps/web && E2E_SERVER=prod E2E_PROD_PORT=4173 bunx playwright test --list` ; run `git check-ignore -v apps/web/.next-e2e .dashboard/x/reports/a coverage/a` and confirm all are ignored.

Findings: Vitest and Playwright are set up, and the seeded QA harness exists (`e2e/qa/`, `e2e/fixtures/qa.ts`), so no `Setup: test harness` task is needed. `playwright.config.ts` has no `webServer` ("app is always running"), so prod-server mode is missing. The root `.gitignore` has `coverage/` and `apps/web/{test-results,playwright-report}/` only.

Kind note: T0.1 and T0.2 are config-only work, which conventions exempt from Unit/E2E tasks, but the dashboard linter requires any phase containing an `implementation` task to end in Unit then E2E tasks. They are therefore `gate` tasks: the builder runs Verify, which fails on today's repo, and fixes the root cause in the listed Files until it passes.

### ✅ T0.1 Setup: e2e prod-server mode

- **Kind:** gate
- **Files:** `apps/web/playwright.config.ts`, `apps/web/e2e/README.md`
- **Do:** Add `E2E_SERVER=dev|prod` selection. Unset or `dev` keeps today's behaviour (no `webServer`; app already running, never started by tests). `prod` sets `webServer` to build then `vp preview` on `E2E_PROD_PORT` with `reuseExistingServer: false` and points `baseURL` at it. Document the convention in `e2e/README.md`.
- **Acceptance:**
  - Default run (no env) is behaviourally unchanged.
  - `E2E_SERVER=prod` config resolves a `webServer` with the build + preview command and `reuseExistingServer: false`.
  - `e2e/README.md` documents `E2E_SERVER` and `E2E_PROD_PORT`.
- **Verify:**
  - `cd apps/web && bunx playwright test --list` lists specs with no env set.
  - `cd apps/web && bun -e "const c=(await import('./playwright.config.ts')).default; if (c.webServer) process.exit(1)"` exits 0 (default has no `webServer`).
  - `cd apps/web && E2E_SERVER=prod E2E_PROD_PORT=4173 bun -e "const c=(await import('./playwright.config.ts')).default; const w=[].concat(c.webServer ?? [])[0]; if (!w || w.reuseExistingServer !== false || !String(w.url ?? w.port).includes('4173')) process.exit(1)"` exits 0 (fails on today's config).
  - `cd apps/web && E2E_SERVER=prod E2E_PROD_PORT=4173 bunx playwright test --list` loads without config error (do not run the suite).
  - `grep -q E2E_PROD_PORT apps/web/e2e/README.md && grep -q E2E_SERVER apps/web/e2e/README.md`
  - `bun run check`

### ✅ T0.2 Gitignore check

- **Kind:** gate
- **Files:** `.gitignore`
- **Do:** Add any missing: `test-results/`, `playwright-report/`, `coverage/`, `.dashboard/*/reports/`, `.next-e2e` (also `apps/web/.next-e2e`).
- **Acceptance:** All five patterns are ignored at the repo root and under `apps/web`; no tracked file becomes ignored.
- **Verify:**
  - `for p in test-results/a playwright-report/a coverage/a .dashboard/x/reports/a .next-e2e apps/web/test-results/a apps/web/playwright-report/a apps/web/coverage/a apps/web/.next-e2e; do git check-ignore -q "$p" || echo "MISSING $p"; done` prints nothing (fails on today's repo).
  - `git ls-files -ci --exclude-standard` prints nothing (no tracked file is ignored).

🔶 **Checkpoint 0**: Playwright prod-server mode is selectable and artifacts are ignored; default e2e behaviour unchanged.

---

## Phase 1: Modifications

**Adds:** New accounts and referrals get 30 credits (copy follows the constants), reference images in the prompt bar are actually sent to the model (up to the model's max), the favicon matches the logo, and the referral dialog is redesigned.
**Try in UI:** Open the referral dialog in dark and light themes and copy the code ; pick a multi-image model, add 8 reference images and confirm a 9th is blocked, then generate ; switch to a single-image then a no-image model and watch the toasts ; compare the browser tab icon with the header logo.

### ✅ T1.1 Credits constants and referral grant

- **Kind:** implementation
- **Files:** `packages/shared/src/models/credits.ts`, `apps/api/src/routes/users.ts`, `apps/api/src/routes/users.test.ts` (existing assertions only)
- **Do:** SIGNUP_CREDITS and REFERRAL_BONUS to 30 (DAILY_CREDITS stays 30). Replace both hardcoded `$inc: { credits: 50 }` (about lines 176 and 190) with `REFERRAL_BONUS`. Audit the signup path for other literals. No migration, nothing touches existing balances. Rebuild shared.
- **Acceptance:**
  - New user schema default is 30 (via `SIGNUP_CREDITS`).
  - Referral `$inc` for both parties equals `REFERRAL_BONUS`.
  - `grep -rn "credits: 50" apps/api/src` is empty; no script or migration alters existing `credits`.
- **Verify:**
  - `bun --cwd packages/shared run build`
  - `grep -rn "credits: 50" apps/api/src` returns nothing
  - `bun --cwd apps/api run test -- users` (existing assertions that hard-code 50 updated to the constant)
  - `bun run check`

### ✅ T1.2 Copy derives from constants (web source)

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dialogs/ReferralOfferDialog.vue`, `apps/web/src/components/Dialogs/ReferralCopyDialog.vue`, `apps/web/src/utils/featureLandings.ts`, `apps/web/src/utils/seo.ts`
- **Do:** Interpolate `SIGNUP_CREDITS` / `REFERRAL_BONUS` from `@visual-ai/shared` in dialog copy ("50 free credits", "50 bonus credits", "Give 50 credits and earn 50 credits"), the FAQ in `featureLandings.ts` and the JSON-LD built via `seo.ts`. Do not touch `creditPacks.ts`.
- **Acceptance:** No literal 50 for signup/referral remains in these files; rendered values follow the constants.
- **Verify:**
  - `grep -rniE "\b50 (free |bonus )?credits" apps/web/src` shows no signup/referral hits
  - `bun run check`

### ✅ T1.3 Copy derives from constants (static files and stale assertions)

- **Kind:** implementation
- **Files:** `apps/web/public/pricing.md`, `apps/web/public/llms.txt`, `apps/web/src/utils/seo.test.ts`, `apps/web/src/components/Dialogs/ReferralOfferDialog.test.ts`
- **Do:** Edit the Signup row in `pricing.md:11` and any matching `llms.txt` text to 30. Update existing assertions in `seo.test.ts` and `ReferralOfferDialog.test.ts` that hard-code 50 so they compare to the shared constants (new coverage goes in Unit tasks). Rebuild prerender via `bun run build:web`.
- **Acceptance:** SPEC MOD-2 grep returns nothing referring to signup/referral; credit-pack copy untouched; existing tests green.
- **Verify:**
  - `grep -rniE "\b50 (free |bonus )?credits" apps packages --exclude-dir=node_modules --exclude-dir=dist` shows nothing signup/referral related
  - `bun run test`
  - `bun run build:web`

### ✅ T1.4 Shared image limits and reference-image upload endpoint

- **Kind:** implementation
- **Files:** `packages/shared/src/models/image-limits.ts` (new, exported from shared index), `apps/api/src/middlewares/multer.ts`, `apps/api/src/routes/generate.ts`, `apps/web/src/composables/useImageDrop.ts`
- **Do:** Move `MAX_IMAGE_BYTES` (5 MB) and accepted types (jpeg/png/webp) to shared. Add `POST /generate/reference-images` with `requireAuth` applied on the route itself (`generateRoute` is mounted before router-level auth at `routes/index.ts:16`), using Cloudinary `upload.array("images", max)` and the shared limits; returns `{ urls: string[] }`. `useImageDrop.ts` imports the shared constants. Rebuild shared.
- **Acceptance:**
  - 401 when unauthenticated; 400 for wrong type, oversize, or more files than allowed; success returns Cloudinary URLs.
  - Client and API use the same constants (no duplicate literal).
- **Verify:**
  - `bun --cwd packages/shared run build`
  - `bun --cwd apps/api run test -- generate`
  - `bun run check`

### ✅ T1.5 Registry `imageInput.array` and input shaping

- **Kind:** implementation
- **Files:** `packages/shared/src/models/types.ts` (`ModelDefinition.fields.imageInput`, ~line 77), `packages/shared/src/models/registry.ts`, `apps/api/src/lib/model-input.ts`, `docs/MODEL_ONBOARDING.md`
- **Do:** Add explicit `imageInput.array: boolean` to `ModelDefinition.fields.imageInput`. Set it per model from its verified Replicate schema (check each schema; only the `max: 8` model, `input_images`, is multi-image unless a schema proves otherwise). `buildModelInput` writes `input[inputKey]` as an array or a string by the flag, never inferred from `max`. Update `MODEL_ONBOARDING.md`.
- **Acceptance:**
  - Array model receives an array; string model receives a string; zero URLs omits the key.
  - Each model's flag is justified by its schema (note the source in the PR description or `MODEL_ONBOARDING.md`).
- **Verify:**
  - `bun run check:model-docs`
  - `bun --cwd apps/api run test -- model-input`
  - `bun --cwd packages/shared run build`

### ✅ T1.6 `referenceImageUrls` through route, queue and service

- **Kind:** implementation
- **Files:** `apps/api/src/routes/generate.ts`, `apps/api/src/queue/generation-queue.ts` (job data type), `apps/api/src/queue/generation-worker.ts`, `apps/api/src/services/generation-service.ts`
- **Do:** Accept optional `referenceImageUrls: string[]` on `POST /generate/image`. Validate count <= model `imageInput.max ?? 1`, and that every URL is our Cloudinary origin, returning 400 before any credit deduction. Thread the URLs through the queue job data to `generation-service.ts` (~line 353) and into `buildModelInput`. Field optional so old clients work.
- **Acceptance:**
  - Invalid URL, wrong host, over-max, or model without `imageInput` returns 400 and deducts nothing.
  - Valid URLs reach `buildModelInput`; request without the field behaves exactly as before.
- **Verify:**
  - `bun --cwd apps/api run test -- generate`
  - `bun --cwd apps/api run test -- generation-service`
  - `bun run check`

### ✅ T1.7 Reference images store: array, trim, upload-then-send

- **Kind:** implementation
- **Files:** `apps/web/src/stores/aside.ts`, `apps/web/src/stores/generate.ts`
- **Do:** Root cause first (MOD-3.0): confirm whether selecting a model from the left-sidebar picker updates `aside.mode`/`supportsImageInput`; fix if not. Replace `referenceImage` with `referenceImages: ReferenceImage[]`, add `imageInputMax` (`max ?? 1`), revoke object URLs on remove/clear. Model switch replaces the silent clear (~line 152): lower max keeps the first N with a toast naming the removed count; no imageInput clears all with a toast; equal/higher keeps all, no toast. `generateImage()` uploads files to `POST /generate/reference-images` then sends `referenceImageUrls`. Upload failure shows an error toast, sends no generation, deducts no credits. Removing an image while its upload is in flight drops it from `referenceImageUrls` (SPEC MOD-3 edge case). Orphaned Cloudinary uploads after a failed generation are acceptable (note in code comment).
- **Acceptance:**
  - All three model-switch branches behave as above; zero images still generates.
  - Object URLs are revoked on remove, clear and trim.
  - Failed upload: no generate request issued.
  - An image removed during upload is not sent.
- **Verify:**
  - `bun --cwd apps/web run test -- aside generate`
  - `bun run check`

### ✅ T1.8 Prompt bar multi-image UI

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/Composer/PromptBar.vue`, `apps/web/src/components/Dashboard/Composer/ReferenceImageControl.vue`, `apps/web/src/components/Dashboard/Composer/ReferenceThumbnails.vue` (new, extracted strip)
- **Do:** Enable the control when the model has `imageInput`; keep disabled + tooltip (`data-testid="reference-image-disabled"`) otherwise. Thumbnail strip with an accessible per-image remove button; multi-select picker when `max > 1`; extras beyond max rejected with an inline "This model accepts up to N images"; wrong type/oversize messages from shared limits. Same file added twice is allowed. Add `data-testid`s for the QA spec.
- **Acceptance:**
  - Max-8 model accepts 8 and blocks a 9th with the inline message.
  - Each thumbnail has a labelled remove button reachable by keyboard.
  - Disabled state retained for non-imageInput models.
- **Verify:**
  - `bun --cwd apps/web run test -- Composer`
  - `bun run check`
  - Seeded QA spec from T1.14: `cd apps/web && bunx playwright test e2e/qa/mods-reference-image.spec.ts --repeat-each=2`

### ✅ T1.9 Favicon refresh

- **Kind:** implementation
- **Files:** `apps/web/public/{favicon.ico,favicon.svg,apple-touch-icon.png,icon-192.png,icon-512.png}` (one generated icon set from a single master SVG), `apps/web/public/site.webmanifest`, `apps/web/index.html`
- **Do:** Compare `favicon.ico`, `logo.svg`, `index.html` links against `Header/LogoMark.vue` (copper V on #1c1713 rounded square). If mismatched, render a master SVG and generate `favicon.ico` (16/32/48), `favicon.svg`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` (generated PNGs also under `apps/web/public/`); use `sharp` as a dev-only one-off (ask-first dependency, do not add to runtime). Add `site.webmanifest` (none exists) with theme color; add a versioned query to icon links in `index.html`.
- **Acceptance:**
  - Icons visually match the header logo mark.
  - Every referenced icon/manifest URL returns 200.
  - `index.html` links reference versioned URLs; build regenerates prerendered pages with them.
  - Lighthouse reports no icon/manifest warnings (SPEC MOD-4).
- **Verify:**
  - `cd apps/web && bunx playwright test e2e/qa/mods-referral-favicon.spec.ts --repeat-each=2` (icon requests 200)
  - `bun run build:web`
  - `lighthouse-cli` skill against the running web URL: no icon/manifest warnings
  - Visual comparison of tab icon vs header logo: `agent-browser: screenshot of header logo and favicon.svg` (exploratory only)

### ✅ T1.10 ReferralOfferDialog redesign

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dialogs/ReferralOfferDialog.vue`, `apps/web/src/components/AppModal.vue` (only if needed)
- **Do:** Redesign using the `impeccable` and `layout` skills on `AppModal.vue`, semantic tokens only (no hex). Fix: flat mustard slab, low-contrast body, off-token tan copy button, duplicate close affordances (default: drop the "Close" pill). Content: headline from `REFERRAL_BONUS` ("you both get 30 free credits"), code in a code well, "Copy code" button with "Copied" feedback (aria-live polite, reverts after ~2s), short how-it-works line. No new features. A11y: `role="dialog"`, `aria-labelledby`/`describedby`, focus trap and restore, Esc closes, contrast >= 4.5:1, 44px targets, reduced motion respected. Add stable `data-testid`s.
- **Acceptance:**
  - No hardcoded hex in the component.
  - Single close affordance; Copy writes the code to the clipboard and shows "Copied" then reverts.
  - Dark, light and 375px layouts verified; axe check clean.
- **Verify:**
  - `cd apps/web && bunx playwright test e2e/qa/mods-referral-favicon.spec.ts --repeat-each=2`
  - `grep -nE "#[0-9a-fA-F]{3,8}" apps/web/src/components/Dialogs/ReferralOfferDialog.vue` returns nothing
  - `bun --cwd apps/web run test -- ReferralOfferDialog`

### ✅ T1.11 Unit: API credits and reference-image wiring

- **Kind:** unit
- **Files:** `apps/api/src/routes/users.ts`, `apps/api/src/routes/generate.ts`, `apps/api/src/lib/model-input.ts`, `apps/api/src/services/generation-service.ts`, `apps/api/src/middlewares/multer.ts`
- **Do:** Cover the new/changed logic per T1.1, T1.4, T1.5, T1.6 (referral `$inc` equals `REFERRAL_BONUS` for both parties; 401/400 paths of the upload endpoint with mocked Cloudinary; array vs string input per model; zero images; non-Cloudinary URL 400 before credit deduction; over-max 400).
- **Acceptance:** Every file >= 90% lines/branches/functions/statements (repo threshold), target > 95%; no `it.fails` unless the source has a real bug.
- **Verify:** `cd apps/api && bunx vitest run src/routes/users.test.ts src/routes/generate.test.ts src/lib/model-input.test.ts src/services/generation-service.test.ts --coverage --coverage.include=src/routes/users.ts --coverage.include=src/routes/generate.ts --coverage.include=src/lib/model-input.ts --coverage.include=src/services/generation-service.ts --coverage.include=src/middlewares/multer.ts --coverage.reporter=text`

### ✅ T1.12 Unit: web reference images

- **Kind:** unit
- **Files:** `apps/web/src/stores/aside.ts`, `apps/web/src/stores/generate.ts`, `apps/web/src/composables/useImageDrop.ts`, `apps/web/src/components/Dashboard/Composer/ReferenceImageControl.vue`, `apps/web/src/components/Dashboard/Composer/ReferenceThumbnails.vue`
- **Do:** Cover trim logic (lower max, no imageInput, equal/higher), over-max rejection, URL revocation, upload-failure aborts generation, image removed during upload not sent, wrong type/size messages, control enabled/disabled state, remove button accessibility.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%; no `it.fails` unless real bug.
- **Verify:** `cd apps/web && bunx vitest run src/stores/aside.test.ts src/stores/generate.test.ts src/composables/useImageDrop.test.ts src/components/Dashboard/Composer --coverage --coverage.include=src/stores/aside.ts --coverage.include=src/stores/generate.ts --coverage.include=src/composables/useImageDrop.ts --coverage.include=src/components/Dashboard/Composer/ReferenceImageControl.vue --coverage.include=src/components/Dashboard/Composer/ReferenceThumbnails.vue --coverage.reporter=text`

### ✅ T1.13 Unit: referral dialogs and constant-driven copy

- **Kind:** unit
- **Files:** `apps/web/src/components/Dialogs/ReferralOfferDialog.vue`, `apps/web/src/components/Dialogs/ReferralCopyDialog.vue`, `apps/web/src/utils/featureLandings.ts`, `apps/web/src/utils/seo.ts`
- **Do:** Assert rendered credit values equal `SIGNUP_CREDITS`/`REFERRAL_BONUS`; clipboard write, "Copied" feedback via fake timers (reverts ~2s), single close, Esc closes, aria attributes; FAQ and JSON-LD use constants.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/web && bunx vitest run src/components/Dialogs/ReferralOfferDialog.test.ts src/components/Dialogs/ReferralCopyDialog.test.ts src/utils/seo.test.ts src/utils/featureLandings.test.ts --coverage --coverage.include=src/components/Dialogs/ReferralOfferDialog.vue --coverage.include=src/components/Dialogs/ReferralCopyDialog.vue --coverage.include=src/utils/featureLandings.ts --coverage.include=src/utils/seo.ts --coverage.reporter=text`

### ✅ T1.14 E2E: reference image flow

- **Kind:** e2e
- **Scenarios:**
  - @critical Selecting a model with imageInput from the sidebar enables the control (MOD-3.0 root cause).
  - @critical Max-8 model accepts 8 images and blocks a 9th with the inline message.
  - @critical Generate request carries `referenceImageUrls`; zero-image generation still works.
  - @high Switch to a lower-max model trims with a toast naming the count; to a no-imageInput model clears with a toast; to equal/higher keeps all with no toast.
  - @high Upload failure shows an error toast, sends no generate request.
  - @medium Disabled + tooltip state on a no-imageInput model; wrong type and oversize messages; remove button removes one image.
- **Acceptance:** Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass.
- **Spec:** `e2e/qa/mods-reference-image.spec.ts` (seeded; includes any seed data it needs; intercepts the upload and generate routes)
- **Files:** none expected
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/mods-reference-image.spec.ts --repeat-each=3`

### ✅ T1.15 E2E: referral dialog, credits copy and favicon

- **Kind:** e2e
- **Scenarios:**
  - @critical Referral dialog shows reward from the constant, Copy writes the code, "Copied" appears then reverts.
  - @high Single close affordance; Esc closes and returns focus; dialog works at 375px.
  - @high Landing/pricing copy and `/pricing.md` show 30 signup credits and no stale 50 signup/referral text.
  - @medium Every icon/manifest URL referenced from `index.html` returns 200.
- **Acceptance:** Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass.
- **Spec:** `e2e/qa/mods-referral-favicon.spec.ts`
- **Files:** none expected
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/mods-referral-favicon.spec.ts --repeat-each=3`

### ✅ T1.16 Gate: Phase 1

- **Kind:** gate
- **Files:** none
- **Do:** Run the full Phase 1 evidence, reviewing each AC above; confirm shared `dist` is rebuilt and an existing user's balance is untouched (no script modifies `credits`).
- **Acceptance:** All Phase 1 task AC met; MOD-2 grep clean; real generation with a reference image is checked manually by the user at the checkpoint (note: needs the user, since it spends credits).
- **Verify:**
  - `bun --cwd packages/shared run build`
  - `bun run test` and `bun --cwd apps/api run test`
  - `bun run verify` and `bun run check:model-docs`
  - `cd apps/web && bunx playwright test e2e/qa/mods-reference-image.spec.ts e2e/qa/mods-referral-favicon.spec.ts --repeat-each=2`
  - `grep -rniE "\b50 (free |bonus )?credits" apps packages --exclude-dir=node_modules --exclude-dir=dist`

🔶 **Checkpoint 1**: 30-credit grants and copy consistent, reference images reach Replicate in the right shape, favicon and referral dialog verified in both themes and at 375px.

---

## Phase 2: Speech-to-text in the prompt bar

**Adds:** A mic button in the prompt bar that dictates into the prompt using the browser's speech recognition or the Grok transcription service, with a live waveform and clear errors.
**Try in UI:** Click the mic in the prompt bar, speak, and watch text append to the prompt ; open the chevron and switch the engine (Firefox defaults to Grok) ; record past 50s and see the countdown and auto-stop ; deny mic permission and read the error message.

Before T2.2: re-read `/Users/deepakdewani1/Desktop/grok-stt.md` (xAI STT: `file` last, model `grok-voice-transcribe-2.0`).

### ✅ T2.1 STT constants, rate limiter and env

- **Kind:** implementation
- **Files:** `packages/shared/src/models/stt.ts` (new: `STT_MAX_CLIP_SECONDS`, `STT_RATE_LIMIT`, `STT_MAX_BYTES`), `apps/api/src/middlewares/rate-limit.ts`, `apps/api/src/config/env.ts`, `apps/api/.env.example`, `apps/api/package.json`
- **Do:** Add the shared constants. Add `express-rate-limit` and `rate-limit-redis` (both SPEC-listed; the store is chosen at runtime) and a per-user limiter keyed by `req.auth.userId` (Redis store via `config/redis.ts` when configured, else memory). Add optional `XAI_API_KEY` to the env zod schema and `.env.example`; API must still boot without it.
- **Acceptance:** Limiter allows 20 requests per 10 minutes per user then returns 429 with `Retry-After`; boot works with `XAI_API_KEY` unset.
- **Verify:**
  - `bun install`
  - `bun --cwd packages/shared run build`
  - `bun --cwd apps/api run test -- rate-limit`
  - `bun run check`

### ✅ T2.2 `POST /stt` route

- **Kind:** implementation
- **Files:** `apps/api/src/routes/stt.ts`, `apps/api/src/routes/index.ts`
- **Do:** `requireAuth`, audio multer (`audio/*` plus `video/webm`, 5 MB cap), the limiter, forward to `https://api.x.ai/v1/stt` with `file` appended last, 30s upstream timeout, return `{ text }` only. 503 when `XAI_API_KEY` unset. Never log audio or the key.
- **Acceptance:** 401 unauthenticated; 429 over limit; 413 oversize; 400 bad type; 502 upstream failure/timeout; 503 key unset; `file` is the last multipart field; body contains only `text`.
- **Verify:**
  - `bun --cwd apps/api run test -- stt`
  - `grep -rn "XAI_API_KEY" apps/web` returns nothing (key stays server-side)
  - `bun run check`

### ✅ T2.3 Grok recording path and mic button

- **Kind:** implementation
- **Files:** `apps/web/src/composables/useGrokRecorder.ts`, `apps/web/src/composables/useVoiceInput.ts`, `apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue`, `apps/web/src/components/Dashboard/Composer/PromptBar.vue`, `apps/web/src/components/Dashboard/Composer/ComposerTextarea.vue`
- **Do:** FontAwesome microphone button on the right of the prompt bar (`aria-label`, `aria-pressed`, `data-testid`, and `data-tour="mic"` for the Phase 3 tour, INTRO-6). `useGrokRecorder`: MediaRecorder preferring `audio/webm;codecs=opus`, fallback `audio/mp4`; on stop upload to `${VITE_API_BASEPATH}/stt` (API routes have no `/api` prefix), append returned text (separator handled, existing text never replaced, text typed meanwhile preserved); "Transcribing..." state disables the mic; cancel supported; 60s auto-stop with countdown from 10s; error mapping per STT-8 (permission denied, no device, empty text, network, 5xx/timeout, 429 with Retry-After minutes, unsupported) shown via toast/inline, never silent. Concurrent recordings blocked.
- **Acceptance:** Append-not-replace; auto-stop at `STT_MAX_CLIP_SECONDS`; every error branch surfaces a message; mic disabled while transcribing.
- **Verify:**
  - `bun --cwd apps/web run test -- useGrokRecorder useVoiceInput MicButton`
  - `bun run check`
  - `cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=2`

### ✅ T2.4 Web Speech engine and engine menu

- **Kind:** implementation
- **Files:** `apps/web/src/composables/useWebSpeech.ts`, `apps/web/src/components/Dashboard/Composer/VoiceInput/EngineMenu.vue`, `apps/web/src/composables/useVoiceInput.ts`, `apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue`
- **Do:** `useWebSpeech`: continuous with interim results previewed live and committed on finalize, appended to existing text, `lang` from `navigator.language`. Chevron menu (Web Speech / Grok), engine persisted in localStorage (try/catch, SSR-safe). If `SpeechRecognition`/`webkitSpeechRecognition` is missing: default to Grok and show Web Speech disabled with "Not supported in this browser". Privacy note near the menu that Chrome sends audio to Google. Menu disabled while recording.
- **Acceptance:** Engine choice persists across reload; fallback default is Grok when unsupported; interim text never replaces existing prompt text.
- **Verify:**
  - `bun --cwd apps/web run test -- useWebSpeech EngineMenu`
  - `bun run check`
  - `cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=2`

### ✅ T2.5 Waveform and accessibility polish

- **Kind:** implementation
- **Files:** `apps/web/src/composables/useAudioLevel.ts`, `apps/web/src/components/Dashboard/Composer/VoiceInput/Waveform.vue`, `apps/web/src/composables/useVoiceInput.ts`, `apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue`
- **Do:** `useAudioLevel` (getUserMedia + AnalyserNode + rAF; stop tracks and close AudioContext on stop/unmount). `Waveform.vue` animates with live volume; `prefers-reduced-motion` uses an opacity-only level meter. aria-live announces "Recording"/"Transcribing"; Esc cancels; visible focus ring; recording stops when the tab is hidden or model/route changes. If a second `getUserMedia` for Web Speech conflicts, fall back to a non-reactive indicator.
- **Acceptance:** No leaked tracks or AudioContext after stop/unmount; reduced-motion variant renders; Esc cancels; visibility change stops recording.
- **Verify:**
  - `bun --cwd apps/web run test -- useAudioLevel Waveform`
  - `bun run check`
  - `cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=2`

### ✅ T2.6 Unit: STT API

- **Kind:** unit
- **Files:** `apps/api/src/routes/stt.ts`, `apps/api/src/middlewares/rate-limit.ts`, `apps/api/src/config/env.ts`
- **Do:** Mock xAI. Cover 401, 429 (Retry-After), 413, 400, 502, 503, field order (`file` last), response shape, limiter keyed per user and window reset (fake timers), env optional key.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/api && bunx vitest run src/routes/stt.test.ts src/middlewares/rate-limit.test.ts src/config/env.test.ts --coverage --coverage.include=src/routes/stt.ts --coverage.include=src/middlewares/rate-limit.ts --coverage.include=src/config/env.ts --coverage.reporter=text`

### ✅ T2.7 Unit: voice composables

- **Kind:** unit
- **Files:** `apps/web/src/composables/useVoiceInput.ts`, `apps/web/src/composables/useGrokRecorder.ts`, `apps/web/src/composables/useWebSpeech.ts`, `apps/web/src/composables/useAudioLevel.ts`
- **Do:** Mock `getUserMedia`, `MediaRecorder`, `SpeechRecognition`, AudioContext. Cover append-not-replace, engine persistence/fallback, 60s auto-stop (fake timers), every STT-8 error branch, mime fallback, cleanup, concurrent block, typing during transcribe.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/web && bunx vitest run src/composables/useVoiceInput.test.ts src/composables/useGrokRecorder.test.ts src/composables/useWebSpeech.test.ts src/composables/useAudioLevel.test.ts --coverage --coverage.include=src/composables/useVoiceInput.ts --coverage.include=src/composables/useGrokRecorder.ts --coverage.include=src/composables/useWebSpeech.ts --coverage.include=src/composables/useAudioLevel.ts --coverage.reporter=text`

### ✅ T2.8 Unit: voice components

- **Kind:** unit
- **Files:** `apps/web/src/components/Dashboard/Composer/VoiceInput/MicButton.vue`, `apps/web/src/components/Dashboard/Composer/VoiceInput/EngineMenu.vue`, `apps/web/src/components/Dashboard/Composer/VoiceInput/Waveform.vue`
- **Do:** aria-pressed/aria-live states, disabled while transcribing, disabled Web Speech option text, menu disabled while recording, reduced-motion variant, keyboard operation and Esc.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/web && bunx vitest run src/components/Dashboard/Composer/VoiceInput --coverage --coverage.include=src/components/Dashboard/Composer/VoiceInput/MicButton.vue --coverage.include=src/components/Dashboard/Composer/VoiceInput/EngineMenu.vue --coverage.include=src/components/Dashboard/Composer/VoiceInput/Waveform.vue --coverage.reporter=text`

### ✅ T2.9 E2E: voice input

- **Kind:** e2e
- **Scenarios:**
  - @critical Grok engine: mocked `getUserMedia`/`MediaRecorder` and intercepted `**/stt`; recorded text appends to existing prompt without replacing it.
  - @critical Web Speech engine: mocked `SpeechRecognition` shows interim text live and commits on finalize.
  - @high Engine choice persists across reload; with `SpeechRecognition` removed, default is Grok and Web Speech shows "Not supported in this browser".
  - @high Error states: permission denied, `**/stt` 429 (minutes message), 5xx, empty text each show a visible message.
  - @high Esc cancels recording; recording stops on tab hidden.
  - @medium 60s auto-stop with countdown from 10s (fake clock); reduced-motion renders the level meter; layout at 375px.
- **Acceptance:** Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass.
- **Spec:** `e2e/qa/voice-input.spec.ts`
- **Files:** none expected
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts --repeat-each=3`

### ✅ T2.10 Gate: Phase 2

- **Kind:** gate
- **Files:** none
- **Do:** Run all evidence; Phase 1 regression suite must stay green. Real-microphone dictation in Chrome and the Firefox default-to-Grok check cannot be automated here and are left to the user at the checkpoint.
- **Acceptance:** All Phase 2 AC met; STT-6 free (no credit check); key absent from web bundle.
- **Verify:**
  - `bun run test` and `bun --cwd apps/api run test`
  - `bun run verify`
  - `cd apps/web && bunx playwright test e2e/qa/voice-input.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=2`
  - `bun run build:web` then `grep -rn "XAI_API_KEY" apps/web/src apps/web/dist` returns nothing

🔶 **Checkpoint 2**: Mic works with both engines under mocks, API hardened (auth, rate limit, limits, timeouts), Phase 1 behaviour intact.

---

## Phase 3: V2 intro (carousel and tour)

**Adds:** A one-time "What's new in V2" modal per account with an optional guided tour, reopenable from the user menu.
**Try in UI:** Sign in with an account that has not seen it and see the modal once ; dismiss, reload and confirm it stays gone ; open the user menu and choose "What's new" ; click "Show me around" on the last slide and step through the tour.

### ☐ T3.1 Intro-seen persistence

- **Kind:** implementation
- **Files:** `packages/shared/src/models/intro.ts` (new: `CURRENT_INTRO_VERSION = 'v2'`, `KNOWN_INTRO_VERSIONS`), `apps/api/src/models/user.ts` (locate with grep; adds `seenIntroVersion: { type: String, default: null }`), `apps/api/src/routes/users.ts`
- **Do:** Add `PUT /users/intro-seen` (router-level `requireAuth`; identity from `req.auth.userId`, any body id ignored; version validated against the known list, else 400). The profile GET returns `seenIntroVersion`. Rebuild shared.
- **Acceptance:** 401 unauthenticated; writes only the caller's document even if a body id is sent; 400 unknown version; profile GET includes the field.
- **Verify:**
  - `bun --cwd packages/shared run build`
  - `bun --cwd apps/api run test -- users`
  - `bun run check`

### ☐ T3.2 Show rule and modal shell

- **Kind:** implementation
- **Files:** `apps/web/src/composables/useIntro.ts`, `apps/web/src/components/Intro/WhatsNewModal.vue`, `apps/web/src/components/Intro/IntroSlide.vue`, `apps/web/src/components/Header/UserMenu.vue`, `apps/web/src/components/Dashboard/DashboardShell.vue` (mount point)
- **Do:** `useIntro`: show only when logged in, profile loaded, `seenIntroVersion !== CURRENT_INTRO_VERSION` and localStorage `intro-seen:<userId>` unset (skip without waiting if the flag is set; no render before profile loads; delay until dashboard mounted; `storage` event closes a second tab). On dismiss write localStorage first, then PUT (retry once). `WhatsNewModal` with placeholder slides, `role="dialog"` + `aria-roledescription="carousel"`, live region, dots, prev/next, Skip, arrows, Esc = skip, focus trap, swipe, reduced-motion instant swap, full-bleed sheet under 640px. "What's new" item in `UserMenu.vue` opens it regardless of seen state without any DB write. Logged-out visitors never see it.
- **Acceptance:** Visibility matrix correct (DB flag x localStorage x profile loading); reopen does not alter the DB; PUT failure leaves the localStorage guard in place.
- **Verify:**
  - `bun --cwd apps/web run test -- useIntro WhatsNewModal`
  - `bun run check`
  - `cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2`

### ☐ T3.3 Tour anchors (`data-tour` attributes)

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dashboard/ModelPicker/ModelPickerTrigger.vue`, `apps/web/src/components/Header/CreditsChip.vue`, `apps/web/src/components/Header/UserMenu.vue`, `apps/web/src/components/Dashboard/Composer/PromptBar.vue`, `apps/web/src/components/Dashboard/Composer/ReferenceImageControl.vue`
- **Do:** Add stable `data-tour` attributes on the owning root elements: `model-picker`, `credits`, `user-menu`, `prompt-bar`, `ref-image` (the mic's `data-tour="mic"` already exists from T2.3). T3.4's `tour.ts` keeps these names in one exported constant map that its steps use. No behaviour change.
- **Acceptance:** All six anchors (`model-picker`, `prompt-bar`, `mic`, `ref-image`, `credits`, `user-menu`) are present in the rendered dashboard; existing component tests still pass.
- **Verify:**
  - `grep -rn 'data-tour=' apps/web/src/components | wc -l` is at least 6
  - `bun --cwd apps/web run test -- ModelPickerTrigger CreditsChip UserMenu PromptBar ReferenceImageControl`
  - `bun run check`

### ☐ T3.4 Driver.js tour

- **Kind:** implementation
- **Files:** `apps/web/src/components/Intro/tour.ts`, `apps/web/src/components/Intro/WhatsNewModal.vue`, `apps/web/package.json`
- **Do:** Add `driver.js` (MIT; listed in SPEC dependencies). Steps target the `data-tour` anchors from T3.3 and T2.3 (model picker, prompt bar, mic, ref-image upload, credits chip, user menu). Filter out missing/hidden elements before start; if fewer than 2 remain, skip with a toast. Semantic-token popover, `animate: false` under reduced motion. "Show me around" starts the tour; both it and "Done" mark seen. Ready-checks for lazily rendered elements.
- **Acceptance:** Step filtering correct on desktop and mobile; fewer-than-2 case toasts and skips; both final buttons mark seen.
- **Verify:**
  - `bun install`
  - `bun --cwd apps/web run test -- tour`
  - `bun run check`
  - `cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2`

### ☐ T3.5 Real slides and screenshots (capture last)

- **Kind:** implementation
- **Files:** `apps/web/public/intro/slide-{1..6}.webp` (one generated set, 4-6 files), `apps/web/src/components/Intro/slides.ts`
- **Do:** Finalize 4-6 slides from `git log master..feature-enhancement` (candidates: model lineup, tools, redesigned UI/themes, voice prompts, multiple reference images, payments/credits). Capture from the running app at 1440x900 (dark primary) with agent-browser (do not start the app); no emails or real user content visible. Convert to WebP (q ~80, width <= 1200, each < 150 KB) with `sharp`/`cwebp` one-off. Slides data includes `alt`, `width`, `height`; images lazy-loaded.
- **Acceptance:** 4-6 slides; each file < 150 KB and <= 1200 wide; no CLS (dimensions set); no personal data visible; alt text on all.
- **Verify:**
  - `find apps/web/public/intro -name "*.webp" -size +150k` returns nothing
  - `cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=2` (slides load, dimensions set)
  - `agent-browser: review each slide screenshot for sensitive data` (visual check only; no `qa-seed.init.js` exists in this repo, so open the running app signed in as the QA user from `e2e/fixtures/qa.ts`)

### ☐ T3.6 Unit: intro persistence API

- **Kind:** unit
- **Files:** `apps/api/src/routes/users.ts`, `apps/api/src/models/user.ts`
- **Do:** 401 unauthenticated; caller-only write with a spoofed body id; 400 unknown version; profile GET returns the field; default null.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/api && bunx vitest run src/routes/users.test.ts --coverage --coverage.include=src/routes/users.ts --coverage.include=src/models/user.ts --coverage.reporter=text`

### ☐ T3.7 Unit: intro logic

- **Kind:** unit
- **Files:** `apps/web/src/composables/useIntro.ts`, `apps/web/src/components/Intro/tour.ts`, `apps/web/src/components/Intro/slides.ts`
- **Do:** Matrix of DB flag x localStorage x profile-loading; PUT retry once then localStorage guard; storage-event second tab; tour step filtering and <2 skip; slide data shape (alt, width, height, cap 6).
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/web && bunx vitest run src/composables/useIntro.test.ts src/components/Intro --coverage --coverage.include=src/composables/useIntro.ts --coverage.include=src/components/Intro/tour.ts --coverage.include=src/components/Intro/slides.ts --coverage.reporter=text`

### ☐ T3.8 Unit: intro components

- **Kind:** unit
- **Files:** `apps/web/src/components/Intro/WhatsNewModal.vue`, `apps/web/src/components/Intro/IntroSlide.vue`, `apps/web/src/components/Header/UserMenu.vue`
- **Do:** Carousel semantics, keyboard (arrows, Esc, Tab trap), dots/prev/next/Skip, final-slide buttons, reopen from the menu without a DB write, reduced-motion path.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/web && bunx vitest run src/components/Intro src/components/Header/UserMenu.test.ts --coverage --coverage.include=src/components/Intro/WhatsNewModal.vue --coverage.include=src/components/Intro/IntroSlide.vue --coverage.include=src/components/Header/UserMenu.vue --coverage.reporter=text`

### ☐ T3.9 E2E: intro once-only and tour

- **Kind:** e2e
- **Scenarios:**
  - @critical New account (seed `seenIntroVersion: null`) sees the modal once; after dismiss and reload it does not show.
  - @critical Account with `seenIntroVersion: 'v2'` never sees it.
  - @high "What's new" in the user menu reopens it and does not call the intro-seen PUT.
  - @high "Show me around" starts the tour with visible steps and marks seen; "Done" marks seen.
  - @high PUT failure: localStorage still prevents a repeat on reload.
  - @medium Keyboard (arrows, Esc skip), 375px full-bleed sheet, logged-out visitor sees nothing.
- **Acceptance:** Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass.
- **Spec:** `e2e/qa/v2-intro.spec.ts` (seed data for the profile flag included)
- **Files:** none expected
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts --repeat-each=3`

### ☐ T3.10 Gate: Phase 3

- **Kind:** gate
- **Files:** none
- **Do:** Run all evidence; regression for Phases 1-2. Cross-device "other browser sees nothing" needs the user to confirm with a real second browser at the checkpoint.
- **Acceptance:** All Phase 3 AC met; slides < 150 KB; intro once-only per account (DB + localStorage) proven by QA spec.
- **Verify:**
  - `bun run test` and `bun --cwd apps/api run test`
  - `bun run verify`
  - `bun run build:web`
  - `cd apps/web && bunx playwright test e2e/qa/v2-intro.spec.ts e2e/qa/voice-input.spec.ts e2e/qa/mods-reference-image.spec.ts --repeat-each=2`

🔶 **Checkpoint 3**: Intro shows once per account, reopens from the menu, tour degrades gracefully; screenshots final.

---

## Phase 4: V2 announcement email

**Adds:** A React Email V2 announcement template, a resumable and idempotent Resend send script (dry-run, test-send, capped real send), and a working one-click unsubscribe. No real send happens in this phase's tasks.
**Try in UI:** Open the unsubscribe confirm page from a signed link and confirm it sets opt-out ; run `cd apps/api && bun scripts/send-v2-announcement.ts --dry-run` and open the printed HTML preview ; run `bun --cwd packages/email run dev` and view the template in light and dark.

### ☐ T4.1 Email workspace scaffold and render

- **Kind:** implementation
- **Files:** `packages/email/package.json` (`@visual-ai/email`), `packages/email/src/V2Announcement.tsx` (skeleton), `packages/email/src/render.ts`, `packages/email/tsconfig.json`, `packages/email/src/index.ts`
- **Do:** New workspace with `@react-email/components`, `react-email`, `@react-email/render` (SPEC-listed deps). Export `renderV2Announcement(data): Promise<{ html, text }>` (async: `@react-email/render` v1+ `render()` returns a Promise). Scripts: `dev` runs the React Email preview, `test` runs `vitest run` (tsconfig `jsx: react-jsx`). No coupling to the web app. MJML only if install or rendering fails.
- **Acceptance:** `bun install` resolves in the workspace; render resolves to html < 102 KB and a non-empty plain-text alternative; `bun --cwd packages/email run test` is a valid script.
- **Verify:**
  - `bun install`
  - `bun run check`
  - `bun -e "const m = await import('@visual-ai/email'); const r = await m.renderV2Announcement({ firstName: 'A', unsubscribeUrl: 'https://example.test/u', postalAddress: 'Test address' }); if (!(r.html.length < 102400 && r.text.length > 0)) process.exit(1)"` exits 0
  - `node -e "process.exit(require('./packages/email/package.json').scripts?.test ? 0 : 1)"` exits 0

### ☐ T4.2 Unsubscribe token and User fields

- **Kind:** implementation
- **Files:** `apps/api/src/models/user.ts`, `apps/api/src/lib/unsubscribe-token.ts`, `apps/api/src/config/env.ts`, `apps/api/.env.example`
- **Do:** User gets `emailOptOut: { type: Boolean, default: false }` and `announcements.v2: { sentAt, resendId }`. HMAC-signed token (userId + purpose, secret `UNSUBSCRIBE_SECRET`, no expiry) with sign/verify using timing-safe compare. Add `UNSUBSCRIBE_SECRET`, `APP_PUBLIC_URL`, `API_PUBLIC_URL` (API origin for unsubscribe links), `RESEND_API_KEY`, `MAIL_FROM`, `EMAIL_REPLY_TO`, `MAIL_POSTAL_ADDRESS` to `.env.example`; script-only vars stay optional in the zod schema so the API boots without them.
- **Acceptance:** Valid token verifies; tampered/other-purpose token fails; schema fields default correctly; API boots without mail env.
- **Verify:**
  - `bun --cwd apps/api run test -- unsubscribe-token`
  - `bun run check`

### ☐ T4.3 Public unsubscribe route

- **Kind:** implementation
- **Files:** `apps/api/src/routes/email.ts`, `apps/api/src/routes/index.ts`
- **Do:** `GET /email/unsubscribe?token=` renders a confirm page; `POST` (also the RFC 8058 one-click target) sets `emailOptOut=true`, idempotent. Invalid token (or `UNSUBSCRIBE_SECRET` unset) returns 400 with a friendly page. Mount it in `routes/index.ts` above line 19 (`router.use(requireAuth, userRoutes)` and later mounts apply auth to every following request), so it is public. Served from the API origin (`API_PUBLIC_URL`, routes at `/`, no `/api` prefix). Pages carry stable markup for the QA spec.
- **Acceptance:** Reachable without auth; repeat POST is a no-op success; invalid/missing token 400 friendly page; user excluded from later sends.
- **Verify:**
  - `bun --cwd apps/api run test -- email`
  - `cd apps/web && bunx playwright test e2e/qa/v2-email-unsubscribe.spec.ts --repeat-each=2`
  - `bun run check`

### ☐ T4.4 Send script core

- **Kind:** implementation
- **Files:** `apps/api/scripts/send-v2-announcement.ts` (thin CLI entry), `apps/api/src/lib/v2-announcement/recipients.ts`, `apps/api/src/lib/v2-announcement/batching.ts`, `apps/api/src/lib/v2-announcement/resend-client.ts`, `apps/api/package.json`
- **Do:** Add `resend` (SPEC-listed). Logic lives under `src/lib/v2-announcement/` because API vitest only collects `src/**/*.test.ts`; the script only parses args and wires the libs. Recipient selection excludes `emailOptOut`, invalid/empty emails, already-sent, and dedupes shared emails; name falls back to "Hi there". Resend batch API (<=100), throttle ~2 requests/s, exponential backoff on 429/5xx, per-item `announcements.v2` write after each success, batch idempotency key `v2-announce-<sorted-ids-hash>`. `--daily-cap` default 100, values above 100 rejected; `--limit N`; stop cleanly at cap and print remaining. `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers on every message. Failed items not marked and reported.
- **Acceptance:** Rerun after a simulated crash sends no duplicates; partial failure marks only successes; cap and limit honoured.
- **Verify:**
  - `bun --cwd apps/api run test -- v2-announcement`
  - `bun run check`

### ☐ T4.5 Modes and guards

- **Kind:** implementation
- **Files:** `apps/api/scripts/send-v2-announcement.ts`, `apps/api/src/lib/v2-announcement/modes.ts`, `apps/api/src/lib/v2-announcement/preview.ts`
- **Do:** `--dry-run`: render the template, print recipient count and a sample, write the HTML preview to a temp file; sends and writes nothing. `--test-to <email>`: one send, marks nobody; both work with placeholder env. A real send requires `--confirm` plus a printed summary and refuses (non-zero exit, clear message) unless `MAIL_FROM` and `MAIL_POSTAL_ADDRESS` are non-empty. Never send to real recipients in verification.
- **Acceptance:** Each mode behaves as stated; missing env with `--confirm` exits non-zero; `--confirm` absent never sends to the user base.
- **Verify:**
  - `bun --cwd apps/api run test -- v2-announcement`
  - `cd apps/api && RESEND_API_KEY= bun scripts/send-v2-announcement.ts --dry-run` (prints count and preview path; with the key blanked no Resend call is possible)
  - `cd apps/api && RESEND_API_KEY= MAIL_FROM= MAIL_POSTAL_ADDRESS= bun scripts/send-v2-announcement.ts --confirm; echo $?` prints non-zero (key also blanked so a broken guard still cannot send)

### ☐ T4.6 Template content and design

- **Kind:** implementation
- **Files:** `packages/email/src/V2Announcement.tsx`, `packages/email/src/components/Highlight.tsx`, `packages/email/src/render.ts`, `apps/web/public/email/*.png` (one generated image set: hero plus 3-5 highlight images, each < ~200 KB)
- **Do:** Hero (logo, headline, image), 3-5 highlights with absolute HTTPS image URLs on the production domain, benefits, "30 free credits every day" from `DAILY_CREDITS`, primary CTA "Try V2 now" (bulletproof button, UTM params), secondary links (pricing, explore, support), footer with unsubscribe, sender identity and postal address from `MAIL_POSTAL_ADDRESS` (never hardcoded). 600px max, single column under 480px, web-safe font fallbacks, preheader, plain-text alternative, `color-scheme` meta, transparent PNG logo with light-safe background, explicit button colors, images < ~200 KB, html < 102 KB.
- **Acceptance:** MAIL-3 checklist met; no hardcoded address or credit number; all image URLs absolute HTTPS with alt and fixed widths.
- **Verify:**
  - `bun --cwd packages/email run test`
  - `find apps/web/public/email -size +200k` returns nothing
  - `grep -rnE "src=\"(http:|/)" packages/email/src` returns nothing
  - `agent-browser: open React Email preview (bun --cwd packages/email run dev already running or user-started) in light and dark` (visual only)

### ☐ T4.7 Unit: unsubscribe token and route

- **Kind:** unit
- **Files:** `apps/api/src/lib/unsubscribe-token.ts`, `apps/api/src/routes/email.ts`, `apps/api/src/models/user.ts`
- **Do:** Sign/verify roundtrip, tamper, wrong purpose, missing secret; GET page, POST idempotency, invalid token 400, public (no auth), opt-out persisted.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/api && bunx vitest run src/lib/unsubscribe-token.test.ts src/routes/email.test.ts --coverage --coverage.include=src/lib/unsubscribe-token.ts --coverage.include=src/routes/email.ts --coverage.include=src/models/user.ts --coverage.reporter=text`

### ☐ T4.8 Unit: send script libs

- **Kind:** unit
- **Files:** `apps/api/src/lib/v2-announcement/recipients.ts`, `apps/api/src/lib/v2-announcement/batching.ts`, `apps/api/src/lib/v2-announcement/resend-client.ts`, `apps/api/src/lib/v2-announcement/modes.ts`, `apps/api/src/lib/v2-announcement/preview.ts`
- **Do:** Mock Resend and Mongo. Selection (opt-out, invalid, sent, dup emails, no-name), batching of 100, throttle, backoff on 429/5xx, partial failure, idempotency key stability, daily cap (>100 rejected), `--limit`, crash-and-rerun no duplicates, each mode, `--confirm` refusal, test-to marks nobody.
- **Acceptance:** Every file >= 90% on all four metrics (repo threshold), target > 95%.
- **Verify:** `cd apps/api && bunx vitest run src/lib/v2-announcement --coverage --coverage.include=src/lib/v2-announcement/recipients.ts --coverage.include=src/lib/v2-announcement/batching.ts --coverage.include=src/lib/v2-announcement/resend-client.ts --coverage.include=src/lib/v2-announcement/modes.ts --coverage.include=src/lib/v2-announcement/preview.ts --coverage.reporter=text`

### ☐ T4.9 Unit: email template

- **Kind:** unit
- **Files:** `packages/email/src/V2Announcement.tsx`, `packages/email/src/components/Highlight.tsx`, `packages/email/src/render.ts`
- **Do:** Render snapshot; html < 102 KB; text alternative present; absolute HTTPS images with alt; unsubscribe link and postal address from props; "Hi there" fallback; `DAILY_CREDITS` interpolated.
- **Acceptance:** Every file >= 90% on all four metrics (matching the repo threshold), target > 95%.
- **Verify:** `cd packages/email && bunx vitest run --coverage --coverage.include=src/V2Announcement.tsx --coverage.include=src/components/Highlight.tsx --coverage.include=src/render.ts --coverage.reporter=text`

### ☐ T4.10 E2E: unsubscribe flow

- **Kind:** e2e
- **Scenarios:**
  - @critical A signed link opens the confirm page; confirming shows success and sets opt-out.
  - @high Repeating the confirmation still shows success (idempotent).
  - @high Invalid and missing token show a friendly 400 page.
  - @medium Page works unauthenticated and at 375px.
- **Acceptance:** Every listed scenario passes with `--repeat-each=3`, no flakes, no test weakened to pass.
- **Spec:** `e2e/qa/v2-email-unsubscribe.spec.ts` (seed generates a valid token via the test secret; pages are on the API origin, so the spec navigates to the API base URL, not the web `baseURL`)
- **Files:** none expected
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/v2-email-unsubscribe.spec.ts --repeat-each=3`

### ☐ T4.11 Gate: Phase 4

- **Kind:** gate
- **Files:** none
- **Do:** Run all evidence. Items requiring the user (not done here): domain SPF/DKIM/DMARC verification in Resend, `--test-to` send and Gmail web/mobile light/dark check, and the separate explicit go-ahead before any `--confirm` send. This task never sends a real email.
- **Acceptance:** All Phase 4 AC met; dry-run excludes opted-out; crash-and-rerun idempotency proven by tests; unsubscribe route public and idempotent.
- **Verify:**
  - `bun run test` and `bun --cwd apps/api run test` and `bun --cwd packages/email run test`
  - `bun run verify`
  - `cd apps/api && RESEND_API_KEY= bun scripts/send-v2-announcement.ts --dry-run`
  - `cd apps/web && bunx playwright test e2e/qa/v2-email-unsubscribe.spec.ts --repeat-each=2`

🔶 **Checkpoint 4**: Template, script and unsubscribe verified under mocks and dry-run; ready for the user's `--test-to` send and a separate go-ahead.

---

## Phase 5: Definition of done

**Adds:** Final bundle-wide regression and sign-off across all four tracks. No new behaviour.
**Try in UI:** Walk the Phase 1-3 "Try in UI" steps once more on a fresh session ; confirm a new account shows 30 credits and the intro appears once.

### ☐ T5.1 DoD: V2 launch bundle

- **Kind:** dod
- **Files:** none
- **Do:** Verify every SPEC success criterion has passing evidence; list items needing the user (real generation with reference, real mic, second-browser intro check, Gmail test send, deploy-then-send ordering).
- **Acceptance:**
  - Setup and gates green: T0.1, T0.2, T1.16, T2.10, T3.10, T4.11.
  - Track evidence: MOD via T1.11-T1.15; STT via T2.6-T2.9; INTRO via T3.6-T3.9; MAIL via T4.7-T4.10.
  - No open SPEC_ISSUE; MOD-2 grep clean; no secrets or `.env` in `git status`; nothing sent to real recipients.
- **Verify:**
  - `bun --cwd packages/shared run build && bun run test && bun --cwd apps/api run test && bun --cwd packages/email run test`
  - `bun run verify` and `bun run check:model-docs` and `bun run build:web`
  - `cd apps/web && bunx playwright test e2e/qa --repeat-each=2`
  - `git status --short` shows no `.env` or key material

🔶 **Checkpoint 5**: Every SPEC success criterion has evidence; user-only items (real generation, real mic, second browser, Gmail test send, deploy-then-send) are listed for sign-off.
