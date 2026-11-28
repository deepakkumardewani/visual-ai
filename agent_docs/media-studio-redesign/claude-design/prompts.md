# Paste-ready prompts for Claude Design

Run these in order, in one Claude Design project, so later prompts can reuse the system and frame from Prompt 0. `attachments.md` lists what to attach for each prompt. Every prompt relies on `brief.md` and `design-system.md`, so the prompts stay short.

The same rules apply to every prompt, and Prompt 0 states them once:
- **Artboards:** for every state, draw dark at 1440×900 and at 375×812. Draw light at both widths for the states marked (L).
- **Name artboards** `<screen>--<state>--<width>--<theme>`, for example `music-studio--default--1440--dark`, so they map onto `design/shots/` later.
- **Motion table:** each screen ends with one markdown table with exactly this header:
  `| ID | Element | Trigger | Property | Duration | Easing | Reduced-motion fallback |`
  The IDs are M1, M2, …, unique per screen. Property is transform and/or opacity only. Durations are 150 to 400ms. The easing is `cubic-bezier(0.16,1,0.3,1)`. Every row has a fallback.

---

## Prompt 0: design system and shared studio frame

> Set up the design system for **Visual AI**, a warm, dark-first creative app, from the attached `design-system.md`. Use its exact colour tokens in both themes (dark is the default), Young Serif at 400 only for display, Source Sans 3 for UI, and its radii, shadows, motion and icon style. Invent no other brand values. Then read the attached `brief.md`. It holds the product, the frame, the content roster, the exact strings and the "Do not" list, and is the source of truth for every later prompt.
>
> **Build the shared component sheet first**, as one artboard per theme at 1440. It covers: the composer (idle, focused, generating with the same geometry, disabled with a reason, hero variant); pill + popover (rest, hover, press, open, disabled); cost badge; model picker modal with live settings and no empty band; track row (rest, hover, now playing, pending, new, "Couldn't load audio" error, selected, renaming); sleeves for every roster asset at 40, 48 and 160px; waveform (placeholder, loaded, playing); the bottom player (desktop and 375 two-row; playing, paused, "Tap to play"); bottom sheet; toast; error card with the exact R9 copy. Treat this sheet as the single source of truth: every later screen reuses these components and sleeves unchanged.
>
> **Then design `studio-frame`**, shown with Music content. Distinctive idea: the composer starts as a centred instrument in an empty room and docks left (520px) on the first take, and the right side becomes a record shelf. States: default (L), empty/hero (L), loading, settling, generating, success, error, popover, model-picker.
>
> Artboards: every state at 1440×900 and 375×812 in dark, plus light for the (L) states. At 375, show the Create / Library switch and the sticky Generate bar above the compact player.
>
> For every interaction (hover, press, selection, arrival, the hero-to-dock settle, popover/picker open), add a row to a motion table with exactly this header: `| ID | Element | Trigger | Property | Duration | Easing | Reduced-motion fallback |`.
>
> **Self-check before you finish:**
> - The player track equals the row marked playing in every artboard.
> - No label wraps ("Generate" stays one line in every state).
> - The composer is the same height idle and generating.
> - The picker has no empty band, and "Use model" is on one line.
> - The error says "No credits were used." with "Try again".
> - Nothing is hidden behind the sticky bar at 1440×900 or 375×812.
> - There are no dashed boxes and no gradient text.
> - Only token colours are used.

---

## Prompt 1: music-studio

> Using the system, component sheet and frame from Prompt 0 and `brief.md` §4.2, design **music-studio**. Distinctive idea: a **sound palette**. Mood, genre and length chips sit under one large prompt and tint a live **record-sleeve preview**, so the track has a face before Generate. The chips are tactile. Each selected chip is marked by a check and a wash, not colour alone. The sleeve preview uses only the copper/gold/umber family. The right pane is the Library pre-filtered to Music (Music 24), with Porch light loop playing.
>
> States: default (L), empty/hero (L, with an empty-sleeve hint), loading, generating, success (25, new take ready, not playing), error, genre-popover, track-detail, editor. Artboards: every state at 1440 and 375 in dark, plus light for (L).
>
> Add the motion table (same header) with a hover, press, selection and arrival row for each interactive element, including chip select, sleeve tint change, popover open, row hover/press and the arrival stagger.
>
> Self-check: the same as Prompt 0. In addition:
> - The sleeves match the component sheet exactly.
> - No pill or chip label wraps at 375; the chip rows scroll horizontally.

