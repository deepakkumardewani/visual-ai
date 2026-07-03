<script setup lang="ts" generic="T extends string | number">
import type { SegmentedOption } from "@/types/primitives";

const props = defineProps<{
  modelValue: T;
  options: SegmentedOption<T>[];
  label?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: T];
}>();

const select = (value: T) => {
  if (value !== props.modelValue) {
    emit("update:modelValue", value);
  }
};

const onKeydown = (event: KeyboardEvent, index: number) => {
  const { key } = event;
  if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") {
    return;
  }

  event.preventDefault();
  const lastIndex = props.options.length - 1;
  let nextIndex = index;

  if (key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
  if (key === "ArrowRight") nextIndex = Math.min(lastIndex, index + 1);
  if (key === "Home") nextIndex = 0;
  if (key === "End") nextIndex = lastIndex;

  select(props.options[nextIndex].value);
};
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2">
    <span v-if="label" class="tw-text-body-sm tw-font-medium tw-text-ink-muted">{{ label }}</span>
    <div
      role="radiogroup"
      :aria-label="label"
      class="tw-inline-flex tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-2 tw-p-1"
    >
      <button
        v-for="(option, index) in options"
        :key="String(option.value)"
        type="button"
        role="radio"
        :aria-checked="modelValue === option.value"
        class="tw-min-h-[44px] tw-min-w-[44px] tw-rounded-chip tw-px-3 tw-py-2 tw-text-body-sm tw-font-medium tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] motion-reduce:tw-transition-none active:tw-opacity-90"
        :class="
          modelValue === option.value
            ? 'tw-bg-accent-subtle tw-text-accent'
            : 'tw-text-ink-muted hover:tw-text-ink hover:tw-bg-surface-3'
        "
        @click="select(option.value)"
        @keydown="onKeydown($event, index)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
