import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isLoadingRef = ref(false);
const imagesRef = ref<{ aiImageUrl?: string }[]>([]);
const historyRef = ref<{ featureType: string }[]>([]);
const isReadyRef = ref(true);

vi.mock('@/components/Dashboard/Canvas/StarterPromptsGrid.vue', () => ({
  default: {
    name: 'StarterPromptsGrid',
    template: '<div data-testid="starter-prompts-stub">Starters</div>',
  },
}));

vi.mock('@/components/Dashboard/Feed/UserGenerationsGrid.vue', () => ({
  default: {
    name: 'UserGenerationsGrid',
    template: '<div data-testid="user-generations-stub">History</div>',
  },
}));

vi.mock('@/stores/generate', () => ({
  useGenerateStore: () => ({
    isLoading: isLoadingRef,
    images: imagesRef,
  }),
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    history: historyRef,
    isReady: isReadyRef,
  }),
}));

import ResultCanvas from '@/components/Dashboard/Canvas/ResultCanvas.vue';

describe('ResultCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isLoadingRef.value = false;
    imagesRef.value = [];
    historyRef.value = [];
    isReadyRef.value = true;
  });

  it('shows starter prompts when idle with no saved generations', () => {
    const wrapper = mount(ResultCanvas);

    expect(wrapper.find('[data-testid="result-canvas"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="starter-prompts-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="user-generations-stub"]').exists()).toBe(false);
  });

  it('shows user generations when history has image items', () => {
    historyRef.value = [{ featureType: 'image' }];

    const wrapper = mount(ResultCanvas);

    expect(wrapper.find('[data-testid="user-generations-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="starter-prompts-stub"]').exists()).toBe(false);
  });

  it('keeps the generations feed mounted while loading so results stream in place', () => {
    isLoadingRef.value = true;

    const wrapper = mount(ResultCanvas);

    expect(wrapper.find('[data-testid="user-generations-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="starter-prompts-stub"]').exists()).toBe(false);
  });

  it('shows a loading skeleton until user history is ready', () => {
    isReadyRef.value = false;

    const wrapper = mount(ResultCanvas);

    expect(wrapper.find('[data-testid="result-canvas-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="starter-prompts-stub"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="user-generations-stub"]').exists()).toBe(false);
  });
});
