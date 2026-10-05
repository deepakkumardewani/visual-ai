import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import App from '@/App.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const clerkUser = ref<{ id: string } | null>(null);
const clerkLoaded = ref(false);

vi.mock('vue-clerk', () => ({
  useUser: () => ({
    user: clerkUser,
    isLoaded: clerkLoaded,
    isSignedIn: clerkLoaded,
  }),
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('token'),
  }),
}));

const shellStubs = {
  AppHeader: { template: '<header data-testid="app-header" />' },
  AppFooter: { template: '<footer data-testid="app-footer" />' },
  ReferralDialog: true,
  Toast: true,
  ConfirmChainActionDialog: {
    props: ['open', 'actionName', 'creditCost'],
    template: '<div data-testid="chain-dialog">{{ actionName }}</div>',
  },
};

async function renderAt(path: string, name?: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/pricing', name: 'pricing', component: { template: '<div />' } },
      { path: '/create', name: 'create', component: { template: '<div />' } },
      { path: '/explore/image', name: 'explore-image', component: { template: '<div />' } },
      { path: '/signin', name: 'signin', component: { template: '<div />' } },
      { path: '/account', name: 'account', component: { template: '<div />' } },
      { path: '/seo-landing', name: 'seo-portrait', component: { template: '<div />' } },
    ],
  });
  await router.push({ path, name });
  await router.isReady();

  const wrapper = mount(App, {
    global: {
      plugins: [pinia, router],
      stubs: shellStubs,
    },
  });

  return { wrapper, pinia };
}

describe('App', () => {
  beforeEach(() => {
    clerkUser.value = null;
    clerkLoaded.value = false;
    vi.clearAllMocks();
  });

  it('hides the app header and footer on the marketing home route', async () => {
    const { wrapper } = await renderAt('/');
    expect(wrapper.find('[data-testid="app-header"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="app-footer"]').exists()).toBe(false);
  });

  it('hides chrome on seo landers', async () => {
    const { wrapper } = await renderAt('/seo-landing', 'seo-portrait');
    expect(wrapper.find('[data-testid="app-header"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="app-footer"]').exists()).toBe(false);
  });

  it('shows the header and hides the footer on pricing', async () => {
    const { wrapper } = await renderAt('/pricing');
    expect(wrapper.find('[data-testid="app-header"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-footer"]').exists()).toBe(false);
  });

  it('shows header and footer on a generic account route', async () => {
    const { wrapper } = await renderAt('/account');
    expect(wrapper.find('[data-testid="app-header"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-footer"]').exists()).toBe(true);
    expect(wrapper.find('.tw-pt-14').exists()).toBe(true);
  });

  it('locks overflow on the create surface and hides the footer', async () => {
    const { wrapper } = await renderAt('/create', 'create');
    expect(wrapper.find('.tw-overflow-y-hidden').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-footer"]').exists()).toBe(false);
  });

  it('hides chrome and fills the viewport on the explore image viewer', async () => {
    const { wrapper } = await renderAt('/explore/image', 'explore-image');
    expect(wrapper.find('[data-testid="app-header"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="app-footer"]').exists()).toBe(false);
    expect(wrapper.find('.tw-overflow-hidden').exists()).toBe(true);
  });

  it('hides chrome on sign-in', async () => {
    const { wrapper } = await renderAt('/signin');
    expect(wrapper.find('[data-testid="app-header"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="app-footer"]').exists()).toBe(false);
  });

  it('syncs the user store once Clerk has a loaded user', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore = useUserStore();
    const sync = vi.spyOn(userStore, 'syncFromClerk').mockResolvedValue();

    clerkLoaded.value = true;
    clerkUser.value = { id: 'user_123' };

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/account', name: 'account', component: { template: '<div />' } }],
    });
    await router.push('/account');
    await router.isReady();

    mount(App, {
      global: { plugins: [pinia, router], stubs: shellStubs },
    });
    await flushPromises();

    expect(sync).toHaveBeenCalledWith('user_123');
  });

  it('does not sync before Clerk finishes loading', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore = useUserStore();
    const sync = vi.spyOn(userStore, 'syncFromClerk').mockResolvedValue();

    clerkLoaded.value = false;
    clerkUser.value = { id: 'user_123' };

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/account', name: 'account', component: { template: '<div />' } }],
    });
    await router.push('/account');
    await router.isReady();

    mount(App, {
      global: { plugins: [pinia, router], stubs: shellStubs },
    });
    await flushPromises();

    expect(sync).not.toHaveBeenCalled();
  });

  it('passes the chain action label into the confirm dialog', async () => {
    const { wrapper, pinia } = await renderAt('/account');
    const dialog = useDialogStore(pinia);
    dialog.chainAction = 'upscale';
    dialog.showChainActionDialog = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-testid="chain-dialog"]').text()).toContain('Upscale');
  });
});
