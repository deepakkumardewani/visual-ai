import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));

import ImageInput from '@/components/Video/ImageInput.vue';

import { useFetch } from '@/composables/useFetch';
import type { UploadedFile } from '@/composables/useToolVideoUpload';

function mountInput(modelValue: UploadedFile | null) {
  const updates: Array<UploadedFile | null> = [];
  const wrapper = mount(ImageInput, {
    props: { modelValue, 'onUpdate:modelValue': (v: UploadedFile | null) => updates.push(v) },
  });
  return { wrapper, updates };
}

describe('ImageInput', () => {
  beforeEach(() => {
    URL.revokeObjectURL = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:thumb');
  });

  it('shows the drop zone with its hint when nothing is attached', () => {
    const { wrapper } = mountInput(null);
    expect(wrapper.text()).toContain('Start image');
    expect(wrapper.text()).toContain('Optional. Drop an image here to animate it.');
    expect(wrapper.get('[data-testid="video-image-input"]').attributes('accept')).toContain(
      'image/png',
    );
  });

  it('shows a thumbnail with a Remove control once attached', async () => {
    const { wrapper, updates } = mountInput({
      uploadId: 'u1',
      name: 'cat.png',
      previewUrl: 'blob:cat',
    });
    expect(wrapper.get('[data-testid="video-image-thumb"]').attributes('src')).toBe('blob:cat');
    await wrapper.get('[data-testid="video-image-remove"]').trigger('click');
    expect(updates).toEqual([null]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cat');
  });

  it('shows the size copy for an oversized file and does not upload it', async () => {
    const { wrapper } = mountInput(null);
    const file = new File([new Uint8Array(4)], 'huge.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    const input = wrapper.get('[data-testid="video-image-input"]');
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="video-image-error"]').text()).toBe(
      'Image must be 10 MB or smaller.',
    );
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('highlights the zone while a file is dragged over it', async () => {
    const { wrapper } = mountInput(null);
    const zone = wrapper.get('.zone');
    await zone.trigger('dragover');
    expect(zone.classes()).toContain('zone--active');
    await zone.trigger('dragleave');
    expect(zone.classes()).not.toContain('zone--active');
  });
});
