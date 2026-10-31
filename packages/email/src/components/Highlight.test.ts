import { render } from '@react-email/render';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { Highlight, HIGHLIGHT_IMAGE_WIDTH } from './Highlight.js';

const props = {
  image: 'models.png',
  alt: 'Model picker',
  title: 'New models',
  description: 'Pick from more models.',
};

describe('Highlight', () => {
  it('renders an absolute https image with alt text and fixed width', async () => {
    const html = await render(createElement(Highlight, props));
    expect(html).toContain('src="https://visual-ai.app/email/models.png"');
    expect(html).toContain('alt="Model picker"');
    expect(html).toContain(`width="${HIGHLIGHT_IMAGE_WIDTH}"`);
  });

  it('renders title and description', async () => {
    const html = await render(createElement(Highlight, props));
    expect(html).toContain('New models');
    expect(html).toContain('Pick from more models.');
  });
});
