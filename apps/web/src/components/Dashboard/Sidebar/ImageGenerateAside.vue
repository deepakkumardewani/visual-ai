<script setup lang="ts">
import { MODEL_REGISTRY } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';
import { useGenerateStore } from '@/stores/generate';

import AspectRatioPicker from '@/components/Dashboard/Sidebar/AspectRatioPicker.vue';
import StylePicker from '@/components/Dashboard/Sidebar/StylePicker.vue';
import PromptEnhancePicker from '@/components/Dashboard/Sidebar/PromptEnhancePicker.vue';
import ModelPicker from '@/components/Dashboard/ModelPicker/ModelPicker.vue';

import { ASPECT_RATIOS, IMAGE_FORMATS, PRIMARY_ASPECT_COUNT } from '@/utils/constants';

type FormatOption = (typeof IMAGE_FORMATS)[number];

const router = useRouter();
const asideStore = useAsideStore();
const userStore = useUserStore();
const generateStore = useGenerateStore();

const { isPro } = storeToRefs(userStore);
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

function isProLocked(optionIsPro: boolean) {
  return optionIsPro && !isPro.value;
}

function onAspectProRequired() {
  aspectRatio.value = ASPECT_RATIOS[0];
  router.push('/pricing');
}

function selectFormat(format: FormatOption) {
  if (!isPro.value && format.isPro) {
    imageFormat.value = IMAGE_FORMATS[0];
    router.push('/pricing');
    return;
  }
  imageFormat.value = format;
}

function selectCount(count: number) {
  if (count === 4 && !isPro.value) {
    router.push('/pricing');
    return;
  }
  noOfOutputs.value = count;
}

function selectQuality(value: 0 | 1) {
  if (!isPro.value && value === 1) {
    outputQuality.value = 0;
    router.push('/pricing');
    return;
  }
  outputQuality.value = value;
}

watch(outputQuality, (newVal) => {
  if (!isPro.value && newVal === 1) {
    outputQuality.value = 0;
    router.push('/pricing');
  }
});

watch(showNumOutputs, (supported) => {
  if (!supported) noOfOutputs.value = 1;
});

watch(
  () => mode.value.id,
  () => {
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
    class="tw-flex tw-flex-col tw-gap-4"
    aria-label="Image generation settings"
  >
    <section class="tw-flex tw-flex-col tw-gap-1.5">
      <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Model </span>
      <ModelPicker chip />
    </section>

    <section class="tw-flex tw-flex-col tw-gap-1.5">
      <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Style </span>
      <StylePicker v-model="styleId" />
    </section>

    <section class="tw-flex tw-flex-col tw-gap-1.5">
      <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Enhance </span>
      <PromptEnhancePicker v-model="enhanceMode" />
    </section>

    <section v-if="showAspectRatio" class="tw-flex tw-flex-col tw-gap-1.5">
      <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Size </span>
      <AspectRatioPicker
        v-model="aspectRatio"
        :options="allAspectRatioOptions"
        :is-pro="isPro"
        @pro-required="onAspectProRequired"
      />
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
            { label: 'SD', value: 0 as const, isPro: false },
            { label: 'HD', value: 1 as const, isPro: true },
          ]"
          :key="option.label"
          type="button"
          :aria-pressed="outputQuality === option.value"
          :class="segmentClass(outputQuality === option.value)"
          @click="selectQuality(option.value)"
        >
          {{ option.label }}
          <span
            v-if="isProLocked(option.isPro)"
            class="tw-absolute tw-right-1 tw-top-1 tw-h-1 tw-w-1 tw-rounded-full tw-bg-gold"
            aria-hidden="true"
          />
          <span v-if="isProLocked(option.isPro)" class="tw-sr-only">(Pro)</span>
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
          <span
            v-if="isProLocked(count === 4)"
            class="tw-absolute tw-right-1 tw-top-1 tw-h-1 tw-w-1 tw-rounded-full tw-bg-gold"
            aria-hidden="true"
          />
          <span v-if="isProLocked(count === 4)" class="tw-sr-only">(Pro)</span>
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
          <span
            v-if="isProLocked(format.isPro)"
            class="tw-absolute tw-right-1 tw-top-1 tw-h-1 tw-w-1 tw-rounded-full tw-bg-gold"
            aria-hidden="true"
          />
          <span v-if="isProLocked(format.isPro)" class="tw-sr-only">(Pro)</span>
        </button>
      </div>
    </section>
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
