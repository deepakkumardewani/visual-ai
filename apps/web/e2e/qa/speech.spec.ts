import { randomUUID } from 'node:crypto';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Page } from '@playwright/test';

import { test as mediaTest } from '../fixtures/media';
import { expect, test as qaTest } from '../fixtures/qa';
import { requireEnv } from '../support/env';
import { readCredits } from '../support/proPerksSeed';

const test = mergeTests(qaTest, mediaTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const SPEECH_PATH = '/audio/speech';
const SPEECH_POST_URL = /\/generate\/audio\/speech\/?$/;
const WIDTH_PHONE = 375;
const HEIGHT_PHONE = 812;
const MIN_TAP_PX = 44;
const MAX_TAB_PRESSES = 150;
const NO_CREDITS_USED = 'No credits were used.';
const STUB_ASSET_TITLE = 'E2E stub asset';

// Model labels as shown in the picker.
const INWORLD_2 = 'Inworld TTS 2.0';
const INWORLD_15 = 'Inworld TTS 1.5 Max';
const MINIMAX_HD = 'Minimax Speech 2.8 HD';
const CHATTERBOX = 'Chatterbox Turbo';

// Independent of the app's cost function: ceil(usd per 1,000 chars x chars / 1,000 x 200 credits per USD).
const INWORLD_2_COST_1000_CHARS = 5; // 0.025 USD
const MINIMAX_HD_COST_1000_CHARS = 20; // 0.10 USD
const SCRIPT_CHARS = 1000;
const CHATTERBOX_LIMIT = 500;
const NEAR_LIMIT_CHARS = 460;
const OVER_LIMIT_CHARS = 510;
const PAUSE_RANGE_MESSAGE = 'Pause must be between 0.1 and 10 seconds.';

// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/speech-studio/${name}.png`;

/** A script of exactly `length` characters that is unique to this run. */
function script(length: number): string {
  const head = `Take ${RUN} `;
  return head + 'x'.repeat(length - head.length);
}

async function openSpeechStudio(page: Page) {
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok(), {
      timeout: 30_000,
    }),
    page.goto(SPEECH_PATH),
  ]);
  await clerk.loaded({ page });
  await expect(page.getByRole('heading', { name: 'Speech studio' })).toBeVisible();
}

const editor = (page: Page) => page.getByRole('textbox', { name: 'Speech text' });
const generate = (page: Page) => page.getByTestId('studio-generate');
const cost = (page: Page) => page.getByTestId('studio-cost');
const modelOption = (page: Page, label: string) =>
  page.getByTestId('speech-model-option').filter({ hasText: label });
const tagButton = (page: Page, tag: string) =>
  page.locator(`[data-testid="tag-insert"][data-tag="${tag}"]`);
const chip = (page: Page, label: string) => page.getByRole('group', { name: `Tag: ${label}` });

/** Types into the editor as a paste would: one input event, so long scripts stay fast. */
async function typeScript(page: Page, text: string) {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
}

async function tabUntilFocused(page: Page, target: ReturnType<Page['getByTestId']>) {
  for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`target not reachable by keyboard within ${MAX_TAB_PRESSES} Tab presses`);
}

