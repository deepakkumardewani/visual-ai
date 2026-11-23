import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PlayButton from '@/components/Audio/PlayButton.vue';

describe('PlayButton', () => {
  it('defaults to the Play label and an unpressed state', () => {
    const button = mount(PlayButton, { props: { playing: false } }).get('button');

    expect(button.attributes('aria-label')).toBe('Play');
    expect(button.attributes('aria-pressed')).toBe('false');
  });

  it('reflects playing through aria-pressed and swaps the glyph', () => {
    const idle = mount(PlayButton, { props: { playing: false } });
    const playing = mount(PlayButton, { props: { playing: true } });

    expect(playing.get('button').attributes('aria-pressed')).toBe('true');
    expect(playing.get('path').attributes('d')).not.toBe(idle.get('path').attributes('d'));
  });

  it('uses a custom label', () => {
    const button = mount(PlayButton, { props: { playing: false, label: 'Tap to play' } });

    expect(button.get('button').attributes('aria-label')).toBe('Tap to play');
  });

  it('emits toggle on click', async () => {
    const wrapper = mount(PlayButton, { props: { playing: false } });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });
});
