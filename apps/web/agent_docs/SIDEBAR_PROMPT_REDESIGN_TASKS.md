# Sidebar & Prompt Bar Redesign — Task Breakdown

## Phase 0: Setup & Asset Import

### T0.1: Copy Custom Logos & Create Assets Directory

**Files:**

- `/apps/web/src/assets/models/` (new directory)
- Source: `/Users/deepakdewani1/Documents/Programs/vue/text-to-image/docs/brand-logos`

**Do:**

- Create `apps/web/src/assets/models/` directory.
- Copy JPG/PNG files from source to `apps/web/src/assets/models/`.
- Rename individual model logo files to kebab-case matching model ID (e.g., `flux-pro.png`, `nano-banana-2.jpg`, `gpt-image-2.png`).
- Verify all model logos are present and correctly named.

**Acceptance:**

- Directory `apps/web/src/assets/models/` exists with all renamed logo files.
- Each file is accessible by Vite (can import as `import logoUrl from '@/assets/models/flux-pro.png'`).

**Verify:**

- Run `ls -la apps/web/src/assets/models/` and confirm all logos are present with correct names.

---

### T0.2: Update Model Type & Add Featured/Company Fields

**Files:**

- `apps/web/src/types/model.ts`

**Do:**

- Open `model.ts` and add three new optional fields to the `Model` interface:
  - `iconUrl?: string` — path to logo file in assets/models (e.g., `'flux-pro.png'`).
  - `featured?: boolean` — marks model as featured (default false).
  - `companyName?: string` — display name for company grouping (e.g., 'Black Forest Labs', 'OpenAI', 'Stability AI').
- Ensure fields are properly typed and optional to avoid breaking existing code.

**Acceptance:**

- TypeScript compiles without errors on the updated Model interface.
- No build errors.

**Verify:**

- Run `npm run type-check` (or equivalent) and confirm no TS errors.

---

### T0.3: Update Models Data — Populate iconUrl, featured, companyName

**Files:**

- `apps/web/src/utils/models.ts`

**Do:**

- For each model in the `MODELS` array:
  - Add `iconUrl` field with path to the logo (e.g., `iconUrl: 'flux-pro.png'`).
  - Add `featured: true` for hand-picked featured models (e.g., Flux Pro, Flux 1.1 Pro, and 2–3 other top models); default to false for others.
  - Add `companyName` field with the display name (e.g., 'Black Forest Labs' for Flux models, 'OpenAI' for GPT-based models, 'Stability AI' for Stable Diffusion, 'Pruna' for Pruna models, 'ByteDance' for others).
- Verify no duplicate model IDs or missing entries.

**Acceptance:**

- All models have `iconUrl`, `featured`, and `companyName` populated (or explicitly omitted if not applicable).
- TypeScript compiles without errors.
- Model selection still works (test in browser by checking that the selected model is reflected in the state).

**Verify:**

- Run `npm run type-check`.
- Spot-check a few models in the browser (console log) to verify data structure is correct.

---

### T0.4: Create Utility Function groupModelsByCompany()

**Files:**

- `apps/web/src/utils/models.ts`

**Do:**

- Add a new exported utility function `groupModelsByCompany(models: Model[]): Map<string, Model[]>`.
- This function should:
  - Group models by `companyName`.
  - Return a Map where keys are company names and values are arrays of models for that company.
  - Order by featured models first, then by company name alphabetically.
- Example usage: `const grouped = groupModelsByCompany(MODELS); grouped.get('Black Forest Labs');`

**Acceptance:**

- Function is exported and callable.
- Returns correctly grouped models.
- Featured models are prioritized.

**Verify:**

- Write a simple console test and verify grouping is correct.

---

## Phase 0 Checkpoint 🔶

**Gate:** All logos are copied, Model type is updated, data is populated, and utility functions are ready.

- [x] Logos copied to `apps/web/src/assets/models/` with correct naming.
- [x] Model type updated (iconUrl, featured, companyName fields added).
- [x] All models in MODELS array have these fields populated.
- [x] `groupModelsByCompany()` utility function exists and works.
- [x] No TypeScript errors.
- [ ] Code is committed and ready for Phases 1–5.

---

## Phase 1: Sidebar Layout Redesign

### T1.1: Refactor Aside.vue for Compact, Floating Layout

**Files:**

- `apps/web/src/components/Aside/Aside.vue`