test.describe('speech studio', () => {
  test.beforeEach(async ({ page }) => {
    await openSpeechStudio(page);
  });

  test('@critical generate speech sends the text only and charges the server-computed cost once', async ({
    page,
    mediaGenerationStub,
    snap,
  }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('slow', { credits: INWORLD_2_COST_1000_CHARS });
    await expect(page.getByTestId('studio-empty-state')).toContainText(
      'Type or paste what you want spoken.',
    );

    const text = script(SCRIPT_CHARS);
    await typeScript(page, text);
    await expect(page.getByTestId('speech-counter')).toHaveText('1,000/2,000');
    await expect(cost(page)).toContainText(String(INWORLD_2_COST_1000_CHARS));
    await expect(cost(page)).not.toContainText('Estimated');

    const posted = page.waitForRequest((req) => SPEECH_POST_URL.test(req.url()));
    await generate(page).click();
    const body = (await posted).postDataJSON() as Record<string, unknown>;
    expect(body).toMatchObject({ modelKey: 'INWORLD_TTS_2', text });
    // The server recounts the text and prices it; the client never sends a quantity or a price.
    expect(Object.keys(body).filter((key) => /char|cost|credit|count/i.test(key))).toEqual([]);

    await expect(page.getByTestId('job-progress')).toBeVisible();
    const card = page.getByTestId('result-card');
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: `Play ${STUB_ASSET_TITLE}` })).toBeVisible();

    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(1);
    // The stub answers the POST, so the real API never ran: the stored balance cannot have moved.
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('speech-success');
    await page.screenshot({ path: shotPath('success') });
  });

  test.describe('insufficient credits', () => {
    // The browser logs the deliberate 402 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 402|→ 402/] });

    test('@critical insufficient credits opens the low-credits dialog and queues nothing', async ({
      page,
      mediaGenerationStub,
    }) => {
      mediaGenerationStub.setVariant('insufficient', {
        required: INWORLD_2_COST_1000_CHARS,
        available: 2,
      });
      const before = await readCredits(E2E_USER_ID);

      await typeScript(page, script(SCRIPT_CHARS));
      await generate(page).click();

      const dialog = page.getByRole('dialog', { name: 'Low credits' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(`${INWORLD_2_COST_1000_CHARS} credits are required`);
      await expect(dialog).toContainText('2 credits available');
      await expect(page.getByTestId('result-card')).toHaveCount(0);
      expect(mediaGenerationStub.acceptedRequestCount()).toBe(0);
      expect(mediaGenerationStub.interceptedPosts()).toHaveLength(1);
      expect(await readCredits(E2E_USER_ID)).toEqual(before);
      await page.screenshot({ path: shotPath('insufficient-credits') });
    });
  });

  test('@critical failure shows "No credits were used." and the balance is unchanged', async ({
    page,
    mediaGenerationStub,
  }) => {
    mediaGenerationStub.setVariant('failure');
    const before = await readCredits(E2E_USER_ID);

    await typeScript(page, script(SCRIPT_CHARS));
    await generate(page).click();

    const error = page.getByTestId('studio-error-state');
    await expect(error).toBeVisible();
    await expect(error).toContainText(NO_CREDITS_USED);
    await expect(page.getByTestId('result-card')).toHaveCount(0);
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await page.screenshot({ path: shotPath('failure-no-charge') });
  });

  test('@high pause chip insert and range validation', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: 1 });
    // Inworld 2 has no pause tag; 1.5 Max does (no tags in the text yet, so no dialog).
    await expect(tagButton(page, 'pause')).toHaveCount(0);
    await modelOption(page, INWORLD_15).click();
    await expect(modelOption(page, INWORLD_15).getByRole('radio')).toBeChecked();

    await editor(page).click();
    await page.keyboard.insertText(`Hello ${RUN} `);
    await tagButton(page, 'pause').click();
    const pause = chip(page, 'pause');
    await expect(pause).toHaveCount(1);
    const value = pause.getByLabel('Pause length in seconds');
    await expect(value).toHaveValue('1');

    for (const invalid of ['0.05', '10.1', '']) {
      await value.fill(invalid);
      await expect(pause.getByRole('alert')).toHaveText(PAUSE_RANGE_MESSAGE);
      await expect(value).toHaveAttribute('aria-invalid', 'true');
      await value.press('Enter');
      // Not applied: the chip still holds the rejected raw value while the error shows.
      await expect(pause.getByRole('alert')).toBeVisible();
    }
    await page.screenshot({ path: shotPath('pause-invalid') });

    // Both boundaries are valid.
    await value.fill('0.1');
    await expect(pause.getByRole('alert')).toBeHidden();
    await value.fill('10');
    await expect(pause.getByRole('alert')).toBeHidden();
    await value.fill('2.5');
    await value.press('Enter');
    await expect(chip(page, 'pause').getByLabel('Pause length in seconds')).toHaveValue('2.5');

    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.insertText('world');

    const posted = page.waitForRequest((req) => SPEECH_POST_URL.test(req.url()));
    await generate(page).click();
    const body = (await posted).postDataJSON() as { modelKey: string; text: string };
    expect(body.modelKey).toBe('INWORLD_TTS_15_MAX');
    expect(body.text).toContain(`Hello ${RUN}`);
    expect(body.text).toContain('<break time="2.5s" />');
    expect(body.text).toContain('world');
    expect(body.text).not.toContain('0.05');
    await expect(page.getByTestId('result-card')).toBeVisible();
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high model switch dialog convert and cancel', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    await editor(page).click();
    await page.keyboard.insertText(`Breathe in ${RUN} `);
    // Inworld 2 can express "breathe"; Minimax cannot.
    await tagButton(page, 'breathe').click();
    await expect(chip(page, 'breathe')).toHaveCount(1);

    // Cancel with the button: text and model stay.
    await modelOption(page, MINIMAX_HD).click();
    const dialog = page.getByRole('dialog', { name: `Switch to ${MINIMAX_HD}?` });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('convert-dropped')).toContainText('breathe');
    await expect(dialog.locator(':focus')).toHaveCount(1);
    await page.screenshot({ path: shotPath('convert-dialog') });
    await page.getByTestId('convert-keep').click();
    await expect(dialog).toBeHidden();
    await expect(modelOption(page, INWORLD_2).getByRole('radio')).toBeChecked();
    await expect(modelOption(page, MINIMAX_HD).getByRole('radio')).not.toBeChecked();
    await expect(chip(page, 'breathe')).toHaveCount(1);
    await expect(page.getByTestId('speech-model-select').locator(':focus')).toHaveCount(1);

    // Cancel with Escape: same result.
    await modelOption(page, MINIMAX_HD).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(modelOption(page, INWORLD_2).getByRole('radio')).toBeChecked();
    await expect(chip(page, 'breathe')).toHaveCount(1);

    // Convert applies the switch and drops the tag; Undo restores both.
    await modelOption(page, MINIMAX_HD).click();
    await page.getByTestId('convert-apply').click();
    await expect(dialog).toBeHidden();
    await expect(modelOption(page, MINIMAX_HD).getByRole('radio')).toBeChecked();
    await expect(chip(page, 'breathe')).toHaveCount(0);
    const banner = page.getByTestId('converted-banner');
    await expect(banner).toContainText(`Tags converted for ${MINIMAX_HD}.`);
    await expect(cost(page)).toContainText('Estimated');
    await page.screenshot({ path: shotPath('converted') });

    await banner.getByRole('button', { name: 'Undo' }).click();
    await expect(banner).toHaveCount(0);
    await expect(modelOption(page, INWORLD_2).getByRole('radio')).toBeChecked();
    await expect(chip(page, 'breathe')).toHaveCount(1);
    await expect(editor(page)).toContainText(`Breathe in ${RUN}`);

    // A model that supports every tag in the text switches with no dialog.
    await modelOption(page, INWORLD_15).click();
    await expect(modelOption(page, INWORLD_15).getByRole('radio')).toBeChecked();
    await expect(dialog).toHaveCount(0);
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high over-limit text disables Generate and is not truncated', async ({
    page,
    mediaGenerationStub,
  }) => {
    const before = await readCredits(E2E_USER_ID);
    await modelOption(page, CHATTERBOX).click();
    await expect(modelOption(page, CHATTERBOX).getByRole('radio')).toBeChecked();

    const text = script(CHATTERBOX_LIMIT + 1);
    await typeScript(page, text);

    const counter = page.getByTestId('speech-counter');
    await expect(counter).toHaveText('501/500');
    await expect(counter).toHaveCSS('font-weight', '600');
    await expect(generate(page)).toBeDisabled();
    const reason = page.getByTestId('studio-reason');
    await expect(reason).toContainText('1 characters over the 500 limit');
    // Never truncated: the editor still holds the whole script.
    await expect(editor(page)).toHaveText(text);
    await page.screenshot({ path: shotPath('over-limit') });

    // Backing off to the limit re-enables Generate.
    await editor(page).press('Backspace');
    await expect(counter).toHaveText('500/500');
    await expect(generate(page)).toBeEnabled();
    await expect(page.getByTestId('studio-reason')).toHaveCount(0);
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high keyboard-only compose', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: 1 });

    await tabUntilFocused(page, editor(page));
    await page.keyboard.type(`Keyboard take ${RUN} `);
    await expect(editor(page)).toContainText(`Keyboard take ${RUN}`);

    // The slash menu inserts a tag chip with the keyboard alone.
    await page.keyboard.type('/');
    await expect(page.getByTestId('tts-slash-menu')).toBeVisible();
    await expect(page.getByTestId('tts-slash-option').first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('group', { name: /^Tag: / })).toHaveCount(1);

    await tabUntilFocused(page, generate(page));
    await expect(generate(page)).toBeEnabled();
    await expect(generate(page)).toHaveCSS('outline-style', 'solid');
    const posted = page.waitForRequest((req) => SPEECH_POST_URL.test(req.url()));
    await page.keyboard.press('Enter');
    expect(((await posted).postDataJSON() as { text: string }).text).toContain(
      `Keyboard take ${RUN}`,
    );

    await expect(page.getByTestId('result-card')).toBeVisible();
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@medium 375px layout', async ({ page }) => {
    await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT_PHONE });
    await openSpeechStudio(page);
    await typeScript(page, script(SCRIPT_CHARS));
    await expect(generate(page)).toBeEnabled();

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);

    const tags = await page.getByTestId('tag-insert').all();
    const models = await page.getByTestId('speech-model-option').all();
    const voices = await page.getByTestId('voice-option').all();
    expect(tags.length).toBeGreaterThan(3);
    expect(models).toHaveLength(5);
    expect(voices.length).toBeGreaterThan(0);
    const targets = [
      generate(page),
      page.getByTestId('advisor-faq'),
      ...tags,
      ...models,
      ...voices,
    ];
    for (const target of targets) {
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TAP_PX);
    }
    await page.screenshot({ path: shotPath('mobile-375') });
  });

  test('@medium advisor warnings', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    const length = page.getByTestId('advisor-length');
    const warning = page.getByTestId('advisor-warning');

    // 75 spoken words at 150 words a minute read as 30 s; 150 words as 1 min.
    await typeScript(page, Array.from({ length: 75 }, () => 'a').join(' '));
    await expect(length).toContainText('30 s');
    await typeScript(page, Array.from({ length: 150 }, () => 'a').join(' '));
    await expect(length).toContainText('1 min');
    await expect(warning).toHaveCount(0);
    await expect(page.getByTestId('advisor-split')).toHaveCount(0);
    await expect(page.getByTestId('advisor-estimate')).toHaveCount(0);

    // Near the limit: a warning with the remaining characters, Generate still available.
    await modelOption(page, CHATTERBOX).click();
    await typeScript(page, 'x'.repeat(NEAR_LIMIT_CHARS));
    await expect(warning).toHaveText(
      `${CHATTERBOX_LIMIT - NEAR_LIMIT_CHARS} characters left for ${CHATTERBOX}.`,
    );
    await expect(page.getByTestId('advisor-split')).toBeVisible();
    await expect(generate(page)).toBeEnabled();
    await page.screenshot({ path: shotPath('advisor-near-limit') });

    // Over the limit: the advisor points at the reason; only the limit rule disables Generate.
    await typeScript(page, 'x'.repeat(OVER_LIMIT_CHARS));
    await expect(warning).toHaveText(
      `Over the ${CHATTERBOX} limit by ${OVER_LIMIT_CHARS - CHATTERBOX_LIMIT} characters. See the reason beside Generate.`,
    );
    await expect(generate(page)).toBeDisabled();

    // Minimax cost is an estimate and the advisor says why.
    await modelOption(page, MINIMAX_HD).click();
    await typeScript(page, script(SCRIPT_CHARS));
    await expect(page.getByTestId('advisor-estimate')).toContainText('Estimated');
    await expect(page.getByTestId('advisor-estimate')).toContainText('tokens');
    await expect(cost(page)).toContainText('Estimated');
    await expect(cost(page)).toContainText(String(MINIMAX_HD_COST_1000_CHARS));
    await expect(warning).toHaveCount(0);
    await expect(generate(page)).toBeEnabled();
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });
});
