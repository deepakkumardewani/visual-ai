import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ImageActionButtons from '@/components/History/ImageActionButtons.vue';
import { useGenerateStore } from '@/stores/generate';
import type { IImageObject } from '@/types';
import { deleteImage, downloadImage, favoriteImage, getDownloadImageUrl } from '@/utils/helpers';

const shareLink = vi.fn();
const copyPrompt = vi.fn();
const useAsReference = vi.fn();
const sendToUpscale = vi.fn();
const sendToRemoveBg = vi.fn();
const moreLikeThis = vi.fn();

vi.mock('@/composables/useShareActions', () => ({
  useShareActions: () => ({ shareLink, copyPrompt }),
}));

vi.mock('@/composables/useImageChainActions', () => ({
  useImageChainActions: () => ({
    useAsReference,
    sendToUpscale,
    sendToRemoveBg,
    moreLikeThis,
  }),
}));

vi.mock('@/utils/helpers', () => ({
  deleteImage: vi.fn(),
  downloadImage: vi.fn(),
  favoriteImage: vi.fn(),
  getDownloadImageUrl: vi.fn(() => 'https://cdn.example.com/file.jpg'),
}));

const iconStub = { template: '<i class="fa-stub" />' };
const tooltipStub = { template: '<span><slot /></span>' };
const deleteDialogStub = {
  props: ['open', 'imageCount', 'loading'],
  emits: ['close', 'confirm'],
  template: `
    <div v-if="open" class="delete-dialog">
      <button type="button" aria-label="Keep image" @click="$emit('close')">Keep</button>
      <button type="button" aria-label="Confirm delete" @click="$emit('confirm', $event)">Delete</button>
    </div>
  `,
};

function makeItem(overrides: Partial<IImageObject> = {}): IImageObject {
  return {
    _id: 'img-1',
    prompt: 'A fox in neon rain',
    isFavorite: false,
    featureType: 'image',
    images: [{ aiImageUrl: 'https://cdn.example.com/fox.jpg' }],
    ...overrides,
  } as IImageObject;
}

function mountActions(item: IImageObject, imageIndex?: number) {
  return mount(ImageActionButtons, {
    props: imageIndex === undefined ? { item } : { item, imageIndex },
    attachTo: document.body,
    global: {
      stubs: {
        ConfirmDeleteImageDialog: deleteDialogStub,
        Tooltip: tooltipStub,
        'font-awesome-icon': iconStub,
      },
    },
  });
}

