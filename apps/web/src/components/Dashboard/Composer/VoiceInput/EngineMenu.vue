<script setup lang="ts">
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { computed, ref } from 'vue';

import type { VoiceEngine } from '@/composables/useVoiceInput';

const props = defineProps<{
  engine: VoiceEngine;
  webSpeechSupported: boolean;
  disabled: boolean;
  menuDisabled: boolean;
}>();

const emit = defineEmits<{
  'update:engine': [engine: VoiceEngine];
}>();

const open = ref(false);

const webSpeechLabel = computed(() =>
  props.webSpeechSupported ? 'Web Speech' : 'Web Speech — Not supported in this browser',
);

function choose(engine: VoiceEngine) {
  if (engine === 'web-speech' && !props.webSpeechSupported) {
    return;
  }
  emit('update:engine', engine);
  open.value = false;
}

function toggleMenu() {
  if (props.menuDisabled) {
    return;
  }
  open.value = !open.value;
}
</script>

<template>
  <div class="tw-relative">
    <button
      type="button"
      data-testid="voice-engine-menu-trigger"
      class="tw-inline-flex tw-min-h-[28px] tw-min-w-[28px] tw-items-center tw-justify-center tw-rounded-md tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      :disabled="menuDisabled"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="Voice input engine"
      @click="toggleMenu"
    >
      <font-awesome-icon :icon="faChevronDown" class="tw-h-3 tw-w-3" aria-hidden="true" />
    </button>

    <div
      v-if="open"
      data-testid="voice-engine-menu"
      role="menu"
      class="tw-absolute tw-right-0 tw-top-full tw-z-20 tw-mt-1 tw-min-w-[220px] tw-rounded-lg tw-border tw-border-hairline tw-bg-surface-1 tw-p-1 tw-shadow-lg"
    >
      <button
        type="button"
        role="menuitemradio"
        data-testid="voice-engine-web-speech"
        class="tw-flex tw-w-full tw-rounded-md tw-px-2 tw-py-1.5 tw-text-left tw-text-caption hover:tw-bg-surface-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        :aria-checked="engine === 'web-speech'"
        :disabled="!webSpeechSupported || disabled"
        @click="choose('web-speech')"
      >
        {{ webSpeechLabel }}
      </button>
      <button
        type="button"
        role="menuitemradio"
        data-testid="voice-engine-grok"
        class="tw-flex tw-w-full tw-rounded-md tw-px-2 tw-py-1.5 tw-text-left tw-text-caption hover:tw-bg-surface-2"
        :aria-checked="engine === 'grok'"
        :disabled="disabled"
        @click="choose('grok')"
      >
        Grok
      </button>
      <p
        class="tw-mx-2 tw-mt-1 tw-border-t tw-border-hairline tw-pt-1 tw-text-eyebrow tw-text-ink-faint"
      >
        Chrome sends Web Speech audio to Google for processing.
      </p>
    </div>
  </div>
</template>
