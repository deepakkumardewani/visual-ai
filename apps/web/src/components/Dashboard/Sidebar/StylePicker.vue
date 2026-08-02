<script setup lang="ts">
import { ref } from 'vue';

import { STYLE_PRESETS, type StyleId } from '@visual-ai/shared';

import ChevronCaret from '@/components/primitives/ChevronCaret.vue';
import Popover from '@/components/primitives/Popover.vue';

const props = defineProps<{
  modelValue: StyleId;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: StyleId];
}>();

const isOpen = ref(false);

function selectedLabel(): string {
  return STYLE_PRESETS.find((preset) => preset.id === props.modelValue)?.label ?? '';
}

function select(styleId: StyleId) {
  emit('update:modelValue', styleId);
  isOpen.value = false;
}
</script>

<template>
  <div data-testid="style-picker">
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
        aria-label="Style preset"
        class="tw-flex tw-max-h-[min(24rem,60vh)] tw-w-full tw-flex-col tw-gap-0.5 tw-overflow-y-auto no-scrollbar"
      >
        <button
          v-for="preset in STYLE_PRESETS"
          :key="preset.id"
          type="button"
          role="option"
          :data-testid="`style-${preset.id}`"
          :aria-selected="modelValue === preset.id"
          class="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-chip tw-px-3 tw-py-2 tw-text-left tw-text-body-sm tw-font-medium tw-text-ink tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
          :class="modelValue === preset.id ? 'tw-bg-surface-2' : ''"
          @click="select(preset.id)"
        >
          <span class="tw-truncate">{{ preset.label }}</span>
          <font-awesome-icon
            v-if="modelValue === preset.id"
            icon="check"
            class="tw-h-3 tw-w-3 tw-shrink-0 tw-text-ink"
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
