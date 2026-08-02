<script setup lang="ts">
import { ref } from 'vue';

import { type EnhanceMode } from '@visual-ai/shared';

import ChevronCaret from '@/components/primitives/ChevronCaret.vue';
import Popover from '@/components/primitives/Popover.vue';

interface EnhanceModeOption {
  value: EnhanceMode;
  label: string;
  description: string;
}

const ENHANCE_MODE_OPTIONS: EnhanceModeOption[] = [
  {
    value: 'on',
    label: 'On',
    description: 'Prompts will always be refined to improve outputs.',
  },
  {
    value: 'off',
    label: 'Off',
    description: 'Prompts will not be modified.',
  },
  {
    value: 'auto',
    label: 'Auto',
    description: 'Short prompts will be expanded. Long prompts will not be modified.',
  },
];

const props = defineProps<{
  modelValue: EnhanceMode;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: EnhanceMode];
}>();

const isOpen = ref(false);

function selectedLabel(): string {
  return ENHANCE_MODE_OPTIONS.find((option) => option.value === props.modelValue)?.label ?? '';
}

function select(mode: EnhanceMode) {
  emit('update:modelValue', mode);
  isOpen.value = false;
}
</script>

<template>
  <div data-testid="prompt-enhance-picker">
    <Popover v-model:open="isOpen" placement="bottom-start" match-trigger-width>
      <template #trigger="{ open }">
        <span
          :class="[
            'tw-inline-flex tw-min-h-[44px] tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-px-3 tw-py-1.5 tw-text-left tw-transition-colors tw-duration-fast',
            open
              ? 'tw-border-accent/50 tw-bg-surface-2'
              : 'hover:tw-border-accent/30 hover:tw-bg-surface-2',
          ]"
        >
          <span class="tw-truncate tw-text-body-sm tw-font-medium tw-text-ink">{{
            selectedLabel()
          }}</span>
          <ChevronCaret :open="open" :boxed="false" />
        </span>
      </template>

      <div
        role="listbox"
        aria-label="Prompt enhancement"
        class="tw-flex tw-w-full tw-flex-col tw-gap-0.5"
      >
        <button
          v-for="option in ENHANCE_MODE_OPTIONS"
          :key="option.value"
          type="button"
          role="option"
          :data-testid="`enhance-${option.value}`"
          :aria-selected="modelValue === option.value"
          class="tw-flex tw-items-start tw-justify-between tw-gap-2 tw-rounded-chip tw-px-3 tw-py-2 tw-text-left tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
          :class="modelValue === option.value ? 'tw-bg-surface-2' : ''"
          @click="select(option.value)"
        >
          <span class="tw-min-w-0 tw-flex-1">
            <span class="tw-block tw-text-body-sm tw-font-medium tw-text-ink">{{
              option.label
            }}</span>
            <span class="tw-mt-0.5 tw-block tw-text-xs tw-text-ink-muted">{{
              option.description
            }}</span>
          </span>
          <font-awesome-icon
            v-if="modelValue === option.value"
            icon="check"
            class="tw-mt-1 tw-h-3 tw-w-3 tw-shrink-0 tw-text-ink"
          />
        </button>
      </div>
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
  padding: 0;
  border: none;
  background: transparent;
}
</style>
