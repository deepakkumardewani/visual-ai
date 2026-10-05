import { test as base } from '@playwright/test';

import type { IImageObject, JobStatus } from '@visual-ai/shared';

import { WEB_URL } from '../support/env';

const FIXTURE_IMAGE_URL = `${WEB_URL}/e2e-fixture.png`;
const E2E_JOB_ID = 'e2e-stub-job';
// 1x1 transparent PNG
const FIXTURE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// The API lives on another origin, so cross-origin responses need CORS headers.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': WEB_URL,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};

// Mirrors the 202 body of POST /generate/image (apps/api/src/routes/generate.ts).
const ACCEPT_BODY = { message: 'Processing started', status: 'processing' };

function buildResultImage(prompt: string): IImageObject {
  return {
    _id: `e2e-${E2E_JOB_ID}`,
    userId: process.env.E2E_CLERK_USER_ID ?? '',
    prompt,
    featureType: 'image' as IImageObject['featureType'],
    createdAt: new Date().toISOString(),
    modelName: 'E2E Stub',
    imageType: 'horizontal',
    images: [
      {
        name: 'e2e-fixture',
        aiImageUrl: FIXTURE_IMAGE_URL,
        resolution: '1x1',
        aspectRatio: '16:9',
        width: 1,
        height: 1,
        format: 'png',
        bytes: 70,
      },
    ],
  };
}

function completedJob(prompt: string, userCreditsRemaining: number | null): JobStatus {
  // 'completed' makes the app close its EventSource, so it never reconnects.
  return { status: 'completed', image: buildResultImage(prompt), userCreditsRemaining };
}

function processingJobWithCredits(prompt: string, userCreditsRemaining: number): JobStatus {
  return { status: 'processing', image: buildResultImage(prompt), userCreditsRemaining };
}

function progressSseBody(prompt: string, userCreditsRemaining: number | null): string {
  const chunks: string[] = [];
  if (userCreditsRemaining !== null) {
    chunks.push(`data: ${JSON.stringify(processingJobWithCredits(prompt, userCreditsRemaining))}\n\n`);
  }
  chunks.push(`data: ${JSON.stringify(completedJob(prompt, null))}\n\n`);
  return chunks.join('');
}

export interface GenerationStub {
  /** Number of stubbed POST /generate/image calls; 0 means nothing was submitted. */
  generateRequestCount: () => number;
  setPrompt: (prompt: string) => void;
  /** When set, SSE emits a processing event with this balance before completed. */
  setUserCreditsRemaining: (remaining: number | null) => void;
  /** Fail the next N POST /generate/image requests (for retry tests). */
  setFailNextGenerations: (count: number) => void;
  /** Next progress stream only emits an error event (POST still succeeds). */
  setNextProgressError: (message?: string) => void;
}

export const test = base.extend<{ generationStub: GenerationStub }>({
  generationStub: async ({ page }, use) => {
    let requestCount = 0;
    let prompt = 'e2e stub prompt';
    let userCreditsRemaining: number | null = null;
    let failNextGenerations = 0;
    /** After a failed POST, the UI still opens SSE — emit error so the banner can show. */
    let progressShouldError = false;
    let nextProgressErrorMessage: string | null = null;

    await page.route(/\/generate\/image$/, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS_HEADERS });
      }
      if (failNextGenerations > 0) {
        failNextGenerations -= 1;
        progressShouldError = true;
        return route.fulfill({
          status: 500,
          headers: CORS_HEADERS,
          body: 'Internal Server Error',
        });
      }
      requestCount += 1;
      progressShouldError = false;
      return route.fulfill({ status: 202, headers: CORS_HEADERS, json: ACCEPT_BODY });
    });

    await page.route(/\/progress\?jobId=/, (route) => {
      if (progressShouldError || nextProgressErrorMessage) {
        progressShouldError = false;
        const message =
          nextProgressErrorMessage ??
          'Sorry, there was an error processing your request. Please try again.';
        nextProgressErrorMessage = null;
        return route.fulfill({
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          body: `data: ${JSON.stringify({ status: 'error', message })}\n\n`,
        });
      }
      return route.fulfill({
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: progressSseBody(prompt, userCreditsRemaining),
      });
    });

    await page.route('**/e2e-fixture.png**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(FIXTURE_IMAGE_BASE64, 'base64'),
      }),
    );

    await use({
      generateRequestCount: () => requestCount,
      setPrompt: (value) => {
        prompt = value;
      },
      setUserCreditsRemaining: (value) => {
        userCreditsRemaining = value;
      },
      setFailNextGenerations: (count) => {
        failNextGenerations = count;
      },
      setNextProgressError: (message) => {
        nextProgressErrorMessage =
          message ?? 'Sorry, there was an error processing your request. Please try again.';
      },
    });
  },
});

export { expect } from '@playwright/test';
