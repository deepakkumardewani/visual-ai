import { render } from '@react-email/render';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { IMAGE_WIDTH_PX } from '../constants.js';
import { Highlight } from './Highlight.js';

const props = {
  image: 'models.png',
  alt: 'Model picker',
  title: 'New models',
  description: 'Pick from more models.',
  eyebrow: '01',
};

describe('Highlight', () => {
  it('renders an absolute https image with alt text and fixed width', async () => {
    const html = await render(createElement(Highlight, props));
    expect(html).toContain('src="https://visual-ai.app/email/models.png"');
    expect(html).toContain('alt="Model picker"');
    expect(html).toContain(`width="${IMAGE_WIDTH_PX}"`);
  });

  it('renders eyebrow, title and description', async () => {
    const html = await render(createElement(Highlight, props));
    expect(html).toContain('01');
    expect(html).toContain('New models');
    expect(html).toContain('Pick from more models.');
  });
});