---

## Prompt 2: song-studio

> Design **song-studio** (`brief.md` §4.3) on the same frame. Distinctive idea: a **songwriter's lyric sheet**. Each section is a labelled block with a copper margin rule. A **structure strip** of compact tokens (I · V1 · C · V2 · C · B · C · O, each with its rule colour, plus a visible "+") fits in the 520px column, and you can jump to and reorder sections from it. At 375 the strip is a horizontal scroller with an edge fade and the active part in view. The lyrics panel has collapse, fullscreen, undo, redo, a "420 / 600" counter and a lyrics-mode pill. A collapsible Styles panel holds tag chips and a "Your sound" summary. Windows down to Lonavala is playing (1:12 / 2:58).
>
> States: default (L), empty/hero (L), loading, generating, success, error, lyrics-mode, lyrics-expanded, track-detail. Artboards: every state at 1440 and 375 in dark, plus light for (L). The sticky Generate bar is visible at 375 without scrolling the lyrics.
>
> Add the motion table (same header) with a hover, press, selection and arrival row for each interactive element, including section add/reorder, strip jump, collapse/expand, undo/redo press, and the arrival.
>
> Self-check (Prompt 0 list), plus:
> - The strip never clips mid-word.
> - The "+" is visible.
> - Undo and redo show their disabled states.

---

## Prompt 3: speech-studio

