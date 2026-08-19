# DESIGN.md — Visual AI Landing Page Design System

> Single source of truth for the dark editorial redesign.
> All tokens flow into `tailwind.config.js`. No value lives in two places.

---

## 1. Design Direction

**Mood:** Dark, editorial, gallery-like. The photographs carry the color — the UI recedes.  
**Target feel:** Warm, human, trustworthy — not cold, not technical, not AI-template.  
**Light theme:** Remains functional and elegant; not an afterthought, not rebuilt.

---

## 2. Color Palette

### Canvas & Surfaces

| Token       | Hex       | Usage                                       |
| ----------- | --------- | ------------------------------------------- |
| `canvas`    | `#0D0A07` | Page background (near-black, subtle warmth) |
| `surface-1` | `#15110D` | Elevated cards, panels                      |
| `surface-2` | `#1D1712` | Hover states, nested surfaces               |
| `surface-3` | `#2A2119` | Active states, borders on dark              |

### Text

| Token         | Hex       | Usage                              |
| ------------- | --------- | ---------------------------------- |
| `ink-primary` | `#F0E8DC` | Primary body text (warm off-white) |
| `ink-muted`   | `#A89888` | Secondary/metadata text            |
| `ink-faint`   | `#6B5E51` | Disabled, placeholder              |

### Accent — two-tier system

**Tier 1 — Amber (ambient):** Warm amber is the ambient tonal signal. Use for hairlines, icon tints, brand dots, subtle borders, and secondary text accents. Recedes into the background; never dominates.

| Token           | Hex         | Usage                                                  | Budget            |
| --------------- | ----------- | ------------------------------------------------------ | ----------------- |
| `accent`        | `#C98A5A`   | Active indicators, icon accents, Pro badges, hairlines | Ambient — many OK |
| `accent-hover`  | `#D9996A`   | Hover state of accent elements                         | Per element       |
| `accent-subtle` | `#C98A5A1A` | Tinted backgrounds (10% opacity)                       | Ambient — many OK |

**Tier 2 — Gold (precious):** Metallic gold is the rare "precious" highlight. Always rendered as a gradient or with a glow — never a flat fill. Reserved for the 1–3 highest-impact moments per viewport.

| Token              | Value                                               | Usage                                | Budget                          |
| ------------------ | --------------------------------------------------- | ------------------------------------ | ------------------------------- |
| `gold.DEFAULT`     | `#C9A84C`                                           | Gold text, thin gold borders         | Rare — ≤ 3 moments/viewport     |
| `gold.muted`       | `#9E7D35`                                           | Deeper gold for borders/muted states | Rare                            |
| `gradient-gold`    | `135deg #E8C96B→#C9A84C→#9E7D35`                    | Gradient-clipped hero headline text  | 1–2 signature moments           |
| `shadow-gold-glow` | `0 0 32px rgba(201,168,76,0.35)…`                   | Luminous glow on primary CTA         | 1 per section max               |
| `accent-line`      | hairline gradient transparent→gold-tint→transparent | Section dividers, key separators     | Ambient — replaces flat borders |

**Anti-patterns:**

- No flat gold fills (always gradient + glow on dark)
- Gold ≤ ~3 moments per viewport (signature moments aside)
- Amber never replaces gold in headline/CTA roles
- Light theme: gold text uses `gold.muted` for contrast; gold glow reduced to `0.15` opacity
- Background is near-black; gold/amber are subtle highlights only — never an ambient wash

**Light theme gold/amber overrides:** Use `gold.muted` for gold text on light backgrounds. Reduce `gold-glow` shadow opacity by ~60%. Amber tints remain but at 50% opacity.

### Light Theme Overrides

| Token               | Hex       | Usage                 |
| ------------------- | --------- | --------------------- |
| `canvas-light`      | `#FAF6F1` | Light page background |
| `surface-1-light`   | `#F2EBE3` | Light card surface    |
| `ink-primary-light` | `#1C140E` | Dark text on light    |
| `ink-muted-light`   | `#7A6B5E` | Muted text on light   |

### Semantic / Utility

| Token          | Hex       | Usage                        |
| -------------- | --------- | ---------------------------- |
| `border`       | `#2A2119` | Dividers, card outlines      |
| `border-light` | `#D9CFC6` | Dividers on light background |

---

## 3. Typography

### Font Pairing

| Role                    | Family          | Weights       | Rationale                                                                  |
| ----------------------- | --------------- | ------------- | -------------------------------------------------------------------------- |
| **Display / Headlines** | `Young Serif`   | 400, 700      | Warm editorial serif — craft, memory, restoration without template clichés |
| **Body / UI**           | `Source Sans 3` | 400, 500, 600 | Clean humanist sans — readable at all sizes                                |

Both served via Google Fonts in `index.html` (`font-display: swap`; preconnected).

### Type Scale (Tailwind `fontSize`)

