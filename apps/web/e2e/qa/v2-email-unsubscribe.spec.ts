import { devices, type Locator, type Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { API_URL } from '../support/env';
import { signUnsubscribeToken, withTempUser } from '../support/unsubscribe';

// The unsubscribe pages are server-rendered by the API, so this spec drives the API origin directly.
const UNSUBSCRIBE_URL = `${API_URL}/email/unsubscribe`;
const unsubscribeUrl = (token?: string) =>
  token === undefined ? UNSUBSCRIBE_URL : `${UNSUBSCRIBE_URL}?token=${encodeURIComponent(token)}`;

// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/v2-email-unsubscribe/${name}.png`;

// Draws a labelled red box around the element that proves an acceptance criterion, so each
// evidence PNG shows what it asserts. Purely visual: it runs after the assertions pass.
async function annotate(target: Locator, label: string) {
  await target.evaluate((el, text) => {
    const box = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.setAttribute('data-e2e-annotation', '');
    overlay.style.cssText = `position:absolute;z-index:99999;pointer-events:none;border:3px solid #e11d48;border-radius:6px;left:${box.left + window.scrollX - 4}px;top:${box.top + window.scrollY - 4}px;width:${box.width + 8}px;height:${box.height + 8}px`;
    const tag = document.createElement('span');
    tag.textContent = text;
    tag.style.cssText =
      'position:absolute;left:0;bottom:100%;background:#e11d48;color:#fff;font:600 12px sans-serif;padding:2px 6px;white-space:nowrap;border-radius:4px 4px 0 0';
    overlay.append(tag);
    document.body.append(overlay);
  }, label);
}

// These pages are public: run every test without the signed-in storage state.
test.use({ storageState: { cookies: [], origins: [] } });

async function expectInvalidPage(page: Page, response: { status(): number } | null) {
  expect(response?.status()).toBe(400);
  await expect(page.getByTestId('unsubscribe-invalid')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This link is not valid' })).toBeVisible();
  await expect(page.getByTestId('unsubscribe-submit')).toHaveCount(0);
}

test('@critical A signed link opens the confirm page; confirming shows success and sets opt-out', async ({
  page,
}) => {
  await withTempUser(async ({ userId, isOptedOut }) => {
    const response = await page.goto(unsubscribeUrl(signUnsubscribeToken(userId)));
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId('unsubscribe-confirm')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Unsubscribe from Visual AI emails/ }),
    ).toBeVisible();
    // Opening the link (GET) must not unsubscribe anyone: mail scanners prefetch links.
    expect(await isOptedOut()).toBe(false);
    await annotate(
      page.getByTestId('unsubscribe-submit'),
      'AC: GET shows confirm, opt-out still false',
    );
    await page.screenshot({ path: shotPath('01-confirm'), fullPage: true });

    await page.getByTestId('unsubscribe-submit').click();

    await expect(page.getByTestId('unsubscribe-success')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'You are unsubscribed' })).toBeVisible();
    await annotate(page.getByTestId('unsubscribe-success'), 'AC: confirm POST shows success');
    await page.screenshot({ path: shotPath('02-success'), fullPage: true });
    await expect.poll(isOptedOut).toBe(true);
  });
});

test('@high Repeating the confirmation still shows success (idempotent)', async ({ page }) => {
  await withTempUser(async ({ userId, isOptedOut }) => {
    const url = unsubscribeUrl(signUnsubscribeToken(userId));

    await page.goto(url);
    await page.getByTestId('unsubscribe-submit').click();
    await expect(page.getByTestId('unsubscribe-success')).toBeVisible();
    await expect.poll(isOptedOut).toBe(true);

    // Second pass from a fresh confirm page, as if the recipient clicked the email link again.
    await page.goto(url);
    await expect(page.getByTestId('unsubscribe-confirm')).toBeVisible();
    await page.getByTestId('unsubscribe-submit').click();
    await expect(page.getByTestId('unsubscribe-success')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'You are unsubscribed' })).toBeVisible();
    expect(await isOptedOut()).toBe(true);
    await annotate(page.getByTestId('unsubscribe-success'), 'AC: repeat confirm still succeeds');
    await page.screenshot({
      path: shotPath('03-repeat-success'),
      fullPage: true,
    });
  });
});

