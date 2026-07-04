<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

import type { SegmentedOption } from "@/types/primitives";

import { useAsideStore } from "@/stores/aside";
import { useUserStore } from "@/stores/user";

import ComposerChip from "@/components/Dashboard/Composer/ComposerChip.vue";
import Popover from "@/components/primitives/Popover.vue";
import SegmentedControl from "@/components/primitives/SegmentedControl.vue";
import Stepper from "@/components/primitives/Stepper.vue";

import { ASPECT_RATIOS, IMAGE_FORMATS, MODEL_IDS } from "@/utils/constants";

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
  { label: "SD", value: 0 },
  { label: "HD", value: 1 },
];

const aspectValue = computed({
  get: () => aspectRatio.value.title,
  set: (title: string) => {
    const item = ASPECT_RATIOS.find((ratio) => ratio.title === title);
    if (!item) return;

    if (!isPro.value && item.isPro) {
      aspectRatio.value = ASPECT_RATIOS[0];
      router.push("/pricing");
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
      router.push("/pricing");
    } else {
      imageFormat.value = item;
    }
  },
});

const qualityLabel = computed(() => (outputQuality.value === 0 ? "SD" : "HD"));

const disableCountStepper = computed(
  () => mode.value.id === MODEL_IDS.FLUX_PRO || mode.value.id === MODEL_IDS.FLUX_1_1_PRO,
);

const countMin = computed(() => 1);
const countMax = computed(() => (disableCountStepper.value ? 1 : 4));

function handleCountChange(value: number) {
  if (disableCountStepper.value) {
    noOfOutputs.value = 1;
    return;
  }

  if (value === 4 && !isPro.value) {
    router.push("/pricing");
    return;
  }

  noOfOutputs.value = value;
}

watch(outputQuality, (newVal) => {
  if (!isPro.value && newVal === 1) {
    outputQuality.value = 0;
    router.push("/pricing");
  }
});

onMounted(() => {
  aspectRatio.value = ASPECT_RATIOS[0];
  imageFormat.value = IMAGE_FORMATS[0];
  noOfOutputs.value = 1;
});
</script>

<template>
  <div
    data-testid="settings-popovers"
    class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-2"
  >
    <Popover placement="bottom-start">
      <template #trigger="{ open }">
        <ComposerChip :label="aspectRatio.title" :open="open" />
      </template>
      <SegmentedControl v-model="aspectValue" :options="aspectOptions" label="Size" />
    </Popover>

    <Popover placement="bottom-start">
      <template #trigger="{ open }">
        <ComposerChip :label="qualityLabel" :open="open" />
      </template>
      <SegmentedControl v-model="outputQuality" :options="qualityOptions" label="Quality" />
    </Popover>

    <Popover placement="bottom-start">
      <template #trigger="{ open }">
        <ComposerChip :label="String(noOfOutputs)" :open="open" />
      </template>
      <Stepper
        :model-value="noOfOutputs"
        :min="countMin"
        :max="countMax"
        label="Images"
        @update:model-value="handleCountChange"
      />
    </Popover>

    <Popover placement="bottom-end">
      <template #trigger="{ open }">
        <ComposerChip label="Advanced" icon="gear" :open="open" />
      </template>
      <SegmentedControl v-model="formatValue" :options="formatOptions" label="Format" />
    </Popover>
  </div>
</template>

<style scoped>
:deep(.tw-relative.tw-inline-block > button) {
  min-height: 44px;
  padding: 0;
  border: none;
  background: transparent;
}
</style>
