import { mount } from '@vue/test-utils';
import { MEDIA_PROMPT_MAX_CHARS, type MusicStudioModelKey } from '@visual-ai/shared';
import { describe, expect, it } from 'vitest';

import DurationControl from '@/components/Music/DurationControl.vue';
import MusicComposer from '@/components/Music/MusicComposer.vue';
import MusicModelSelect from '@/components/Music/MusicModelSelect.vue';

const mountComposer = (modelKey: MusicStudioModelKey, prompt = '') =>
  mount(MusicComposer, {
    props: { modelKey, prompt, durationSec: 30, negativePrompt: '', steps: 8, cfgScale: 1 },
  });

describe('MusicComposer', () => {
  it('shows the prompt counter and the model select', () => {
    const wrapper = mountComposer('STABLE_AUDIO_25', 'abc');
    expect(wrapper.text()).toContain(`3/`);
    expect(wrapper.findComponent(MusicModelSelect).exists()).toBe(true);
    expect(wrapper.get('[data-testid="music-prompt"]').attributes('maxlength')).toBeDefined();
  });

  it('fills the prompt from a mood chip and marks it pressed', async () => {
    const wrapper = mountComposer('STABLE_AUDIO_25');
    const chips = wrapper.findAll('[data-testid="music-chip"]');
    expect(chips.length).toBeGreaterThan(0);
    await chips[1].trigger('click');
    const emitted = wrapper.emitted('update:prompt')?.[0]?.[0];
    expect(emitted).toBe(chips[1].text());

    await wrapper.setProps({ prompt: chips[1].text() });
    expect(wrapper.findAll('[data-testid="music-chip"]')[1].attributes('aria-pressed')).toBe(
      'true',
    );
    expect(wrapper.findAll('[data-testid="music-chip"]')[0].attributes('aria-pressed')).toBe(
      'false',
    );
  });

  it('emits prompt edits typed in the textarea', async () => {
    const wrapper = mountComposer('STABLE_AUDIO_25');
    await wrapper.get('[data-testid="music-prompt"]').setValue('warm pads');
    expect(wrapper.emitted('update:prompt')?.[0]).toEqual(['warm pads']);
  });

  it('forwards model changes from the select', async () => {
    const wrapper = mountComposer('STABLE_AUDIO_25');
    await wrapper.findComponent(MusicModelSelect).vm.$emit('update:modelValue', 'LYRIA_2');
    expect(wrapper.emitted('update:modelKey')?.[0]).toEqual(['LYRIA_2']);
  });

  it('shows duration and advanced controls, but no avoid field, for Stable Audio', async () => {
    const wrapper = mountComposer('STABLE_AUDIO_25');
    expect(wrapper.findComponent(DurationControl).exists()).toBe(true);
    expect(wrapper.find('[data-testid="music-avoid"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="music-advanced"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="lyria-hint"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="instrumental-note"]').exists()).toBe(false);

    const [steps, cfg] = wrapper.findAll('[data-testid="music-advanced"] input[type="number"]');
    await steps.setValue('12');
    await cfg.setValue('3');
    expect(wrapper.emitted('update:steps')?.[0]).toEqual([12]);
    expect(wrapper.emitted('update:cfgScale')?.[0]).toEqual([3]);
  });

  it('passes the duration range and relays duration changes', async () => {
    const wrapper = mountComposer('STABLE_AUDIO_25');
    const control = wrapper.findComponent(DurationControl);
    expect(control.props('min')).toBeLessThan(control.props('max'));
    await control.vm.$emit('update:modelValue', 60);
    expect(wrapper.emitted('update:durationSec')?.[0]).toEqual([60]);
  });

  it('shows the avoid field for Lyria and relays its value', async () => {
    const wrapper = mountComposer('LYRIA_2');
    await wrapper.get('[data-testid="music-avoid"]').setValue('drums');
    expect(wrapper.emitted('update:negativePrompt')?.[0]).toEqual(['drums']);
  });

  it('hides duration and advanced for Lyria and shows the English hint', () => {
    const wrapper = mountComposer('LYRIA_2');
    expect(wrapper.findComponent(DurationControl).exists()).toBe(false);
    expect(wrapper.find('[data-testid="music-advanced"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="lyria-hint"]').text()).toContain('English');
  });

  it('shows the instrumental note for Minimax and hides the hint', () => {
    const wrapper = mountComposer('MINIMAX_MUSIC_26');
    expect(wrapper.get('[data-testid="instrumental-note"]').text()).toContain('Instrumental only');
    expect(wrapper.find('[data-testid="lyria-hint"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="music-advanced"]').exists()).toBe(false);
  });

  it('never allows a prompt beyond the shared maximum', () => {
    const max = Number(
      mountComposer('STABLE_AUDIO_25').get('[data-testid="music-prompt"]').attributes('maxlength'),
    );
    expect(max).toBeLessThanOrEqual(MEDIA_PROMPT_MAX_CHARS);
    expect(max).toBeGreaterThan(0);
  });
});
