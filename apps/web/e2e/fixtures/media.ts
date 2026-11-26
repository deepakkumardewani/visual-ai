import fs from 'node:fs';
import path from 'node:path';

import { test as base } from './base';

import type { FeatureType, JobStatus, MediaAssetDto, MediaJobStage } from '@visual-ai/shared';

import { E2E_WEB_ORIGIN } from '../support/env';
import { isPaidCall, paidCallMessage } from '../support/paidCallGuard';

const E2E_MEDIA_JOB_ID = 'e2e-media-stub-job';
const FIXTURE_ASSET_PATH = '/e2e-media';
const FIXTURE_AUDIO_URL = `${E2E_WEB_ORIGIN}${FIXTURE_ASSET_PATH}/sample.mp3`;
const FIXTURE_VIDEO_URL = `${E2E_WEB_ORIGIN}${FIXTURE_ASSET_PATH}/placeholder.mp4`;
const FIXTURE_IMAGE_URL = `${E2E_WEB_ORIGIN}${FIXTURE_ASSET_PATH}/placeholder.webp`;
const FIXTURE_TRANSCRIPT_URL = `${E2E_WEB_ORIGIN}${FIXTURE_ASSET_PATH}/transcript.txt`;
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};
const ASSET_DIR = path.join(__dirname, 'assets');

const DEFAULT_CREDITS_CHARGED = 10;
const DEFAULT_REQUIRED = 20;
const DEFAULT_AVAILABLE = 5;
const FIXTURE_DURATION_SEC = 1;
const SLOW_STAGES: MediaJobStage[] = ['queued', 'composing', 'mastering', 'saving'];

const MODERATED_MESSAGE = "This text can't be used. Try rephrasing it.";
const FAILURE_MESSAGE = 'Sorry, there was an error processing your request. Please try again.';
const FAKE_LYRICS = { sections: [{ section: 'Verse', lines: ['Fake lyric line'] }] };

// Same CORS headers as GenerationStub: the API lives on another origin.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};
const SSE_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
};

// Every paid media POST (SPEC R-INF-4); the stub intercepts the POST itself, not only the stream.
const MEDIA_POST_PATTERN =
  /\/generate\/(?:audio\/[a-z-]+|tools\/[a-z-]+|video)\/?$|\/prompt\/lyrics\/?$/;
const IMAGE_PATH_PATTERN = /\/generate\/tools\/image-watermark\/?$/;
const AUTOCAPTION_PATH_PATTERN = /\/generate\/tools\/autocaption\/?$/;
const VIDEO_PATH_PATTERN = /\/generate\/(?:video|tools\/(?:video-watermark|autocaption))\/?$/;
const FEATURE_BY_SEGMENT: Record<string, string> = {
  song: 'song',
  music: 'music',
  speech: 'speech',
  voices: 'speech',
  video: 'video',
  'image-watermark': 'watermark_image',
  'video-watermark': 'watermark_video',
  autocaption: 'autocaption',
};

export type MediaVariant = 'success' | 'failure' | 'insufficient' | 'moderated' | 'slow';

export interface MediaVariantOptions {
  /** 402 body numbers; only used by the `insufficient` variant. */
  required?: number;
  available?: number;
  /** Credits shown as charged on `success` and `slow`. */
  credits?: number;
  /** Balance reported with the completed event. */
  userCreditsRemaining?: number | null;
}

export interface MediaGenerationStub {
  /** Selects the variant for every later media POST; `success` is the default. */
  setVariant: (variant: MediaVariant, options?: MediaVariantOptions) => void;
  /** Stubbed media POSTs that were accepted (202); rejected 402/422 posts are not counted. */
  acceptedRequestCount: () => number;
  /** "POST <url>" for every media POST the stub intercepted, accepted or not. */
  interceptedPosts: () => string[];
  /** Holds the next progress streams open until the returned release function is called. */
  holdProgress: () => () => void;
}

function segmentOf(url: string): string {
  return new URL(url).pathname.replace(/\/$/, '').split('/').pop() ?? '';
}

function buildAsset(url: string, credits: number): MediaAssetDto {
  const { pathname } = new URL(url);
  const isVideo = VIDEO_PATH_PATTERN.test(pathname);
  const isImage = IMAGE_PATH_PATTERN.test(pathname);
  const segment = segmentOf(url);
  return {
    id: `e2e-${E2E_MEDIA_JOB_ID}`,
    type: isImage ? 'image' : isVideo ? 'video' : 'audio',
    feature: (FEATURE_BY_SEGMENT[segment] ?? 'song') as FeatureType,
    modelKey: 'E2E_STUB',
    title: 'E2E stub asset',
    url: isImage ? FIXTURE_IMAGE_URL : isVideo ? FIXTURE_VIDEO_URL : FIXTURE_AUDIO_URL,
    ...(AUTOCAPTION_PATH_PATTERN.test(pathname) ? { transcriptUrl: FIXTURE_TRANSCRIPT_URL } : {}),
    durationSec: FIXTURE_DURATION_SEC,
    creditsCharged: credits,
    saved: true,
  };
}

