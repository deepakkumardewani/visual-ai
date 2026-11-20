import fs from 'node:fs';
import path from 'node:path';

import type { BrowserContext } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import {
  createCloudinaryRecorder,
  installCloudinaryMock,
  isCloudinaryUrl,
  pickMockAsset,
} from './cloudinaryMock';

const IMAGE = { file: 'placeholder.webp', contentType: 'image/webp' };
const VIDEO = { file: 'placeholder.mp4', contentType: 'video/mp4' };
const ASSET_DIR = path.join(__dirname, '..', 'fixtures', 'assets');

describe('isCloudinaryUrl', () => {
  it('accepts the Cloudinary host', () => {
    expect(isCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/a.jpg')).toBe(true);
  });

  it('rejects other hosts, lookalike hosts and malformed input', () => {
    expect(isCloudinaryUrl('https://example.com/res.cloudinary.com/a.jpg')).toBe(false);
    expect(isCloudinaryUrl('https://res.cloudinary.com.evil.test/a.jpg')).toBe(false);
    expect(isCloudinaryUrl('not a url')).toBe(false);
    expect(isCloudinaryUrl('')).toBe(false);
  });
});

describe('pickMockAsset', () => {
  it('returns the image asset for an image upload path', () => {
    expect(pickMockAsset('https://res.cloudinary.com/demo/image/upload/a.jpg')).toEqual(IMAGE);
  });

  it('returns the video asset when the path contains /video/', () => {
    expect(pickMockAsset('https://res.cloudinary.com/demo/video/upload/clip')).toEqual(VIDEO);
  });

  it('returns the video asset for an .mp4 path outside /video/', () => {
    expect(pickMockAsset('https://res.cloudinary.com/demo/raw/upload/clip.mp4')).toEqual(VIDEO);
  });

  it('ignores query strings when classifying', () => {
    expect(
      pickMockAsset('https://res.cloudinary.com/demo/image/upload/a.jpg?x=/video/y.mp4'),
    ).toEqual(IMAGE);
    expect(pickMockAsset('https://res.cloudinary.com/demo/video/upload/clip.mp4?w=100')).toEqual(
      VIDEO,
    );
  });

  it('falls back to the image asset for non-Cloudinary hosts', () => {
    expect(pickMockAsset('https://example.com/pic.png')).toEqual(IMAGE);
  });

  it('throws on a malformed URL', () => {
    expect(() => pickMockAsset('nope')).toThrow();
  });
});

describe('createCloudinaryRecorder', () => {
  it('returns independent empty recorders', () => {
    const a = createCloudinaryRecorder();
    const b = createCloudinaryRecorder();
    a.requestedUrls.push('x');
    expect(a).toEqual({ requestedUrls: ['x'], networkHits: [] });
    expect(b).toEqual({ requestedUrls: [], networkHits: [] });
  });
});

type RouteHandler = (route: unknown) => Promise<void>;
type ResponseHandler = (response: unknown) => Promise<void>;

function fakeContext() {
  const handlers: { route?: RouteHandler; response?: ResponseHandler; pattern?: string } = {};
  const context = {
    route: vi.fn(async (pattern: string, handler: RouteHandler) => {
      handlers.pattern = pattern;
      handlers.route = handler;
    }),
    on: vi.fn((event: string, handler: ResponseHandler) => {
      if (event === 'response') handlers.response = handler;
    }),
  };
  return { context: context as unknown as BrowserContext, handlers };
}

function fakeRoute(url: string) {
  const fulfill = vi.fn(async () => undefined);
  return { route: { request: () => ({ url: () => url }), fulfill }, fulfill };
}

const fakeResponse = (url: string, serverAddr: unknown) => ({
  url: () => url,
  serverAddr: async () => serverAddr,
});

describe('installCloudinaryMock', () => {
  it('routes only Cloudinary URLs and returns the recorder it was given', async () => {
    const { context, handlers } = fakeContext();
    const recorder = createCloudinaryRecorder();

    const result = await installCloudinaryMock(context, recorder);

    expect(result).toBe(recorder);
    expect(handlers.pattern).toBe('**/res.cloudinary.com/**');
  });

  it('creates a recorder when none is provided', async () => {
    const { context } = fakeContext();
    expect(await installCloudinaryMock(context)).toEqual({ requestedUrls: [], networkHits: [] });
  });

  it('fulfills an image request with the webp fixture and records the URL', async () => {
    const { context, handlers } = fakeContext();
    const recorder = await installCloudinaryMock(context);
    const url = 'https://res.cloudinary.com/demo/image/upload/a.jpg?w=10';
    const { route, fulfill } = fakeRoute(url);

    await handlers.route!(route);

    expect(recorder.requestedUrls).toEqual([url]);
    expect(fulfill).toHaveBeenCalledWith({
      contentType: 'image/webp',
      body: fs.readFileSync(path.join(ASSET_DIR, 'placeholder.webp')),
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });

  it('fulfills a video request with the mp4 fixture', async () => {
    const { context, handlers } = fakeContext();
    await installCloudinaryMock(context);
    const { route, fulfill } = fakeRoute('https://res.cloudinary.com/demo/video/upload/c.mp4');

    await handlers.route!(route);

    expect(fulfill).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'video/mp4',
        body: fs.readFileSync(path.join(ASSET_DIR, 'placeholder.mp4')),
      }),
    );
  });

  it('records a network hit when a Cloudinary response has a server address', async () => {
    const { context, handlers } = fakeContext();
    const recorder = await installCloudinaryMock(context);
    const url = 'https://res.cloudinary.com/demo/image/upload/a.jpg';

    await handlers.response!(fakeResponse(url, { ipAddress: '1.2.3.4', port: 443 }));

    expect(recorder.networkHits).toEqual([url]);
  });

  it('does not record a hit for a fulfilled Cloudinary response (null server address)', async () => {
    const { context, handlers } = fakeContext();
    const recorder = await installCloudinaryMock(context);

    await handlers.response!(
      fakeResponse('https://res.cloudinary.com/demo/image/upload/a.jpg', null),
    );

    expect(recorder.networkHits).toEqual([]);
  });

  it('ignores responses from non-Cloudinary hosts', async () => {
    const { context, handlers } = fakeContext();
    const recorder = await installCloudinaryMock(context);

    await handlers.response!(
      fakeResponse('https://example.com/a.png', { ipAddress: '1.2.3.4', port: 443 }),
    );

    expect(recorder.networkHits).toEqual([]);
  });
});
