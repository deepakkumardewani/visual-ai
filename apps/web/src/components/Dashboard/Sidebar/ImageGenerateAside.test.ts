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

// Stub out StylePicker and PromptEnhancePicker
vi.mock('@/components/Dashboard/Sidebar/StylePicker.vue', () => ({
  default: { template: '<div data-testid="style-picker-stub" />' },
}));

vi.mock('@/components/Dashboard/Sidebar/PromptEnhancePicker.vue', () => ({
  default: { template: '<div data-testid="prompt-enhance-picker-stub" />' },
}));

import ImageGenerateAside from '@/components/Dashboard/Sidebar/ImageGenerateAside.vue';
import { useAsideStore } from '@/stores/aside';
import { MODELS } from '@/utils/models';

const findByModelKey = (id: string) => MODELS.find((m) => m.id === id)!;

describe('ImageGenerateAside section visibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mount_ = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
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

  it('renders Style and Enhance pickers for all models', async () => {
    const { wrapper, pinia } = mount_();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.mode = findByModelKey('FLUX_BASIC');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="style-picker-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="prompt-enhance-picker-stub"]').exists()).toBe(true);
  });

  it('updates quality, count, and format from the segmented controls', async () => {
    const { wrapper, pinia } = mount_();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.mode = findByModelKey('FLUX_BASIC');
    await wrapper.vm.$nextTick();

    const quality = wrapper.get('[aria-label="Output quality"]').findAll('button');
    await quality[0].trigger('click');
    expect(aside.outputQuality).toBe(0);
    await quality[1].trigger('click');
    expect(aside.outputQuality).toBe(1);

    const counts = wrapper.get('[aria-label="Number of images"]').findAll('button');
    await counts[2].trigger('click');
    expect(aside.noOfOutputs).toBe(3);

    const formats = wrapper.get('[aria-label="Output format"]').findAll('button');
    await formats[1].trigger('click');
    expect(aside.imageFormat.title).toBe(formats[1].text());
  });

  it('forces a single output for FLUX Pro variants and when count is unsupported', async () => {
    const { wrapper, pinia } = mount_();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.noOfOutputs = 4;
    aside.mode = findByModelKey('FLUX_BASIC');
    await wrapper.vm.$nextTick();

    aside.mode = findByModelKey('FLUX_PRO');
    await wrapper.vm.$nextTick();
    expect(aside.noOfOutputs).toBe(1);

    const flux11 = MODELS.find(
      (model) => String(model.id).includes('1_1') || String(model.id).includes('1.1'),
    );
    if (flux11) {
      aside.noOfOutputs = 3;
      aside.mode = flux11;
      await wrapper.vm.$nextTick();
      expect(aside.noOfOutputs).toBe(1);
    }
  });

  it('resets aspect ratio and format when the new model no longer supports them', async () => {
    const { wrapper, pinia } = mount_();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.mode = findByModelKey('FLUX_BASIC');
    await wrapper.vm.$nextTick();
    aside.aspectRatio = { ...aside.aspectRatio, title: 'not-a-ratio' };
    aside.imageFormat = { title: 'TIFF' };

    aside.mode = findByModelKey('FLUX_PRO');
    await wrapper.vm.$nextTick();
    expect(aside.aspectRatio.title).not.toBe('not-a-ratio');
    expect(aside.imageFormat.title).not.toBe('TIFF');
  });
});
