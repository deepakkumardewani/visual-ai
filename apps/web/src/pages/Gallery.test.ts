import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usePageSeo = vi.fn();

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: (options: unknown) => usePageSeo(options),
}));

import Gallery from '@/pages/Gallery.vue';

describe('Gallery', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    usePageSeo.mockClear();
  });

  it('renders the gallery heading and images after mount', async () => {
    const wrapper = mount(Gallery, {
      global: {
        stubs: {
          LandingFooter: { template: '<footer class="footer-stub" />' },
          AppModal: { template: '<div class="modal-stub"><slot /><slot name="title" /></div>' },
        },
      },
    });

    await flushPromises();
    expect(wrapper.text()).toContain('Gallery');
    expect(wrapper.find('img').exists()).toBe(true);
    expect(wrapper.find('.footer-stub').exists()).toBe(true);
    expect(usePageSeo).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/gallery/i),
        path: '/gallery',
      }),
    );
  });

  it('opens a selected image in the modal and clears the spinner after load', async () => {
    const wrapper = mount(Gallery, {
      global: {
        stubs: {
          LandingFooter: { template: '<footer class="footer-stub" />' },
          AppModal: {
            props: ['open'],
            template: '<div v-if="open" class="modal-stub"><slot name="title" /><slot /></div>',
          },
        },
      },
    });

    await flushPromises();
    const firstTile = wrapper.findAll('button')[0];
    expect(firstTile.find('.gallery-spinner').exists()).toBe(true);
    await firstTile.find('img').trigger('load');
    expect(firstTile.find('.gallery-spinner').exists()).toBe(false);

    await wrapper.find('button').trigger('click');
    expect(wrapper.find('.modal-stub').exists()).toBe(true);
    expect(wrapper.find('.modal-stub').text().length).toBeGreaterThan(0);
  });
});
