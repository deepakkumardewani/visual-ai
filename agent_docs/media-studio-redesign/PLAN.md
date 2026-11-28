# Plan: Media Studio Redesign ("record collection, not a form")

Feature `media-studio-redesign`, branch base `feature/media-studio`. Source of truth: `SPEC.md` (R1-R98 plus R29a/b, R34a/b, success criteria 1-23), `REPO_MAP.md` (paths and symbols), the ten approved mockups in `design/*.html` with their `*.motion.md`, `design/REFS.md` and `design/DESIGN-REVIEW.md`.

This file holds architecture, dependencies and slices only. Tasks live in `TASKS.md`.

Conventions used below
- Paths are repo-relative. `web/` = `apps/web/src/`, `api/` = `apps/api/src/`, `shared/` = `packages/shared/src/`. Anything not in `REPO_MAP.md` is marked **(new)**.
- `design/X` = `agent_docs/media-studio-redesign/design/X`.
- Vue 3 `<script setup lang="ts">`, Pinia setup stores, Tailwind with the `tw-` prefix and `--tw-*` token classes only.
- Never start the dev server (always running at https://visual-ai.localhost). Every test and e2e run mocks Replicate, Dodo live and email; `apps/web/e2e/support/paidCallGuard.ts` must report zero un-intercepted paid calls. Library, art, waveform and voice-audition work make no paid calls.
- "Mobile" = below 1024 px (R3 cut-off). Every screen slice is checked at 1440 and 375, light and dark.
- Where a mockup conflicts with R84-R98, the requirement wins; the slice that applies each correction names it.

---

## 1. Architecture

### 1.1 Layers

```
tokens / motion helper / constants            style.scss, tailwind.semantic-plugin.js, composables/useDashboardMotion.ts (extended)
        |
  leaf primitives                              CoverArt, WaveformStrip, PillButton, PillPopover, BottomSheet (all new)
        |
  state                                        stores/player.ts (extended), stores/history.ts (extended), composables/useLibraryFilters.ts (new)
        |
  shared composites                            StudioFrame, MediaModelPicker, TrackRow, VisualGrid, LibraryView, TrackDetailPanel (new)
        |
  per-studio interiors (slot content)          Music / Song / Speech / Video / 4 tools
        |
  Library page                                 pages/Dashboard.vue renders LibraryView full-page
```

### 1.2 Key decisions

1. **One frame, two slots.** `components/Studio/StudioFrame.vue` **(new)** replaces `StudioShell.vue`. Named slots: `composer`, `stage` (the right pane), `hero` (content for the centered state), `mobile-bar` (sticky Generate bar content). The frame owns: column widths (single 520 px composer token, R92), the hero -> split state machine (`loading | hero | split`, R5-R8), the Create/Library switch at 375 (R3), the player-offset bottom padding (R16) and the error/generating host. Studios pass a `generationsCount` (per-studio, load-complete flag) and a `jobActive` flag; the frame never fetches.
2. **Library is the right pane.** `components/Library/LibraryView.vue` **(new)** takes `preset` (`all|image|video|music|song|speech` or a feature list), `compact`, `layout` and `hideTypeTabs`. Studios embed it compact; `Dashboard.vue` embeds it full-page. `History.vue` is refactored into it (existing History tests migrated with equal assertions). Media data keeps `stores/history.ts`; filter/sort/search/selection logic lives in `composables/useLibraryFilters.ts` **(new)** so it is unit-testable without the DOM.
3. **One audio element.** `stores/player.ts` keeps ownership of the single `<audio>`. It gains: a source `queue` (ordered ids from the list the track was started from, R13), `nowPlayingId` for row highlighting (R12/R84), `removeFromQueue`/`closeIfPlaying(id)` for deletes (R79), `updateTrackMeta` for rename (R80), and `artworkUrl` from `coverArt`. `MiniPlayer.vue` is upgraded in place (stays mounted once in `App.vue`, R10).
4. **One sleeve.** `utils/coverArt.ts` **(new)** `coverArtFor(seed, kind)` is the only source of cover art (R98). `CoverArt.vue` **(new)** renders it at three sizes; `artworkDataUrl(seed)` feeds `PlayerTrack.artworkUrl` and Media Session. Seed = asset id + prompt, never title (R80).
5. **Waveforms are client-only.** `utils/peaks.ts` **(new)** (decode, bucket, quantise, cache in memory + localStorage, 2-concurrent queue, IntersectionObserver gate) and `components/Audio/WaveformStrip.vue` **(new)** with a deterministic placeholder from the same seed. Reuses `EDITOR_PEAK_BUCKETS` bucket logic from `utils/audioEditMath.ts`.
6. **Pills and one model picker.** `components/Studio/PillButton.vue`, `PillPopover.vue` (built on `primitives/Popover.vue`), and a bottom-sheet primitive `components/Studio/BottomSheet.vue` (reusing the `Dashboard/MobileSettingsSheet.vue` pattern) **(all new)**. `components/Studio/MediaModelPicker.vue` **(new)** is a modal at desktop and a sheet on mobile, reading the same registry data as today (model list left, spec table plus that model's settings and live cost right, "Use model"). The image Create picker (`Dashboard/ModelPicker/*`) is untouched; only patterns are borrowed.
7. **API stays thin.** `favorite` on `MediaAsset`, list filters on `GET /media/assets`, `PATCH /media/assets/:id`, `POST /media/assets/delete`. Shared Zod schemas in `shared/schemas/media.ts`; `MEDIA_TITLE_MAX` shared constant. No generation endpoint, credit or model-registry change.
8. **Motion is one helper.** Easing, duration tokens and a `useMotion()` reduced-motion gate extend `composables/useDashboardMotion.ts`; components consume CSS tokens/utilities (opacity + transform only) and never check `prefers-reduced-motion` themselves (R63, R67).
9. **Tools share a stage scaffold.** `components/Tools/ToolStage.vue` **(new)** (drop stage, cross-fading state host, pill/inspector bar, `#settings-sheet` at 375) hosts each tool; each tool supplies its own interior, so the four tools do not look alike (R93, success 16).

### 1.3 Data flow

```
composer pills -> studio state -> generate (unchanged endpoints) -> useMediaJob -> JobProgress stage text
                                                        |                                |
                                          pending row in right pane <---------------------+
                                                        v
                                   history store (merge) -> LibraryView(compact, preset) -> TrackRow
TrackRow play -> player store (queue = visible list, nowPlayingId) -> MiniPlayer (cover, title, waveform)
TrackRow/Library favorite|rename|delete -> PATCH /media/assets/:id | POST /media/assets/delete | existing /image/* (optimistic + rollback + toast)
```

### 1.4 Files that will be deleted or reworked (R2)

- Delete: `components/Studio/StudioPlaceholder.vue` and its test. Delete or de-dash `StudioEmptyState.vue` once its last consumer (`Tools/ToolResultPanel.vue`) is migrated (S5.1-S5.4); final grep gate in S7.1.
- Replaced by pill/picker/frame: `StudioShell.vue` (kept until all nine screens migrate, then removed), `Music/MusicModelSelect.vue`, `Speech/SpeechModelSelect.vue`, `Speech/VoiceSelect.vue`, `Song/SongResult.vue`, `Video/VideoSettings.vue` (its controls become pill popovers), `Tools/WatermarkForm.vue`, `Tools/VideoWatermarkForm.vue`.

---

## 2. Dependency graph

```
S0.1 tokens+motion helper
  |-- S0.2 coverArt/CoverArt ----+-- S0.3 peaks/WaveformStrip --+
  |                              |                              |
  |                              +--------> S0.4 bottom player <+
  |-- S0.5 pills/popover/sheet --> S0.6 MediaModelPicker
  |                                        |
  +--------------------------------------> S0.7 StudioFrame (needs S0.4 offset var, S0.5 pills)
                                                 |
S1.1 shared schema + model --> S1.2 list filters --> S1.3 PATCH + bulk delete        (API; parallel with Phase 0 after S0.1 is not required)
                                                 |
S0.2,S0.3,S0.4,S1.2,S1.3 --> S2.1 library data layer --> S2.2 TrackRow/VisualGrid/LibraryView(compact)
                                                 |                 |
                                                 +--> S2.3 TrackDetailPanel + overflow + editor entry
                                      (S0.7 + S2.2 ==> frame gate G2: frame mockup states verifiable)
S0.5,S0.6,S0.7,S2.2,S2.3 --> S3.1 Music --> S3.2 Song --> S3.3 Speech
S3.1 pattern --> S4.1 Video (+ stage)
S0.7,S2.2 --> S5.1 ToolStage + Image watermark --> S5.2 Video watermark, S5.3 Autocaption, S5.4 Sketch
S2.1,S2.2,S2.3,S1.3 --> S6.1 Library page shell --> S6.2 search/sort/favorite/rename --> S6.3 bulk/overflow/pagination/a11y
all --> S7.1 regression --> S7.2 motion/a11y/responsive sweep --> S7.3 R84-R98 matrix + design-qa
```

Parallelism: Phase 1 (API) is independent of Phase 0 and may run alongside it. S3.x, S4.1 and S5.x are independent of each other once Phase 2 lands. S6 depends only on Phase 2 and S1.3, so it can start in parallel with Phases 3-5 but is ordered after them to match the delivery order.

Hard ordering notes
- The studios need the Library pane (R4), so the Library data layer and compact `LibraryView` land in Phase 2, before any studio. The Library page itself (tabs, route, bulk, deep links) is Phase 6.
- The frame slice (S0.7) is proven structurally by component tests; its mockup states (`design/studio-frame.html`) get a design-qa pass at gate G2 (end of Phase 2) once the pane exists.

---

## 3. Phases and slices

Each slice lists: delivers (requirement ids), risks, and what proves it done. Screen slices cite the mockup, motion spec, distinctive idea and the R84-R98 corrections applied. "Proof" always includes `bun run verify` and `bun run check` clean plus the named tests; screen slices add design-qa (MODE PHASE) PASS against the mockup at 1440 and 375, light and dark.

### Phase 0 - Shared foundations

#### S0.1 Tokens, easing, motion helper, layout constants
- **Delivers:** R63, R67, R68, R75; R16 (the single `--tw-player-offset` variable, defined here, driven by S0.4); R92 (single composer-width token, 520 px); the `ease-out-expo` utility and duration tokens (160/260/380 ms); cover-art hue tokens used by S0.2; `useMotion()` reduced-motion gate in `composables/useDashboardMotion.ts`.
- **Touches:** `web/style.scss` (path `apps/web/src/style.scss` per REPO_MAP "1 other: .scss"), `apps/web/tailwind.semantic-plugin.js`, `composables/useDashboardMotion.ts`, a constants module for durations.
- **Risks:** token sprawl; accidentally adding `transition-all`. Mitigate with a grep gate script added here and re-run in S7.2.
- **Proof:** unit test for the reduced-motion helper (transform/stagger removed, <= 150 ms opacity fallback); grep gate (no `transition-all`, no arbitrary hex/px in new files) passes; tokens render in light and dark.

#### S0.2 Procedural cover art
- **Delivers:** R58, R59, R98 (single source), R60 (artwork data URL half).
- **Touches (new):** `utils/coverArt.ts` (`coverArtFor(seed, kind)`, `artworkDataUrl`), `components/Audio/CoverArt.vue` (40 / 160 / 48 px), tests; fixtures module with the named tracks (Monsoon over Pune, Small Rooms ep. 14, ...) at fixed ids/prompts shared by all tests and screenshots.
- **Risks:** collisions among seeds; low contrast under the hover play button in either theme; hue offsets drifting from tokens.
- **Proof:** determinism and 50-distinct-seed no-collision unit test; contrast check of overlay play button in light/dark; request interception shows zero network calls; fixture module exists for later slices.

#### S0.3 Peaks and waveform strip
- **Delivers:** R61, R62.
- **Touches (new):** `utils/peaks.ts`, `components/Audio/WaveformStrip.vue`, `composables/usePeaks.ts`; reuses `EDITOR_PEAK_BUCKETS` from `utils/audioEditMath.ts`.
- **Risks:** CORS decode failures; localStorage quota; decode storms on long lists; jank at first paint. Handled by try/catch with oldest-first eviction, 2-concurrent queue, IntersectionObserver gate, placeholder fallback.
- **Proof:** unit tests for bucketing/quantising/cache eviction/placeholder determinism; component test of progress tint and seek only on the loaded track; fixture MP3 shows real peaks within 1 s of entering view (success 8); decode-failure shows placeholder.

#### S0.4 Bottom player
- **Delivers:** R10, R11, R12 (store side), R13, R14 (audio side), R15, R16 (wires the offset var), R17, R60, R71, R79 (store side: stop+close when the loaded track is removed; others drop from order), R80, R84 (player half: title equals the `aria-current` row title).
- **Touches:** `stores/player.ts` (`usePlayerStore`, `PlayerTrack`, `PlayerStatus`), `components/Audio/MiniPlayer.vue` (+ `TimeCode.vue`, `PlayButton.vue`), `App.vue`, `composables/useGlobalShortcuts.ts` (Space toggle with typing-context guard via `isTypingContext`), `shared/models/media-shortcuts.ts` unchanged list.
- **Risks:** audio element remount on route change; Space conflicts with inputs/modals; video-vs-audio pause coordination with `VideoResult.vue`; Media Session artwork on blocked autoplay; compact two-row layout at 375.
- **Proof:** store tests (queue order prev/next, close-on-delete, rename updates metadata); component test (labelled region, slider `aria-valuetext`, state-dependent play name, `aria-current`); route-change test shows one `<audio>` and unchanged `currentTime`; success 3 e2e assertion drafted against fixtures.

#### S0.5 Pills, popovers, bottom sheet
- **Delivers:** R18, R19, R20, R23, R69 (pill/popover ARIA: `aria-haspopup`, `aria-expanded`, `aria-controls`), R74 (popovers become sheets at touch widths), R64 (pill hover/press/open feedback), R85 groundwork (nowrap + min-width on pill and Generate).
- **Touches (new):** `components/Studio/PillButton.vue`, `PillPopover.vue`, `BottomSheet.vue`; builds on `primitives/Popover.vue`, `SegmentedControl.vue`, `Tooltip.vue`, `ChevronCaret.vue`; pattern from `Dashboard/MobileSettingsSheet.vue`.
- **Risks:** focus return and Esc/outside-click; non-modal behaviour vs sheet; "Auto <thing>" labelling consistency; disabled reasons (`songDisabledReason`).
- **Proof:** component tests for keyboard open/close, focus restore, ARIA, disabled-reason text, sheet at touch width; axe clean on a pill row.

#### S0.6 Media model picker (modal / sheet)
- **Delivers:** R21, R22, R86 (no dead region over 24 px, real `ProviderIcon.vue` marks, right pane = spec table + that model's settings with live cost, e.g. Stable Audio 2.5 Length: Auto, 0:30, 1:00, 2:00, 3:10), R69 (focus trap via `composables/useFocusTrap.ts`, Esc, restore), R91 (shared part: "Use model" single-line, nowrap, min-width; sized to content), R23 (cost updates in the same frame).
- **Touches (new):** `components/Studio/MediaModelPicker.vue`, `MediaModelDetails.vue`; reads registry via existing types (`types/model.ts`), `primitives/ProviderIcon.vue`, `CreditCostBadge.vue`, `utils/generationCredits.ts`.
- **Mockup reference:** the `#model-picker` states in `design/music-studio.html` and `design/speech-studio.html` (+ motion rows M16/M17 in `music-studio.motion.md`); borrowed idea (REFS music-studio #3): list left, details plus "Use model" right.
- **R84-R98 corrections applied:** R86, R91 (shared mechanics).
- **Risks:** per-studio settings content differs (speech shows voices, music shows length); draft carry-over rules ("not used by <model>", limits flagged not truncated).
- **Proof:** component tests (open, select, Use model, focus restore, disabled reason, over-limit flag); measured assertion: no empty band > 24 px in either pane at 1440; no letter monograms.

#### S0.7 Studio frame
- **Delivers:** R1, R2 (frame half), R3, R5, R6, R7, R8, R9, R16 (consumer), R85, R87, R88, R92, R64 (hero-to-split), R66 (cross-fade host), R74 (frame at 375 and 1440).
- **Touches (new):** `components/Studio/StudioFrame.vue`, `StudioHero.vue`, `MobileGenerateBar.vue`, `useStudioLayout.ts`; reworks `StudioShell.vue` (exports `StudioAccent`, `StudioShell`) into thin compat until all screens migrate; reuses `StudioErrorState.vue`, `JobProgress.vue`, `CreditCostBadge.vue`, `HandoffMenu.vue`, `ShortcutsPopover.vue`, `composables/useMediaJob.ts` (`NO_CHARGE_SENTENCE`).
- **Mockup / motion / idea:** `design/studio-frame.html`, `design/studio-frame.motion.md` (M18 hero dock to left column, M19 results pane, M20 quiet loading to hero/split, M24 Create/Library switch). Distinctive idea: a centered hero composer that docks into the left column the moment the first job starts, with pills living inside the composer's own footer (REFS studio-frame #2 and #3); calm progress as a filling row in the list (REFS #4).
- **R84-R98 corrections applied:** R85 (action row single line; Generate label identical idle vs generating; composer height and button geometry differ by 0 px), R87 (sticky mobile bar above the player via the offset var, Generate inside viewport at scroll 0 and end of long content), R88 (`#error` uses `StudioErrorState` and `NO_CHARGE_SENTENCE` = "No credits were used."; "No credits were charged." appears nowhere), R92 (520 px column), R84 (player equals now-playing row, verified at gate G2).
- **Risks:** hero never shows while loading (R8); hero returns only on later visit with zero generations (R6); revisits must not replay intro (R7); typed text preserved across settle; composer column fixed while result column scrolls independently; sticky bar vs iOS safe area.
- **Proof:** state-machine component tests (loading -> hero, loading -> split, first job starts -> split with text/model preserved, failed first job keeps split with Retry, revisit no motion); measured test for 0 px composer/button delta idle vs generating; reduced-motion test (cross-fade only); design-qa pass deferred to gate G2.

**Checkpoint P0:** all new primitives tested; player persists across a route change in a test harness; token and grep gates pass.

### Phase 1 - API additions (library management only)

#### S1.1 Shared schema, DTO and favorite field
- **Delivers:** R55 (field, DTO, shared type, `MEDIA_TITLE_MAX`), R57.
- **Touches:** `api/models/media-asset.ts` (`favorite: Boolean`, default false; index for the new sorts/filters), `shared/types/domain.ts` (`MediaAssetDto.favorite?`), `shared/schemas/media.ts` (patch + bulk delete schemas), `api/services/media-asset-service.ts` (`toMediaAssetDto`).
- **Risks:** index design must support all sort keys (favorites, title, longest) per user without a collection scan; existing documents read as false with no migration; Mongo schema change beyond `favorite` and its index is an ask-first item (stay inside it).
- **Proof:** schema unit tests (valid/invalid patch bodies, ids max 100); DTO maps `favorite` (absent -> false); model test shows index registered.

#### S1.2 List filters and cursor correctness
- **Delivers:** R54.
- **Touches:** `api/routes/media.ts` (`GET /media/assets` query parse, 400 on bad values like `parseListQuery`), `api/services/media-asset-service.ts` (`listMediaAssets`, `ListAssetsOptions`), `shared/schemas/media.ts`.
- **Risks:** compound cursor (sort key + `_id`) for `newest|oldest|title|longest|favorites`; ties must never skip or repeat; case-insensitive `q` over title/prompt/lyrics must be escaped (regex injection); `longest` with null `durationSec`.
- **Proof:** extended `routes/media.test.ts` and `services/media-asset-service.test.ts` with paging-across-ties tests per sort, ownership, bad param 400s, `q` escaping; success 6 query verified against test DB.

#### S1.3 Rename/favorite PATCH and bulk delete
- **Delivers:** R55 (endpoints), R56, R57, R79 (server half: per-id results).
- **Touches:** `api/routes/media.ts` (`PATCH /media/assets/:id`, `POST /media/assets/delete`, behind `requireAuth`), `api/services/media-asset-service.ts` (`deleteMediaAsset` reused, new update + bulk helpers), `services/cloudinary-service.ts` (`deleteMediaByPublicIds`).
- **Risks:** non-owner must be 404/403 per existing pattern; partial Cloudinary failure must still return per-id results; trimming/length validation matches the client; rename must never touch `prompt`, `lyrics`, `params`.
- **Proof:** route and service tests: ownership, validation (400), not found, 100-id cap, per-id results, no credit charge and no Replicate call (R56); `bun --cwd apps/api run test` green.

**Checkpoint P1:** API tests and `bun run check` green; success 6 passes in tests.

### Phase 2 - Library engine and shared rows (powers every right pane)

#### S2.1 Library data layer
- **Delivers:** R42 (logic: tab set, counts), R43 (debounced search logic), R44 (sort comparator, per-session memory with try/catch), R45 (optimistic favorite with rollback), R46 (rename logic, image rename absent), R51 (cursor paging bookkeeping), R53 (query parse and fallback), R4 (preset filter, tools by feature), R34 (session sketch results first, in memory), R81 (running job appears in the list on completion).
- **Touches:** `stores/history.ts` (`HISTORY_CHIPS` loses `Tools`, `matchesChip`, `mergeHistoryItems`), new `composables/useLibraryFilters.ts`, `utils/helpers.ts` (`favoriteImage`, `deleteImage`, `bulkFavorite`, `bulkDelete`, `bulkDownload`, `downloadHistoryImage` stay), new media API client functions, `pages/utils/index.ts` (`groupByDate`).
- **Risks:** merged All list comparator must match server order for media; images sort by prompt for title; selection clear rules; `HISTORY_CAP` messaging.
- **Proof:** unit tests for filters/sort/search/selection/merge/`matchesChip`/deeplink parsing; optimistic rollback test; existing history store tests migrated with equal assertions.

#### S2.2 TrackRow, VisualGrid and compact LibraryView
- **Delivers:** R40, R48 (list columns and 375 collapse), R4 (pane), R12 (now-playing highlight everywhere), R65 (arrival stagger once per new asset), R66 (pending row cross-fade), R79 (web half: delete the playing track closes the player), R81, R82 ("Couldn't load audio" with Retry), R83 (ellipsis + `title`), R84 (one `aria-current` row), R64 (row hover, play press, equaliser bars).
- **Touches (new):** `components/Library/LibraryView.vue`, `TrackRow.vue`, `VisualGrid.vue`, `PendingRow.vue`, `LibraryEmpty.vue`; refactors `components/History/History.vue` into it; uses `CoverArt.vue`, `WaveformStrip.vue`, `thumbUrl` from `utils/cloudinaryUrl.ts`.
- **Mockup / motion:** `design/library.html` and `design/library.motion.md` (M4-M9, M20 new item) for rows; `design/music-studio.html` / `music-studio.motion.md` M5-M13 for the pane arrival. Idea: rows read as record sleeves (cover, title, waveform on one line, quiet until hovered; now-playing row tinted not outlined, REFS library #3/#4).
- **R84-R98 corrections applied:** R84, R98 (every cover from `coverArtFor`), R97 groundwork (counts from one source).
- **Risks:** masonry vs list in All; long lists and IntersectionObserver; reveal animation replaying on filter (must not); keyboard list semantics.
- **Proof:** component tests for loading/empty/error/pending/arrival-once/failed-audio/long-title/delete-playing; cross-surface sleeve identity test (row vs player vs Media Session for the fixture tracks); `History` tests migrated.

#### S2.3 Track detail panel, overflow menu, editor entry
- **Delivers:** R26 (shared panel: inline on desktop, bottom sheet at 375), R30 (waveform editor opens as panel/sheet, unchanged behaviour), R49 (menu: Play, Open/Edit, Rename, Favorite, Download, Copy prompt, Reuse prompt in studio, Delete; image rename hidden), R80 (rename/favorite update player immediately).
- **Touches (new):** `components/Library/TrackDetailPanel.vue`, `RowMenu.vue`; hosts `components/Audio/WaveformEditor.vue`, `EditorToolbar.vue`, `ExportDialog.vue`; `composables/useAudioEditor.ts`, `useAudioExport.ts` unchanged; keeps `Studio/HandoffMenu.vue` actions.
- **Mockup / motion:** the track-detail states in `design/song-studio.html` (M25) and `design/music-studio.html` (M22, M23, M24); `design/library.html` M15 for the menu. Idea: a grouped overflow menu with a one-line description per action (REFS song-studio #2, library #6).
- **R84-R98 corrections applied:** R84 (player equals now-playing row also in `track-detail`), R98 (large cover is the same sleeve).
- **Risks:** editor save-as-new-version flow, `EXPORT_TOO_LONG_COPY`/`HISTORY_FULL_COPY` copy must stay verbatim; focus return.
- **Proof:** component tests for detail open by click and Enter, menu per type (image has no rename), editor entry; existing editor tests unchanged.

**Gate G2 (end of Phase 2):** design-qa (MODE PHASE) on `design/studio-frame.html` states (`#default`, `#error`, `#generating`, hero at 1440 and 375, light and dark), including R84, R85, R87, R88, R92. Also `design/library.html` rows/compact pane spot check.

### Phase 3 - Audio studios

#### S3.1 Music studio
- **Delivers:** R27, R19 (Auto duration/genre/mood), R18, R5 (Music hero with example chips), R9, R4 (preset `music`), R85, R87, R88, R74.
- **Touches:** `pages/Music.vue`, `components/Music/MusicComposer.vue`, `DurationControl.vue` (logic reused), removes `MusicModelSelect.vue`, new mood/genre chip components `components/Music/MoodGenreChips.vue` **(new)**; consumes S0.5-S0.7, S2.2.
- **Mockup / motion:** `design/music-studio.html`, `design/music-studio.motion.md` (M18/M19 chip select, M20 sleeve preview cover, M21 genre popover). Distinctive idea: prompt-first with mood and genre as tappable chips carrying a colour swatch, and cover art that settles in on arrival (REFS music-studio #4/#5).
- **R84-R98 corrections applied:** R84, R85 (action row nowrap, same label idle/generating), R86 (picker), R87 (sticky mobile bar), R88 (`#error` copy), R98.
- **Risks:** model-switch draft rules; multi-select only where the model allows; `useComposerPersistence` drafts; preserving request payload exactly (R76).
- **Proof:** component tests (chips, pills, Auto labels, cost badge updates, payload unchanged); e2e (mocked): hero -> first generation settles into split, played track keeps playing across studios; design-qa PASS vs mockup at 1440/375 light/dark.

#### S3.2 Song studio
- **Delivers:** R24, R25, R26 (song rows open the shared detail), R73, R89, R18, R5, R9, R4 (preset `song`), R85, R87, R88, R74.
- **Touches:** `pages/SongStudio.vue`, `components/Song/SongComposer.vue`, `LyricsEditor.vue` (section blocks, add/reorder/delete, undo/redo >= 50 steps, collapse, fullscreen), `LyricsAiMenu.vue`, `StylePresets.vue`, `songPresets.ts` (`SONG_STYLE_CHIPS`, `songDisabledReason`), new `components/Song/StructureStrip.vue`, `StylesPanel.vue` **(new)**; removes `SongResult.vue`.
- **Mockup / motion:** `design/song-studio.html`, `design/song-studio.motion.md` (M18 structure strip tag, M19/M20/M21 lyric blocks, M22 styles chevron, M23 lyrics-mode popover, M24 expanded lyric sheet, M25 detail panel). Distinctive idea: lyrics first, a writing page of labelled section blocks, each with a copper/gold rule per type, above a one-glance structure strip (REFS song-studio #1/#3).
- **R84-R98 corrections applied:** R89 (structure strip compact tokens I, V1, C, V2, C, B, C, O or two wrapped rows; "+" always visible; 375 horizontal scroller with edge fade scrolling the active part into view), R87 (Generate not at y=1396: sticky bar at end of long lyrics), R85, R84 (default and track-detail), R86, R88, R98.
- **Risks:** section parsing compatibility with existing lyrics text and the "420 / 600" budget; undo history depth vs section reorder; accent used sparingly (rules only); keyboard reorder alternative to drag; lyrics persistence.
- **Proof:** component tests (add/reorder/delete section, undo/redo >= 50, budget counter and over-budget message, `LyricsAiMenu` actions, labels programmatic); measured test: strip tokens unclipped at 520 px; 375 sticky bar at scroll end; design-qa PASS (success 14, 16).

#### S3.3 Speech studio
- **Delivers:** R28, R29, R29a, R29b, R90, R91, R18, R5, R9, R4 (preset `speech`), R85, R87, R88, R74.
- **Touches:** `pages/Speech.vue`, `components/Speech/SpeechComposer.vue`, `TtsEditor.vue`, `TagToolbar.vue`, `TagChipNode.ts`, `TextAdvisor.vue`, `ConvertTagsDialog.vue` (behaviour unchanged), new `VoiceStrip.vue`, `VoiceCard.vue` **(new)**; new `utils/voiceSamples.ts` and `utils/voiceTraits.ts` **(new)**, `public/voice-samples/` (empty manifest ships valid, R29b); removes `VoiceSelect.vue`, `SpeechModelSelect.vue`.
- **Mockup / motion:** `design/speech-studio.html`, `design/speech-studio.motion.md` (M18/M19 voice card, M20 audition button, M21 audition equaliser bars, M22-M24 cue button, inserted chip, slash menu). Distinctive idea: the script is a writing surface with a toolbar of delivery cues, and voices are audition-able cards with trait descriptors and equaliser bars on the one playing (REFS speech-studio #1-#4).
- **R84-R98 corrections applied:** R90 (voice strip fully visible at 1440x900: script capped about 300 px with internal scroll or strip under the script header; name, traits, audition, selected label and outline for every visible card above the Generate bar), R91 (picker "Use model" nowrap; details pane lists the model's voices as mini cards and the live script cost; no dead band over 24 px), R84 (default and audition), R85, R86, R87, R88, R98.
- **Risks:** the owner-supplied clips do not exist yet (R29b): all tests stub the manifest or intercept `/voice-samples/*`; voice id sent to `/generate/audio/speech` must stay identical; selected state by shape plus label, not colour only; audition must not make any `/generate/*` or TTS request; the voice catalog key (`media.voices`, `inworld`, `minimax`).
- **Proof:** component tests (card content, selection reflected in payload, disabled "Preview not available", empty manifest renders); request-interception test (zero `/generate/*` during audition); measured visibility assertion at 1440x900; design-qa PASS (success 15, 16).

**Checkpoint P3:** the three audio studios share one frame; Music -> Song -> Speech navigation keeps a playing track playing (success 3).

### Phase 4 - Video studio

#### S4.1 Video studio and preview stage
- **Delivers:** R31, R32, R14 (video pauses player and back), R92 (Video composer 520 px), R18, R5, R9, R4 (preset `video`), R85, R87, R88, R74.
- **Touches:** `pages/Video.vue`, `components/Video/VideoComposer.vue`, `ImageInput.vue`, `AudioInput.vue`, `UploadDropZone.vue`, `AttachedFile.vue`, `DraftToggle.vue` ("Try cheap first" with saved credits kept), `VideoResult.vue` (stage), `VideoSettings.vue` (controls become pills), new `components/Video/VideoStage.vue`, `ReelStrip.vue` **(new)**.
- **Mockup / motion:** `design/video-studio.html`, `design/video-studio.motion.md` (M12 input tab, M13/M14 draft switch, M15 stage poster dim, M16 stage result, M17 title+actions, M18-M20 reel card). Distinctive idea: one large preview stage with the takes as a thumbnail strip under it; the poster cross-fades into the playing video, and job stages render inside the stage (REFS video-studio #1/#4).
- **R84-R98 corrections applied:** R92 (520 px, same as the frame so the layout does not shift between studios), R85 (`#generating`: composer height and button geometry delta 0 px, label unchanged), R86, R87, R88, R98 (posters keep real poster/thumbnail).
- **Risks:** stage aspect ratio from asset vs 16:9; autoplay rules (no autoplay on load); video-vs-audio mutual pause; upload edge states unchanged; fixed-width column on 1024-1280.
- **Proof:** component tests (mode tabs, draft toggle savings, stage state cross-fade, audio/video mutual pause); e2e (mocked Replicate): text-to-video job through the stage; width assertion 520 px at 1440; design-qa PASS.

### Phase 5 - Tools

#### S5.1 Tool stage scaffold and Image watermark
- **Delivers (scaffold):** R33, R38 (output saved as image/video type, listed by feature in each pane), R95 (shared `#settings-sheet` mechanics at 375), R2 (removes `StudioEmptyState` from `ToolResultPanel.vue`), R4 (pane preset by feature), R5 (hero = stage), R74.
- **Delivers (image watermark):** R35, R95, R88.
- **Touches:** new `components/Tools/ToolStage.vue`, `ToolSettingsSheet.vue`; `pages/ToolImageWatermark.vue`, `components/Tools/WatermarkForm.vue` (replaced by inspector/pill bar), `ToolFileInput.vue` (limits and validation copy unchanged), `ToolResultPanel.vue`.
- **Mockup / motion:** `design/tool-image-watermark.html`, `design/tool-image-watermark.motion.md` (M13 watermark on stage, M14 anchor grid, M15 snapped dot, M18 divider knob, M19 after layer). Distinctive idea: the photo is the stage and the controls are a thin strip under it, with drag-to-place on a nine-point anchor grid with fading snap guides and a before/after divider (REFS tool-image-watermark #1/#2/#4).
- **R84-R98 corrections applied:** R95 (at 375: pill bar with Text pill, Position pill, Watermark action with cost; "Settings" pill opens a bottom sheet with grab handle and `sheetIn` rise; no inline inspector; `#settings-sheet` state light and dark; add the new M-row to the motion spec), R88 (`#error`).
- **Risks:** the output feature typing (R38; see "Hard to place"); pointer-drag vs keyboard placement; live preview correctness vs server render; sheet pattern reuse.
- **Proof:** component tests (live preview follows controls, drag, before/after, file validation copy); e2e (mocked) upload -> generate -> output appears in pane; design-qa PASS with `#settings-sheet`.

#### S5.2 Video watermark
- **Delivers:** R36, R93, R94, R95, R88.
- **Touches:** `pages/ToolVideoWatermark.vue`, `components/Tools/VideoWatermarkForm.vue` (replaced), new `components/Tools/WatermarkFilmstrip.vue`, `SizeRuler.vue`; `shared/schemas` `VideoWatermarkRequestSchema` unchanged (text and size only).
- **Mockup / motion:** `design/tool-video-watermark.html`, `design/tool-video-watermark.motion.md` (M13 proof strip sample text, M14 size stepper, M15 stage play). Distinctive idea: an honest proof, not a placement tool; the mark is drawn on a video frame at its fixed corner with crop marks labelled "Fixed by this tool", and a filmstrip of sampled frames plus a true-scale size ruler (REFS tool-video-watermark #2/#3).
- **R84-R98 corrections applied:** R93 (own layout, different sample clip from Autocaption, mark directly on the frame, crop marks "Fixed by this tool", filmstrip of 4-5 frames, size ruler, filmstrip kept as the after strip in `#success`, no draggable position, corner grid or opacity control), R94 (preview box intersects no scrubber, time label or fullscreen icon: overlay controls hidden at rest or transport below the frame; test asserts no rect overlap), R95, R88.
- **Risks:** drifting toward Autocaption's layout; implying controls the model lacks; frame sampling without a server call (client-side `<video>` seeks); overlap at 1440 light and dark.
- **Proof:** rect-overlap assertion at 1440 light and dark in `#default` and `#success`; component tests (stepper, ruler scale); design-qa PASS.

#### S5.3 Autocaption
- **Delivers:** R37, R95, R88.
- **Touches:** `pages/ToolAutocaption.vue`, `components/Tools/CaptionResult.vue` (transcript, download), new `CaptionOverlay.vue`, `TranscriptList.vue`.
- **Mockup / motion:** `design/tool-autocaption.html`, `design/tool-autocaption.motion.md` (M13 caption overlay, M14-M16 transcript lines). Distinctive idea: captions burned into the frame with the spoken word highlighted, and a timestamped transcript beside the video where each line is a seek target and the current line lights up (REFS tool-autocaption #1/#2/#3).
- **R84-R98 corrections applied:** R95 (375 settings sheet for caption style and language), R88, and the layout stays distinct from Video watermark (R93).
- **Risks:** transcript sync to `currentTime` cost; caption style options limited to what the tool supports; result plays in stage.
- **Proof:** component tests (line seek, active line, overlay style); e2e mocked; design-qa PASS with `#settings-sheet`.

#### S5.4 Sketch to image
- **Delivers:** R34, R34a, R34b, R96, R33, R5 (empty canvas as hero), R88.
- **Touches:** `pages/ToolSketchToImage.vue`, `components/Tools/SketchCanvas.vue`, `SketchToolbar.vue`, `useToolVideoUpload.ts` rule reused for accepted types (image upload: `image/jpeg,image/png,image/webp`, `MAX_IMAGE_BYTES`, `SKETCH_CANVAS_SIZE`), `stores/generate.ts` (`generateImage(..., [file])`), new `components/Tools/BeforeAfter.vue`, `SketchUpload.vue`, `utils/downscaleImage.ts` **(new)**.
- **Mockup / motion:** `design/tool-sketch.html`, `design/tool-sketch.motion.md` (M13 Draw/Upload segment, M14 tool button, M15 brush dots, M16 result layer, M17/M18 divider knob and handle, M19 file chip). Distinctive idea: a dotted paper canvas as the hero, a floating vertical tool rail, a one-line pill prompt bar, and a draggable before/after divider that tracks the pointer directly (REFS tool-sketch #1-#4).
- **R84-R98 corrections applied:** R96 (at 375 a sticky pill bar with Generate and the style pill above the offset var; style options and strength in a bottom sheet with `#settings-sheet` light/dark; the tool rail is not an inline block under the canvas).
- **Risks:** both inputs kept across Draw/Upload switching and which one Generate uses; Clear vs Remove scope; downscale to at most `SKETCH_CANVAS_SIZE` with letterboxing; "Couldn't read this image"; divider keyboard operability; session-only sketch results first in the pane (no schema change); `FeatureType.SKETCH` is routing only, results are ordinary image records.
- **Proof:** unit tests for downscale and mode logic; component tests (PNG/JPG/WEBP carry the uploaded file, GIF and over-limit rejected with existing copy, 6000 px downscaled, drag-and-drop replace); e2e mocked (success 21); design-qa PASS.

**Checkpoint P5:** `grep -rln "StudioPlaceholder\|StudioEmptyState" apps/web/src/pages apps/web/src/components/Tools` returns nothing (success 1 first half); tools pairwise distinct at 1440 (success 16).

### Phase 6 - Library (Assets becomes Library)

#### S6.1 Library page shell, route, tabs, empty/error, deep links
- **Delivers:** R39, R41, R42, R50, R52, R53, R97, R40 (full-page mode).
- **Touches:** `components/Header/NavTabs.vue` (`ASSETS_TAB.name` -> "Library", `testId` stable), `utils/dashboardRoutes.ts` (`APP_SURFACE`, `APP_SURFACE_TAB`, `NAV_MENU_GROUPS`, `ROUTE_TAB_BY_NAME`), `router/index.ts` (`/library` name `library`, `/assets` redirect preserving query and hash), `pages/Dashboard.vue`, `components/Library/LibraryTabs.vue` **(new)**, `History/CollectionsStrip.vue` (All and Images only), `History/NoResults.vue`.
- **Mockup / motion:** `design/library.html`, `design/library.motion.md` (M1 tab underline, M2 panel cross-fade, M3 tab press). Distinctive idea: "a record collection, not a form": audio rows read as sleeves, visuals as prints in a masonry grid, grouped by date under type tabs with counts (REFS library #1/#2/#5).
- **R84-R98 corrections applied:** R97 (empty tab shows no count or a quiet muted zero, header "N things you made" equals the sum of shown tab counts at 1440 and 375, light and dark), R84 (Library state), R98, R88 n/a.
- **Risks:** every internal link to `/assets` must change (grep gate); bookmarks via redirect; unknown `tab`/`sort` fall back without a console error; counts must not go stale during load; `Dashboard.test.ts` text updates keep equal strength (Assumption 16).
- **Proof:** router tests for `/assets` and `/assets?x=1#h` -> `/library`; tab ARIA/arrow keys test; deep-link tests (`/library?tab=songs&q=lofi&sort=title`, `?tab=bogus`); count-sum assertion; design-qa PASS.

#### S6.2 Search, sort, favorites, inline rename
- **Delivers:** R43, R44, R45, R46, R57 (client), R70 (live announcements for favorite and rename).
- **Touches:** `components/Library/LibrarySearch.vue`, `SortMenu.vue`, `FavoriteButton.vue`, `InlineRename.vue` **(new)**, `History/Filter.vue` (replaced or folded), `useLibraryFilters.ts`.
- **Mockup / motion:** `design/library.html`, M10 favorite heart, M11 favorites filter chip, M18 inline rename, M19 rename error line.
- **Risks:** server-vs-client ordering parity in the merged list; rename edge cases (empty, whitespace, max 120 via `MEDIA_TITLE_MAX`, Enter/blur/Esc); image rename must be absent (menu and double-click); rollback toasts.
- **Proof:** component tests; e2e (mocked): favorite persists across reload for an image and a media asset, rename persists and rejects empty (success 5, 22).

#### S6.3 Multi-select, bulk bar, overflow, pagination, a11y
- **Delivers:** R47, R49 (full menu in lists), R51, R70, R52 (collections only for image-only selection), R79 (bulk delete of the loaded track), R82/R83 in the page.
- **Touches:** `components/Library/BulkBar.vue`, `ConfirmBulkDelete.vue` **(new)**, `History/SelectActionButtons.vue`, `ImageActionButtons.vue`, `Dialogs/DeleteDialog.vue`, `History/HistoryFullNote.vue` (`Dashboard/Canvas/HistoryFullNote.vue`), `utils/helpers.ts`.
- **Mockup / motion:** `design/library.html`, M12 select check, M13 selected, M14 action bar, M16 confirm dialog, M17 deleted items.
- **Risks:** mixed selections run two delete paths and report partial failure; chunks of 100 for media; Shift-range and long-press; Esc exits; focus management after delete.
- **Proof:** unit tests (chunking, partial failure message); e2e (mocked): select 3 mixed, bulk delete, partial-failure toast; keyboard-only run (success 11).

**Checkpoint P6:** success 4, 5, 20, 22 pass.

### Phase 7 - Hardening and regression

#### S7.1 Regression slice
- **Delivers:** R76, R77, R78, R2 (final deletions and grep gates).
- **Work:** run every existing suite for the touched areas; migrate (not weaken) tests tied to "Assets", the `Tools` chip and removed components; delete `StudioPlaceholder.vue`, its test, `StudioEmptyState.vue` (or de-dash) and the replaced components listed in 1.4; confirm unchanged request paths and payloads for `/generate/audio/song|music|speech`, `/generate/video`, `/generate/tools/*`, credits, job polling, no-charge copy, handoff actions, draft persistence, and that `/create` and Explore are untouched.
- **Risks:** deleted-test temptation; `components.d.ts` stale entries; e2e flakiness around mocked jobs; any un-intercepted paid route (guard must show zero).
- **Proof:** `bun run verify`, `bun run check`, `bun run test`, `bun --cwd apps/web run test:e2e` green; `paidCallGuard` zero hits; success 1 and 13.

#### S7.2 Motion, accessibility and responsive sweep
- **Delivers:** R63-R68 (audit), R69-R73 (audit), R72, R74, R75 (audit).
- **Work:** static gates (no `transition-all`, only opacity/transform, durations 150-400 ms, ease token, no arbitrary hex/px); reduced-motion computed-style test on every screen (success 9, 10); axe on each screen (no serious/critical, success 11); 375 smoke on each screen (no horizontal scroll, 44 px targets, Generate bar not covered, success 12); keyboard-only run; contrast AA light and dark.
- **Risks:** late discovery of a per-component reduced-motion check; focus order in the player.
- **Proof:** the above automated checks pass; agent-browser captures (session-isolated per repo) at 1440 and 375, light and dark.

#### S7.3 Build-time corrections matrix and final design-qa
- **Delivers:** R84-R98 verification, R98 cross-surface sleeve test, success 16, 17, 19, 23.
- **Work:** one measured assertion or screenshot per R84-R98 at 1440 and 375, light and dark; design-qa (MODE PHASE) on every touched screen vs its mockup with equal weight to Library and the studio panes; edge-case tests R79-R83 present (delete playing track, rename playing track, return to a studio with a running mocked job, failing audio URL, long title); 9-screen masked screenshots for distinctness.
- **Risks:** a missed correction produces CHANGES; screenshot-only evidence for layout claims should be backed by measured assertions.
- **Proof:** design-qa report PASS with zero slop-audit findings.

---

## 4. Requirement coverage (every id has an owner slice)

| Requirements | Slice(s) |
|---|---|
| R1, R3, R5-R9 | S0.7 (hero content per studio in S3.1-S5.4) |
| R2 | S0.7 (frame), S5.1-S5.4 (migrate tools), S7.1 (final deletion and gates) |
| R4 | S2.1, S2.2; consumed S3.x, S4.1, S5.x |
| R10-R15, R17 | S0.4 |
| R16 | S0.1 (variable), S0.4 (driver), S0.7 (consumer) |
| R18-R20, R23 | S0.5 |
| R21, R22 | S0.6 |
| R24, R25 | S3.2 |
| R26 | S2.3 (panel), S3.2 (Song rows) |
| R27 | S3.1 |
| R28, R29, R29a, R29b | S3.3 |
| R30 | S2.3 |
| R31, R32 | S4.1 |
| R33 | S5.1 (scaffold), S5.2-S5.4 |
| R34, R34a, R34b | S5.4 (session sketch list: S2.1) |
| R35 | S5.1 |
| R36 | S5.2 |
| R37 | S5.3 |
| R38 | S5.1-S5.4, S6.1 |
| R39, R41, R42, R50, R52, R53 | S6.1 |
| R40, R48 | S2.2 |
| R43-R46 | S6.2 (logic in S2.1) |
| R47, R49 (menu in lists), R51 | S6.3 (R49 menu component: S2.3) |
| R54 | S1.2 |
| R55 | S1.1, S1.3 |
| R56, R57 | S1.3 |
| R58, R59 | S0.2 |
| R60 | S0.2, S0.4 |
| R61, R62 | S0.3 |
| R63, R67, R75 | S0.1; audited S7.2 |
| R64-R66, R68 | S0.1, per-slice, S7.2 |
| R69 | S0.5, S0.6; audited S7.2 |
| R70 | S6.2, S6.3 |
| R71 | S0.4 |
| R72 | S0.5, S7.2 |
| R73 | S3.2 |
| R74 | every screen slice; audited S7.2 |
| R76-R78 | S7.1 (guards in every slice) |
| R79 | S0.4, S2.2, S6.3 |
| R80 | S0.4, S2.3 |
| R81, R82, R83 | S2.2 |
| R84 | S0.4, S2.2, S2.3, S3.x, S6.1; verified S7.3 |
| R85 | S0.5, S0.7, S3.1-S4.1 |
| R86 | S0.6, S3.1, S4.1 |
| R87 | S0.7, S3.1-S4.1, S5.4 |
| R88 | S0.7, S3.x, S4.1, S5.1-S5.3 |
| R89 | S3.2 |
| R90, R91 | S3.3 (R91 mechanics S0.6) |
| R92 | S0.1, S0.7, S4.1 |
| R93, R94 | S5.2 |
| R95 | S5.1, S5.2, S5.3 |
| R96 | S5.4 |
| R97 | S6.1 |
| R98 | S0.2, S2.2, S2.3, S3.x, S6.1; verified S7.3 |

---

## 5. Cross-cutting risks

| Risk | Impact | Mitigation |
|---|---|---|
| Studios need the Library pane before the Library screen exists | High | Library engine and compact `LibraryView` land in Phase 2; full page in Phase 6 |
| Hero/split state machine regressions (hero during load, replay on revisit) | High | Frame state machine unit-tested in S0.7 before any studio adopts it |
| Mockup defects reappearing | High | Corrections named per slice; measured assertions in S7.3 |
| Voice clips not yet recorded (R29b) | Med | Empty manifest ships valid; tests stub manifest |
| Real paid call from a test | High | `paidCallGuard`, fake Replicate for `E2E_USER_IDS`, no real keys; ask first for anything else |
| Large PR surface | Med | Slices sized to about 5 files per task in TASKS.md; checkpoint per phase |
| Cursor pagination bugs across sorts | Med | Tie-case tests per sort in S1.2 |
| Shared player state vs video stage | Med | Single owner in `stores/player.ts`; mutual-pause tests in S0.4 and S4.1 |

## 6. Requirements that were hard to place

- **R38 / R4 for tools:** the feature filter `feature` in `GET /media/assets` accepts media `FeatureType`s. It is unconfirmed in `REPO_MAP.md` whether Image watermark output is a `MediaAsset` (feature `watermark_image`) or an `Image` record; if it is an image record, that pane is filtered client-side. S5.1 starts by verifying this before building the pane.
- **R5 counts per studio:** the hero needs a load-complete per-studio count; it uses the same filtered list as the pane (S2.1), so a failed load must show an error (R50), never the hero.
- **R2:** spans three phases (frame, tool migrations, final deletion); the grep gate runs at P5 and S7.1.
- **R84, R98:** cross-surface by nature; implemented where the surface is built and only provable in S7.3.
- **R76-R78:** are guards, not features; enforced in every slice and closed out in S7.1.
- **R95 motion row:** the spec requires a new "M-row" for `sheetIn` in three tool motion specs; plan treats updating `*.motion.md` as part of S5.1-S5.3.
