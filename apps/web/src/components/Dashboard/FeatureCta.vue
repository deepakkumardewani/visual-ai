<script setup lang="ts">
import { computed } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';

import CreditCostBadge from '@/components/primitives/CreditCostBadge.vue';

const props = withDefaults(
  defineProps<{
    label: string;
    cost: number;
    testId: string;
    loading?: boolean;
    disabled?: boolean;
    premium?: boolean;
    lowCredits?: boolean;
    fullWidth?: boolean;
    creditsTestId?: string;
    ariaLabel?: string;
  }>(),
  {
    loading: false,
    disabled: false,
    premium: false,
    lowCredits: false,
    fullWidth: false,
  },
);

defineEmits<{
  click: [];
}>();

const { pressable } = useDashboardMotion();

const displayLabel = computed(() => (props.lowCredits ? 'Low credits' : props.label));
</script>

<template>
  <button
    type="button"
    :data-testid="testId"
    :class="[
      'tw-inline-flex tw-min-h-[38px] tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-px-4 tw-py-1.5 tw-text-body-sm tw-font-semibold tw-text-canvas tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.35)] tw-transition-[filter,background-color] tw-duration-fast tw-ease-soft focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40 disabled:tw-shadow-none motion-reduce:tw-transition-none',
      pressable,
      fullWidth ? 'tw-flex tw-h-11 tw-w-full' : '',
      premium
        ? 'tw-bg-gradient-gold hover:tw-brightness-110 focus-visible:tw-outline-gold'
        : 'tw-bg-accent focus-visible:tw-outline-accent hover:tw-bg-accent-hover',
      lowCredits && !disabled ? 'tw-opacity-80' : '',
    ]"
    :data-premium-cue="premium ? 'true' : undefined"
    :disabled="disabled"
    :aria-busy="loading"
    :aria-label="ariaLabel"
    :title="lowCredits ? `Needs ${cost} credits` : undefined"
    @click="$emit('click')"
  >
    <span
      v-if="loading"
      class="tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-canvas/30 tw-border-t-canvas motion-reduce:tw-animate-none"
      aria-hidden="true"
    />
    <template v-else>
      <span>{{ displayLabel }}</span>
      <CreditCostBadge
        :data-testid="creditsTestId"
        :cost="cost"
        :class="{ 'tw-ring-1 tw-ring-canvas/50': lowCredits }"
      />
    </template>
  </button>
</template>
