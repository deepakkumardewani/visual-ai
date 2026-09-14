import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import ImageViewer from '@/components/Explore/ImageViewer.vue';
import { useAsideStore } from '@/stores/aside';
import { useExploreStore } from '@/stores/explore';
import type { ExploreFeedItem } from '@/types';

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}));

const transformState = vi.hoisted(() => ({
  isProcessing: false,
  processingLabel: '',
  originalUrl: 'https://cdn.example.com/orig.jpg',
  resultUrl: '',
  hasResult: false,
  resultIsTransparent: false,
  startAction: vi.fn(),
}));

const share = vi.hoisted(() => ({
  showToast: vi.fn(),
  shareLink: vi.fn(),
  copyPrompt: vi.fn(),
}));

const chain = vi.hoisted(() => ({
  useAsReference: vi.fn(),
  sendToUpscale: vi.fn(),
  sendToRemoveBg: vi.fn(),
  confirmChainAction: vi.fn(),
}));

const downloadImage = vi.hoisted(() => vi.fn());
const detectMonochrome = vi.hoisted(() => vi.fn());
const prefetchImageUrls = vi.hoisted(() => vi.fn());
const navHandlers = vi.hoisted(() => ({
  current: null as null | {
    onPrev: () => void;
    onNext: () => void;
    onEscape: () => void;
    onCopyPrompt: () => void;
    onRemix: () => void;
  },
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => router,
    useRoute: () => ({ params: {}, query: {} }),
  };
});

vi.mock('@/composables/useDashboardMotion', () => ({
  useDashboardMotion: () => ({ interactiveTransition: '', pressable: {} }),
}));

vi.mock('@/composables/useExploreViewerNav', () => ({
  prefetchImageUrls: (...args: unknown[]) => prefetchImageUrls(...args),
  useExploreViewerNav: (handlers: (typeof navHandlers)['current']) => {
    navHandlers.current = handlers;
  },
}));

vi.mock('@/composables/useImageChainActions', () => ({
  COLORIZE_ALREADY_COLORED_COPY: 'Already colored',
  useImageChainActions: () => chain,
}));

vi.mock('@/composables/useShareActions', () => ({
  useShareActions: () => share,
}));

vi.mock('@/composables/useViewerTransform', () => ({
  useViewerTransform: () => ({
    isProcessing: ref(transformState.isProcessing),
    processingLabel: ref(transformState.processingLabel),
    originalUrl: ref(transformState.originalUrl),
    resultUrl: ref(transformState.resultUrl),
    hasResult: ref(transformState.hasResult),
    resultIsTransparent: ref(transformState.resultIsTransparent),
    startAction: transformState.startAction,
  }),
}));

vi.mock('@/utils/helpers', () => ({
  downloadImage: (...args: unknown[]) => downloadImage(...args),
}));

vi.mock('@/utils/detectMonochrome', () => ({
  detectMonochrome: (...args: unknown[]) => detectMonochrome(...args),
}));

const item = {
  id: 'img-1',
  prompt: 'Neon alley at night',
  imageUrl: 'https://cdn.example.com/neon.jpg',
  featureType: 'image',
  author: 'Ada Lovelace',
} as ExploreFeedItem;

const itemTwo = {
  ...item,
  id: 'img-2',
  imageUrl: 'https://cdn.example.com/two.jpg',
} as ExploreFeedItem;

const itemThree = {
  ...item,
  id: 'img-3',
  imageUrl: 'https://cdn.example.com/three.jpg',
} as ExploreFeedItem;

const stubs = {
  ViewerDetails: {
    props: ['item', 'processing', 'hasResult', 'detailsOpen'],
    emits: [
      'remix',
      'copy-prompt',
      'download',
      'use-as-reference',
      'upscale',
      'colorize',
      'remove-bg',
      'update:detailsOpen',
    ],
    template: `
      <aside class="details-stub">
        <button data-testid="remix" @click="$emit('remix')" />
        <button data-testid="copy-prompt" @click="$emit('copy-prompt')" />
        <button data-testid="download" @click="$emit('download')" />
        <button data-testid="use-ref" @click="$emit('use-as-reference')" />
        <button data-testid="upscale" @click="$emit('upscale')" />
        <button data-testid="colorize" @click="$emit('colorize')" />
        <button data-testid="remove-bg" @click="$emit('remove-bg')" />
        <button data-testid="toggle-details" @click="$emit('update:detailsOpen', true)" />
      </aside>
    `,
  },
  ViewerFilmstrip: {
    props: ['items', 'activeId'],
    emits: ['select'],
    template:
      '<div class="strip-stub"><button data-testid="select-other" @click="$emit(\'select\', \'img-2\')" /><button data-testid="select-same" @click="$emit(\'select\', \'img-1\')" /></div>',
  },
  ViewerStage: {
    props: ['imageUrl', 'canPrev', 'canNext', 'processing'],
    emits: ['prev', 'next'],
    template:
      '<div class="stage-stub"><button data-testid="prev" @click="$emit(\'prev\')" /><button data-testid="next" @click="$emit(\'next\')" /></div>',
  },
  'font-awesome-icon': true,
};

