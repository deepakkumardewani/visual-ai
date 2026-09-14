import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import ExploreImage from '@/pages/ExploreImage.vue';
import { useExploreStore } from '@/stores/explore';
import { useUserStore } from '@/stores/user';

const replace = vi.fn();
const push = vi.fn();
const route = {
  params: { id: 'img-1' } as Record<string, string>,
  fullPath: '/explore/img-1',
};

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ replace, push }),
    useRoute: () => route,
  };
});

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

vi.mock('vue-clerk', () => ({
  useUser: () => ({
    isLoaded: { value: true },
    isSignedIn: { value: true },
    user: { value: null },
  }),
  useAuth: () => ({ getToken: vi.fn() }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn(),
  }),
}));

describe('ExploreImage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    replace.mockClear();
    push.mockClear();
    route.params = { id: 'img-1' };
    const exploreStore = useExploreStore();
    exploreStore.ensureItem = vi.fn().mockResolvedValue(undefined);
  });

  it('redirects signed-out users to signin', async () => {
    const userStore = useUserStore();
    userStore.userId = '';
    mount(ExploreImage, {
      global: {
        stubs: { ImageViewer: { template: '<div class="viewer-stub" />' } },
      },
    });
    await flushPromises();
    expect(replace).toHaveBeenCalled();
  });

  it('shows loading copy while the item is fetching', async () => {
    const userStore = useUserStore();
    userStore.userId = 'user-1';
    const exploreStore = useExploreStore();
    exploreStore.isLoadingItem = true;
    exploreStore.activeItem = null;

    const wrapper = mount(ExploreImage, {
      global: {
        stubs: { ImageViewer: { template: '<div class="viewer-stub" />' } },
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Loading creation');
  });

  it('shows an error state and navigates back to Explore', async () => {
    const userStore = useUserStore();
    userStore.userId = 'user-1';
    const exploreStore = useExploreStore();
    exploreStore.isLoading = false;
    exploreStore.isLoadingItem = false;
    exploreStore.activeItem = null;
    exploreStore.error = 'Could not load this image.';
    exploreStore.ensureItem = vi.fn().mockResolvedValue(undefined);

    const wrapper = mount(ExploreImage, {
      global: {
        stubs: { ImageViewer: { template: '<div class="viewer-stub" />' } },
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Could not load this image.');
    await wrapper.get('button').trigger('click');
    expect(push).toHaveBeenCalled();
  });
});
