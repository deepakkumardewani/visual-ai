import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResultNextActions from '@/components/Dashboard/Canvas/ResultNextActions.vue';
import { FeatureType, type IImageObject } from '@/types';

const shareLink = vi.fn();
const copyPrompt = vi.fn();
const showToast = vi.fn();
const useAsReference = vi.fn();
const sendToUpscale = vi.fn();
const sendToRemoveBg = vi.fn();
const moreLikeThis = vi.fn();
const downloadImage = vi.fn();

vi.mock('@/composables/useShareActions', () => ({
  useShareActions: () => ({ shareLink, copyPrompt, showToast }),
}));

vi.mock('@/composables/useImageChainActions', () => ({
  useImageChainActions: () => ({ useAsReference, sendToUpscale, sendToRemoveBg, moreLikeThis }),
}));

vi.mock('@/utils/helpers', () => ({
  downloadImage: (...args: unknown[]) => downloadImage(...args),
  getDownloadImageUrl: (image: { aiImageUrl?: string }) => image.aiImageUrl ?? '',
}));

const item: IImageObject = {
  _id: 'gen-1',
  userId: 'user-1',
  prompt: 'Soft morning light on linen',
  featureType: FeatureType.IMAGE,
  images: [
    {
      name: 'frame-1',
      aiImageUrl: 'https://cdn.example.com/frame.jpg',
      resolution: '1k',
      aspectRatio: '1:1',
      width: 1024,
      height: 1024,
      format: 'jpg',
      bytes: 2048,
    },
  ],
};

const stubs = { 'font-awesome-icon': true };

function clickNamed(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper
    .findAll('button')
    .find((btn) => btn.text().includes(label))!
    .trigger('click');
}

describe('ResultNextActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders download, share, and chain actions', () => {
    const wrapper = mount(ResultNextActions, {
      props: { item },
      global: { stubs },
    });

    expect(wrapper.get('[data-testid="result-next-actions"]').text()).toContain('Download');
    expect(wrapper.text()).toContain('Share');
    expect(wrapper.text()).toContain('Copy prompt');
    expect(wrapper.text()).toContain('More like this');
    expect(wrapper.text()).toContain('Use as reference');
    expect(wrapper.text()).toContain('Upscale this');
    expect(wrapper.text()).toContain('Remove background');
  });

  it('hides prompt actions when the prompt is empty', () => {
    const wrapper = mount(ResultNextActions, {
      props: { item: { ...item, prompt: '   ' } },
      global: { stubs },
    });

    expect(wrapper.text()).not.toContain('Copy prompt');
    expect(wrapper.text()).not.toContain('More like this');
  });

  it('invokes download and chain helpers on click', async () => {
    const wrapper = mount(ResultNextActions, {
      props: { item },
      global: { stubs },
    });

    await clickNamed(wrapper, 'Download');
    expect(downloadImage).toHaveBeenCalled();

    await clickNamed(wrapper, 'Use as reference');
    expect(useAsReference).toHaveBeenCalledWith(item.images[0]);

    await clickNamed(wrapper, 'More like this');
    expect(moreLikeThis).toHaveBeenCalledWith(item);
  });

  it('shares, copies the prompt, and sends chain actions', async () => {
    const wrapper = mount(ResultNextActions, {
      props: { item, imageIndex: 0 },
      global: { stubs },
    });

    await clickNamed(wrapper, 'Share');
    expect(shareLink).toHaveBeenCalledWith({
      title: 'Visual AI creation',
      url: 'https://cdn.example.com/frame.jpg',
    });

    await clickNamed(wrapper, 'Copy prompt');
    expect(copyPrompt).toHaveBeenCalledWith(item.prompt);

    await clickNamed(wrapper, 'Upscale this');
    expect(sendToUpscale).toHaveBeenCalledWith(item.images[0]);

    await clickNamed(wrapper, 'Remove background');
    expect(sendToRemoveBg).toHaveBeenCalledWith(item.images[0]);
  });

  it('toasts when there is nothing to download', async () => {
    const wrapper = mount(ResultNextActions, {
      props: { item: { ...item, images: [] } },
      global: { stubs },
    });

    await clickNamed(wrapper, 'Download');
    expect(showToast).toHaveBeenCalledWith('Nothing to download');
    expect(downloadImage).not.toHaveBeenCalled();
  });

  it('shares the current location when no image URL exists', async () => {
    const wrapper = mount(ResultNextActions, {
      props: { item: { ...item, images: [] } },
      global: { stubs },
    });

    await clickNamed(wrapper, 'Share');
    expect(shareLink).toHaveBeenCalledWith({
      title: 'Visual AI creation',
      url: window.location.href,
    });
  });

  it('uses the requested image index when present', async () => {
    const second = {
      ...item.images[0],
      name: 'frame-2',
      aiImageUrl: 'https://cdn.example.com/frame-2.jpg',
    };
    const wrapper = mount(ResultNextActions, {
      props: { item: { ...item, images: [item.images[0], second] }, imageIndex: 1 },
      global: { stubs },
    });

    await clickNamed(wrapper, 'Use as reference');
    expect(useAsReference).toHaveBeenCalledWith(second);
  });

  it('stops click bubbling from the action group', async () => {
    const parentClick = vi.fn();
    const Parent = {
      components: { ResultNextActions },
      template: '<div @click="onClick"><ResultNextActions :item="item" /></div>',
      data: () => ({ item }),
      methods: { onClick: parentClick },
    };

    const wrapper = mount(Parent, { global: { stubs } });
    await wrapper.get('[data-testid="result-next-actions"]').trigger('click');
    expect(parentClick).not.toHaveBeenCalled();
  });
});
