# Visual AI: design system for the media studios

Visual AI is a dark-first web app for creators. Brand: **warm, refined, quiet**. It should feel like an atelier, not a tech console. The user's media is the artwork and the chrome recedes. Every value below comes from the code, and the files are listed under Sources. Values marked **(layout constant)** are product decisions from the brief and are not tokens yet. Values marked **(gap)** are missing in code, so use the stated stand-in.

## 1. Colour

Tokens are RGB channels, used as `rgb(var(--tw-x) / <alpha>)`. Dark is the default theme and is switched on by a `.tw-dark` class on `<html>`. Light is `:root`.

| Token | Dark (channels) | Dark hex | Dark oklch | Light (channels) | Light hex | Light oklch | Use |
|---|---|---|---|---|---|---|---|
| `--tw-canvas` | `9 7 5` | #090705 | oklch(13.0% 0.007 71.9) | `250 246 241` | #FAF6F1 | oklch(97.5% 0.008 73.7) | Page background |
| `--tw-surface-1` | `15 12 9` | #0F0C09 | oklch(15.7% 0.008 67.5) | `242 235 227` | #F2EBE3 | oklch(94.3% 0.013 71.3) | Panels, composer, cards |
| `--tw-surface-2` | `23 18 14` | #17120E | oklch(18.7% 0.011 60.7) | `232 224 214` | #E8E0D6 | oklch(91.0% 0.016 73.7) | Hover, nested surface, popovers |
| `--tw-surface-3` | `35 28 21` | #231C15 | oklch(23.2% 0.017 66.8) | `217 207 198` | #D9CFC6 | oklch(86.0% 0.017 64.6) | Active/pressed, selected wash |
| `--tw-ink-primary` (= `--tw-ink`) | `240 232 220` | #F0E8DC | oklch(93.4% 0.018 78.2) | `28 20 14` | #1C140E | oklch(19.9% 0.017 58.4) | Primary text |
| `--tw-ink-secondary` | `210 198 184` | #D2C6B8 | oklch(83.3% 0.023 71.7) | `90 76 64` | #5A4C40 | oklch(42.7% 0.027 62.6) | Secondary text (gap: no `tw-text-ink-secondary` utility yet) |
| `--tw-ink-muted` | `186 170 154` | #BAAA9A | oklch(74.7% 0.029 67.4) | `122 107 94` | #7A6B5E | oklch(53.8% 0.027 63.1) | Metadata, captions |
| `--tw-ink-faint` | `148 132 116` | #948474 | oklch(62.3% 0.030 67.2) | `168 152 136` | #A89888 | oklch(68.9% 0.030 67.3) | Placeholder, disabled. Light faint is below 4.5:1, so never use it for running text |
| `--tw-hairline` | `58 47 36` | #3A2F24 | oklch(31.4% 0.025 66.7) | `217 207 198` | #D9CFC6 | oklch(86.0% 0.017 64.6) | 1px dividers, the default edge |
| `--tw-border` | `64 52 40` | #403428 | oklch(33.4% 0.026 66.7) | `217 207 198` | #D9CFC6 | oklch(86.0% 0.017 64.6) | Control outlines |
| `--tw-border-light` | `217 207 198` | #D9CFC6 | oklch(86.0% 0.017 64.6) | `42 33 25` | #2A2119 | oklch(25.6% 0.020 63.4) | Inverted border. It is dark in light mode, so treat it as "contrast border" |
| `--tw-accent` (copper) | `201 138 90` | #C98A5A | oklch(68.6% 0.100 57.4) | same | same | same | Rare: status dots, active indicator, focus ring, section rules |

**Accent tiers (from the Tailwind config):**

| Name | Value | oklch | Rule |
|---|---|---|---|
| `accent` | #C98A5A | oklch(68.6% 0.100 57.4) | The copper "wax seal". Use it rarely |
| `accent.hover` | #D9996A | oklch(73.5% 0.099 56.8) | Hover on accent elements |
| `accent.subtle` | rgba(201,138,90,0.10) | - | Tinted wash behind selected items |
| `gold` | #C9A84C | oklch(74.3% 0.117 89.5) | Precious highlight, at most 3 moments per viewport. Gap: there is no CSS variable and no light variant |
| `gold.muted` | #9E7D35 | oklch(60.7% 0.099 84.2) | Gold on light backgrounds, and gold borders |
| eyebrow copper | #D29467 | oklch(71.7% 0.096 56.5) | `.eyebrow` labels on dark (7:1 on canvas) |

