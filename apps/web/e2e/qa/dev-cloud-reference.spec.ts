import path from 'node:path';

import { clerk } from '@clerk/testing/playwright';
import dotenv from 'dotenv';
import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { API_URL, E2E_WEB_ORIGIN } from '../support/env';

const MODEL_WITH_REFERENCE_INPUT = 'FLUX_2_PRO';
const GENERATE_IMAGE_URL = `${API_URL}/generate/image`;
const CLOUD_ERROR = 'Each reference image URL must be a valid Cloudinary upload URL.';
// Validation runs before enqueue, and enqueue rejects a missing jobId. So "jobId is required"
// proves the reference URLs were accepted without starting a real (billable) generation.
const PAST_VALIDATION_ERROR = 'jobId is required';
const OTHER_CLOUD = 'not-the-configured-cloud';

/** The API validates against its own CLOUDINARY_CLOUD_NAME, so read the same source. */
function configuredCloudName(): string {
  const parsed = dotenv.config({
    path: path.join(__dirname, '..', '..', '..', 'api', '.env'),
    processEnv: {},
    quiet: true,
  }).parsed;
  const cloud = parsed?.CLOUDINARY_CLOUD_NAME;
  if (!cloud) throw new Error('[e2e] CLOUDINARY_CLOUD_NAME missing from apps/api/.env');
  return cloud;
}

/** Real Cloudinary delivery format: the cloud name is the first path segment. */
const refUrl = (cloud: string, name: string) =>
  `https://res.cloudinary.com/${cloud}/image/upload/v1/e2e/${name}.png`;

async function clerkBearerToken(page: Page): Promise<string> {
  await page.goto('/create/image');
  await clerk.loaded({ page });
  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  return page.evaluate(async () => {
    const token = await window.Clerk.session?.getToken();
    if (!token) throw new Error('[e2e] Clerk session token unavailable');
    return token;
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};

/**
 * Stubs POST /generate/image so no paid endpoint is hit (paidCallGuard stays on). The stub answers
 * like the API's reference-URL validation: foreign cloud -> CLOUD_ERROR, otherwise it gets past
 * validation and stops at PAST_VALIDATION_ERROR. The real validation is unit-tested in the API.
 */
async function stubGenerate(page: Page, cloud: string) {
  const ownPrefix = `https://res.cloudinary.com/${cloud}/`;
  await page.route(/\/generate\/image$/, (route) => {
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    const urls = (route.request().postDataJSON()?.referenceImageUrls ?? []) as string[];
    const foreign = urls.some((url) => !url.startsWith(ownPrefix));
    return route.fulfill({
      status: 400,
      headers: CORS_HEADERS,
      json: { message: foreign ? CLOUD_ERROR : PAST_VALIDATION_ERROR },
    });
  });
}

/** Issues the POST from the page so the page.route stub intercepts it. */
async function postGenerate(page: Page, token: string, body: Record<string, unknown>) {
  return page.evaluate(
    async ([url, bearer, payload]) => {
      const res = await fetch(url as string, {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { status: res.status, text: await res.text() };
    },
    [
      GENERATE_IMAGE_URL,
      token,
      { modelId: MODEL_WITH_REFERENCE_INPUT, prompt: 'e2e dev-cloud reference', ...body },
    ] as const,
  );
}

// The stubbed 400s are logged by the browser as console errors.
test.use({ expectedConsoleErrors: [/status of 400/] });

test.describe('reference images and the configured Cloudinary cloud', () => {
  test('@high a reference image URL from the configured cloud is accepted', async ({
    page,
    cloudinaryMock,
  }) => {
    const token = await clerkBearerToken(page);
    await stubGenerate(page, configuredCloudName());
    const cloud = configuredCloudName();

    const res = await postGenerate(page, token, {
      referenceImageUrls: [refUrl(cloud, 'ref-a'), refUrl(cloud, 'ref-b')],
    });

    expect(res.status).toBe(400);
    expect(res.text).toContain(PAST_VALIDATION_ERROR);
    expect(res.text).not.toContain(CLOUD_ERROR);
    expect(cloudinaryMock.networkHits).toEqual([]);
  });

  test('@high a URL from another cloud is rejected with an error', async ({
    page,
    cloudinaryMock,
  }) => {
    const token = await clerkBearerToken(page);
    await stubGenerate(page, configuredCloudName());
    const foreign = await postGenerate(page, token, {
      referenceImageUrls: [refUrl(OTHER_CLOUD, 'ref-x')],
    });
    expect(foreign.status).toBe(400);
    expect(foreign.text).toContain(CLOUD_ERROR);

    expect(cloudinaryMock.networkHits).toEqual([]);
  });

  test('@high a mix of valid and foreign cloud URLs is rejected', async ({
    page,
    cloudinaryMock,
  }) => {
    const token = await clerkBearerToken(page);
    await stubGenerate(page, configuredCloudName());
    const res = await postGenerate(page, token, {
      referenceImageUrls: [refUrl(configuredCloudName(), 'ref-ok'), refUrl(OTHER_CLOUD, 'ref-bad')],
    });
    expect(res.status).toBe(400);
    expect(res.text).toContain(CLOUD_ERROR);
    expect(cloudinaryMock.networkHits).toEqual([]);
  });

  test('@medium empty reference input is ignored', async ({ page, cloudinaryMock }) => {
    const token = await clerkBearerToken(page);
    await stubGenerate(page, configuredCloudName());

    for (const body of [{ referenceImageUrls: [] }, {}]) {
      const res = await postGenerate(page, token, body);
      expect(res.status).toBe(400);
      expect(res.text).toContain(PAST_VALIDATION_ERROR);
      expect(res.text).not.toContain(CLOUD_ERROR);
    }
    expect(cloudinaryMock.networkHits).toEqual([]);
  });
});
