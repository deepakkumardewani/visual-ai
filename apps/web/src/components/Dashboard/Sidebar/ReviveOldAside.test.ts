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
import ReviveOldAside from '@/components/Dashboard/Sidebar/ReviveOldAside.vue';
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
  const wrapper = mount(ReviveOldAside, {
    global: {
      plugins: [pinia],
      stubs: { ...chromeStubs, ImageUpload: imageUploadStub(image) },
    },
  });
  return { wrapper, pinia };
}

describe('ReviveOldAside', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isSignedIn.value = false;
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders Revive settings and CTA', () => {
    const { wrapper } = mountAside();
    expect(wrapper.get('[data-testid="revive-aside"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="revive-cta"]').text()).toContain('Revive');
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
    const revive = vi.spyOn(useGenerateStore(pinia), 'reviveOldImage').mockImplementation(() => {});
    await wrapper.getComponent(FeatureCta).vm.$emit('click');
    expect(revive).not.toHaveBeenCalled();
  });

  it('submits a revive job', async () => {
    isSignedIn.value = true;
    const { wrapper, pinia } = mountAside();
    useUserStore(pinia).credits = 20;
    useUserStore(pinia).userId = 'user-9';
    const generate = useGenerateStore(pinia);
    const revive = vi.spyOn(generate, 'reviveOldImage').mockImplementation(() => {});
    vi.spyOn(useAppStore(pinia), 'reviveOpen').mockImplementation(() => {});

    await wrapper.getComponent(FeatureCta).vm.$emit('click');

    expect(revive).toHaveBeenCalledWith({ image: photo });
    expect(generate.reviveInProgress).toBe(true);
    expect(localStorage.getItem('reviveInProgress')).toBe('true');
    expect(useAppStore(pinia).progressUrl).toContain('userId=user-9');
    expect(trySubmitFeature(FeatureType.REVIVE)).toBe(false);
  });

  it('restores an in-progress revive from localStorage', () => {
    localStorage.setItem('reviveInProgress', 'true');
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.spyOn(useAppStore(pinia), 'reviveOpen').mockImplementation(() => {});
    mount(ReviveOldAside, {
      global: {
        plugins: [pinia],
        stubs: { ...chromeStubs, ImageUpload: imageUploadStub(photo) },
      },
    });
    expect(useGenerateStore(pinia).reviveInProgress).toBe(true);
  });

  it('clears corrupt in-progress localStorage', () => {
    localStorage.setItem('reviveInProgress', '{bad');
    const { pinia } = mountAside();
    expect(localStorage.getItem('reviveInProgress')).toBeNull();
    expect(useGenerateStore(pinia).reviveInProgress).toBe(false);
  });
});
