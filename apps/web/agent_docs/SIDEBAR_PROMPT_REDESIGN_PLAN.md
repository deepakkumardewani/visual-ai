# Sidebar & Prompt Bar Redesign — Technical Plan

## Architecture Overview

The redesign spans four key areas:

1. **Sidebar container** (Aside.vue, ControlRail.vue): Layout refactor for compact, floating aesthetic with gaps.
2. **Model picker** (ModelPicker.vue + new ModelPickerPanel.vue): Restructure current popover to support Featured section, company grouping, and hover-reveal submenus.
3. **Model logos** (assets + Model type): Copy custom logos; add `iconUrl` field to Model; retire Vuetify icon strings.
4. **Prompt bar** (PromptBox.vue + PromptAiMenu.vue): Redesign for compact start, grow-with-text, and button reflow below long text.

## Phase-Level Breakdown

### Phase 0: Setup & Asset Import (Checkpoint: Logos copied, assets ready)

**Goal**: Copy custom logos, update Model type, prepare data structures.

**Key decisions:**

- Copy JPG/PNG logos from `/Users/deepakdewani1/Documents/Programs/vue/text-to-image/docs/brand-logos` to `apps/web/src/assets/models/`.
- Rename individual model logos to kebab-case (e.g., `flux-pro.png`).
- Add `featured?: boolean` and `companyName?: string` fields to Model interface (for grouping and Featured section).
- Add `iconUrl?: string` field to Model interface (path to logo asset).
- Update models.ts to populate `iconUrl`, `featured`, and `companyName` for each model.
- Create a utility function `groupModelsByCompany()` (parallel to existing `groupModelsByProvider()`).

**Risks:** Model data structure change may affect backward compatibility with stored user preferences; mitigate by ensuring model selection still works via `id` field.

---

### Phase 1: Sidebar Layout Redesign (Checkpoint: Sidebar looks modern, has spacing)

**Goal**: Refactor Aside.vue and ControlRail.vue to be compact and floating.

**Key decisions:**

- Remove full-height constraint; add top/bottom margins/padding to create breathing room.
- Keep width constraints; sidebar still sits in the left panel.
- Ensure padding is consistent with design tokens (check DESIGN.md for spacing scale).
- Verify dark/light mode contrast on new spacing.

**Components to modify:**

- `Aside.vue`: Remove `tw-h-full`, adjust padding, add top/bottom margin.
- `ControlRail.vue`: Ensure internal spacing aligns with new container constraints.

**Testing:** Visual check in both dark and light modes; verify no layout shifts on resize.

---

### Phase 2: Model Picker Restructure (Checkpoint: Picker opens as popover with Featured section, company grouping visible)

**Goal**: Refactor ModelPicker.vue to display Featured models, then company-grouped models with hover-reveal submenus.

**Key decisions:**

- Restructure popover content to have two sections: "Featured" (with featured models) and "All Models" (grouped by company).
- For each company group, render a header (company name) with hover state that triggers a submenu on the right.
- Submenu shows that company's models; click to select.
- Use Popover primitive (existing) for main picker; use a nested floating element or absolute positioning for company submenus.
- Dismiss on outside-click or Escape.

**Components to modify/create:**

- `ModelPicker.vue`: Add Featured section, refactor grouping logic.
- `ModelPickerPanel.vue` (new): Encapsulate the panel layout (Featured + company groups).
- `ModelCompanyGroup.vue` (new): Single company group with hover-reveal submenu.
- `ModelCompanySubmenu.vue` (new): Right-side submenu showing company's models.

**Accessibility note**: Hover-only interaction is a known gap; flag in code comments for a11y follow-up.

**Testing:** Hover over company names; verify submenu appears; click a model; verify selection and popover dismissal.

---

### Phase 3: Model Logo Integration (Checkpoint: Model cards display custom logos)

**Goal**: Integrate custom logos into model display.

**Key decisions:**

- In ModelOption.vue, swap from icon string (`$fluxFast`) to img tag with `iconUrl` from Model.
- Fallback to icon string if `iconUrl` is undefined (for backward compatibility during transition).
- Size logos consistently (e.g., 24x24 or 32x32); adjust based on design review.
- Remove "budget" and "tag" display from model cards.

**Components to modify:**

- `ModelOption.vue`: Replace icon rendering with img + iconUrl logic.
- `ModelChip.vue` (if used elsewhere): Apply same logo swap.

**Old code to remove:**

- Mode.vue: Likely used old v-select; can deprecate if ModelPicker fully replaces it.
- Any hard-coded Vuetify icon references for models.

**Testing:** Verify logos load correctly; check alignment and sizing in both light and dark modes.

