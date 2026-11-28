# Claude Design hand-off: media-studio-redesign

The files in this folder:
- `design-system.md`: the tokens and components, all traced to code.
- `brief.md`: the product brief, content roster, exact strings and the "Do not" list.
- `prompts.md`: Prompts 0 to 7.
- `attachments.md`: what to attach to each prompt.

## 0. Before you start: protect the first-pass mockups

`agent_docs/media-studio-redesign/` is **untracked** in git, so overwriting `design/<screen>.html` cannot be undone. Make a copy first:

```
cd /Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai/agent_docs/media-studio-redesign
cp -R design design-v1
```

## 1. Design system

1. In the Claude desktop app, open Claude Design and start a new project.
2. At **"Choose design system…"**, do not pick a generic preset. Create a new system and give it `design-system.md` as its source, by attaching it with "+" or pasting it, whichever the setup flow offers. Name it "Visual AI · atelier".
3. If the dropdown can't create a system, choose none or blank. Prompt 0 then builds the system from the attached file.
4. Check the result before going on:
   - The dark canvas is #090705, not pure black.
   - The copper accent is #C98A5A.
   - Young Serif is used for headings at weight 400.
   - Source Sans 3 is used for UI text.
   - The radii are 6, 12 and 20px.

## 2. Run a sequence, not one big prompt

One prompt covering all 10 screens would drift: sleeves, player tracks and column widths would stop matching, which is exactly what the last review blocked. Run the prompts in `prompts.md` in order, **in the same project**:

| # | Covers | Gate before the next prompt |
|---|---|---|
| 0 | Design system, component sheet, studio-frame | The component sheet is right: sleeves, track row states, player, picker. Everything after this reuses it |
| 1 | music-studio | |
| 2 | song-studio | |
| 3 | speech-studio | |
| 4 | video-studio | The composer column is 520px |
| 5 | tool-image-watermark, tool-video-watermark | Video watermark uses the contact-sheet idea, not an Autocaption look-alike |
| 6 | tool-autocaption, tool-sketch | |
| 7 | library | Sleeves match screens 0 to 6 |

For each prompt, attach the files listed in `attachments.md` with "+" (text files first), then paste the prompt text from the `>` block.

**Artboard budget.** Each prompt asks for every state in dark at 1440×900 and 375×812, and adds light only for the states marked (L). That comes to about 190 artboards in total, instead of the roughly 370 a full light-and-dark matrix needs. The missing light shots come free later: the ported HTML is token-driven, so `agent-browser set media light` renders them.

## 3. Iterating

- Correct one thing per message and name the artboard, for example: "`song-studio--default--375--dark`: the structure strip clips 'Bri'; apply brief §6 item 11."
- After each prompt, ask: "Run the self-check list against every artboard and list failures before fixing." Then fix the failures.
- When a fix touches a shared component (sleeve, track row, player, pill), make it on the **component sheet** and ask Claude to propagate it. Do not fix it per screen.
- Before moving on, check that the motion table is present and uses the exact header.

## 4. Export back into the repo

Claude Design's own export (HTML/code, or its hand-off to Claude Code if offered) will **not** meet the mockup contract that the later steps rely on. The pipeline needs these things:
- Each state is a `<section id="…">` with `default`, `empty`, `loading`, `error` and `success`, plus `controls` and the extra ids, switched by `:target`.
- `<meta name="distinctive-idea">` sits in `<head>`.
- The `tw-dark` matchMedia script is present.
- Colours are `var(--tw-*)` only, with zero raw hex values, linked through `https://visual-ai.localhost/src/style.scss?direct`.
- A `<screen>.motion.md` holds the table with the exact header.
- Screenshots are saved as `design/shots/<screen>--<state>--<1440|375>--<light|dark>.png`.

Bring it back in four steps:
1. **Export raw.** For each screen, save the export as `design/claude-design-export/<screen>.html`, using the repo's screen names (`studio-frame`, `music-studio`, `song-studio`, `speech-studio`, `video-studio`, `tool-image-watermark`, `tool-video-watermark`, `tool-autocaption`, `tool-sketch`, `library`). Paste each screen's motion table into `design/<screen>.motion.md`, under a `# <Screen>: motion spec` heading.
2. **Port into the contract.** Ask Claude Code to run `ui-designer` in **REVISE** mode, telling it to "port `design/claude-design-export/<screen>.html` into `design/<screen>.html` under the mockup contract. Do not redesign. Replace literal colours with `--tw-*` tokens and bind every motion row to CSS." It writes `design/<screen>.html` and re-shoots `design/shots/`.
3. **Check.** Run `design-qa` in MODE MOCKUP. It runs the raw-colour grep, `~/.claude/scripts/vendor/hallmark/run-slop.mjs`, the state-id and meta checks, motion-spec validation and live checks at 1440 and 375. It rewrites `design/DESIGN-REVIEW.md`.
4. **Gate.** When the review passes, delete `design-v1/` (or keep it as history) and continue `/plan-feature`. Its TASKS lint needs each ui task's `Design:` path to exist and its `Motion:` ids to exist in the motion spec.

## 5. Gotchas

- `visualai-9.png` is an Artlist screen, not ours. `attachments.md` labels it.
- Never reuse the "No credits were charged." wording. The copy is "No credits were used."
- The empty Songs tab shows **no** count. This overrides the old review's "quiet 0" suggestion.
- Light-mode gold uses `gold.muted` (#9E7D35). Gold is never used for text gradients.
