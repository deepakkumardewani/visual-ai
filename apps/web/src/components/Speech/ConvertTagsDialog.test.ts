import type { TtsConversion } from '@visual-ai/shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ConvertTagsDialog from '@/components/Speech/ConvertTagsDialog.vue';

import type { PendingSwitch } from '@/composables/useTtsEditor';

const conversion = (overrides: Partial<TtsConversion> = {}): TtsConversion => ({
  doc: [],
  text: '',
  approximated: [],
  dropped: [],
  ...overrides,
});

function mountDialog(pending: PendingSwitch | null) {
  return mount(ConvertTagsDialog, {
    props: { pending },
    global: {
      stubs: { Teleport: true, Transition: false },
      renderStubDefaultSlot: true,
    },
  });
}

describe('ConvertTagsDialog', () => {
  it('renders nothing when there is no pending switch', () => {
    const wrapper = mountDialog(null);
    expect(wrapper.find('[data-testid="convert-tags-dialog"]').exists()).toBe(false);
  });

  it('lists approximated tags with the suggested emotion and removed tags', () => {
    const wrapper = mountDialog({
      target: 'MINIMAX_SPEECH_28_HD',
      conversion: conversion({
        approximated: [
          { type: 'tag', id: 'happy' },
          { type: 'pause', seconds: 2 },
          { type: 'direction', text: 'whisper softly' },
        ],
        dropped: [{ type: 'pause', seconds: 3 }],
        suggestedEmotion: 'happy',
      }),
    });
    expect(wrapper.text()).toContain('Switch to');
    const approximated = wrapper.get('[data-testid="convert-approximated"]');
    expect(approximated.findAll('li')).toHaveLength(3);
    expect(approximated.text()).toContain('pause of 2 s');
    expect(approximated.text()).toContain('direction "whisper softly"');
    expect(approximated.text()).toContain('becomes the Emotion setting: happy');
    expect(wrapper.get('[data-testid="convert-dropped"]').text()).toContain('pause of 3 s');
  });

  it('describes approximated tags without an emotion suggestion', () => {
    const wrapper = mountDialog({
      target: 'MINIMAX_SPEECH_28_HD',
      conversion: conversion({ approximated: [{ type: 'tag', id: 'happy' }] }),
    });
    const item = wrapper.get('[data-testid="convert-approximated"] li');
    expect(item.text()).toBe('happy');
  });

  it('omits sections that have no tags', () => {
    const wrapper = mountDialog({
      target: 'MINIMAX_SPEECH_28_HD',
      conversion: conversion({ dropped: [{ type: 'tag', id: 'happy' }] }),
    });
    expect(wrapper.find('[data-testid="convert-approximated"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="convert-dropped"]').text()).toContain('happy');
  });

  it('emits convert and keep from the action buttons', async () => {
    const wrapper = mountDialog({
      target: 'MINIMAX_SPEECH_28_HD',
      conversion: conversion({ dropped: [{ type: 'pause', seconds: 1 }] }),
    });
    await wrapper.get('[data-testid="convert-apply"]').trigger('click');
    await wrapper.get('[data-testid="convert-keep"]').trigger('click');
    expect(wrapper.emitted('convert')).toHaveLength(1);
    expect(wrapper.emitted('keep')).toHaveLength(1);
  });

  it('keeps the original when the modal is closed', async () => {
    const wrapper = mountDialog({
      target: 'MINIMAX_SPEECH_28_HD',
      conversion: conversion({ dropped: [{ type: 'pause', seconds: 1 }] }),
    });
    await wrapper.get('button[aria-label="Close dialog"]').trigger('click');
    expect(wrapper.emitted('keep')).toHaveLength(1);
    expect(wrapper.emitted('convert')).toBeUndefined();
  });
});
