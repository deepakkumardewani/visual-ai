# README research: patterns from well-regarded repos

Method: raw READMEs fetched read-only via `gh api repos/<r>/readme` (Nov 2026 snapshots). Counts are from the files.

## Per-repo notes

- [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) (124 lines)
  - Hero is a clickable `<picture>` cover with a dark-mode `<source>`, then a `<h4 align="center">` link row (Editor | Blog | Docs | Plus).
  - One `<h2>` tagline in a centered div. 6 badges in one centered `<p>`: license, npm downloads, PRs welcome, Discord, DeepWiki, Twitter (`style=social`).
  - A `<figure>` with `<figcaption>` holds the product showcase image.
  - Features are a flat emoji bullet list using `&nbsp;` after each emoji. Short. Ends with Quick start, Contributing, Sponsors.
- [dubinc/dub](https://github.com/dubinc/dub) (103)
  - Hero is a linked `<img>` uploaded via user-attachments. Centered `<h3>` name, tagline, then bold "Learn more »".
  - Anchor nav row: `<a href="#tech-stack"><strong>Tech Stack</strong></a> ·` ... Only 3 badges (Twitter follow, HN, license), all with `color=` overrides and `logo=`.
  - Tech stack is a one-line-per-tool list: `[Next.js](url) – framework`. A social-proof line ("250M+ clicks monthly, used by ...") sits in the intro.
  - Short README. Details live in the docs. Footer has a Repo Activity (star-history style) block, then License.
- [steven-tey/novel](https://github.com/steven-tey/novel) (104)
  - Same author and template as Dub. Hero image, then `<h1 align="center">`, tagline, 3 badges, anchor nav.
  - **Demo video is a bare user-attachments URL on its own line** under Introduction. GitHub auto-embeds it as a player.
  - Includes a "Deploy Your Own" section with one-click buttons.
- [shadcn-ui/ui](https://github.com/shadcn-ui/ui) (17)
  - Extreme minimalism: H1, one-paragraph pitch with bold hook, `![hero](opengraph-image.png)`, Docs link, Contributing, License. No badges, no TOC.
  - It works because the docs site carries the weight. Right model for "README as pointer".
- [supabase/supabase](https://github.com/supabase/supabase) (about 250)
  - Logo is `<picture>`-less: **two `<img>` tags with `#gh-light-mode-only` / `#gh-dark-mode-only` URL fragments**. This is the older trick. Prefer `<picture>` now.
  - Uses a `<kbd><img gif></kbd>` "watch this repo" GIF as a call to action.
  - Long translations list at the bottom. Architecture shown as an image, not mermaid.
- [calcom/cal.com](https://github.com/calcom/cal.com) (837, the repo now serves Cal.diy)
  - GitHub alert callouts at the top (`> [!WARNING]`, `> [!TIP]`) to set expectations. Centered logo, `<h3>`, link row.
  - 6 badges: license, stars, commits/month, Docker pulls, help wanted, Contributor Covenant. All use `purple` for a unified colour.
  - Full-width product screenshot (`<img width="100%">`). "Built With" list, then very long deploy and integration guides.
  - Too long: setup content should live in docs or CONTRIBUTING. Only one `<details>`.
- [formbricks/formbricks](https://github.com/formbricks/formbricks) (about 250)
  - Centered 120px logo, `<h3>` name, tagline, Website link. Badge row mixes license/stars/HN/Product Hunt/Linux Foundation health/Trendshift (credibility badges).
  - "Trusted by" logo strip on a pale `<div style>`. Emoji-prefixed H2 headings. Explicit `### Table of Contents` list.
  - Detailed license section with a "Why charge for Enterprise features?" explainer.
- [twentyhq/twenty](https://github.com/twentyhq/twenty) (about 200, the most designed)
  - Local logo (100px), `<h2 align="center">` tagline, a centered `·`-separated link row with 12px inline SVG icons.
  - Cover in `<picture>` with `prefers-color-scheme` dark and light `<source>`s, wrapped in a link.
  - "Everything you need" is a **`<table align="center">` grid** of 2 columns of webp screenshots, each with a caption link and a small icon.
  - Stack list has inline SVG logos at 14px. "Thanks" sponsor logos at `height="28"`. Closing "Join the Community" row.
  - Assets are committed in-repo (`/readme/*.webp`), so there are no external hosts.
- [documenso/documenso](https://github.com/documenso/documenso) (251)
  - Logo, tagline, 6-link nav row (Discord · Website · Docs · Issues · Releases · Roadmap), 5 badges including a Dev Containers badge.
  - Hero screenshot in `<div align="center"><img style="width: 80%">`.
  - Sections: About, Recognition (Product Hunt badges), Community and Next Steps (action checklist), Tech Stack, Local Development, Troubleshooting (Q&A headings), Repo Activity.
  - Candid contributing note: states policy up front.

## Patterns to steal (ranked)

1. **Dark/light `<picture>` hero** (Twenty, Excalidraw). Highest value, because it is the first thing seen and avoids a white box on dark GitHub.
   ```html
   <p align="center">
     <a href="https://visual-ai.example">
       <picture>
         <source media="(prefers-color-scheme: dark)" srcset="docs/readme/hero-dark.webp" />
         <img alt="visual-ai" src="docs/readme/hero-light.webp" /> </picture
     ></a>
   </p>
   ```
2. **Bare video URL on its own line** (Novel). Drag an .mp4 or .gif into the GitHub web editor (issue, PR or README edit box). It uploads to `github.com/user-attachments/assets/<id>`. Paste that URL alone on a line and GitHub renders an inline player. It must not be inside a tag or a link. Max about 10 MB for images/GIF, 100 MB for video. For a looping silent clip, an optimised GIF or animated webp in `<img>` is more reliable and also works in a `<picture>`.
3. **Centered identity block**: logo (100-120px), `<h3>` name, one-line tagline, then a `·`-separated link row.
   ```html
   <p align="center"><img src="docs/readme/logo.svg" width="100" alt="visual-ai logo" /></p>
   <h3 align="center">visual-ai</h3>
   <p align="center">
     Generate images and video from text. <br />
     <a href="LIVE_URL"><strong>Try it live »</strong></a>
   </p>
   ```
4. **Small badge row (3-6, one style, one colour accent)**. Pick signal over noise: licence, stars, last commit, CI, live status, framework. Always `alt` text. Keep to `style=flat`, plus `social` only for the stars badge.
   ```md
   [![License](https://img.shields.io/github/license/OWNER/REPO?color=7c3aed)](LICENSE)
   [![Stars](https://img.shields.io/github/stars/OWNER/REPO?style=flat&color=7c3aed)](https://github.com/OWNER/REPO/stargazers)
   [![CI](https://img.shields.io/github/actions/workflow/status/OWNER/REPO/ci.yml?label=CI)](...)
   ```
5. **Anchor nav row instead of a full TOC** (Dub, Novel): `<a href="#tech-stack"><strong>Tech Stack</strong></a> ·`. Compact. Use a plain bullet TOC (Formbricks) only if the README exceeds about 150 lines.
6. **2-column `<table>` feature grid with screenshots** (Twenty): scannable feature tour, with one caption and link per cell. Give images explicit `width` so cells stay equal.
7. **One-line-per-tool tech stack** (Dub): `[Next.js](url) – framework`. The dash-role format tells readers why each tool is there. Optional inline 14px SVG logos (Twenty).
8. **Short README that points to docs** (shadcn, Dub). Put long setup in `docs/` or CONTRIBUTING and keep the README under about 150 lines.
9. **Credibility strip**: "Trusted by" logos, HN/Product Hunt badges, usage numbers in the intro (Formbricks, Dub). For visual-ai use real numbers only, such as a generations count, once true.
10. **Alert callouts** for caveats (Cal): `> [!NOTE]`, `> [!WARNING]`. Good for "demo uses mock credits".
11. **Collapsible `<details>`** (barely used by these repos, so a gap). Use it for env var tables, long setup and FAQ so the main flow stays short.

    ```html
    <details>
      <summary>Environment variables</summary>

      | Var | Purpose | |---|---|
    </details>
    ```

    A blank line after `<summary>` is required, or markdown inside will not render.

12. **Troubleshooting as Q&A headings** (Documenso): each question is an H3, which is also searchable.

### What these READMEs omit (copy the omission)

No mermaid or architecture diagrams anywhere (none of the nine). Almost none show a roadmap section (they link to a hosted one). None use GIF-heavy walls, and none use more than 6 badges. visual-ai can stand out with one mermaid diagram, which GitHub renders natively.

## GitHub rendering gotchas

- Markdown inside an HTML block needs blank lines around it. `align="center"` works on `<p>`, `<div>`, `<h1>`-`<h4>`, `<img>`, `<table>`. `style=` is stripped, so `style="width:80%"` on an `<img>` is ignored in many views. Use the `width="..."` attribute.
- `<picture>` with `prefers-color-scheme` works on github.com. Provide a fallback `<img>`. The `#gh-dark-mode-only` fragment still works but is legacy.
- Video: only user-attachments URLs (or `<video>` pointing at them) embed. Relative repo `.mp4` paths do not play inline. External YouTube links only show as links, so use a linked thumbnail image.
- Relative image paths (`docs/readme/x.webp`) work on github.com. They break on npm or other mirrors, but that does not matter here.
- Heading anchors are lowercase, hyphenated, with emoji stripped. A heading like `## Tech Stack` gives `#tech-stack`. Duplicated headings get `-1`.
- Mermaid: a fenced block with the `mermaid` language tag renders. Avoid very wide diagrams, as they get horizontal scroll.
- Large GIFs slow the page. Keep to under 5 MB, 800 px wide, or use webp.
- `<kbd>` and `<br>` and `&nbsp;` are allowed. `<script>`, `<iframe>`, `<style>` and `<video controls>` from non-GitHub hosts are stripped.

## Recommended structure for visual-ai (target under 150 lines)

1. **Hero demo**: `<picture>` (dark/light) cover or looping GIF/webp (about 800 px, under 5 MB) of prompt to image to video. Link the image to the live site.
2. **Identity**: centered logo, `<h3>`, one-line pitch ("Text to image and video, with credits and billing built in"), `Try it live »`, then link row (Live · Docs · Issues).
3. **Badges** (4-5): licence, stars, last commit, CI, live status. One accent colour.
4. **Anchor nav row** replacing a full TOC: Features · Tech Stack · Architecture · Engineering Decisions · Roadmap · License.
5. **Feature tour**: 2-column `<table>` of 4-6 screenshots (generate, gallery, credits/pricing, video, dark mode, mobile), each with a one-line caption.
6. **Tech stack**: Dub-style `tool – role` list (Vue/Vite, API, Replicate, Clerk, Dodo Payments, Cloudinary, hosting). Group as Frontend, Backend, Services.
7. **Architecture**: one mermaid `flowchart` (client, API, queue/progress stream, Replicate, storage, billing webhook) with 3-4 bullet notes.
8. **Engineering decisions**: 4-6 short bullets of tradeoffs (credit accounting, progress streaming, cost control with Cloudinary, mock-only paid APIs in tests, e2e harness). Put detail in `<details>`.
9. **Getting started**: collapsed `<details>` with env table and run commands. Link to docs for the rest.
10. **Roadmap**: short checklist (done / next), link to issues. Do not copy others in skipping it.
11. **Contributing, License, Contact**: three one-liners plus a Contact line.
