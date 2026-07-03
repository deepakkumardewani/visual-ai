<script setup lang="ts">
import type { Model } from "@/types/model";

import { useDashboardMotion } from "@/composables/useDashboardMotion";

import ProviderIcon from "@/components/primitives/ProviderIcon.vue";
import TierBadge from "@/components/primitives/TierBadge.vue";

import { formatPrice } from "@/utils/models";

defineProps<{
  model: Model;
  selected?: boolean;
}>();

defineEmits<{
  select: [];
}>();

const { interactiveTransition, pressable } = useDashboardMotion();
</script>

<template>
  <button
    type="button"
    role="option"
    :aria-selected="selected"
    data-testid="model-option"
    class="tw-flex tw-w-full tw-gap-3 tw-rounded-chip tw-p-2 tw-text-left hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
    :class="[
      interactiveTransition,
      pressable,
      selected ? 'tw-bg-surface-2 tw-ring-1 tw-ring-accent/30' : '',
    ]"
    @click="$emit('select')"
  >
    <ProviderIcon :provider="model.provider" size="sm" />

    <span class="tw-min-w-0 tw-flex-1">
      <span class="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span class="tw-text-sm tw-font-semibold tw-text-ink">{{ model.title }}</span>
        <TierBadge :tier="model.tier" />
      </span>

      <span class="tw-mt-0.5 tw-block tw-text-xs tw-text-ink-muted">{{ model.description }}</span>

      <span
        v-if="model.bestAt || model.pricePerImage !== undefined"
        class="tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-2 tw-text-[11px] tw-text-ink-muted"
      >
        <span v-if="model.bestAt">{{ model.bestAt }}</span>
        <span v-if="formatPrice(model.pricePerImage)" class="tw-text-accent">
          {{ formatPrice(model.pricePerImage) }}/img
        </span>
      </span>
    </span>
  </button>
</template>
