import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { E2E_WEB_ORIGIN } from '../support/env';
import { gotoStudio } from '../support/studio';
import {
  finishGrokRecording,
  hideDocument,
  installVoiceBrowserMocks,
  installSttFetchMock,
  installVoiceRecordingMocks,
  setAnalyserMode,
  setGetUserMediaMode,
  setSttFetchMode,
} from '../support/voiceMocks';
import { VOICE_INPUT_DISCLOSURE_STORAGE_KEY } from '../../src/composables/voiceInputDisclosure';

// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/voice-input/${name}`;

const STT_CORS = {
  'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};

async function expectVoiceMessage(page: Page, text: string | RegExp) {
  await expect(page.getByTestId('voice-inline-error')).toHaveText(text);
  await expect(page.getByRole('status').filter({ hasText: text })).toBeVisible();
}

async function setPrompt(page: Page, value: string) {
  const input = page.getByTestId('composer-textarea-input');
  await input.fill(value);
  await expect(input).toHaveValue(value);
}

function visibleMic(page: Page) {
  return page.getByTestId('voice-mic-button').locator('visible=true').first();
}

async function acceptVoiceDisclosure(page: Page) {
  const accept = page.getByTestId('voice-disclosure-accept');
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await expect(accept).toBeHidden();
  }
}

async function startMic(page: Page) {
  const mic = visibleMic(page);
  await mic.dispatchEvent('click');
  await acceptVoiceDisclosure(page);
  await expect(page.getByTestId('voice-accept-button')).toBeVisible({ timeout: 15_000 });
}

type SttRouteHandler = (route: Parameters<Parameters<Page['route']>[1]>[0]) => Promise<void> | void;

async function routeStt(page: Page, handler: SttRouteHandler) {
  await page.route(/\/stt$/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: STT_CORS });
    }
    await handler(route);
  });
}

async function prepareVoicePage(page: Page, mode?: Parameters<typeof installVoiceBrowserMocks>[1]) {
  await installVoiceBrowserMocks(page, mode ?? { getUserMedia: 'grant' });
}

async function openStudioWithVoice(
  page: Page,
  mode?: Parameters<typeof installVoiceBrowserMocks>[1],
) {
  await prepareVoicePage(page, mode);
  await gotoStudio(page);
  await installVoiceRecordingMocks(page);
  await expect
    .poll(async () => page.evaluate(() => window.MediaRecorder?.name ?? 'missing'))
    .toBe('E2EMediaRecorder');
}