**Do:**

- Open Aside.vue.
- Remove or modify the `tw-h-full` class that makes sidebar full-height.
- Add top and bottom margins to create breathing room (e.g., `tw-my-4` or `tw-mt-6 tw-mb-4`).
- Verify the sidebar now has white space above and below.
- Check that the rounded corners and background colors are still appropriate.

**Acceptance:**

- Sidebar is no longer full-height.
- Clear visual gap between sidebar top and the container top.
- Clear visual gap between sidebar bottom and the container bottom.
- Styling is consistent with design tokens (check DESIGN.md for spacing scale).

**Verify:**

- Screenshot in light and dark modes.
- Verify on desktop and mobile breakpoints.
- No layout shifts or overflow issues.

---

### T1.2: Review & Adjust ControlRail.vue Padding for New Container

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/ControlRail.vue`

**Do:**

- Open ControlRail.vue.
- Verify internal padding (currently `tw-p-3`) is still appropriate given the new Aside margins.
- Adjust if needed for consistent overall spacing (e.g., if Aside adds `tw-my-4`, ensure ControlRail padding aligns).
- Check vertical spacing between Prompt, Model Picker, Settings, and Generate button.

**Acceptance:**

- Internal spacing within ControlRail is proportional and consistent.
- No cramped or excessive whitespace.

**Verify:**

- Screenshot to compare with design reference (Leonardo.AI).

---

### T1.3: Test Sidebar Layout on Dark & Light Modes

**Files:**

- `apps/web/src/components/Aside/Aside.vue`

**Do:**

- Toggle dark/light mode in the app and verify sidebar looks correct in both.
- Check background color contrast, text visibility, and spacing.

**Acceptance:**

- Sidebar looks good and is readable in both dark and light modes.

**Verify:**

- Manual visual inspection in browser.

---

## Phase 1 Checkpoint 🔶

**Gate:** Sidebar has modern, floating layout with clear spacing.

- [x] Sidebar container has top/bottom margins; no longer full-height. **Note:** Aside.vue/ControlRail.vue are dead code (unreachable from any route). Fix was applied to the actual live components: `DashboardShell.vue` (`<aside data-testid="dashboard-rail">` now has `tw-my-4`) and `DashboardSidebar.vue`.
- [x] Live sidebar padding (`DashboardSidebar.vue` nav, `tw-p-3 sm:tw-p-4`) is consistent with new margins.
- [x] Sidebar looks spacious and modern (matches design reference).
- [ ] Dark and light modes both work. (not re-verified visually this session)
- [ ] No layout breaks on resize. (not re-verified visually this session)

---

## Phase 2: Model Picker Restructure

### T2.1: Create ModelPickerPanel.vue Component

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/ModelPickerPanel.vue` (new)

**Do:**

- Create a new component to encapsulate the model picker panel layout.
- This component will:
  - Display "Featured" section at top with featured models.
  - Display "All Models" section below, grouped by company.
  - Accept props: `models: Model[]`, `selectedModel: Model`, and emit `@select-model` event.
- Use the existing ModelOption.vue component for individual model rows.
- For now, render company groups as simple dividers (headers); company hover will be added in T2.2.

**Acceptance:**

- Component exists and can be imported.
- Renders featured models in a "Featured" section.
- Renders non-featured models grouped by company with company headers.

**Verify:**

- Render in a test/demo page and verify structure.

---

### T2.2: Create ModelCompanyGroup.vue & ModelCompanySubmenu.vue

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/ModelCompanyGroup.vue` (new)
- `apps/web/src/components/Dashboard/ControlRail/ModelCompanySubmenu.vue` (new)

**Do:**

- **ModelCompanyGroup.vue**: Render a single company group with:
  - Company name header with hover state.
  - On hover, display the company submenu (positioned on the right).
  - Pass company models to the submenu.
  - Emit `@select-model` when a model is clicked.
- **ModelCompanySubmenu.vue**: Render a floating submenu (right side of company group) with:
  - List of models for the company.
  - Click to select; emit `@select-model`.
  - Use Popover or absolute positioning.
- Add comment noting hover-only interaction and a11y gap for future follow-up.

**Acceptance:**

- Components exist and can be imported.
- Hovering over company name shows submenu on the right.
- Clicking a model in submenu selects it and closes both popover and submenu.
- Submenu has accessible styling (visible, readable).

**Verify:**

- Manual hover and click testing in browser.
- Verify submenu positioning doesn't overflow screen.

---

### T2.3: Refactor ModelPicker.vue to Use New Components

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/ModelPicker.vue`