function mountViewer(
  feed = [item, itemTwo, itemThree],
  activeId = 'img-1',
  extra: Partial<ExploreFeedItem> = {},
) {
  const explore = useExploreStore();
  explore.items = feed as never;
  explore.setActiveId(activeId);
  return mount(ImageViewer, {
    props: { item: { ...item, ...extra } as ExploreFeedItem },
    global: { stubs },
  });
}

describe('ImageViewer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    transformState.isProcessing = false;
    transformState.hasResult = false;
    transformState.resultUrl = '';
    transformState.originalUrl = 'https://cdn.example.com/orig.jpg';
    chain.confirmChainAction.mockResolvedValue(true);
    detectMonochrome.mockResolvedValue(true);
    downloadImage.mockResolvedValue(true);
  });

  it('composes stage and details stubs', () => {
    const wrapper = mountViewer();
    expect(wrapper.find('.stage-stub').exists()).toBe(true);
    expect(wrapper.find('.details-stub').exists()).toBe(true);
  });

  it('navigates previous and next images', async () => {
    const wrapper = mountViewer([item, itemTwo, itemThree], 'img-2');
    await wrapper.get('[data-testid="prev"]').trigger('click');
    await flushPromises();
    expect(router.replace).toHaveBeenCalledWith({ name: 'explore-image', params: { id: 'img-1' } });

    await wrapper.get('[data-testid="next"]').trigger('click');
    await flushPromises();
    expect(router.replace).toHaveBeenLastCalledWith({
      name: 'explore-image',
      params: { id: 'img-2' },
    });
  });

  it('ignores navigation while processing', async () => {
    transformState.isProcessing = true;
    const wrapper = mountViewer([item, itemTwo], 'img-2');
    await wrapper.get('[data-testid="prev"]').trigger('click');
    await wrapper.get('[data-testid="next"]').trigger('click');
    await wrapper.get('[data-testid="select-other"]').trigger('click');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('does not navigate when goPrev or goNext returns null', async () => {
    const wrapper = mountViewer([item], 'img-1');
    await wrapper.get('[data-testid="prev"]').trigger('click');
    await wrapper.get('[data-testid="next"]').trigger('click');
    await flushPromises();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('selects another image and loads more near the end', async () => {
    const explore = useExploreStore();
    const loadMore = vi.spyOn(explore, 'loadMore').mockResolvedValue(undefined);
    explore.nextCursor = 'cursor-2';
    const wrapper = mountViewer([item, itemTwo, itemThree], 'img-1');
    await wrapper.get('[data-testid="select-same"]').trigger('click');
    expect(router.replace).not.toHaveBeenCalled();

    await wrapper.get('[data-testid="select-other"]').trigger('click');
    await flushPromises();
    expect(explore.activeId).toBe('img-2');
    expect(router.replace).toHaveBeenCalledWith({ name: 'explore-image', params: { id: 'img-2' } });
    expect(loadMore).toHaveBeenCalled();
  });

  it('goes back when history has entries', async () => {
    Object.defineProperty(window.history, 'length', { configurable: true, value: 4 });
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="explore-viewer-back"]').trigger('click');
    expect(router.back).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('pushes explore when history is empty', async () => {
    Object.defineProperty(window.history, 'length', { configurable: true, value: 1 });
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="explore-viewer-back"]').trigger('click');
    expect(router.push).toHaveBeenCalledWith({ name: 'explore' });
  });

  it('shares the current page and copies the prompt', async () => {
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="explore-viewer-share"]').trigger('click');
    expect(share.shareLink).toHaveBeenCalledWith({
      title: 'Explore creation',
      url: window.location.href,
    });
    await wrapper.get('[data-testid="copy-prompt"]').trigger('click');
    expect(share.copyPrompt).toHaveBeenCalledWith(item.prompt);
  });

  it('remixes into the create surface', async () => {
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="remix"]').trigger('click');
    expect(useAsideStore().typingPrompt).toBe(item.prompt);
    expect(router.push).toHaveBeenCalled();
  });

  it('toasts when there is nothing to download', async () => {
    const wrapper = mount(ImageViewer, {
      props: { item: { ...item, imageUrl: '' } as ExploreFeedItem },
      global: { stubs },
    });
    await wrapper.get('[data-testid="download"]').trigger('click');
    await flushPromises();
    expect(share.showToast).toHaveBeenCalledWith('Nothing to download');
  });

  it('toasts success when downloading the source image', async () => {
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="download"]').trigger('click');
    await flushPromises();
    expect(downloadImage).toHaveBeenCalled();
    expect(share.showToast).toHaveBeenCalledWith('Image downloaded');
  });

  it('toasts success when downloading a transform result', async () => {
    transformState.hasResult = true;
    transformState.resultUrl = 'https://cdn.example.com/result.png';
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="download"]').trigger('click');
    await flushPromises();
    expect(share.showToast).toHaveBeenCalledWith('Result downloaded');
  });

  it('toasts when download fails', async () => {
    downloadImage.mockResolvedValue(false);
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="download"]').trigger('click');
    await flushPromises();
    expect(share.showToast).toHaveBeenCalledWith('Could not download image');
  });

  it('uses the image as a reference and sends chain tools', async () => {
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="use-ref"]').trigger('click');
    expect(chain.useAsReference).toHaveBeenCalledWith(item.imageUrl, {
      fileName: 'explore-reference-img-1',
      navigateToDashboard: true,
    });
    await wrapper.get('[data-testid="upscale"]').trigger('click');
    expect(chain.sendToUpscale).toHaveBeenCalledWith(item.imageUrl, { navigateToDashboard: true });
    await wrapper.get('[data-testid="remove-bg"]').trigger('click');
    expect(chain.sendToRemoveBg).toHaveBeenCalledWith(item.imageUrl, { navigateToDashboard: true });
  });

  it('colorizes after confirm when the source looks monochrome', async () => {
    detectMonochrome.mockResolvedValue(true);
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="colorize"]').trigger('click');
    await flushPromises();
    expect(chain.confirmChainAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'colorize', extraCopy: undefined }),
    );
    expect(transformState.startAction).toHaveBeenCalledWith('colorize');
  });

  it('warns when the image already looks colored', async () => {
    detectMonochrome.mockResolvedValue(false);
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="colorize"]').trigger('click');
    await flushPromises();
    expect(chain.confirmChainAction).toHaveBeenCalledWith(
      expect.objectContaining({ extraCopy: 'Already colored' }),
    );
  });

  it('treats monochrome detection errors as already colored', async () => {
    detectMonochrome.mockRejectedValue(new Error('decode failed'));
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="colorize"]').trigger('click');
    await flushPromises();
    expect(chain.confirmChainAction).toHaveBeenCalledWith(
      expect.objectContaining({ extraCopy: 'Already colored' }),
    );
  });

  it('does not start colorize when the user cancels', async () => {
    chain.confirmChainAction.mockResolvedValue(false);
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="colorize"]').trigger('click');
    await flushPromises();
    expect(transformState.startAction).not.toHaveBeenCalled();
  });

  it('prefetches neighbor images when the active index is valid', async () => {
    mountViewer([item, itemTwo, itemThree], 'img-2');
    await flushPromises();
    expect(prefetchImageUrls).toHaveBeenCalled();
  });

  it('skips prefetch when there is no active index', async () => {
    prefetchImageUrls.mockClear();
    mount(ImageViewer, {
      props: { item },
      global: { stubs },
    });
    await flushPromises();
    expect(prefetchImageUrls).not.toHaveBeenCalled();
  });

  it('opens the details panel from the child v-model', async () => {
    const wrapper = mountViewer();
    await wrapper.get('[data-testid="toggle-details"]').trigger('click');
    expect(wrapper.find('.details-stub').exists()).toBe(true);
  });

  it('wires keyboard nav handlers to the same actions', async () => {
    Object.defineProperty(window.history, 'length', { configurable: true, value: 3 });
    mountViewer([item, itemTwo, itemThree], 'img-2');
    navHandlers.current?.onPrev();
    navHandlers.current?.onNext();
    navHandlers.current?.onCopyPrompt();
    navHandlers.current?.onRemix();
    navHandlers.current?.onEscape();
    await flushPromises();
    expect(router.replace).toHaveBeenCalled();
    expect(share.copyPrompt).toHaveBeenCalledWith(item.prompt);
    expect(router.push).toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });
});
