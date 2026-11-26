<script setup lang="ts">
import { VIDEO_WATERMARK_SIZE } from '@visual-ai/shared';
import { computed, ref } from 'vue';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';
import ResultCard from '@/components/Studio/ResultCard.vue';
import StudioActionBar from '@/components/Studio/StudioActionBar.vue';
import StudioErrorState from '@/components/Studio/StudioErrorState.vue';
import StudioShell from '@/components/Studio/StudioShell.vue';
import ToolResultPanel from '@/components/Tools/ToolResultPanel.vue';
import VideoWatermarkForm from '@/components/Tools/VideoWatermarkForm.vue';

import { useMediaCost } from '@/composables/useMediaCost';
import { useMediaJob } from '@/composables/useMediaJob';
import { usePageSeo } from '@/composables/usePageSeo';
import { useHandoffPreload } from '@/composables/useStudioHandoff';
import type { UploadedFile } from '@/composables/useToolVideoUpload';
import { usePlayerStore } from '@/stores/player';

const ENDPOINT = '/generate/tools/video-watermark';
const EMPTY_DESCRIPTION = 'Add a video and the text for your watermark.';
const VIDEO_REQUIRED_REASON = 'Add a video first.';
const TEXT_REQUIRED_REASON = 'Enter the watermark text.';

usePageSeo({
  title: 'Video watermark – Visual AI',
  description: 'Stamp your own text on a video and download the result.',
  path: '/tools/video-watermark',
});

const job = useMediaJob();
const player = usePlayerStore();
const video = ref<UploadedFile | null>(null);
const handoff = useHandoffPreload({ assetType: 'video', purpose: 'tool-video', target: video });
const text = ref('');
const size = ref<number>(VIDEO_WATERMARK_SIZE.default);

const { cost } = useMediaCost({
  modelKey: 'VIDEO_WATERMARK',
  input: { kind: 'run' },
});

const disabledReason = computed(() => {
  if (!video.value) return VIDEO_REQUIRED_REASON;
  return text.value.trim() ? '' : TEXT_REQUIRED_REASON;
});

function generate() {
  if (disabledReason.value || job.isBusy.value || !video.value) return;
  // Audio and video never overlap: starting a video job ends whatever the mini-player holds.
  player.close();
  void job.submit(ENDPOINT, {
    uploadId: video.value.uploadId,
    watermarkText: text.value.trim(),
    size: size.value,
  });
}
</script>

<template>
  <StudioShell studio="tools">
    <h1 class="tw-m-0 tw-mb-6 tw-font-display tw-text-display-md tw-text-ink-primary">
      Video watermark
    </h1>
    <StudioErrorState
      v-if="handoff.status.value === 'error'"
      class="tw-mb-6"
      :message="handoff.message.value"
      action-label="Dismiss"
      @action="handoff.dismiss()"
    />
    <VideoWatermarkForm v-model:video="video" v-model:text="text" v-model:size="size" />
    <div class="tw-mt-6">
      <StudioActionBar
        :cost="cost ?? 0"
        :disabled="Boolean(disabledReason)"
        :disabled-reason="disabledReason"
        :busy="job.isBusy.value"
        @generate="generate"
      />
    </div>

    <template #result>
      <ToolResultPanel
        :state="job.state.value"
        empty-title="Video watermark"
        :empty-description="EMPTY_DESCRIPTION"
        @retry="job.retry()"
        @dismiss="job.reset()"
      >
        <template #default="{ asset }">
          <ResultCard :asset="asset" />
        </template>
      </ToolResultPanel>
    </template>
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </StudioShell>
</template>
