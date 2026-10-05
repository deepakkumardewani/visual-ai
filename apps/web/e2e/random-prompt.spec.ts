import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/generation';

const USER_PROFILE_URL = /\/users\/user_/;
// The app truncates the image alt text, so match on the start of the prompt (alt matching is substring-based).
const ALT_PREFIX_LENGTH = 60;

// Generating before the user profile loads hits the signed-out/credits guards, so wait for it.
async function gotoSignedIn(page: Page, path: string) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto(path)]);
}

test('random prompt fills the composer and generates a stubbed image', async ({
  page,
  generationStub,
}) => {
  await gotoSignedIn(page, '/create/image');

  await page.getByTestId('prompt-ai-trigger').click();
  await page.getByTestId('prompt-ai-random').click();

  const composer = page.getByTestId('composer-textarea-input');
  await expect(composer).not.toHaveValue('');
  const prompt = await composer.inputValue();
  generationStub.setPrompt(prompt);

  // A pointer click is swallowed while the composer re-lays out after focus changes; dispatch the DOM click instead.
  await page.getByTestId('generate-cta').dispatchEvent('click');

  await expect(page.getByAltText(prompt.slice(0, ALT_PREFIX_LENGTH)).first()).toBeVisible();
  expect(generationStub.generateRequestCount()).toBe(1);
});
