import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CommunityCard from '@/components/Dashboard/Canvas/CommunityCard.vue';
import type { ExploreFeedItem } from '@/types';

const sampleItem: ExploreFeedItem = {
  id: 'test-001',
  imageUrl: 'https://example.com/image.jpg',
  author: 'test_artist',
  authorUserId: 'user-test',
  modelName: 'Flux Basic',
  prompt: 'A test prompt for remixing.',
  aspectRatio: '4:5',
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('CommunityCard', () => {
  it('mounts with image, author, prompt, and remix button', () => {
    const wrapper = mount(CommunityCard, {
      props: { item: sampleItem },
    });

    const card = wrapper.get('[data-testid="community-card"]');
    const image = card.get('img');

    expect(image.attributes('src')).toBe(sampleItem.imageUrl);
    expect(image.attributes('loading')).toBe('lazy');
    expect(image.attributes('alt')).toContain(sampleItem.author);
    expect(card.text()).toContain(sampleItem.author);
    expect(card.text()).toContain(sampleItem.prompt);
    expect(wrapper.get('[data-testid="community-remix-button"]').text()).toContain('Remix');
    expect(wrapper.get('[data-testid="community-remix-button"]').attributes('aria-label')).toBe(
      'Remix prompt by test_artist',
    );
  });

  it('emits remix with the item prompt', async () => {
    const wrapper = mount(CommunityCard, {
      props: { item: sampleItem },
    });

    await wrapper.get('[data-testid="community-remix-button"]').trigger('click');

    expect(wrapper.emitted('remix')).toEqual([[sampleItem.prompt]]);
  });

  it('emits open with the item id when the card is clicked', async () => {
    const wrapper = mount(CommunityCard, {
      props: { item: sampleItem },
    });

    await wrapper.get('[data-testid="community-card"]').trigger('click');

    expect(wrapper.emitted('open')).toEqual([[sampleItem.id]]);
  });
});