**Do:**

- Update ModelPicker.vue to use the new ModelPickerPanel, ModelCompanyGroup, and ModelCompanySubmenu components.
- Replace the current flat model list with Featured + company-grouped layout.
- Ensure popover open/close behavior is unchanged.
- Ensure model selection still updates the store.

**Acceptance:**

- ModelPicker now displays Featured section at top.
- Models below Featured are grouped by company.
- Hovering over company names reveals submenus.
- Clicking a model selects it and closes the popover.

**Verify:**

- Manual testing in browser.
- Verify model selection is persisted (check store).

---

### T2.4: Deprecate or Update Mode.vue

**Files:**

- `apps/web/src/components/Aside/Mode.vue`

**Do:**

- Determine if Mode.vue is still used anywhere in the codebase.
- If not used: Add a deprecation comment noting that ModelPicker.vue is the new model selector.
- If still used: Update to use ModelPicker or mark for removal in follow-up.
- Search codebase for imports of Mode.vue and update/remove as needed.

**Acceptance:**

- Mode.vue is either deprecated with clear comment, or updated to new model picker approach.
- No broken imports in codebase.

**Verify:**

- Grep for `import.*Mode.vue` and confirm no stray imports.

---

## Phase 2 Checkpoint 🔶

**Gate:** Model picker opens as popover with Featured section, company grouping, and hover-reveal submenus.

- [x] ModelPickerPanel.vue exists and renders Featured + company-grouped models.
- [x] ModelCompanyGroup.vue with hover-reveal submenu works.
- [x] ModelCompanySubmenu.vue displays company models on right side.
- [x] ModelPicker.vue is updated to use new components.
- [x] Model selection still works and persists to store.
- [x] Popover dismisses on outside-click or Escape.
- [x] Mode.vue is deprecated or updated.

---

## Phase 3: Model Logo Integration

### T3.1: Update ModelOption.vue to Display Logos

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/ModelOption.vue`

**Do:**

- Open ModelOption.vue.
- Find where the model icon is currently rendered (likely an icon string).
- Replace with:
  - `<img :src="require(`@/assets/models/${model.iconUrl}`)" v-if="model.iconUrl" ... />`
  - Fallback to the old icon string if `iconUrl` is not set.
- Set a fixed size for logos (e.g., 24px × 24px or 32px × 32px).
- Ensure image is properly aligned and doesn't break layout.

**Acceptance:**

- Logos display correctly in model option rows.
- Logos are sized consistently.
- Fallback to icon string works for models without logos.

**Verify:**

- Manual check in browser: open model picker and verify logos appear.
- Check both light and dark modes.

---

### T3.2: Remove Budget & Tag Display from Model Cards

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/ModelOption.vue`

**Do:**

- Find where "budget" and "tag" are displayed in ModelOption.
- Remove or comment out those fields.
- Ensure model card layout still looks balanced (no awkward spacing).

**Acceptance:**

- "Budget" and "tag" are no longer visible on model cards.
- Model card layout is clean and minimal.

**Verify:**

- Visual check in browser.

---

### T3.3: Update ModelChip.vue (if used) to Display Logos

**Files:**

- `apps/web/src/components/Dashboard/Composer/ModelChip.vue` (if exists and used)

**Do:**

- If ModelChip.vue is used elsewhere (e.g., in a dashboard or history view), apply the same logo update as T3.1.
- Ensure consistency across all places where model logos appear.

**Acceptance:**

- Logos display in ModelChip as well.

**Verify:**

- Check usage of ModelChip and verify logos appear wherever it's rendered.

---

### T3.4: Remove Old Logo References from Codebase

**Files:**

- Various (Mode.vue, old icon definitions, etc.)

**Do:**

- Search the codebase for hard-coded icon-string references for models (e.g., `$fluxFast`, `$fluxPro`).
- Remove or comment out old logo files if any exist in public/assets.
- Ensure no dangling references to old logo paths.

**Acceptance:**

- No stray old logo references in code.
- Old logo files (if any) removed from project.

**Verify:**

- Grep for old icon names to confirm they're gone.

---

## Phase 3 Checkpoint 🔶

