<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { ref, watch } from 'vue';

import type { Model } from '@/types/model';

import Heading from '@/components/Dashboard/ModelPicker/Heading.vue';
import ModelChip from '@/components/Dashboard/Composer/ModelChip.vue';
import ModelPickerPanel from '@/components/Dashboard/ModelPicker/ModelPickerPanel.vue';
import ModelPickerSheet from '@/components/Dashboard/ModelPicker/ModelPickerSheet.vue';
import ModelPickerTrigger from '@/components/Dashboard/ModelPicker/ModelPickerTrigger.vue';
import Popover from '@/components/primitives/Popover.vue';
import { useHeaderBreakpoint } from '@/composables/useHeaderBreakpoint';

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
const { isMobile } = useHeaderBreakpoint();

// Same classes as the Popover's default trigger button, so the sheet trigger looks identical.
const SHEET_TRIGGER_CLASS =
  'tw-inline-flex tw-min-h-[44px] tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-1 tw-px-4 tw-py-2 tw-text-ink tw-transition-colors tw-duration-fast hover:tw-border-accent/40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] motion-reduce:tw-transition-none';

// Crossing 768 swaps the container, so an open picker closes rather than jumping between layouts.
watch(isMobile, () => {
  isOpen.value = false;
});

function handleSelect(model: Model) {
  emit('update:selected', model);
  isOpen.value = false;
}
</script>

<template>
  <div data-testid="model-picker">
    <Heading v-if="!chip" title="Model" />

    <div v-if="isMobile" class="tw-relative tw-inline-block">
      <button
        type="button"
        aria-haspopup="dialog"
        :aria-expanded="isOpen"
        :class="SHEET_TRIGGER_CLASS"
        @click="isOpen = true"
      >
        <ModelChip v-if="chip" :model="props.selected" :open="isOpen" />
        <ModelPickerTrigger v-else :model="props.selected" :open="isOpen" />
      </button>

      <ModelPickerSheet :open="isOpen" label="Select a model" @close="isOpen = false">
        <ModelPickerPanel
          sheet
          :models="props.models"
          :selected-model="props.selected"
          @select-model="handleSelect"
        />
      </ModelPickerSheet>
    </div>

    <Popover
      v-else
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
