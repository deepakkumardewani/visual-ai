import { mount } from '@vue/test-utils';
import { getMediaCreditCost } from '@visual-ai/shared';
import { describe, expect, it } from 'vitest';

import MusicModelSelect from '@/components/Music/MusicModelSelect.vue';

const mountSelect = (modelValue: 'STABLE_AUDIO_25' | 'LYRIA_2' | 'MINIMAX_MUSIC_26' = 'LYRIA_2') =>
  mount(MusicModelSelect, { props: { modelValue } });

describe('MusicModelSelect', () => {
  it('renders the three music models as radios in one group', () => {
    const radios = mountSelect().findAll('input[type="radio"]');
    expect(radios.map((r) => (r.element as HTMLInputElement).value)).toEqual([
      'STABLE_AUDIO_25',
      'LYRIA_2',
      'MINIMAX_MUSIC_26',
    ]);
    expect(new Set(radios.map((r) => r.attributes('name'))).size).toBe(1);
  });

  it('checks only the selected model and highlights it', () => {
    const wrapper = mountSelect('MINIMAX_MUSIC_26');
    const checked = wrapper
      .findAll('input[type="radio"]')
      .map((r) => (r.element as HTMLInputElement).checked);
    expect(checked).toEqual([false, false, true]);
    const options = wrapper.findAll('[data-testid="music-model-option"]');
    expect(options.map((o) => o.classes('model-option--on'))).toEqual([false, false, true]);
  });

  it('shows the per-file credit cost from the shared registry', () => {
    const costs = mountSelect()
      .findAll('[data-testid="music-model-cost"]')
      .map((c) => c.text());
    const keys = ['STABLE_AUDIO_25', 'LYRIA_2', 'MINIMAX_MUSIC_26'] as const;
    keys.forEach((key, i) => {
      expect(costs[i]).toContain(`${getMediaCreditCost(key, { kind: 'file' })} credits`);
    });
    expect(costs[1]).toContain('30 s');
  });

  it('emits the chosen model key', async () => {
    const wrapper = mountSelect('LYRIA_2');
    await wrapper.findAll('input[type="radio"]')[0].setValue();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['STABLE_AUDIO_25']);
  });
});
