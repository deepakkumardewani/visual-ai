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
});
