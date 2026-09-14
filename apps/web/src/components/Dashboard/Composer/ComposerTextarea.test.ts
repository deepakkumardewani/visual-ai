import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const promptTextRef = ref('');

vi.mock('@/stores/generate', () => ({
  useGenerateStore: () => ({
    promptText: promptTextRef,
  }),
}));

vi.mock('@/components/Dashboard/ModelPicker/PromptAiMenu.vue', () => ({
  default: {
    props: ['currentPrompt', 'disabled'],
    emits: ['apply-prompt', 'loading'],
    template: `
      <div data-testid="prompt-ai-menu-stub">
        <button data-testid="stub-apply" @click="$emit('apply-prompt', 'Typed prompt')">Apply</button>
        <button data-testid="stub-loading-on" @click="$emit('loading', true)">Load on</button>
      </div>
    `,
  },
}));

import ComposerTextarea from '@/components/Dashboard/Composer/ComposerTextarea.vue';
import { useAsideStore } from '@/stores/aside';

describe('ComposerTextarea', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    promptTextRef.value = '';
  });

  const mountTextarea = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    return {
      wrapper: mount(ComposerTextarea, { global: { plugins: [pinia] } }),
      asideStore: useAsideStore(),
    };
  };

  it('renders auto-growing textarea without v-textarea', () => {
    const { wrapper } = mountTextarea();
    expect(wrapper.find('[data-testid="composer-textarea"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="composer-textarea-input"]').exists()).toBe(true);
    expect(wrapper.find('v-textarea').exists()).toBe(false);
  });

  it('syncs typingPrompt to generateStore.promptText', async () => {
    const { wrapper, asideStore } = mountTextarea();
    const textarea = wrapper.get('[data-testid="composer-textarea-input"]');

    await textarea.setValue('Mountain landscape at dawn');
    expect(asideStore.typingPrompt).toBe('Mountain landscape at dawn');
    expect(promptTextRef.value).toBe('Mountain landscape at dawn');
  });

  it('restores promptText on mount', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    promptTextRef.value = 'Saved prompt';

    const wrapper = mount(ComposerTextarea, { global: { plugins: [pinia] } });
    await wrapper.vm.$nextTick();

    expect(useAsideStore().typingPrompt).toBe('Saved prompt');
  });

  it('applies prompt instantly with no typewriter animation', async () => {
    const { wrapper, asideStore } = mountTextarea();

    await wrapper.get('[data-testid="stub-apply"]').trigger('click');

    expect(asideStore.typingPrompt).toBe('Typed prompt');
  });

  it('clears prompt via clear button', async () => {
    const { wrapper, asideStore } = mountTextarea();
    const textarea = wrapper.get('[data-testid="composer-textarea-input"]');

    await textarea.setValue('To clear');
    await wrapper.get('[data-testid="composer-textarea-clear"]').trigger('click');

    expect(asideStore.typingPrompt).toBe('');
  });

  it('prefers an aside prompt already restored on mount', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useAsideStore().typingPrompt = 'Aside first';
    promptTextRef.value = 'Generate leftover';

    mount(ComposerTextarea, { global: { plugins: [pinia] } });
    expect(promptTextRef.value).toBe('Aside first');
  });

  it('hides the AI menu, shows a char count, and uses embedded padding', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useAsideStore().typingPrompt = 'x'.repeat(301);

    const wrapper = mount(ComposerTextarea, {
      props: { embedded: true, hideAiMenu: true },
      global: { plugins: [pinia] },
    });

    expect(wrapper.find('[data-testid="prompt-ai-menu-stub"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="composer-textarea-char-count"]').text()).toBe('301');
    expect(wrapper.get('[data-testid="composer-textarea-input"]').classes().join(' ')).toContain(
      'tw-px-0',
    );
  });

  it('shows the AI loading bar and blocks clear while readonly', async () => {
    const { wrapper, asideStore } = mountTextarea();
    await wrapper.get('[data-testid="composer-textarea-input"]').setValue('Keep me');
    await wrapper.get('[data-testid="stub-loading-on"]').trigger('click');

    expect(wrapper.find('[data-testid="composer-textarea-ai-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="composer-textarea-clear"]').exists()).toBe(false);
    expect(
      wrapper.get('[data-testid="composer-textarea-input"]').attributes('readonly'),
    ).toBeDefined();
    expect(asideStore.typingPrompt).toBe('Keep me');
  });

  it('treats the aiLoading prop as readonly', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useAsideStore().typingPrompt = 'Busy';

    const wrapper = mount(ComposerTextarea, {
      props: { aiLoading: true },
      global: { plugins: [pinia] },
    });

    expect(wrapper.find('[data-testid="composer-textarea-ai-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="composer-textarea-clear"]').exists()).toBe(false);
  });

  it('emits multiline-change only when embedded', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const standalone = mount(ComposerTextarea, { global: { plugins: [pinia] } });
    await standalone.get('[data-testid="composer-textarea-input"]').trigger('focus');
    expect(standalone.emitted('multiline-change')).toBeUndefined();

    const embedded = mount(ComposerTextarea, {
      props: { embedded: true },
      global: { plugins: [pinia] },
    });
    await embedded.get('[data-testid="composer-textarea-input"]').trigger('focus');
    await embedded.vm.$nextTick();
    expect(embedded.emitted('multiline-change')).toBeTruthy();

    await embedded.get('[data-testid="composer-textarea-input"]').setValue('line one\nline two');
    await embedded.get('[data-testid="composer-textarea-input"]').trigger('blur');
    await embedded.vm.$nextTick();
    expect(embedded.emitted('multiline-change')?.length).toBeGreaterThan(1);
  });
});
