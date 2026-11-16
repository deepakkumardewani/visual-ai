import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** The plan indicator lives only in the avatar menu; the header itself carries no plan chip. */
export const headerPlanChip = (page: Page) =>
  page.getByRole('banner').getByText('Pro', { exact: true });

/** Opens the avatar menu, asserts the pill reads `plan`, then closes it again. */
export async function expectPlanPill(page: Page, plan: 'Free' | 'Pro') {
  await page.getByTestId('user-menu-trigger').click();
  await expect(page.getByTestId('plan-pill')).toHaveText(plan);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('user-menu-panel')).toHaveCount(0);
}
