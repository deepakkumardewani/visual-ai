<script setup lang="ts">
import {
  IMAGE_WATERMARK_OPACITY,
  IMAGE_WATERMARK_SCALE,
  type ImageWatermarkPosition,
} from '@visual-ai/shared';
import { computed, ref } from 'vue';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';
import ResultCard from '@/components/Studio/ResultCard.vue';
import StudioActionBar from '@/components/Studio/StudioActionBar.vue';
import StudioErrorState from '@/components/Studio/StudioErrorState.vue';
import StudioShell from '@/components/Studio/StudioShell.vue';
import ToolResultPanel from '@/components/Tools/ToolResultPanel.vue';
import WatermarkForm from '@/components/Tools/WatermarkForm.vue';

import { useMediaCost } from '@/composables/useMediaCost';
import { useMediaJob } from '@/composables/useMediaJob';
import { usePageSeo } from '@/composables/usePageSeo';
import { useHandoffPreload } from '@/composables/useStudioHandoff';
import type { UploadedFile } from '@/composables/useToolVideoUpload';

const ENDPOINT = '/generate/tools/image-watermark';
const EMPTY_DESCRIPTION = 'Add an image and the text for your watermark.';
const IMAGE_REQUIRED_REASON = 'Add an image first.';
const TEXT_REQUIRED_REASON = 'Enter the watermark text.';

usePageSeo({
  title: 'Image watermark – Visual AI',
  description: 'Stamp your own text on an image and download the result.',
  path: '/tools/image-watermark',
});

const job = useMediaJob();
const image = ref<UploadedFile | null>(null);
const handoff = useHandoffPreload({ assetType: 'image', purpose: 'tool-image', target: image });
const text = ref('');
const position = ref<ImageWatermarkPosition>('bottom-right');
const scale = ref<number>(IMAGE_WATERMARK_SCALE.default);
const opacity = ref<number>(IMAGE_WATERMARK_OPACITY.default);

const { cost } = useMediaCost({
  modelKey: 'IMAGE_WATERMARK',
  input: { kind: 'run' },
});

const disabledReason = computed(() => {
  if (!image.value) return IMAGE_REQUIRED_REASON;
  return text.value.trim() ? '' : TEXT_REQUIRED_REASON;
});

function generate() {
  if (disabledReason.value || job.isBusy.value || !image.value) return;
  void job.submit(ENDPOINT, {
    uploadId: image.value.uploadId,
    watermarkText: text.value.trim(),
    position: position.value,
    scale: scale.value,
    opacity: opacity.value,
  });
}
</script>

<template>
  <StudioShell studio="tools">
    <h1 class="tw-m-0 tw-mb-6 tw-font-display tw-text-display-md tw-text-ink-primary">
      Image watermark
    </h1>
    <StudioErrorState
      v-if="handoff.status.value === 'error'"
      class="tw-mb-6"
      :message="handoff.message.value"
      action-label="Dismiss"
      @action="handoff.dismiss()"
    />
    <WatermarkForm
      v-model:image="image"
      v-model:text="text"
      v-model:position="position"
      v-model:scale="scale"
      v-model:opacity="opacity"
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
        empty-title="Image watermark"
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
