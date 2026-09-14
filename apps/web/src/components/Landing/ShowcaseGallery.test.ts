import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const copyPrompt = vi.fn();

vi.mock('@/composables/useShareActions', () => ({
  useShareActions: () => ({ shareLink: vi.fn(), copyPrompt }),
}));

import ShowcaseGallery from '@/components/Landing/ShowcaseGallery.vue';
import { SHOWCASE } from '@/utils/landing';

describe('ShowcaseGallery', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    copyPrompt.mockReset();
    document.body.style.overflow = '';
  });

  it('renders showcase tiles', () => {
    const wrapper = mount(ShowcaseGallery);
    expect(wrapper.text()).toMatch(/Showcase|Made with Visual AI/i);
    expect(wrapper.findAll('img').length).toBeGreaterThan(0);
  });

  it('opens the lightbox and copies the selected prompt', async () => {
    const wrapper = mount(ShowcaseGallery, {
      global: {
        stubs: {
          Teleport: true,
          LandingButton: {
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    });

    await wrapper.find('.tile__btn').trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain(SHOWCASE[0].prompt);
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Copy prompt'))!
      .trigger('click');
    expect(copyPrompt).toHaveBeenCalledWith(SHOWCASE[0].prompt);

    await wrapper.get('[aria-label="Close"]').trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('closes the lightbox from the backdrop and on unmount', async () => {
    const wrapper = mount(ShowcaseGallery, {
      global: { stubs: { Teleport: true, LandingButton: true } },
    });
    await wrapper.find('.tile__btn').trigger('click');
    await wrapper.get('[role="presentation"]').trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await wrapper.find('.tile__btn').trigger('click');
    wrapper.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes the lightbox on Escape and ignores backdrop clicks on the panel', async () => {
    const wrapper = mount(ShowcaseGallery, {
      global: {
        stubs: {
          Teleport: true,
          LandingButton: { template: '<button type="button"><slot /></button>' },
        },
        directives: { reveal: () => undefined },
      },
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await wrapper.find('.tile__btn').trigger('click');
    await wrapper.get('[role="dialog"]').trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
});
