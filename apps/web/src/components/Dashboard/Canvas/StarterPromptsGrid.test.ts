import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}));

import StarterPromptsGrid from '@/components/Dashboard/Canvas/StarterPromptsGrid.vue';
import { useAsideStore } from '@/stores/aside';

describe('StarterPromptsGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders starter prompt cards', () => {
    const wrapper = mount(StarterPromptsGrid, {
      global: { plugins: [createPinia()] },
    });

    expect(wrapper.get('[data-testid="starter-prompts-grid"]').text()).toContain('Your creations');
    expect(wrapper.get('[data-testid="starter-prompt-morning-still"]').text()).toContain(
      'Quiet morning',
    );
    expect(wrapper.findAll('button.starter-card')).toHaveLength(6);
  });

  it('applies the prompt and navigates to create on click', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(StarterPromptsGrid, {
      global: { plugins: [pinia] },
    });

    await wrapper.get('[data-testid="starter-prompt-workshop"]').trigger('click');

    expect(useAsideStore().typingPrompt).toContain('Elderly craftsman');
    expect(push).toHaveBeenCalled();
    expect(push.mock.calls[0][0]).toMatchObject({ name: 'create' });
  });
});
