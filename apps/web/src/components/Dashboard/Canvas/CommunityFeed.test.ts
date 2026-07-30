import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CommunityFeed from '@/components/Dashboard/Canvas/CommunityFeed.vue';
import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useExploreStore } from '@/stores/explore';
import { FeatureType } from '@/types';
import { COMMUNITY_FEED } from '@/utils/communityMock';

const push = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: {}, name: 'dashboard', fullPath: '/dashboard' }),
}));

describe('CommunityFeed', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockClear();
    const exploreStore = useExploreStore();
    exploreStore.items = [...COMMUNITY_FEED];
    exploreStore.hasFetched = true;
    exploreStore.isLoading = false;
    exploreStore.error = null;
    exploreStore.nextCursor = null;
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

  it('switches to Create tab when switchToCreateOnRemix is set', async () => {
    const wrapper = mount(CommunityFeed, {
      props: { switchToCreateOnRemix: true },
    });
    const appStore = useAppStore();
    appStore.tab = 2;
    appStore.feature = FeatureType.UPSCALE;

    await wrapper.findAll('[data-testid="community-remix-button"]')[0].trigger('click');

    expect(appStore.tab).toBe(1);
    expect(appStore.feature).toBe(FeatureType.IMAGE);
  });

  it('navigates to explore viewer when a card is opened', async () => {
    const wrapper = mount(CommunityFeed);
    const target = COMMUNITY_FEED[0];

    await wrapper.findAll('[data-testid="community-card"]')[0].trigger('click');

    expect(push).toHaveBeenCalledWith({ name: 'explore-image', params: { id: target.id } });
  });
});
