# Plan: Media Studio (Audio, Video, Tools expansion)

Inputs: `agent_docs/media-studio/SPEC.md` (final, including D1/D2/D4, the default answers to Q3/Q7, and the owner decisions of 2026-11-16 on G9, G10, G14, Q5, Q6, Q8), `agent_docs/media-studio/REPO_MAP.md`, `docs/MODEL_ONBOARDING.md`.
This file holds ARCHITECTURE, DEPENDENCIES and SLICES only. `TASKS.md` (written later) turns each slice into tasks with exact acceptance criteria.

Conventions used below:

- `(new)` = does not exist yet. Anything without `(new)` is in REPO_MAP.md or was verified in the repo on 2026-11-15. Verified extras: `updateAndGetUserCredits` (private atomic two-bucket deduction in `apps/api/src/services/generation-service.ts`), `finalizeJob`, `runGenerationJob` (private, re-exported), the `GenerationJobData` union and the `kind` switch in `generation-worker.ts`, the `data.kind === "image" ? data.body.jobId : data.props.body.jobId` jobId extraction in both `generation-queue.ts` and `generation-worker.ts`.
- Spec ids in `[]`. "Pattern: X" means the implementer must read X first and mirror it.
- All paths are relative to the repo root `visual-ai/`.
- Slice ids: `S<phase>.<n>`. A slice is one PR-sized, demoable vertical cut. Infra slices that have no UI are "demoable" through an API-level mocked e2e or a Vitest integration run, stated per slice.

---

# 1. ARCHITECTURE

## 1.1 Principles (apply to every slice)

1. One registry, one price constant, one limits file. `MODEL_REGISTRY` (extended) is the only place model ids, limits, field maps and prices live. `MEDIA_CREDITS_PER_USD = 200` in `packages/shared/src/models/credits.ts` is the only credit multiplier. `packages/shared/src/models/media-limits.ts` (new) is the only home for limits and is imported by API Zod schemas and web UI (pattern: `image-limits.ts`).
2. The server recomputes everything that costs money: credits (`getMediaCreditCost`), billed TTS characters (`serializeTts`), media durations (from the stored upload record). The client figure is display only.
3. Charge on success only (R-INF-6). A failed, cancelled, moderated or timed-out run is never charged. No reserve/settle, no refund code. The 402 pre-check is read-only.
4. Every paid route is mocked in tests; the e2e user gets a fake Replicate client; `paidCallGuard.ts` is only ever broadened.
5. Flag, never drop or truncate user text (TTS chips, lyrics, overflow). The one explicit, confirmed exception is omitting unsupported TTS chips from the payload (R-TTS-6).
6. Reuse the image flow: `Body.jobId` + `enqueueGeneration` + `GET /generate/progress` SSE + `JobStatus` + `useGenerateStore` (`stores/generate.ts`) + `UnsavedResultNotice` + `LowCreditsDialog`/`BuyMoreCreditsDialog` + `CreditCostBadge` + `AnimatedCounter`.

## 1.2 Package layout (all new unless noted)

```
packages/shared/src/
  models/types.ts            (extend: ModelKind, media fields, new CatalogModelKey members)
  models/registry.ts         (extend: 15 entries = 14 user-facing models + MINIMAX_VOICE_CLONE helper)
  models/credits.ts          (extend: MEDIA_CREDITS_PER_USD, MIN_JOB_CREDITS, getMediaCreditCost, FX_REFERENCE_INR_PER_USD, AUTOCAPTION_USD_PER_30S)
  models/media-limits.ts     (new: every limit/price-adjacent constant)
  models/tts-tags.ts         (new: per-model tag tables, semantic map, TTS_VOICES, TtsDoc types, serializeTts, convertTtsTags, findUnsupportedTags, parseTtsText)
  models/media-prompts.ts    (new: SONG_GENRES, SONG_MOODS, SONG_KEYS, LYRICS_SECTION_TAGS per model, serializeLyrics, compileSongPrompt)
  models/media-shortcuts.ts  (new: MEDIA_SHORTCUTS)
  schemas/media.ts           (new: Zod request schemas, re-exported from schemas/index.ts)
  types/domain.ts            (extend: FeatureType += SONG, MUSIC, SPEECH, VIDEO, WATERMARK_IMAGE, WATERMARK_VIDEO, AUTOCAPTION, SKETCH; JobStatus extended)
  types/api.ts               (extend: MediaJobBody types, MediaAssetDto)

apps/api/src/
  routes/media.ts            (new, mounted in routes/index.ts)
  routes/prompt.ts           (extend: POST /prompt/lyrics)
  services/media-service.ts  (new: processSong/Music/Speech/Video/ImageWatermark/VideoWatermark/Autocaption/VoiceClone, shared runMediaJob)
  services/media-asset-service.ts (new: list/get/delete/createVersion, countUserHistory)
  services/voice-service.ts  (new: clone orchestration, consent write, delete)
  lib/media-input.ts         (new: per-kind Replicate payload builders, registry-driven, sibling of model-input.ts)
  lib/media-upload.ts        (new: sniffMime, upload metadata extraction)
  lib/lyrics-generator.ts    (new)
  lib/credit-deduction.ts    (new: extracted public home of updateAndGetUserCredits so media-service and generation-service share ONE deduction)
  models/media-asset.ts      (new)
  models/media-upload.ts     (new)
  models/voice.ts            (new: Voice + VoiceConsent)
  middlewares/multer.ts      (extend: audioUpload, videoUpload, toolImageUpload instances next to memoryUpload)
  middlewares/rate-limit.ts  (extend: lyricsRateLimiter, pattern: sttRateLimiter)
  queue/generation-queue.ts, generation-worker.ts (extend: new kinds, jobId extractor)
  lib/replicate.ts           (extend: FAKE_* constants per kind)
  utils/cloudinary.ts        (extend: resourceType option on uploadToCloudinary)
  utils/cronJobs.ts          (extend: expired MediaUpload sweep)

apps/web/src/
  components/Header/NavTabs.vue, AppHeader.vue, FeatureSelect.vue (extend) + NavMenuGroup.vue, NavMobileAccordion.vue (new)
  components/Audio/          (new: AudioPlayer, MiniPlayer, TrackCard, WaveformEditor, EditorToolbar, FadeHandles, ExportPanel, TimeCode, PlayButton)
  components/Studio/         (new: StudioShell, StudioActionBar, StudioEmptyState, StudioErrorState, JobProgress, ResultCard, ModelRow, ShortcutsPopover, StudioPlaceholder)
  components/Song/           (new: GenrePicker, SongSummary, LyricsEditor, LyricsSectionCard, LyricsBudgetMeter, SongModelPicker)
  components/Music/          (new: MusicModelPicker, MusicControls, ModelGuidance)
  components/Speech/         (new: TtsEditor, TagMenu, TagChipView, TagChipNode.ts, ModelSwitchBanner, ModelAdvisor, VoicePicker, VoiceCloneDialog, SpeechFaq, SpeechControls)
  components/Video/          (new: VideoModeTabs, VideoControls, FrameUpload, AudioUpload, DraftCallout, VideoResult)
  components/Tools/          (new: WatermarkStage, PlacementHandle, CaptionStyleInspector, CaptionPreview, SketchCanvas, SketchToolbar, ToolVideoUpload, ToolInspector)
  pages/                     (new: SongStudio, Music, Speech, Video, ToolImageWatermark, ToolVideoWatermark, ToolAutocaption, ToolSketchToImage)
  stores/player.ts, stores/voices.ts (new); stores/history.ts (extend)
  composables/useMediaJob.ts, useMediaDraft.ts, useAudioEditor.ts, useAudioExport.ts, useMediaCost.ts, useToolVideoUpload.ts (new); useGlobalShortcuts.ts (extend)
  workers/mp3-encoder.worker.ts (new)
  utils/models.ts (extend), utils/generationCredits.ts (extend), utils/dashboardRoutes.ts (extend), utils/constants.ts (extend FEATURES, FAQs)
  router/index.ts (extend), App.vue (extend: mount MiniPlayer)
  e2e: apps/web/e2e/fixtures/media.ts (new MediaGenerationStub), fixtures/assets/sample.mp3, sample.wav (new), support/paidCallGuard.ts (broaden), support/cloudinaryMock.ts (extend)
```

## 1.3 Shared model registry extension [R-INF-1, R-INF-2, R-INF-3]

`ModelDefinition` gains (all optional, declared only when the Replicate schema accepts them):

- `kind: ModelKind` where `ModelKind = 'image' | 'music' | 'song' | 'tts' | 'video' | 'tool'`. Existing entries are backfilled `kind: 'image'` (default applied in a `getModelKind()` helper so legacy entries need no edit).
- `media?: { durationSec?: {min,max,default}; lyrics?: {min,max}; prompt?: {min,max}; textLimit?: number; voices?: VoiceCatalogKey; pricing: MediaPricing; inputs: Record<AppField, { inputKey: string; ... }> }`.
- `MediaPricing = { unit: 'file' | 'second' | 'kChars' | 'kTokens' | 'run'; usd: number; byResolution?: Record<string, number>; blockSec?: number }`. `blockSec` is the one addition to the spec's unit list (needed for Autocaption's 30 s blocks, spec section 8). Recorded as spec gap G6.
- Prices carry `pricesVerifiedOn: '2026-11-15'` beside the table (R-INF-18/section 4 re-verification task in S0.1).
- `tier: 'standard'` for every media model (default Q6). `isPro` is never set.
- `utility: true` is NOT used for media (it would hide them from the image picker only because of `kind`; the image picker filters `kind === 'image'` explicitly; unit test).

New `CatalogModelKey` members: `LYRIA_2, MINIMAX_MUSIC_26, MINIMAX_MUSIC_15, STABLE_AUDIO_25, IMAGE_WATERMARK, AUTOCAPTION, VIDEO_WATERMARK, INWORLD_TTS_2, INWORLD_TTS_15_MAX, MINIMAX_SPEECH_28_HD, MINIMAX_SPEECH_28_TURBO, CHATTERBOX_TURBO, P_VIDEO, WAN_3, MINIMAX_VOICE_CLONE`. Community models carry the pinned version hash from spec section 4.

Input mapping is data, not code branches (rule from MODEL_ONBOARDING section 2): `lib/media-input.ts` reads `media.inputs[field].inputKey` and builds payloads; fixed values (`disable_safety_filter:false`, `audio_format` never sent, `no_op` never sent, watermark default text never sent) live in a `FIXED_INPUTS` map in the registry entry so a unit test can assert them for every model.

Image picker isolation: `ModelPicker`, `ImageGenerateAside` and `PricingModelCosts` filter on `kind`; a test asserts no media key appears in the image picker.

## 1.4 Credits [R-INF-6, R-INF-6a, R-INF-7]

Single pure function in `packages/shared/src/models/credits.ts`:

```
getMediaCreditCost(modelKey: CatalogModelKey, input: MediaCostInput): number
MediaCostInput =
  | { kind: 'file' }
  | { kind: 'chars'; chars: number }                       // tts: serialized, billed chars; minimum 1 credit
  | { kind: 'seconds'; durationSec: number; resolution: string; draft?: boolean }  // video
  | { kind: 'run' }                                        // watermarks, clone
  | { kind: 'blocks'; videoSec: number }                   // autocaption
credits = max(MIN_JOB_CREDITS, ceil(usd * MEDIA_CREDITS_PER_USD))   // integer math guarded against float error: round usd*200 to 6 dp before ceil
```

Rules: `ceil(x - 1e-9)` guard so `0.025*1000/1000*200` never rounds to 6 from 5.000000001; a unit test regenerates the spec section 8 table from the constant (every row listed there is a test case). Sketch-to-image keeps the existing `getCreditCost`.

Web: `apps/web/src/utils/generationCredits.ts` is extended (read the file first; it exports `getGenerationCreditCost`, `canAffordGeneration`, `getGenerationCreditBreakdown`). `canAffordGeneration` becomes the only affordability helper and accepts either the existing args or a precomputed cost. `composables/useMediaCost.ts` (new) is a thin reactive wrapper: `useMediaCost(modelKey, inputRef) -> { credits, estimated }` calling `getMediaCreditCost`; `estimated` is true for Minimax TTS (A4) and audio-driven P-Video duration. UI shows it through `CreditCostBadge.vue` (+ `AnimatedCounter.vue` tween). No second cost helper exists anywhere.

API flow per paid route (strict order, in `routes/media.ts` + `media-service.ts`):

