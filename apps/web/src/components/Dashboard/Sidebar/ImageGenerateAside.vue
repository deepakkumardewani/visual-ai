<script setup lang="ts">
import { MODEL_REGISTRY } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';

import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';
import { useGenerateStore } from '@/stores/generate';

import AsideDisclosure from '@/components/Dashboard/Sidebar/AsideDisclosure.vue';
import AspectRatioPicker from '@/components/Dashboard/Sidebar/AspectRatioPicker.vue';
import StylePicker from '@/components/Dashboard/Sidebar/StylePicker.vue';
import PromptEnhancePicker from '@/components/Dashboard/Sidebar/PromptEnhancePicker.vue';
import ModelPicker from '@/components/Dashboard/ModelPicker/ModelPicker.vue';

const MODEL_STYLE_STORAGE_KEY = 'aside.imageGenerate.modelStyle';
const OUTPUT_SETTINGS_STORAGE_KEY = 'aside.imageGenerate.outputSettings';

import { ASPECT_RATIOS, IMAGE_FORMATS, PRIMARY_ASPECT_COUNT } from '@/utils/constants';
import { FLUX_MODES, MODELS } from '@/utils/models';
import { MODEL_IDS } from '@visual-ai/shared';

type FormatOption = (typeof IMAGE_FORMATS)[number];

const asideStore = useAsideStore();
const userStore = useUserStore();
const generateStore = useGenerateStore();

const { aspectRatio, imageFormat, outputQuality, noOfOutputs, mode } = storeToRefs(asideStore);
const { styleId, enhanceMode } = storeToRefs(generateStore);

const countOptions = [1, 2, 3, 4] as const;

/** Registry fields for the selected model — every MODELS entry must be registered. */
const selectedModelFields = computed(() => {
  const entry = MODEL_REGISTRY[mode.value.id as keyof typeof MODEL_REGISTRY];
  return entry?.fields ?? null;
});

const showAspectRatio = computed(() => Boolean(selectedModelFields.value?.aspectRatio));
const showOutputQuality = computed(() => Boolean(selectedModelFields.value?.outputQuality));
const showNumOutputs = computed(() => Boolean(selectedModelFields.value?.numOutputs));
const showOutputFormat = computed(() => Boolean(selectedModelFields.value?.outputFormat));

const allAspectRatioOptions = computed(() => {
  const registryValues = selectedModelFields.value?.aspectRatio?.values;
  if (!registryValues) return ASPECT_RATIOS.slice(0, PRIMARY_ASPECT_COUNT);
  return ASPECT_RATIOS.filter((r) => registryValues.includes(r.title));
});

const outputFormatOptions = computed(() => {
  const registryValues = selectedModelFields.value?.outputFormat?.values;
  if (!registryValues) return IMAGE_FORMATS;
  return IMAGE_FORMATS.filter((f) => {
    const key = f.title.toLowerCase();
    return registryValues.includes(key) || (key === 'jpg' && registryValues.includes('jpeg'));
  });
});

const formatGridClass = computed(() => {
  const cols = outputFormatOptions.value.length;
  if (cols <= 1) return 'tw-grid-cols-1';
  if (cols === 2) return 'tw-grid-cols-2';
  return 'tw-grid-cols-3';
});

const SEGMENT_BASE =
  'tw-relative tw-flex tw-h-7 tw-items-center tw-justify-center tw-gap-1 tw-rounded-sm tw-text-body-sm tw-font-medium tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40';

function segmentClass(active: boolean) {
  return [
    SEGMENT_BASE,
    active
      ? 'tw-bg-surface-3 tw-text-ink tw-shadow-sm'
      : 'tw-text-ink-muted hover:tw-bg-surface-3/50 hover:tw-text-ink',
  ];
}

function selectFormat(format: FormatOption) {
  imageFormat.value = format;
}

function selectCount(count: number) {
  noOfOutputs.value = count;
}

function selectQuality(value: 0 | 1) {
  outputQuality.value = value;
}

watch(showNumOutputs, (supported) => {
  if (!supported) noOfOutputs.value = 1;
});