**Per-studio accent (`--studio-accent`, set on a `[data-studio]` scope).** Each pair keeps at least 4.5:1 on canvas, surface-1 and surface-2. The code already uses it as the fill of primary studio buttons, for example the error card's "Try again" button. Use it for the studio's primary button fill, its focus outline and one identity mark. It is never a wash or a large area.

| Studio | Dark | Dark oklch | Light | Light oklch |
|---|---|---|---|---|
| song | #F49868 (`244 152 104`) | oklch(76.4% 0.128 47.7) | #A84218 (`168 66 24`) | oklch(51.2% 0.144 40.3) |
| music | #86ACF8 (`134 172 248`) | oklch(74.7% 0.118 263.5) | #2658AC (`38 88 172`) | oklch(47.4% 0.145 260.2) |
| speech | #4EC6BC (`78 198 188`) | oklch(75.7% 0.107 187.5) | #0A6C6A (`10 108 106`) | oklch(48.1% 0.080 192.5) |
| video | #DEA070 (`222 160 112`) | oklch(75.4% 0.097 58.3) | #8C4E1E (`140 78 30`) | oklch(48.9% 0.103 54.6) |
| tools | #CEC2B4 (`206 194 180`) | oklch(82.0% 0.024 71.7) | #54463A (`84 70 58`) | oklch(40.5% 0.027 62.5) |

Text on a studio-accent fill uses `--tw-canvas`.

**Sleeve (cover-art) palette:** only the copper / gold / ember / umber family derived from the tokens above (accent, accent.hover, gold, gold.muted, surface-3, ink-muted), with a small hue offset per asset. Never use blue, teal or purple in sleeves, even in Music or Speech.

## 2. Typography

Fonts load from Google Fonts: **Young Serif** at weight 400 only, and **Source Sans 3** at 400, 500 and 600. Do not use bold Young Serif, because 700 is not loaded.

| Token | Size | Line height | Tracking | Font | Use |
|---|---|---|---|---|---|
| `display-2xl` | clamp(2.75rem, 6vw, 4.5rem) | 1.05 | -0.02em | Young Serif | Not used in studios |
| `display-xl` | clamp(2.25rem, 5vw, 3.5rem) | 1.1 | -0.015em | Young Serif | Hero heading on the empty studio (max) |
| `display-lg` | clamp(1.75rem, 3.5vw, 2.5rem) | 1.15 | -0.01em | Young Serif | Hero heading (preferred), Library title |
| `display-md` | clamp(1.375rem, 2.5vw, 1.75rem) | 1.2 | - | Young Serif | Pane titles, track detail title |
| `body-lg` | 1.25rem | 1.6 | - | Source Sans 3 | Prompt field text |
| `body-base` | 1rem | 1.65 | - | Source Sans 3 | Body, lyrics, script |
| `body-sm` | 0.875rem | 1.6 | - | Source Sans 3 | Row meta, pills, buttons |
| `eyebrow` | 0.75rem | 1.5 | 0.18em, uppercase, 600 | Source Sans 3 | Section labels ("VERSE", "NOW PLAYING") |

Running text is never below 12px. Tabular numerals are used for durations and counters.

## 3. Spacing, radii, layout

- **Spacing:** the Tailwind default 4px scale. Useful steps are 4, 8, 12, 16, 24, 32, 48 and 64. Gaps are 16 inside a group and 24 to 32 between groups ("rhythm over uniformity").
- **Radii:** `chip`/`sm` 6px (chips, tags, small buttons). `card`/`md` 12px (cards, inputs, composer, popovers). `card-lg`/`lg` 20px (stage, modal, bottom sheet). `full` 9999px (pills, play buttons, avatars).
- **Layout constants:** these come from the brief and SPEC and are not tokens yet. Composer column 520px at 1024px and above (SPEC allows 480 to 560; all studios use the same width). Desktop content gutter 24 to 32px. Mobile gutter 16px. Touch targets are at least 44px.
- **Player offset:** the bottom player publishes its height as the CSS variable `--mini-player-h`, and content reserves `padding-bottom: var(--mini-player-h)`. Today's compact bar is 56px plus the safe-area inset. The new desktop player may be taller, but it reports through the same variable.

