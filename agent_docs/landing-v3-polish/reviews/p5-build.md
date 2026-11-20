# Phase 5 build report: rotating hero prompt + spotlight

Built on `feature-enhancement`, uncommitted. The spotlight works on `/v3` with GL, on `/v3` without WebGL, and on `/v2`, since `/v2` shares `HeroScene` and `HeroWall`.

## Acceptance criteria

| Criterion                                                                           | Result | Proof                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Each new prompt is followed within ~0.5s of finishing by its tile lighting up       | PASS   | The light starts 0.12s after the last character lands and reaches full after a further 0.4s, so it is fully lit 0.52s after typing ends. Shots were taken 750ms after typing completed, and each shows the matching tile rimmed: `p5-v3-1440-prompt-1..6.png`, `p5-v3-1920-prompt-1..3.png`, `p5-v3-1440-nowebgl-prompt-1..3.png`, `p5-v2-1440-prompt-2.png`                                                                                 |
| A first-time viewer can tell which image belongs to the text                        | PASS   | The active tile lifts, gets a copper rim and goes to full opacity, while the others dim to 0.7. Examples: the pirate ship in `p5-v3-1440-prompt-1.png`, the cave in `p5-v3-1440-prompt-3.png` and `p5-v3-1440-nowebgl-prompt-3.png`, and the bloom tile as the first stop in `p5-v3-1920-prompt-1.png`                                                                                                                                       |
| No layout shift in the prompt box                                                   | PASS   | See the measurements below. The values were identical in every sample.                                                                                                                                                                                                                                                                                                                                                                       |
| Supporting check (not an acceptance criterion): spotlight survives normal mouse use | PASS   | With the pointer moving over the copy, the spotlight stays (`p5-v3-1440-cursor-over-copy.png`). Over a tile, the cursor light takes over (`p5-v3-1440-cursor-over-tile.png`). At idle, the spotlight returns (`p5-v3-1440-cursor-idle.png`). The DOM wall has no cursor light and no yield code; while the mouse moved, glow peaked at 1 and its one dip matches the scheduled dim before an erase (`p5-v3-1440-nowebgl-cursor-moving.png`). |
| Cycling stops when scrolling away                                                   | PASS   | At scrollY 150 the prompt stayed the same for 9s, and on return the rotation resumed (`p5-v3-1440-scrolled-150-paused.png`). With the hidden-tab state forced, the prompt was frozen at 185/185 for 8s, and the rotation resumed once the tab was visible again. Offscreen pausing uses an IntersectionObserver.                                                                                                                             |

## Measured positions across swaps (getBoundingClientRect top, px)

| Viewport          | Samples / prompts                  | h1    | prompt box top / height | CTAs  |
| ----------------- | ---------------------------------- | ----- | ----------------------- | ----- |
| 1440x900 GL       | 553 samples, 5 prompts (full loop) | 192.5 | 559.2 / 125.5           | 716.7 |
| 1920x1080 GL      | 73 samples, 3 prompts              | 282.5 | 649.2 / 125.5           | 806.7 |
| 1440x900 no WebGL | 3 prompts                          | 192.5 | 559.2 / 125.5           | 716.7 |
| 390x844           | 64 samples, no cycle (by design)   | 331.3 | 619.8 / 147.9           | 799.6 |

## Other checks

- **Reduced motion:** the first prompt shows in full (189/189 characters) with no cycle, rim or dim (`p5-v3-1440-reduced.png`).
- **Hero exit:** re-shot on the final code and compared side by side with p2fix (pin measured at 1710 on /v3; the /v2 frame at the same offset matches p2fix-v2). GL -0.9 and -0.5 differ from p2fix on 0.2% and 0.6% of pixels. No-WebGL -0.9, -0.5 and -0.3 differ on 4.0%, 1.4% and 0.02%; the 4% is scrub lag and parallax, and the composition is the same. /v2 -0.5 differs on 0.4%. The GL frames are `p5-v3-1440-down-*.png`. The no-WebGL frames are `p5-v3-1440-nowebgl--0.9/-0.5/-0.3.png` and the `/v2` frame is `p5-v2-1440-down--0.5.png`. The spotlight is forced off once `scroll > 0` (`spotlightShare`), so the exit maths is unchanged. `wallExitLength`, `RADIAL_EXIT_SHARE`, `CROSSING_START` and `CROSSING_STAGGER` were not touched.
- **Errors:** `/` (`p5-v1-1440.png`), `/v2` and `/v3` show no page errors. The console shows a pricing-catalog `Failed to fetch` that falls back to USD. It existed before this phase and is unrelated.
- **Checks:** `vp check` and `vp lint` (both re-run on the final code) are clean on every touched file. The only failures are the known ones: landing.test.ts TS2339, plus logger.test.ts, HeaderActions.test.ts, router/index.test.ts and check-cloudinary-env.mjs.
- **Tests:** no existing unit or e2e test covers these modules, and no test files were changed.

