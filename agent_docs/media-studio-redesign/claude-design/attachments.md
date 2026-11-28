# Attachments per prompt

Attach the files in the order listed: the text files first, then the screenshots. Paths are absolute.

```
H=/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai/agent_docs/media-studio-redesign
SS=/Users/deepakdewani1/Desktop/screenshots/visualai-dev
SH=$H/design/shots
```

## What the screenshots are

| File | Shows |
|---|---|
| `$SS/visualai-1.png` | Current Sketch tool |
| `$SS/visualai-2.png` | Current Autocaption tool |
| `$SS/visualai-3.png` | Current Video watermark tool |
| `$SS/visualai-4.png` | Current Image watermark tool |
| `$SS/visualai-5.png` | Current Speech studio |
| `$SS/visualai-6.png` | Current Video studio |
| `$SS/visualai-7.png` | Current Song studio |
| `$SS/visualai-8.png` | Current Music studio |
| `$SS/visualai-9.png` | **Not a Visual AI screen:** the Artlist "Lyria 3 Pro" model sheet (list left, settings right, "Use model"). Its file name is misleading |
| `$SS/other-1.png` | Artlist: centred hero composer and the duration popover |
| `$SS/other-2.png` | Artlist: the "Auto …" pill row |
| `$SS/other-3.png` | Suno: create left, generations right; "My songs" list |
| `$SS/other-4.png` | Suno: grouped track action menu |
| `$SS/other-5.png` | Suno: lyrics with [Verse]/[Chorus] tags |

There is no screenshot of the current Assets/Library page.

The `$SH/*.png` files are our first-pass mockups at 1440×900. They are attached only for the one idea named beside each. **They contain known defects** (see brief.md §6), so add this line to the message when you attach them: "Mockup PNGs are for the named idea only; brief.md §6 overrides anything they show."

## Prompt 0: system and frame
1. `$H/claude-design/design-system.md` (also used to create the design system itself; see README)
2. `$H/claude-design/brief.md`
3. `$SS/other-3.png`: the split layout
4. `$SS/other-1.png`: the hero composer
5. `$SS/visualai-9.png`: the model-sheet structure (Artlist)
6. `$SS/visualai-8.png`: the current Music screen to replace
7. `$SH/studio-frame--settling--1440--dark.png`: the idea of the hero docking left

## Prompt 1: music-studio
1. `$H/claude-design/brief.md` (re-attach if the project doesn't keep it)
2. `$SS/other-2.png`: the Auto pills
3. `$SS/visualai-8.png`: the current screen
4. `$SH/music-studio--default--1440--dark.png`: the chip palette tinting the sleeve preview (**ignore the player**: it is the wrong track)
5. `$SH/music-studio--genre-popover--1440--dark.png`: the drill-in popover

## Prompt 2: song-studio
1. `$H/claude-design/brief.md`
2. `$SS/other-5.png`: inline section tags
3. `$SS/other-4.png`: the grouped action menu
4. `$SS/visualai-7.png`: the current screen
5. `$SH/song-studio--lyrics-expanded--1440--dark.png`: the lyric sheet with copper margin rules
6. `$SH/song-studio--default--1440--dark.png`: the structure strip idea (**it clips "Ou"; the fix is in the prompt**)

## Prompt 3: speech-studio
1. `$H/claude-design/brief.md`
2. `$SS/visualai-5.png`: the current screen
3. `$SH/speech-studio--audition--1440--dark.png`: voice cards with audition and the "Cast" label
4. `$SH/speech-studio--default--1440--dark.png`: the manuscript with inline cues (**the cards are clipped by the Generate bar; the fix is in the prompt**)

## Prompt 4: video-studio
1. `$H/claude-design/brief.md`
2. `$SS/visualai-6.png`: the current screen
3. `$SH/video-studio--success--1440--dark.png`: the stage plus the reel
4. `$SH/video-studio--default--1440--dark.png`: the director's-slate composer (**460px column; it must be 520**)

## Prompt 5: image and video watermark
1. `$H/claude-design/brief.md`
2. `$SS/visualai-4.png`: the current Image watermark
3. `$SS/visualai-3.png`: the current Video watermark
4. `$SH/tool-image-watermark--dragging--1440--dark.png`: drag plus the 9-point anchor grid

Do **not** attach any `tool-video-watermark--*` shot. That design was rejected as an Autocaption clone, and attaching it would anchor the model on it.

## Prompt 6: autocaption and sketch
1. `$H/claude-design/brief.md`
2. `$SS/visualai-2.png`: the current Autocaption
3. `$SS/visualai-1.png`: the current Sketch
4. `$SH/tool-autocaption--success--1440--dark.png`: the lit transcript beside the stage
5. `$SH/tool-sketch--success--1440--dark.png`: the before/after divider (**its prompt and pane content are mismatched; follow the brief**)

## Prompt 7: library
1. `$H/claude-design/brief.md`
2. `$SS/other-3.png`: the Suno "My songs" list
3. `$SS/other-4.png`: the action menu
4. `$SH/library--default--1440--dark.png`: sleeves, waveforms and the wall of prints
5. `$SH/library--select--1440--dark.png`: the rising select bar
6. `$SH/library--songs--1440--dark.png`: the track-list columns

## Size and count notes

- Each prompt has 4 to 7 attachments. Check the app's own per-message limit. If it is lower, drop the `$SH` shots first; the brief describes every idea in words.
- The `$SS` screenshots are retina captures, 1900 to 3700px wide and 0.1 to 1.2 MB. `other-3.png` (3670px, 1.1 MB) and `other-1.png` (1.1 MB) are the largest. If an upload is rejected or slow, make downscaled copies outside the repo, for example `mkdir -p ~/Desktop/cd-attach && sips -Z 1600 $SS/other-3.png --out ~/Desktop/cd-attach/`.
- The `$SH` shots are 1440×900 and 0.1 to 1.0 MB. The tool shots are the heaviest (about 1 MB).
- `$H/design/refs/` is gitignored third-party material. It duplicates the `$SS` files, so it is not needed here.
