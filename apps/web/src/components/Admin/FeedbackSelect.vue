<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue';

const model = defineModel<T | ''>({ required: true });

defineProps<{
  label: string;
  options: { value: T; label: string }[];
  /** Label of the empty option; omit when a value is always required. */
  anyLabel?: string;
  disabled?: boolean;
}>();

const selectId = useId();
</script>

<template>
  <div class="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
    <label :for="selectId" class="tw-text-xs tw-font-medium tw-text-ink-muted">{{ label }}</label>
    <select
      :id="selectId"
      v-model="model"
      :disabled="disabled"
      class="tw-min-h-[44px] tw-w-full tw-rounded-md tw-border tw-border-border tw-bg-surface-2/60 tw-px-3 tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast focus:tw-border-gold/55 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-gold/15 disabled:tw-opacity-60 motion-reduce:tw-transition-none"
    >
      <option v-if="anyLabel" value="">{{ anyLabel }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
