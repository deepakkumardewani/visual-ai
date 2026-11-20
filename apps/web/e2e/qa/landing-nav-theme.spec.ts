import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';

// Guest landing page: no auth, no API calls needed.
test.use({ storageState: { cookies: [], origins: [] } });

const DARK_CLASS = 'tw-dark';
const MIN_TAP_PX = 44;
const HEIGHT = 900;
const WIDTH_PHONE = 390;
const WIDTH_TABLET = 800;
const WIDTH_SMALL_PHONE = 360;
const WIDTH_DESKTOP = 1440;
const TOGGLE_NAME = /Switch to (Light|Dark) Mode/;
const BURGER_NAME = 'Toggle menu';
const LOGO_NAME = 'Visual AI';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/landing-nav-theme/${name}.png`;

const toggles = (page: Page) => page.getByRole('button', { name: TOGGLE_NAME });

async function openLanding(page: Page, width: number) {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto('/');
  await expect(page.locator('.hero')).toBeVisible();
}

const isDark = (page: Page) =>
  page.evaluate((cls) => document.documentElement.classList.contains(cls), DARK_CLASS);

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error('element has no bounding box');
  return b;
}

async function expectToggleFlipsTheme(page: Page) {
  const toggle = toggles(page);
  await expect(toggle).toBeVisible();
  const before = await isDark(page);
  await toggle.click();
  await expect.poll(() => isDark(page)).toBe(!before);
  await toggle.click();
  await expect.poll(() => isDark(page)).toBe(before);
}

test.describe('landing nav theme toggle', () => {
  for (const width of [WIDTH_PHONE, WIDTH_TABLET]) {
    test(`at ${width} the toggle is visible with the menu closed and flips the theme @critical`, async ({
      page,
      snap,
    }) => {
      await openLanding(page, width);
      await expect(page.getByRole('button', { name: BURGER_NAME })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      await expect(toggles(page)).toHaveCount(1);
      await expectToggleFlipsTheme(page);
      await snap(`toggle-${width}`);
      await page.screenshot({ path: shotPath(`toggle-${width}`) });
    });
  }

  for (const width of [WIDTH_PHONE, WIDTH_TABLET]) {
    test(`at ${width} the toggle tap target is at least 44px and sits next to the burger @high`, async ({
      page,
    }) => {
      await openLanding(page, width);
      const toggleBox = await box(toggles(page));
      const burgerBox = await box(page.getByRole('button', { name: BURGER_NAME }));
      expect(toggleBox.width).toBeGreaterThanOrEqual(MIN_TAP_PX);
      expect(toggleBox.height).toBeGreaterThanOrEqual(MIN_TAP_PX);
      expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(burgerBox.x + 1);
    });
  }

  test('at 360 the header has no horizontal overflow and controls do not collide @high', async ({
    page,
    snap,
  }) => {
    await openLanding(page, WIDTH_SMALL_PHONE);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    const toggleBox = await box(toggles(page));
    const burgerBox = await box(page.getByRole('button', { name: BURGER_NAME }));
    const logoBox = await box(page.getByRole('banner').getByRole('button', { name: LOGO_NAME }));
    expect(burgerBox.x + burgerBox.width).toBeLessThanOrEqual(WIDTH_SMALL_PHONE);
    expect(toggleBox.x).toBeGreaterThanOrEqual(0);
    expect(logoBox.x + logoBox.width).toBeLessThanOrEqual(toggleBox.x);
    expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(burgerBox.x + 1);
    await snap('header-360');
  });

  test('at 1440 exactly one toggle is visible, in the actions beside the CTA @medium', async ({
    page,
    snap,
  }) => {
    await openLanding(page, WIDTH_DESKTOP);
    await expect(toggles(page)).toHaveCount(1);
    await expect(page.getByRole('button', { name: BURGER_NAME })).toBeHidden();
    const toggleBox = await box(toggles(page));
    const ctaBox = await box(page.getByRole('banner').getByRole('link', { name: 'Start free' }));
    expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(ctaBox.x);
    await expectToggleFlipsTheme(page);
    await snap('toggle-1440');
  });

  test('signed-out header on /pricing still has a single working ThemeButton @medium', async ({
    page,
  }) => {
    await page.setViewportSize({ width: WIDTH_DESKTOP, height: HEIGHT });
    await page.goto('/pricing');
    await expect(toggles(page)).toHaveCount(1);
    await expectToggleFlipsTheme(page);
  });
});
