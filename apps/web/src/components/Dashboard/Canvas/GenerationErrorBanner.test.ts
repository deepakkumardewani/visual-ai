import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GenerationErrorBanner from '@/components/Dashboard/Canvas/GenerationErrorBanner.vue';
import { useGenerateStore } from '@/stores/generate';

const stubs = { 'font-awesome-icon': true };

describe('GenerationErrorBanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('hides when the feature has no error', () => {
    const wrapper = mount(GenerationErrorBanner, {
      props: { feature: 'image' },
      global: { plugins: [createPinia()], stubs },
    });

    expect(wrapper.find('[data-testid="generation-error"]').exists()).toBe(false);
  });

  it('shows the message and dismisses it', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const generateStore = useGenerateStore();
    generateStore.setFeatureError('image', 'Generation failed');

    const wrapper = mount(GenerationErrorBanner, {
      props: { feature: 'image' },
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.get('[data-testid="generation-error"]').text()).toContain('Generation failed');
    expect(wrapper.find('[data-testid="generation-error-retry"]').exists()).toBe(false);

    await wrapper.get('[aria-label="Dismiss error"]').trigger('click');
    expect(generateStore.errMsg.image).toBeUndefined();
  });

  it('shows Retry when a retry handler exists and calls retryFailed', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const generateStore = useGenerateStore();
    generateStore.setFeatureError('image', 'Timed out');
    generateStore.retryByFeature = {
      image: { action: 'generate', payload: {} },
    };
    const retryFailed = vi.spyOn(generateStore, 'retryFailed').mockResolvedValue(undefined);

    const wrapper = mount(GenerationErrorBanner, {
      props: { feature: 'image' },
      global: { plugins: [pinia], stubs },
    });

    await wrapper.get('[data-testid="generation-error-retry"]').trigger('click');
    expect(retryFailed).toHaveBeenCalledWith('image');
  });
});
