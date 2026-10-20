import { test, expect } from '../fixtures/qa';

const USER_PROFILE_URL = /\/users\/user_/;

test('authenticated studio home loads without console errors', async ({ page, snap }) => {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto('/create/image')]);

  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  await expect(page).not.toHaveURL(/\/signin/);

  await snap('studio-home');
});
