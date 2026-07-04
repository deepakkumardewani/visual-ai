<script setup lang="ts">
import { useDashboardMotion } from "@/composables/useDashboardMotion";

defineProps<{
  label: string;
  open?: boolean;
  icon?: string;
}>();

const { chevronTransition, interactiveTransition } = useDashboardMotion();
</script>

<template>
  <span
    data-testid="composer-chip"
    :class="[
      'tw-inline-flex tw-min-h-[44px] tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-2 tw-px-3 tw-py-1.5 tw-text-body-sm tw-text-ink',
      interactiveTransition,
      open ? 'tw-border-accent/50' : 'hover:tw-border-accent/30',
    ]"
  >
    <font-awesome-icon
      v-if="icon"
      :icon="icon"
      class="tw-h-3.5 tw-w-3.5 tw-shrink-0 tw-text-ink-muted"
      aria-hidden="true"
    />
    <span class="tw-truncate tw-font-medium">{{ label }}</span>
    <span
      class="tw-shrink-0 tw-text-ink-muted"
      :class="[chevronTransition, open ? 'tw-rotate-180' : '']"
      aria-hidden="true"
    >
      ▾
    </span>
  </span>
</template>