| Token         | Size            | Leading | Usage                               |
| ------------- | --------------- | ------- | ----------------------------------- |
| `display-2xl` | 72px (4.5rem)   | 1.05    | Hero headline (desktop)             |
| `display-xl`  | 56px (3.5rem)   | 1.1     | Hero headline (mobile)              |
| `display-lg`  | 40px (2.5rem)   | 1.15    | Section titles                      |
| `display-md`  | 28px (1.75rem)  | 1.2     | Sub-section titles                  |
| `body-lg`     | 20px (1.25rem)  | 1.6     | Lead body copy                      |
| `body-base`   | 16px (1rem)     | 1.65    | Standard body                       |
| `body-sm`     | 14px (0.875rem) | 1.6     | Captions, metadata                  |
| `eyebrow`     | 12px (0.75rem)  | 1.5     | Eyebrow labels (uppercase, tracked) |

---

## 4. Spacing Scale

Uses Tailwind's default scale (4px base). Key layout values:

| Token                      | Value                                           | Usage                           |
| -------------------------- | ----------------------------------------------- | ------------------------------- |
| Section vertical padding   | `py-24` (96px) desktop / `py-16` (64px) mobile  | Breathing room between sections |
| Content max-width          | `max-w-6xl` (72rem / 1152px)                    | Main content column             |
| Section horizontal padding | `px-6` mobile / `px-8` tablet / `px-12` desktop | Content gutters                 |
| Card padding               | `p-6` (24px)                                    | Internal card spacing           |
| Element gap                | `gap-4` (16px) base, `gap-6` (24px) medium      | Grid/flex gaps                  |

---

## 5. Border Radius

| Token         | Value    | Usage               |
| ------------- | -------- | ------------------- |
| `radius-sm`   | `6px`    | Small chips, tags   |
| `radius-md`   | `12px`   | Cards, inputs       |
| `radius-lg`   | `20px`   | Large feature cards |
| `radius-full` | `9999px` | Pills, avatar rings |

---

## 6. Elevation / Shadow

Shadows are warm-tinted (no cold grey).

| Token             | Value                             | Usage                      |
| ----------------- | --------------------------------- | -------------------------- |
| `shadow-card`     | `0 4px 24px rgba(0,0,0,0.4)`      | Default card elevation     |
| `shadow-elevated` | `0 8px 40px rgba(0,0,0,0.55)`     | Modal, hero visual         |
| `shadow-accent`   | `0 4px 24px rgba(201,138,90,0.2)` | Accent glow on CTA buttons |

---

## 7. Motion Principles

### Philosophy

- Motion **reveals** content and guides attention — never entertains for its own sake.
- Every animation must answer: "Does this help the user understand?"

### Timings

| Token            | Value    | Usage                             |
| ---------------- | -------- | --------------------------------- |
| `duration-fast`  | `150ms`  | Micro-interactions (hover, press) |
| `duration-base`  | `300ms`  | State transitions, reveals        |
| `duration-slow`  | `600ms`  | Page entrance, section reveals    |
| `duration-crawl` | `1200ms` | Parallax, ambient drift           |

### Easing

| Token              | Value                        | Usage                             |
| ------------------ | ---------------------------- | --------------------------------- |
| `ease-out-expo`    | `cubic-bezier(0.16,1,0.3,1)` | Entrances — fast start, soft land |
| `ease-in-out-soft` | `cubic-bezier(0.4,0,0.2,1)`  | State transitions                 |
| `ease-spring`      | GSAP `"power2.out"`          | Interactive drag feedback         |

### Scroll Reveals

- Translate Y `32px → 0` + opacity `0 → 1` over `600ms ease-out-expo`.
- Stagger siblings `80ms` apart.
- **Trigger once only** — no re-trigger on scroll up.

### Hero Entrance

- Headline: staggered character/word reveal via GSAP.
- Ambient motion: very slow parallax on the before/after image (`1200ms`, small offset).

### Reduced-Motion Stance

- All GSAP timelines and ScrollTrigger instances gated by `useReducedMotion()`.
- Under `prefers-reduced-motion: reduce`: no translate/opacity animations; Lenis smooth scroll
  disabled; native browser scroll only; transitions capped at `150ms opacity`.
- **Never** suppress content — only suppress motion.

---

## 8. Component Conventions

- Native HTML + Tailwind in landing sections — no leftover `v-*` presentational tags.
- All interactive elements: visible focus ring using `outline: 2px solid #C98A5A` + `outline-offset: 3px`.
- Minimum touch target: 44×44px.
- AA contrast minimum: 4.5:1 for body, 3:1 for large text (both themes).

---

## 9. Asset Strategy

- **Photos are the color** — place them on dark canvas with minimal UI chrome around them.
- Feature videos: lazy-load, play in-view, pause off-view, muted autoplay, no controls shown.
- Gallery images: lazy-load with `loading="lazy"`, `aspect-ratio` reserved to prevent CLS.
- Cloudinary base URL: `VITE_CLOUDINARY_ASSETS_URL` env var.
