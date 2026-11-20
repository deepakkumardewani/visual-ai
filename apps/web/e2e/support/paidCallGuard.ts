import type { APIRequestContext, BrowserContext } from '@playwright/test';

// Generation endpoints that enqueue a billable provider job (apps/api/src/routes/generate.ts):
// POST /generate/image, /generate/<op>/image (upscale, revive, colorize, remove-bg) and the video
// equivalents. /generate/reference-images only uploads files, so it is intentionally excluded.
const PAID_PATH_PATTERN = /\/generate\/(?:[a-z-]+\/)?(?:image|video)\/?$/;
const PAID_METHOD = 'POST';
const PAID_ROUTE_GLOB = '**/generate/**';

export const OPT_IN_HINT =
  'Stub it (generationStub fixture) or, only if the request is guaranteed to be rejected before ' +
  'a job is enqueued, opt in with test.use({ allowRealPaidCalls: true }) and a comment saying why.';

export type PaidCallRecorder = {
  /** "POST <url>" entries for paid requests that were not intercepted by a test stub. */
  hits: string[];
};

export function createPaidCallRecorder(): PaidCallRecorder {
  return { hits: [] };
}

/** Query strings are ignored so they cannot hide a paid endpoint. */
export function isPaidCall(method: string, url: string): boolean {
  if (method.toUpperCase() !== PAID_METHOD) return false;
  try {
    return PAID_PATH_PATTERN.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function describePaidHit(method: string, url: string): string {
  return `${method.toUpperCase()} ${url}`;
}

export function paidCallMessage(hits: string[]): string {
  return `Paid generation request reached the network un-intercepted:\n${hits.join('\n')}\n${OPT_IN_HINT}`;
}

/**
 * Browser traffic: a context-level route is the lowest-priority route, so it only sees paid
 * requests that no page.route stub handled. It aborts them so no billable job can start.
 */
export async function installPaidCallRouteGuard(
  context: BrowserContext,
  recorder: PaidCallRecorder,
): Promise<void> {
  await context.route(PAID_ROUTE_GLOB, async (route) => {
    const { method, url } = {
      method: route.request().method(),
      url: route.request().url(),
    };
    if (!isPaidCall(method, url)) return route.fallback();
    recorder.hits.push(describePaidHit(method, url));
    return route.abort('blockedbyclient');
  });
}

/**
 * Playwright's APIRequestContext (page.request, the `request` fixture) bypasses page/context
 * routes, so every verb is guarded where they all funnel: fetch(). Throws before sending.
 */
export function guardApiRequest(api: APIRequestContext, recorder: PaidCallRecorder): void {
  const originalFetch = api.fetch.bind(api);
  api.fetch = (async (urlOrRequest, options) => {
    const isString = typeof urlOrRequest === 'string';
    const url = isString ? urlOrRequest : urlOrRequest.url();
    const method = options?.method ?? (isString ? 'GET' : urlOrRequest.method());
    if (isPaidCall(method, url)) {
      const hit = describePaidHit(method, url);
      recorder.hits.push(hit);
      throw new Error(paidCallMessage([hit]));
    }
    return originalFetch(urlOrRequest, options);
  }) as APIRequestContext['fetch'];
}
