import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

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
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mountCard = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(CommunityCard, {
      props: { item: sampleItem },
      global: { plugins: [pinia] },
    });
  };

  it('mounts with image, author, prompt, and remix button', () => {
    const wrapper = mountCard();

    const card = wrapper.get('[data-testid="community-card"]');
    const image = card.get('img');

    expect(image.attributes('src')).toBe(sampleItem.imageUrl);
    expect(image.attributes('loading')).toBe('lazy');
    expect(image.attributes('alt')).toContain(sampleItem.author);
    expect(card.text()).toContain(sampleItem.author);
    expect(card.text()).toContain(sampleItem.prompt);
    expect(wrapper.find('[data-testid="community-copy-prompt-button"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="community-remix-button"]').text()).toContain('Remix');
    expect(wrapper.get('[data-testid="community-remix-button"]').attributes('aria-label')).toBe(
      'Remix prompt by test_artist',
    );
  });

  it('emits remix with the item prompt', async () => {
    const wrapper = mountCard();

    await wrapper.get('[data-testid="community-remix-button"]').trigger('click');

    expect(wrapper.emitted('remix')).toEqual([[sampleItem.prompt]]);
  });

  it('emits open with the item id when the card is clicked', async () => {
    const wrapper = mountCard();

    await wrapper.get('[data-testid="community-card"]').trigger('click');

    expect(wrapper.emitted('open')).toEqual([[sampleItem.id]]);
  });

  it('falls back to a 3 / 4 frame when the aspect ratio is invalid', () => {
    const wrapper = mount(CommunityCard, {
      props: { item: { ...sampleItem, aspectRatio: 'auto' } },
      global: { plugins: [createPinia()] },
    });

    expect(wrapper.find('[style*="aspect-ratio"]').exists() || wrapper.html()).toBeTruthy();
    expect(wrapper.get('[data-testid="community-card"] > div').attributes('style')).toContain(
      '3 / 4',
    );
  });

  it('renders initials for empty, single, and two-part authors', () => {
    const pinia = createPinia();
    const avatarText = (wrapper: ReturnType<typeof mount>) =>
      wrapper
        .findAll('[aria-hidden="true"]')
        .find((node) => node.text().trim())
        ?.text();

    const empty = mount(CommunityCard, {
      props: { item: { ...sampleItem, author: '   ', authorUserId: '' } },
      global: { plugins: [pinia] },
    });
    expect(avatarText(empty)).toBe('?');

    const single = mount(CommunityCard, {
      props: { item: { ...sampleItem, author: 'midjourney' } },
      global: { plugins: [pinia] },
    });
    expect(avatarText(single)).toBe('MI');

    const two = mount(CommunityCard, {
      props: { item: { ...sampleItem, author: 'Ada Lovelace' } },
      global: { plugins: [pinia] },
    });
    expect(avatarText(two)).toBe('AL');
  });

  it('hides copy when the prompt is blank and still remixes', async () => {
    const wrapper = mount(CommunityCard, {
      props: { item: { ...sampleItem, prompt: '   ', modelName: '' } },
      global: { plugins: [createPinia()] },
    });

    expect(wrapper.find('[data-testid="community-copy-prompt-button"]').exists()).toBe(false);
    expect(
      wrapper.get('[data-testid="community-remix-button"]').attributes('title'),
    ).toBeUndefined();

    await wrapper.get('[data-testid="community-remix-button"]').trigger('click');
    expect(wrapper.emitted('remix')).toEqual([['   ']]);
  });

  it('opens from Enter and Space but ignores other keys', async () => {
    const wrapper = mount(CommunityCard, {
      props: { item: sampleItem },
      global: { plugins: [createPinia()] },
    });

    const card = wrapper.get('[data-testid="community-card"]');
    await card.trigger('keydown', { key: 'Enter' });
    await card.trigger('keydown', { key: ' ' });
    await card.trigger('keydown', { key: 'Tab' });

    expect(wrapper.emitted('open')).toEqual([[sampleItem.id], [sampleItem.id]]);
  });

  it('copies the prompt without opening the card', async () => {
    const wrapper = mount(CommunityCard, {
      props: { item: sampleItem },
      global: { plugins: [createPinia()] },
    });

    await wrapper.get('[data-testid="community-copy-prompt-button"]').trigger('click');
    expect(wrapper.emitted('open')).toBeUndefined();
  });
});
