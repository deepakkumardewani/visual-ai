# Landing v3 polish — PLAN

Status: plan only. Nothing here is implemented.
Date: 2026-11-16. Branch at time of writing: `feature-enhancement`.

## 1. Confirmed intent

Polish `/v3` into the page that will replace `/`. Fixes go into the shared
`LandingV2/*` components, so `/v2` changes too (confirmed acceptable).

| #   | Area               | Decision                                                                                                               |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | Hero exit          | Copy holds until the wall is nearly gone; a few tiles cross into the left half as it fades, so the left is never blank |
| 2   | Hero prompt        | Prompt retypes every ~6s; the matching wall tile glows and lifts in place while the others dim                         |
| 3   | Hero copy          | Numbers + "no card", wording must signal the daily 30 resets, not accumulates                                          |
| 4   | Tools gap          | Heading moves inside the pinned screen                                                                                 |
| 5   | Tools pacing + UI  | ~0.5 viewport of scroll per tool (about 2.5 screens, was 5); impeccable + layout pass on all five chapters             |
| 6   | Background removal | 3 new source images + 3 real removals, shown as cutout cards on a checkerboard with an inset of the original           |
| 7   | Showcase           | "Try this prompt", click to enlarge, model name per tile, sideways drag/scroll on rows, visual polish                  |
| 8   | Pricing            | v1's plan-card structure in v3 styling, Free card leading                                                              |
| 9   | FAQ                | Heading and list centred, v3 styling                                                                                   |
| 10  | Final CTA          | Hero-style cursor glow and hover on the image tiles                                                                    |

### Out of scope

- Mobile layout redesign. Mobile inherits copy and content changes only, and must not regress.
- Models section, nav, footer, the `/pricing` page itself.
- Removing `/v2`.
- Automated tests (see section 4).

## 2. Facts from the code that shape the work

- `pages/LandingV3.vue` wraps `LandingV2Page` and swaps in `GlHeroWall`, `GlShowcaseMedia`, `GlTransition`. Every other section is a shared `LandingV2/*` component.
- Hero timing lives in `LandingV2/HeroScene.vue`: `PIN_VIEWPORTS = 0.55`, `EXIT_VIEWPORTS = 1`, `COPY_FADE_SHARE = 0.45`. The copy is gone after about 0.25 viewport while the wall leaves for a full viewport. That gap is issue 1.
- The hero types one fixed prompt: `HERO_PROMPT_ITEM = 11` in `heroWallLayout.ts`. Every wall tile already carries its own `prompt` from `utils/gallery.json`.
- The WebGL wall already has a per-tile light and bulge (`uLight`, `uBulge`, `lightAt` in `glHeroScene.ts`), driven by the cursor.
- Tools: the header sits outside `.tools__pin` (a `100svh` pin with the stage centred), which is the empty band in issue 4. `VIEWPORTS_PER_CHAPTER = 1` in `toolsTimeline.ts` is issue 5.
- `remove-bg` in `utils/landing.ts` uses `galleryItems.slice(3, 6)`: three unrelated gallery images. `toolsMedia.ts` says so in a comment.
- `FaqSection.vue` is the v1 component (52rem column, left-aligned head) and is also used by `Landing.vue`, `FeatureLanding.vue` and `PricingLayout.vue`.
- v1 `PricingTeaser.vue` hard-codes rupee prices (`₹0`, `From ₹99`). `PricingScene.vue` (v2/v3) already resolves a localized price (`fromPrice`, `cheapestPack`, `bestSavingPercent`).
- `useCursorLight.ts` (`bindCursorLight`) exists and is used by `ModelsScene.vue`.

### Gaps found (each needs a decision before its phase starts)

