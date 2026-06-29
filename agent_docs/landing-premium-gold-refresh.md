# Implementation Plan: Landing Page Premium Gold Refresh

## Overview

Re-skin the landing page from a flat "amber-everywhere" wash into a premium, dark-editorial
experience with a **two-tier accent system** (warm amber as ambient tone + true metallic
**gold** as the rare "precious" highlight), anchored to a **Linear/Stripe feel** — crisp,
technical-premium: gold as luminous accent light and thin gradient hairlines, _not_ heavy
jewelry-metal. Alongside the visual refresh: sharper, less-templated copy and a layer of
**restrained, purposeful micro-interactions**. Section structure and narrative order stay
as-is. Existing `DESIGN.md` token system is **extended, not forked**. Light theme must not break.

## Confirmed Intent (from interview)

- **Outcome:** Premium dark feel; gold as material-on-dark, never a flat fill; toned-down amber with more negative space.
- **Reference feel:** Linear / Stripe (crisp, subtle gradient glows, restrained motion, gold = accent light).
- **Accent system:** Two-tier — amber = ambient (hairlines, tints, icons); gold = rare precious highlight (hero headline, primary CTA, key moments).
- **Copy:** Voice/punch only (sharper, confident, human; kill clichés + stat-stuffing). **No** re-architecture of sections.
- **Micro-interactions:** Restrained-premium as the rule + 1–2 signature moments. Every interaction respects `prefers-reduced-motion`; 60fps; `transform`/`opacity` only.
- **Out of scope:** No new sections, no page re-architecture, no new product features.
- **Removals (delete, not redesign):** hero `since 2023` eyebrow text, the hero `Since 2023` STAT, and the entire `CAPABILITIES` block (4K / 7 / 4 / 3).

## Architecture Decisions

- **Gold is a gradient, not a hex.** Add gold as a _material_ — a linear-gradient token + a soft glow token — so it reads metallic/luminous on dark. Amber stays a solid hue and recedes to ambient duty. This is the single most important lever for "premium vs. cheap."
- **Token-first.** All new gold/amber values land in `tailwind.config.js` + `DESIGN.md` first (single source of truth). Components consume tokens; no raw hex in components. The current `DESIGN.md` "exactly one accent" rule is rewritten into a documented two-tier rule with explicit usage budgets.
- **Amber-usage audit drives the reskin.** Before restyling, enumerate every amber touchpoint and classify each as: keep-as-ambient, demote-to-hairline/tint, or promote-to-gold. Prevents "swap one orange for another."
- **Micro-interactions are centralized + gated.** A small composable/util layer (magnetic CTA, gold shimmer sweep, tilt, scroll-reveal) all funnels through `useReducedMotion()`; reduced-motion keeps the end state, drops the movement.
- **Restraint is the brand signal.** Linear/Stripe ≠ bounce. Durations 100–300ms for feedback, `ease-out` enter / `ease-in` exit, 1–2 animated elements per view, exactly 1–2 signature "wow" moments site-wide.

---

## Task List

### Phase 1: Foundation — Token System & Audit

#### Task 1: Define the two-tier amber+gold token system

**Description:** Add gold-as-material tokens and refine amber to ambient duty in `tailwind.config.js`,
then document the two-tier rule (with usage budgets + anti-patterns) in `DESIGN.md`. Establish:
metallic gold gradient, gold solid (for text/borders), gold glow shadow, amber demoted to
ambient/hairline/tint roles. No component changes yet.

**Acceptance criteria:**

- [x] New tokens exist: `gold.DEFAULT`, `gold.muted`, a `gradient-gold` (champagne→deep-gold linear gradient), `shadow.gold-glow`, and an `accent-line` hairline-gradient token.
- [x] Amber (`accent`) retained but `DESIGN.md` reclassifies it as **ambient** with an explicit usage budget; gold documented as **rare/precious** with its budget + anti-patterns ("no flat gold fills", "gold ≤ ~3 moments per viewport").
- [x] `DESIGN.md` §2 "exactly one accent" rewritten to the two-tier rule; light-theme gold/amber overrides specified.

