import { type MaybeRefOrGetter, onBeforeUnmount, onMounted, ref, toValue } from 'vue';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

export type ImageValidationResult = { ok: true; file: File } | { ok: false; error: string };

export function validateImageFile(file: File): ImageValidationResult {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please upload a JPG, PNG, or WEBP image.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Image must be 5MB or smaller.' };
  }
  return { ok: true, file };
}

export function getImageFileFromDataTransfer(dataTransfer: DataTransfer | null): File | null {
  if (!dataTransfer) return null;

  const fromFiles = dataTransfer.files?.[0];
  if (fromFiles?.type.startsWith('image/')) return fromFiles;

  const items = dataTransfer.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }

  return null;
}

export interface UseImageDropOptions {
  onImage: (file: File) => void;
  onError?: (message: string) => void;
  /** When true, accept paste while this composable is mounted (skips non-image pastes). */
  listenPaste?: MaybeRefOrGetter<boolean>;
  enabled?: MaybeRefOrGetter<boolean>;
}

/**
 * Shared drag/drop + clipboard paste handling for image inputs.
 * Validates type/size consistently with the feature file pickers.
 */
export function useImageDrop(options: UseImageDropOptions) {
  const isDragging = ref(false);

  function isEnabled() {
    return options.enabled === undefined ? true : Boolean(toValue(options.enabled));
  }

  function acceptFile(file: File) {
    const result = validateImageFile(file);
    if (!result.ok) {
      options.onError?.(result.error);
      return false;
    }
    options.onImage(result.file);
    return true;
  }

  function handleDragOver(event: DragEvent) {
    if (!isEnabled()) return;
    event.preventDefault();
    isDragging.value = true;
  }

  function handleDragLeave() {
    isDragging.value = false;
  }

  function handleDrop(event: DragEvent) {
    if (!isEnabled()) return;
    event.preventDefault();
    isDragging.value = false;
    const file = getImageFileFromDataTransfer(event.dataTransfer);
    if (file) acceptFile(file);
  }

  function handlePaste(event: ClipboardEvent) {
    if (!isEnabled()) return;
    if (options.listenPaste !== undefined && !toValue(options.listenPaste)) return;

    const file = getImageFileFromDataTransfer(event.clipboardData);
    if (!file) return;

    event.preventDefault();
    acceptFile(file);
  }

  onMounted(() => {
    if (options.listenPaste === undefined) return;
    window.addEventListener('paste', handlePaste);
  });

  onBeforeUnmount(() => {
    if (options.listenPaste === undefined) return;
    window.removeEventListener('paste', handlePaste);
  });

  return {
    isDragging,
    acceptFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
  };
}