## 4. Elevation

Prefer hairline borders over shadows.

| Token | Value | Use |
|---|---|---|
| `shadow-card` | 0 4px 24px rgba(0,0,0,0.4) | Popover, floating card |
| `shadow-elevated` | 0 8px 40px rgba(0,0,0,0.55) | Modal, bottom sheet, player |
| `shadow-accent` | 0 4px 24px rgba(201,138,90,0.2) | Primary CTA hover only |
| `shadow-gold-glow` | 0 0 32px rgba(201,168,76,0.35), 0 4px 16px rgba(201,168,76,0.15) | At most one hero moment, on hover/active only |
| `shadow-gold-subtle` | 0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(158,125,53,0.45) | Resting cue on compact premium controls |

In light mode, cut shadow and glow opacity by about 60%. There is no glassmorphism and no backdrop blur. Popovers are solid `surface-2`.

## 5. Motion

| Token | Value |
|---|---|
| `ease-out-expo` (primary) | `cubic-bezier(0.16,1,0.3,1)` |
| `ease-soft` | `cubic-bezier(0.4,0,0.2,1)` (existing button press and transition helpers) |
| `duration-fast` | 150ms |
| `duration-base` | 300ms |
| `duration-slow` / `crawl` | 600ms / 1200ms. **Do not use in studios:** they break the 400ms cap |

Duration bands: 150 to 200ms for hover, press and focus; 250 to 300ms for select, toggle and popover; 350 to 400ms for state changes and arrivals.
- Animate **opacity and transform only**. Never `transition: all`, and never width, height, top or left.
- Nothing loops and nothing shimmers. Arrival plays once per new asset and does not replay on revisit.
- The focus ring is instant: 2px solid accent (or studio accent) with a 2 to 3px offset.
- Under `prefers-reduced-motion: reduce`, drop every transform and stagger, and use an instant switch or an opacity fade of 150ms or less.
- A result arrives cover first, then title and waveform, then actions, with a 40 to 80ms stagger and 400ms or less in total.

## 6. Iconography

The app has no icon library. Icons are custom inline SVG in `components/icons/` plus `ProviderIcon.vue`, which supplies real provider marks for the model picker. The dominant pattern is a 24×24 viewBox, 2px stroke, round caps and `currentColor`. Draw icons as simple line icons in that style. Do not use emoji. Do not mix icon styles. Decorative SVG is `aria-hidden`.

## 7. Voice and tone

Write plainly and kindly, and say what happened in plain words. Each message has one next step and is honest about cost ("No credits were used."). Use sentence case. Avoid buzzwords (seamless, supercharge, unlock, magic). Never invent metrics or use placeholder people. Copy that already exists in the code is fixed: see the exact strings in brief.md.

## 8. Component inventory

