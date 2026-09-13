// Cloudflare Worker: serves the Visual AI maintenance page.
// Deploy via dash.cloudflare.com > Workers & Pages > Create > paste this.
const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0d0a07" />
    <meta
      name="description"
      content="Visual AI is preparing its next creative chapter. The studio will reopen soon."
    />
    <title>Studio intermission — Visual AI</title>
    <style>
      :root {
        color-scheme: dark;
        --canvas: #0d0a07;
        --surface: #15110d;
        --border: #2a2119;
        --ink: #f0e8dc;
        --muted: #a89888;
        --faint: #6b5e51;
        --copper: #c98a5a;
        --gold: #c9a84c;
        --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        min-height: 100%;
      }

      body {
        margin: 0;
        overflow-x: hidden;
        background:
          radial-gradient(circle at 78% 18%, rgba(201, 138, 90, 0.07), transparent 28rem),
          var(--canvas);
        color: var(--ink);
        font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif;
      }

      .page {
        width: min(100% - 3rem, 84rem);
        min-height: 100vh;
        margin-inline: auto;
        padding-block: clamp(1.5rem, 4vw, 3rem);
        display: grid;
        grid-template-rows: auto 1fr auto;
      }

      .masthead,
      .footnote {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
      }

      .brand {
        color: var(--ink);
        font-family: "Iowan Old Style", Baskerville, Georgia, serif;
        font-size: 1.15rem;
        letter-spacing: -0.02em;
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        margin: 0;
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .status::before {
        width: 0.42rem;
        height: 0.42rem;
        border-radius: 50%;
        background: var(--copper);
        box-shadow: 0 0 0 0.35rem rgba(201, 138, 90, 0.1);
        content: "";
      }

      main {
        display: grid;
        grid-template-columns: minmax(0, 1.04fr) minmax(22rem, 0.96fr);
        gap: clamp(3rem, 8vw, 8rem);
        align-items: center;
        padding-block: clamp(4rem, 9vw, 8rem);
      }

      .copy {
        max-width: 39rem;
      }

      .eyebrow {
        margin: 0 0 1.5rem;
        color: var(--copper);
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      h1 {
        max-width: 10ch;
        margin: 0;
        font-family: "Iowan Old Style", Baskerville, Georgia, serif;
        font-size: clamp(3.6rem, 7.2vw, 7rem);
        font-weight: 400;
        letter-spacing: -0.055em;
        line-height: 0.94;
      }

      .lede {
        max-width: 34rem;
        margin: clamp(2rem, 4vw, 3rem) 0 0;
        color: var(--muted);
        font-size: clamp(1.05rem, 1.5vw, 1.25rem);
        line-height: 1.65;
      }

      .promise {
        margin: 1.5rem 0 0;
        color: var(--ink);
        font-family: "Iowan Old Style", Baskerville, Georgia, serif;
        font-size: clamp(1.1rem, 1.7vw, 1.35rem);
        line-height: 1.5;
      }

      .artwork {
        position: relative;
        min-height: clamp(27rem, 53vw, 42rem);
        border: 1px solid var(--border);
        background: var(--surface);
        isolation: isolate;
        overflow: hidden;
      }

      .artwork::before {
        position: absolute;
        inset: 0;
        z-index: -1;
        background:
          linear-gradient(rgba(240, 232, 220, 0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(240, 232, 220, 0.045) 1px, transparent 1px);
        background-size: 25% 25%;
        content: "";
      }

      .portal {
        position: absolute;
        inset: 12% 12% 17%;
        border-radius: 50% 50% 1rem 1rem;
        background:
          radial-gradient(circle at 68% 24%, #dfbd66 0 8%, transparent 8.4%),
          linear-gradient(155deg, transparent 53%, #261812 53.3% 64%, transparent 64.3%),
          linear-gradient(27deg, transparent 57%, #5e2f20 57.3% 68%, transparent 68.3%),
          linear-gradient(180deg, #27302b 0 47%, #9d6544 47% 68%, #2c1b14 68%);
        box-shadow:
          0 0 0 1px rgba(240, 232, 220, 0.08),
          0 1.75rem 5rem rgba(0, 0, 0, 0.42);
        overflow: hidden;
      }

      .portal::before,
      .portal::after {
        position: absolute;
        bottom: -8%;
        width: 48%;
        height: 53%;
        border-radius: 55% 55% 0 0;
        background: #17120e;
        content: "";
      }

      .portal::before {
        left: -8%;
        transform: rotate(16deg);
      }

      .portal::after {
        right: -13%;
        transform: rotate(-22deg);
      }

      .edition {
        position: absolute;
        right: 1.25rem;
        bottom: 1.1rem;
        margin: 0;
        color: var(--faint);
        font-size: 0.66rem;
        letter-spacing: 0.17em;
        text-transform: uppercase;
        writing-mode: vertical-rl;
      }

      .art-note {
        position: absolute;
        top: 1.15rem;
        left: 1.25rem;
        margin: 0;
        color: var(--muted);
        font-size: 0.68rem;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .art-note span {
        color: var(--gold);
      }

      .footnote {
        padding-top: 1.25rem;
        border-top: 1px solid var(--border);
        color: var(--faint);
        font-size: 0.78rem;
        letter-spacing: 0.035em;
      }

      .footnote p {
        margin: 0;
      }

      .masthead,
      .copy > *,
      .artwork,
      .footnote {
        animation: reveal 700ms var(--ease-out-expo) both;
      }

      .copy > :nth-child(2) {
        animation-delay: 80ms;
      }

      .copy > :nth-child(3) {
        animation-delay: 150ms;
      }

      .copy > :nth-child(4) {
        animation-delay: 220ms;
      }

      .artwork {
        animation-delay: 180ms;
      }

      .footnote {
        animation-delay: 280ms;
      }

      @keyframes reveal {
        from {
          opacity: 0;
          transform: translateY(2rem);
        }
      }

      @media (max-width: 800px) {
        .page {
          width: min(100% - 2rem, 42rem);
        }

        main {
          grid-template-columns: 1fr;
          gap: 3.5rem;
          padding-block: 4.5rem;
        }

        h1 {
          max-width: 9ch;
        }

        .artwork {
          min-height: min(116vw, 34rem);
        }
      }

      @media (max-width: 480px) {
        .masthead,
        .footnote {
          align-items: flex-start;
          flex-direction: column;
          gap: 0.75rem;
        }

        h1 {
          font-size: clamp(3.2rem, 18vw, 4.6rem);
        }

        .lede {
          font-size: 1rem;
        }

        .edition {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          animation-duration: 0.01ms !important;
          animation-delay: 0ms !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="masthead">
        <div class="brand">Visual AI</div>
        <p class="status">Studio intermission</p>
      </header>

      <main>
        <section class="copy" aria-labelledby="page-title">
          <p class="eyebrow">The next edition</p>
          <h1 id="page-title">The canvas is turning.</h1>
          <p class="lede">
            Visual AI is between versions. We’re opening up more room to explore—and bringing more
            ways to turn an idea into something worth keeping.
          </p>
          <p class="promise">The rest is better discovered than explained.</p>
        </section>

        <div class="artwork" aria-hidden="true">
          <p class="art-note"><span>01</span> / A new horizon</p>
          <div class="portal"></div>
          <p class="edition">Visual AI — forthcoming</p>
        </div>
      </main>

      <footer class="footnote">
        <p>Your creations are safe.</p>
        <p>We’ll reopen the studio soon.</p>
      </footer>
    </div>
  </body>
</html>

`;

export default {
  async fetch() {
    return new Response(PAGE, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '3600',
      },
    });
  },
};
