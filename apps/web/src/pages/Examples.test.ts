import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Examples from '@/pages/Examples.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

describe('Examples', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders example tabs and switches to Colorize', async () => {
    const wrapper = mount(Examples, {
      global: {
        stubs: {
          LandingFooter: { template: '<footer class="footer-stub" />' },
          SideBySide: { template: '<div class="sbs-stub" />' },
        },
      },
    });

    expect(wrapper.text()).toContain('Upscale');
    expect(wrapper.text()).toContain('Colorize');
    expect(wrapper.findAll('.sbs-stub').length).toBeGreaterThan(0);

    const colorize = wrapper.findAll('button').find((btn) => btn.text() === 'Colorize');
    expect(colorize).toBeTruthy();
    await colorize!.trigger('click');
    expect(wrapper.text()).toContain('Colorize');
  });
});
