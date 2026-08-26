<script setup lang="ts">
import { ref } from 'vue';

import type { Model } from '@/types/model';

import Heading from '@/components/Dashboard/ModelPicker/Heading.vue';
import ModelChip from '@/components/Dashboard/Composer/ModelChip.vue';
import ModelPickerPanel from '@/components/Dashboard/ModelPicker/ModelPickerPanel.vue';
import ModelPickerTrigger from '@/components/Dashboard/ModelPicker/ModelPickerTrigger.vue';
import Popover from '@/components/primitives/Popover.vue';

const props = defineProps<{
  chip?: boolean;
  models: Model[];
  selected: Model;
  fallback: Model;
}>();

const emit = defineEmits<{
  'update:selected': [model: Model];
}>();

const isOpen = ref(false);

function handleSelect(model: Model) {
  emit('update:selected', model);
  isOpen.value = false;
}
</script>

<template>
  <div data-testid="model-picker">
    <Heading v-if="!chip" title="Model" />

    <Popover v-model:open="isOpen" placement="bottom-start">
      <template #trigger="{ open }">
        <ModelChip v-if="chip" :model="props.selected" :open="open" />
        <ModelPickerTrigger v-else :model="props.selected" :open="open" />
      </template>

      <ModelPickerPanel
        :models="props.models"
        :selected-model="props.selected"
        @select-model="handleSelect"
      />
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
