import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { isCloudinaryUrl } from '../support/cloudinaryMock';

// Opt out of the global Cloudinary mock: the mock would answer these requests and hide them from
// the network. Here we count every attempted request ourselves and abort it, so the test proves
// the pages never ask Cloudinary for anything (and never reach the real network).
test.use({
  allowRealCloudinary: true,
  storageState: { cookies: [], origins: [] },
});

const PROMPT = 'A lighthouse on a cliff at sunrise';
const LANDING_IMG = /\/landing\//;

/** Counts and aborts every request to Cloudinary; returns the live list of attempted URLs. */
async function trackCloudinary(page: Page): Promise<string[]> {
  const attempted: string[] = [];
  page.on('request', (req) => {
    if (isCloudinaryUrl(req.url())) attempted.push(req.url());
  });
  await page.route(
    (url) => isCloudinaryUrl(url.toString()),
    (route) => route.abort(),
  );
  return attempted;
}

async function visit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

test.describe('marketing pages make no Cloudinary requests', () => {
  test('landing page attempts 0 requests to res.cloudinary.com @critical', async ({
    page,
    snap,
  }) => {
    const attempted = await trackCloudinary(page);
    await visit(page, '/');
    await expect(page.locator('.hero')).toBeVisible();
    await snap('landing');
    expect(attempted).toEqual([]);
  });

  for (const path of ['/gallery', '/examples', '/pricing', '/text-to-image']) {
    test(`${path} attempts 0 requests to res.cloudinary.com @high`, async ({ page, snap }) => {
      const attempted = await trackCloudinary(page);
      await visit(page, path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await snap(`page${path.replace('/', '-')}`);
      expect(attempted).toEqual([]);
    });
  }

  test('signup dialog images load from /landing/ @high', async ({ page, snap }) => {
    const attempted = await trackCloudinary(page);
    await page.goto('/create/image');
    await page.getByTestId('composer-textarea-input').fill(PROMPT);
    await page.getByTestId('generate-cta').dispatchEvent('click');

    const dialog = page.getByRole('dialog', { name: 'Sign up for free' });
    await expect(dialog).toBeVisible();
    const images = dialog.locator('img');
    await expect(images.first()).toBeVisible();
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(images.nth(i)).toHaveAttribute('src', LANDING_IMG);
    }
    await page.waitForLoadState('networkidle');
    await expect
      .poll(() =>
        images.evaluateAll((els) =>
          els.every(
            (el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0,
          ),
        ),
      )
      .toBe(true);
    await snap('signup-dialog');
    expect(attempted).toEqual([]);
  });
});
