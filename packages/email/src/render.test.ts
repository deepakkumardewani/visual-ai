import { DAILY_CREDITS } from '@visual-ai/shared';
import { describe, expect, it } from 'vitest';

import { renderV2Announcement } from './render.js';

const data = {
  firstName: 'Sam',
  unsubscribeUrl: 'https://api.example.test/email/unsubscribe?token=xyz',
  postalAddress: '1 Test Road',
};

const GMAIL_CLIP_BYTES = 102 * 1024;

describe('renderV2Announcement', () => {
  it('returns html under the Gmail clipping limit', async () => {
    const { html } = await renderV2Announcement(data);
    expect(html).toContain('<html');
    expect(new TextEncoder().encode(html).length).toBeLessThan(GMAIL_CLIP_BYTES);
  });

  it('returns a plain-text alternative with key content and no markup', async () => {
    const { text } = await renderV2Announcement(data);
    expect(text).not.toMatch(/<[a-z][^>]*>/i);
    expect(text.toLowerCase()).toContain('hi sam');
    expect(text).toContain(data.postalAddress);
    expect(text).toContain(String(DAILY_CREDITS));
    expect(text).toContain(data.unsubscribeUrl);
  });

  it('renders html and text from the same data', async () => {
    const { html, text } = await renderV2Announcement({ ...data, firstName: undefined });
    expect(html).toMatch(/Hi\s*(<!--.*?-->)?\s*there/);
    expect(text.toLowerCase()).toContain('hi there');
  });
});
