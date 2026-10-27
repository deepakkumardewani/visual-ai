import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const USER_PROFILE_URL = /\/users\/user_/;
const CREATE_PATH = '/create/image';
const PROFILE_ATTEMPTS = 5;

/** Hard navigation resets client state; wait for a successful user bootstrap (prod preview can race Clerk). */
export async function gotoStudio(page: Page, path = CREATE_PATH) {
  await page.goto('about:blank');
  for (let attempt = 0; attempt < PROFILE_ATTEMPTS; attempt += 1) {
    const profileOk = page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok(), {
      timeout: 30_000,
    });
    await page.goto(path);
    try {
      await profileOk;
      await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
      return;
    } catch (error) {
      if (attempt === PROFILE_ATTEMPTS - 1) throw error;
    }
  }
}
