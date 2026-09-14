import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SelectActionButtons from '@/components/History/SelectActionButtons.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useGenerateStore } from '@/stores/generate';
import type { IImageObject } from '@/types';
import { bulkDelete, bulkDownload, bulkFavorite } from '@/utils/helpers';

vi.mock('@/utils/helpers', () => ({
  bulkDelete: vi.fn(),
  bulkDownload: vi.fn(),
  bulkFavorite: vi.fn(),
}));

const iconStub = { template: '<i class="fa-stub" />' };

function selected(ids: Array<string | undefined> = ['1', '2']): IImageObject[] {
  return ids.map((id, index) => ({
    _id: id,
    prompt: `Prompt ${index}`,
    featureType: 'image',
  })) as IImageObject[];
}

function mountButtons(images = selected()) {
  return mount(SelectActionButtons, {
    props: { selectedImages: images },
    attachTo: document.body,
    global: {
      stubs: { 'font-awesome-icon': iconStub },
    },
  });
}

describe('SelectActionButtons', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('runs bulk download, favorite, and delete', async () => {
    const images = selected();
    const wrapper = mountButtons(images);
    const buttons = wrapper.findAll('button.bulk-btn');

    await buttons[0]!.trigger('click');
    expect(bulkDownload).toHaveBeenCalledWith(images);

    await buttons[1]!.trigger('click');
    expect(bulkFavorite).toHaveBeenCalledWith(images);

    await buttons[buttons.length - 1]!.trigger('click');
    expect(bulkDelete).toHaveBeenCalledWith(images);

    wrapper.unmount();
  });

  it('opens the picker empty state and closes it on a second toggle', async () => {
    const wrapper = mountButtons();

    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    expect(wrapper.text()).toContain('No collections yet');

    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('does not open the picker while busy', async () => {
    const generate = useGenerateStore();
    generate.isDeleting = true;
    const wrapper = mountButtons();

    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    expect(
      wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined),
    ).toBe(true);

    wrapper.unmount();
  });

  it('adds selected images to a collection and closes the picker', async () => {
    const collections = useCollectionsStore();
    collections.collections = [
      { id: 'c1', name: 'Landscapes', count: 2, coverImageIds: [] } as never,
    ];
    const addImages = vi.spyOn(collections, 'addImages').mockResolvedValue({ id: 'c1' } as never);

    const wrapper = mountButtons();
    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    await wrapper.get('[role="menuitem"]').trigger('click');
    await flushPromises();

    expect(addImages).toHaveBeenCalledWith('c1', ['1', '2']);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('keeps the picker open when addImages fails and skips work without ids', async () => {
    const collections = useCollectionsStore();
    collections.collections = [
      { id: 'c1', name: 'Landscapes', count: 0, coverImageIds: [] } as never,
    ];
    const addImages = vi.spyOn(collections, 'addImages').mockResolvedValue(null);

    const wrapper = mountButtons(selected([undefined]));
    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    await wrapper.get('[role="menuitem"]').trigger('click');
    await flushPromises();

    expect(addImages).not.toHaveBeenCalled();
    expect(wrapper.find('[role="menu"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it('closes the picker on outside click and covers createAndAdd via the instance', async () => {
    const collections = useCollectionsStore();
    const createCollection = vi.spyOn(collections, 'createCollection').mockResolvedValue(null);
    const addImages = vi.spyOn(collections, 'addImages').mockResolvedValue({ id: 'c2' } as never);

    const wrapper = mountButtons();
    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      createAndAdd: () => Promise<void>;
      addToCollection: (id: string) => Promise<void>;
      newName: string;
    };

    vm.newName = '   ';
    await vm.createAndAdd();
    expect(createCollection).not.toHaveBeenCalled();

    const generate = useGenerateStore();
    generate.isFavoriting = true;
    vm.newName = 'Studio';
    await vm.createAndAdd();
    expect(createCollection).not.toHaveBeenCalled();
    generate.isFavoriting = false;

    vm.newName = 'Studio';
    await vm.createAndAdd();
    expect(createCollection).toHaveBeenCalledWith('Studio');
    expect(addImages).not.toHaveBeenCalled();

    createCollection.mockResolvedValue({ id: 'c2', name: 'Studio' } as never);
    vm.newName = 'Studio';
    await vm.createAndAdd();
    expect(addImages).toHaveBeenCalledWith('c2', ['1', '2']);

    wrapper.unmount();
  });
});