---

### Phase 4: Prompt Bar Compact & Reflow (Checkpoint: Prompt grows with text, buttons reflow below long text)

**Goal**: Redesign PromptBox.vue to start compact, grow with text, and reflow action buttons below on long text.

**Key decisions:**

- Change textarea from fixed rows to `rows="1"` initially; auto-grow via JS or CSS (e.g., `autogrow` directive or CSS `field-sizing: content`).
- Flexbox reflow: Wrap buttons below text when prompt is long.
  - Current layout: horizontal flex (text + buttons on same line).
  - New layout: Use `flex-wrap: wrap` or refactor to `flex-col` for buttons when text > threshold.
- Remove typewriter animation; use static placeholder.
- Keep AI-prompt and Generate buttons visible and functional at all times.

**Components to modify:**

- `PromptBox.vue`: Refactor layout, remove typing animation, adjust textarea rows.
- `PromptAiMenu.vue`: Ensure button styling is modern (rounded); no layout changes needed.

**All prompt variants:**

- Apply same redesign to Colorize, Upscale, Revive-Old prompt bars (if they use the same PromptBox component, no extra work; if separate, replicate).

**Styling approach:**

- Use Tailwind utility classes for flex reflow; keep design token consistency.
- Test at various breakpoints (mobile, tablet, desktop).

**Testing:** Type long prompts; verify buttons move below text; verify no layout breaks; test on mobile.

---

### Phase 5: Button Styling Refinement (Checkpoint: Buttons look modern, rounded, token-consistent)

**Goal**: Polish button appearance (AI prompt wand, Generate button, Clear button).

**Key decisions:**

- Add `tw-rounded-md` or `tw-rounded-lg` to buttons (check existing token for radius).
- Ensure border, hover, and focus states are clear and accessible.
- No new color tokens; use existing ones from DESIGN.md.
- Use existing transition classes (e.g., `interactiveTransition`) for micro-interactions.

**Components to modify:**

- `PromptAiMenu.vue`: Refine trigger button and menu item styling.
- `PromptBox.vue`: Refine Clear button styling.
- `GenerateButton.vue` (if separate): Apply same refinement.

**Testing:** Visual review against design reference; check focus states and hover states.

---

## Key Technical Trade-offs

| Trade-off                                                 | Decision                                                                           | Rationale                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Hover-only company submenus vs. keyboard-accessible**   | Hover-only (known a11y gap)                                                        | Ship fast; defer accessibility to follow-up iteration.                |
| **CSS autogrow vs. JS-based textarea autogrow**           | Use CSS `field-sizing: content` if supported; fallback to a Vue autogrow directive | CSS is simpler; directive is more widely supported in older browsers. |
| **Model card logo: img tag vs. inline SVG**               | img tag with fallback to icon string                                               | Simpler, lighter, faster; logos are pre-designed.                     |
| **Popover nesting (company submenu inside main popover)** | Floating element / absolute positioning for submenu                                | Avoids modal nesting complexity; simpler dismiss logic.               |
| **Backward compatibility: old models without iconUrl**    | Graceful fallback to icon string                                                   | Allows gradual migration; old models still work.                      |

## Dependencies & Ordering

1. **Phase 0** → must complete before Phases 1–4 (models need the data structure updates).
2. **Phase 1** → independent; can run in parallel with Phase 2, 3, 4.
3. **Phase 2** → depends on Phase 0; can run in parallel with Phase 3, 4.
4. **Phase 3** → depends on Phases 0 and 2 (needs logos and updated model picker).
5. **Phase 4** → independent; can run in parallel with Phases 1, 2, 3.
6. **Phase 5** → can run anytime after Phase 4 (styling only, no data changes).

**Recommended execution:** Phase 0 → (Phases 1, 2, 4, 5 in parallel) → Phase 3 (integration).

## Rollback Plan

- Revert logo references back to Vuetify icon strings (keep dual-path logic in ModelOption).
- Revert PromptBox layout to fixed rows, static positioning for buttons.
- Revert Aside spacing to full-height, flush layout.
- All changes are isolated to components; no database or API changes needed.

## Success Metrics

- [ ] Sidebar visually matches Leonardo.AI aesthetic (modern, spacious, clean).
- [ ] Model picker opens as popover, displays Featured section clearly.
- [ ] Hover over company names reveals submenus; models display custom logos.
- [ ] Prompt bar grows with text; buttons reflow below on long prompts.
- [ ] All buttons have rounded, modern styling.
- [ ] Visual regression tests pass (if any); manual visual review approved.
- [ ] No console errors or warnings introduced.
- [ ] Works on desktop, tablet, mobile breakpoints.
