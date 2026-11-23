import type { APIRequestContext, BrowserContext } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import {
  createPaidCallRecorder,
  describePaidHit,
  guardApiRequest,
  installPaidCallRouteGuard,
  isPaidCall,
  OPT_IN_HINT,
  paidCallMessage,
  PAID_PATH_PATTERN,
} from './paidCallGuard';

describe('isPaidCall', () => {
  it.each([
    'https://api.test/generate/image',
    'https://api.test/generate/image?x=1',
    'https://api.test/generate/upscale/image',
    'https://api.test/generate/remove-bg/image/',
    'https://api.test/generate/video',
    'https://api.test/generate/audio/song',
    'https://api.test/generate/audio/music',
    'https://api.test/generate/audio/speech',
    'https://api.test/generate/audio/voices',
    'https://api.test/generate/audio/voices/',
    'https://api.test/generate/tools/autocaption',
    'https://api.test/generate/tools/image-watermark?x=1',
    'https://api.test/generate/tools/video-watermark',
    'https://api.test/prompt/lyrics',
    'https://api.test/prompt/lyrics/',
  ])('flags POST %s', (url) => {
    expect(isPaidCall('POST', url)).toBe(true);
    expect(isPaidCall('post', url)).toBe(true);
  });

  it.each([
    'https://api.test/generate/audio/song',
    'https://api.test/generate/audio/voices',
    'https://api.test/generate/tools/autocaption',
    'https://api.test/generate/video',
    'https://api.test/prompt/lyrics',
  ])('does not flag GET or HEAD %s', (url) => {
    expect(isPaidCall('GET', url)).toBe(false);
    expect(isPaidCall('HEAD', url)).toBe(false);
  });

  it('ignores near-miss paths on the broadened routes', () => {
    expect(isPaidCall('POST', 'https://api.test/generate/audio')).toBe(false);
    expect(isPaidCall('POST', 'https://api.test/generate/audio/song/extra')).toBe(false);
    expect(isPaidCall('POST', 'https://api.test/generate/tools/')).toBe(false);
    expect(isPaidCall('POST', 'https://api.test/prompt/lyrics/extra')).toBe(false);
    expect(isPaidCall('POST', 'https://api.test/prompt')).toBe(false);
  });

  it('ignores non-POST methods, the reference upload, and unrelated or malformed URLs', () => {
    expect(isPaidCall('GET', 'https://api.test/generate/image')).toBe(false);
    expect(isPaidCall('OPTIONS', 'https://api.test/generate/image')).toBe(false);
    expect(isPaidCall('POST', 'https://api.test/generate/reference-images')).toBe(false);
    expect(isPaidCall('POST', 'https://api.test/images/generate/image/download')).toBe(false);
    expect(isPaidCall('POST', 'not a url')).toBe(false);
  });
});

describe('guard exports', () => {
  it('exposes the broadened pattern and no opt-out switch', async () => {
    expect(PAID_PATH_PATTERN.test('/generate/audio/song')).toBe(true);
    const exported = Object.keys(await import('./paidCallGuard'));
    expect(exported.filter((name) => /optout|disable|allow|skip/i.test(name))).toEqual([]);
  });

  it('describes a hit with an upper-cased method and the url', () => {
    expect(describePaidHit('post', 'https://api.test/generate/image')).toBe(
      'POST https://api.test/generate/image',
    );
  });

  it('builds a message listing every hit plus the opt-in hint', () => {
    const message = paidCallMessage([
      'POST https://a/generate/image',
      'POST https://a/prompt/lyrics',
    ]);
    expect(message).toContain('POST https://a/generate/image\nPOST https://a/prompt/lyrics');
    expect(message).toContain(OPT_IN_HINT);
  });

  it('starts with an empty recorder per call', () => {
    const first = createPaidCallRecorder();
    first.hits.push('x');
    expect(createPaidCallRecorder().hits).toEqual([]);
  });
});

