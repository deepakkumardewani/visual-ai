<script setup lang="ts">
import type { Model } from "@/types/model";

import { useDashboardMotion } from "@/composables/useDashboardMotion";

import ProviderIcon from "@/components/primitives/ProviderIcon.vue";
import TierBadge from "@/components/primitives/TierBadge.vue";

defineProps<{
  model: Model;
  open?: boolean;
}>();

const { chevronTransition } = useDashboardMotion();
</script>

<template>
  <span
    data-testid="model-picker-trigger"
    class="tw-flex tw-w-full tw-items-center tw-gap-2 tw-text-left"
  >
    <ProviderIcon :provider="model.provider" size="sm" />
    <span class="tw-min-w-0 tw-flex-1">
      <span class="tw-block tw-truncate tw-text-sm tw-font-medium tw-text-ink">
        {{ model.title }}
      </span>
    </span>
    <TierBadge v-if="model.tier === 'premium'" :tier="model.tier" />
    <span
      class="tw-shrink-0 tw-text-ink-muted"
      :class="[chevronTransition, open ? 'tw-rotate-180' : '']"
      aria-hidden="true"
    >
      ▾
    </span>
  </span>
</template>
