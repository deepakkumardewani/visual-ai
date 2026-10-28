import { clerk } from '@clerk/testing/playwright';
import { expect, test as setup } from '@playwright/test';

import { AUTH_STATE_PATH, requireEnv } from './support/env';
import { gotoStudio } from './support/studio';

setup('sign in as the E2E user and save session state', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await clerk.signIn({ page, emailAddress: requireEnv('E2E_CLERK_USER_EMAIL') });

  // The router guard redirects signed-out users to /signin, so a rendered
  // composer on a guarded route proves the session is accepted.
  // Prod preview can paint the shell while a long-lived request blocks `load`.
  await gotoStudio(page);
  await expect(page).not.toHaveURL(/\/signin/);

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
