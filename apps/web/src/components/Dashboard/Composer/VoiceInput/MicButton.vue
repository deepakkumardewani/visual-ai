<script setup lang="ts">
import { faMicrophone, faSpinner, faStop } from '@fortawesome/free-solid-svg-icons';
import { inject, onMounted, onUnmounted, ref } from 'vue';

import { faTimes } from '@/plugins/icons';

import VoiceDisclosureDialog from '@/components/Dashboard/Composer/VoiceInput/VoiceDisclosureDialog.vue';
import Waveform from '@/components/Dashboard/Composer/VoiceInput/Waveform.vue';
import { voiceInputKey, type UseVoiceInputReturn } from '@/composables/useVoiceInput';
import {
  acceptVoiceInputDisclosure,
  hasAcceptedVoiceInputDisclosure,
} from '@/composables/voiceInputDisclosure';

const voice = inject(voiceInputKey) as UseVoiceInputReturn;

const {
  isRecording,
  isTranscribing,
  isBusy,
  countdownSeconds,
  inlineError,
  ariaLiveMessage,
  audioLevel,
  toggleRecording,
  cancelRecording,
  stopRecording,
} = voice;

const { level: audioLevelValue, reactiveWaveform } = audioLevel;

const disclosureOpen = ref(false);

function onMicClick() {
  if (isTranscribing.value) {
    return;
  }
  if (!hasAcceptedVoiceInputDisclosure()) {
    disclosureOpen.value = true;
    return;
  }
  toggleRecording();
}

function onDisclosureAccept() {
  acceptVoiceInputDisclosure();
  disclosureOpen.value = false;
  toggleRecording();
}

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

    <template v-if="isRecording">
      <Waveform :level="audioLevelValue" :reactive-waveform="reactiveWaveform">
        <span
          v-if="countdownSeconds !== null"
          data-testid="voice-countdown"
          class="tw-text-eyebrow tw-tabular-nums tw-text-ink-muted"
        >
          {{ countdownSeconds }}s
        </span>
      </Waveform>

      <button
        type="button"
        data-testid="voice-cancel-button"
        class="tw-inline-flex tw-min-h-[36px] tw-min-w-[36px] tw-items-center tw-justify-center tw-rounded-md tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        aria-label="Cancel voice recording"
        @mousedown.prevent
        @click="cancelRecording"
      >
        <font-awesome-icon :icon="faTimes" class="tw-h-4 tw-w-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        data-testid="voice-accept-button"
        class="tw-inline-flex tw-min-h-[36px] tw-min-w-[36px] tw-items-center tw-justify-center tw-rounded-md tw-text-accent hover:tw-text-accent/90 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        aria-label="Stop recording and transcribe"
        @click="stopRecording"
      >
        <font-awesome-icon :icon="faStop" class="tw-h-4 tw-w-4" aria-hidden="true" />
      </button>
    </template>

    <button
      v-else
      type="button"
      data-testid="voice-mic-button"
      data-tour="mic"
      class="tw-inline-flex tw-min-h-[36px] tw-min-w-[36px] tw-items-center tw-justify-center tw-rounded-md tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      :aria-label="isTranscribing ? 'Transcribing voice input' : 'Voice input'"
      :aria-pressed="isRecording"
      :disabled="isTranscribing"
      @click="onMicClick"
    >
      <font-awesome-icon
        v-if="isTranscribing"
        :icon="faSpinner"
        data-testid="voice-spinner"
        class="tw-h-4 tw-w-4 tw-animate-spin motion-reduce:tw-animate-none"
        aria-hidden="true"
      />
      <font-awesome-icon v-else :icon="faMicrophone" class="tw-h-4 tw-w-4" aria-hidden="true" />
    </button>

    <p v-if="inlineError" data-testid="voice-inline-error" class="tw-sr-only" role="alert">
      {{ inlineError }}
    </p>

    <p v-if="isTranscribing" class="tw-sr-only" aria-live="polite">Transcribing</p>

    <VoiceDisclosureDialog :open="disclosureOpen" @accept="onDisclosureAccept" />
  </div>
</template>
