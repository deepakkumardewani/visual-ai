import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import Filter from '@/components/History/Filter.vue';
import { useHistoryStore } from '@/stores/history';

const popoverStub = {
  template: '<div class="popover-stub"><slot name="trigger" /><slot /></div>',
};

const iconStub = { template: '<i class="fa-stub" />' };

function mountFilter() {
  return mount(Filter, {
    global: {
      stubs: {
        Popover: popoverStub,
        'font-awesome-icon': iconStub,
      },
    },
  });
}

describe('Filter', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('binds search query and clears it', async () => {
    const store = useHistoryStore();
    const wrapper = mountFilter();

    const input = wrapper.get('input[aria-label="Search by prompt"]');
    await input.setValue('neon fox');
    expect(store.searchQuery).toBe('neon fox');
    expect(wrapper.find('[aria-label="Clear search"]').exists()).toBe(true);

    await wrapper.get('[aria-label="Clear search"]').trigger('click');
    expect(store.searchQuery).toBe('');
    expect(wrapper.find('[aria-label="Clear search"]').exists()).toBe(false);
  });

  it('shows All types, a single known type, unknown type, and a count', async () => {
    const store = useHistoryStore();
    const wrapper = mountFilter();

    expect(wrapper.text()).toContain('All types');

    store.selectedFeatureTypes = ['colorize'];
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Colorize');

    store.selectedFeatureTypes = ['not-a-type'];
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('1 type');

    store.selectedFeatureTypes = ['image', 'upscale'];
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('2 types');
  });

  it('toggles feature types on and off', async () => {
    const store = useHistoryStore();
    const wrapper = mountFilter();

    const imageType = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Text-to-Image'));
    expect(imageType).toBeTruthy();

    await imageType!.trigger('click');
    expect(store.selectedFeatureTypes).toEqual(['image']);
    expect(imageType!.attributes('aria-pressed')).toBe('true');

    await imageType!.trigger('click');
    expect(store.selectedFeatureTypes).toEqual([]);
  });

  it('selects a size and falls back to Size when the value is unknown', async () => {
    const store = useHistoryStore();
    const wrapper = mountFilter();

    expect(wrapper.text()).toContain('Medium');

    const large = wrapper
      .findAll('[role="option"]')
      .find((button) => button.text().includes('Large'));
    expect(large).toBeTruthy();
    await large!.trigger('click');
    expect(store.selectedSize).toBe('large');
    expect(wrapper.text()).toContain('Large');

    store.selectedSize = 'unknown';
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Size');
  });
});
