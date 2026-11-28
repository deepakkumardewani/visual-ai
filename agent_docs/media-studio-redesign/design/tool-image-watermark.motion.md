# Image watermark: motion spec

Easing token `ease-out-expo` = `cubic-bezier(0.16,1,0.3,1)`. Focus rings appear instantly and are not listed. Every row is built into `tool-image-watermark.html`.

| ID | Element | Trigger | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|---|---|
| M1 | Drop zone | file dragged over | opacity (wash), transform scale(.99) | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M2 | Stage content | idle / uploading / generating / result change | opacity cross-fade | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M3 | Upload progress bar | upload progress | transform scaleX | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M4 | Slider thumb | hover / drag | transform scale(1.12) / scale(1.22) | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M5 | Generate button | hover / press | transform translateY(-1px) / scale(.97), opacity (wash) | 160ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M6 | Pending job card on stage | job starts | opacity, transform translateY(8px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M7 | Job progress bar | stage / progress update | transform scaleX | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M8 | Result in stage | job completes | opacity, transform scale(.9) to 1 | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M9 | New output card (right pane) | job completes, +60ms | opacity, transform scale(.9) to 1 | 380ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M10 | Output card | hover / press | transform scale(1.04) on image / scale(.98) on card | 160ms (image 380ms) | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M11 | Error card | job or validation fails | opacity, transform translateY(8px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M12 | Toast | result saved | opacity, transform translateY(10px) to none | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M13 | Watermark on stage | drag start / drop | transform scale(1.04) while held, translate follows pointer | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M14 | Anchor grid overlay | drag start / end | opacity 0 to 1 | 260ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
| M15 | Snapped anchor dot | pointer nears an anchor | transform scale(1.5), opacity (fill) | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M16 | Watermark | drop onto anchor | transform translate to anchor | 260ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M17 | Position grid button | select | transform scale(1.4) on dot; scale(.9) on press | 260ms (press 160ms) | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M18 | Before / after divider knob | hover / press | transform scale(1.08) / scale(.94) | 160ms | cubic-bezier(0.16,1,0.3,1) | none, instant |
| M19 | After layer | result arrives | opacity 0 to 1 | 380ms | cubic-bezier(0.16,1,0.3,1) | opacity only, 150ms |
