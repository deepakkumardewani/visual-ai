import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteImage = vi.fn();
const downloadImage = vi.fn();
const favoriteImage = vi.fn();
const copyPrompt = vi.fn();
const shareLink = vi.fn();
const useAsReference = vi.fn();
const sendToUpscale = vi.fn();
const sendToRemoveBg = vi.fn();
const moreLikeThis = vi.fn();
const getDownloadImageUrl = vi.fn(() => 'https://cdn.example/dl.png');

vi.mock('@/utils/helpers', () => ({
  deleteImage: (...args: unknown[]) => deleteImage(...args),
  downloadImage: (...args: unknown[]) => downloadImage(...args),
  favoriteImage: (...args: unknown[]) => favoriteImage(...args),
  getDownloadImageUrl: (...args: unknown[]) => getDownloadImageUrl(...args),
}));

vi.mock('@/composables/useShareActions', () => ({
  useShareActions: () => ({
    shareLink: (...args: unknown[]) => shareLink(...args),
    copyPrompt: (...args: unknown[]) => copyPrompt(...args),
  }),
}));

vi.mock('@/composables/useImageChainActions', () => ({
  useImageChainActions: () => ({
    useAsReference: (...args: unknown[]) => useAsReference(...args),
    sendToUpscale: (...args: unknown[]) => sendToUpscale(...args),
    sendToRemoveBg: (...args: unknown[]) => sendToRemoveBg(...args),
    moreLikeThis: (...args: unknown[]) => moreLikeThis(...args),
  }),
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useMediaQuery: () => ({ value: false }),
  };
});

import ImageDialog from '@/components/Dialogs/ImageDialog.vue';
import { FeatureType } from '@/types';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

const stubs = {
  AppModal: {
    props: ['open'],
    emits: ['close'],
    template:
      '<div v-if="open" data-testid="app-modal"><button data-testid="modal-close" @click="$emit(\'close\')" /><slot name="title" /><slot /><slot name="actions" /></div>',
  },
  ConfirmDeleteImageDialog: {
    props: ['open', 'loading'],
    emits: ['close', 'confirm'],
    template:
      '<div data-testid="confirm-delete" :data-open="open"><button data-testid="confirm-delete-btn" @click="$emit(\'confirm\', $event)">Delete</button><button data-testid="close-delete-btn" @click="$emit(\'close\')">Cancel</button></div>',
  },
  SideBySide: { template: '<div data-testid="side-by-side" />' },
  'font-awesome-icon': true,
};

const sampleItem = {
  _id: 'img-1',
  featureType: FeatureType.IMAGE,
  prompt: 'A red fox in snow',
  modelName: 'flux',
  isFavorite: false,
  images: [
    {
      aiImageUrl: 'https://cdn.example/fox.png',
      aiImagePublicId: '',
      aspectRatio: '1:1',
      width: 1024,
      height: 1024,
    },
  ],
};

function openDialog(item: Record<string, unknown> = sampleItem) {
  const dialogStore = useDialogStore();
  dialogStore.showImage(item._id as string);
  return mount(ImageDialog, {
    props: { item: item as never },
    global: { stubs },
  });
}

