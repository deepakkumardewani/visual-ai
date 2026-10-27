import type { Page } from '@playwright/test';

import { REFERRAL_BONUS, SIGNUP_CREDITS } from '@visual-ai/shared';

import { test, expect } from '../fixtures/qa';
import { gotoStudio } from '../support/studio';

const STALE_SIGNUP_CREDITS =
  /\b50\s+(free|bonus|persistent)\s+credits|\b50\s+persistent\s+credits|\b50\s+you\s+get\s+at\s+signup/i;

async function openReferralOfferDialog(page: Page) {
  const mobile = page.getByTestId('referral-offer-mobile');
  const desktop = page.getByTestId('referral-offer-desktop');
  if (await mobile.isVisible()) {
    await mobile.click();
  } else {
    await desktop.click();
  }
  await expect(page.getByTestId('referral-offer-dialog')).toBeVisible();
}

async function openReferralCopyDialog(page: Page) {
  await page.getByTestId('user-menu-trigger').click();
  await page.getByTestId('user-menu-item-refer-earn').click();
  await expect(page.getByRole('dialog', { name: 'Your account balance' })).toBeVisible();
}

test.describe('mods referral favicon', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test(
    'Referral dialog shows reward from the constant, Copy writes the code, "Copied" appears then reverts.',
    { tag: ['@critical'] },
    async ({ page }) => {
      await gotoStudio(page);
      await openReferralOfferDialog(page);

      await expect(page.getByRole('dialog')).toContainText(`${REFERRAL_BONUS} free credits`);
      await expect(page.getByRole('dialog')).toContainText(`${REFERRAL_BONUS} bonus credits`);

      const code = (await page.getByTestId('referral-offer-code').textContent())?.trim() ?? '';
      expect(code.length).toBeGreaterThan(0);

      await page.getByTestId('referral-offer-copy-btn').click();
      await expect(page.getByTestId('referral-offer-copy-btn')).toHaveText('Copied');

      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toBe(code);

      await page.clock.install({ time: Date.now() });
      await page.clock.fastForward(2_100);
      await expect(page.getByTestId('referral-offer-copy-btn')).toHaveText('Copy code');
    },
  );

  test(
    'Single close affordance; Esc closes and returns focus; dialog works at 375px.',
    { tag: ['@high'] },
    async ({ page }) => {
      await gotoStudio(page);
      await openReferralCopyDialog(page);

      const dialog = page.getByRole('dialog', { name: 'Your account balance' });
      await expect(dialog.getByRole('button', { name: 'Close dialog' })).toHaveCount(1);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(page.getByTestId('user-menu-trigger')).toBeFocused();

      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();
      await openReferralOfferDialog(page);
      await expect(page.getByTestId('referral-offer-dialog')).toBeVisible();
      await expect(page.getByTestId('referral-offer-copy-btn')).toBeVisible();
    },
  );

  test(
    'Landing/pricing copy and `/pricing.md` show 30 signup credits and no stale 50 signup/referral text.',
    { tag: ['@high'] },
    async ({ page, request, baseURL }) => {
      const pricingMd = await request.get(`${baseURL}/pricing.md`);
      expect(pricingMd.ok()).toBeTruthy();
      const mdBody = await pricingMd.text();
      expect(mdBody).toMatch(new RegExp(`Signup\\s*\\|\\s*${SIGNUP_CREDITS}\\s+credits`));
      expect(mdBody).not.toMatch(STALE_SIGNUP_CREDITS);

      await page.goto('/');
      const landingText = await page.locator('body').innerText();
      expect(landingText).toMatch(new RegExp(`${SIGNUP_CREDITS}.*credit`, 'i'));
      expect(landingText).not.toMatch(STALE_SIGNUP_CREDITS);

      await page.goto('/pricing');
      const pricingText = await page.locator('body').innerText();
      expect(pricingText).toMatch(new RegExp(`${SIGNUP_CREDITS}.*credit`, 'i'));
      expect(pricingText).not.toMatch(STALE_SIGNUP_CREDITS);
    },
  );

  test(
    'Every icon/manifest URL referenced from `index.html` returns 200.',
    { tag: ['@medium'] },
    async ({ request, baseURL }) => {
      const origin = baseURL ?? '';
      const index = await request.get(`${origin}/`);
      expect(index.ok()).toBeTruthy();
      const html = await index.text();

      const hrefs = [
        ...html.matchAll(/<link[^>]+href="([^"]+)"/gi),
        ...html.matchAll(/<link[^>]+href='([^']+)'/gi),
      ]
        .map((m) => m[1])
        .filter((href) => /favicon|apple-touch-icon|manifest|\.png|\.ico|\.svg/i.test(href));

      expect(hrefs.length).toBeGreaterThan(0);

      for (const href of hrefs) {
        const url = new URL(href, origin).toString();
        const res = await request.get(url);
        expect(res.status(), `GET ${url}`).toBe(200);
      }

      const manifestHref = hrefs.find((h) => h.includes('manifest'));
      expect(manifestHref).toBeTruthy();
      const manifestRes = await request.get(new URL(manifestHref!, origin).toString());
      const manifest = (await manifestRes.json()) as { icons?: { src: string }[] };
      for (const icon of manifest.icons ?? []) {
        const iconUrl = new URL(icon.src, origin).toString();
        const iconRes = await request.get(iconUrl);
        expect(iconRes.status(), `GET ${iconUrl}`).toBe(200);
      }
    },
  );
});
