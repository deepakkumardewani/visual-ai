<script setup lang="ts">
import {
  getVideoBillableSeconds,
  getVideoModelOptions,
  type MediaCostInput,
  type VideoStudioModelKey,
} from '@visual-ai/shared';
import { onKeyStroke } from '@vueuse/core';
import { computed, nextTick, ref, watch } from 'vue';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';
import JobProgress from '@/components/Studio/JobProgress.vue';
import StudioActionBar from '@/components/Studio/StudioActionBar.vue';
import StudioEmptyState from '@/components/Studio/StudioEmptyState.vue';
import StudioErrorState from '@/components/Studio/StudioErrorState.vue';
import StudioShell from '@/components/Studio/StudioShell.vue';
import DraftToggle from '@/components/Video/DraftToggle.vue';
import VideoComposer from '@/components/Video/VideoComposer.vue';
import VideoResult from '@/components/Video/VideoResult.vue';

import { useMediaCost } from '@/composables/useMediaCost';
import { useMediaDraft } from '@/composables/useMediaDraft';
import { useMediaJob } from '@/composables/useMediaJob';
import { usePageSeo } from '@/composables/usePageSeo';
import type { UploadedFile } from '@/composables/useToolVideoUpload';
import { usePlayerStore } from '@/stores/player';

const VIDEO_ENDPOINT = '/generate/video';
const DEFAULT_MODEL: VideoStudioModelKey = 'P_VIDEO';
const EMPTY_TITLE = 'Your first video';
const EMPTY_DESCRIPTION = 'Describe a scene to make your first video.';
const EXAMPLE_PROMPT =
  'A paper boat drifting down a rain-soaked street at dusk, slow tracking shot';
const PROMPT_REQUIRED_REASON = 'Describe the scene you want to make.';
const GENERATE_BUTTON_SELECTOR = '[data-testid="studio-generate"]';

usePageSeo({
  title: 'Video studio – Visual AI',
  description: 'Make short videos from text, an image or your own audio with P-Video or Wan 3.',
  path: '/video',
});

const { draft: mediaDraft } = useMediaDraft();
const job = useMediaJob();
const player = usePlayerStore();

const modelKey = ref<VideoStudioModelKey>(DEFAULT_MODEL);
const options = computed(() => getVideoModelOptions(modelKey.value)!);
const durationSec = ref(options.value.durationSec.default);
const resolution = ref(options.value.defaultResolution);
const useDraft = ref(true);
const image = ref<UploadedFile | null>(null);
const audio = ref<UploadedFile | null>(null);
/** What the visible result was rendered with; the toggle may have moved since. */
const resultWasDraft = ref(false);

const supportsDraft = computed(() => options.value.supportsDraft);
const isDraft = computed(() => supportsDraft.value && useDraft.value);
// Audio is only sent to models that take it, so cost and body agree.
const activeAudio = computed(() => (options.value.supportsAudio ? audio.value : null));

function costInput(draft: boolean): MediaCostInput {
  return {
    kind: 'seconds',
    durationSec: getVideoBillableSeconds({
      durationSec: durationSec.value,
      audioDurationSec: activeAudio.value?.durationSec,
    }),
    resolution: resolution.value,
    draft,
  };
}

const audioDriven = computed(() => Boolean(activeAudio.value));
const { cost, estimated } = useMediaCost({
  modelKey,
  input: () => costInput(isDraft.value),
  audioDriven,
});
const { cost: fullCost } = useMediaCost({ modelKey, input: () => costInput(false) });
const { cost: draftCost } = useMediaCost({ modelKey, input: () => costInput(true) });
const draftSaving = computed(() =>
  fullCost.value === null || draftCost.value === null ? 0 : fullCost.value - draftCost.value,
);

// A model switch keeps the user's inputs where the new model allows them and resets the rest.
watch(modelKey, () => {
  const next = options.value;
  durationSec.value = Math.min(
    Math.max(durationSec.value, next.durationSec.min),
    next.durationSec.max,
  );
  if (!next.resolutions.includes(resolution.value)) resolution.value = next.defaultResolution;
  if (!next.supportsAudio) audio.value = null;
});

const disabledReason = computed(() => {
  if (!mediaDraft.prompt.trim()) return PROMPT_REQUIRED_REASON;
  return '';
});
const state = computed(() => job.state.value);

function buildBody(draft: boolean) {
  return {
    modelKey: modelKey.value,
    prompt: mediaDraft.prompt.trim(),
    durationSec: durationSec.value,
    resolution: resolution.value,
    ...(supportsDraft.value && { draft }),
    ...(image.value && { imageUploadId: image.value.uploadId }),
    ...(activeAudio.value && { audioUploadId: activeAudio.value.uploadId }),
  };
}

function generate() {
  if (disabledReason.value || job.isBusy.value) return;
  // Audio and video never overlap: starting a video ends whatever the mini-player holds.
  player.close();
  resultWasDraft.value = isDraft.value;
  void job.submit(VIDEO_ENDPOINT, buildBody(isDraft.value));
}

// A final render deletes the attached files server-side, so the page must not resend their ids.
watch(
  () => state.value.phase,
  (phase) => {
    if (phase !== 'succeeded' || resultWasDraft.value) return;
    for (const file of [image.value, audio.value]) {
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
    }
    image.value = null;
    audio.value = null;
  },
);

/** Same prompt and inputs; the full price shows on the action bar and Generate runs the confirm. */
async function prepareFinalRender() {
  useDraft.value = false;
  await nextTick();
  document.querySelector<HTMLElement>(GENERATE_BUTTON_SELECTOR)?.focus();
}

onKeyStroke('Enter', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  generate();
});
</script>

<template>
  <StudioShell studio="video">
    <h1 class="tw-m-0 tw-mb-6 tw-font-display tw-text-display-md tw-text-ink-primary">
      Video studio
    </h1>
    <VideoComposer
      v-model:model-key="modelKey"
      v-model:prompt="mediaDraft.prompt"
      v-model:duration-sec="durationSec"
      v-model:resolution="resolution"
      v-model:image="image"
      v-model:audio="audio"
    />
    <div class="tw-mt-6 tw-flex tw-flex-col tw-gap-4">
      <DraftToggle v-if="supportsDraft" v-model="useDraft" :saving="draftSaving" />
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
      <VideoResult
        v-else-if="state.phase === 'succeeded'"
        :asset="state.asset"
        :draft="resultWasDraft"
        :final-cost="supportsDraft ? (fullCost ?? undefined) : undefined"
        @render-final="prepareFinalRender"
      />
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
        @example="mediaDraft.prompt = EXAMPLE_PROMPT"
      />
    </template>
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </StudioShell>
</template>
