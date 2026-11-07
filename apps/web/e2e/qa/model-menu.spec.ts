import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';
import { MODEL_REGISTRY } from '@visual-ai/shared';

import { test, expect } from '../fixtures/qa';
import { requireEnv } from '../support/env';
import { activateProViaWebhook } from '../support/proWebhook';
import { gotoStudio } from '../support/studio';
import { resetToFree } from '../support/subscriptionState';

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const HTTP_OK = 200;
const SECTION_ORDER = ['featured', 'free', 'pro'];
const REF_CAPABLE_TITLE = 'Flux 2 Pro';
const REF_CAPABLE_TOOLTIP = 'Up to 8 reference images';
const NON_REF_TITLE = 'Flux Schnell';
const ROW_HEIGHT_TOLERANCE_PX = 0.5;
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 700 };
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/model-menu/${name}.png`;

// Titles of registry models that accept a reference image (same source the row uses).
// Missing `max` means a single image, matching the row's tooltip.
const REF_TOOLTIP_BY_TITLE = new Map(
  Object.values(MODEL_REGISTRY)
    .filter((entry) => entry.fields?.imageInput)
    .map((entry) => [entry.label, `Up to ${entry.fields?.imageInput?.max ?? 1} reference images`]),
);

async function openModelMenu(page: Page) {
  // Below the sm breakpoint the model chip lives in the settings bottom sheet.
  const settingsTrigger = page.getByTestId('mobile-settings-trigger');
  if (await settingsTrigger.isVisible()) await settingsTrigger.click();
  await page.getByTestId('model-chip').click();
  await expect(page.getByRole('listbox', { name: 'Select a model' })).toBeVisible();
  await expect(page.getByTestId('model-option').first()).toBeVisible();
}

const section = (page: Page, name: string) => page.getByTestId(`model-section-${name}`);

async function rowTitle(row: ReturnType<Page['locator']>) {
  return (await row.locator('span.tw-font-semibold').first().innerText()).trim();
}

test.describe('Model menu', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ viewport: DESKTOP });

  test.beforeEach(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test.afterAll(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test('@critical sections appear in order Featured, Free, Pro', async ({ page, snap }) => {
    await gotoStudio(page);
    await openModelMenu(page);

    const ids = await page
      .getByRole('listbox', { name: 'Select a model' })
      .locator('section[data-testid^="model-section-"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-testid')));
    expect(ids).toEqual(SECTION_ORDER.map((name) => `model-section-${name}`));

    const headings = await page
      .getByRole('listbox', { name: 'Select a model' })
      .getByRole('heading', { level: 3 })
      .allInnerTexts();
    expect(headings.map((h) => h.trim().toLowerCase())).toEqual(SECTION_ORDER);

    for (const name of SECTION_ORDER) {
      expect(await section(page, name).getByTestId('model-option').count()).toBeGreaterThan(0);
    }
    await snap('sections-order');
    await page.screenshot({ path: shotPath('sections-order') });
  });

  test('@critical all rows share one height', async ({ page, snap }) => {
    await gotoStudio(page);
    await openModelMenu(page);

    const rows = page.getByTestId('model-option');
    const count = await rows.count();
    expect(count).toBeGreaterThan(3);
    const heights = await rows.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height),
    );
    const first = heights[0];
    expect(first).toBeGreaterThan(0);
    for (const height of heights) {
      expect(Math.abs(height - first)).toBeLessThanOrEqual(ROW_HEIGHT_TOLERANCE_PX);
    }
    await snap('uniform-rows');
    await page.screenshot({ path: shotPath('uniform-rows') });
  });

  test('@high reference icon only on ref-capable models with exact tooltip', async ({
    page,
    snap,
  }) => {
    await gotoStudio(page);
    await openModelMenu(page);

    const freeSection = section(page, 'free');
    const refRow = freeSection.getByTestId('model-option').filter({
      has: page.getByText(REF_CAPABLE_TITLE, { exact: true }),
    });
    const plainRow = freeSection.getByTestId('model-option').filter({
      has: page.getByText(NON_REF_TITLE, { exact: true }),
    });
    await expect(plainRow).toHaveCount(1);
    await expect(plainRow.getByTestId('reference-image-icon')).toHaveCount(0);
    await expect(refRow).toHaveCount(1);

    const icon = refRow.getByTestId('reference-image-icon');
    await expect(icon).toHaveAccessibleName(REF_CAPABLE_TOOLTIP);
    await icon.hover();
    await expect(page.getByText(REF_CAPABLE_TOOLTIP, { exact: true })).toBeVisible();
    await snap('reference-tooltip');
    await page.screenshot({ path: shotPath('reference-tooltip') });
  });

  test('@high every registry imageInput model shows the icon and no other does', async ({
    page,
  }) => {
    await gotoStudio(page);
    await openModelMenu(page);

    const rows = page.getByTestId('model-option');
    const total = await rows.count();
    for (let i = 0; i < total; i += 1) {
      const row = rows.nth(i);
      const title = await rowTitle(row);
      const icons = row.getByTestId('reference-image-icon');
      const expectedTooltip = REF_TOOLTIP_BY_TITLE.get(title);
      if (expectedTooltip) {
        await expect(icons, `${title} should show the icon`).toHaveCount(1);
        await expect(icons).toHaveAccessibleName(expectedTooltip);
      } else {
        await expect(icons, `${title} should not show the icon`).toHaveCount(0);
      }
    }
  });

  test('@high Free sees locks in Featured and Pro sections, Pro sees none', async ({
    page,
    snap,
  }) => {
    await gotoStudio(page);
    await openModelMenu(page);

    const featuredLocks = section(page, 'featured').getByTestId('premium-lock-badge');
    const proLocks = section(page, 'pro').getByTestId('premium-lock-badge');
    expect(await featuredLocks.count()).toBeGreaterThan(0);
    const proRows = await section(page, 'pro').getByTestId('model-option').count();
    await expect(proLocks).toHaveCount(proRows);
    await expect(section(page, 'free').getByTestId('premium-lock-badge')).toHaveCount(0);
    await snap('free-locks');
    await page.screenshot({ path: shotPath('free-locks') });

    const res = await activateProViaWebhook(page, E2E_USER_ID, `sub_e2e_${RUN}_menu`);
    expect(res.status()).toBe(HTTP_OK);
    await gotoStudio(page);
    await openModelMenu(page);
    await expect(section(page, 'pro').getByTestId('model-option').first()).toBeVisible();
    await expect(page.getByTestId('premium-lock-badge')).toHaveCount(0);
    await snap('pro-no-locks');
    await page.screenshot({ path: shotPath('pro-no-locks') });
  });

  for (const [label, viewport] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
  ] as const) {
    test(`@medium ${label} width does not overflow`, async ({ page, snap }) => {
      await page.setViewportSize(viewport);
      await gotoStudio(page);
      await openModelMenu(page);

      const metrics = await page.evaluate(() => {
        const panel = document.querySelector('[role="listbox"][aria-label="Select a model"]');
        if (!panel) throw new Error('listbox missing');
        const box = panel.getBoundingClientRect();
        return {
          pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
          panelOverflow: panel.scrollWidth - panel.clientWidth,
          left: box.left,
          right: box.right,
          innerWidth: window.innerWidth,
        };
      });
      expect(metrics.pageOverflow).toBeLessThanOrEqual(0);
      expect(metrics.panelOverflow).toBeLessThanOrEqual(0);
      expect(metrics.left).toBeGreaterThanOrEqual(0);
      expect(metrics.right).toBeLessThanOrEqual(metrics.innerWidth);

      const rowBoxes = await page
        .getByTestId('model-option')
        .evaluateAll((els) => els.map((el) => el.scrollWidth - el.clientWidth));
      for (const overflow of rowBoxes) expect(overflow).toBeLessThanOrEqual(0);
      await snap(`${label}-no-overflow`);
      await page.screenshot({ path: shotPath(`${label}-no-overflow`) });
    });
  }
});
