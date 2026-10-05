import { expect, test } from '@playwright/test';

const COMMUNITY_CREATION_PATH = '/explore/e2e-creation';
const PROMPT = 'e2e signed-out prompt';

test.describe('signed-out visitor', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('profile URL sends the visitor to sign in and keeps the redirect @guest', async ({
    page,
  }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/signin\?/);
    expect(new URL(page.url()).searchParams.get('redirect')).toBe('/profile');
  });

  test('a community creation URL sends the visitor to sign in and keeps the redirect @guest', async ({
    page,
  }) => {
    await page.goto(COMMUNITY_CREATION_PATH);

    await expect(page).toHaveURL(/\/signin\?/);
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(COMMUNITY_CREATION_PATH);
  });

  test('the studio opens without an account @guest', async ({ page }) => {
    await page.goto('/create');

    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
    await expect(page).not.toHaveURL(/\/signin/);
  });

  test('submitting a generation asks for an account and does not start one @guest', async ({
    page,
  }) => {
    let generatePosts = 0;
    await page.route(/\/generate\/image$/, async (route) => {
      if (route.request().method() === 'POST') generatePosts += 1;
      await route.abort();
    });

    await page.goto('/create/image');
    await page.getByTestId('composer-textarea-input').fill(PROMPT);
    await page.getByTestId('generate-cta').dispatchEvent('click');

    await expect(page.getByRole('dialog', { name: 'Sign up for free' })).toBeVisible();
    await expect(page).toHaveURL(/\/create\/image/);
    expect(generatePosts).toBe(0);
  });

  test('header Sign In opens the sign-in page @guest', async ({ page }) => {
    await page.goto('/create');
    await page.getByTestId('header-sign-in').click();

    await expect(page).toHaveURL(/\/signin/);
  });
});

test('a signed-in user can open the profile page', async ({ page }) => {
  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/profile/);
});
