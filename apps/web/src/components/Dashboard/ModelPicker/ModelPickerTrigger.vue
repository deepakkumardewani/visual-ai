<script setup lang="ts">
import type { Model } from '@/types/model';

import ChevronCaret from '@/components/primitives/ChevronCaret.vue';
import ProviderIcon from '@/components/primitives/ProviderIcon.vue';
import TierBadge from '@/components/primitives/TierBadge.vue';

defineProps<{
  model: Model;
  open?: boolean;
}>();
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
    <ChevronCaret :open="open" :boxed="false" />
  </span>
</template>
