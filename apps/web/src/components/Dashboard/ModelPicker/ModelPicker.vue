<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import type { Model } from '@/types/model';

import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';

import Heading from '@/components/Dashboard/ModelPicker/Heading.vue';
import ModelChip from '@/components/Dashboard/Composer/ModelChip.vue';
import ModelPickerPanel from '@/components/Dashboard/ModelPicker/ModelPickerPanel.vue';
import ModelPickerTrigger from '@/components/Dashboard/ModelPicker/ModelPickerTrigger.vue';
import Popover from '@/components/primitives/Popover.vue';

const { chip = false } = defineProps<{
  chip?: boolean;
}>();

import { MODEL_IDS } from '@/utils/modelIds';
import { FLUX_MODES, MODELS } from '@/utils/models';

const router = useRouter();
const asideStore = useAsideStore();
const userStore = useUserStore();

const { isPro } = storeToRefs(userStore);
const { mode, noOfOutputs } = storeToRefs(asideStore);

const isOpen = ref(false);

function handleSelect(model: Model) {
  if (!isPro.value && model.isPro) {
    mode.value = FLUX_MODES[1];
    isOpen.value = false;
    router.push('/pricing');
    return;
  }

  mode.value = model;

  if (model.id === MODEL_IDS.FLUX_PRO || model.id === MODEL_IDS.FLUX_1_1_PRO) {
    noOfOutputs.value = 1;
  }

  isOpen.value = false;
}
</script>

<template>
  <div data-testid="model-picker">
    <Heading v-if="!chip" title="Model" />

    <Popover v-model:open="isOpen" placement="bottom-start">
      <template #trigger="{ open }">
        <ModelChip v-if="chip" :model="mode" :open="open" />
        <ModelPickerTrigger v-else :model="mode" :open="open" />
      </template>

      <ModelPickerPanel :models="MODELS" :selected-model="mode" @select-model="handleSelect" />
    </Popover>
  </div>
</template>

<style scoped>
:deep(.tw-relative.tw-inline-block) {
  display: block;
  width: 100%;
}

:deep(.tw-relative.tw-inline-block > button) {
  width: 100%;
  min-height: 44px;
  justify-content: flex-start;
}
</style>
