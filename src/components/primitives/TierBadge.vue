<script setup lang="ts">
import type { ModelTier } from "@/types/primitives";

defineProps<{
  tier: ModelTier;
}>();

const tierLabel: Record<ModelTier, string> = {
  budget: "Budget",
  standard: "Standard",
  premium: "Premium",
};
</script>

<template>
  <span
    class="tw-inline-flex tw-items-center tw-rounded-chip tw-px-2 tw-py-0.5 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest"
    :class="
      tier === 'premium'
        ? 'tw-bg-gradient-gold tw-text-canvas'
        : tier === 'standard'
          ? 'tw-border tw-border-accent/40 tw-bg-accent-subtle tw-text-accent'
          : 'tw-border tw-border-hairline tw-bg-surface-2 tw-text-ink-muted'
    "
  >
    {{ tierLabel[tier] }}
  </span>
</template>
