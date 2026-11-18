import type { Locator, Page } from '@playwright/test';

import { test, expect } from '../fixtures/qa';
import { gotoStudio } from '../support/studio';

const HEIGHT = 900;
const MIN_TAP_PX = 44;
const TAP_TOLERANCE_PX = 0.5;
const SM_BREAKPOINT = 640;
const MD_BREAKPOINT = 768;
const WIDTHS = [360, 390, 700, 768, 1024, 1440] as const;
const MOBILE_WIDTHS = [360, 390, 700] as const;
const BANNER_WIDTHS = [360, 390] as const;
const AUDIT_BAND_WIDTH = 700;
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/create-responsive/${name}.png`;

async function openCreate(page: Page, width: number, height = HEIGHT) {
  await page.setViewportSize({ width, height });
  await gotoStudio(page);
  await expect(page.getByTestId('prompt-bar')).toBeVisible();
}

async function overflowPx(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

async function expectTapTarget(locator: Locator, label: string) {
  await expect(locator.first(), `${label} is visible`).toBeVisible();
  const boxes = await locator.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, shown: r.width > 0 && r.height > 0 };
    }),
  );
  const shown = boxes.filter((b) => b.shown);
  expect(shown.length, `${label} renders`).toBeGreaterThan(0);
  for (const b of shown) {
    expect(b.h, `${label} height`).toBeGreaterThanOrEqual(MIN_TAP_PX - TAP_TOLERANCE_PX);
    expect(b.w, `${label} width`).toBeGreaterThanOrEqual(MIN_TAP_PX - TAP_TOLERANCE_PX);
  }
}

/** Sidebar chips live in the rail from 640 and inside the Settings sheet below it. */
async function revealSidebar(page: Page, width: number) {
  if (width >= SM_BREAKPOINT) {
    await expect(page.getByTestId('image-generate-aside')).toBeVisible();
    return;
  }
  await page.getByTestId('mobile-settings-trigger').click();
  await expect(page.getByRole('dialog', { name: 'Feature settings' })).toBeVisible();
  await expect(page.getByTestId('image-generate-aside')).toBeVisible();
}

test.describe('Create responsiveness', () => {
  for (const width of WIDTHS) {
    test(`No horizontal scroll at ${width}px`, { tag: ['@critical'] }, async ({ page, snap }) => {
      await openCreate(page, width);
      await expect(page.getByTestId('credits-chip')).toBeVisible();
      expect(await overflowPx(page)).toBeLessThanOrEqual(0);
      await snap(`create-${width}`);
      await page.screenshot({ path: shotPath(`create-${width}`) });
    });
  }

  for (const width of BANNER_WIDTHS) {
    test(
      `Composer bottom within the viewport with the banner showing at ${width}px`,
      { tag: ['@critical'] },
      async ({ page, snap }) => {
        await openCreate(page, width);
        await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();
        await expect(page.getByTestId('generate-cta-wrap')).toBeVisible();

        const m = await page.evaluate(() => {
          const bar = document.querySelector('[data-testid="prompt-bar"]')!.getBoundingClientRect();
          const cta = document
            .querySelector('[data-testid="generate-cta-wrap"]')!
            .getBoundingClientRect();
          return {
            barTop: bar.top,
            barBottom: bar.bottom,
            ctaBottom: cta.bottom,
            h: innerHeight,
          };
        });
        expect(m.barTop).toBeGreaterThan(0);
        expect(m.barBottom).toBeLessThanOrEqual(m.h);
        expect(m.ctaBottom).toBeLessThanOrEqual(m.h);
        await snap(`composer-banner-${width}`);
      },
    );
  }

  for (const width of MOBILE_WIDTHS) {
    test(
      `Header and composer controls are at least 44px at ${width}px`,
      { tag: ['@high'] },
      async ({ page, snap }) => {
        await openCreate(page, width);
        await expectTapTarget(page.getByRole('button', { name: /^Visual AI/ }), 'logo');
        await expectTapTarget(page.getByTestId('feature-select-trigger'), 'feature select');
        await expectTapTarget(page.getByTestId('user-menu-trigger'), 'user menu');
        if (width < MD_BREAKPOINT) {
          await expectTapTarget(page.getByTestId('referral-offer-mobile'), 'referral banner');
        }
        const bar = page.getByTestId('prompt-bar');
        await expectTapTarget(
          bar.getByTestId('reference-image-trigger'),
          'reference image trigger',
        );
        await expectTapTarget(bar.getByTestId('voice-mic-button'), 'mic');
        await expectTapTarget(bar.getByTestId('prompt-ai-trigger'), 'AI actions');
        await expectTapTarget(bar.getByTestId('generate-cta-wrap').getByRole('button'), 'Generate');
        if (width < SM_BREAKPOINT) {
          await expectTapTarget(page.getByTestId('mobile-settings-trigger'), 'Settings trigger');
        }
        await snap(`tap-targets-${width}`);
      },
    );

    test(
      `Sidebar chips and size trigger are at least 44px at ${width}px`,
      { tag: ['@high'] },
      async ({ page, snap }) => {
        await openCreate(page, width);
        await revealSidebar(page, width);
        const aside = page.getByTestId('image-generate-aside');
        await expectTapTarget(aside.getByTestId('aspect-more-trigger'), 'More sizes');
        await expectTapTarget(
          aside.getByRole('group', { name: 'Number of images' }).getByRole('button'),
          'count chips',
        );
        await expectTapTarget(
          aside.getByRole('group', { name: 'Output format' }).getByRole('button'),
          'format chips',
        );
        await snap(`chips-${width}`);
      },
    );
  }

  test(
    'Desktop keeps compact chips at 1440px (mobile sizing does not leak)',
    { tag: ['@medium'] },
    async ({ page }) => {
      await openCreate(page, 1440);
      const chip = page
        .getByTestId('image-generate-aside')
        .getByRole('group', { name: 'Number of images' })
        .getByRole('button')
        .first();
      await expect(chip).toBeVisible();
      expect((await chip.boundingBox())!.height).toBeLessThan(MIN_TAP_PX);
    },
  );

  for (const width of [360, 390, 700, 768, 1024, 1440]) {
    test(`Feature dropdown is present at ${width}px`, { tag: ['@high'] }, async ({ page }) => {
      await openCreate(page, width);
      const trigger = page.getByTestId('feature-select-trigger');
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(
        page.getByTestId('feature-select-menu').getByRole('option', { name: 'Remove Background' }),
      ).toBeVisible();
    });
  }

  test(
    'Tabs are placed in the header at 768px and in a full-width row at 390px',
    {
      tag: ['@high'],
    },
    async ({ page }) => {
      await openCreate(page, MD_BREAKPOINT);
      const select = (await page.getByTestId('feature-select-trigger').boundingBox())!;
      const tabs = (await page.getByTestId('nav-tab-create').boundingBox())!;
      expect(tabs.y).toBeLessThan(select.y + select.height);
      expect(tabs.x).toBeGreaterThan(select.x + select.width);

      await openCreate(page, 390);
      const row = (await page.getByTestId('header-mobile-tabs').boundingBox())!;
      const select390 = (await page.getByTestId('feature-select-trigger').boundingBox())!;
      expect(row.y).toBeGreaterThanOrEqual(select390.y + select390.height);
      expect(row.width).toBeGreaterThan(390 * 0.9);
    },
  );

  test(
    'Picker trigger is a 44px chip at 700px and lives in the Settings sheet at 390px',
    { tag: ['@high'] },
    async ({ page }) => {
      await openCreate(page, AUDIT_BAND_WIDTH);
      const chip = page.getByTestId('model-chip');
      await expect(chip).toBeVisible();
      expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(
        MIN_TAP_PX - TAP_TOLERANCE_PX,
      );

      await openCreate(page, 390);
      await expect(page.getByTestId('model-chip')).toBeHidden();
      await revealSidebar(page, 390);
      await expect(page.getByTestId('model-picker')).toBeVisible();
    },
  );

  test(
    '700px band keeps the rail beside the canvas with the composer on screen',
    { tag: ['@high'] },
    async ({ page, snap }) => {
      await openCreate(page, AUDIT_BAND_WIDTH);
      await expect(page.getByTestId('image-generate-aside')).toBeVisible();
      const m = await page.evaluate(() => {
        const rail = document
          .querySelector('[data-testid="dashboard-rail"]')!
          .getBoundingClientRect();
        const bar = document.querySelector('[data-testid="prompt-bar"]')!.getBoundingClientRect();
        return {
          railRight: rail.right,
          barLeft: bar.left,
          barBottom: bar.bottom,
          h: innerHeight,
        };
      });
      expect(m.railRight).toBeLessThanOrEqual(m.barLeft + 1);
      expect(m.barBottom).toBeLessThanOrEqual(m.h);
      expect(await overflowPx(page)).toBeLessThanOrEqual(0);
      await snap('band-700');
    },
  );
});
