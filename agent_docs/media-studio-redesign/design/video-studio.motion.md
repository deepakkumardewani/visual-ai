# Video studio: motion spec

Easing token `ease-out-expo` = `cubic-bezier(0.16,1,0.3,1)`. Focus rings appear instantly and are not listed. Every row is built into `video-studio.html`.

| ID | Element | Trigger | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|---|---|
| M1 | Settings pill | hover / press | opacity (wash), transform scale .97 | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M2 | Pill popover (desktop) / bottom sheet (375) | pill open / close | opacity, transform translateY(-4px) scale(.98) to none | 260ms (close 200ms) | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M3 | Pill chevron | popover open / close | transform rotate(180deg) | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M4 | Generate button | hover / press | transform translateY(-1px) / scale(.97), opacity (wash) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M5 | Pending job row | job starts | opacity, transform translateY(8px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M6 | Job progress bar | stage / progress update | transform scaleX | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M7 | Result arrival: cover | job completes (once per new asset) | opacity, transform scale(.9) to 1 | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M8 | Error card | job fails | opacity, transform translateY(8px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M9 | Toast | save / action result | opacity, transform translateY(10px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M10 | Model picker sheet + scrim | open | opacity, transform translateY(14px) scale(.985) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M11 | Model row | press / select | transform scale(.985), opacity (selected wash) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M12 | Input tab (Text / Image / Audio) | select | opacity (selected surface), transform scale(.96) on press | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M13 | Draft switch thumb | toggle | transform translateX(16px) | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M14 | Draft switch | press | transform scale(.94) | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M15 | Stage poster | generating | opacity 1 to .22 (dim under job card) | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M16 | Stage result | job completes (cross-fade from job card) | opacity, transform scale(.9) to 1 | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M17 | Stage title + actions | job completes, +60ms | opacity, transform translateY(8px) to none | 320ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M18 | Reel card | hover | transform scale(1.04) on thumbnail, opacity (wash) | 380ms (wash 160ms) | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M19 | Reel card | press / put on stage | transform scale(.98); stage cross-fades to the card | 160ms (stage 380ms) | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M20 | New reel card | job completes | opacity, transform scale(.9) to 1 | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
