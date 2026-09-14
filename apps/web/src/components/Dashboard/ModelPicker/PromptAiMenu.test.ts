import { createPinia, setActivePinia } from 'pinia';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/promptAi', () => ({
  improvePrompt: vi.fn(
    () =>
      new Promise<{ text: string }>((resolve) => {
        setTimeout(() => resolve({ text: 'Sunset improved' }), 1200);
      }),
  ),
  describeImage: vi.fn(async (file: File) => ({
    text: `described ${file.name}`,
  })),
  generateRandomPrompt: vi.fn(async () => 'Random AI prompt'),
  pickRandomPrompt: vi.fn(() => 'Random JSON prompt'),
}));

import PromptAiMenu from '@/components/Dashboard/ModelPicker/PromptAiMenu.vue';
import { useAsideStore } from '@/stores/aside';
import { useSavedPromptsStore } from '@/stores/savedPrompts';
import { describeImage, generateRandomPrompt, improvePrompt } from '@/utils/promptAi';
import { FLUX_MODES } from '@/utils/models';

// The menu panel renders through Popover's <Teleport to="body">, so its content
// lands outside `wrapper.element` — query it via `document` rather than the wrapper.
const getPanel = () => document.body.querySelector<HTMLElement>('[data-testid="prompt-ai-panel"]');
const getByTestId = (testId: string) =>
  document.body.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

