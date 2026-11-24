import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));

import AudioInput from '@/components/Video/AudioInput.vue';

import { useFetch } from '@/composables/useFetch';
import type { UploadedFile } from '@/composables/useToolVideoUpload';

function mountInput(modelValue: UploadedFile | null) {
  const updates: Array<UploadedFile | null> = [];
  const wrapper = mount(AudioInput, {
    props: { modelValue, 'onUpdate:modelValue': (v: UploadedFile | null) => updates.push(v) },
  });
  return { wrapper, updates };
}

describe('AudioInput', () => {
  it('shows the empty drop zone with the 20 second hint', () => {
    const { wrapper } = mountInput(null);
    expect(wrapper.text()).toContain('Audio track');
    expect(wrapper.text()).toContain('up to 20 seconds');
  });

  it('shows the rounded duration for an attached track and removes it', async () => {
    const { wrapper, updates } = mountInput({
      uploadId: 'a1',
      name: 'beat.mp3',
      durationSec: 12.6,
    });
    expect(wrapper.get('[data-testid="video-audio-detail"]').text()).toBe('13 s');
    await wrapper.get('[data-testid="video-audio-remove"]').trigger('click');
    expect(updates).toEqual([null]);
  });

  it('shows no duration detail when the server returned none', () => {
    const { wrapper } = mountInput({ uploadId: 'a1', name: 'beat.mp3' });
    expect(wrapper.find('[data-testid="video-audio-detail"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('beat.mp3');
  });

  it('rejects audio over 20 MB with the exact copy and never uploads', async () => {
    const { wrapper } = mountInput(null);
    const file = new File([new Uint8Array(4)], 'long.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 + 1 });
    const input = wrapper.get('[data-testid="video-audio-input"]');
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="video-audio-error"]').text()).toBe(
      'Audio must be 20 MB or smaller.',
    );
    expect(useFetch).not.toHaveBeenCalled();
  });
});
