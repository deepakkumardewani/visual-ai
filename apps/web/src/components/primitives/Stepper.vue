<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
  }>(),
  {
    min: 1,
    max: 4,
    step: 1,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const canDecrement = computed(() => props.modelValue - props.step >= props.min);
const canIncrement = computed(() => props.modelValue + props.step <= props.max);

const clamp = (value: number) => Math.min(props.max, Math.max(props.min, value));

const decrement = () => {
  if (!canDecrement.value) return;
  emit("update:modelValue", clamp(props.modelValue - props.step));
};

const increment = () => {
  if (!canIncrement.value) return;
  emit("update:modelValue", clamp(props.modelValue + props.step));
};

const onInputKeydown = (event: KeyboardEvent) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    increment();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    decrement();
  }
};
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2">
    <span v-if="label" class="tw-text-body-sm tw-font-medium tw-text-ink-muted">{{ label }}</span>
    <div
      class="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-2 tw-p-1"
    >
      <button
        type="button"
        aria-label="Decrease value"
        class="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-chip tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-bg-surface-3 hover:tw-text-ink disabled:tw-cursor-not-allowed disabled:tw-opacity-40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        :disabled="!canDecrement"
        @click="decrement"
      >
        <font-awesome-icon icon="minus" />
      </button>

      <span
        role="spinbutton"
        tabindex="0"
        :aria-valuenow="modelValue"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-label="label ?? 'Stepper value'"
        class="tw-min-w-[2.5rem] tw-select-none tw-text-center tw-text-body-base tw-font-semibold tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        @keydown="onInputKeydown"
      >
        {{ modelValue }}
      </span>

      <button
        type="button"
        aria-label="Increase value"
        class="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-chip tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-bg-surface-3 hover:tw-text-ink disabled:tw-cursor-not-allowed disabled:tw-opacity-40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        :disabled="!canIncrement"
        @click="increment"
      >
        <font-awesome-icon icon="plus" />
      </button>
    </div>
  </div>
</template>
