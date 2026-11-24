<script setup lang="ts">
import { getModelDefinition, TTS_DEFAULT_VOICE, type SpeechModelKey } from '@visual-ai/shared';
import { onKeyStroke } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import SpeechComposer from '@/components/Speech/SpeechComposer.vue';
import SongResult from '@/components/Song/SongResult.vue';
import JobProgress from '@/components/Studio/JobProgress.vue';
import StudioActionBar from '@/components/Studio/StudioActionBar.vue';
import StudioEmptyState from '@/components/Studio/StudioEmptyState.vue';
import StudioErrorState from '@/components/Studio/StudioErrorState.vue';
import StudioShell from '@/components/Studio/StudioShell.vue';
import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';

import { useMediaCost } from '@/composables/useMediaCost';
import { useMediaDraft } from '@/composables/useMediaDraft';
import { useMediaJob } from '@/composables/useMediaJob';
import { usePageSeo } from '@/composables/usePageSeo';
import { useTtsEditor } from '@/composables/useTtsEditor';

const SPEECH_ENDPOINT = '/generate/audio/speech';
const DEFAULT_MODEL: SpeechModelKey = 'INWORLD_TTS_2';
const EMPTY_TITLE = 'Your first take';
const EMPTY_DESCRIPTION = 'Type or paste what you want spoken.';
const EXAMPLE_TEXT = 'Welcome back. Today we are making something worth listening to.';
const TEXT_REQUIRED_REASON = 'Type what you want spoken.';
const NO_SPEECH_REASON = 'Add some words to speak. Tags alone make no sound.';

usePageSeo({
  title: 'Speech studio – Visual AI',
  description: 'Turn text into natural speech with Inworld, Minimax and Chatterbox voices.',
  path: '/audio/speech',
});

const { draft } = useMediaDraft();
const job = useMediaJob();

const modelKey = ref<SpeechModelKey>(DEFAULT_MODEL);
const voiceCatalog = (key: SpeechModelKey) => getModelDefinition(key).media?.voices;
const voice = ref<string>(TTS_DEFAULT_VOICE[voiceCatalog(DEFAULT_MODEL) ?? 'inworld']);

const tts = useTtsEditor({ modelKey, initialText: draft.text });
watch(tts.text, (text) => {
  draft.text = text;
});

const chars = computed(() => tts.text.value.length);
const { cost, estimated } = useMediaCost({
  modelKey,
  input: computed(() => ({ kind: 'chars' as const, chars: chars.value })),
});

const media = computed(() => getModelDefinition(modelKey.value).media);
const limit = computed(() => media.value?.textLimit ?? 0);
const accepts = (field: string) => Boolean(media.value && Object.hasOwn(media.value.inputs, field));

const disabledReason = computed(() => {
  if (!tts.text.value.trim()) return TEXT_REQUIRED_REASON;
  if (!tts.hasSpeakableText.value) return NO_SPEECH_REASON;
  if (chars.value > limit.value) {
    const over = (chars.value - limit.value).toLocaleString();
    return `The text is ${over} characters over the ${limit.value.toLocaleString()} limit. Shorten it to generate.`;
  }
  return '';
});
const state = computed(() => job.state.value);

/** Only fields the chosen model declares are sent; the server recounts and prices the text. */
function buildBody() {
  return {
    modelKey: modelKey.value,
    text: tts.text.value,
    ...(accepts('voice') && { voice: voice.value }),
    ...(accepts('emotion') && tts.emotion.value && { emotion: tts.emotion.value }),
  };
}

function generate() {
  if (disabledReason.value || job.isBusy.value) return;
  void job.submit(SPEECH_ENDPOINT, buildBody());
}

function useExample() {
  tts.setDoc([{ type: 'text', text: EXAMPLE_TEXT }]);
  draft.text = tts.text.value;
}

onKeyStroke('Enter', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  generate();
});
</script>

<template>
  <StudioShell studio="speech">
    <h1 class="tw-m-0 tw-mb-6 tw-font-display tw-text-display-md tw-text-ink-primary">
      Speech studio
    </h1>
    <SpeechComposer v-model:voice="voice" :tts="tts" :model-key="modelKey" :estimated="estimated" />
    <div class="tw-mt-6">
      <StudioActionBar
        :cost="cost ?? 0"
        :estimated="estimated"
        :disabled="Boolean(disabledReason)"
        :disabled-reason="disabledReason"
        :busy="job.isBusy.value"
        @generate="generate"
      />
    </div>

    <template #result>
      <JobProgress
        v-if="state.phase === 'queued' || state.phase === 'submitting'"
        stage="queued"
        :elapsed-ms="0"
      />
      <JobProgress
        v-else-if="state.phase === 'running'"
        :stage="state.stage"
        :elapsed-ms="state.elapsedMs"
      />
      <SongResult v-else-if="state.phase === 'succeeded'" :asset="state.asset" />
      <StudioErrorState
        v-else-if="state.phase === 'failed'"
        :message="state.message"
        :no-charge="state.noCharge"
        @action="job.retry()"
      />
      <StudioErrorState
        v-else-if="state.phase === 'rejected'"
        :message="state.message"
        action-label="Dismiss"
        @action="job.reset()"
      />
      <StudioEmptyState
        v-else
        :title="EMPTY_TITLE"
        :description="EMPTY_DESCRIPTION"
        example-label="Try an example"
        @example="useExample"
      />
    </template>
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </StudioShell>
</template>
