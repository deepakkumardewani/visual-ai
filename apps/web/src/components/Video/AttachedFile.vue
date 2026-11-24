<script setup lang="ts">
defineProps<{
  label: string;
  name: string;
  detail?: string;
  previewUrl?: string;
  testId: string;
}>();
defineEmits<{ remove: [] }>();
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2" :data-testid="testId">
    <span class="tw-text-sm tw-font-semibold tw-text-ink-primary">{{ label }}</span>
    <div
      class="tw-flex tw-items-center tw-gap-3 tw-rounded-card tw-border tw-border-border tw-bg-surface-1 tw-p-2"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="`Preview of ${name}`"
        class="tw-h-14 tw-w-14 tw-rounded-lg tw-object-cover"
        :data-testid="`${testId}-thumb`"
      />
      <div class="tw-min-w-0 tw-flex-1">
        <p class="tw-m-0 tw-truncate tw-text-sm tw-text-ink-primary">{{ name }}</p>
        <p
          v-if="detail"
          class="tw-m-0 tw-text-xs tw-text-ink-muted"
          :data-testid="`${testId}-detail`"
        >
          {{ detail }}
        </p>
      </div>
      <button
        type="button"
        class="remove"
        :aria-label="`Remove ${label.toLowerCase()}`"
        :data-testid="`${testId}-remove`"
        @click="$emit('remove')"
      >
        Remove
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.remove {
  min-height: 44px;
  min-width: 44px;
  padding: 0 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: rgb(var(--tw-ink-primary));

  &:hover {
    background: rgb(var(--tw-surface-2));
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}
</style>
