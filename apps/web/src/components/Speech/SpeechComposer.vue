<script setup lang="ts">
import { getModelDefinition, type SpeechModelKey } from '@visual-ai/shared';
import { computed } from 'vue';

import ConvertTagsDialog from '@/components/Speech/ConvertTagsDialog.vue';
import SpeechModelSelect from '@/components/Speech/SpeechModelSelect.vue';
import TextAdvisor from '@/components/Speech/TextAdvisor.vue';
import TtsEditor from '@/components/Speech/TtsEditor.vue';
import VoiceSelect from '@/components/Speech/VoiceSelect.vue';

import type { TtsEditorApi } from '@/composables/useTtsEditor';

const props = defineProps<{
  tts: TtsEditorApi;
  modelKey: SpeechModelKey;
  estimated: boolean;
}>();

const voice = defineModel<string>('voice', { required: true });

const model = computed(() => getModelDefinition(props.modelKey));
const limit = computed(() => model.value.media?.textLimit ?? 0);
const chars = computed(() => props.tts.text.value.length);
const isOver = computed(() => chars.value > limit.value);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-6" data-testid="speech-composer">
    <div class="tw-flex tw-flex-col tw-gap-2">
      <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <span class="tw-text-sm tw-font-semibold tw-text-ink-primary">Script</span>
        <span
          class="counter"
          :class="{ 'counter--over': isOver }"
          aria-live="polite"
          data-testid="speech-counter"
        >
          {{ chars.toLocaleString() }}/{{ limit.toLocaleString() }}
        </span>
      </div>
      <TtsEditor :tts="tts" :model-key="modelKey" />
      <TextAdvisor
        :doc="tts.doc.value"
        :chars="chars"
        :limit="limit"
        :estimated="estimated"
        :model-label="model.label"
      />
    </div>

    <SpeechModelSelect :model-value="modelKey" @select="tts.requestModelSwitch" />

    <div
      v-if="tts.canUndoConversion.value"
      class="converted"
      role="status"
      data-testid="converted-banner"
    >
      <span>Tags converted for {{ model.label }}.</span>
      <button type="button" class="converted__undo" @click="tts.undoConversion()">Undo</button>
    </div>

    <VoiceSelect v-model="voice" :model-key="modelKey" />

    <ConvertTagsDialog
      :pending="tts.pendingSwitch.value"
      @convert="tts.confirmSwitch()"
      @keep="tts.cancelSwitch()"
    />
  </div>
</template>

<style scoped lang="scss">
.counter {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--tw-ink-muted));

  &--over {
    color: rgb(var(--tw-danger, 190 40 30));
    font-weight: 600;
  }
}

.converted {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 0.875rem;
  min-height: 44px;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: rgb(var(--tw-ink-primary));

  &__undo {
    min-height: 44px;
    padding: 0 0.75rem;
    color: rgb(var(--studio-accent));
    font-weight: 600;
    text-decoration: underline;

    &:focus-visible {
      outline: 2px solid rgb(var(--studio-accent));
      outline-offset: 2px;
    }
  }
}
</style>
