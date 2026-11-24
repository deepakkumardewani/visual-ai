window.DASHBOARD = {
 "generatedAt": "2026-11-24T08:14:56.456Z",
 "maxAttempts": 5,
 "feature": {
  "slug": "media-studio",
  "title": "Media Studio Tasks"
 },
 "tasksFile": "agent_docs/media-studio/TASKS.md",
 "projectRoot": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai",
 "docs": [
  {
   "name": "APPROVALS",
   "href": "docs/APPROVALS.html",
   "source": "agent_docs/media-studio/APPROVALS.md"
  },
  {
   "name": "PLAN",
   "href": "docs/PLAN.html",
   "source": "agent_docs/media-studio/PLAN.md"
  },
  {
   "name": "REPO_MAP",
   "href": "docs/REPO_MAP.html",
   "source": "agent_docs/media-studio/REPO_MAP.md"
  },
  {
   "name": "SPEC",
   "href": "docs/SPEC.html",
   "source": "agent_docs/media-studio/SPEC.md"
  },
  {
   "name": "TASKS",
   "href": "docs/TASKS.html",
   "source": "agent_docs/media-studio/TASKS.md"
  }
 ],
 "costUsd": 65.6872,
 "elapsedMs": 98615201,
 "costByRole": {
  "reviewer-security": 5.8733,
  "unit": 8.4183,
  "reviewer-ux": 1.8549,
  "e2e": 5.0157,
  "reviewer-code": 3.0525,
  "builder": 20.7157,
  "verifier": 18.8104,
  "reviewer-ui": 1.8522,
  "runner": 0.0941
 },
 "totals": {
  "phases": 6,
  "tasks": 87,
  "byStatus": {
   "verified": 70,
   "ready": 1,
   "waiting": 16
  }
 },
 "phases": [
  {
   "id": "0",
   "name": "Shared media infrastructure",
   "startLine": 41,
   "endLine": 653,
   "adds": "Adds the shared plumbing every audio, video and tool surface uses: one model registry and credit function, a safe paid-call-free e2e harness, the job pipeline with charge-on-success, uploads and asset storage, the new header menus and routes, a persistent mini-player, media in History, and shortcuts. Users see the new Video, Audio and Tools menus (each opening an honest coming-soon page) and, once a generation exists, media in History with a player that survives navigation.",
   "tryInUi": [
    "Open the header and see Image, Video, Audio and Tools",
    "open Audio with the keyboard and press Escape",
    "open /audio/song and read the coming-soon page",
    "open History at 375px width"
   ],
   "checkpoint": {
    "title": "Checkpoint 0",
    "line": 652,
    "items": [
     "registry, credits, mocked e2e harness, pipeline, assets, uploads, nav and mini-player all verified by unit tests, the mocked media-pipeline and nav-player QA specs, and `bun run check` plus `bun run test`."
    ]
   },
   "tasks": [
    {
     "id": "T0.1",
     "title": "Record owner approvals for new collections and libraries",
     "done": true,
     "kind": "dod",
     "depends": [],
     "files": [
      "agent_docs/media-studio/APPROVALS.md"
     ],
     "gherkin": null,
     "do": "Create APPROVALS.md recording that the owner approved, on 2026-11-16, the four new Mongo collections MediaAsset, MediaUpload (24h TTL), Voice and VoiceConsent (append-only), and the two npm packages wavesurfer.js and @breezystack/lamejs. No question is asked and no later task waits on an answer. Also record the open questions G1 to G13 with their default or resolution (G9, G10 and G14 resolved 2026-11-16), and Q5, Q6 and Q8 as resolved 2026-11-16.",
     "spec": "R-INF-5, R-INF-14, R-INF-17, R-TTS-11 (collections), PLAN section 2",
     "filesDeclared": true,
     "acceptance": [
      "AC1: APPROVALS.md lists MediaAsset, MediaUpload, Voice and VoiceConsent each with an approved line dated 2026-11-16.",
      "AC2: APPROVALS.md lists wavesurfer.js and @breezystack/lamejs as approved 2026-11-16, and G1 to G13 each with the default or resolution applied.",
      "AC3: No file other than APPROVALS.md changed in this task."
     ],
     "verify": [
      "V1: `grep -c -E 'MediaAsset|MediaUpload|Voice|VoiceConsent' agent_docs/media-studio/APPROVALS.md` is at least 4 and each line contains approved and 2026-11-16",
      "V2: `grep -c -E '^- G(1[0-3]|[1-9]):' agent_docs/media-studio/APPROVALS.md` equals 13 and `grep -c -E 'wavesurfer|lamejs' agent_docs/media-studio/APPROVALS.md` is at least 2",
      "V3: `git status --short` lists only agent_docs/media-studio/APPROVALS.md as new from this task"
     ],
     "line": 46,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.2309,
     "costApprox": true,
     "elapsedMs": 21830532,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.2",
     "title": "Shared media limits, job kinds and the single credit function (S0.1a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.1"
     ],
     "files": [
      "packages/shared/src/models/media-limits.ts",
      "packages/shared/src/models/credits.ts",
      "packages/shared/src/models/types.ts",
      "packages/shared/src/types/domain.ts"
     ],
     "gherkin": null,
     "do": "Copy the pattern of `packages/shared/src/models/image-limits.ts`. Create media-limits.ts as the only home of media limits and named constants (EXPENSIVE_JOB_CREDITS = 150, MAX_VOICES_PER_USER = 10, upload byte caps and second caps from SPEC section 5 and 11, P_VIDEO_MAX_SEC = 20, EXPORT_PCM_CAP_BYTES, EDITOR_PEAK_BUCKETS, lyrics and prompt limits); no magic numbers elsewhere. In credits.ts add MEDIA_CREDITS_PER_USD = 200, MIN_JOB_CREDITS = 1 and the pure function getMediaCreditCost(modelKey, input) = max(MIN_JOB_CREDITS, ceil(round6(usd \\* 200) - 1e-9)) for the 5 MediaCostInput variants (file, chars, seconds with resolution and draft, run, blocks of 30 s). In types.ts add ModelKind ('image'|'music'|'song'|'tts'|'video'|'tool'), the media field types, MediaPricing (unit file|second|kChars|kTokens|run plus optional blockSec, gap G6) and the new CatalogModelKey members from PLAN 1.3; getModelKind defaults legacy entries to image. In domain.ts extend FeatureType with SONG, MUSIC, SPEECH, VIDEO, WATERMARK_IMAGE, WATERMARK_VIDEO, AUTOCAPTION, SKETCH (SKETCH is for routing and labels only, G11) and extend JobStatus with optional stage, elapsedMs, assetId, asset, credits and the noCharge failure reason union. Functions stay under 30 lines. Tests are not written here: T0.4, T0.29 cover Unit: table test regenerates every SPEC section 8 row from the constant and asserts the exact credits; Unit: chars 0 -> 1, 1, 1000, 2000, 10000 and blocks 30, 31, 120 s boundary cases; Unit: registry test asserts getModelKind is image for all legacy keys.",
     "spec": "R-INF-1, R-INF-2, R-INF-3, R-INF-6, R-INF-7",
     "filesDeclared": true,
     "acceptance": [
      "AC1: getMediaCreditCost returns the integer credits of every SPEC section 8 row, for example 5 credits for 0.025 USD, never 6 from float error.",
      "AC2: A zero-character TTS input costs MIN_JOB_CREDITS (1).",
      "AC3: No constant for a limit or multiplier is declared outside media-limits.ts and credits.ts.",
      "AC4: getModelKind returns image for every pre-existing registry key.",
      "AC5: FeatureType and JobStatus accept the new members and existing image code still typechecks."
     ],
     "verify": [
      "V1: `grep -rn -E '200|150' packages/shared/src/models/credits.ts packages/shared/src/models/media-limits.ts` shows each only on its named constant line",
      "V2: `bun run check`",
      "V3: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V4: `cd apps/api && bun run type-check`"
     ],
     "line": 61,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.0868,
     "costApprox": true,
     "elapsedMs": 55327820,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.3",
     "title": "Registry entries for all media models and the web catalog (S0.1b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.2"
     ],
     "files": [
      "packages/shared/src/models/registry.ts",
      "apps/web/src/utils/models.ts",
      "apps/api/src/types/index.ts",
      "apps/web/src/types/index.ts",
      "apps/web/src/assets/providers/"
     ],
     "gherkin": null,
     "do": "Follow docs/MODEL_ONBOARDING.md sections 1 and 3. Add the 15 registry entries from SPEC section 4: 14 user-facing models plus the MINIMAX_VOICE_CLONE helper, which gets no picker or pricing-list row (LYRIA_2, MINIMAX_MUSIC_26, MINIMAX_MUSIC_15, STABLE_AUDIO_25, IMAGE_WATERMARK, AUTOCAPTION, VIDEO_WATERMARK, INWORLD_TTS_2, INWORLD_TTS_15_MAX, MINIMAX_SPEECH_28_HD, MINIMAX_SPEECH_28_TURBO, CHATTERBOX_TURBO, P_VIDEO, WAN_3, MINIMAX_VOICE_CLONE) with kind, tier standard (never set isPro), media pricing, inputs map (each inputKey cites its SPEC 5.x row in a comment), and FIXED_INPUTS (disable_safety_filter false, audio_format never sent, no_op never sent, watermark default text never sent). Community models carry their pinned version hash. Re-read each Replicate model page and schema (read only, never run a model) and stamp pricesVerifiedOn '2026-11-15'; list any price delta in the report. Add fromRegistry entries in models.ts with presentation fields only, add PROVIDER_DISPLAY_NAMES rows and reuse or add provider svgs under assets/providers. Sync the FeatureType copies in apps/api/src/types/index.ts and apps/web/src/types/index.ts. Make the image picker, ImageGenerateAside and pricing cost list filter on kind === 'image'. Tests are not written here: T0.4, T0.29 cover Unit: registry shape test over all 15 entries; Unit: FIXED_INPUTS assertion per model; Unit plus `cd apps/web && npx vitest run src/utils/models.test.ts`: picker excludes media keys; Unit: FeatureType parity test across the three files.",
     "spec": "R-INF-1, R-INF-2, R-INF-3, R-INF-18",
     "filesDeclared": true,
     "acceptance": [
      "AC1: MODEL_REGISTRY has exactly 15 new entries (14 user-facing models plus the MINIMAX_VOICE_CLONE helper), each with kind, pricing and a pinned hash where community, and none sets isPro.",
      "AC2: Every FIXED_INPUTS value is present on its model and no unsupported field is declared in fields.",
      "AC3: The image ModelPicker lists no media model key.",
      "AC4: FeatureType matches across the shared, api and web declarations.",
      "AC5: pricesVerifiedOn equals 2026-11-15 beside the price table and any difference from SPEC section 4 is reported."
     ],
     "verify": [
      "V1: `grep -n pricesVerifiedOn packages/shared/src/models/registry.ts` and `bun run check:model-docs`",
      "V2: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V3: `cd apps/api && bun run type-check`",
      "V4: `cd apps/api && bun run test` (existing api tests stay green)",
      "V5: `cd apps/web && bun run test` (existing web tests stay green)"
     ],
     "line": 84,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.0868,
     "costApprox": true,
     "elapsedMs": 55327820,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.4",
     "title": "Unit: shared credits, limits and registry",
     "done": true,
     "kind": "unit",
     "depends": [
      "T0.3"
     ],
     "files": [
      "packages/shared/src/models/credits.ts",
      "packages/shared/src/models/media-limits.ts",
      "packages/shared/src/models/registry.ts",
      "apps/web/src/utils/models.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Verify of the previous two tasks.",
      "AC3: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared/src/models/credits.test.ts packages/shared/src/models/registry.test.ts packages/shared/src/models/media-limits.test.ts --coverage --coverage.include=packages/shared/src/models/credits.ts --coverage.include=packages/shared/src/models/media-limits.ts --coverage.include=packages/shared/src/models/registry.ts --coverage.reporter=text`",
      "V2: `cd apps/web && npx vitest run src/utils/models.test.ts --coverage --coverage.include=src/utils/models.ts --coverage.reporter=text`"
     ],
     "line": 108,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.7385,
     "costApprox": true,
     "elapsedMs": 54693025,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.5",
     "title": "Extend the paid-call mocking harness: fake outputs and guard (S0.2a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.3"
     ],
     "files": [
      "apps/api/src/lib/replicate.ts",
      "apps/api/src/lib/lyrics-generator.ts",
      "apps/web/e2e/support/paidCallGuard.ts",
      "apps/web/e2e/support/cloudinaryMock.ts"
     ],
     "gherkin": null,
     "do": "Read replicate.ts and paidCallGuard.ts first. Extend the existing FAKE*REPLICATE_OUTPUT_URL branch (taken when the authed user is in env.E2E_USER_IDS) so it returns FAKE_REPLICATE_AUDIO_URL, FAKE_REPLICATE_VIDEO_URL, FAKE_REPLICATE_TRANSCRIPT_URL or FAKE_VOICE_ID by model kind and key; non-e2e users still use the real client. Create lyrics-generator.ts with only the fake branch for e2e users (fixed fake sections, no DeepSeek call); the real generator arrives in the lyrics task. Export PAID_PATH_PATTERN and broaden it to POST /generate/audio/*, /generate/tools/\\_, /prompt/lyrics and /generate/audio/voices (it already covers /generate/video). The guard is only ever broadened, never narrowed or opted out of. Extend cloudinaryMock.ts so mock uploads can return audio and video shaped assets. Tests are not written here: T0.7, T0.29 cover Unit: e2e user returns each fake URL by kind and the spy for the real client has zero calls; Unit: non-e2e user selects the real client path with the spy only inspected; Unit: isPaidCall table for song, music, speech, voices, tools, video, lyrics and GET variants; Unit: existing paidCallGuard tests still pass unchanged.",
     "spec": "R-INF-9",
     "filesDeclared": true,
     "acceptance": [
      "AC1: For an E2E_USER_IDS user the media kinds return their fake URL and the real Replicate client is never invoked.",
      "AC2: For any other user the real client is selected (asserted with an injected spy, never called for real).",
      "AC3: isPaidCall is true for POST on each broadened path and false for GET on the same paths.",
      "AC4: The guard exports no opt-out and its previous matches still match.",
      "AC5: The Cloudinary mock returns an audio-shaped and a video-shaped asset."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run e2e/support/cloudinaryMock.test.ts`",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `cd apps/web && npx vitest run e2e/support/paidCallGuard.test.ts e2e/support/cloudinaryMock.test.ts` (existing harness tests stay green)",
      "V5: `bun run check`"
     ],
     "line": 121,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.4839,
     "costApprox": true,
     "elapsedMs": 21026867,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.6",
     "title": "MediaGenerationStub and audio fixtures (S0.2b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.5"
     ],
     "files": [
      "apps/web/e2e/fixtures/media.ts",
      "apps/web/e2e/fixtures/assets/sample.wav",
      "apps/web/e2e/fixtures/assets/sample.mp3"
     ],
     "gherkin": null,
     "do": "Copy the pattern of GenerationStub in `apps/web/e2e/fixtures/generation.ts`. MediaGenerationStub stubs the POST itself (202 or 402 or 422), the SSE progress stream and the result URLs, because stubbing only the stream is not enough. Variants: success, failure (noCharge), insufficient (402 with required and available), moderated (422 PROMPT_REJECTED) and slow (queued, composing, mastering, saving). Generate sample.wav (1 s, 8 kHz mono, tiny) and sample.mp3 (a few valid MPEG frames, at most 5 s) with a one-off node snippet; never commit the script and never fetch anything. Tests are not written here: T0.4, T0.7, T0.11, T0.14, T0.17, T0.27, T0.28, T0.29 cover `cd apps/web && npx vitest run e2e/support/paidCallGuard.test.ts` plus a spec in T0.30 that selects every variant; T0.30 asserts the guard reports a failure for a deliberately un-intercepted POST to each broadened path (guard self-test, never a real call).",
     "spec": "R-INF-9",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Each of the five variants is selectable and intercepts the matching POST route before any network call.",
      "AC2: The stub fails the test if a media POST path is hit without being intercepted.",
      "AC3: Both fixtures are at most 5 seconds and under 100 KB and are real decodable audio."
     ],
     "verify": [
      "V1: `ls -l apps/web/e2e/fixtures/assets/sample.mp3 apps/web/e2e/fixtures/assets/sample.wav` shows each under 102400 bytes",
      "V2: `cd apps/web && npx vitest run e2e/support/paidCallGuard.test.ts e2e/support/cloudinaryMock.test.ts` (existing harness tests stay green)",
      "V3: `bun run check`"
     ],
     "line": 145,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.4839,
     "costApprox": true,
     "elapsedMs": 21026867,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.7",
     "title": "Unit: paid-call harness",
     "done": true,
     "kind": "unit",
     "depends": [
      "T0.6"
     ],
     "files": [
      "apps/api/src/lib/replicate.ts",
      "apps/api/src/lib/lyrics-generator.ts",
      "apps/web/e2e/support/paidCallGuard.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: The real Replicate client and DeepSeek are always injected spies, never called.",
      "AC3: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/lib/replicate.test.ts src/lib/lyrics-generator.test.ts --coverage --coverage.include=src/lib/replicate.ts --coverage.include=src/lib/lyrics-generator.ts --coverage.reporter=text`",
      "V2: `cd apps/web && npx vitest run e2e/support/paidCallGuard.test.ts --coverage --coverage.include=e2e/support/paidCallGuard.ts --coverage.reporter=text`"
     ],
     "line": 165,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.3466,
     "costApprox": true,
     "elapsedMs": 20894332,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.8",
     "title": "Extract the shared credit deduction and generalise job kinds (S0.3a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.2"
     ],
     "files": [
      "apps/api/src/lib/credit-deduction.ts",
      "apps/api/src/services/generation-service.ts",
      "apps/api/src/queue/generation-queue.ts",
      "apps/api/src/queue/generation-worker.ts"
     ],
     "gherkin": null,
     "do": "Move updateAndGetUserCredits unchanged from generation-service.ts into the new lib/credit-deduction.ts and import it back so image and media share ONE deduction. Extend GenerationJobData with kinds song, music, speech, video, image-watermark, video-watermark, autocaption, voice-clone (each { kind, body } with jobId, server-stamped userId, modelKey). Add one exported getJobId(data) used by both generation-queue.ts and generation-worker.ts in place of the two inline kind === 'image' expressions, and add the new cases to the exhaustive switch. Confirm generationQueue.add uses the jobId option, else add it. Do not change image behaviour and do not touch existing tests. Tests are not written here: T0.11, T0.29 cover Unit: getJobId table over every kind plus a type-level exhaustiveness check via `bun run check`; Unit: duplicate jobId enqueue asserts a single add call with the jobId option.",
     "spec": "R-INF-4, R-INF-6, R-INF-8",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Existing generation-service, generation-queue and generation-worker tests pass untouched.",
      "AC2: getJobId returns the jobId for all 9 kinds and the exhaustive switch fails to compile if a kind is missing.",
      "AC3: Both queue files call getJobId and no inline jobId expression remains.",
      "AC4: Enqueueing the same jobId twice creates one BullMQ job."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/services/generation-service.test.ts src/queue/generation-queue.test.ts src/queue/generation-worker.test.ts`",
      "V2: `grep -n 'kind === \"image\"' apps/api/src/queue/generation-queue.ts apps/api/src/queue/generation-worker.ts` returns nothing",
      "V3: `cd apps/api && bun run type-check`",
      "V4: `cd apps/api && bun run test` (existing api tests stay green)",
      "V5: `bun run check`"
     ],
     "line": 178,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.6463,
     "costApprox": true,
     "elapsedMs": 54354239,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.9",
     "title": "Media request schemas and payload builder (S0.3b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.8",
      "T0.3"
     ],
     "files": [
      "packages/shared/src/schemas/media.ts",
      "packages/shared/src/schemas/index.ts",
      "apps/api/src/lib/media-input.ts"
     ],
     "gherkin": null,
     "do": "Copy the pattern of `packages/shared/src/schemas/generate.ts` and `apps/api/src/lib/model-input.ts`. media.ts holds the shared Zod schemas (scaffold the music schema now for Lyria with prompt, negativePrompt, seed and jobId; later tasks add their own). media-input.ts builds Replicate payloads by reading media.inputs[field].inputKey from the registry, never per-model if branches, and always applies FIXED_INPUTS; validateMediaParams returns field-level 400 errors. Re-export from schemas/index.ts. Tests are not written here: T0.11, T0.29 cover Unit: Lyria payload snapshot; Unit: invalid and cross-kind modelKey bodies; Unit: fixed-input assertion over all registry media entries.",
     "spec": "R-INF-4, R-INF-2, R-INF-8",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The Lyria payload contains prompt, negative_prompt and seed only and never a duration.",
      "AC2: A body with an unknown modelKey or a modelKey of another kind is rejected with a field-level 400.",
      "AC3: FIXED_INPUTS values are present in every built payload and unsupported fields never are.",
      "AC4: No client-sent credits value is read anywhere."
     ],
     "verify": [
      "V1: `grep -rn credits apps/api/src/lib/media-input.ts packages/shared/src/schemas/media.ts` shows no request-sourced cost",
      "V2: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V3: `cd apps/api && bun run type-check`",
      "V4: `cd apps/api && bun run test` (existing api tests stay green)",
      "V5: `bun run check`"
     ],
     "line": 201,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.7752,
     "costApprox": true,
     "elapsedMs": 54354239,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.10",
     "title": "Media route and runMediaJob with LYRIA_2 as the reference kind (S0.3c)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.9",
      "T0.5"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/routes/index.ts",
      "apps/api/src/services/media-service.ts"
     ],
     "gherkin": null,
     "do": "Copy the handler pattern of `apps/api/src/routes/generate.ts` (stamp the server-trusted userId exactly as POST /generate/image does) and the worker pattern of runGenerationJob plus finalizeJob. POST /generate/audio/music runs in this strict order: requireAuth, Zod 400, model and kind check, server-side billable quantity, checkPromptSafety (422 code PROMPT_REJECTED with message \"This text can't be used. Try rephrasing it.\"), 402 { code: 'INSUFFICIENT_CREDITS', required, available } computed from getMediaCreditCost with nothing enqueued, jobId idempotency, enqueueGeneration, 202 mirroring the acceptResponse shape. runMediaJob keeps the exact order of runGenerationJob in generation-service.ts (read it first): run on Replicate, persist the record, deduct once via the shared deduction, copy to Cloudinary, complete (SPEC R-INF-6); Replicate failure, timeout, moderation and cancellation deduct nothing and report a noCharge reason. Register mediaRoutes in routes/index.ts. Reuse the existing GET /generate/progress SSE. Tests are not written here: T0.11, T0.14, T0.17, T0.29 cover Unit: 402 body and enqueue not called; Unit: 422 and no deduction; Unit: duplicate jobId single enqueue; Unit: success deducts once, then failure, timeout, moderation and cancel each deduct 0; Unit: deduction rejection yields an error status without an asset; Unit: body userId and credits are ignored; unauthenticated returns 401.",
     "spec": "R-INF-4, R-INF-6, R-INF-6a, R-INF-7, R-INF-8, R-INF-16",
     "filesDeclared": true,
     "acceptance": [
      "AC1: An insufficient balance returns 402 with the exact body and enqueueGeneration is not called.",
      "AC2: A rejected text returns 422 PROMPT_REJECTED and the balance is unchanged.",
      "AC3: A duplicate jobId returns the original 202 payload and enqueues once.",
      "AC4: A successful run deducts exactly getMediaCreditCost once; failure, timeout, moderation and cancel deduct 0.",
      "AC5: If deduction fails after a successful run the job ends in error and no asset is delivered.",
      "AC6: userId always comes from the authenticated session, never the body, and a client credits field is ignored."
     ],
     "verify": [
      "V1: `cd apps/api && bun run type-check`",
      "V2: `cd apps/api && bun run test` (existing api tests stay green)",
      "V3: `bun run check`"
     ],
     "line": 224,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "CHANGES"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.2996,
     "costApprox": true,
     "elapsedMs": 54122697,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.11",
     "title": "Unit: media pipeline",
     "done": true,
     "kind": "unit",
     "depends": [
      "T0.10"
     ],
     "files": [
      "apps/api/src/lib/credit-deduction.ts",
      "apps/api/src/lib/media-input.ts",
      "apps/api/src/services/media-service.ts",
      "apps/api/src/routes/media.ts",
      "apps/api/src/queue/generation-queue.ts",
      "apps/api/src/queue/job-id.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Existing generation-service and queue tests are unchanged and green.",
      "AC3: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/lib/credit-deduction.test.ts src/lib/media-input.test.ts src/services/media-service.test.ts src/routes/media.test.ts src/queue/generation-queue.test.ts --coverage --coverage.include=src/lib/credit-deduction.ts --coverage.include=src/lib/media-input.ts --coverage.include=src/services/media-service.ts --coverage.include=src/routes/media.ts --coverage.include=src/queue/generation-queue.ts --coverage.reporter=text`",
      "V2: `cd apps/api && npx vitest run src/services/generation-service.test.ts src/queue/generation-worker.test.ts`"
     ],
     "line": 247,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.8212,
     "costApprox": true,
     "elapsedMs": 53870366,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.12",
     "title": "MediaAsset model, service and Cloudinary resource type (S0.4a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.10",
      "T0.11"
     ],
     "files": [
      "apps/api/src/models/media-asset.ts",
      "apps/api/src/services/media-asset-service.ts",
      "apps/api/src/utils/cloudinary.ts",
      "apps/api/src/services/cloudinary-service.ts",
      "packages/shared/src/types/api.ts"
     ],
     "gherkin": null,
     "do": "Copy `apps/api/src/models/image.ts` for the schema style. MediaAsset fields and indexes exactly per PLAN 1.6 (userId, type, feature, modelKey, title, url, publicId, resourceType, format, bytes, durationSec, width, height, posterUrl, transcriptUrl, prompt, lyrics, params without secrets, parentId, jobId unique sparse, creditsCharged, saved, createdAt; indexes {userId,createdAt}, {jobId} unique sparse, {parentId}). Add the resourceType option to uploadToCloudinary (read its signature first) and a delete helper using resource_type video, cascade-deleting child versions. countUserHistory counts images plus media against HISTORY_CAP; over the cap the asset is still delivered with saved false and is not persisted (G3). All reads and deletes are scoped by userId. Never expose the temporary Replicate URL after the Cloudinary copy. Tests are not written here: T0.14, T0.29 cover Unit: field mapping on create; Unit: cap boundary at cap-1, cap and cap+1; Unit: delete with mocked Cloudinary asserts resource_type and cascade; Unit: IDOR cases return 404; Unit: version creation parentId, 0 credits, cap count.",
     "spec": "R-INF-5, R-INF-14, R-EDIT-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A completed job produces a MediaAsset with the stored fields and creditsCharged set.",
      "AC2: Over HISTORY_CAP the job returns saved false with a URL and writes no row.",
      "AC3: Deleting an asset removes the Cloudinary resource with resource_type video and all child versions.",
      "AC4: Another user's asset id returns 404 for get, delete and version creation.",
      "AC5: A version sets parentId, charges 0 credits and counts toward the cap."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `bun run check`"
     ],
     "line": 260,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.8021,
     "costApprox": true,
     "elapsedMs": 53700323,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.13",
     "title": "Assets API and persist step in the job worker (S0.4b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.12"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-service.ts"
     ],
     "gherkin": null,
     "do": "Add GET /media/assets (type, cursor, limit), GET /media/assets/:id, DELETE /media/assets/:id and POST /media/assets/:id/versions (multipart exported file, 0 credits, sniffed and size capped later by the upload middleware) to routes/media.ts; these paths are new and not named in the spec (gap G2). All use requireAuth and userId scoping. In runMediaJob add the persist step in the SPEC R-INF-6 order, mirroring runGenerationJob (storeImageInDB, then updateAndGetUserCredits, then uploadToCloudinary): create the MediaAsset, deduct once, then copy the Replicate output to Cloudinary and update the asset url, then complete. Over the history cap nothing is persisted, the deduction still runs and the Replicate URL is returned with saved false, as for images. Verify Cloudinary size limits (A9) with a local fixture only. Tests are not written here: T0.11, T0.14, T0.17, T0.29 cover Unit: pagination cursor and type filter; E2E spec: generate fake audio then GET /media/assets lists it; Unit: 401 table for all four routes; Unit: result URL host is Cloudinary.",
     "spec": "R-INF-5, R-INF-14, R-EDIT-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: GET /media/assets returns the user's assets newest first with a stable cursor and filters by type.",
      "AC2: Generating a fake audio file makes it appear in the list.",
      "AC3: Unauthenticated requests return 401 on every assets route.",
      "AC4: A job result never contains the temporary Replicate URL once stored."
     ],
     "verify": [
      "V1: `cd apps/api && bun run type-check`",
      "V2: `cd apps/api && bun run test` (existing api tests stay green)",
      "V3: `bun run check`"
     ],
     "line": 283,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.4436,
     "costApprox": true,
     "elapsedMs": 53976125,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.14",
     "title": "Unit: assets",
     "done": true,
     "kind": "unit",
     "depends": [
      "T0.13"
     ],
     "files": [
      "apps/api/src/services/media-asset-service.ts",
      "apps/api/src/services/cloudinary-service.ts",
      "apps/api/src/utils/cloudinary.ts",
      "apps/api/src/routes/media.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/services/media-asset-service.test.ts src/services/cloudinary-service.test.ts src/utils/cloudinary.test.ts src/routes/media.test.ts --coverage --coverage.include=src/services/media-asset-service.ts --coverage.include=src/services/cloudinary-service.ts --coverage.include=src/utils/cloudinary.ts --coverage.include=src/routes/media.ts --coverage.reporter=text`"
     ],
     "line": 304,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.6438,
     "costApprox": true,
     "elapsedMs": 53506657,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.15",
     "title": "Upload middlewares, MIME sniffing and MediaUpload model (S0.5a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.13"
     ],
     "files": [
      "apps/api/src/middlewares/multer.ts",
      "apps/api/src/lib/media-upload.ts",
      "apps/api/src/models/media-upload.ts",
      "apps/api/src/middlewares/rate-limit.ts"
     ],
     "gherkin": null,
     "do": "Copy the multer instances in `apps/api/src/middlewares/multer.ts` (memoryUpload, referenceImagesUpload) and sttRateLimiter in rate-limit.ts. sniffMime is a hand-written magic-byte table (no file-type package, no new dependency): MP3 ID3 or 0xFFEx, WAV RIFF....WAVE, M4A MP4 MOV ftyp or qt, FLAC fLaC, WebM 1A45DFA3, PNG, JPEG, WEBP RIFF....WEBP, BMP. The extension is ignored. UPLOAD_PURPOSES maps each purpose to allowed MIMEs and a byte cap from media-limits.ts. Videos use disk storage, other purposes memory, with a hard per-purpose limit. MediaUpload fields per PLAN 1.6 with a 24 h TTL index on expiresAt; duration is taken from the Cloudinary response, never the client. uploadRateLimiter limits uploads per user. Tests are not written here: T0.17, T0.29 cover Unit: sniffMime table for every accepted type plus the renamed text file; Unit: oversize case per purpose; Unit: purpose/MIME mismatch case; Unit: mocked Cloudinary duration is stored and a client duration field is ignored; Unit: 401 and 429 cases.",
     "spec": "R-INF-17, R-INF-2",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A text file renamed .mp3 is rejected with a 400.",
      "AC2: A file over its purpose cap is rejected with 413 mapped copy and nothing is stored.",
      "AC3: A MIME that does not match the purpose is rejected.",
      "AC4: The stored durationSec equals the Cloudinary-reported duration, not a client value.",
      "AC5: An unauthenticated upload returns 401 and an upload burst over the limit returns 429."
     ],
     "verify": [
      "V1: `cd apps/api && bun run type-check`",
      "V2: `cd apps/api && bun run test` (existing api tests stay green)",
      "V3: `bun run check`"
     ],
     "line": 315,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.3153,
     "costApprox": true,
     "elapsedMs": 53660129,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.16",
     "title": "POST /media/uploads and expired-upload sweep (S0.5b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.15"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/utils/cronJobs.ts"
     ],
     "gherkin": null,
     "do": "Add POST /media/uploads (multipart file plus purpose) returning { uploadId, url, mime, bytes, durationSec?, width?, height? } for the authed user only; ids are what later routes accept, never client URLs. Add a cron sweep in cronJobs.ts that deletes the Cloudinary file of expired MediaUpload rows and the row. Uploads are deleted after job success unless the voice sample is kept. Tests are not written here: T0.11, T0.14, T0.17, T0.29 cover E2E spec: upload sample.mp3 and read the response fields; E2E spec: renamed upload returns 400; Unit: sweep with a mocked Cloudinary asserts deletes only for expired rows.",
     "spec": "R-INF-17",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Uploading sample.mp3 returns an uploadId and a durationSec.",
      "AC2: Uploading sample.mp3 renamed .png is rejected.",
      "AC3: The sweep removes the Cloudinary file and row of each expired upload and leaves unexpired ones."
     ],
     "verify": [
      "V1: `cd apps/api && bun run type-check`",
      "V2: `cd apps/api && bun run test` (existing api tests stay green)",
      "V3: `bun run check`"
     ],
     "line": 337,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "CHANGES",
        "security": "CHANGES"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.9278,
     "costApprox": true,
     "elapsedMs": 53384327,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.17",
     "title": "Unit: uploads",
     "done": true,
     "kind": "unit",
     "depends": [
      "T0.16"
     ],
     "files": [
      "apps/api/src/lib/media-upload.ts",
      "apps/api/src/middlewares/multer.ts",
      "apps/api/src/utils/cronJobs.ts",
      "apps/api/src/routes/media.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/lib/media-upload.test.ts src/middlewares/multer.test.ts src/utils/cronJobs.test.ts src/routes/media.test.ts --coverage --coverage.include=src/lib/media-upload.ts --coverage.include=src/middlewares/multer.ts --coverage.include=src/utils/cronJobs.ts --coverage.include=src/routes/media.ts --coverage.reporter=text`"
     ],
     "line": 357,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.0183,
     "costApprox": true,
     "elapsedMs": 53169887,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.18",
     "title": "Header menus: Video, Audio and Tools dropdowns plus mobile accordion (S0.6a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.2"
     ],
     "files": [
      "apps/web/src/components/Header/NavMenuGroup.vue",
      "apps/web/src/components/Header/NavMobileAccordion.vue",
      "apps/web/src/components/Header/NavTabs.vue",
      "apps/web/src/components/Header/AppHeader.vue",
      "apps/web/src/utils/dashboardRoutes.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look (no gradient hero, no emoji icons, no uniform rounded-card grid); obey Standing UI rules in the header. Design intent (PLAN 1.12): the header reads as Image, Video, Audio with a caret, Tools with a caret, with no layout shift when the credits chip grows. Read NavTabs.vue, AppHeader.vue and primitives/Popover.vue first. NavMenuGroup wraps Popover: opens on click or Enter, Space or ArrowDown, ArrowUp and ArrowDown move, Home and End jump, Enter activates, Escape closes and returns focus to the trigger, Tab closes, hover never opens; each item is a 16 px icon, a label and a one-line muted description truncated to one line. Audio items: Song, Music, Speech. Tools items: Image watermark, Video watermark, Autocaption, Sketch to image. NavMobileAccordion (below 768 px, inside the existing mobile menu) has items at least 44 px. Add the new route names to APP*SURFACE and APP_SURFACE_TAB so Audio highlights on any /audio/* and Tools on any /tools/\\_. The Image tab keeps its destination and behaviour. Tests are not written here: T0.28, T0.29 cover Component: NavMenuGroup open keys; Component: arrows, Home, End, Enter, hover-does-not-open; Component: Escape focus return and Tab close; Unit: tabFromRouteName returns Audio and Tools for each new route name; Component: existing NavTabs and AppHeader tests unchanged for the Image tab; E2E spec: 375px viewport accordion item heights and scrollWidth; Component: truncation class asserted; T0.29 chip-growth shift check; Component: aria attributes and reduced-motion media query.",
     "spec": "R-INF-10, R-QOL-2, R-QOL-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The header shows Image, Video, Audio and Tools, and Audio and Tools show a caret.",
      "AC2: Pressing Enter on Audio opens a menu with Song, Music and Speech; ArrowDown moves through items, Home and End jump, Enter navigates.",
      "AC3: Escape closes the menu and focus returns to the Audio trigger; Tab closes it; hovering never opens it.",
      "AC4: On /audio/music the Audio tab is highlighted; on /tools/autocaption the Tools tab is highlighted.",
      "AC5: The Image tab still opens the create page exactly as before.",
      "AC6: At 375px width the menu is an accordion whose items are at least 44px high and there is no horizontal scroll.",
      "AC7: The dropdown description line truncates to one line and the credits chip growing does not move the tabs.",
      "AC8: Every interactive element has a visible focus ring and an accessible name; keyboard alone reaches and operates it. With prefers-reduced-motion the slide, tween and shimmer animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /create path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 368,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.8206,
     "costApprox": true,
     "elapsedMs": 52972444,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.19",
     "title": "New routes, StudioShell, StudioPlaceholder and studio accent tokens (S0.6b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.18"
     ],
     "files": [
      "apps/web/src/router/index.ts",
      "apps/web/src/components/Studio/StudioShell.vue",
      "apps/web/src/components/Studio/StudioPlaceholder.vue",
      "apps/web/tailwind.semantic-plugin.js"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look (no gradient hero, no emoji icons, no uniform rounded-card grid); obey Standing UI rules in the header. Design intent: each studio gets one accent (Song warm, Music cool, Speech teal, Video and Tools neutral or brand) as tokens in light and dark, and the placeholder is an honest empty state, not a fake page (gap G8). Add lazy routes /video, /audio/song, /audio/music, /audio/speech, /tools/image-watermark, /tools/video-watermark, /tools/autocaption, /tools/sketch, guarded exactly like the create route. Until a later task ships a page its route renders StudioPlaceholder with copy like \"Song studio is coming soon\" and a link back to Image; each shipping task replaces its route and deletes nothing else. StudioShell is the two-column desktop layout (compose column up to about 560 px, sticky result column) and single column on mobile. Add --studio-accent token pairs with AA contrast in both themes and no hard-coded hex. Tests are not written here: T0.4, T0.7, T0.11, T0.14, T0.17, T0.27, T0.28, T0.29 cover E2E spec: visit all 8 routes signed in; E2E spec: signed-out visit redirects; Component: StudioPlaceholder renders the copy and the link; Unit: token map has distinct accent values per route class; Unit: contrast helper over the token pairs; E2E spec: 375px scrollWidth check on a placeholder route.",
     "spec": "R-INF-10, R-QOL-2, R-QOL-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Each of the 8 new paths loads without error for a signed-in user.",
      "AC2: An unauthenticated visit to each new path redirects to sign-in like the create route.",
      "AC3: The Song placeholder shows the text \"Song studio is coming soon\" and a link back to Image.",
      "AC4: On /audio/song, /audio/music and /tools/sketch the root element exposes different --studio-accent values.",
      "AC5: Every new token pair meets 4.5:1 contrast in light and dark.",
      "AC6: At 375px width the screen has no horizontal scroll and every tap target is at least 44px high. Every interactive element has a visible focus ring and an accessible name; keyboard alone reaches and operates it. With prefers-reduced-motion the slide, tween and shimmer animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/song path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 393,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "ui",
      "security"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.657,
     "costApprox": true,
     "elapsedMs": 19445905,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.20",
     "title": "Player store with one shared audio element (S0.7a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.19"
     ],
     "files": [
      "apps/web/src/stores/player.ts",
      "apps/web/src/components/Audio/TimeCode.vue",
      "apps/web/src/components/Audio/PlayButton.vue"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look (no gradient hero, no emoji icons, no uniform rounded-card grid); obey Standing UI rules in the header. Copy the Pinia style of `apps/web/src/stores/generate.ts`. The store owns exactly one HTMLAudioElement created lazily on the first user gesture and held outside any route component (gap G7). State: current track, status idle|loading|playing|paused|blocked, currentTime, volume, muted, rate, loop. Actions: play, toggle, seek, close, setRate, setLoop. A NotAllowedError sets status blocked (a single \"Tap to play\" affordance, never an error toast); starting a track pauses the previous one by construction; register Media Session metadata and handlers; remove listeners on track change and close. TimeCode shows tabular numerals; PlayButton is a 44 px control with aria-pressed. A video element calls close() first so audio and video never overlap. Tests are not written here: T0.27, T0.29 cover Unit: fake element, switching track; Unit: NotAllowedError path; Unit: close resets; Unit: navigator.mediaSession mocked and asserted; Unit: add/remove listener counts balanced over 50 switches; Component: PlayButton and TimeCode aria and class assertions.",
     "spec": "R-INF-11, R-INF-12, R-QOL-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Playing track B pauses track A and only one element exists.",
      "AC2: A rejected play() with NotAllowedError sets status blocked and shows Tap to play, not an error toast.",
      "AC3: close() stops playback and resets the current track.",
      "AC4: Media Session metadata and play, pause, seek handlers are set while a track plays.",
      "AC5: Repeated track changes leave no accumulating listeners.",
      "AC6: PlayButton is keyboard operable, exposes aria-pressed, and TimeCode uses tabular numerals."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: Visual check: no page mounts this yet; the agent-browser pass happens in T0.21"
     ],
     "line": 416,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "logic",
      "ui"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.567,
     "costApprox": true,
     "elapsedMs": 19445905,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.21",
     "title": "MiniPlayer, AudioPlayer and TrackCard mounted in App.vue (S0.7b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.20"
     ],
     "files": [
      "apps/web/src/components/Audio/MiniPlayer.vue",
      "apps/web/src/components/Audio/AudioPlayer.vue",
      "apps/web/src/components/Audio/TrackCard.vue",
      "apps/web/src/App.vue"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look (no gradient hero, no emoji icons, no uniform rounded-card grid); obey Standing UI rules in the header. Design intent (PLAN 1.12): a 56 px bar that slides up in 200 ms ease-out, title with ellipsis, a keyboard-operable scrubber, a close button that ends playback, and it never autoplays. A canvas sparkline from precomputed peaks is used; wavesurfer is not loaded here. It survives route changes by living in App.vue and sets the CSS variable --mini-player-h so sticky action bars stack above it; on mobile it sits above the safe-area inset. Only the active card mounts an AudioPlayer (no N+1 players). Read App.vue first and merge, never overwrite the working-tree edits. Tests are not written here: T0.4, T0.7, T0.11, T0.14, T0.17, T0.27, T0.28, T0.29 cover E2E spec: play from a card, navigate, assert persistence and position; Component: MiniPlayer keys Space, arrows, Escape; Component: close button; Component: no play() call on mount; Component: reduced-motion class assertion; E2E spec at 375px: bar bottom offset and the CSS variable; Component: aria-labels and scrubber role slider.",
     "spec": "R-INF-11, R-INF-12, R-QOL-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: After play, the mini-player appears with the title and a time readout and persists after navigating to another route at the same position.",
      "AC2: Space toggles, ArrowLeft and ArrowRight seek and Escape closes it when focus is inside the mini-player.",
      "AC3: The close button ends playback and removes the bar.",
      "AC4: The bar never starts playing without a user gesture.",
      "AC5: With prefers-reduced-motion there is no slide animation.",
      "AC6: At 375px width the bar is above the safe-area inset and --mini-player-h is set and cleared on close.",
      "AC7: Every interactive element has a visible focus ring and an accessible name; keyboard alone reaches and operates it."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /assets path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 439,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.8955,
     "costApprox": true,
     "elapsedMs": 52972444,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.22",
     "title": "History store and UI for media (S0.8a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.21",
      "T0.13"
     ],
     "files": [
      "apps/web/src/stores/history.ts",
      "apps/web/src/components/History/History.vue",
      "apps/web/src/components/History/FeatureIcon.vue",
      "apps/web/src/components/History/Filter.vue",
      "apps/web/src/components/History/ImageActionButtons.vue"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look (no gradient hero, no emoji icons, no uniform rounded-card grid); obey Standing UI rules in the header. Read stores/history.ts and the History components first; the existing image tests must stay green. Make items a discriminated union ({kind:'image'} or {kind:'media'}), load media from GET /media/assets, merge by createdAt and group with the existing groupByDate. Filter chips: All, Images, Song, Music, Speech, Video, Tools (sketch results are normal images and show under Images, G11). Audio items render a TrackCard with the player, video items a poster with native video, with download and delete (delete confirms through the existing delete dialog convention). Empty filter shows NoResults. Tests are not written here: T0.27, T0.29 cover Unit: merge, sort and group; Unit and component: filter chips; Component: audio card player and video poster; Component: delete confirm flow; Component: NoResults for an empty filter; E2E spec: 375px History scrollWidth and tap targets.",
     "spec": "R-INF-14, R-QOL-1",
     "filesDeclared": true,
     "acceptance": [
      "AC1: History lists images and media newest first under date groups.",
      "AC2: Choosing the Song chip shows only song assets; choosing Images shows only images.",
      "AC3: An audio item shows a play control and plays through the shared player; a video item shows a poster.",
      "AC4: Deleting a media item asks for confirmation then removes it and shows the existing success state.",
      "AC5: A filter with no results shows NoResults with its existing copy.",
      "AC6: Existing image History behaviour and tests are unchanged.",
      "AC7: At 375px width the screen has no horizontal scroll and every tap target is at least 44px high. Every interactive element has a visible focus ring and an accessible name; keyboard alone reaches and operates it."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/History src/stores/history.test.ts`",
      "V2: `cd apps/web && bun run test` (existing web tests stay green)",
      "V3: `bun run check`",
      "V4: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /assets path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 463,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "ui",
      "logic",
      "security"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "CHANGES",
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "code": "PASS",
        "ui": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.3595,
     "costApprox": true,
     "elapsedMs": 52549071,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.23",
     "title": "useMediaJob and useMediaCost with 402 mapping (S0.8b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.22",
      "T0.2"
     ],
     "files": [
      "apps/web/src/composables/useMediaJob.ts",
      "apps/web/src/composables/useMediaCost.ts",
      "apps/web/src/utils/generationCredits.ts"
     ],
     "gherkin": null,
     "do": "Copy how `apps/web/src/stores/generate.ts` consumes GET /generate/progress. useMediaJob is the one state machine idle, submitting, queued, running(stage, elapsedMs), succeeded(asset), failed(noCharge reason), rejected, insufficient. It generates the client jobId, disables submit from click until the 202, exposes submit(path, body) and retry() (same inputs, new jobId); cancel is not offered. mapMediaError maps 400, 402, 422, 429, 502 and noCharge reasons to the copy of SPEC section 10 and a 402 opens LowCreditsDialog, never a toast. useMediaCost wraps getMediaCreditCost reactively and flags estimated for Minimax TTS and audio-driven P-Video. generationCredits.ts keeps canAffordGeneration as the only affordability helper accepting a precomputed cost; no second cost helper exists. All surfaces use this one composable and never write their own SSE or fetch code. Tests are not written here: T0.27, T0.28, T0.29 cover Unit: duplicate click; Unit: 402 mapping and dialog call; Unit: noCharge copy; Unit: retry jobId differs; Unit: useMediaCost parity and estimated flag.",
     "spec": "R-INF-6a, R-INF-7, R-INF-8, R-QOL-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A second click while submitting does nothing and is disabled.",
      "AC2: A 402 response sets insufficient and opens LowCreditsDialog with required and available shown.",
      "AC3: A noCharge failure sets failed with copy that includes \"No credits were used.\".",
      "AC4: retry() reuses the inputs and sends a new jobId.",
      "AC5: useMediaCost returns the same value as getMediaCreditCost and estimated true for Minimax speech.",
      "AC6: canAffordGeneration accepts a precomputed cost and existing callers still pass their tests."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/utils/generationCredits.test.ts`",
      "V2: `cd apps/web && bun run test` (existing web tests stay green)",
      "V3: `bun run check`"
     ],
     "line": 488,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.9388,
     "costApprox": true,
     "elapsedMs": 52549072,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.24",
     "title": "Shared studio view states and action bar (S0.8c)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.23",
      "T0.19"
     ],
     "files": [
      "apps/web/src/components/Studio/JobProgress.vue",
      "apps/web/src/components/Studio/ResultCard.vue",
      "apps/web/src/components/Studio/StudioEmptyState.vue",
      "apps/web/src/components/Studio/StudioErrorState.vue",
      "apps/web/src/components/Studio/StudioActionBar.vue"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look (no gradient hero, no emoji icons, no uniform rounded-card grid); obey Standing UI rules in the header. Design intent: calm, specific states with one useful action each. JobProgress shows stage text, elapsed time as tabular numerals and \"You can leave this page; it will appear in History.\". StudioErrorState says what happened, \"No credits were used.\" and one next step. StudioEmptyState offers one example action, never an illustration only. ResultCard moves focus to Play on success and shows a toast and scrolls into view; when saved is false it shows the existing UnsavedResultNotice. StudioActionBar shows CreditCostBadge with AnimatedCounter, the Generate button and a disabled-reason line, is sticky at the bottom on mobile above --mini-player-h, and opens the existing ConfirmChainActionDialog convention when cost is at least EXPENSIVE_JOB_CREDITS with default focus on Cancel. One implementation for all surfaces. Tests are not written here: T0.28, T0.29 cover Component: JobProgress with fake timers; Component: error state text and button count; Component: empty state action emits; Component: focus after success; Component: unsaved notice; Component: threshold at 149 and 150 and focused element; E2E spec: reason line and 375px stacking; Component: reduced-motion and aria assertions.",
     "spec": "R-INF-5, R-INF-6a, R-INF-8, R-VID-4, R-QOL-1, R-QOL-2, R-QOL-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: JobProgress shows the stage label, an elapsed time that updates each second and the leave-page sentence.",
      "AC2: StudioErrorState contains \"No credits were used.\" and exactly one primary next-step button.",
      "AC3: StudioEmptyState renders a button that runs its example action.",
      "AC4: On success focus moves to the Play control and a success toast appears.",
      "AC5: With saved false the UnsavedResultNotice is shown.",
      "AC6: A cost of 150 or more opens the confirm dialog with default focus on Cancel; below 150 it does not.",
      "AC7: A disabled Generate always shows a reason line and the sticky bar sits above the mini-player at 375px width.",
      "AC8: With prefers-reduced-motion the slide, tween and shimmer animations are disabled. Every interactive element has a visible focus ring and an accessible name; keyboard alone reaches and operates it."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: Visual check: no page mounts this yet; the agent-browser pass happens in T1.3"
     ],
     "line": 511,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.9191,
     "costApprox": true,
     "elapsedMs": 52549072,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.25",
     "title": "Shortcuts, shortcuts popover and drafts (S0.9)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.21",
      "T0.23"
     ],
     "files": [
      "packages/shared/src/models/media-shortcuts.ts",
      "apps/web/src/composables/useGlobalShortcuts.ts",
      "apps/web/src/components/Studio/ShortcutsPopover.vue",
      "apps/web/src/composables/useMediaDraft.ts",
      "apps/web/src/components/Header/AppHeader.vue"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look (no gradient hero, no emoji icons, no uniform rounded-card grid); obey Standing UI rules in the header. Copy the draft pattern of `apps/web/src/composables/useComposerPersistence.ts`. MEDIA_SHORTCUTS lists play-pause Space, seek-back ArrowLeft, seek-forward ArrowRight, mute M, loop L, region-start [, region-end ], generate Mod+Enter, undo Mod+Z, redo Mod+Shift+Z, close Escape, help ?. isTypingContext suppresses every single-key shortcut in input, textarea, contenteditable (including the TipTap .ProseMirror) and while an AppModal is open; Mod+Enter is exempt. ShortcutsPopover renders the list from the constant (never hand-written) and opens with ? or a header icon button. useMediaDraft keeps shared fields prompt, lyrics, text and durationSec in localStorage inside try/catch; mapDraftToModel returns values, unused and overLimit, shows a visible \"Not used by <model>\" tag for unused fields and flags over-limit text without ever truncating it. Tests are not written here: T0.27, T0.29 cover Unit: uniqueness test; Unit: typing-context table including .ProseMirror and open modal, and Mod+Enter exemption; Component: popover opens on ? and lists the constant; Unit: mapDraftToModel table including 10 characters over the limit; Unit: storage-throwing stub; E2E spec: Space toggles the active player and Escape closes the popover.",
     "spec": "R-INF-13, R-INF-15",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every key in MEDIA_SHORTCUTS is unique and none collides with a key already registered in useGlobalShortcuts.",
      "AC2: Pressing Space while focus is in a textarea or .ProseMirror does not toggle the player; Mod+Enter still fires there.",
      "AC3: Pressing ? opens the popover listing every shortcut and Escape closes it.",
      "AC4: mapDraftToModel keeps shared values, marks unused fields and flags over-limit text and never shortens it.",
      "AC5: A localStorage failure leaves the draft working in memory without an uncaught error.",
      "AC6: At 375px width the screen has no horizontal scroll and every tap target is at least 44px high. Every interactive element has a visible focus ring and an accessible name; keyboard alone reaches and operates it."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/web && bun run test` (existing web tests stay green)",
      "V4: `bun run check`",
      "V5: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/song path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 536,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "CHANGES",
        "ui": "PASS",
        "code": "CHANGES"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "code": "PASS",
        "ui": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "code": "PASS",
        "ui": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.4045,
     "costApprox": true,
     "elapsedMs": 52549072,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.26",
     "title": "Docs, pricing list and FAQ for media models (S0.10)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T0.3"
     ],
     "files": [
      "docs/MODEL_ONBOARDING.md",
      "scripts/check-model-docs.mjs",
      "apps/web/src/components/Pricing/PricingModelCosts.vue",
      "apps/web/src/utils/constants.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look (no gradient hero, no emoji icons, no uniform rounded-card grid); obey Standing UI rules in the header. Update docs/MODEL_ONBOARDING.md with the media section (media.inputs, pricing, media-input.ts, FIXED_INPUTS, pricesVerifiedOn) and extend the check script rules for kind. PricingModelCosts lists media models with credits read from getMediaCreditCost, never typed, grouped by kind with the unit (per file, per second, per 1K characters, per run). Add the media FAQs from SPEC section 9 to the existing FAQ constants. Read the check script and the component first. Tests are not written here: T0.4, T0.7, T0.11, T0.14, T0.17, T0.27, T0.28, T0.29 cover Unit: pricing list equals getMediaCreditCost for every model (PricingModelCosts test); `cd apps/web && npx vitest run src/components/Pricing/PricingModelCosts.test.ts` and E2E spec 375px check.",
     "spec": "R-INF-18, R-INF-19",
     "filesDeclared": true,
     "acceptance": [
      "AC1: bun run check:model-docs passes and fails if a media entry lacks pricing.",
      "AC2: The pricing list shows one row per media model whose number equals getMediaCreditCost for that model.",
      "AC3: The pricing page shows the media FAQs and has no horizontal scroll at 375px width."
     ],
     "verify": [
      "V1: `bun run check:model-docs` plus a negative run on a temporary registry edit that is reverted",
      "V2: `cd apps/web && bun run test` (existing web tests stay green)",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /pricing path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 561,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.8262,
     "costApprox": true,
     "elapsedMs": 18413534,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.27",
     "title": "Unit: player, history, job, drafts and shortcuts",
     "done": true,
     "kind": "unit",
     "depends": [
      "T0.26",
      "T0.25",
      "T0.24"
     ],
     "files": [
      "apps/web/src/stores/player.ts",
      "apps/web/src/stores/history.ts",
      "apps/web/src/composables/useMediaJob.ts",
      "apps/web/src/composables/useMediaDraft.ts",
      "apps/web/src/composables/useGlobalShortcuts.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Existing history and shortcut tests remain unchanged and green.",
      "AC3: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/stores/player.test.ts src/stores/history.test.ts src/composables/useMediaJob.test.ts src/composables/useMediaDraft.test.ts src/composables/useGlobalShortcuts.test.ts --coverage --coverage.include=src/stores/player.ts --coverage.include=src/stores/history.ts --coverage.include=src/composables/useMediaJob.ts --coverage.include=src/composables/useMediaDraft.ts --coverage.include=src/composables/useGlobalShortcuts.ts --coverage.reporter=text`",
      "V2: `cd apps/web && npx vitest run src/stores src/composables`"
     ],
     "line": 580,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.152,
     "costApprox": true,
     "elapsedMs": 51768916,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.28",
     "title": "Unit: credits, cost and route helpers, studio components",
     "done": true,
     "kind": "unit",
     "depends": [
      "T0.27"
     ],
     "files": [
      "apps/web/src/utils/generationCredits.ts",
      "apps/web/src/composables/useMediaCost.ts",
      "apps/web/src/utils/dashboardRoutes.ts",
      "apps/web/src/components/Studio/StudioActionBar.vue",
      "apps/web/src/components/Header/NavMenuGroup.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Component tests cover the nav keys, studio states, mini-player, placeholder and pricing list cases named in the earlier tasks.",
      "AC3: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/utils/generationCredits.test.ts src/composables/useMediaCost.test.ts src/utils/dashboardRoutes.test.ts src/components/Studio/StudioActionBar.test.ts src/components/Header/NavMenuGroup.test.ts --coverage --coverage.include=src/utils/generationCredits.ts --coverage.include=src/composables/useMediaCost.ts --coverage.include=src/utils/dashboardRoutes.ts --coverage.include=src/components/Studio/StudioActionBar.vue --coverage.include=src/components/Header/NavMenuGroup.vue --coverage.reporter=text`",
      "V2: `cd apps/web && npx vitest run src/components/Audio src/components/Studio src/components/Header`"
     ],
     "line": 593,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.2031,
     "costApprox": true,
     "elapsedMs": 51529124,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.29",
     "title": "E2E: media API pipeline, uploads and assets",
     "done": true,
     "kind": "e2e",
     "depends": [
      "T0.28",
      "T0.17",
      "T0.14"
     ],
     "files": [
      "apps/web/e2e/scenarios/media-pipeline.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/media-pipeline.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with MediaGenerationStub and the e2e user fake client; the failure variant uses readCredits from support/proPerksSeed.ts to prove the balance is unchanged. Credit deduction on success is covered by the T0.11 unit tests.",
      "AC2: paidCallGuard stays on and no real Replicate, Dodo or email call is made.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/media-pipeline.spec.ts --repeat-each=3`",
      "V2: `cd apps/web && bunx playwright test e2e/qa/media-pipeline.spec.ts --grep @critical` shows the guard self-test scenario passing"
     ],
     "line": 606,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "FAIL"
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
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.9835,
     "costApprox": true,
     "elapsedMs": 51379483,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.30",
     "title": "E2E: header menus, routes and mini-player persistence",
     "done": true,
     "kind": "e2e",
     "depends": [
      "T0.29"
     ],
     "files": [
      "apps/web/e2e/scenarios/media-nav-player.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/media-nav-player.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass using the media stub and sample.mp3 as the audio source.",
      "AC2: No test starts the server and no un-intercepted paid call occurs.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/media-nav-player.spec.ts --repeat-each=3`",
      "V2: `cd apps/web && bunx playwright test e2e/qa/media-nav-player.spec.ts --grep @critical`"
     ],
     "line": 622,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.919,
     "costApprox": true,
     "elapsedMs": 2987694,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    },
    {
     "id": "T0.31",
     "title": "Gate: Phase 0 shared infrastructure",
     "done": true,
     "kind": "gate",
     "depends": [
      "T0.30"
     ],
     "files": [
      "agent_docs/intent/landing-and-credit-economics.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint, the full unit suites and both new QA specs pass.",
      "AC2: check:model-docs passes and the guard self-test proves zero un-intercepted paid calls.",
      "AC3: Existing image generation and History tests are unchanged and green."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `bun run check:model-docs`",
      "V4: `cd apps/web && bunx playwright test e2e/qa/media-pipeline.spec.ts e2e/qa/media-nav-player.spec.ts --repeat-each=2`"
     ],
     "line": 637,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T02:00:53.725Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.5464,
     "costApprox": true,
     "elapsedMs": 35815836,
     "summary": [
      "T0.9: MEDIA_PROMPT_MAX_CHARS moved to packages/shared/src/models/media-limits.ts; schemas/media.ts imports it; schemas/index.ts no longer re-exports it (still exported via models). shared tests 259/25",
      "T0.13: MAX_VERSION_FILE_BYTES (50 MB) moved to media-limits.ts, imported in apps/api/src/routes/media.ts. api route tests 252/252.",
      "T0.25: useGlobalShortcuts() moved from Dashboard.vue to App.vue. agent-browser on /audio/song: ? opens popover, Escape closes. Shot T0.25-audio-song-popover registered. Web tests 70/70. vue-tsc errors"
     ]
    }
   ],
   "verified": 31,
   "total": 31,
   "complete": true,
   "costUsd": 28.3428,
   "elapsedMs": 55632876
  },
  {
   "id": "1",
   "name": "Song studio",
   "startLine": 654,
   "endLine": 985,
   "adds": "Users write lyrics (or have AI draft them), pick a style and generate a full song with Minimax Music 2.6, then play it, edit the waveform and export a new version. Every result lands in History.",
   "tryInUi": [
    "Open Audio then Song",
    "type a style and lyrics and press Generate",
    "play the result and trim a region",
    "export an MP3 and find it in History"
   ],
   "checkpoint": {
    "title": "Checkpoint 1",
    "line": 984,
    "items": [
     "song generation, lyrics help, waveform editor and export verified by unit tests and the mocked song and editor QA specs."
    ]
   },
   "tasks": [
    {
     "id": "T1.1",
     "title": "Record wavesurfer.js approval (approved)",
     "done": true,
     "kind": "dod",
     "depends": [],
     "files": [
      "agent_docs/media-studio/APPROVALS.md"
     ],
     "gherkin": null,
     "do": "Record in APPROVALS.md that the owner approved wavesurfer.js (waveform rendering, regions, timeline) on 2026-11-16; no question is asked. Do not install anything in this task; the waveform task installs it.",
     "spec": "R-EDIT-1",
     "filesDeclared": true,
     "acceptance": [
      "AC1: APPROVALS.md has a wavesurfer.js line marked approved 2026-11-16.",
      "AC2: No package.json or lockfile changed in this task."
     ],
     "verify": [
      "V1: `grep -n wavesurfer agent_docs/media-studio/APPROVALS.md`",
      "V2: `git diff --name-only -- package.json apps/web/package.json bun.lock` returns nothing from this task"
     ],
     "line": 659,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.198,
     "costApprox": true,
     "elapsedMs": 4138799,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.2",
     "title": "Song endpoint, schema and processSong (S1.1a)",
     "done": true,
     "kind": "implementation",
     "depends": [],
     "files": [
      "packages/shared/src/schemas/media.ts",
      "apps/api/src/lib/media-input.ts",
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-service.ts"
     ],
     "gherkin": null,
     "do": "Copy processMusic and the music route from Phase 0. Song body: prompt (style, 10 to 300 characters), lyrics (10 to 3000 characters, must contain at least one line), audioFormat is never sent, jobId. Limits come from media-limits.ts named constants. Safety-check both prompt and lyrics. Credit cost is per file via getMediaCreditCost, charged once on success. The 402 pre-check, 422 and jobId idempotency follow the exact route order of the music route. Tests are not written here: T1.5, T1.6 cover Unit (song unit task): schema boundaries 9, 10, 3000, 3001; Unit: safety rejection of lyrics; Unit: 402 body and enqueue not called; Unit: deduct once on success, zero on failure.",
     "spec": "R-SONG-1, R-SONG-2, R-SONG-4, R-INF-4, R-INF-6a",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A valid song body returns 202 and a completed job stores a MediaAsset of type audio and feature SONG.",
      "AC2: Lyrics shorter than 10 characters return a field-level 400 on lyrics.",
      "AC3: Prompt or lyrics that fail safety return 422 PROMPT_REJECTED and nothing is queued.",
      "AC4: An insufficient balance returns 402 { code, required, available } before queueing.",
      "AC5: A successful job deducts the fixed per-file credits exactly once; a failed one deducts nothing."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `bun run check`"
     ],
     "line": 672,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.6577,
     "costApprox": true,
     "elapsedMs": 4116584,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.3",
     "title": "Song studio page: compose and generate (S1.1b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T1.2"
     ],
     "files": [
      "apps/web/src/pages/SongStudio.vue",
      "apps/web/src/components/Song/SongComposer.vue",
      "apps/web/src/components/Song/LyricsEditor.vue",
      "apps/web/src/components/Song/StylePresets.vue",
      "apps/web/src/router/index.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Design intent (PLAN 1.12): the lyrics field is the hero, set like a notebook page with a structure ruler for [Verse] and [Chorus] tags, with style chips as quick starts. Copy the page layout of the create page and compose only from the Phase 0 studio components; do not write new progress, error or action-bar markup. Replace the Song route placeholder. Empty state copy: \"Describe a style and paste or write lyrics to make your first song.\" with 3 example song ideas (SONG_EXAMPLE_IDEAS, a named constant in StylePresets.vue) that each fill genre, mood and a lyrics seed, plus one sample audio loop played through the shared player when SONG_SAMPLE_LOOP_URL is set (gap G14: hidden until the owner supplies it); no illustration. Character counters show used of max and turn to the danger token at the limit. Generate is disabled with a reason line until prompt and lyrics are valid. Split the page into the components named in Files; each stays under about 150 lines. Tests are not written here: T1.4, T1.6 cover Component (song web unit task): disabled reasons and counters; Component: example button fill; Component: Mod+Enter and double-click guard; E2E song spec: success, 402 and failure variants; Unit: draft restore via useMediaDraft; E2E song spec at 375px: scrollWidth and button height, plus keyboard-only run; Component: reduced-motion class.",
     "spec": "R-SONG-1, R-SONG-2, R-SONG-3, R-SONG-8, R-INF-8, R-INF-13, R-QOL-1, R-QOL-2, R-QOL-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The empty state shows the exact copy and 3 example ideas, each filling style and lyrics; the sample loop row appears only when SONG_SAMPLE_LOOP_URL is set.",
      "AC2: Generate is disabled with a visible reason until prompt has at least 10 characters and lyrics at least 10.",
      "AC3: Counters read like 12/300 and 40/3000 and change colour at the limit.",
      "AC4: Pressing Mod+Enter submits when valid; the button shows the credit cost and a second click while submitting does nothing.",
      "AC5: Progress, success with Play focused, 402 dialog and error with \"No credits were used.\" each render using the shared studio components.",
      "AC6: The draft is restored after a reload.",
      "AC7: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/song path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 694,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ui": "PASS",
        "ux": "PASS",
        "code": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "code": "PASS",
        "ui": "PASS",
        "ux": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.8531,
     "costApprox": true,
     "elapsedMs": 21087410,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.4",
     "title": "Unit: Song composer and draft mapping",
     "done": true,
     "kind": "unit",
     "depends": [
      "T1.3"
     ],
     "files": [
      "apps/web/src/components/Song/SongComposer.vue",
      "apps/web/src/components/Song/LyricsEditor.vue",
      "apps/web/src/components/Song/StylePresets.vue",
      "apps/web/src/composables/useMediaDraft.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Song src/composables/useMediaDraft.test.ts --coverage --coverage.include=src/components/Song/SongComposer.vue --coverage.include=src/components/Song/LyricsEditor.vue --coverage.include=src/components/Song/StylePresets.vue --coverage.include=src/composables/useMediaDraft.ts --coverage.reporter=text`"
     ],
     "line": 718,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.3721,
     "costApprox": true,
     "elapsedMs": 20880500,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.5",
     "title": "Unit: Song route and service",
     "done": true,
     "kind": "unit",
     "depends": [
      "T1.4"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-service.ts",
      "apps/api/src/lib/media-input.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/routes/media.test.ts src/services/media-service.test.ts src/lib/media-input.test.ts --coverage --coverage.include=src/routes/media.ts --coverage.include=src/services/media-service.ts --coverage.include=src/lib/media-input.ts --coverage.reporter=text`"
     ],
     "line": 729,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.3799,
     "costApprox": true,
     "elapsedMs": 3909673,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.6",
     "title": "E2E: Song studio",
     "done": true,
     "kind": "e2e",
     "depends": [
      "T1.5"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/song.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with MediaGenerationStub and the e2e user fake client; no un-intercepted paid call occurs.",
      "AC2: Each scenario that spends credits asserts the balance through readCredits.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/song.spec.ts --repeat-each=3`"
     ],
     "line": 740,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.6359,
     "costApprox": true,
     "elapsedMs": 3909673,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.7",
     "title": "Lyrics generator service and POST /prompt/lyrics (S1.2a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T1.2"
     ],
     "files": [
      "apps/api/src/lib/lyrics-generator.ts",
      "apps/api/src/routes/prompt.ts",
      "packages/shared/src/schemas/media.ts",
      "apps/api/src/middlewares/rate-limit.ts"
     ],
     "gherkin": null,
     "do": "Copy the enhance route and rate limiter pattern of routes/prompt.ts and rate-limit.ts. One endpoint POST /prompt/lyrics with mode full, section or condense (gap G12). Full drafts lyrics from a theme; section rewrites one tagged section; condense fits lyrics into the limit without cutting mid-line. Free to the user (no credits), per-user daily limit LYRICS_DAILY_LIMIT = 30, timeout LYRICS_TIMEOUT_MS = 20000, output safety-checked and length-clamped to the song limit. Keep the real generator and the e2e fake branch in the same file; the fake branch returns fixed sections for e2e users only. Never log lyrics text. Tests are not written here: T1.9, T1.10 cover Unit (lyrics unit task): three modes with an injected fake model; Unit: condense boundary at limit and limit+1; Unit: 30 ok then 429 on the 31st; Unit: injected slow model gives 504; Unit: unsafe output 422; Unit: 401 and balance unchanged.",
     "spec": "R-SONG-5, R-SONG-6, R-SONG-7, R-INF-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Mode full returns structured lyrics within the song limit.",
      "AC2: Mode condense output is at most the lyrics limit and never ends mid-line.",
      "AC3: The 31st request in a day returns 429 with the daily-limit copy.",
      "AC4: A request exceeding the timeout returns 504 with retry copy.",
      "AC5: Unsafe output is rejected with 422 and is never returned.",
      "AC6: Unauthenticated requests return 401 and no credits change in any case."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `bun run check`"
     ],
     "line": 754,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "CHANGES",
        "security": "CHANGES"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.9919,
     "costApprox": true,
     "elapsedMs": 3524548,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.8",
     "title": "Lyrics AI actions in the Song composer (S1.2b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T1.7",
      "T1.3"
     ],
     "files": [
      "apps/web/src/components/Song/LyricsAiMenu.vue",
      "apps/web/src/components/Song/LyricsEditor.vue",
      "apps/web/src/composables/useLyricsAssist.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Design intent: AI help is a quiet menu beside the field with Write from a theme, Rewrite this section and Fit to limit, never auto-applied. Results show as a reviewable suggestion with Accept and Undo; Accept replaces and Undo restores the previous text. Loading shows a spinner inside the button; failure shows a toast with the mapped copy and keeps the text. A 429 shows the daily-limit copy. Fit to limit appears only when lyrics exceed the limit. Tests are not written here: T1.4, T1.10 cover Component (lyrics web unit task): visibility rule; Component: accept and undo; Component: loading and failure; Component: 429 copy; Component: keyboard and focus return; E2E lyrics spec at 375px.",
     "spec": "R-SONG-5, R-SONG-6, R-SONG-7, R-QOL-2",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Fit to limit is hidden under the limit and visible over it.",
      "AC2: Choosing Write from a theme shows a suggestion; Accept replaces the lyrics and Undo restores them.",
      "AC3: While loading, the button is disabled and shows a spinner; a failure toast keeps the lyrics untouched.",
      "AC4: A 429 response shows the daily-limit copy.",
      "AC5: The menu is operable by keyboard with Escape closing it and focus returning to the trigger.",
      "AC6: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/song path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 778,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ui": "CHANGES",
        "ux": "CHANGES",
        "code": "CHANGES"
       },
       "verifier": null
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "code": "PASS",
        "ui": "PASS",
        "ux": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.832,
     "costApprox": true,
     "elapsedMs": 20495374,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.9",
     "title": "Unit: Lyrics generator and prompt route",
     "done": true,
     "kind": "unit",
     "depends": [
      "T1.8"
     ],
     "files": [
      "apps/api/src/lib/lyrics-generator.ts",
      "apps/api/src/routes/prompt.ts",
      "apps/api/src/middlewares/rate-limit.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/lib/lyrics-generator.test.ts src/routes/prompt.test.ts src/middlewares/rate-limit.test.ts --coverage --coverage.include=src/lib/lyrics-generator.ts --coverage.include=src/routes/prompt.ts --coverage.include=src/middlewares/rate-limit.ts --coverage.reporter=text`"
     ],
     "line": 801,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.4182,
     "costApprox": true,
     "elapsedMs": 3270831,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.10",
     "title": "E2E: Lyrics help",
     "done": true,
     "kind": "e2e",
     "depends": [
      "T1.9"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/lyrics.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with MediaGenerationStub and the e2e user fake client; no un-intercepted paid call occurs.",
      "AC2: Each scenario that spends credits asserts the balance through readCredits.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/lyrics.spec.ts --repeat-each=3`"
     ],
     "line": 812,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.3689,
     "costApprox": true,
     "elapsedMs": 3270831,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.11",
     "title": "Audio editor math, history and waveform component (S1.3a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T1.1",
      "T1.5"
     ],
     "files": [
      "apps/web/src/utils/audioEditMath.ts",
      "apps/web/src/composables/useAudioEditor.ts",
      "apps/web/src/components/Audio/WaveformEditor.vue",
      "apps/web/package.json"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Install wavesurfer.js (approved 2026-11-16) with bun add in apps/web. audioEditMath is pure: trim, cut, fade in and out, normalize and undo/redo over a segments model, with EDIT_HISTORY_LIMIT = 100 and EDITOR_PEAK_BUCKETS = 2000 as named constants. useAudioEditor owns the region state and history and uses the player store's single audio element through the wavesurfer media option (gap G7). WaveformEditor draws the waveform with region handles, a timeline and zoom, never autoplays and keeps handles at least 44px wide on touch. Edits are non-destructive until export. Functions stay under 30 lines. Tests are not written here: T1.13, T1.18 cover Unit (editor unit task): trim, cut, fade, normalize math with exact sample counts; Unit: history cap at 101 operations; Component: undo and redo keys and the typing-context suppression; Unit: single element shared (no second Audio constructed); Component: region keys; Unit: peak bucket cap; E2E editor spec at 375px: handle width and scrollWidth.",
     "spec": "R-EDIT-1, R-EDIT-2, R-EDIT-4, R-EDIT-5, R-INF-12",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Trim to a region keeps only that range and cut removes it; the displayed duration updates.",
      "AC2: Undo and redo step through edits and the stack never exceeds 100 entries.",
      "AC3: Mod+Z and Mod+Shift+Z undo and redo when focus is not in a text field.",
      "AC4: Playing in the editor and in the mini-player never overlap because one audio element is shared.",
      "AC5: Region start and end can be set with [ and ] and by dragging handles of at least 44px on touch.",
      "AC6: Loading a 5 second fixture draws at most 2000 peak buckets.",
      "AC7: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/song path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 826,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic",
      "security"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ui": "PASS",
        "ux": "CHANGES",
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "code": "PASS",
        "ui": "PASS",
        "ux": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.1979,
     "costApprox": true,
     "elapsedMs": 3964808,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.12",
     "title": "Editor toolbar and Song result integration (S1.3b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T1.11"
     ],
     "files": [
      "apps/web/src/components/Audio/EditorToolbar.vue",
      "apps/web/src/components/Song/SongResult.vue",
      "apps/web/src/pages/SongStudio.vue"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Design intent: the editor opens under the result as a calm workbench; the toolbar groups Trim, Cut, Fade in, Fade out, Normalize, Undo and Redo with icon plus label, a disabled state with reason tooltip, and a clear Reset. The result shows the editor only after generation succeeds. Empty selection shows hint copy \"Drag on the waveform to select a part.\". Never auto-apply an edit. Tests are not written here: T1.13, T1.18 cover Component: disabled reasons; Component: hint copy; Component: reset; Component: roving focus; E2E editor spec at 375px; Component: aria-label list.",
     "spec": "R-EDIT-1, R-EDIT-2, R-EDIT-5, R-EDIT-6, R-QOL-2",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Edit buttons are disabled with a tooltip reason until a region exists.",
      "AC2: The empty-selection hint shows the exact copy before any selection.",
      "AC3: Reset restores the original and clears the history.",
      "AC4: Toolbar is a labelled group operable with arrow keys and Tab.",
      "AC5: At 375px width the toolbar wraps without horizontal scroll and every button is at least 44px high.",
      "AC6: Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/song path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 850,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ui": "CHANGES",
        "ux": "PASS",
        "code": "PASS"
       },
       "verifier": null
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "code": "PASS",
        "ui": "PASS",
        "ux": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.9989,
     "costApprox": true,
     "elapsedMs": 3964809,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.13",
     "title": "Unit: Editor math, composable and components",
     "done": true,
     "kind": "unit",
     "depends": [
      "T1.12"
     ],
     "files": [
      "apps/web/src/utils/audioEditMath.ts",
      "apps/web/src/composables/useAudioEditor.ts",
      "apps/web/src/components/Audio/WaveformEditor.vue",
      "apps/web/src/components/Audio/EditorToolbar.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/utils/audioEditMath.test.ts src/composables/useAudioEditor.test.ts src/components/Audio/WaveformEditor.test.ts src/components/Audio/EditorToolbar.test.ts --coverage --coverage.include=src/utils/audioEditMath.ts --coverage.include=src/composables/useAudioEditor.ts --coverage.include=src/components/Audio/WaveformEditor.vue --coverage.include=src/components/Audio/EditorToolbar.vue --coverage.reporter=text`"
     ],
     "line": 873,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.6563,
     "costApprox": true,
     "elapsedMs": 2849472,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.14",
     "title": "Record @breezystack/lamejs approval (approved)",
     "done": true,
     "kind": "dod",
     "depends": [
      "T1.13"
     ],
     "files": [
      "agent_docs/media-studio/APPROVALS.md"
     ],
     "gherkin": null,
     "do": "Record in APPROVALS.md that the owner approved @breezystack/lamejs (in-browser MP3 encoding) on 2026-11-16; no question is asked. Install nothing here; the export task installs it.",
     "spec": "R-EDIT-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: APPROVALS.md has an @breezystack/lamejs line marked approved 2026-11-16.",
      "AC2: No dependency file changed in this task."
     ],
     "verify": [
      "V1: `grep -n lamejs agent_docs/media-studio/APPROVALS.md`",
      "V2: `git diff --name-only -- package.json apps/web/package.json bun.lock` shows nothing from this task"
     ],
     "line": 884,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.1915,
     "costApprox": true,
     "elapsedMs": 2674620,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.15",
     "title": "WAV encoder, MP3 worker and export composable (S1.4a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T1.14"
     ],
     "files": [
      "apps/web/src/utils/wavEncoder.ts",
      "apps/web/src/workers/mp3-encoder.worker.ts",
      "apps/web/src/composables/useAudioExport.ts",
      "apps/web/package.json"
     ],
     "gherkin": null,
     "do": "Install @breezystack/lamejs (approved 2026-11-16) in apps/web. encodeWav writes a valid 16-bit PCM header. The MP3 encode runs in a Web Worker so the UI never blocks and stops with an error when decoded PCM would exceed EXPORT_PCM_CAP_BYTES = 200MB, with the copy \"This audio is too long to export in the browser.\". useAudioExport renders edits to PCM, reports progress and exposes cancel; worker errors are surfaced with context, never swallowed. Tests are not written here: T1.17, T1.18 cover Unit (export unit task): WAV header and sample bytes; Unit: MP3 round trip with a fake worker and a real small encode; Unit: cap check; Unit: cancel terminates worker; Unit: progress events with fake timers.",
     "spec": "R-EDIT-3, R-EDIT-4, R-EDIT-7",
     "filesDeclared": true,
     "acceptance": [
      "AC1: encodeWav of a known buffer has a correct RIFF header, byte length and sample values.",
      "AC2: Exporting the 5 second fixture to MP3 yields a decodable file of about the expected duration.",
      "AC3: Audio above the PCM cap fails fast with the exact copy and no worker starts.",
      "AC4: Cancel stops the worker and leaves no partial download.",
      "AC5: The main thread stays responsive during encoding (progress events arrive)."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`"
     ],
     "line": 898,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "logic",
      "security"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "CHANGES",
        "security": "PASS"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.3002,
     "costApprox": true,
     "elapsedMs": 3542753,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.16",
     "title": "Export dialog and save-as-version flow (S1.4b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T1.15",
      "T1.12"
     ],
     "files": [
      "apps/web/src/components/Audio/ExportDialog.vue",
      "apps/api/src/routes/media.ts",
      "apps/web/src/components/Song/SongResult.vue",
      "apps/web/src/stores/history.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Design intent: export is a single clear choice of MP3 or WAV with a size estimate, a progress bar, then Download plus Save as new version. Saved versions upload to POST /media/assets/:id/versions, cost 0 credits, link by parentId and appear grouped under the original in History. The route validates MIME with sniffMime and the size cap and scopes by userId. Download works without saving. Tests are not written here: T1.5, T1.17, T1.18 cover Component: options and estimate; Component: progress and cancel; E2E editor spec: download event; E2E editor spec: version appears in History and balance unchanged via readCredits; Unit (API): 400 and 404 cases; Component: focus trap and Escape; E2E editor spec at 375px.",
     "spec": "R-EDIT-3, R-EDIT-6, R-EDIT-7, R-INF-14",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The dialog offers MP3 and WAV and shows an estimated size.",
      "AC2: Progress is shown during encoding and Cancel stops it.",
      "AC3: Download saves a file with the chosen format.",
      "AC4: Save as new version creates a version row with parentId, 0 credits and no balance change.",
      "AC5: Uploading a non-audio file to the versions route returns 400 and another user's asset returns 404.",
      "AC6: The dialog traps focus, Escape closes it and focus returns to the Export button.",
      "AC7: At 375px width there is no horizontal scroll and tap targets are at least 44px high. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/api && bun run type-check`",
      "V2: `cd apps/api && bun run test` (existing api tests stay green)",
      "V3: `cd apps/web && bun run test` (existing web tests stay green)",
      "V4: `bun run check`",
      "V5: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/song path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 919,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "ui",
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ui": "PASS",
        "ux": "PASS",
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ui": "PASS",
        "ux": "PASS",
        "security": "PASS",
        "code": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.9749,
     "costApprox": true,
     "elapsedMs": 3542753,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.17",
     "title": "Unit: WAV encoder, worker and export composable",
     "done": true,
     "kind": "unit",
     "depends": [
      "T1.16"
     ],
     "files": [
      "apps/web/src/utils/wavEncoder.ts",
      "apps/web/src/workers/mp3-encoder.worker.ts",
      "apps/web/src/composables/useAudioExport.ts",
      "apps/web/src/components/Audio/ExportDialog.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/utils/wavEncoder.test.ts src/workers/mp3-encoder.worker.test.ts src/composables/useAudioExport.test.ts src/components/Audio/ExportDialog.test.ts --coverage --coverage.include=src/utils/wavEncoder.ts --coverage.include=src/workers/mp3-encoder.worker.ts --coverage.include=src/composables/useAudioExport.ts --coverage.include=src/components/Audio/ExportDialog.vue --coverage.reporter=text`"
     ],
     "line": 945,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.7055,
     "costApprox": true,
     "elapsedMs": 3286325,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.18",
     "title": "E2E: Waveform editor and export",
     "done": true,
     "kind": "e2e",
     "depends": [
      "T1.17"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/editor.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with MediaGenerationStub and the e2e user fake client; no un-intercepted paid call occurs.",
      "AC2: Each scenario that spends credits asserts the balance through readCredits.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/editor.spec.ts --repeat-each=3`"
     ],
     "line": 956,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.1406,
     "costApprox": true,
     "elapsedMs": 3135953,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    },
    {
     "id": "T1.19",
     "title": "Gate: Phase 1 Song studio",
     "done": true,
     "kind": "gate",
     "depends": [
      "T1.18",
      "T1.10",
      "T1.6"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint, full unit suites and the phase QA specs pass.",
      "AC2: No regression in image generation or earlier phases."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `bun run check:model-docs`",
      "V4: `cd apps/web && bunx playwright test e2e/qa/song.spec.ts e2e/qa/lyrics.spec.ts e2e/qa/editor.spec.ts --repeat-each=2`"
     ],
     "line": 970,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:00:20.615Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.9484,
     "costApprox": true,
     "elapsedMs": 2679770,
     "summary": [
      "bun run check: exit 0 (0 errors, 17 warnings)",
      "cd apps/web && bun run test x2: exit 0 both, 249 files 2197/2197, 0 EnvironmentTeardownError (App.test.ts already fixed)",
      "root bun run test: exit 0, 344 files 3840/3840",
      "check:model-docs: passed (15 models)",
      "song 25, lyrics 19, editor 22 passed at --repeat-each=3 --workers=1; no test.fail left in editor.spec.ts"
     ]
    }
   ],
   "verified": 19,
   "total": 19,
   "complete": true,
   "costUsd": 17.8219,
   "elapsedMs": 21109626
  },
  {
   "id": "2",
   "name": "Music studio",
   "startLine": 986,
   "endLine": 1111,
   "adds": "Users make instrumental music from a prompt with Lyria 2 or Stable Audio 2.5 and Minimax instrumental mode, with duration where the model supports it, and play and edit the result like a song.",
   "tryInUi": [
    "Open Audio then Music",
    "describe a mood and press Generate",
    "switch model and see the duration control appear or disappear",
    "play the result from History"
   ],
   "checkpoint": {
    "title": "Checkpoint 2",
    "line": 1110,
    "items": [
     "music generation across models verified by unit tests and the mocked music QA spec."
    ]
   },
   "tasks": [
    {
     "id": "T2.1",
     "title": "Music schema and per-model payloads (S2.1a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T1.19"
     ],
     "files": [
      "packages/shared/src/schemas/media.ts",
      "apps/api/src/lib/media-input.ts",
      "apps/api/src/services/media-service.ts"
     ],
     "gherkin": null,
     "do": "Extend the Phase 0 music schema: durationSec only for models whose registry media.inputs declares it (Stable Audio 2.5), within its documented range as named constants; Lyria never receives a duration. Billing is flat per file for both Lyria and Stable Audio (SPEC R-MUS-5, owner decision on Q24/Q25), computed server-side via getMediaCreditCost. Data-driven from the registry, no per-model if branches. Tests are not written here: T2.5, T2.6 cover Unit (music unit task): Lyria payload and 400 for duration; Unit: Stable Audio range boundaries; Unit: cost uses server-side duration; Unit: deduct once success, zero failure.",
     "spec": "R-MUS-1, R-MUS-2, R-MUS-3, R-INF-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Lyria payload has no duration field even if the client sends one; the request is rejected with a field-level 400.",
      "AC2: Stable Audio accepts durations inside its range and rejects those outside it with 400.",
      "AC3: Cost for Stable Audio is the flat per-file price from the registry, computed server-side and independent of any client-sent value.",
      "AC4: Charge happens once on success only."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `bun run check`"
     ],
     "line": 991,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:39:55.052Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": null
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.651,
     "costApprox": true,
     "elapsedMs": 2079470,
     "summary": []
    },
    {
     "id": "T2.2",
     "title": "Music studio page (S2.1b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T2.1"
     ],
     "files": [
      "apps/web/src/pages/Music.vue",
      "apps/web/src/components/Music/MusicComposer.vue",
      "apps/web/src/components/Music/MusicModelSelect.vue",
      "apps/web/src/components/Music/DurationControl.vue",
      "apps/web/src/router/index.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Design intent (PLAN 1.12): a cool accent, a prompt-first layout with mood chips and a model select that explains what each model is best at in one line. DurationControl appears only for models that support it. Replace the Music route placeholder and reuse the studio components and the waveform editor result. Empty state copy: \"Describe a mood, genre or scene to make your first track.\" with an example button. Tests are not written here: T2.4, T2.6 cover Component (music web unit task): empty copy; Component: duration visibility by model; Component: cost updates on model switch; Component: disabled reason and shortcut; E2E music spec: success, 402, failure; Unit: draft restore; E2E music spec at 375px and keyboard-only.",
     "spec": "R-MUS-1, R-MUS-2, R-MUS-3, R-MUS-5, R-INF-8, R-QOL-1, R-QOL-2, R-QOL-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The empty state shows the exact copy and its example fills the prompt.",
      "AC2: The duration control shows only for models that support it and is absent for Lyria.",
      "AC3: Switching models keeps the prompt and updates the cost badge immediately.",
      "AC4: Generate is disabled with a reason until the prompt is valid; Mod+Enter submits.",
      "AC5: Success, 402 dialog and no-charge failure states match the shared components.",
      "AC6: The draft survives a reload.",
      "AC7: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/music path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1013,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:39:55.052Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.3548,
     "costApprox": true,
     "elapsedMs": 1622674,
     "summary": []
    },
    {
     "id": "T2.3",
     "title": "Minimax instrumental mode and model notes (S2.2)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T2.2"
     ],
     "files": [
      "packages/shared/src/schemas/media.ts",
      "apps/api/src/lib/media-input.ts",
      "apps/web/src/components/Music/MusicModelSelect.vue",
      "apps/web/src/components/Music/MusicComposer.vue"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Add instrumental mode for Minimax models with the exact payload the registry declares (the lyrics field is sent per the SPEC section 5 instrumental row and never blank by accident). The UI hides the lyrics field in this mode and shows a one-line note. Cost remains per file. Tests are not written here: T2.4, T2.5, T2.6 cover Unit: payload per SPEC row; Component: lyrics hidden and note present; Component: cost badge value equals getMediaCreditCost; E2E music spec at 375px.",
     "spec": "R-MUS-3, R-MUS-4, R-MUS-5",
     "filesDeclared": true,
     "acceptance": [
      "AC1: With Minimax instrumental the payload carries the instrumental input and no user lyrics.",
      "AC2: The lyrics field is hidden in instrumental mode and a one-line note explains it.",
      "AC3: Cost badge reads the per-file credits for the model.",
      "AC4: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `cd apps/web && bun run test` (existing web tests stay green)",
      "V5: `bun run check`",
      "V6: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/music path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1037,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:39:55.052Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "CHANGES",
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.8982,
     "costApprox": true,
     "elapsedMs": 1622674,
     "summary": []
    },
    {
     "id": "T2.4",
     "title": "Unit: Music composer and controls",
     "done": true,
     "kind": "unit",
     "depends": [
      "T2.3"
     ],
     "files": [
      "apps/web/src/components/Music/MusicComposer.vue",
      "apps/web/src/components/Music/MusicModelSelect.vue",
      "apps/web/src/components/Music/DurationControl.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Music --coverage --coverage.include=src/components/Music/MusicComposer.vue --coverage.include=src/components/Music/MusicModelSelect.vue --coverage.include=src/components/Music/DurationControl.vue --coverage.reporter=text`"
     ],
     "line": 1060,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:39:55.052Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.5136,
     "costApprox": true,
     "elapsedMs": 1353640,
     "summary": []
    },
    {
     "id": "T2.5",
     "title": "Unit: Music schema, input builder and service",
     "done": true,
     "kind": "unit",
     "depends": [
      "T2.4"
     ],
     "files": [
      "packages/shared/src/schemas/media.ts",
      "apps/api/src/lib/media-input.ts",
      "apps/api/src/services/media-service.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/lib/media-input.test.ts src/services/media-service.test.ts --coverage --coverage.include=src/lib/media-input.ts --coverage.include=src/services/media-service.ts --coverage.reporter=text`"
     ],
     "line": 1071,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:39:55.052Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.5737,
     "costApprox": true,
     "elapsedMs": 1353640,
     "summary": []
    },
    {
     "id": "T2.6",
     "title": "E2E: Music studio",
     "done": true,
     "kind": "e2e",
     "depends": [
      "T2.5"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/music.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with MediaGenerationStub and the e2e user fake client; no un-intercepted paid call occurs.",
      "AC2: Each scenario that spends credits asserts the balance through readCredits.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/music.spec.ts --repeat-each=3`"
     ],
     "line": 1082,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-23T13:39:55.052Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "FAIL"
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.205,
     "costApprox": true,
     "elapsedMs": 1444929,
     "summary": []
    },
    {
     "id": "T2.7",
     "title": "Gate: Phase 2 Music studio",
     "done": true,
     "kind": "gate",
     "depends": [
      "T2.6"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint, full unit suites and the phase QA specs pass.",
      "AC2: No regression in image generation or earlier phases."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `bun run check:model-docs`",
      "V4: `cd apps/web && bunx playwright test e2e/qa/music.spec.ts e2e/qa/song.spec.ts --repeat-each=2`"
     ],
     "line": 1096,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-23T13:39:55.052Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.4024,
     "costApprox": true,
     "elapsedMs": 1068435,
     "summary": []
    }
   ],
   "verified": 7,
   "total": 7,
   "complete": true,
   "costUsd": 7.5987,
   "elapsedMs": 2079470
  },
  {
   "id": "3",
   "name": "Speech studio",
   "startLine": 1112,
   "endLine": 1343,
   "adds": "Users turn text into speech with Inworld or Minimax voices, mark up pauses and emotion with tag chips, and get advice on length and cost.",
   "tryInUi": [
    "Open Audio then Speech",
    "type text and insert a pause chip",
    "switch model and see tags converted or flagged"
   ],
   "checkpoint": {
    "title": "Checkpoint 3",
    "line": 1342,
    "items": [
     "speech, tags, model switching and the advisor verified by unit tests and the mocked speech QA spec."
    ]
   },
   "tasks": [
    {
     "id": "T3.1",
     "title": "Speech schema, endpoint and billing quantity (S3.1a)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T2.7"
     ],
     "files": [
      "packages/shared/src/schemas/media.ts",
      "apps/api/src/lib/media-input.ts",
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-service.ts"
     ],
     "gherkin": null,
     "do": "Copy processMusic and the route. The billable quantity is the character count of the final serialized text computed on the server (never trusted from the client), checked against the per-model limit constants. Minimax cost is shown as an estimate client-side and the real cost is computed server-side from the final text. Safety-check the text. 402 pre-check uses that server count. Tests are not written here: T3.13, T3.14 cover Unit (speech unit task): client count ignored; Unit: limit boundary per model; Unit: empty text; Unit: safety 422; Unit: 402 not queued; Unit: deduct once.",
     "spec": "R-TTS-1, R-TTS-2, R-TTS-3, R-TTS-13, R-INF-4, R-INF-6a",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The charged credits equal getMediaCreditCost for the server-computed character count even if the client sends a different count.",
      "AC2: Text above the model limit returns a field-level 400.",
      "AC3: Empty or whitespace text returns 400.",
      "AC4: Unsafe text returns 422 PROMPT_REJECTED and queues nothing.",
      "AC5: An insufficient balance returns 402 before queueing.",
      "AC6: Success deducts once; failure deducts nothing."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `bun run check`"
     ],
     "line": 1117,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.7842,
     "costApprox": true,
     "elapsedMs": 3634979,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.2",
     "title": "Shared TTS tag library (S3.1b)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T3.1"
     ],
     "files": [
      "packages/shared/src/models/tts-tags.ts",
      "packages/shared/src/models/media-limits.ts",
      "packages/shared/src/index.ts"
     ],
     "gherkin": null,
     "do": "One shared module, used by web and api, defining the tag set, per-model serialization and TTS_VOICES. TTS_PAUSE_MIN_SEC = 0.1 and TTS_PAUSE_MAX_SEC = 10 as named constants. serializeTts(doc, model) emits the model-native syntax; findUnsupportedTags lists tags a model cannot express; convertTtsTags maps through TTS_SEMANTIC_MAP and reports what was approximated or dropped; parseTtsText is the inverse for drafts. Pure functions, each under 30 lines. Verify the Minimax pause marker and Inworld tag syntax from the SPEC section 5 rows (read only). Tests are not written here: T3.10, T3.11, T3.14 cover Unit (tags unit task): pause boundaries; Unit: unsupported tag listing; Unit: conversion report; Unit: round trip table over TTS_TAGS.",
     "spec": "R-TTS-4, R-TTS-5, R-TTS-6, R-TTS-7, R-TTS-14",
     "filesDeclared": true,
     "acceptance": [
      "AC1: serializeTts emits a pause in the exact native syntax of each model at 0.1 and 10 seconds and rejects 0.09 and 10.1.",
      "AC2: findUnsupportedTags returns the tags a model cannot express and an empty list when all are supported.",
      "AC3: convertTtsTags returns the converted text plus a list of approximated and dropped tags.",
      "AC4: parseTtsText(serializeTts(x)) round-trips for every supported tag.",
      "AC5: No tag syntax string is duplicated outside tts-tags.ts."
     ],
     "verify": [
      "V1: `grep -rn` for a native tag literal outside tts-tags.ts returns nothing",
      "V2: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V3: `cd apps/api && bun run type-check`",
      "V4: `bun run check`"
     ],
     "line": 1141,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": null,
       "reviews": {
        "code": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.5638,
     "costApprox": true,
     "elapsedMs": 3634979,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.3",
     "title": "Speech studio page, plain text mode and voice select (S3.1c)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T3.2"
     ],
     "files": [
      "apps/web/src/pages/Speech.vue",
      "apps/web/src/components/Speech/SpeechComposer.vue",
      "apps/web/src/components/Speech/VoiceSelect.vue",
      "apps/web/src/components/Speech/SpeechModelSelect.vue",
      "apps/web/src/router/index.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Design intent (PLAN 1.12): a teal accent; the text area reads like a script with a live character count and cost that updates as you type; voice select shows a sample name, language and a preview-less description. Replace the Speech route placeholder. Empty state copy: \"Type or paste what you want spoken.\" with an example button. Cost shows Estimated for Minimax. Tests are not written here: T3.12, T3.14 cover Component (speech web unit task): empty copy; Component: cost and Estimated label; Component: over-limit behaviour; Component: voice select; E2E speech spec: success, 402, failure; E2E speech spec at 375px and keyboard-only.",
     "spec": "R-TTS-1, R-TTS-2, R-TTS-3, R-TTS-13, R-INF-8, R-QOL-1, R-QOL-2, R-QOL-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The empty state shows the exact copy and the example fills the text.",
      "AC2: The cost badge updates as text changes and reads Estimated for Minimax models.",
      "AC3: Over-limit text shows a visible counter in the danger colour and disables Generate with a reason; the text is never truncated.",
      "AC4: Voice select lists voices for the model and keeps the selection when switching to a model that has it.",
      "AC5: Success, 402 and no-charge failure states use the shared studio components.",
      "AC6: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/speech path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1164,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "CHANGES",
        "code": "PASS"
       },
       "verifier": null
      },
      {
       "n": 2,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ui": "PASS",
        "code": "PASS",
        "ux": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "code": "PASS",
        "ui": "PASS",
        "ux": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 4,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "code": "PASS",
        "ux": "PASS",
        "ui": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.6099,
     "costApprox": true,
     "elapsedMs": 19582190,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.4",
     "title": "TipTap tag editor with TagChipNode (S3.2)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T3.3"
     ],
     "files": [
      "apps/web/src/components/Speech/TtsEditor.vue",
      "apps/web/src/components/Speech/TagChipNode.ts",
      "apps/web/src/components/Speech/TagToolbar.vue",
      "apps/web/src/composables/useTtsEditor.ts",
      "apps/web/package.json"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. TipTap is user-approved (no ask-first): with `bun add` in apps/web, pinned exact, install the canonical set from the header (vue-3, core, pm, extension-document, extension-paragraph, extension-text, extension-history, extension-placeholder, extension-character-count, suggestion); never starter-kit. TagChipNode is an inline atom node that renders a tag as a chip with a remove button; the pause chip carries a seconds value editable between TTS_PAUSE_MIN_SEC and TTS_PAUSE_MAX_SEC. The editor serializes through serializeTts and never stores syntax strings itself. Chips are inserted from the toolbar or by typing a slash. Keyboard: arrow keys move over a chip as one unit, Backspace deletes it, Enter in the pause field applies. Tests are not written here: T3.10, T3.14 cover Component (editor unit task): insert and serialize; Component: pause range validation; Component: backspace and arrows; Component: typing context suppression; Unit: paste parse; E2E speech spec at 375px: toolbar wraps and targets.",
     "spec": "R-TTS-4, R-TTS-5, R-TTS-6, R-TTS-14, R-INF-13",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Inserting a pause chip at the cursor adds one chip and the serialized text contains the model-native syntax.",
      "AC2: A pause value outside 0.1 to 10 seconds is rejected with an inline message and not applied.",
      "AC3: Backspace next to a chip removes the whole chip.",
      "AC4: Arrow keys step over a chip as one unit.",
      "AC5: Pressing Space or M inside the editor does not trigger player shortcuts.",
      "AC6: Pasting text containing tag syntax parses it into chips.",
      "AC7: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/speech path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1187,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic",
      "security"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS",
        "security": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 2.174,
     "costApprox": true,
     "elapsedMs": 3990644,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.5",
     "title": "Model switching with tag conversion (S3.3)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T3.4"
     ],
     "files": [
      "apps/web/src/components/Speech/ConvertTagsDialog.vue",
      "apps/web/src/components/Speech/SpeechModelSelect.vue",
      "apps/web/src/composables/useTtsEditor.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. When the user switches model and the text has tags the new model cannot express, open a dialog listing what will be approximated or dropped, with Convert and Keep original; Escape and the close button keep the original. Cancel leaves the text and the model unchanged. Never silently drop a tag. Tests are not written here: T3.10, T3.12, T3.14 cover Component: no dialog path; Component: dialog contents; Component: convert and undo; Component: cancel and Escape; Component: focus handling; E2E speech spec at 375px.",
     "spec": "R-TTS-6, R-TTS-7, R-TTS-8",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Switching to a model that supports every tag changes the model with no dialog.",
      "AC2: Switching to a model that cannot express a tag opens the dialog listing each approximated and dropped tag.",
      "AC3: Convert applies the conversion and Undo restores the previous text.",
      "AC4: Cancel or Escape keeps both the old text and the old model.",
      "AC5: Focus moves into the dialog and returns to the model select on close.",
      "AC6: At 375px width there is no horizontal scroll and tap targets are at least 44px high. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/speech path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1211,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 3,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "code": "PASS",
        "ui": "PASS",
        "ux": "PASS"
       },
       "verifier": "FAIL"
      },
      {
       "n": 4,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "code": "PASS",
        "ux": "PASS",
        "ui": "PASS"
       },
       "verifier": "PASS"
      }
     ],
     "costUsd": 1.6827,
     "costApprox": true,
     "elapsedMs": 19582190,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.6",
     "title": "Length advisor, cost note and FAQ (S3.4)",
     "done": true,
     "kind": "implementation",
     "depends": [
      "T3.5"
     ],
     "files": [
      "apps/web/src/components/Speech/TextAdvisor.vue",
      "apps/web/src/composables/useTtsAdvice.ts",
      "apps/web/src/utils/constants.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. A quiet inline advisor under the editor: estimated spoken length, a warning near the limit, and one suggestion to split long text; the Minimax cost note explains the estimate. Add the speech FAQ entries from SPEC section 9 to the existing constants. Advice never blocks generation. Tests are not written here: T3.10, T3.12, T3.14 cover Unit: length estimate table; Component: warning thresholds; Component: Estimated note; Component: Generate state unchanged; E2E speech spec at 375px.",
     "spec": "R-TTS-9, R-TTS-10, R-TTS-13",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The advisor shows an estimated spoken length that updates with the text.",
      "AC2: Near the limit it shows a warning with the remaining characters; over the limit it points to the disabled reason.",
      "AC3: The Minimax cost note reads Estimated and explains why.",
      "AC4: The advisor never disables Generate by itself.",
      "AC5: Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. At 375px width there is no horizontal scroll and tap targets are at least 44px high."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /audio/speech path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1234,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": false,
     "pending": [],
     "risk": "low",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "haiku"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {
        "ux": "PASS",
        "ui": "PASS",
        "code": "PASS"
       },
       "verifier": "skipped"
      }
     ],
     "costUsd": 0.699,
     "costApprox": true,
     "elapsedMs": 4149329,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.7",
     "title": "Record the voice cloning descope",
     "done": true,
     "kind": "dod",
     "depends": [
      "T3.6"
     ],
     "files": [
      "agent_docs/media-studio/APPROVALS.md"
     ],
     "gherkin": null,
     "do": "Record in APPROVALS.md that voice cloning is dropped from the product by owner decision (2026-11-24), that the Q5 paid test call is cancelled (0 of 1 made, none will be), and that the Voice and VoiceConsent collections, CLONE_CONSENT_TEXT / CURRENT_CONSENT_VERSION, and gaps G4 and G5 are not needed (not built). Make no code change.",
     "spec": "R-TTS-10 (descoped)",
     "filesDeclared": true,
     "acceptance": [
      "AC1: APPROVALS.md records the voice cloning descope with its date.",
      "AC2: APPROVALS.md records that no paid call was made (Q5 cancelled, 0 of 1 made)."
     ],
     "verify": [
      "V1: `grep -n -E 'Voice|VoiceConsent|CLONE_CONSENT|G4|G5|Q5|call 1 of 1' agent_docs/media-studio/APPROVALS.md`",
      "V2: `git status --short` shows only APPROVALS.md changed by this task"
     ],
     "line": 1256,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.3402,
     "costApprox": true,
     "elapsedMs": 2297434,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.10",
     "title": "Unit: TTS tags and editor composables",
     "done": true,
     "kind": "unit",
     "depends": [
      "T3.7"
     ],
     "files": [
      "packages/shared/src/models/tts-tags.ts",
      "apps/web/src/composables/useTtsEditor.ts",
      "apps/web/src/composables/useTtsAdvice.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/composables/useTtsEditor.test.ts src/composables/useTtsAdvice.test.ts --coverage --coverage.include=src/composables/useTtsEditor.ts --coverage.include=src/composables/useTtsAdvice.ts --coverage.reporter=text`"
     ],
     "line": 1270,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.6271,
     "costApprox": true,
     "elapsedMs": 2245407,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.11",
     "title": "Unit: shared TTS tags",
     "done": true,
     "kind": "unit",
     "depends": [
      "T3.10"
     ],
     "files": [
      "packages/shared/src/models/tts-tags.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared/src/models/tts-tags.test.ts --coverage --coverage.include=packages/shared/src/models/tts-tags.ts --coverage.reporter=text`"
     ],
     "line": 1281,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.3496,
     "costApprox": true,
     "elapsedMs": 2245407,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.12",
     "title": "Unit: Speech components",
     "done": true,
     "kind": "unit",
     "depends": [
      "T3.11"
     ],
     "files": [
      "apps/web/src/components/Speech/SpeechComposer.vue",
      "apps/web/src/components/Speech/ConvertTagsDialog.vue",
      "apps/web/src/components/Speech/TextAdvisor.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Speech --coverage --coverage.include=src/components/Speech/SpeechComposer.vue --coverage.include=src/components/Speech/ConvertTagsDialog.vue --coverage.include=src/components/Speech/TextAdvisor.vue --coverage.reporter=text`"
     ],
     "line": 1292,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.868,
     "costApprox": true,
     "elapsedMs": 18403655,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.13",
     "title": "Unit: Speech services",
     "done": true,
     "kind": "unit",
     "depends": [
      "T3.12"
     ],
     "files": [
      "apps/api/src/services/media-service.ts",
      "apps/api/src/lib/media-input.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/services/media-service.test.ts src/lib/media-input.test.ts --coverage --coverage.include=src/services/media-service.ts --coverage.include=src/lib/media-input.ts --coverage.reporter=text`"
     ],
     "line": 1303,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 1.1567,
     "costApprox": true,
     "elapsedMs": 18403656,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.14",
     "title": "E2E: Speech studio and tags",
     "done": true,
     "kind": "e2e",
     "depends": [
      "T3.13"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/speech.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with MediaGenerationStub and the e2e user fake client; no un-intercepted paid call occurs.",
      "AC2: Each scenario that spends credits asserts the balance through readCredits.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/speech.spec.ts --repeat-each=3`"
     ],
     "line": 1314,
     "ui": true,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui"
     ],
     "reviewers": [],
     "attempts": [
      {
       "n": 1,
       "gate": "PASS",
       "slop": "PASS",
       "reviews": {},
       "verifier": "PASS"
      }
     ],
     "costUsd": 0.7666,
     "costApprox": true,
     "elapsedMs": 1911928,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    },
    {
     "id": "T3.16",
     "title": "Gate: Phase 3 Speech studio",
     "done": true,
     "kind": "gate",
     "depends": [
      "T3.14"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint, full unit suites and the phase QA specs pass.",
      "AC2: No regression in image generation or earlier phases."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `bun run check:model-docs`",
      "V4: `cd apps/web && bunx playwright test e2e/qa/speech.spec.ts --repeat-each=2`"
     ],
     "line": 1328,
     "ui": false,
     "status": "verified",
     "updatedAt": "2026-11-24T08:14:56.422Z",
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
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
     "costUsd": 0.2816,
     "costApprox": true,
     "elapsedMs": 1674275,
     "summary": [
      "T3.3 VoiceSelect.vue: fallback stored in a const, assigned, notice built from it. New VoiceSelect.test.ts checks \"Voice changed to English_Wiselady\" after Inworld -> Minimax switch; confirmed it fails",
      "T3.3 SpeechModelSelect.vue: Minimax HD blurb no longer says voice cloning.",
      "T3.3 AC5 proof: the e2e insufficient-credits.png was taken before the dialog's enter animation finished. Re-ran the same mocked e2e flow (MediaGenerationStub, no paid call) in a throwaway spec (delete",
      "T3.5 ConvertTagsDialog.vue: unscoped <=640px rule raises .app-modal__close to 2.75rem (44px) via .app-modal:has(.convert-tags-body). Not re-measured in a browser."
     ]
    }
   ],
   "verified": 13,
   "total": 13,
   "complete": true,
   "costUsd": 11.9034,
   "elapsedMs": 19793229
  },
  {
   "id": "4",
   "name": "Video studio",
   "startLine": 1344,
   "endLine": 1496,
   "adds": "Users generate short videos from text, from an image, or with their own audio, using P-Video or Wan 3, with a draft mode for cheap previews first.",
   "tryInUi": [
    "Open Video",
    "write a prompt and press Generate",
    "attach an image or audio file",
    "try a draft first then a final render"
   ],
   "checkpoint": {
    "title": "Checkpoint 4",
    "line": 1495,
    "items": [
     "video generation, image and audio inputs and draft-first verified by unit tests and the mocked video QA spec."
    ]
   },
   "tasks": [
    {
     "id": "T4.1",
     "title": "Video schema, endpoint and cost (S4.1a)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T3.16"
     ],
     "files": [
      "packages/shared/src/schemas/media.ts",
      "apps/api/src/lib/media-input.ts",
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-service.ts"
     ],
     "gherkin": null,
     "do": "Copy processMusic and the route. Body: prompt, modelKey, durationSec and resolution within each model's registry ranges, draft flag where the model supports it, jobId. Cost is per second and resolution via getMediaCreditCost with server-side values (draft pricing from the registry, never client). Safety-check the prompt. Result stores a video MediaAsset with posterUrl. Tests are not written here: T4.6, T4.7 cover Unit (video unit task): range boundaries; Unit: cost table over durations, resolutions and draft; Unit: 422 and 402 ordering; Unit: asset has poster; Unit: deduct once.",
     "spec": "R-VID-1, R-VID-2, R-VID-3, R-VID-5, R-INF-4, R-INF-6a",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Duration and resolution outside the model ranges return a field-level 400.",
      "AC2: The charged cost equals getMediaCreditCost for the server-side duration, resolution and draft flag.",
      "AC3: Unsafe prompts return 422 and queue nothing; insufficient balance returns 402 before queueing.",
      "AC4: A completed job stores a video MediaAsset with a poster URL.",
      "AC5: Success deducts once; failure deducts nothing."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `bun run check`"
     ],
     "line": 1349,
     "ui": false,
     "status": "ready",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T4.2",
     "title": "Video studio page (S4.1b)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T4.1"
     ],
     "files": [
      "apps/web/src/pages/Video.vue",
      "apps/web/src/components/Video/VideoComposer.vue",
      "apps/web/src/components/Video/VideoSettings.vue",
      "apps/web/src/components/Video/VideoResult.vue",
      "apps/web/src/router/index.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Design intent (PLAN 1.12): a cinematic result stage with the video at its native ratio, the compose column minimal, and cost shown prominently because video is the expensive surface (confirm dialog at EXPENSIVE_JOB_CREDITS through the shared action bar). Replace the Video route placeholder. Starting a video calls the player store close() so audio and video never overlap. Empty state copy: \"Describe a scene to make your first video.\" with an example button. Result uses a native video element with controls and a poster, never autoplaying with sound. Tests are not written here: T4.5, T4.7 cover Component (video web unit task): empty copy; Component: ranges by model; Component: threshold dialog; Component: player close call; Component: no autoplay; E2E video spec: success, 402, failure; E2E video spec at 375px and keyboard-only.",
     "spec": "R-VID-1, R-VID-2, R-VID-3, R-VID-4, R-INF-8, R-QOL-1, R-QOL-2, R-QOL-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The empty state shows the exact copy and the example fills the prompt.",
      "AC2: Duration and resolution controls show only the ranges the selected model supports.",
      "AC3: A cost of 150 or more opens the confirm dialog with default focus on Cancel.",
      "AC4: Playing the video stops any playing audio and vice versa.",
      "AC5: The video never autoplays with sound; the poster shows before play.",
      "AC6: Success, 402 and no-charge failure use the shared studio components.",
      "AC7: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /video path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1372,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T4.3",
     "title": "Image and audio inputs with upload hook (S4.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T4.2"
     ],
     "files": [
      "apps/web/src/composables/useToolVideoUpload.ts",
      "apps/web/src/components/Video/ImageInput.vue",
      "apps/web/src/components/Video/AudioInput.vue",
      "apps/api/src/services/media-service.ts",
      "packages/shared/src/schemas/media.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Image and audio are attached through uploadIds only (never client URLs). Copy the drag/drop pattern of useImageDrop. P-Video audio cost is billed on the stored audio duration clamped to P_VIDEO_MAX_SEC = 20 seconds and shown as Estimated (gap G1); the server computes it from the stored MediaUpload duration, never a client value. Audio larger than MAX_VIDEO_AUDIO_BYTES = 20MB is rejected with specific copy. Uploads are deleted after success. Tests are not written here: T4.5, T4.6, T4.7 cover Component: thumbnail and remove; Component: Estimated label; Component: size copy; Unit (API): clamped duration billing; E2E video spec: renamed file rejected; E2E video spec: keyboard picker; E2E video spec at 375px.",
     "spec": "R-VID-1, R-VID-5, R-VID-6, R-INF-17",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Attaching an image shows a thumbnail with Remove and sends only its uploadId.",
      "AC2: Attaching audio shows its duration and the cost badge reads Estimated.",
      "AC3: Audio over 20MB is rejected with the exact limit copy and never uploaded.",
      "AC4: The charged amount uses the stored audio duration clamped to 20 seconds, not a client value.",
      "AC5: A non-audio file renamed .mp3 is rejected.",
      "AC6: Drag and drop works and the picker is operable by keyboard.",
      "AC7: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `cd apps/web && bun run test` (existing web tests stay green)",
      "V5: `bun run check`",
      "V6: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /video path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1396,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "ui",
      "security",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T4.4",
     "title": "Draft first flow (S4.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T4.3"
     ],
     "files": [
      "apps/web/src/components/Video/DraftToggle.vue",
      "apps/web/src/components/Video/VideoResult.vue",
      "apps/web/src/pages/Video.vue"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Design intent: draft is the default path for cost-conscious users, a clearly labelled switch with the saving shown in credits, and a Render final at full quality action on a draft result that reuses the same prompt and inputs with a new jobId. A draft result is labelled Draft. Hide the toggle for models without draft support. Tests are not written here: T4.5, T4.7 cover Component: saving label and hidden state; Component: Draft label; Component: render-final request body and new jobId; Component: cost on toggle; E2E video spec at 375px.",
     "spec": "R-VID-2, R-VID-3, R-VID-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The draft toggle shows the credit saving next to its label and is hidden for models without draft.",
      "AC2: A draft result carries a visible Draft label.",
      "AC3: Render final reuses prompt and inputs, sends a new jobId and the cost badge shows the full price before confirming.",
      "AC4: Toggling draft updates the cost badge immediately.",
      "AC5: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /video path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1423,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T4.5",
     "title": "Unit: Video composer, inputs and upload hook",
     "done": false,
     "kind": "unit",
     "depends": [
      "T4.4"
     ],
     "files": [
      "apps/web/src/components/Video/VideoComposer.vue",
      "apps/web/src/components/Video/ImageInput.vue",
      "apps/web/src/components/Video/AudioInput.vue",
      "apps/web/src/components/Video/DraftToggle.vue",
      "apps/web/src/composables/useToolVideoUpload.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Video src/composables/useToolVideoUpload.test.ts --coverage --coverage.include=src/components/Video/VideoComposer.vue --coverage.include=src/components/Video/ImageInput.vue --coverage.include=src/components/Video/AudioInput.vue --coverage.include=src/components/Video/DraftToggle.vue --coverage.include=src/composables/useToolVideoUpload.ts --coverage.reporter=text`"
     ],
     "line": 1445,
     "ui": true,
     "status": "waiting",
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
     "id": "T4.6",
     "title": "Unit: Video service and schema",
     "done": false,
     "kind": "unit",
     "depends": [
      "T4.5"
     ],
     "files": [
      "apps/api/src/services/media-service.ts",
      "apps/api/src/lib/media-input.ts",
      "apps/api/src/routes/media.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/services/media-service.test.ts src/lib/media-input.test.ts src/routes/media.test.ts --coverage --coverage.include=src/services/media-service.ts --coverage.include=src/lib/media-input.ts --coverage.include=src/routes/media.ts --coverage.reporter=text`"
     ],
     "line": 1456,
     "ui": false,
     "status": "waiting",
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
     "id": "T4.7",
     "title": "E2E: Video studio",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T4.6"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/video.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with MediaGenerationStub and the e2e user fake client; no un-intercepted paid call occurs.",
      "AC2: Each scenario that spends credits asserts the balance through readCredits.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/video.spec.ts --repeat-each=3`"
     ],
     "line": 1467,
     "ui": true,
     "status": "waiting",
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
     "id": "T4.8",
     "title": "Gate: Phase 4 Video studio",
     "done": false,
     "kind": "gate",
     "depends": [
      "T4.7"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint, full unit suites and the phase QA specs pass.",
      "AC2: No regression in image generation or earlier phases."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `bun run check:model-docs`",
      "V4: `cd apps/web && bunx playwright test e2e/qa/video.spec.ts e2e/qa/media-nav-player.spec.ts --repeat-each=2`"
     ],
     "line": 1481,
     "ui": false,
     "status": "waiting",
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
   "id": "5",
   "name": "Tools",
   "startLine": 1497,
   "endLine": 1673,
   "adds": "Users get four utilities: add a watermark to an image or video, create captions for a video, and turn a sketch into an image, each priced and shown before running, with handoffs to the other studios.",
   "tryInUi": [
    "Open Tools then Image watermark",
    "run it and download the result",
    "open Autocaption and upload a short video",
    "draw a sketch and turn it into an image"
   ],
   "checkpoint": {
    "title": "Checkpoint 5",
    "line": 1672,
    "items": [
     "all four tools and handoffs verified by unit tests and the mocked tools QA specs."
    ]
   },
   "tasks": [
    {
     "id": "T5.1",
     "title": "Image watermark tool (S5.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T4.8"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-service.ts",
      "apps/web/src/pages/ToolImageWatermark.vue",
      "apps/web/src/components/Tools/WatermarkForm.vue",
      "apps/web/src/router/index.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Copy processUpscale and its feature route for a single-image utility. The image arrives as an uploadId; the watermark text and position are validated; the default watermark text is never sent (FIXED_INPUTS). Cost is per file. Result is stored as an image-watermark asset and downloadable. Empty state copy: \"Add an image and the text for your watermark.\". Tests are not written here: T5.6, T5.7, T5.8 cover Unit (tools api unit task): MIME and text validation; Unit: payload has no default text; Unit: deduct once; E2E tools spec: 402 and failure; E2E tools spec: download and History; E2E tools spec at 375px and keyboard-only.",
     "spec": "R-TOOL-IW-1, R-TOOL-IW-2, R-INF-4, R-INF-17",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The tool accepts one image up to the cap and rejects other MIME types with specific copy.",
      "AC2: The watermark text is required, within its limit, and the provider default text is never sent.",
      "AC3: Cost is the per-file credits and is charged once on success only.",
      "AC4: 402 opens the low-credits dialog and queues nothing; failure shows \"No credits were used.\".",
      "AC5: The result can be downloaded and appears in History.",
      "AC6: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/api && bun run type-check`",
      "V2: `cd apps/api && bun run test` (existing api tests stay green)",
      "V3: `cd apps/web && bun run test` (existing web tests stay green)",
      "V4: `bun run check`",
      "V5: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /tools/image-watermark path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1502,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.2",
     "title": "Video watermark tool and placement fallback (S5.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.1"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-service.ts",
      "apps/web/src/pages/ToolVideoWatermark.vue",
      "apps/web/src/components/Tools/VideoWatermarkForm.vue",
      "packages/shared/src/models/media-limits.ts",
      "apps/web/src/router/index.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Video is limited to MAX_TOOL_VIDEO_SECONDS = 120 and MAX_TOOL_VIDEO_BYTES = 100MB and billed from the stored upload duration. Gap G10 (RESOLVED 2026-11-16): record VIDEO_WATERMARK_PLACEMENT in media-limits.ts, first by reading the model's published source and public example outputs (no cost). Only if that does not determine the position, exactly ONE owner-approved real paid run of charlesmccarthy/addwatermark is allowed: maximum one call ever, made only by the main orchestrator session (never by a test, e2e run or automated retry), which tells the user the endpoint/model, expected cost and that it is call 1 of 1 immediately before; write the observed position into the constant and record the result in this task. If the read step answers it, no paid call is made. The preview overlays the text on a frame of the user's video and the size slider (1 to 500, default 40) scales it; the caption reads exactly \"Position is fixed by this tool; you can change the text and size.\"; no drag, opacity, colour or logo control exists; the default text FULLJOURNEY.AI is never sent and empty text disables Generate. Route copy: POST /generate/tools/video-watermark follows the music route order (auth, Zod, 402, jobId, enqueue). Duration comes from the Cloudinary-reported value, never the client. Empty state copy: \"Add a video and the text for your watermark.\". Tests are not written here: T5.6, T5.8 cover Unit (tools unit task): limit boundaries; Unit: duration source; E2E tools spec: over-limit copy; E2E tools spec: 402 and failure; E2E tools spec at 375px.",
     "spec": "R-TOOL-VW-1, R-TOOL-VW-2, R-INF-4, R-INF-17",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A video over 120 seconds or 100MB is rejected with specific limit copy and nothing is billed.",
      "AC2: Cost uses the stored upload duration and is charged once on success.",
      "AC3: VIDEO_WATERMARK_PLACEMENT is a named constant sourced per gap G10 (no paid call if the read step answered it; otherwise the single approved run is recorded as call 1 of 1), no test or e2e run made a paid call, and the caption \"Position is fixed by this tool; you can change the text and size.\" is shown.",
      "AC4: 402 and failure states match the shared components.",
      "AC5: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `cd apps/web && bun run test` (existing web tests stay green)",
      "V5: `bun run check`",
      "V6: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /tools/video-watermark path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1527,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.3",
     "title": "Autocaption tool (S5.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.2"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-service.ts",
      "apps/web/src/pages/ToolAutocaption.vue",
      "apps/web/src/components/Tools/CaptionResult.vue",
      "packages/shared/src/models/media-limits.ts",
      "apps/web/src/router/index.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Billing is per 30-second block (G6 blockSec) of the stored duration via getMediaCreditCost. The result shows the captioned video and a transcript the user can copy or download. Transcript text is rendered as text, never as HTML. POST /generate/tools/autocaption is added to routes/media.ts with the music route order. Empty state copy: \"Add a video to caption it.\". Tests are not written here: T5.6, T5.7, T5.8 cover Unit: block rounding at 30, 31 and 120 seconds; Component: transcript actions; Component: escaped HTML; E2E tools spec: 402 and failure; E2E tools spec at 375px and keyboard-only.",
     "spec": "R-TOOL-AC-1, R-TOOL-AC-2, R-TOOL-AC-3, R-INF-4",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A 31 second video bills two blocks and a 30 second video one block.",
      "AC2: The transcript is shown as plain text with Copy and Download buttons.",
      "AC3: A transcript containing HTML tags is displayed escaped.",
      "AC4: 402, failure and no-charge states match the shared components.",
      "AC5: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `bunx vp test run packages/shared` (existing shared tests stay green)",
      "V2: `cd apps/api && bun run type-check`",
      "V3: `cd apps/api && bun run test` (existing api tests stay green)",
      "V4: `cd apps/web && bun run test` (existing web tests stay green)",
      "V5: `bun run check`",
      "V6: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /tools/autocaption path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1552,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "security",
      "ui",
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.4",
     "title": "Sketch to image tool (S5.4)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.3"
     ],
     "files": [
      "apps/web/src/pages/ToolSketchToImage.vue",
      "apps/web/src/components/Tools/SketchCanvas.vue",
      "apps/web/src/components/Tools/SketchToolbar.vue",
      "apps/web/src/composables/useSketchCanvas.ts",
      "apps/web/src/router/index.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. No new drawing library: use a plain canvas. FeatureType.SKETCH is for routing, nav and labels only (G11); copy the reference-image upload of the create page: the flattened PNG goes to POST /generate/reference-images and is sent as referenceImageUrls[0] on POST /generate/image, so credits and history stay the image path and the result is stored as a normal image (no SKETCH value written to Mongo). The model choice is SKETCH_MODEL_KEYS = NANO_BANANA_2, SEEDREAM_4, FLUX_KONTEXT_MAX (existing registry keys). Empty state copy: \"Draw a sketch or upload one, then describe the picture.\". Toolbar: brush, eraser, size, undo, clear with confirmation. Pointer events support mouse, touch and pen; the canvas fits 375px width. Tests are not written here: T5.7, T5.8 cover Unit: stroke history; Component: disabled reason copy; E2E tools spec: generate sends reference image and uses image cost; Component: keyboard toolbar and aria; E2E tools spec at 375px.",
     "spec": "R-TOOL-SK-1, R-TOOL-SK-2, R-TOOL-SK-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Drawing with pointer events paints strokes; undo removes the last stroke and clear asks for confirmation.",
      "AC2: Generate sends the sketch as a reference image through the existing image route with one of the 3 sketch models, the image credit cost is shown, and the result appears under the Images history filter.",
      "AC3: An empty canvas disables Generate with the reason \"Draw something first.\".",
      "AC4: Brush and eraser are keyboard selectable and the canvas has a text alternative.",
      "AC5: At 375px width there is no horizontal scroll and tap targets are at least 44px high. Every interactive element has a visible focus ring and an accessible name and works by keyboard alone. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /tools/sketch path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1577,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
     "surfaces": [
      "ui",
      "logic",
      "security"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.5",
     "title": "Handoffs between studios and final integration (S5.5)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.4"
     ],
     "files": [
      "apps/web/src/components/Studio/HandoffMenu.vue",
      "apps/web/src/components/Studio/ResultCard.vue",
      "apps/web/src/components/History/History.vue",
      "apps/web/src/composables/useStudioHandoff.ts"
     ],
     "gherkin": null,
     "do": "Run the impeccable skill first (never frontend-design). Reuse existing design tokens and primitives; no generic AI look; obey Standing UI rules in the header. Result and History items offer Use in... actions: a video result to Video watermark and Autocaption (R-VID-5), an image to Image watermark, any image to the Video image input; audio offers no handoff. A handoff passes an asset id, never a raw URL, and the target page loads it through the assets API with user scoping. Unsupported handoffs are not shown. Tests are not written here: T5.7, T5.8 cover Component: menu options per asset type; E2E tools spec: preloaded target; E2E tools spec: not-found state; Component: keyboard and focus; E2E tools spec at 375px.",
     "spec": "R-QOL-1, R-QOL-2, R-QOL-3",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A video result offers Video watermark and Autocaption and an image result offers Image watermark; unsupported targets are absent.",
      "AC2: Choosing a handoff opens the target with the asset preloaded.",
      "AC3: A handoff with another user's asset id shows the not-found state and loads nothing.",
      "AC4: The menu is keyboard operable and returns focus on close.",
      "AC5: At 375px width there is no horizontal scroll and tap targets are at least 44px high. With prefers-reduced-motion the animations are disabled."
     ],
     "verify": [
      "V1: `cd apps/web && bun run test` (existing web tests stay green)",
      "V2: `bun run check`",
      "V3: agent-browser visual pass (evidence only, not behaviour): `export AGENT_BROWSER_SESSION=visual-ai`, signed in as the seeded e2e QA user (storage state AUTH_STATE_PATH from e2e/support/env.ts), open WEB_URL plus the /video path on the always-running dev server (never start it), screenshot at 1280px and 375px in light and dark, never press a paid Generate outside a stubbed spec, then `agent-browser close`"
     ],
     "line": 1599,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "medium",
     "surfaces": [
      "ui",
      "logic",
      "security"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "sonnet"
      },
      {
       "name": "ux",
       "model": "sonnet"
      },
      {
       "name": "ui",
       "model": "sonnet"
      },
      {
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.6",
     "title": "Unit: Tool services and media limits",
     "done": false,
     "kind": "unit",
     "depends": [
      "T5.5"
     ],
     "files": [
      "apps/api/src/services/media-service.ts",
      "apps/api/src/routes/media.ts",
      "apps/api/src/lib/media-input.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/services/media-service.test.ts src/routes/media.test.ts src/lib/media-input.test.ts --coverage --coverage.include=src/services/media-service.ts --coverage.include=src/routes/media.ts --coverage.include=src/lib/media-input.ts --coverage.reporter=text`"
     ],
     "line": 1621,
     "ui": false,
     "status": "waiting",
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
     "id": "T5.7",
     "title": "Unit: Tool forms, sketch canvas and handoffs",
     "done": false,
     "kind": "unit",
     "depends": [
      "T5.6"
     ],
     "files": [
      "apps/web/src/components/Tools/WatermarkForm.vue",
      "apps/web/src/components/Tools/CaptionResult.vue",
      "apps/web/src/composables/useSketchCanvas.ts",
      "apps/web/src/composables/useStudioHandoff.ts",
      "apps/web/src/components/Studio/HandoffMenu.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Mock-only: Replicate, DeepSeek, Cloudinary, Dodo and email clients are injected fakes or vi.mock stubs; no test makes a network call, starts a server or reads a live key."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Tools src/composables/useSketchCanvas.test.ts src/composables/useStudioHandoff.test.ts src/components/Studio/HandoffMenu.test.ts --coverage --coverage.include=src/components/Tools/WatermarkForm.vue --coverage.include=src/components/Tools/CaptionResult.vue --coverage.include=src/composables/useSketchCanvas.ts --coverage.include=src/composables/useStudioHandoff.ts --coverage.include=src/components/Studio/HandoffMenu.vue --coverage.reporter=text`"
     ],
     "line": 1632,
     "ui": true,
     "status": "waiting",
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
     "id": "T5.8",
     "title": "E2E: Tools: watermarks, autocaption and sketch",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T5.7"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/tools.spec.ts`",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with MediaGenerationStub and the e2e user fake client; no un-intercepted paid call occurs.",
      "AC2: Each scenario that spends credits asserts the balance through readCredits.",
      "AC3: Mock-only: MediaGenerationStub (or GenerationStub for image paths) intercepts the paid POST itself (POST /generate/audio/_, /generate/video, /generate/tools/_, /generate/image, /prompt/lyrics), not only progress and result URLs; the API serves the E2E_USER_IDS Clerk user its fake Replicate client; paidCallGuard fails the run on any un-intercepted paid call and is never bypassed, narrowed or opted out of; no test starts the server."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/tools.spec.ts --repeat-each=3`"
     ],
     "line": 1643,
     "ui": true,
     "status": "waiting",
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
     "id": "T5.9",
     "title": "Gate: final media studio walkthrough and definition of done",
     "done": false,
     "kind": "gate",
     "depends": [
      "T5.8"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every earlier phase gate passed and each QA spec passes: media-pipeline, media-nav-player, song, lyrics, editor, music, speech, voice-clone, video, tools.",
      "AC2: The full unit and e2e suites pass with paidCallGuard on and zero un-intercepted paid calls.",
      "AC3: Open questions G1 to G13 and the approvals are resolved or carry their applied default in APPROVALS.md."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `bun run check:model-docs`",
      "V4: `cd apps/web && bunx playwright test e2e/qa/media-pipeline.spec.ts e2e/qa/media-nav-player.spec.ts e2e/qa/song.spec.ts e2e/qa/lyrics.spec.ts e2e/qa/editor.spec.ts e2e/qa/music.spec.ts e2e/qa/speech.spec.ts e2e/qa/voice-clone.spec.ts e2e/qa/video.spec.ts e2e/qa/tools.spec.ts --repeat-each=2`"
     ],
     "line": 1657,
     "ui": false,
     "status": "waiting",
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
   "total": 9,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
  }
 ],
 "current": null,
 "nextCommand": "/build-phases agent_docs/media-studio/TASKS.md phase 4",
 "questions": [
  {
   "at": "2026-11-16T02:52:56.327Z",
   "type": "question",
   "tasks": [],
   "id": "Q1",
   "text": "G1: How is P-Video audio cost billed?",
   "default": "Stored audio duration clamped to 20 seconds, shown as Estimated",
   "alternatives": "Flat per-video price; bill on requested duration",
   "answer": "T0.29 credit-drop: drop the scenario; amend Scenarios/AC1; rely on T0.11 credit-deduction unit tests",
   "answeredAt": "2026-11-22T16:45:08.687Z"
  },
  {
   "at": "2026-11-16T02:52:56.377Z",
   "type": "question",
   "tasks": [],
   "id": "Q2",
   "text": "G2: The /media/* endpoint names are not in the spec. Use the plan names?",
   "default": "Use the plan names",
   "alternatives": "Owner supplies different endpoint names",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:56.423Z",
   "type": "question",
   "tasks": [],
   "id": "Q3",
   "text": "G3: One history cap for images plus media, or separate caps?",
   "default": "One combined cap",
   "alternatives": "Separate cap per media type",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:56.469Z",
   "type": "question",
   "tasks": [],
   "id": "Q4",
   "text": "G4: Keep the VoiceConsent record after a voice is deleted?",
   "default": "Retained as an audit record",
   "alternatives": "Delete it with the voice",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:56.515Z",
   "type": "question",
   "tasks": [],
   "id": "Q5",
   "text": "G5: How many cloned voices per user?",
   "default": "MAX_VOICES_PER_USER = 10",
   "alternatives": "Lower or higher cap; tie to plan tier",
   "answer": "Owner decision: no voice cloning. Skip the paid clone test call; descope clone work (T3.8, T3.9, T3.15 removed, clone parts dropped from other P3 tasks).",
   "answeredAt": "2026-11-24T03:07:17.359Z"
  },
  {
   "at": "2026-11-16T02:52:56.560Z",
   "type": "question",
   "tasks": [],
   "id": "Q6",
   "text": "G6: Add a blockSec field to the pricing unit for Autocaption?",
   "default": "Yes, blockSec added",
   "alternatives": "Bill autocaption per second with no blocks",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:56.607Z",
   "type": "question",
   "tasks": [],
   "id": "Q7",
   "text": "G7: Share one HTMLAudioElement between the mini-player and wavesurfer?",
   "default": "One shared element",
   "alternatives": "Separate elements kept in sync",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:56.657Z",
   "type": "question",
   "tasks": [],
   "id": "Q8",
   "text": "G8: What shows on a studio route before its page ships?",
   "default": "StudioPlaceholder renders",
   "alternatives": "Hide the nav item until the page ships",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:56.711Z",
   "type": "question",
   "tasks": [],
   "id": "Q9",
   "text": "G9: Approve four new Mongo collections: MediaAsset, MediaUpload, Voice, VoiceConsent?",
   "default": "Planned as the first task, built only after owner approval",
   "alternatives": "Reuse existing collections with a type field",
   "answer": "Approved by owner 2026-11-16: all four collections",
   "answeredAt": "2026-11-16T03:09:22.943Z"
  },
  {
   "at": "2026-11-16T02:52:56.762Z",
   "type": "question",
   "tasks": [],
   "id": "Q10",
   "text": "G10: Where does VIDEO_WATERMARK_PLACEMENT come from (never an unapproved paid run)?",
   "default": "Public model source or example outputs; else null and the preview makes no position claim",
   "alternatives": "Owner supplies a sample output; one approved paid run",
   "answer": "Read the public source first; only if that fails, one owner-approved paid run (call 1 of 1, main session only, announced with cost first)",
   "answeredAt": "2026-11-16T03:09:23.018Z"
  },
  {
   "at": "2026-11-16T02:52:56.846Z",
   "type": "question",
   "tasks": [],
   "id": "Q11",
   "text": "G11: Is Sketch its own history type?",
   "default": "No: FeatureType.SKETCH is routing, nav and labels only; results are normal images under the Images filter",
   "alternatives": "Separate Sketch history filter",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:56.934Z",
   "type": "question",
   "tasks": [],
   "id": "Q12",
   "text": "G12: Lyrics section rewrite and condense: one endpoint or two?",
   "default": "Multiplexed on POST /prompt/lyrics",
   "alternatives": "Separate endpoints",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:57.012Z",
   "type": "question",
   "tasks": [],
   "id": "Q13",
   "text": "G13: Credit order for media jobs?",
   "default": "Existing runGenerationJob order: run, persist, deduct once, copy to Cloudinary, complete",
   "alternatives": "Reserve-then-settle (out of confirmed intent)",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:57.075Z",
   "type": "question",
   "tasks": [],
   "id": "Q14",
   "text": "G14: Song empty-state sample loop (R-SONG-8): which audio?",
   "default": "Hidden until SONG_SAMPLE_LOOP_URL is set; the 3 example ideas still show",
   "alternatives": "Owner-made loop from a manual generation; licensed stock loop",
   "answer": "Default accepted: hidden until SONG_SAMPLE_LOOP_URL is set",
   "answeredAt": "2026-11-16T03:09:23.078Z"
  },
  {
   "at": "2026-11-16T02:52:57.132Z",
   "type": "question",
   "tasks": [],
   "id": "Q15",
   "text": "G15: Shared package unit test command?",
   "default": "bunx vp test run packages/shared/<spec> from the repo root",
   "alternatives": "Add a test script to packages/shared",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:57.192Z",
   "type": "question",
   "tasks": [],
   "id": "Q16",
   "text": "G16: Page file names?",
   "default": "SPEC names: Music.vue, Speech.vue, Video.vue, Tool*.vue",
   "alternatives": "*Studio.vue naming",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:57.257Z",
   "type": "question",
   "tasks": [],
   "id": "Q17",
   "text": "Approve installing wavesurfer.js for the waveform editor?",
   "default": "Planned; ask before the waveform task",
   "alternatives": "Hand-rolled canvas waveform; another library",
   "answer": "Approved by owner 2026-11-16",
   "answeredAt": "2026-11-16T03:09:23.130Z"
  },
  {
   "at": "2026-11-16T02:52:57.320Z",
   "type": "question",
   "tasks": [],
   "id": "Q18",
   "text": "Approve installing @breezystack/lamejs for MP3 export?",
   "default": "Planned; ask before the export task",
   "alternatives": "WAV export only; another encoder",
   "answer": "Approved by owner 2026-11-16",
   "answeredAt": "2026-11-16T03:09:23.183Z"
  },
  {
   "at": "2026-11-16T02:52:57.387Z",
   "type": "question",
   "tasks": [],
   "id": "Q19",
   "text": "Q3: Cap media jobs in flight per user to avoid a finished job failing at deduction?",
   "default": "No cap; charge-on-success as confirmed",
   "alternatives": "Cap media jobs at 1 in flight per user",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:57.452Z",
   "type": "question",
   "tasks": [],
   "id": "Q20",
   "text": "Q5: Do cloned voice ids expire vendor-side (cloning trains with speech-02-hd)?",
   "default": "Assume they can: R-TTS-10 plus a \"no longer available, re-clone\" state",
   "alternatives": "One owner-approved paid test call before Phase 3",
   "answer": "One owner-approved paid voice-clone test call before Phase 3 (call 1 of 1, main session only, announced with cost first); gate is T3.7",
   "answeredAt": "2026-11-16T03:09:23.235Z"
  },
  {
   "at": "2026-11-16T02:52:57.514Z",
   "type": "question",
   "tasks": [],
   "id": "Q21",
   "text": "Q6: Pro gating for media?",
   "default": "Credits only; all media tier standard",
   "alternatives": "Pro-only for Wan 3, Music 2.6 and voice cloning",
   "answer": "Default accepted: credits only, all media tier standard",
   "answeredAt": "2026-11-16T03:09:23.289Z"
  },
  {
   "at": "2026-11-16T02:52:57.576Z",
   "type": "question",
   "tasks": [],
   "id": "Q22",
   "text": "Q7: Expose Chatterbox reference_audio zero-shot cloning?",
   "default": "Not in v1",
   "alternatives": "Expose it with the same consent flow",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-16T02:52:57.638Z",
   "type": "question",
   "tasks": [],
   "id": "Q23",
   "text": "Q8: Final legal copy for commercial use and the cloning consent sentence?",
   "default": "Drafted copy ships; legal can revise without a spec change",
   "alternatives": "Hold voice cloning until legal signs off",
   "answer": "Default accepted: drafted copy ships",
   "answeredAt": "2026-11-16T03:09:23.343Z"
  },
  {
   "at": "2026-11-23T13:09:06.308Z",
   "type": "question",
   "tasks": [
    "T2.1"
   ],
   "id": "Q24",
   "text": "AC3 says Stable Audio cost scales with duration, but registry/SPEC price it flat per file",
   "default": "flat per-file cost computed server-side, duration validated only",
   "alternatives": "change registry to per-second",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-23T13:35:40.820Z",
   "type": "question",
   "tasks": [
    "T2.1"
   ],
   "id": "Q25",
   "text": "AC3 says Stable Audio cost scales with duration, but SPEC.md (lines 89, 218, 221, 301) and the registry price it flat at $0.20 per file. Code follows SPEC. Amend AC3 to flat per-file, or change SPEC and registry to per-second?",
   "answer": "Flat per file; AC3 and Do text amended in TASKS.md",
   "answeredAt": "2026-11-23T13:36:49.967Z"
  }
 ],
 "stuck": [],
 "commits": [
  {
   "at": "2026-11-23T13:39:55.052Z",
   "ok": true,
   "phase": "2",
   "tasks": [
    "T2.1",
    "T2.2",
    "T2.3",
    "T2.4",
    "T2.5",
    "T2.6",
    "T2.7"
   ],
   "attempt": "6",
   "branch": "feature/media-studio",
   "pushed": true,
   "evidence": "e2e music 25/25 x3, unit 100% lines",
   "error": null,
   "sha": "7e0357df6f0b7ed99ce59b660b8d08dee4ff2320",
   "shortSha": "7e0357d",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/7e0357df6f0b7ed99ce59b660b8d08dee4ff2320",
   "subject": "feat(media): phase 2 music studio",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-23T19:09:47+05:30",
   "filesChanged": 21,
   "added": 2620,
   "removed": 505
  },
  {
   "at": "2026-11-23T13:00:20.615Z",
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
    "T1.16",
    "T1.17",
    "T1.18",
    "T1.19"
   ],
   "attempt": "1",
   "branch": "feature/media-studio",
   "pushed": true,
   "evidence": "song e2e 8/8, lyrics e2e 6/6, web 2197/2197, lowest unit coverage 87.5% funcs (LyricsEditor)",
   "error": null,
   "sha": "54dfc63962934a247043eb24e706425cc613db8d",
   "shortSha": "54dfc63",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/54dfc63962934a247043eb24e706425cc613db8d",
   "subject": "feat(media): phase 1 song studio",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-23T18:30:12+05:30",
   "filesChanged": 60,
   "added": 9343,
   "removed": 871
  },
  {
   "at": "2026-11-23T02:00:53.725Z",
   "ok": true,
   "phase": "0",
   "tasks": [
    "T0.1",
    "T0.2",
    "T0.3",
    "T0.4",
    "T0.5",
    "T0.6",
    "T0.7",
    "T0.8",
    "T0.9",
    "T0.10",
    "T0.11",
    "T0.12",
    "T0.13",
    "T0.14",
    "T0.15",
    "T0.16",
    "T0.17",
    "T0.18",
    "T0.19",
    "T0.20",
    "T0.21",
    "T0.22",
    "T0.23",
    "T0.24",
    "T0.25",
    "T0.26",
    "T0.27",
    "T0.28",
    "T0.29",
    "T0.30",
    "T0.31"
   ],
   "attempt": "17",
   "branch": "feature/media-studio",
   "pushed": true,
   "evidence": "root tests 3543/3543, media-pipeline+nav-player e2e 16/16, lowest unit branch coverage 94.11%",
   "error": null,
   "sha": "b2c2a6c7e5ff469d21351e8b28c2ab97bb054b6a",
   "shortSha": "b2c2a6c",
   "url": "https://github.com/deepakkumardewani/visual-ai/commit/b2c2a6c7e5ff469d21351e8b28c2ab97bb054b6a",
   "subject": "feat(media): phase 0 shared media infrastructure",
   "missing": false,
   "author": "Deepak Dewani",
   "committedAt": "2026-11-23T07:30:46+05:30",
   "filesChanged": 144,
   "added": 16425,
   "removed": 958
  }
 ],
 "shots": [
  {
   "taskId": "T0.18",
   "kind": "proof",
   "step": "AC2/AC4 Audio menu opens",
   "attempt": 1,
   "caption": "Audio menu open with Song, Music and Speech; Audio tab highlighted with caret.",
   "annotations": [
    {
     "x": 39,
     "y": 8,
     "w": 25,
     "h": 24,
     "label": "Audio dropdown items"
    }
   ],
   "at": "2026-11-22T16:02:23.124Z",
   "file": "0/T0.18-1.png",
   "phase": "0",
   "href": "shots/0/T0.18-1.png"
  },
  {
   "taskId": "T0.18",
   "kind": "proof",
   "step": "AC6 mobile accordion",
   "attempt": 1,
   "caption": "At 375px the Audio and Tools groups form an accordion with no horizontal scroll.",
   "annotations": [
    {
     "x": 4,
     "y": 22,
     "w": 92,
     "h": 50,
     "label": "Accordion items"
    }
   ],
   "at": "2026-11-22T16:02:30.082Z",
   "file": "0/T0.18-2.png",
   "phase": "0",
   "href": "shots/0/T0.18-2.png"
  },
  {
   "taskId": "T0.19",
   "kind": "proof",
   "step": "AC6/AC4 mobile placeholder accent",
   "attempt": 1,
   "caption": "Music placeholder at 375px with a cool accent bar, no horizontal scroll.",
   "annotations": [
    {
     "x": 4,
     "y": 51,
     "w": 92,
     "h": 26,
     "label": "Placeholder with studio accent"
    }
   ],
   "at": "2026-11-22T16:02:30.151Z",
   "file": "0/T0.19-1.png",
   "phase": "0",
   "href": "shots/0/T0.19-1.png"
  },
  {
   "taskId": "T0.19",
   "kind": "proof",
   "step": "AC3 Song placeholder",
   "attempt": 1,
   "caption": "Song placeholder shows \"Song studio is coming soon\" and a Back to Image link.",
   "annotations": [
    {
     "x": 7,
     "y": 10,
     "w": 35,
     "h": 33,
     "label": "Title, copy and Back to Image link"
    }
   ],
   "at": "2026-11-22T16:02:34.030Z",
   "file": "0/T0.19-2.png",
   "phase": "0",
   "href": "shots/0/T0.19-2.png"
  },
  {
   "taskId": "T0.21",
   "kind": "proof",
   "step": "AC1 mini-player appears with title and time",
   "attempt": 1,
   "caption": "After pressing play on a track the 56px mini-player appears with title, scrubber, time readout and close button.",
   "annotations": [
    {
     "x": 4,
     "y": 93,
     "w": 92,
     "h": 7,
     "label": "Mini-player bar"
    }
   ],
   "at": "2026-11-22T16:03:28.725Z",
   "file": "0/T0.21-1.png",
   "phase": "0",
   "href": "shots/0/T0.21-1.png"
  },
  {
   "taskId": "T0.22",
   "kind": "proof",
   "step": "AC1/AC3 media in History",
   "attempt": 1,
   "caption": "History lists media under date groups with Song/Music/Speech/Video/Tools filter chips and play controls.",
   "annotations": [
    {
     "x": 18,
     "y": 10,
     "w": 38,
     "h": 12,
     "label": "Media filter chips"
    },
    {
     "x": 3,
     "y": 31,
     "w": 94,
     "h": 9,
     "label": "Audio items with play control"
    }
   ],
   "at": "2026-11-22T16:03:21.940Z",
   "file": "0/T0.22-1.png",
   "phase": "0",
   "href": "shots/0/T0.22-1.png"
  },
  {
   "taskId": "T0.22",
   "kind": "proof",
   "step": "AC3 audio plays via shared player",
   "attempt": 1,
   "caption": "History audio item plays through the shared player (inline card and mini-player).",
   "annotations": [
    {
     "x": 3,
     "y": 31,
     "w": 19,
     "h": 19,
     "label": "Inline player in card"
    },
    {
     "x": 4,
     "y": 93,
     "w": 92,
     "h": 7,
     "label": "Shared mini-player"
    }
   ],
   "at": "2026-11-22T16:03:28.799Z",
   "file": "0/T0.22-2.png",
   "phase": "0",
   "href": "shots/0/T0.22-2.png"
  },
  {
   "taskId": "T0.22",
   "kind": "proof",
   "step": "History audio card",
   "attempt": 2,
   "caption": "History audio card with mini-player (dark theme)",
   "annotations": [
    {
     "x": 5,
     "y": 20,
     "w": 90,
     "h": 25,
     "label": "audio history card"
    }
   ],
   "at": "2026-11-22T16:13:33.335Z",
   "file": "0/T0.22-3.png",
   "phase": "0",
   "href": "shots/0/T0.22-3.png"
  },
  {
   "taskId": "T0.22",
   "kind": "proof",
   "step": "History audio card",
   "attempt": 2,
   "caption": "History audio card with mini-player (light theme)",
   "annotations": [
    {
     "x": 5,
     "y": 20,
     "w": 90,
     "h": 25,
     "label": "audio history card"
    }
   ],
   "at": "2026-11-22T16:13:33.538Z",
   "file": "0/T0.22-4.png",
   "phase": "0",
   "href": "shots/0/T0.22-4.png"
  },
  {
   "taskId": "T0.25",
   "kind": "proof",
   "step": "AC3 popover lists every shortcut",
   "attempt": 1,
   "caption": "Shortcuts popover lists every media shortcut (Space, arrows, M, L, brackets) beside the existing ones.",
   "annotations": [
    {
     "x": 34,
     "y": 13,
     "w": 32,
     "h": 75,
     "label": "Shortcut list"
    }
   ],
   "at": "2026-11-22T16:02:43.357Z",
   "file": "0/T0.25-1.png",
   "phase": "0",
   "href": "shots/0/T0.25-1.png"
  },
  {
   "taskId": "T0.25",
   "kind": "proof",
   "step": "AC3: ? opens, Escape closes",
   "attempt": 2,
   "caption": "? opens the keyboard shortcuts popover (dark theme); Escape closes it",
   "annotations": [
    {
     "x": 30,
     "y": 15,
     "w": 40,
     "h": 60,
     "label": "shortcuts popover"
    }
   ],
   "at": "2026-11-22T16:13:33.215Z",
   "file": "0/T0.25-2.png",
   "phase": "0",
   "href": "shots/0/T0.25-2.png"
  },
  {
   "taskId": "T0.25",
   "kind": "proof",
   "step": "AC3: ? opens, Escape closes",
   "attempt": 2,
   "caption": "? opens the keyboard shortcuts popover (light theme); Escape closes it",
   "annotations": [
    {
     "x": 30,
     "y": 15,
     "w": 40,
     "h": 60,
     "label": "shortcuts popover"
    }
   ],
   "at": "2026-11-22T16:13:33.435Z",
   "file": "0/T0.25-3.png",
   "phase": "0",
   "href": "shots/0/T0.25-3.png"
  },
  {
   "taskId": "T0.25",
   "kind": "proof",
   "step": "AC3",
   "attempt": 1,
   "caption": "Verifier retake: ? on /create/image opens the Keyboard shortcuts popover listing all 12 MEDIA_SHORTCUTS (on /audio/song ? does nothing)",
   "annotations": [
    {
     "x": 33.7,
     "y": 12.6,
     "w": 32.5,
     "h": 74.8,
     "label": "shortcuts popover"
    }
   ],
   "at": "2026-11-22T16:32:47.512Z",
   "file": "0/T0.25-4.png",
   "phase": "0",
   "href": "shots/0/T0.25-4.png"
  },
  {
   "taskId": "T0.25",
   "kind": "proof",
   "step": "AC2/AC3: global shortcuts work on every route",
   "attempt": 3,
   "caption": "? opens the keyboard shortcuts popover on /audio/song, a non-Dashboard route.",
   "annotations": [
    {
     "x": 35.7,
     "y": 7.6,
     "w": 28.6,
     "h": 95,
     "label": "Shortcuts popover open on /audio/song"
    }
   ],
   "at": "2026-11-22T16:38:26.465Z",
   "file": "0/T0.25-5.png",
   "phase": "0",
   "href": "shots/0/T0.25-5.png"
  },
  {
   "taskId": "T0.26",
   "kind": "proof",
   "step": "AC2 pricing rows per media model",
   "attempt": 1,
   "caption": "Pricing lists one row per media model grouped Song, Music, Speech, Video with credit costs.",
   "annotations": [
    {
     "x": 5,
     "y": 57,
     "w": 92,
     "h": 40,
     "label": "Media model price rows"
    }
   ],
   "at": "2026-11-22T16:02:53.490Z",
   "file": "0/T0.26-1.png",
   "phase": "0",
   "href": "shots/0/T0.26-1.png"
  },
  {
   "taskId": "T0.26",
   "kind": "proof",
   "step": "AC3 no horizontal scroll at 375px",
   "attempt": 1,
   "caption": "At 375px the media price rows fit with no horizontal scroll (scrollWidth 375).",
   "annotations": [
    {
     "x": 4,
     "y": 50,
     "w": 92,
     "h": 48,
     "label": "Media rows within viewport"
    }
   ],
   "at": "2026-11-22T16:03:08.899Z",
   "file": "0/T0.26-2.png",
   "phase": "0",
   "href": "shots/0/T0.26-2.png"
  },
  {
   "taskId": "T0.26",
   "kind": "proof",
   "step": "AC3 media FAQs shown",
   "attempt": 1,
   "caption": "Pricing FAQ includes the media questions (speech model, tags, text limit, speech cost).",
   "annotations": [
    {
     "x": 4,
     "y": 38,
     "w": 92,
     "h": 58,
     "label": "Media FAQ entries"
    }
   ],
   "at": "2026-11-22T16:03:13.448Z",
   "file": "0/T0.26-3.png",
   "phase": "0",
   "href": "shots/0/T0.26-3.png"
  },
  {
   "taskId": "T0.30",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Audio menu open from the keyboard with the first item focused",
   "annotations": [],
   "at": "2026-11-22T15:58:47.639Z",
   "file": "0/T0.30-1.png",
   "phase": "0",
   "href": "shots/0/T0.30-1.png"
  },
  {
   "taskId": "T0.30",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Mini-player keeps playing the History track on a studio route",
   "annotations": [],
   "at": "2026-11-22T15:58:47.707Z",
   "file": "0/T0.30-2.png",
   "phase": "0",
   "href": "shots/0/T0.30-2.png"
  },
  {
   "taskId": "T0.30",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Second History track replaces the first in the mini-player",
   "annotations": [],
   "at": "2026-11-22T15:58:47.773Z",
   "file": "0/T0.30-3.png",
   "phase": "0",
   "href": "shots/0/T0.30-3.png"
  },
  {
   "taskId": "T0.30",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Question mark opens the keyboard shortcuts popover",
   "annotations": [],
   "at": "2026-11-22T15:58:47.840Z",
   "file": "0/T0.30-4.png",
   "phase": "0",
   "href": "shots/0/T0.30-4.png"
  },
  {
   "taskId": "T0.30",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "History with the Song filter shows only the song asset",
   "annotations": [],
   "at": "2026-11-22T15:58:47.912Z",
   "file": "0/T0.30-5.png",
   "phase": "0",
   "href": "shots/0/T0.30-5.png"
  },
  {
   "taskId": "T0.30",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "375px Audio accordion with 44px items and no horizontal scroll",
   "annotations": [],
   "at": "2026-11-22T15:58:47.981Z",
   "file": "0/T0.30-6.png",
   "phase": "0",
   "href": "shots/0/T0.30-6.png"
  },
  {
   "taskId": "T1.3",
   "kind": "proof",
   "step": "AC1/AC3 empty state and counters",
   "attempt": 2,
   "caption": "Song studio empty state with style chips, three example ideas, lyrics ruler and counters.",
   "annotations": [
    {
     "x": 7,
     "y": 19,
     "w": 39,
     "h": 13,
     "label": "style counter and chips"
    },
    {
     "x": 54,
     "y": 11,
     "w": 39,
     "h": 12,
     "label": "empty state copy"
    }
   ],
   "at": "2026-11-23T07:11:37.995Z",
   "file": "1/T1.3-1.png",
   "phase": "1",
   "href": "shots/1/T1.3-1.png"
  },
  {
   "taskId": "T1.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Song generated, result card with Play focused",
   "annotations": [],
   "at": "2026-11-23T07:18:11.192Z",
   "file": "1/T1.6-1.png",
   "phase": "1",
   "href": "shots/1/T1.6-1.png"
  },
  {
   "taskId": "T1.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "402 opens the Low credits dialog",
   "annotations": [],
   "at": "2026-11-23T07:18:11.327Z",
   "file": "1/T1.6-2.png",
   "phase": "1",
   "href": "shots/1/T1.6-2.png"
  },
  {
   "taskId": "T1.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Failure shows No credits were used",
   "annotations": [],
   "at": "2026-11-23T07:18:11.427Z",
   "file": "1/T1.6-3.png",
   "phase": "1",
   "href": "shots/1/T1.6-3.png"
  },
  {
   "taskId": "T1.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Result in History playing in the mini-player",
   "annotations": [],
   "at": "2026-11-23T07:18:11.525Z",
   "file": "1/T1.6-4.png",
   "phase": "1",
   "href": "shots/1/T1.6-4.png"
  },
  {
   "taskId": "T1.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Example idea fills style and lyrics",
   "annotations": [],
   "at": "2026-11-23T07:18:11.625Z",
   "file": "1/T1.6-5.png",
   "phase": "1",
   "href": "shots/1/T1.6-5.png"
  },
  {
   "taskId": "T1.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "375px layout without horizontal scroll",
   "annotations": [],
   "at": "2026-11-23T07:18:11.729Z",
   "file": "1/T1.6-6.png",
   "phase": "1",
   "href": "shots/1/T1.6-6.png"
  },
  {
   "taskId": "T1.8",
   "kind": "after",
   "step": "AC2 suggestion with Accept/Undo",
   "attempt": 1,
   "caption": "Write from a theme shows a reviewable suggestion with Accept and Discard; the original lyrics stay untouched underneath.",
   "annotations": [
    {
     "x": 6.9,
     "y": 46.8,
     "w": 43.8,
     "h": 24.2,
     "label": "Suggestion box with Accept and Discard"
    }
   ],
   "at": "2026-11-23T07:57:06.917Z",
   "file": "1/T1.8-1.png",
   "phase": "1",
   "href": "shots/1/T1.8-1.png"
  },
  {
   "taskId": "T1.8",
   "kind": "after",
   "step": "AC1 Fit to limit visible over limit",
   "attempt": 1,
   "caption": "Over the 3000-char limit the AI menu lists Fit to limit, but the item labels render near-black on the dark menu and are barely legible.",
   "annotations": [
    {
     "x": 6.9,
     "y": 46.8,
     "w": 14.9,
     "h": 22.9,
     "label": "AI menu with Write, Rewrite and Fit to limit (low-contrast text)"
    }
   ],
   "at": "2026-11-23T07:57:07.028Z",
   "file": "1/T1.8-2.png",
   "phase": "1",
   "href": "shots/1/T1.8-2.png"
  },
  {
   "taskId": "T1.8",
   "kind": "after",
   "step": "AC5: menu operable and legible",
   "attempt": 3,
   "caption": "The AI help menu items are now readable ink on the dark popover.",
   "annotations": [
    {
     "x": 7.9,
     "y": 69.5,
     "w": 13,
     "h": 11.5,
     "label": "menu items in light ink"
    }
   ],
   "at": "2026-11-23T08:02:37.805Z",
   "file": "1/T1.8-3.png",
   "phase": "1",
   "href": "shots/1/T1.8-3.png"
  },
  {
   "taskId": "T1.8",
   "kind": "after",
   "step": "AC1 Fit to limit visible over the limit",
   "attempt": 19,
   "caption": "Over the 3000-character limit the counter turns red and the AI help menu lists Fit to limit in legible ink.",
   "annotations": [
    {
     "x": 7.9,
     "y": 67.4,
     "w": 13,
     "h": 5.5,
     "label": "Fit to limit item"
    },
    {
     "x": 46.5,
     "y": 37.6,
     "w": 4.1,
     "h": 2,
     "label": "3247/3000 counter in danger red"
    }
   ],
   "at": "2026-11-23T08:40:48.274Z",
   "file": "1/T1.8-4.png",
   "phase": "1",
   "href": "shots/1/T1.8-4.png"
  },
  {
   "taskId": "T1.8",
   "kind": "after",
   "step": "AC2 Accept replaces, Undo restores",
   "attempt": 19,
   "caption": "After Accept the suggestion replaces the lyrics and an Undo button appears; Undo restored the original text.",
   "annotations": [
    {
     "x": 6.9,
     "y": 47.3,
     "w": 12.4,
     "h": 5.5,
     "label": "Lyrics replaced. with Undo"
    }
   ],
   "at": "2026-11-23T08:40:48.404Z",
   "file": "1/T1.8-5.png",
   "phase": "1",
   "href": "shots/1/T1.8-5.png"
  },
  {
   "taskId": "T1.8",
   "kind": "after",
   "step": "AC3 loading state",
   "attempt": 19,
   "caption": "While a lyrics request is pending the AI help button is disabled and shows a spinner with Writing.",
   "annotations": [
    {
     "x": 6.9,
     "y": 47.3,
     "w": 7.9,
     "h": 5.5,
     "label": "disabled trigger with spinner"
    }
   ],
   "at": "2026-11-23T08:40:48.506Z",
   "file": "1/T1.8-6.png",
   "phase": "1",
   "href": "shots/1/T1.8-6.png"
  },
  {
   "taskId": "T1.8",
   "kind": "after",
   "step": "AC3 failure keeps lyrics",
   "attempt": 19,
   "caption": "A failed lyrics request shows the mapped toast and leaves the lyrics untouched.",
   "annotations": [
    {
     "x": 80.7,
     "y": 92.5,
     "w": 18.1,
     "h": 5.5,
     "label": "failure toast"
    },
    {
     "x": 6.9,
     "y": 54.8,
     "w": 43.8,
     "h": 42.2,
     "label": "lyrics unchanged"
    }
   ],
   "at": "2026-11-23T08:40:48.600Z",
   "file": "1/T1.8-7.png",
   "phase": "1",
   "href": "shots/1/T1.8-7.png"
  },
  {
   "taskId": "T1.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Theme suggestion shown for review, lyrics untouched",
   "annotations": [],
   "at": "2026-11-23T07:25:35.187Z",
   "file": "1/T1.10-1.png",
   "phase": "1",
   "href": "shots/1/T1.10-1.png"
  },
  {
   "taskId": "T1.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "429 shows daily-limit copy, lyrics kept",
   "annotations": [],
   "at": "2026-11-23T07:25:35.339Z",
   "file": "1/T1.10-2.png",
   "phase": "1",
   "href": "shots/1/T1.10-2.png"
  },
  {
   "taskId": "T1.10",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Lyrics help at 375px, no overflow",
   "annotations": [],
   "at": "2026-11-23T07:25:35.455Z",
   "file": "1/T1.10-3.png",
   "phase": "1",
   "href": "shots/1/T1.10-3.png"
  },
  {
   "taskId": "T1.11",
   "kind": "after",
   "step": "AC1 trim updates duration; AC2 undo",
   "attempt": 1,
   "caption": "After Trim the displayed length drops to 0:04 and Undo and Reset become enabled.",
   "annotations": [
    {
     "x": 53.8,
     "y": 39.9,
     "w": 39.4,
     "h": 25,
     "label": "Waveform with length and zoom"
    },
    {
     "x": 55,
     "y": 74,
     "w": 32,
     "h": 6,
     "label": "Undo and Reset enabled"
    }
   ],
   "at": "2026-11-23T07:57:07.126Z",
   "file": "1/T1.11-1.png",
   "phase": "1",
   "href": "shots/1/T1.11-1.png"
  },
  {
   "taskId": "T1.11",
   "kind": "after",
   "step": "Handles and waveform at 375px",
   "attempt": 1,
   "caption": "At 375px the waveform shows the selected region with its handles.",
   "annotations": [
    {
     "x": 7.7,
     "y": 54.6,
     "w": 84.8,
     "h": 14.2,
     "label": "Waveform with selected region"
    }
   ],
   "at": "2026-11-23T07:57:07.224Z",
   "file": "1/T1.11-2.png",
   "phase": "1",
   "href": "shots/1/T1.11-2.png"
  },
  {
   "taskId": "T1.12",
   "kind": "after",
   "step": "AC1 disabled tools; AC2 hint copy",
   "attempt": 1,
   "caption": "Before any selection the edit buttons are disabled and the hint reads Drag on the waveform to select a part.",
   "annotations": [
    {
     "x": 54.8,
     "y": 66.2,
     "w": 37.5,
     "h": 17.6,
     "label": "Toolbar with edit tools disabled"
    },
    {
     "x": 54.8,
     "y": 81,
     "w": 17.3,
     "h": 2.2,
     "label": "Exact hint copy"
    }
   ],
   "at": "2026-11-23T07:57:07.323Z",
   "file": "1/T1.12-1.png",
   "phase": "1",
   "href": "shots/1/T1.12-1.png"
  },
  {
   "taskId": "T1.12",
   "kind": "after",
   "step": "AC5 toolbar wraps at 375px",
   "attempt": 1,
   "caption": "At 375px the toolbar wraps onto rows with no horizontal scroll and tall tap targets.",
   "annotations": [
    {
     "x": 7.7,
     "y": 70.6,
     "w": 84.8,
     "h": 18.5,
     "label": "Wrapped toolbar"
    }
   ],
   "at": "2026-11-23T07:57:07.422Z",
   "file": "1/T1.12-2.png",
   "phase": "1",
   "href": "shots/1/T1.12-2.png"
  },
  {
   "taskId": "T1.12",
   "kind": "after",
   "step": "Result controls legible",
   "attempt": 3,
   "caption": "Download pill under the player now reads in the ink colour on the dark surface.",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 40,
     "h": 15,
     "label": "Download label legible"
    }
   ],
   "at": "2026-11-23T08:03:32.104Z",
   "file": "1/T1.12-3.png",
   "phase": "1",
   "href": "shots/1/T1.12-3.png"
  },
  {
   "taskId": "T1.16",
   "kind": "after",
   "step": "AC1 formats and estimate",
   "attempt": 1,
   "caption": "Export dialog offers MP3 or WAV with size estimates, plus Download and Save as new version.",
   "annotations": [
    {
     "x": 32.5,
     "y": 28.2,
     "w": 35,
     "h": 43.6,
     "label": "Export dialog"
    }
   ],
   "at": "2026-11-23T07:57:07.520Z",
   "file": "1/T1.16-1.png",
   "phase": "1",
   "href": "shots/1/T1.16-1.png"
  },
  {
   "taskId": "T1.16",
   "kind": "after",
   "step": "AC7 dialog at 375px",
   "attempt": 1,
   "caption": "The export dialog at 375px fits the screen with no horizontal scroll (scrollWidth 375).",
   "annotations": [
    {
     "x": 4.3,
     "y": 29.7,
     "w": 91.5,
     "h": 40.6,
     "label": "Export dialog at 375px"
    }
   ],
   "at": "2026-11-23T07:57:07.620Z",
   "file": "1/T1.16-2.png",
   "phase": "1",
   "href": "shots/1/T1.16-2.png"
  },
  {
   "taskId": "T1.18",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Editor under the song result shows the empty-selection hint with edit tools disabled",
   "annotations": [],
   "at": "2026-11-23T07:46:52.350Z",
   "file": "1/T1.18-1.png",
   "phase": "1",
   "href": "shots/1/T1.18-1.png"
  },
  {
   "taskId": "T1.18",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "After trimming a selection the editor Length drops below the original",
   "annotations": [],
   "at": "2026-11-23T07:46:52.494Z",
   "file": "1/T1.18-2.png",
   "phase": "1",
   "href": "shots/1/T1.18-2.png"
  },
  {
   "taskId": "T1.18",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Over-cap audio shows the exact export error copy",
   "annotations": [],
   "at": "2026-11-23T07:46:52.598Z",
   "file": "1/T1.18-3.png",
   "phase": "1",
   "href": "shots/1/T1.18-3.png"
  },
  {
   "taskId": "T1.18",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Region set by keyboard only and trimmed",
   "annotations": [],
   "at": "2026-11-23T07:46:52.706Z",
   "file": "1/T1.18-4.png",
   "phase": "1",
   "href": "shots/1/T1.18-4.png"
  },
  {
   "taskId": "T1.18",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Editor at 375px with the toolbar wrapped and no horizontal scroll",
   "annotations": [],
   "at": "2026-11-23T07:46:52.811Z",
   "file": "1/T1.18-5.png",
   "phase": "1",
   "href": "shots/1/T1.18-5.png"
  },
  {
   "taskId": "T2.2",
   "kind": "proof",
   "step": "AC1 empty state copy",
   "attempt": 2,
   "caption": "Empty state shows the exact copy and a Try an example button.",
   "annotations": [
    {
     "x": 54.4,
     "y": 12.2,
     "w": 40,
     "h": 20,
     "label": "empty-state copy and example button"
    }
   ],
   "at": "2026-11-23T13:17:07.311Z",
   "file": "2/T2.2-1.png",
   "phase": "2",
   "href": "shots/2/T2.2-1.png"
  },
  {
   "taskId": "T2.2",
   "kind": "proof",
   "step": "AC1/AC2/AC3 example fills prompt, model select, no duration for Lyria",
   "attempt": 2,
   "caption": "Example filled the prompt; model list with one-line notes, Lyria selected has no duration control.",
   "annotations": [
    {
     "x": 6.9,
     "y": 24,
     "w": 43.8,
     "h": 20,
     "label": "prompt filled by example"
    },
    {
     "x": 6.9,
     "y": 58.8,
     "w": 43.8,
     "h": 31,
     "label": "model select with notes"
    }
   ],
   "at": "2026-11-23T13:17:07.437Z",
   "file": "2/T2.2-2.png",
   "phase": "2",
   "href": "shots/2/T2.2-2.png"
  },
  {
   "taskId": "T2.2",
   "kind": "proof",
   "step": "AC2 duration visible only for supporting models",
   "attempt": 2,
   "caption": "Stable Audio selected: prompt kept and Duration control appears.",
   "annotations": [
    {
     "x": 6.9,
     "y": 92.7,
     "w": 43.8,
     "h": 7,
     "label": "duration control"
    },
    {
     "x": 6.9,
     "y": 58.8,
     "w": 43.8,
     "h": 9.4,
     "label": "selected model"
    }
   ],
   "at": "2026-11-23T13:17:07.561Z",
   "file": "2/T2.2-3.png",
   "phase": "2",
   "href": "shots/2/T2.2-3.png"
  },
  {
   "taskId": "T2.2",
   "kind": "proof",
   "step": "AC6 the draft survives a reload",
   "attempt": 1,
   "caption": "After typing a prompt and reloading the page, the typed prompt is restored from the draft.",
   "annotations": [
    {
     "x": 6.9,
     "y": 30.2,
     "w": 43.8,
     "h": 16.3,
     "label": "prompt restored after reload"
    }
   ],
   "at": "2026-11-23T13:28:27.786Z",
   "file": "2/T2.2-4.png",
   "phase": "2",
   "href": "shots/2/T2.2-4.png"
  },
  {
   "taskId": "T2.2",
   "kind": "proof",
   "step": "AC4/AC5 Mod+Enter submits; 402 dialog is the shared component",
   "attempt": 1,
   "caption": "Ctrl+Enter in the prompt submits; the server answers 402 for the 8-credit QA user, so the shared Low credits dialog opens.",
   "annotations": [
    {
     "x": 31.3,
     "y": 25.8,
     "w": 37.5,
     "h": 48.4,
     "label": "shared Low credits dialog after Mod+Enter"
    }
   ],
   "at": "2026-11-23T13:28:27.955Z",
   "file": "2/T2.2-5.png",
   "phase": "2",
   "href": "shots/2/T2.2-5.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "AC4 visible focus ring",
   "attempt": 2,
   "caption": "Keyboard focus shows a visible ring on the mood chip.",
   "annotations": [
    {
     "x": 6.9,
     "y": 38.3,
     "w": 13.6,
     "h": 6.1,
     "label": "focus ring"
    }
   ],
   "at": "2026-11-23T13:17:07.682Z",
   "file": "2/T2.3-1.png",
   "phase": "2",
   "href": "shots/2/T2.3-1.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "dark mode",
   "attempt": 2,
   "caption": "Studio in dark theme is legible with sufficient contrast.",
   "annotations": [
    {
     "x": 6.9,
     "y": 12,
     "w": 43.8,
     "h": 80,
     "label": "composer in dark mode"
    }
   ],
   "at": "2026-11-23T13:17:07.802Z",
   "file": "2/T2.3-2.png",
   "phase": "2",
   "href": "shots/2/T2.3-2.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "AC4 375px layout",
   "attempt": 2,
   "caption": "At 375px there is no horizontal scroll (375/375).",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 100,
     "h": 100,
     "label": "no horizontal overflow"
    }
   ],
   "at": "2026-11-23T13:17:07.923Z",
   "file": "2/T2.3-3.png",
   "phase": "2",
   "href": "shots/2/T2.3-3.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "AC2/AC4 light 1280px",
   "attempt": 3,
   "caption": "Light theme, 1280px: model cards use the light surface and dark ink tokens; Minimax shows its instrumental-only line.",
   "annotations": [
    {
     "x": 6.9,
     "y": 47.1,
     "w": 43.8,
     "h": 24.4,
     "label": "model cards readable on light surface"
    }
   ],
   "at": "2026-11-23T13:19:33.323Z",
   "file": "2/T2.3-4.png",
   "phase": "2",
   "href": "shots/2/T2.3-4.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "AC4 375px light",
   "attempt": 3,
   "caption": "Light theme, 375px: cards stay legible with no horizontal scroll.",
   "annotations": [
    {
     "x": 4,
     "y": 17,
     "w": 92,
     "h": 41,
     "label": "model cards at 375px"
    }
   ],
   "at": "2026-11-23T13:19:33.485Z",
   "file": "2/T2.3-5.png",
   "phase": "2",
   "href": "shots/2/T2.3-5.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "dark parity",
   "attempt": 3,
   "caption": "Dark theme, 1280px: same cards on the dark surface.",
   "annotations": [
    {
     "x": 6.9,
     "y": 46.8,
     "w": 43.8,
     "h": 24.4,
     "label": "model cards in dark"
    }
   ],
   "at": "2026-11-23T13:19:33.605Z",
   "file": "2/T2.3-6.png",
   "phase": "2",
   "href": "shots/2/T2.3-6.png"
  },
  {
   "taskId": "T2.3",
   "kind": "proof",
   "step": "AC2 lyrics hidden and one-line note in instrumental mode",
   "attempt": 1,
   "caption": "Minimax 2.6 Instrumental selected: no lyrics field, a one-line instrumental note under the model list, result generated via the stub.",
   "annotations": [
    {
     "x": 6.9,
     "y": 75.7,
     "w": 43.8,
     "h": 9.2,
     "label": "Minimax 2.6 Instrumental selected"
    },
    {
     "x": 6.9,
     "y": 87.5,
     "w": 31.5,
     "h": 3.3,
     "label": "one-line instrumental note, no lyrics field"
    }
   ],
   "at": "2026-11-23T13:26:38.729Z",
   "file": "2/T2.3-7.png",
   "phase": "2",
   "href": "shots/2/T2.3-7.png"
  },
  {
   "taskId": "T2.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Lyria generate: result card, balance dropped by 12",
   "annotations": [],
   "at": "2026-11-23T13:13:39.602Z",
   "file": "2/T2.6-1.png",
   "phase": "2",
   "href": "shots/2/T2.6-1.png"
  },
  {
   "taskId": "T2.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "402 opens Low credits dialog",
   "annotations": [],
   "at": "2026-11-23T13:13:39.787Z",
   "file": "2/T2.6-2.png",
   "phase": "2",
   "href": "shots/2/T2.6-2.png"
  },
  {
   "taskId": "T2.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Failure shows No credits were used",
   "annotations": [],
   "at": "2026-11-23T13:13:39.929Z",
   "file": "2/T2.6-3.png",
   "phase": "2",
   "href": "shots/2/T2.6-3.png"
  },
  {
   "taskId": "T2.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Duration control only on Stable Audio, cost 40",
   "annotations": [],
   "at": "2026-11-23T13:13:40.073Z",
   "file": "2/T2.6-4.png",
   "phase": "2",
   "href": "shots/2/T2.6-4.png"
  },
  {
   "taskId": "T2.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Music studio at 375px",
   "annotations": [],
   "at": "2026-11-23T13:13:40.215Z",
   "file": "2/T2.6-5.png",
   "phase": "2",
   "href": "shots/2/T2.6-5.png"
  },
  {
   "taskId": "T2.6",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Lyria success, seeded balance, chip shows realistic remaining credits",
   "annotations": [],
   "at": "2026-11-23T13:33:20.422Z",
   "file": "2/T2.6-6.png",
   "phase": "2",
   "href": "shots/2/T2.6-6.png"
  },
  {
   "taskId": "T2.6",
   "kind": "proof",
   "step": null,
   "attempt": 2,
   "caption": "Verifier retake (x3 run): Lyria success, seeded 500, chip 488 after the per-file 12; supersedes stale T2.6-1 (-4)",
   "annotations": [
    {
     "x": 86,
     "y": 0,
     "w": 9,
     "h": 7,
     "label": "balance 488"
    }
   ],
   "at": "2026-11-23T13:35:19.941Z",
   "file": "2/T2.6-7.png",
   "phase": "2",
   "href": "shots/2/T2.6-7.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC1 empty state copy",
   "attempt": null,
   "caption": "Speech studio empty state with tag toolbar, script counter, model and voice select.",
   "annotations": [
    {
     "x": 55,
     "y": 13,
     "w": 45,
     "h": 20,
     "label": "script editor with live counter"
    }
   ],
   "at": "2026-11-24T02:55:57.016Z",
   "file": "3/T3.3-1.png",
   "phase": "3",
   "href": "shots/3/T3.3-1.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC2: cost updates and reads Estimated for Minimax",
   "attempt": 3,
   "caption": "Minimax Speech 2.8 HD selected: the cost reads 21 credits with an Estimated label for a 1,012-character script.",
   "annotations": [
    {
     "x": 6.9,
     "y": 92,
     "w": 13,
     "h": 4.5,
     "label": "21 credits with Estimated label"
    },
    {
     "x": 6.9,
     "y": 45.8,
     "w": 43.8,
     "h": 9.5,
     "label": "Minimax Speech 2.8 HD selected"
    }
   ],
   "at": "2026-11-24T03:34:24.373Z",
   "file": "3/T3.3-2.png",
   "phase": "3",
   "href": "shots/3/T3.3-2.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC3: over-limit counter in danger colour, text not truncated",
   "attempt": 3,
   "caption": "Chatterbox Turbo with 501 characters: the counter turns danger red and the full script stays in the editor.",
   "annotations": [
    {
     "x": 47,
     "y": 20.5,
     "w": 4,
     "h": 2.5,
     "label": "501/500 counter in danger red"
    },
    {
     "x": 6.9,
     "y": 38.5,
     "w": 44,
     "h": 35,
     "label": "whole script kept"
    }
   ],
   "at": "2026-11-24T03:34:24.559Z",
   "file": "3/T3.3-3.png",
   "phase": "3",
   "href": "shots/3/T3.3-3.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC3: Generate disabled with a reason",
   "attempt": 3,
   "caption": "Over the Chatterbox limit Generate is disabled and the reason under it names the excess characters.",
   "annotations": [
    {
     "x": 40.6,
     "y": 92,
     "w": 10,
     "h": 4.9,
     "label": "Generate disabled"
    },
    {
     "x": 6.9,
     "y": 97.8,
     "w": 43.8,
     "h": 2.2,
     "label": "reason: 512 characters over the 500 limit"
    }
   ],
   "at": "2026-11-24T03:34:24.730Z",
   "file": "3/T3.3-4.png",
   "phase": "3",
   "href": "shots/3/T3.3-4.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC1: Try an example fills the text",
   "attempt": 3,
   "caption": "After Try an example the editor holds the example script and the counter reads 63/2,000",
   "annotations": [
    {
     "x": 6.9,
     "y": 31,
     "w": 43.8,
     "h": 18,
     "label": "example text"
    },
    {
     "x": 46.5,
     "y": 15.5,
     "w": 4.5,
     "h": 3,
     "label": "counter"
    }
   ],
   "at": "2026-11-24T03:44:19.869Z",
   "file": "3/T3.3-5.png",
   "phase": "3",
   "href": "shots/3/T3.3-5.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC4: voice fallback notice (fails: names the previous voice)",
   "attempt": 3,
   "caption": "Minimax HD selected with English_Wiselady, but the status notice reads Voice changed to Andy (the old voice)",
   "annotations": [
    {
     "x": 6.9,
     "y": 82,
     "w": 43.8,
     "h": 5,
     "label": "selected voice"
    },
    {
     "x": 6.6,
     "y": 87.6,
     "w": 10,
     "h": 2.2,
     "label": "wrong notice"
    }
   ],
   "at": "2026-11-24T03:44:20.083Z",
   "file": "3/T3.3-6.png",
   "phase": "3",
   "href": "shots/3/T3.3-6.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC5: success uses shared result card",
   "attempt": 3,
   "caption": "Stubbed success shows the shared result card, player, download and editor",
   "annotations": [
    {
     "x": 53.7,
     "y": 10,
     "w": 39.4,
     "h": 17.8,
     "label": "result card"
    }
   ],
   "at": "2026-11-24T03:44:20.239Z",
   "file": "3/T3.3-7.png",
   "phase": "3",
   "href": "shots/3/T3.3-7.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC5: no-charge failure uses shared error state",
   "attempt": 3,
   "caption": "Stubbed failure shows Generation failed. No credits were used. with Try again",
   "annotations": [
    {
     "x": 53.7,
     "y": 12.2,
     "w": 39.4,
     "h": 15.3,
     "label": "error state"
    }
   ],
   "at": "2026-11-24T03:44:20.393Z",
   "file": "3/T3.3-8.png",
   "phase": "3",
   "href": "shots/3/T3.3-8.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC5: 402",
   "attempt": 5,
   "caption": "A 402 from generate opens the Low credits dialog showing 2 credits available; nothing is queued.",
   "annotations": [
    {
     "x": 31.3,
     "y": 30.7,
     "w": 37.5,
     "h": 38.8,
     "label": "Low credits dialog with required and available credits"
    }
   ],
   "at": "2026-11-24T03:47:00.736Z",
   "file": "3/T3.3-9.png",
   "phase": "3",
   "href": "shots/3/T3.3-9.png"
  },
  {
   "taskId": "T3.3",
   "kind": "proof",
   "step": "AC4: voice fallback notice names the new voice",
   "attempt": 8,
   "caption": "After switching from Inworld TTS 2.0 to Minimax Speech 2.8 HD, the selected voice and the status notice both name English_Wiselady.",
   "annotations": [
    {
     "x": 4,
     "y": 89,
     "w": 92,
     "h": 6,
     "label": "selected fallback voice English_Wiselady"
    },
    {
     "x": 4,
     "y": 95.5,
     "w": 52,
     "h": 2.5,
     "label": "notice reads Voice changed to English_Wiselady"
    }
   ],
   "at": "2026-11-24T03:54:21.697Z",
   "file": "3/T3.3-10.png",
   "phase": "3",
   "href": "shots/3/T3.3-10.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": "AC1: inserting a tag adds one chip",
   "attempt": null,
   "caption": "Laugh chip inserted inline at the cursor in the speech editor",
   "annotations": [
    {
     "x": 16.5,
     "y": 36.9,
     "w": 6.1,
     "h": 3.5,
     "label": "Laugh chip with remove button"
    }
   ],
   "at": "2026-11-24T03:20:09.950Z",
   "file": "3/T3.4-1.png",
   "phase": "3",
   "href": "shots/3/T3.4-1.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": "AC2: pause outside 0.1 to 10 seconds is rejected",
   "attempt": null,
   "caption": "A pause of 99 seconds is rejected with an inline range message",
   "annotations": [
    {
     "x": 30.2,
     "y": 43.4,
     "w": 8.8,
     "h": 3.5,
     "label": "Pause chip with invalid 99 value"
    },
    {
     "x": 30.2,
     "y": 46.9,
     "w": 8.8,
     "h": 5.3,
     "label": "Inline range message"
    }
   ],
   "at": "2026-11-24T03:20:48.305Z",
   "file": "3/T3.4-2.png",
   "phase": "3",
   "href": "shots/3/T3.4-2.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": "AC1: pause chip inserted from the toolbar",
   "attempt": null,
   "caption": "Pause chip with an editable seconds field sits inline after the text",
   "annotations": [
    {
     "x": 30.2,
     "y": 43.4,
     "w": 8.8,
     "h": 3.5,
     "label": "Pause chip with seconds field"
    },
    {
     "x": 29,
     "y": 36.3,
     "w": 6,
     "h": 4.7,
     "label": "Pause toolbar button"
    }
   ],
   "at": "2026-11-24T03:20:48.483Z",
   "file": "3/T3.4-3.png",
   "phase": "3",
   "href": "shots/3/T3.4-3.png"
  },
  {
   "taskId": "T3.4",
   "kind": "proof",
   "step": "AC7: 375px has no horizontal scroll and 44px targets",
   "attempt": null,
   "caption": "At 375px the tag toolbar wraps, nothing scrolls sideways and chips are 44px high",
   "annotations": [
    {
     "x": 3,
     "y": 41,
     "w": 94,
     "h": 24,
     "label": "Wrapped tag toolbar with 44px buttons"
    },
    {
     "x": 4,
     "y": 80,
     "w": 92,
     "h": 12,
     "label": "Editor with Laugh and Pause chips"
    }
   ],
   "at": "2026-11-24T03:22:02.895Z",
   "file": "3/T3.4-4.png",
   "phase": "3",
   "href": "shots/3/T3.4-4.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "AC1: supported-tag switch has no dialog",
   "attempt": null,
   "caption": "Switching to Inworld TTS 1.5 Max, which supports Laugh, changes the model with no dialog and keeps the chip",
   "annotations": [
    {
     "x": 8,
     "y": 93,
     "w": 50,
     "h": 6,
     "label": "Inworld 1.5 Max selected, text unchanged"
    },
    {
     "x": 16.5,
     "y": 43.5,
     "w": 6.1,
     "h": 3.5,
     "label": "Laugh chip kept"
    }
   ],
   "at": "2026-11-24T03:20:35.536Z",
   "file": "3/T3.5-1.png",
   "phase": "3",
   "href": "shots/3/T3.5-1.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "AC2: dialog lists each approximated and dropped tag",
   "attempt": null,
   "caption": "Switching to Chatterbox Turbo opens a dialog listing the pause tag that will be removed",
   "annotations": [
    {
     "x": 33,
     "y": 50.5,
     "w": 30,
     "h": 5,
     "label": "Removed list names pause of 1 s"
    },
    {
     "x": 49.5,
     "y": 60.9,
     "w": 18,
     "h": 5.5,
     "label": "Keep original and Convert actions"
    }
   ],
   "at": "2026-11-24T03:21:06.005Z",
   "file": "3/T3.5-2.png",
   "phase": "3",
   "href": "shots/3/T3.5-2.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "AC3: Convert applies the conversion and offers Undo",
   "attempt": null,
   "caption": "After Convert the model is Chatterbox Turbo and an Undo notice appears",
   "annotations": [
    {
     "x": 13.7,
     "y": 59.8,
     "w": 50.3,
     "h": 5.7,
     "label": "Converted notice with Undo"
    },
    {
     "x": 6.9,
     "y": 46,
     "w": 73,
     "h": 12.5,
     "label": "Chatterbox Turbo selected"
    }
   ],
   "at": "2026-11-24T03:21:13.119Z",
   "file": "3/T3.5-3.png",
   "phase": "3",
   "href": "shots/3/T3.5-3.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "AC3: Undo restores the previous text",
   "attempt": null,
   "caption": "Undo restores the pause chip and the previous model",
   "annotations": [
    {
     "x": 30.2,
     "y": 43.4,
     "w": 8.8,
     "h": 3.5,
     "label": "Pause chip restored"
    },
    {
     "x": 6.9,
     "y": 92.9,
     "w": 73,
     "h": 7,
     "label": "Inworld 1.5 Max selected again"
    }
   ],
   "at": "2026-11-24T03:21:36.819Z",
   "file": "3/T3.5-4.png",
   "phase": "3",
   "href": "shots/3/T3.5-4.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "AC4/AC5: Escape keeps old model, focus returns to model select",
   "attempt": null,
   "caption": "Escape closes the dialog: the model stays Inworld 1.5 Max and focus returns to the model list",
   "annotations": [
    {
     "x": 6.9,
     "y": 10.8,
     "w": 73,
     "h": 10.8,
     "label": "Inworld 1.5 Max still selected"
    },
    {
     "x": 6.9,
     "y": 46,
     "w": 73,
     "h": 11,
     "label": "Focus ring back on the model option"
    }
   ],
   "at": "2026-11-24T03:21:47.776Z",
   "file": "3/T3.5-5.png",
   "phase": "3",
   "href": "shots/3/T3.5-5.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "AC6: 375px dialog layout and targets",
   "attempt": null,
   "caption": "At 375px the conversion dialog fits without sideways scroll; Keep original and Convert are 44px high (the close X measures 40px)",
   "annotations": [
    {
     "x": 4,
     "y": 27,
     "w": 92,
     "h": 43,
     "label": "Dialog fits the 375px viewport"
    },
    {
     "x": 30,
     "y": 64,
     "w": 60,
     "h": 7,
     "label": "Keep original and Convert at 44px"
    }
   ],
   "at": "2026-11-24T03:22:10.685Z",
   "file": "3/T3.5-6.png",
   "phase": "3",
   "href": "shots/3/T3.5-6.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "AC6: tap targets at least 44px at 375px (fails: close button 40px)",
   "attempt": 3,
   "caption": "At 375px the dialog close button measures 40x40px, below the 44px tap target AC6 requires.",
   "annotations": [
    {
     "x": 81.2,
     "y": 29.1,
     "w": 10.7,
     "h": 4.9,
     "label": "Close dialog button 40x40px"
    }
   ],
   "at": "2026-11-24T03:34:24.905Z",
   "file": "3/T3.5-7.png",
   "phase": "3",
   "href": "shots/3/T3.5-7.png"
  },
  {
   "taskId": "T3.5",
   "kind": "proof",
   "step": "AC6: tap targets at least 44px at 375px",
   "attempt": 8,
   "caption": "At 375px the conversion dialog fits with no sideways scroll; the close button, Keep original and Convert all measure 44px high.",
   "annotations": [
    {
     "x": 80,
     "y": 29.1,
     "w": 11.7,
     "h": 5.4,
     "label": "close button 44x44px"
    },
    {
     "x": 30.4,
     "y": 64.3,
     "w": 58.7,
     "h": 5.4,
     "label": "Keep original and Convert 44px high"
    }
   ],
   "at": "2026-11-24T03:54:21.890Z",
   "file": "3/T3.5-8.png",
   "phase": "3",
   "href": "shots/3/T3.5-8.png"
  },
  {
   "taskId": "T3.6",
   "kind": "proof",
   "step": "AC5 375px layout",
   "attempt": null,
   "caption": "Speech studio at 375px with no horizontal scroll.",
   "annotations": [
    {
     "x": 0,
     "y": 0,
     "w": 100,
     "h": 100,
     "label": "single column layout"
    }
   ],
   "at": "2026-11-24T02:55:57.228Z",
   "file": "3/T3.6-1.png",
   "phase": "3",
   "href": "shots/3/T3.6-1.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Speech generated with the stubbed job, result card shown",
   "annotations": [],
   "at": "2026-11-24T03:17:34.049Z",
   "file": "3/T3.14-1.png",
   "phase": "3",
   "href": "shots/3/T3.14-1.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Over-limit script: red counter, Generate disabled with reason",
   "annotations": [],
   "at": "2026-11-24T03:17:34.251Z",
   "file": "3/T3.14-2.png",
   "phase": "3",
   "href": "shots/3/T3.14-2.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Model switch dialog listing the tag that will be removed",
   "annotations": [],
   "at": "2026-11-24T03:17:34.390Z",
   "file": "3/T3.14-3.png",
   "phase": "3",
   "href": "shots/3/T3.14-3.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": null,
   "attempt": null,
   "caption": "Speech studio at 375px, no horizontal scroll",
   "annotations": [],
   "at": "2026-11-24T03:17:34.527Z",
   "file": "3/T3.14-4.png",
   "phase": "3",
   "href": "shots/3/T3.14-4.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": "AC1: success scenario passes with the stub",
   "attempt": 3,
   "caption": "Speech generated with the stubbed job; result card shown",
   "annotations": [
    {
     "x": 53.7,
     "y": 10,
     "w": 39.4,
     "h": 17.8,
     "label": "result card"
    }
   ],
   "at": "2026-11-24T03:44:20.545Z",
   "file": "3/T3.14-5.png",
   "phase": "3",
   "href": "shots/3/T3.14-5.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": "AC1: over-limit scenario",
   "attempt": 3,
   "caption": "Over-limit script: danger counter, Generate disabled with reason",
   "annotations": [],
   "at": "2026-11-24T03:44:20.690Z",
   "file": "3/T3.14-6.png",
   "phase": "3",
   "href": "shots/3/T3.14-6.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": "AC1: model switch dialog scenario",
   "attempt": 3,
   "caption": "Model switch dialog listing the tag that will be removed",
   "annotations": [],
   "at": "2026-11-24T03:44:20.834Z",
   "file": "3/T3.14-7.png",
   "phase": "3",
   "href": "shots/3/T3.14-7.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": "AC2: failure scenario, balance unchanged",
   "attempt": 3,
   "caption": "Failure shows No credits were used.; spec asserts balance via readCredits",
   "annotations": [
    {
     "x": 53.7,
     "y": 12.2,
     "w": 39.4,
     "h": 15.3,
     "label": "error state"
    }
   ],
   "at": "2026-11-24T03:44:20.977Z",
   "file": "3/T3.14-8.png",
   "phase": "3",
   "href": "shots/3/T3.14-8.png"
  },
  {
   "taskId": "T3.14",
   "kind": "proof",
   "step": "AC1: 375px scenario",
   "attempt": 3,
   "caption": "Speech studio at 375px, no horizontal scroll",
   "annotations": [],
   "at": "2026-11-24T03:44:21.118Z",
   "file": "3/T3.14-9.png",
   "phase": "3",
   "href": "shots/3/T3.14-9.png"
  }
 ],
 "deliverables": [
  {
   "at": "2026-11-24T08:14:56.422Z",
   "type": "deliverable",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5",
    "T3.6",
    "T3.7",
    "T3.10",
    "T3.11",
    "T3.12",
    "T3.13",
    "T3.14",
    "T3.16"
   ],
   "text": "Phase 3 Speech studio: TTS schema/route, tag model, composer, tag editor, convert dialog, advisor, tests"
  },
  {
   "at": "2026-11-23T13:39:37.934Z",
   "type": "deliverable",
   "tasks": [
    "T2.1",
    "T2.2",
    "T2.3",
    "T2.4",
    "T2.5",
    "T2.6",
    "T2.7"
   ],
   "text": "Phase 2 music studio: schema, Music page, Minimax instrumental, unit and e2e tests"
  },
  {
   "at": "2026-11-23T12:59:55.578Z",
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
    "T1.16",
    "T1.17",
    "T1.18",
    "T1.19"
   ],
   "text": "Phase 1 Song studio: composer, lyrics AI assist, waveform editor, export"
  },
  {
   "at": "2026-11-23T02:00:34.410Z",
   "type": "deliverable",
   "tasks": [
    "T0.1",
    "T0.2",
    "T0.3",
    "T0.4",
    "T0.5",
    "T0.6",
    "T0.7",
    "T0.8",
    "T0.9",
    "T0.10",
    "T0.11",
    "T0.12",
    "T0.13",
    "T0.14",
    "T0.15",
    "T0.16",
    "T0.17",
    "T0.18",
    "T0.19",
    "T0.20",
    "T0.21",
    "T0.22",
    "T0.23",
    "T0.24",
    "T0.25",
    "T0.26",
    "T0.27",
    "T0.28",
    "T0.29",
    "T0.30",
    "T0.31"
   ],
   "text": "Phase 0 shared media infrastructure verified: registry/credits, media API + uploads, nav/player/history UI, e2e specs"
  }
 ],
 "advisories": [
  {
   "at": "2026-11-24T08:14:29.719Z",
   "type": "advisory",
   "tasks": [
    "T3.5"
   ],
   "text": "Superseded failure shot T3.5-7 (40px close button) remains in the manifest; T3.5-8 shows the fixed 44px target"
  },
  {
   "at": "2026-11-24T08:14:29.588Z",
   "type": "advisory",
   "tasks": [
    "T3.3"
   ],
   "text": "Superseded proof shots T3.3-6 (wrong voice notice) and T3.3-2 (old \"Voice changed to Andy\" line, \"voice cloning\" copy) remain in the manifest; T3.3-10 is the current proof"
  },
  {
   "at": "2026-11-24T08:14:29.416Z",
   "type": "advisory",
   "tasks": [
    "T3.12"
   ],
   "text": "ConvertTagsDialog.vue branches 91.3% (lines 17,39 pending-null fallbacks), below the 95% target"
  },
  {
   "at": "2026-11-24T03:54:49.794Z",
   "type": "advisory",
   "tasks": [
    "T3.13"
   ],
   "text": "media.test.ts non-speech model key case does not assert enqueueGeneration was not called"
  },
  {
   "at": "2026-11-24T03:54:49.599Z",
   "type": "advisory",
   "tasks": [
    "T3.12"
   ],
   "text": "ConvertTagsDialog.vue branches 91.3% (lines 17,38), below the 95% target"
  },
  {
   "at": "2026-11-24T03:54:49.377Z",
   "type": "advisory",
   "tasks": [
    "T3.3"
   ],
   "text": "Shared Low credits dialog on /audio/speech says \"To generate an AI image, 5 credits are required\" (shot T3.3-9); copy is image-specific"
  },
  {
   "at": "2026-11-24T03:44:42.186Z",
   "type": "advisory",
   "tasks": [
    "T3.12"
   ],
   "text": "[test-quality] ConvertTagsDialog.vue branches 91.3% (lines 17,38 uncovered); above 80% floor, below 95% target"
  },
  {
   "at": "2026-11-24T03:44:42.023Z",
   "type": "advisory",
   "tasks": [
    "T3.14"
   ],
   "text": "[test-quality] e2e screenshots convert-dialog.png and insufficient-credits.png do not show the open dialog (assertions pass); proof shot T3.14-7 therefore does not show the dialog, T3.5-2 does"
  },
  {
   "at": "2026-11-24T03:44:41.871Z",
   "type": "advisory",
   "tasks": [
    "T3.3"
   ],
   "text": "[code-bug] SpeechModelSelect Minimax Speech 2.8 HD blurb still says \"voice cloning\" after the descope"
  },
  {
   "at": "2026-11-24T03:44:41.718Z",
   "type": "advisory",
   "tasks": [
    "T3.4"
   ],
   "text": "[code-bug] a chip takes two arrow presses to cross; typing while a chip is node-selected replaces it (undo restores). AC4 met as written"
  },
  {
   "at": "2026-11-24T03:44:41.547Z",
   "type": "advisory",
   "tasks": [
    "T3.10"
   ],
   "text": "[test-quality] useTtsEditor.ts lines 144-152 and 200-201 have uncovered branches; engineer justified only 144 (152 is its onUpdate twin)"
  },
  {
   "at": "2026-11-24T03:44:41.300Z",
   "type": "advisory",
   "tasks": [
    "T3.11"
   ],
   "text": "[flaky-env] V1 (bunx vp test run --coverage) errors \"coverageFilesDirectory is required\"; fallback npx vitest --coverage gives tts-tags.ts 98.26/94.44/100/98.91, line 377 uncovered"
  },
  {
   "at": "2026-11-23T13:35:20.068Z",
   "type": "advisory",
   "tasks": [
    "T2.6"
   ],
   "text": "Stale proof shot 2/T2.6-1 still shows the impossible -4 balance with caption \"balance dropped by 12\"; superseded by 2/T2.6-6 and the verifier retake"
  },
  {
   "at": "2026-11-23T13:29:05.983Z",
   "type": "advisory",
   "tasks": [
    "T2.3"
   ],
   "text": "shot 2/T2.3-4 caption claims instrumental note but Lyria is selected; retaken as 2/T2.3-7"
  },
  {
   "at": "2026-11-23T13:29:05.827Z",
   "type": "advisory",
   "tasks": [
    "T2.2"
   ],
   "text": "Music.vue Mod+Enter, draft restore and disabled reason have no automated test (verified manually only)"
  },
  {
   "at": "2026-11-23T13:29:05.671Z",
   "type": "advisory",
   "tasks": [
    "T2.2"
   ],
   "text": "402 Low credits dialog in Music studio says 'To generate an AI image'"
  },
  {
   "at": "2026-11-23T13:29:05.514Z",
   "type": "advisory",
   "tasks": [
    "T2.6"
   ],
   "text": "apps/web/e2e/qa/music.spec.ts:112 QA user has 8 credits so stubbed remaining is -4 (shot shows -4); other stubbed-success scenarios skip readCredits"
  },
  {
   "at": "2026-11-23T08:41:01.492Z",
   "type": "advisory",
   "tasks": [
    "T1.8"
   ],
   "text": "Shot T1.8-2 is stale (captures the since-fixed low-contrast menu); superseded by T1.8-4 (a19). Drop T1.8-2 from the dashboard."
  },
  {
   "at": "2026-11-23T08:41:01.386Z",
   "type": "advisory",
   "tasks": [
    "T1.8"
   ],
   "text": "No component unit spec exists for LyricsAiMenu.vue/useLyricsAssist.ts; loading spinner and generic-failure toast (AC3) are covered by neither unit nor e2e tests, only by verifier a19 live checks. Add a LyricsAiMenu component spec."
  },
  {
   "at": "2026-11-23T08:30:58.106Z",
   "type": "advisory",
   "tasks": [
    "T1.3"
   ],
   "text": "History.test.ts (Phase 0, unchanged) leaves GET /media/assets unmocked: 7 SELF_SIGNED_CERT errors to the local API per web-suite run; exit stays 0, not a paid call; mock the fetch"
  },
  {
   "at": "2026-11-23T08:14:13.372Z",
   "type": "advisory",
   "tasks": [
    "T1.5"
   ],
   "text": "apps/api/src/routes/media.test.ts:506 new copy of let index = 0 triggers a lint warning (0 errors)"
  },
  {
   "at": "2026-11-23T08:14:13.261Z",
   "type": "advisory",
   "tasks": [
    "T1.12"
   ],
   "text": "Normalize is enabled before any region exists (whole-track op); AC1 says edit buttons are disabled until a region exists, so state the exception in copy or tooltip"
  },
  {
   "at": "2026-11-23T08:14:13.145Z",
   "type": "advisory",
   "tasks": [
    "T1.3"
   ],
   "text": "cd apps/web && bun run test: 2194/2194 pass but exit 1 from EnvironmentTeardownError in untouched src/App.test.ts (unmocked getUserDetails fetch logs after teardown); root bun run test exits 0"
  },
  {
   "at": "2026-11-23T08:14:13.019Z",
   "type": "advisory",
   "tasks": [
    "T1.6"
   ],
   "text": "song.spec @critical balance-drops scenario proves the drop on the UI chip only; readCredits asserts the stored balance unchanged because the POST is stubbed"
  },
  {
   "at": "2026-11-23T02:00:17.782Z",
   "type": "advisory",
   "tasks": [
    "T0.13"
   ],
   "text": "resolveErrorStatus keys 401 on exact message \"Unauthenticated\"; wrap requireAuth into UnauthorizedError instead"
  },
  {
   "at": "2026-11-23T02:00:17.693Z",
   "type": "advisory",
   "tasks": [
    "T0.15"
   ],
   "text": "clerk-auth.real.test.ts mounts requireAuth on a bare app with a re-declared handler, not the real router/app.ts handler"
  },
  {
   "at": "2026-11-23T01:55:25.992Z",
   "type": "advisory",
   "tasks": [
    "T0.14"
   ],
   "text": "utils/cloudinary.ts branches 94.11% (lines 51,178,195 uncovered)"
  },
  {
   "at": "2026-11-23T01:55:25.904Z",
   "type": "advisory",
   "tasks": [
    "T0.21"
   ],
   "text": "shot T0.21-1 still shows the old doubled inline card player"
  },
  {
   "at": "2026-11-23T01:55:25.807Z",
   "type": "advisory",
   "tasks": [
    "T0.31"
   ],
   "text": "untracked apps/web/tsconfig.node.tsbuildinfo; add to .gitignore"
  },
  {
   "at": "2026-11-23T01:55:25.712Z",
   "type": "advisory",
   "tasks": [
    "T0.2"
   ],
   "text": "media-asset-service.ts:19-21 page-size/title constants live outside media-limits.ts"
  },
  {
   "at": "2026-11-23T01:55:25.618Z",
   "type": "advisory",
   "tasks": [
    "T0.29"
   ],
   "text": "media-pipeline.spec.ts:282 require-array-sort-compare lint warning"
  },
  {
   "at": "2026-11-23T01:55:25.523Z",
   "type": "advisory",
   "tasks": [
    "T0.17"
   ],
   "text": "lint warnings: routes/media.test.ts:122,337 unused index; lib/media-upload.ts:122 no-misused-spread"
  },
  {
   "at": "2026-11-23T01:55:25.433Z",
   "type": "advisory",
   "tasks": [
    "T0.25"
   ],
   "text": "useGlobalShortcuts.ts:112-116 prevents / on every route when tab=1 now that the listener is app-wide; guard on a composer being present"
  },
  {
   "at": "2026-11-23T01:55:25.305Z",
   "type": "advisory",
   "tasks": [
    "T0.29"
   ],
   "text": "media-pipeline.feature.md still lists the dropped exact-cost balance scenario; remove it and note the user decision"
  },
  {
   "at": "2026-11-22T16:35:20.507Z",
   "type": "advisory",
   "tasks": [
    "T0.21"
   ],
   "text": "shot T0.21-1 shows the old doubled card player fixed later in T0.22-3/4"
  },
  {
   "at": "2026-11-22T16:35:20.421Z",
   "type": "advisory",
   "tasks": [
    "T0.18"
   ],
   "text": "shot T0.18-1 does not show the /audio/music active highlight (AC4 unit-tested)"
  },
  {
   "at": "2026-11-22T16:35:20.332Z",
   "type": "advisory",
   "tasks": [
    "T0.17"
   ],
   "text": "lint warning media-upload.ts:122 no-misused-spread"
  },
  {
   "at": "2026-11-22T16:35:20.240Z",
   "type": "advisory",
   "tasks": [
    "T0.29"
   ],
   "text": "lint warnings media-pipeline.spec.ts:306 no-unsafe-optional-chaining, :365 require-array-sort-compare"
  },
  {
   "at": "2026-11-22T16:35:20.134Z",
   "type": "advisory",
   "tasks": [
    "T0.6"
   ],
   "text": "moderated and slow MediaGenerationStub variants are never selected by any spec"
  }
 ],
 "activity": [
  {
   "at": "2026-11-24T08:14:56.422Z",
   "type": "deliverable",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5",
    "T3.6",
    "T3.7",
    "T3.10",
    "T3.11",
    "T3.12",
    "T3.13",
    "T3.14",
    "T3.16"
   ],
   "text": "Phase 3 Speech studio: TTS schema/route, tag model, composer, tag editor, convert dialog, advisor, tests"
  },
  {
   "at": "2026-11-24T08:14:53.254Z",
   "tasks": [
    "T3.13"
   ],
   "attempt": "1",
   "type": "verify_passed",
   "evidence": "V1 2 files / 76 tests passed (media-input 25, media-service 51); media-input.ts and media-service.ts 100/100/100/100; fakes only (fake.invalid / cdn.invalid URLs, injected Cloudinary/Replicate fns); no skip markers",
   "fingerprint": "208ecb6061a538109b179351b35a4bf0b96dee095344599e1e6c3acf6e67e330",
   "report": ".dashboard/media-studio/reports/phase-3-verifier-a12.md"
  },
  {
   "at": "2026-11-24T08:14:53.253Z",
   "tasks": [
    "T3.12"
   ],
   "attempt": "1",
   "type": "verify_passed",
   "evidence": "V1 4 files / 21 tests passed; SpeechComposer.vue 100/100/100/100, TextAdvisor.vue 100/100/100/100, ConvertTagsDialog.vue 100 stmts / 91.3 branch / 100 funcs / 100 lines (uncovered 17,39 are justified pending===null fallbacks); no it.fails/skip/only/fixme/snapshot/ignore markers",
   "fingerprint": "0232cc1363892c82abfde9d2e2cc25dc9ec3338a9003e72745fe2154c73445de",
   "report": ".dashboard/media-studio/reports/phase-3-verifier-a12.md"
  },
  {
   "at": "2026-11-24T08:14:53.253Z",
   "tasks": [
    "T3.5"
   ],
   "attempt": "1",
   "type": "verify_passed",
   "evidence": "a8 BLOCKING (ConvertTagsDialog.vue:38 format) cleared, the only file changed since a8; V1 2285/2285, V2 clean; AC1-AC6 shots T3.5-1..6 and T3.5-8 (opened T3.5-2 dialog lists \"pause of 1 s\" Removed; T3.5-8 375px close/Keep/Convert 44px); reduced motion handled in SpeechModelSelect.vue and AppModal.vue",
   "fingerprint": "1b524e4d5a2bd194503d78bbaa637535ec750a836a2e33bd8c85607df5af926b",
   "report": ".dashboard/media-studio/reports/phase-3-verifier-a12.md"
  },
  {
   "at": "2026-11-24T08:14:53.253Z",
   "tasks": [
    "T3.3"
   ],
   "attempt": "1",
   "type": "verify_passed",
   "evidence": "a8 BLOCKING (format) cleared: V2 `bun run check` exit 0, \"All 1090 files are correctly formatted\", 0 errors / 17 warnings (none in Speech files); V1 web 258 files / 2285 tests passed; AC1-AC6 proven by shots T3.3-1,2,3,4,5,7,8,9,10 (opened T3.3-2 Estimated 21 credits, T3.3-10 notice names English_Wiselady); Speech files unchanged since the a8 live checks",
   "fingerprint": "c3c134b72a6b6b5e6943773050dd8cd92c1326bbee1b04f9c4f04988d7cd95e5",
   "report": ".dashboard/media-studio/reports/phase-3-verifier-a12.md"
  },
  {
   "at": "2026-11-24T08:14:29.719Z",
   "type": "advisory",
   "tasks": [
    "T3.5"
   ],
   "text": "Superseded failure shot T3.5-7 (40px close button) remains in the manifest; T3.5-8 shows the fixed 44px target"
  },
  {
   "at": "2026-11-24T08:14:29.588Z",
   "type": "advisory",
   "tasks": [
    "T3.3"
   ],
   "text": "Superseded proof shots T3.3-6 (wrong voice notice) and T3.3-2 (old \"Voice changed to Andy\" line, \"voice cloning\" copy) remain in the manifest; T3.3-10 is the current proof"
  },
  {
   "at": "2026-11-24T08:14:29.416Z",
   "type": "advisory",
   "tasks": [
    "T3.12"
   ],
   "text": "ConvertTagsDialog.vue branches 91.3% (lines 17,39 pending-null fallbacks), below the 95% target"
  },
  {
   "at": "2026-11-24T08:11:59.059Z",
   "type": "verify_started",
   "tasks": [
    "T3.3",
    "T3.5",
    "T3.12",
    "T3.13"
   ],
   "attempt": "1"
  },
  {
   "at": "2026-11-24T08:11:53.437Z",
   "type": "run_started",
   "tasks": [
    "T3.1",
    "T3.2",
    "T3.3",
    "T3.4",
    "T3.5",
    "T3.6",
    "T3.7",
    "T3.10",
    "T3.11",
    "T3.12",
    "T3.13",
    "T3.14",
    "T3.16"
   ],
   "pipeline": 2
  },
  {
   "at": "2026-11-24T03:57:40.392Z",
   "type": "verify_passed",
   "tasks": [
    "T3.6"
   ],
   "evidence": "all reviewers passed; no verifier routed (risk=low)",
   "fingerprint": "3690e68c2187d07450b96115861c7472e5e4b4d744d1c1bb25aed85f763e2c49",
   "skipped": "verifier"
  },
  {
   "at": "2026-11-24T03:57:40.384Z",
   "tasks": [
    "T3.6"
   ],
   "type": "reviewer_verdict",
   "evidence": "Speech page at 375px shows no horizontal scroll, and the chip toolbar wraps cleanly.",
   "fingerprint": "3690e68c2187d07450b96115861c7472e5e4b4d744d1c1bb25aed85f763e2c49",
   "report": ".dashboard/media-studio/reports/media-studio-review-ui-sonnet-a11.md",
   "verdict": "PASS",
   "reviewer": "ui"
  },
  {
   "at": "2026-11-24T03:57:40.384Z",
   "tasks": [
    "T3.5"
   ],
   "type": "reviewer_verdict",
   "evidence": "Conversion dialog is legible at desktop and 375px; the close button, Keep original and Convert are 44px (shot 8). Shots T3.5-7 and T3.3-6 are superseded by later fixes.",
   "fingerprint": "1b524e4d5a2bd194503d78bbaa637535ec750a836a2e33bd8c85607df5af926b",
   "report": ".dashboard/media-studio/reports/media-studio-review-ui-sonnet-a11.md",
   "verdict": "PASS",
   "reviewer": "ui"
  },
  {
   "at": "2026-11-24T03:57:40.383Z",
   "tasks": [
    "T3.3"
   ],
   "type": "reviewer_verdict",
   "evidence": "Speech studio layout, model list, counter, disabled-reason, low-credits dialog (shot 9) and voice/notice agreement (shot 10) read cleanly.",
   "fingerprint": "c3c134b72a6b6b5e6943773050dd8cd92c1326bbee1b04f9c4f04988d7cd95e5",
   "report": ".dashboard/media-studio/reports/media-studio-review-ui-sonnet-a11.md",
   "verdict": "PASS",
   "reviewer": "ui"
  },
  {
   "at": "2026-11-24T03:57:40.204Z",
   "tasks": [
    "T3.6"
   ],
   "type": "reviewer_verdict",
   "evidence": "shot T3.6-1 (375px, no sideways scroll) and the earlier estimate and FAQ shots. Attempt 8 findings still hold.",
   "fingerprint": "3690e68c2187d07450b96115861c7472e5e4b4d744d1c1bb25aed85f763e2c49",
   "report": ".dashboard/media-studio/reports/media-studio-review-ux-sonnet-a11.md",
   "verdict": "PASS",
   "reviewer": "ux"
  },
  {
   "at": "2026-11-24T03:57:40.204Z",
   "tasks": [
    "T3.5"
   ],
   "type": "reviewer_verdict",
   "evidence": "shots T3.5-1..6 and the new T3.5-8 (375px dialog \"Switch to Minimax Speech 2.8 HD?\" lists Removed: breathe, states that Convert changes the text and can be undone, with Keep original and Convert buttons that are not clipped). Undo and focus return were confirmed in the earlier shots.",
   "fingerprint": "1b524e4d5a2bd194503d78bbaa637535ec750a836a2e33bd8c85607df5af926b",
   "report": ".dashboard/media-studio/reports/media-studio-review-ux-sonnet-a11.md",
   "verdict": "PASS",
   "reviewer": "ux"
  },
  {
   "at": "2026-11-24T03:57:40.203Z",
   "tasks": [
    "T3.3"
   ],
   "type": "reviewer_verdict",
   "evidence": "shots T3.3-1 (empty state), T3.3-3/4 (over-limit, Generate disabled), T3.3-8 (failure, Try again), T3.3-9 (402 Low credits dialog) and the new T3.3-10 (375px: voice notice now reads \"Voice changed to English_Wiselady\", 5 model cards readable, no overflow). Attempt 8 findings still hold; only formatting has changed since.",
   "fingerprint": "c3c134b72a6b6b5e6943773050dd8cd92c1326bbee1b04f9c4f04988d7cd95e5",
   "report": ".dashboard/media-studio/reports/media-studio-review-ux-sonnet-a11.md",
   "verdict": "PASS",
   "reviewer": "ux"
  },
  {
   "at": "2026-11-24T03:57:40.010Z",
   "tasks": [
    "T3.6"
   ],
   "type": "reviewer_verdict",
   "evidence": "AC1 met: `useTtsAdvice.seconds` is a computed over `toValue(options.doc)`, and SpeechComposer passes `tts.doc.value`. `doc` is a shallowRef that is replaced on every edit, so the parent re-renders and the child receives the new array. Test \"recomputes when the doc changes\" covers it. Empty and whitespace-only docs return 0. ; AC2 met: `level` is `near` at exactly 90% of the limit and `over` above ",
   "fingerprint": "3690e68c2187d07450b96115861c7472e5e4b4d744d1c1bb25aed85f763e2c49",
   "report": ".dashboard/media-studio/reports/media-studio-review-code-haiku-a11.md",
   "verdict": "PASS",
   "reviewer": "code"
  },
  {
   "at": "2026-11-24T03:57:39.778Z",
   "tasks": [
    "T3.5"
   ],
   "type": "reviewer_verdict",
   "evidence": "AC1 requestModelSwitch switches directly when findUnsupportedTags is empty. AC2 ConvertTagsDialog lists the Approximated and Removed tags, including suggestedEmotion. AC3 confirmSwitch stores undoState (doc, model, emotion) and undoConversion restores all three. AC4 keep and close both emit keep, which calls cancelSwitch, and modelKey is only written on confirm. AC5 AppModal runs with trap-focus. ",
   "fingerprint": "1b524e4d5a2bd194503d78bbaa637535ec750a836a2e33bd8c85607df5af926b",
   "report": ".dashboard/media-studio/reports/media-studio-review-code-sonnet-a11.md",
   "verdict": "PASS",
   "reviewer": "code"
  },
  {
   "at": "2026-11-24T03:57:39.777Z",
   "tasks": [
    "T3.3"
   ],
   "type": "reviewer_verdict",
   "evidence": "AC1 to AC6 unchanged from the a8 PASS. The SpeechModelSelect radios are controlled and snap back to the committed model in onSelect. I spot-read SpeechModelSelect and found no behavioural change, only formatting.",
   "fingerprint": "c3c134b72a6b6b5e6943773050dd8cd92c1326bbee1b04f9c4f04988d7cd95e5",
   "report": ".dashboard/media-studio/reports/media-studio-review-code-sonnet-a11.md",
   "verdict": "PASS",
   "reviewer": "code"
  },
  {
   "at": "2026-11-24T03:56:22.914Z",
   "type": "dirty_snapshot",
   "tasks": [],
   "hashes": {
    "agent_docs/media-studio/APPROVALS.md": "70f5ca564e2fe45c93c7a2d765341fb64f81b171",
    "agent_docs/media-studio/SPEC.md": "d4a927689a767909a05b9a2894a593c6a4fd78ab",
    "agent_docs/media-studio/TASKS.md": "bfe2e55f673c37b5b0b07db9a71017c9c5b81795",
    "apps/api/src/lib/media-input.test.ts": "92a1caf751d324aac1bbd250a1d25efc11b713f6",
    "apps/api/src/queue/generation-worker.ts": "4089d687fc6db74b159f88bae2f75358440b7185",
    "apps/api/src/routes/media.test.ts": "2ba968b32f1c5ebf2925dbba8650badf5b7facb7",
    "apps/api/src/routes/media.ts": "746ff968726cfc65fa3fe6da7da689004d8ed590",
    "apps/api/src/services/media-service.test.ts": "1bee1f95457e632d37993ec9c1f387900e0e8bac",
    "apps/api/src/services/media-service.ts": "b477104dd6be5ada6db5d4b659216de4dcefdec4",
    "apps/web/package.json": "5fc460b45789e9a124e4d379241bb8ec14cfe60a",
    "apps/web/src/components.d.ts": "9a8a99d15abca5639e57f6d6823196841750f29b",
    "apps/web/src/router/index.ts": "3f31c2e0eb9b3797c6f808e691bcb14e3c7e7c91",
    "bun.lock": "71613f800ce3dbff5e91fed474b4b73cb5b49509",
    "packages/shared/src/models/index.ts": "f505b6ada7b9b11fe42d5d381f431070e61265d7",
    "packages/shared/src/models/media-limits.ts": "d4197c320b5c9b888dd14438bb2f19e9a65f1ad7",
    "packages/shared/src/schemas/index.ts": "babecbeeb3e2d2de3ca280528d414a6397f6b036",
    "packages/shared/src/schemas/media.test.ts": "51ae9189f077442c12dab51c0d8dba7cd642f0a3",
    "packages/shared/src/schemas/media.ts": "f7aeb359daa12e1fc6a00ab10611bcd8cae75433",
    "apps/web/e2e/qa/speech.spec.ts": "95e632a6bd918952888b480127a4d3f115a8a23e",
    "apps/web/src/components/Speech/ConvertTagsDialog.test.ts": "ac460076d19556306b8bd1307c6157397c1dc594",
    "apps/web/src/components/Speech/ConvertTagsDialog.vue": "b251fa3a72dbd1f2673a70a199769fc432210231",
    "apps/web/src/components/Speech/SpeechComposer.test.ts": "e7189797a5e43c1dda6d32e9256830fc15e1b2ea",
    "apps/web/src/components/Speech/SpeechComposer.vue": "1456a89fba68c28193b912f280b904f50dead341",
    "apps/web/src/components/Speech/SpeechModelSelect.vue": "bd11114b0d9ada02e1531fa76a08aa0020c9ec78",
    "apps/web/src/components/Speech/TagChipNode.ts": "8b1fbf497d13dcf657d2b80a57792b4fd3c10f83",
    "apps/web/src/components/Speech/TagToolbar.vue": "8ae47e49d92ebf823ae343abaf5b869cac69be2f",
    "apps/web/src/components/Speech/TextAdvisor.test.ts": "51b33973cb22d6f04956357d3f96aecab901752a",
    "apps/web/src/components/Speech/TextAdvisor.vue": "86ccf42f18b0aad78a626aee2011e84c75b93f10",
    "apps/web/src/components/Speech/TtsEditor.vue": "3f95c3f608b4f0af8222469869c95e3478228b00",
    "apps/web/src/components/Speech/VoiceSelect.test.ts": "5729b0cd4c4d0bec3bdadc22cb50d5ae30744578",
    "apps/web/src/components/Speech/VoiceSelect.vue": "f69d7a383c3e6089d5f0b55353a034035a8a10bd",
    "apps/web/src/composables/useTtsAdvice.test.ts": "39275e10a291039a71a91f267b37da92e4644743",
    "apps/web/src/composables/useTtsAdvice.ts": "7e1630d60588012b7689e84f764a90a7ace7a626",
    "apps/web/src/composables/useTtsEditor.test.ts": "527384460c6a51a74acbea347bf4ef66dd3b9a83",
    "apps/web/src/composables/useTtsEditor.ts": "3be1ca190e7cf7888801c9500979c41d56be0891",
    "apps/web/src/pages/Speech.vue": "7cabc4af182bec67d701bd26b13a19d66f995b55",
    "packages/shared/src/models/tts-tags.test.ts": "5f736bd278923d427f9b2bbb5913844f898450d6",
    "packages/shared/src/models/tts-tags.ts": "ad4ce1196d628d46e43726e5970363b44af4fcbe"
   }
  },
  {
   "at": "2026-11-24T03:56:22.771Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.13"
   ],
   "fingerprint": "208ecb6061a538109b179351b35a4bf0b96dee095344599e1e6c3acf6e67e330"
  },
  {
   "at": "2026-11-24T03:56:22.771Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.12"
   ],
   "fingerprint": "0232cc1363892c82abfde9d2e2cc25dc9ec3338a9003e72745fe2154c73445de",
   "slop": "PASS"
  },
  {
   "at": "2026-11-24T03:56:22.771Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.6"
   ],
   "fingerprint": "3690e68c2187d07450b96115861c7472e5e4b4d744d1c1bb25aed85f763e2c49",
   "slop": "PASS"
  },
  {
   "at": "2026-11-24T03:56:17.954Z",
   "type": "task_built",
   "tasks": [
    "T3.3",
    "T3.5"
   ],
   "text": "format fix, bun run check 0 errors",
   "files": [
    "apps/web/src/components/Speech/VoiceSelect.test.ts",
    "apps/web/src/components/Speech/ConvertTagsDialog.vue"
   ]
  },
  {
   "at": "2026-11-24T03:56:17.711Z",
   "type": "task_built",
   "tasks": [
    "T3.13"
   ],
   "text": "unit a10 PASS: check clean, 100% lines, shuffle clean",
   "files": [
    "apps/api/src/routes/media.test.ts",
    "packages/shared/src/schemas/media.test.ts"
   ]
  },
  {
   "at": "2026-11-24T03:55:43.715Z",
   "type": "task_started",
   "tasks": [
    "T3.13"
   ],
   "attempt": "3"
  },
  {
   "at": "2026-11-24T03:55:41.078Z",
   "type": "dirty_snapshot",
   "tasks": [],
   "hashes": {
    "agent_docs/media-studio/APPROVALS.md": "70f5ca564e2fe45c93c7a2d765341fb64f81b171",
    "agent_docs/media-studio/SPEC.md": "d4a927689a767909a05b9a2894a593c6a4fd78ab",
    "agent_docs/media-studio/TASKS.md": "bfe2e55f673c37b5b0b07db9a71017c9c5b81795",
    "apps/api/src/lib/media-input.test.ts": "92a1caf751d324aac1bbd250a1d25efc11b713f6",
    "apps/api/src/queue/generation-worker.ts": "4089d687fc6db74b159f88bae2f75358440b7185",
    "apps/api/src/routes/media.test.ts": "d1e5fdc77547ace31ad09e1f120f4f9a78cde23f",
    "apps/api/src/routes/media.ts": "746ff968726cfc65fa3fe6da7da689004d8ed590",
    "apps/api/src/services/media-service.test.ts": "1bee1f95457e632d37993ec9c1f387900e0e8bac",
    "apps/api/src/services/media-service.ts": "b477104dd6be5ada6db5d4b659216de4dcefdec4",
    "apps/web/package.json": "5fc460b45789e9a124e4d379241bb8ec14cfe60a",
    "apps/web/src/components.d.ts": "9a8a99d15abca5639e57f6d6823196841750f29b",
    "apps/web/src/router/index.ts": "3f31c2e0eb9b3797c6f808e691bcb14e3c7e7c91",
    "bun.lock": "71613f800ce3dbff5e91fed474b4b73cb5b49509",
    "packages/shared/src/models/index.ts": "f505b6ada7b9b11fe42d5d381f431070e61265d7",
    "packages/shared/src/models/media-limits.ts": "d4197c320b5c9b888dd14438bb2f19e9a65f1ad7",
    "packages/shared/src/schemas/index.ts": "babecbeeb3e2d2de3ca280528d414a6397f6b036",
    "packages/shared/src/schemas/media.test.ts": "51ae9189f077442c12dab51c0d8dba7cd642f0a3",
    "packages/shared/src/schemas/media.ts": "f7aeb359daa12e1fc6a00ab10611bcd8cae75433",
    "apps/web/e2e/qa/speech.spec.ts": "95e632a6bd918952888b480127a4d3f115a8a23e",
    "apps/web/src/components/Speech/ConvertTagsDialog.test.ts": "ac460076d19556306b8bd1307c6157397c1dc594",
    "apps/web/src/components/Speech/ConvertTagsDialog.vue": "b251fa3a72dbd1f2673a70a199769fc432210231",
    "apps/web/src/components/Speech/SpeechComposer.test.ts": "e7189797a5e43c1dda6d32e9256830fc15e1b2ea",
    "apps/web/src/components/Speech/SpeechComposer.vue": "1456a89fba68c28193b912f280b904f50dead341",
    "apps/web/src/components/Speech/SpeechModelSelect.vue": "bd11114b0d9ada02e1531fa76a08aa0020c9ec78",
    "apps/web/src/components/Speech/TagChipNode.ts": "8b1fbf497d13dcf657d2b80a57792b4fd3c10f83",
    "apps/web/src/components/Speech/TagToolbar.vue": "8ae47e49d92ebf823ae343abaf5b869cac69be2f",
    "apps/web/src/components/Speech/TextAdvisor.test.ts": "51b33973cb22d6f04956357d3f96aecab901752a",
    "apps/web/src/components/Speech/TextAdvisor.vue": "86ccf42f18b0aad78a626aee2011e84c75b93f10",
    "apps/web/src/components/Speech/TtsEditor.vue": "3f95c3f608b4f0af8222469869c95e3478228b00",
    "apps/web/src/components/Speech/VoiceSelect.test.ts": "5729b0cd4c4d0bec3bdadc22cb50d5ae30744578",
    "apps/web/src/components/Speech/VoiceSelect.vue": "f69d7a383c3e6089d5f0b55353a034035a8a10bd",
    "apps/web/src/composables/useTtsAdvice.test.ts": "39275e10a291039a71a91f267b37da92e4644743",
    "apps/web/src/composables/useTtsAdvice.ts": "7e1630d60588012b7689e84f764a90a7ace7a626",
    "apps/web/src/composables/useTtsEditor.test.ts": "527384460c6a51a74acbea347bf4ef66dd3b9a83",
    "apps/web/src/composables/useTtsEditor.ts": "3be1ca190e7cf7888801c9500979c41d56be0891",
    "apps/web/src/pages/Speech.vue": "7cabc4af182bec67d701bd26b13a19d66f995b55",
    "packages/shared/src/models/tts-tags.test.ts": "5f736bd278923d427f9b2bbb5913844f898450d6",
    "packages/shared/src/models/tts-tags.ts": "ad4ce1196d628d46e43726e5970363b44af4fcbe"
   }
  },
  {
   "at": "2026-11-24T03:55:40.845Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.5"
   ],
   "fingerprint": "1b524e4d5a2bd194503d78bbaa637535ec750a836a2e33bd8c85607df5af926b",
   "slop": "PASS"
  },
  {
   "at": "2026-11-24T03:55:40.845Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.3"
   ],
   "fingerprint": "c3c134b72a6b6b5e6943773050dd8cd92c1326bbee1b04f9c4f04988d7cd95e5",
   "slop": "PASS"
  },
  {
   "at": "2026-11-24T03:55:06.676Z",
   "type": "task_started",
   "tasks": [
    "T3.3",
    "T3.5"
   ],
   "attempt": "4"
  },
  {
   "at": "2026-11-24T03:55:06.443Z",
   "type": "build_started",
   "tasks": [
    "T3.3",
    "T3.5",
    "T3.13"
   ],
   "attempt": "9"
  },
  {
   "at": "2026-11-24T03:55:01.707Z",
   "tasks": [
    "T3.12"
   ],
   "attempt": "8",
   "type": "verify_passed",
   "evidence": "V1 21/21 tests (4 files incl. new VoiceSelect.test.ts); SpeechComposer.vue 100/100/100/100, TextAdvisor.vue 100/100/100/100, ConvertTagsDialog.vue 100 / 91.3 branch / 100 / 100; no it.fails/skip/only/snapshot",
   "fingerprint": "2415647e8050219870380d124602040736e9d138466f6387f2204600bbedc3c9",
   "report": ".dashboard/media-studio/reports/media-studio-verifier-a8.md"
  },
  {
   "at": "2026-11-24T03:55:01.707Z",
   "tasks": [
    "T3.4"
   ],
   "attempt": "8",
   "type": "verify_passed",
   "evidence": "T3.4 files unchanged since a5 (where its ACs and e2e were proven); V1 `cd apps/web && bun run test` 258 files / 2285 tests passed; V2 formatting failures are all in files of other tasks (see BLOCKING), `vp check --no-fmt` 0 errors / 17 warnings; shots T3.4-1..4 still valid",
   "fingerprint": "85722c05ebb83ef8dfa29f0b4e69eb177a7041221c8e321e072e5c6744ec65da",
   "report": ".dashboard/media-studio/reports/media-studio-verifier-a8.md"
  },
  {
   "at": "2026-11-24T03:55:01.707Z",
   "tasks": [
    "T3.13"
   ],
   "attempt": "8",
   "type": "verify_failed",
   "category": "type-lint",
   "text": "[type-lint] · `bun run check` · exit 1 \"Formatting issues found\" in apps/api/src/routes/media.test.ts:569 and packages/shared/src/schemas/media.test.ts:252 (the it.each titles added for the speech cases exceed the line width) · run `bunx vp check --fix` on both files and re-run `bun run check`",
   "files": [
    "bun run check"
   ],
   "sigs": [
    "T3.13|type-lint|bun run check"
   ],
   "report": ".dashboard/media-studio/reports/media-studio-verifier-a8.md"
  },
  {
   "at": "2026-11-24T03:55:01.707Z",
   "tasks": [
    "T3.5"
   ],
   "attempt": "8",
   "type": "verify_failed",
   "category": "type-lint",
   "text": "[type-lint] · V2 `bun run check` · exit 1 \"Formatting issues found\" in apps/web/src/components/Speech/ConvertTagsDialog.vue:38 (the div with class \"body convert-tags-body\" must wrap its attributes) · run `bunx vp check --fix` on the file and re-run `bun run check`",
   "files": [
    "v2 `bun run check"
   ],
   "sigs": [
    "T3.5|type-lint|v2 `bun run check"
   ],
   "report": ".dashboard/media-studio/reports/media-studio-verifier-a8.md"
  },
  {
   "at": "2026-11-24T03:55:01.706Z",
   "tasks": [
    "T3.3"
   ],
   "attempt": "8",
   "type": "verify_failed",
   "category": "type-lint",
   "text": "[type-lint] · V2 `bun run check` · exit 1 \"Formatting issues found\" in apps/web/src/components/Speech/VoiceSelect.test.ts:17 (the setProps call exceeds the line width; the EXTRA test added by the fix) · run `bunx vp check --fix` on the file (line wrap only) and re-run `bun run check`",
   "files": [
    "v2 `bun run check"
   ],
   "sigs": [
    "T3.3|type-lint|v2 `bun run check"
   ],
   "report": ".dashboard/media-studio/reports/media-studio-verifier-a8.md"
  },
  {
   "at": "2026-11-24T03:54:49.794Z",
   "type": "advisory",
   "tasks": [
    "T3.13"
   ],
   "text": "media.test.ts non-speech model key case does not assert enqueueGeneration was not called"
  },
  {
   "at": "2026-11-24T03:54:49.599Z",
   "type": "advisory",
   "tasks": [
    "T3.12"
   ],
   "text": "ConvertTagsDialog.vue branches 91.3% (lines 17,38), below the 95% target"
  },
  {
   "at": "2026-11-24T03:54:49.377Z",
   "type": "advisory",
   "tasks": [
    "T3.3"
   ],
   "text": "Shared Low credits dialog on /audio/speech says \"To generate an AI image, 5 credits are required\" (shot T3.3-9); copy is image-specific"
  },
  {
   "at": "2026-11-24T03:50:10.815Z",
   "type": "verify_started",
   "tasks": [
    "T3.3",
    "T3.4",
    "T3.5",
    "T3.12",
    "T3.13"
   ],
   "attempt": "9"
  },
  {
   "at": "2026-11-24T03:50:04.211Z",
   "tasks": [
    "T3.4"
   ],
   "type": "reviewer_verdict",
   "evidence": "attempt-3 recheck: the a5 report had no BLOCKING items, and none of the five T3.4 files has changed since it was written (all mtimes are 08:19-08:24, before the a5 report at 08:55). A re-grep confirms the sinks. There is no innerHTML, v-html, :href or target= in TtsEditor.vue, TagToolbar.vue, TagChipNode.ts or useTtsEditor.ts. The chip DOM is built with createElement, className and textContent onl",
   "fingerprint": "85722c05ebb83ef8dfa29f0b4e69eb177a7041221c8e321e072e5c6744ec65da",
   "report": ".dashboard/media-studio/reports/media-studio-review-security-opus-a8.md",
   "verdict": "PASS",
   "reviewer": "security"
  },
  {
   "at": "2026-11-24T03:50:04.049Z",
   "type": "verify_passed",
   "tasks": [
    "T3.6"
   ],
   "evidence": "all reviewers passed; no verifier routed (risk=low)",
   "fingerprint": "75e375949ee03f161a78666d3ee4c3d0b25c3d7b3d9b03d08bfeae224fd7763d",
   "skipped": "verifier"
  },
  {
   "at": "2026-11-24T03:50:04.041Z",
   "tasks": [
    "T3.6"
   ],
   "type": "reviewer_verdict",
   "evidence": "shot T3.3-6 (top of the page) shows \"Estimated spoken length: 4 s\", the Minimax estimate note and the FAQ link. T3.6-1 shows 375px with no sideways scroll. TextAdvisor.vue source: near and over warnings use role=status, the split suggestion appears, the FAQ link is 44px with focus-visible, and the over-limit warning points to the reason beside Generate.",
   "fingerprint": "75e375949ee03f161a78666d3ee4c3d0b25c3d7b3d9b03d08bfeae224fd7763d",
   "report": ".dashboard/media-studio/reports/media-studio-review-ux-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "ux"
  },
  {
   "at": "2026-11-24T03:50:04.041Z",
   "tasks": [
    "T3.5"
   ],
   "type": "reviewer_verdict",
   "evidence": "shots T3.5-1..6 show no dialog when tags are supported, a dialog listing what is approximated or removed, Convert followed by an Undo banner, Undo restoring the model and chip, Escape returning focus to the model list, and a 375px dialog with 44px buttons. ConvertTagsDialog.vue has trap-focus, a labelled title and description, and a mobile rule that enlarges the close X to 44px.",
   "fingerprint": "51441ef3e9d5af97daa0357c9c713997107e89dd05e25ef267b3d64a655dbeeb",
   "report": ".dashboard/media-studio/reports/media-studio-review-ux-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "ux"
  },
  {
   "at": "2026-11-24T03:50:04.041Z",
   "tasks": [
    "T3.4"
   ],
   "type": "reviewer_verdict",
   "evidence": "shots T3.4-1..4 show the chip inserted, a pause of 99 rejected inline, an editable pause chip and 375px wrapping with 44px chips. Attempt 1 and 2 findings still hold.",
   "fingerprint": "85722c05ebb83ef8dfa29f0b4e69eb177a7041221c8e321e072e5c6744ec65da",
   "report": ".dashboard/media-studio/reports/media-studio-review-ux-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "ux"
  },
  {
   "at": "2026-11-24T03:50:04.040Z",
   "tasks": [
    "T3.3"
   ],
   "type": "reviewer_verdict",
   "evidence": "shots T3.3-1 (empty state with Try an example), T3.3-3/4 (counter turns red, Generate disabled with the excess named), T3.3-7 (result card), T3.3-8 (failure with \"No credits were used\" and Try again) and T3.3-9 (402 opens the Low credits dialog, nothing queued). VoiceSelect.vue is a fieldset with a legend, 44px options, focus-visible and a role=status notice. The notice now builds from the fallbac",
   "fingerprint": "c3c134b72a6b6b5e6943773050dd8cd92c1326bbee1b04f9c4f04988d7cd95e5",
   "report": ".dashboard/media-studio/reports/media-studio-review-ux-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "ux"
  },
  {
   "at": "2026-11-24T03:50:03.872Z",
   "tasks": [
    "T3.6"
   ],
   "type": "reviewer_verdict",
   "evidence": "The advisor lines (spoken length, \"Estimated\" cost note, FAQ link) are legible and subordinate to the editor (T3.3-2, T3.6-1).",
   "fingerprint": "75e375949ee03f161a78666d3ee4c3d0b25c3d7b3d9b03d08bfeae224fd7763d",
   "report": ".dashboard/media-studio/reports/media-studio-review-ui-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "ui"
  },
  {
   "at": "2026-11-24T03:50:03.872Z",
   "tasks": [
    "T3.5"
   ],
   "type": "reviewer_verdict",
   "evidence": "The dialog is clear at 1280 and 375px (T3.5-2, T3.5-6): serif title, a \"Removed\" list, and Keep original and Convert as the clear primary action. The earlier blocker is fixed in source. ConvertTagsDialog.vue:141-147 sets the close button to 2.75rem (44px) at 640px and below. The selector's specificity beats AppModal's own 2.5rem rule.",
   "fingerprint": "51441ef3e9d5af97daa0357c9c713997107e89dd05e25ef267b3d64a655dbeeb",
   "report": ".dashboard/media-studio/reports/media-studio-review-ui-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "ui"
  },
  {
   "at": "2026-11-24T03:50:03.872Z",
   "tasks": [
    "T3.4"
   ],
   "type": "reviewer_verdict",
   "evidence": "Tag chips, the inline pause field and the toolbar read clearly (T3.4-1, T3.6-1). At 375px the toolbar wraps cleanly with 44px chips and nothing scrolls sideways.",
   "fingerprint": "85722c05ebb83ef8dfa29f0b4e69eb177a7041221c8e321e072e5c6744ec65da",
   "report": ".dashboard/media-studio/reports/media-studio-review-ui-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "ui"
  },
  {
   "at": "2026-11-24T03:50:03.871Z",
   "tasks": [
    "T3.3"
   ],
   "type": "reviewer_verdict",
   "evidence": "Composer, model list, voice rows, cost row and Generate read clearly in the dark on-system look (T3.3-2). The \"Preset voice\" blocker stays fixed. The voice notice reads \"Voice changed to Andy\" in T3.3-6, but VoiceSelect.vue:34-37 now builds it from the fallback voice, so that shot predates the fix.",
   "fingerprint": "c3c134b72a6b6b5e6943773050dd8cd92c1326bbee1b04f9c4f04988d7cd95e5",
   "report": ".dashboard/media-studio/reports/media-studio-review-ui-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "ui"
  },
  {
   "at": "2026-11-24T03:50:03.678Z",
   "tasks": [
    "T3.6"
   ],
   "type": "reviewer_verdict",
   "evidence": "AC1 met: `useTtsAdvice.seconds` recomputes from the doc (SpeechComposer passes the live doc); the test \"recomputes when the doc changes\" covers it. AC2 met: `level` is `near` at exactly 90% and `over` above the limit, with remaining characters in the warning text and a pointer to the disabled reason. AC3 met: `ESTIMATE_NOTE` renders when `estimated` is true, and `estimated` is true only for MINIMA",
   "fingerprint": "75e375949ee03f161a78666d3ee4c3d0b25c3d7b3d9b03d08bfeae224fd7763d",
   "report": ".dashboard/media-studio/reports/media-studio-review-code-haiku-a8.md",
   "verdict": "PASS",
   "reviewer": "code"
  },
  {
   "at": "2026-11-24T03:50:03.454Z",
   "tasks": [
    "T3.5"
   ],
   "type": "reviewer_verdict",
   "evidence": "AC1 requestModelSwitch changes the model directly when findUnsupportedTags is empty. AC2 ConvertTagsDialog lists the Approximated and Removed tags, and suggestedEmotion is shown. AC3 confirmSwitch stores the previous doc, model and emotion in undoState, and SpeechComposer shows an Undo button that calls undoConversion. AC4 Keep original, Escape and the close button all emit keep, which calls cance",
   "fingerprint": "51441ef3e9d5af97daa0357c9c713997107e89dd05e25ef267b3d64a655dbeeb",
   "report": ".dashboard/media-studio/reports/media-studio-review-code-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "code"
  },
  {
   "at": "2026-11-24T03:50:03.454Z",
   "tasks": [
    "T3.4"
   ],
   "type": "reviewer_verdict",
   "evidence": "AC1 to AC7 unchanged since the previous report, whose items were all advisory. Nothing in the diff regresses them.",
   "fingerprint": "85722c05ebb83ef8dfa29f0b4e69eb177a7041221c8e321e072e5c6744ec65da",
   "report": ".dashboard/media-studio/reports/media-studio-review-code-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "code"
  },
  {
   "at": "2026-11-24T03:50:03.453Z",
   "tasks": [
    "T3.3"
   ],
   "type": "reviewer_verdict",
   "evidence": "AC1 to AC6 still met. The VoiceSelect fallback notice is built from the `fallback` const (defineModel lags the parent re-render), is cleared on each model change, and is announced through role=status. Keep-or-default voice logic is intact. The 44px targets and focus rings are in the styles.",
   "fingerprint": "c3c134b72a6b6b5e6943773050dd8cd92c1326bbee1b04f9c4f04988d7cd95e5",
   "report": ".dashboard/media-studio/reports/media-studio-review-code-sonnet-a8.md",
   "verdict": "PASS",
   "reviewer": "code"
  },
  {
   "at": "2026-11-24T03:48:53.770Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.12"
   ],
   "fingerprint": "2415647e8050219870380d124602040736e9d138466f6387f2204600bbedc3c9",
   "slop": "PASS"
  },
  {
   "at": "2026-11-24T03:48:53.770Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.6"
   ],
   "fingerprint": "75e375949ee03f161a78666d3ee4c3d0b25c3d7b3d9b03d08bfeae224fd7763d",
   "slop": "PASS"
  },
  {
   "at": "2026-11-24T03:48:53.770Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.4"
   ],
   "fingerprint": "85722c05ebb83ef8dfa29f0b4e69eb177a7041221c8e321e072e5c6744ec65da",
   "slop": "PASS"
  },
  {
   "at": "2026-11-24T03:48:47.111Z",
   "type": "dirty_snapshot",
   "tasks": [],
   "hashes": {
    "agent_docs/media-studio/APPROVALS.md": "70f5ca564e2fe45c93c7a2d765341fb64f81b171",
    "agent_docs/media-studio/SPEC.md": "d4a927689a767909a05b9a2894a593c6a4fd78ab",
    "agent_docs/media-studio/TASKS.md": "bfe2e55f673c37b5b0b07db9a71017c9c5b81795",
    "apps/api/src/lib/media-input.test.ts": "92a1caf751d324aac1bbd250a1d25efc11b713f6",
    "apps/api/src/queue/generation-worker.ts": "4089d687fc6db74b159f88bae2f75358440b7185",
    "apps/api/src/routes/media.test.ts": "6f638dff71c131e08afd0c3c56b0f54785a8c119",
    "apps/api/src/routes/media.ts": "746ff968726cfc65fa3fe6da7da689004d8ed590",
    "apps/api/src/services/media-service.test.ts": "1bee1f95457e632d37993ec9c1f387900e0e8bac",
    "apps/api/src/services/media-service.ts": "b477104dd6be5ada6db5d4b659216de4dcefdec4",
    "apps/web/package.json": "5fc460b45789e9a124e4d379241bb8ec14cfe60a",
    "apps/web/src/components.d.ts": "9a8a99d15abca5639e57f6d6823196841750f29b",
    "apps/web/src/router/index.ts": "3f31c2e0eb9b3797c6f808e691bcb14e3c7e7c91",
    "bun.lock": "71613f800ce3dbff5e91fed474b4b73cb5b49509",
    "packages/shared/src/models/index.ts": "f505b6ada7b9b11fe42d5d381f431070e61265d7",
    "packages/shared/src/models/media-limits.ts": "d4197c320b5c9b888dd14438bb2f19e9a65f1ad7",
    "packages/shared/src/schemas/index.ts": "babecbeeb3e2d2de3ca280528d414a6397f6b036",
    "packages/shared/src/schemas/media.test.ts": "962cb41890db33c2da19556a4dcc033385b264b5",
    "packages/shared/src/schemas/media.ts": "f7aeb359daa12e1fc6a00ab10611bcd8cae75433",
    "apps/web/e2e/qa/speech.spec.ts": "95e632a6bd918952888b480127a4d3f115a8a23e",
    "apps/web/src/components/Speech/ConvertTagsDialog.test.ts": "ac460076d19556306b8bd1307c6157397c1dc594",
    "apps/web/src/components/Speech/ConvertTagsDialog.vue": "12b95f3984580c756e1d05d316017bfdeadaed76",
    "apps/web/src/components/Speech/SpeechComposer.test.ts": "e7189797a5e43c1dda6d32e9256830fc15e1b2ea",
    "apps/web/src/components/Speech/SpeechComposer.vue": "1456a89fba68c28193b912f280b904f50dead341",
    "apps/web/src/components/Speech/SpeechModelSelect.vue": "bd11114b0d9ada02e1531fa76a08aa0020c9ec78",
    "apps/web/src/components/Speech/TagChipNode.ts": "8b1fbf497d13dcf657d2b80a57792b4fd3c10f83",
    "apps/web/src/components/Speech/TagToolbar.vue": "8ae47e49d92ebf823ae343abaf5b869cac69be2f",
    "apps/web/src/components/Speech/TextAdvisor.test.ts": "51b33973cb22d6f04956357d3f96aecab901752a",
    "apps/web/src/components/Speech/TextAdvisor.vue": "86ccf42f18b0aad78a626aee2011e84c75b93f10",
    "apps/web/src/components/Speech/TtsEditor.vue": "3f95c3f608b4f0af8222469869c95e3478228b00",
    "apps/web/src/components/Speech/VoiceSelect.test.ts": "a8df8046d3149707c992175311146bdb283c911f",
    "apps/web/src/components/Speech/VoiceSelect.vue": "f69d7a383c3e6089d5f0b55353a034035a8a10bd",
    "apps/web/src/composables/useTtsAdvice.test.ts": "39275e10a291039a71a91f267b37da92e4644743",
    "apps/web/src/composables/useTtsAdvice.ts": "7e1630d60588012b7689e84f764a90a7ace7a626",
    "apps/web/src/composables/useTtsEditor.test.ts": "527384460c6a51a74acbea347bf4ef66dd3b9a83",
    "apps/web/src/composables/useTtsEditor.ts": "3be1ca190e7cf7888801c9500979c41d56be0891",
    "apps/web/src/pages/Speech.vue": "7cabc4af182bec67d701bd26b13a19d66f995b55",
    "packages/shared/src/models/tts-tags.test.ts": "5f736bd278923d427f9b2bbb5913844f898450d6",
    "packages/shared/src/models/tts-tags.ts": "ad4ce1196d628d46e43726e5970363b44af4fcbe"
   }
  },
  {
   "at": "2026-11-24T03:48:46.963Z",
   "type": "preflight_passed",
   "tasks": [
    "T3.13"
   ],
   "fingerprint": "81394ad0f8b09d2de8e7026bb2fca16629aa54452c04de586f2d2677e9e4da39"
  }
 ]
};