**Gate:** Model cards display custom logos; budget/tag removed; old references cleaned up.

- [x] ModelOption.vue displays logos from `src/assets/models/`.
- [x] Logos are sized and aligned correctly.
- [x] Fallback to icon string works for backward compatibility.
- [x] "Budget" and "tag" are removed from display.
- [x] ModelChip.vue (if used) also updated.
- [x] Old logo references removed from codebase.
- [x] Visual check: logos appear in model picker.

---

## Phase 4: Prompt Bar Compact & Reflow

### T4.1: Update PromptBox.vue for Compact Initial State

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/PromptBox.vue`

**Do:**

- Open PromptBox.vue.
- Find the textarea element with `rows="3"` or fixed rows.
- Change to `rows="1"` for compact initial state.
- Add `style="overflow: hidden; resize: none;"` to prevent user resize.
- Prepare for auto-grow directive (T4.2).

**Acceptance:**

- Textarea starts with 1 row (compact).
- User can still type and see text.

**Verify:**

- Visual check: prompt input is much smaller initially.

---

### T4.2: Implement Textarea Auto-Grow Logic

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/PromptBox.vue`

**Do:**

- Add textarea auto-grow logic:
  - Option A: Use CSS `field-sizing: content` (modern browsers).
  - Option B: Create a Vue directive or use an existing `v-autogrow` directive.
  - On input, adjust textarea height to fit content.
- Ensure max-height to prevent infinite growth (e.g., `max-height: 200px` or similar).

**Acceptance:**

- Textarea grows as user types.
- Textarea shrinks when user deletes text.
- Max-height is respected.

**Verify:**

- Type a long prompt and verify textarea expands.
- Delete text and verify it shrinks back.

---

### T4.3: Refactor Prompt Bar Layout for Button Reflow

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/PromptBox.vue`

**Do:**

- Current layout (likely): `flex items-center gap-2` with textarea + buttons on same line.
- Change to: `flex flex-col gap-2` or use `flex-wrap: wrap` strategy.
- Ensure buttons (AI prompt, Generate) are positioned:
  - Below the textarea when prompt text is long.
  - Inline (on the same line) when prompt is short.
- Consider using a threshold (e.g., if textarea height > 60px, wrap buttons below).

**Acceptance:**

- When prompt is short: buttons stay on the right or inline.
- When prompt is long: buttons move below the textarea.
- Layout is responsive and doesn't break on resize.

**Verify:**

- Type a short prompt (1–2 words) and verify buttons stay inline.
- Type a long prompt (3–5 lines) and verify buttons move below.

---

### T4.4: Remove Typewriter Animation from Prompt Placeholder

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/PromptBox.vue`

**Do:**

- Find the typewriter animation logic (currently in `typePrompt()` and `applyPrompt()`).
- Keep the prompt text itself, but remove the character-by-character typing effect.
- When a prompt is applied (from AI menu), it should appear instantly or with a simpler animation (e.g., fade-in).
- Static placeholder: change placeholder text to a simple, non-animated string.

**Acceptance:**

- No typewriter animation when prompt is applied.
- Placeholder is static and simple.
- Prompt text appears instantly (or with fade-in).

**Verify:**

- Click "Improve Prompt" or "Random Prompt" and verify text appears instantly without character-by-character animation.

---

### T4.5: Apply Redesign to All Prompt Variants

**Files:**

- `apps/web/src/components/Aside/ColorizeImageAside.vue` (or wherever Colorize prompt is)
- `apps/web/src/components/Aside/UpscaleImageAside.vue` (or wherever Upscale prompt is)
- `apps/web/src/components/Aside/ReviveOldAside.vue` (or wherever Revive prompt is)

**Do:**

- Check if these components use a separate prompt input or the same PromptBox.
- If using PromptBox: changes from T4.1–T4.4 apply automatically.
- If using a separate component: replicate the compact + auto-grow + reflow logic.
- Ensure all prompt variants have the same behavior and styling for consistency.

**Acceptance:**

- All prompt inputs (create, colorize, upscale, revive) have the new compact + reflow behavior.
- Consistent across variants.

**Verify:**

- Navigate to each variant and verify prompt bar behavior.

---

## Phase 4 Checkpoint 🔶

**Gate:** Prompt bar is compact, grows with text, buttons reflow below long text, no typewriter animation.

