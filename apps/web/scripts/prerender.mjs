/**
 * Post-build Playwright prerender for public marketing routes.
 *
 * Invoked from vite `closeBundle` after `vp build`. Serves `dist` with SPA
 * fallback (in-memory original index.html), waits for Vue + Unhead, then
 * writes `dist/<route>/index.html`.
 *
 * Clerk: the production bundle already inlines `VITE_CLERK_PUBLISHABLE_KEY`
 * from `.env.production` / `.env.local`. If that env is empty, vite.config
 * injects `pk_test_prerender-placeholder-not-a-real-key` only when
 * `VITE_PRERENDER=1` (see build script). That placeholder is not used when
 * a real key is present, and is never applied by `vp dev`.
 *
 * Skip: `VITE_SKIP_PRERENDER=1`
 * Browser: `bunx playwright install chromium` if launch fails.
 */
import { createServer } from 'node:http';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MARKETING_PRERENDER_ROUTES = [
  '/',
  '/text-to-image',
  '/image-upscaler',
  '/colorize-photo',
  '/photo-restorer',
  '/remove-background',
  '/pricing',
  '/faqs',
  '/examples',
  '/compare',
  '/gallery',
  '/contact',
  '/terms',
  '/privacy',
  '/refund',
];

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startSpaServer(distDir) {
  const spaShell = readFileSync(path.join(distDir, 'index.html'));

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] || '/');
      const safeRel = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
      let filePath = path.join(distDir, safeRel);

      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
        createReadStream(filePath).pipe(res);
        return;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(spaShell);
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Prerender server failed to bind'));
        return;
      }
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function launchBrowser() {
  const { chromium } = await import('playwright');
  const attempts = [{ channel: 'chrome' }, { channel: 'chromium' }, {}];

  let lastError;
  for (const opts of attempts) {
    try {
      return await chromium.launch({ headless: true, ...opts });
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Could not launch Chrome/Chromium for prerender. Run: bunx playwright install chromium\n${lastError}`,
  );
}

function destPathForRoute(distDir, route) {
  if (route === '/') {
    return path.join(distDir, 'index.html');
  }
  return path.join(distDir, route.replace(/^\//, ''), 'index.html');
}

export async function prerenderMarketingRoutes(distDir) {
  const indexPath = path.join(distDir, 'index.html');
  if (!existsSync(indexPath)) {
    throw new Error(`Prerender skipped: missing ${indexPath}`);
  }

  const { server, origin } = await startSpaServer(distDir);
  const browser = await launchBrowser();

  try {
    const context = await browser.newContext({
      javaScriptEnabled: true,
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    for (const route of MARKETING_PRERENDER_ROUTES) {
      await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#app h1', { timeout: 25_000 });
      await page.waitForFunction(() => document.title.trim().length > 0, { timeout: 10_000 });

      const html = await page.content();
      const dest = destPathForRoute(distDir, route);
      mkdirSync(path.dirname(dest), { recursive: true });
      writeFileSync(dest, html);
      console.log(`[prerender] ${route} -> ${path.relative(distDir, dest)}`);
    }

    await context.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  prerenderMarketingRoutes(distDir).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
