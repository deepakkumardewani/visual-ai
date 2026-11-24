import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));

import AudioInput from '@/components/Video/AudioInput.vue';
import ImageInput from '@/components/Video/ImageInput.vue';
import VideoComposer from '@/components/Video/VideoComposer.vue';
import VideoSettings from '@/components/Video/VideoSettings.vue';

import type { UploadedFile } from '@/composables/useToolVideoUpload';

function mountComposer(
  overrides: Partial<{
    modelKey: string;
    prompt: string;
    audio: UploadedFile | null;
    image: UploadedFile | null;
  }> = {},
) {
  const updates: Record<string, unknown[]> = {};
  const track = (name: string) => (value: unknown) => (updates[name] ??= []).push(value);
  const wrapper = mount(VideoComposer, {
    props: {
      modelKey: 'P_VIDEO',
      prompt: '',
      durationSec: 5,
      resolution: '720p',
      image: null,
      audio: null,
      'onUpdate:prompt': track('prompt'),
      'onUpdate:modelKey': track('modelKey'),
      'onUpdate:durationSec': track('durationSec'),
      'onUpdate:resolution': track('resolution'),
      'onUpdate:image': track('image'),
      'onUpdate:audio': track('audio'),
      ...overrides,
    } as never,
  });
  return { wrapper, updates };
}

describe('VideoComposer', () => {
  it('labels the prompt field and shows the live counter', () => {
    const { wrapper } = mountComposer({ prompt: 'a fox' });
    const textarea = wrapper.get('[data-testid="video-prompt"]');
    expect(wrapper.get('label[for="video-prompt"]').text()).toBe('Describe the scene');
    expect(textarea.attributes('id')).toBe('video-prompt');
    expect(wrapper.text()).toContain('5/');
  });

  it('emits prompt updates as the user types', async () => {
    const { wrapper, updates } = mountComposer();
    await wrapper.get('[data-testid="video-prompt"]').setValue('a red kite');
    expect(updates.prompt).toEqual(['a red kite']);
  });

  it('always offers the start image input and passes audio-driven to settings', () => {
    const { wrapper } = mountComposer();
    expect(wrapper.find('[data-testid="video-image"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="video-settings"]').exists()).toBe(true);
  });

  it('shows the audio input only for a model that accepts audio', () => {
    const withAudio = mountComposer({ modelKey: 'P_VIDEO' });
    const without = mountComposer({ modelKey: 'WAN_3' });
    const flags = [
      withAudio.wrapper.find('[data-testid="video-audio"]').exists(),
      without.wrapper.find('[data-testid="video-audio"]').exists(),
    ];
    expect(flags).toEqual([true, false]);
  });

  it('hides the audio input for a model the studio does not serve', () => {
    const { wrapper } = mountComposer({ modelKey: 'NOT_A_MODEL' });
    expect(wrapper.find('[data-testid="video-audio"]').exists()).toBe(false);
  });

  it('renders an attached audio track', () => {
    const { wrapper } = mountComposer({
      audio: { uploadId: 'a', name: 'beat.mp3', durationSec: 8 },
    });
    expect(wrapper.get('[data-testid="video-audio-detail"]').text()).toBe('8 s');
  });

  it('forwards settings changes to its own models', async () => {
    const { wrapper, updates } = mountComposer();
    const settings = wrapper.getComponent(VideoSettings);
    await settings.vm.$emit('update:modelKey', 'WAN_3');
    await settings.vm.$emit('update:durationSec', 8);
    await settings.vm.$emit('update:resolution', '1080p');
    expect(updates.modelKey).toEqual(['WAN_3']);
    expect(updates.durationSec).toEqual([8]);
    expect(updates.resolution).toEqual(['1080p']);
  });

  it('forwards image and audio attachment changes', async () => {
    const { wrapper, updates } = mountComposer({ modelKey: 'P_VIDEO' });
    const file = { uploadId: 'i1', name: 'a.png' };
    await wrapper.getComponent(ImageInput).vm.$emit('update:modelValue', file);
    expect(updates.image).toEqual([file]);
    const audioFile = { uploadId: 'a1', name: 'a.mp3' };
    await wrapper.getComponent(AudioInput).vm.$emit('update:modelValue', audioFile);
    expect(updates.audio).toEqual([audioFile]);
  });
});