describe('PromptAiMenu', () => {
  let activeWrapper: VueWrapper | null = null;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.mocked(improvePrompt).mockClear();
    vi.mocked(describeImage).mockClear();
    vi.mocked(generateRandomPrompt).mockClear();
  });

  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
    vi.useRealTimers();
  });

  const mountMenu = (currentPrompt = 'A forest scene') => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const asideStore = useAsideStore();
    asideStore.mode = FLUX_MODES[0];
    vi.spyOn(useSavedPromptsStore(), 'fetchPrompts').mockResolvedValue(undefined);

    const wrapper = mount(PromptAiMenu, {
      props: { currentPrompt },
      global: { plugins: [pinia] },
      attachTo: document.body,
    });
    activeWrapper = wrapper;

    return { wrapper, asideStore };
  };

  const openMenu = async (wrapper: ReturnType<typeof mount>) => {
    await wrapper.get('[data-testid="prompt-ai-trigger"]').trigger('click');
  };

  it('opens menu with Improve, Random, Describe, Save, and Saved', async () => {
    const { wrapper } = mountMenu();
    expect(wrapper.find('[data-testid="prompt-ai-menu"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="prompt-ai-improve"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="prompt-ai-random"]').exists()).toBe(false);

    await openMenu(wrapper);
    expect(getPanel()).not.toBeNull();
    expect(getPanel()?.textContent).toContain('Improve');
    expect(getPanel()?.textContent).toContain('Random');
    expect(getPanel()?.textContent).toContain('Describe With AI');
    expect(getPanel()?.textContent).toContain('Save current prompt');
    expect(getPanel()?.textContent).toContain('Saved prompts');

    const itemIds = [...(getPanel()?.querySelectorAll('[role="menuitem"]') ?? [])].map((el) =>
      el.getAttribute('data-testid'),
    );
    expect(itemIds).toEqual([
      'prompt-ai-improve',
      'prompt-ai-random',
      'prompt-ai-describe',
      'prompt-ai-save-current',
      'prompt-ai-saved',
    ]);
  });

  it('supports arrow-key navigation between menu items', async () => {
    const { wrapper } = mountMenu('A forest scene');

    await openMenu(wrapper);

    const improve = getByTestId('prompt-ai-improve') as HTMLButtonElement;
    const random = getByTestId('prompt-ai-random') as HTMLButtonElement;

    expect(document.activeElement).toBe(improve);

    const dialog = document.body.querySelector('[role="dialog"]');
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(random);
  });

  it('emits apply-prompt after Improve Prompt completes', async () => {
    const { wrapper } = mountMenu('Sunset');

    await openMenu(wrapper);
    getByTestId('prompt-ai-improve')?.click();
    await wrapper.vm.$nextTick();

    expect(getByTestId('prompt-ai-loading-improve')).not.toBeNull();
    expect(wrapper.emitted('loading')?.[0]).toEqual([true]);

    await vi.advanceTimersByTimeAsync(1200);

    expect(improvePrompt).toHaveBeenCalledWith('Sunset');
    expect(wrapper.emitted('apply-prompt')?.[0]).toEqual(['Sunset improved']);
    expect(wrapper.emitted('loading')?.at(-1)).toEqual([false]);
  });

  it('emits apply-prompt after generateRandomPrompt completes', async () => {
    const { wrapper, asideStore } = mountMenu();

    await openMenu(wrapper);
    getByTestId('prompt-ai-random')?.click();
    await vi.runAllTimersAsync();

    expect(generateRandomPrompt).toHaveBeenCalledWith(asideStore.mode.id);
    expect(wrapper.emitted('apply-prompt')?.[0]).toEqual(['Random AI prompt']);
  });

  it('emits apply-prompt after Describe With AI upload', async () => {
    const { wrapper } = mountMenu();
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    await openMenu(wrapper);
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });
    await wrapper.get('input[type="file"]').trigger('change');
    await vi.runAllTimersAsync();

    expect(describeImage).toHaveBeenCalledWith(file);
    expect(wrapper.emitted('apply-prompt')?.[0]).toEqual(['described photo.jpg']);
  });

  it('shows a snackbar when Improve Prompt fails', async () => {
    vi.mocked(improvePrompt).mockRejectedValueOnce(new Error('API error'));
    const { wrapper } = mountMenu('Sunset');
    const { useAppStore } = await import('@/stores/app');

    await openMenu(wrapper);
    getByTestId('prompt-ai-improve')?.click();
    await vi.runAllTimersAsync();

    expect(useAppStore().snackbar).toBe(true);
    expect(useAppStore().snackbarText).toBe('API error');
    expect(wrapper.emitted('apply-prompt')).toBeUndefined();
  });

  it('does not start Improve when the menu is disabled', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(PromptAiMenu, {
      props: { currentPrompt: 'Sunset', disabled: true },
      global: { plugins: [pinia] },
      attachTo: document.body,
    });
    activeWrapper = wrapper;

    await openMenu(wrapper);
    getByTestId('prompt-ai-improve')?.click();
    await vi.runAllTimersAsync();
    expect(improvePrompt).not.toHaveBeenCalled();
  });

  it('opens the file picker from Describe With AI', async () => {
    const { wrapper } = mountMenu();
    await openMenu(wrapper);
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    getByTestId('prompt-ai-describe')?.click();
    expect(click).toHaveBeenCalled();
  });

  it('ignores a describe change with no file', async () => {
    const { wrapper } = mountMenu();
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [], configurable: true });
    await input.trigger('change');
    expect(describeImage).not.toHaveBeenCalled();
  });

  it('opens saved prompts and applies one', async () => {
    const { wrapper } = mountMenu('A forest scene');
    await openMenu(wrapper);
    getByTestId('prompt-ai-saved')?.click();
    await wrapper.vm.$nextTick();

    expect(getPanel()?.getAttribute('aria-label')).toBe('Saved prompts');

    const panel = wrapper.getComponent({ name: 'SavedPromptsPanel' });
    panel.vm.$emit('apply-prompt', 'Kept prompt');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('apply-prompt')?.[0]).toEqual(['Kept prompt']);
    expect(getPanel()).toBeNull();
  });

  it('opens save-current view then returns to actions', async () => {
    const { wrapper } = mountMenu('A forest scene');
    await openMenu(wrapper);
    getByTestId('prompt-ai-save-current')?.click();
    await wrapper.vm.$nextTick();

    expect(getPanel()?.getAttribute('aria-label')).toBe('Saved prompts');
    wrapper.getComponent({ name: 'SavedPromptsPanel' }).vm.$emit('back');
    await wrapper.vm.$nextTick();
    expect(getPanel()?.getAttribute('aria-label')).toBe('AI prompt actions');
  });

  it('does not save an empty current prompt', async () => {
    const { wrapper } = mountMenu('   ');
    await openMenu(wrapper);
    getByTestId('prompt-ai-save-current')?.click();
    await wrapper.vm.$nextTick();
    expect(getPanel()?.getAttribute('aria-label')).toBe('AI prompt actions');
  });

  it('resets the panel when the popover closes', async () => {
    const { wrapper } = mountMenu();
    await openMenu(wrapper);
    getByTestId('prompt-ai-saved')?.click();
    await wrapper.vm.$nextTick();
    expect(getPanel()?.getAttribute('aria-label')).toBe('Saved prompts');

    await wrapper.getComponent({ name: 'Popover' }).vm.$emit('update:open', false);
    await wrapper.vm.$nextTick();
    expect(getPanel()).toBeNull();
  });
});
