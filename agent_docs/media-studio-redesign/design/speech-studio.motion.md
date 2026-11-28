# Speech studio: motion spec

Easing token `ease-out-expo` = `cubic-bezier(0.16,1,0.3,1)`. Focus rings appear instantly and are not listed. Every row is built into `speech-studio.html`.

| ID | Element | Trigger | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|---|---|
| M1 | Settings pill | hover / press | opacity (wash), transform scale .97 | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M2 | Pill popover (desktop) / bottom sheet (375) | pill open / close | opacity, transform translateY(-4px) scale(.98) to none | 260ms (close 200ms) | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M3 | Pill chevron | popover open / close | transform rotate(180deg) | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M4 | Generate button | hover / press | transform translateY(-1px) / scale(.97), opacity (wash) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M5 | Track row | hover | opacity (wash) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M6 | Row play button over cover | row hover / focus | opacity, transform scale(.85) to 1 | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M7 | Favorite heart | toggle on | transform scale .7 to 1.12 to 1 | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M8 | Player play/pause | hover / press | transform scale(1.05) / scale(.93) | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M9 | Pending job row | job starts | opacity, transform translateY(8px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M10 | Job progress bar | stage / progress update | transform scaleX | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M11 | Result arrival: cover | job completes (once per new asset) | opacity, transform scale(.9) to 1 | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M12 | Result arrival: title + waveform | job completes, +60ms | opacity, transform translateY(8px) to none | 320ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M13 | Result arrival: duration, favorite, overflow | job completes, +120ms | opacity, transform translateY(8px) to none | 280ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M14 | Error card | job fails | opacity, transform translateY(8px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M15 | Toast | save / action result | opacity, transform translateY(10px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M16 | Model picker sheet + scrim | open | opacity, transform translateY(14px) scale(.985) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M17 | Model row | press / select | transform scale(.985), opacity (selected wash) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M18 | Voice card | hover / press | opacity (wash), transform scale(.97) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M19 | Voice card | cast (select) | opacity (selected wash + Cast label) | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M20 | Audition button | hover / press | transform scale(1.06) / scale(.92) | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M21 | Audition equaliser bars | preview playing (follows audio level, not looped) | transform scaleY | 160ms | cubic-bezier(0.16,1,0.3,1) | none, static bars |
| M22 | Cue button | press | transform scale(.95) | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M23 | Inserted cue chip | cue inserted in script | opacity, transform translateY(8px) to none | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M24 | Slash cue menu | type / | opacity, transform translateY(-4px) scale(.98) to none | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
