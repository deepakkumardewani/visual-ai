<script setup lang="ts">
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { inject, onMounted, onUnmounted } from 'vue';

import EngineMenu from '@/components/Dashboard/Composer/VoiceInput/EngineMenu.vue';
import Waveform from '@/components/Dashboard/Composer/VoiceInput/Waveform.vue';
import { voiceInputKey, type UseVoiceInputReturn } from '@/composables/useVoiceInput';

const voice = inject(voiceInputKey) as UseVoiceInputReturn;

const {
  engine,
  setEngine,
  webSpeechSupported,
  isRecording,
  isTranscribing,
  isBusy,
  countdownSeconds,
  inlineError,
  ariaLiveMessage,
  audioLevel,
  toggleRecording,
  cancelRecording,
} = voice;

const { level: audioLevelValue, reactiveWaveform } = audioLevel;

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isRecording.value) {
    event.preventDefault();
    cancelRecording();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div class="tw-flex tw-items-center tw-gap-1">
    <span class="tw-sr-only" aria-live="polite">{{ ariaLiveMessage }}</span>

    <Waveform v-if="isRecording" :level="audioLevelValue" :reactive-waveform="reactiveWaveform" />

    <span
      v-if="countdownSeconds !== null"
      data-testid="voice-countdown"
      class="tw-text-eyebrow tw-tabular-nums tw-text-ink-muted"
      aria-hidden="true"
    >
      {{ countdownSeconds }}s
    </span>

    <EngineMenu
      :engine="engine"
      :web-speech-supported="webSpeechSupported"
      :disabled="isBusy"
      :menu-disabled="isRecording"
      @update:engine="setEngine"
    />

    <button
      type="button"
      data-testid="voice-mic-button"
      data-tour="mic"
      class="tw-inline-flex tw-min-h-[36px] tw-min-w-[36px] tw-items-center tw-justify-center tw-rounded-md tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      :aria-label="isTranscribing ? 'Transcribing voice input' : 'Voice input'"
      :aria-pressed="isRecording"
      :disabled="isTranscribing"
      @click="toggleRecording"
    >
      <font-awesome-icon
        :icon="faMicrophone"
        class="tw-h-4 tw-w-4"
        :class="isRecording ? 'tw-text-accent' : ''"
        aria-hidden="true"
      />
    </button>

    <p v-if="inlineError" data-testid="voice-inline-error" class="tw-sr-only" role="alert">
      {{ inlineError }}
    </p>

    <p v-if="isTranscribing" class="tw-sr-only" aria-live="polite">Transcribing</p>
  </div>
</template>