1. **`gallery.json` has only `url`, `aspectRatio`, `prompt`. There is no model field.** "Model name per tile" cannot be shown truthfully from current data. Options: backfill the 12 showcase items from generation records if they exist, or drop the label. Do not invent model names.
2. **No prompt-prefill path into the studio exists** (no `?prompt=` handling found). "Try this prompt" needs a small new mechanism in the studio route.
3. **"No card needed" must be verified** against the real signup flow before it ships in copy.
4. **A Pro plan exists in the app** (`PricingProCard.vue`). v1's teaser shows only Free and Buy Credits. Decide whether the v3 cards are Free + Packs or Free + Pro + Packs.

## 3. Phases

Each phase is independently reviewable in the browser. Order is by dependency and by cheapest-first.

### Phase 1 — Copy and static fixes (low effort)

- **Hero copy** (`HeroCopy.vue`): replace "Start free, then buy credits." Candidate: "Start with 30 free credits, plus a fresh 30 every day. No card needed." Numbers come from `SIGNUP_CREDITS` and `DAILY_CREDITS.free`, not literals. Resolve gap 3 first; if a card can ever be requested, drop that sentence.
- **Final CTA sub copy** (`FinalCtaScene.vue`): align to the same wording so the page says one thing.
- **FAQ**: add a `centered` variant prop to `FaqSection.vue` (default off, so v1, feature pages and `/pricing` are unchanged). v2/v3 pass it. Centre eyebrow, heading and the list column; restyle with `lv2` type tokens and hairline colours instead of the hard-coded `#2d2319`.

Accept when: hero and CTA copy read as free with no purchase language; FAQ is centred on `/v3` at 1440 and 1920 wide; `/`, `/pricing` and a feature landing page look identical to before.

### Phase 2 — Hero exit: retime plus tiles crossing left

- Retime in `HeroScene.vue`: the copy holds fully visible for the first ~60% of the pin, then fades over the rest. Lengthen the pin toward the wall exit so the two end together (tune `PIN_VIEWPORTS`, `COPY_FADE_SHARE`; keep them named constants).
- Tiles crossing left: in `heroWallLayout.ts` give 3–4 near/mid tiles an exit path that travels through the left half during the last part of the scroll, timed to start as the copy's opacity drops below about 0.5 so they never sit over readable text. Both walls read `tileFrame`, so the DOM wall and `GlHeroWall` stay in step with one change.
- Check the handoff: the Tools heading (now inside the pin, phase 3) must arrive while tiles are still leaving. No frame may be blank.

Accept when: scrolling slowly from the top to the Tools section, no viewport-height position shows an empty left half; tiles never overlap legible copy.

Risk: `tileFrame` is shared geometry. Verify the WebGL wall, the DOM fallback (WebGL off) and reduced motion.

### Phase 3 — Tools section: heading inside the pin, half the scroll, layout pass

- Move the "5 tools, one studio / See what each one does." header inside `.tools__frame` as a compact top block of the pinned screen. Mobile and reduced motion keep the header above the stacked list.
- Set `VIEWPORTS_PER_CHAPTER` to about 0.5. Re-tune `SWAP`, `WIPE_START`, `WIPE_DURATION`, `FAN_DURATION` so each chapter's animation completes at roughly 70% of its share and the remainder is a short hold, not a long one.
- Re-check `measureTail` / `--tools-tail`, since the frame gets taller with the header inside.
- Run the `impeccable` and `layout` skills on the five chapters (also `critique` first for findings). Expected targets: image cluster size and position relative to the copy, the rail's relation to the heading, vertical rhythm of eyebrow/title/body/points/CTA, and the unused right-hand space visible in the chapter 01 screenshot.

Accept when: on entering the section the heading, rail, copy and images form one composed screen with no empty band; after a chapter's images finish, less than about a third of a screen of scroll reaches the next chapter; all five chapters and both wipe chapters still play correctly in both scroll directions.

### Phase 4 — Background removal assets and cutout cards

Assets (real, paid calls):

