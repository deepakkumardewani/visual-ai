import { STT_MAX_CLIP_SECONDS } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type InjectionKey,
} from 'vue';
import { useRoute } from 'vue-router';

import { useAudioLevel } from '@/composables/useAudioLevel';
import { useGrokRecorder, appendPromptText } from '@/composables/useGrokRecorder';
import { useShareActions } from '@/composables/useShareActions';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

export type UseVoiceInputReturn = ReturnType<typeof useVoiceInput>;

export const voiceInputKey: InjectionKey<UseVoiceInputReturn> = Symbol('voiceInput');

export function useVoiceInput() {
  const asideStore = useAsideStore();
  const generateStore = useGenerateStore();
  const { typingPrompt } = storeToRefs(asideStore);
  const { promptText } = storeToRefs(generateStore);
  const { mode } = storeToRefs(asideStore);
  const route = useRoute();
  const { showToast } = useShareActions();

  const countdownSeconds = ref<number | null>(null);
  const inlineError = ref('');
  const ariaLiveMessage = ref('');

  const audioLevel = useAudioLevel();

  function syncPrompt(text: string) {
    typingPrompt.value = text;
    promptText.value = text;
  }

  function appendToPrompt(text: string) {
    syncPrompt(appendPromptText(typingPrompt.value, text));
  }

  function reportError(message: string) {
    inlineError.value = message;
    showToast(message);
  }

  const grok = useGrokRecorder({
    onAppend: appendToPrompt,
    onError: reportError,
    onCountdown: (value) => {
      countdownSeconds.value = value;
    },
  });

  const isRecording = computed(() => grok.isRecording.value);
  const isTranscribing = computed(() => grok.isTranscribing.value);
  const isBusy = computed(() => isRecording.value || isTranscribing.value);

  const statusLabel = computed(() => {
    if (isTranscribing.value) {
      return 'Transcribing';
    }
    if (isRecording.value) {
      return 'Recording';
    }
    return '';
  });

  watch(statusLabel, (value) => {
    ariaLiveMessage.value = value;
  });

  async function startRecording() {
    if (isBusy.value) {
      return;
    }
    inlineError.value = '';

    const started = await grok.startRecording();
    if (started) {
      ariaLiveMessage.value = 'Recording';
      await audioLevel.start(grok.getStream() ?? undefined);
    }
  }

  async function stopRecording() {
    await grok.stopRecording();
    audioLevel.stop();
    countdownSeconds.value = null;
  }

  function cancelRecording() {
    grok.cancelRecording();
    audioLevel.stop();
    countdownSeconds.value = null;
    ariaLiveMessage.value = '';
  }

  function toggleRecording() {
    if (isTranscribing.value) {
      return;
    }
    if (isRecording.value) {
      void stopRecording();
      return;
    }
    void startRecording();
  }

  function onVisibilityChange() {
    if (document.hidden && isRecording.value) {
      cancelRecording();
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    cancelRecording();
  });

  watch(
    () => [route.fullPath, mode.value.id] as const,
    () => {
      if (isRecording.value) {
        cancelRecording();
      }
    },
  );

  return {
    isRecording,
    isTranscribing,
    isBusy,
    countdownSeconds,
    maxClipSeconds: STT_MAX_CLIP_SECONDS,
    inlineError,
    ariaLiveMessage,
    statusLabel,
    audioLevel,
    toggleRecording,
    cancelRecording,
    startRecording,
    stopRecording,
  };
}

export function provideVoiceInput() {
  const voice = useVoiceInput();
  provide(voiceInputKey, voice);
  return voice;
}

export function useVoiceInputContext() {
  const voice = inject(voiceInputKey);
  if (!voice) {
    throw new Error('voice input context missing');
  }
  return voice;
}
