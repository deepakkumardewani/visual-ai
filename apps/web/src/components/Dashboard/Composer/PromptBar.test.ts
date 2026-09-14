import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MODEL_REGISTRY, type ModelKey } from '@visual-ai/shared';

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn: { value: false }, user: { value: null } }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import PromptBar from '@/components/Dashboard/Composer/PromptBar.vue';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';
import { MODELS } from '@/utils/models';

const stubs = {
  'font-awesome-icon': true,
  ComposerTextarea: {
    name: 'ComposerTextarea',
    template: '<textarea data-testid="composer-stub" />',
    emits: ['multiline-change'],
  },
  GenerateCTA: { template: '<button data-testid="generate-cta-stub">Generate</button>' },
  ReferenceImageControl: { template: '<div data-testid="reference-control-stub" />' },
  PromptAiMenu: {
    name: 'PromptAiMenu',
    template:
      '<button data-testid="prompt-ai-menu-stub" @click="$emit(\'apply-prompt\', \'AI idea\')" />',
    emits: ['apply-prompt', 'loading'],
  },
};

function enableReference(pinia: ReturnType<typeof createPinia>) {
  const withInput = MODELS.find((model) => {
    const fields = MODEL_REGISTRY[model.id as ModelKey]?.fields;
    return Boolean(fields && 'imageInput' in fields && fields.imageInput);
  }) ?? { ...useAsideStore(pinia).mode, id: 'FLUX_KONTEXT_PRO' };
  useAsideStore(pinia).mode = withInput;
}

describe('PromptBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders composer, reference control, AI menu, and generate CTA', () => {
    const wrapper = mount(PromptBar, {
      global: { plugins: [createPinia()], stubs },
    });

    expect(wrapper.get('[data-testid="prompt-bar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reference-control-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="composer-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="prompt-ai-menu-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="generate-cta-stub"]').exists()).toBe(true);
  });

  it('shows a reference preview and removes it', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.referenceImage = {
      file: new File(['x'], 'ref.png', { type: 'image/png' }),
      previewUrl: 'blob:ref',
      name: 'ref.png',
    };

    const wrapper = mount(PromptBar, {
      global: { plugins: [pinia], stubs },
    });

    expect(wrapper.get('[data-testid="reference-image-preview"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Image reference');

    await wrapper.get('[data-testid="reference-image-remove"]').trigger('click');
    expect(useAsideStore().referenceImage).toBeNull();
  });

  it('applies a prompt from the AI menu to both stores', async () => {
    const pinia = createPinia();
    const wrapper = mount(PromptBar, {
      global: { plugins: [pinia], stubs },
    });

    await wrapper.get('[data-testid="prompt-ai-menu-stub"]').trigger('click');
    expect(useAsideStore(pinia).typingPrompt).toBe('AI idea');
    expect(useGenerateStore(pinia).promptText).toBe('AI idea');
  });

  it('moves actions to the second row when the composer is multiline', async () => {
    const wrapper = mount(PromptBar, {
      global: { plugins: [createPinia()], stubs },
    });

    expect(wrapper.findAll('[data-testid="generate-cta-stub"]')).toHaveLength(1);
    const textarea = wrapper.getComponent({ name: 'ComposerTextarea' });
    await wrapper.getComponent({ name: 'PromptAiMenu' }).vm.$emit('loading', true);
    await textarea.vm.$emit('multiline-change', true);
    expect(wrapper.findAll('[data-testid="generate-cta-stub"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="prompt-ai-menu-stub"]')).toHaveLength(1);
    expect(wrapper.get('[data-testid="prompt-bar"]').html()).toContain('tw-items-start');
  });

  it('shows a drop error when an unsupported file is dropped', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mount(PromptBar, {
      global: { plugins: [pinia], stubs },
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File([new Uint8Array(5 * 1024 * 1024 + 8)], 'huge.png', { type: 'image/png' }),
    );
    await wrapper.get('[data-testid="prompt-bar"]').trigger('drop', { dataTransfer });

    expect(useAsideStore(pinia).supportsImageInput).toBe(true);
    expect(wrapper.get('[data-testid="prompt-bar-drop-error"]').text()).toContain('5MB');
  });

  it('sets a reference image from a valid drop', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mount(PromptBar, {
      global: { plugins: [pinia], stubs },
    });

    const file = new File(['img'], 'ref.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    await wrapper.get('[data-testid="prompt-bar"]').trigger('drop', { dataTransfer });

    expect(useAsideStore(pinia).referenceImage?.name).toBe('ref.png');
    expect(wrapper.get('[data-testid="reference-image-preview"]').exists()).toBe(true);
  });

  it('highlights the bar while dragging a file', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mount(PromptBar, {
      global: { plugins: [pinia], stubs },
    });

    await wrapper.get('[data-testid="prompt-bar"]').trigger('dragover');
    expect(wrapper.get('[data-testid="prompt-bar"]').classes().join(' ')).toContain(
      'tw-border-accent',
    );

    await wrapper.get('[data-testid="prompt-bar"]').trigger('dragleave');
    expect(wrapper.get('[data-testid="prompt-bar"]').classes().join(' ')).toContain(
      'tw-border-hairline',
    );
  });
});
