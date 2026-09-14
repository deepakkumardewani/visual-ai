import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NoResults from '@/components/History/NoResults.vue';
import { useUserStore } from '@/stores/user';

const push = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push }),
  };
});

describe('NoResults', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockClear();
  });

  it('prompts create when history is empty', async () => {
    const user = useUserStore();
    user.history = [];
    const wrapper = mount(NoResults, { props: { isFavorites: false, groupedHistory: [] } });
    expect(wrapper.text()).toContain('Nothing here yet');
    await wrapper.get('button').trigger('click');
    expect(push).toHaveBeenCalled();
  });

  it('shows favorites empty copy', () => {
    const user = useUserStore();
    user.history = [];
    const wrapper = mount(NoResults, { props: { isFavorites: true, groupedHistory: [] } });
    expect(wrapper.text()).toContain('You have not added any favorites yet.');
  });

  it('shows filter empty copy when history exists', () => {
    const user = useUserStore();
    user.history = [{ _id: '1' } as never];
    const wrapper = mount(NoResults, { props: { isFavorites: false, groupedHistory: [] } });
    expect(wrapper.text()).toContain('No results match your filters.');
  });
});
