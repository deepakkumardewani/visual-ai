CHANGES · P4 has one blocker (the cutout cue disappears in v1 light theme, and there is no v1 proof); P8 passes

## PASSED

- P8 · shots v3-1440-hover-tileA/B/C, hover-button, rest, reduced-motion, v3-390-mobile. The wall stays `aria-hidden` and holds only divs and `alt=""` imgs, so nothing is focusable. The copy is `z-index: 1` above the wall (FinalCtaScene.vue:210-212), so the light fades on pointerleave as the cursor reaches the buttons (hover-button shot). Hover rules and `bindCursorLight` are both gated on `(hover: hover) and (pointer: fine)` plus 900px, which matches `DESKTOP_QUERY`. Reduced motion has no light, lift or rim (shot). Mobile tiles are `--static` with no hover. CSS `translate` composes with the scrub's inline `el.style.transform`, which `applyProgress` sets directly rather than through GSAP, so there is no jump (tileB is lifted and vertical). Listeners are removed in the useSceneMotion cleanup (useCursorLight.ts:31-35), which `media.revert()` runs on unmount. Only transform and opacity animate. The `getBoundingClientRect` read per move is followed by ticker-batched writes, so there is no thrash.

## BLOCKING

- P4 · [ux] · apps/web/src/components/LandingV2/ToolCutoutCards.vue:72,85-88,107 (rendered on v1 via components/Landing/LandingToolMedia.vue:15 on `/` and the `/remove-background` hero) · The checker tone `rgb(255 255 255 / 0.05)` and the inset border `rgb(255 255 255 / 0.55)` are hard-coded white. In v1 the theme is user-toggleable (stores/app.ts:43,209), and in light theme `--tw-surface-2` is 232 224 214, so the checkerboard and the inset frame are effectively invisible. The cards then read as plain beige tiles, and the "background removed" cue, which is the whole message of the chapter, is lost. There are no v1 shots at all, so this surface is unproven. · Fix: derive both tones from the theme ink: checker `rgb(var(--tw-ink) / 0.06)` and inset border `rgb(var(--tw-ink) / 0.5)`. Dark `--tw-ink` is 240 232 220 in both style.scss and landingV2.scss, so v3 stays near-identical. The alternative is a `:global(html:not(.tw-dark))` override, which already has precedent at SideBySide.vue:242. Then add proof shots of `/` and `/remove-background` at 390 and 1440 in light and dark.

## ADVISORY

- P4 · [ux] · ToolCutoutCards.vue:58-65 · ToolWipe labels its sides with visible "Before"/"After" tags, but the cutout inset has none. Desktop reads fine, helped by the heading "Subject in. Backdrop out." At 390 the inset is about 30px wide (v3-390-stacked.png), and about 24px at 320. · Add a tiny `aria-hidden` "Original" tag on the inset, or set a min width on the inset (for example `max(30%, 44px)`), so the before/after pair reads cold on phones.
- P4 · [ux] · ToolCutoutCards.vue:54,62 · `loading="lazy"` is correct on v3 because `preloadImages` flips `data-stage-img` to eager before the pin. On the v1 `/remove-background` page, though, these cards are the above-the-fold hero media and load late. · Allow an `eager` prop from FeatureLandingHero.
- P4 · [ux] · v3-1920-ch5-end.png, v3-1440-ch5-mid.png · The sneakers cutout at zoom 1.4 is clipped at the card's left edge, and the inset overlaps the laces. · Lower the zoom to about 1.3, or nudge `focusX`.
- P4 · [a11y] · ToolCutoutCards.vue:52,61 · Six images are announced per chapter. The alts are meaningful and consistent with ToolWipe ("X, original photo" / "X, background removed"), so this is acceptable. If quieter output is wanted, put one figcaption-style alt on the cutout and make the inset `alt=""`.
- P4 · [test] · apps/web/src/utils/landing.test.ts:50 and the asset block at 82-99 (failures reported at :93 and :98) · I confirmed this is the only fallout: 4 failures, all in this file, and the other 21 landing test files pass. The `undefined` cases mean the six new `remove-bg-*` webp files currently have no existence check. Extend `toolMediaUrls` with the `cutout` pairs.
- P4 · Notes · The assets are 55 to 152 KB webp (largest is pet-cutout at 152 KB), so they are fine. `toolsTimeline.ts` has no diff. ch5 renders the same entering forward, entering back from below, and with reduced motion (v3-1440-ch5-mid, ch5-mid-back, reduced-motion shots). The images have no width/height attributes, but the boxes are sized by `aspect-ratio` and absolute insets, so nothing shifts.
- P8 · [ux] · FinalCtaScene.vue:267-290 · On a fine pointer the wall now takes pointer events, so tiles lift as if clickable but do nothing, and their `<img>` can be dragged or saved from the right-click menu. · Add `draggable="false"` and `pointer-events: none` on `.cta__img`. This is a taste call on the lift-implies-click affordance.
- P8 · [ux] · useCursorLight.ts:25-35 · The fade tweens are created in event handlers, outside the matchMedia context. If reduced motion is toggled mid-hover, the light can stay at opacity 1 after cleanup. · Call `gsap.set(light, { opacity: 0 })` in the returned cleanup.
- P8 · [ux] · FinalCtaScene.vue:236 (desktop `.cta__copy` at 46% width) · The copy box swallows hover over the tile edges beneath it, and the light fades whenever the cursor crosses the heading area. This is acceptable because it keeps the buttons dominant. To soften it, set `pointer-events: none` on `.cta__copy` and `auto` on its text and actions.
- P8 · Evidence caveat · The phase8 shots show CTA sub-copy ("refresh every day") that differs from the current `FREE_CREDITS_COPY` ("reset daily"). That copy belongs to another phase and was not reviewed.

## Summary

- P4: the cutout cards read well on v3 at desktop and in reduced motion. The assets are small, there is no layout shift, the timeline is untouched, and the only test fallout is landing.test.ts.
- P4 is blocked because hard-coded white checker and inset tones vanish in the v1 light theme (`/`, `/remove-background`), and no v1 shots exist.
- P8: decorative and inert for keyboard and screen readers, buttons stay on top, gated to fine pointers, correct under reduced motion, and transform/opacity only. PASS.

Must-fix:

1. P4 · ToolCutoutCards.vue:72,107: make the checker and inset-border tones theme-aware (`rgb(var(--tw-ink) / …)`), then add shots of `/` and `/remove-background` at 390 and 1440 in light and dark.

Optional: P4 inset "Original" tag or min width on phones; eager loading in the v1 hero; sneakers zoom; landing.test.ts covering cutout URLs. P8 `draggable="false"`/`pointer-events: none` on tile imgs; reset light opacity in cleanup.
