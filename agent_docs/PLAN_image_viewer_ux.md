# Image Viewer Page — UX Plan

Context: Explore images should open a **dedicated page** (not lightbox modal). Product today supports: remix prompt, download, favorite, delete (own), model/prompt metadata, reference image input, upscale feature. Does **not** have Canva / Magic Layers / Create Video / inpainting bar.

## 1. UX critique of the reference

**Cluttered**

- Right rail stacks creator + prompt + tech tags + 6 primary CTAs + utility icons — competes with the image.
- Duplicate nav (left thumbnails + implied swipe) without a clear primary browse model.
- Bottom inpainting composer turns a _viewer_ into a second generator — cognitive split.
- Blurred full-bleed background + chrome on all sides shrinks the hero image.

**Weak**

- Feature dump (Canva / Magic Layers / Video) reads as marketplace, not craft tool.
- Heart-on-image + utilities + stacked buttons = no clear primary action.
- Tech params (seed, CFG, steps) always visible — noise for casual explore browsing.
- Close-X on overlay pattern conflicts with “new page” mental model (back vs dismiss).

## 2. Recommended layout (ours)

### Desktop (≥1024)

- Top bar: Back to Explore · counter · Favorite · Download
- Center (≥60%): full-size image, soft dark canvas, prev/next chevrons; no busy blurred duplicate bg
- Right panel (~320–360px): creator → prompt + Copy → model · size → Remix (primary) → Use as ref / Upscale → Share · More
- Optional left filmstrip: thin, auto-hide when feed is short; scroll/keyboard primary

### Mobile

- Full-bleed image; horizontal swipe to browse
- Details sheet (or “Details” tap) for prompt + actions
- Top: back, counter, ♥ / download only

## 3. Navigation model

| Concern    | Recommendation                                            |
| ---------- | --------------------------------------------------------- |
| Route      | `/explore/:id` (or `/dashboard/explore/:id`)              |
| History    | Real page → browser Back returns to feed                  |
| Keyboard   | `←/→` or `J/K` prev/next; `Esc` back; `C` copy; `R` remix |
| Scroll     | Wheel vertical = next/prev (debounced); optional          |
| Deep link  | Shareable URL per image                                   |
| State      | Explore store cursor (id list); prefetch neighbors        |
| Thumbnails | Desktop optional; skip on mobile                          |

Replace modal `ImageDialog` for explore opens; keep modal only for quick “my generations” if needed later.

## 4. Show vs hide

### Always show

- Full-size image, author + relative date
- Prompt (truncate + expand) + Copy
- Model name + aspect/dimensions
- Remix (primary — already on CommunityCard)
- Download, Favorite (signed in)

### Secondary / contextual

- Use as reference → Create + ReferenceImageControl
- Upscale (when available / owner)
- Share (native / copy link)
- Delete (owner only)

### Hide (reference noise)

- Edit in Canva, Magic Layers, Create Video
- Bottom inpainting “Add or remove…” bar
- Always-visible seed / CFG / steps → **More → Details**
- Stacked equal-weight CTA column

## 5. Improvements over reference

1. **Page not lightbox** — shareable, correct back-stack, larger image
2. **One primary CTA: Remix**; others icon/overflow
3. **Browse-first** — keyboard + scroll/swipe; filmstrip secondary
4. **Honest features** — only remix, download, copy, ref, upscale, like/share
5. **Calm chrome** — no six text buttons + bottom generator
6. **Prompt as content** — readable + Copy/Remix, not buried
7. **Mobile sheet** — details don’t steal the image

## Implementation notes (later)

- Reuse `ExploreFeedItem` + explore store cursor
- Remix = existing feed remix → Create tab + prompt
- Use-as-reference = generate store reference + switch Create
- Migrate fav/download from `ImageDialog.vue` into page chrome
