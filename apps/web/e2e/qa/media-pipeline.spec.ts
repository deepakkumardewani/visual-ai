import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Page } from '@playwright/test';

import { test as mediaTest } from '../fixtures/media';
import { expect, test as qaTest } from '../fixtures/qa';
import { API_URL, requireEnv } from '../support/env';
import { deleteAudioAsset, seedAudioAsset } from '../support/mediaAssetSeed';
import { OPT_IN_HINT } from '../support/paidCallGuard';
import { readCredits, uniqueToken } from '../support/proPerksSeed';

const test = mergeTests(qaTest, mediaTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const SAMPLE_MP3 = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'assets', 'sample.mp3'));
const MUSIC_URL = `${API_URL}/generate/audio/music`;
const PROGRESS_URL = `${API_URL}/progress`;
const HTTP_ACCEPTED = 202;
const HTTP_BAD_REQUEST = 400;
const HTTP_INSUFFICIENT = 402;
const SEEDED_DURATION_SEC = 42;
const STUB_JOB_ID = 'e2e-media-stub-job';

// Every path the guard was broadened to cover (SPEC R-INF-4), as literals independent of the pattern.
const BROADENED_PAID_URLS = [
  `${API_URL}/generate/audio/song`,
  `${API_URL}/generate/audio/music`,
  `${API_URL}/generate/audio/speech`,
  `${API_URL}/generate/audio/voices`,
  `${API_URL}/generate/tools/image-watermark`,
  `${API_URL}/generate/tools/video-watermark`,
  `${API_URL}/generate/tools/autocaption`,
  `${API_URL}/generate/video`,
  `${API_URL}/prompt/lyrics`,
];

async function clerkBearerToken(page: Page): Promise<string> {
  await page.goto('/create/image');
  await clerk.loaded({ page });
  return page.evaluate(async () => {
    const token = await window.Clerk.session?.getToken();
    if (!token) throw new Error('[e2e] Clerk session token unavailable');
    return token;
  });
}

/** Issued from the page so the page.route stub intercepts it (page.request would bypass it). */
async function postMusic(page: Page, jobId: string) {
  return page.evaluate(
    async ([url, id]) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelKey: 'LYRIA_2',
          prompt: 'e2e calm piano',
          jobId: id,
        }),
      });
      return { status: res.status, body: await res.json() };
    },
    [MUSIC_URL, jobId],
  );
}

async function readProgress(page: Page, jobId: string): Promise<Array<Record<string, unknown>>> {
  const text = await page.evaluate(
    (url) => fetch(url).then((res) => res.text()),
    `${PROGRESS_URL}?jobId=${jobId}`,
  );
  return text
    .split('\n\n')
    .filter((chunk) => chunk.startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.slice('data: '.length)));
}

test.describe('media pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create/image');
    await clerk.loaded({ page });
  });

  // Stub-level check of the wire shape; the real-balance scenario lives in the e2e-user describe below.
  test('@high stub success variant returns 202 and SSE completes with the asset', async ({
    page,
    mediaGenerationStub,
  }) => {
    mediaGenerationStub.setVariant('success', { credits: 10 });
    const jobId = randomUUID();

    const post = await postMusic(page, jobId);
    expect(post.status).toBe(HTTP_ACCEPTED);
    expect(post.body).toMatchObject({
      status: 'processing',
      jobId: STUB_JOB_ID,
    });

    const events = await readProgress(page, STUB_JOB_ID);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      status: 'completed',
      credits: 10,
      asset: { type: 'audio', feature: 'music', creditsCharged: 10 },
    });
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(mediaGenerationStub.interceptedPosts()).toEqual([`POST ${MUSIC_URL}`]);
  });

  test('@critical failure variant leaves the balance unchanged', async ({
    page,
    mediaGenerationStub,
  }) => {
    mediaGenerationStub.setVariant('failure');
    const before = await readCredits(E2E_USER_ID);

    const post = await postMusic(page, randomUUID());
    expect(post.status).toBe(HTTP_ACCEPTED);
    const events = await readProgress(page, STUB_JOB_ID);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      status: 'error',
      noCharge: true,
      reason: 'FAILED',
    });
    expect(events[0]).not.toHaveProperty('asset');
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test.describe('insufficient', () => {
    // The browser logs the deliberate 402 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 402/] });
    test('@critical insufficient variant returns 402 with required and available and enqueues nothing', async ({
      page,
      mediaGenerationStub,
    }) => {
      mediaGenerationStub.setVariant('insufficient', {
        required: 150,
        available: 7,
      });
      const before = await readCredits(E2E_USER_ID);

      const post = await postMusic(page, randomUUID());

      expect(post.status).toBe(HTTP_INSUFFICIENT);
      expect(post.body).toEqual({
        code: 'INSUFFICIENT_CREDITS',
        required: 150,
        available: 7,
      });
      expect(mediaGenerationStub.acceptedRequestCount()).toBe(0);
      expect(mediaGenerationStub.interceptedPosts()).toEqual([`POST ${MUSIC_URL}`]);
      expect(await readCredits(E2E_USER_ID)).toEqual(before);
    });
  });

  test('@high fake audio appears in GET /media/assets', async ({ page }) => {
    const token = await clerkBearerToken(page);
    const seeded = await seedAudioAsset({
      userId: E2E_USER_ID,
      token: uniqueToken(),
      durationSec: SEEDED_DURATION_SEC,
    });
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const audio = await page.request.get(`${API_URL}/media/assets?type=audio&limit=50`, {
        headers,
      });
      expect(audio.status()).toBe(200);
      const { items } = await audio.json();
      expect(items.length).toBeGreaterThan(0);
      expect(items.find((item: { id: string }) => item.id === seeded.id)).toMatchObject({
        title: seeded.title,
        type: 'audio',
        durationSec: SEEDED_DURATION_SEC,
        saved: true,
      });

      const video = await page.request.get(`${API_URL}/media/assets?type=video&limit=50`, {
        headers,
      });
      const videoIds = (await video.json()).items.map((item: { id: string }) => item.id);
      expect(videoIds).not.toContain(seeded.id);
    } finally {
      await deleteAudioAsset(seeded.id);
    }
  });

  test('@high sample.mp3 renamed .png is rejected', async ({ page }) => {
    const token = await clerkBearerToken(page);

    // Content sniffing runs before any storage call, so this never reaches Cloudinary.
    const res = await page.request.post(`${API_URL}/media/uploads?purpose=tool-image`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: 'sample.png',
          mimeType: 'image/png',
          buffer: SAMPLE_MP3,
        },
      },
    });

    expect(res.status()).toBe(HTTP_BAD_REQUEST);
    expect(JSON.stringify(await res.json())).toContain(
      'file: this file type is not allowed for tool-image',
    );
  });
});

