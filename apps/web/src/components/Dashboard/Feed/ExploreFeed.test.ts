import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ExploreFeed from '@/components/Dashboard/Feed/ExploreFeed.vue';

describe('ExploreFeed', () => {
  it('renders CommunityFeed with explore props', () => {
    const wrapper = mount(ExploreFeed, {
      global: {
        stubs: {
          CommunityFeed: {
            props: ['dense', 'switchToCreateOnRemix', 'showLoadMore', 'title', 'subtitle'],
            template:
              '<div data-testid="community-feed-stub">{{ title }} {{ dense }} {{ switchToCreateOnRemix }} {{ showLoadMore }}</div>',
          },
        },
      },
    });

    expect(wrapper.get('[data-testid="explore-feed"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="community-feed-stub"]').text()).toContain(
      'Community Creations',
    );
  });
});