watch(
  () => mode.value.id,
  () => {
    // Set noOfOutputs to 1 for FLUX_PRO and FLUX_1_1_PRO
    if (mode.value.id === MODEL_IDS.FLUX_PRO || mode.value.id === MODEL_IDS.FLUX_1_1_PRO) {
      noOfOutputs.value = 1;
    }

    const aspects = allAspectRatioOptions.value;
    if (showAspectRatio.value && aspects.length > 0) {
      const stillValid = aspects.some((r) => r.title === aspectRatio.value.title);
      if (!stillValid) aspectRatio.value = aspects[0];
    }
    const formats = outputFormatOptions.value;
    if (showOutputFormat.value && formats.length > 0) {
      const stillValid = formats.some((f) => f.title === imageFormat.value.title);
      if (!stillValid) imageFormat.value = formats[0];
    }
  },
);

onMounted(() => {
  aspectRatio.value = ASPECT_RATIOS[0];
  imageFormat.value = IMAGE_FORMATS[0];
  noOfOutputs.value = 1;
});
</script>

<template>
  <div
    data-testid="image-generate-aside"
    class="tw-flex tw-flex-col tw-gap-3"
    aria-label="Image generation settings"
  >
    <AsideDisclosure title="Model & Style" :storage-key="MODEL_STYLE_STORAGE_KEY">
      <section class="tw-flex tw-flex-col tw-gap-1.5">
        <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Model </span>
        <ModelPicker chip :models="MODELS" v-model:selected="mode" :fallback="FLUX_MODES[1]" />
      </section>

      <section class="tw-flex tw-flex-col tw-gap-1.5">
        <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Style </span>
        <StylePicker v-model="styleId" />
      </section>

      <section class="tw-flex tw-flex-col tw-gap-1.5">
        <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Enhance </span>
        <PromptEnhancePicker v-model="enhanceMode" />
      </section>
    </AsideDisclosure>

    <div class="tw-h-px tw-bg-border/60" aria-hidden="true" />

    <AsideDisclosure title="Output settings" :storage-key="OUTPUT_SETTINGS_STORAGE_KEY">
      <section v-if="showAspectRatio" class="tw-flex tw-flex-col tw-gap-1.5">
        <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Size </span>
        <AspectRatioPicker v-model="aspectRatio" :options="allAspectRatioOptions" />
      </section>

      <section v-if="showOutputQuality" class="tw-flex tw-flex-col tw-gap-1.5">
        <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Quality </span>
        <div
          class="tw-grid tw-grid-cols-2 tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
          role="group"
          aria-label="Output quality"
        >
          <button
            v-for="option in [
              { label: 'SD', value: 0 as const },
              { label: 'HD', value: 1 as const },
            ]"
            :key="option.label"
            type="button"
            :aria-pressed="outputQuality === option.value"
            :class="segmentClass(outputQuality === option.value)"
            @click="selectQuality(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <section v-if="showNumOutputs" class="tw-flex tw-flex-col tw-gap-1.5">
        <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Images </span>
        <div
          class="tw-grid tw-grid-cols-4 tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
          role="group"
          aria-label="Number of images"
        >
          <button
            v-for="count in countOptions"
            :key="count"
            type="button"
            :aria-pressed="noOfOutputs === count"
            :class="segmentClass(noOfOutputs === count)"
            @click="selectCount(count)"
          >
            {{ count }}
          </button>
        </div>
      </section>

      <section v-if="showOutputFormat" class="tw-flex tw-flex-col tw-gap-1.5">
        <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Format </span>
        <div
          class="tw-grid tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
          :class="formatGridClass"
          role="group"
          aria-label="Output format"
        >
          <button
            v-for="format in outputFormatOptions"
            :key="format.title"
            type="button"
            :aria-pressed="imageFormat.title === format.title"
            :class="segmentClass(imageFormat.title === format.title)"
            @click="selectFormat(format)"
          >
            {{ format.title }}
          </button>
        </div>
      </section>
    </AsideDisclosure>
  </div>
</template>

<style scoped>
:deep([data-testid='model-picker'] .tw-relative.tw-inline-block) {
  display: block;
  width: 100%;
}

:deep([data-testid='model-picker'] .tw-relative.tw-inline-block > button) {
  width: 100%;
  min-height: 36px;
  justify-content: flex-start;
  padding: 0;
  border: none;
  background: transparent;
}
</style>
