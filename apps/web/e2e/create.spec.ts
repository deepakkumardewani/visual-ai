import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/generation';

const PROMPT = 'e2e stubbed prompt: a lighthouse at dusk';
const USER_PROFILE_URL = /\/users\/user_/;

// Generating before the user profile loads hits the signed-out/credits guards, so wait for it.
async function gotoSignedIn(page: Page, path: string) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto(path)]);
}

test('create/image shows the generation cost badge', async ({ page }) => {
  await gotoSignedIn(page, '/create/image');
  await expect(page.getByTestId('generate-cta-credits')).toBeVisible();
});

test('submitting a prompt renders the stubbed result without a real generation', async ({
  page,
  generationStub,
}) => {
  generationStub.setPrompt(PROMPT);
  await gotoSignedIn(page, '/create/image');

  await page.getByTestId('composer-textarea-input').fill(PROMPT);
  // A pointer click is swallowed while the composer re-lays out after focus changes; dispatch the DOM click instead.
  await page.getByTestId('generate-cta').dispatchEvent('click');

  await expect(page.getByAltText(PROMPT).first()).toBeVisible();
  expect(generationStub.generateRequestCount()).toBe(1);
});

test('assets page loads the user history', async ({ page }) => {
  await gotoSignedIn(page, '/assets');
  await expect(page).not.toHaveURL(/\/signin/);
  await expect(page.getByRole('tab', { name: 'Assets', selected: true })).toBeVisible();
});