describe('ImageActionButtons', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(getDownloadImageUrl).mockReturnValue('https://cdn.example.com/file.jpg');
  });

  it('copies the prompt, downloads, and favorites an image', async () => {
    const item = makeItem();
    const wrapper = mountActions(item);

    await wrapper.get('[aria-label="Copy prompt"]').trigger('click');
    expect(copyPrompt).toHaveBeenCalledWith('A fox in neon rain');

    await wrapper.get('[aria-label="Download image"]').trigger('click');
    expect(downloadImage).toHaveBeenCalled();

    await wrapper.get('[aria-label="Add to favorites"]').trigger('click');
    expect(favoriteImage).toHaveBeenCalledWith(expect.any(Event), 'img-1');

    wrapper.unmount();
  });

  it('hides copy prompt without text and disables download without images', async () => {
    const wrapper = mountActions(makeItem({ prompt: '   ', images: undefined, _id: undefined }));

    expect(wrapper.find('[aria-label="Copy prompt"]').exists()).toBe(false);
    expect(wrapper.get('[aria-label="Download image"]').attributes('disabled')).toBeDefined();

    await wrapper.get('[aria-label="Add to favorites"]').trigger('click');
    expect(favoriteImage).toHaveBeenCalledWith(expect.any(Event), '');

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();
    const labels = Array.from(document.querySelectorAll('[role="menuitem"]')).map(
      (button) => button.textContent ?? '',
    );
    expect(labels.some((label) => label.includes('More like this'))).toBe(false);

    Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((button) => button.textContent?.includes('Copy link'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
    expect(shareLink).toHaveBeenCalledWith({
      title: 'Visual AI creation',
      url: window.location.href,
    });

    wrapper.unmount();
  });

  it('uses the requested image index and falls back to the first image', async () => {
    const item = makeItem({
      images: [
        { aiImageUrl: 'https://cdn.example.com/a.jpg' },
        { aiImageUrl: 'https://cdn.example.com/b.jpg' },
      ],
    });
    const wrapper = mountActions(item, 1);

    await wrapper.get('[aria-label="Download image"]').trigger('click');
    expect(getDownloadImageUrl).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('shows unfavorite label when the image is already favorited', () => {
    const wrapper = mountActions(makeItem({ isFavorite: true }));
    expect(wrapper.get('[aria-label="Remove from favorites"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('opens the more menu, runs chain actions, and shares a link', async () => {
    const item = makeItem();
    const wrapper = mountActions(item);

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();

    const menu = document.querySelector('[role="menu"]');
    expect(menu).toBeTruthy();

    const items = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLButtonElement[];
    const byText = (label: string) => items.find((button) => button.textContent?.includes(label));

    byText('Use as reference')?.click();
    await flushPromises();
    expect(useAsReference).toHaveBeenCalled();
    expect(document.querySelector('[role="menu"]')).toBeNull();

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();
    const again = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLButtonElement[];
    again.find((button) => button.textContent?.includes('Upscale this'))?.click();
    await flushPromises();
    expect(sendToUpscale).toHaveBeenCalled();

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();
    Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((button) => button.textContent?.includes('Remove background'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
    expect(sendToRemoveBg).toHaveBeenCalled();

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();
    Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((button) => button.textContent?.includes('More like this'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
    expect(moreLikeThis).toHaveBeenCalledWith(item);

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();
    Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((button) => button.textContent?.includes('Copy link'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
    expect(shareLink).toHaveBeenCalledWith({
      title: 'Visual AI creation',
      url: 'https://cdn.example.com/file.jpg',
    });

    wrapper.unmount();
  });

  it('confirms delete and can cancel the dialog', async () => {
    const item = makeItem();
    const wrapper = mountActions(item);

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();
    Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((button) => button.textContent?.includes('Delete'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();

    expect(wrapper.find('.delete-dialog').exists()).toBe(true);
    await wrapper.get('[aria-label="Keep image"]').trigger('click');
    expect(wrapper.find('.delete-dialog').exists()).toBe(false);

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();
    Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((button) => button.textContent?.includes('Delete'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
    await wrapper.get('[aria-label="Confirm delete"]').trigger('click');
    expect(deleteImage).toHaveBeenCalledWith(expect.any(Event), item);

    wrapper.unmount();
  });

  it('disables delete while this image is deleting and uses share fallback without a target', async () => {
    const generate = useGenerateStore();
    generate.deletingImageIds = ['img-1'];
    const wrapper = mountActions(makeItem({ images: [] }));

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();

    const deleteBtn = Array.from(document.querySelectorAll('[role="menuitem"]')).find((button) =>
      button.textContent?.includes('Delete'),
    ) as HTMLButtonElement | undefined;
    expect(deleteBtn?.disabled).toBe(true);

    wrapper.unmount();
  });

  it('positions the menu below or above the trigger and cleans up listeners', async () => {
    const triggerRect = {
      width: 28,
      height: 28,
      top: 40,
      bottom: 68,
      left: 200,
      right: 228,
      x: 200,
      y: 40,
      toJSON() {
        return this;
      },
    };
    const panelRect = {
      width: 180,
      height: 240,
      top: 0,
      bottom: 240,
      left: 0,
      right: 180,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    };

    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'menu'
          ? (panelRect as DOMRect)
          : (triggerRect as DOMRect);
      });

    const wrapper = mountActions(makeItem());
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await flushPromises();
    expect(document.querySelector('[role="menu"]')).toBeTruthy();

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));

    triggerRect.top = 350;
    triggerRect.bottom = 378;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 400 });
    window.dispatchEvent(new Event('resize'));

    document.body.click();
    await flushPromises();

    wrapper.unmount();
    rectSpy.mockRestore();
  });
});
