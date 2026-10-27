import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ReferenceThumbnails from '@/components/Dashboard/Composer/ReferenceThumbnails.vue';
import type { ReferenceImage } from '@/stores/aside';

const stubs = { 'font-awesome-icon': true };

function refImage(overrides: Partial<ReferenceImage> = {}): ReferenceImage {
  return {
    localId: 'id-1',
    file: new File(['x'], 'scene.png', { type: 'image/png' }),
    previewUrl: 'blob:scene',
    name: 'scene.png',
    ...overrides,
  };
}

describe('ReferenceThumbnails', () => {
  it('renders nothing when there are no images', () => {
    const wrapper = mount(ReferenceThumbnails, {
      props: { images: [] },
      global: { stubs },
    });
    expect(wrapper.find('[data-testid="reference-image-thumbnails"]').exists()).toBe(false);
  });

  it('renders previews and emits remove with the clicked index', async () => {
    const images = [
      refImage({ localId: 'a', name: 'first.png', previewUrl: 'blob:first' }),
      refImage({ localId: 'b', name: 'second.png', previewUrl: 'blob:second' }),
    ];
    const wrapper = mount(ReferenceThumbnails, {
      props: { images },
      global: { stubs },
    });

    expect(wrapper.find('[data-testid="reference-image-preview"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="reference-image-thumbnail"]').length).toBe(1);

    const img = wrapper.get('[data-testid="reference-image-preview"] img');
    expect(img.attributes('alt')).toBe('Reference: first.png');
    expect(img.attributes('src')).toBe('blob:first');

    const removeButtons = wrapper.findAll('[data-testid="reference-image-remove"]');
    expect(removeButtons[1].attributes('aria-label')).toBe('Remove reference image second.png');

    await removeButtons[1].trigger('click');
    expect(wrapper.emitted('remove')?.[0]).toEqual([1]);
  });

  it('exposes remove controls for keyboard focus visibility', () => {
    const wrapper = mount(ReferenceThumbnails, {
      props: { images: [refImage()] },
      global: { stubs },
    });
    const btn = wrapper.get('[data-testid="reference-image-remove"]');
    expect(btn.classes().join(' ')).toContain('focus-visible:tw-opacity-100');
  });
});