test('@high Invalid and missing token show a friendly 400 page', async ({ browser }) => {
  // Chromium logs "Failed to load resource" (console.error) for every 4xx document load, and that is the
  // expected outcome here. A separate context keeps the console guard strict for the page-under-test
  // tests above while this one asserts the status code and page content explicitly.
  const context = await browser.newContext();
  const page = await context.newPage();
  await withTempUser(async ({ userId, isOptedOut }) => {
    const valid = signUnsubscribeToken(userId);
    const [payload, signature] = valid.split('.');
    const tampered = `${payload}.${signature.slice(0, -2)}${signature.endsWith('AA') ? 'BB' : 'AA'}`;
    const otherPurpose = `${Buffer.from(`${userId}.other`).toString('base64url')}.${signature}`;

    await expectInvalidPage(page, await page.goto(unsubscribeUrl()));
    await annotate(page.getByTestId('unsubscribe-invalid'), 'AC: missing token -> friendly 400');
    await page.screenshot({
      path: shotPath('04-missing-token'),
      fullPage: true,
    });

    for (const bad of ['garbage', tampered, otherPurpose]) {
      await expectInvalidPage(page, await page.goto(unsubscribeUrl(bad)));
    }
    await annotate(page.getByTestId('unsubscribe-invalid'), 'AC: tampered/foreign token -> 400');
    await page.screenshot({
      path: shotPath('05-invalid-token'),
      fullPage: true,
    });

    // The POST (one-click) target rejects bad tokens too and must not change anyone's state.
    // Sent from the page (same origin as the API) so TLS trust matches the browser's, which a Node
    // request context does not share under the prod config (ignoreHTTPSErrors:false).
    const post = await page.evaluate(async (url) => {
      const res = await fetch(url, { method: 'POST' });
      return { status: res.status, body: await res.text() };
    }, unsubscribeUrl(tampered));
    expect(post.status).toBe(400);
    expect(post.body).toContain('This link is not valid');
    expect(await isOptedOut()).toBe(false);
  }).finally(() => context.close());
});

test.describe('@medium Page works unauthenticated and at 375px', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    userAgent: devices['iPhone SE'].userAgent,
  });

  test('confirm page fits a 375px viewport without a session', async ({ page, context }) => {
    await withTempUser(async ({ userId, isOptedOut }) => {
      expect(await context.cookies()).toEqual([]);
      await page.goto(unsubscribeUrl(signUnsubscribeToken(userId)));

      await expect(page.getByTestId('unsubscribe-submit')).toBeInViewport({
        ratio: 1,
      });
      await expect(page.getByTestId('unsubscribe-confirm')).toBeInViewport({
        ratio: 1,
      });
      const noHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(noHorizontalScroll).toBe(true);
      expect(await isOptedOut()).toBe(false);
      await annotate(page.getByTestId('unsubscribe-confirm'), 'AC: fits 375px, no session');
      await page.screenshot({
        path: shotPath('06-confirm-375'),
        fullPage: true,
      });
    });
  });

  test('confirm and success pages fit a 375px viewport without a session', async ({ page }) => {
    await withTempUser(async ({ userId, isOptedOut }) => {
      await page.goto(unsubscribeUrl(signUnsubscribeToken(userId)));
      await page.getByTestId('unsubscribe-submit').click();
      await expect(page.getByTestId('unsubscribe-success')).toBeVisible();
      await expect.poll(isOptedOut).toBe(true);
      const noHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(noHorizontalScroll).toBe(true);
      await annotate(page.getByTestId('unsubscribe-success'), 'AC: success fits 375px');
      await page.screenshot({
        path: shotPath('07-success-375'),
        fullPage: true,
      });
    });
  });
});
