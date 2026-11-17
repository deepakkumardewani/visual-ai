CHANGES · P4 cutout cards: the original insets touch their subjects (sneakers worst); P8 CTA glow and hover pass

## PASSED

- P8 · shots/phase8 v3-1440-hover-tileA/B/C and v3-1920-hover-tileA/B show a copper cursor light at about the same size and strength as the hero (CTA 34rem radial peaking at 0.2; hero `LIGHT_RADIUS_PX` 340 at 0.16). The rim uses the page accent (201 138 90 = `--tw-accent`). The 10px lift never reaches the copy column: the tower tile keeps a gap of about 45px or more at 1440. The copy sits at z-index 1 above the light and the wall, so headline and body contrast match v3-1440-rest. In v3-1440-hover-button and v3-1920-hover-button the gold "Start free" stays the single focal point. Reduced motion and 390 show a static wall with no hover and keep the same hierarchy.

## BLOCKING

- P4 · [ui] · apps/web/src/utils/landing.ts:85 · In v3-1440-ch5-mid.png and v3-1920-ch5-mid.png the bottom edge of the sneakers' "original" inset touches the left shoe's toe. The thumbnail reads as jammed onto the cutout, which undoes the before/after reading the card exists for. · In CUTOUT_SNEAKERS_FRAMING, lower focusY from 63 to about 56, or zoom from 1.4 to about 1.3, so the shoes drop and the toe clears the inset by at least 12px. Re-shoot at 1440, 1920 and 390.
- P4 · [ui] · apps/web/src/components/LandingV2/ToolCutoutCards.vue:100 · The other two insets are also tangent to their subjects: the woman inset grazes her hair and the dog inset grazes its ear (v3-1440-ch5-mid.png, v3-1920-ch5-end.png), so the top-left corner looks crowded in all three cards. · In `.cutouts__original`, reduce width from 30% to about 26% and move top/left from 6px to 8px so each inset sits in clear checkerboard.

## ADVISORY

- P4 · [ui] · ToolCutoutCards.vue:107 · The inset's 1px white border at 0.55 is the brightest line in the chapter and pulls the eye from the subject. · Use `rgb(var(--tw-hairline))` or `rgb(var(--tw-ink) / 0.25)`.
- P4 · [ui] · ToolCutoutCards.vue:83 · The card radius is 6px, while the neighbouring chapter frames (ch3-mid, ch4-mid) and the CTA tiles are rounder. · Use the shared `card` radius (12px, tailwind.config.js:55) and about 6px on the inset.
- P4 · [ui] · ToolCutoutCards.vue:72 · Ruling on the faint checkerboard: at 0.05 it still reads as "transparent" at 1440, 1920 and 390 and stays behind the subject. Keep the strength (0.06 at most). · Express it as `rgb(var(--tw-ink) / 0.05)` to follow "tokens only".
- P4 · [ui] · v3-390-stacked.png, the cluster · Ruling on the roughly 100px cards: the cutouts are still recognisable, but the roughly 29px insets turn into decoration. Acceptable. · Optionally let the cluster use the full content width on narrow screens, so each card is about 30% of the viewport.
- P4 · [ui] · v3-1440-ch5-mid.png vs ch3-mid/ch4-mid · The cutout cluster (x 677–1347, top about 297) is narrower than the compare frame and starts lower (x 648–1376, top 258), so the media column shifts at chapter 5. · Align the cluster bounds to the compare frame box during the later layout rework.
- P8 · [ui] · FinalCtaScene.vue:80 · `bindCursorLight` listens on the wall, and the copy (z-index 1) sits above the wall. Moving the cursor across the centre column therefore fires pointerleave and fades the light out (v3-1440-hover-button shows no glow). The hero light stays on across its whole stage. · Bind the light to `.cta__stage`, or the section, instead of the wall. The light already sits under the copy, so contrast is unaffected.
- P8 · [ui] · FinalCtaScene.vue:138 · `--cta-warm: 201 138 90` duplicates `--tw-accent` (style.scss:50). The hero lifts the accent toward paper white so it "warms rather than tints" (glHeroScene.ts:37). · Use `var(--tw-accent)`. Optionally ease the gradient toward the ink colour so the light matches the hero's paler warmth.
- P4/P8 · [process] · v2-1440-ch5-mid.png looks identical to v3-1440-ch5-mid.png, and v2-1440-hover-tile.png looks identical to v3-1440-hover-tileA.png. These are not real "before" baselines, or v2 now carries the changes. · Re-shoot the baselines from the unchanged route.

## Summary

- P4: three real, recognisable cutouts with their originals, a quiet checkerboard and a staggered rise that suits the section. What remains is composition: the insets touch their subjects, worst on the sneakers.
- P8: a restrained, on-brand copper light with a matching rim and a short transform-only lift. The copy and gold button stay clearly in front. The light dropping out over the copy is the only gap from the hero's feel.
- Keep: P4's low-contrast checkerboard and staggered three-card cluster; P8's single copper light under the copy, transform-only lift, and the gold "Start free" as the one focal point.
