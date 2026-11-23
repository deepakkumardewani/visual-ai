import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Locator, type Page, type Route } from '@playwright/test';

import { test as mediaTest } from '../fixtures/media';
import { expect, test as qaTest } from '../fixtures/qa';
import { E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import { readCredits } from '../support/proPerksSeed';

const test = mergeTests(qaTest, mediaTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const SONG_PATH = '/audio/song';
const SAMPLE_MP3_ROUTE = '**/e2e-media/sample.mp3';
const STUB_ASSET_TITLE = 'E2E stub asset';
const STUB_ASSET_ID = 'e2e-e2e-media-stub-job';
const SONG_COST = 30;
const WIDTH_PHONE = 375;
const HEIGHT_PHONE = 812;
const MIN_TAP_PX = 44;
const SLOW_TIMEOUT_MS = 90_000;
const EXPORT_TOO_LONG = 'This audio is too long to export in the browser.';
const SAVED_COPY = 'Saved as a new version. No credits were used.';
const HINT_COPY = 'Drag on the waveform to select a part.';
const RIFF_HEADER_BYTES = 44;
const WAV_BYTES_PER_SAMPLE = 2;
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/editor/${name}.png`;

// Independent test audio: a 10.5 s tone (drag-selectable) and a 600 s silence (over the 200 MB PCM cap).
const TONE = { seconds: 10.5, sampleRate: 22_050, displayed: '0:10' };
const LONG = { seconds: 600, sampleRate: 8_000 };

function buildWav({
  seconds,
  sampleRate,
  tone,
}: {
  seconds: number;
  sampleRate: number;
  tone: boolean;
}): Buffer {
  const samples = Math.round(seconds * sampleRate);
  const dataBytes = samples * WAV_BYTES_PER_SAMPLE;
  const buffer = Buffer.alloc(RIFF_HEADER_BYTES + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * WAV_BYTES_PER_SAMPLE, 28);
  buffer.writeUInt16LE(WAV_BYTES_PER_SAMPLE, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  if (tone) {
    for (let i = 0; i < samples; i += 1) {
      const level = Math.sin((2 * Math.PI * 220 * i) / sampleRate) * 0.6;
      buffer.writeInt16LE(Math.round(level * 32767), RIFF_HEADER_BYTES + i * WAV_BYTES_PER_SAMPLE);
    }
  }
  return buffer;
}

/** Replaces the stub's 1 s fixture so the editor has enough audio to select and trim. */
async function serveAudio(page: Page, wav: Buffer) {
  await page.route(SAMPLE_MP3_ROUTE, async (route: Route) => {
    const headers = {
      'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
      'Accept-Ranges': 'bytes',
      'Content-Type': 'audio/wav',
    };
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range ?? '');
    if (!range) return route.fulfill({ status: 200, headers, body: wav });
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : wav.length - 1;
    return route.fulfill({
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${wav.length}` },
      body: wav.subarray(start, end + 1),
    });
  });
}

async function openSongStudio(page: Page) {
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok(), {
      timeout: 30_000,
    }),
    page.goto(SONG_PATH),
  ]);
  await clerk.loaded({ page });
  await expect(page.getByRole('heading', { name: 'Song studio' })).toBeVisible();
}

async function generateSong(page: Page) {
  await page.getByLabel('Style', { exact: true }).fill(`e2e editor synth ${RUN}`);
  await page.getByLabel('Lyrics', { exact: true }).fill(`[Verse]\nEditing the quiet ${RUN}`);
  await page.getByTestId('studio-generate').click();
  await expect(page.getByTestId('result-card')).toBeVisible();
  await expect(page.getByTestId('waveform-editor')).toBeVisible({ timeout: 30_000 });
}

function waveform(page: Page): Locator {
  return page.getByRole('group', { name: /^Waveform of / });
}

/** Drags a selection across `fromPct`..`toPct` of the waveform width. */
async function dragSelect(page: Page, fromPct: number, toPct: number) {
  // Centered so the fixed mini-player at the bottom edge never covers the drag path.
  await waveform(page).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = await waveform(page).boundingBox();
  if (!box) throw new Error('waveform has no box');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * fromPct, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * ((fromPct + toPct) / 2), y, { steps: 5 });
  await page.mouse.move(box.x + box.width * toPct, y, { steps: 5 });
  await page.mouse.up();
}

function tool(page: Page, id: string): Locator {
  return page.getByTestId(`editor-${id}`);
}

function lengthOf(page: Page): Locator {
  return page.getByTestId('editor-duration');
}