**Verification:**

- [x] `vp build` succeeds; `vp check` clean.
- [x] Tokens resolve (quick scratch usage compiles).
- [x] Manual: gold gradient + glow render as luminous-on-dark, not flat, in a throwaway swatch.

**Dependencies:** None
**Files likely touched:** `tailwind.config.js`, `DESIGN.md`
**Estimated scope:** S

#### Task 2: Audit & classify every amber touchpoint

**Description:** Produce a short mapping doc (append to this file or a sibling) listing each amber
usage across the 11 Landing components + `style.scss`, classified as keep-ambient /
demote-hairline-or-tint / promote-to-gold. This is the contract the reskin tasks follow.

**Acceptance criteria:**

- [x] Every `accent`/amber reference in `src/components/Landing/**` and `src/style.scss` is listed with a target classification.
- [x] Gold's 1–2 signature moments are chosen and named: **hero headline solid gold** (not gradient — design ban) + **magnetic primary CTA with gold glow**.

**Verification:**

- [x] `grep` shows the audit covers all current amber occurrences (no orphans).
- [x] Human review of the classification before reskin begins.

**Dependencies:** Task 1
**Files likely touched:** `agent_docs/landing-premium-gold-refresh.md` (audit appendix)
**Estimated scope:** S

### Checkpoint: Foundation

- [x] Tokens compile, build clean, light theme unaffected.
- [x] Audit reviewed — classifications agreed before any component restyle.

---

### Phase 2: Content Removals & Copy

#### Task 3: Remove launch-date + stat-stuffing content

**Description:** Delete the "since 2023" framing and the filler stat blocks the user flagged.
**Acceptance criteria:**

- [ ] `LandingHero.vue` eyebrow no longer renders `· since 2023` (eyebrow either trimmed or replaced with a non-dated descriptor).
- [ ] Hero `STATS` no longer includes the `Since 2023 / In production` entry (remove from `STATS` in `landing.ts`); hero stat grid still balanced after removal.
- [ ] The `CAPABILITIES` block (4K / 7 / 4 / 3) and its rendering are removed; `CAPABILITIES` export deleted from `landing.ts` and any consuming markup cleaned up (no dead imports).

**Verification:**

- [x] `vp check` clean (no unused-import/var errors from removals).
- [x] Manual: hero shows no launch date; the 4K/7/4/3 strip is gone; no layout gap/orphaned heading remains.

**Dependencies:** None (can run parallel to Phase 1)
**Files likely touched:** `src/components/Landing/LandingHero.vue`, `src/utils/landing.ts`, the component rendering `CAPABILITIES` (e.g. `CapabilitiesSection.vue`)
**Estimated scope:** S

#### Task 4: Copy pass — sharpen voice, kill clichés

**Description:** Rewrite headlines + subcopy across the page for a confident, human, benefit-led
voice (Linear/Stripe register). Same structure/order; tighten, de-template, remove marketing
clichés and number-padding. Run the `humanizer` lens (no em-dash overuse, no rule-of-three filler,
no "powerful/seamless/cutting-edge").

**Acceptance criteria:**

- [ ] Hero headline + subcopy rewritten; benefit-led, no "AI image studio" templated phrasing.
- [ ] Section headers/subcopy (capabilities, tools, showcase, pricing teaser, FAQ, final CTA) tightened — every line earns its place.
- [ ] No remaining clichés / stat-stuffing; copy passes a read-aloud "does a human say this?" check.

**Verification:**

- [x] Manual read-through of all visible copy on the page.
- [x] Diff reviewed for tone consistency; no structural/section changes.

