# Phase 3 verification: tools scene

Date: 2026-11-17. Branch: `feature-enhancement`. Pages: `/v3`, `/v2`, `/`.

## Verdict: PASS

Phase 3 meets its acceptance criteria. I made no code changes.

**Open handoff defect, blocking the feature (not phase 3):** there is a blank band on the approach from the hero to the tools section. It belongs to the hero's pin spacer (phase 2). Shots: `p3-v3-1440-down--0.5.png`, `p3-v3-1440-down--0.3.png`, `p3-v2-1440-down--0.3.png`. See "Findings outside phase 3".

## What the previous builder changed (phase 3 scope)

Everything is uncommitted and mixed with phase 4 cutout work. Only the phase 3 parts are listed here.

- `apps/web/src/components/LandingV2/ToolsScene.vue`
  - Moved the eyebrow and heading header inside `.tools__frame`, as the top block of the copy column, above the rail.
  - Outside the pinned query (mobile and reduced motion), the pin shows only the header. The rail, copies and stage cell are `display: none`, so the header stays above the stacked list.
  - When pinned, the section's `padding-top` is 0. The pin is `100svh`, with the nav height as top padding and `space-xl` at the bottom.
  - The stage now sits in a `container-type: size` cell (`width: min(100cqw, 100cqh * ratio)`). The old `100svh` calc is gone.
  - Added the hooks `data-stage-copy-column` and `data-stage-media` for the tail measurement.
- `apps/web/src/components/LandingV2/toolsTimeline.ts`
  - `VIEWPORTS_PER_CHAPTER` changed from 1 to 0.5. The section now takes 2.5 screens instead of 5.
  - Timings changed: `SWAP` 0.22 to 0.2, `SWAP_OVERLAP` 0.08 to 0.06, `WIPE_START`/`WIPE_DURATION` 0.34/0.32 to 0.32/0.36, `FAN_DURATION`/`FAN_STAGGER` 0.45/0.06 to 0.38/0.05. Wipes and fans now end at 0.68 of a chapter, which leaves a hold of 0.32 chapter, or 0.16 viewport, before the next swap.
  - `measureTail` now measures the gap between the pin's bottom and the lower bottom of the copy column and the stage, using layout boxes. Before, it measured half the gap between the pin and the frame.
- `apps/web/src/components/LandingV2/ToolChapterCopy.vue`
  - The points list stretches to the body width, with `max-width` raised from 30rem to 34rem, so every chapter's hairlines are the same length.
- `apps/web/src/components/LandingV2/toolsMedia.ts`, `DEAL_SLOTS` only (layout pass)
  - The chapter 01 cards now span the stage from edge to edge, which fills the right-hand space that was empty before.
- Phase 4, not mine to judge: the cutout slots and `cutoutCards` in `toolsMedia.ts`, `ToolCutoutCards` in `ToolStage.vue` and `ToolChapterStacked.vue`, and the removed `.cluster--rise` styles in `ToolCluster.vue`.

## Fixes made

None. I found no phase 3 defect.

## Checks

- `vp check` (apps/web): formatting passes (647 files). Lint and types fail with `Found 2 errors and 6 warnings in 615 files`. All of them are in files outside phase 3. The two errors are known and come from the phase 4 `cutout` kind. Both are at `src/utils/landing.test.ts:83`:
  - `x typescript(TS2339): Property 'before' does not exist on type '{ kind: "compare"; before: string; after: string; } | { kind: "cutout"; pairs: CutoutPair[]; }'`
  - `x typescript(TS2339): Property 'after' does not exist on type '{ kind: "compare"; before: string; after: string; } | { kind: "cutout"; pairs: CutoutPair[]; }'`
  - Warnings: `no-console` in `scripts/check-cloudinary-env.mjs` and `src/utils/logger.test.ts`, `await-thenable` in `HeaderActions.test.ts:116`, `no-misused-spread` in `router/index.test.ts:84`.
- `vp lint`: `Found 2 errors and 6 warnings in 615 files`. These are the same lines as above, and none are in phase 3 files.
- `vue-tsc --noEmit -p tsconfig.json`: no errors.

## Browser verification

Session `visual-ai-p3` (closed at the start and again at the end). Shots are in `agent_docs/landing-v3-polish/shots/`. Each offset is in viewports from the top of `#tools`.