async function openExport(page: Page) {
  await page.getByTestId('song-export').click();
  await expect(page.getByTestId('export-dialog')).toBeVisible();
}

function spawnedWorkers(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __workers: string[] }).__workers.slice());
}

function wavSeconds(file: Buffer): number {
  const channels = file.readUInt16LE(22);
  const sampleRate = file.readUInt32LE(24);
  const dataBytes = file.readUInt32LE(40);
  return dataBytes / (sampleRate * channels * WAV_BYTES_PER_SAMPLE);
}

test.describe('waveform editor and export', () => {
  test.setTimeout(SLOW_TIMEOUT_MS);

  test.beforeEach(async ({ page, mediaGenerationStub }) => {
    mediaGenerationStub.setVariant('success', { credits: SONG_COST });
    await openSongStudio(page);
  });

  test('@critical trim then export WAV downloads a file', async ({
    page,
    mediaGenerationStub,
    snap,
  }) => {
    await serveAudio(page, buildWav({ ...TONE, tone: true }));
    const before = await readCredits(E2E_USER_ID);
    await generateSong(page);

    await expect(tool(page, 'trim')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByTestId('editor-hint')).toHaveText(HINT_COPY);
    await expect(lengthOf(page)).toHaveText(TONE.displayed);
    await page.screenshot({ path: shotPath('editor-empty-selection') });

    await dragSelect(page, 0.2, 0.6);
    await expect(tool(page, 'trim')).toHaveAttribute('aria-disabled', 'false');
    await expect(page.getByTestId('editor-hint')).toHaveCount(0);
    await tool(page, 'trim').click();
    await expect(lengthOf(page)).not.toHaveText(TONE.displayed);
    const shownSeconds = Number((await lengthOf(page).innerText()).replace('0:', ''));
    await page.screenshot({ path: shotPath('editor-trimmed') });

    await openExport(page);
    await page.getByTestId('export-format-wav').check();
    await page.getByTestId('export-start').click();
    const download = page.getByTestId('export-download');
    await expect(download).toBeVisible();
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);

    expect(file.suggestedFilename()).toBe('E2E-stub-asset-edit.wav');
    const bytes = fs.readFileSync(await file.path());
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
    expect(bytes.toString('ascii', 8, 12)).toBe('WAVE');
    // The file length matches the trimmed length shown in the editor and is well under the 10.5 s source.
    expect(Math.floor(wavSeconds(bytes))).toBe(shownSeconds);
    expect(wavSeconds(bytes)).toBeLessThan(TONE.seconds - 2);
    expect(wavSeconds(bytes)).toBeGreaterThan(1);
    await page.screenshot({ path: shotPath('export-wav-ready') });

    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('export-wav');
  });

  test('@critical save as new version appears in History grouped under the original and the balance is unchanged', async ({
    page,
    snap,
  }) => {
    await serveAudio(page, buildWav({ ...TONE, tone: true }));
    const before = await readCredits(E2E_USER_ID);
    const versionTitle = `${STUB_ASSET_TITLE} edit ${RUN}`;
    const otherTitle = `e2e other song ${RUN}`;
    const version = {
      id: `e2e-version-${RUN}`,
      type: 'audio',
      feature: 'song',
      modelKey: 'E2E_STUB',
      title: versionTitle,
      url: `${E2E_WEB_ORIGIN}/e2e-media/sample.mp3`,
      durationSec: 4,
      creditsCharged: 0,
      saved: true,
      parentId: STUB_ASSET_ID,
      createdAt: new Date().toISOString(),
    };
    const asset = (id: string, title: string, ageMin: number, extra = {}) => ({
      id,
      type: 'audio',
      feature: 'song',
      modelKey: 'E2E_STUB',
      title,
      url: `${E2E_WEB_ORIGIN}/e2e-media/sample.mp3`,
      durationSec: 10,
      creditsCharged: SONG_COST,
      saved: true,
      createdAt: new Date(Date.now() - ageMin * 60_000).toISOString(),
      ...extra,
    });
    const cors = (route: Route) => ({
      'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        route.request().headers()['access-control-request-headers'] ??
        'authorization, content-type',
    });
    const uploads: Array<{ contentType: string; body: string }> = [];

    await page.route(/\/media\/assets\/[^/?]+\/versions$/, async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS')
        return route.fulfill({ status: 204, headers: cors(route) });
      uploads.push({
        contentType: request.headers()['content-type'] ?? '',
        body: request.postDataBuffer()?.toString('latin1') ?? '',
      });
      return route.fulfill({ status: 201, headers: cors(route), json: version });
    });
    // List order is chosen so ungrouped (newest first) would be version, other, original.
    await page.route(/\/media\/assets(?:\?.*)?$/, async (route) => {
      const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors(route) });
      if (method !== 'GET') return route.fallback();
      return route.fulfill({
        status: 200,
        headers: cors(route),
        json: {
          items: [
            version,
            asset(`e2e-other-${RUN}`, otherTitle, 5),
            asset(STUB_ASSET_ID, STUB_ASSET_TITLE, 10),
          ],
          nextCursor: null,
        },
      });
    });

    await generateSong(page);
    await dragSelect(page, 0.1, 0.5);
    await tool(page, 'cut').click();
    await openExport(page);
    await page.getByTestId('export-format-wav').check();
    await page.getByTestId('export-start').click();
    await page.getByTestId('export-save').click();
    await expect(page.getByTestId('export-saved')).toHaveText(SAVED_COPY);
    await page.screenshot({ path: shotPath('version-saved') });

    expect(uploads).toHaveLength(1);
    expect(uploads[0].contentType).toContain('multipart/form-data');
    expect(uploads[0].body).toContain('filename="E2E-stub-asset-edit.wav"');
    expect(uploads[0].body).toContain('RIFF');

    await page.keyboard.press('Escape');
    await page.getByTestId('nav-tab-assets').click();
    await expect(page).toHaveURL(/\/assets$/);
    const playButtons = page.getByRole('button', { name: /^Play / });
    await expect(playButtons).toHaveCount(3);
    const order = await playButtons.evaluateAll((els) =>
      els.map((el) => el.getAttribute('aria-label')),
    );
    expect(order).toEqual([
      `Play ${otherTitle}`,
      `Play ${STUB_ASSET_TITLE}`,
      `Play ${versionTitle}`,
    ]);
    await page.screenshot({ path: shotPath('history-grouped') });

    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('history-grouped');
  });

  test('@high undo and redo keys', async ({ page }) => {
    await serveAudio(page, buildWav({ ...TONE, tone: true }));
    await generateSong(page);
    await dragSelect(page, 0.2, 0.6);
    await tool(page, 'trim').click();
    const trimmed = await lengthOf(page).innerText();
    expect(trimmed).not.toBe(TONE.displayed);
    await expect(tool(page, 'undo')).toHaveAttribute('aria-disabled', 'false');

    // Focus on a text field keeps the browser's own undo: the editor history must not move.
    await page.getByLabel('Style', { exact: true }).focus();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(lengthOf(page)).toHaveText(trimmed);

    await page.getByTestId('song-editor').click({ position: { x: 4, y: 4 } });
    await page.keyboard.press('ControlOrMeta+z');
    await expect(lengthOf(page)).toHaveText(TONE.displayed);
    await expect(tool(page, 'redo')).toHaveAttribute('aria-disabled', 'false');

    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(lengthOf(page)).toHaveText(trimmed);
    await expect(tool(page, 'redo')).toHaveAttribute('aria-disabled', 'true');

    await tool(page, 'reset').click();
    await expect(lengthOf(page)).toHaveText(TONE.displayed);
    await expect(tool(page, 'undo')).toHaveAttribute('aria-disabled', 'true');
  });

  test('@high editor and mini-player never play together', async ({
    page,
    mediaGenerationStub,
  }) => {
    // Records every media element that ever plays, so a second element would be visible.
    await page.addInitScript(() => {
      const played = new Set<HTMLMediaElement>();
      const original = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function play(this: HTMLMediaElement) {
        played.add(this);
        return original.call(this);
      };
      (window as unknown as { __played: Set<HTMLMediaElement> }).__played = played;
    });
    await openSongStudio(page);
    mediaGenerationStub.setVariant('success', { credits: SONG_COST });
    await serveAudio(page, buildWav({ ...TONE, tone: true }));
    await generateSong(page);

    const stats = () =>
      page.evaluate(() => {
        const played = (window as unknown as { __played: Set<HTMLMediaElement> }).__played;
        return {
          elements: played.size,
          playing: [...played].filter((el) => !el.paused).length,
        };
      });

    await page
      .getByTestId('result-card')
      .getByRole('button', { name: `Play ${STUB_ASSET_TITLE}` })
      .click();
    const miniPlayer = page.getByTestId('mini-player');
    await expect(miniPlayer).toBeVisible();
    await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'true');
    expect(await stats()).toEqual({ elements: 1, playing: 1 });

    // Pausing from the mini-player stops the one element the editor waveform is bound to.
    await miniPlayer.getByTestId('play-button').click();
    await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'false');
    expect(await stats()).toEqual({ elements: 1, playing: 0 });

    // Selecting in the editor and playing from the card again still uses that same element.
    await dragSelect(page, 0.2, 0.5);
    await page
      .getByTestId('result-card')
      .getByRole('button', { name: `Play ${STUB_ASSET_TITLE}` })
      .click();
    await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'true');
    expect(await stats()).toEqual({ elements: 1, playing: 1 });
    await page.screenshot({ path: shotPath('single-player') });
  });

  test.describe('over cap', () => {
    // The app logs the deliberate export failure through console.error.
    test.use({ expectedConsoleErrors: [/audio-export export failed/] });

    test('@high over-cap audio shows the exact error copy', async ({ page }) => {
      await page.addInitScript(() => {
        const spawned: string[] = [];
        const Original = window.Worker;
        window.Worker = class extends Original {
          constructor(url: string | URL, options?: WorkerOptions) {
            spawned.push(String(url));
            super(url, options);
          }
        };
        (window as unknown as { __workers: string[] }).__workers = spawned;
      });
      await openSongStudio(page);
      await serveAudio(page, buildWav({ ...LONG, tone: false }));
      await generateSong(page);
      await expect(lengthOf(page)).toHaveText('10:00');

      await openExport(page);
      const workersBefore = await spawnedWorkers(page);
      await page.getByTestId('export-start').click();
      await expect(page.getByTestId('export-error')).toHaveText(EXPORT_TOO_LONG);
      await expect(page.getByTestId('export-download')).toHaveCount(0);
      await expect(page.getByTestId('export-start')).toHaveText('Try again');
      // Failing fast: the export itself spawned no encoder worker.
      expect(await spawnedWorkers(page)).toEqual(workersBefore);
      await page.screenshot({ path: shotPath('export-over-cap') });
    });
  });

  test('@high keyboard-only region selection', async ({ page }) => {
    await serveAudio(page, buildWav({ ...TONE, tone: true }));
    await generateSong(page);
    const seek = page.getByRole('slider', { name: `Seek ${STUB_ASSET_TITLE}` });
    await expect(seek).toBeVisible();
    await expect(tool(page, 'trim')).toHaveAttribute('aria-disabled', 'true');

    // The slider is a text-like input, so `[` and `]` are read from the next focus stop.
    await seek.focus();
    for (let i = 0; i < 20; i += 1) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');
    await page.keyboard.press('[');
    await expect(tool(page, 'trim')).toHaveAttribute('aria-disabled', 'false');
    await expect(page.getByTestId('editor-hint')).toHaveCount(0);

    await seek.focus();
    for (let i = 0; i < 45; i += 1) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');
    await page.keyboard.press(']');

    // Roving focus: Tab lands on one toolbar stop and arrows move within it.
    const toolbar = page.getByRole('toolbar', { name: 'Audio edit tools' });
    await tool(page, 'trim').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tool(page, 'cut')).toBeFocused();
    await page.keyboard.press('End');
    await expect(tool(page, 'reset')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tool(page, 'trim')).toBeFocused();
    await expect(toolbar.getByRole('button')).toHaveCount(8);
    await expect(tool(page, 'trim')).toHaveCSS('outline-style', 'solid');

    await page.keyboard.press('Enter');
    await expect(lengthOf(page)).toHaveText('0:04');
    await expect(page.getByTestId('editor-hint')).toBeVisible();
    await page.screenshot({ path: shotPath('keyboard-selection') });
  });

  test('@medium 375px handles and toolbar', async ({ page }) => {
    await serveAudio(page, buildWav({ ...TONE, tone: true }));
    await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT_PHONE });
    await openSongStudio(page);
    await generateSong(page);
    await dragSelect(page, 0.3, 0.7);
    await expect(tool(page, 'trim')).toHaveAttribute('aria-disabled', 'false');

    const buttons = await page
      .getByRole('toolbar', { name: 'Audio edit tools' })
      .getByRole('button')
      .all();
    expect(buttons).toHaveLength(8);
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TAP_PX);
    }

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
    await page.screenshot({ path: shotPath('mobile-375') });

    // Last on purpose: the toolbar and overflow checks above must pass before this known bug trips.
    const handles = page.locator('[part~="region-handle"]');
    await expect(handles).toHaveCount(2);
    for (const handle of await handles.all()) {
      const box = await handle.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TAP_PX);
    }
  });
});
