import type { BrowserContext, Page, Response } from '@playwright/test';

import { expect, test } from '../fixtures/base';
import {
  createCloudinaryRecorder,
  installCloudinaryMock,
  isCloudinaryUrl,
  pickMockAsset,
} from '../support/cloudinaryMock';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/e2e-mock-guard';
const IMAGE_URL = `${CLOUDINARY_BASE}/image/upload/w_200/sample.jpg`;
const VIDEO_URL = `${CLOUDINARY_BASE}/video/upload/intro.mp4`;
const MP4_FTYP_OFFSET = 4;
const MP4_FTYP = 'ftyp';
const RIFF = 'RIFF';
const WEBP = 'WEBP';

/** Loads a Cloudinary URL from page context and returns the response metadata the browser saw. */
async function fetchFromPage(page: Page, url: string) {
  return page.evaluate(async (target) => {
    const res = await fetch(target);
    const bytes = new Uint8Array(await res.arrayBuffer());
    return {
      status: res.status,
      contentType: res.headers.get('content-type'),
      bytes: [...bytes.slice(0, 12)],
    };
  }, url);
}

const ascii = (bytes: number[], from: number, to: number) =>
  String.fromCharCode(...bytes.slice(from, to));

test.describe('Cloudinary mock guard', () => {
  test('a page that requests a Cloudinary image gets the placeholder and zero network hits @critical', async ({
    page,
    cloudinaryMock,
  }) => {
    await page.goto('about:blank');
    await page.setContent(`<img id="probe" alt="probe" src="${IMAGE_URL}">`);
    await expect
      .poll(() =>
        page
          .getByRole('img', { name: 'probe' })
          .evaluate((el: HTMLImageElement) => el.naturalWidth),
      )
      .toBeGreaterThan(0);

    const res = await fetchFromPage(page, IMAGE_URL);
    expect(res.contentType).toBe('image/webp');
    expect(ascii(res.bytes, 0, 4)).toBe(RIFF);
    expect(ascii(res.bytes, 8, 12)).toBe(WEBP);

    expect(cloudinaryMock.requestedUrls).toContain(IMAGE_URL);
    expect(cloudinaryMock.networkHits).toEqual([]);
  });

  test('a Cloudinary video URL gets the mp4 fixture @critical', async ({
    page,
    cloudinaryMock,
  }) => {
    await page.goto('about:blank');
    const res = await fetchFromPage(page, VIDEO_URL);
    expect(res.status).toBe(200);
    expect(res.contentType).toBe('video/mp4');
    expect(ascii(res.bytes, MP4_FTYP_OFFSET, MP4_FTYP_OFFSET + 4)).toBe(MP4_FTYP);

    const queried = await fetchFromPage(page, `${CLOUDINARY_BASE}/image/upload/clip.mp4?x=1`);
    expect(queried.contentType).toBe('video/mp4');

    expect(cloudinaryMock.requestedUrls).toContain(VIDEO_URL);
    expect(cloudinaryMock.networkHits).toEqual([]);
  });

  test('the guard records a hit when a Cloudinary response reaches the network @high', async () => {
    // A fake context lets us emit a response that has a server address (= real network)
    // without sending any request to production Cloudinary.
    let onResponse: ((r: Response) => Promise<void>) | undefined;
    const fakeContext = {
      route: async () => undefined,
      on: (_event: string, handler: (r: Response) => Promise<void>) => {
        onResponse = handler;
      },
    } as unknown as BrowserContext;
    const fakeResponse = (url: string, addr: { ipAddress: string; port: number } | null) =>
      ({ url: () => url, serverAddr: async () => addr }) as unknown as Response;

    const recorder = createCloudinaryRecorder();
    await installCloudinaryMock(fakeContext, recorder);

    await onResponse?.(fakeResponse(IMAGE_URL, null));
    expect(recorder.networkHits).toEqual([]);

    await onResponse?.(
      fakeResponse('https://example.com/a.png', { ipAddress: '1.2.3.4', port: 443 }),
    );
    expect(recorder.networkHits).toEqual([]);

    await onResponse?.(fakeResponse(IMAGE_URL, { ipAddress: '1.2.3.4', port: 443 }));
    expect(recorder.networkHits).toEqual([IMAGE_URL]);
  });

  test('the mock classifies hosts and asset kinds correctly @high', async () => {
    expect(isCloudinaryUrl(IMAGE_URL)).toBe(true);
    expect(isCloudinaryUrl('https://evil.example.com/res.cloudinary.com/x.png')).toBe(false);
    expect(pickMockAsset(VIDEO_URL).contentType).toBe('video/mp4');
    expect(pickMockAsset(`${IMAGE_URL}?foo=/video/`).contentType).toBe('image/webp');
  });
});
