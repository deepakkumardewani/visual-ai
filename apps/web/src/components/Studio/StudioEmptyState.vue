<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  /** Label of the one example action, e.g. "Try an example". */
  exampleLabel: string;
}>();

defineEmits<{ example: [] }>();
</script>

<template>
  <section
    data-testid="studio-empty-state"
    class="tw-flex tw-flex-col tw-items-start tw-gap-3 tw-rounded-card tw-border tw-border-dashed tw-border-border tw-p-5"
  >
    <h3 class="tw-m-0 tw-text-sm tw-font-semibold tw-text-ink-primary">
      {{ title }}
    </h3>
    <p class="tw-m-0 tw-text-sm tw-text-ink-muted">{{ description }}</p>
    <button
      type="button"
      data-testid="studio-empty-example"
      class="empty-btn"
      @click="$emit('example')"
    >
      {{ exampleLabel }}
    </button>
  </section>
</template>

<style scoped lang="scss">
.empty-btn {
  min-height: 44px;
  padding: 0 1.25rem;
  border: 1px solid rgb(var(--studio-accent, var(--tw-border)));
  border-radius: 9999px;
  color: rgb(var(--studio-accent, var(--tw-ink-primary)));
  font-size: 0.875rem;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent, var(--tw-ink-primary)));
    outline-offset: 2px;
  }
}
</style>
