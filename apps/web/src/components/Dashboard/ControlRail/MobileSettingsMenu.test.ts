import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import MobileSettingsMenu from '@/components/Dashboard/ControlRail/MobileSettingsMenu.vue';

describe('MobileSettingsMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('mounts without Vuetify and opens settings panel', async () => {
    const wrapper = mount(MobileSettingsMenu);

    expect(wrapper.html()).not.toMatch(/<v-[a-z]/i);
    expect(wrapper.get('[data-testid="mobile-settings-trigger"]').attributes('aria-label')).toBe(
      'Open generation settings',
    );

    await wrapper.get('button').trigger('click');
    expect(wrapper.find('[data-testid="mobile-settings-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Size');
  });
});