## Bug 1: a scroll mid-swap froze a half-erased prompt

Scrolling during a swap froze a half-erased fragment ("A beautiful g") while the copy was still readable. The fix is in `setExitStarted`: it now calls `settleAtRest`, which moves the timeline forward with events on to the next prompt typed in full, then pauses. After the fix, a scroll at typed 160/189 settled on the next prompt (185/185) and the rotation resumed on return.

## Bug 2: cursor yield hid the spotlight during normal mouse use

The first build yielded on any `pointermove` anywhere in the window, on both renderers. On the DOM wall that removed the cue and showed nothing instead. The yield now lives only in the GL renderer (`glSpotlightYield.ts`). It applies only when the pointer moved in the last 1.4s and is over a visible tile, using a hit test against the previous frame's quads.

## Files

- `apps/web/src/components/LandingV2/heroPromptCycle.ts` (new): the cycle timeline, the pause gate and the settle-at-rest step.
- `apps/web/src/components/LandingV2/composables/useHeroPrompt.ts` (new): prompt and spotlight state.
- `apps/web/src/components/LandingV2/heroWallLayout.ts`:
  - The spotlight inputs and the `glow`/`brightness` frame fields.
  - `HERO_PROMPT_CYCLE` holds items 11, 12, 16, 13 and 0.
  - `HERO_PROMPT` was removed.
- `apps/web/src/components/LandingV2/HeroScene.vue`: wires the cycle into the intro, scroll and cleanup.
- `apps/web/src/components/LandingV2/HeroCopy.vue` and `HeroPrompt.vue`:
  - Sizer stack sized to the tallest prompt.
  - Static sr-only text.
- `apps/web/src/components/LandingV2/HeroWall.vue`: DOM rim (`--tile-glow`) and brightness dim.
- `apps/web/src/components/LandingV3/glHeroShaders.ts` and `glHeroScene.ts`: `uDim` and `uRim` uniforms, with the light and bulge aimed at the active tile. The scene also applies the cursor yield.
- `apps/web/src/components/LandingV3/glSpotlightYield.ts` (new): eases the spotlight out while the cursor is in use and back once it rests.
- `apps/web/src/components/LandingV3/glHeroPointer.ts`, `glHeroSession.ts` and `glHeroGeometry.ts` changed:
  - The pointer exposes `moving`.
  - The session passes `cursorMoving` through.
  - New `quadContains` hit test.

## Ambiguity choices

1. **Rotation on desktop only.** The mobile wall has only three of the five cycle tiles and is out of scope. The alternative was a three-stop or text-only cycle on mobile.
2. **Static screen-reader text (the first prompt).** The alternative was to track the visible prompt, which would have rewritten the text under a screen reader.
3. **DOM spotlight via an inline custom property and filter, not a class.** This keeps it frame-exact with the shared `tileFrame` progress.
4. **Extra `uDim`/`uRim` uniforms** beyond reusing `uLight`/`uBulge`. Light alone could not dim the others or draw a rim.
5. **Pausing during a swap jumps to the next full prompt.** A scroll that starts during an erase therefore changes the visible text at scroll 1–150px while the copy is still readable. Alternative: rewind to the current prompt in full if the erase has only just begun, and finish forward once typing is under way. Not done, because seeking backwards across the stop-switch call needs extra state.
6. **The cursor yields only in GL, only over a tile.** The plan says the cursor light wins while the pointer moves. Applied literally on the DOM wall, which has no cursor light, that would hide the cue for nothing. Alternative: yield on any move, which was the first build.
7. **"Short" prompts.** Every gallery prompt is 160–190 characters, so no stop is truly short. The box is sized to the tallest.

## Unverified

- **The hidden-tab test forced `document.hidden`** rather than switching to a real tab.
- **The GL cursor yield is shown by screenshots only.** It has no numeric readout.
- **1920 and 390 were checked at rest only**, not through the scroll exit.