1. `requireAuth`; stamp server-trusted `userId` exactly as the `/generate/image` handler does (so `E2E_USER_IDS` decides on the authed id).
2. Zod parse (`schemas/media.ts`) -> 400 `{ message, field }`.
3. Model/kind consistency + registry-driven `validateMediaParams` -> 400.
4. Resolve billable quantity server-side (chars from `serializeTts`, durations from `MediaUpload` row).
5. `checkPromptSafety` on prompt/lyrics/TTS text -> 422 `{ code: 'PROMPT_REJECTED', message: "This text can't be used. Try rephrasing it." }` (R-INF-16).
6. `getMediaCreditCost` and read `dailyCredits + credits`; insufficient -> 402 `{ code: 'INSUFFICIENT_CREDITS', required, available }`. Nothing enqueued.
7. Idempotency: if `MediaAsset` or the BullMQ job with `jobId` already exists, return its 202 payload (R-INF-8).
8. `enqueueGeneration` with the new kind; respond 202 same shape as `acceptResponse` in `routes/generate.ts` (verify shape when implementing; mirror, do not redefine).
   Worker (`runMediaJob`, shared by all kinds; pattern: `runGenerationJob` + `finalizeJob`): `runReplicate -> create MediaAsset -> deduct via the single extracted deduction -> copy output to Cloudinary and update the asset url -> status complete`. This is the SPEC R-INF-6 order and the exact order of the existing `runGenerationJob` (storeImageInDB, updateAndGetUserCredits, uploadToCloudinary, finalizeJob); the implementer reads it first and does not reorder. Over the history cap nothing is persisted, the deduction still runs and the Replicate URL is returned unsaved, as for images. Deduction function: `updateAndGetUserCredits` is private in `generation-service.ts`; S0.3 moves it unchanged to `lib/credit-deduction.ts` (new) and re-imports it in `generation-service.ts`, so image and media share ONE deduction (R-INF-6 "reuses, extracts if needed"). Existing generation-service tests must pass untouched (that is the regression guard).

Expensive-job confirmation: `EXPENSIVE_JOB_CREDITS = 150` (media-limits.ts) opens `ConfirmChainActionDialog.vue`-convention dialog (R-VID-4) on every media surface via `StudioActionBar.vue`. One implementation.

## 1.5 Job kinds, queue, SSE [R-INF-4]

`GenerationJobData` gains kinds `song | music | speech | video | image-watermark | video-watermark | autocaption | voice-clone`, each `{ kind; body: MediaJobBody<kind> }` where every body has `jobId: string`, `userId` (server stamped), `modelKey`. The jobId extractors in `generation-queue.ts` (line using `data.kind === "image" ? ... : ...`) and `generation-worker.ts` (same expression, plus the `switch (data.kind)` default `_exhaustive` branch) are replaced by one exported `getJobId(data)` helper (S0.3) so adding a kind cannot desync them; the exhaustive switch gets the new cases.

`JobStatus` (shared `types/domain.ts`, extend after reading it): add optional `stage?: 'queued'|'composing'|'mastering'|'saving'` (copy per kind in a `STAGE_COPY` web constant), `elapsedMs?`, `assetId?`, `asset?: MediaAssetDto`, `credits?`, and for failures `{ noCharge: true, reason: 'FAILED'|'CANCELED'|'MODERATED'|'TIMEOUT'|'CONTENT_SAFETY'|'VOICE_UNAVAILABLE' }`. Web `useMediaJob` (new) subscribes to the existing `GET /generate/progress` SSE (pattern: how `stores/generate.ts` consumes it; includes `authenticateProgress`).

Endpoints (all 202 `{ jobId }` unless noted; all validated by shared Zod; all `requireAuth`):

| Method + path                                                                                                                                                            | Body (shared Zod)                                                                                                                                                                                                       | Notes                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /generate/audio/song`                                                                                                                                              | `{ jobId, modelKey: 'MINIMAX_MUSIC_26'\|'MINIMAX_MUSIC_15', stylePrompt, lyrics, autoLyrics, instrumental, format, bitrate, sampleRate, title? }`                                                                       | refinements per spec 5.1 table; 1.5 requires prompt 10-300 and lyrics 10-600                                                             |
| `POST /generate/audio/music`                                                                                                                                             | `{ jobId, modelKey: LYRIA_2\|STABLE_AUDIO_25\|MINIMAX_MUSIC_26, prompt, negativePrompt?, durationSec?, steps?, cfgScale?, seed?, instrumental? }`                                                                       | per-model discriminated union                                                                                                            |
| `POST /generate/audio/speech`                                                                                                                                            | `{ jobId, modelKey, doc: TtsDocJson, voiceId, params, confirmOmitUnsupported: boolean }`                                                                                                                                | server serializes; 400 `UNSUPPORTED_TAGS_NOT_CONFIRMED` if unsupported chips present and not confirmed; billed chars = serialized length |
| `POST /generate/video`                                                                                                                                                   | `{ jobId, modelKey: P_VIDEO\|WAN_3, mode, prompt, durationSec?, resolution, aspectRatio?, imageUploadId?, lastFrameUploadId?, audioUploadId?, draft?, fps?, promptUpsampling?, negativePrompt?, seed? }`                | ignored-input rules enforced (aspect with image, duration with audio); uploads referenced by id, never by client URL                     |
| `POST /generate/tools/image-watermark`                                                                                                                                   | `{ jobId, imageUploadId, mode, text?, logoUploadId?, position, positionX?, positionY?, scale, margin, opacity, rotation, shadow, backingPlate, tileSpacingX?, tileSpacingY?, outputFormat, quality, preserveMetadata }` | exactly one of text/logo                                                                                                                 |
| `POST /generate/tools/video-watermark`                                                                                                                                   | `{ jobId, videoUploadId, text, size }`                                                                                                                                                                                  | text 1-100, size 1-500                                                                                                                   |
| `POST /generate/tools/autocaption`                                                                                                                                       | `{ jobId, videoUploadId, ...style fields, translate, rightToLeft, transcriptUploadId? }`                                                                                                                                | cost from stored `durationSec` of the upload                                                                                             |
| `POST /generate/audio/voices`                                                                                                                                            | multipart: `file`, `name`, `consent` (`true`), `consentVersion`, `needNoiseReduction`, `needVolumeNormalization`                                                                                                        | clone flow in 1.9                                                                                                                        |
| `GET /voices`, `DELETE /voices/:id`                                                                                                                                      | -                                                                                                                                                                                                                       | auth + ownership                                                                                                                         |
| `POST /prompt/lyrics`                                                                                                                                                    | `{ idea, genres[], moods[], language, modelKey, mode: 'full'\|'section'\|'condense', sections? }` -> 200 `{ sections: [{section, lines[]}], trimmed: boolean }`                                                         | free, `lyricsRateLimiter`, 20 s timeout                                                                                                  |
| `POST /media/uploads`                                                                                                                                                    | multipart `file` + `purpose`                                                                                                                                                                                            | R-INF-17; returns `{ uploadId, url, mime, bytes, durationSec?, width?, height? }`                                                        |
| `GET /media/assets?type=&cursor=&limit=` / `GET /media/assets/:id` / `DELETE /media/assets/:id` / `POST /media/assets/:id/versions` (multipart exported file, 0 credits) | -                                                                                                                                                                                                                       | `/media/*` paths and these shapes are (new) and are not named in the spec (gap G2)                                                       |

Error contract: 400 `{ message, field? }`; 401; 402 `{ code, required, available }`; 422 `PROMPT_REJECTED`; 429 `{ code: 'LYRICS_LIMIT' }`; 502 `{ code: 'LYRICS_FAILED' }`. Web maps via one `mapMediaError()` in `useMediaJob` to `StudioErrorState` copy (spec section 10 states).

## 1.6 Data model (Mongo; no migration framework exists, so "migration" = new collections + indexes; owner approved 2026-11-16, see section 2)

`MediaAsset` (`apps/api/src/models/media-asset.ts`, sibling of `models/image.ts`):
`{ _id, userId (index), type: 'song'|'music'|'speech'|'video'|'tool-image'|'tool-video', feature: FeatureType, modelKey, title, url, publicId, resourceType: 'video'|'image', format, bytes, durationSec?, width?, height?, posterUrl?, transcriptUrl?, prompt, lyrics?, params (Mixed snapshot, secrets-free), parentId? (ObjectId, index), jobId (unique, sparse), creditsCharged, saved: boolean, createdAt }`. Indexes: `{userId:1, createdAt:-1}`, `{jobId:1}` unique sparse, `{parentId:1}`. Autocaption transcript lives on the video asset as `transcriptUrl` (a second Cloudinary raw upload), not a separate asset.

`MediaUpload` (`models/media-upload.ts`): `{ userId, purpose, url, publicId, mime, bytes, durationSec?, width?, height?, sha256, consumedAt?, expiresAt (TTL index, 24 h) }`. This is the server-trusted source of duration/bytes for cost; the client sends only `uploadId`. Inputs are deleted from Cloudinary after job success except a voice sample the user opted to keep (R-TTS-12); `utils/cronJobs.ts` sweeps expired rows' Cloudinary files.

`Voice` (`models/voice.ts`): `{ userId, name (unique per user, 1-40), voiceId (Replicate-returned), status: 'training'|'ready'|'failed'|'unavailable', sourceFileHash, keepSample: boolean, samplePublicId?, createdAt }`; unique `{userId, name}`; per-user cap `MAX_VOICES_PER_USER = 10` (new, gap G5).
`VoiceConsent` (same file, append-only, never deleted when a Voice is deleted, gap G4): `{ userId, voiceId, name, consentText (exact string shown), consentVersion, acceptedAt, sourceFileHash, replicatePredictionId }`; no IP (A7). `CURRENT_CONSENT_VERSION` in `media-limits.ts`; the exact `CLONE_CONSENT_TEXT` constant is shared so the web renders and the API stores the identical string.

History cap: `HISTORY_CAP` (plans.ts) is applied to the combined count of images + media assets via one `countUserHistory(userId)` (new, gap G3). Over cap: asset is still produced and returned with `saved: false` (not persisted to history, URL delivered in the job result) and the web shows the existing `UnsavedResultNotice` pattern. `parentId` versions count too.

Cloudinary: audio and video uploaded with `resource_type: 'video'` (`uploadToCloudinary` gains `resourceType`; read its current signature first). Verify A9 (size limits) in S0.4 against the account plan using only a local fixture, never by a paid or outbound Replicate call.

## 1.7 Web state and composables

- `stores/player.ts` (Pinia, new): owns exactly one `HTMLAudioElement` created lazily on the first user gesture and held outside any route component. State: `current: PlayerTrack|null` (`{ id, url, title, durationSec, source: 'history'|'result'|'editor' }`), `status: 'idle'|'loading'|'playing'|'paused'|'blocked'`, `currentTime`, `volume`, `muted`, `rate`, `loop: {start,end,enabled}|null`. Actions: `play(track)`, `toggle()`, `seek()`, `close()`, `setRate()`, `setLoop()`. `status: 'blocked'` is the `NotAllowedError` state that renders the single "Tap to play" affordance (R-INF-12). It registers Media Session metadata/handlers. Starting a new track pauses the old one by construction (single element). The WaveformEditor hands that same element to wavesurfer v7 via its `media` option, so the editor, the cards and the mini-player never fight (resolves a spec ambiguity in R-INF-11/R-EDIT-1; gap G7). Video playback uses native `<video>` and calls `player.close()` first (audio and video never overlap).
- `stores/voices.ts` (new): list, status polling for `training`, favourites in `localStorage` (try/catch, R-TTS-7).
- `stores/history.ts` (extend): `items` becomes a discriminated union `HistoryItem = ({kind:'image'} & ImageObject) | ({kind:'media'} & MediaAssetDto)`; media loaded from `GET /media/assets`; merged by `createdAt` and grouped with the existing `groupByDate` (`pages/utils`). Filter chips: All, Images, Song, Music, Speech, Video, Tools (`Filter.vue`, `FeatureIcon.vue` variants).
- `composables/useMediaJob.ts` (new): the one job state machine `idle -> submitting -> queued -> running(stage, elapsedMs) -> succeeded(asset) | failed(noCharge reason) | rejected | insufficient`. Generates the client `jobId` (R-INF-8), keeps the button disabled from click until 202, exposes `submit(path, body)`, `retry()` (reuses inputs, new jobId), `cancel` is not supported by the API so it is not offered. Used by all 7 generating surfaces; none writes its own SSE or fetch code.
- `composables/useMediaDraft.ts` (new; pattern `useComposerPersistence.ts`): per-surface draft with shared fields `prompt | lyrics | text | durationSec`, `mapDraftToModel(draft, modelKey) -> { values, unused: string[], overLimit: string[] }`; unused fields get a visible "Not used by <model>" tag, over-limit fields are flagged not truncated (R-INF-13). Persistence in `localStorage` wrapped in try/catch, test reset helper like `resetComposerPersistenceForTests`.
- `composables/useGlobalShortcuts.ts` (extend) reads `MEDIA_SHORTCUTS` (shared constant: `[ {id:'play-pause', keys:'Space', ...}, 'seek-back' ArrowLeft, 'seek-forward' ArrowRight, 'mute' M, 'loop' L, 'region-start' [, 'region-end' ], 'generate' Mod+Enter, 'undo' Mod+Z, 'redo' Mod+Shift+Z, 'close' Escape, 'help' ? ]`). Guard `isTypingContext(target)` (input, textarea, contenteditable incl. TipTap `.ProseMirror`, or an open `AppModal`) suppresses every single-key shortcut; `Mod+Enter` is exempt. A unit test asserts key uniqueness across `MEDIA_SHORTCUTS` plus all keys already registered in `useGlobalShortcuts.ts`. `components/Studio/ShortcutsPopover.vue` renders the list from the constant (never hand-written), opened by `?` or a header icon.
- Shared view states: `StudioEmptyState` (one useful example action, never illustration only), `JobProgress` (stage text, elapsed time, "you can leave this page; it will appear in History"), `StudioErrorState` (what happened + "No credits were used." + one next step), `ResultCard` (success, focus moves to Play), `StudioActionBar` (cost badge + Generate + disabled reason line; sticky bottom on mobile, stacked above `MiniPlayer` via CSS var `--mini-player-h`).

## 1.8 Header nav and routes [R-INF-10]

- `NavTabs.vue` renders `Image` (unchanged destination/behaviour), `Video`, `Audio ▾`, `Tools ▾`. `NavMenuGroup.vue` (new) wraps `Popover.vue`: opens on click or Enter/Space/ArrowDown; ArrowUp/Down move, Home/End jump, Enter activates, Esc closes + returns focus to trigger, Tab closes, hover never opens; each item = 16 px icon + label + one-line muted description. Mobile (< 768 px): `NavMobileAccordion.vue` (new) in the existing mobile menu (inside `AppHeader.vue`; read it first), items >= 44 px.
- Routes in `router/index.ts` (lazy, auth-guarded the same way as the create route): `/video`, `/audio/song`, `/audio/music`, `/audio/speech`, `/tools/image-watermark`, `/tools/video-watermark`, `/tools/autocaption`, `/tools/sketch`. Route names are added to `APP_SURFACE` / `APP_SURFACE_TAB` in `dashboardRoutes.ts` so `isAppShellRoute` and `tabFromRouteName` highlight Audio on any `/audio/*` and Tools on any `/tools/*`. `FEATURES` gets entries for the new `FeatureType`s (only the ones that have a header destination; `FeatureSelect.vue` is for the image dashboard and is left unchanged except for type compatibility, test asserts the image feature select still lists only the five image features).
- Until a phase ships its page, its route renders `StudioPlaceholder.vue` (new): honest empty state ("Song studio is coming soon") with a link back to Image; the placeholder is deleted in the slice that ships the page. Gap G8 (spec puts the full header in P0 but pages in later phases).
- Studio accent: per-route class sets a `--studio-accent` token pair (light/dark) added to `tailwind.semantic-plugin.js`: Song warm, Music cool, Speech teal, Video and Tools neutral/brand. All studio colours are tokens; no hard-coded hex (R-TTS-4, R-QOL-3).

## 1.9 Speech: tag model, editor, serializer, flagging

Semantic model (shared, `tts-tags.ts`, no TipTap import so API and web share it):

```
type TtsModelKey = 'INWORLD_TTS_2' | 'INWORLD_TTS_15_MAX' | 'MINIMAX_SPEECH_28_HD' | 'MINIMAX_SPEECH_28_TURBO' | 'CHATTERBOX_TURBO'
type TtsTagId = 'laugh'|'sigh'|'cough'|'clear-throat'|'breathe'|'yawn'|'gasp'|'chuckle'|'groan'|'sniff'|'sush'|
                'humming'|'whistles'|'sneezes'|'applause'|'pause'|'direction'|
                'emotion-happy'|'emotion-sad'|'emotion-angry'|'emotion-surprised'|'emotion-fearful'|'emotion-disgusted'|
                'delivery-laughing'|'delivery-whispering'
interface TtsTagDef { id: TtsTagId; group: 'emotion'|'non-verbal'|'delivery'|'pause'|'direction'; label: string;
                      syntax: string /* display */; render(params: TagParams): string /* exact serialized */;
                      param?: 'seconds' | 'text'; presetText?: string }
