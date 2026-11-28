# Brief: Visual AI media studios redesign ("a record collection, not a form")

Attach this brief together with `design-system.md`. Every colour, font, radius, shadow and duration comes from `design-system.md`. Do not invent brand values.

## 1. Outcome

Visual AI's Song, Music, Speech and Video studios, its four tools and its Assets page all use one generic template today: a stacked form on the left, a dashed "Your first X" box on the right, tall full-width model cards and a full-width voice list. The result reads as generic AI output. Redesign the **9 studio screens** and turn Assets into a **Library**. Two goals:
- Each studio is recognisable from its layout alone, even with labels masked.
- The composer **and** the collection both reach a "joy" bar.

No new AI capabilities are added.

**User.** Creators and hobbyists who make songs, music, speech, video and tool outputs. They work in focused evening sessions on desktop, sometimes on a phone. They want to start quickly, then find, replay and manage what they made.

## 2. Shared frame (every studio)

- **Desktop, 1024px and wider.** The composer column on the left is exactly **520px** in every studio, Video included. This studio's generations fill the right column, which scrolls on its own. A persistent **bottom player** spans the full width.
- **Empty (zero generations for this studio).** A centred **hero composer** in an empty room, with a short Young Serif heading, the pill row and 2 to 3 example prompt chips. There is no right pane. Each studio's hero carries one medium-specific hint: an empty sleeve for Music, a blank lyric sheet edge for Song, a manuscript page for Speech, a letterboxed stage silhouette for Video. For the tools, the hero is the stage itself (drop zone or blank canvas) with pills attached.
- **First take.** When the first job starts, the hero docks left in 350 to 400ms and the right becomes a record shelf with a pending row. Typed text and options are kept. If that first job fails, the split stays and shows the error.
- **Loading.** A quiet placeholder (no shimmer) cross-fades to the hero or the split. The hero never shows while data loads.
- **Mobile, 375.** A Create / Library segmented switch sits at the top, with the composer first. A **sticky action bar** (model pill, Generate, cost badge) is pinned directly above the compact player through `--mini-player-h`. There is no horizontal scroll and targets are at least 44px.
- **Tools at 375.** A compact sticky pill bar sits under the stage, holding the 1 to 2 key pills and the action with its cost. A "Settings" pill opens a **bottom sheet** with grab handle that holds the full settings. Nothing stacks inline.
- **Pills.** Each pill shows its value ("Auto duration", "Auto genre"). Popovers are non-modal and become bottom sheets on touch. The **model picker** is a modal at 1440 and a bottom sheet at 375: list on the left; details, limits and **that model's settings** with a live cost on the right; a primary "Use model". The picker sizes to its content with no empty band.
- **Bottom player.** It shows sleeve, title, studio label, prev/play/next, waveform scrubber, elapsed/total, volume and close. At 375 it has two rows. It is audio only. Video plays on its own stage.
- **Existing pieces kept.** The cost badge beside Generate, the insufficient-credits state, job progress stages, the error card, the handoff menu and the shortcuts popover.

## 3. Canonical content roster (use in EVERY artboard)

The same asset must look identical everywhere: in studio panes, the Library, track detail and the player. Draw each sleeve from the recipe below. Do not improvise sleeves.

| Asset | Studio · model | Length | Prompt | Sleeve recipe (copper/gold/umber only) |
|---|---|---|---|---|
| Porch light loop | Music · Stable Audio 2.5 | 2:00 | Warm lo-fi hip hop, dusty Rhodes | Low gold sun disc on an umber ground, one copper horizon line |
| Monsoon over Pune | Music · Stable Audio 2.5 | 3:00 | Ambient sitar drone with rain texture | Vertical rain hairlines in ink-muted over a copper-to-umber field |
| Arcade after dark | Music · Stable Audio 2.5 | 3:10 | Synthwave arcade, 100 BPM | Three stacked copper chevrons on near-black, gold top chevron |
| Windows down to Lonavala | Song · Minimax Music 2.6 | 2:58 | Indie road-trip pop, hand claps | Diagonal gold band across an ember square, small umber circle |
| Letters I never sent | Song · Minimax Music 2.6 | 3:24 | Soft piano ballad, female vocal | Off-centre gold.muted ring on a surface-3 ground |
| Small Rooms, ep. 14 intro | Speech · Inworld TTS 2.0 | 0:42 | Podcast intro, warm host | Concentric gold rings, centred, on umber |
| Product tour voice-over | Speech · Inworld TTS 2.0 | 1:15 | Calm explainer | Two overlapping copper quarter-circles, bottom-left |
| Saffron Skyline | Video · Wan 3 · 720p | 0:08 | Dusk timelapse over a city skyline | Real poster: dusk skyline (photographic) |
| Last train to Dadar | Video (Autocaption source) | 0:48 | Commuter talking on a platform | Real poster |
| Kites over Ahmedabad | Video (Video watermark source) | 0:24 | Rooftop kite festival | Real poster |
| Paper boats | Image (Image watermark source) | - | Children's paper boats in a rain puddle | Real photo |

