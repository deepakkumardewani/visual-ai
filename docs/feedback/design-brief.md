# Feedback UI — design brief

## 1. Summary

Three surfaces: a non-blocking rating popup shown after a good moment (3rd generation or a download), a "Send feedback" dialog from the user menu, and an admin triage page at `/admin/feedback`. Users are creators mid-flow; the admin is the owner triaging weekly.

## 2. Primary action

Popup: one tap on a rating. Dialog: write one honest message. Admin: scan, open an item, change its status.

## 3. Direction

Dark editorial, warm, human (DESIGN.md). Young Serif for titles only, Source Sans body, hairline borders, surface-1 cards, accent amber for selection, gold only for the primary CTA gradient (one per view). Light theme via the same semantic tokens. No emoji; ratings are numbers 1-5 in round buttons so they work as a real radio group.

## 4. Layout

- Popup: 22rem card, bottom-right (`right-4 bottom-4`) on desktop; full-width bottom sheet with top radius and safe-area padding below 640px. No overlay, no scroll lock, no focus trap (focus moves to the card on open, Esc and the close button dismiss, focus returns to the previously focused element).
- Dialog: AppModal 28rem; segmented Bug / Idea / Other, textarea with live counter, quiet context note, full-width gold CTA.
- Admin: header, summary strip (avg rating big serif number, count-by-type chips, open count), filter bar, then a two-column split (list left, sticky detail panel right); on mobile the detail replaces the list with a back button.

## 5. States

- Popup: rating -> branched step (optional text; 4+ adds quote-consent checkbox + optional display name) -> success (aria-live, auto-closes ~3s) ; error inline with retry; dismissed sends nothing.
- Dialog: idle, invalid (empty message, disabled submit), submitting, success (replaces form, closes on Done), error (inline alert, input preserved).
- Admin: loading skeleton rows, empty ("Nothing matches these filters"), error with retry, saving states on status / note, copied confirmation.

## 6. Interaction & motion

Popup enters with 250ms translate+fade (sheet slides up on mobile). Rating buttons: hover lift of colour only, selected = accent-subtle fill. Steps cross-fade 150ms. All transitions named properties (opacity, transform, colors), disabled under `prefers-reduced-motion`. Keyboard: radio group arrow keys (reuse SegmentedControl pattern), Enter submits, Esc closes.

## 7. Copy

- Rating: "How is Visual AI working for you?" labels 1 "Poor" .. 5 "Great".
- <=2: "What went wrong or what's missing?" ; 3: "What would make it better?" ; >=4: "What do you love?" + "You can quote me on the website".
- Success: "Thanks, that genuinely helps." Dialog title "Send feedback"; context note "We'll include your current page, browser and plan."
- Errors: "Couldn't send that. Your message is still here, try again."

## 8. References

interaction-design, motion-design, spatial-design (responsive sheet).

## 9. Open questions (decided)

- creditsTier = bucket of remaining credits (empty/low/ample) since no tier concept exists.
- Admin detail on mobile is a stacked view, not a drawer.
