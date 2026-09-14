import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CommunityFeed from '@/components/Dashboard/Canvas/CommunityFeed.vue';
import { useAsideStore } from '@/stores/aside';
import { useExploreStore } from '@/stores/explore';
import { useUserStore } from '@/stores/user';
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

  it('navigates to Create when switchToCreateOnRemix is set', async () => {
    const wrapper = mount(CommunityFeed, {
      props: { switchToCreateOnRemix: true },
    });

    await wrapper.findAll('[data-testid="community-remix-button"]')[0].trigger('click');

    expect(push).toHaveBeenCalledWith({
      name: 'create',
      params: {},
      query: {},
    });
  });

  it('navigates to explore viewer when a card is opened', async () => {
    const wrapper = mount(CommunityFeed);
    const target = COMMUNITY_FEED[0];

    await wrapper.findAll('[data-testid="community-card"]')[0].trigger('click');

    expect(push).toHaveBeenCalledWith({ name: 'explore-image', params: { id: target.id } });
  });

  it('does not navigate on remix unless switchToCreateOnRemix is set', async () => {
    const wrapper = mount(CommunityFeed);
    await wrapper.findAll('[data-testid="community-remix-button"]')[0].trigger('click');
    expect(push).not.toHaveBeenCalled();
  });

  it('uses dense padding and hides subtitle when requested', () => {
    const wrapper = mount(CommunityFeed, {
      props: { dense: true, subtitle: '' },
    });

    expect(wrapper.get('[data-testid="community-feed"]').classes().join(' ')).toContain('tw-px-2');
    expect(wrapper.text()).not.toContain('Remix a community prompt');
  });

  it('shows alternating-height skeletons while the first page loads', () => {
    const exploreStore = useExploreStore();
    exploreStore.items = [];
    exploreStore.hasFetched = false;
    exploreStore.isLoading = true;

    const wrapper = mount(CommunityFeed, { props: { dense: true } });
    const tiles = wrapper
      .get('[data-testid="community-feed-loading"]')
      .findAll('div.tw-animate-pulse');

    expect(tiles).toHaveLength(8);
    expect(tiles[0].attributes('style')).toContain('200px');
    expect(tiles[1].attributes('style')).toContain('280px');
  });

  it('shows an error state and retries the feed', async () => {
    const exploreStore = useExploreStore();
    exploreStore.items = [];
    exploreStore.isLoading = false;
    exploreStore.error = 'Community is offline';
    const loadFeed = vi.spyOn(exploreStore, 'loadFeed').mockResolvedValue(undefined);

    const wrapper = mount(CommunityFeed);
    expect(wrapper.get('[data-testid="community-feed-error"]').text()).toContain(
      'Community is offline',
    );

    await wrapper.get('[data-testid="community-feed-error"] button').trigger('click');
    expect(loadFeed).toHaveBeenCalled();
  });

  it('shows the empty community state after a successful fetch', () => {
    const exploreStore = useExploreStore();
    exploreStore.items = [];
    exploreStore.hasFetched = true;
    exploreStore.isLoading = false;
    exploreStore.error = null;

    const wrapper = mount(CommunityFeed);
    expect(wrapper.get('[data-testid="community-feed-empty"]').text()).toContain(
      'No community creations yet',
    );
  });

  it('loads more when there is a next page', async () => {
    const exploreStore = useExploreStore();
    exploreStore.nextCursor = 'cursor-2';
    exploreStore.isLoadingMore = false;
    const loadMore = vi.spyOn(exploreStore, 'loadMore').mockResolvedValue(undefined);

    const wrapper = mount(CommunityFeed, { props: { showLoadMore: true } });
    expect(wrapper.get('[data-testid="community-feed-load-more"]').text()).toBe('Load more');

    await wrapper.get('[data-testid="community-feed-load-more"]').trigger('click');
    expect(loadMore).toHaveBeenCalled();
  });

  it('disables load more while a page is in flight', () => {
    const exploreStore = useExploreStore();
    exploreStore.nextCursor = 'cursor-2';
    exploreStore.isLoadingMore = true;

    const wrapper = mount(CommunityFeed, { props: { showLoadMore: true } });
    const button = wrapper.get('[data-testid="community-feed-load-more"]');
    expect(button.text()).toBe('Loading…');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('does not show load more when there is no next page', () => {
    const wrapper = mount(CommunityFeed, { props: { showLoadMore: true } });
    expect(wrapper.find('[data-testid="community-feed-load-more"]').exists()).toBe(false);
  });

  it('fetches the feed when a signed-in user arrives and nothing has loaded', async () => {
    const exploreStore = useExploreStore();
    exploreStore.items = [];
    exploreStore.hasFetched = false;
    exploreStore.isLoading = false;
    const loadFeed = vi.spyOn(exploreStore, 'loadFeed').mockResolvedValue(undefined);
    const userStore = useUserStore();

    mount(CommunityFeed);
    expect(loadFeed).not.toHaveBeenCalled();

    userStore.userId = 'user-42';
    await Promise.resolve();
    expect(loadFeed).toHaveBeenCalled();
  });

  it('skips fetching when the feed is already loading or fetched', async () => {
    const exploreStore = useExploreStore();
    exploreStore.hasFetched = true;
    exploreStore.isLoading = false;
    const loadFeed = vi.spyOn(exploreStore, 'loadFeed').mockResolvedValue(undefined);
    const userStore = useUserStore();
    userStore.userId = 'user-42';

    mount(CommunityFeed);
    expect(loadFeed).not.toHaveBeenCalled();

    exploreStore.hasFetched = false;
    exploreStore.isLoading = true;
    userStore.userId = 'user-43';
    await Promise.resolve();
    expect(loadFeed).not.toHaveBeenCalled();
  });
});
