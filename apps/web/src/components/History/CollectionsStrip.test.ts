import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CollectionsStrip from '@/components/History/CollectionsStrip.vue';
import { useAppStore } from '@/stores/app';
import { useCollectionsStore } from '@/stores/collections';
import { useUserStore } from '@/stores/user';
import type { IImageObject } from '@/types';

const iconStub = { template: '<i class="fa-stub" />' };

function stubs() {
  return {
    Popover: { template: '<div><slot /><slot name="trigger" :triggerProps="{}" /></div>' },
    Tooltip: { template: '<span><slot /></span>' },
    'font-awesome-icon': iconStub,
  };
}

describe('CollectionsStrip', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('hides when there are no collections', () => {
    const collections = useCollectionsStore();
    vi.spyOn(collections, 'fetchCollections').mockResolvedValue();
    const wrapper = mount(CollectionsStrip, { global: { stubs: stubs() } });
    expect(wrapper.find('[data-testid="collections-strip"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('fetches collections on mount and toggles the active chip', async () => {
    const collections = useCollectionsStore();
    const fetchCollections = vi.spyOn(collections, 'fetchCollections').mockResolvedValue();
    collections.collections = [
      { id: 'c1', name: 'Landscapes', count: 3, coverImageIds: [] },
    ] as never;

    const wrapper = mount(CollectionsStrip, { global: { stubs: stubs() } });
    await flushPromises();
    expect(fetchCollections).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Landscapes');
    expect(wrapper.text()).toContain('3');

    await wrapper.get('[aria-label="Landscapes, 3 images"]').trigger('click');
    expect(collections.selectedCollectionId).toBe('c1');
    expect(wrapper.get('[aria-label="Landscapes, 3 images"]').classes()).toContain(
      'collection-chip--active',
    );

    await wrapper.get('[aria-label="Landscapes, 3 images"]').trigger('click');
    expect(collections.selectedCollectionId).toBeNull();

    wrapper.unmount();
  });

  it('renders cover thumbs from Cloudinary ids and URL fallbacks', async () => {
    const collections = useCollectionsStore();
    vi.spyOn(collections, 'fetchCollections').mockResolvedValue();
    const user = useUserStore();

    user.history = [
      {
        _id: 'a',
        images: [{ aiImagePublicId: 'pub/a' }],
      },
      {
        _id: 'b',
        images: [{ enhancedPublicId: 'enh/b' }],
      },
      {
        _id: 'c',
        images: [{ aiImageUrl: 'https://cdn.example.com/c.jpg' }],
      },
      {
        _id: 'd',
        images: [{ enhancedImageUrl: 'https://cdn.example.com/d.jpg' }],
      },
      {
        _id: 'e',
        images: [{}],
      },
    ] as IImageObject[];

    collections.collections = [
      {
        id: 'album',
        name: 'Album',
        count: 5,
        coverImageIds: ['a', 'b', 'c', 'd', 'e', 'missing'],
      },
    ] as never;

    const wrapper = mount(CollectionsStrip, { global: { stubs: stubs() } });
    await flushPromises();

    const srcs = wrapper.findAll('img').map((img) => img.attributes('src') ?? '');
    expect(srcs.length).toBeGreaterThan(0);
    expect(srcs.some((src) => src.includes('pub/a') || src.includes('q_auto,f_auto'))).toBe(true);
    expect(srcs.some((src) => src.includes('enh/b') || src.includes('c_fill'))).toBe(true);

    wrapper.unmount();
  });

  it('covers selectAll and submitCreate through the instance', async () => {
    const collections = useCollectionsStore();
    vi.spyOn(collections, 'fetchCollections').mockResolvedValue();
    collections.collections = [{ id: 'c1', name: 'Keep', count: 1, coverImageIds: [] }] as never;
    collections.selectedCollectionId = 'c1';

    const createCollection = vi.spyOn(collections, 'createCollection').mockResolvedValue(null);
    const wrapper = mount(CollectionsStrip, { global: { stubs: stubs() } });
    const vm = wrapper.vm as unknown as {
      selectAll: () => void;
      submitCreate: () => Promise<void>;
      getThumbUrl: (image?: { aiImagePublicId?: string }) => string;
      newName: string;
    };

    vm.selectAll();
    expect(collections.selectedCollectionId).toBeNull();

    expect(vm.getThumbUrl(undefined)).toBe('');
    expect(vm.getThumbUrl({ aiImageUrl: 'https://cdn.example.com/raw.jpg' } as never)).toBe(
      'https://cdn.example.com/raw.jpg',
    );
    expect(vm.getThumbUrl({ enhancedImageUrl: 'https://cdn.example.com/enh.jpg' } as never)).toBe(
      'https://cdn.example.com/enh.jpg',
    );
    expect(vm.getThumbUrl({} as never)).toBe('');

    vm.newName = '   ';
    await vm.submitCreate();
    expect(createCollection).not.toHaveBeenCalled();

    collections.isMutating = true;
    vm.newName = 'Product shots';
    await vm.submitCreate();
    expect(createCollection).not.toHaveBeenCalled();
    collections.isMutating = false;

    await vm.submitCreate();
    expect(createCollection).toHaveBeenCalledWith('Product shots');

    createCollection.mockResolvedValue({ id: 'n1', name: 'Product shots' } as never);
    const app = useAppStore();
    vm.newName = 'Product shots';
    await vm.submitCreate();
    expect(vm.newName).toBe('');
    expect(app.snackbar).toBe(true);
    expect(app.snackbarText).toContain('Product shots');

    wrapper.unmount();
  });
});
