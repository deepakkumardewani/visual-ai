import { test as base, expect } from '@playwright/test';
import type { APIResponse, ConsoleMessage, TestInfo } from '@playwright/test';

import { API_URL, requireEnv } from '../support/env';
import { signWebhook } from '../support/signWebhook';

type QAFixtures = {
  snap: (name: string) => Promise<void>;
  postSignedWebhook: (payload: unknown) => Promise<APIResponse>;
  consoleGuard: void;
};

export const test = base.extend<QAFixtures>({
  consoleGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (msg: ConsoleMessage) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      await use();
      expect(errors, `Unexpected console.error:\n${errors.join('\n')}`).toEqual([]);
    },
    { auto: true },
  ],

  snap: async ({ page }, use, testInfo: TestInfo) => {
    await use(async (name: string) => {
      const path = testInfo.outputPath(`${name}.png`);
      await page.screenshot({ path, fullPage: true });
      await testInfo.attach(name, { path, contentType: 'image/png' });
    });
  },

  postSignedWebhook: async ({ request }, use) => {
    await use(async (payload: unknown) => {
      const secret = requireEnv('DODO_PAYMENTS_WEBHOOK_KEY');
      const body = JSON.stringify(payload);
      const headers = signWebhook({ body, secret });
      return request.post(`${API_URL}/webhooks/payments`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        data: body,
      });
    });
  },
});

export { expect };
