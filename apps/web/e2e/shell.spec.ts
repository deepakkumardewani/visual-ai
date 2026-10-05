import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

const USER_PROFILE_URL = /\/users\/user_/;

async function gotoSignedIn(page: Page, path: string) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto(path)]);
}

async function isDarkTheme(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const stored = localStorage.getItem('visual-ai-theme');
    const darkClass = document.documentElement.classList.contains('tw-dark');
    return stored !== 'false' && darkClass;
  });
}

async function expectDarkTheme(page: Page, dark: boolean) {
  await expect
    .poll(async () => isDarkTheme(page), { message: `expected theme dark=${dark}` })
    .toBe(dark);
}

async function openUserMenu(page: Page) {
  await page.getByTestId('user-menu-trigger').click();
  await expect(page.getByTestId('user-menu-panel')).toBeVisible();
}

test.describe('App shell', () => {
  // Sign-out ends the shared Clerk session; run these in order on one context.
  test.describe.configure({ mode: 'serial' });

  test('studio navigation switches tools', async ({ page }) => {
    await gotoSignedIn(page, '/create/image');

    await test.step('start on the image generator', async () => {
      await expect(page.getByTestId('feature-select-trigger')).toContainText('AI Image Generator');
      await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
    });

    await test.step('open the upscaler from studio navigation', async () => {
      await page.getByTestId('feature-select-trigger').click();
      await page.getByTestId('feature-select-option-upscale').click();
      await expect(page).toHaveURL(/\/create\/upscale/);
      await expect(page.getByTestId('feature-select-trigger')).toContainText('Image Upscaler');
    });

    await test.step('open Assets from studio navigation', async () => {
      await page.getByTestId('nav-tab-assets').click();
      await expect(page).toHaveURL(/\/assets/);
      await expect(page.getByRole('tab', { name: 'Assets', selected: true })).toBeVisible();
    });
  });

  test('theme choice is kept after reload', async ({ page }) => {
    await gotoSignedIn(page, '/create/image');
    await openUserMenu(page);

    const wasDark = await isDarkTheme(page);
    await page.getByTestId('user-menu-item-theme').click();
    await expectDarkTheme(page, !wasDark);

    await page.reload();
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
    await expectDarkTheme(page, !wasDark);
  });

  test('user menu shows account actions when signed in', async ({ page }) => {
    await gotoSignedIn(page, '/create/image');
    await openUserMenu(page);

    await expect(page.getByTestId('user-menu-item-profile')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeVisible();

    await page.getByTestId('user-menu-item-profile').click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();
  });

  test('signing out returns me to a signed-out header', async ({ page }) => {
    await gotoSignedIn(page, '/create/image');
    await openUserMenu(page);
    await Promise.all([
      page.waitForURL(/\//, { timeout: 15_000 }),
      page.getByTestId('user-menu-item-logout').click(),
    ]);
    await page.waitForFunction(() => !(window as unknown as { Clerk?: { user: unknown } }).Clerk?.user, {
      timeout: 15_000,
    });
    await page.goto('/create/image');
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  });
});

test.describe('signed-out visitor', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signed-out theme control is available on the studio', async ({ page }) => {
    await page.goto('/create/image');
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();

    const themeButton = page.getByRole('button', {
      name: /Switch to (Light|Dark) Mode/i,
    });
    await expect(themeButton).toBeVisible();

    const startedDark = await isDarkTheme(page);
    await themeButton.click();
    await expectDarkTheme(page, !startedDark);

    await themeButton.click();
    await expectDarkTheme(page, startedDark);
  });
});
