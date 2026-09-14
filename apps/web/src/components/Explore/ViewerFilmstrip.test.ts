import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ViewerFilmstrip from '@/components/Explore/ViewerFilmstrip.vue';
import type { ExploreFeedItem } from '@/types';

vi.mock('@/composables/useDashboardMotion', () => ({
  useDashboardMotion: () => ({
    interactiveTransition: '',
    pressable: {},
  }),
}));

const items = [
  { id: 'a', imageUrl: 'https://cdn.example.com/a.jpg', prompt: 'Cat' },
  { id: 'b', imageUrl: 'https://cdn.example.com/b.jpg', prompt: 'Dog' },
] as ExploreFeedItem[];

describe('ViewerFilmstrip', () => {
  it('emits select when a thumbnail is clicked', async () => {
    const wrapper = mount(ViewerFilmstrip, {
      props: { items, activeId: 'a' },
    });

    const thumbs = wrapper.findAll('button');
    expect(thumbs.length).toBeGreaterThan(0);
    await thumbs[thumbs.length > 1 ? 1 : 0].trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
  });
});
