<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  label: string;
  hint: string;
  accept: string;
  buttonLabel: string;
  dragging: boolean;
  busy: boolean;
  error: string;
  testId: string;
}>();

const emit = defineEmits<{
  pick: [event: Event];
  dragover: [event: DragEvent];
  dragleave: [];
  drop: [event: DragEvent];
}>();

const input = ref<HTMLInputElement | null>(null);
const ERROR_ID = computed(() => `${props.testId}-error`);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2" :data-testid="testId">
    <span class="tw-text-sm tw-font-semibold tw-text-ink-primary">{{ label }}</span>
    <div
      class="zone"
      :class="{ 'zone--active': dragging }"
      @dragover="emit('dragover', $event)"
      @dragleave="emit('dragleave')"
      @drop="emit('drop', $event)"
    >
      <p class="tw-m-0 tw-text-sm tw-text-ink-muted">{{ hint }}</p>
      <button
        type="button"
        class="zone__btn"
        :disabled="busy"
        :aria-busy="busy"
        :aria-describedby="error ? ERROR_ID : undefined"
        :data-testid="`${testId}-pick`"
        @click="input?.click()"
      >
        {{ busy ? 'Uploading...' : buttonLabel }}
      </button>
      <input
        ref="input"
        type="file"
        class="tw-sr-only"
        tabindex="-1"
        :accept="accept"
        :aria-label="buttonLabel"
        :data-testid="`${testId}-input`"
        @change="emit('pick', $event)"
      />
    </div>
    <p v-if="error" :id="ERROR_ID" role="alert" class="zone__error" :data-testid="ERROR_ID">
      {{ error }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.zone {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px dashed rgb(var(--tw-border));
  border-radius: 0.75rem;
  transition: background-color 150ms ease-out;

  &--active {
    border-color: rgb(var(--studio-accent));
    background: rgb(var(--tw-surface-2));
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.zone__btn {
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid rgb(var(--studio-accent));
  border-radius: 9999px;
  color: rgb(var(--studio-accent));
  font-size: 0.875rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.zone__error {
  margin: 0;
  font-size: 0.8125rem;
  color: rgb(var(--tw-danger, 220 38 38));
}
</style>
