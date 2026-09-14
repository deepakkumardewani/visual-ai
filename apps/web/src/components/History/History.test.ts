import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import History from '@/components/History/History.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useDialogStore } from '@/stores/dialog';
import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';
import type { IImageObject } from '@/types';

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn: { value: false }, user: { value: null } }),
  useAuth: () => ({ getToken: vi.fn() }),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
    useRoute: () => ({ query: {}, params: {} }),
  };
});

const iconStub = { template: '<i class="fa-stub" />' };

function historyStubs() {
  return {
    CollectionsStrip: { template: '<div class="collections-stub" />' },
    Filter: { template: '<div class="filter-stub" />' },
    ImageActionButtons: { template: '<div class="actions-stub" />' },
    SelectActionButtons: { template: '<div class="bulk-stub" />' },
    FeatureIcon: { template: '<div class="feature-stub" />' },
    ImageDialog: { template: '<div class="dialog-stub" />' },
    'font-awesome-icon': iconStub,
  };
}

function makeItem(overrides: Partial<IImageObject> = {}): IImageObject {
  return {
    _id: 'one',
    prompt: 'A fox in neon rain',
    featureType: 'image',
    isFavorite: false,
    createdAt: '2026-01-02T10:00:00.000Z',
    images: [{ aiImagePublicId: 'pub/fox' }],
    ...overrides,
  } as IImageObject;
}

function seedHistory(items: IImageObject[]) {
  useUserStore().history = items;
}

function mountHistory(props: { isFavorites?: boolean; embedded?: boolean } = {}) {
  return mount(History, {
    props,
    global: { stubs: historyStubs() },
  });
}

