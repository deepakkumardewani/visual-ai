CHANGES · P7 has one blocker: the dialog note says "Opens the studio", but signed-out visitors (most landing traffic) hit a generic sign-in page instead

## PASSED

(none; P7 is the only task under review and is held by the item below)

## BLOCKING

- P7 · [ux] · apps/web/src/components/LandingV2/ShowcaseDialog.vue:86-88 with apps/web/src/components/LandingV2/useTryPromptLink.ts:23-24 · (shot) The note under "Try this prompt" always says "Opens the studio with this prompt filled in". For a signed-out visitor, though, the link goes to `/signin?redirect=…`. Shot 06 is a signed-out session ("Start free" in the header), and shot 11 shows where that click lands: Clerk's generic "Sign in to Visual AI / Welcome back! Please sign in to continue", which mentions neither the prompt nor the studio. The copy is wrong for the context most landing visitors are in, and a first-time visitor reads "Welcome back" right after being promised the studio. This is separate from the logged `/signup` redirect drop, which makes it worse for new visitors. · Fix, pick one: (a) Expose `isSignedIn` from `useTryPromptLink` and switch the note for signed-out visitors, e.g. "Sign in first, then the studio opens with this prompt filled in. Nothing runs until you press Generate." (b) Simpler for the visitor: link signed-out visitors straight to `/create?prompt=` too. I checked in source that `/create` is not in `authRequiredRoutes` (router/index.ts:192) and that `GenerateCTA.vue:44-45` opens the signup dialog for signed-out users when they press Generate. Shot 12 shows the studio rendering and prefilling while signed out. With (b) the current note becomes true for everyone, and the `/signup` redirect gap stops mattering for this flow. It departs from the plan's "go through sign-in" line, so it needs a product yes.

## ADVISORY

