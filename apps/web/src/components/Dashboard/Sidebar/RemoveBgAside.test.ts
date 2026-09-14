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
import RemoveBgAside from '@/components/Dashboard/Sidebar/RemoveBgAside.vue';
import { trySubmitFeature } from '@/composables/useFeatureSubmit';
import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';
import { FeatureType } from '@/types';

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
  const wrapper = mount(RemoveBgAside, {
    global: {
      plugins: [pinia],
      stubs: { ...chromeStubs, ImageUpload: imageUploadStub(image) },
    },
  });
  return { wrapper, pinia };
}

describe('RemoveBgAside', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isSignedIn.value = false;
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders remove-background settings and CTA', () => {
    const { wrapper } = mountAside();
    expect(wrapper.get('[data-testid="remove-bg-aside"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="remove-bg-cta"]').text()).toContain('Remove background');
  });

  it('opens signup when clicked while signed out', async () => {
    const { wrapper, pinia } = mountAside();
    await wrapper.getComponent(FeatureCta).vm.$emit('click');
    expect(useDialogStore(pinia).signupDialog).toBe(true);
  });

  it('opens low-credits dialog when signed in without enough credits', async () => {
    isSignedIn.value = true;
    const { wrapper, pinia } = mountAside();
    useUserStore(pinia).credits = 0;
    await wrapper.getComponent(FeatureCta).vm.$emit('click');
    expect(useDialogStore(pinia).showLowCreditsDialog).toBe(true);
  });

  it('does not submit without an uploaded image', async () => {
    isSignedIn.value = true;
    const { wrapper, pinia } = mountAside(null);
    useUserStore(pinia).credits = 20;
    const removeBg = vi
      .spyOn(useGenerateStore(pinia), 'removeBgImage')
      .mockImplementation(() => {});
    await wrapper.getComponent(FeatureCta).vm.$emit('click');
    expect(removeBg).not.toHaveBeenCalled();
  });

  it('submits a remove-background job', async () => {
    isSignedIn.value = true;
    const { wrapper, pinia } = mountAside();
    useUserStore(pinia).credits = 20;
    const generate = useGenerateStore(pinia);
    const removeBg = vi.spyOn(generate, 'removeBgImage').mockImplementation(() => {});
    vi.spyOn(useAppStore(pinia), 'removeBgOpen').mockImplementation(() => {});

    await wrapper.getComponent(FeatureCta).vm.$emit('click');

    expect(removeBg).toHaveBeenCalledWith(expect.objectContaining({ image: photo }));
    expect(generate.removeBgInProgress).toBe(true);
    expect(localStorage.getItem('remove_bgInProgress')).toBe('true');
    expect(trySubmitFeature(FeatureType.REMOVE_BG)).toBe(false);
  });

  it('restores an in-progress job from localStorage', () => {
    localStorage.setItem('remove_bgInProgress', 'true');
    localStorage.setItem('removeBgJobId', JSON.stringify('bg-job'));
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.spyOn(useAppStore(pinia), 'removeBgOpen').mockImplementation(() => {});
    mount(RemoveBgAside, {
      global: {
        plugins: [pinia],
        stubs: { ...chromeStubs, ImageUpload: imageUploadStub(photo) },
      },
    });
    expect(useGenerateStore(pinia).removeBgInProgress).toBe(true);
    expect(useAppStore(pinia).progressUrl).toContain('jobId=bg-job');
  });

  it('clears corrupt in-progress localStorage', () => {
    localStorage.setItem('remove_bgInProgress', '{bad');
    const { pinia } = mountAside();
    expect(localStorage.getItem('remove_bgInProgress')).toBeNull();
    expect(useGenerateStore(pinia).removeBgInProgress).toBe(false);
  });
});