| Component | Anatomy | States |
|---|---|---|
| **Composer** | Surface-1 card (12px radius, hairline). Primary input (prompt, lyric sheet or script) on top, then a bottom row of pills, then Generate with the cost badge on the right. Hero variant: centred, wider, larger text, 2 to 3 example chips | idle, focused, typing, invalid (inline message), over budget, generating (identical geometry to idle), disabled (insufficient credits, with reason), hero, docked |
| **Pill + popover** | Full-radius pill: icon, value ("Auto duration") and chevron, `body-sm`. Popover: surface-2, 12px radius, shadow-card, anchored. Holds a segmented control or drill-in rows. Becomes a bottom sheet below 1024px | rest, hover, press, open (chevron rotated), focus, disabled (tooltip reason), value-changed |
| **Model picker** | Modal (1440, 20px radius) or bottom sheet (375). List on the left: provider mark, name, one-line strength, cost. Right side: details, limits and this model's settings (segmented or rows) with a live cost line. Primary "Use model" button (never wraps) | open, row hover, row selected (shape plus label), unavailable row (reason), search, closing |
| **Track row** | Play/pause, 40px sleeve, title (one line, ellipsis), waveform strip, duration, model, date, favourite, overflow. At 375: sleeve, title, duration, play, overflow | rest, hover (play appears over sleeve), focus, now playing (`aria-current`, pause glyph, "Playing" label plus progress tint), pending (stage text plus scaleX bar), new arrival, error ("Couldn't load audio" + Retry), selected (select mode), renaming (inline input) |
| **Sleeve (CoverArt)** | Deterministic abstract composition per asset at 40px (list), 48px (player) and 160px (card). Copper/gold/umber family. Decorative | default, with play overlay on hover, selected (checkmark) |
| **Waveform** | Vertical bars from real peaks, with the played part tinted by progress | placeholder (seeded bars), loaded, playing (progress tint), seek hover (current track only) |
| **Bottom player** | Fixed full-width bar above the safe area: sleeve, title, studio label, prev/play/next, waveform scrubber, elapsed/total, volume, close. At 375: two rows (sleeve, title, play; then scrubber) | hidden, playing, paused, blocked ("Tap to play"), loading, ended |
| **Library grid / list** | Type tabs (All, Images, Videos, Music, Songs, Speech, with counts when known), search, sort, Favorites pill. Masonry grid for visuals, track list for audio, grouped by date | default, loading (quiet, no shimmer), empty (per tab, one action), no results (clear search), error (Retry), select mode with rising action bar, rename, confirm delete, menu open |
| **Bottom sheet** | 375 only. Surface-1, 20px top radius, grab handle, title, content, primary action. Rises over a scrim | closed, open, dragging, with keyboard |
| **Toast** | Small surface-2 card, bottom-centre above the player. One line plus an optional action | info, success, failure (with "Undo"/"Retry" where real) |
| **Stage** | Video or image area for Video and the tools. 20px radius, poster first, controls styled to tokens | empty/drop, loading, generating (stages inside), result, error |
| **Cost badge** | Small chip beside Generate: credit glyph and number | normal, updating, insufficient |

## Sources

- `apps/web/src/style.scss`: all `--tw-*` channels (light `:root`, dark `.tw-dark`), `.eyebrow` (#d29467) and `.gold-glow-bg`.
- `apps/web/tailwind.config.js`: accent, gold, font families, the fontSize scale, borderRadius, transitionDuration, transitionTimingFunction, boxShadow, `gradient-gold`, `accent-line`, `darkMode: ['selector', '.tw-dark']` and the `tw-` prefix.
- `apps/web/tailwind.semantic-plugin.js`: `STUDIO_ACCENTS`, `--studio-accent` and the token utilities (shows that `ink-secondary` has no utility).
- `apps/web/index.html`: the Google Fonts weights (Young Serif 400; Source Sans 3 400/500/600).
- `apps/web/src/components/Audio/MiniPlayer.vue`: `--mini-player-h` and `MINI_PLAYER_BAR_PX = 56`.
- `apps/web/src/components/Studio/StudioErrorState.vue`: studio-accent button fill, 44px min height and the focus outline.
- `apps/web/src/composables/useDashboardMotion.ts`: the existing press scale (.98) and duration helpers.
- `apps/web/src/components/icons/`, `components/primitives/ProviderIcon.vue`: icon style (24 viewBox, 2px stroke, round caps), inferred from the dominant SVG attributes.
- `.impeccable.md` (repo root): brand, motion bands, opacity/transform only, anti-references, and the "tokens only" rule.
- `apps/web/DESIGN.md`: the gold budget, the light-mode glow reduction, the 44px target and AA contrast. Its hex tables are stale landing-page values and are **not** used. `style.scss` wins.
- `~/.claude/docs/build-phases/ui-floor.md`: never gradient text, no emoji icons, 12px minimum.
- `agent_docs/media-studio-redesign/SPEC.md`: R3 (480 to 560 composer), R16, R58 to R59 (sleeve family and sizes), R63 and R67.
- Not used: `apps/web/.impeccable.md`, which describes a different product (photo restoration).