function sseBody(events: Array<Partial<JobStatus>>): string {
  return events
    .map((event) => `data: ${JSON.stringify({ image: undefined, ...event })}\n\n`)
    .join('');
}

function completedEvent(
  postUrl: string,
  options: MediaVariantOptions,
): Partial<JobStatus> & { status: string } {
  const credits = options.credits ?? DEFAULT_CREDITS_CHARGED;
  const asset = buildAsset(postUrl, credits);
  return {
    status: 'completed',
    asset,
    assetId: asset.id,
    credits,
    userCreditsRemaining: options.userCreditsRemaining ?? null,
  };
}

function progressBody(
  variant: MediaVariant,
  postUrl: string,
  options: MediaVariantOptions,
): string {
  if (variant === 'failure') {
    return sseBody([
      { status: 'error', message: FAILURE_MESSAGE, noCharge: true, reason: 'FAILED' },
    ]);
  }
  const completed = completedEvent(postUrl, options);
  if (variant === 'slow') {
    const stages = SLOW_STAGES.map((stage) => ({
      status: 'processing',
      stage,
      userCreditsRemaining: null,
    }));
    return sseBody([...stages, completed]);
  }
  return sseBody([completed]);
}

export const test = base.extend<{ mediaGenerationStub: MediaGenerationStub }>({
  mediaGenerationStub: async ({ page, paidCallGuard }, use) => {
    let variant: MediaVariant = 'success';
    let options: MediaVariantOptions = {};
    let acceptedCount = 0;
    const intercepted: string[] = [];
    // The progress stream carries no path, so remember the last accepted POST to shape its asset.
    let lastPostUrl = `${E2E_WEB_ORIGIN}/generate/audio/song`;
    let progressGate: Promise<void> | null = null;

    await page.route(MEDIA_POST_PATTERN, async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS_HEADERS });
      }
      if (!isPaidCall(request.method(), request.url())) return route.fallback();
      intercepted.push(`${request.method()} ${request.url()}`);

      if (new URL(request.url()).pathname.endsWith('/prompt/lyrics')) {
        return route.fulfill({ status: 200, headers: CORS_HEADERS, json: FAKE_LYRICS });
      }
      if (variant === 'insufficient') {
        return route.fulfill({
          status: 402,
          headers: CORS_HEADERS,
          json: {
            code: 'INSUFFICIENT_CREDITS',
            required: options.required ?? DEFAULT_REQUIRED,
            available: options.available ?? DEFAULT_AVAILABLE,
          },
        });
      }
      if (variant === 'moderated') {
        return route.fulfill({
          status: 422,
          headers: CORS_HEADERS,
          json: { code: 'PROMPT_REJECTED', message: MODERATED_MESSAGE },
        });
      }
      acceptedCount += 1;
      lastPostUrl = request.url();
      return route.fulfill({
        status: 202,
        headers: CORS_HEADERS,
        json: { message: 'Processing started', status: 'processing', jobId: E2E_MEDIA_JOB_ID },
      });
    });

    await page.route(/\/progress\?jobId=/, async (route) => {
      if (progressGate) await progressGate;
      return route.fulfill({
        status: 200,
        headers: SSE_HEADERS,
        body: progressBody(variant, lastPostUrl, options),
      });
    });

    // Result URLs: served locally so playback never touches Cloudinary or Replicate.
    await page.route(`**${FIXTURE_ASSET_PATH}/*`, (route) => {
      const file = path.basename(new URL(route.request().url()).pathname);
      const contentType = CONTENT_TYPE_BY_EXT[path.extname(file)] ?? 'audio/mpeg';
      return route.fulfill({
        status: 200,
        contentType,
        headers: CORS_HEADERS,
        body: fs.readFileSync(path.join(ASSET_DIR, file)),
      });
    });

    await use({
      setVariant: (next, nextOptions = {}) => {
        variant = next;
        options = nextOptions;
      },
      acceptedRequestCount: () => acceptedCount,
      interceptedPosts: () => [...intercepted],
      holdProgress: () => {
        let release = () => {};
        progressGate = new Promise<void>((resolve) => {
          release = () => {
            progressGate = null;
            resolve();
          };
        });
        return release;
      },
    });

    // Fail loudly if a paid media POST slipped past this stub to the network guard.
    const missed = paidCallGuard.hits.filter((hit) => MEDIA_POST_PATTERN.test(hit));
    if (missed.length > 0) throw new Error(paidCallMessage(missed));
  },
});

export { expect } from './base';