- **6 Replicate calls: 3 text-to-image + 3 background removal.** Before any call, the orchestrator must ask through AskUserQuestion, stating the endpoint, the model, the expected cost per call and the count, and wait for an explicit yes. The interview approval covers intent, not the calls.
- Draft prompts (portrait 4:5, one clear subject, a busy but separable backdrop, clean edges):
  1. Person: "Editorial portrait of a woman in a mustard wool coat standing on a busy city street at golden hour, shallow depth of field, shop signs and traffic behind her, natural skin texture, 85mm photo"
  2. Product: "A pair of white leather sneakers on a cluttered wooden workbench with tools, paint tins and plants behind, soft window light, crisp product photography, sharp edges"
  3. Pet: "A golden retriever sitting on a lawn in a suburban garden, fence, flower beds and garden furniture behind, bright overcast light, sharp fur detail, photo"
- Run the remover on each result. Store originals as `.webp` and cutouts as transparent `.webp` (or `.png`) in `apps/web/public/landing/` using the existing hashed naming.
- If a cutout has rough edges, ask again before any re-run. Do not retry silently.

UI:

- New media kind for the chapter (for example `kind: 'cutout'` with `{ original, cutout }` pairs) in `utils/landing.ts`, replacing the `slice(3, 6)` gallery reference. Update the `GALLERY_RANGES.tools` note.
- New `ToolCutoutCards.vue`: three cards, subject on a subtle checkerboard, small inset of the original in a corner, the existing "rise" entrance. A CSS-gradient checkerboard, low contrast so it reads on the dark page.
- The stacked (mobile / reduced motion) chapter renders the same cards.

Accept when: the chapter shows three recognisable cutouts with their originals, and nothing on it is a stand-in image.

### Phase 5 — Rotating hero prompt with a moving spotlight

- Choose 4–5 desktop wall tiles as the prompt cycle (near and mid layers, short prompts, visually distinct). Replace the single `HERO_PROMPT` with an ordered list; the first stays the bloom image so the intro is unchanged.
- `HeroScene.vue`: after the intro, every ~6s erase and retype the next prompt (reuse the typing tween). Pause while the tab is hidden, while the hero is off screen, and once the scroll exit begins. Reduced motion: no cycling, first prompt shown in full.
- `HeroPrompt.vue`: its box is sized by the full prompt text. Size it to the longest prompt in the cycle so it never jumps.
- Spotlight: add a `spotlight` tile index and strength to the wall progress. The active tile lifts slightly and gets a warm rim; the others dim to about 0.7. In `GlHeroWall` reuse the existing `uLight` / `uBulge` uniforms aimed at the tile centre; mirror it in the DOM `HeroWall` with a class.
- Cursor interplay: the cursor light wins while the pointer moves over the wall; the automatic spotlight resumes after a short idle.
- Accessibility: the sr-only prompt text must not announce every 6s (no live region; keep `aria-hidden` on the animated copy).

Accept when: each new prompt is followed, within about half a second of finishing, by its tile lighting up, and a first-time viewer can tell which image belongs to the text; no layout shift in the prompt box; cycling stops when scrolling away.

### Phase 6 — Pricing section

- Rebuild `PricingScene.vue` as plan cards: name, price, cadence, 3–4 points, CTA, badge. Free card first and visually strongest (gold figure, primary button). The buy card uses a ghost button and makes no "most popular" claim that pushes paying.
- Prices come from the existing localized resolution in `PricingScene.vue` (`fromPrice`, `cheapestPack`, `bestSavingPercent`), never v1's hard-coded rupee strings.
- Extract the plan data to one shared source so v1's `PricingTeaser.vue` and v3 do not drift.
- Resolve gap 4 (Pro card or not) before building.
- Run `impeccable` / `layout` on the result.

Accept when: the section reads as an offer with real prices in the visitor's currency, Free is the obvious first choice, and it matches v3's type and spacing.

### Phase 7 — Showcase upgrades

