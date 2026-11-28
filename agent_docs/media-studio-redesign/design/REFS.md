# media-studio-redesign: references

Inspiration only. We borrow an idea from each one and never copy its layout wholesale, its copy, its images or its brand. Everything is rebuilt in this app's own tokens: the warm palette, Young Serif with Source Sans 3, and copper accents.

The image files are in `refs/<screen>/`, which is gitignored because they are third-party images. Every screen folder except `library` also has `00-existing-<name>.png` (no screenshot of `/assets` was supplied), a screenshot of the current app supplied by the user. Those are dark mode only, because the running dev app renders a blank page (see the ASSUMPTIONS note in the gallery). They show what we are replacing, so they are not listed as references in the tables below. Suno and Artlist screenshots were also supplied by the user. Dribbble shots were captured from public shot pages.

## studio-frame

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Suno (user-supplied) | https://suno.com | refs/studio-frame/01-suno-split.png | layout | Create on the left and your generations on the right, both visible at once. |
| 2 | Artlist (user-supplied) | https://artlist.io | refs/studio-frame/02-artlist-hero.png | layout | A centred hero composer for the first visit, with its pill controls in one row under the prompt. |
| 3 | Dribbble | https://dribbble.com/shots/27140962 | refs/studio-frame/03-dribbble-prompt-input.png | control style | A prompt box whose settings live inside its own footer, not in a separate form. |
| 4 | Dribbble | https://dribbble.com/shots/27874437 | refs/studio-frame/04-dribbble-video-dashboard.png | motion | Calm progress inside the result list, so a pending job reads as a row that is filling in. |

## music-studio

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Artlist (user-supplied) | https://artlist.io | refs/music-studio/01-artlist-pills.png | control style | Compact pills with an "Auto" value (Auto duration, Auto genre) instead of dropdowns. |
| 2 | Artlist (user-supplied) | https://artlist.io | refs/music-studio/02-artlist-duration-popover.png | control style | A small glass popover anchored to its pill, used for one setting at a time. |
| 3 | Artlist (user-supplied) | https://artlist.io | refs/music-studio/03-artlist-model-sheet.png | layout | A model sheet with a list on the left and details plus "Use model" on the right. |
| 4 | Dribbble | https://dribbble.com/shots/27663006 | refs/music-studio/04-dribbble-music-generator.png | control style | Mood and genre as tappable chips, each with a small colour swatch. |
| 5 | Dribbble | https://dribbble.com/shots/27811306 | refs/music-studio/05-dribbble-orbit.png | motion | Cover art that settles in on arrival, so a finished track feels like it landed. |

## song-studio

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Suno (user-supplied) | https://suno.com | refs/song-studio/01-suno-lyrics.png | layout | Lyrics first, with section tags like [Verse] and [Chorus] that you write inline. |
| 2 | Suno (user-supplied) | https://suno.com | refs/song-studio/02-suno-crop-menu.png | control style | A grouped action menu where each item has a one-line description. |
| 3 | Dribbble | https://dribbble.com/shots/14550491 | refs/song-studio/03-dribbble-rhyme.png | layout | A writing surface that feels like a page rather than a textarea. |
| 4 | Dribbble | https://dribbble.com/shots/27624264 | refs/song-studio/04-dribbble-music-app.png | control style | Track rows with square cover art, the title and a waveform scrubber on one line. |

## speech-studio

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Dribbble | https://dribbble.com/shots/26959289 | refs/speech-studio/01-dribbble-voicee.png | control style | Voice cards with a play button for auditioning before you choose. |
| 2 | Dribbble | https://dribbble.com/shots/26469931 | refs/speech-studio/02-dribbble-hearify.png | layout | A script panel with a toolbar of delivery cues above the text. |
| 3 | Dribbble | https://dribbble.com/shots/26029688 | refs/speech-studio/03-dribbble-tts-app.png | control style | Voice traits shown as short descriptors ("warm", "calm") under each name. |
| 4 | Dribbble | https://dribbble.com/shots/27335156 | refs/speech-studio/04-dribbble-audio-chat.png | motion | Small equaliser bars that show which voice is playing right now. |

## video-studio

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Dribbble | https://dribbble.com/shots/27874437 | refs/video-studio/01-dribbble-video-dashboard.png | layout | One large preview stage, with the takes as a strip of thumbnails underneath. |
| 2 | Dribbble | https://dribbble.com/shots/26882414 | refs/video-studio/02-dribbble-shot-plan.png | control style | Shot settings (duration, aspect, quality) as compact chips beside the prompt. |
| 3 | Dribbble | https://dribbble.com/shots/26836280 | refs/video-studio/03-dribbble-video-mobile.png | layout | On mobile the stage stays on top and the controls stack below it. |
| 4 | Dribbble | https://dribbble.com/shots/26467849 | refs/video-studio/04-dribbble-video-website.png | motion | The poster cross-fades into the playing video instead of jumping. |

