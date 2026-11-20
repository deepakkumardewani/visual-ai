CHANGES · P7 showcase: the dialog and rows are strong, but a tile focused by the mouse keeps its pill and lift while a second tile is hovered, so two tiles compete and the label describes the wrong one

## PASSED

## BLOCKING

- P7 · [ui] · apps/web/src/components/LandingV2/ShowcaseTile.vue:181-191 (and @focus → activate at :57, :76) · In 09-after-esc-focus-on-tile.png, tile 05 (copper focus ring) and tile 10 (hovered) are both lifted with a "Copy prompt" pill, and the label reads "10 / 12 · celestial scene" while the ringed tile is the zen garden. 03-after-drag shows the same double reveal after a drag (two pills; the label shows the zen garden while the city tile is the lifted one). Mechanism (from source): the pill and lift appear on `:hover`, on `:focus-within` and on `.is-active`, and every `focus` emits `activate`. Chromium focuses a button on mousedown, so after any click or drag start, that tile stays raised while hover raises a second one. A plain mouse user gets two focal points in the row after every drag, the interaction this phase adds. · Use `:has(:focus-visible)` instead of `:focus-within`, and emit `activate` only on keyboard focus (`matches(':focus-visible')`), so mouse focus never reveals. Keep the copper ring on keyboard focus and on focus returning from the dialog. Re-shoot 03 and 09.

## ADVISORY

- P7 · [ui] · ShowcaseDialog.vue:241 (`grid-template-columns: minmax(0,1fr) minmax(16rem,22rem)`) · In 06, 07 and 19 (1440) the portrait image sits centred in a column of about 750px with about 160px of empty panel on each side, so the panel looks half empty and the image is smaller than it needs to be. · Size the image column to the image (`auto minmax(16rem,22rem)` with the panel shrinking to fit), or let the image fill the column height and narrow the panel.
- P7 · [ui] · useShowcaseCopy.ts:17-19 via useShareActions · In 08 one copy gives two confirmations: the button changes to "Copied" and a square, solid-gold "Prompt copied" toast appears bottom-right, next to the back-to-top button. The toast is the loudest accent on the screen, against "accents are rare". · Suppress the success toast for showcase copies and keep the inline "Copied" label, plus the toast only on failure if wanted.
- P7 · [ui] · ShowcaseDialog.vue:125 (narrow layout) · In 17 (390), the previous/next row is below the fold: only the divider shows at the bottom edge, so a phone user can't see that the dialog pages. · Lower the image `max-height` (about 34dvh), or pin the step row to the panel foot on narrow screens.
- P7 · [ui] · 18/19 reduced motion · The static rows have different tile heights (top about 260px, bottom about 195px), so the static grid reads as two unrelated strips rather than the matched rows of the drifting version. · Use one row height in the static layout and let tiles keep their aspect ratio.
- P7 · [process] · 12-studio-prefill.png · The studio prefill was proved with a test fixture (`A fox <b>bold</b> in snow`). No shot shows a real showcase prompt arriving in the studio from "Try this prompt", which is what the acceptance requires. The escaping is correct and not a defect. · Add one shot: open a tile, then "Try this prompt", then the studio with that prompt filled in and Generate idle.
- P7 · [process] · 01, 03, 13, 14 and 15 (22:41–22:46) still show the old hint ("Point at or tab to any image…"), while 20-label-hint-\* shows the new one ("…Click it to see it larger."). The rest-state shots predate the final source. · Re-shoot 01, 13 and 15 together with the BLOCKING re-shoot.

## Summary

- The dialog is the best part of the phase: image on the left, the prompt set in the display serif as the focal point, then a single gold "Try this prompt", a quiet outline "Copy prompt" and reassuring copy that nothing runs. Previous/next and the "Arrow keys also work" hint sit below a hairline. It reads as an atelier and stays on palette.
- The rows keep their rhythm after drag and horizontal wheel (02, 04). The GL tiles follow the DOM offset with no visible drift (02, 15 no-WebGL match). Keyboard focus shows a clear copper ring and keeps the label in sync (10).
- Blocker: a tile focused by the mouse stays revealed while another tile is hovered, so the row shows two focal points and the label describes the wrong tile (seen in 09 and 03; mechanism from source).
- Evidence: the BLOCKING item and the dialog, toast and mobile advisories are confirmed in screenshots. The mechanism and fix lines are inferred from source.
- Keep: the dialog's hierarchy (serif prompt first, one gold action, the line saying nothing runs), the copper keyboard ring, the edge-to-edge drifting rows with the large serif prompt label below them, and no model name on tiles (owner decision).