const TTS_TAGS: Record<TtsModelKey, readonly TtsTagDef[]>        // exactly spec section 6.1-6.4, nothing else
const TTS_SEMANTIC_MAP: Record<TtsTagId, Partial<Record<TtsModelKey, TtsTagId | null>>>   // spec 6.5; null/absent = unsupported
type TtsDocJson = { type: 'doc'; content: Array<{ type: 'paragraph'; content?: Array<{type:'text';text:string} | {type:'ttsTag'; attrs:{ tagId: TtsTagId; seconds?: number; text?: string }}> }> }
```

Inworld 2 direction presets are `direction` chips with `text` prefilled (editable), not distinct ids, so the semantic map has one `direction` row (matching the spec table) and "Convert to equivalents" never invents a direction.
Every tag in `TTS_TAGS` carries `source: 'README'|'schema'` plus `confirmedOn: '2026-11-15'` for the "listed as supported only if Confirmed" rule; a unit test fails if a def lacks it.

Pure functions (shared, fully unit-tested, table-driven per model):

- `serializeTts(doc, modelKey): { text, billedChars, omitted: Array<{tagId, path}>, warnings: Array<'PAUSE_AT_EDGE'|'NO_SPEAKABLE_TEXT'> }`. Per model: Inworld 2 `[cue]` immediately before the text it applies to; Inworld 1.5 `<break time="1s" />`/`"500ms"` (`ms` below 1 s, `s` otherwise, 0.1 s steps, `TTS_PAUSE_MIN_SEC = 0.1`, `TTS_PAUSE_MAX_SEC = 10`); Minimax `(laughs)` and `<#0.50#>` (2 decimals, never emitted first or last token); Chatterbox bracketed. Unsupported chips go to `omitted` and are not emitted. Paragraphs join with `\n`. `billedChars` is `text.length` after serialization and is what both the web cost and the API cost use.
- `findUnsupportedTags(doc, modelKey)`, `convertTtsTags(doc, modelKey)` (only rows with a value in both columns; Minimax first-emotion path returns an `emotionSuggestion` instead of a chip), `parseTtsText(raw, modelKey): TtsDocJson` (paste parsing: raw bracket text that matches the ACTIVE model's syntax becomes chips; unrecognised stays literal).
- Emphasis is not a tag: a toolbar action uppercases the selection (Inworld 2 only).

TipTap integration (web):

- `TagChipNode.ts` (new): `Node.create({ name: 'ttsTag', group: 'inline', inline: true, atom: true, selectable: true, attrs: tagId, seconds, text })` with a Vue NodeView `TagChipView.vue`. The chip NEVER stores `supported`; `TtsEditor` provides the active `modelKey` to the NodeView via `provide/inject`, and the view computes `supported = isSupported(tagId, modelKey)`, so a model switch re-renders flags without mutating the document (text is always preserved, R-TTS-6). Pause chips render an inline number input (step 0.1, or 0.01 for Minimax) and direction chips an inline text input; both are focusable, `aria-label="Tag: laugh"`, Backspace deletes the atom as one unit.
- `TagMenu` uses `@tiptap/suggestion` with `char: '/'`, `allowSpaces: false`, `startOfLine: false`, triggers only at word start; items come from `TTS_TAGS[modelKey]` filtered by the query; groups headed; empty row "No matching tag for <model>"; Inworld 2 offers "Custom direction: <query>" when the query has no match; max 8 rows, footer hint "Up/Down to move, Enter to insert, Esc to close". Role `listbox`/`option`, `aria-activedescendant` on the editor.
- Extensions: `Document`, `Paragraph`, `Text`, `History` (undo/redo), `Placeholder`, `CharacterCount` (limit from the model's `textLimit`, counting the serialized chars, so tags count per spec section 9 FAQ 4). StarterKit is not used wholesale (no formatting): only the listed extensions to keep "plain paragraphs only" structural, not by hiding toolbar buttons. Counter and overflow highlight via a ProseMirror decoration (not truncation).
- `ModelSwitchBanner.vue`: persistent above the editor while any chip is unsupported, with count + "Review" (cycles focus through flagged chips), "Convert to equivalents" (calls `convertTtsTags` as one undoable transaction), "Remove unsupported" (explicit, one undoable transaction). Generate stays enabled but opens a confirmation stating "N tags will be left out of the audio" (names the tags), which sets `confirmOmitUnsupported: true`. Minimax switch: banner offers "Set Emotion to <x>" for the first emotion chip.
- Over-limit after switch: highlighted overflow range, Generate disabled with the reason line.

Voice clone flow [R-TTS-10, R-TTS-11, R-TTS-12]:

1. Web: `VoiceCloneDialog.vue` steps Upload -> Consent -> Name -> Clone. Client pre-checks (type/size/duration via `decodeAudioData` or `<audio>` metadata, 10 s-5 min, < 20 MB) with the spec copy; waveform preview via the shared `Waveform`-style canvas, not the full editor. Consent checkbox is unchecked by default, never persisted, never pre-ticked by a draft; the Clone button is disabled until ticked and shows "Clone voice · 600 credits" (from `getMediaCreditCost('MINIMAX_VOICE_CLONE', {kind:'run'})`; the 600 is never typed).
2. API `POST /generate/audio/voices`: `requireAuth`; reject (400) unless `consent === true && consentVersion === CURRENT_CONSENT_VERSION`; sniff MIME; upload to Cloudinary (`MediaUpload`, purpose `voice-sample`); read duration from Cloudinary and enforce 10-300 s (delete the upload on failure); compute sha256; same-hash duplicate for the same user returns 409 `{ code: 'DUPLICATE_VOICE', existingVoiceId }` and the dialog asks whether to reuse; 402 pre-check for 600 credits; **write `VoiceConsent` (and `Voice` status `training`) BEFORE enqueueing** so no paid call can exist without an audit row; enqueue kind `voice-clone`.
3. Worker `processVoiceClone`: `runReplicate(MINIMAX_VOICE_CLONE, { voice_file: url, model: CLONE_TRAINING_MODEL('speech-02-hd'), accuracy: CLONE_ACCURACY(0.7), need_noise_reduction, need_volume_normalization })`; on success persist `voiceId` and `replicatePredictionId` on the consent row, set `ready`, deduct 600 via the shared deduction, delete the sample unless `keepSample`; on failure set `failed`, charge nothing.
4. Use: Minimax 2.8 `voice_id` accepts the stored id. A vendor "voice not found" error marks the Voice `unavailable`, returns `noCharge` reason `VOICE_UNAVAILABLE`, UI shows "This voice is no longer available. Re-clone it to keep using it." (Q5: R-TTS-10 and this state stay regardless of the one approved test call, T3.7).
5. Delete: removes `Voice` and the stored sample; `VoiceConsent` is retained as the audit trail; confirmation text states the clone fee is not refunded (spec section 8).
   Voice-clone surfaces: "My voices" tab visible on all 5 models; on non-Minimax models it shows "Cloned voices work on Minimax Speech 2.8 HD and Turbo" + "Switch to 2.8 HD".

## 1.10 Waveform editor and export [R-EDIT-*]

- `WaveformEditor.vue` (new) = presentation over `composables/useAudioEditor.ts` (new), which owns an immutable `EditState = { trim:{start,end}, fadeIn, fadeOut, gain (0-2), rate (0.5-2), preservePitch, loop:{start,end,enabled}|null }` and an undo/redo stack (`EDIT_HISTORY_LIMIT = 100`, coalescing drags into one entry). All math lives in pure `utils/audioEditMath.ts` (new): `applyEditToBuffer` plan, fade curve, `estimatePcmBytes`, snap-to-zero-crossing helper. wavesurfer v7 with Regions plugin only draws the waveform and region and forwards pointer input; playback goes through `stores/player.ts` (1.7). Fade handles are our own SVG/DOM layer (`FadeHandles.vue`), not wavesurfer features.
- Peaks: decode once (`AudioContext.decodeAudioData` on the fetched Cloudinary file) -> precompute `peaks` downsampled to `EDITOR_PEAK_BUCKETS = 2000` -> pass to wavesurfer so scrubbing stays 60 fps; skeleton while decoding (R-EDIT-4).
- Export (`useAudioExport.ts` + `workers/mp3-encoder.worker.ts`, new): `OfflineAudioContext` render of the trimmed region with fades, gain and rate; WAV via our own 16-bit PCM encoder (`utils/wavEncoder.ts`, new); MP3 via `@breezystack/lamejs` in a Web Worker, 128/192/320 kbps; progress + Cancel (worker `terminate()` and AbortController, buffers nulled); `EXPORT_PCM_CAP_BYTES = 200 * 1024 * 1024` pre-flight on `estimatePcmBytes(trimmedDuration/rate, channels, 4)`; over cap -> blocked copy from spec. Failure -> retry with WAV fallback and a structured `logger`-style console/telemetry event with context (R-EDIT-6, R-QOL-4). A 6-min stereo 44.1 kHz fixture (generated in the test, not committed: sine buffer, about 127 MB Float32) is a required test.
- "Save as new version": the exported Blob is posted to `POST /media/assets/:id/versions` (child asset, `parentId`); the original is never overwritten; "Download original" is primary when `isEdited === false`, Export is primary only when edited.
- Accessibility: every control keyboard operable; region handles are `role="slider"` with arrow-key steps (Shift = 1 s units per R-INF-15 spec on seeking, handles use 0.1 s, Shift = 1 s); `aria-live="polite"` time readout throttled to 1 per second; waveform has `role="img"` with title + duration text alternative.

## 1.11 E2E paid-call mocking [R-INF-9]

- `apps/api/src/lib/replicate.ts`: extend the `FAKE_REPLICATE_OUTPUT_URL` branch (taken when `env.E2E_USER_IDS` includes the authed user) with `FAKE_REPLICATE_AUDIO_URL`, `FAKE_REPLICATE_VIDEO_URL`, `FAKE_REPLICATE_TRANSCRIPT_URL`, `FAKE_VOICE_ID` (all new) chosen by `ModelKind`/model key. `lyrics-generator.ts` returns a fixed fake lyrics object for the same users (no DeepSeek call). The Cloudinary step for these users uses the existing mock path (`MOCK_CLOUD_UPLOAD`, `installCloudinaryMock`/`pickMockAsset` in e2e support; read first) extended to return audio/video-shaped assets.
- `apps/web/e2e/support/paidCallGuard.ts`: `PAID_PATH_PATTERN` (currently not exported; export it for unit tests) is broadened to also match `POST /generate/audio/*`, `/generate/tools/*`, `/prompt/lyrics` and `/generate/audio/voices`; it already covers `/generate/video`. Guard unit tests per path (there is an existing `paidCallGuard` test; extend it). Never narrowed, never opted out.
- `apps/web/e2e/fixtures/media.ts` (new) `MediaGenerationStub`: pattern `GenerationStub` in `fixtures/generation.ts`; stubs the 202, the SSE progress stream AND the POST itself (spec: stubbing only the stream is not enough); variants `success`, `failure` (noCharge), `insufficient` (402), `moderated` (422), `slow` (stage progression). Fixtures: `sample.mp3`, `sample.wav` (each <= 5 s, new), existing `.mp4`.
- Every e2e spec uses the e2e Clerk user; balance assertions use `readCredits` from `support/proPerksSeed.ts`.

## 1.12 UI quality bar (feeds TASKS.md acceptance criteria; skill: `impeccable` + `critique`/`polish`/`layout`/`typeset`/`normalize`/`clarify`; never `frontend-design`; browser checks via `agent-browser` with a repo-unique session)

Global (every page): two-column desktop (compose column max about 560 px, sticky result/editor column), single column mobile with sticky bottom `StudioActionBar` (cost + Generate), safe-area insets, tap targets >= 44 px, no horizontal scroll at 360 px; focus ring visible everywhere; AA contrast in light and dark verified for every new token pair; `prefers-reduced-motion` disables number tweens, slide-ups and skeleton shimmer; popovers 150-250 ms ease-out, nothing else animates except RAF playhead; large tabular numerals for cost and time (`font-variant-numeric: tabular-nums`); page title one display size, section titles one size, small-caps control labels (typeset pass); no gradient hero, no emoji icons, no identical rounded-everything card grid; one distinctive idea per studio carried through. Required states on every page: empty (one example action), loading (skeleton + stage text), error with "No credits were used." and a single next step, success (toast + scroll into view + focus on Play), offline/timeout retry. Copy strings come from spec section 10/11/R-ids verbatim where given; everything else passes `clarify`/`copywriting`.

Per feature (the writer of TASKS.md must turn each into checkable criteria):

- Header/nav: dropdown keyboard map exactly R-INF-10; active tab highlight on child routes; mobile accordion; no layout shift when the credits chip grows; dropdown items have description lines truncated to one line.
- Mini-player: 56 px, slide-up 200 ms ease-out, title ellipsis, scrubber keyboard operable, close ends playback, mobile bar above safe-area and above-stacked by the action bar variable, survives route change (e2e), never autoplays, "Tap to play" on `NotAllowedError`.
- Song: four collapsible steps with a sticky summary + live cost; genre chips grouped, searchable, check on selected, dimmed with tooltip "Up to 3 genres" at the limit; "Your sound" summary line; lyric section cards with coloured left rule per section type, drag handle AND move up/down buttons (keyboard reorder), thin budget bar "420 / 600" turning error-token over budget with the spec sentence; empty state = 3 example ideas + one sample loop (R-SONG-8); progress shows elapsed time for 6-min jobs.
- Music: model segmented control with guidance strip (strength, duration, cost) always visible; Lyria "30 s" fixed badge not a disabled slider; Stable Audio duration slider with "Longer is the same price" hint; "Avoid" field only on Lyria; Advanced disclosure for steps/cfg/seed.
- Speech: writing-surface editor (large type, about 68 ch measure, line-height 1.6), slash menu per spec section 10, chips 20 px pills with group-colour tokens at 14 % tint and 100 % text (AA both themes), pause chip distinct shape, unsupported chip = diagonal-stripe border + label (never colour alone), persistent switch banner, advisor 3-chip quick picker + answer card, FAQ accordion deep-linkable (`Accordion.vue`/`FAQ.vue`), voice rows show README text descriptions only (no play button), favourites star; clone dialog step list + real-time validation + consent block with the exact sentence and terms link, disabled button with explanation.
- Waveform editor: accent waveform at 60 % with played portion full strength, 12 px region handles (24 px touch hit area), timecodes at edges and under playhead (ms on hover), toolbar order transport | region | fades | volume | speed | export, clipping warning above 100 % gain, mobile = full-height bottom sheet.
- Video: prompt first and large; mode tabs with thumbnails; resolution segmented control + duration slider with live cost; ignored controls disabled with tooltip; "Try cheap first" draft callout showing saved credits; expensive-job dialog default focus on Cancel; long-job messaging.
- Tools: canvas-first stage as hero (checkerboard for transparency, caption safe zones), inspector right (bottom sheet mobile), snapping guides + position readout on watermark drag, preview labelled approximate, video watermark shows the honest fixed-placement caption and no fake controls, sketch canvas with pointer events/palm rejection/two-finger pan-zoom, autosave.

---

# 2. DEPENDENCIES

| Dependency                                                                                                                                                               | Version policy                                 | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Used where                                                                                                                                                                                                              | Approval                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `@tiptap/vue-3`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/extension-document`, `-paragraph`, `-text`, `-history`, `-placeholder`, `-character-count`, `@tiptap/suggestion` | latest 2.x compatible with Vue 3, pinned exact | Atomic inline chip nodes, slash suggestion, undo/redo, placeholder, counter without writing a ProseMirror binding. Spec decision: user-approved. We deliberately install the individual extensions, not `@tiptap/starter-kit`, so formatting cannot exist (R-TTS-3 "plain paragraphs only"). `@tiptap/core`/`@tiptap/pm` are TipTap peer dependencies.                                                                                                                                                                                                                                                            | `apps/web` only: `components/Speech/*` (S3.1-S3.3)                                                                                                                                                                      | Approved in spec                                            |
| `wavesurfer.js` v7 (includes Regions plugin)                                                                                                                             | exact pin                                      | Peak rendering, region/loop drag, `peaks` input and `media` element injection; rewriting waveform rendering + region interaction is large and bug-prone                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `apps/web` `components/Audio/WaveformEditor.vue` (S1.3). Also reused read-only in `AudioPlayer.vue` waveform mini-render (S0.7 uses a canvas sparkline from peaks instead; wavesurfer is NOT loaded by the mini-player) | Approved by owner 2026-11-16                                |
| `@breezystack/lamejs`                                                                                                                                                    | exact pin                                      | Client-side MP3 encoding (R-EDIT-2); the browser has no MP3 encoder; ffmpeg.wasm is excluded (D4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `workers/mp3-encoder.worker.ts` only (S1.4)                                                                                                                                                                             | Approved by owner 2026-11-16                                |
| none (decision)                                                                                                                                                          | -                                              | Lyrics drag reorder: HTML5 pointer drag + required keyboard move buttons; no sortable library. Sketch canvas: Pointer Events + `<canvas>`; no drawing library. Server MIME sniffing: hand-written magic-byte table `sniffMime` (MP3 `ID3`/`0xFFEx`, WAV `RIFF....WAVE`, M4A/MP4/MOV `ftyp`/`qt`, FLAC `fLaC`, WebM `1A 45 DF A3`, PNG, JPEG, WEBP `RIFF....WEBP`, BMP `BM`) instead of the `file-type` package. Fonts for caption preview via Google Fonts CSS lazily (already the pattern for stylesheets) or `@fontsource/*` if the repo already uses it (verify; otherwise Google Fonts link injected lazily). | -                                                                                                                                                                                                                       | If an implementer proposes any other package, stop and ask. |

Nothing else is installed. No ffmpeg, no Cloudinary SDK changes (`uploadToCloudinary` already exists).

Approved by the owner on 2026-11-16 (no longer waiting on any answer): new Mongo collections `MediaAsset`, `MediaUpload`, `Voice`, `VoiceConsent` (needed at S0.4/S0.5/S3.6), `wavesurfer.js` (S1.3), `@breezystack/lamejs` (S1.4), any change to `paidCallGuard.ts` beyond broadening (none planned).

Cross-slice dependency graph (bottom-up):

```
S0.1 registry/limits/credits ──┬─► S0.2 e2e harness ──┐
                               ├─► S0.3 pipeline ─────┼─► S0.4 assets ─► S0.5 uploads
                               └─► S0.6 nav/routes    │            └────────┐
                                    S0.7 player ──────┤                     ▼
                                    S0.8 history/useMediaJob ◄──── S0.3,S0.4,S0.7
                                    S0.9 shortcuts/drafts ◄── S0.7
                                    S0.10 docs/pricing/gate ◄── all P0
P1: S1.1 song page core ◄ S0.3,S0.4,S0.8 ─► S1.2 lyrics ─► (S1.3 editor ◄ S0.7,S0.9) ─► S1.4 export/versions ◄ S0.4
P2: S2.1, S2.2 ◄ S1.1 (shared Studio components), S1.3
P3: S3.1 ◄ S0.3,S0.8,S1.3 ─► S3.2 tags ─► S3.3 switch ─► S3.4 advisor/FAQ ; S3.5 voice-clone ◄ S0.5,S3.1
P4: S4.1 ◄ S0.* ─► S4.2 uploads ◄ S0.5 ─► S4.3 draft ; S4.2 consumes S3.1 audio deep link
P5: S5.1 ◄ S0.5 ; S5.2/S5.3 ◄ S0.5 + shared tool video uploader ; S5.4 ◄ existing image flow ; S5.5 ◄ S4.1,S5.2,S5.3
```

Parallelisation: within P0, S0.2/S0.3 (API+tests) and S0.6/S0.7 (web) can run in parallel after S0.1; S0.4 and S0.5 are sequential (migrations/uploads). Inside P3, S3.5 (voice clone) is independent of S3.2-S3.4 after S3.1.

---

# 3. SLICES

Phase order is fixed: P0 -> P1 -> P2 -> P3 -> P4 -> P5. Each slice states goal, spec ids, files, dependencies, risks, verification. Risk tags: [MONEY] credits/pricing, [AUTH], [MIGRATION], [UPLOAD], [CONSENT]. Verification always includes `bun run check`, `bun run test`, and (S0.10, and any slice touching registry docs) `bun run check:model-docs`.

## Phase P0: Shared infrastructure

### S0.1 Registry, limits, credit function, catalog [MONEY]

- Goal: all media models, limits and the single price function exist and are consumed by both apps; nothing user-visible yet except media rows on the pricing model-cost list (shared helper only).
- Spec: R-INF-1, R-INF-2, R-INF-3, R-INF-7 (shared half), R-INF-18 (registry/`MODELS` half).
- Files: `packages/shared/src/models/{types,registry,credits,media-limits,media-prompts,media-shortcuts}.ts`, `packages/shared/src/schemas/media.ts` (schemas scaffolded, filled per slice), `packages/shared/src/types/domain.ts` (FeatureType), `apps/api/src/types/index.ts` and `apps/web/src/types/index.ts` (FeatureType sync), `apps/web/src/utils/models.ts` (+ `fromRegistry` entries for the 14 user-facing models; the helper gets no picker entry), `apps/web/src/assets/models/` provider icons (Inworld, Minimax, Stability, Resemble, Pruna, Alibaba; Google reused) + `PROVIDER_DISPLAY_NAMES`, `apps/web/src/utils/constants.ts` (`FEATURES` entries for new FeatureTypes that have a destination), shared tests beside sources.
- Also: re-verify every row of spec section 4 (read-only reading of each Replicate model page and schema; no run, no billing) and stamp `pricesVerifiedOn`; record deltas in the PR description. Open item: P-Video free-launch note.
- Depends on: none.
- Risks: [MONEY] float rounding (guard in 1.4); drift between registry `inputs` and the real Replicate schema (each `inputs` key cites the spec 5.x row in a comment); media models leaking into the image picker (test).
- Verify: Unit: `getMediaCreditCost` table-driven for every row of spec section 8 + boundary cases (0 chars -> 1, 1000/2000/10000 chars, 5 s and 20 s video, draft, 120 s autocaption = 44); registry shape test (every media entry has pricing, kind, no `isPro`, community ids have `:hash`); `models.test.ts` catalog test; FeatureType parity test across the three declarations; image picker excludes media. `bun run check:model-docs`.

### S0.2 E2E paid-call mocking harness [MONEY]

- Goal: no media or lyrics call can ever reach a paid service in tests; the fake client returns per-kind outputs.
- Spec: R-INF-9 (and the mock half of every phase's e2e).
- Files: `apps/api/src/lib/replicate.ts`, `apps/api/src/lib/lyrics-generator.ts` skeleton (fake-return branch only), `apps/web/e2e/support/paidCallGuard.ts` (+ its test), `apps/web/e2e/support/cloudinaryMock.ts`, `apps/web/e2e/fixtures/media.ts`, `apps/web/e2e/fixtures/assets/sample.mp3`, `sample.wav`.
- Depends on: S0.1 (model kinds).
- Risks: guard regex too loose/tight (false negatives are the dangerous case); fixture size (keep <= 5 s, tiny); never exporting anything that lets a spec opt out.
- Verify: Unit: `isPaidCall` true for `POST /generate/audio/song|music|speech|voices`, `/generate/tools/<x>`, `/generate/video`, `/prompt/lyrics`; false for `GET`; `replicate.ts` returns the right fake URL per kind for an `E2E_USER_IDS` user and goes to the real client otherwise (client injected/mocked, assert real client NOT called for e2e user and IS selected for others without calling it). Mocked e2e: a throwaway spec fires each new path un-intercepted and the guard reports failure (guard self-test, not committed as a passing paid call).

### S0.3 Media job pipeline (API core) [MONEY][AUTH]

- Goal: any media kind can be submitted, pre-checked, moderated, queued, run, charged once on success and reported via SSE, proved with `LYRIA_2` as the reference kind registered end-to-end (the real music UI comes in S2.1).
- Spec: R-INF-4, R-INF-6, R-INF-6a, R-INF-7 (API half), R-INF-8, R-INF-16.
- Files: `apps/api/src/routes/media.ts` (+ mount in `routes/index.ts`), `services/media-service.ts` (`runMediaJob` + `processMusic` for LYRIA only), `lib/media-input.ts`, `lib/credit-deduction.ts` (extracted `updateAndGetUserCredits`), `services/generation-service.ts` (import the extracted function; no behaviour change), `queue/generation-queue.ts` + `generation-worker.ts` (new kinds union, `getJobId`, exhaustive switch), `packages/shared/src/schemas/media.ts` (music schema), `packages/shared/src/types/domain.ts` (`JobStatus` extension), tests.
- Depends on: S0.1, S0.2.
- Risks: [MONEY] double deduction (idempotency: jobId unique; deduct exactly once guarded by asset exists check); deduction function move must not change image behaviour; client-sent cost ignored; [AUTH] `userId` must be the authed id, never body; BullMQ job de-dup by jobId (confirm `generationQueue.add` uses `jobId` option, else add it).
- Verify: Unit: 402 body exact shape and nothing enqueued (assert `enqueueGeneration` not called); 422 `PROMPT_REJECTED` and nothing charged; 400 field-level for invalid body; duplicate `jobId` returns existing job and enqueues once; success deducts exactly `getMediaCreditCost` once and writes balance; Replicate failure, timeout, moderation and cancel deduct nothing; deduct-fails-after-success ends in error and delivers no asset; client `credits` field ignored; payload builder never sends unsupported/fixed fields; existing `generation-service` and queue tests unchanged and green. Mocked e2e (API-level via Playwright `request` with the e2e user and the media stub): POST -> SSE complete -> balance dropped by the cost; failure variant -> balance unchanged.

### S0.4 Asset persistence and assets API [MONEY][MIGRATION][AUTH]

- Goal: completed jobs are copied from the temporary Replicate URL to Cloudinary and saved as `MediaAsset`; assets can be listed, fetched, versioned and deleted; history cap respected.
- Spec: R-INF-5, R-INF-14 (API half), R-EDIT-3 (API half).
- Files: `apps/api/src/models/media-asset.ts`, `services/media-asset-service.ts`, `routes/media.ts` (assets routes), `utils/cloudinary.ts` (`resourceType`), `services/cloudinary-service.ts` (delete media asset, pattern of `deleteImageByObject`), `services/media-service.ts` (persist step), shared `MediaAssetDto`, tests. APPROVAL NEEDED: new collection (G9).
- Depends on: S0.3.
- Risks: [MIGRATION] new collection + indexes (unique sparse `jobId`); [AUTH] every read/delete scoped to `userId` (IDOR tests); Cloudinary size limit (A9) checked with a local fixture; leaking the Replicate temporary URL after copy; deleting a parent must also delete versions (decide: cascade delete children, test).
- Verify: Unit: asset created with correct fields; over `HISTORY_CAP` returns `saved:false` and no DB row but delivers the URL; list pagination cursor; delete removes Cloudinary resource with `resource_type: 'video'` and children; another user's id -> 404; version creation sets `parentId`, charges 0, counts against cap. Mocked e2e (API-level): generate fake audio -> `GET /media/assets` lists it.

### S0.5 Upload infrastructure [UPLOAD][AUTH][MIGRATION]

- Goal: one safe upload path for audio, video and image inputs that every later feature uses; the server, not the client, owns duration and size for cost.
- Spec: R-INF-17, R-INF-2 (upload limits), underpins R-VID-3, R-TTS-10, R-TOOL-\*.
- Files: `apps/api/src/middlewares/multer.ts` (`audioUpload`, `videoUpload`, `toolImageUpload`, each with `limits.fileSize` from `media-limits.ts`; pattern `memoryUpload`/`referenceImagesUpload`), `lib/media-upload.ts` (`sniffMime`, purpose -> allowed MIME/size table), `models/media-upload.ts`, `routes/media.ts` (`POST /media/uploads`), `utils/cronJobs.ts` sweep, tests. APPROVAL NEEDED: new collection.
- Depends on: S0.4.
- Risks: [UPLOAD] extension/MIME spoofing (server sniff is authoritative; extension ignored); memory pressure (multer memory storage with a hard per-purpose cap; videos up to `MAX_TOOL_VIDEO_BYTES = 100 MB` must stream to Cloudinary or use disk temp, decide in S0.5 and document; default: disk storage for video purposes, memory for the rest); orphaned files (TTL + cron + delete-on-consume); duration trust (taken from Cloudinary's response, not the client); rate limit on uploads.
- Verify: Unit: `sniffMime` table for every accepted type and for a renamed `.mp3` that is really text (rejected); oversize rejected with 413-mapped copy; purpose/MIME mismatch rejected; duration read from the mocked Cloudinary response and stored; unauthenticated rejected; expired row sweep deletes Cloudinary file (mocked). Mocked e2e (API-level): upload `sample.mp3` returns `uploadId` + `durationSec`; upload of `sample.mp3` renamed `.png` is rejected.

### S0.6 Header navigation, routes, studio shell [R-INF-10]

- Goal: header shows Image · Video · Audio ▾ · Tools ▾ with full keyboard support, active states and mobile accordion; every new route loads (placeholder pages).
- Spec: R-INF-10, R-QOL-2/3 (shell layout, tokens, reduced motion).
- Files: `Header/NavTabs.vue`, `Header/AppHeader.vue`, `Header/NavMenuGroup.vue`, `Header/NavMobileAccordion.vue`, `components/primitives/Popover.vue` (only if a keyboard gap is found; otherwise untouched), `router/index.ts`, `utils/dashboardRoutes.ts`, `Studio/StudioShell.vue`, `Studio/StudioPlaceholder.vue`, `tailwind.semantic-plugin.js` (`--studio-accent` tokens), tests.
- Depends on: S0.1.
- Risks: [AUTH] new routes must use the same guard as the create route (test: unauthenticated -> sign-in); regression to the existing Image tab/`/create/:feature?` (explicit test); header overflow at 768-1024 px.
- Verify: Component: dropdown open/keys/Esc focus return/Tab close/hover does not open; `tabFromRouteName` returns Audio for every `/audio/*` and Tools for `/tools/*`; image tab behaviour unchanged. Unit: `isAppShellRoute` includes all new names. Mocked e2e: click through each menu item to its route; keyboard-only run through Audio menu; 390 px viewport accordion with items >= 44 px.

### S0.7 Player store, mini-player, shared audio player [R-INF-11, R-INF-12]

- Goal: one audio element for the whole app; a track keeps playing across route changes.
- Spec: R-INF-11, R-INF-12, R-QOL-3.
- Files: `stores/player.ts`, `components/Audio/{MiniPlayer,AudioPlayer,TrackCard,PlayButton,TimeCode}.vue`, `App.vue` (mount), Media Session wiring in the store, canvas sparkline from precomputed peaks (no wavesurfer), tests.
- Depends on: S0.6 (route shell for e2e).
- Risks: autoplay policy (Safari/iOS); `HTMLMediaElement.play()` rejection handling; memory/event-listener leaks on repeated track changes; layout stacking with the sticky action bar (CSS var).
- Verify: Unit (store with a fake element): play, pause, switch track pauses the first, `NotAllowedError` -> `status:'blocked'` not an error toast, close resets, Media Session handlers set. Component: MiniPlayer keyboard (Space, arrows, Esc) and `aria` labels; reduced-motion disables slide. Mocked e2e: start `sample.mp3` from a card, navigate to another route, player persists and keeps position; second track pauses first.

### S0.8 History and gallery for media, `useMediaJob`, shared states [R-INF-14]

- Goal: media outputs appear in History with players, filter chips, download and delete; every studio has one job state machine and shared view states to build on.
- Spec: R-INF-14 (web half), R-QOL-1, R-QOL-4, R-INF-8 (web half), R-INF-5 (unsaved notice).
- Files: `stores/history.ts`, `components/History/{History,FeatureIcon,Filter,ImageActionButtons}.vue`, `components/Audio/TrackCard.vue`, `components/Studio/{JobProgress,ResultCard,StudioEmptyState,StudioErrorState,StudioActionBar}.vue`, `composables/useMediaJob.ts`, `composables/useMediaCost.ts`, `utils/generationCredits.ts`, LowCreditsDialog wiring for 402, `UnsavedResultNotice` reuse, tests.
- Depends on: S0.3, S0.4, S0.7.
- Risks: [MONEY] web mapping of 402 vs generic failure (must open `LowCreditsDialog`, never a toast); History regression for images (existing History tests must stay green); mixed list sorting/grouping; N+1 players (only the active card mounts an audio UI).
- Verify: Unit: store merge/sort/group; filter; `useMediaJob` state machine incl. duplicate click disabled, 402 -> insufficient, failure -> noCharge copy, retry uses a new jobId and preserved inputs. Component: History renders audio card with player, video card with poster, delete confirms, `NoResults`. Mocked e2e (the P0 gate flow): seed an asset via the stubbed generate call -> appears in History -> plays in the mini-player across navigation.

### S0.9 Shortcuts and drafts [R-INF-13, R-INF-15]

- Goal: the shortcut list and the per-surface draft model exist once and are reused.
- Spec: R-INF-13, R-INF-15.
- Files: `composables/useGlobalShortcuts.ts`, `packages/shared/src/models/media-shortcuts.ts`, `components/Studio/ShortcutsPopover.vue`, header icon button, `composables/useMediaDraft.ts`, tests.
- Depends on: S0.7, S0.1.
- Risks: collisions with existing shortcuts (uniqueness test); single-key handlers firing while typing in TipTap/`contenteditable` (explicit test with `.ProseMirror`); Safari/Windows Mod key mapping; `?` on non-US layouts.
- Verify: Unit: keys unique vs existing; typing context suppression for input/textarea/contenteditable/open `AppModal`; `Mod+Enter` still fires inside an editor; `mapDraftToModel` keeps, marks unused, flags over-limit and never truncates. Component: popover renders from the constant and opens with `?`. Mocked e2e: Space toggles the active player, Esc closes popover.

### S0.10 Docs, pricing, FAQ and P0 gate [MONEY]

- Goal: docs and public pricing reflect media; phase P0 acceptance run.
- Spec: R-INF-18 (docs and `check:model-docs` rules), R-INF-19.
- Files: `docs/MODEL_ONBOARDING.md` (media kinds: `media.inputs`, `pricing`, `media-input.ts`, `check:model-docs` rules), `scripts/check-model-docs.mjs` (the `check:model-docs` script; extend rules for kind), `components/Pricing/PricingModelCosts.vue`, `utils/constants.ts` (`GENERAL_FAQS`/`PRICING_FAQS`), tests.
- Depends on: S0.1-S0.9.
- Risks: pricing page showing a stale number (it must read `getMediaCreditCost`, never typed).
- Verify: Unit: pricing list equals `getMediaCreditCost` output for every model; `bun run check:model-docs` green. Gate (P0 done): `bun run check`, `bun run test`, mocked e2e "fake audio asset appears in History and plays in the mini-player across routes", guard self-test.

## Phase P1: Song studio and waveform editor

### S1.1 Song page core: genre, mood, model, generate [MONEY]

- Goal: user picks genre/mood/style, types lyrics (plain textarea for now, replaced in S1.2), picks Music 2.6 or 1.5 and generates a song; result lands in History and the mini-player with cost shown before Generate.
- Spec: R-SONG-1, R-SONG-2, R-SONG-5, R-SONG-8, R-SONG-7 (empty lyrics on 1.5, moderation, wait >6 min messaging), R-INF-4 (song endpoint), R-INF-7/R-INF-8 (wired in UI), R-QOL-1/2.
- Files: `pages/SongStudio.vue`, `components/Song/{GenrePicker,SongSummary,SongModelPicker}.vue`, `packages/shared/src/models/media-prompts.ts` (`SONG_GENRES` 24, `SONG_MOODS` 16, `SONG_KEYS`, `compileSongPrompt`), schemas `SongRequestSchema`, `routes/media.ts` + `media-service.ts` (`processSong`), `media-input.ts` (song mapping), router (replace placeholder), `utils/dashboardRoutes.ts` (no change expected), tests, example-idea fixtures.
- Depends on: S0.3, S0.4, S0.8, S0.9.
- Risks: [MONEY] model-specific validation (1.5 requires prompt >= 10 and lyrics >= 10; 2.6 instrumental/autoLyrics mutual exclusion; autoLyrics requires empty lyrics + prompt); prompt compile overflow (flag with live counter, never cut); never sending the deprecated `audio_format`.
- UI bar: section 1.12 Song; empty state with 3 examples and one sample loop; disabled Generate always shows the reason line.
- Verify: Unit: `compileSongPrompt` (genres+moods+notes+"<Key>, <BPM> BPM", 300/2000 caps, overflow flag); song payload builders per model; cost 30 vs 6 credits; schema refinements. Component: picker limit dimming + tooltip, step collapse/summary, disabled-reason matrix. Mocked e2e: genre -> lyrics -> generate -> result in History -> balance dropped by the shown cost; failure variant shows "No credits were used."; 402 variant opens `LowCreditsDialog`.

### S1.2 Lyrics generation and structured lyrics editor [MONEY][AUTH]

- Goal: AI lyrics via the existing DeepSeek model with structured JSON; sections editable as cards with budget meter per model; model switch flags over-limit and unsupported section tags; condense with AI.
- Spec: R-SONG-3, R-SONG-4, R-SONG-7 (over limit on switch, LLM timeout, retry), R-SONG-5 (1.5 flagged sections), R-QOL-4.
- Files: `apps/api/src/lib/lyrics-generator.ts` (`generateText` from `ai` + `@ai-sdk/deepseek`, model `env.ENHANCE_MODEL`, Zod-validated JSON, one retry, `LYRICS_TIMEOUT_MS = 20000`, trailing-section trim), `routes/prompt.ts` (`POST /prompt/lyrics`), `middlewares/rate-limit.ts` (`lyricsRateLimiter`, `LYRICS_DAILY_LIMIT = 30`, UTC-day window, pattern `sttRateLimiter`), `lyrics` schema, `components/Song/{LyricsEditor,LyricsSectionCard,LyricsBudgetMeter}.vue`, `media-prompts.ts` (`LYRICS_SECTION_TAGS` per model: 15 for 2.6 incl. `[Drop]`, 5 lowercase for 1.5; `serializeLyrics`), tests.
- Depends on: S1.1.
- Risks: LLM malformed output (parse + retry + 502 copy); prompt injection via `idea` (moderated by `checkPromptSafety` and structurally validated: only known section tags accepted, lines are plain strings); rate limit correctness across UTC midnight; cost 0 so never touches credits (test asserts no deduction); lyrics counted incl. tags and newlines.
- UI bar: section 1.12 Song lyrics bullets; cards keyboard-reorderable; flagged section shows "Not supported by Music 1.5" + "Change to Verse/Chorus/Bridge"; Generate disabled with reason while any flag remains.
- Verify: Unit: JSON parse/retry/502; trim to fit 600 and flag `trimmed`; section tags restricted per model; serialization `[Section]\nline\n\n` exact; rate limit 30 then 429 with exact copy; fake lyrics for e2e user and no DeepSeek call (client mocked, assert not called); moderation rejection -> 422 no LLM spend. Component: editor add/remove/reorder/duplicate/regenerate section; budget meter error state; 2.6 -> 1.5 switch flagging. Mocked e2e: generate lyrics (stubbed fake lyrics), edit a section, switch model and see flags, generate song.

### S1.3 Waveform editor core on the result card [R-EDIT-1, 4, 5, 7]

- Goal: the Song result card hosts the editor with loop, trim, fades, volume, speed, undo/redo, accessible and fast on a 6-min track.
- Spec: R-EDIT-1 (all but export), R-EDIT-4, R-EDIT-5, R-EDIT-7, R-SONG-6 (waveform on result, Regenerate with cost on the button, Edit lyrics and retry, Download original), R-INF-15 (editor shortcuts wired), R-QOL-2 (bottom sheet).
- Files: `components/Audio/{WaveformEditor,EditorToolbar,FadeHandles,TimeCode}.vue`, `composables/useAudioEditor.ts`, `utils/audioEditMath.ts`, `components/Studio/ResultCard.vue` (editor slot), `pages/SongStudio.vue` (result card), `package.json` (`wavesurfer.js`; approved 2026-11-16), tests.
- Depends on: S0.7, S0.9, S1.1; wavesurfer.js approved 2026-11-16.
- Risks: wavesurfer + shared `HTMLAudioElement` ownership (resolved by `media` option, prove with a spike test first); Safari AudioContext gesture; peaks memory on 6-min tracks; keyboard focus traps; undo coalescing bugs.
- UI bar: section 1.12 Waveform editor.
- Verify: Unit: `audioEditMath` fade curve, clamp, trim/rate duration, `estimatePcmBytes`; editor state reducer incl. undo/redo and drag coalescing; loop region logic (`[`/`]`/`L`). Component (wavesurfer mocked): all controls operable by keyboard, handles `role="slider"` arrow steps, `aria-live` throttle, skeleton while decoding, over-100 % gain warning. Mocked e2e: generate (fake), open editor, set region, loop, change speed, play via `Space`.

### S1.4 Export (MP3/WAV) and "Save as new version" [R-EDIT-2, 3, 6]

- Goal: client-side export with progress/cancel, memory cap, WAV fallback; the exported file is stored as a child asset.
- Spec: R-EDIT-2, R-EDIT-3, R-EDIT-6, R-QOL-4.
- Files: `composables/useAudioExport.ts`, `workers/mp3-encoder.worker.ts`, `utils/wavEncoder.ts`, `components/Audio/ExportPanel.vue`, `routes/media.ts` versions route wiring (built in S0.4), `package.json` (`@breezystack/lamejs`; approved 2026-11-16), tests.
- Depends on: S1.3, S0.4; lamejs approved 2026-11-16.
- Risks: main-thread jank (encode in worker only); OOM at 6 min stereo (cap + buffer release + test at that size); MP3 encoder worker bundling under the Vite config (`apps/web/vite.config.mts`); sample-rate mismatches on Safari; export result trust: server treats the version as an upload (sniff, size cap, 0 credits).
- Verify: Unit: WAV header/PCM byte-exactness against a known buffer; export cap blocks at `EXPORT_PCM_CAP_BYTES` with the exact copy; cancel terminates worker and releases buffers; fade/trim/rate applied to rendered samples; encode failure -> WAV fallback + structured log. Component: ExportPanel progress/cancel/retry. Mocked e2e: export WAV from the fake track, "Save as new version" creates a child in History, original untouched. Perf spot check: no long task > 50 ms in the main thread during MP3 export (Lighthouse/trace via agent-browser).
- Phase gate P1: user path genre -> lyrics -> edit -> generate (mock) -> edit waveform -> export MP3/WAV; cost visible; switch flags lyrics over limit. `bun run check`, `bun run test`, mocked e2e Song scenario green.

## Phase P2: Music

### S2.1 Music page with Stable Audio 2.5 and Lyria 2 [MONEY]

- Goal: prompt-driven music/SFX from the two non-vocal models with correct per-model controls and the shared editor.
- Spec: R-MUS-1 (Stable Audio, Lyria), R-MUS-2, R-MUS-3, R-MUS-4, R-MUS-5 (Lyria English hint, "Longer is the same price"), R-INF-4 (music endpoint complete), R-INF-13 (draft carry-over between models).
- Files: `pages/Music.vue`, `components/Music/{MusicModelPicker,MusicControls,ModelGuidance}.vue`, `media-input.ts` (Lyria + Stable Audio mapping; generalise S0.3's Lyria-only), schemas, `media-service.ts` (`processMusic` full), router, tests.
- Depends on: S1.3, S0.9.
- Risks: [MONEY] Stable Audio flat price regardless of duration (cost does not scale; test); Lyria always 30 s (no duration control, never send duration); default duration 30 s in UI vs schema default 190 (send explicit); steps 4-8, cfg 1-25 integer/float bounds.
- UI bar: section 1.12 Music.
- Verify: Unit: payloads (Lyria: `prompt`, `negative_prompt`, `seed` only; Stable: `duration`, `steps`, `cfg_scale`, `seed`), costs 12 and 40 at any duration, schema bounds. Component: model switch carries prompt, marks unused, guidance strip content, Advanced disclosure. Mocked e2e: generate with each model, editor reused, History type "Music".

### S2.2 Minimax Music 2.6 instrumental mode [MONEY]

- Goal: third Music model, instrumental tracks up to 6 min, via the same API with `is_instrumental=true`.
- Spec: R-MUS-1 (Minimax 2.6 instrumental), R-MUS-2 (guidance), R-MUS-5 (empty prompt blocked), R-SONG-5 ("No vocals" routing to same API).
- Files: `components/Music/MusicControls.vue`, `media-input.ts` (instrumental: prompt required, lyrics never sent, `lyrics_optimizer` not sent), `SongStudio` "No vocals" toggle wiring, schema refinement, tests.
- Depends on: S2.1, S1.1.
- Risks: sending lyrics with instrumental (400 test); BPM/key prompt compile reused from S1.1.
- Verify: Unit: instrumental payload; empty prompt 400; cost 30. Component: prompt required message. Mocked e2e: instrumental generate from Music and from Song "No vocals".
- Phase gate P2: three models generate (mock), mapping per 5.1, editor reused, `bun run check` + `test` + e2e.

## Phase P3: Speech (TTS)

### S3.1 Speech page core: model list, plain TipTap editor, voices, controls, generate [MONEY]

- Goal: choose one of 5 models, write text in a TipTap writing surface (no chips yet), pick a voice, tune model-specific controls, see exact credit cost, generate speech, play/edit and hand off to Video.
- Spec: R-TTS-1, R-TTS-7, R-TTS-8, R-TTS-13, R-TTS-14 (over limit, empty text, "Estimated" cost for Minimax), R-INF-4 (speech endpoint; server serialization with an empty-chip doc), R-INF-13, R-INF-16.
- Files: `pages/Speech.vue`, `components/Speech/{TtsEditor,ModelRow,VoicePicker,SpeechControls}.vue`, `packages/shared/src/models/tts-tags.ts` (this slice adds `TTS_VOICES`, `TtsDocJson` types and a text-only `serializeTts`; tag tables arrive in S3.2), schemas `SpeechRequestSchema`, `media-input.ts` (4 TTS mappings), `processSpeech`, router, `package.json` (TipTap packages; approved), tests. `Use as audio` button deep links to `/video?audioAsset=<id>` (consumed in S4.2).
- Depends on: S0.3, S0.8, S1.3.
- Risks: [MONEY] Minimax token vs char billing (A4: shown "Estimated", API bills on serialized chars; tested); text limits per model 2000/10000/500 incl. tags; voice enum validity per model (voice resets with toast); Inworld `language` input exists on 2.0 only (hidden on 1.5 Max); `voice_id` for Minimax can be system or cloned.
- UI bar: section 1.12 Speech (editor surface, model rows with strength/limit/credit price per 1K chars, advanced disclosure); voice rows description-only.
- Verify: Unit: voice catalogs per model valid against registry enum; payload mapping per model (never sends hidden controls); billedChars cost for each model at 500/1000/2000/10000 chars; schema bounds (speed 0.5-2, pitch -12..12, volume 0-10, temperature ranges). Component: editor counter/overflow highlight, Generate disabled with reason, voice reset toast, favourites (localStorage failure tolerated). Mocked e2e: type text, generate on two models, play, "Use as audio" link built.

### S3.2 Tag model, slash menu, chips and serializer [R-TTS-3, 4, 5]

- Goal: `/` menu per model, atomic chip nodes, exact per-model serialization, raw-syntax paste parsing.
- Spec: R-TTS-3, R-TTS-4, R-TTS-5, R-TTS-14 (only-tags text flagged), spec sections 6.1-6.4, 9 (FAQ 2).
- Files: `tts-tags.ts` (full `TTS_TAGS`, `serializeTts`, `parseTtsText`), `components/Speech/{TagMenu,TagChipView}.vue`, `TagChipNode.ts`, `TtsEditor.vue` (suggestion wiring), `tailwind` tokens for chip groups, API `SpeechRequestSchema` accepts chips and re-serializes, tests.
- Depends on: S3.1.
- Risks: listing an unconfirmed tag (`confirmedOn` test); serializer edge cases (pause first/last, adjacent chips, empty paragraphs, Inworld 2 "before the text it applies to", direction chip empty text); IME/composition with `/`; chip a11y; paste parsing false positives (only active model's syntax).
- UI bar: section 1.12 Speech chips and slash menu bullets (group tints AA in both themes, stripe warning, 8 rows max, hint footer).
- Verify: Unit: round trip per model (doc -> text -> parseTtsText -> doc) incl. every tag in each table, pause formatting (`<break time="500ms" />` vs `"1s"`, `<#0.50#>`), `omitted` list, NO_SPEAKABLE_TEXT, billedChars equals string length. Component: type `/` filters per model, empty row copy, Enter inserts, Backspace removes the atom, pause/direction inline edit, `aria-label`. Mocked e2e: insert tag, generate, assert request body `doc` has the chip and the stubbed server-side serialization is not needed client-side.

### S3.3 Model switch flagging, convert, remove, confirm [R-TTS-6]

- Goal: switching models never loses text; unsupported chips are flagged and handled.
- Spec: R-TTS-6, R-INF-13, spec 6.5, R-TTS-14 (over-limit after switch).
- Files: `components/Speech/ModelSwitchBanner.vue`, `tts-tags.ts` (`findUnsupportedTags`, `convertTtsTags`), `TtsEditor.vue` (decorations), Generate confirm dialog (`ConfirmChainActionDialog.vue` conventions), API `UNSUPPORTED_TAGS_NOT_CONFIRMED`, tests.
- Depends on: S3.2.
- Risks: mutating the document on switch (must not; flags are view-computed); undo of convert/remove as a single transaction; confirmation must name omitted tags; Minimax emotion suggestion path.
- Verify: Unit: semantic map conversion table (every row of 6.5, `null` rows never convert, no invented directions); omitted payload; API rejects unconfirmed omission. Component: banner counts, Review cycles, Convert/Remove undoable, text unchanged after A -> B -> A switch (doc deep-equal), Generate confirmation text. Mocked e2e: insert Inworld 2 direction, switch to Chatterbox, banner, convert, generate.

### S3.4 Model advisor and FAQ [R-TTS-2, R-TTS-9]

- Goal: help users choose a model and understand tags/limits/cloning.
- Spec: R-TTS-2, R-TTS-9, FAQ content in spec section 9.
- Files: `components/Speech/{ModelAdvisor,SpeechFaq}.vue`, `utils/ttsAdvisor.ts` (new, pure picker logic), `Accordion.vue`/`FAQ.vue` reuse, tests.
- Depends on: S3.1.
- Risks: advisor recommending a model without the capability the user chose (logic table from section 5.2: cloning -> Minimax; longest text -> Minimax; cheapest -> Chatterbox; expressive -> Inworld 2); legal copy item 10 is Q8 default text.
- Verify: Unit: advisor decision table for all 3-question combinations. Component: collapsible open by default for first-time users and remembered (localStorage try/catch), FAQ deep link opens the right item. Mocked e2e: answer 3 chips, recommendation highlights the model row.

### S3.5 Voice cloning with consent and audit [MONEY][CONSENT][AUTH][UPLOAD][MIGRATION]

- Goal: Minimax 2.8 users can clone a voice with explicit consent; an immutable audit row exists before any paid call; cloned voices usable on 2.8 only.
- Spec: R-TTS-10, R-TTS-11, R-TTS-12, R-INF-17, section 8 (600 credits), section 11 voice-clone row.
- Files: `apps/api/src/models/voice.ts`, `services/voice-service.ts`, `routes/media.ts` (`/generate/audio/voices`, `GET /voices`, `DELETE /voices/:id`), `media-service.ts` (`processVoiceClone`), `media-limits.ts` (`CLONE_TRAINING_MODEL`, `CLONE_ACCURACY`, `CURRENT_CONSENT_VERSION`, `CLONE_CONSENT_TEXT`, `MAX_VOICES_PER_USER`), `stores/voices.ts`, `components/Speech/{VoiceCloneDialog,VoicePicker}.vue`, tests. APPROVAL NEEDED: new collections.
- Depends on: S0.5, S3.1.
- Risks: [CONSENT] no paid call without a consent row (write-before-enqueue; test); consent text/version drift between web and API (single shared constant; API rejects stale version); consent default unchecked and never restored from drafts; audit row survives voice deletion; [MONEY] 600 credits charged once on success only, not on failure, not refunded on delete (copy says so); [UPLOAD] sample validation server-side (MIME, 20 MB, 10 s-5 min), sample deletion after training unless kept; duplicate hash handling; `voice_id` expiry unknown (Q5: unavailable state); Chatterbox `reference_audio` intentionally not built (Q7).
- UI bar: section 1.12 Speech clone dialog bullets.
- Verify: Unit: API rejects without `consent:true`, wrong `consentVersion`, short/long/oversize/spoofed files (400s); consent row written with exact text and `sourceFileHash` before enqueue (assert order by mock call sequence); 402 at < 600; replicate called with `model: 'speech-02-hd'`, `accuracy: 0.7`, noise/volume flags; success deducts 600 once and stores `voiceId`; failure charges 0; vendor voice error -> `unavailable` + no charge; delete removes Voice+sample but keeps consent; per-user cap and unique name; ownership checks. Component: dialog step list, validation copy per error, Clone disabled until consent ticked, button shows "Clone voice · 600 credits", duplicate-hash prompt. Mocked e2e: clone with consent (fake voice id), voice appears and works on 2.8, not offered on Chatterbox (switch prompt), unavailable-voice state via stub, balance drops by 600 only on success.
- Phase gate P3: `/` menu per model, serialization exact, switch flags, clone with consent logged, FAQ/advisor live. `bun run check`, `bun run test`, mocked e2e Speech scenarios green.

## Phase P4: Video (built from scratch, D1)

### S4.1 Video page core: text-to-video, both models, live cost, expensive confirmation [MONEY]

- Goal: `/video` generates text-to-video on P-Video and Wan 3 with live cost, expensive-job dialog, progress and a result card with native `<video>`.
- Spec: R-VID-1 (text mode, segmented models), R-VID-4, R-VID-5 (player, download, poster, long-job messaging), R-VID-6 (duration beyond model max flagged, moderation, content-safety refusal state, no charge), R-INF-4 (video endpoint), R-INF-13, R-INF-16, R-QOL-1/2.
- Files: `pages/Video.vue`, `components/Video/{VideoControls,VideoResult}.vue`, schemas `VideoRequestSchema`, `media-input.ts` (video mapping; `disable_safety_filter:false` fixed for P-Video; `no_op` never; Wan `enable_prompt_expansion`), `processVideo`, `StudioActionBar` expensive dialog (`EXPENSIVE_JOB_CREDITS`), router, `FEATURES`, tests.
- Depends on: S0.3, S0.4, S0.8, S0.9.
- Risks: [MONEY] largest per-job costs (Wan 1080p 30 s = 840 credits): confirm dialog default focus Cancel, server recompute, 402 first; `isContentSafetyError` mapping to `CONTENT_SAFETY` no-charge state; P-Video free-launch price may end (config only); defaults: Wan resolution 720p (not schema default 1080p).
- UI bar: section 1.12 Video.
- Verify: Unit: cost matrix (P-Video 720/1080 x 5/20 s, Wan 480/720/1080 x 5/30 s, draft is S4.3), fixed inputs always present, duration bounds 1-20 / 2-30, payload mapping. Component: live cost updates with sliders, dialog appears at >= 150 credits and not below, default focus Cancel. Mocked e2e: generate P-Video and Wan (fake mp4) -> History + player; safety refusal stub -> no-charge state; 402 stub -> dialog.

### S4.2 Image-to-video and audio-to-video inputs, ignored-control rules [UPLOAD][MONEY]

- Goal: first/last frame image and P-Video audio inputs with previews; controls the model ignores are disabled with an explanation; "Use as audio" from Speech lands here.
- Spec: R-VID-1 (Image/Audio modes, ignored controls), R-VID-3, R-VID-6 (unsupported aspect on model switch), R-INF-17, R-TTS-13 (consumer side).
- Files: `components/Video/{VideoModeTabs,FrameUpload,AudioUpload}.vue`, `composables/useImageDrop.ts` (reuse; limits param from `media-limits.ts`) and `ImageUpload.vue` patterns, upload client for `/media/uploads`, `Video.vue` deep-link handler for `?audioAsset=`, schema refinements (aspect ignored with image, duration ignored with audio), tests.
- Depends on: S4.1, S0.5, S3.1 (deep link source).
- Risks: [UPLOAD] Wan frame <= 10 MB, formats per model; `MAX_VIDEO_AUDIO_BYTES = 20 MB`; [MONEY] P-Video cost when audio given is not defined by the spec (gap G1; default in this plan: bill on the audio's server-stored duration clamped to 20 s, label "Estimated"); stale previews (object URL revocation).
- Verify: Unit: ignored-input rules in schema and payload; audio cost from upload duration; deep-link resolves an owned speech asset only (ownership). Component: disabled controls + tooltip; oversize/format error copy "Audio must be under 20 MB"; aspect nearest-mapping flag on model switch. Mocked e2e: image-to-video, audio-to-video with `sample.mp3`, deep link from Speech result.

### S4.3 P-Video draft first [MONEY]

- Goal: "Preview in draft" toggle and one-click "Render final with same settings".
- Spec: R-VID-2.
- Files: `components/Video/DraftCallout.vue`, `VideoResult.vue` (Render final action), `getMediaCreditCost` draft rows (already in S0.1), schema `draft`, `prompt_upsampling` toggle ("Improve my prompt"), tests.
- Depends on: S4.1.
- Risks: [MONEY] final render must reuse seed and prompt and recompute cost; draft+final double charge is intended and shown ("Saved X credits" is computed, not typed); safety filter fixed false.
- Verify: Unit: draft cost 5/10 per 5 s; final reuses `seed`/`prompt`/params; saved-credits number = final - draft. Component: callout copy, Render final enabled only on a draft result. Mocked e2e: draft -> final, two charges in order, balance math.
- Phase gate P4: both models mock-generate, live cost, draft-first, ignored controls disabled. `bun run check`, `bun run test`, mocked e2e Video scenarios green.

## Phase P5: Tools

### S5.1 Image watermark [UPLOAD]

- Goal: client-side placement preview with drag and snapping; server output is authoritative; before/after result.
- Spec: R-TOOL-IW-1, R-TOOL-IW-2, R-INF-4 (image-watermark endpoint).
- Files: `pages/ToolImageWatermark.vue`, `components/Tools/{WatermarkStage,PlacementHandle,ToolInspector}.vue`, `utils/watermarkGeometry.ts` (new pure: 9 anchors, margin, scale, rotation, tiled grid), schemas, `media-input.ts` (field map incl. `position: custom` + `position_x/y`), `processImageWatermark`, `ComparisonCard.vue`/`SideBySide.vue` reuse, router, tests.
- Depends on: S0.5, S0.8.
- Risks: preview/model mismatch (label approximate); text <= 500 or logo exclusive; logo upload rules = image rules; cost 1 credit (min).
- Verify: Unit: geometry snapping/readout, custom position clamping 0-1, tiled spacing; payload mapping; exactly one of text/logo. Component: drag snaps and shows readout, tiled preview. Mocked e2e: upload, place, generate, before/after, History.

### S5.2 Video watermark and the shared tool video uploader [UPLOAD]

- Goal: honest fixed-placement text watermark tool plus the video-upload composable shared by S5.3.
- Spec: R-TOOL-VW-1, R-TOOL-VW-2, R-INF-17 (tool video).
- Files: `pages/ToolVideoWatermark.vue`, `components/Tools/ToolVideoUpload.vue`, `composables/useToolVideoUpload.ts` (client duration read, caps `MAX_TOOL_VIDEO_SECONDS = 120`, `MAX_TOOL_VIDEO_BYTES = 100 MB`, copy "Videos up to 2 minutes and 100 MB"), `media-limits.ts` (`VIDEO_WATERMARK_PLACEMENT`, recorded from the model's public example outputs or published source, NEVER from a paid run), schemas, `processVideoWatermark`, "Send to Watermark" action on Video result card (R-VID-5), router, tests.
- Depends on: S0.5, S4.1 (result card action).
- Risks: [UPLOAD] 100 MB path (S0.5 decision); default text "FULLJOURNEY.AI" must never reach Replicate (payload test); preview must not show controls the model lacks (no drag/opacity/colour/logo); `VIDEO_WATERMARK_PLACEMENT` sourcing may be impossible without a run: if no public example or source exists, the constant is `null`, the preview draws the text with no position claim and shows the caption only (G10); the only paid run allowed is the single owner-approved one described in G10 (never from tests).
- Verify: Unit: payload always includes explicit text and `size`; empty text blocked; size 1-500; client duration gate. Component: caption "Position is fixed by this tool; you can change the text and size.", scrubber. Mocked e2e: upload `.mp4` fixture, set text, generate, result in History; Video page "Send to Watermark" deep link.

### S5.3 Autocaption [MONEY][UPLOAD]

- Goal: styled auto-captions with live approximate preview, transcript JSON, fix-a-word re-run.
- Spec: R-TOOL-AC-1, R-TOOL-AC-2, R-TOOL-AC-3, R-VID-5 ("Send to Autocaption").
- Files: `pages/ToolAutocaption.vue`, `components/Tools/{CaptionStyleInspector,CaptionPreview}.vue`, `utils/captionPresets.ts` (new: Classic, Reels bold, Minimal, Karaoke pop; landscape 7/20 vs reels 4/10), font loader (lazy), schemas (font enum of 14, RTL only with Arial fonts), `media-input.ts` (`video_file_input`, `transcript_file_input`), `processAutocaption` (video + `transcriptUrl` from the transcript output; partial output counts as success), transcript editing UI "Fix a word and re-run" (re-run billed again, stated above the button), router, tests.
- Depends on: S5.2.
- Risks: [MONEY] cost uses server-stored duration (`0.055 x ceil(s/30)`, 11/22/44 credits); re-run billing disclosure; compute-time pricing is an estimate ("Estimated"); preview fidelity labelled approximate; RTL gating; transcript JSON schema validated before re-run.
- Verify: Unit: cost blocks 30/60/120 s, presets output, RTL gating, transcript validation. Component: preview reflects style controls, Fix a word flow, cost disclosure text. Mocked e2e: upload, pick preset, generate (fake video + fake transcript), edit a word, re-run charges again.

### S5.4 Sketch-to-image

- Goal: draw or upload a sketch and generate an image with an existing image model via the existing flow.
- Spec: R-TOOL-SK-1, R-TOOL-SK-2, R-TOOL-SK-3, R-INF-3 (SKETCH).
- Files: `pages/ToolSketchToImage.vue`, `components/Tools/{SketchCanvas,SketchToolbar}.vue`, `utils/sketchHistory.ts` (stroke undo/redo), autosave via `useLocal` or IndexedDB (try/catch), model choice limited to `NANO_BANANA_2`, `SEEDREAM_4`, `FLUX_KONTEXT_MAX` using existing tiers/`PremiumLockBadge.vue`, reuse `StylePicker.vue`/`STYLE_PRESETS`, existing `POST /generate/reference-images` + `POST /generate/image` (no new API), `ResultCanvas.vue`, router, tests.
- Depends on: existing image flow only (and S0.6 route).
- Risks: touch/pointer behaviour (palm rejection, two-finger pan-zoom, pressure); downscale before upload; reuse of existing image credit path means no new money logic (test that cost equals `getCreditCost`); `FeatureType.SKETCH` semantics (G11); do not alter `buildModelInput`.
- Verify: Unit: stroke history undo/redo, flatten-to-PNG with white background option, downscale limit, blank-canvas detection. Component: toolbar, "Draw something first", autosave restore (storage failure tolerated). Mocked e2e (existing `GenerationStub` for the image route): draw, generate, result in image history; Pro-locked model behaviour for a free user.

### S5.5 Cross-tool handoffs, accessibility sweep and final gate

- Goal: result cards link into the tools; whole-product pass.
- Spec: R-VID-5 (send actions), R-QOL-1..4 (verification sweep), R-INF-19 (final check).
- Files: `components/Video/VideoResult.vue` (both send actions confirmed working), tool pages accept `?asset=` deep links (ownership), a11y fixes, copy review, end-to-end walkthrough doc updates in existing docs only.
- Depends on: S4.1, S5.2, S5.3.
- Risks: deep-link asset ownership (IDOR); regressions across surfaces.
- Verify: Mocked e2e: full-product walkthrough (one scenario per feature + mini-player persistence + balance deltas + 402 + failure), `bun run check`, `bun run test`, `bun run check:model-docs`, axe/a11y checks on all new pages, Lighthouse spot check of editor and tool pages, `agent-browser` manual pass at 360/768/1280 px in both themes. Guard run proves zero un-intercepted paid calls.

---

# 4. SPEC COVERAGE TABLE

| Spec id     | Slice(s)                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| R-INF-1     | S0.1                                                                                                                                   |
| R-INF-2     | S0.1, S0.5                                                                                                                             |
| R-INF-3     | S0.1, S5.4                                                                                                                             |
| R-INF-4     | S0.3 (core + music reference), S1.1 (song), S2.1 (music), S3.1 (speech), S3.5 (voices), S4.1 (video), S5.1-S5.3 (tools), S1.2 (lyrics) |
| R-INF-5     | S0.4, S0.8 (unsaved notice)                                                                                                            |
| R-INF-6     | S0.3                                                                                                                                   |
| R-INF-6a    | S0.3, S0.8 (402 mapping)                                                                                                               |
| R-INF-7     | S0.1, S0.3, S0.8                                                                                                                       |
| R-INF-8     | S0.3, S0.8                                                                                                                             |
| R-INF-9     | S0.2 (+ mock half of every slice e2e)                                                                                                  |
| R-INF-10    | S0.6                                                                                                                                   |
| R-INF-11    | S0.7                                                                                                                                   |
| R-INF-12    | S0.7                                                                                                                                   |
| R-INF-13    | S0.9 (+ S2.1, S3.1, S3.3, S4.1 consumers)                                                                                              |
| R-INF-14    | S0.4, S0.8                                                                                                                             |
| R-INF-15    | S0.9, S1.3                                                                                                                             |
| R-INF-16    | S0.3, S1.2, S3.1, S4.1                                                                                                                 |
| R-INF-17    | S0.5, S3.5, S4.2, S5.2                                                                                                                 |
| R-INF-18    | S0.1, S0.10                                                                                                                            |
| R-INF-19    | S0.10, S5.5                                                                                                                            |
| R-SONG-1    | S1.1                                                                                                                                   |
| R-SONG-2    | S1.1                                                                                                                                   |
| R-SONG-3    | S1.2                                                                                                                                   |
| R-SONG-4    | S1.2                                                                                                                                   |
| R-SONG-5    | S1.1, S1.2, S2.2                                                                                                                       |
| R-SONG-6    | S1.3 (editor, regenerate, retry, download), S1.4 (versions)                                                                            |
| R-SONG-7    | S1.1, S1.2                                                                                                                             |
| R-SONG-8    | S1.1                                                                                                                                   |
| R-MUS-1     | S2.1, S2.2                                                                                                                             |
| R-MUS-2     | S2.1, S2.2                                                                                                                             |
| R-MUS-3     | S2.1                                                                                                                                   |
| R-MUS-4     | S2.1                                                                                                                                   |
| R-MUS-5     | S2.1, S2.2                                                                                                                             |
| R-TTS-1     | S3.1                                                                                                                                   |
| R-TTS-2     | S3.4                                                                                                                                   |
| R-TTS-3     | S3.1 (base editor), S3.2 (slash menu)                                                                                                  |
| R-TTS-4     | S3.2                                                                                                                                   |
| R-TTS-5     | S3.2                                                                                                                                   |
| R-TTS-6     | S3.3                                                                                                                                   |
| R-TTS-7     | S3.1                                                                                                                                   |
| R-TTS-8     | S3.1                                                                                                                                   |
| R-TTS-9     | S3.4                                                                                                                                   |
| R-TTS-10    | S3.5                                                                                                                                   |
| R-TTS-11    | S3.5                                                                                                                                   |
| R-TTS-12    | S3.5                                                                                                                                   |
| R-TTS-13    | S3.1 (output + link), S4.2 (consumer)                                                                                                  |
| R-TTS-14    | S3.1, S3.2                                                                                                                             |
| R-EDIT-1    | S1.3                                                                                                                                   |
| R-EDIT-2    | S1.4                                                                                                                                   |
| R-EDIT-3    | S0.4 (API), S1.4 (UI)                                                                                                                  |
| R-EDIT-4    | S1.3                                                                                                                                   |
| R-EDIT-5    | S1.3                                                                                                                                   |
| R-EDIT-6    | S1.4                                                                                                                                   |
| R-EDIT-7    | S1.3 (structural: single track, no layers; reviewer checks)                                                                            |
| R-VID-1     | S4.1, S4.2                                                                                                                             |
| R-VID-2     | S4.3                                                                                                                                   |
| R-VID-3     | S4.2                                                                                                                                   |
| R-VID-4     | S4.1                                                                                                                                   |
| R-VID-5     | S4.1 (player/download/long-job), S5.2 and S5.3 (send actions), S5.5                                                                    |
| R-VID-6     | S4.1, S4.2                                                                                                                             |
| R-TOOL-IW-1 | S5.1                                                                                                                                   |
| R-TOOL-IW-2 | S5.1                                                                                                                                   |
| R-TOOL-VW-1 | S5.2                                                                                                                                   |
| R-TOOL-VW-2 | S5.2                                                                                                                                   |
| R-TOOL-AC-1 | S5.3                                                                                                                                   |
| R-TOOL-AC-2 | S5.3                                                                                                                                   |
| R-TOOL-AC-3 | S5.3                                                                                                                                   |
| R-TOOL-SK-1 | S5.4                                                                                                                                   |
| R-TOOL-SK-2 | S5.4                                                                                                                                   |
| R-TOOL-SK-3 | S5.4                                                                                                                                   |
| R-QOL-1     | S0.8 (shared states), every UI slice, S5.5 sweep                                                                                       |
| R-QOL-2     | S0.6 (shell), every UI slice, S5.5 sweep                                                                                               |
| R-QOL-3     | S0.6, S0.7, S1.3, S5.5                                                                                                                 |
| R-QOL-4     | S0.8, S1.4, S1.2, S5.5                                                                                                                 |

Totals: 6 phases (P0..P5), 29 slices (P0: 10, P1: 4, P2: 2, P3: 5, P4: 3, P5: 5).

---

# 5. HIGH-RISK REGISTER

| Area                | Where                              | Controls (must appear as TASKS.md acceptance criteria)                                                                                                                                                                                                       |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Credits/money       | S0.1, S0.3, S3.5, S4.1, S4.3, S5.3 | single constant; server recompute; 402 pre-check; charge once on success; no charge on failure/moderation/timeout; shared extracted deduction; image tests unchanged; idempotent `jobId`; expensive-job dialog; "Estimated" labels for token/compute billing |
| Auth/ownership      | S0.3-S0.5, S3.5, S4.2, S5.5        | `requireAuth` everywhere; server-stamped `userId`; every asset/upload/voice lookup scoped by `userId`; deep-link asset ownership checks; IDOR tests                                                                                                          |
| Migrations          | S0.4, S0.5, S3.5                   | collections + indexes created via mongoose models; unique sparse `jobId`; TTL on `MediaUpload`; owner approved 2026-11-16; no change to existing collections                                                                                                 |
| Uploads             | S0.5, S3.5, S4.2, S5.\*            | server MIME sniff, per-purpose caps, server-read duration, TTL + cron + delete-on-consume, no client-trusted URLs (ids only)                                                                                                                                 |
| Voice-clone consent | S3.5                               | unchecked by default, exact shared consent string + version, audit row before enqueue, append-only audit kept after voice deletion, no IP, clone refused without consent                                                                                     |
| Paid-call safety    | S0.2 (all slices)                  | guard only broadened, fake client for e2e users, every generate and lyrics endpoint intercepted, guard unit tests per path                                                                                                                                   |
| Performance/memory  | S1.3, S1.4, S5.2                   | peaks not raw samples, worker encode, `EXPORT_PCM_CAP_BYTES`, release buffers, 6-min fixture test, 100 MB video upload path                                                                                                                                  |

---

# 6. SPEC GAPS AND DECISIONS TAKEN (defaults applied; none blocks the plan)

- G1: Spec section 8 has no cost rule for P-Video when `audio` is provided (duration is ignored by the model). Default: bill the stored audio duration clamped to `P_VIDEO_MAX_SEC = 20`, labelled "Estimated" (S4.2).
- G2: The spec names no endpoint shapes for listing/getting/deleting/versioning assets or for uploads. Plan defines `/media/uploads`, `/media/assets*`, request/response in 1.5.
- G3: "Respect `HISTORY_CAP`" does not say whether images and media share one cap. Default: one combined cap via `countUserHistory` (S0.4).
- G4: R-TTS-11 audit record vs "delete removes record". Default: separate append-only `VoiceConsent`, retained after voice deletion; Voice record removed.
- G5: No per-user voice cap in the spec. Default `MAX_VOICES_PER_USER = 10` (new constant) to bound $3 clones.
- G6: R-INF-1 pricing units omit Autocaption's 30 s block. Plan adds optional `blockSec`.
- G7: R-INF-11 says the store owns "an HTMLAudioElement/WaveSurfer instance"; plan resolves it as one HTMLAudioElement shared with wavesurfer via `media`.
- G8: Spec puts the full header nav in P0 but pages ship later. Plan uses honest `StudioPlaceholder.vue` per route until each page lands.
- G9 (RESOLVED, owner approved 2026-11-16): the new collections `MediaAsset`, `MediaUpload`, `Voice`, `VoiceConsent` are approved; the spec names `media-asset.ts` and `voice.ts` only, `MediaUpload` and `VoiceConsent` are plan additions.
- G10 (RESOLVED 2026-11-16): VIDEO_WATERMARK_PLACEMENT is sourced in two steps. Step 1 (free): read the model's published source and public example outputs. Step 2, only if step 1 does not determine the position: exactly ONE owner-approved real paid run of charlesmccarthy/addwatermark, maximum one call ever. Only the main orchestrator session may make it (never a test, an e2e run or an automated retry); immediately before making it the orchestrator tells the user the endpoint/model, the expected cost and that it is call 1 of 1; the observed position is then written into the constant and the result is recorded in the task. If step 1 answers it, no paid call is made. The mock-only rule stays intact for every test and e2e task. Fallback if neither step can run: caption-only honest preview.
- G11: `FeatureType.SKETCH` is required by R-INF-3 but sketch results use the existing image history; plan uses `SKETCH` for routing/nav/feature labels only and leaves stored image `type` as `IMAGE`.
- G12: `lyrics` modes `section` and `condense` ("Regenerate this section", "Condense with AI") have no endpoint in R-INF-4; plan multiplexes them on `POST /prompt/lyrics` via `mode`.
- G13: Resolved: the order is run on Replicate, persist the record, deduct once, copy to Cloudinary, complete. This is SPEC R-INF-6 and the existing `runGenerationJob` order; R-INF-5's copy step is that Cloudinary copy.