- **Sideways scrolling**: rows accept pointer drag and horizontal wheel/trackpad. Interaction pauses the drift; it resumes after a short idle, from the new offset. Vertical wheel must still scroll the page (do not trap it; check with Lenis). `showcaseDrift.ts` owns the offset; `GlShowcaseMedia` already reads tile boxes each frame, so it should follow, but verify.
- **Click to enlarge**: a dialog with the large image, full prompt, copy button, "Try this prompt", previous/next by arrow keys, Esc to close, focus returned to the tile. A drag must not count as a click.
- **Try this prompt**: needs gap 2. Proposed: the studio route reads a `prompt` query param once on entry, fills the prompt input, then clears the param. Signed-out visitors go through sign-in with the destination preserved. It must only prefill; it must never auto-submit a generation (that would be a paid call).
- **Model name per tile**: blocked on gap 1. Build only if real data can be supplied.
- **Visual polish**: `critique` then `impeccable` on heading block, row heights, label legibility, drift speed, edge fades.

Accept when: every showcase image can be reached by dragging; a tile opens large with its prompt; "Try this prompt" lands in the studio with the text filled in and nothing submitted.

### Phase 8 — Final CTA glow and hover

- Recommendation: yes, but as a light DOM treatment, not a third WebGL scene. Reuse `bindCursorLight` for a warm light that follows the cursor over the wall, plus a per-tile hover lift and rim on fine pointers.
- The wall is `aria-hidden` and decorative; keep it non-interactive for keyboard and screen readers, and keep the copy and buttons above it.

Accept when: moving the cursor over the CTA tiles feels like the hero, and the buttons remain the clear focus.

## 4. How to execute (orchestration rules)

These are requirements, not suggestions.

- **Keep the main context clean.** The orchestrator plans, delegates, reads short reports and decides. It does not read large files or do the edits itself. Each subagent returns a brief structured report: files changed, what was verified, open issues.
- **Model per task:**
  - **Opus** for work with real design or risk judgement: phase 2 (shared exit geometry + WebGL), phase 3 (timeline retune and layout pass), phase 5 (spotlight across DOM and GL), phase 7 (drag vs drift vs Lenis, dialog), and all UI/UX review.
  - **Sonnet** for well-specified, mechanical work: phase 1 (copy, FAQ variant), phase 4 UI once assets exist, phase 6 card build from a settled design, phase 8.
  - Haiku only for read-only discovery, returning structured summaries.
- **One task per subagent**, at most one phase each. Phases 1, 4, 6 and 8 touch separate files and can run in parallel; 2 → 3 → 5 run in order because they share the hero/tools handoff.
- **No tests for now.** Do not write or update unit or e2e tests in this work. If an existing test breaks because of an intended change, report it; do not weaken or delete it silently. Still run type-check and lint.
- **Verify in the browser, properly.** Every phase ends with real browser verification using the `agent-browser` skill with a repo-unique session (`AGENT_BROWSER_SESSION`), never the default session. For each phase:
  - Desktop at 1440×900 and 1920×1080 on `/v3`, plus a `/v2` spot check.
  - Scroll-driven phases: screenshots at stepped scroll positions through the whole section, in both directions, to prove there is no blank band.
  - A mobile-width check (390 wide) to confirm nothing regressed.
  - The DOM fallback (WebGL unavailable) and `prefers-reduced-motion`.
  - Phase 1 and 6 also check `/`, `/pricing` and one feature landing page.
  - Save screenshots as evidence and have a separate reviewer subagent (UI and UX) judge them. The builder does not grade its own work.
- **Do not start the dev server**; it is already running.
- **No paid or outbound calls** except the 6 in phase 4, each batch behind an explicit AskUserQuestion approval. Browser verification must not trigger a generation.
- **UI work uses the `impeccable` skill family** (`critique`, `layout`, `polish`, `typeset`), never `frontend-design`.
- **No commits** unless asked.

## 5. Decisions needed before building

1. Model names in the showcase: is there a real source for the 12 showcase images, or is the label dropped?
2. Does signup ever ask for a card? (Decides "No card needed".)
3. Pricing cards: Free + Packs, or Free + Pro + Packs?
4. Approval for the 6 Replicate calls, asked with costs at the time of phase 4.
