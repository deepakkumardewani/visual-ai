// Base fixtures, not qa: an aborted request logs a console.error that qa's consoleGuard rejects.
import { expect, test } from '../fixtures/base';
import { API_URL } from '../support/env';
import { OPT_IN_HINT } from '../support/paidCallGuard';

// Hits are asserted then cleared so the guard's own teardown check stays green. Nothing here
// reaches the network: browser calls are aborted by the guard, API calls throw before sending.
const GENERATE_IMAGE_URL = `${API_URL}/generate/image`;

test.describe('paid call guard', () => {
  test('@critical blocks and records a browser POST to /generate/image', async ({
    page,
    paidCallGuard,
  }) => {
    await page.goto('/');
    const outcome = await page.evaluate(
      (url) =>
        fetch(url, { method: 'POST', body: '{}' }).then(
          () => 'sent',
          () => 'blocked',
        ),
      GENERATE_IMAGE_URL,
    );

    expect(outcome).toBe('blocked');
    expect(paidCallGuard.hits).toEqual([`POST ${GENERATE_IMAGE_URL}`]);
    paidCallGuard.hits.length = 0;
  });

  test('@critical a page.route stub takes precedence over the guard', async ({
    page,
    paidCallGuard,
  }) => {
    await page.route('**/generate/image', (route) =>
      route.fulfill({
        status: 202,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: '{}',
      }),
    );
    await page.goto('/');
    const status = await page.evaluate(
      (url) => fetch(url, { method: 'POST', body: '{}' }).then((res) => res.status),
      GENERATE_IMAGE_URL,
    );

    expect(status).toBe(202);
    expect(paidCallGuard.hits).toEqual([]);
  });

  test('@critical rejects page.request and request-fixture POSTs before sending', async ({
    page,
    request,
    paidCallGuard,
  }) => {
    for (const api of [page.request, request]) {
      await expect(api.post(GENERATE_IMAGE_URL, { data: {} })).rejects.toThrow(OPT_IN_HINT);
    }
    await expect(page.request.post(`${API_URL}/generate/upscale/image`)).rejects.toThrow(
      'un-intercepted',
    );
    expect(paidCallGuard.hits).toHaveLength(3);
    paidCallGuard.hits.length = 0;
  });
});
