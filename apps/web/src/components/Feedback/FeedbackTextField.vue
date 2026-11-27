<script setup lang="ts">
import { computed, useId } from 'vue';

import { FEEDBACK_COUNTER_WARN_REMAINING } from '@/utils/feedbackUi';

const model = defineModel<string>({ required: true });

const props = withDefaults(
  defineProps<{
    label: string;
    maxLength: number;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    /** Marks the field optional in the label so users know they can skip it. */
    optional?: boolean;
  }>(),
  { placeholder: '', rows: 4, disabled: false, optional: false },
);

const fieldId = useId();
const counterId = `${fieldId}-count`;
const remaining = computed(() => props.maxLength - model.value.length);
const isNearLimit = computed(() => remaining.value <= FEEDBACK_COUNTER_WARN_REMAINING);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-1.5">
    <label :for="fieldId" class="tw-text-sm tw-font-medium tw-text-ink-primary">
      {{ label }}
      <span v-if="optional" class="tw-font-normal tw-text-ink-muted">(optional)</span>
    </label>
    <textarea
      :id="fieldId"
      v-model="model"
      :rows="rows"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-describedby="counterId"
      class="tw-w-full tw-resize-none tw-rounded-md tw-border tw-border-border tw-bg-surface-2/60 tw-px-3 tw-py-2.5 tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast placeholder:tw-text-ink-faint focus:tw-border-gold/55 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-gold/15 disabled:tw-opacity-60 motion-reduce:tw-transition-none"
    />
    <span
      :id="counterId"
      class="tw-self-end tw-text-xs tw-tabular-nums"
      :class="isNearLimit ? 'tw-text-accent' : 'tw-text-ink-muted'"
    >
      {{ model.length }}/{{ maxLength }}
    </span>
  </div>
</template>
