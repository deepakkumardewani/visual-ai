/**
 * Smoke tests for ImageGenerateAside.vue
 *
 * Verifies that section visibility (Size/Quality/Images/Format) is computed
 * correctly from the MODEL_REGISTRY for at least 3 representative models:
 *   - FLUX_PRO: hides Quality (outputQuality) and Images (numOutputs)
 *   - FLUX_BASIC: shows all four sections
 *   - FLUX_QUICK: hides Size (aspectRatio), shows Quality/Images/Format
 */

import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

// Stub out ModelPicker to avoid Popover/teleport complexity in tests
vi.mock('@/components/Dashboard/ModelPicker/ModelPicker.vue', () => ({
  default: { template: '<div data-testid="model-picker-stub" />' },
}));

import ImageGenerateAside from '@/components/Dashboard/Sidebar/ImageGenerateAside.vue';
import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';
import { MODELS } from '@/utils/models';

const findByModelKey = (id: string) => MODELS.find((m) => m.id === id)!;

describe('ImageGenerateAside section visibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // isPro = true so pro-gating doesn't interfere with visibility checks
    useUserStore().isPro = true;
  });

  const mount_ = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().isPro = true;
    return { wrapper: mount(ImageGenerateAside, { global: { plugins: [pinia] } }), pinia };
  };

  it('FLUX_BASIC — shows Size, Quality, Images, and Format sections', async () => {
    const { wrapper, pinia } = mount_();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.mode = findByModelKey('FLUX_BASIC');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[aria-label="Aspect ratio"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Output quality"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Number of images"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Output format"]').exists()).toBe(true);
  });

  it('FLUX_PRO — hides Quality and Images sections (not in registry)', async () => {
    const { wrapper, pinia } = mount_();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.mode = findByModelKey('FLUX_PRO');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[aria-label="Aspect ratio"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Output quality"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Number of images"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Output format"]').exists()).toBe(true);
  });

  it('FLUX_QUICK — hides Size (aspectRatio) but shows Quality, Images, and Format', async () => {
    const { wrapper, pinia } = mount_();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.mode = findByModelKey('FLUX_QUICK');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[aria-label="Aspect ratio"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Output quality"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Number of images"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Output format"]').exists()).toBe(true);
  });
});
