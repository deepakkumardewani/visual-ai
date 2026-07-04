<script setup lang="ts">
import type { Model } from "@/types/model";

import { useDashboardMotion } from "@/composables/useDashboardMotion";

import ProviderIcon from "@/components/primitives/ProviderIcon.vue";

defineProps<{
  model: Model;
  open?: boolean;
}>();

const { chevronTransition, interactiveTransition } = useDashboardMotion();
</script>

<template>
  <span
    data-testid="model-chip"
    :class="[
      'tw-inline-flex tw-min-h-[44px] tw-max-w-[min(100%,14rem)] tw-items-center tw-gap-2 tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-2 tw-px-3 tw-py-1.5 tw-text-left',
      interactiveTransition,
      open ? 'tw-border-accent/50' : 'hover:tw-border-accent/30',
    ]"
  >
    <ProviderIcon :provider="model.provider" size="sm" />
    <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-text-body-sm tw-font-medium tw-text-ink">
      {{ model.title }}
    </span>
    <span
      class="tw-shrink-0 tw-text-ink-muted"
      :class="[chevronTransition, open ? 'tw-rotate-180' : '']"
      aria-hidden="true"
    >
      ▾
    </span>
  </span>
</template>
