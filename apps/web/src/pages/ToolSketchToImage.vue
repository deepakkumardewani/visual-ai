<script setup lang="ts">
import { MODEL_REGISTRY } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';
import JobProgress from '@/components/Studio/JobProgress.vue';
import StudioActionBar from '@/components/Studio/StudioActionBar.vue';
import StudioEmptyState from '@/components/Studio/StudioEmptyState.vue';
import StudioErrorState from '@/components/Studio/StudioErrorState.vue';
import StudioShell from '@/components/Studio/StudioShell.vue';
import SketchCanvas from '@/components/Tools/SketchCanvas.vue';
import SketchToolbar from '@/components/Tools/SketchToolbar.vue';

import { usePageSeo } from '@/composables/usePageSeo';
import { useSketchCanvas } from '@/composables/useSketchCanvas';
import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';
import { FeatureType } from '@/types';

import { MODELS } from '@/utils/models';

const SKETCH_MODEL_KEYS = ['NANO_BANANA_2', 'SEEDREAM_4', 'FLUX_KONTEXT_MAX'] as const;
const EMPTY_DESCRIPTION = 'Draw a sketch, then describe the picture.';
const DRAW_FIRST_REASON = 'Draw something first.';
const PROMPT_REQUIRED_REASON = 'Describe the picture.';
const COMPOSITION_GUIDANCE = 'Use the reference sketch as composition guide.';
const PROMPT_ID = 'sketch-prompt';
const MODEL_ID = 'sketch-model';
const SKETCH_ASPECT = { type: 'square', title: '1:1' } as const;
const SKETCH_OUTPUT_FORMAT = 'png';

usePageSeo({
  title: 'Sketch to image – Visual AI',
  description: 'Draw a rough sketch, describe it and get a finished image.',
  path: '/tools/sketch',
});

const appStore = useAppStore();
const dialogStore = useDialogStore();
const generateStore = useGenerateStore();
const userStore = useUserStore();
const { images, isLoading, errMsg } = storeToRefs(generateStore);

const sketchModels = MODELS.filter((model) =>
  SKETCH_MODEL_KEYS.some((key) => MODEL_REGISTRY[key].key === model.id),
);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const sketch = useSketchCanvas(canvasEl);
const prompt = ref('');
const modelId = ref(sketchModels[0]?.id ?? '');

const model = computed(() => sketchModels.find((item) => item.id === modelId.value));
const cost = computed(() => model.value?.creditCost ?? 1);
const resultUrl = computed(() => images.value[0]?.aiImageUrl);
const errorMessage = computed(() => errMsg.value[FeatureType.IMAGE]);

const disabledReason = computed(() => {
  if (!sketch.hasContent.value) return DRAW_FIRST_REASON;
  return prompt.value.trim() ? '' : PROMPT_REQUIRED_REASON;
});

async function generate() {
  if (disabledReason.value || isLoading.value || !model.value) return;
  if (!userStore.canAffordOutputs(1, cost.value)) {
    dialogStore.showLowCredits();
    return;
  }
  const file = await sketch.toFile();
  if (!file) return;
  const jobId = uuidv4();
  // The sketch rides the create page's reference-image path, so cost and history stay image-shaped.
  void generateStore.generateImage(
    {
      jobId,
      modelId: model.value.id,
      imageType: SKETCH_ASPECT.type,
      modelName: model.value.title,
      prompt: `${COMPOSITION_GUIDANCE} ${prompt.value.trim()}`,
      noOfOutputs: 1,
      aspectRatio: SKETCH_ASPECT.title,
      outputFormat: SKETCH_OUTPUT_FORMAT,
    },
    [file],
  );
  appStore.progressUrl = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
  appStore.imageOpen();
}
</script>

<template>
  <StudioShell studio="tools">
    <h1 class="tw-m-0 tw-mb-6 tw-font-display tw-text-display-md tw-text-ink-primary">
      Sketch to image
    </h1>
    <div class="tw-flex tw-flex-col tw-gap-4">
      <SketchToolbar
        v-model:tool="sketch.tool.value"
        v-model:size="sketch.size.value"
        :can-undo="sketch.canUndo.value"
        :has-content="sketch.hasContent.value"
        @undo="sketch.undo"
        @clear="sketch.clear"
      />
      <SketchCanvas v-model:canvas="canvasEl" :sketch="sketch" />

      <div class="tw-flex tw-flex-col tw-gap-2">
        <label :for="PROMPT_ID" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
          Describe the picture
        </label>
        <textarea
          :id="PROMPT_ID"
          v-model="prompt"
          class="field"
          rows="3"
          data-testid="sketch-prompt"
        />
      </div>

      <div class="tw-flex tw-flex-col tw-gap-2">
        <label :for="MODEL_ID" class="tw-text-sm tw-font-semibold tw-text-ink-primary">Model</label>
        <select :id="MODEL_ID" v-model="modelId" class="field" data-testid="sketch-model">
          <option v-for="item in sketchModels" :key="item.id" :value="item.id">
            {{ item.title }}
          </option>
        </select>
      </div>
    </div>

    <div class="tw-mt-6">
      <StudioActionBar
        :cost="cost"
        :disabled="Boolean(disabledReason)"
        :disabled-reason="disabledReason"
        :busy="isLoading"
        @generate="generate"
      />
    </div>

    <template #result>
      <JobProgress v-if="isLoading" stage="composing" :elapsed-ms="0" />
      <StudioErrorState v-else-if="errorMessage" :message="errorMessage" @action="generate" />
      <img
        v-else-if="resultUrl"
        :src="resultUrl"
        alt="Image generated from your sketch"
        class="result"
        data-testid="sketch-result"
      />
      <StudioEmptyState v-else title="Sketch to image" :description="EMPTY_DESCRIPTION" />
    </template>
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </StudioShell>
</template>

<style scoped lang="scss">
.field {
  width: 100%;
  min-height: 44px;
  padding: 0.625rem 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.result {
  display: block;
  width: 100%;
  border-radius: 0.75rem;
}
</style>