test.describe('voice input', () => {
  test(
    'Grok engine: mocked `getUserMedia`/`MediaRecorder` and intercepted `**/stt`; recorded text appends to existing prompt without replacing it.',
    { tag: ['@critical'] },
    async ({ page }) => {
      await openStudioWithVoice(page);
      await page.evaluate(
        (key) => localStorage.setItem(key, '1'),
        VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
      );
      await routeStt(page, async (route) => {
        if (route.request().method() !== 'POST') {
          return route.continue();
        }
        return route.fulfill({
          status: 200,
          headers: { ...STT_CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'dictated phrase' }),
        });
      });
      await setPrompt(page, 'existing prompt');

      await startMic(page);
      await finishGrokRecording(page);

      await expect(page.getByTestId('composer-textarea-input')).toHaveValue(
        'existing prompt dictated phrase',
      );
      await expect(page.getByTestId('voice-mic-button')).toHaveAttribute('aria-pressed', 'false');
    },
  );

  test(
    'First mic use shows AI processing disclosure once; acceptance persists in localStorage.',
    { tag: ['@critical'] },
    async ({ page }) => {
      await openStudioWithVoice(page);
      await visibleMic(page).dispatchEvent('click');

      await expect(page.getByTestId('voice-disclosure-accept')).toBeVisible();
      await expect(page.getByText(/sent to AI for processing/i)).toBeVisible();
      await expect(page.getByText(/Grok/i)).toHaveCount(0);

      await page.getByTestId('voice-disclosure-accept').click();
      await expect(page.getByTestId('voice-accept-button')).toBeVisible();

      await page.reload();
      await installVoiceRecordingMocks(page);
      await expect(page.getByTestId('composer-textarea-input')).toBeVisible();

      await visibleMic(page).dispatchEvent('click');
      await expect(page.getByTestId('voice-disclosure-accept')).toHaveCount(0);
      await expect(page.getByTestId('voice-accept-button')).toBeVisible();

      await expect
        .poll(async () =>
          page.evaluate((key) => localStorage.getItem(key), VOICE_INPUT_DISCLOSURE_STORAGE_KEY),
        )
        .toBe('1');
    },
  );

  test(
    'Error states: permission denied, `**/stt` 429 (minutes message), 5xx, empty text each show a visible message.',
    { tag: ['@high'] },
    async ({ page }) => {
      await installSttFetchMock(page);
      await openStudioWithVoice(page);
      await page.evaluate(
        (key) => localStorage.setItem(key, '1'),
        VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
      );

      await setGetUserMediaMode(page, 'deny');
      await visibleMic(page).dispatchEvent('click');
      await expectVoiceMessage(
        page,
        'Microphone access is blocked. Allow it in your browser settings.',
      );

      await setGetUserMediaMode(page, 'grant');

      await setSttFetchMode(page, '429');
      await startMic(page);
      await finishGrokRecording(page);
      await expectVoiceMessage(page, /Too many voice requests\. Try again in \d+ minutes\./);

      await setSttFetchMode(page, '503');
      await startMic(page);
      await finishGrokRecording(page);
      await expectVoiceMessage(page, 'Transcription failed, try again.');

      await setSttFetchMode(page, 'empty');
      await startMic(page);
      await finishGrokRecording(page);
      await expect(
        page.getByRole('status').filter({ hasText: "Couldn't make out any words. Try again." }),
      ).toBeVisible();
      await expect(page.getByTestId('voice-inline-error')).toHaveCount(0);
    },
  );

  test(
    'Esc cancels recording; recording stops on tab hidden.',
    { tag: ['@high'] },
    async ({ page }) => {
      let sttPosts = 0;
      await routeStt(page, async (route) => {
        if (route.request().method() !== 'POST') {
          return route.continue();
        }
        sttPosts += 1;
        return route.fulfill({
          status: 200,
          headers: { ...STT_CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'should not upload' }),
        });
      });

      await openStudioWithVoice(page);
      await page.evaluate(
        (key) => localStorage.setItem(key, '1'),
        VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
      );
      await setPrompt(page, 'hold');

      await startMic(page);
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('voice-mic-button')).toHaveAttribute('aria-pressed', 'false');
      expect(sttPosts).toBe(0);

      await startMic(page);
      await hideDocument(page);
      await expect(page.getByTestId('voice-mic-button')).toHaveAttribute('aria-pressed', 'false');
      expect(sttPosts).toBe(0);
    },
  );

  test(
    '60s auto-stop with countdown from 10s (fake clock); reduced-motion renders the level meter; layout at 375px.',
    { tag: ['@medium'] },
    async ({ page }) => {
      await routeStt(page, async (route) => {
        if (route.request().method() !== 'POST') {
          return route.continue();
        }
        return route.fulfill({
          status: 200,
          headers: { ...STT_CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'timed clip' }),
        });
      });

      await page.setViewportSize({ width: 375, height: 812 });
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await openStudioWithVoice(page);
      await page.evaluate(
        (key) => localStorage.setItem(key, '1'),
        VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
      );

      await expect(page.getByTestId('voice-mic-button')).toBeVisible();
      await expect(page.getByTestId('voice-engine-menu-trigger')).toHaveCount(0);

      await page.clock.install({ time: Date.now() });
      await startMic(page);
      await page.evaluate(() => {
        window.__e2eVoice?.mediaInstances
          .at(-1)
          ?.emitData(new Blob(['clip-bytes'], { type: 'audio/webm' }));
      });
      await expect(page.getByTestId('voice-waveform')).toBeVisible();
      await expect(page.getByTestId('voice-waveform').locator('span')).toHaveCount(1);

      await page.clock.fastForward(50_000);
      await expect(page.getByTestId('voice-countdown')).toContainText('10');

      await page.clock.fastForward(10_000);
      await expect(page.getByTestId('voice-mic-button')).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('composer-textarea-input')).toHaveValue('timed clip', {
        timeout: 15_000,
      });
    },
  );

  test(
    'Clicking the mic replaces it with a stop icon and shows the waveform pill; stop shows a spinner until the mocked `**/stt` resolves, then the mic icon returns and text is appended.',
    { tag: ['@critical'] },
    async ({ page }) => {
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await routeStt(page, async (route) => {
        if (route.request().method() !== 'POST') {
          return route.continue();
        }
        await gate;
        return route.fulfill({
          status: 200,
          headers: { ...STT_CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'polished words' }),
        });
      });
      await openStudioWithVoice(page);
      await page.evaluate(
        (key) => localStorage.setItem(key, '1'),
        VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
      );
      await setPrompt(page, 'start');

      await expect(page.getByTestId('voice-waveform-pill')).toHaveCount(0);
      await startMic(page);
      await expect(page.getByTestId('voice-waveform-pill')).toBeVisible();
      await expect(page.getByTestId('voice-mic-button')).toHaveCount(0);
      await expect(page.getByTestId('voice-cancel-button')).toBeVisible();
      await page.screenshot({ path: shotPath('stt-recording.png') });

      await page.getByTestId('voice-accept-button').click();
      await finishGrokRecording(page);
      await expect(page.getByTestId('voice-spinner')).toBeVisible();
      await expect(page.getByTestId('voice-mic-button')).toBeDisabled();
      await expect(page.getByTestId('composer-textarea-input')).toHaveValue('start');
      await page.screenshot({ path: shotPath('stt-transcribing.png') });

      release();
      await expect(page.getByTestId('voice-spinner')).toHaveCount(0);
      await expect(page.getByTestId('voice-mic-button')).toBeEnabled();
      await expect(page.getByTestId('composer-textarea-input')).toHaveValue('start polished words');
    },
  );

  test(
    'Silent mocked audio: no request to `**/stt` is made and the silence toast is visible; prompt unchanged.',
    { tag: ['@critical'] },
    async ({ page }) => {
      let sttPosts = 0;
      await routeStt(page, async (route) => {
        if (route.request().method() === 'POST') {
          sttPosts += 1;
        }
        return route.fulfill({
          status: 200,
          headers: { ...STT_CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'must not be requested' }),
        });
      });
      await openStudioWithVoice(page);
      await page.evaluate(
        (key) => localStorage.setItem(key, '1'),
        VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
      );
      await setAnalyserMode(page, 'silent');
      await setPrompt(page, 'unchanged');

      await startMic(page);
      await finishGrokRecording(page);

      const toast = page.getByRole('status').filter({
        hasText: "We didn't hear anything. Try again and speak a little closer to the mic.",
      });
      await expect(toast).toBeVisible();
      await page.screenshot({ path: shotPath('stt-silence-toast.png') });
      await expect(page.getByTestId('voice-mic-button')).toBeEnabled();
      await expect(page.getByTestId('composer-textarea-input')).toHaveValue('unchanged');
      expect(sttPosts).toBe(0);
    },
  );

  test(
    'Mocked `**/stt` returns empty text with audible input: the empty-transcript toast is visible; prompt unchanged.',
    { tag: ['@high'] },
    async ({ page }) => {
      let sttPosts = 0;
      await routeStt(page, async (route) => {
        if (route.request().method() === 'POST') {
          sttPosts += 1;
        }
        return route.fulfill({
          status: 200,
          headers: { ...STT_CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '' }),
        });
      });
      await openStudioWithVoice(page);
      await page.evaluate(
        (key) => localStorage.setItem(key, '1'),
        VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
      );
      await setPrompt(page, 'keep me');

      await startMic(page);
      await finishGrokRecording(page);

      await expect(
        page.getByRole('status').filter({ hasText: "Couldn't make out any words. Try again." }),
      ).toBeVisible();
      expect(sttPosts).toBe(1);
      await expect(page.getByTestId('composer-textarea-input')).toHaveValue('keep me');
    },
  );

  test(
    'Cancel (X) while recording makes no `**/stt` request.',
    { tag: ['@high'] },
    async ({ page }) => {
      let sttPosts = 0;
      await routeStt(page, async (route) => {
        if (route.request().method() === 'POST') {
          sttPosts += 1;
        }
        return route.fulfill({
          status: 200,
          headers: { ...STT_CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'must not be requested' }),
        });
      });
      await openStudioWithVoice(page);
      await page.evaluate(
        (key) => localStorage.setItem(key, '1'),
        VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
      );
      await setPrompt(page, 'steady');

      await startMic(page);
      await page.getByTestId('voice-cancel-button').click();

      await expect(page.getByTestId('voice-waveform-pill')).toHaveCount(0);
      await expect(page.getByTestId('voice-mic-button')).toBeEnabled();
      await expect(page.getByTestId('composer-textarea-input')).toHaveValue('steady');
      expect(sttPosts).toBe(0);
    },
  );
});