- **Counts:** Music 24, Songs 12, Speech 9, Videos 16, Images 186, All 247. A success state adds exactly 1 (Music 24 becomes 25).
- **Now playing:** the bottom player and the row marked playing are **always the same track**: the same sleeve, title, studio label and elapsed time. Music and frame use Porch light loop at 0:46 / 2:00. Song uses Windows down to Lonavala at 1:12 / 2:58. Speech uses Small Rooms, ep. 14 intro at 0:09 / 0:42. On Video and the tools, the player shows Porch light loop **paused** and no row is marked playing. A success state shows the new take with a ready Play button and is never auto-playing.

## 4. Per-screen requirements, distinctive ideas and states

Every screen needs these states: **default, empty (hero), loading, generating, success, error**, plus the screen-specific states listed with it. Each state is drawn at 1440×900 and 375×812.

1. **studio-frame** (shown with Music content). Idea: the composer starts as a centred instrument in an empty room and docks left on the first take, and the right side becomes a record shelf. Extra states: settling (mid-dock), popover, model-picker.
2. **music-studio** (`/audio/music`). Idea: a **sound palette**. Mood, genre and length chips sit under one large prompt and tint a live **record-sleeve preview**. Pills: model, Auto duration, Auto genre, Auto mood. Extra states: genre-popover, track-detail (large sleeve, prompt, tags, waveform editor entry, actions), editor.
3. **song-studio** (`/audio/song`). Idea: a **songwriter's lyric sheet**. Section blocks (Intro, Verse, Chorus, Bridge, Outro) each have a programmatic label and a copper margin rule. A **structure strip** (compact tokens I · V1 · C · V2 · C · B · C · O plus a visible "+") lets you jump and reorder, and it fits in 520px. At 375 it becomes a horizontal scroller with an edge fade. The panel has collapse, fullscreen, undo and redo, a "420 / 600" counter, and a lyrics mode pill (Write myself / Auto lyrics / Instrumental). A separate collapsible Styles panel holds tag chips and a "Your sound" summary. Extra states: lyrics-mode, lyrics-expanded, track-detail.
4. **speech-studio** (`/audio/speech`). Idea: a **casting call**. The script is a **manuscript page** with inline delivery cues like stage directions, capped at about 300px with internal scroll. A strip of **voice cards** (name, traits line "warm · female · US", audition play button) can be auditioned. The selected card is marked by shape and a "Cast" label. A voice with no clip shows a disabled play button with "Preview not available". At 1440×900 the full card row must sit above the Generate bar. Extra states: audition, cue-menu, model-picker (fill the pane with this model's voices as mini cards and the live cost).
5. **video-studio** (`/video`). Idea: a **screening room**. The newest take sits on a big 16:9 stage, with a **reel** of takes below and the selected one highlighted. The composer reads like a **director's slate**: mode tabs Text / Image / Audio, then pills for model, resolution, duration and aspect, then "Try cheap first" with the credits it saves. Generating shows the job stages inside the stage. The composer column is 520px. Extra states: image-input, settings-popover, model-picker.
6. **tool-image-watermark**. Idea: **the photo is the control surface**. Drag the mark onto the photo, and a **9-point anchor grid** ghosts in to snap it. Size and opacity sliders, a before/after toggle. Rail thumbnails show the mark. Extra states: dragging, settings-sheet (375).
7. **tool-video-watermark**. **New idea: a contact sheet / proof.** The tool's placement is fixed, and only the text and its size can be changed. Under the stage sits a filmstrip of 5 sampled frames from "Kites over Ahmedabad", each stamped with the mark at its true placement and scale. The locked zone on the stage is drawn as corner crop marks labelled "Fixed by this tool". A size ruler shows the mark at true scale against the output resolution. The transport bar sits **below** the frame, so nothing covers the mark. In success, the strip becomes the "after" proof. It must not look like Autocaption: no transcript, a different clip, a different layout. Extra state: settings-sheet (375).
8. **tool-autocaption**. Idea: **subtitles as a script**. The stage plays "Last train to Dadar" with captions burned in. Next to it, the transcript runs as **timestamped lines that light up as they are spoken**, and each line is a seek target, with a download action. Extra state: settings-sheet (375; style, position, language).
9. **tool-sketch**. Idea: a **drafting table**. A Draw / Upload segmented control sits at the top. The draw tools are brush, eraser, size, undo/redo and clear. Upload takes JPG/PNG/WEBP, has a Remove control, and replaces the file when a second one is dropped. The result is compared through a draggable, keyboard-operable **before/after divider**. The prompt matches the sketch. The pane lists "This session" sketch results first, then recent images. Extra states: upload, settings-sheet (375); error has two variants, an upload validation error and a generation failure with the R9 copy.
10. **library** (`/library`, formerly Assets). Idea: a **record collection**. Audio is a track list with procedural sleeves and real waveforms (columns: play, sleeve, title, waveform, duration, model, date, favourite, overflow; at 375: sleeve, title, duration, play, overflow). Visuals are a **wall of prints** (masonry). Select mode turns items into checkable sleeves, and an **action bar rises** with the count plus Download, Favourite and Delete. Tabs: All, Images, Videos, Music, Songs, Speech. Search "Search titles and prompts", sort (Newest, Oldest, Title A–Z, Favourites first, Longest on audio/video tabs) and a Favourites pill. All groups items by date: visuals grid plus an audio list section. Album strip only on All and Images. Extra states: songs, images, select, menu (Play, Open/Edit, Rename, Favourite, Download, Copy prompt, Reuse prompt in studio, Delete), rename (inline; empty rejected; no rename on images), confirm ("Delete 3 items?"), no-results (offers "Clear search").

## 5. Exact strings (verbatim from code; do not reword)

- **Error card (R9).** First the message, then the line **"No credits were used."**, then a button **"Try again"**. Messages: "Generation failed. Please try again." · "Generation failed." · "Generation took too long." · "This text can't be used. Try rephrasing it." · "Too many requests. Wait a moment and try again." · "The generation service is unavailable right now. Try again shortly." · "Could not reach the server. Check your connection and try again."
- **Job stages:** "Queued", "Composing", "Mastering", "Saving", and under them "You can leave this page; it will appear in History." (The word "History" is current code copy. Keep it and flag it, because the rename to Library may change it later.)
- **Player:** "Tap to play" (autoplay blocked).
- **Voice cards:** "Preview not available".
- **Audio row failure:** "Couldn't load audio" with **"Retry"**. Library load errors also use "Retry". The studio error card uses "Try again".
- **Sketch upload decode failure:** "Couldn't read this image".
- **Editor:** "This audio is too long to export in the browser." · "Your history is full. Delete something to save a new version."
- **Header nav** reads "Library". "Assets" appears nowhere.

## 6. Do not (from the design review's BLOCKING items, each with its root cause)

1. **The player must match the now-playing row.** Root cause: each screen was mocked with a different "sample" track in the player. Fix: follow the roster's now-playing rule.
2. **Labels never wrap.** "Generate another" widened the button, the pills stacked and the composer jumped 32px. "Use model" wrapped onto 2 lines. Root cause: labels changed per state with no `nowrap`. Fix: keep the label "Generate" in every state, make every button and pill `white-space: nowrap` with a min-width, and give the composer identical geometry from idle to generating.
3. **No dead regions.** The model picker had an empty band and a 3-row list in a tall sheet. Root cause: a fixed-height sheet with no settings in it. Fix: size it to content and fill the details side with the model's settings and live cost.
4. **The same sleeve per asset everywhere.** Root cause: each mockup drew its own art. Fix: use only the roster recipes.
5. **Empty tabs show no count.** "Songs 74" appeared beside "No songs on the shelf yet". Root cause: counts were copied from the default state. Fix: an empty tab shows its label with no number, and the header total excludes it. This overrides the review's "quiet 0" suggestion.
6. **Nothing hidden behind the sticky bar at 1440×900.** The voice cards were clipped. Root cause: the script surface grew without a cap. Fix: cap long editors with internal scroll, and check the full composer content above the action bar at 1440×900.
7. **The same column widths across studios.** Video used 460px. Root cause: a per-screen layout. Fix: 520px everywhere.
8. **Mobile Generate is sticky** above the compact player, and **tool settings at 375 sit in a bottom sheet**, never inline.
9. **Use the exact R9 copy.** "No credits were charged." is wrong. Use "No credits were used."
10. **Video watermark is not an Autocaption re-skin,** and **the transport bar never overlaps the watermark preview.**
11. The structure strip never clips mid-word ("Ou", "Bri") and keeps the "+" visible.
12. Success never auto-plays, and counts stay consistent (Music 24 becomes 25).

## 7. Anti-slop rules (from `.impeccable.md` and the UI floor)

- Images and media are the hero, and the chrome stays low-contrast. Copper and gold are rare: gold appears at most 3 times per viewport, and never as gradient text.
- No neon or cyan SaaS look, no glassmorphism, no backdrop blur, no gradient text, no purple gradients, no busy skeleton shimmer, no looping motion.
- Hairline borders over shadows. No cards nested in cards. No hand-drawn OS window chrome.
- Controls feel custom, not like default form elements. No emoji icons. Use one icon style only.
- Realistic content from the roster. No lorem, no "Jane Doe" or "Acme", no invented metrics, no buzzwords.
- Motion runs 150 to 400ms on opacity and transform only, focus rings are instant, and every motion has a reduced-motion fallback.
- No dashed placeholder boxes anywhere.

## 8. Out of scope

New AI features (extend, remix, stems), new models, voice cloning UI, audio or video albums, playlists and queues (no shuffle, repeat or "play next"), multi-track timeline editing, sharing and Explore, zip export, tags and folders, image rename and image titles, pricing and credit changes, and the image Create page and Explore feed.
