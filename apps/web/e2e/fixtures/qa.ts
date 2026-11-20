import type { APIResponse, ConsoleMessage, TestInfo } from '@playwright/test';

import { test as base, expect } from './base';
import { API_URL, requireEnv } from '../support/env';
import { signWebhook } from '../support/signWebhook';

type QAFixtures = {
  snap: (name: string) => Promise<void>;
  postSignedWebhook: (payload: unknown) => Promise<APIResponse>;
  consoleGuard: void;
};

type QAOptions = {
  /** Console errors a test provokes on purpose (e.g. a stubbed 403); anything else still fails. */
  expectedConsoleErrors: RegExp[];
};

export const test = base.extend<QAFixtures & QAOptions>({
  expectedConsoleErrors: [[], { option: true }],

  consoleGuard: [
    async ({ page, expectedConsoleErrors }, use) => {
      const errors: string[] = [];
      page.on('console', (msg: ConsoleMessage) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (!expectedConsoleErrors.some((pattern) => pattern.test(text))) errors.push(text);
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