// Real API path with the e2e Clerk user (fake Cloudinary server-side). Upload is not a paid path, so
// the paidCallGuard stays fully on. The fake-music-generate credit-drop scenario is a blocker: it
// needs an un-intercepted POST /generate/audio/music, which the guard forbids (see report).
test.describe('media pipeline: real API path (e2e user fakes)', () => {
  const FAKE_UPLOAD_DURATION_SEC = 5;

  function assertApiTreatsUserAsE2e() {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'api', '.env'), 'utf8');
    const line = envFile.split('\n').find((l) => l.startsWith('E2E_USER_IDS='));
    if (!line?.includes(E2E_USER_ID)) {
      throw new Error('[e2e] API E2E_USER_IDS does not list the e2e user; refusing a real upload');
    }
  }

  test('@high Uploading sample.mp3 returns an uploadId and durationSec', async ({ page }) => {
    assertApiTreatsUserAsE2e();
    const token = await clerkBearerToken(page);

    const res = await page.request.post(`${API_URL}/media/uploads?purpose=voice-sample`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: 'sample.mp3',
          mimeType: 'audio/mpeg',
          buffer: SAMPLE_MP3,
        },
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(typeof body.uploadId).toBe('string');
    expect(body.uploadId.length).toBeGreaterThan(0);
    expect(body.durationSec).toBe(FAKE_UPLOAD_DURATION_SEC);
  });
});

// Own describe without the media stub: its page.route would catch these POSTs before the guard.
test.describe('paid call guard self-test', () => {
  test.use({
    expectedConsoleErrors: [/ERR_BLOCKED_BY_CLIENT|Failed to load resource/],
  });

  test('@critical guard self-test: a deliberately un-intercepted POST to each broadened paid path is reported by the guard and never reaches a paid service', async ({
    page,
    request,
    paidCallGuard,
  }) => {
    await page.goto('/');
    expect(BROADENED_PAID_URLS.length).toBeGreaterThanOrEqual(9);

    for (const url of BROADENED_PAID_URLS) {
      const outcome = await page.evaluate(
        (target) =>
          fetch(target, { method: 'POST', body: '{}' }).then(
            () => 'sent',
            () => 'blocked',
          ),
        url,
      );
      expect(outcome, `browser POST ${url}`).toBe('blocked');
      await expect(page.request.post(url, { data: {} })).rejects.toThrow(OPT_IN_HINT);
      await expect(request.post(url, { data: {} })).rejects.toThrow(OPT_IN_HINT);
    }

    // Browser POST + page.request + request fixture per path, each recorded exactly once.
    const expected = BROADENED_PAID_URLS.flatMap((url) => Array(3).fill(`POST ${url}`));
    expect([...paidCallGuard.hits].sort()).toEqual([...expected].sort());

    // Cleared so the guard's own teardown check stays green; nothing here reached the network.
    paidCallGuard.hits.length = 0;
  });
});