- P7 · [ux] · ShowcaseDialog.vue:90-98, 232-236 · (shot 17) At 390, prev/next sit below the fold inside the dialog. There is no swipe, and the arrow-key hint is hidden on touch, so phone users may never find out they can browse. · Fix: on narrow screens, move the nav next to the plate number at the top of the side column, or make it a sticky panel footer. Optionally add a horizontal swipe on `.sd__frame`.
- P7 · [ux] · ShowcaseTile.vue:50-58 (rail variant); ShowcaseLabel.vue:14 is desktop-only · (shot 16) Rail images give no cue that tapping opens anything. "Click it to see it larger" appears only with the desktop rows, so on phones the dialog, and with it "Try this prompt", is effectively hidden. · Fix: add a small expand icon in a corner of `.tile--rail .tile__media`, or a "Tap an image to see it larger" line above the rail.
- P7 · [ux] · useShowcaseLightbox.ts:14-19 with the AppModal.vue restore · (source; shot 09 shows only the simple case) Focus always returns to the tile that opened the dialog. After paging with the arrow keys, Esc lands on an image the visitor is no longer looking at. In shot 09 the focused tile (05) and the prompt label (10, from the hovered tile) also disagree after close. · Fix: on close, focus the tile for `openIndex` (look it up by index in the rows or rail) and let that focus set the active label.
- P7 · [a11y] · ShowcaseDialog.vue:69-73 · (source) Stepping with Next or the arrow keys swaps the image and prompt silently. Focus stays on Next and nothing is announced, so screen reader users get no feedback. · Fix: add a visually hidden `aria-live="polite"` status ("Image 5 of 12"), or put it on the plate.
- P7 · [ux] · ShowcaseDialog.vue:33, 81 · (source) The copy state persists across next/prev. Copy prompt 4, press Next, and prompt 5 shows "Copied" for up to 2.2 s although it was never copied. · Fix: reset the copy state when `item` changes, with a watch on `item.url` or a `:key` on the button.
- P7 · [a11y] · ShowcaseTile.vue:55 · (source) All twelve rail buttons are named "View image larger". The figure gives context, but a rotor or button list shows twelve identical entries. · Fix: `aria-label="View larger: {short prompt}"`, or `aria-describedby` pointing at the figcaption.
- P7 · [a11y] · ShowcaseDialog.vue:52, 62, 69-73 · (source) The dialog's accessible name is "No. 05 / 12", and the prompt is read twice: once as the img alt and again via `aria-describedby`. · Fix: name it "Showcase image 5 of 12" and give the dialog img `alt=""`, since the prompt is already the description.
- P7 · [ux] · ShowcaseDialog.vue:58-65 · (source) There is no loading or error state when stepping. The `:key`ed img has no intrinsic size until it loads, so the stacked text can jump on phones, and off-screen rail images are lazy and may not be cached. A failed image shows a broken icon. · Fix: give the frame a fixed `aspect-ratio` box from `item.aspectRatio` with the surface-2 placeholder, and handle `@error` with a short "Image unavailable" line.
- P7 · [ux] · showcaseDrift.ts:167-180 vs showcaseScrub.ts:102-104 · (source) In Chromium, a mouse press focuses the tile. That runs the keyboard "reveal" nudge, a 480 ms transform on `.rows__focus`, before the drag threshold is crossed. When the drag starts, the tile is blurred and the nudge slides back. Pressing on a half-visible edge tile to drag therefore jolts the row one way and then the other. · Fix: nudge only on keyboard focus (`target.matches(':focus-visible')`).
- P7 · [ux] · ShowcaseRows.vue:137-138, ShowcaseTile.vue:100, ShowcaseLabel.vue:14 · (source) Tiles cover almost the whole row and show `cursor: zoom-in`, so `grab` appears only in the gaps. The hint doesn't mention dragging either, so a mouse user without a horizontal wheel may not discover sideways movement. · Fix: add "drag a row to browse" to the hint.
- P7 · [ux] · useStudioPromptPrefill.ts:42-45 · (source) A signed-in user's saved composer draft is silently replaced by the showcase prompt. The user asked for this, so it is minor. · Fix: when the restored draft was non-empty and different, show a "Replaced your draft · Undo" toast.
- P7 · [ux] · useShowcaseLightbox.ts:28-32 · (shots 07, 18, 19) Arrow order follows the item index, not the visual order. The dragon is "04" but sits second in the top row, so Next jumps around the page. The plate numbers keep it coherent, so this is a taste call.
- P7 · Notes · Checked and fine:
  - Drag moves the row (02), and GL tiles follow it (03), with the last top-row tile fully in view.
  - A horizontal wheel moves the row (04), and a vertical wheel over a row still scrolls the page (05), so Lenis is not trapped.
  - (source) The click after a drag is swallowed (showcaseScrub.ts:127-143), and `touch-action: pan-y` keeps vertical touch scrolling.
  - The dialog has a clear primary action, a secondary Copy, and a cost-safe note. Prev/next have names and 44px targets (06, 07, 19).
  - Copy feedback shows as both the button label and a toast (08). (source) A failed copy shows "Couldn't copy" plus the toast and is logged.
  - Esc closes the dialog and focus returns to the tile (09). The tile focus ring is visible (10).
  - (source) `trap-focus` is on, with the Shift+Tab-from-panel edge fixed (useFocusTrap.ts:42-46), and `.lv2 :focus-visible` covers the dialog buttons.
  - Reduced motion uses static rows with all 12 images in view, and a motionless dialog (18, 19).
  - The no-WebGL DOM fallback works (15). 1920 (13) and the `/v2` spot check (14) show no regression; `/v2` shares ShowcaseMedia. The new hint shows at 1024 and 1440 (20-label-hint-\*).
  - At 390 the rail and stacked dialog keep the actions above the fold (16, 17).
  - Studio prefill fills the text box and shows HTML as literal text (12). (source) The prompt is trimmed, capped and cleared from the URL, and `safeRedirect.ts` rejects `//`, `/\` and cross-origin values.
  - (source) Unmounting with the dialog open releases the scroll lock (`useScrollLock` scope dispose) and Lenis.
- P7 · Evidence caveats:
  - Shot 12 was taken signed out, by going straight to the studio with a test prompt. It proves prefill and escaping, but not the sign-in to studio round trip.
  - Shots 13, 14, 15 and 18 show the old hint text, so they predate the ShowcaseLabel change.

## Summary

- Drag, horizontal wheel, unblocked vertical scroll, GL alignment, the dialog, copy feedback, Esc and focus return, reduced motion, no-WebGL, `/v2` and the 390 layouts all work in the shots. Prefill never submits.
- Blocked on one copy and flow mismatch: the note says the studio opens, but signed-out visitors get a context-free "Welcome back" sign-in page.
- The main advisories are mobile discoverability (no tap cue, prev/next below the fold), focus return to the last image viewed, and announcing steps to screen readers.

Must-fix:

1. P7 · ShowcaseDialog.vue:86-88 and useTryPromptLink.ts:23-24: make the note auth-aware, or link signed-out visitors straight to `/create?prompt=` (the studio already gates Generate with the signup dialog).

Optional: mobile nav placement and rail tap cue; focus the last viewed tile on close; live announcement on step; reset copy state per image; distinct rail button names; dialog name and duplicate alt; image placeholder and error state; nudge only on `:focus-visible`; drag hint; draft-replaced toast.
