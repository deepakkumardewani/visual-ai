import { render } from '@react-email/render';
import { DAILY_CREDITS } from '@visual-ai/shared';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { V2Announcement } from './V2Announcement.js';

const data = {
  firstName: 'Alex',
  unsubscribeUrl: 'https://api.example.test/email/unsubscribe?token=abc',
  postalAddress: '12 Test Lane, Testville',
};

const renderHtml = (overrides: Partial<typeof data> = {}) =>
  render(createElement(V2Announcement, { ...data, ...overrides }));

describe('V2Announcement', () => {
  it('greets the recipient by first name', async () => {
    expect(await renderHtml()).toMatch(/Hi\s*(<!--.*?-->)?\s*Alex/);
  });

  it.each([undefined, '', '   '])('falls back to "there" for firstName %j', async (firstName) => {
    expect(await renderHtml({ firstName })).toMatch(/Hi\s*(<!--.*?-->)?\s*there/);
  });

  it('interpolates DAILY_CREDITS in preheader and benefits', async () => {
    const html = await renderHtml();
    const occurrences = html.split(`${DAILY_CREDITS} free credits`).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
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
    expect(imgs.length).toBe(6);
    for (const img of imgs) {
      expect(img).toMatch(/src="https:\/\/[^"]+"/);
      expect(img).toMatch(/alt="[^"]+"/);
    }
  });

  it('tags every site link with UTM params', async () => {
    const html = await renderHtml();
    for (const path of ['/create/image', '/pricing', '/explore', '/contact']) {
      expect(html).toContain(
        `https://visual-ai.app${path}?utm_source=email&amp;utm_medium=announcement&amp;utm_campaign=v2-launch`,
      );
    }
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
