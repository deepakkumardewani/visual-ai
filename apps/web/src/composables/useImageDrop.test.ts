import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import {
  ACCEPTED_IMAGE_ACCEPT,
  getImageFileFromDataTransfer,
  MAX_IMAGE_BYTES,
  useImageDrop,
  validateImageFile,
} from '@/composables/useImageDrop';

function imageFile(name = 'shot.png', type = 'image/png', size = 1024) {
  const file = new File([new Uint8Array(size)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function setupDrop(options: Parameters<typeof useImageDrop>[0]) {
  let result: ReturnType<typeof useImageDrop>;
  const wrapper = mount({
    setup() {
      result = useImageDrop(options);
      return {};
    },
    template: '<div />',
  });
  return { drop: result!, wrapper };
}

describe('validateImageFile', () => {
  it('rejects non-images and oversized files', () => {
    expect(validateImageFile(imageFile('notes.txt', 'text/plain')).ok).toBe(false);
    expect(validateImageFile(imageFile('huge.png', 'image/png', MAX_IMAGE_BYTES + 1)).ok).toBe(
      false,
    );
    expect(validateImageFile(imageFile()).ok).toBe(true);
    expect(ACCEPTED_IMAGE_ACCEPT).toContain('image/png');
  });
});

describe('getImageFileFromDataTransfer', () => {
  it('reads the first image from files or items', () => {
    expect(getImageFileFromDataTransfer(null)).toBeNull();

    const file = imageFile();
    const fromFiles = {
      files: [file] as unknown as FileList,
      items: [] as unknown as DataTransferItemList,
    } as DataTransfer;
    expect(getImageFileFromDataTransfer(fromFiles)).toBe(file);

    const fromItems = {
      files: [] as unknown as FileList,
      items: [
        { kind: 'file', type: 'image/jpeg', getAsFile: () => file },
      ] as unknown as DataTransferItemList,
    } as DataTransfer;
    expect(getImageFileFromDataTransfer(fromItems)).toBe(file);

    expect(
      getImageFileFromDataTransfer({
        files: [] as unknown as FileList,
      } as DataTransfer),
    ).toBeNull();

    expect(
      getImageFileFromDataTransfer({
        files: [] as unknown as FileList,
        items: [
          { kind: 'string', type: 'text/plain', getAsFile: () => null },
          { kind: 'file', type: 'application/pdf', getAsFile: () => file },
        ] as unknown as DataTransferItemList,
      } as DataTransfer),
    ).toBeNull();
  });
});

describe('useImageDrop', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks drag state and accepts a valid drop', () => {
    const onImage = vi.fn();
    const { drop } = setupDrop({ onImage });
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [imageFile()], items: [] },
    } as unknown as DragEvent;

    drop.handleDragOver(event);
    expect(drop.isDragging.value).toBe(true);
    drop.handleDragLeave();
    expect(drop.isDragging.value).toBe(false);

    drop.handleDrop(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(onImage).toHaveBeenCalledTimes(1);
    expect(drop.isDragging.value).toBe(false);
  });

  it('reports validation errors and respects enabled/paste flags', () => {
    const onImage = vi.fn();
    const onError = vi.fn();
    const listenPaste = ref(true);
    const enabled = ref(true);
    const { drop, wrapper } = setupDrop({ onImage, onError, listenPaste, enabled });

    drop.acceptFile(imageFile('doc.pdf', 'application/pdf'));
    expect(onError).toHaveBeenCalledWith('Please upload a JPG, PNG, or WEBP image.');
    expect(onImage).not.toHaveBeenCalled();

    enabled.value = false;
    drop.handleDrop({
      preventDefault: vi.fn(),
      dataTransfer: { files: [imageFile()], items: [] },
    } as unknown as DragEvent);
    expect(onImage).not.toHaveBeenCalled();

    enabled.value = true;
    listenPaste.value = false;
    drop.handlePaste({
      preventDefault: vi.fn(),
      clipboardData: { files: [imageFile()], items: [] },
    } as unknown as ClipboardEvent);
    expect(onImage).not.toHaveBeenCalled();

    listenPaste.value = true;
    drop.handlePaste({
      preventDefault: vi.fn(),
      clipboardData: { files: [imageFile()], items: [] },
    } as unknown as ClipboardEvent);
    expect(onImage).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('skips drop and paste when there is no image file', () => {
    const onImage = vi.fn();
    const { drop } = setupDrop({ onImage });
    const empty = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [], items: [] },
      clipboardData: { files: [], items: [] },
    } as unknown as DragEvent & ClipboardEvent;

    drop.handleDrop(empty);
    drop.handlePaste(empty);
    expect(onImage).not.toHaveBeenCalled();
  });

  it('does not listen for paste unless listenPaste is provided', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const onImage = vi.fn();
    const enabled = ref(false);
    const { drop, wrapper } = setupDrop({ onImage, enabled });

    expect(add.mock.calls.some((call) => call[0] === 'paste')).toBe(false);

    drop.handleDragOver({ preventDefault: vi.fn() } as unknown as DragEvent);
    drop.handleDrop({
      preventDefault: vi.fn(),
      dataTransfer: { files: [imageFile()], items: [] },
    } as unknown as DragEvent);
    drop.handlePaste({
      preventDefault: vi.fn(),
      clipboardData: { files: [imageFile()], items: [] },
    } as unknown as ClipboardEvent);
    expect(onImage).not.toHaveBeenCalled();

    drop.acceptFile(imageFile('doc.pdf', 'application/pdf'));
    wrapper.unmount();
  });
});
