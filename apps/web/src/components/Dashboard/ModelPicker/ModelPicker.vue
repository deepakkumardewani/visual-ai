<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
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

// Autofocusing the search input would pop the on-screen keyboard on touch, so only fine-pointer desktops get it.
const DESKTOP_SEARCH_AUTOFOCUS_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 768px)';
const SEARCH_INPUT_SELECTOR = '[role="searchbox"]';

const isOpen = ref(false);
const canAutofocusSearch = useMediaQuery(DESKTOP_SEARCH_AUTOFOCUS_QUERY);

function handleSelect(model: Model) {
  emit('update:selected', model);
  isOpen.value = false;
}
</script>

<template>
  <div data-testid="model-picker">
    <Heading v-if="!chip" title="Model" />

    <Popover
      v-model:open="isOpen"
      placement="bottom-start"
      navigate-options-from-input
      :autofocus-selector="canAutofocusSearch ? SEARCH_INPUT_SELECTOR : undefined"
    >
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
