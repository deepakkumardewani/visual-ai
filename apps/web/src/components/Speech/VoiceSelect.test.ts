import type { SpeechModelKey } from '@visual-ai/shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import VoiceSelect from '@/components/Speech/VoiceSelect.vue';

describe('VoiceSelect', () => {
  it('names the new fallback voice in the notice after a model switch', async () => {
    const wrapper = mount(VoiceSelect, {
      props: {
        modelKey: 'INWORLD_TTS_15_MAX' as SpeechModelKey,
        modelValue: 'Ashley',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      },
    });
    await wrapper.setProps({
      modelKey: 'MINIMAX_SPEECH_28_HD' as SpeechModelKey,
      modelValue: 'Ashley',
    });
    await nextTick();
    expect(wrapper.find('[role="status"]').text()).toBe('Voice changed to English_Wiselady');
  });
});