type RouteHandler = (route: FakeRoute) => Promise<unknown>;
type FakeRoute = {
  request: () => { method: () => string; url: () => string };
  abort: ReturnType<typeof vi.fn>;
  fallback: ReturnType<typeof vi.fn>;
};

function fakeRoute(method: string, url: string): FakeRoute {
  return {
    request: () => ({ method: () => method, url: () => url }),
    abort: vi.fn().mockResolvedValue(undefined),
    fallback: vi.fn().mockResolvedValue(undefined),
  };
}

async function installOnFakeContext() {
  const handlers = new Map<string, RouteHandler>();
  const context = {
    route: vi.fn(async (glob: string, handler: RouteHandler) => {
      handlers.set(glob, handler);
    }),
  } as unknown as BrowserContext;
  const recorder = createPaidCallRecorder();
  await installPaidCallRouteGuard(context, recorder);
  return { handlers, recorder };
}

describe('installPaidCallRouteGuard', () => {
  it('registers a route for the generate and lyrics globs', async () => {
    const { handlers } = await installOnFakeContext();
    expect([...handlers.keys()]).toEqual(['**/generate/**', '**/prompt/lyrics**']);
  });

  it('records and aborts an un-intercepted paid POST', async () => {
    const { handlers, recorder } = await installOnFakeContext();
    const route = fakeRoute('POST', 'https://api.test/prompt/lyrics');
    await handlers.get('**/prompt/lyrics**')!(route);
    expect(route.abort).toHaveBeenCalledWith('blockedbyclient');
    expect(route.fallback).not.toHaveBeenCalled();
    expect(recorder.hits).toEqual(['POST https://api.test/prompt/lyrics']);
  });

  it('falls back for non-paid requests without recording', async () => {
    const { handlers, recorder } = await installOnFakeContext();
    const route = fakeRoute('GET', 'https://api.test/generate/audio/song');
    await handlers.get('**/generate/**')!(route);
    expect(route.fallback).toHaveBeenCalledTimes(1);
    expect(route.abort).not.toHaveBeenCalled();
    expect(recorder.hits).toEqual([]);
  });
});

describe('guardApiRequest', () => {
  function guarded() {
    const original = vi.fn().mockResolvedValue('response');
    const api = { fetch: original } as unknown as APIRequestContext;
    const recorder = createPaidCallRecorder();
    guardApiRequest(api, recorder);
    return { api, original, recorder };
  }

  it('throws and records a paid POST given a string url, without sending it', async () => {
    const { api, original, recorder } = guarded();
    await expect(
      api.fetch('https://api.test/generate/tools/autocaption', { method: 'POST' }),
    ).rejects.toThrow('un-intercepted');
    expect(original).not.toHaveBeenCalled();
    expect(recorder.hits).toEqual(['POST https://api.test/generate/tools/autocaption']);
  });

  it('throws for a paid request object and takes its method', async () => {
    const { api, original, recorder } = guarded();
    const request = { url: () => 'https://api.test/generate/video', method: () => 'POST' };
    await expect(api.fetch(request as never)).rejects.toThrow('un-intercepted');
    expect(original).not.toHaveBeenCalled();
    expect(recorder.hits).toEqual(['POST https://api.test/generate/video']);
  });

  it('defaults a string url with no method to GET and passes it through', async () => {
    const { api, original, recorder } = guarded();
    await expect(api.fetch('https://api.test/generate/image')).resolves.toBe('response');
    expect(original).toHaveBeenCalledWith('https://api.test/generate/image', undefined);
    expect(recorder.hits).toEqual([]);
  });

  it('passes a non-paid request object through', async () => {
    const { api, original } = guarded();
    const request = { url: () => 'https://api.test/me', method: () => 'POST' };
    await expect(api.fetch(request as never)).resolves.toBe('response');
    expect(original).toHaveBeenCalledTimes(1);
  });
});