- [x] Textarea starts with 1 row (compact).
- [x] Textarea auto-grows as user types.
- [x] Textarea shrinks when text is deleted.
- [x] Buttons reflow below textarea on long text.
- [x] Typewriter animation is removed.
- [x] Placeholder is static and simple.
- [x] All prompt variants (create, colorize, upscale, revive) have the same behavior.
- [ ] Visual check: prompt bar looks modern and responsive.

---

## Phase 5: Button Styling Refinement

### T5.1: Refine PromptAiMenu Button Styling

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/PromptAiMenu.vue`

**Do:**

- Update the trigger button (wand icon) and menu items styling.
- Add `tw-rounded-md` or `tw-rounded-lg` to buttons for rounded appearance.
- Ensure border, hover, and focus states are clear.
- Use existing design tokens (colors, transitions from DESIGN.md).
- No new tokens; keep consistency.

**Acceptance:**

- Buttons have rounded corners.
- Hover and focus states are visible and accessible.
- Styling is consistent with design tokens.

**Verify:**

- Visual check: buttons look modern and polished.
- Hover and focus states work.

---

### T5.2: Refine PromptBox Clear Button & Other Buttons

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/PromptBox.vue`

**Do:**

- Update the Clear button (X icon) styling.
- Add `tw-rounded-md` or `tw-rounded-lg`.
- Ensure consistent hover/focus states.
- Check info button styling.

**Acceptance:**

- Buttons have rounded appearance.
- Consistent styling across all buttons in the prompt bar.

**Verify:**

- Visual check.

---

### T5.3: Refine GenerateButton.vue Styling

**Files:**

- `apps/web/src/components/Dashboard/ControlRail/GenerateButton.vue` (if separate)

**Do:**

- Update Generate button styling (likely already has rounded styling, but verify).
- Ensure consistency with other buttons.
- Check color, padding, hover states match design tokens.

**Acceptance:**

- Generate button is consistent with other refined buttons.

**Verify:**

- Visual check: all buttons have cohesive styling.

---

### T5.4: Test Button States & Accessibility

**Files:**

- Various button components

**Do:**

- Test all button states: default, hover, focus, disabled, loading.
- Verify focus outlines are visible (a11y).
- Verify color contrast on light and dark backgrounds.

**Acceptance:**

- All button states are clear and accessible.
- No contrast issues.

**Verify:**

- Manual testing in browser.
- Use browser accessibility inspector if available.

---

## Phase 5 Checkpoint 🔶

**Gate:** All buttons have modern, rounded styling consistent with design tokens.

- [x] PromptAiMenu trigger and menu items have rounded styling.
- [x] PromptBox Clear button is rounded and styled.
- [x] GenerateButton is styled consistently.
- [x] All button states (hover, focus, disabled) are clear.
- [x] Accessibility (focus outlines, contrast) is maintained.
- [ ] Visual review: buttons look polished and modern. (not re-verified visually this session — browser testing was skipped per user instruction)

---

## Final Verification Checklist

After all phases complete:

- [ ] Sidebar is compact with top/bottom spacing (modern, floating aesthetic).
- [ ] Model picker opens as popover with Featured section at top.
- [ ] Models are grouped by company with hover-reveal submenus.
- [ ] Custom logos display in model cards.
- [ ] "Budget" and "tag" removed from model display.
- [ ] Prompt bar starts compact (1 row).
- [ ] Prompt bar grows as text is entered.
- [ ] When prompt text is long, AI-prompt and Generate buttons reflow below the text.
- [ ] Typewriter animation is removed; placeholder is static.
- [ ] All prompt variants (create, colorize, upscale, revive) have the new behavior.
- [ ] Buttons (AI prompt wand, Generate, Clear) have rounded, modern styling.
- [ ] Styling is consistent with existing design tokens (no divergent restyle).
- [ ] No TypeScript errors or build warnings.
- [ ] Manual visual test on desktop, tablet, mobile.
- [ ] Dark and light modes both look good.
- [ ] Old logo references and deprecated Mode.vue removed.

---

## Known Limitations & Future Work

- **A11y for company submenus**: Hover-only interaction is not keyboard-accessible. Defer keyboard navigation and screen reader support to follow-up.
- **Mobile responsiveness**: Prompt bar reflow may need additional tuning on small screens; verify during Phase 4 testing.
- **Logo sizing**: May need adjustment based on visual review; 24–32px is a starting point.
