import { mergeTests, type Page } from '@playwright/test';

import { test as generationTest } from '../fixtures/generation';
import { expect, test as qaTest } from '../fixtures/qa';
import { E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import {
  makePro,
  replaceHistoryWithSeed,
  restoreHistory,
  stubUnsavedGeneration,
  uniqueToken,
  type HistorySnapshot,
} from '../support/proPerksSeed';
import { gotoStudio } from '../support/studio';
import { resetToFree } from '../support/subscriptionState';

const test = mergeTests(qaTest, generationTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const FREE_CAP = 100;
const PRO_CAP = 500;
const NEAR_FULL_COUNT = 90;
const UNDER_THRESHOLD_COUNT = 89;
const ALT_PREFIX_LENGTH = 60;
const DELETE_URL = '**/image/delete';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/history-full/${name}.png`;

const FULL_WORDING = "History full - new creations won't be saved. Delete old images to make room.";

const note = (page: Page) => page.getByTestId('history-full-note');

/** Stubs single-image delete so no real API or Cloudinary destroy runs; the app filters locally. */
async function stubImageDelete(page: Page) {
  const cors = {
    'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  };
  const deletedIds: string[] = [];
  await page.route(DELETE_URL, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const { image } = request.postDataJSON() as { image: { _id: string } };
    deletedIds.push(image._id);
    return route.fulfill({
      status: 200,
      headers: cors,
      json: { success: true, image, imageId: image._id, message: 'Image deleted successfully' },
    });
  });
  return deletedIds;
}

test.describe('History-full notices', () => {
  let snapshot: HistorySnapshot | undefined;

  async function seed(count: number) {
    snapshot = await replaceHistoryWithSeed(E2E_USER_ID, count, uniqueToken());
  }

  test.beforeEach(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test.afterEach(async () => {
    if (snapshot) await restoreHistory(E2E_USER_ID, snapshot);
    snapshot = undefined;
    await resetToFree(E2E_USER_ID);
  });

  test('@critical Free seeded at 100 shows the full note with an Upgrade link', async ({
    page,
    snap,
  }) => {
    await seed(FREE_CAP);
    await gotoStudio(page);

    await expect(note(page)).toContainText(FULL_WORDING);
    await expect(note(page)).toHaveAttribute('data-level', 'full');
    await expect(page.getByTestId('history-full-upgrade')).toBeVisible();
    await snap('free-full');
    await note(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: shotPath('free-full'), fullPage: true });
  });

  test('@critical Pro seeded at 500 shows the full note without an Upgrade link', async ({
    page,
  }) => {
    await makePro(E2E_USER_ID);
    await seed(PRO_CAP);
    await gotoStudio(page);

    await expect(note(page)).toContainText(FULL_WORDING);
    await expect(note(page)).toHaveAttribute('data-level', 'full');
    await expect(page.getByTestId('history-full-upgrade')).toHaveCount(0);
    await note(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: shotPath('pro-full'), fullPage: true });
  });

  test('@high count at 90 shows the near-full wording', async ({ page }) => {
    await seed(NEAR_FULL_COUNT);
    await gotoStudio(page);

    await expect(note(page)).toContainText(
      `History almost full (${NEAR_FULL_COUNT}/${FREE_CAP}). Delete old images to keep saving new ones.`,
    );
    await expect(note(page)).toHaveAttribute('data-level', 'near');
    await expect(page.getByTestId('history-full-upgrade')).toBeVisible();
    await page.screenshot({ path: shotPath('free-near'), fullPage: true });
  });

  test('@high under 90 shows no note', async ({ page }) => {
    await seed(UNDER_THRESHOLD_COUNT);
    await gotoStudio(page);

    // Wait for the seeded history to render so "no note" is not just "not loaded yet".
    await expect(page.getByTestId('user-generation-card').first()).toBeVisible();
    await expect(note(page)).toHaveCount(0);
  });

  test('@high a stubbed not-saved result shows icon Download and Dismiss and no delete button', async ({
    page,
    generationStub, // stubs POST /generate/image so no real Replicate job is billed
  }) => {
    const prompt = `history full unsaved ${uniqueToken()}`;
    await seed(FREE_CAP);
    await stubUnsavedGeneration(page, prompt);
    await gotoStudio(page);

    await page.getByTestId('composer-textarea-input').fill(prompt);
    await page.getByTestId('generate-cta').dispatchEvent('click');
    const notice = page.getByTestId('unsaved-result-notice');
    await expect(notice).toBeVisible();
    await expect(page.getByAltText(prompt.slice(0, ALT_PREFIX_LENGTH)).first()).toBeVisible();

    await expect(notice).toContainText(
      `History full (${FREE_CAP}/${FREE_CAP}) - this image wasn't saved. Download it within ~1 hour.`,
    );
    // Padded empty buttons are "visible", so require the rendered icon svg inside each.
    await expect(
      notice.getByRole('button', { name: 'Download image' }).locator('svg'),
    ).toBeVisible();
    await expect(notice.getByRole('button', { name: 'Dismiss' }).locator('svg')).toBeVisible();
    await expect(notice.getByRole('button', { name: /delete/i })).toHaveCount(0);
    await expect(notice).not.toContainText('Delete images to free space');
    await page.screenshot({ path: shotPath('unsaved-notice'), fullPage: true });

    // dispatchEvent: a pointer click lands before the result canvas settles (as in create-image.spec).
    await notice.getByRole('button', { name: 'Dismiss' }).dispatchEvent('click');
    await expect(notice).toHaveCount(0);
    expect(generationStub.generateRequestCount()).toBe(1);
  });

  test('@high an unsaved result does not push a near-threshold history into the near-full note', async ({
    page,
    generationStub,
  }) => {
    const prompt = `history full unsaved count ${uniqueToken()}`;
    await seed(UNDER_THRESHOLD_COUNT);
    await stubUnsavedGeneration(page, prompt);
    await gotoStudio(page);

    await page.getByTestId('composer-textarea-input').fill(prompt);
    await page.getByTestId('generate-cta').dispatchEvent('click');
    // The unsaved (no _id) result joins the in-memory list: 89 saved + 1 unsaved = 90 entries.
    await expect(page.getByAltText(prompt.slice(0, ALT_PREFIX_LENGTH)).first()).toBeVisible();

    await expect(note(page)).toHaveCount(0);
    expect(generationStub.generateRequestCount()).toBe(1);
  });

  test('@medium deleting images lowers the level without reload', async ({ page }) => {
    await seed(NEAR_FULL_COUNT);
    const deletedIds = await stubImageDelete(page);
    await gotoStudio(page);
    await expect(note(page)).toHaveAttribute('data-level', 'near');

    const card = page.getByTestId('user-generation-card').first();
    await card.hover();
    await card.getByRole('button', { name: 'More actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'Delete generation' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(note(page)).toHaveCount(0);
    expect(deletedIds).toHaveLength(1);
  });
});