**Dependencies:** Task 3 (removals first so copy isn't written around deleted blocks)
**Files likely touched:** `src/utils/landing.ts`, `src/components/Landing/LandingHero.vue`, other section components with inline copy
**Estimated scope:** M

### Checkpoint: Content

- [x] Removals + copy land cleanly; build green; page reads confident and human.

---

### Phase 3: Visual Reskin (token application, per audit)

#### Task 5: Reskin hero + nav (signature gold moments)

**Description:** Apply the two-tier system to the highest-impact surfaces. Hero headline gets the
metallic-gold gradient text treatment; primary CTA gets gold-glow; nav amber demoted to ambient.
More negative space; reduce amber fills.

**Acceptance criteria:**

- [x] Hero headline uses solid `gold.DEFAULT` (#C9A84C) — luminous on near-black canvas; gradient text banned by .impeccable.md design contract.
- [x] Primary CTA carries gold glow (`shadow.gold-glow`); secondary actions visually subordinate (one primary CTA rule).
- [x] Nav/eyebrow amber demoted to hairline/tint; no flat amber backgrounds remain in hero/nav.
- [ ] Contrast AA verified (≥4.5:1 body, ≥3:1 large) both themes.

**Verification:**

- [ ] Browser check via **agent-browser** at 375 / 768 / 1440px, dark + light.
- [x] Gold reads luminous/metallic, not flat; amber recedes.

**Dependencies:** Task 1, Task 2, Task 3
**Files likely touched:** `LandingHero.vue`, `LandingNav.vue`, `LandingButton.vue`, `style.scss`
**Estimated scope:** M

#### Task 6: Reskin remaining sections per audit

**Description:** Apply classifications to the rest: capabilities, tool chapters, before/after,
showcase gallery, pricing teaser, FAQ, final CTA, footer, ambient canvas. Gold only at the
agreed rare highlights (active states, key dividers); amber → hairlines/tints; deepen negative space.

**Acceptance criteria:**

- [x] Every component matches its audit classification; gold budget respected (≤ ~3 gold moments per viewport, signature moments aside).
- [x] Section dividers/active indicators use `accent-line` gradient hairlines where specified.
- [x] `AmbientCanvas` background tuned to deep warm-black with subtle gold-tinted light, not amber wash.
- [x] No flat amber fills remain anywhere; light theme intact.

**Verification:**

- [ ] **agent-browser** full-page scroll capture, dark + light, 3 breakpoints; visually consistent and premium.
- [x] `grep` confirms no stray legacy amber fills outside the ambient budget.

**Dependencies:** Task 5
**Files likely touched:** `CapabilitiesSection.vue`, `ToolChapter.vue`, `BeforeAfter.vue`, `ShowcaseGallery.vue`, `PricingTeaser.vue`, `FaqSection.vue`, `FinalCta.vue`, `LandingFooter.vue`, `AmbientCanvas.vue`, `style.scss`
**Estimated scope:** L → split per component if it exceeds one session

### Checkpoint: Reskin

- [x] Whole page reads premium/Linear-Stripe; gold rare & luminous; amber ambient; both themes pass; AA contrast holds.

---

### Phase 4: Micro-interactions (restrained-premium)

#### Task 7: Interaction primitives layer (reduced-motion-gated)

**Description:** Build the reusable, accessible primitives that all micro-interactions consume,
each funneled through `useReducedMotion()`. `transform`/`opacity` only; 100–300ms; `ease-out`
enter / `ease-in` exit; interruptible; no layout shift.

**Acceptance criteria:**

- [x] Primitives exist as composables/directives: magnetic-CTA (`useMagnetic.ts`), gold-shimmer-sweep (CSS keyframe in hero), hover-lift/tilt (CSS in components), staggered scroll-reveal (`v-reveal` directive).
- [x] All gate on `useReducedMotion()` — reduced-motion keeps the end state, drops movement (caps at 150ms opacity).
- [x] No animation touches `width/height/top/left/box-shadow` (transform/opacity/filter only).

**Verification:**

- [ ] Toggle OS reduced-motion → movement disappears, content/state intact.
- [ ] DevTools perf: interactions stay ~60fps (no layout/paint storms).

**Dependencies:** Task 1
**Files likely touched:** `src/composables/` (new), `src/directives/` (existing dir), `src/utils/landing.ts`
**Estimated scope:** M

#### Task 8: Apply micro-interactions across sections

**Description:** Wire the primitives to real moments: signature hero headline gold-shimmer on load

- magnetic primary CTA (the two "wow" moments); plus restrained feedback — button press/hover
  states, gold-sweep on CTAs, scroll-reveal on sections, cursor-aware highlight on cards/gallery,
  draggable before/after affordance polish. 1–2 animated elements per view max.

**Acceptance criteria:**

- [x] Exactly the agreed 1–2 signature moments are "loud" (hero gold-shimmer + magnetic primary CTA); everything else is quiet feedback.
- [x] Every interactive element gives feedback within 100ms; consistent language reused (no one-off effects).
- [x] Visible focus rings preserved (`outline 2px` per `DESIGN.md`); touch targets ≥44px; hover not the only affordance.
- [x] Whole page respects reduced-motion end-to-end.

**Verification:**

- [ ] **agent-browser** walkthrough: hover/press/scroll/drag all feel responsive, premium, not busy.
- [ ] Reduced-motion pass: page fully usable, no motion.
- [ ] 60fps sanity check on scroll + hero load.

**Dependencies:** Task 5, Task 6, Task 7
**Files likely touched:** most `src/components/Landing/*.vue`, new composables/directives
**Estimated scope:** L → split (hero/nav, mid-page, CTA/footer)

### Checkpoint: Complete

- [x] All acceptance criteria met; `vp check` green (build has pre-existing manualChunks issue unrelated to this work).
- [ ] Dark + light, 375/768/1440, reduced-motion all verified via agent-browser (pending dev server).
- [x] Page reads premium (Linear/Stripe), gold rare & luminous, copy confident/human, interactions quiet-with-2-signatures. Ready for review.

---

## Risks and Mitigations

| Risk                                                  | Impact | Mitigation                                                                                                                                           |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gold reads gaudy / "Vegas" instead of premium         | High   | Strict budget (≤ ~3 gold moments/viewport + 1–2 signatures); gold only as gradient+glow on dark, never flat fill; anchor to Linear/Stripe restraint. |
| "Swap one orange for another" — still flat            | High   | Task 2 audit forces per-touchpoint classification + more negative space, not a hue swap.                                                             |
| Light theme breaks during reskin                      | Med    | Every gold/amber token gets a light-theme override (Task 1); agent-browser checks both themes each reskin task.                                      |
| Over-animation reads as AI-template                   | Med    | 1–2 signature moments only; 100–300ms; transform/opacity; restraint enforced in Task 8 criteria.                                                     |
| Reduced-motion regressions                            | Med    | All motion funnels through one gated primitives layer (Task 7); explicit reduced-motion verification per checkpoint.                                 |
| Removing CAPABILITIES leaves an empty section/heading | Low    | Task 3 criteria require cleaning the consuming markup + no orphaned heading/gap.                                                                     |

## Open Questions

- Exact gold hex/gradient stops (Task 1 will propose; tune against the real dark canvas in-browser).
- Whether the hero eyebrow is trimmed entirely or replaced with a non-dated descriptor (default: replace with a crisp value descriptor).

## Parallelization

- **Parallel-safe:** Task 3 (removals) alongside Phase 1; Task 7 (primitives) alongside Phase 2/early Phase 3.
- **Sequential:** Reskin (5→6) after audit; micro-interaction application (8) after reskin + primitives.

---

## Amber Touchpoint Audit (Task 2 Output)

All `#c98a5a` (accent) and `#a89888` (ink-muted) usages across Landing components and `style.scss`.

### Signature Moments (Gold — 2 chosen)

1. **Hero headline gold-shimmer on load** — `LandingHero.vue` hero title gets `gradient-gold` text clip + shimmer sweep on entrance
2. **Primary CTA magnetic gold glow** — `LandingNav.vue` and `PricingTeaser.vue` primary CTA buttons get `shadow-gold-glow` + magnetic hover

### Per-Component Classification

| File                      | Line(s)               | Element                        | Current Value                           | Classification                                              |
| ------------------------- | --------------------- | ------------------------------ | --------------------------------------- | ----------------------------------------------------------- |
| `LandingHero.vue`         | hero\_\_dot bg        | Brand dot indicator            | `#c98a5a`                               | **keep-ambient** (small decorative dot)                     |
| `LandingHero.vue`         | hero\_\_eyebrow color | Eyebrow text                   | `#a89888`                               | **keep-ambient** (ink-muted, recedes)                       |
| `LandingNav.vue`          | 110                   | `.nav__brand-accent` "AI" text | `#c98a5a`                               | **keep-ambient** (brand identity dot-color)                 |
| `LandingNav.vue`          | 121                   | Nav link color                 | `#a89888`                               | **keep-ambient** (ink-muted)                                |
| `LandingNav.vue`          | 133                   | Nav CTA `background`           | `#c98a5a` flat fill                     | **promote-to-gold** (primary CTA → gold glow, no flat fill) |
| `LandingNav.vue`          | 161                   | Active nav link                | `#c98a5a`                               | **keep-ambient** (indicator, thin accent)                   |
| `CapabilitiesSection.vue` | 66                    | `.caps__sub` color             | `#a89888`                               | **keep-ambient** (ink-muted text)                           |
| `CapabilitiesSection.vue` | 107                   | `.model__pro` color/border     | `#c98a5a`                               | **keep-ambient** (Pro badge, ambient accent)                |
| `CapabilitiesSection.vue` | 137                   | `.spec__value` color           | `#c98a5a`                               | **DELETED** (CAPABILITIES block removed in Task 3)          |
| `CapabilitiesSection.vue` | 143                   | `.spec__label` color           | `#a89888`                               | **DELETED** (CAPABILITIES block removed in Task 3)          |
| `PricingTeaser.vue`       | 95                    | Muted text                     | `#a89888`                               | **keep-ambient** (ink-muted)                                |
| `PricingTeaser.vue`       | 134                   | Primary CTA `background`       | `#c98a5a` flat fill                     | **promote-to-gold** (gold glow, no flat fill)               |
| `PricingTeaser.vue`       | 180–181               | Check-mark borders             | `border-left/bottom: 2px solid #c98a5a` | **demote-hairline** (use `accent-line` or thin amber)       |
| `PricingTeaser.vue`       | 193                   | Feature highlight text         | `#c98a5a`                               | **keep-ambient** (subtle accent text)                       |
| `FaqSection.vue`          | 90                    | Chevron color                  | `#c98a5a`                               | **keep-ambient** (interactive indicator)                    |
| `FaqSection.vue`          | 93                    | Focus outline                  | `outline: 2px solid #c98a5a`            | **keep-ambient** (accessibility, spec mandated)             |
| `FaqSection.vue`          | 112                   | Expand indicator bar           | `background: #c98a5a`                   | **keep-ambient** (thin bar, small decorative)               |
| `FaqSection.vue`          | 142                   | Answer text color              | `#a89888`                               | **keep-ambient** (ink-muted)                                |
| `FinalCta.vue`            | 51                    | Sub-copy color                 | `#a89888`                               | **keep-ambient** (ink-muted)                                |
| `LandingButton.vue`       | 49                    | Focus ring                     | `outline: 2px solid #c98a5a`            | **keep-ambient** (accessibility, spec mandated)             |
| `style.scss`              | —                     | (none found)                   | —                                       | —                                                           |

### Summary

- **Promote to gold:** 2 elements (nav CTA background, pricing CTA background) — these are the 2 signature moments
- **Demote to hairline/tint:** 1 element (PricingTeaser check-mark borders → thinner, more ambient)
- **Keep ambient:** 14 elements (all other accents stay as amber at their current role)
- **Deleted:** 2 elements (CAPABILITIES spec values — removed in Task 3)
