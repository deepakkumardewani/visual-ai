import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/qa';
import { gotoStudio } from '../support/studio';

const HEIGHT = 900;

async function openStudioAt(page: Page, width: number) {
  await page.setViewportSize({ width, height: HEIGHT });
  await gotoStudio(page);
}

test.describe('header responsive banner and Earn pill', () => {
  for (const width of [390, 700]) {
    test(
      `Banner visible at ${width}px and Earn pill absent`,
      { tag: ['@critical'] },
      async ({ page, snap }) => {
        await openStudioAt(page, width);

        await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();
        await expect(page.getByTestId('referral-offer-desktop')).toHaveCount(0);
        await snap(`header-banner-${width}`);
      },
    );
  }

  for (const width of [768, 1024]) {
    test(
      `Banner absent and Earn pill present at ${width}px`,
      { tag: ['@critical'] },
      async ({ page, snap }) => {
        await openStudioAt(page, width);

        await expect(page.getByTestId('referral-offer-desktop')).toBeVisible();
        await expect(page.getByTestId('referral-offer-mobile')).toHaveCount(0);
        await snap(`header-earn-pill-${width}`);
      },
    );
  }

  test('No horizontal page scroll at 700px', { tag: ['@medium'] }, async ({ page }) => {
    await openStudioAt(page, 700);
    await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const height of [600, 900]) {
    test(
      `Shell fits under the in-flow header with nothing cut off at 700x${height}`,
      { tag: ['@critical'] },
      async ({ page, snap }) => {
        await page.setViewportSize({ width: 700, height });
        await gotoStudio(page);
        await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();

        const layout = await page.evaluate(() => {
          const header = document.querySelector('header.header-v2');
          const shell = document.querySelector('[data-testid="dashboard-shell"]');
          const rail = document.querySelector('[data-testid="dashboard-rail"]');
          const box = shell?.parentElement;
          const bottoms = [...(rail?.children ?? [])].map((c) => c.getBoundingClientRect().bottom);
          rail?.scrollTo(0, rail.scrollHeight);
          const railEnd = Math.max(
            ...[...(rail?.children ?? [])].map((c) => c.getBoundingClientRect().bottom),
          );
          return {
            headerBottom: header?.getBoundingClientRect().bottom ?? -1,
            shellTop: shell?.getBoundingClientRect().top ?? -1,
            shellBottom: shell?.getBoundingClientRect().bottom ?? Infinity,
            boxScrollOverflow: box ? box.scrollHeight - box.clientHeight : Infinity,
            railChildren: bottoms.length,
            railEnd,
            railBottom: rail?.getBoundingClientRect().bottom ?? -1,
            docHeight: document.documentElement.scrollHeight,
          };
        });

        expect(Math.abs(layout.shellTop - layout.headerBottom)).toBeLessThanOrEqual(1);
        expect(layout.shellBottom).toBeLessThanOrEqual(height);
        expect(layout.boxScrollOverflow).toBeLessThanOrEqual(0);
        expect(layout.docHeight).toBeLessThanOrEqual(height);
        expect(layout.railChildren).toBeGreaterThan(0);
        expect(layout.railEnd).toBeLessThanOrEqual(Math.min(layout.railBottom, height) + 1);
        await snap(`header-band-700x${height}`);
      },
    );
  }
});
