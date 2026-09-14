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

import GenerateCTA from '@/components/Dashboard/Composer/GenerateCTA.vue';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

const stubs = {
  'font-awesome-icon': true,
  CreditCostBadge: { template: '<span />' },
};

describe('GenerateCTA', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isSignedIn.value = false;
    vi.clearAllMocks();
  });

  it('renders a disabled Generate button when the prompt is empty', () => {
    const pinia = createPinia();
    const wrapper = mount(GenerateCTA, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.get('[data-testid="generate-cta-wrap"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="generate-cta"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-testid="generate-cta"]').text()).toContain('Generate');
  });

  it('opens signup when clicked while signed out with a prompt', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.typingPrompt = 'A ceramic vessel on stone';

    const wrapper = mount(GenerateCTA, {
      global: { plugins: [pinia], stubs },
    });

    await wrapper.get('[data-testid="generate-cta"]').trigger('click');
    expect(useDialogStore(pinia).signupDialog).toBe(true);
    expect(useGenerateStore().isLoading).toBe(false);
  });

  it('opens low-credits dialog when the user cannot afford the run', async () => {
    isSignedIn.value = true;
    const pinia = createPinia();
    setActivePinia(pinia);
    useAsideStore().typingPrompt = 'Coast at dusk';
    useUserStore().credits = 0;

    const wrapper = mount(GenerateCTA, {
      global: { plugins: [pinia], stubs },
    });

    await wrapper.get('[data-testid="generate-cta"]').trigger('click');
    expect(useDialogStore(pinia).showLowCreditsDialog).toBe(true);
  });

  it('does nothing while a generation is already loading', async () => {
    isSignedIn.value = true;
    const pinia = createPinia();
    setActivePinia(pinia);
    useAsideStore().typingPrompt = 'Coast at dusk';
    useUserStore().credits = 20;
    useGenerateStore().isLoading = true;
    const generate = vi.spyOn(useGenerateStore(), 'generateImage').mockImplementation(() => {});

    const wrapper = mount(GenerateCTA, { global: { plugins: [pinia], stubs } });
    await wrapper.get('[data-testid="generate-cta"]').trigger('click');
    expect(generate).not.toHaveBeenCalled();
  });

  it('starts a generation when signed in with enough credits', async () => {
    isSignedIn.value = true;
    const pinia = createPinia();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.typingPrompt = 'Coast at dusk';
    aside.outputQuality = 1;
    useUserStore().credits = 40;
    const generate = vi.spyOn(useGenerateStore(), 'generateImage').mockImplementation(() => {});

    const wrapper = mount(GenerateCTA, { global: { plugins: [pinia], stubs } });
    expect(wrapper.get('[data-testid="generate-cta"]').attributes('aria-label')).toBe(
      'Generate image',
    );
    await wrapper.get('[data-testid="generate-cta"]').trigger('click');
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Coast at dusk',
        outputQuality: 100,
      }),
    );
  });

  it('maps SD quality to 70 when the model supports output quality', async () => {
    isSignedIn.value = true;
    const pinia = createPinia();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.typingPrompt = 'Coast at dusk';
    aside.outputQuality = 0;
    useUserStore().credits = 40;
    const generate = vi.spyOn(useGenerateStore(), 'generateImage').mockImplementation(() => {});

    const wrapper = mount(GenerateCTA, { global: { plugins: [pinia], stubs } });
    await wrapper.get('[data-testid="generate-cta"]').trigger('click');
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ outputQuality: 70 }));
  });

  it('omits outputQuality when the selected model does not support it', async () => {
    isSignedIn.value = true;
    const pinia = createPinia();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.typingPrompt = 'Coast at dusk';
    const { MODELS } = await import('@/utils/models');
    const fluxPro = MODELS.find((model) => model.id === 'FLUX_PRO');
    if (fluxPro) aside.mode = fluxPro;
    useUserStore().credits = 40;
    const generate = vi.spyOn(useGenerateStore(), 'generateImage').mockImplementation(() => {});

    const wrapper = mount(GenerateCTA, { global: { plugins: [pinia], stubs } });
    await wrapper.get('[data-testid="generate-cta"]').trigger('click');
    const input = generate.mock.calls.at(-1)?.[0] as { outputQuality?: number };
    expect(input.outputQuality).toBeUndefined();
  });

  it('marks the control as low credits for a signed-in user who cannot afford the run', () => {
    isSignedIn.value = true;
    const pinia = createPinia();
    setActivePinia(pinia);
    useAsideStore().typingPrompt = 'Coast at dusk';
    useUserStore().credits = 0;

    const wrapper = mount(GenerateCTA, { global: { plugins: [pinia], stubs } });
    expect(wrapper.get('[data-testid="generate-cta"]').attributes('aria-label')).toBe(
      'Not enough credits to generate',
    );
  });
});
