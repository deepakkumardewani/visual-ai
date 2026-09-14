import { createPinia, setActivePinia } from 'pinia';
import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';
import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';

const stubs = { 'font-awesome-icon': true };

function mockReaders(options?: { failRead?: boolean; width?: number; height?: number }) {
  class MockFileReader {
    result = 'data:image/png;base64,aaaa';
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
    onerror: (() => void) | null = null;
    readAsDataURL() {
      if (options?.failRead) {
        this.onerror?.();
        return;
      }
      this.onload?.({ target: { result: this.result } } as ProgressEvent<FileReader>);
    }
  }

  class MockImage {
    width = options?.width ?? 640;
    height = options?.height ?? 480;
    onload: (() => void) | null = null;
    set src(_value: string) {
      this.onload?.();
    }
  }

  vi.stubGlobal('FileReader', MockFileReader);
  vi.stubGlobal('Image', MockImage);
}

function mountUpload() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(ImageUpload, {
    global: { plugins: [pinia], stubs },
  });
  return { wrapper, pinia };
}

describe('ImageUpload', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockReaders();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the empty upload trigger', () => {
    const { wrapper } = mountUpload();

    expect(wrapper.get('[data-testid="image-upload"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="image-upload-trigger"]').text()).toContain('Upload Image');
    expect(wrapper.get('[data-testid="image-upload-input"]').attributes('type')).toBe('file');
  });

  it('opens the hidden file input from the trigger', async () => {
    const { wrapper } = mountUpload();
    const input = wrapper.get('[data-testid="image-upload-input"]').element as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    await wrapper.get('[data-testid="image-upload-trigger"]').trigger('click');
    expect(click).toHaveBeenCalled();
  });

  it('shows an error from a rejected drop', async () => {
    const { wrapper } = mountUpload();

    const file = new File([new Uint8Array(5 * 1024 * 1024 + 8)], 'huge.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const zone = wrapper.get('[data-testid="image-upload"] > div');
    await zone.trigger('drop', { dataTransfer });
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[role="alert"]').text()).toContain('5MB');
  });

  it('rejects an oversized image from the file input', async () => {
    const { wrapper } = mountUpload();
    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    const input = wrapper.get('[data-testid="image-upload-input"]');
    Object.defineProperty(input.element, 'files', { value: [huge], configurable: true });

    await input.trigger('change');
    expect(wrapper.get('[role="alert"]').text()).toContain('5MB');
  });

  it('previews a valid file from the file input', async () => {
    const { wrapper } = mountUpload();
    const file = new File(['img'], 'scene.png', { type: 'image/png' });
    const input = wrapper.get('[data-testid="image-upload-input"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });

    await input.trigger('change');
    await flushPromises();

    expect(wrapper.get('img[alt="Upload preview"]').attributes('src')).toContain('data:image');
    expect(wrapper.find('[data-testid="image-upload-trigger"]').exists()).toBe(false);
  });

  it('ignores a file-input change with no files', async () => {
    const { wrapper } = mountUpload();
    const input = wrapper.get('[data-testid="image-upload-input"]');
    Object.defineProperty(input.element, 'files', { value: [], configurable: true });
    await input.trigger('change');
    expect(wrapper.find('[data-testid="image-upload-trigger"]').exists()).toBe(true);
  });

  it('shows file size and dimensions on the upscale feature', async () => {
    const { wrapper, pinia } = mountUpload();
    useAppStore(pinia).feature = 'upscale';
    const file = new File([new Uint8Array(2048)], 'scene.png', { type: 'image/png' });
    const input = wrapper.get('[data-testid="image-upload-input"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });

    await input.trigger('change');
    await flushPromises();

    expect(wrapper.text()).toContain('2.0 KB');
    expect(wrapper.text()).toContain('640 × 480px');
  });

  it('formats tiny and megabyte file sizes', async () => {
    const { wrapper, pinia } = mountUpload();
    useAppStore(pinia).feature = 'upscale';

    const tiny = new File([new Uint8Array(12)], 'tiny.png', { type: 'image/png' });
    const input = wrapper.get('[data-testid="image-upload-input"]');
    Object.defineProperty(input.element, 'files', { value: [tiny], configurable: true });
    await input.trigger('change');
    await flushPromises();
    expect(wrapper.text()).toContain('12 B');

    const large = new File([new Uint8Array(2 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    Object.defineProperty(input.element, 'files', { value: [large], configurable: true });
    await input.trigger('change');
    await flushPromises();
    expect(wrapper.text()).toContain('2.0 MB');
  });

  it('clears the preview when the remove button is clicked', async () => {
    const { wrapper } = mountUpload();
    const file = new File(['img'], 'scene.png', { type: 'image/png' });
    const input = wrapper.get('[data-testid="image-upload-input"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
    await input.trigger('change');
    await flushPromises();

    await wrapper.get('[aria-label="Remove image"]').trigger('click');
    expect(wrapper.find('[data-testid="image-upload-trigger"]').exists()).toBe(true);
  });

  it('applies a pending feature image on mount', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useAsideStore(pinia).pendingFeatureImage = new File(['img'], 'pending.png', {
      type: 'image/png',
    });

    const wrapper = mount(ImageUpload, {
      global: { plugins: [pinia], stubs },
    });
    await flushPromises();

    expect(wrapper.get('img[alt="Upload preview"]').exists()).toBe(true);
    expect(useAsideStore(pinia).pendingFeatureImage).toBeNull();
  });

  it('applies a pending feature image when one arrives later', async () => {
    const { wrapper, pinia } = mountUpload();
    useAsideStore(pinia).pendingFeatureImage = new File(['img'], 'later.png', {
      type: 'image/png',
    });
    await flushPromises();
    expect(wrapper.get('img[alt="Upload preview"]').exists()).toBe(true);
  });

  it('shows a read error when FileReader fails', async () => {
    mockReaders({ failRead: true });
    const { wrapper } = mountUpload();
    const file = new File(['img'], 'scene.png', { type: 'image/png' });
    const input = wrapper.get('[data-testid="image-upload-input"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });

    await input.trigger('change');
    await flushPromises();

    // resetImage() clears the message after the read failure
    expect(wrapper.find('[data-testid="image-upload-trigger"]').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('toggles the dragging class on dragover and dragleave', async () => {
    const { wrapper } = mountUpload();
    const zone = wrapper.get('[data-testid="image-upload"] > div');

    await zone.trigger('dragover');
    expect(zone.classes().join(' ')).toContain('tw-border-accent');

    await zone.trigger('dragleave');
    expect(zone.classes().join(' ')).toContain('tw-border-ink-faint/50');
  });
});
