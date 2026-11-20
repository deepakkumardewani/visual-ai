# Spec: Visual AI V2 Launch Bundle

Status: Draft for review. Phase order: 1 Modifications, 2 Speech-to-text, 3 V2 intro, 4 Announcement email.
No feature code is written by this document. Servers are always running; never start them.

## Objective

Ship V2 as one coordinated bundle for existing and new Visual AI users: lower credit grants, reference-image upload in the prompt bar, a refreshed favicon and referral dialog, voice prompts, a one-time "What's new" intro with an optional guided tour, and a launch email to the (<1,000) existing users.

Success: each track works end to end in the browser; the intro never shows twice per account; a `--test-to` send arrives in Gmail and renders per MAIL-3 (layout intact, images load, CTA clickable, readable in dark mode) on Gmail web and the Gmail mobile app; the MOD-2 grep finds no stale signup/referral credit copy.

## Assumptions (grounded in code)

1. Web is Vue 3 + Pinia + Tailwind; semantic tokens via `apps/web/tailwind.semantic-plugin.js`; design rules in `apps/web/DESIGN.md` and `.impeccable.md`. Icons are FontAwesome.
2. API is Express + Mongoose; auth via Clerk `requireAuth`; `apps/api/src/middlewares/multer.ts` exports `upload` (Cloudinary) and `memoryUpload` (10 MB cap, `image/*` only).
3. Credits constants live in `packages/shared/src/models/credits.ts`: SIGNUP_CREDITS=50, DAILY_CREDITS=30 (already), REFERRAL_BONUS=50. `models/user.ts` defaults `credits` to `SIGNUP_CREDITS` (so the default changes for new docs only).
4. `ModelDefinition.fields.imageInput` is `{ inputKey, max? }`. Only one registry entry sets `max` (8, `input_images`, registry.ts:297); about 20 models set imageInput without max. `docs/MODEL_ONBOARDING.md` lists no per-model maxima, so the registry is the only source.
5. **The reference image never reaches the API today (verified).** `ReferenceImageControl.vue` already sits in `PromptBar.vue` (single image, `aside.referenceImage`), but `stores/generate.ts` `generateImage()` posts JSON without it, `POST /generate/image` (generate.ts:79) has no multer and only calls `enqueueGeneration` (queue + worker in `apps/api/src/queue/`), and `generation-service.ts:353` calls `buildModelInput` without `imageUrl`. `model-input.ts:142` can forward a single `userParams.imageUrl` string. The `upload.single("image")` routes are upscale/tool routes only. Because generation runs through a queue, in-memory file buffers cannot travel with the job.
   5a. For models without `imageInput`, the control is shown **disabled with a tooltip** (`data-testid="reference-image-disabled"`); `aside.ts:152` silently clears the reference when switching to a model without imageInput. Client validation is `MAX_IMAGE_BYTES = 5 MB`, `image/jpeg,png,webp` (`composables/useImageDrop.ts`).
6. No rate-limit library, Resend, React Email, or driver.js exists in `apps/*/package.json` today (verified). Redis config exists (`apps/api/src/config/redis.ts`, `REDIS_HOST/PORT/PASSWORD` in env.ts).
   6a. User routes take identity from auth, never from a path id (`PUT /users/username`), and `requireAuth` is applied at router level (`routes/index.ts:19`).