> Design **speech-studio** (`brief.md` §4.4). Distinctive idea: a **casting call**. The script is a **manuscript page**, capped at about 300px with internal scroll, with delivery cues set inline like stage directions. A strip of **voice cards** shows name, a traits line ("warm · female · US") and an audition play button. The selected card is marked by shape and a "Cast" label. One card has a disabled play button with "Preview not available". A voice avatar is either a sleeve or an initial, never both. Small Rooms, ep. 14 intro is playing (0:09 / 0:42).
>
> States: default (L), empty/hero (L), loading, generating, success, error, audition (L), cue-menu, model-picker (the details side shows this model's voices as mini cards and the live cost for this script). Artboards: every state at 1440 and 375 in dark, plus light for (L).
>
> Add the motion table (same header) with a hover, press, selection and arrival row for each interactive element, including card hover, select, audition press, the now-playing indicator, cue insert, and the arrival.
>
> Self-check (Prompt 0 list), plus:
> - At 1440×900 the whole voice-card row (name, traits, play, "Cast") sits above the Generate bar.
> - "Use model" is on one line.

---

## Prompt 4: video-studio

> Design **video-studio** (`brief.md` §4.5). Distinctive idea: a **screening room**. The newest take (Saffron Skyline) sits on a big 16:9 stage with a **reel** of takes below it and the selected one highlighted. The composer reads like a **director's slate**: Text / Image / Audio mode tabs, then pills for model, resolution, duration and aspect, then "Try cheap first" with the credits it saves (no orphan words). The composer column is exactly 520px. Generating shows the job stages inside the stage and cross-fades to the poster. The bottom player shows Porch light loop paused.
>
> States: default (L), empty/hero (L, with a letterboxed stage silhouette), loading, generating, success, error, image-input, settings-popover, model-picker. Artboards: every state at 1440 and 375 in dark, plus light for (L).
>
> Add the motion table (same header) with a hover, press, selection and arrival row for each interactive element, including reel select, the poster to video cross-fade, mode-tab change, pill open, and the arrival on stage.
>
> Self-check (Prompt 0 list), plus:
> - The column is 520px.
> - "Generate" stays one line, with the same geometry idle and generating.

---

## Prompt 5: tool-image-watermark and tool-video-watermark

> Design two tools (`brief.md` §4.6–4.7). Use stage-first layouts: at 1440, settings sit in a compact inspector row; at 375, a sticky pill bar opens a **bottom sheet** with grab handle.
>
> **tool-image-watermark.** The photo ("Paper boats") is the control surface. You drag the mark onto it and a **9-point anchor grid** ghosts in to snap it, with no chip covering an anchor dot. Size and opacity sliders show value readouts, and the inspector labels share a baseline. There is a before/after toggle, and the rail thumbnails show the mark. States: default (L), empty (drop stage), loading, generating, success, error, dragging, settings-sheet (375, L).
>
> **tool-video-watermark.** Placement is **fixed by the tool**, and only text and size change. Make the honest proof the layout: a **contact sheet**. A filmstrip of 5 sampled frames from "Kites over Ahmedabad" shows each frame stamped with the mark at its true placement and scale. Corner crop marks on the stage are labelled "Fixed by this tool". A size ruler shows the mark at true scale against the output resolution. The transport bar sits below the frame, so nothing overlaps the mark. In success, the strip becomes the "after" proof. It must not resemble Autocaption: no transcript, a different clip, a different structure. States: default (L), empty, loading, generating, success, error, settings-sheet (375, L).
>
> Artboards: every state at 1440 and 375 in dark, plus light for (L). Add one motion table per tool (same header) with a hover, press, selection and arrival row for each interactive element, including drag/snap, slider thumb, sheet rise, toggle, filmstrip update on size change, and the arrival.
>
> Self-check (Prompt 0 list), plus:
> - No settings sit inline at 375.
> - The mark is never covered.
> - The success counts match the tiles.

---

## Prompt 6: tool-autocaption and tool-sketch

> Design two tools (`brief.md` §4.8–4.9), using the same stage-first and bottom-sheet rules as Prompt 5.
>
> **tool-autocaption.** The stage plays "Last train to Dadar" with burned-in captions. Beside it, the transcript runs as **timestamped lines that light up as they are spoken**. Each line is a seek target, and there is a download action. States: default (L), empty, loading, generating, success, error, settings-sheet (375, L; style, position, language).
>
> **tool-sketch.** A **drafting table** with a Draw / Upload segmented control. Draw has brush, eraser, size, undo/redo and clear. Upload takes JPG/PNG/WEBP, with Remove. The result is compared through a draggable, keyboard-focusable **before/after divider**. The prompt matches the drawing. The pane shows "This session" sketch results first. States: default (L), empty, loading, generating, success, error (two variants: an upload validation error, and a generation failure with the R9 copy), upload, settings-sheet (375, L).
>
> Artboards: every state at 1440 and 375 in dark, plus light for (L). Add the motion tables (same header) with a hover, press, selection and arrival row for each interactive element, including line highlight, seek, divider drag, Draw/Upload switch, sheet rise, and the arrival.
>
> Self-check (Prompt 0 list), plus:
> - The two tools look nothing like each other or like the video watermark tool.
> - The before/after divider shows a focus state.

---

## Prompt 7: library

> Design **library** (`/library`, formerly Assets; `brief.md` §4.10). Give it the same weight as the composers. Distinctive idea: a **record collection**. Audio is a track list with roster sleeves and real-looking waveforms. Visuals are a **wall of prints** (masonry). Select mode turns items into checkable sleeves and an **action bar rises** with the count plus Download, Favourite and Delete. It has tabs with counts (All 247, Images 186, Videos 16, Music 24, Songs 12, Speech 9), search, sort and a Favourites pill. The All tab is grouped by date, with an album strip on All and Images only. Porch light loop is playing, and its row matches the player.
>
> States: default (L), loading, empty (the Songs tab with **no count** on Songs, header total 235, one action "Open Song studio"), error (Retry), success, songs (L), images, select (L), menu, rename, confirm, no-results. Artboards: every state at 1440 and 375 in dark, plus light for (L). At 375 the rows collapse to sleeve, title, duration, play and overflow, and the bar rises above the player.
>
> Add the motion table (same header) with a hover, press, selection and arrival row for each interactive element, including tab change, row and card hover, favourite toggle, select-mode entry, the rising bar, rename commit, and toast.
>
> Self-check (Prompt 0 list), plus:
> - Each asset's sleeve is identical to the earlier screens.
> - Empty tabs show no number.
> - Long titles end in an ellipsis without growing the row.
> - Images have no rename.
