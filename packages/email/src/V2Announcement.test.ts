// @vitest-environment node
import { readFileSync } from 'node:fs';

import { render } from '@react-email/render';
import { DAILY_CREDITS } from '@visual-ai/shared';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { IMAGE_WIDTH_PX, PREVIOUS_DAILY_CREDITS } from './constants.js';
import { V2Announcement } from './V2Announcement.js';

const data = {
  firstName: 'Alex',
  unsubscribeUrl: 'https://api.example.test/email/unsubscribe?token=abc',
  postalAddress: '12 Test Lane, Testville',
};

const CTA_URL =
  'https://visual-ai.app/create/image?utm_source=email&amp;utm_medium=announcement&amp;utm_campaign=v2-launch';

const MODAL_SLIDES_PATH = new URL(
  '../../../apps/web/src/components/Intro/slides.ts',
  import.meta.url,
);
const MODAL_TITLE_PATTERN = /slide\(\s*\d+,\s*'[^']+',\s*'([^']+)'/g;

const renderHtml = (overrides: Partial<typeof data> = {}) =>
  render(createElement(V2Announcement, { ...data, ...overrides }));

describe('V2Announcement', () => {
  it('greets the recipient by first name', async () => {
    expect(await renderHtml()).toMatch(/Hi\s*(<!--.*?-->)?\s*Alex/);
  });

  it.each([undefined, '', '   '])('falls back to "there" for firstName %j', async (firstName) => {
    expect(await renderHtml({ firstName })).toMatch(/Hi\s*(<!--.*?-->)?\s*there/);
  });

  it('shows the previous and current daily credits side by side', async () => {
    const html = await renderHtml();
    expect(DAILY_CREDITS.free).toBe(30);
    expect(html).toContain(`>${PREVIOUS_DAILY_CREDITS}</span>`);
    expect(html).toContain(`>${DAILY_CREDITS.free}</span>`);
    expect(html).toContain(
      `Daily free credits go up from ${PREVIOUS_DAILY_CREDITS} to ${DAILY_CREDITS.free}.`,
    );
    expect(html).toContain(`${DAILY_CREDITS.free} free credits every day`);
  });

  it('mentions the credit increase in the preheader', async () => {
    const html = await renderHtml();
    expect(html).toContain(`go from ${PREVIOUS_DAILY_CREDITS} to ${DAILY_CREDITS.free}.<div>`);
  });

  it("lists every feature from the in-app What's New modal", async () => {
    const html = await renderHtml();
    const titles = [...readFileSync(MODAL_SLIDES_PATH, 'utf8').matchAll(MODAL_TITLE_PATTERN)].map(
      (match) => match[1],
    );
    expect(titles).toHaveLength(10);
    for (const title of titles) expect(html).toContain(title);
  });

  it('uses the new dashboard screenshot as the hero', async () => {
    const html = await renderHtml();
    expect(html).toContain('/email/dashboard.jpg');
    expect(html).not.toContain('hero.png');
    expect(html.indexOf('dashboard.jpg')).toBeLessThan(html.indexOf('models.png'));
  });

  it('gives the voice dictation highlight its own screenshot', async () => {
    const html = await renderHtml();
    expect(html).toContain('/email/voice.jpg');
    expect(html).not.toContain('/email/voice.png');
  });

  it('repeats the primary CTA after the highlights', async () => {
    const html = await renderHtml();
    expect(html.split(`href="${CTA_URL}"`).length - 1).toBe(2);
    expect(html.lastIndexOf('Open the studio')).toBeGreaterThan(
      html.lastIndexOf('remove-background.jpg'),
    );
  });

  it('keeps the footer minimal without printing the site URL', async () => {
    const html = await renderHtml();
    const footer = html.slice(html.indexOf('You&#x27;re receiving this'));
    expect(footer).toContain(data.postalAddress);
    expect(footer).toContain('Unsubscribe');
    expect(footer).not.toContain('Visual AI,');
    expect(footer.indexOf('Unsubscribe')).toBeLessThan(footer.indexOf(data.postalAddress));
    expect(footer).not.toMatch(/localhost|visual-ai\.app/);
  });

  it('drops the removed benefits list and secondary links', async () => {
    const html = await renderHtml();
    for (const removed of ['✓', 'never expire', '/pricing', 'visual-ai.app/explore', '/contact']) {
      expect(html).not.toContain(removed);
    }
  });

  it('renders every image at the shared content width', async () => {
    const html = await renderHtml();
    const panelImgs = (html.match(/<img[^>]*>/g) ?? []).filter((img) => !img.includes('logo.png'));
    expect(panelImgs).toHaveLength(10);
    for (const img of panelImgs) expect(img).toContain(`width="${IMAGE_WIDTH_PX}"`);
  });

  it('links unsubscribe from props and prints the postal address', async () => {
    const html = await renderHtml();
    expect(html).toContain(`href="${data.unsubscribeUrl}"`);
    expect(html).toContain('Unsubscribe');
    expect(html).toContain(data.postalAddress);
  });

  it('uses absolute https images that all carry non-empty alt text', async () => {
    const html = await renderHtml();
    const imgs = html.match(/<img[^>]*>/g) ?? [];
    expect(imgs.length).toBe(11);
    for (const img of imgs) {
      expect(img).toMatch(/src="https:\/\/[^"]+"/);
      expect(img).toMatch(/alt="[^"]+"/);
    }
  });

  it('tags every site link with UTM params', async () => {
    const html = await renderHtml();
    expect(html).toContain(CTA_URL);
  });

  it('has an html lang attribute and title', async () => {
    const html = await renderHtml();
    expect(html).toContain('lang="en"');
    expect(html).toContain('<title>Visual AI V2 is here</title>');
  });

  it('exposes preview props that satisfy the data contract', () => {
    expect(V2Announcement.PreviewProps.unsubscribeUrl).toMatch(/^https:\/\//);
  });
});
