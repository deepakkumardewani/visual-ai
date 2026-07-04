import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const pushMock = vi.fn();
const generateImageMock = vi.fn();
const showSignupMock = vi.fn();
const showLowCreditsMock = vi.fn();
const imageOpenMock = vi.fn();
const progressUrlRef = ref('');
const isSignedInRef = ref(true);
const isLoadingRef = ref(false);
const smAndUpRef = ref(true);

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn: isSignedInRef }),
}));

vi.mock('vuetify', () => ({
  useDisplay: () => ({ smAndUp: smAndUpRef }),
}));

vi.mock('uuid', () => ({
  v4: () => 'test-job-id',
}));

vi.mock('@/stores/generate', () => ({
  useGenerateStore: () => ({
    generateImage: generateImageMock,
    isLoading: isLoadingRef,
  }),
}));

vi.mock('@/stores/dialog', () => ({
  useDialogStore: () => ({
    showSignup: showSignupMock,
    showLowCredits: showLowCreditsMock,
  }),
}));

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    progressUrl: progressUrlRef,
    imageOpen: imageOpenMock,
  }),
}));

vi.mock('@/components/Dashboard/ControlRail/MobileSettingsMenu.vue', () => ({
  default: { template: '<div data-testid="mobile-settings-stub" />' },
}));

vi.mock('@/components/Dashboard/ControlRail/PromptBox.vue', () => ({
  default: { template: '<div data-testid="prompt-box-stub" />' },
}));

vi.mock('@/components/Dashboard/ControlRail/ModelPicker.vue', () => ({
  default: { template: '<div data-testid="model-picker-stub" />' },
}));

vi.mock('@/components/Dialogs/SignupDialog.vue', () => ({
  default: { template: '<div />' },
}));

import ControlRail from '@/components/Dashboard/ControlRail/ControlRail.vue';
import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';
import { ASPECT_RATIOS, FLUX_MODES, IMAGE_FORMATS } from '@/utils/constants';

describe('ControlRail', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    pushMock.mockClear();
    generateImageMock.mockClear();
    showSignupMock.mockClear();
    showLowCreditsMock.mockClear();
    imageOpenMock.mockClear();
    progressUrlRef.value = '';
    isSignedInRef.value = true;
    isLoadingRef.value = false;
    smAndUpRef.value = true;
  });

  const mountRail = () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const asideStore = useAsideStore();
    asideStore.typingPrompt = 'A sunset over mountains';
    asideStore.mode = FLUX_MODES[0];
    asideStore.aspectRatio = ASPECT_RATIOS[0];
    asideStore.imageFormat = IMAGE_FORMATS[0];
    asideStore.noOfOutputs = 1;
    asideStore.outputQuality = 0;

    const userStore = useUserStore();
    userStore.credits = 10;
    userStore.isPro = true;

    return mount(ControlRail, { global: { plugins: [pinia] } });
  };

  it('renders settings cluster on desktop and generate button', () => {
    const wrapper = mountRail();

    expect(wrapper.find('[data-testid="control-rail"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-cluster"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="generate-button"]').exists()).toBe(true);
  });

  it('disables generate button when prompt is empty or loading', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const asideStore = useAsideStore();
    asideStore.typingPrompt = '';

    const wrapper = mount(ControlRail, { global: { plugins: [pinia] } });
    expect(wrapper.get('[data-testid="generate-button"]').attributes('disabled')).toBeDefined();

    asideStore.typingPrompt = 'hello';
    isLoadingRef.value = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="generate-button"]').attributes('disabled')).toBeDefined();
  });

  it('shows signup dialog when unsigned user clicks generate', async () => {
    isSignedInRef.value = false;
    const wrapper = mountRail();

    await wrapper.get('[data-testid="generate-button"]').trigger('click');
    expect(showSignupMock).toHaveBeenCalled();
    expect(generateImageMock).not.toHaveBeenCalled();
  });

  it('shows low credits dialog when user has zero credits', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const asideStore = useAsideStore();
    asideStore.typingPrompt = 'test prompt';

    const userStore = useUserStore();
    userStore.credits = 0;

    const wrapper = mount(ControlRail, { global: { plugins: [pinia] } });
    await wrapper.get('[data-testid="generate-button"]').trigger('click');

    expect(showLowCreditsMock).toHaveBeenCalled();
    expect(generateImageMock).not.toHaveBeenCalled();
  });

  it('calls generateImage with ImageBody when signed in with credits', async () => {
    const wrapper = mountRail();

    await wrapper.get('[data-testid="generate-button"]').trigger('click');

    expect(generateImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'test-job-id',
        modelId: FLUX_MODES[0].id,
        prompt: 'A sunset over mountains',
        noOfOutputs: 1,
        outputQuality: 70,
        aspectRatio: ASPECT_RATIOS[0].title,
        outputFormat: IMAGE_FORMATS[0].title.toLowerCase(),
      }),
    );
    expect(imageOpenMock).toHaveBeenCalled();
    expect(progressUrlRef.value).toContain('jobId=test-job-id');
  });

  it('redirects non-pro users selecting HD quality to pricing', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.isPro = false;

    const asideStore = useAsideStore();
    asideStore.outputQuality = 0;

    const wrapper = mount(ControlRail, { global: { plugins: [pinia] } });
    asideStore.outputQuality = 1;
    await wrapper.vm.$nextTick();

    expect(asideStore.outputQuality).toBe(0);
    expect(pushMock).toHaveBeenCalledWith('/pricing');
  });

  it('applies premium gold cue on generate button when premium model selected', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const asideStore = useAsideStore();
    asideStore.typingPrompt = 'test';
    asideStore.mode = FLUX_MODES[0];

    const wrapper = mount(ControlRail, { global: { plugins: [pinia] } });
    let button = wrapper.get('[data-testid="generate-button"]');
    expect(button.attributes('data-premium-cue')).toBeUndefined();
    expect(button.classes().join(' ')).toContain('tw-bg-accent');

    asideStore.mode = FLUX_MODES[2];
    await wrapper.vm.$nextTick();

    button = wrapper.get('[data-testid="generate-button"]');
    expect(button.attributes('data-premium-cue')).toBe('true');
    expect(button.classes().join(' ')).toContain('tw-bg-gradient-gold');

    asideStore.mode = FLUX_MODES[0];
    await wrapper.vm.$nextTick();

    button = wrapper.get('[data-testid="generate-button"]');
    expect(button.attributes('data-premium-cue')).toBeUndefined();
    expect(button.classes().join(' ')).toContain('tw-bg-accent');
  });
});
