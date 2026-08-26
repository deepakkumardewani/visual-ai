# UX Exploration: Prompt Save, Generate Info, AI Menu, Image Overlays

## 1. Prompt Save Flow

### Files

| File                                                                  | Role                                                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/web/src/components/Dashboard/Composer/PromptBar.vue`            | Hosts textarea + `PromptAiMenu` + `GenerateCTA`                |
| `apps/web/src/components/Dashboard/ModelPicker/PromptAiMenu.vue`      | Improve/Random chips + magic popover (Describe, Saved prompts) |
| `apps/web/src/components/Dashboard/ModelPicker/SavedPromptsPanel.vue` | Saved list + "Save current prompt" + naming form               |
| `apps/web/src/components/Dashboard/ModelPicker/PromptAiMenuItem.vue`  | Reusable menu row                                              |
| `apps/web/src/stores/savedPrompts.ts`                                 | `fetchPrompts`, `createPrompt`, `deletePrompt`                 |
| `apps/web/src/components/Dashboard/Composer/GenerateCTA.vue`          | Unrelated to save; adjacent in bar                             |

### Current flow

```
[Improve chip] [Random chip] [magic trigger ▼]
                                    ├─ Describe With AI
                                    └─ Saved prompts → sub-view
                                         ├─ Save current prompt (2nd click)
                                         ├─ name input (3rd click)
                                         └─ saved list
```

Save requires: magic → Saved prompts → Save current prompt → name → confirm.

### Proposed UX (reuse existing components)

**Option A — split Saved into two top-level items (recommended)**

- In `PromptAiMenu.vue` actions view, replace single "Saved prompts" row with:
  1. **Save prompt…** — `@click` sets `menuView='saved'` + `isNaming=true` (expose via prop/event on `SavedPromptsPanel`)
  2. **Saved prompts** — opens list view (`menuView='saved'`, list only)
- Add optional bookmark chip on `PromptBar.vue` (visible when `typingPrompt` non-empty) that opens save-naming directly.

**Option B — inline save from actions menu**

- Add `PromptAiMenuItem` "Save prompt" that toggles naming panel inline without navigating away from actions (embed compact naming UI above menu items).

Both keep `SavedPromptsPanel.vue` and store unchanged; only navigation/entry points change.

---

## 2. Remove Generate "i" Info Icon + Credit Modal

### Exact file

**`apps/web/src/components/Dashboard/Composer/GenerateCTA.vue`** — only location.

### Current structure

- Generate button shows label + coins badge (`generate-cta-credits`)
- Adjacent `Popover` trigger: `info-circle` (`data-testid="generate-cta-cost-info"`)
- Popover content: `generate-cta-cost-breakdown` dialog with model base × images × quality = total

### Script to remove

- `breakdownOpen` ref
- `creditBreakdown`, `showQualityMultiplier` computed (if unused after removal)
- `Popover` import
- `getGenerationCreditBreakdown` import (keep `getGenerationCreditCost` for badge)

### Keep

- Credit count badge on Generate button
- Low-credits title/aria-label behavior

---

## 3. Move Improve + Random Into Magic Dropdown

### Current location

**`apps/web/src/components/Dashboard/ModelPicker/PromptAiMenu.vue`**

- Improve + Random are **sibling chip buttons** outside the `Popover` (lines ~133–182)
- Popover only has Describe + Saved prompts

### Target structure

```
[magic trigger ▼]  (single visible control)
  ├─ Improve prompt
  ├─ Random prompt
  ├─ Describe With AI
  ├─ Save prompt…        (from §1)
  └─ Saved prompts
```

### Changes

1. **`PromptAiMenu.vue`**: Remove standalone Improve/Random `<button>` chips; add two `PromptAiMenuItem` rows in actions template reusing `handleImprove` / `handleRandom`.
2. **`PromptAiMenu.test.ts`**: Update tests — Improve/Random found inside panel after opening trigger, not as sibling chips.
3. **`PromptBar.vue`**: No structural change (already passes props/events).

Handlers (`improvePrompt`, `generateRandomPrompt`) and loading states stay in `PromptAiMenu.vue`.

---

## 4. Creations Image Overlay Icons

### Primary file

**`apps/web/src/components/History/ImageActionButtons.vue`**

### Consumers (overlay placement)

| File                                                             | Overlay position                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/web/src/components/History/History.vue`                    | Top-right column (`tw-items-start tw-justify-between`, actions top-right) |
| `apps/web/src/components/Dashboard/Feed/UserGenerationsGrid.vue` | Top-right (`tw-absolute tw-right-2 tw-top-2 tw-flex-col`)                 |

### Current icon order (top → bottom in column)

1. Share (`faLink`)
2. Copy prompt (`faCopy`) — if `hasPrompt`
3. Download (`faDownload`)
4. Favorite (heart)
5. **More actions** (`faEllipsis`) — submenu: Use as reference, Upscale, Remove BG, More like this
6. **Delete** (`faTrashAlt`) — **last / bottom**

### User request

Three-dots (ellipsis) should be at the **bottom**; trash is currently last.

### Change plan

**Option A — reorder only**

- In `ImageActionButtons.vue`: move Delete button **above** the `chainMenuRoot` ellipsis block so order ends with ellipsis.

**Option B — consolidate (cleaner)**

- Move Delete into ellipsis submenu as destructive last item.
- Single bottom control = ellipsis; reduces vertical stack height.

**Option C — move overlay to bottom of tile**

- In `History.vue` + `UserGenerationsGrid.vue`: change action container from `tw-top-2` to `tw-bottom-2` (and gradient from top to bottom if desired).

Recommend **A + C**: reorder so ellipsis is last, and anchor overlay row to bottom-right of tile.

---

## Implementation checklist

| #   | File                                     | Change                                             |
| --- | ---------------------------------------- | -------------------------------------------------- |
| 1   | `PromptAiMenu.vue`                       | Move Improve/Random into popover; split save entry |
| 2   | `SavedPromptsPanel.vue`                  | Support `initialView: 'save' \| 'list'` prop       |
| 3   | `GenerateCTA.vue`                        | Remove info Popover + breakdown logic              |
| 4   | `ImageActionButtons.vue`                 | Reorder or nest Delete under ellipsis              |
| 5   | `History.vue`, `UserGenerationsGrid.vue` | Optional: bottom-right overlay anchor              |
| 6   | `PromptAiMenu.test.ts`                   | Update selectors for new menu structure            |
