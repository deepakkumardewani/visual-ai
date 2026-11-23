<script setup lang="ts">
import {
  getModelDefinition,
  MEDIA_PROMPT_MAX_CHARS,
  STABLE_AUDIO_CFG_SCALE,
  STABLE_AUDIO_DURATION_SEC,
  STABLE_AUDIO_STEPS,
  type MusicStudioModelKey,
} from '@visual-ai/shared';
import { onKeyStroke } from '@vueuse/core';
import { computed, ref } from 'vue';

import MusicComposer from '@/components/Music/MusicComposer.vue';
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

const MUSIC_ENDPOINT = '/generate/audio/music';
const DEFAULT_MODEL: MusicStudioModelKey = 'LYRIA_2';
const EMPTY_TITLE = 'Your first track';
const EMPTY_DESCRIPTION = 'Describe a mood, genre or scene to make your first track.';
const EXAMPLE_PROMPT = 'Calm piano, rainy evening';
const PROMPT_REQUIRED_REASON = 'Describe the music you want to make.';

usePageSeo({
  title: 'Music studio – Visual AI',
  description: 'Make instrumental music from a prompt with Lyria 2, Stable Audio or Minimax.',
  path: '/audio/music',
});

const { draft } = useMediaDraft();
const job = useMediaJob();

const modelKey = ref<MusicStudioModelKey>(DEFAULT_MODEL);
const negativePrompt = ref('');
const steps = ref<number>(STABLE_AUDIO_STEPS.default);
const cfgScale = ref<number>(STABLE_AUDIO_CFG_SCALE.default);

const durationSec = computed({
  get: () => draft.durationSec ?? STABLE_AUDIO_DURATION_SEC.default,
  set: (value: number) => {
    draft.durationSec = value;
  },
});

const { cost, estimated } = useMediaCost({ modelKey, input: { kind: 'file' } });

const media = computed(() => getModelDefinition(modelKey.value).media);
const accepts = (field: string) => Boolean(media.value && Object.hasOwn(media.value.inputs, field));
const promptMax = computed(() => media.value?.prompt?.max ?? MEDIA_PROMPT_MAX_CHARS);

const disabledReason = computed(() => {
  if (!draft.prompt.trim()) return PROMPT_REQUIRED_REASON;
  if (draft.prompt.length > promptMax.value) {
    return `The prompt is over ${promptMax.value} characters.`;
  }
  return '';
});
const state = computed(() => job.state.value);

/** Only fields the chosen model declares are sent; the server rejects anything else. */
function buildBody() {
  return {
    modelKey: modelKey.value,
    prompt: draft.prompt.trim(),
    ...(accepts('durationSec') && { durationSec: durationSec.value }),
    ...(accepts('negativePrompt') &&
      negativePrompt.value.trim() && { negativePrompt: negativePrompt.value.trim() }),
    ...(accepts('steps') && { steps: steps.value }),
    ...(accepts('cfgScale') && { cfgScale: cfgScale.value }),
    ...(accepts('instrumental') && { instrumental: true }),
  };
}

function generate() {
  if (disabledReason.value || job.isBusy.value) return;
  void job.submit(MUSIC_ENDPOINT, buildBody());
}

onKeyStroke('Enter', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  generate();
});
</script>

<template>
  <StudioShell studio="music">
    <h1 class="tw-m-0 tw-mb-6 tw-font-display tw-text-display-md tw-text-ink-primary">
      Music studio
    </h1>
    <MusicComposer
      v-model:model-key="modelKey"
      v-model:prompt="draft.prompt"
      v-model:duration-sec="durationSec"
      v-model:negative-prompt="negativePrompt"
      v-model:steps="steps"
      v-model:cfg-scale="cfgScale"
    />
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
        @example="draft.prompt = EXAMPLE_PROMPT"
      />
    </template>
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </StudioShell>
</template>
