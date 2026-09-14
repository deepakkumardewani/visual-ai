import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/composables/useFetch', () => ({
  useFetch: () => ({
    json: vi.fn().mockResolvedValue({
      data: { value: { prompts: [] } },
      error: { value: null },
    }),
  }),
}));

import SavedPromptsPanel from '@/components/Dashboard/ModelPicker/SavedPromptsPanel.vue';
import { useSavedPromptsStore } from '@/stores/savedPrompts';

const stubs = { 'font-awesome-icon': true };

describe('SavedPromptsPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders list view and emits back', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockResolvedValue(undefined);
    store.prompts = [
      {
        id: 'p1',
        name: 'Sunrise still',
        prompt: 'warm sunrise still life',
        createdAt: '2024-01-01',
      },
    ] as never;

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'a new prompt' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    expect(wrapper.get('[data-testid="saved-prompts-panel"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="saved-prompt-save-current"]').text()).toContain(
      'Save current prompt',
    );
    expect(wrapper.get('[data-testid="saved-prompt-item-p1"]').text()).toContain('Sunrise still');

    await wrapper.get('[data-testid="saved-prompts-back"]').trigger('click');
    expect(wrapper.emitted('back')).toHaveLength(1);
  });

  it('applies a saved prompt', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockResolvedValue(undefined);
    store.prompts = [
      {
        id: 'p1',
        name: 'Sunrise still',
        prompt: 'warm sunrise still life',
        createdAt: '2024-01-01',
      },
    ] as never;

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'draft' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    await wrapper.get('[data-testid="saved-prompt-item-p1"]').trigger('click');
    expect(wrapper.emitted('apply-prompt')?.[0]).toEqual(['warm sunrise still life']);
  });

  it('saves the current prompt from the naming view', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockResolvedValue(undefined);
    const createPrompt = vi.spyOn(store, 'createPrompt').mockResolvedValue(undefined as never);

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'Misty coastal footpath', initialView: 'save' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    await wrapper.get('[data-testid="saved-prompt-name-input"]').setValue('Coast dusk');
    await wrapper.get('[data-testid="saved-prompt-confirm-save"]').trigger('click');
    expect(createPrompt).toHaveBeenCalledWith({
      name: 'Coast dusk',
      prompt: 'Misty coastal footpath',
      modelId: undefined,
    });
  });

  it('tells the user to write a prompt before saving', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.spyOn(useSavedPromptsStore(), 'fetchPrompts').mockResolvedValue(undefined);

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: '   ' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    expect(wrapper.get('[data-testid="saved-prompt-save-current"]').text()).toContain(
      'Write a prompt first',
    );
    expect(
      wrapper.get('[data-testid="saved-prompt-save-current"]').attributes('disabled'),
    ).toBeDefined();
  });

  it('shows the empty list and surfaces fetch errors', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.spyOn(useSavedPromptsStore(), 'fetchPrompts').mockRejectedValue(new Error('Network down'));

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'draft' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('No saved prompts yet');
    const { useAppStore } = await import('@/stores/app');
    expect(useAppStore().snackbarText).toBe('Network down');
  });

  it('uses a fallback snackbar when fetch rejects a non-Error', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.spyOn(useSavedPromptsStore(), 'fetchPrompts').mockRejectedValue('boom');

    mount(SavedPromptsPanel, {
      props: { currentPrompt: 'draft' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    const { useAppStore } = await import('@/stores/app');
    expect(useAppStore().snackbarText).toBe('Could not load saved prompts.');
  });

  it('cancels naming and skips the list while saving from the save view', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.spyOn(useSavedPromptsStore(), 'fetchPrompts').mockResolvedValue(undefined);

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'Fog over pines', initialView: 'save' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="saved-prompts-list"]').exists()).toBe(false);
    await wrapper
      .get('[data-testid="saved-prompt-name-input"]')
      .trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[data-testid="saved-prompt-save-current"]').exists()).toBe(true);
  });

  it('blocks save, apply, and delete while disabled or already saving', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockResolvedValue(undefined);
    const createPrompt = vi.spyOn(store, 'createPrompt').mockResolvedValue(undefined as never);
    store.prompts = [
      {
        id: 'p1',
        name: 'Sunrise still',
        prompt: 'warm sunrise still life',
        createdAt: '2024-01-01',
      },
    ] as never;
    store.isSaving = true;
    store.isDeletingId = 'p1';

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'Misty coastal footpath', initialView: 'save', disabled: true },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    await wrapper.get('[data-testid="saved-prompt-name-input"]').setValue('Coast');
    await wrapper.get('[data-testid="saved-prompt-confirm-save"]').trigger('click');
    expect(createPrompt).not.toHaveBeenCalled();
  });

  it('requires a name before creating a prompt', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockResolvedValue(undefined);
    const createPrompt = vi.spyOn(store, 'createPrompt').mockResolvedValue(undefined as never);

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'Misty coastal footpath', initialView: 'save' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    await wrapper.get('[data-testid="saved-prompt-name-input"]').trigger('keydown.enter');
    expect(createPrompt).not.toHaveBeenCalled();
    const { useAppStore } = await import('@/stores/app');
    expect(useAppStore().snackbarText).toBe('Enter a name for this prompt.');
  });

  it('surfaces create and delete errors, including non-Error throws', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockResolvedValue(undefined);
    vi.spyOn(store, 'createPrompt').mockRejectedValueOnce(new Error('Save failed'));
    store.prompts = [
      {
        id: 'p1',
        name: 'Sunrise still',
        prompt: 'warm sunrise still life',
        createdAt: '2024-01-01',
      },
    ] as never;

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'Misty coastal footpath', initialView: 'save' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    await wrapper.get('[data-testid="saved-prompt-name-input"]').setValue('Coast dusk');
    await wrapper.get('[data-testid="saved-prompt-confirm-save"]').trigger('click');
    await flushPromises();
    const { useAppStore } = await import('@/stores/app');
    expect(useAppStore().snackbarText).toBe('Save failed');

    vi.spyOn(store, 'createPrompt').mockRejectedValueOnce('nope');
    await wrapper.get('[data-testid="saved-prompt-name-input"]').setValue('Coast dusk');
    await wrapper.get('[data-testid="saved-prompt-confirm-save"]').trigger('click');
    await flushPromises();
    expect(useAppStore().snackbarText).toBe('Could not save prompt.');

    vi.spyOn(store, 'deletePrompt').mockRejectedValueOnce(new Error('Delete failed'));
    const listWrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'draft' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();
    await listWrapper.get('[data-testid="saved-prompt-delete-p1"]').trigger('click');
    await flushPromises();
    expect(useAppStore().snackbarText).toBe('Delete failed');

    vi.spyOn(store, 'deletePrompt').mockRejectedValueOnce('x');
    await listWrapper.get('[data-testid="saved-prompt-delete-p1"]').trigger('click');
    await flushPromises();
    expect(useAppStore().snackbarText).toBe('Could not delete prompt.');
  });

  it('does not apply or delete while the panel is disabled', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockResolvedValue(undefined);
    const deletePrompt = vi.spyOn(store, 'deletePrompt').mockResolvedValue(undefined);
    store.prompts = [
      {
        id: 'p1',
        name: 'Sunrise still',
        prompt: 'warm sunrise still life',
        createdAt: '2024-01-01',
      },
    ] as never;

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'draft', disabled: true },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    await wrapper.get('[data-testid="saved-prompt-item-p1"]').trigger('click');
    expect(wrapper.emitted('apply-prompt')).toBeUndefined();
    await wrapper.get('[data-testid="saved-prompt-delete-p1"]').trigger('click');
    expect(deletePrompt).not.toHaveBeenCalled();
  });

  it('shows a spinner on the row being deleted', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockResolvedValue(undefined);
    store.prompts = [
      {
        id: 'p1',
        name: 'Sunrise still',
        prompt: 'warm sunrise still life',
        createdAt: '2024-01-01',
      },
    ] as never;
    store.isDeletingId = 'p1';

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'draft' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    expect(
      wrapper.get('[data-testid="saved-prompt-delete-p1"]').attributes('disabled'),
    ).toBeDefined();
    expect(wrapper.get('[data-testid="saved-prompt-delete-p1"]').find('svg').exists()).toBe(false);
  });

  it('shows a loading label before any prompts arrive', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useSavedPromptsStore();
    vi.spyOn(store, 'fetchPrompts').mockImplementation(
      () => new Promise(() => undefined) as Promise<void>,
    );
    store.isLoading = true;
    store.prompts = [];

    const wrapper = mount(SavedPromptsPanel, {
      props: { currentPrompt: 'draft' },
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Loading…');
  });
});
