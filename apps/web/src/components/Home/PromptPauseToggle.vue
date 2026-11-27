<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  /** The rotation is held by the visitor. */
  paused: boolean;
}>();

const emit = defineEmits<{ toggle: [] }>();

// The name says what pressing does, so it flips with the state.
const label = computed(() => (props.paused ? 'Play example prompts' : 'Pause example prompts'));
</script>

<template>
  <button type="button" class="toggle" :aria-label="label" :title="label" @click="emit('toggle')">
    <svg class="toggle__icon" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path v-if="paused" d="M3 1.5v9l7.5-4.5z" />
      <path v-else d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />
    </svg>
  </button>
</template>

<style scoped lang="scss">
.toggle {
  /* WCAG 2.5.8 target size; the prompt box positions it so the label row keeps its height. */
  --toggle-size: 1.5rem;

  display: inline-grid;
  place-items: center;
  width: var(--toggle-size);
  height: var(--toggle-size);
  padding: 0;
  border: 0;
  border-radius: 6px;
  background-color: transparent;
  color: rgb(var(--tw-ink-muted));
  cursor: pointer;
  transition:
    color 200ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 200ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: rgb(var(--tw-ink-secondary));
    background-color: rgb(var(--tw-ink-primary) / 0.06);
  }
}

.toggle__icon {
  width: 0.625rem;
  height: 0.625rem;
  fill: currentColor;
}
</style>