## tool-image-watermark

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Dribbble | https://dribbble.com/shots/26490911 | refs/tool-image-watermark/01-dribbble-watermark-app.png | layout | The photo is the main surface and the controls are a thin strip under it. |
| 2 | Dribbble | https://dribbble.com/shots/27808895 | refs/tool-image-watermark/02-dribbble-watermark-pro.png | control style | A nine-point position grid as a tiny visual picker. |
| 3 | Dribbble | https://dribbble.com/shots/27510921 | refs/tool-image-watermark/03-dribbble-photo-editor.png | control style | Slim sliders with a value readout for size and opacity. |
| 4 | Dribbble | https://dribbble.com/shots/6686901 | refs/tool-image-watermark/04-dribbble-canvas-drag.png | motion | Dragging an object on the canvas with snap guides that fade in while you drag. |

## tool-video-watermark

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Dribbble | https://dribbble.com/shots/27510921 | refs/tool-video-watermark/01-dribbble-photo-editor.png | layout | The media takes the stage and the settings sit in an inspector bar under it. |
| 2 | Dribbble | https://dribbble.com/shots/27808895 | refs/tool-video-watermark/02-dribbble-watermark-pro.png | control style | A live sample of the mark at its real size, beside the size control. |
| 3 | Dribbble | https://dribbble.com/shots/26882414 | refs/tool-video-watermark/03-dribbble-shot-plan.png | control style | A compact stepper for a numeric value instead of a bare number input. |
| 4 | Dribbble | https://dribbble.com/shots/27874437 | refs/tool-video-watermark/04-dribbble-video-dashboard.png | motion | Progress on the stage itself, with named steps, while the video is processed. |

## tool-autocaption

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Dribbble | https://dribbble.com/shots/27205781 | refs/tool-autocaption/01-dribbble-animated-subtitles.png | control style | Captions shown burned into the frame, with the spoken word highlighted. |
| 2 | Dribbble | https://dribbble.com/shots/16310548 | refs/tool-autocaption/02-dribbble-subbxi.png | layout | A timestamped transcript beside the video, where each line is a seek target. |
| 3 | Dribbble | https://dribbble.com/shots/15869602 | refs/tool-autocaption/03-dribbble-type-studio.png | motion | The current transcript line lights up as playback reaches it. |
| 4 | Dribbble | https://dribbble.com/shots/26467849 | refs/tool-autocaption/04-dribbble-video-website.png | layout | A large rounded video stage with a minimal control bar laid over it. |

## tool-sketch

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Dribbble | https://dribbble.com/shots/5333094 | refs/tool-sketch/01-dribbble-painting-app.png | control style | A floating vertical tool rail with brush, eraser and dot-sized brush widths. |
| 2 | Dribbble | https://dribbble.com/shots/23022086 | refs/tool-sketch/02-dribbble-one-eye.png | layout | A dotted paper canvas that reads as a drawing surface, not a file input. |
| 3 | Dribbble | https://dribbble.com/shots/6686901 | refs/tool-sketch/03-dribbble-canvas-drag.png | motion | A draggable before/after divider that responds physically to the pointer. |
| 4 | Dribbble | https://dribbble.com/shots/27188344 | refs/tool-sketch/04-dribbble-prompt-states.png | control style | A one-line pill prompt bar with the style choice and the action inside it. |

## library

| # | Site | URL | File | Borrow | What we borrow |
|---|---|---|---|---|---|
| 1 | Dribbble | https://dribbble.com/shots/27919925 | refs/library/01-dribbble-lumen-library.png | layout | Type tabs with counts above one scrolling collection. |
| 2 | Dribbble | https://dribbble.com/shots/26809044 | refs/library/02-dribbble-media-library.png | layout | Mixed media grouped by date, with visuals and audio in their own forms. |
| 3 | Dribbble | https://dribbble.com/shots/14125304 | refs/library/03-dribbble-tide-light.png | control style | Audio rows with cover, title, waveform and duration, quiet until hovered. |
| 4 | Dribbble | https://dribbble.com/shots/14150963 | refs/library/04-dribbble-tide-dark.png | control style | The same rows in dark mode, where the now-playing row is tinted rather than outlined. |
| 5 | Suno (user-supplied) | https://suno.com | refs/library/05-suno-my-songs.png | layout | A "My Songs" list that reads like a collection, with a sleeve per track. |
| 6 | Suno (user-supplied) | https://suno.com | refs/library/06-suno-action-menu.png | control style | A grouped overflow menu with a description under each action. |
