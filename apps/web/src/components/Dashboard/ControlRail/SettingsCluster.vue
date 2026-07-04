<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import type { SegmentedOption } from '@/types/primitives';

import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';

import SegmentedControl from '@/components/primitives/SegmentedControl.vue';

import { ASPECT_RATIOS, IMAGE_FORMATS, MODEL_IDS } from '@/utils/constants';

const router = useRouter();
const asideStore = useAsideStore();
const userStore = useUserStore();

const { isPro } = storeToRefs(userStore);
const { aspectRatio, imageFormat, outputQuality, noOfOutputs, mode } = storeToRefs(asideStore);

const aspectOptions: SegmentedOption<string>[] = ASPECT_RATIOS.map((ratio) => ({
  label: ratio.title,
  value: ratio.title,
}));

const formatOptions: SegmentedOption<string>[] = IMAGE_FORMATS.map((format) => ({
  label: format.title,
  value: format.title,
}));

const qualityOptions: SegmentedOption<number>[] = [
  { label: 'SD', value: 0 },
  { label: 'HD', value: 1 },
];

const aspectValue = computed({
  get: () => aspectRatio.value.title,
  set: (title: string) => {
    const item = ASPECT_RATIOS.find((ratio) => ratio.title === title);
    if (!item) return;

    if (!isPro.value && item.isPro) {
      aspectRatio.value = ASPECT_RATIOS[0];
      router.push('/pricing');
    } else {
      aspectRatio.value = item;
    }
  },
});

const formatValue = computed({
  get: () => imageFormat.value.title,
  set: (title: string) => {
    const item = IMAGE_FORMATS.find((format) => format.title === title);
    if (!item) return;

    if (!isPro.value && item.isPro) {
      imageFormat.value = IMAGE_FORMATS[0];
      router.push('/pricing');
    } else {
      imageFormat.value = item;
    }
  },
});

const disableModifyVariations = computed(
  () => mode.value.id === MODEL_IDS.FLUX_PRO || mode.value.id === MODEL_IDS.FLUX_1_1_PRO,
);

function handleImageVariations(type: 'add' | 'subtract') {
  if (type === 'subtract') {
    if (noOfOutputs.value === 4) {
      noOfOutputs.value = 2;
    } else if (noOfOutputs.value > 1) {
      noOfOutputs.value = 1;
    }
    return;
  }

  if (noOfOutputs.value === 2) {
    if (!isPro.value) {
      router.push('/pricing');
    } else {
      noOfOutputs.value = 4;
    }
  } else if (noOfOutputs.value === 1) {
    noOfOutputs.value = 2;
  }
}

onMounted(() => {
  aspectRatio.value = ASPECT_RATIOS[0];
  imageFormat.value = IMAGE_FORMATS[0];
  noOfOutputs.value = 1;
});
</script>

<template>
  <div data-testid="settings-cluster" class="tw-flex tw-flex-col tw-gap-4">
    <div class="settings-cluster__row tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
      <div class="settings-cluster__aspect [&_[role=radiogroup]]:tw-flex-wrap">
        <SegmentedControl v-model="aspectValue" :options="aspectOptions" label="Size" />
      </div>
      <SegmentedControl v-model="formatValue" :options="formatOptions" label="Format" />
    </div>

    <div class="settings-cluster__row tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
      <SegmentedControl v-model="outputQuality" :options="qualityOptions" label="Quality" />

      <div class="tw-flex tw-flex-col tw-gap-2">
        <span class="tw-text-body-sm tw-font-medium tw-text-ink-muted">Images</span>
        <div
          class="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-2 tw-p-1"
        >
          <button
            type="button"
            aria-label="Decrease variations"
            class="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-chip tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-bg-surface-3 hover:tw-text-ink disabled:tw-cursor-not-allowed disabled:tw-opacity-40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
            :disabled="disableModifyVariations || noOfOutputs <= 1"
            @click="handleImageVariations('subtract')"
          >
            <font-awesome-icon icon="minus" />
          </button>

          <span
            role="status"
            aria-live="polite"
            class="tw-min-w-[2.5rem] tw-select-none tw-text-center tw-text-body-base tw-font-semibold tw-text-ink"
          >
            {{ noOfOutputs }}
          </span>

          <button
            type="button"
            aria-label="Increase variations"
            class="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-chip tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-bg-surface-3 hover:tw-text-ink disabled:tw-cursor-not-allowed disabled:tw-opacity-40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
            :disabled="disableModifyVariations || noOfOutputs >= 4"
            @click="handleImageVariations('add')"
          >
            <font-awesome-icon icon="plus" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
