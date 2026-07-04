<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';

import ModelPicker from '@/components/Dashboard/ControlRail/ModelPicker.vue';

import { ASPECT_RATIOS, IMAGE_FORMATS, MODEL_IDS } from '@/utils/constants';

const router = useRouter();
const asideStore = useAsideStore();
const userStore = useUserStore();

const { isPro } = storeToRefs(userStore);
const { aspectRatio, imageFormat, outputQuality, noOfOutputs, mode } = storeToRefs(asideStore);

const countOptions = [1, 2, 3, 4] as const;

const disableCount = computed(
  () => mode.value.id === MODEL_IDS.FLUX_PRO || mode.value.id === MODEL_IDS.FLUX_1_1_PRO,
);

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
    class="tw-flex tw-h-full tw-flex-col tw-gap-5 tw-p-3 sm:tw-p-4"
    aria-label="Generation settings"
  >
    <section class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        Model
      </span>
      <ModelPicker chip />
    </section>

    <section class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        Size
      </span>
      <div class="tw-grid tw-grid-cols-4 tw-gap-1.5" role="group" aria-label="Aspect ratio">
        <button
          v-for="ratio in ASPECT_RATIOS.slice(0, 4)"
          :key="ratio.title"
          type="button"
          :data-testid="`aspect-${ratio.title}`"
          :aria-pressed="aspectRatio.title === ratio.title"
          :class="[
            'tw-flex tw-min-h-[44px] tw-flex-col tw-items-center tw-justify-center tw-gap-0.5 tw-rounded-md tw-border tw-text-eyebrow tw-font-medium tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]',
            aspectRatio.title === ratio.title
              ? 'tw-border-accent/60 tw-bg-accent-subtle tw-text-ink'
              : 'tw-border-hairline tw-bg-surface-2 tw-text-ink-muted hover:tw-border-accent/30 hover:tw-text-ink',
          ]"
          @click="selectAspect(ratio)"
        >
          <span>{{ ratio.title }}</span>
        </button>
      </div>
    </section>

    <section class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        Quality
      </span>
      <div class="tw-grid tw-grid-cols-2 tw-gap-1.5" role="group" aria-label="Output quality">
        <button
          v-for="option in [
            { label: 'SD', value: 0 as const },
            { label: 'HD', value: 1 as const },
          ]"
          :key="option.label"
          type="button"
          :aria-pressed="outputQuality === option.value"
          :class="[
            'tw-min-h-[44px] tw-rounded-md tw-border tw-text-body-sm tw-font-medium tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]',
            outputQuality === option.value
              ? 'tw-border-accent/60 tw-bg-accent-subtle tw-text-ink'
              : 'tw-border-hairline tw-bg-surface-2 tw-text-ink-muted hover:tw-border-accent/30 hover:tw-text-ink',
          ]"
          @click="selectQuality(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        Images
      </span>
      <div class="tw-grid tw-grid-cols-4 tw-gap-1.5" role="group" aria-label="Number of images">
        <button
          v-for="count in countOptions"
          :key="count"
          type="button"
          :aria-pressed="noOfOutputs === count"
          :disabled="disableCount && count > 1"
          :class="[
            'tw-min-h-[44px] tw-rounded-md tw-border tw-text-body-sm tw-font-semibold tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40',
            noOfOutputs === count
              ? 'tw-border-accent/60 tw-bg-accent-subtle tw-text-ink'
              : 'tw-border-hairline tw-bg-surface-2 tw-text-ink-muted hover:tw-border-accent/30 hover:tw-text-ink',
          ]"
          @click="selectCount(count)"
        >
          {{ count }}
        </button>
      </div>
    </section>

    <section class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        Format
      </span>
      <div class="tw-grid tw-grid-cols-3 tw-gap-1.5" role="group" aria-label="Output format">
        <button
          v-for="format in IMAGE_FORMATS"
          :key="format.title"
          type="button"
          :aria-pressed="imageFormat.title === format.title"
          :class="[
            'tw-min-h-[44px] tw-rounded-md tw-border tw-text-body-sm tw-font-medium tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]',
            imageFormat.title === format.title
              ? 'tw-border-accent/60 tw-bg-accent-subtle tw-text-ink'
              : 'tw-border-hairline tw-bg-surface-2 tw-text-ink-muted hover:tw-border-accent/30 hover:tw-text-ink',
          ]"
          @click="selectFormat(format)"
        >
          {{ format.title }}
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

:deep([data-testid='model-chip']) {
  width: 100%;
}
</style>
