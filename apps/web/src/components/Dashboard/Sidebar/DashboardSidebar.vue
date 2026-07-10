<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';

import ModelPicker from '@/components/Dashboard/ModelPicker/ModelPicker.vue';

import { ASPECT_RATIOS, IMAGE_FORMATS, MODEL_IDS } from '@/utils/constants';

const router = useRouter();
const asideStore = useAsideStore();
const userStore = useUserStore();

const { isPro } = storeToRefs(userStore);
const { aspectRatio, imageFormat, outputQuality, noOfOutputs, mode } = storeToRefs(asideStore);

const countOptions = [1, 2, 3, 4] as const;

const ASPECT_ICON_MAX_PX = 11;

function aspectIconSize(title: string) {
  const [w, h] = title.split(':').map(Number);
  const scale = ASPECT_ICON_MAX_PX / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

const disableCount = computed(
  () => mode.value.id === MODEL_IDS.FLUX_PRO || mode.value.id === MODEL_IDS.FLUX_1_1_PRO,
);

const SEGMENT_BASE =
  'tw-relative tw-flex tw-h-8 tw-items-center tw-justify-center tw-gap-1 tw-rounded-sm tw-text-body-sm tw-font-medium tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40';

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

function selectAspect(ratio: (typeof ASPECT_RATIOS)[number]) {
  if (!isPro.value && ratio.isPro) {
    aspectRatio.value = ASPECT_RATIOS[0];
    router.push('/pricing');
    return;
  }
  aspectRatio.value = ratio;
}

function selectFormat(format: (typeof IMAGE_FORMATS)[number]) {
  if (!isPro.value && format.isPro) {
    imageFormat.value = IMAGE_FORMATS[0];
    router.push('/pricing');
    return;
  }
  imageFormat.value = format;
}

function selectCount(count: number) {
  if (disableCount.value) {
    noOfOutputs.value = 1;
    return;
  }
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

onMounted(() => {
  aspectRatio.value = ASPECT_RATIOS[0];
  imageFormat.value = IMAGE_FORMATS[0];
  noOfOutputs.value = 1;
});
</script>

<template>
  <nav
    data-testid="dashboard-sidebar"
    class="tw-flex tw-flex-col tw-gap-7 tw-p-4"
    aria-label="Generation settings"
  >
    <section class="tw-flex tw-flex-col tw-gap-2.5">
      <span class="tw-flex tw-items-center tw-gap-1.5 tw-text-ink-faint">
        <font-awesome-icon icon="wand-magic-sparkles" class="tw-h-2.5 tw-w-2.5" />
        <span class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest">
          Model
        </span>
      </span>
      <ModelPicker chip />
    </section>

    <section class="tw-flex tw-flex-col tw-gap-2.5">
      <span class="tw-flex tw-items-center tw-gap-1.5 tw-text-ink-faint">
        <font-awesome-icon icon="expand" class="tw-h-2.5 tw-w-2.5" />
        <span class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest"> Size </span>
      </span>
      <div
        class="tw-grid tw-grid-cols-4 tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
        role="group"
        aria-label="Aspect ratio"
      >
        <button
          v-for="ratio in ASPECT_RATIOS.slice(0, 4)"
          :key="ratio.title"
          type="button"
          :data-testid="`aspect-${ratio.title}`"
          :aria-pressed="aspectRatio.title === ratio.title"
          :class="segmentClass(aspectRatio.title === ratio.title)"
          @click="selectAspect(ratio)"
        >
          <span
            class="tw-block tw-shrink-0 tw-rounded-[2px] tw-border tw-border-current tw-opacity-60"
            :style="{
              width: `${aspectIconSize(ratio.title).width}px`,
              height: `${aspectIconSize(ratio.title).height}px`,
            }"
            aria-hidden="true"
          />
          <span>{{ ratio.title }}</span>
          <span
            v-if="isProLocked(ratio.isPro)"
            class="tw-absolute tw-right-1 tw-top-1 tw-h-1 tw-w-1 tw-rounded-full tw-bg-gold"
            aria-hidden="true"
          />
          <span v-if="isProLocked(ratio.isPro)" class="tw-sr-only">(Pro)</span>
        </button>
      </div>
    </section>

    <section class="tw-flex tw-flex-col tw-gap-2.5">
      <span class="tw-flex tw-items-center tw-gap-1.5 tw-text-ink-faint">
        <font-awesome-icon icon="bolt" class="tw-h-2.5 tw-w-2.5" />
        <span class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest">
          Quality
        </span>
      </span>
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

    <section class="tw-flex tw-flex-col tw-gap-2.5">
      <span class="tw-flex tw-items-center tw-gap-1.5 tw-text-ink-faint">
        <font-awesome-icon icon="images" class="tw-h-2.5 tw-w-2.5" />
        <span class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest">
          Images
        </span>
      </span>
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
          :disabled="disableCount && count > 1"
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

    <section class="tw-flex tw-flex-col tw-gap-2.5">
      <span class="tw-flex tw-items-center tw-gap-1.5 tw-text-ink-faint">
        <font-awesome-icon icon="file" class="tw-h-2.5 tw-w-2.5" />
        <span class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest">
          Format
        </span>
      </span>
      <div
        class="tw-grid tw-grid-cols-3 tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
        role="group"
        aria-label="Output format"
      >
        <button
          v-for="format in IMAGE_FORMATS"
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
  </nav>
</template>

<style scoped>
:deep([data-testid='model-picker'] .tw-relative.tw-inline-block) {
  display: block;
  width: 100%;
}

:deep([data-testid='model-picker'] .tw-relative.tw-inline-block > button) {
  width: 100%;
  min-height: 44px;
  justify-content: flex-start;
  padding: 0;
  border: none;
  background: transparent;
}
</style>
