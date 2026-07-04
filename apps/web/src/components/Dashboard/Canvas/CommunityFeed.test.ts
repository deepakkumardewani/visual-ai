import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import CommunityFeed from '@/components/Dashboard/Canvas/CommunityFeed.vue';
import { useAsideStore } from '@/stores/aside';
import { COMMUNITY_FEED } from '@/utils/communityMock';

describe('CommunityFeed', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('mounts a labeled masonry feed with cards', () => {
    const wrapper = mount(CommunityFeed);

    expect(wrapper.get('[data-testid="community-feed"]').attributes('aria-label')).toBe(
      'Community generations',
    );
    expect(wrapper.findAll('[data-testid="community-card"]')).toHaveLength(COMMUNITY_FEED.length);
  });

  it('loads remix prompt into aside store', async () => {
    const wrapper = mount(CommunityFeed);
    const asideStore = useAsideStore();
    const target = COMMUNITY_FEED[0];

    await wrapper.findAll('[data-testid="community-remix-button"]')[0].trigger('click');

    expect(asideStore.typingPrompt).toBe(target.prompt);
  });
});
