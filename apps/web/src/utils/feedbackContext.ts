import { FEEDBACK_CONTEXT_STRING_MAX_LENGTH, FEEDBACK_VIEWPORT_MAX } from '@visual-ai/shared';
import type { FeedbackContext } from '@visual-ai/shared';

/** Balances at or below this count as "low"; there is no server-side tier concept for credits. */
export const LOW_CREDITS_MAX = 5;

export type CreditsTier = 'empty' | 'low' | 'ample';

export interface FeedbackContextInputs {
  /** Full route path; any query string or hash is dropped. */
  routePath: string;
  lastModelId?: string;
  plan?: string;
  credits?: number;
  appVersion?: string;
  userAgent?: string;
  viewport?: { w: number; h: number };
}

export function creditsTierFor(credits: number): CreditsTier {
  if (credits <= 0) return 'empty';
  return credits <= LOW_CREDITS_MAX ? 'low' : 'ample';
}

/** The API rejects over-long strings instead of trimming, so clip here to never lose a submission. */
function clip(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, FEEDBACK_CONTEXT_STRING_MAX_LENGTH);
}

function clampDimension(value: number): number {
  return Math.min(Math.max(Math.round(value), 1), FEEDBACK_VIEWPORT_MAX);
}

export function stripQuery(path: string): string {
  return path.split(/[?#]/)[0] ?? '';
}

/** Pure: builds the auto-captured context sent with feedback. Absent values are omitted. */
export function buildFeedbackContext(inputs: FeedbackContextInputs): FeedbackContext {
  const { viewport } = inputs;
  const context: FeedbackContext = {
    route: clip(stripQuery(inputs.routePath)),
    lastModelId: clip(inputs.lastModelId),
    plan: clip(inputs.plan),
    creditsTier: inputs.credits === undefined ? undefined : creditsTierFor(inputs.credits),
    appVersion: clip(inputs.appVersion),
    userAgent: clip(inputs.userAgent),
    viewport: viewport
      ? { w: clampDimension(viewport.w), h: clampDimension(viewport.h) }
      : undefined,
  };
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined),
  ) as FeedbackContext;
}

/** Reads browser globals; kept thin so `buildFeedbackContext` stays pure and testable. */
export function readBrowserContext(): Pick<
  FeedbackContextInputs,
  'appVersion' | 'userAgent' | 'viewport'
> {
  return {
    appVersion: __APP_VERSION__,
    userAgent: navigator.userAgent,
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
}
