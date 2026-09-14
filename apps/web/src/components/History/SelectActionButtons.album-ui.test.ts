import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SelectActionButtons from '@/components/History/SelectActionButtons.vue';
import { useCollectionsStore } from '@/stores/collections';
import type { IImageObject } from '@/types';

vi.mock('@/utils/helpers', () => ({
  bulkDelete: vi.fn(),
  bulkDownload: vi.fn(),
  bulkFavorite: vi.fn(),
}));

vi.mock('@/utils/history-collection-ui', () => ({
  ENABLE_COLLECTION_CREATE: true,
}));

const iconStub = { template: '<i class="fa-stub" />' };

function mountButtons() {
  return mount(SelectActionButtons, {
    props: {
      selectedImages: [
        { _id: '1', prompt: 'A', featureType: 'image' },
        { _id: '2', prompt: 'B', featureType: 'image' },
      ] as IImageObject[],
    },
    global: { stubs: { 'font-awesome-icon': iconStub } },
  });
}

describe('SelectActionButtons album UI', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('creates a collection and adds the selected images', async () => {
    const collections = useCollectionsStore();
    const createCollection = vi
      .spyOn(collections, 'createCollection')
      .mockResolvedValue({ id: 'c9', name: 'Studio' } as never);
    const addImages = vi.spyOn(collections, 'addImages').mockResolvedValue({ id: 'c9' } as never);

    const wrapper = mountButtons();
    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    expect(wrapper.text()).toContain('No collections yet');

    await wrapper.get('.picker__item--muted').trigger('click');
    await wrapper.get('.picker__input').setValue('Studio');
    await wrapper.get('form.picker__create').trigger('submit');
    await flushPromises();

    expect(createCollection).toHaveBeenCalledWith('Studio');
    expect(addImages).toHaveBeenCalledWith('c9', ['1', '2']);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('stays in create mode when createCollection fails and skips empty names', async () => {
    const collections = useCollectionsStore();
    const createCollection = vi.spyOn(collections, 'createCollection').mockResolvedValue(null);

    const wrapper = mountButtons();
    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    await wrapper.get('.picker__item--muted').trigger('click');

    await wrapper.get('form.picker__create').trigger('submit');
    expect(createCollection).not.toHaveBeenCalled();

    await wrapper.get('.picker__input').setValue('Studio');
    await wrapper.get('form.picker__create').trigger('submit');
    await flushPromises();
    expect(createCollection).toHaveBeenCalledWith('Studio');
    expect(wrapper.find('form.picker__create').exists()).toBe(true);

    wrapper.unmount();
  });

  it('does not create while busy and resets create mode when the picker closes', async () => {
    const collections = useCollectionsStore();
    const createCollection = vi.spyOn(collections, 'createCollection').mockResolvedValue(null);

    const wrapper = mountButtons();
    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    await wrapper.get('.picker__item--muted').trigger('click');
    await wrapper.get('.picker__input').setValue('Studio');

    collections.isMutating = true;
    await wrapper.get('form.picker__create').trigger('submit');
    expect(createCollection).not.toHaveBeenCalled();
    collections.isMutating = false;
    await flushPromises();

    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);

    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    expect(wrapper.find('.picker__item--muted').exists()).toBe(true);

    wrapper.unmount();
  });
});