| Mode                                                                                                          | Shots                                                                                            | Observed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/v3` 1440x900 down                                                                                           | `p3-v3-1440-down-{-0.9,-0.7,-0.5,-0.3,0,0.4,0.55,0.75,0.9,1.25,1.4,1.9,2.4,2.7}.png`             | At pin start, the heading, rail, chapter copy and the dealt cluster form one composed screen with no band. Chapter 01's cards fill the stage. The rail number and fill follow the visible chapter. The wipe chapters (02 upscale, 03 colorize, 04 restore) show the split mid-wipe at 0.75 and 1.25, and the full "after" image in the hold. Chapter 05's cutout cards land fully. At 2.7 the pin releases and Showcase is pulled up by `--tools-tail` (98px), so there is no dead band. |
| `/v3` 1440x900 up                                                                                             | `p3-v3-1440-up-{2.25,1.75,1.25,0.75,0.3,-0.3}.png`                                               | Scrubbing in reverse restores each chapter correctly, including a mid-wipe on 04 and the reassembled chapter 01 cluster.                                                                                                                                                                                                                                                                                                                                                                 |
| `/v3` 1920x1080 down                                                                                          | `p3-v3-1920-down-{0,0.4,0.9,1.9,2.4,2.7}.png`                                                    | Same composition, centred in the container. Tail is 188px and the Showcase handoff is clean.                                                                                                                                                                                                                                                                                                                                                                                             |
| `/v3` 1920x1080 up                                                                                            | `p3-v3-1920-up-{2.25,1.25,0.3}.png` (scrollY 4482/3402/2376)                                     | Reverse scrub works:<br>- 2.25: chapter 05's cutout cards are fully landed and the rail is at 05.<br>- 1.25: chapter 03 colorize is mid-wipe and the rail is at 03.<br>- 0.3: chapter 01's cluster has reassembled across the stage and the rail is at 01.                                                                                                                                                                                                                               |
| WebGL disabled (`--disable-webgl,--disable-webgl2,--disable-3d-apis`; confirmed no GL context and 0 canvases) | `p3-v3-1440-nowebgl-{-0.5,0,0.4,0.75,2.4,2.7}.png`                                               | The tools scene is DOM-only and identical to the GL run.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Reduced motion, 1440                                                                                          | `p3-v3-1440-reduced-header.png`, `p3-v3-1440-reduced-list.png`                                   | No pin and no pin spacer. Only the header shows (rail hidden), above the stacked list. Tail is unset. Stacked chapters render statically.                                                                                                                                                                                                                                                                                                                                                |
| `/v3` 390x844                                                                                                 | `p3-v3-390-tools-{0,1,2}.png`                                                                    | The header sits above the stacked list. The cluster and compare chapters render. No horizontal overflow (`scrollWidth` 390).                                                                                                                                                                                                                                                                                                                                                             |
| `/v2` 1440                                                                                                    | `p3-v2-1440-down-{-0.3,0.4,1.25,2.4,2.7}.png`                                                    | Same as `/v3` (shared component).                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `/` (v1) 1440                                                                                                 | `p3-v1-1440-top.png`, `p3-v1-1440-tools.png`, `p3-v1-1440-tools-2.png`, `p3-v1-1440-cutouts.png` | No error overlay and no horizontal overflow. In `tools-2`, "04 RESTORE" sits near the bottom with about 170px of empty space below it. This is probably a scroll reveal that had not fired yet; I did not check it. It is non-blocking because it is v1. v1 shares only `ToolCutoutCards` (phase 4) via `LandingToolMedia.vue`. Its 05 "Subject in. Backdrop out." chapter shows all three cutout cards.                                                                                 |

### Layout pass: targets mapped to changes

There is no evidence that the critique, impeccable or layout skills were run. The table maps each layout target in the plan to the code change that addresses it and to the shot that shows the result.

| Target                              | Change                                                                               | Shot                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Cluster size and position           | `DEAL_SLOTS` widened to span the stage. Stage cutout slots (phase 4).                | `p3-v3-1440-down-0.4.png`, `p3-v3-1920-down-0.png` |
| Rail relative to heading            | Header moved into the copy column. `.tools__rail` has `margin-top: space-lg`.        | `p3-v3-1440-down-0.png`                            |
| Vertical rhythm                     | Header gap `space-xs`, copies `margin-top: space-2xl`, points list widened to 34rem. | `p3-v3-1920-up-1.25.png`                           |
| Chapter 01's empty right-hand space | `DEAL_SLOTS` span; the stage cell is right-aligned (`place-items: center end`).      | `p3-v3-1440-down-0.4.png`                          |

Acceptance criteria:

- **One composed screen on entry, no empty band.** Met at 1440 and 1920.
- **Less than a third of a screen from a finished chapter to the next.** Met. The hold is 0.16 viewport by construction.
- **All five chapters and both kinds of wipe chapter play in both directions.** Met.

## Findings outside phase 3

1. **Hero-to-tools approach band. This is an open phase 2 handoff defect and it blocks the feature.**
   - What it looks like: at 1440, between about -0.5 and -0.3 viewport before the pin, the upper half of the screen is empty. The hero tiles have left, and the tools header has not yet risen into that area. At -0.7 only a few tiles remain, at the far left.
   - Shots: `p3-v3-1440-down--0.5.png` and `p3-v3-1440-down--0.3.png`. It reproduces on `/v2` in `p3-v2-1440-down--0.3.png`.
   - Why it belongs to the hero: at offsets -0.5, -0.4 and -0.3, `elementFromPoint(720, 250)` lands on a `div.pin-spacer`. That spacer's first child is `section.hero`, and its bottom sits exactly at the top of `#tools` (450, 360 and 270px). `#tools` has a computed `padding-top` of 0px. So the empty area is the hero's pinned space, not the tools section.
   - Owner: phase 2's criterion ("no frame may be blank") covers this. The cause is the hero exit timing in `HeroScene.vue` / `heroWallLayout.ts`. That is outside phase 3, so I left it unchanged.
2. **Console error on `/v3`, unrelated to the landing visuals.** `ERROR api GET undefined → NETWORK_ERROR`. An API call is going out with an undefined URL. It needs separate triage.

## Not verified

- Shots were taken after instant `scrollTo` jumps with a 1.3s settle, not during continuous wheel scrolling. A real trackpad pass was not done.
- The band's ownership was measured with `elementFromPoint` on `/v3` only. On `/v2` I only saw it in the shot; I did not measure it.
- The empty space below "04 RESTORE" in v1's `p3-v1-1440-tools-2.png` was not investigated.
- The live-resize retiming of `--tools-tail` across the 900px breakpoint was not exercised.
- Per section 4 of the plan, independent UI/UX reviewer judgement was not part of this task.
