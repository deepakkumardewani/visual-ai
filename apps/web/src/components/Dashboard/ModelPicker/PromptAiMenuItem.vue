<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
  loading?: boolean;
  disabled?: boolean;
  testId: string;
  loadingTestId?: string;
}>();

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    role="menuitem"
    :data-testid="testId"
    :class="[
      'tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-rounded-md tw-px-2.5 tw-py-1.5 tw-text-left tw-outline-none focus:tw-outline-none focus-visible:tw-outline-none focus-visible:tw-bg-surface-2 hover:tw-bg-surface-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
      loading ? 'tw-bg-surface-2' : '',
    ]"
    :disabled="disabled"
    :aria-busy="loading || undefined"
    @click="$emit('click')"
  >
    <span
      class="tw-relative tw-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-bg-surface-3/60"
      aria-hidden="true"
    >
      <font-awesome-icon v-if="!loading" :icon="icon" class="tw-h-3.5 tw-w-3.5 tw-text-ink-muted" />
      <span
        v-else
        :data-testid="loadingTestId"
        class="tw-inline-block tw-h-3.5 tw-w-3.5 tw-animate-spin tw-rounded-full tw-border-2 tw-border-accent/25 tw-border-t-accent motion-reduce:tw-animate-none"
      />
      <span
        v-if="loading"
        class="tw-pointer-events-none tw-absolute tw-inset-0 tw-rounded-md tw-bg-accent/10 tw-animate-pulse motion-reduce:tw-animate-none"
      />
    </span>

    <span class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0 tw-leading-tight">
      <span class="tw-text-body-sm tw-font-medium tw-text-ink">{{ title }}</span>
      <span class="tw-text-xs tw-leading-snug tw-tracking-normal tw-text-ink-muted">
        {{ loading ? 'Working…' : description }}
      </span>
    </span>
  </button>
</template>
