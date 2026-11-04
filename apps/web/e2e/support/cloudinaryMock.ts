import fs from 'node:fs';
import path from 'node:path';

import type { BrowserContext } from '@playwright/test';

const CLOUDINARY_ROUTE = '**/res.cloudinary.com/**';
const CLOUDINARY_HOST = 'res.cloudinary.com';
const VIDEO_PATH_SEGMENT = '/video/';
const VIDEO_EXTENSION = '.mp4';

// __dirname: Playwright loads e2e files as CommonJS, where import.meta is unavailable.
const ASSET_DIR = path.join(__dirname, '..', 'fixtures', 'assets');

export type MockAsset = { file: string; contentType: 'video/mp4' | 'image/webp' };

const VIDEO_ASSET: MockAsset = { file: 'placeholder.mp4', contentType: 'video/mp4' };
const IMAGE_ASSET: MockAsset = { file: 'placeholder.webp', contentType: 'image/webp' };

export type CloudinaryRecorder = {
  /** Every Cloudinary URL the page requested, mocked or not. */
  requestedUrls: string[];
  /** Cloudinary URLs that escaped the mock and reached the real network. */
  networkHits: string[];
};

export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

/** Query strings are ignored so transformation params cannot flip the asset kind. */
export function pickMockAsset(url: string): MockAsset {
  const { pathname } = new URL(url);
  const isVideo = pathname.includes(VIDEO_PATH_SEGMENT) || pathname.endsWith(VIDEO_EXTENSION);
  return isVideo ? VIDEO_ASSET : IMAGE_ASSET;
}

const TARGET_CLOSED_PATTERN = /Target page, context or browser has been closed/;

export function createCloudinaryRecorder(): CloudinaryRecorder {
  return { requestedUrls: [], networkHits: [] };
}

/**
 * Serves every res.cloudinary.com request from local fixtures. A fulfilled response has no
 * server address, so a response that has one reached the real network (e.g. via a service worker).
 */
export async function installCloudinaryMock(
  context: BrowserContext,
  recorder: CloudinaryRecorder = createCloudinaryRecorder(),
): Promise<CloudinaryRecorder> {
  await context.route(CLOUDINARY_ROUTE, async (route) => {
    const url = route.request().url();
    recorder.requestedUrls.push(url);
    const { file, contentType } = pickMockAsset(url);
    await route.fulfill({
      contentType,
      body: await fs.promises.readFile(path.join(ASSET_DIR, file)),
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });

  context.on('response', async (response) => {
    const url = response.url();
    if (!isCloudinaryUrl(url)) return;
    const serverAddr = await response.serverAddr().catch((error: Error) => {
      // A response still in flight when the test ends loses its context; nothing left to record.
      if (TARGET_CLOSED_PATTERN.test(error.message)) return null;
      throw error;
    });
    if (serverAddr !== null) recorder.networkHits.push(url);
  });

  return recorder;
}