describe('History', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows the empty shell without a toolbar when there is no history', () => {
    seedHistory([]);
    const wrapper = mountHistory();
    expect(wrapper.text()).toContain('Nothing here yet');
    expect(wrapper.find('.history-toolbar').exists()).toBe(false);
    expect(wrapper.find('.collections-stub').exists()).toBe(false);
  });

  it('renders assets title, hides it when embedded, and shows Favorites', async () => {
    seedHistory([makeItem()]);
    const wrapper = mountHistory();
    expect(wrapper.text()).toContain('Assets');
    expect(wrapper.find('.collections-stub').exists()).toBe(true);

    await wrapper.setProps({ embedded: true });
    expect(wrapper.find('.history-toolbar__title').exists()).toBe(false);

    await wrapper.setProps({ embedded: false, isFavorites: true });
    expect(wrapper.text()).toContain('Favorites');
    expect(wrapper.find('.collections-stub').exists()).toBe(false);
  });

  it('filters by feature, search, favorites, and collection membership', async () => {
    seedHistory([
      makeItem({
        _id: 'fox',
        prompt: 'A fox in neon rain',
        featureType: 'image',
        isFavorite: true,
      }),
      makeItem({
        _id: 'cat',
        prompt: 'A cat on a windowsill',
        featureType: 'upscale',
        isFavorite: false,
        createdAt: '2026-01-01T10:00:00.000Z',
      }),
    ]);
    const history = useHistoryStore();
    const collections = useCollectionsStore();
    const wrapper = mountHistory();
    expect(wrapper.findAll('.asset-tile')).toHaveLength(2);

    history.selectedFeatureTypes = ['upscale'];
    await flushPromises();
    expect(wrapper.findAll('.asset-tile')).toHaveLength(1);
    expect(wrapper.get('img').attributes('alt')).toContain('A cat');

    history.selectedFeatureTypes = [];
    history.searchQuery = 'fox';
    await flushPromises();
    expect(wrapper.findAll('.asset-tile')).toHaveLength(1);

    history.searchQuery = '   ';
    await wrapper.setProps({ isFavorites: true });
    await flushPromises();
    expect(wrapper.findAll('.asset-tile')).toHaveLength(1);

    await wrapper.setProps({ isFavorites: false });
    collections.collections = [
      { id: 'album', name: 'Album', count: 1, imageIds: ['fox'] } as never,
    ];
    collections.selectedCollectionId = 'album';
    await flushPromises();
    expect(wrapper.findAll('.asset-tile')).toHaveLength(1);

    collections.selectedCollectionId = 'missing';
    await flushPromises();
    expect(wrapper.findAll('.asset-tile')).toHaveLength(0);
    expect(wrapper.text()).toContain('this collection is empty');

    collections.selectedCollectionId = null;
    history.searchQuery = 'no-such-prompt';
    await flushPromises();
    expect(wrapper.text()).toContain('No results match your filters.');
  });

  it('selects and deselects tiles, group-selects, and clears the selection', async () => {
    seedHistory([
      makeItem({ _id: 'a', prompt: 'First' }),
      makeItem({ _id: 'b', prompt: 'Second', createdAt: '2026-01-02T11:00:00.000Z' }),
    ]);
    const wrapper = mountHistory();

    await wrapper.get('[aria-label="Select image"]').trigger('click');
    expect(wrapper.text()).toContain('1 selected');
    expect(wrapper.find('.bulk-stub').exists()).toBe(true);

    await wrapper.get('[aria-label="Deselect image"]').trigger('click');
    expect(wrapper.text()).not.toContain('selected');

    const groupLabel = wrapper.find('[aria-label^="Select all in"]');
    await groupLabel.trigger('click');
    expect(wrapper.text()).toContain('2 selected');

    await groupLabel.trigger('click');
    expect(wrapper.text()).not.toContain('selected');

    await wrapper.get('[aria-label="Select image"]').trigger('click');
    await wrapper.get('[aria-label="Clear selection"]').trigger('click');
    expect(wrapper.text()).not.toContain('selected');
  });

  it('opens the image dialog unless a bulk action is busy', async () => {
    seedHistory([makeItem()]);
    const dialog = useDialogStore();
    const history = useHistoryStore();
    const wrapper = mountHistory();

    await wrapper.get('.asset-tile').trigger('click');
    expect(dialog.showImageDialog).toBe(true);
    expect(dialog.activeImageId).toBe('one');

    dialog.hideImage();
    history.isBulkDeleting = true;
    await wrapper.get('.asset-tile').trigger('click');
    expect(dialog.showImageDialog).toBe(false);

    await wrapper.get('[aria-label="Select image"]').trigger('click');
    expect(wrapper.text()).not.toContain('selected');

    await wrapper.find('[aria-label^="Select all in"]').trigger('click');
    expect(wrapper.text()).not.toContain('selected');
  });

  it('clears the current selection when a bulk flag turns on', async () => {
    seedHistory([makeItem()]);
    const history = useHistoryStore();
    const wrapper = mountHistory();

    await wrapper.get('[aria-label="Select image"]').trigger('click');
    expect(wrapper.text()).toContain('1 selected');

    history.isBulkFavoriting = true;
    await flushPromises();
    expect(wrapper.text()).not.toContain('selected');

    history.isBulkFavoriting = false;
    await wrapper.get('[aria-label="Select image"]').trigger('click');
    history.isBulkDownloading = true;
    await flushPromises();
    expect(wrapper.text()).not.toContain('selected');
  });

  it('builds Cloudinary and fallback image URLs and stacks multiple images', async () => {
    seedHistory([
      makeItem({
        _id: 'cloud',
        images: [{ aiImagePublicId: 'pub/fox' }],
      }),
      makeItem({
        _id: 'enhanced',
        prompt: undefined,
        featureType: 'upscale',
        createdAt: '2026-01-03T10:00:00.000Z',
        images: [{ enhancedPublicId: 'enh/old' }],
      }),
      makeItem({
        _id: 'raw',
        createdAt: '2026-01-04T10:00:00.000Z',
        images: [{ aiImageUrl: 'https://cdn.example.com/raw.jpg' }],
      }),
      makeItem({
        _id: 'enhanced-url',
        createdAt: '2026-01-05T10:00:00.000Z',
        images: [{ enhancedImageUrl: 'https://cdn.example.com/enh.jpg' }],
      }),
      makeItem({
        _id: 'empty',
        createdAt: '2026-01-06T10:00:00.000Z',
        images: [{}],
      }),
      makeItem({
        _id: 'stack',
        createdAt: '2026-01-07T10:00:00.000Z',
        images: [
          { aiImageUrl: 'https://cdn.example.com/1.jpg' },
          { aiImageUrl: 'https://cdn.example.com/2.jpg' },
          { aiImageUrl: 'https://cdn.example.com/3.jpg' },
        ],
      }),
    ]);

    const wrapper = mountHistory();
    const srcs = wrapper.findAll('img').map((img) => img.attributes('src') ?? '');
    expect(srcs.some((src) => src.includes('pub/fox') || src.includes('q_auto,f_auto'))).toBe(true);
    expect(srcs).toContain('https://cdn.example.com/raw.jpg');
    expect(srcs).toContain('https://cdn.example.com/enh.jpg');
    expect(wrapper.find('.multi-image-stack').exists()).toBe(true);
    expect(wrapper.findAll('.multi-image-stack img')).toHaveLength(3);

    const alts = wrapper.findAll('img').map((img) => img.attributes('alt') ?? '');
    expect(alts).toContain('upscale');
  });
});