7. `apps/web/public/favicon.ico` (modified Jul 10) predates `logo.svg` (Jul 22); the in-app logo is `Header/LogoMark.vue` (copper V on #1c1713 rounded square). Likely stale; must be verified visually.
8. Existing mail is nodemailer/Gmail for the contact form only (`EMAIL_USER`, `EMAIL_PASSWORD`). V2 email uses Resend and does not touch that path.

## Commands

Package manager is **bun** (`bun.lock`, `packageManager: bun@1.3.6`), toolchain vite-plus (`vp`). Workspaces `apps/*`, `packages/*`; package names `@visual-ai/web`, `@visual-ai/api`, `@visual-ai/shared`.

- Install: `bun install`
- Tests: `bun run test` (root, `vp test run`); API only: `bun --cwd apps/api run test` (vitest)
- Lint + typecheck: `bun run verify` (`vp lint --fix && vp check --fix`); check only: `bun run check`
- Model docs gate (required for any registry/MODEL_ONBOARDING edit): `bun run check:model-docs`
- Build: `bun --cwd packages/shared run build` (required after changing shared constants, as `apps/api` consumes `dist`), `bun run build:web` (also regenerates prerender)
- Email preview: `bun --cwd packages/email run dev` (React Email preview)
- Email send (run from `apps/api` so `dotenv/config` loads `apps/api/.env`): `cd apps/api && bun scripts/send-v2-announcement.ts --dry-run | --test-to <email> | --limit N | --confirm`
- Unit coverage: `bunx vitest run <specs> --coverage --coverage.include=<src> ... --coverage.reporter=text` from the package dir; web and api enforce a 90% global threshold (`apps/web/vite.config.mts`, `apps/api/vitest.config.ts`). API vitest only collects `src/**/*.test.ts`.
- Browser verification: `agent-browser` skill only. Never start dev servers.

## Project Structure (new/changed)

```
packages/shared/src/models/credits.ts        constants
packages/shared/src/models/intro.ts, stt.ts  CURRENT_INTRO_VERSION; STT limits + STT_SILENCE_LEVEL_THRESHOLD
apps/web/src/components/Dashboard/Composer/  ReferenceImageControl.vue, PromptBar.vue, ComposerTextarea.vue, VoiceInput/*
apps/web/src/composables/                    useVoiceInput.ts, useWebSpeech.ts, useGrokRecorder.ts, useAudioLevel.ts, useIntro.ts
apps/web/src/components/Intro/               WhatsNewModal.vue, IntroSlide.vue (video stage: video + poster), FeatureList.vue, slides.ts (the 10 slides), tour.ts, TourPopover.vue (custom driver.js popover)
apps/web/src/components/Header/UserMenu.vue  "What's new" item
apps/web/src/components/Dialogs/ReferralOfferDialog.vue (redesign)
apps/web/public/intro/                       per-slide video loops (*.webm + *.mp4) and WebP posters
apps/api/src/routes/stt.ts                   POST /stt
apps/web/src/stores/aside.ts, generate.ts   referenceImages[] + trim/toast, send URLs
apps/api/src/routes/generate.ts, services/generation-service.ts, lib/model-input.ts  reference image wiring
apps/api/src/routes/users.ts                 intro-seen endpoint; referral grant literals
apps/api/src/routes/email.ts                 public unsubscribe endpoint
apps/api/src/middlewares/rate-limit.ts
packages/email/                              React Email templates + preview; exports render fn imported by the script
apps/api/scripts/send-v2-announcement.ts     thin CLI entry (arg parsing + wiring only)
apps/api/src/lib/v2-announcement/            recipients, batching, resend client, modes, preview (tested; under src/ so vitest collects them)
apps/web/e2e/qa/*.spec.ts                    seeded Playwright QA specs per track
```

## Code Style

Follow `~/.claude/skills/code-style`, `typescript-best-practices`, `vue-best-practices`: named constants (no magic numbers), functions under about 30 lines, early returns, options objects past 2-3 params, `<script setup lang="ts">`, extract large JSX/template blocks, no swallowed errors, comments explain why. Example constant style:

```ts
export const STT_MAX_CLIP_SECONDS = 60;
export const STT_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 } as const;
```

## Testing Strategy

Vitest unit/component tests co-located (`*.test.ts`) for every new module; API route tests with mocked xAI/Resend/Cloudinary; Playwright e2e specs in the seeded QA harness (`apps/web/e2e/qa/*.spec.ts`, fixtures `apps/web/e2e/fixtures/qa.ts`) for: ref-image flow, referral dialog/copy/favicon, mic UI with mocked `getUserMedia`/`SpeechRecognition` (including the STT-POLISH stop icon, spinner, silence toast and empty-response toast), intro once-only, intro layout and tour, email unsubscribe. Unit tests for the intro logic/components and the STT polish (MicButton, Waveform, useGrokRecorder, useAudioLevel silence detection). Manual verification with agent-browser for visuals (dark and light themes, mobile width 375). Email: render snapshot test + manual Gmail web/mobile test send + dark-mode check.

## Boundaries

- Always: run tests/typecheck per phase; keep xAI and Resend keys server-side; validate inputs at API edges; honour `prefers-reduced-motion`; check AA contrast in both themes.
- Ask first: new dependencies beyond those listed here, Mongo schema changes beyond those listed, changing generate API contract in a breaking way.
- Never: commit secrets or `.env`; modify existing users' credit balances; run the dev server; send to real recipients outside `--test-to` without an explicit, separate go-ahead; add Claude attribution to commits.

---

## Track 1: Modifications

### MOD-1 Credits constants

- SIGNUP_CREDITS 50 to 30; REFERRAL_BONUS 50 to 30; DAILY_CREDITS stays 30 (verified).
- New grants only. No migration, no script touching existing `credits`.
- Required edit: `apps/api/src/routes/users.ts:176` and `:190` hardcode `$inc: { credits: 50 }` for the referral grant; replace both with `REFERRAL_BONUS` (changing the constant alone does nothing). Audit the signup path for any other literal.
- Success: a newly created user gets 30; a referral credits both parties exactly 30 (API test asserts `$inc` equals `REFERRAL_BONUS`); an existing user's balance is unchanged after deploy; shared `dist` rebuilt.

### MOD-2 Copy derives from constants

- Known stale copy (verified): `ReferralOfferDialog.vue:29,34` ("50 free credits", "50 bonus credits"), `ReferralCopyDialog.vue:54` ("Give 50 credits and earn 50 credits"), `apps/web/src/utils/featureLandings.ts` FAQ (+ JSON-LD via `seo.ts`), `apps/web/public/pricing.md:11` (Signup row), and tests (`seo.test.ts`, `ReferralOfferDialog.test.ts`, `users.test.ts`). Vue/TS copy interpolates constants from `@visual-ai/shared`; static files (pricing.md, llms.txt) get edited text; prerender regenerated via build.
- Do NOT touch credit-pack copy (`creditPacks.ts` "450 credits" etc.).
- Success: `grep -rniE "\b50 (free |bonus )?credits" apps packages --exclude-dir=node_modules --exclude-dir=dist` returns nothing referring to signup/referral; unit tests assert the rendered value equals the constant.

### MOD-3 Reference image upload (prompt bar)

- MOD-3.0 Root cause first: the control exists but is cosmetic (Assumption 5). Reproduce the user's report by selecting an imageInput model from the left-sidebar picker with agent-browser and confirm whether the control is enabled; if the sidebar selection does not update `aside.mode` (which drives `supportsImageInput`), fix that too. "Done" means the image actually reaches Replicate, not just a thumbnail.
- MOD-3.1 When the selected model has `fields.imageInput`, `ReferenceImageControl.vue` is enabled (`aside.imageInputMax` = `max ?? 1`). No imageInput: keep the existing disabled state with tooltip (current behaviour; not hidden).
- MOD-3.2 Store: replace single `referenceImage` with `referenceImages: ReferenceImage[]` (revoke object URLs on remove/clear). Allow up to `max`; `PromptBar.vue` renders a thumbnail strip with an accessible per-image remove button; multi-select picker when `max > 1`; extras beyond max are rejected with an inline message ("This model accepts up to N images").
- MOD-3.3 Model switch (replaces the silent clear in `aside.ts:152`): lower max keeps the first N with a toast naming the count removed; no imageInput clears all with a toast; equal/higher max keeps all, no toast.
- MOD-3.4 Validation: keep the existing client rule (5 MB each, JPG/PNG/WEBP) but move `MAX_IMAGE_BYTES` and the accepted types into `packages/shared` so the API enforces the same values. Clear messages for wrong type/oversize.
- MOD-3.5 Transport (non-breaking): at generate time the web uploads the files to Cloudinary through a new authenticated endpoint (`POST /generate/reference-images`, existing Cloudinary `upload.array("images", max)`; `requireAuth` applied on the route itself because `generateRoute` is mounted before router-level auth at `routes/index.ts:16`), then sends `referenceImageUrls: string[]` in the existing JSON body of `POST /generate/image`. The field is optional, so old clients still work. Server: (a) validates count <= `max ?? 1` for the model and that URLs are our Cloudinary URLs, else 400; (b) passes them through the queue job to `buildModelInput`; (c) `buildModelInput` writes `input[inputKey]` as an array or a string based on a new explicit registry flag `imageInput.array: boolean`, set per model from its verified Replicate schema (not inferred from `max`); (d) update `docs/MODEL_ONBOARDING.md` and pass `bun run check:model-docs`. Only the `max: 8` model is multi-image until schemas prove otherwise.
- MOD-3.6 Generation also works with zero images (reference is optional).
- Success: picking the max-8 model allows 8 and blocks a 9th; switching to a max-1 model trims to 1 with a toast; switching to a no-imageInput model clears with a toast; the queued job's Replicate input contains the URLs in the right shape (API test per array/string model); a real generation with a reference visibly follows it (manual, agent-browser); unit tests for the store trim logic and the control.
- Edge cases: upload fails mid-way (no generation, error toast, credits not deducted); removing images while uploading; orphaned Cloudinary uploads when generation fails (acceptable, note it); same file added twice (allowed).

### MOD-4 Favicon

- Compare `favicon.ico`, `logo.svg`, `index.html` links with `LogoMark.vue`. If mismatched (likely): render the mark to a master SVG and generate `favicon.ico` (16/32/48), `favicon.svg`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`; add `site.webmanifest` only if none exists (none in `public/` today; add it for 192/512 with theme color); update `index.html` links; regenerate prerendered `dist` pages via build.
- Success: tab icon visually matches the header logo (agent-browser screenshot of both); Lighthouse has no icon warnings; all referenced files return 200.

### MOD-5 ReferralOfferDialog redesign

- Use `impeccable` + `layout` skills; build on `AppModal.vue`; must work in dark and light via semantic tokens (no hardcoded hex).
- Problems to fix (from the screenshot): flat mustard slab, low-contrast body text, tan copy button off-token, duplicate close affordances (X plus "Close" pill). Final visual choices come from the impeccable/layout pass; dropping the redundant "Close" pill is the recommended default, not a user requirement.
- Content (same as today, values updated): headline with reward from `REFERRAL_BONUS` ("you both get 30 free credits"), the code in a code well with a "Copy code" button and "Copied" feedback (aria-live polite, reverts after about 2s), short how-it-works line. No new features (no share button) unless the user asks.
- Accessibility: `role="dialog"`, `aria-labelledby`/`describedby`, focus trapped and returned on close, Esc closes, text contrast >= 4.5:1, touch targets >= 44px, reduced motion respected.
- Success: component test (copy writes to clipboard, feedback appears, value equals `REFERRAL_BONUS`); agent-browser screenshots in both themes and at 375px; no hardcoded hex in the component; axe check clean.

## Track 2: Speech-to-text in the prompt bar

Reference (source doc: `/Users/deepakdewani1/Desktop/grok-stt.md`; re-read before implementing): Grok STT `POST https://api.x.ai/v1/stt`, multipart, model `grok-voice-transcribe-2.0`, `file` MUST be the last field, `Authorization: Bearer $XAI_API_KEY`; response `{ text, duration, words }`. Optional fields: `format=true`, `language`, `keyterm`.

- STT-1 Mic icon button inside the right side of the prompt bar (FontAwesome microphone), `aria-label`, `aria-pressed` when recording; a small chevron next to it opens an engine menu (Web Speech / Grok). Engine persisted in localStorage (wrapped in try/catch, SSR-safe).
- STT-2 Engine availability: if `window.SpeechRecognition || webkitSpeechRecognition` is missing, default to Grok and show the Web Speech option disabled with the explanation "Not supported in this browser". Default otherwise: Web Speech.
- STT-3 Web Speech engine: continuous with interim results; interim text previews live in the prompt and is committed on finalize; final text appended to existing prompt (separator space handled, existing text never replaced). `lang` from `navigator.language`.
- STT-4 Grok engine: MediaRecorder (prefer `audio/webm;codecs=opus`, fall back to `audio/mp4` for Safari); on stop upload blob to `POST ${VITE_API_BASEPATH}/stt` (API routes are mounted at `/`, no `/api` prefix) and append returned `text`; show a "Transcribing..." state; the mic is disabled meanwhile; cancel supported.
- STT-5 Waveform: while recording, `getUserMedia` stream feeds an `AnalyserNode`; a bar/canvas waveform animates with live volume via requestAnimationFrame (also for Web Speech, using a separate stream for visuals only). `prefers-reduced-motion`: replace with a static pulsing-free level meter (opacity change only). Stream tracks and AudioContext are closed on stop/unmount.
- STT-6 Grok limits: max clip 60s (`STT_MAX_CLIP_SECONDS`), visible countdown from 10s remaining, auto-stop at 60s then transcribe. Free: no credits deducted or checked.
- STT-7 API `POST /stt`: Clerk `requireAuth`; `memoryUpload`-style multer with audio-only filter (`audio/*`, `video/webm` allowed since MediaRecorder labels webm so), size cap 5 MB (60s opus is well below; mp4 safari about 1 MB); per-user rate limit 20 requests / 10 min (keyed by `req.auth.userId`; Redis store since `config/redis.ts` exists, memory fallback); forwards to xAI with `file` appended last; 30s upstream timeout; returns `{ text }` only; never logs audio or the key.
- STT-8 Error mapping (user-facing messages): permission denied ("Microphone access is blocked. Allow it in your browser settings."), no mic device, no speech detected (empty text), network failure, upstream 5xx/timeout ("Transcription failed, try again"), 429 ("Too many voice requests. Try again in N minutes", using Retry-After), unsupported browser. All shown via toast/inline message, never silent.
- STT-9 Accessibility and UX: keyboard operable, state announced via aria-live ("Recording", "Transcribing"), Esc cancels, visible focus ring; recording stops when the tab is hidden or the model/route changes.
- Success: with mocked APIs, tests cover append-not-replace, engine persistence, fallback default, 60s auto-stop (fake timers), each error branch; API tests for auth 401, 429, size 413, bad type 400, upstream failure 502, field order. Manual: Chrome interim text appears live; Firefox defaults to Grok.
- Edge cases: concurrent recordings blocked; empty/very short clip; user types during transcribe (append at end, do not clobber); a ref image or engine switch during recording (engine menu disabled while recording); HTTPS/localhost required for getUserMedia; Safari mime differences; iOS Safari autoplay/permission quirks.

## Track 3: V2 intro on first launch

- INTRO-1 Data: add to the User schema `seenIntroVersion: { type: String, default: null }`. Constant `CURRENT_INTRO_VERSION = 'v2'` in shared. Endpoint `PUT /users/intro-seen` (router-level requireAuth; identity from `req.auth.userId`, matching existing `/users/username` style; any client-supplied id is ignored) sets `seenIntroVersion` to the posted version (validated against the known list, else 400). The existing profile GET returns the field.
- INTRO-2 Show rule: logged-in user, profile loaded, `seenIntroVersion !== CURRENT_INTRO_VERSION`, and localStorage key `intro-seen:<userId>` not equal to the version. On dismissal/completion: write localStorage immediately, then fire the PUT (retry once on failure; localStorage alone prevents repeat on this device). Do not render before the profile loads (no flash); if the localStorage flag is set skip without waiting. Never shows on another device after the DB write succeeds.
- INTRO-3 Modal (desktop): large split modal, about 1280x680 (max-width clamps to the viewport). Left: video stage filling the width beside a fixed 360px side column (`IntroSlide.vue`). Right column: clickable feature list (`FeatureList.vue`, all slides, active highlighted, click jumps to that slide), the active slide's title and one-line description, and a footer with an "n / 10" counter and prev/next ICON buttons (chevrons, clear contrast, `aria-label`s). Header: "What's new in V2" plus Skip/close. No slide bleed (the next slide is never visible at the edge). Keep existing a11y: `role="dialog"` + `aria-roledescription="carousel"`, live region for slide change, arrows, Esc = skip, Tab trapped, swipe on touch, focus management. Reduced motion: crossfade replaced by instant swap. Colors via semantic tokens only.
- INTRO-4 Slides: exactly 10, in this order (cap 10; deliberate change: New dashboard moved to first, New models second): 1 New dashboard (Create / Explore / Assets tabs, "Your creations" feed grouped by date, Remix); 2 New models (featured model picker: Z-Image Turbo, Seedream 4, Flux 2 Pro, Nano Banana 2/Pro, GPT Image 2, speed tiers + credit cost); 3 Style picker (visual style grid with preview thumbnails); 4 More sizes (aspect ratios incl. "More sizes": 9:16, 16:9, 4:3, 3:4, 5:4); 5 Voice dictation (mic in the prompt bar); 6 Improve / Generate / Save prompts (prompt tools menu: Improve, Random, Describe with AI, Save current prompt, Saved prompts); 7 Explore tab and page (community feed + image detail page: prompt, copy, Remix, Download, Use as reference); 8 Tools (Upscale, Remove background); 9 Reference images (upload in the prompt bar); 10 Remove background. Themes and payments/credits are dropped (no credits slide). Copy is finalized at implementation from the running UI.
- INTRO-5 Final slide has "Show me around" (start tour) and "Done". Both mark seen.
- INTRO-6 Tour via driver.js (MIT, add dependency; kept over react-joyride, which is React-only). Logic stays in `tour.ts`; the popover is a custom, token-styled template (`TourPopover.vue`) with step counter "x / y", progress bar, prev/next icon buttons, Skip and close. Steps target stable `data-tour="..."` attributes: `model-picker`, `style-picker`, `sizes` (output settings), `prompt-bar`, `mic`, `prompt-tools` (magic/wand menu), `ref-image`, `explore-tab`. Add the attributes in the owning components (`mic` exists). Missing/hidden elements (e.g. mobile, no imageInput) are filtered out before start; if fewer than 2 steps remain, skip the tour with a toast. Credits chip and user menu are no longer tour steps. Popover styling uses semantic tokens; reduced motion disables animation (`animate: false`).
- INTRO-7 Reopen: "What's new" item in `Header/UserMenu.vue` opens the modal regardless of seen state; closing it does not alter the DB.
- INTRO-8 Media: one cropped real-UI video loop per slide (no GIFs, no full-page screenshots), recorded from the running app (do not start it) in dark theme, tightly cropped to the single feature shown; dark-only clips accepted (no light variants). 4-6 s, `muted autoplay loop playsinline`, WebM + MP4 fallback, plus a WebP poster. Lazy-load only the current and next slide's media; pause when not active. Reduced motion: poster only, no autoplay. Budgets: about <= 400 KB per clip, poster < 100 KB; width/height set (no CLS); `alt`/accessible label provided. No personal data (emails, real user content). Stored in `apps/web/public/intro/`. Captured last, after STT-POLISH, so the voice clip shows the new mic.
- INTRO-9 Mobile: under 640px the modal is a full-screen sheet, video on top, feature list collapses to dots/segmented progress, prev/next icon buttons stay; tour popovers reposition; tested at 375px.
- STT-POLISH-1 Idle/recording button: clicking the mic turns the mic button into a stop (square) icon button in place; `aria-label` and `aria-pressed` follow state.
- STT-POLISH-2 Waveform is a rounded pill, vertically centred in the prompt bar, with the countdown (STT-6) shown inside the pill. The small X cancel stays (discards without transcribing, no API cost).
- STT-POLISH-3 Stop: pressing stop shows a spinner on the button while transcribing; the returned text is appended to the prompt (never replacing it); the button then returns to the mic icon.
- STT-POLISH-4 Silence: client-side detection in `useAudioLevel.ts` (tracks the peak level while recording): if the level never crossed `STT_SILENCE_LEVEL_THRESHOLD` (named constant in `packages/shared/src/models/stt.ts`, beside the existing STT limits) during recording, skip the `/stt` call and show toast A: "We didn't hear anything. Try again and speak a little closer to the mic."
- STT-POLISH-5 Empty response: a Grok response with sound but empty text shows toast B: "Couldn't make out any words. Try again." (replaces the inline/sr-only `empty_text` error; the `grokErrorMessage` `empty_text` copy "No speech detected. Try speaking closer to the mic." is replaced by toast B's copy).
- STT-POLISH-6 Toasts A and B use the existing `showToast`; the prompt is left unchanged in both cases. Touches `VoiceInput/{MicButton,Waveform}.vue`, `useGrokRecorder.ts`, `useAudioLevel.ts`, `useVoiceInput.ts`. Phase 2 is not reopened; this is Phase 3 task T3.5.
- Success: new and existing account see it once; after dismiss, reload, other browser and new device do not; reopen from menu works; the modal shows 10 slides with feature-list jump, "n / 10" and icon nav, no bleed; unit tests for visibility logic (matrix of DB flag x localStorage x profile-loading), PUT authz (401 unauthenticated, writes only the caller's doc even if a body id is sent, 400 unknown version), tour step filtering, STT-POLISH (silence skips the API call, both toasts, stop/spinner states); e2e once-only scenario, layout, tour, and STT-POLISH with mocked `getUserMedia`.
- Edge cases: PUT fails offline (localStorage guards, retry on next load); user dismisses mid-profile-load; two tabs open (storage event closes the second); logged-out visitors never see it; route-guarded pages (onboarding) delay the intro until the dashboard is mounted; autoplay blocked by the browser (poster shown); data-saver/slow network (only current + next media loaded); a recording that is silent for its whole length vs. one with brief speech.

## Track 4: V2 announcement email

- MAIL-1 Tooling: React Email (TSX components, local `email dev` preview, renders to table-based inline-styled HTML) in a new workspace package `packages/email` (`@visual-ai/email`, covered by the `packages/*` workspace glob) that exports `renderV2Announcement(data): Promise<{ html, text }>` for the script (async because `@react-email/render` v1+ `render()` returns a Promise); it has its own `test` script (vitest); no runtime coupling to the web app. MJML is the fallback only if React Email fails to install in this bun workspace or renders badly in Gmail. Resend also accepts the rendered HTML directly.
- MAIL-2 Content: hero (logo, headline, image), "What's new in V2" (3-5 highlights with images hosted on the production domain, absolute HTTPS URLs, `alt` text, fixed widths), benefits/advantages, free-credits reminder ("30 free credits every day", from `DAILY_CREDITS`), primary CTA "Try V2 now" (button with bulletproof padding, UTM params), secondary links (pricing, explore, support), footer with unsubscribe link, sender identity, and physical postal address (CAN-SPAM) read from env, never hardcoded.
- MAIL-3 Quality: 600px max width, responsive single column under 480px, system/web-safe font fallbacks, preheader text, plain-text alternative, dark-mode safe (`color-scheme` meta, transparent PNG logos with light-safe backgrounds, no pure-black/white dependency, buttons with explicit bg/text colors), images under about 200 KB, total HTML < 102 KB to avoid Gmail clipping.
- MAIL-4 Send script `apps/api/scripts/send-v2-announcement.ts`: reads users (`email`, `fullName`/`firstName`) from Mongo; excludes `emailOptOut: true`, empty/invalid emails, and already-sent; sends via Resend batch API (up to 100 per request) in throttled batches (about 2 requests/s max); Resend free tier (user decision): daily cap of 100 (`--daily-cap`, default 100, values above 100 rejected) and monthly awareness of 3,000. Stops cleanly when the cap is hit and prints how many remain; rerun next day continues.
- MAIL-5 Idempotency: record per-user `announcements: { v2: { sentAt, resendId } }` (or `v2AnnouncementSentAt`) on the User doc, written after each successful batch item (use the Resend per-email result; use an idempotency key per batch `v2-announce-<sorted-ids-hash>`); a crashed run never double-sends. Failed items are not marked and are retried; report failures.
- MAIL-6 Modes: `--dry-run` (renders template, prints recipient count/list sample, writes the HTML preview to a temp file; sends and writes nothing); `--test-to <email>` (one send, does not mark any user); `--limit N`. A real send requires an explicit `--confirm` flag plus a printed summary, and refuses to run (non-zero exit, clear message) unless `MAIL_FROM` and `MAIL_POSTAL_ADDRESS` are both set and non-empty; `--dry-run` and `--test-to` work with placeholders.
- MAIL-7 Unsubscribe: User gets `emailOptOut: { type: Boolean, default: false }`. Each email carries an HMAC-signed token (userId + purpose, secret `UNSUBSCRIBE_SECRET`, optional expiry omitted since unsubscribe links must stay valid). `GET /email/unsubscribe?token=` shows a confirm page, `POST` (also RFC 8058 one-click target) sets `emailOptOut=true`; idempotent; invalid token returns 400 with a friendly page. The route is served by the API (mounted at `/`, above the router-level `requireAuth` at `routes/index.ts:19`), so links use `API_PUBLIC_URL`, not the web `APP_PUBLIC_URL`. Headers on every message: `List-Unsubscribe: <${API_PUBLIC_URL}/email/unsubscribe?token=...>, <mailto:...>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
- MAIL-8 Env: `RESEND_API_KEY`, `MAIL_FROM` (e.g. `Visual AI <hello@yourdomain>`), `EMAIL_REPLY_TO`, `MAIL_POSTAL_ADDRESS`, `APP_PUBLIC_URL` (web, CTA/images), `API_PUBLIC_URL` (API origin, unsubscribe links), `UNSUBSCRIBE_SECRET`. Sender domain must have SPF, DKIM, DMARC verified in Resend before the real send.
- Success: dry-run lists expected recipients, excludes opted-out; test send arrives in Gmail (web + Android/iOS) with correct rendering in light and dark, unsubscribe works and the user is excluded on rerun; killing the script mid-run and rerunning sends no duplicates; unit tests for token sign/verify, recipient selection, batching, daily cap.
- Edge cases: duplicate/shared emails; users with no name ("Hi there"); Resend 429/5xx with exponential backoff; partial batch failure; users created during the multi-day rollout (included, if not opted out); bounced/complaint handling is manual in the Resend dashboard (out of scope to automate).

## Data model and API changes (summary)

| Change                                                                                                                    | Where                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `seenIntroVersion` (String)                                                                                               | User schema                                                                                            |
| `emailOptOut` (Boolean), `v2AnnouncementSentAt`/`announcements.v2`                                                        | User schema                                                                                            |
| `POST /stt`                                                                                                               | new route, auth + rate limit                                                                           |
| `PUT /users/intro-seen`                                                                                                   | users route (auth identity)                                                                            |
| `GET/POST /email/unsubscribe`                                                                                             | new route mounted before router-level `requireAuth` (public, token-signed)                             |
| `POST /generate/reference-images` (Cloudinary `upload.array`) + optional `referenceImageUrls[]` on `POST /generate/image` | generate route, queue job data, `generation-service.ts`, `model-input.ts`, registry `imageInput.array` |
| SIGNUP_CREDITS/REFERRAL_BONUS = 30; referral `$inc` literals replaced; shared image-size/type constants                   | `packages/shared`, `routes/users.ts`                                                                   |

## Environment variables (add to `apps/api/src/config/env.ts` zod schema and `.env.example`)

`XAI_API_KEY` (server only), `RESEND_API_KEY`, `MAIL_FROM`, `EMAIL_REPLY_TO`, `MAIL_POSTAL_ADDRESS`, `APP_PUBLIC_URL`, `API_PUBLIC_URL`, `UNSUBSCRIBE_SECRET` (the unsubscribe route needs it at runtime; it fails closed with 400 when unset). STT/rate-limit tunables stay as code constants. Script-only vars are validated by the script, not required at API boot, so the API still starts without them (except `XAI_API_KEY`, optional at boot; `/stt` returns 503 when unset).

## Dependencies to add (ask-first items flagged)

- web: `driver.js` (MIT).
- api: `resend`, `express-rate-limit`, `rate-limit-redis` (store chosen at runtime: Redis when configured, else memory, so the package is always installed).
- email package: `@react-email/components`, `react-email`, `@react-email/render`.
- tooling for assets: `sharp` (dev) for WebP posters/favicon generation, or a one-off CLI (`cwebp`); `ffmpeg` (local CLI) for encoding WebM/MP4 clips; not runtime dependencies.

## Phasing and gates

1. Phase 1 (MOD) gate: tests, typecheck, build of shared, agent-browser checks of upload, dialog (both themes), favicon.
2. Phase 2 (STT) gate: API tests, mocked-mic component tests, manual Chrome and Firefox verification.
3. Phase 3 (INTRO + STT polish) depends on Phases 1-2 (clips show the final UI and mic). Order: persistence, modal shell, tour anchors, tour, STT polish (T3.5), then video loops and posters captured last (T3.6, so the voice clip shows the new mic), then tests and gate.
4. Phase 4 (MAIL) can be built in parallel with 3 but sends only after the app deploy is live.

## Open risks

- Replicate input shapes for multi-image models are unverified; wrong array/string shape silently fails generations (mitigation: per-model schema check + test).
- Web Speech in Chrome streams audio to Google; privacy copy should mention it near the engine menu. Brave/Edge variants behave inconsistently.
- Opening a second `getUserMedia` stream for the waveform alongside SpeechRecognition may conflict on some platforms; fallback is a non-reactive animated indicator.
- xAI STT model name, size limits, formats and rate limits come from a local doc and may change; confirm supported container formats (webm/opus, mp4) before launch.
- Resend free tier (100/day, 3k/month) makes rollout multi-day; users hear about V2 on different days; domain verification lead time (DNS) could block launch.
- Gmail clipping and image-blocking default; hosted images must exist on the production domain before sending.
- Lowering signup credits to 30 changes marketing/SEO claims; dist prerender and cached search snippets will lag.
- Favicon caching: browsers cache aggressively; use versioned query on links.
- Intro written to DB only after PUT success; lost writes only cost a repeat on another device.
- driver.js tour on dynamic layouts (lazy-rendered elements) may misposition; mitigate with ready-checks.
- Intro video weight: 10 clips x 2 formats plus posters; mitigate with the per-clip budget, lazy load of current + next only, and pausing inactive slides. Clips go stale if the UI changes after capture.
- Silence threshold may misjudge quiet mics or noisy rooms (false "didn't hear anything" or false pass); keep it a single tunable constant and cover both sides in tests.

## Out of scope

Grok live WebSocket streaming; charging credits for STT; a settings page; changing existing users' balances; hosted email campaign tools (Mailchimp/Brevo UI); translation/localization; automated bounce/complaint processing; A/B testing of the email; react-joyride or GlowTour for the tour; GIFs or full-page screenshots as intro media; light-theme intro clip variants; a credits/payments intro slide.

## Resolved decisions

1. Sender identity: env placeholders `MAIL_FROM` + `MAIL_POSTAL_ADDRESS`; a real send refuses to run until both are set (MAIL-6). Resolved.
2. Multi-image: single image unless the model's Replicate schema proves an array input (MOD-3.5). Resolved.
3. Resend plan: free tier, <=100/day cap, rerun daily; the script is resumable (MAIL-4/5). Resolved.

## Open Questions (non-blocking; defaults chosen above)

1. Redis available in production for the rate-limit store (default: Redis if configured, else in-memory).
2. Unsubscribe link host (default: new script-only `API_PUBLIC_URL`; alternative: a web route on `APP_PUBLIC_URL` that proxies to the API).
