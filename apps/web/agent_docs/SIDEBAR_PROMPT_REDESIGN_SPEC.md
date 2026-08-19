# Sidebar & Prompt Bar Redesign Specification

## Problem Statement

The current sidebar and prompt interaction are functional but lack modern design polish and optimal usability:

1. **Sidebar** (Aside.vue + ControlRail.vue): Takes full height with no breathing room; model picker opens _inside_ the sidebar (dropdown), crowding the interface and reducing visibility of model options.
2. **Model logos**: Currently use icon strings; need to be replaced with custom brand/model logos.
3. **Model metadata**: "Budget" and "tag" chips clutter the model card UI.
4. **Prompt bar** (PromptBox.vue): Uses fixed textarea rows; placeholder has typewriter animation; buttons (AI prompt wand, Generate) stay on the right side even when text is long, pushing text awkwardly.
5. **Button styling**: Existing buttons are functional but not refined; need rounded, modern appearance while respecting existing design tokens.
6. **Model picker layout**: No clear "Featured" section; models are grouped by provider but lacking hierarchy.

## Goals (Success Criteria)

- [x] **Sidebar redesign**: Compact, minimal aesthetic (Leonardo.AI reference) with clear section icons; gaps from top/bottom; cleaner visual hierarchy.
- [x] **Model picker outside sidebar**: Opens as a lightweight popover (not modal) anchored to the Model button/row; dismissible via outside-click or Escape.
- [x] **Custom logos**: JPG/PNG logos copied to `apps/web/src/assets/models/` in kebab-case (e.g., `flux-pro.png`, `nano-banana-2.jpg`); referenced in Model objects via `iconUrl` field.
- [x] **Remove model clutter**: Delete "budget" and "tag" fields from model display.
- [x] **Model picker structure**: "Featured" heading at top with featured models; below that, all models grouped by company name with hover-reveal submenu on the right (hover-only interaction, known a11y gap).
- [x] **Compact prompt bar**: Starts small when empty; grows as text is entered; when prompt text is long, AI-prompt button and Generate button reflow to the line _below_ the text (not wrapping on the right).
- [x] **Static placeholder**: Remove typewriter animation; use simple, static placeholder text.
- [x] **Refined buttons**: Rounded edges, modern styling, consistent with existing design tokens (no divergent restyle).
- [x] **All prompt variants**: Apply compact + reflow redesign to ALL prompt-bar instances (create, colorize, upscale, revive-old) for consistency.

## User Stories

### Sidebar & Model Picker

1. As a user, I want the sidebar to feel spacious and modern, not cramped. The sidebar should not touch the edges; I should see breathing room from the top and bottom.
2. As a user, I want the model picker to open as a clear, dedicated overlay, not hidden inside a small dropdown. I should see the full list of models with their logos and be able to quickly scan and select.
3. As a user, I want to see featured models highlighted at the top, then browse all models grouped by company.
4. As a user, I hover over a company name and see that company's models in a submenu on the right for quick selection.

### Prompt Bar

5. As a user, I want the prompt input to be lightweight and not hog space when I have no text. The input should grow naturally as I type.
6. As a user, I want to see my full prompt text without it being squeezed. When my text gets long, the action buttons (AI prompt, Generate) should move _below_ the text so they don't crowd it.
7. As a user, I want a clean, simple prompt input experience without animated placeholders. A static placeholder is less distracting.

### Buttons & Brand

8. As a designer/engineer, I want buttons to have modern rounded styling that feels polished but stays consistent with the existing design system.

## Out of Scope (For This Iteration)

- Keyboard navigation for company submenus (hover-only; known gap to fix in follow-up).
- Screen reader optimization for hover-reveal company submenus (known gap to fix in follow-up).
- Dark mode tweaks beyond token consistency (assume existing dark tokens apply).
- Reordering of model catalog or adding new featured/category filters (fixed to "Featured + grouped by provider" layout).
- Refactoring the generate pipeline or cost/credit display (sidebar styling only).
- Mobile-specific prompt bar layout redesign (same reflow behavior, but may need mobile breakpoint tuning in follow-up).

## Key Constraints

1. **Logo storage**: JPG/PNG files bundled by Vite; imported into components via `src/assets/models/` path.
2. **Naming convention**: kebab-case matching model ID (e.g., `flux-pro.png`, `nano-banana-2.jpg`).
3. **Model type**: Use existing `Model` interface with new `iconUrl: string | undefined` field to reference logo paths.
4. **Design tokens**: Existing color, radius, shadow, and transition tokens in DESIGN.md apply; no new token creation.
5. **Accessibility**: Hover-reveal submenus acknowledged as a11y gap; keyboard/screen-reader support deferred to follow-up.
6. **Popover dismissal**: Standard behavior (outside-click, Escape key).

## Technical References (Current Codebase)

- **Sidebar wrapper**: `apps/web/src/components/Aside/Aside.vue` (full-height container with padding).
- **Control rail (main sidebar content)**: `apps/web/src/components/Dashboard/ControlRail/ControlRail.vue` (contains Prompt, Model Picker, Settings, Generate button).
- **Model picker (new approach)**: `apps/web/src/components/Dashboard/ControlRail/ModelPicker.vue` (existing popover, needs restructure for Featured + company grouping).
- **Prompt box**: `apps/web/src/components/Dashboard/ControlRail/PromptBox.vue` (textarea with AI prompt menu trigger).
- **Prompt AI menu**: `apps/web/src/components/Dashboard/ControlRail/PromptAiMenu.vue` (wand icon, popover menu).
- **Models data**: `apps/web/src/utils/models.ts` (MODELS array, FLUX_MODES, groupModelsByProvider util).
- **Model type**: `apps/web/src/types/model.ts` (Model interface with icon, iconUrl fields).
- **Existing design tokens**: `apps/web/src/components/Aside/Aside.vue` uses Tailwind + semantic tokens (defined in DESIGN.md).

## Visual References

Two reference screenshots attached by the user:

1. **Leonardo.AI sidebar**: Shows compact sidebar with floating/gap aesthetic, icon-labeled sections, model picker as external overlay with "Featured" section at top, tabbed categories (All / Image / Video / 3D / Legacy), search, and model cards with logos and no metadata clutter.
2. **Prompt bar reflow**: Long prompt text causes the action buttons (wand + Generate) to move below the text input, not stay on the right side.

## Acceptance Criteria (Implementation Checklist)

- [ ] Sidebar has top/bottom padding/margin; not full-height; looks modern and spacious.
- [ ] Model picker opens as popover anchored to Model row/button; not inline v-select.
- [ ] Model picker has "Featured" section with featured models at top.
- [ ] Models below "Featured" grouped by company name (provider).
- [ ] Company name shows; hovering over company name reveals submenu on right with that company's models (hover-only).
- [ ] Custom logos from `apps/web/src/assets/models/` display in model cards.
- [ ] Model cards no longer show "budget" or "tag" fields.
- [ ] Model picker dismisses on outside-click or Escape.
- [ ] Prompt input starts small, grows with text.
- [ ] When prompt text is long, AI-prompt button and Generate button move below the text (flex reflow).
- [ ] Placeholder text is static, no typewriter animation.
- [ ] All prompt variants (create, colorize, upscale, revive-old) use the new compact + reflow prompt bar.
- [ ] Buttons (prompt wand, Generate, etc.) have rounded styling consistent with design tokens.
- [ ] Old logo references removed from codebase; Mode.vue and other old model picker code updated or deprecated.
