import type { Page, Route } from '@playwright/test';

import { expect, test } from '@playwright/test';

import { WEB_URL } from './support/env';

const USER_PROFILE_URL = /\/users\/user_/;
const SHOWCASE_FIRST_PROMPT =
  'A futuristic city skyline at dusk, with glowing neon lights reflecting off sleek glass buildings, flying cars zooming by, and a vibrant sunset fading into the horizon.';

const API_CORS = {
  'Access-Control-Allow-Origin': WEB_URL,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    headers: { ...API_CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function gotoSignedIn(page: Page, path: string) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto(path)]);
}

async function stubContactPost(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route(/\/users\/contact\/?$/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    if (route.request().method() !== 'POST') {
      return route.continue();
    }
    return handler(route);
  });
}

test.describe('marketing — signed-out visitor', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('landing primary call to action goes to sign in', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hero').getByRole('link', { name: 'Start free' }).click();
    await expect(page).toHaveURL(/\/signin/);
  });

  test('landing tool cards open the matching feature page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Try the upscaler/i }).click();
    await expect(page).toHaveURL(/\/image-upscaler$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('AI image upscaler');
  });

  test('landing FAQ answer expands and collapses', async ({ page }) => {
    await page.goto('/');
    const secondQuestion = page.getByRole('button', {
      name: 'How do credits work?',
    });

    await test.step('expand', async () => {
      await secondQuestion.click();
      await expect(page.getByText(/30 daily credits that reset/i)).toBeVisible();
    });

    await test.step('collapse', async () => {
      await secondQuestion.click();
      await expect(secondQuestion).toHaveAttribute('aria-expanded', 'false');
    });
  });

  test('showcase copy prompt copies the example prompt', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    await page.locator('#showcase .tile__btn').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Copy prompt' }).click();
    await expect(page.getByRole('status')).toHaveText('Prompt copied');

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(SHOWCASE_FIRST_PROMPT);
  });

  test('feature page secondary action opens pricing', async ({ page }) => {
    await page.goto('/image-upscaler');
    await page.getByRole('link', { name: 'See credit packs' }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole('heading', { name: 'Free Forever, Always' })).toBeVisible();
  });

  test('contact form rejects incomplete details', async ({ page }) => {
    let contactPosts = 0;
    await stubContactPost(page, async (route) => {
      contactPosts += 1;
      await fulfillJson(route, { ok: true });
    });

    await page.goto('/contact');
    await page.getByLabel('First Name').fill('A');
    await page.getByLabel('Last Name').fill('B');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Subject').fill('Hi');
    await page.getByLabel('Message').fill('Too short');
    await page.getByRole('button', { name: 'Send Message' }).click();
    await expect(page.getByText('First Name must be at least 2 characters')).toBeVisible();
    expect(contactPosts).toBe(0);
  });

  test('contact form confirms a successful send', async ({ page }) => {
    await stubContactPost(page, async (route) => {
      await fulfillJson(route, { ok: true });
    });

    await page.goto('/contact');
    await page.getByLabel('First Name').fill('E2E');
    await page.getByLabel('Last Name').fill('Guest');
    await page.getByLabel('Email').fill('e2e-guest@example.com');
    await page.getByLabel('Subject').fill('Playwright marketing');
    await page.getByLabel('Message').fill('Automated contact success path.');
    await page.getByRole('button', { name: 'Send Message' }).click();

    await expect(page.getByRole('status')).toHaveText('Message sent successfully!');
  });

  test('contact form reports a send failure', async ({ page }) => {
    await stubContactPost(page, async (route) => {
      await fulfillJson(route, { message: 'Server error' }, 500);
    });

    await page.goto('/contact');
    await page.getByLabel('First Name').fill('E2E');
    await page.getByLabel('Last Name').fill('Guest');
    await page.getByLabel('Email').fill('e2e-fail@example.com');
    await page.getByLabel('Subject').fill('Playwright marketing');
    await page.getByLabel('Message').fill('Automated contact failure path.');

    const contactPost = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/users/contact'),
    );
    await page.getByRole('button', { name: 'Send Message' }).click();
    await contactPost;

    await expect(page.getByRole('status')).toHaveText('Failed to send message. Please try again.');
  });

  test('compare model action opens the upscaler with that model', async ({ page }) => {
    await page.goto('/compare');
    await page.getByRole('button', { name: 'Try Real-ESRGAN' }).click();
    await expect(page).toHaveURL(/\/create\/upscale\?model=UPSCALE_REAL_ESRGAN/);
    await expect(page.getByTestId('model-picker-trigger')).toContainText('Real-ESRGAN');
  });

  test('examples tabs swap the before-and-after set', async ({ page }) => {
    await page.goto('/examples');
    const panel = page.locator('.tw-max-w-5xl').first();
    await expect(panel.locator('img').first()).toHaveAttribute('src', /upscale-1/);

    await page.getByRole('tab', { name: 'Colorize' }).click();
    await expect(panel.locator('img').first()).toHaveAttribute('src', /colorize-1/);
  });

  test('gallery tile opens a fullscreen view', async ({ page }) => {
    await page.goto('/gallery');
    await page.locator('.gallery-image').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[id="app-modal-title"]')).not.toBeEmpty();
  });

  test('old dashboard address opens the studio tool from the query', async ({ page }) => {
    await page.goto('/dashboard?tool=upscale&model=UPSCALE_PRUNA&tab=1');
    await expect(page).toHaveURL(/\/create\/upscale\?model=UPSCALE_PRUNA&tab=1/);
    await expect(page.getByTestId('upscale-aside')).toBeVisible();
  });

  test('old dashboard address without a tool opens the image generator', async ({ page }) => {
    await page.goto('/dashboard?tab=1');
    await expect(page).toHaveURL(/\/create(\/image)?(\?tab=1)?$/);
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  });

  test('terms page is readable and links to contact', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeVisible();
    await expect(page.getByText('1. Introduction')).toBeVisible();
    await expect(page.getByRole('link', { name: /visual-ai\.app\/contact/i })).toHaveAttribute(
      'href',
      /\/contact$/,
    );
    await page.locator('footer').getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/\/contact$/);
  });
});

test('signed-in landing call to action opens the studio', async ({ page }) => {
  await gotoSignedIn(page, '/');
  await page.locator('.hero').getByRole('link', { name: 'Open studio' }).click();
  await expect(page).toHaveURL(/\/create(\/image)?$/);
  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
});

test('feature page primary action opens the matching studio tool', async ({ page }) => {
  await gotoSignedIn(page, '/image-upscaler');
  await page.getByRole('link', { name: 'Open the upscaler' }).click();
  await expect(page).toHaveURL(/\/create\/upscale$/);
  await expect(page.getByTestId('upscale-aside')).toBeVisible();
});

test('signed-in contact form starts with my name and email', async ({ page }) => {
  await gotoSignedIn(page, '/contact');
  const firstName = page.getByLabel('First Name');
  const email = page.getByLabel('Email');
  await expect(firstName).not.toHaveValue('');
  await expect(email).not.toHaveValue('');
});
