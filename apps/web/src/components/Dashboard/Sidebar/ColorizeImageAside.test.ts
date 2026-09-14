import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isSignedIn = ref(false);

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn, user: ref(null) }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import FeatureCta from '@/components/Dashboard/FeatureCta.vue';
import ColorizeImageAside from '@/components/Dashboard/Sidebar/ColorizeImageAside.vue';
import { trySubmitFeature } from '@/composables/useFeatureSubmit';
import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';
import { FeatureType } from '@/types';
import { MODEL_IDS } from '@/utils/constants';

const photo = new File(['x'], 'photo.png', { type: 'image/png' });

function imageUploadStub(image: File | null) {
  return {
    name: 'ImageUpload',
    template: '<div data-testid="image-upload-stub" />',
    data: () => ({ image }),
  };
}

const chromeStubs = {
  CreditCostBadge: { template: '<span />' },
  'font-awesome-icon': true,
};

function mountAside(image: File | null = photo) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(ColorizeImageAside, {
    global: {
      plugins: [pinia],
      stubs: { ...chromeStubs, ImageUpload: imageUploadStub(image) },
    },
  });
  return { wrapper, pinia };
}

describe('ColorizeImageAside', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isSignedIn.value = false;
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders Colorize settings and CTA', () => {
    const { wrapper } = mountAside();
    expect(wrapper.get('[data-testid="colorize-aside"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="colorize-cta"]').text()).toContain('Colorize');
  });

  it('asks unsigned users to sign up', async () => {
    const { wrapper, pinia } = mountAside();
    await wrapper.getComponent(FeatureCta).vm.$emit('click');
    expect(useDialogStore(pinia).signupDialog).toBe(true);
  });

  it('opens low-credits dialog when signed in without enough credits', async () => {
    isSignedIn.value = true;
    const { wrapper, pinia } = mountAside();
    useUserStore(pinia).credits = 1;
    await wrapper.getComponent(FeatureCta).vm.$emit('click');
    expect(useDialogStore(pinia).showLowCreditsDialog).toBe(true);
  });

  it('does not submit without an uploaded image', async () => {
    isSignedIn.value = true;
    const { wrapper, pinia } = mountAside(null);
    useUserStore(pinia).credits = 20;
    const colorize = vi
      .spyOn(useGenerateStore(pinia), 'colorizeImage')
      .mockImplementation(() => {});
    await wrapper.getComponent(FeatureCta).vm.$emit('click');
    expect(colorize).not.toHaveBeenCalled();
  });

  it('submits a colorize job with the advanced model', async () => {
    isSignedIn.value = true;
    const { wrapper, pinia } = mountAside();
    useUserStore(pinia).credits = 20;
    useUserStore(pinia).userId = 'user-22';
    const generate = useGenerateStore(pinia);
    const colorize = vi.spyOn(generate, 'colorizeImage').mockImplementation(() => {});
    vi.spyOn(useAppStore(pinia), 'colorizeOpen').mockImplementation(() => {});

    await wrapper.getComponent(FeatureCta).vm.$emit('click');

    expect(colorize).toHaveBeenCalledWith({
      image: photo,
      modelId: MODEL_IDS.COLORIZE_ADVANCED,
    });
    expect(generate.colorizeInProgress).toBe(true);
    expect(localStorage.getItem('colorizeInProgress')).toBe('true');
    expect(useAppStore(pinia).progressUrl).toContain('userId=user-22');
    expect(trySubmitFeature(FeatureType.COLORIZE)).toBe(false);
  });

  it('restores an in-progress colorize from localStorage', () => {
    localStorage.setItem('colorizeInProgress', 'true');
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.spyOn(useAppStore(pinia), 'colorizeOpen').mockImplementation(() => {});
    mount(ColorizeImageAside, {
      global: {
        plugins: [pinia],
        stubs: { ...chromeStubs, ImageUpload: imageUploadStub(photo) },
      },
    });
    expect(useGenerateStore(pinia).colorizeInProgress).toBe(true);
  });

  it('clears corrupt in-progress localStorage', () => {
    localStorage.setItem('colorizeInProgress', '{bad');
    const { pinia } = mountAside();
    expect(localStorage.getItem('colorizeInProgress')).toBeNull();
    expect(useGenerateStore(pinia).colorizeInProgress).toBe(false);
  });
});
