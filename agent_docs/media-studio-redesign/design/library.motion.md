# Library: motion spec

Easing token `ease-out-expo` = `cubic-bezier(0.16,1,0.3,1)`. Focus rings appear instantly and are not listed. Every row is built into `library.html`.

| ID | Element | Trigger | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|---|---|
| M1 | Type tab underline | tab change | transform scaleX(0) to 1 (old one 1 to 0) | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M2 | Tab panel content | tab change / sort / search results | opacity cross-fade | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M3 | Type tab | hover / press | opacity (wash), transform scale(.97) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M4 | Record row | hover | opacity (wash) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M5 | Record sleeve | row hover | transform rotate(-3deg) scale(1.04) | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M6 | Row play button | press | transform scale(.9) | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M7 | Now-playing equaliser bars | track playing (follows audio level, not looped) | transform scaleY | 160ms | cubic-bezier(0.16,1,0.3,1) | none, static bars |
| M8 | Print card image | hover / press | transform scale(1.04) / card scale(.985) | 380ms (press 160ms) | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M9 | Print card overlay | hover / focus-within | opacity 0 to 1 | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M10 | Favorite heart | toggle on | transform scale .7 to 1.12 to 1 | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M11 | Favorites filter chip | toggle | opacity (wash), transform scale(.95) on press, check scale(.4) to 1 | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M12 | Select check | select / deselect | transform scale(.4) to 1 and opacity on the tick | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M13 | Selected print / sleeve | select | transform scale(.94) image / scale(.9) sleeve | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M14 | Action bar | first item selected / select mode ends | opacity, transform translateY(16px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M15 | Overflow menu / bottom sheet (375) | open | opacity, transform translateY(8px) to none | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M16 | Confirm dialog + scrim | open | opacity, transform translateY(14px) scale(.985) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M17 | Deleted items | bulk delete confirmed | opacity 1 to 0, transform scale(.96) | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M18 | Inline rename field | enter rename | opacity (raised surface) 0 to 1 | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M19 | Rename error line | empty title rejected | opacity, transform translateY(-4px) to none | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M20 | New item in list | item arrives from a studio | opacity, transform scale(.9) to 1 | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M21 | Toast | bulk action / rename result | opacity, transform translateY(10px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M22 | Player play/pause | hover / press | transform scale(1.05) / scale(.93) | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
