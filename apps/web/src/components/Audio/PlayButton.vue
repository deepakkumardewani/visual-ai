<script setup lang="ts">
withDefaults(
  defineProps<{
    playing: boolean;
    /** Accessible name; the pressed state is carried by aria-pressed, so keep it verb-neutral. */
    label?: string;
  }>(),
  { label: 'Play' },
);

defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    data-testid="play-button"
    :aria-label="label"
    :aria-pressed="playing"
    class="tw-inline-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-surface-3 tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
    @click="$emit('toggle')"
  >
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path v-if="playing" d="M7 5h4v14H7zM13 5h4v14h-4z" />
      <path v-else d="M8 5v14l11-7z" />
    </svg>
  </button>
</template>
