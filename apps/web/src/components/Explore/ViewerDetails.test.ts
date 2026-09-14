import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ViewerDetails from '@/components/Explore/ViewerDetails.vue';
import type { ExploreFeedItem } from '@/types';

vi.mock('@/composables/useDashboardMotion', () => ({
  useDashboardMotion: () => ({
    interactiveTransition: '',
    pressable: {},
  }),
}));

vi.mock('@/utils/generationCredits', () => ({
  getTransformCreditCost: () => 1,
}));

const item = {
  id: 'img-1',
  prompt: 'A lantern in the rain',
  imageUrl: 'https://cdn.example.com/lantern.jpg',
  featureType: 'image',
  author: 'Ada Lovelace',
  authorUserId: 'user-ada',
  createdAt: '2024-04-23T12:00:00.000Z',
  modelName: 'Flux',
  aspectRatio: '16:9',
} as ExploreFeedItem;

const stubs = { 'font-awesome-icon': true };

describe('ViewerDetails', () => {
  it('renders the prompt and emits remix', async () => {
    const wrapper = mount(ViewerDetails, {
      props: { item, detailsOpen: true },
      global: { stubs },
    });

    expect(wrapper.text()).toContain('A lantern in the rain');
    expect(wrapper.text()).toContain('Hide');
    expect(wrapper.text()).toContain('Flux');
    expect(wrapper.text()).toContain('16:9');
    expect(wrapper.text()).toContain('1 credit');
    await wrapper.get('[data-testid="explore-viewer-remix"]').trigger('click');
    expect(wrapper.emitted('remix')).toBeTruthy();
  });

  it('initials a single-word author and shows Show when details are closed', () => {
    const wrapper = mount(ViewerDetails, {
      props: {
        item: { ...item, author: 'Sora', authorUserId: '', modelName: '', aspectRatio: '' },
        detailsOpen: false,
      },
      global: { stubs },
    });
    expect(wrapper.text()).toContain('SO');
    expect(wrapper.text()).toContain('Show');
    expect(wrapper.text()).not.toContain('Flux');
  });

  it('falls back to a question mark and raw date for empty authors or invalid dates', () => {
    const wrapper = mount(ViewerDetails, {
      props: {
        item: { ...item, author: '   ', createdAt: 'not-a-date', prompt: '' },
        detailsOpen: true,
      },
      global: { stubs },
    });
    expect(wrapper.text()).toContain('?');
    expect(wrapper.text()).toContain('not-a-date');
    expect(wrapper.text()).toContain('No prompt available.');
  });

  it('promotes download after a result and disables actions while processing', () => {
    const wrapper = mount(ViewerDetails, {
      props: { item, hasResult: true, processing: true, detailsOpen: true },
      global: { stubs },
    });
    expect(wrapper.get('[data-testid="explore-viewer-download"]').text()).toContain(
      'Download result',
    );
    expect(wrapper.get('[data-testid="explore-viewer-remix"]').classes()).toContain(
      'viewer-details__cta--quiet',
    );
    expect(
      wrapper.get('[data-testid="explore-viewer-remix"]').attributes('disabled'),
    ).toBeDefined();
  });

  it('emits enhance and share actions', async () => {
    const wrapper = mount(ViewerDetails, {
      props: { item, hasResult: false, detailsOpen: false },
      global: { stubs },
    });
    expect(wrapper.get('[data-testid="explore-viewer-download"]').classes()).toContain(
      'viewer-details__cta--quiet',
    );
    await wrapper.get('[data-testid="explore-viewer-copy"]').trigger('click');
    await wrapper.get('[data-testid="explore-viewer-download"]').trigger('click');
    await wrapper.get('[data-testid="explore-viewer-reference"]').trigger('click');
    await wrapper.get('[data-testid="explore-viewer-upscale"]').trigger('click');
    await wrapper.get('[data-testid="explore-viewer-colorize"]').trigger('click');
    await wrapper.get('[data-testid="explore-viewer-remove-bg"]').trigger('click');
    await wrapper.get('[aria-expanded]').trigger('click');

    expect(wrapper.emitted('copyPrompt')).toBeTruthy();
    expect(wrapper.emitted('download')).toBeTruthy();
    expect(wrapper.emitted('useAsReference')).toBeTruthy();
    expect(wrapper.emitted('upscale')).toBeTruthy();
    expect(wrapper.emitted('colorize')).toBeTruthy();
    expect(wrapper.emitted('removeBg')).toBeTruthy();
    expect(wrapper.emitted('update:detailsOpen')?.[0]).toEqual([true]);
  });
});
