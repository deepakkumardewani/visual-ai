import { IMAGE_WATERMARK_POSITIONS, IMAGE_WATERMARK_TEXT_LIMIT } from '@visual-ai/shared';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import WatermarkForm from '@/components/Tools/WatermarkForm.vue';

type Props = {
  image: { uploadId: string; name: string; previewUrl?: string } | null;
  text: string;
  position: (typeof IMAGE_WATERMARK_POSITIONS)[number];
  scale: number;
  opacity: number;
};

let wrapper: VueWrapper | undefined;

function mountForm(overrides: Partial<Props> = {}) {
  wrapper = mount(WatermarkForm, {
    props: {
      image: null,
      text: 'Mine',
      position: 'bottom-right',
      scale: 0.2,
      opacity: 0.5,
      ...overrides,
    } as never,
    global: { stubs: { ToolFileInput: { template: '<div data-testid="file-input-stub" />' } } },
  });
  return wrapper;
}

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
});

describe('WatermarkForm', () => {
  it('shows the text length against the limit', () => {
    expect(mountForm({ text: 'abc' }).text()).toContain(`3/${IMAGE_WATERMARK_TEXT_LIMIT}`);
  });

  it('caps the text input at the limit', () => {
    const input = mountForm().get('[data-testid="watermark-text"]');
    expect(input.attributes('maxlength')).toBe(String(IMAGE_WATERMARK_TEXT_LIMIT));
  });

  it('emits text updates', async () => {
    const w = mountForm();
    await w.get('[data-testid="watermark-text"]').setValue('New');
    expect(w.emitted('update:text')?.[0]).toEqual(['New']);
  });

  it('renders one accessible radio per position with the current one checked', () => {
    const w = mountForm({ position: 'top-left' });
    const radios = w.findAll('[role="radio"]');
    expect(radios).toHaveLength(IMAGE_WATERMARK_POSITIONS.length);
    expect(w.get('[data-testid="watermark-position-top-left"]').attributes('aria-checked')).toBe(
      'true',
    );
    expect(w.get('[data-testid="watermark-position-top-left"]').attributes('aria-label')).toBe(
      'top left',
    );
    expect(w.get('[data-testid="watermark-position-top-right"]').attributes('aria-checked')).toBe(
      'false',
    );
  });

  it('emits the chosen position', async () => {
    const w = mountForm();
    await w.get('[data-testid="watermark-position-top-center"]').trigger('click');
    expect(w.emitted('update:position')?.[0]).toEqual(['top-center']);
  });

  it('emits numeric scale and opacity from the sliders', async () => {
    const w = mountForm();
    await w.get('[data-testid="watermark-scale"]').setValue('0.5');
    await w.get('[data-testid="watermark-opacity"]').setValue('0.9');
    expect(w.emitted('update:scale')?.[0]).toEqual([0.5]);
    expect(w.emitted('update:opacity')?.[0]).toEqual([0.9]);
  });

  it('shows no preview before an image is chosen', () => {
    expect(mountForm().find('[data-testid="watermark-preview"]').exists()).toBe(false);
  });

  it('previews the watermark text over the image at the chosen position', () => {
    const w = mountForm({
      image: { uploadId: 'u', name: 'a.png', previewUrl: 'blob:x' },
      position: 'center',
    } as Partial<Props>);
    expect(w.get('img').attributes('src')).toBe('blob:x');
    const mark = w.get('.preview__mark');
    expect(mark.text()).toBe('Mine');
    expect(mark.classes()).toContain('preview__mark--center');
  });

  it('hides the preview mark when the text is blank', () => {
    const w = mountForm({
      image: { uploadId: 'u', name: 'a.png', previewUrl: 'blob:x' },
      text: '   ',
    });
    expect(w.find('.preview__mark').exists()).toBe(false);
  });
});
