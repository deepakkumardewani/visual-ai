import path from 'node:path';

import { clerk } from '@clerk/testing/playwright';
import dotenv from 'dotenv';
import type { APIRequestContext, Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { API_URL } from '../support/env';

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

async function postGenerate(
  request: APIRequestContext,
  token: string,
  body: Record<string, unknown>,
) {
  const res = await request.post(GENERATE_IMAGE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      modelId: MODEL_WITH_REFERENCE_INPUT,
      prompt: 'e2e dev-cloud reference',
      ...body,
    },
  });
  return { status: res.status(), text: await res.text() };
}

test.describe('reference images and the configured Cloudinary cloud', () => {
  test('@high a reference image URL from the configured cloud is accepted', async ({
    page,
    request,
    cloudinaryMock,
  }) => {
    const token = await clerkBearerToken(page);
    const cloud = configuredCloudName();

    const res = await postGenerate(request, token, {
      referenceImageUrls: [refUrl(cloud, 'ref-a'), refUrl(cloud, 'ref-b')],
    });

    expect(res.status).toBe(400);
    expect(res.text).toContain(PAST_VALIDATION_ERROR);
    expect(res.text).not.toContain(CLOUD_ERROR);
    expect(cloudinaryMock.networkHits).toEqual([]);
  });

  test('@high a URL from another cloud is rejected with an error', async ({
    page,
    request,
    cloudinaryMock,
  }) => {
    const token = await clerkBearerToken(page);
    const foreign = await postGenerate(request, token, {
      referenceImageUrls: [refUrl(OTHER_CLOUD, 'ref-x')],
    });
    expect(foreign.status).toBe(400);
    expect(foreign.text).toContain(CLOUD_ERROR);

    expect(cloudinaryMock.networkHits).toEqual([]);
  });

  test('@high a mix of valid and foreign cloud URLs is rejected', async ({
    page,
    request,
    cloudinaryMock,
  }) => {
    const token = await clerkBearerToken(page);
    const res = await postGenerate(request, token, {
      referenceImageUrls: [refUrl(configuredCloudName(), 'ref-ok'), refUrl(OTHER_CLOUD, 'ref-bad')],
    });
    expect(res.status).toBe(400);
    expect(res.text).toContain(CLOUD_ERROR);
    expect(cloudinaryMock.networkHits).toEqual([]);
  });

  test('@medium empty reference input is ignored', async ({ page, request, cloudinaryMock }) => {
    const token = await clerkBearerToken(page);

    for (const body of [{ referenceImageUrls: [] }, {}]) {
      const res = await postGenerate(request, token, body);
      expect(res.status).toBe(400);
      expect(res.text).toContain(PAST_VALIDATION_ERROR);
      expect(res.text).not.toContain(CLOUD_ERROR);
    }
    expect(cloudinaryMock.networkHits).toEqual([]);
  });
});
