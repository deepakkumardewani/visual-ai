import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isSignedInRef = ref(true);
const showSignupMock = vi.fn();
const showLowCreditsMock = vi.fn();
const generateImageMock = vi.fn();
const imageOpenMock = vi.fn();

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn: isSignedInRef }),
}));

vi.mock('@/stores/dialog', () => ({
  useDialogStore: () => ({
    showSignup: showSignupMock,
    showLowCredits: showLowCreditsMock,
  }),
}));

vi.mock('@/stores/generate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/generate')>();
  return {
    ...actual,
    useGenerateStore: () => ({
      isLoading: ref(false),
      generateImage: generateImageMock,
    }),
  };
});

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    progressUrl: ref(''),
    imageOpen: imageOpenMock,
  }),
}));

import GenerateArrow from '@/components/Dashboard/Composer/GenerateArrow.vue';
import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';

describe('GenerateArrow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isSignedInRef.value = true;
    showSignupMock.mockClear();
    showLowCreditsMock.mockClear();
    generateImageMock.mockClear();
    imageOpenMock.mockClear();
  });

  it('uses accent styling when not premium', () => {
    const wrapper = mount(GenerateArrow);
    const button = wrapper.get('[data-testid="generate-arrow"]');

    expect(button.classes().join(' ')).toContain('tw-bg-accent');
    expect(button.attributes('data-premium-cue')).toBeUndefined();
    expect(wrapper.html()).not.toMatch(/<v-/i);
  });

  it('is disabled when prompt is empty', () => {
    const wrapper = mount(GenerateArrow);
    expect(wrapper.get('[data-testid="generate-arrow"]').attributes('disabled')).toBeDefined();
  });

  it('shows signup dialog when signed out', async () => {
    isSignedInRef.value = false;
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useAsideStore();
    store.typingPrompt = 'A prompt';

    const wrapper = mount(GenerateArrow, { global: { plugins: [pinia] } });
    await wrapper.get('[data-testid="generate-arrow"]').trigger('click');

    expect(showSignupMock).toHaveBeenCalled();
    expect(generateImageMock).not.toHaveBeenCalled();
  });

  it('shows low credits dialog when credits are zero', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const asideStore = useAsideStore();
    const userStore = useUserStore();
    asideStore.typingPrompt = 'A prompt';
    userStore.credits = 0;

    const wrapper = mount(GenerateArrow, { global: { plugins: [pinia] } });
    await wrapper.get('[data-testid="generate-arrow"]').trigger('click');

    expect(showLowCreditsMock).toHaveBeenCalled();
    expect(generateImageMock).not.toHaveBeenCalled();
  });

  it('calls generateImage and opens progress when signed in with credits', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const asideStore = useAsideStore();
    const userStore = useUserStore();
    asideStore.typingPrompt = 'Sunset over mountains';
    userStore.credits = 10;

    const wrapper = mount(GenerateArrow, { global: { plugins: [pinia] } });
    await wrapper.get('[data-testid="generate-arrow"]').trigger('click');

    expect(generateImageMock).toHaveBeenCalledTimes(1);
    expect(imageOpenMock).toHaveBeenCalled();
  });
});