describe('ImageDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    deleteImage.mockReset();
    downloadImage.mockReset();
    favoriteImage.mockReset();
    copyPrompt.mockReset();
    shareLink.mockReset();
    useAsReference.mockReset();
    sendToUpscale.mockReset();
    sendToRemoveBg.mockReset();
    moreLikeThis.mockReset();
    getDownloadImageUrl.mockReset();
    getDownloadImageUrl.mockReturnValue('https://cdn.example/dl.png');
  });

  it('does not open when item is missing', () => {
    const dialogStore = useDialogStore();
    dialogStore.showImage('img-1');
    const wrapper = mount(ImageDialog, {
      props: { item: undefined },
      global: { stubs },
    });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('opens for the active image and shows prompt', () => {
    const userStore = useUserStore();
    userStore.history = [sampleItem] as never;
    const dialogStore = useDialogStore();
    dialogStore.showImage('img-1');

    const wrapper = mount(ImageDialog, {
      props: { item: sampleItem as never },
      global: { stubs },
    });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('A red fox in snow');
  });

  it('closes from the toolbar close button', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showImage('img-1');
    const wrapper = mount(ImageDialog, {
      props: { item: sampleItem as never },
      global: { stubs },
    });
    await wrapper.get('[aria-label="Close"]').trigger('click');
    expect(dialogStore.showImageDialog).toBe(false);
  });

  it('copies the prompt when available', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showImage('img-1');
    const wrapper = mount(ImageDialog, {
      props: { item: sampleItem as never },
      global: { stubs },
    });
    await wrapper.get('[aria-label="Copy prompt"]').trigger('click');
    expect(copyPrompt).toHaveBeenCalledWith('A red fox in snow');
  });

  it('opens delete confirm then confirms delete', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showImage('img-1');
    const wrapper = mount(ImageDialog, {
      props: { item: sampleItem as never },
      global: { stubs },
    });
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await wrapper.find('.chain-menu__item--danger').trigger('click');
    expect(wrapper.get('[data-testid="confirm-delete"]').attributes('data-open')).toBe('true');
    await wrapper.get('[data-testid="confirm-delete-btn"]').trigger('click');
    expect(deleteImage).toHaveBeenCalled();
  });

  it('closes delete confirm without deleting', async () => {
    const wrapper = openDialog();
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await wrapper.find('.chain-menu__item--danger').trigger('click');
    await wrapper.get('[data-testid="close-delete-btn"]').trigger('click');
    expect(wrapper.get('[data-testid="confirm-delete"]').attributes('data-open')).toBe('false');
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it('skips confirm delete when the item is missing', async () => {
    const wrapper = mount(ImageDialog, {
      props: { item: undefined },
      global: { stubs },
    });
    await wrapper.get('[data-testid="confirm-delete-btn"]').trigger('click');
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it('closes from the modal overlay', async () => {
    const wrapper = openDialog();
    await wrapper.get('[data-testid="modal-close"]').trigger('click');
    expect(useDialogStore().showImageDialog).toBe(false);
  });

  it('downloads the first image for an image feature', async () => {
    const wrapper = openDialog();
    await wrapper.get('[aria-label="Download"]').trigger('click');
    expect(downloadImage).toHaveBeenCalled();
  });

  it('skips image download when the gallery has no image at the index', async () => {
    const wrapper = openDialog({
      ...sampleItem,
      images: [],
    });
    await wrapper.get('[aria-label="Download"]').trigger('click');
    expect(downloadImage).not.toHaveBeenCalled();
  });

  it('downloads the enhance url for non-image features', async () => {
    const wrapper = openDialog({
      ...sampleItem,
      featureType: FeatureType.UPSCALE,
      images: [
        {
          enhancedPublicId: 'folder/enhanced',
          originalPublicId: 'folder/original',
          originalImageUrl: 'https://cdn.example/orig.png',
        },
      ],
    });
    expect(wrapper.find('[data-testid="side-by-side"]').exists()).toBe(true);
    await wrapper.get('[aria-label="Download"]').trigger('click');
    expect(downloadImage).toHaveBeenCalled();
  });

  it('skips enhance download when no download url exists', async () => {
    getDownloadImageUrl.mockReturnValue('');
    const wrapper = openDialog({
      ...sampleItem,
      featureType: FeatureType.COLORIZE,
      images: [{ enhancedImageUrl: '' }],
    });
    await wrapper.get('[aria-label="Download"]').trigger('click');
    expect(downloadImage).not.toHaveBeenCalled();
  });

  it('favorites the open image', async () => {
    const wrapper = openDialog();
    await wrapper.get('[aria-label="Add to favorites"]').trigger('click');
    expect(favoriteImage).toHaveBeenCalledWith(expect.anything(), 'img-1');
  });

  it('copies the share link from the chain menu', async () => {
    const wrapper = openDialog();
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    const items = wrapper.findAll('[role="menuitem"]');
    const copyLink = items.find((item) => item.text().includes('Copy link'));
    await copyLink!.trigger('click');
    expect(shareLink).toHaveBeenCalledWith({
      title: 'Visual AI creation',
      url: 'https://cdn.example/dl.png',
    });
  });

  it('falls back to the window location when no enhance url exists', async () => {
    getDownloadImageUrl.mockReturnValue('');
    const wrapper = openDialog({
      ...sampleItem,
      featureType: FeatureType.REVIVE,
      images: [{}],
    });
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    const items = wrapper.findAll('[role="menuitem"]');
    await items.find((item) => item.text().includes('Copy link'))!.trigger('click');
    expect(shareLink).toHaveBeenCalledWith({
      title: 'Visual AI creation',
      url: window.location.href,
    });
  });

  async function runMenuItem(label: string) {
    const wrapper = openDialog();
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await wrapper
      .findAll('[role="menuitem"]')
      .find((item) => item.text().includes(label))!
      .trigger('click');
    wrapper.unmount();
  }

  it('runs chain actions and hides the dialog on success', async () => {
    useAsReference.mockResolvedValue(true);
    sendToUpscale.mockResolvedValue(true);
    sendToRemoveBg.mockResolvedValue(true);
    moreLikeThis.mockResolvedValue(true);

    await runMenuItem('Use as reference');
    expect(useAsReference).toHaveBeenCalled();
    expect(useDialogStore().showImageDialog).toBe(false);

    await runMenuItem('Upscale this');
    expect(sendToUpscale).toHaveBeenCalled();

    await runMenuItem('Remove background');
    expect(sendToRemoveBg).toHaveBeenCalled();

    await runMenuItem('More like this');
    expect(moreLikeThis).toHaveBeenCalled();
  });

  it('keeps the dialog open when a chain action is cancelled', async () => {
    useAsReference.mockResolvedValue(false);
    const wrapper = openDialog();
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await wrapper.findAll('[role="menuitem"]')[0].trigger('click');
    expect(useDialogStore().showImageDialog).toBe(true);
  });

  it('toggles the chain menu closed on a second click', async () => {
    const wrapper = openDialog();
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(true);
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });

  it('closes the chain menu on outside click', async () => {
    const wrapper = openDialog({ attachTo: document.body } as never);
    const dialogStore = useDialogStore();
    dialogStore.showImage('img-1');
    const mounted = mount(ImageDialog, {
      props: { item: sampleItem as never },
      global: { stubs },
      attachTo: document.body,
    });
    await mounted.get('[aria-label="More actions"]').trigger('click');
    expect(mounted.find('[role="menu"]').exists()).toBe(true);
    document.body.click();
    await mounted.vm.$nextTick();
    expect(mounted.find('[role="menu"]').exists()).toBe(false);
    mounted.unmount();
    wrapper.unmount();
  });

  it('builds cloudinary urls and gallery layouts for 2, 3, and 4 images', () => {
    const two = openDialog({
      ...sampleItem,
      images: [
        { aiImagePublicId: 'pub/a', aiImageUrl: 'https://cdn.example/a.png' },
        { aiImageUrl: 'https://cdn.example/b.png' },
      ],
    });
    expect(two.find('.image-dialog__gallery--two').exists()).toBe(true);
    expect(two.find('img').attributes('src')).toContain('pub/a');

    const three = openDialog({
      ...sampleItem,
      _id: 'img-3',
      images: [{}, {}, {}],
    });
    useDialogStore().showImage('img-3');
    expect(three.find('.image-dialog__gallery--three').exists()).toBe(true);

    const four = openDialog({
      ...sampleItem,
      _id: 'img-4',
      images: [{}, {}, {}, {}],
    });
    useDialogStore().showImage('img-4');
    expect(four.find('.image-dialog__gallery--grid').exists()).toBe(true);
  });

  it('prefers remote originals and png transforms for remove-bg', () => {
    const wrapper = openDialog({
      ...sampleItem,
      featureType: FeatureType.REMOVE_BG,
      images: [
        {
          originalPublicId: 'local-id',
          originalImageUrl: 'https://cdn.example/remote-orig.png',
          enhancedPublicId: 'enh/id',
        },
      ],
    });
    expect(wrapper.find('[data-testid="side-by-side"]').exists()).toBe(true);
  });

  it('uses slash-containing original public ids before remote urls', () => {
    const wrapper = openDialog({
      ...sampleItem,
      featureType: FeatureType.UPSCALE,
      images: [
        {
          originalPublicId: 'folder/orig',
          originalImageUrl: '/uploads/multer-file.png',
          enhancedImageUrl: 'https://cdn.example/enhanced.png',
        },
      ],
    });
    expect(wrapper.find('[data-testid="side-by-side"]').exists()).toBe(true);
  });

  it('builds an original url from a public id without slashes', () => {
    const wrapper = openDialog({
      ...sampleItem,
      featureType: FeatureType.REVIVE,
      images: [
        {
          originalPublicId: 'origid',
          originalImageUrl: 'not-a-url',
          enhancedImageUrl: 'https://cdn.example/enhanced.png',
        },
      ],
    });
    expect(wrapper.find('[data-testid="side-by-side"]').exists()).toBe(true);
  });

  it('returns empty original and enhanced urls when the image is missing', () => {
    const wrapper = openDialog({
      ...sampleItem,
      featureType: FeatureType.COLORIZE,
      images: undefined,
    });
    expect(wrapper.find('[data-testid="side-by-side"]').exists()).toBe(true);
  });

  it('syncs favorite state from history and resets delete on item change', async () => {
    const userStore = useUserStore();
    userStore.history = [{ ...sampleItem, isFavorite: true }] as never;
    const wrapper = openDialog();
    expect(wrapper.get('[aria-label="Remove from favorites"]').exists()).toBe(true);

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await wrapper.find('.chain-menu__item--danger').trigger('click');
    expect(wrapper.get('[data-testid="confirm-delete"]').attributes('data-open')).toBe('true');

    userStore.history = [{ ...sampleItem, isFavorite: false }] as never;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[aria-label="Add to favorites"]').exists()).toBe(true);

    await wrapper.setProps({
      item: { ...sampleItem, _id: 'img-2', prompt: '  ', images: [] } as never,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="confirm-delete"]').attributes('data-open')).toBe('false');
  });

  it('clears delete confirm when the dialog is closed', async () => {
    const wrapper = openDialog();
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    await wrapper.find('.chain-menu__item--danger').trigger('click');
    useDialogStore().hideImage();
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="confirm-delete"]').attributes('data-open')).toBe('false');
  });

  it('does not copy an empty prompt', async () => {
    const wrapper = openDialog({ ...sampleItem, prompt: '' });
    expect(wrapper.find('[aria-label="Copy prompt"]').exists()).toBe(false);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    expect(wrapper.text()).not.toContain('More like this');
  });

  it('hides optional chips and disables actions while busy', async () => {
    const generateStore = useGenerateStore();
    generateStore.isFavoriting = true;
    generateStore.isDeleting = true;
    const wrapper = openDialog({
      ...sampleItem,
      modelName: '',
      images: [{ aiImageUrl: 'https://cdn.example/fox.png' }],
    });
    expect(wrapper.find('.chip').exists()).toBe(false);
    expect(wrapper.get('[aria-label="Add to favorites"]').attributes('disabled')).toBeDefined();
    await wrapper.get('[aria-label="More actions"]').trigger('click');
    expect(wrapper.find('.chain-menu__item--danger').attributes('disabled')).toBeDefined();
  });

  it('treats a missing history favorite flag as false', async () => {
    const userStore = useUserStore();
    userStore.history = [{ _id: 'img-1' }] as never;
    const wrapper = openDialog();
    expect(wrapper.get('[aria-label="Add to favorites"]').exists()).toBe(true);
  });
});
