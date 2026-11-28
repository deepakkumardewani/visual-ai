window.DASHBOARD = {
 "generatedAt": "2026-11-28T11:36:35.431Z",
 "maxAttempts": 5,
 "feature": {
  "slug": "media-studio-redesign",
  "title": "Media Studio Redesign Tasks"
 },
 "tasksFile": "agent_docs/media-studio-redesign/TASKS.md",
 "projectRoot": "/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai",
 "docs": [
  {
   "name": "PLAN",
   "href": "docs/PLAN.html",
   "source": "agent_docs/media-studio-redesign/PLAN.md"
  },
  {
   "name": "REPO_MAP",
   "href": "docs/REPO_MAP.html",
   "source": "agent_docs/media-studio-redesign/REPO_MAP.md"
  },
  {
   "name": "SPEC",
   "href": "docs/SPEC.html",
   "source": "agent_docs/media-studio-redesign/SPEC.md"
  },
  {
   "name": "TASKS",
   "href": "docs/TASKS.html",
   "source": "agent_docs/media-studio-redesign/TASKS.md"
  }
 ],
 "costUsd": null,
 "elapsedMs": null,
 "costByRole": null,
 "totals": {
  "phases": 8,
  "tasks": 100,
  "byStatus": {
   "ready": 3,
   "waiting": 97
  }
 },
 "phases": [
  {
   "id": "0",
   "name": "Shared foundations",
   "startLine": 13,
   "endLine": 456,
   "adds": "Adds the shared building blocks every studio needs: design tokens and a motion helper, procedural cover art, real waveforms, the upgraded bottom player, pills and popovers, the media model picker and the one shared studio frame.",
   "tryInUi": [
    "Run the unit suites listed in the Unit tasks",
    "Inspect apps/web/src/style.scss for the new player-offset, composer-width and ease tokens",
    "Run bun run check:ui-gates and confirm it passes (no UI screens change yet)."
   ],
   "checkpoint": {
    "title": "Checkpoint 0",
    "line": 455,
    "items": [
     "all new primitives are unit tested, the player persists across a route change in a test harness, and the token and grep gates pass."
    ]
   },
   "tasks": [
    {
     "id": "T0.1",
     "title": "Tokens, easing and layout variables (S0.1)",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/web/src/style.scss",
      "apps/web/tailwind.semantic-plugin.js"
     ],
     "gherkin": null,
     "do": "Add once to style.scss and the semantic plugin: the ease-out-expo easing utility (cubic-bezier 0.16,1,0.3,1), duration tokens 160, 260 and 380 ms, the single player-offset CSS variable (default 0, driven later by the bottom player), the single composer-width token set to 520px (R92), and the cover-art hue tokens (copper, gold, ember, umber family) for both themes. Focus rings must appear instantly (no transition on the ring itself, R68). Do not add transition-all anywhere.",
     "spec": "R63, R67, R68, R75, R16, R92",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The ease utility, three duration tokens, player-offset variable, composer-width token (520px) and cover hue tokens exist in light and dark and render without console errors.",
      "AC2: No transition-all and no arbitrary hex or px is introduced.",
      "AC3: The 520 composer width is defined only in the --tw-composer-width token and its mirror STUDIO_COMPOSER_WIDTH_PX in motionTokens.ts (T0.3, equality asserted by a unit test); no component hard-codes it."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `cd apps/web && npx vitest run tailwind.config.test.ts`"
     ],
     "line": 18,
     "ui": true,
     "status": "ready",
     "updatedAt": null,
     "verifierRouted": false,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [
      {
       "name": "code",
       "model": "haiku"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.2",
     "title": "Static UI gate script and npm script (S0.1 grep gate)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.1"
     ],
     "files": [
      "scripts/check-ui-gates.mjs",
      "package.json"
     ],
     "gherkin": null,
     "do": "Create scripts/check-ui-gates.mjs and wire the root npm script check:ui-gates. It scans the new and changed redesign components (components/Studio, Library, Audio, Music, Song, Speech, Video, Tools and the Library page files) and fails on: transition-all or transition: all, transition or animation on width, height, top, left, margin or inset, arbitrary hex colours, arbitrary px values in class names, tw-border-dashed or border-dashed, emoji used as icons, and the string \"No credits were charged.\". It prints each offender with file and line and exits non-zero. Re-run later by S7.",
     "spec": "R63, R75",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The script exits 0 on the current tree for the paths it scans and non-zero when a fixture file containing transition-all is passed to it.",
      "AC2: It is runnable as bun run check:ui-gates from the repo root with no server and no network."
     ],
     "verify": [
      "V1: `bun run check:ui-gates`"
     ],
     "line": 35,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": false,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [
      {
       "name": "code",
       "model": "haiku"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.3",
     "title": "Reduced-motion gate and duration constants (S0.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.1"
     ],
     "files": [
      "apps/web/src/composables/useDashboardMotion.ts",
      "apps/web/src/utils/motionTokens.ts"
     ],
     "gherkin": null,
     "do": "Create motionTokens.ts with named constants for the three durations (160, 260, 380 ms), the arrival stagger (40-80 ms, total at most 400 ms), the reduced-motion fade (150 ms) and the composer width mirroring the CSS token. Extend useDashboardMotion.ts with one useMotion helper built on the existing reduced-motion composable: it returns whether transforms and staggers are allowed and the effective duration, so no component checks prefers-reduced-motion itself.",
     "spec": "R63, R67, R92",
     "filesDeclared": true,
     "acceptance": [
      "AC1: With reduce on, useMotion reports no transforms and no stagger and a fade of at most 150 ms; with reduce off it returns the named durations.",
      "AC2: Existing useDashboardMotion consumers keep their behaviour.",
      "AC3: R92: STUDIO_COMPOSER_WIDTH_PX equals 520 and matches the --tw-composer-width token value; a unit test (T0.16) asserts the two are equal."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 51,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": false,
     "pending": [],
     "risk": "low",
     "surfaces": [
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "haiku"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.4",
     "title": "Procedural cover art function and named fixtures (S0.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.1"
     ],
     "files": [
      "apps/web/src/utils/coverArt.ts",
      "apps/web/src/utils/mediaFixtures.ts"
     ],
     "gherkin": null,
     "do": "Create coverArt.ts with a pure deterministic coverArtFor(seed, kind) that maps a seed (asset id plus prompt, never the title) to a warm gradient and shape composition using only the token hues with a limited per-seed hue offset, and artworkDataUrl(seed) for the player and Media Session. It is the single source of cover art for every surface (R98). Create mediaFixtures.ts with named fixture tracks (Monsoon over Pune, Small Rooms ep. 14 and others) with fixed ids and prompts shared by all tests and screenshots. No network calls.",
     "spec": "R58, R60, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Identical seeds give identical output and 50 distinct fixture seeds give 50 distinct outputs.",
      "AC2: Changing only the title never changes the output (R80).",
      "AC3: artworkDataUrl returns a data URL and issues no network request.",
      "AC4: R98: coverArtFor(seed, kind) is the only cover generator; no other file builds cover gradients."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 69,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.5",
     "title": "CoverArt component at three sizes (S0.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.4"
     ],
     "files": [
      "apps/web/src/components/Audio/CoverArt.vue"
     ],
     "gherkin": null,
     "do": "Build CoverArt.vue rendering coverArtFor output as inline SVG or CSS gradient at 40 px (list), 160 px (card) and 48 px (player); decorative (aria-hidden), the row title supplies the label. Use layout skill for sizing and polish for finish. A play button overlay (hover) must keep AA contrast against any seed in light and dark. Videos and images keep their real poster or thumbnail and do not use this component.",
     "spec": "R59, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R98: matches the mockup sleeve except that every cover is rendered from the single coverArtFor with seed = asset id plus prompt; the same fixture track renders an identical sleeve at all three sizes.",
      "AC2: The overlay play button has contrast of at least 4.5:1 against each fixture cover in light and dark.",
      "AC3: It makes zero network requests.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 87,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#default",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#images",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "images",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M5"
        ]
       }
      ]
     }
    },
    {
     "id": "T0.6",
     "title": "Peaks decode, cache and placeholder logic (S0.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.4"
     ],
     "files": [
      "apps/web/src/utils/peaks.ts",
      "apps/web/src/composables/usePeaks.ts",
      "apps/web/src/utils/audioEditMath.ts"
     ],
     "gherkin": null,
     "do": "peaks.ts decodes audio client-side with Web Audio (crossOrigin anonymous), buckets and quantises using the existing bucket logic, caches in an in-memory map plus localStorage (all access in try/catch, oldest-first eviction on quota errors), runs at most 2 decodes concurrently and only for rows in view (IntersectionObserver gate in usePeaks), never blocks first paint, and returns a deterministic placeholder pattern derived from the same seed while computing or on decode failure (CORS, 404). No new API field.",
     "spec": "R61, R62",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A fixture MP3 yields real peaks within 1 s of the row entering view.",
      "AC2: A decode failure returns the deterministic placeholder and never throws to the UI.",
      "AC3: Never more than 2 decodes run at once; a full localStorage evicts oldest entries and continues."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 111,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.7",
     "title": "WaveformStrip component (S0.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.6",
      "T0.5"
     ],
     "files": [
      "apps/web/src/components/Audio/WaveformStrip.vue"
     ],
     "gherkin": null,
     "do": "Build WaveformStrip.vue: bars from peaks (placeholder while computing or on failure), played portion tinted by progress, click or drag seeks only for the currently loaded track, keyboard seek stays on the player. Use layout and polish skills; bars scale with transform only.",
     "spec": "R61, R62",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Played portion tint follows player progress; clicking a non-loaded track waveform does not seek.",
      "AC2: While peaks compute and on decode failure the placeholder bars show with no layout shift.",
      "AC3: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC4: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC5: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 129,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#default",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M4"
        ]
       }
      ]
     }
    },
    {
     "id": "T0.8",
     "title": "Player store: queue, now playing, close on delete, metadata (S0.4)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.4"
     ],
     "files": [
      "apps/web/src/stores/player.ts",
      "apps/web/src/stores/player.test.ts"
     ],
     "gherkin": null,
     "do": "Extend stores/player.ts, which keeps ownership of the single audio element: add an ordered queue of ids from the list the track was started from (previous and next follow it), nowPlayingId for row highlighting, removeFromQueue and closeIfPlaying(id) so deleting the loaded track stops and closes the player while deleting another only drops it from the order, updateTrackMeta so rename and favorite update the title and Media Session at once with the cover unchanged, and artworkUrl fed from artworkDataUrl. Keep nothing-autoplays and the blocked status (Tap to play). Update player.test.ts only with equal or stronger assertions.",
     "spec": "R10, R12, R13, R14, R15, R60, R79, R80, R84",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Previous and next follow the order of the list the track was started from.",
      "AC2: closeIfPlaying on the loaded id stops playback and closes; on another id playback is uninterrupted and the order drops it.",
      "AC3: updateTrackMeta changes the title and Media Session metadata but not the artwork (seed unchanged).",
      "AC4: There is only one audio element and a route change does not remount it."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 152,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.9",
     "title": "Space toggles play/pause with typing guard (S0.4)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.8"
     ],
     "files": [
      "apps/web/src/composables/useGlobalShortcuts.ts"
     ],
     "gherkin": null,
     "do": "Add Space to toggle play/pause when focus is not in an input, textarea, contenteditable or modal; arrows seek; the MEDIA_SHORTCUTS list is unchanged.",
     "spec": "R17",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Space toggles playback on the page body and does nothing inside an input, textarea, contenteditable or open modal.",
      "AC2: Arrow keys seek by the existing step; the shortcuts list is unchanged."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 171,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.10",
     "title": "Bottom player UI (S0.4)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.8",
      "T0.9",
      "T0.7",
      "T0.5"
     ],
     "files": [
      "apps/web/src/components/Audio/MiniPlayer.vue",
      "apps/web/src/components/Audio/TimeCode.vue",
      "apps/web/src/components/Audio/PlayButton.vue",
      "apps/web/src/App.vue"
     ],
     "gherkin": null,
     "do": "Upgrade MiniPlayer.vue in place (stays mounted once in App.vue): cover, title, studio/type label, play/pause, previous and next, scrubber with waveform, elapsed and total time, volume, close; a compact two-row layout at 375 (cover, title, play/pause, scrubber). It drives the single player-offset variable so page content and the mobile Generate bar are never covered. Region role with label Audio player, state-dependent play name, slider with aria-valuetext \"1:02 of 3:10\", aria-current on the playing row. Layout, animate and polish skills.",
     "spec": "R10, R11, R15, R16, R17, R60, R71, R84",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R84: matches mockup except the player always shows exactly the track of the row marked now-playing (same cover, title, type label and elapsed time) and only one audio element plays; a test asserts the player title equals the aria-current row title.",
      "AC2: The player is a labelled region (Audio player), play/pause name changes with state, the scrubber exposes aria-valuetext, and the offset variable equals the player height while it is open and 0 when closed.",
      "AC3: At 375 the player is two rows with controls of at least 44 px and the page has no horizontal scroll.",
      "AC4: NotAllowedError shows the single Tap to play affordance; navigating between routes keeps status playing and currentTime advancing.",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 187,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#default",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#success",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--success--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/studio-frame.motion.md",
        "ids": [
         "M8"
        ]
       },
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M22"
        ]
       }
      ]
     }
    },
    {
     "id": "T0.11",
     "title": "PillButton, PillPopover and BottomSheet primitives (S0.5)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.1",
      "T0.3"
     ],
     "files": [
      "apps/web/src/components/Studio/PillButton.vue",
      "apps/web/src/components/Studio/PillPopover.vue",
      "apps/web/src/components/Studio/BottomSheet.vue",
      "apps/web/src/components/primitives/Popover.vue"
     ],
     "gherkin": null,
     "do": "Build the pill (shows current value, aria-haspopup, aria-expanded, aria-controls), the non-modal popover on the existing Popover primitive (opacity and transform, Esc and outside click close, focus returns to the pill) and a bottom sheet reusing the MobileSettingsSheet pattern, used instead of popovers at touch widths. Automatic values read \"Auto <thing>\"; disabled options expose their reason as title text. Layout, animate, micro-interactions and polish skills.",
     "spec": "R18, R19, R20, R23, R64, R69, R72, R74, R85",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R85: matches mockup except pill and button labels are white-space nowrap with a min-width so no label wraps at 1440 or 375; the action row of a composer stays on one line at 1440.",
      "AC2: Escape and outside click close and focus returns to the pill; the popover traps nothing.",
      "AC3: At touch width the same content opens as a bottom sheet with a grab handle.",
      "AC4: Changing a pill updates the cost badge in the same frame and never changes another pill (R23).",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 211,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#popover",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "popover",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--popover--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--popover--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--popover--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--popover--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#controls",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--controls--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/studio-frame.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3"
        ]
       }
      ]
     }
    },
    {
     "id": "T0.12",
     "title": "Media model picker modal and sheet (S0.6)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.11"
     ],
     "files": [
      "apps/web/src/components/Studio/MediaModelPicker.vue",
      "apps/web/src/components/Studio/MediaModelDetails.vue"
     ],
     "gherkin": null,
     "do": "Build the one model picker for media: a modal at desktop and a bottom sheet on mobile reading the same registry data as today (model list left; right pane = spec table plus that model's settings with a live cost line; primary \"Use model\"). Show name, ProviderIcon mark, one-line strength, cost badge for the current options, limits and an unavailable reason. Focus trap, Esc closes, focus restores. The image Create picker is untouched. Layout and polish skills.",
     "spec": "R21, R22, R23, R69, R86, R91",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R86: matches mockup except the right pane lists the chosen model's spec table plus that model's settings with a live cost line (Stable Audio 2.5 shows a Length segmented control with Auto, 0:30, 1:00, 2:00, 3:10), the modal height fits its content so no empty band taller than 24 px exists in either pane at 1440, and providers use ProviderIcon, never letter monograms.",
      "AC2: R91 shared part: the \"Use model\" button is single-line (white-space nowrap, min-width) at 1440 and 375 and the modal is sized to content.",
      "AC3: Choosing a model keeps drafts per the model-switch rules (carried fields kept, unsupported marked \"not used by <model>\", exceeded limits flagged not truncated).",
      "AC4: Focus is trapped while open, Esc closes and focus returns to the opening pill.",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 236,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#model-picker",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "model-picker",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--model-picker--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--model-picker--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--model-picker--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--model-picker--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/studio-frame.motion.md",
        "ids": [
         "M16",
         "M17"
        ]
       }
      ]
     }
    },
    {
     "id": "T0.13",
     "title": "Studio layout state machine (S0.7)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.3"
     ],
     "files": [
      "apps/web/src/composables/useStudioLayout.ts"
     ],
     "gherkin": null,
     "do": "Create useStudioLayout: states loading, hero and split from generationsCount (per studio, with a load-complete flag) and jobActive. Never hero while loading; hero returns only on a later visit with zero generations; the first job starting (not completing) moves hero to split; a failed first job stays split; revisits with generations go straight to split with no intro replay (track \"already introduced\" in memory).",
     "spec": "R5, R6, R7, R8",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Loading never yields hero; loaded with zero generations yields hero; a job starting yields split with typed text and model kept; a failed first job keeps split.",
      "AC2: A revisit with existing generations reports no intro to play."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 261,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.14",
     "title": "StudioFrame two-slot layout (S0.7)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.13",
      "T0.11",
      "T0.10"
     ],
     "files": [
      "apps/web/src/components/Studio/StudioFrame.vue",
      "apps/web/src/components/Studio/StudioShell.vue"
     ],
     "gherkin": null,
     "do": "Build StudioFrame.vue with named slots composer, stage, hero and mobile-bar: composer column at the 520px composer-width token, result column fills the rest and scrolls independently, bottom padding from the player-offset variable, Create/Library segmented switch below 1024 px, loading to hero or split cross-fade, hero docking to the left column in 350-400 ms (transform and opacity). StudioShell.vue becomes a thin compatibility wrapper until all screens migrate. Layout, animate and polish skills.",
     "spec": "R1, R3, R6, R8, R16, R66, R74, R92",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R92: matches mockup except the composer column measures exactly 520 px at 1440 and equals the single composer-width token; the stage takes the remaining width.",
      "AC2: R85: composer height and Generate button geometry differ by 0 px between idle and generating at 1440, and the Generate label is identical (no \"Generate another\").",
      "AC3: Hero never shows while loading; hero to split transition runs 350-400 ms and preserves typed text and model; reduced motion makes it a cross-fade.",
      "AC4: At 375 the Create/Library switch appears, the page has no horizontal scroll and the result column scrolls independently at 1440.",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 277,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#default",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#loading",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#settling",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "settling",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--settling--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--settling--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--settling--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--settling--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#success",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--success--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#generating",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--generating--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/studio-frame.motion.md",
        "ids": [
         "M4",
         "M18",
         "M19",
         "M20",
         "M24"
        ]
       }
      ]
     }
    },
    {
     "id": "T0.15",
     "title": "Studio hero, mobile Generate bar and error state (S0.7)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.14"
     ],
     "files": [
      "apps/web/src/components/Studio/StudioHero.vue",
      "apps/web/src/components/Studio/MobileGenerateBar.vue",
      "apps/web/src/components/Studio/StudioErrorState.vue"
     ],
     "gherkin": null,
     "do": "Build the centered hero composer (large pill composer, short heading, 2-3 example prompt chips, pills inside the composer footer) and the sticky mobile bar (model pill, Generate, CreditCostBadge) pinned directly above the compact player via the player-offset variable. StudioErrorState keeps its copy and renders the no-charge sentence from NO_CHARGE_SENTENCE. Keep the credits badge, canAffordGeneration handling, JobProgress stage text with \"you can leave this page\", HandoffMenu and ShortcutsPopover behaviours. Layout, animate, clarify and polish skills.",
     "spec": "R5, R7, R9, R85, R87, R88, R64",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R88: matches mockup #error except the copy is \"No credits were used.\" rendered from NO_CHARGE_SENTENCE via StudioErrorState; the string \"No credits were charged.\" appears nowhere in the build and StudioErrorState.test.ts keeps passing.",
      "AC2: R87: below 1024 px the sticky bar shows model pill, Generate and cost badge directly above the compact player via the offset variable; Generate is inside the viewport at scroll 0 and at the end of long content; targets are at least 44 px.",
      "AC3: R85: the action row is a single line at 1440 with nowrap labels and min-width buttons.",
      "AC4: Revisiting with existing generations shows no hero and replays no intro motion.",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 302,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#empty",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#error",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/studio-frame.html#controls",
        "path": "agent_docs/media-studio-redesign/design/studio-frame.html",
        "screen": "studio-frame",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/studio-frame.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/studio-frame--controls--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/studio-frame.motion.md",
        "ids": [
         "M14",
         "M15",
         "M21",
         "M22",
         "M23"
        ]
       }
      ]
     }
    },
    {
     "id": "T0.16",
     "title": "Unit: motion helper and constants",
     "done": false,
     "kind": "unit",
     "depends": [
      "T0.3"
     ],
     "files": [
      "apps/web/src/composables/useDashboardMotion.ts",
      "apps/web/src/utils/motionTokens.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/composables/useDashboardMotion.test.ts src/utils/motionTokens.test.ts --coverage --coverage.include=src/composables/useDashboardMotion.ts --coverage.include=src/utils/motionTokens.ts --coverage.reporter=text`"
     ],
     "line": 327,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.17",
     "title": "Unit: cover art and fixtures",
     "done": false,
     "kind": "unit",
     "depends": [
      "T0.4"
     ],
     "files": [
      "apps/web/src/utils/coverArt.ts",
      "apps/web/src/utils/mediaFixtures.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/utils/coverArt.test.ts src/utils/mediaFixtures.test.ts --coverage --coverage.include=src/utils/coverArt.ts --coverage.include=src/utils/mediaFixtures.ts --coverage.reporter=text`"
     ],
     "line": 341,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.18",
     "title": "Unit: peaks and usePeaks",
     "done": false,
     "kind": "unit",
     "depends": [
      "T0.6"
     ],
     "files": [
      "apps/web/src/utils/peaks.ts",
      "apps/web/src/composables/usePeaks.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/utils/peaks.test.ts src/composables/usePeaks.test.ts --coverage --coverage.include=src/utils/peaks.ts --coverage.include=src/composables/usePeaks.ts --coverage.reporter=text`"
     ],
     "line": 355,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.19",
     "title": "Unit: player store and shortcuts",
     "done": false,
     "kind": "unit",
     "depends": [
      "T0.10"
     ],
     "files": [
      "apps/web/src/stores/player.ts",
      "apps/web/src/composables/useGlobalShortcuts.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/stores/player.test.ts src/composables/useGlobalShortcuts.test.ts --coverage --coverage.include=src/stores/player.ts --coverage.include=src/composables/useGlobalShortcuts.ts --coverage.reporter=text`"
     ],
     "line": 369,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.20",
     "title": "Unit: pills and sheet",
     "done": false,
     "kind": "unit",
     "depends": [
      "T0.11"
     ],
     "files": [
      "apps/web/src/components/Studio/PillButton.vue",
      "apps/web/src/components/Studio/PillPopover.vue",
      "apps/web/src/components/Studio/BottomSheet.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Studio/PillButton.test.ts src/components/Studio/PillPopover.test.ts src/components/Studio/BottomSheet.test.ts --coverage --coverage.include=src/components/Studio/PillButton.vue --coverage.include=src/components/Studio/PillPopover.vue --coverage.include=src/components/Studio/BottomSheet.vue --coverage.reporter=text`"
     ],
     "line": 383,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.21",
     "title": "Unit: media model picker",
     "done": false,
     "kind": "unit",
     "depends": [
      "T0.12"
     ],
     "files": [
      "apps/web/src/components/Studio/MediaModelPicker.vue",
      "apps/web/src/components/Studio/MediaModelDetails.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Studio/MediaModelPicker.test.ts src/components/Studio/MediaModelDetails.test.ts --coverage --coverage.include=src/components/Studio/MediaModelPicker.vue --coverage.include=src/components/Studio/MediaModelDetails.vue --coverage.reporter=text`"
     ],
     "line": 397,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.22",
     "title": "Unit: studio layout state machine",
     "done": false,
     "kind": "unit",
     "depends": [
      "T0.13"
     ],
     "files": [
      "apps/web/src/composables/useStudioLayout.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/composables/useStudioLayout.test.ts --coverage --coverage.include=src/composables/useStudioLayout.ts --coverage.reporter=text`"
     ],
     "line": 411,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.23",
     "title": "Unit: studio frame parts",
     "done": false,
     "kind": "unit",
     "depends": [
      "T0.15"
     ],
     "files": [
      "apps/web/src/components/Studio/StudioFrame.vue",
      "apps/web/src/components/Studio/StudioHero.vue",
      "apps/web/src/components/Studio/MobileGenerateBar.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Studio/StudioFrame.test.ts src/components/Studio/StudioHero.test.ts src/components/Studio/MobileGenerateBar.test.ts --coverage --coverage.include=src/components/Studio/StudioFrame.vue --coverage.include=src/components/Studio/StudioHero.vue --coverage.include=src/components/Studio/MobileGenerateBar.vue --coverage.reporter=text`"
     ],
     "line": 425,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T0.24",
     "title": "E2E: Shared frame, player and popovers",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T0.23",
      "T0.19",
      "T0.21",
      "T0.20",
      "T0.22",
      "T0.17",
      "T0.18",
      "T0.16"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-frame.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-frame.spec.ts`, R1, R3, R6, R8, R10, R11, R16, R17, R18, R19, R20, R21, R22, R23, R84, R92",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Runs against a minimal harness route using the seeded fixture tracks; no paid endpoint is reachable.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-frame.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 439,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    }
   ],
   "verified": 0,
   "total": 24,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
  },
  {
   "id": "1",
   "name": "API additions (library management only)",
   "startLine": 457,
   "endLine": 559,
   "adds": "Adds server support for favoriting and renaming music, speech and video items, bulk delete, and search, sort and filters on the media list. No generation, credit or model changes.",
   "tryInUi": [
    "No UI in this phase: run the API unit tests listed in the Unit tasks",
    "Inspect apps/api/src/routes/media.ts for the new PATCH and bulk delete routes."
   ],
   "checkpoint": {
    "title": "Checkpoint 1",
    "line": 558,
    "items": [
     "API tests and bun run check are green and the list-filter, PATCH and bulk-delete behaviours are verified in tests."
    ]
   },
   "tasks": [
    {
     "id": "T1.1",
     "title": "Shared schemas, DTO, favorite field and index (S1.1)",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "apps/api/src/models/media-asset.ts",
      "packages/shared/src/types/domain.ts",
      "packages/shared/src/schemas/media.ts",
      "apps/api/src/services/media-asset-service.ts",
      "packages/shared/src/models/media-limits.ts"
     ],
     "gherkin": null,
     "do": "Add favorite (Boolean, default false) to MediaAsset with an index supporting the new sorts and filters per user without a collection scan (stay inside favorite and its index; any other Mongo schema change is ask-first), favorite optional on MediaAssetDto, MEDIA_TITLE_MAX = 120 as a shared constant, Zod schemas for the patch body (title trimmed 1-120 and/or favorite, at least one field) and the bulk delete body (ids, max 100), and map favorite in toMediaAssetDto (absent becomes false). No migration.",
     "spec": "R55, R57",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Valid and invalid patch and bulk bodies are accepted or rejected as specified (empty title, whitespace-only, over 120, no fields, 101 ids).",
      "AC2: Existing documents without favorite read as favorite false.",
      "AC3: The model registers the new index."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bunx vp test run packages/shared/src/schemas/media.test.ts`"
     ],
     "line": 462,
     "ui": false,
     "status": "ready",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T1.2",
     "title": "List filters and cursor correctness (S1.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T1.1"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-asset-service.ts",
      "packages/shared/src/schemas/media.ts"
     ],
     "gherkin": null,
     "do": "Add optional validated query params to GET /media/assets: feature (a media FeatureType), q (case-insensitive over title, prompt and lyrics, 1-100 chars, regex-escaped), sort (newest, oldest, title, longest, favorites where favorites = favorite desc then newest) and favorite=true. Bad values return 400 like parseListQuery. Cursors are compound (sort key plus _id) so ties never skip or repeat; longest handles null durationSec. Results stay owner-scoped.",
     "spec": "R54",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Paging across ties returns every item exactly once for each sort.",
      "AC2: GET /media/assets?feature=song&q=lofi&sort=title&favorite=true returns only matching owned assets with a valid cursor.",
      "AC3: Regex metacharacters in q are matched literally; invalid sort, feature or q length returns 400."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 480,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T1.3",
     "title": "PATCH rename/favorite and bulk delete (S1.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T1.1",
      "T1.2"
     ],
     "files": [
      "apps/api/src/routes/media.ts",
      "apps/api/src/services/media-asset-service.ts",
      "apps/api/src/services/cloudinary-service.ts"
     ],
     "gherkin": null,
     "do": "Add PATCH /media/assets/:id (title and/or favorite, returns the updated DTO) and POST /media/assets/delete (ids max 100, deletes owned assets and their Cloudinary files, returns per-id results including partial Cloudinary failure), both behind requireAuth with owner checks following the existing 404/403 pattern. Renaming never touches prompt, lyrics or params. No Replicate call and no credit change.",
     "spec": "R55, R56, R57",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A non-owner gets 404/403 per the existing pattern and an invalid body gets 400.",
      "AC2: Bulk delete returns per-id results, caps at 100 ids and reports a partial Cloudinary failure per id.",
      "AC3: No credit balance change and no Replicate call occur (asserted with injected spies)."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 497,
     "ui": false,
     "status": "waiting",
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
     "id": "T1.4",
     "title": "Unit: shared media schemas",
     "done": false,
     "kind": "unit",
     "depends": [
      "T1.3"
     ],
     "files": [
      "packages/shared/src/schemas/media.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run packages/shared/src/schemas/media.test.ts --coverage --coverage.include=packages/shared/src/schemas/media.ts --coverage.reporter=text`"
     ],
     "line": 514,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T1.5",
     "title": "Unit: media service and routes",
     "done": false,
     "kind": "unit",
     "depends": [
      "T1.3"
     ],
     "files": [
      "apps/api/src/services/media-asset-service.ts",
      "apps/api/src/routes/media.ts",
      "apps/api/src/models/media-asset.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover ownership, 400 validation, not-found, the 100-id cap, per-id results, paging across ties for each sort, q escaping and the favorite index.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/api && npx vitest run src/services/media-asset-service.test.ts src/routes/media.test.ts --coverage --coverage.include=src/services/media-asset-service.ts --coverage.include=src/routes/media.ts --coverage.reporter=text`"
     ],
     "line": 528,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T1.6",
     "title": "E2E: Library API: filters, rename, favorite, bulk delete",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T1.4",
      "T1.5"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-library-api.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-library-api.spec.ts`, R54, R55, R56, R57",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Cloudinary deletes are stubbed; no credit change is observed.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-library-api.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 542,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
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
   "id": "2",
   "name": "Library engine and shared rows",
   "startLine": 560,
   "endLine": 767,
   "adds": "Adds the track list and print grid that fill the right pane of every studio: record-sleeve rows with cover art and waveforms, pending rows for running jobs, a track detail panel and an overflow menu.",
   "tryInUi": [
    "Open the Music studio after Phase 3 lands to see the pane",
    "for now run the Unit tasks of this phase",
    "Run bun run check and the gate task commands."
   ],
   "checkpoint": {
    "title": "Checkpoint 2",
    "line": 766,
    "items": [
     "rows, grid, compact LibraryView, detail panel and menu are tested; gate G2 passes design review on the studio frame states."
    ]
   },
   "tasks": [
    {
     "id": "T2.1",
     "title": "Setup: e2e seed and stubs for the library (S2.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.4",
      "T1.3"
     ],
     "files": [
      "apps/web/e2e/support/mediaAssetSeed.ts",
      "apps/web/e2e/fixtures/media.ts"
     ],
     "gherkin": null,
     "do": "Extend the seeded media harness: seed the named fixture tracks with fixed ids and prompts, favorites, a very long title, an asset whose audio URL fails (404), a tiny fixture MP3 for peaks, stubs for the new list params, PATCH and bulk delete, and an interceptor for voice-samples files. Keep paidCallGuard on; nothing here reaches a real service.",
     "spec": "R78",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The seed provides the named fixture tracks, a long-title asset, a failing-audio asset and favorites.",
      "AC2: The new endpoints are stubbed and paidCallGuard still reports zero un-intercepted paid calls."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 565,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": false,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [
      {
       "name": "code",
       "model": "haiku"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T2.2",
     "title": "Library filters composable (S2.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T1.2"
     ],
     "files": [
      "apps/web/src/composables/useLibraryFilters.ts",
      "apps/web/src/pages/utils/index.ts"
     ],
     "gherkin": null,
     "do": "Create useLibraryFilters: tab set and counts, 250 ms debounced search over title and prompt (and lyrics for songs), sort comparator (newest, oldest, title, favorites first, longest on audio and video tabs only) remembered per session in sessionStorage inside try/catch, deep-link parse of tab, q and sort with fallback to defaults for unknown values and no console error, preset filter (all, image, video, music, song, speech or a feature list), images sorted by prompt for title, the merged list comparator, and selection rules (clears on tab change).",
     "spec": "R4, R43, R44, R46, R53",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Unknown tab or sort falls back to All and newest with no console error.",
      "AC2: Search is debounced 250 ms; images sort by prompt for title A-Z; longest is offered only on audio and video tabs.",
      "AC3: A sessionStorage failure does not throw."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 581,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T2.3",
     "title": "History store: tabs, media actions, optimistic updates (S2.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T2.2",
      "T1.3"
     ],
     "files": [
      "apps/web/src/stores/history.ts",
      "apps/web/src/utils/helpers.ts",
      "apps/web/src/stores/history.test.ts"
     ],
     "gherkin": null,
     "do": "Update stores/history.ts: HISTORY_CHIPS drops Tools and matchesChip files tool outputs under Images or Videos by output type; add media favorite and rename calls (PATCH) with optimistic update, rollback and toast on failure, image rename absent, bulk media delete in sequential chunks of 100 with per-id results and a partial-failure count (mixed selections also run the image bulk delete), session sketch results kept first in memory for the Sketch pane, a running job appearing in the list on completion, and cursor paging bookkeeping with HISTORY_CAP messaging. Migrate history.test.ts with equal or stronger assertions.",
     "spec": "R34, R42, R45, R46, R47, R51, R79, R81",
     "filesDeclared": true,
     "acceptance": [
      "AC1: A failed favorite or rename rolls back and surfaces a toast.",
      "AC2: Selections over 100 media items are sent in sequential chunks of 100 and a partial failure reports the failed count.",
      "AC3: Image items expose no rename; the Tools chip is gone from the tab set.",
      "AC4: The existing history tests still pass with equal assertions."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `cd apps/web && npx vitest run src/stores/history.test.ts`"
     ],
     "line": 599,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T2.4",
     "title": "TrackRow, PendingRow and VisualGrid (S2.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T2.3",
      "T0.10",
      "T2.1"
     ],
     "files": [
      "apps/web/src/components/Library/TrackRow.vue",
      "apps/web/src/components/Library/PendingRow.vue",
      "apps/web/src/components/Library/VisualGrid.vue"
     ],
     "gherkin": null,
     "do": "Build the record-sleeve row (play, cover, title, waveform, duration, model, date, favorite, overflow; collapses to cover, title, duration, play, overflow at 375), the pending row (stage text from JobProgress, progress by transform scaleX, no shimmer, cross-fades into the finished row) and the print grid cards (thumbUrl, masonry). The now-playing row is tinted not outlined with equaliser bars and aria-current; arrival stagger plays once per new asset and not on filter or revisit; a failed audio URL shows \"Couldn't load audio\" with Retry and the placeholder waveform; long titles ellipsize with the full text in title. Layout, animate, micro-interactions and polish skills.",
     "spec": "R12, R40, R48, R64, R65, R66, R79, R81, R82, R83, R84, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R84: matches mockup except exactly one row has aria-current for the loaded track in every list that shows it, and its cover, title and type label equal the player's.",
      "AC2: R98: every audio cover comes from the single coverArtFor sleeve; the same fixture track has identical sleeve in the row and the player; videos and images keep their real poster.",
      "AC3: A 200-character title shows an ellipsis with the full text in the title attribute and no row grows taller than its design height.",
      "AC4: The arrival reveal plays once per new asset and not when the list is filtered or revisited.",
      "AC5: A failing audio URL shows \"Couldn't load audio\" with a working Retry and does not break the rest of the list or the player.",
      "AC6: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC7: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC8: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 618,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#default",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#images",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "images",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#songs",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "songs",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--songs--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--songs--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--songs--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--songs--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M4",
         "M5",
         "M6",
         "M7",
         "M8",
         "M9",
         "M20"
        ]
       },
       {
        "path": "agent_docs/media-studio-redesign/design/studio-frame.motion.md",
        "ids": [
         "M5",
         "M6",
         "M7",
         "M9",
         "M10",
         "M11",
         "M12",
         "M13"
        ]
       }
      ]
     }
    },
    {
     "id": "T2.5",
     "title": "Compact LibraryView and empty/error states (S2.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T2.4",
      "T2.3"
     ],
     "files": [
      "apps/web/src/components/Library/LibraryView.vue",
      "apps/web/src/components/Library/LibraryEmpty.vue",
      "apps/web/src/components/History/History.vue"
     ],
     "gherkin": null,
     "do": "Build LibraryView taking preset, compact, layout and hideTypeTabs; studios embed it compact (type tabs hidden, search and sort kept) and the Library page will embed it full. Refactor History.vue into it and migrate the existing History tests with equal assertions. States: quiet loading placeholder (no shimmer), per-tab empty with one action linking to the matching studio (no dashed border), inline error with Retry, no-results offering to clear the search. Layout and polish skills.",
     "spec": "R4, R40, R50, R66, R81",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The pane shows only the preset type; type tabs are hidden in compact mode; search and sort remain.",
      "AC2: Loading shows no shimmer and the empty state has no dashed border; the error state offers Retry and never shows wrong credits or data.",
      "AC3: Existing History tests still pass or are migrated with equal or stronger assertions.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`",
      "V3: `cd apps/web && npx vitest run src/components/History`"
     ],
     "line": 644,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#loading",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#empty",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#error",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#no-results",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "no-results",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--no-results--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--no-results--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--no-results--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--no-results--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M2"
        ]
       }
      ]
     }
    },
    {
     "id": "T2.6",
     "title": "Track detail panel and overflow menu (S2.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T2.4",
      "T0.11"
     ],
     "files": [
      "apps/web/src/components/Library/TrackDetailPanel.vue",
      "apps/web/src/components/Library/RowMenu.vue",
      "apps/web/src/components/Studio/HandoffMenu.vue"
     ],
     "gherkin": null,
     "do": "Build the shared track detail panel (inline expansion on desktop, bottom sheet at 375): large cover (the same sleeve), prompt, style tags, lyrics view, waveform editor entry and the overflow actions; activating a title by click or Enter opens it. RowMenu is a grouped menu with a one-line description per action: Play, Open/Edit, Rename, Favorite, Download, Copy prompt, Reuse prompt in studio, Delete; image items hide Rename. The waveform editor opens as a panel or sheet with existing behaviour and copy (EXPORT_TOO_LONG_COPY, HISTORY_FULL_COPY) unchanged. Keep HandoffMenu actions. Layout, animate and polish skills.",
     "spec": "R26, R30, R49, R80, R84, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R84: matches mockup #track-detail except the player shows the same track as the aria-current row while the panel is open.",
      "AC2: R98: the large cover in the panel is the same coverArtFor sleeve as the row and player.",
      "AC3: Image items show no Rename in the menu; renaming or favoriting the playing track updates the player title immediately.",
      "AC4: Focus returns to the opening control when the panel or menu closes; existing editor tests pass unchanged.",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 669,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#track-detail",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "track-detail",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--track-detail--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--track-detail--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--track-detail--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--track-detail--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#editor",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "editor",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--editor--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--editor--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--editor--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--editor--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#track-detail",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "track-detail",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--track-detail--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--track-detail--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--track-detail--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--track-detail--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#menu",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "menu",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--menu--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--menu--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--menu--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--menu--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/music-studio.motion.md",
        "ids": [
         "M22",
         "M23",
         "M24"
        ]
       },
       {
        "path": "agent_docs/media-studio-redesign/design/song-studio.motion.md",
        "ids": [
         "M25"
        ]
       },
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M15"
        ]
       }
      ]
     }
    },
    {
     "id": "T2.7",
     "title": "Unit: library logic",
     "done": false,
     "kind": "unit",
     "depends": [
      "T2.3"
     ],
     "files": [
      "apps/web/src/composables/useLibraryFilters.ts",
      "apps/web/src/stores/history.ts",
      "apps/web/src/utils/helpers.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/composables/useLibraryFilters.test.ts src/stores/history.test.ts src/utils/helpers.test.ts --coverage --coverage.include=src/composables/useLibraryFilters.ts --coverage.include=src/stores/history.ts --coverage.include=src/utils/helpers.ts --coverage.reporter=text`"
     ],
     "line": 694,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T2.8",
     "title": "Unit: library rows and views",
     "done": false,
     "kind": "unit",
     "depends": [
      "T2.5",
      "T2.6"
     ],
     "files": [
      "apps/web/src/components/Library/TrackRow.vue",
      "apps/web/src/components/Library/VisualGrid.vue",
      "apps/web/src/components/Library/LibraryView.vue",
      "apps/web/src/components/Library/PendingRow.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Library/TrackRow.test.ts src/components/Library/VisualGrid.test.ts src/components/Library/LibraryView.test.ts src/components/Library/PendingRow.test.ts --coverage --coverage.include=src/components/Library/TrackRow.vue --coverage.include=src/components/Library/VisualGrid.vue --coverage.include=src/components/Library/LibraryView.vue --coverage.include=src/components/Library/PendingRow.vue --coverage.reporter=text`"
     ],
     "line": 708,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T2.9",
     "title": "Unit: track detail and menu",
     "done": false,
     "kind": "unit",
     "depends": [
      "T2.6"
     ],
     "files": [
      "apps/web/src/components/Library/TrackDetailPanel.vue",
      "apps/web/src/components/Library/RowMenu.vue",
      "apps/web/src/components/Library/LibraryEmpty.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Library/TrackDetailPanel.test.ts src/components/Library/RowMenu.test.ts src/components/Library/LibraryEmpty.test.ts --coverage --coverage.include=src/components/Library/TrackDetailPanel.vue --coverage.include=src/components/Library/RowMenu.vue --coverage.include=src/components/Library/LibraryEmpty.vue --coverage.reporter=text`"
     ],
     "line": 722,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T2.10",
     "title": "E2E: Track rows, grid and detail panel",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T2.8",
      "T2.9"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-rows.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-rows.spec.ts`, R12, R40, R48, R49, R61, R62, R64, R65, R66, R84, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Uses the seeded fixture tracks and the 404 audio asset.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-rows.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 736,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T2.11",
     "title": "Gate: G2 studio frame and rows",
     "done": false,
     "kind": "gate",
     "depends": [
      "T2.10",
      "T0.24",
      "T1.6",
      "T2.7"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint and full unit suites pass.",
      "AC2: design-qa (MODE PHASE) on studio-frame.html states default, error, generating, empty (hero at 1440 and 375, light and dark) and the library rows spot check reports PASS including R84, R85, R87, R88 and R92.",
      "AC3: No regression in image generation or History."
     ],
     "verify": [
      "V1: `bun run verify`",
      "V2: `bun run check`",
      "V3: `bun run test`"
     ],
     "line": 752,
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
   "total": 11,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
  },
  {
   "id": "3",
   "name": "Audio studios",
   "startLine": 768,
   "endLine": 1139,
   "adds": "Redesigns Music, Song and Speech on the shared frame: prompt-first Music with mood and genre chips, a lyrics-first Song editor with a structure strip, and Speech with a script writing surface and audition-able voice cards. Each shows its own generations as record rows.",
   "tryInUi": [
    "Open /audio/music, /audio/song and /audio/speech at 1440 and 375",
    "Type a prompt and start a mocked generation and watch the hero dock into the split layout",
    "Play a track and switch studios to confirm the player keeps playing."
   ],
   "checkpoint": {
    "title": "Checkpoint 3",
    "line": 1138,
    "items": [
     "the three audio studios share one frame and navigation keeps a playing track playing."
    ]
   },
   "tasks": [
    {
     "id": "T3.1",
     "title": "Music composer with mood, genre and length chips (S3.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.12",
      "T0.15"
     ],
     "files": [
      "apps/web/src/components/Music/MusicComposer.vue",
      "apps/web/src/components/Music/MoodGenreChips.vue",
      "apps/web/src/components/Music/DurationControl.vue"
     ],
     "gherkin": null,
     "do": "Prompt-first composer: one large prompt field, mood, genre and length chips under it (colour swatch, multi-select where the model allows, search in the popover), duration pill reusing DurationControl logic with Auto duration, Auto genre and Auto mood labels, model pill, and Generate with cost. The request payload stays identical to today. Drafts persist via the existing composer persistence. Layout, animate, typeset and polish skills. Hero state: centered composer with 2-3 example prompt chips and no right pane when the studio has zero generations after load.",
     "spec": "R18, R19, R23, R27, R76",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R85: matches mockup except the action row (model pill, duration pill, Generate, cost badge) stays on one line at 1440 with nowrap labels and min-width buttons.",
      "AC2: The Music request payload is byte-identical to before for the same inputs (R76).",
      "AC3: Auto labels read \"Auto duration\", \"Auto genre\", \"Auto mood\" and the cost badge updates in the same frame as any pill change.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 773,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#default",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#genre-popover",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "genre-popover",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--genre-popover--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--genre-popover--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--genre-popover--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--genre-popover--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#controls",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--controls--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/music-studio.motion.md",
        "ids": [
         "M18",
         "M19",
         "M20",
         "M21"
        ]
       },
       {
        "path": "agent_docs/media-studio-redesign/design/studio-frame.motion.md",
        "ids": [
         "M21",
         "M22",
         "M23"
        ]
       }
      ]
     }
    },
    {
     "id": "T3.2",
     "title": "Music page on the frame with Library pane (S3.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T3.1",
      "T2.5",
      "T2.6",
      "T2.11"
     ],
     "files": [
      "apps/web/src/pages/Music.vue",
      "apps/web/src/components/Music/MusicModelSelect.vue"
     ],
     "gherkin": null,
     "do": "Rebuild pages/Music.vue on StudioFrame with the Library pane (preset music, compact) and remove MusicModelSelect.vue and its test (replaced by the model pill and picker). No dashed placeholder anywhere. Job progress shows in the pending row with a cross-fade to the finished row. Layout, animate and polish skills.",
     "spec": "R4, R5, R9, R74, R84, R85, R87, R88, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R84: matches mockup except the player equals the aria-current row in default, generating, success and track-detail.",
      "AC2: R85: the composer height and Generate geometry differ by 0 px between idle and generating and the label stays \"Generate\".",
      "AC3: R87: at 375 the sticky bar (model pill, Generate, cost) sits above the compact player, Generate inside the viewport at scroll 0, light and dark.",
      "AC4: R88: #error shows \"No credits were used.\" from NO_CHARGE_SENTENCE and never \"No credits were charged.\".",
      "AC5: R98: row, detail and player show the identical sleeve for each named fixture track.",
      "AC6: MusicModelSelect.vue is deleted and nothing imports it.",
      "AC7: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC8: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC9: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 797,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#empty",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#loading",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#generating",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--generating--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#success",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--success--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#error",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#track-detail",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "track-detail",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--track-detail--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--track-detail--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--track-detail--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--track-detail--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/music-studio.html#editor",
        "path": "agent_docs/media-studio-redesign/design/music-studio.html",
        "screen": "music-studio",
        "state": "editor",
        "href": "../../agent_docs/media-studio-redesign/design/music-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--editor--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--editor--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--editor--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/music-studio--editor--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/music-studio.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3",
         "M4",
         "M5",
         "M6",
         "M7",
         "M8",
         "M9",
         "M10",
         "M11",
         "M12",
         "M13",
         "M14",
         "M15",
         "M16",
         "M17"
        ]
       }
      ]
     }
    },
    {
     "id": "T3.3",
     "title": "Lyrics sections model with undo/redo (S3.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.3"
     ],
     "files": [
      "apps/web/src/composables/useLyricsSections.ts"
     ],
     "gherkin": null,
     "do": "Create useLyricsSections: parse existing lyrics text into labelled sections (Intro, Verse, Chorus, Bridge, Outro) and serialise back unchanged, add, reorder (with a keyboard alternative) and delete a section, undo and redo with at least 50 steps (Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z), the character budget (420 / 600 counter with over-budget message) and per-session collapse state. Existing lyrics text round-trips byte for byte.",
     "spec": "R24, R25, R73",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Undo and redo support at least 50 steps including section add, reorder and delete.",
      "AC2: The budget counter and over-budget message match today; round-tripping existing lyrics is lossless."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 823,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.4",
     "title": "Structure strip and Styles panel (S3.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T3.3",
      "T0.11"
     ],
     "files": [
      "apps/web/src/components/Song/StructureStrip.vue",
      "apps/web/src/components/Song/StylesPanel.vue",
      "apps/web/src/components/Song/StylePresets.vue",
      "apps/web/src/components/Song/songPresets.ts"
     ],
     "gherkin": null,
     "do": "Build the one-glance structure strip with a section-coloured rule per type, and the collapsible Styles panel (style tag chips with search and a \"Your sound\" summary, collapsed state remembered per session). Layout, typeset and polish skills.",
     "spec": "R25, R73, R89",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R89: matches mockup except the strip shows the whole song in the 520 px column at 1440 using compact tokens (I, V1, C, V2, C, B, C, O, each with its section-coloured rule) or two wrapped rows, with no token clipped mid-word and the \"+\" add control always visible as in #empty.",
      "AC2: R89 at 375: the strip is a horizontal scroller with an edge fade that scrolls the active part into view.",
      "AC3: Section labels are programmatic (aria-label with the section name).",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 840,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#default",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#empty",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#controls",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--controls--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/song-studio.motion.md",
        "ids": [
         "M18",
         "M22"
        ]
       }
      ]
     }
    },
    {
     "id": "T3.5",
     "title": "Lyrics editor blocks, mode pill and AI menu (S3.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T3.3",
      "T3.4"
     ],
     "files": [
      "apps/web/src/components/Song/LyricsEditor.vue",
      "apps/web/src/components/Song/LyricsAiMenu.vue"
     ],
     "gherkin": null,
     "do": "Extend LyricsEditor into a writing page of labelled section blocks (copper/gold rule per type, accent used sparingly) with inline edit, add, reorder (drag and keyboard) and delete, collapse and expand, a fullscreen sheet, undo and redo buttons with accessible names and disabled states, and the lyrics mode pill (Write myself, Auto lyrics, Instrumental). LyricsAiMenu generate and condense actions and the budget stay. Layout, animate, typeset and polish skills.",
     "spec": "R24, R25, R73",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Matches mockup except R73: every section block has a programmatic label and undo and redo have accessible names and disabled states.",
      "AC2: Add, reorder, delete, collapse, fullscreen, undo and redo all work with keyboard alone.",
      "AC3: The AI lyrics actions and the 420 / 600 budget behave as before.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 864,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#lyrics-expanded",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "lyrics-expanded",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--lyrics-expanded--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--lyrics-expanded--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--lyrics-expanded--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--lyrics-expanded--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#lyrics-mode",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "lyrics-mode",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--lyrics-mode--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--lyrics-mode--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--lyrics-mode--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--lyrics-mode--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/song-studio.motion.md",
        "ids": [
         "M19",
         "M20",
         "M21",
         "M23",
         "M24"
        ]
       }
      ]
     }
    },
    {
     "id": "T3.6",
     "title": "Song page on the frame with Library pane (S3.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T3.5",
      "T2.5",
      "T2.6",
      "T2.11"
     ],
     "files": [
      "apps/web/src/pages/SongStudio.vue",
      "apps/web/src/components/Song/SongComposer.vue",
      "apps/web/src/components/Song/SongResult.vue"
     ],
     "gherkin": null,
     "do": "Rebuild SongComposer and pages/SongStudio.vue on StudioFrame (lyrics first, pills for model, lyrics mode and style; preset song pane) and delete SongResult.vue and its test (replaced by track rows and the shared detail panel). Request payload unchanged. Hero state: centered composer with 2-3 example prompt chips and no right pane when the studio has zero generations after load.",
     "spec": "R4, R5, R9, R26, R74, R84, R85, R87, R88, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R87: matches mockup except at 375 the sticky bar (model pill, Generate, cost) is pinned above the player and Generate is inside the viewport at scroll 0 and at the end of a long lyrics (not at y=1396), light and dark.",
      "AC2: R84: the player title equals the aria-current row title in #default and #track-detail.",
      "AC3: R85: composer height and Generate geometry differ by 0 px idle vs generating, same label.",
      "AC4: R88: #error shows \"No credits were used.\".",
      "AC5: R98: identical sleeve in row, detail and player.",
      "AC6: SongResult.vue is deleted and nothing imports it; the Song request payload is unchanged (R76).",
      "AC7: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC8: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC9: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 887,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#loading",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#generating",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--generating--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#success",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--success--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#error",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/song-studio.html#track-detail",
        "path": "agent_docs/media-studio-redesign/design/song-studio.html",
        "screen": "song-studio",
        "state": "track-detail",
        "href": "../../agent_docs/media-studio-redesign/design/song-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--track-detail--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--track-detail--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--track-detail--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/song-studio--track-detail--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/song-studio.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3",
         "M4",
         "M5",
         "M6",
         "M7",
         "M8",
         "M9",
         "M10",
         "M11",
         "M12",
         "M13",
         "M14",
         "M15",
         "M16",
         "M17",
         "M25"
        ]
       }
      ]
     }
    },
    {
     "id": "T3.7",
     "title": "Voice samples manifest and traits map (S3.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.3"
     ],
     "files": [
      "apps/web/src/utils/voiceSamples.ts",
      "apps/web/src/utils/voiceTraits.ts",
      "apps/web/public/voice-samples/.gitkeep"
     ],
     "gherkin": null,
     "do": "voiceSamples.ts is a manifest keyed by voiceCatalog:voiceId (the registry media.voices key such as inworld or minimax) mapping to /voice-samples/<catalog>/<id>.mp3; it ships EMPTY and valid because the owner records the clips later (agents and tests never generate them). voiceTraits.ts maps the same keys to up to 3 short traits shown as \"warm · female · US\" (display only, no registry change). A voice with no entry yields no traits and no sample.",
     "spec": "R29, R29a, R29b",
     "filesDeclared": true,
     "acceptance": [
      "AC1: An empty manifest is valid and voiceSampleFor returns undefined for every voice.",
      "AC2: Traits render as up to 3 values joined by \" · \" and are omitted when a voice has no entry."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 913,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": false,
     "pending": [],
     "risk": "low",
     "surfaces": [
      "logic"
     ],
     "reviewers": [
      {
       "name": "code",
       "model": "haiku"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.8",
     "title": "Voice cards and strip with audition (S3.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T3.7",
      "T0.10"
     ],
     "files": [
      "apps/web/src/components/Speech/VoiceCard.vue",
      "apps/web/src/components/Speech/VoiceStrip.vue"
     ],
     "gherkin": null,
     "do": "Build voice cards (name, traits line, audition button with equaliser bars on the one playing, selected state marked by shape and label not colour alone) in a horizontally scrollable strip. Audition plays the manifest clip through the bottom player and never triggers a generation, TTS call or credit charge; a voice with no manifest entry shows a disabled play button with the accessible hint \"Preview not available\". Layout, animate, micro-interactions and polish skills.",
     "spec": "R28, R29, R90",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R90: matches mockup except in #default and #audition at 1440x900 the whole \"Cast a voice\" row (name, traits, audition button, selected-state label and outline of every visible card) is visible above the Generate bar, uncovered and not clipped at the column edge.",
      "AC2: Selected state is shown by an outline plus a text label, not colour alone.",
      "AC3: With an empty manifest every audition button is disabled with the hint \"Preview not available\" and the strip still renders.",
      "AC4: Auditioning issues zero requests to generate or TTS endpoints (request interception).",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 930,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#audition",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "audition",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--audition--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--audition--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--audition--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--audition--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#default",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--default--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/speech-studio.motion.md",
        "ids": [
         "M18",
         "M19",
         "M20",
         "M21"
        ]
       }
      ]
     }
    },
    {
     "id": "T3.9",
     "title": "Speech composer script surface (S3.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T3.8",
      "T0.12",
      "T0.15"
     ],
     "files": [
      "apps/web/src/components/Speech/SpeechComposer.vue",
      "apps/web/src/components/Speech/TtsEditor.vue",
      "apps/web/src/components/Speech/TagToolbar.vue"
     ],
     "gherkin": null,
     "do": "Style the script editor as a writing surface with the delivery-cue toolbar and slash menu (behaviour of TtsEditor, TagToolbar, TextAdvisor and ConvertTagsDialog unchanged), cap the script area at about 300 px with internal scroll so the voice strip stays visible, and place model and voice pills in the composer footer. The selected voice id sent to the speech endpoint is unchanged. Layout, typeset, animate and polish skills. Hero state: centered composer with 2-3 example prompt chips and no right pane when the studio has zero generations after load.",
     "spec": "R18, R28, R90",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R90: matches mockup except the script surface is capped at about 300 px with internal scroll so the voice strip is fully visible above the Generate bar at 1440x900.",
      "AC2: R85: the action row is one line with nowrap labels at 1440.",
      "AC3: The request payload (voice id, text, tags) is identical to before (R76).",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 955,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#controls",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--controls--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#cue-menu",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "cue-menu",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--cue-menu--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--cue-menu--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--cue-menu--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--cue-menu--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#default",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--default--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/speech-studio.motion.md",
        "ids": [
         "M22",
         "M23",
         "M24"
        ]
       }
      ]
     }
    },
    {
     "id": "T3.10",
     "title": "Speech page on the frame and picker details (S3.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T3.9",
      "T2.5",
      "T2.6",
      "T2.11"
     ],
     "files": [
      "apps/web/src/pages/Speech.vue",
      "apps/web/src/components/Speech/VoiceSelect.vue",
      "apps/web/src/components/Speech/SpeechModelSelect.vue",
      "apps/web/src/components/Studio/MediaModelDetails.vue"
     ],
     "gherkin": null,
     "do": "Rebuild pages/Speech.vue on StudioFrame with the Library pane (preset speech, compact), delete VoiceSelect.vue and SpeechModelSelect.vue and their tests, and make the speech model picker details pane list the model's voices as mini voice cards plus the live cost for the current script. Hero state: centered composer with 2-3 example prompt chips and no right pane when the studio has zero generations after load.",
     "spec": "R4, R5, R9, R74, R84, R85, R86, R87, R88, R91, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R91: matches mockup #model-picker except the \"Use model\" button stays on one line (nowrap, min-width) at 1440 and 375, and the details pane holds the voices the model offers as mini voice cards and the live script cost with no dead band taller than 24 px.",
      "AC2: R84: the player title equals the aria-current row title in #default and #audition.",
      "AC3: R87: 375 sticky bar present above the player, Generate inside the viewport, light and dark.",
      "AC4: R88: #error shows \"No credits were used.\".",
      "AC5: R98: identical sleeve across row, detail and player.",
      "AC6: VoiceSelect.vue and SpeechModelSelect.vue are deleted with no remaining imports.",
      "AC7: R85: the Speech action row stays on one line at 1440 with nowrap labels, and the composer height and Generate geometry differ by 0 px between idle and #generating with the label unchanged.",
      "AC8: R86: the speech model picker modal is sized to its content (no empty band over 24 px in either pane) and every provider mark is a ProviderIcon, never a letter monogram.",
      "AC9: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC10: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC11: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 978,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#empty",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#loading",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#generating",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--generating--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#success",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--success--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#error",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/speech-studio.html#model-picker",
        "path": "agent_docs/media-studio-redesign/design/speech-studio.html",
        "screen": "speech-studio",
        "state": "model-picker",
        "href": "../../agent_docs/media-studio-redesign/design/speech-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--model-picker--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--model-picker--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--model-picker--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/speech-studio--model-picker--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/speech-studio.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3",
         "M4",
         "M5",
         "M6",
         "M7",
         "M8",
         "M9",
         "M10",
         "M11",
         "M12",
         "M13",
         "M14",
         "M15",
         "M16",
         "M17"
        ]
       }
      ]
     }
    },
    {
     "id": "T3.11",
     "title": "Unit: Music studio parts",
     "done": false,
     "kind": "unit",
     "depends": [
      "T3.2"
     ],
     "files": [
      "apps/web/src/components/Music/MoodGenreChips.vue",
      "apps/web/src/components/Music/MusicComposer.vue",
      "apps/web/src/components/Music/DurationControl.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Music/MoodGenreChips.test.ts src/components/Music/MusicComposer.test.ts src/components/Music/DurationControl.test.ts --coverage --coverage.include=src/components/Music/MoodGenreChips.vue --coverage.include=src/components/Music/MusicComposer.vue --coverage.include=src/components/Music/DurationControl.vue --coverage.reporter=text`"
     ],
     "line": 1006,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.12",
     "title": "Unit: lyrics sections",
     "done": false,
     "kind": "unit",
     "depends": [
      "T3.3"
     ],
     "files": [
      "apps/web/src/composables/useLyricsSections.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/composables/useLyricsSections.test.ts --coverage --coverage.include=src/composables/useLyricsSections.ts --coverage.reporter=text`"
     ],
     "line": 1020,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.13",
     "title": "Unit: Song studio parts",
     "done": false,
     "kind": "unit",
     "depends": [
      "T3.6"
     ],
     "files": [
      "apps/web/src/components/Song/StructureStrip.vue",
      "apps/web/src/components/Song/StylesPanel.vue",
      "apps/web/src/components/Song/LyricsEditor.vue",
      "apps/web/src/components/Song/songPresets.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Song/StructureStrip.test.ts src/components/Song/StylesPanel.test.ts src/components/Song/LyricsEditor.test.ts src/components/Song/songPresets.test.ts --coverage --coverage.include=src/components/Song/StructureStrip.vue --coverage.include=src/components/Song/StylesPanel.vue --coverage.include=src/components/Song/LyricsEditor.vue --coverage.include=src/components/Song/songPresets.ts --coverage.reporter=text`"
     ],
     "line": 1034,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.14",
     "title": "Unit: voice manifest and traits",
     "done": false,
     "kind": "unit",
     "depends": [
      "T3.7"
     ],
     "files": [
      "apps/web/src/utils/voiceSamples.ts",
      "apps/web/src/utils/voiceTraits.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/utils/voiceSamples.test.ts src/utils/voiceTraits.test.ts --coverage --coverage.include=src/utils/voiceSamples.ts --coverage.include=src/utils/voiceTraits.ts --coverage.reporter=text`"
     ],
     "line": 1048,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.15",
     "title": "Unit: Speech studio parts",
     "done": false,
     "kind": "unit",
     "depends": [
      "T3.10"
     ],
     "files": [
      "apps/web/src/components/Speech/VoiceCard.vue",
      "apps/web/src/components/Speech/VoiceStrip.vue",
      "apps/web/src/components/Speech/SpeechComposer.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Speech/VoiceCard.test.ts src/components/Speech/VoiceStrip.test.ts src/components/Speech/SpeechComposer.test.ts --coverage --coverage.include=src/components/Speech/VoiceCard.vue --coverage.include=src/components/Speech/VoiceStrip.vue --coverage.include=src/components/Speech/SpeechComposer.vue --coverage.reporter=text`"
     ],
     "line": 1062,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.16",
     "title": "E2E: Music studio, frame and persistent player",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T3.11"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-music.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-music.spec.ts`, R1, R3, R5, R6, R7, R10, R12, R14, R16, R17, R84, R85, R87, R88, R92",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with the e2e user fake client and the guard reporting zero un-intercepted paid calls.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-music.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1076,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.17",
     "title": "E2E: Song studio lyrics and structure",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T3.13"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-song.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-song.spec.ts`, R24, R25, R26, R73, R89",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass; the structure-strip assertion measures token rects inside the 520 px column.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-song.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1092,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.18",
     "title": "E2E: Speech studio voices and audition",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T3.15",
      "T3.14"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-speech.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-speech.spec.ts`, R28, R29, R29a, R29b, R90, R91",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The manifest is stubbed and /voice-samples/* is intercepted with a tiny fixture clip; no real clips are required.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-speech.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1108,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T3.19",
     "title": "Gate: P3 audio studios",
     "done": false,
     "kind": "gate",
     "depends": [
      "T3.16",
      "T3.17",
      "T3.18",
      "T3.12"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint, full unit suites and the three redesign QA specs pass.",
      "AC2: Music to Song to Speech navigation keeps a playing track playing with one audio element.",
      "AC3: design-qa (MODE PHASE) PASS for Music, Song and Speech against their mockups."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `cd apps/web && bunx playwright test e2e/qa/redesign-music.spec.ts e2e/qa/redesign-song.spec.ts e2e/qa/redesign-speech.spec.ts --repeat-each=2 --workers=1`"
     ],
     "line": 1124,
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
   "total": 19,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
  },
  {
   "id": "4",
   "name": "Video studio",
   "startLine": 1140,
   "endLine": 1263,
   "adds": "Redesigns Video around one large preview stage with a strip of takes underneath, a prompt-first composer with settings pills and the Try cheap first switch.",
   "tryInUi": [
    "Open /video at 1440 and 375",
    "Start a mocked text-to-video job and watch the progress inside the stage",
    "Switch between Text, Image and Audio inputs."
   ],
   "checkpoint": {
    "title": "Checkpoint 4",
    "line": 1262,
    "items": [
     "Video uses the shared frame at the same 520 px composer width and the stage plays results."
    ]
   },
   "tasks": [
    {
     "id": "T4.1",
     "title": "Video stage and reel strip (S4.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.15",
      "T2.5"
     ],
     "files": [
      "apps/web/src/components/Video/VideoStage.vue",
      "apps/web/src/components/Video/ReelStrip.vue",
      "apps/web/src/components/Video/VideoResult.vue"
     ],
     "gherkin": null,
     "do": "Build the big preview stage (16:9 or the asset aspect ratio, poster, native controls styled to tokens, no autoplay on load) with JobProgress stages inside the stage cross-fading to the result and the takes as a thumbnail reel strip below (selected one highlighted). Starting a video pauses the player and starting audio pauses the video. Layout, animate and polish skills.",
     "spec": "R14, R31, R32, R85",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Matches mockup except R85: during generating the stage and composer geometry delta is 0 px and the label stays \"Generate\".",
      "AC2: Starting a video pauses the audio player and starting audio pauses the video.",
      "AC3: The poster cross-fades into the playing video; videos keep their real poster.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1145,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#success",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--success--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#generating",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--generating--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/video-studio.motion.md",
        "ids": [
         "M15",
         "M16",
         "M17",
         "M18",
         "M19",
         "M20"
        ]
       }
      ]
     }
    },
    {
     "id": "T4.2",
     "title": "Video composer pills and draft toggle (S4.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.12",
      "T0.15"
     ],
     "files": [
      "apps/web/src/components/Video/VideoComposer.vue",
      "apps/web/src/components/Video/VideoSettings.vue",
      "apps/web/src/components/Video/DraftToggle.vue",
      "apps/web/src/components/Video/ImageInput.vue"
     ],
     "gherkin": null,
     "do": "Prompt-first composer with Text, Image and Audio input tabs (existing input components and upload edge states unchanged), pills for model, resolution, duration and aspect (VideoSettings controls become popovers), and the DraftToggle \"Try cheap first\" showing saved credits. Layout, animate, micro-interactions and polish skills. Hero state: centered composer with 2-3 example prompt chips and no right pane when the studio has zero generations after load.",
     "spec": "R18, R31, R85, R92",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R92: matches mockup except the Video composer column measures 520 px at 1440, identical to Music, Song, Speech and the frame.",
      "AC2: R85: the action row stays on one line at 1440 with nowrap labels and min-width pills and Generate.",
      "AC3: The video request payload and validation messages are unchanged (R76).",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1169,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#default",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#image-input",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "image-input",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--image-input--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--image-input--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--image-input--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--image-input--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#settings-popover",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "settings-popover",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--settings-popover--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--settings-popover--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--settings-popover--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--settings-popover--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#controls",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--controls--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/video-studio.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3",
         "M4",
         "M12",
         "M13",
         "M14"
        ]
       }
      ]
     }
    },
    {
     "id": "T4.3",
     "title": "Video page on the frame (S4.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T4.1",
      "T4.2",
      "T2.5",
      "T2.11"
     ],
     "files": [
      "apps/web/src/pages/Video.vue"
     ],
     "gherkin": null,
     "do": "Rebuild pages/Video.vue on StudioFrame: the right pane leads with the stage then the Library list for the video preset with the selected take highlighted; the hero is the centered composer when there are zero videos.",
     "spec": "R4, R5, R9, R74, R85, R86, R87, R88, R92, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R92: the composer column is 520 px at 1440 and the frame does not shift when switching from Music to Video.",
      "AC2: R85: #generating composer height and button geometry delta is 0 px with an unchanged label.",
      "AC3: R86: the picker has no empty band over 24 px and uses ProviderIcon marks.",
      "AC4: R87: 375 sticky bar above the player with Generate in the viewport, light and dark.",
      "AC5: R88: #error shows \"No credits were used.\".",
      "AC6: R98: posters stay the real poster or thumbnail in rows and stage.",
      "AC7: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC8: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC9: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1192,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#empty",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#loading",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#error",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/video-studio.html#model-picker",
        "path": "agent_docs/media-studio-redesign/design/video-studio.html",
        "screen": "video-studio",
        "state": "model-picker",
        "href": "../../agent_docs/media-studio-redesign/design/video-studio.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--model-picker--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--model-picker--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--model-picker--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/video-studio--model-picker--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/video-studio.motion.md",
        "ids": [
         "M5",
         "M6",
         "M7",
         "M8",
         "M9",
         "M10",
         "M11"
        ]
       }
      ]
     }
    },
    {
     "id": "T4.4",
     "title": "Unit: Video studio parts",
     "done": false,
     "kind": "unit",
     "depends": [
      "T4.3"
     ],
     "files": [
      "apps/web/src/components/Video/VideoStage.vue",
      "apps/web/src/components/Video/ReelStrip.vue",
      "apps/web/src/components/Video/VideoResult.vue",
      "apps/web/src/components/Video/DraftToggle.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Video/VideoStage.test.ts src/components/Video/ReelStrip.test.ts src/components/Video/VideoResult.test.ts src/components/Video/DraftToggle.test.ts --coverage --coverage.include=src/components/Video/VideoStage.vue --coverage.include=src/components/Video/ReelStrip.vue --coverage.include=src/components/Video/VideoResult.vue --coverage.include=src/components/Video/DraftToggle.vue --coverage.reporter=text`"
     ],
     "line": 1218,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T4.5",
     "title": "E2E: Video studio stage",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T4.4"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-video.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-video.spec.ts`, R14, R31, R32, R92",
     "filesDeclared": true,
     "acceptance": [
      "AC1: All scenarios pass with the video generate POST intercepted by the stub.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-video.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1232,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T4.6",
     "title": "Gate: P4 video studio",
     "done": false,
     "kind": "gate",
     "depends": [
      "T4.5"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint and the full unit suites pass.",
      "AC2: No regression in image generation, History or earlier phases.",
      "AC3: design-qa (MODE PHASE) reports PASS for every video-studio.html state at 1440 and 375 in light and dark, including R85, R86, R87, R88, R92 and R98."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `cd apps/web && bunx playwright test e2e/qa/redesign-video.spec.ts --repeat-each=2 --workers=1`"
     ],
     "line": 1248,
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
   "total": 6,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
  },
  {
   "id": "5",
   "name": "Tools",
   "startLine": 1264,
   "endLine": 1634,
   "adds": "Redesigns the four tools as stage-first screens: Image watermark with drag-to-place, Video watermark as an honest proof strip, Autocaption with a seekable transcript, and Sketch with draw or upload and a before/after slider. Settings move into a bottom sheet at 375.",
   "tryInUi": [
    "Open each of the four tool pages at 1440 and 375",
    "Upload a sample file and run a mocked job",
    "At 375 tap the Settings pill and see the bottom sheet."
   ],
   "checkpoint": {
    "title": "Checkpoint 5",
    "line": 1633,
    "items": [
     "the four tools are pairwise distinct at 1440 and the dashed placeholder is gone from pages and tools."
    ]
   },
   "tasks": [
    {
     "id": "T5.1",
     "title": "Add sheetIn motion rows to the four tool motion specs (R95, R96)",
     "done": false,
     "kind": "implementation",
     "depends": [],
     "files": [
      "agent_docs/media-studio-redesign/design/tool-image-watermark.motion.md",
      "agent_docs/media-studio-redesign/design/tool-video-watermark.motion.md",
      "agent_docs/media-studio-redesign/design/tool-autocaption.motion.md",
      "agent_docs/media-studio-redesign/design/tool-sketch.motion.md"
     ],
     "gherkin": null,
     "do": "Append one new row to each tool motion spec for the 375 settings bottom sheet: id M20 in tool-image-watermark (after M19), M16 in tool-video-watermark (after M15), M17 in tool-autocaption (after M16), M20 in tool-sketch (after M19). Element \"Settings bottom sheet\", trigger open and close, property transform translateY from 100% to none plus opacity on the scrim, 380ms open and 260ms close, ease cubic-bezier(0.16,1,0.3,1), reduced-motion fallback opacity only 150ms. Name it sheetIn in the element cell. The mockup HTML is not edited; the sheet state is built from the requirement (R95, R96).",
     "spec": "R95, R96",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Each of the four files has exactly one new row with the id given above and the sheetIn name and reduced-motion fallback.",
      "AC2: No existing row is changed: the M-row count goes from 19 to 20 (image watermark), 15 to 16 (video watermark), 16 to 17 (autocaption) and 19 to 20 (sketch), and rows M1 to the previous last id are byte-identical to before."
     ],
     "verify": [
      "V1: `grep -c '^| *M[0-9]' agent_docs/media-studio-redesign/design/tool-image-watermark.motion.md agent_docs/media-studio-redesign/design/tool-video-watermark.motion.md agent_docs/media-studio-redesign/design/tool-autocaption.motion.md agent_docs/media-studio-redesign/design/tool-sketch.motion.md`",
      "V2: `grep -n 'M20.*sheetIn' agent_docs/media-studio-redesign/design/tool-image-watermark.motion.md agent_docs/media-studio-redesign/design/tool-sketch.motion.md && grep -n 'M16.*sheetIn' agent_docs/media-studio-redesign/design/tool-video-watermark.motion.md && grep -n 'M17.*sheetIn' agent_docs/media-studio-redesign/design/tool-autocaption.motion.md`"
     ],
     "line": 1269,
     "ui": false,
     "status": "ready",
     "updatedAt": null,
     "verifierRouted": false,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [
      {
       "name": "code",
       "model": "haiku"
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
     "title": "ToolStage scaffold, settings sheet and result panel (S5.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T0.15",
      "T2.5",
      "T5.1"
     ],
     "files": [
      "apps/web/src/components/Tools/ToolStage.vue",
      "apps/web/src/components/Tools/ToolSettingsSheet.vue",
      "apps/web/src/components/Tools/BeforeAfter.vue",
      "apps/web/src/components/Tools/ToolResultPanel.vue"
     ],
     "gherkin": null,
     "do": "Build the shared tool stage scaffold: drop stage, cross-fading state host, pill/inspector bar, and a ToolSettingsSheet bottom sheet (grab handle, rise from the sheetIn row added by the previous motion task) used below 1024 px; BeforeAfter is the shared draggable divider (keyboard operable) reused by Image watermark and Sketch. ToolResultPanel stops importing StudioEmptyState and shows the Library pane filtered by the tool's feature (verify first whether the watermark outputs are media assets with feature watermark_image or image records and filter client-side if needed). Tool outputs are saved as before and appear under Images or Videos in the Library. Layout, animate and polish skills.",
     "spec": "R2, R33, R38, R74, R88, R95",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Matches mockup except R95: the shared sheet at 375 has a grab handle and the sheetIn rise (opacity-only under reduced motion) and no inline inspector renders.",
      "AC2: R88: the stage error state renders \"No credits were used.\" via StudioErrorState.",
      "AC3: ToolResultPanel no longer imports StudioEmptyState and shows no dashed box.",
      "AC4: BeforeAfter divider moves with arrow keys and tracks the pointer directly (not tweened).",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1285,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-image-watermark.html#empty",
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "screen": "tool-image-watermark",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-image-watermark.html#loading",
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "screen": "tool-image-watermark",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-image-watermark.html#controls",
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "screen": "tool-image-watermark",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--controls--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-image-watermark.html#generating",
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "screen": "tool-image-watermark",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--generating--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3",
         "M6",
         "M7",
         "M8",
         "M9",
         "M10"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.3",
     "title": "Image watermark stage and anchor grid (S5.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.2"
     ],
     "files": [
      "apps/web/src/components/Tools/WatermarkStage.vue",
      "apps/web/src/components/Tools/AnchorGrid.vue",
      "apps/web/src/components/Tools/WatermarkForm.vue"
     ],
     "gherkin": null,
     "do": "The photo is the stage; the watermark previews live on it following text, size and opacity, drag-to-place snaps to a nine-point anchor grid with fading guides, and a before/after toggle with a divider. WatermarkForm is replaced by a thin pill/inspector strip. File validation copy and limits from ToolFileInput are unchanged. Layout, animate, micro-interactions and polish skills.",
     "spec": "R33, R35",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The live preview follows the controls in the same frame; dropping near an anchor snaps to it.",
      "AC2: The before/after divider is keyboard operable.",
      "AC3: The watermark request payload is unchanged (R76).",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1310,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-image-watermark.html#default",
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "screen": "tool-image-watermark",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-image-watermark.html#dragging",
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "screen": "tool-image-watermark",
        "state": "dragging",
        "href": "../../agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--dragging--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--dragging--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--dragging--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--dragging--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.motion.md",
        "ids": [
         "M4",
         "M13",
         "M14",
         "M15",
         "M16",
         "M17",
         "M18",
         "M19"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.4",
     "title": "Image watermark page and 375 settings sheet (S5.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.3"
     ],
     "files": [
      "apps/web/src/pages/ToolImageWatermark.vue",
      "apps/web/src/components/Tools/ToolFileInput.vue"
     ],
     "gherkin": null,
     "do": "Assemble the page on the frame: hero is the upload drop stage with the pills attached. At 375: a compact pill bar under the stage with a Text pill, a Position pill and the Watermark action with its cost, plus a Settings pill that opens the bottom sheet (sheetIn row from the earlier motion task); the text field, 9-point anchor grid and sliders are not rendered inline. Build the #settings-sheet 375 state for light and dark.",
     "spec": "R5, R33, R35, R38, R88, R95",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R95: matches mockup except below 1024 px the page shows the pill bar (Text pill, Position pill, Watermark action with cost) and a Settings pill that opens a bottom sheet with grab handle and the sheetIn rise; the text field, anchor grid and sliders are not rendered inline; the #settings-sheet 375 state exists in light and dark.",
      "AC2: R88: #error shows \"No credits were used.\".",
      "AC3: The output appears in the pane filtered by feature and in Library under Images.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1334,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-image-watermark.html#success",
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "screen": "tool-image-watermark",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--success--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-image-watermark.html#error",
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "screen": "tool-image-watermark",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/tool-image-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-image-watermark--error--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-image-watermark.motion.md",
        "ids": [
         "M5",
         "M11",
         "M12"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.5",
     "title": "Video watermark filmstrip and size ruler (S5.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.2"
     ],
     "files": [
      "apps/web/src/components/Tools/WatermarkFilmstrip.vue",
      "apps/web/src/components/Tools/SizeRuler.vue",
      "apps/web/src/components/Tools/VideoWatermarkForm.vue"
     ],
     "gherkin": null,
     "do": "An honest proof, not a placement tool: the mark is drawn on a video frame at its fixed corner with crop marks labelled \"Fixed by this tool\", a filmstrip of 4-5 sampled frames (client-side video seeks, no server call) shows the mark at its true placement and scale, and a size ruler shows the mark at true relative scale against the output resolution. Inputs are text and size only (VideoWatermarkRequestSchema unchanged). Uses a different sample clip from Autocaption. Layout, typeset and polish skills.",
     "spec": "R36, R93, R94",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R93: matches mockup except the layout is its own (mark directly on the frame, corner crop marks labelled \"Fixed by this tool\", a filmstrip of 4-5 frames under the stage, a size ruler) with a different sample clip from Autocaption, and it renders no draggable position, corner grid or opacity control.",
      "AC2: R94: in #default and #success at 1440 light and dark the preview box intersects no scrubber, time label or fullscreen icon (overlay controls hidden at rest or transport below the frame); a test asserts no rect overlap.",
      "AC3: In #success the filmstrip stays as an after strip.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1357,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-video-watermark.html#default",
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "screen": "tool-video-watermark",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-video-watermark.html#success",
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "screen": "tool-video-watermark",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--success--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.motion.md",
        "ids": [
         "M13",
         "M14",
         "M15"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.6",
     "title": "Video watermark page and 375 settings sheet (S5.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.5"
     ],
     "files": [
      "apps/web/src/pages/ToolVideoWatermark.vue"
     ],
     "gherkin": null,
     "do": "Assemble the page on the frame with the upload drop stage as hero. At 375 the compact pill bar (text pill, size pill and the action with its cost) plus a Settings pill opening the bottom sheet; no inline inspector; #settings-sheet 375 state in light and dark.",
     "spec": "R5, R33, R36, R38, R88, R95",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R95: matches mockup except at 375 the page shows the pill bar and a Settings pill that opens the bottom sheet with grab handle and sheetIn rise and renders no inline inspector; #settings-sheet exists in light and dark.",
      "AC2: R88: #error shows \"No credits were used.\".",
      "AC3: R93: Autocaption's layout is not reused.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1381,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-video-watermark.html#empty",
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "screen": "tool-video-watermark",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-video-watermark.html#loading",
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "screen": "tool-video-watermark",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-video-watermark.html#generating",
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "screen": "tool-video-watermark",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--generating--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-video-watermark.html#error",
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "screen": "tool-video-watermark",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-video-watermark.html#controls",
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "screen": "tool-video-watermark",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/tool-video-watermark.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-video-watermark--controls--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-video-watermark.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3",
         "M4",
         "M5",
         "M6",
         "M7",
         "M8",
         "M9",
         "M10",
         "M11",
         "M12"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.7",
     "title": "Autocaption overlay and transcript (S5.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.2"
     ],
     "files": [
      "apps/web/src/components/Tools/CaptionOverlay.vue",
      "apps/web/src/components/Tools/TranscriptList.vue",
      "apps/web/src/components/Tools/CaptionResult.vue"
     ],
     "gherkin": null,
     "do": "Captions burned into the frame with the spoken word highlighted, and a timestamped transcript beside the video where each line seeks the video and the current line lights up (cheap sync to currentTime). Caption style options are limited to what the tool supports. CaptionResult keeps transcript and download. Layout, animate and polish skills.",
     "spec": "R37",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Clicking a transcript line seeks the video to its timestamp and the current line is marked by shape and label, not colour alone.",
      "AC2: The result plays in the stage with the burned-in captions.",
      "AC3: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC4: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC5: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1404,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-autocaption.html#default",
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "screen": "tool-autocaption",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-autocaption.html#success",
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "screen": "tool-autocaption",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--success--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.motion.md",
        "ids": [
         "M13",
         "M14",
         "M15",
         "M16"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.8",
     "title": "Autocaption page and 375 settings sheet (S5.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.7"
     ],
     "files": [
      "apps/web/src/pages/ToolAutocaption.vue"
     ],
     "gherkin": null,
     "do": "Assemble the page on the frame. At 375 the compact pill bar (caption style pill, language pill and the action with its cost) plus a Settings pill opening the bottom sheet for caption style and language; no inline inspector; #settings-sheet 375 state in light and dark. The layout stays distinct from Video watermark (R93).",
     "spec": "R5, R33, R37, R38, R88, R95",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R95: matches mockup except at 375 caption style and language live in the bottom sheet (grab handle, sheetIn rise) and not inline; #settings-sheet exists in light and dark.",
      "AC2: R88: #error shows \"No credits were used.\".",
      "AC3: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC4: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC5: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1427,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-autocaption.html#empty",
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "screen": "tool-autocaption",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-autocaption.html#loading",
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "screen": "tool-autocaption",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-autocaption.html#generating",
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "screen": "tool-autocaption",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--generating--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-autocaption.html#error",
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "screen": "tool-autocaption",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-autocaption.html#controls",
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "screen": "tool-autocaption",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/tool-autocaption.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-autocaption--controls--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-autocaption.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3",
         "M4",
         "M5",
         "M6",
         "M7",
         "M8",
         "M9",
         "M10",
         "M11",
         "M12"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.9",
     "title": "Sketch upload mode and downscale logic (S5.4)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T2.3"
     ],
     "files": [
      "apps/web/src/utils/downscaleImage.ts",
      "apps/web/src/composables/useSketchInput.ts"
     ],
     "gherkin": null,
     "do": "downscaleImage fits an image within SKETCH_CANVAS_SIZE keeping aspect ratio and letterboxing to the sketch aspect, rejecting with \"Couldn't read this image\" when decode fails. useSketchInput keeps both inputs (canvas strokes and uploaded file) across Draw/Upload switching, Generate uses the active mode's input and is disabled when it is empty, Clear affects the canvas only and Remove the file only, one file only (a second drop replaces the first), type and size validation reuses the existing upload rule (jpeg, png, webp, MAX_IMAGE_BYTES) and existing copy before upload, previous input stays on rejection.",
     "spec": "R34, R34a, R34b",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Switching modes keeps both inputs; Clear and Remove each affect only their own mode.",
      "AC2: GIF and over-limit files are rejected with the existing copy and the previous input stays; a 6000 px image is downscaled to at most SKETCH_CANVAS_SIZE.",
      "AC3: Generate sends the uploaded File to the Create reference-image path in Upload mode and the canvas PNG in Draw mode."
     ],
     "verify": [
      "V1: `bun run check`"
     ],
     "line": 1449,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.10",
     "title": "Sketch upload, tool rail and divider (S5.4)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.9",
      "T5.2"
     ],
     "files": [
      "apps/web/src/components/Tools/SketchUpload.vue",
      "apps/web/src/components/Tools/SketchToolbar.vue",
      "apps/web/src/components/Tools/SketchCanvas.vue"
     ],
     "gherkin": null,
     "do": "A dotted paper canvas as the hero, a floating vertical tool rail (brush, eraser, size, undo/redo, clear), a Draw/Upload segmented control, an upload drop area with a file chip and Remove, and the draggable before/after divider comparing sketch (or uploaded image) with the result. Layout, animate, micro-interactions and polish skills.",
     "spec": "R34, R34a, R34b",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The uploaded image shows in the stage and as the before side; \"Couldn't read this image\" shows on a decode failure.",
      "AC2: The divider tracks the pointer directly and is keyboard operable.",
      "AC3: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC4: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC5: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1467,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-sketch.html#default",
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.html",
        "screen": "tool-sketch",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/tool-sketch.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-sketch.html#upload",
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.html",
        "screen": "tool-sketch",
        "state": "upload",
        "href": "../../agent_docs/media-studio-redesign/design/tool-sketch.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--upload--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--upload--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--upload--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--upload--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-sketch.html#success",
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.html",
        "screen": "tool-sketch",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/tool-sketch.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--success--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.motion.md",
        "ids": [
         "M13",
         "M14",
         "M15",
         "M16",
         "M17",
         "M18",
         "M19"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.11",
     "title": "Sketch page, pill bar and 375 sheet (S5.4)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.10",
      "T2.5",
      "T5.2"
     ],
     "files": [
      "apps/web/src/pages/ToolSketchToImage.vue"
     ],
     "gherkin": null,
     "do": "Assemble the page: the empty canvas is the hero with a one-line pill prompt bar; the right pane lists recent images with this session's sketch results first (kept in memory, no schema change). Results are ordinary image records. At 375 Generate and the style pill form a sticky pill bar above the player offset; style options and strength live in a bottom sheet (sheetIn row) with a #settings-sheet 375 state in light and dark; the tool rail is not an inline block under the canvas.",
     "spec": "R5, R33, R34, R34a, R38, R87, R88, R96",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R96: matches mockup except below 1024 px Generate and the style pill form a sticky pill bar (R87 offset), style and strength are in a bottom sheet with #settings-sheet in light and dark, and the tool rail is not an inline block under the canvas.",
      "AC2: R88: #error shows \"No credits were used.\".",
      "AC3: Sketch no longer imports StudioEmptyState and shows no dashed placeholder.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1490,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-sketch.html#empty",
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.html",
        "screen": "tool-sketch",
        "state": "empty",
        "href": "../../agent_docs/media-studio-redesign/design/tool-sketch.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--empty--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--empty--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--empty--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--empty--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-sketch.html#loading",
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.html",
        "screen": "tool-sketch",
        "state": "loading",
        "href": "../../agent_docs/media-studio-redesign/design/tool-sketch.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--loading--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--loading--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--loading--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--loading--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-sketch.html#generating",
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.html",
        "screen": "tool-sketch",
        "state": "generating",
        "href": "../../agent_docs/media-studio-redesign/design/tool-sketch.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--generating--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--generating--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--generating--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--generating--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-sketch.html#error",
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.html",
        "screen": "tool-sketch",
        "state": "error",
        "href": "../../agent_docs/media-studio-redesign/design/tool-sketch.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--error--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--error--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--error--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--error--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/tool-sketch.html#controls",
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.html",
        "screen": "tool-sketch",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/tool-sketch.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/tool-sketch--controls--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/tool-sketch.motion.md",
        "ids": [
         "M1",
         "M2",
         "M3",
         "M4",
         "M5",
         "M6",
         "M7",
         "M8",
         "M9",
         "M10",
         "M11",
         "M12"
        ]
       }
      ]
     }
    },
    {
     "id": "T5.12",
     "title": "Unit: sketch input and downscale",
     "done": false,
     "kind": "unit",
     "depends": [
      "T5.9"
     ],
     "files": [
      "apps/web/src/utils/downscaleImage.ts",
      "apps/web/src/composables/useSketchInput.ts"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/utils/downscaleImage.test.ts src/composables/useSketchInput.test.ts --coverage --coverage.include=src/utils/downscaleImage.ts --coverage.include=src/composables/useSketchInput.ts --coverage.reporter=text`"
     ],
     "line": 1513,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.13",
     "title": "Unit: tool components",
     "done": false,
     "kind": "unit",
     "depends": [
      "T5.4",
      "T5.6"
     ],
     "files": [
      "apps/web/src/components/Tools/ToolStage.vue",
      "apps/web/src/components/Tools/BeforeAfter.vue",
      "apps/web/src/components/Tools/AnchorGrid.vue",
      "apps/web/src/components/Tools/WatermarkFilmstrip.vue",
      "apps/web/src/components/Tools/SizeRuler.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Tools/ToolStage.test.ts src/components/Tools/BeforeAfter.test.ts src/components/Tools/AnchorGrid.test.ts src/components/Tools/WatermarkFilmstrip.test.ts src/components/Tools/SizeRuler.test.ts --coverage --coverage.include=src/components/Tools/ToolStage.vue --coverage.include=src/components/Tools/BeforeAfter.vue --coverage.include=src/components/Tools/AnchorGrid.vue --coverage.include=src/components/Tools/WatermarkFilmstrip.vue --coverage.include=src/components/Tools/SizeRuler.vue --coverage.reporter=text`"
     ],
     "line": 1527,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.14",
     "title": "Unit: caption and sketch components",
     "done": false,
     "kind": "unit",
     "depends": [
      "T5.8",
      "T5.11",
      "T5.4"
     ],
     "files": [
      "apps/web/src/components/Tools/TranscriptList.vue",
      "apps/web/src/components/Tools/CaptionOverlay.vue",
      "apps/web/src/components/Tools/SketchUpload.vue",
      "apps/web/src/components/Tools/WatermarkStage.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Tools/TranscriptList.test.ts src/components/Tools/CaptionOverlay.test.ts src/components/Tools/SketchUpload.test.ts src/components/Tools/WatermarkStage.test.ts --coverage --coverage.include=src/components/Tools/TranscriptList.vue --coverage.include=src/components/Tools/CaptionOverlay.vue --coverage.include=src/components/Tools/SketchUpload.vue --coverage.include=src/components/Tools/WatermarkStage.vue --coverage.reporter=text`"
     ],
     "line": 1541,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.15",
     "title": "E2E: Image watermark",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T5.13"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-tool-image-watermark.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-tool-image-watermark.spec.ts`, R35, R38, R95",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The tools generate POST is intercepted by the stub.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-tool-image-watermark.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1555,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.16",
     "title": "E2E: Video watermark",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T5.13"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-tool-video-watermark.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-tool-video-watermark.spec.ts`, R36, R93, R94, R95",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Overlap is asserted by comparing bounding rects in both themes.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-tool-video-watermark.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1571,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.17",
     "title": "E2E: Autocaption",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T5.14"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-tool-autocaption.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-tool-autocaption.spec.ts`, R37, R95",
     "filesDeclared": true,
     "acceptance": [
      "AC1: The generate POST is intercepted by the stub.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-tool-autocaption.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1587,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.18",
     "title": "E2E: Sketch to image",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T5.14",
      "T5.12"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-tool-sketch.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-tool-sketch.spec.ts`, R34, R34a, R34b, R96",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Generate goes through the image generate stub; paidCallGuard stays on.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-tool-sketch.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1603,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T5.19",
     "title": "Gate: P5 tools placeholder grep",
     "done": false,
     "kind": "gate",
     "depends": [
      "T5.15",
      "T5.16",
      "T5.17",
      "T5.18"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: grep -rln \"StudioPlaceholder\\|StudioEmptyState\" apps/web/src/pages apps/web/src/components/Tools returns nothing.",
      "AC2: Typecheck, lint and the four tool QA specs pass.",
      "AC3: design-qa (MODE PHASE) reports PASS for the four tool mockups at 1440 and 375 in light and dark, including R88, R93, R94, R95 and R96 and the requirement-built #settings-sheet 375 states (light and dark) of image watermark, video watermark, autocaption and sketch, and confirms the four tools are pairwise distinct in masked 1440 screenshots (success 16)."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `cd apps/web && bunx playwright test e2e/qa/redesign-tool-image-watermark.spec.ts e2e/qa/redesign-tool-video-watermark.spec.ts e2e/qa/redesign-tool-autocaption.spec.ts e2e/qa/redesign-tool-sketch.spec.ts --repeat-each=2 --workers=1`"
     ],
     "line": 1619,
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
   "total": 19,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
  },
  {
   "id": "6",
   "name": "Library (Assets becomes Library)",
   "startLine": 1635,
   "endLine": 1809,
   "adds": "Turns Assets into Library at /library: type tabs with counts, search, sort, favorites, inline rename, multi-select with bulk actions, and deep links. /assets keeps working as a redirect.",
   "tryInUi": [
    "Open /assets and confirm it lands on /library",
    "Use the tabs, search and sort and reload a deep link like /library?tab=songs&q=lofi",
    "Favorite, rename and select several items to delete."
   ],
   "checkpoint": {
    "title": "Checkpoint 6",
    "line": 1808,
    "items": [
     "the Library tab, route, deep link, favorite, rename and bulk-delete criteria pass."
    ]
   },
   "tasks": [
    {
     "id": "T6.1",
     "title": "Library route, redirect and nav label (S6.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T2.5"
     ],
     "files": [
      "apps/web/src/router/index.ts",
      "apps/web/src/utils/dashboardRoutes.ts",
      "apps/web/src/components/Header/NavTabs.vue",
      "apps/web/src/utils/dashboardRoutes.test.ts",
      "apps/web/src/components/Header/NavTabs.test.ts"
     ],
     "gherkin": null,
     "do": "Add /library (route name library, component Dashboard); /assets becomes a redirect to /library preserving query and hash. Rename the header label (ASSETS_TAB name) to \"Library\" keeping the testId stable; update APP_SURFACE, APP_SURFACE_TAB, ROUTE_TAB_BY_NAME and NAV_MENU_GROUPS and every internal link to /assets found by grep. Update tests with equal assertions.",
     "spec": "R39, R41",
     "filesDeclared": true,
     "acceptance": [
      "AC1: /assets and /assets?x=1#h redirect to /library with query and hash preserved.",
      "AC2: The header reads \"Library\" and the nav testId is unchanged.",
      "AC3: No internal link still points to /assets (grep)."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `cd apps/web && npx vitest run src/utils/dashboardRoutes.test.ts src/components/Header/NavTabs.test.ts`"
     ],
     "line": 1640,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T6.2",
     "title": "Library page shell, tabs, counts and deep links (S6.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T6.1",
      "T2.5",
      "T2.7"
     ],
     "files": [
      "apps/web/src/pages/Dashboard.vue",
      "apps/web/src/components/Library/LibraryTabs.vue",
      "apps/web/src/components/History/CollectionsStrip.vue",
      "apps/web/src/components/History/NoResults.vue"
     ],
     "gherkin": null,
     "do": "Render LibraryView full-page under type tabs All, Images, Videos, Music, Songs, Speech with counts when known (tablist/tab/tabpanel, roving tabindex, arrow keys, underline by transform and opacity), the header \"N things you made\", visuals as a masonry grid and audio as a track list grouped by date. CollectionsStrip only on All and Images. Visible \"Assets\" strings become \"Library\" (page title, empty and error copy). Layout, typeset and polish skills.",
     "spec": "R39, R40, R42, R50, R52, R53, R84, R97, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: R97: matches mockup except a tab whose list is empty (Songs #empty) shows no count or a quiet muted zero, never a stale number, and the header total equals the sum of the tab counts shown at 1440 and 375 in light and dark.",
      "AC2: R84: the player equals the aria-current row in the Library state.",
      "AC3: R98: the same fixture track shows the identical sleeve as in its studio pane.",
      "AC4: Deep links restore tab, search and sort and an unknown tab shows All with no console error.",
      "AC5: Collections UI appears only on All and Images.",
      "AC6: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC7: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC8: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1658,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#default",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "default",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--default--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#songs",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "songs",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--songs--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--songs--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--songs--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--songs--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#images",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "images",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--images--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#success",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "success",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--success--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--success--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--success--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--success--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M1",
         "M3"
        ]
       }
      ]
     }
    },
    {
     "id": "T6.3",
     "title": "Search, sort, favorite and inline rename (S6.2)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T6.2"
     ],
     "files": [
      "apps/web/src/components/Library/LibrarySearch.vue",
      "apps/web/src/components/Library/SortMenu.vue",
      "apps/web/src/components/Library/FavoriteButton.vue",
      "apps/web/src/components/Library/InlineRename.vue",
      "apps/web/src/components/History/Filter.vue"
     ],
     "gherkin": null,
     "do": "Debounced search with a clear button, sort menu, heart toggle (shape plus label, not colour alone) and a Favorites filter pill, inline rename (double-click or menu; Enter or blur commits, Esc cancels, trimmed, empty rejected with an inline message, max 120). Optimistic updates with rollback toast. Live-region announcements for favorite and rename. Image items offer no rename. Layout, micro-interactions and polish skills.",
     "spec": "R43, R44, R45, R46, R57, R70",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Matches mockup #rename except an empty or whitespace title shows the inline error and nothing is saved; 121 characters is rejected.",
      "AC2: Double-click on an image title does nothing and its menu has no Rename.",
      "AC3: Favorite and rename announce through a live region; a failed save rolls back with a toast.",
      "AC4: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC5: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC6: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1684,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#controls",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "controls",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--controls--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--controls--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--controls--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--controls--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#rename",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "rename",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--rename--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--rename--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--rename--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--rename--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M10",
         "M11",
         "M18",
         "M19",
         "M21"
        ]
       }
      ]
     }
    },
    {
     "id": "T6.4",
     "title": "Multi-select, bulk bar and confirm delete (S6.3)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T6.3"
     ],
     "files": [
      "apps/web/src/components/Library/BulkBar.vue",
      "apps/web/src/components/Library/ConfirmBulkDelete.vue",
      "apps/web/src/components/History/SelectActionButtons.vue",
      "apps/web/src/components/History/ImageActionButtons.vue",
      "apps/web/src/components/Dashboard/Canvas/HistoryFullNote.vue"
     ],
     "gherkin": null,
     "do": "Select mode by checkbox, long-press or Shift-click range with a sticky action bar showing the count and bulk Download, Favorite and Delete, a confirm dialog stating the count, Esc exits and selection clears on tab change and after a bulk action; mixed selections run both delete paths and report a partial failure toast naming the failed count; deleting the loaded track closes the player; HistoryFullNote messaging kept; infinite-scroll sentinel or Load more without layout jump. Collections actions only for image-only selections; no rename for mixed selections. Layout, animate and polish skills.",
     "spec": "R47, R49, R51, R52, R70, R79, R82, R83",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Matches mockup #confirm except the dialog states the exact count and focus returns to a sensible control after delete.",
      "AC2: Bulk-deleting the loaded track closes the player; deleting another keeps playing.",
      "AC3: A partial failure toast names the failed count.",
      "AC4: Collections actions show only for an image-only selection.",
      "AC5: Matches the approved mockup states cited in Design at 1440 and 375 in light and dark, except where an R84-R98 criterion below says otherwise.",
      "AC6: Every interaction cited in Motion works, uses opacity and transform only with the shared ease token, and has a reduced-motion fallback (opacity only, 150 ms or less).",
      "AC7: Only token classes (tw- prefix) are used: no arbitrary hex or px values, no transition-all, no dashed borders, no emoji icons; every interactive element has a visible focus style that appears instantly."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run check:ui-gates`"
     ],
     "line": 1708,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "high",
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
       "name": "security",
       "model": "opus"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": [],
     "design": {
      "mockups": [
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#select",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "select",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--select--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--select--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--select--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--select--375--dark.png",
          "exists": true
         }
        ]
       },
       {
        "ref": "agent_docs/media-studio-redesign/design/library.html#confirm",
        "path": "agent_docs/media-studio-redesign/design/library.html",
        "screen": "library",
        "state": "confirm",
        "href": "../../agent_docs/media-studio-redesign/design/library.html",
        "shots": [
         {
          "variant": "1440-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--confirm--1440--light.png",
          "exists": true
         },
         {
          "variant": "375-light",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--confirm--375--light.png",
          "exists": true
         },
         {
          "variant": "1440-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--confirm--1440--dark.png",
          "exists": true
         },
         {
          "variant": "375-dark",
          "href": "../../agent_docs/media-studio-redesign/design/shots/library--confirm--375--dark.png",
          "exists": true
         }
        ]
       }
      ],
      "motion": [
       {
        "path": "agent_docs/media-studio-redesign/design/library.motion.md",
        "ids": [
         "M12",
         "M13",
         "M14",
         "M16",
         "M17"
        ]
       }
      ]
     }
    },
    {
     "id": "T6.5",
     "title": "Migrate Assets-text tests and e2e references (S6.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T6.4"
     ],
     "files": [
      "apps/web/e2e/assets.spec.ts",
      "apps/web/e2e/shell.spec.ts",
      "apps/web/src/stores/history.test.ts",
      "apps/web/src/pages/Dashboard.test.ts"
     ],
     "gherkin": null,
     "do": "Update assertions tied to the \"Assets\" text, the /assets path and the Tools chip to \"Library\", /library and the new tabs with equal or stronger strength; never delete or weaken an assertion.",
     "spec": "R77",
     "filesDeclared": true,
     "acceptance": [
      "AC1: No assertion is removed or weakened; each updated assertion still checks the same behaviour."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `cd apps/web && npx vitest run src/pages/Dashboard.test.ts src/stores/history.test.ts`"
     ],
     "line": 1733,
     "ui": false,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": false,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [
      {
       "name": "code",
       "model": "haiku"
      }
     ],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T6.6",
     "title": "Unit: Library page components",
     "done": false,
     "kind": "unit",
     "depends": [
      "T6.4"
     ],
     "files": [
      "apps/web/src/components/Library/LibraryTabs.vue",
      "apps/web/src/components/Library/InlineRename.vue",
      "apps/web/src/components/Library/BulkBar.vue",
      "apps/web/src/components/Library/FavoriteButton.vue",
      "apps/web/src/components/Library/LibrarySearch.vue",
      "apps/web/src/components/Library/SortMenu.vue",
      "apps/web/src/components/Library/ConfirmBulkDelete.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Library/LibraryTabs.test.ts src/components/Library/InlineRename.test.ts src/components/Library/BulkBar.test.ts src/components/Library/FavoriteButton.test.ts src/components/Library/LibrarySearch.test.ts src/components/Library/SortMenu.test.ts src/components/Library/ConfirmBulkDelete.test.ts --coverage --coverage.include=src/components/Library/LibraryTabs.vue --coverage.include=src/components/Library/InlineRename.vue --coverage.include=src/components/Library/BulkBar.vue --coverage.include=src/components/Library/FavoriteButton.vue --coverage.include=src/components/Library/LibrarySearch.vue --coverage.include=src/components/Library/SortMenu.vue --coverage.include=src/components/Library/ConfirmBulkDelete.vue --coverage.reporter=text`"
     ],
     "line": 1748,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T6.7",
     "title": "E2E: Library browse, deep links and redirect",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T6.6",
      "T6.5"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-library.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-library.spec.ts`, R39, R41, R42, R43, R44, R53, R97",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Counts are asserted in light and dark.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-library.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1762,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T6.8",
     "title": "E2E: Library favorites, rename and bulk delete",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T6.6",
      "T6.5"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-library-manage.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-library-manage.spec.ts`, R45, R46, R47, R49, R79, R80, R82, R83",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Bulk delete and PATCH are served by stubs; no Cloudinary or paid call is made.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-library-manage.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1778,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T6.9",
     "title": "Gate: P6 Library",
     "done": false,
     "kind": "gate",
     "depends": [
      "T6.7",
      "T6.8"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Typecheck, lint, full unit suites and the Library QA specs pass.",
      "AC2: Success criteria 4, 5, 20 and 22 pass.",
      "AC3: design-qa (MODE PHASE) reports PASS for every library.html state at 1440 and 375 in light and dark, including R84, R97 and R98."
     ],
     "verify": [
      "V1: `bun run check`",
      "V2: `bun run test`",
      "V3: `cd apps/web && bunx playwright test e2e/qa/redesign-library.spec.ts e2e/qa/redesign-library-manage.spec.ts --repeat-each=2 --workers=1`"
     ],
     "line": 1794,
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
  },
  {
   "id": "7",
   "name": "Hardening and regression",
   "startLine": 1810,
   "endLine": 1911,
   "adds": "Removes the old placeholder and shell components, proves nothing regressed, and audits motion, accessibility, responsive behaviour and every build-time correction at 1440 and 375 in light and dark.",
   "tryInUi": [
    "Run bun run check:ui-gates and bun run test",
    "Walk each of the nine screens plus Library at 375 and 1440 in both themes",
    "Confirm each error state reads \"No credits were used.\"."
   ],
   "checkpoint": {
    "title": "Checkpoint 7",
    "line": 1910,
    "items": [
     "all suites and the final design-qa pass; paidCallGuard reports zero un-intercepted paid calls."
    ]
   },
   "tasks": [
    {
     "id": "T7.1",
     "title": "Delete replaced components and run grep gates (S7.1)",
     "done": false,
     "kind": "implementation",
     "depends": [
      "T5.19",
      "T3.19",
      "T4.6",
      "T6.9"
     ],
     "files": [
      "apps/web/src/components/Studio/StudioPlaceholder.vue",
      "apps/web/src/components/Studio/StudioPlaceholder.test.ts",
      "apps/web/src/components/Studio/StudioEmptyState.vue",
      "apps/web/src/components/Studio/StudioEmptyState.test.ts",
      "apps/web/src/components/Studio/StudioShell.vue"
     ],
     "gherkin": null,
     "do": "Delete StudioPlaceholder.vue and its test, delete StudioEmptyState.vue and its test (or remove its dashed border if anything still imports it), and remove the StudioShell.vue compatibility wrapper once no screen imports it; remove stale entries from components.d.ts and any removed component tests. Final greps: no import of StudioPlaceholder or StudioEmptyState in pages or Tools, no border-dashed in studio, tool or library components, StudioShell has no importers, and the request paths and payloads of the generate endpoints, credits, job polling and handoff actions are unchanged. Never delete a test to make a suite pass.",
     "spec": "R2, R76, R77, R78",
     "filesDeclared": true,
     "acceptance": [
      "AC1: grep -rln \"StudioPlaceholder\\|StudioEmptyState\" apps/web/src/pages apps/web/src/components/Tools returns nothing and StudioPlaceholder.vue no longer exists.",
      "AC2: grep -rn \"border-dashed\" over the studio, tool and library components finds nothing.",
      "AC3: The image Create page and Explore are untouched."
     ],
     "verify": [
      "V1: `bun run verify`",
      "V2: `bun run check`",
      "V3: `bun run test`",
      "V4: `bun run check:ui-gates`"
     ],
     "line": 1815,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
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
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T7.2",
     "title": "Unit: post-cleanup regression of frame and error state",
     "done": false,
     "kind": "unit",
     "depends": [
      "T7.1"
     ],
     "files": [
      "apps/web/src/components/Studio/StudioFrame.vue",
      "apps/web/src/components/Studio/StudioErrorState.vue"
     ],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every file has at least 80% lines, branches, functions and statements coverage (target above 95%) and no it.fails is used.",
      "AC2: Tests cover each case named in the Do and Acceptance of the implementation tasks this task depends on.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost)."
     ],
     "verify": [
      "V1: `cd apps/web && npx vitest run src/components/Studio/StudioFrame.test.ts src/components/Studio/StudioErrorState.test.ts --coverage --coverage.include=src/components/Studio/StudioFrame.vue --coverage.include=src/components/Studio/StudioErrorState.vue --coverage.reporter=text`"
     ],
     "line": 1835,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T7.3",
     "title": "E2E: Motion, accessibility and responsive sweep",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T7.2"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-sweep.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-sweep.spec.ts`, R63, R64, R65, R66, R67, R68, R69, R70, R71, R72, R73, R74, R75, R76",
     "filesDeclared": true,
     "acceptance": [
      "AC1: No new dependency is added.",
      "AC2: The static ui gate script passes.",
      "AC3: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC4: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-sweep.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1849,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T7.4",
     "title": "E2E: Build-time corrections R84-R98 matrix",
     "done": false,
     "kind": "e2e",
     "depends": [
      "T7.3"
     ],
     "files": [
      "apps/web/e2e/scenarios/redesign-corrections.feature.md"
     ],
     "gherkin": null,
     "do": null,
     "spec": "`apps/web/e2e/qa/redesign-corrections.spec.ts`, R84, R85, R86, R87, R88, R89, R90, R91, R92, R93, R94, R95, R96, R97, R98",
     "filesDeclared": true,
     "acceptance": [
      "AC1: Every scenario runs at 1440 and 375 in light and dark with a measured assertion or captured screenshot; a miss fails the spec.",
      "AC2: Mock-only: Replicate, Dodo live and email are never called; every paid POST (generate audio, video, image and tools, and the lyrics prompt) is intercepted by the existing stubs, the e2e user gets the fake Replicate client, and paidCallGuard stays on and is never bypassed or narrowed. The dev server is never started (it already runs at https://visual-ai.localhost).",
      "AC3: Mock-only: the spec uses the seeded QA harness and MediaGenerationStub or GenerationStub for every paid POST itself, not only progress and result URLs."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-corrections.spec.ts --repeat-each=3 --workers=1`"
     ],
     "line": 1866,
     "ui": true,
     "status": "waiting",
     "updatedAt": null,
     "verifierRouted": true,
     "pending": [],
     "risk": "low",
     "surfaces": [],
     "reviewers": [],
     "attempts": [],
     "costUsd": null,
     "costApprox": false,
     "elapsedMs": null,
     "summary": []
    },
    {
     "id": "T7.5",
     "title": "Walkthrough: nine screens and Library",
     "done": false,
     "kind": "walkthrough",
     "depends": [
      "T7.4"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: design-qa (MODE PHASE) reports PASS for every touched screen against its approved mockup at 1440 and 375 in light and dark with zero slop-audit findings; Library and the studio panes get equal weight to the composers.",
      "AC2: The nine screens are pairwise distinguishable in masked 1440 screenshots (success 16).",
      "AC3: Edge cases R79-R83 each have a passing test."
     ],
     "verify": [
      "V1: `cd apps/web && bunx playwright test e2e/qa/redesign-music.spec.ts e2e/qa/redesign-song.spec.ts e2e/qa/redesign-speech.spec.ts e2e/qa/redesign-video.spec.ts e2e/qa/redesign-library.spec.ts e2e/qa/redesign-library-manage.spec.ts e2e/qa/redesign-corrections.spec.ts --repeat-each=2 --workers=1`"
     ],
     "line": 1882,
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
     "id": "T7.6",
     "title": "Definition of done: media-studio-redesign",
     "done": false,
     "kind": "dod",
     "depends": [
      "T7.5"
     ],
     "files": [],
     "gherkin": null,
     "do": null,
     "spec": null,
     "filesDeclared": true,
     "acceptance": [
      "AC1: All tasks above are complete and every gate passed.",
      "AC2: bun run verify and bun run check are clean and bun run test passes.",
      "AC3: paidCallGuard reported zero un-intercepted paid calls across all runs.",
      "AC4: Success criteria 1-23 hold; R1-R98 each have a covering task."
     ],
     "verify": [
      "V1: `bun run verify`",
      "V2: `bun run check`",
      "V3: `bun run test`",
      "V4: `bun run check:ui-gates`"
     ],
     "line": 1894,
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
   "total": 6,
   "complete": false,
   "costUsd": null,
   "elapsedMs": null
  }
 ],
 "current": null,
 "nextCommand": "/build-phases agent_docs/media-studio-redesign/TASKS.md phase 0",
 "questions": [
  {
   "at": "2026-11-28T11:36:35.331Z",
   "type": "question",
   "tasks": [],
   "id": "Q1",
   "text": "Unit coverage for SortMenu and ConfirmBulkDelete was folded into T6.6 (7 files, over the 5-per-task convention). Keep it there?",
   "default": "Keep in T6.6",
   "alternatives": "Split into a separate unit task T6.10; or rely on the T6.8 e2e for the confirm dialog",
   "answer": null,
   "answeredAt": null
  },
  {
   "at": "2026-11-28T11:36:35.400Z",
   "type": "question",
   "tasks": [],
   "id": "Q2",
   "text": "The new sheetIn motion rows (added in T5.1) are cited only in Do/AC text, not in Motion: fields, because they do not exist at lint time. Add them to the Motion: fields after T5.1 runs?",
   "default": "Cite in Do/AC text only",
   "alternatives": "After T5.1, add M20/M16/M17/M20 to Motion: of T5.2, T5.4, T5.6, T5.8, T5.11",
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
   "at": "2026-11-28T11:36:35.400Z",
   "type": "question",
   "tasks": [],
   "id": "Q2",
   "text": "The new sheetIn motion rows (added in T5.1) are cited only in Do/AC text, not in Motion: fields, because they do not exist at lint time. Add them to the Motion: fields after T5.1 runs?",
   "default": "Cite in Do/AC text only",
   "alternatives": "After T5.1, add M20/M16/M17/M20 to Motion: of T5.2, T5.4, T5.6, T5.8, T5.11"
  },
  {
   "at": "2026-11-28T11:36:35.331Z",
   "type": "question",
   "tasks": [],
   "id": "Q1",
   "text": "Unit coverage for SortMenu and ConfirmBulkDelete was folded into T6.6 (7 files, over the 5-per-task convention). Keep it there?",
   "default": "Keep in T6.6",
   "alternatives": "Split into a separate unit task T6.10; or rely on the T6.8 e2e for the confirm dialog"
  }
 ]
};
