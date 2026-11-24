import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import ConvertTagsDialog from '@/components/Speech/ConvertTagsDialog.vue';
import SpeechComposer from '@/components/Speech/SpeechComposer.vue';
import SpeechModelSelect from '@/components/Speech/SpeechModelSelect.vue';
import TextAdvisor from '@/components/Speech/TextAdvisor.vue';
import VoiceSelect from '@/components/Speech/VoiceSelect.vue';

import type { TtsEditorApi } from '@/composables/useTtsEditor';

const INWORLD_LIMIT = 2000;

function fakeTts(text: string, overrides: Record<string, unknown> = {}) {
  return {
    text: ref(text),
    doc: ref([{ type: 'text', text }]),
    canUndoConversion: ref(false),
    pendingSwitch: ref(null),
    requestModelSwitch: vi.fn(),
    confirmSwitch: vi.fn(),
    cancelSwitch: vi.fn(),
    undoConversion: vi.fn(),
    ...overrides,
  };
}

function mountComposer(tts: ReturnType<typeof fakeTts>, modelKey = 'INWORLD_TTS_2') {
  return mount(SpeechComposer, {
    props: {
      tts: tts as unknown as TtsEditorApi,
      modelKey: modelKey as 'INWORLD_TTS_2',
      estimated: false,
      voice: 'Ashley',
      'onUpdate:voice': () => undefined,
    },
    global: {
      stubs: {
        TtsEditor: true,
        SpeechModelSelect: true,
        VoiceSelect: true,
        TextAdvisor: true,
        ConvertTagsDialog: true,
      },
    },
  });
}

describe('SpeechComposer', () => {
  it('shows the live character counter against the model limit', () => {
    const wrapper = mountComposer(fakeTts('hello'));
    const counter = wrapper.get('[data-testid="speech-counter"]');
    expect(counter.text()).toBe(`5/${INWORLD_LIMIT.toLocaleString()}`);
    expect(counter.classes()).not.toContain('counter--over');
  });

  it('marks the counter over the limit without truncating the text', () => {
    const tts = fakeTts('a'.repeat(INWORLD_LIMIT + 1));
    const wrapper = mountComposer(tts);
    const counter = wrapper.get('[data-testid="speech-counter"]');
    expect(counter.classes()).toContain('counter--over');
    expect(counter.text()).toBe(
      `${(INWORLD_LIMIT + 1).toLocaleString()}/${INWORLD_LIMIT.toLocaleString()}`,
    );
    expect(tts.text.value).toHaveLength(INWORLD_LIMIT + 1);
  });

  it('treats a model without a text limit as zero', () => {
    const wrapper = mountComposer(fakeTts('x'), 'FLUX_QUICK');
    expect(wrapper.get('[data-testid="speech-counter"]').text()).toBe('1/0');
  });

  it('passes limit, count and estimate state to the advisor', () => {
    const wrapper = mountComposer(fakeTts('hello'));
    const advisor = wrapper.findComponent(TextAdvisor);
    expect(advisor.props()).toMatchObject({
      chars: 5,
      limit: INWORLD_LIMIT,
      estimated: false,
      modelLabel: 'Inworld TTS 2.0',
    });
  });

  it('routes model selection to the editor switch request', () => {
    const tts = fakeTts('hello');
    const wrapper = mountComposer(tts);
    wrapper.findComponent(SpeechModelSelect).vm.$emit('select', 'MINIMAX_SPEECH_28_HD');
    expect(tts.requestModelSwitch).toHaveBeenCalledWith('MINIMAX_SPEECH_28_HD');
  });

  it('hides the converted banner until a conversion can be undone', () => {
    const wrapper = mountComposer(fakeTts('hello'));
    expect(wrapper.find('[data-testid="converted-banner"]').exists()).toBe(false);
  });

  it('shows the converted banner and undoes the conversion', async () => {
    const tts = fakeTts('hello', { canUndoConversion: ref(true) });
    const wrapper = mountComposer(tts);
    const banner = wrapper.get('[data-testid="converted-banner"]');
    expect(banner.text()).toContain('Tags converted for Inworld TTS 2.0.');
    await banner.get('button').trigger('click');
    expect(tts.undoConversion).toHaveBeenCalledTimes(1);
  });

  it('relays voice changes through the voice model', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(SpeechComposer, {
      props: {
        tts: fakeTts('hi') as unknown as TtsEditorApi,
        modelKey: 'INWORLD_TTS_2',
        estimated: false,
        voice: 'Ashley',
        'onUpdate:voice': onUpdate,
      },
      global: {
        stubs: {
          TtsEditor: true,
          SpeechModelSelect: true,
          TextAdvisor: true,
          ConvertTagsDialog: true,
          VoiceSelect: true,
        },
      },
    });
    const select = wrapper.findComponent(VoiceSelect);
    expect(select.props('modelValue')).toBe('Ashley');
    select.vm.$emit('update:modelValue', 'Dennis');
    expect(onUpdate).toHaveBeenCalledWith('Dennis');
  });

  it('wires the dialog convert and keep events to the editor', () => {
    const tts = fakeTts('hello');
    const wrapper = mountComposer(tts);
    const dialog = wrapper.findComponent(ConvertTagsDialog);
    dialog.vm.$emit('convert');
    dialog.vm.$emit('keep');
    expect(tts.confirmSwitch).toHaveBeenCalledTimes(1);
    expect(tts.cancelSwitch).toHaveBeenCalledTimes(1);
  });
});
