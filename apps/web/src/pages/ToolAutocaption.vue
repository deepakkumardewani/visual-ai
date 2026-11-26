<script setup lang="ts">
import { computed, ref } from 'vue';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';
import StudioActionBar from '@/components/Studio/StudioActionBar.vue';
import StudioErrorState from '@/components/Studio/StudioErrorState.vue';
import StudioShell from '@/components/Studio/StudioShell.vue';
import CaptionResult from '@/components/Tools/CaptionResult.vue';
import ToolFileInput from '@/components/Tools/ToolFileInput.vue';
import ToolResultPanel from '@/components/Tools/ToolResultPanel.vue';

import { useMediaCost } from '@/composables/useMediaCost';
import { useMediaJob } from '@/composables/useMediaJob';
import { usePageSeo } from '@/composables/usePageSeo';
import { useHandoffPreload } from '@/composables/useStudioHandoff';
import type { UploadedFile } from '@/composables/useToolVideoUpload';
import { usePlayerStore } from '@/stores/player';

const ENDPOINT = '/generate/tools/autocaption';
const EMPTY_DESCRIPTION = 'Add a video to caption it.';
const VIDEO_REQUIRED_REASON = 'Add a video first.';
// Shown before a video is chosen, so the badge is the one-block minimum.
const NO_VIDEO_SECONDS = 0;

usePageSeo({
  title: 'Autocaption – Visual AI',
  description: 'Burn captions into your video and get the transcript.',
  path: '/tools/autocaption',
});

const job = useMediaJob();
const player = usePlayerStore();
const video = ref<UploadedFile | null>(null);
const handoff = useHandoffPreload({ assetType: 'video', purpose: 'tool-video', target: video });

const { cost } = useMediaCost({
  modelKey: 'AUTOCAPTION',
  input: () => ({
    kind: 'blocks',
    videoSec: video.value?.durationSec ?? NO_VIDEO_SECONDS,
  }),
});

const disabledReason = computed(() => (video.value ? '' : VIDEO_REQUIRED_REASON));

function generate() {
  if (disabledReason.value || job.isBusy.value || !video.value) return;
  // Audio and video never overlap: starting a video job ends whatever the mini-player holds.
  player.close();
  void job.submit(ENDPOINT, { uploadId: video.value.uploadId });
}
</script>

<template>
  <StudioShell studio="tools">
    <h1 class="tw-m-0 tw-mb-6 tw-font-display tw-text-display-md tw-text-ink-primary">
      Autocaption
    </h1>
    <StudioErrorState
      v-if="handoff.status.value === 'error'"
      class="tw-mb-6"
      :message="handoff.message.value"
      action-label="Dismiss"
      @action="handoff.dismiss()"
    />
    <ToolFileInput
      v-model="video"
      purpose="tool-video"
      label="Video"
      hint="Videos up to 2 minutes and 100 MB."
      button-label="Choose video"
      test-id="autocaption-file"
    />
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
        empty-title="Autocaption"
        :empty-description="EMPTY_DESCRIPTION"
        @retry="job.retry()"
        @dismiss="job.reset()"
      >
        <template #default="{ asset }">
          <CaptionResult :asset="asset" />
        </template>
      </ToolResultPanel>
    </template>
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </StudioShell>
</template>
