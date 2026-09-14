import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CollectionsStrip from '@/components/History/CollectionsStrip.vue';
import { useAppStore } from '@/stores/app';
import { useCollectionsStore } from '@/stores/collections';

vi.mock('@/utils/history-collection-ui', () => ({
  ENABLE_COLLECTION_ALL: true,
  ENABLE_COLLECTION_CREATE: true,
}));

const iconStub = { template: '<i class="fa-stub" />' };

function stubs() {
  return {
    Popover: {
      template: '<div class="popover"><slot name="trigger" :triggerProps="{}" /><slot /></div>',
    },
    Tooltip: { template: '<span><slot /></span>' },
    'font-awesome-icon': iconStub,
  };
}

describe('CollectionsStrip album UI', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows the All chip and clears the selected collection', async () => {
    const collections = useCollectionsStore();
    vi.spyOn(collections, 'fetchCollections').mockResolvedValue();
    collections.selectedCollectionId = 'c1';

    const wrapper = mount(CollectionsStrip, { global: { stubs: stubs() } });
    expect(wrapper.find('[data-testid="collections-strip"]').exists()).toBe(true);

    await wrapper.get('button.collection-chip').trigger('click');
    expect(collections.selectedCollectionId).toBeNull();
    expect(wrapper.text()).toContain('All');

    wrapper.unmount();
  });

  it('creates a collection from the New form', async () => {
    const collections = useCollectionsStore();
    vi.spyOn(collections, 'fetchCollections').mockResolvedValue();
    const createCollection = vi
      .spyOn(collections, 'createCollection')
      .mockResolvedValue({ id: 'n1', name: 'Product shots' } as never);

    const wrapper = mount(CollectionsStrip, { global: { stubs: stubs() } });
    expect(wrapper.get('[aria-label="New collection"]').exists()).toBe(true);

    await wrapper.get('#new-collection-name').setValue('Product shots');
    await wrapper.get('form.create-form').trigger('submit');
    await flushPromises();

    expect(createCollection).toHaveBeenCalledWith('Product shots');
    expect(useAppStore().snackbar).toBe(true);
    expect(wrapper.get('#new-collection-name').element).toHaveProperty('value', '');

    wrapper.unmount();
  });

  it('does not create when the name is empty or a mutation is in flight', async () => {
    const collections = useCollectionsStore();
    vi.spyOn(collections, 'fetchCollections').mockResolvedValue();
    const createCollection = vi.spyOn(collections, 'createCollection').mockResolvedValue(null);

    const wrapper = mount(CollectionsStrip, { global: { stubs: stubs() } });
    await wrapper.get('form.create-form').trigger('submit');
    expect(createCollection).not.toHaveBeenCalled();

    collections.isMutating = true;
    await wrapper.get('#new-collection-name').setValue('Busy');
    await wrapper.get('form.create-form').trigger('submit');
    expect(createCollection).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
