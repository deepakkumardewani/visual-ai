import { FEEDBACK_CONTEXT_STRING_MAX_LENGTH, FEEDBACK_VIEWPORT_MAX } from '@visual-ai/shared';
import { describe, expect, it } from 'vitest';

import {
  LOW_CREDITS_MAX,
  buildFeedbackContext,
  creditsTierFor,
  readBrowserContext,
  stripQuery,
} from '@/utils/feedbackContext';

describe('feedbackContext', () => {
  it('strips query and hash from the route', () => {
    expect(stripQuery('/create/image?prompt=secret#x')).toBe('/create/image');
    expect(buildFeedbackContext({ routePath: '/profile?token=abc' }).route).toBe('/profile');
  });

  it('maps credits to a tier', () => {
    expect(creditsTierFor(0)).toBe('empty');
    expect(creditsTierFor(LOW_CREDITS_MAX)).toBe('low');
    expect(creditsTierFor(LOW_CREDITS_MAX + 1)).toBe('ample');
  });

  it('omits absent values', () => {
    expect(buildFeedbackContext({ routePath: '/' })).toEqual({ route: '/' });
  });

  it('clips long strings and clamps the viewport so the API never rejects it', () => {
    const context = buildFeedbackContext({
      routePath: '/',
      userAgent: 'x'.repeat(FEEDBACK_CONTEXT_STRING_MAX_LENGTH + 50),
      viewport: { w: FEEDBACK_VIEWPORT_MAX * 2, h: 0 },
    });
    expect(context.userAgent).toHaveLength(FEEDBACK_CONTEXT_STRING_MAX_LENGTH);
    expect(context.viewport).toEqual({ w: FEEDBACK_VIEWPORT_MAX, h: 1 });
  });

  it('reads the injected app version and browser globals', () => {
    const browser = readBrowserContext();
    expect(typeof __APP_VERSION__).toBe('string');
    expect(browser.appVersion).toBe(__APP_VERSION__);
    expect(browser.viewport?.w).toBe(window.innerWidth);
  });
});
