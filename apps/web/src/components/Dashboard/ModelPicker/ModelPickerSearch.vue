<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

function clear() {
  emit('update:modelValue', '');
  inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus() });
</script>

<template>
  <div
    class="tw-sticky tw-top-0 tw-z-[3] tw-h-[var(--picker-search-h)] tw-bg-surface-1 tw-pb-1.5 tw-pt-0.5"
  >
    <div class="tw-relative tw-flex tw-h-full tw-items-center">
      <!-- Inline SVG: the magnifying-glass glyph is not registered in plugins/icons.ts. -->
      <svg
        class="tw-pointer-events-none tw-absolute tw-left-3 tw-h-3.5 tw-w-3.5 tw-text-ink-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <!-- type=text with role=searchbox avoids the native WebKit clear button doubling ours. -->
      <input
        ref="inputRef"
        type="text"
        role="searchbox"
        data-testid="model-search-input"
        aria-label="Search models"
        placeholder="Search models"
        autocomplete="off"
        spellcheck="false"
        :value="modelValue"
        class="tw-h-full tw-w-full tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-2 tw-pl-8 tw-pr-9 tw-text-base tw-text-ink placeholder:tw-text-ink-muted focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent md:tw-text-sm"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="modelValue"
        type="button"
        data-testid="model-search-clear"
        aria-label="Clear search"
        class="tw-absolute tw-right-1 tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-chip tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent"
        @click="clear"
      >
        <font-awesome-icon icon="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
