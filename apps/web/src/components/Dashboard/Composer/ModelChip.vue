<script setup lang="ts">
import type { Model } from '@/types/model';
import { computed } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { getModelLogoUrl } from '@/utils/models';

import ProviderIcon from '@/components/primitives/ProviderIcon.vue';

const props = defineProps<{
  model: Model;
  open?: boolean;
}>();

const { chevronTransition, interactiveTransition } = useDashboardMotion();

const logoUrl = computed(() => getModelLogoUrl(props.model.iconUrl));
</script>

<template>
  <span
    data-testid="model-chip"
    :class="[
      'tw-inline-flex tw-min-h-[44px] tw-w-full tw-items-center tw-gap-2.5 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-py-1.5 tw-pl-3 tw-pr-2 tw-text-left',
      interactiveTransition,
      open
        ? 'tw-border-accent/50 tw-bg-surface-2'
        : 'hover:tw-border-accent/30 hover:tw-bg-surface-2',
    ]"
  >
    <!-- Display model logo or fallback to provider icon -->
    <img
      v-if="logoUrl"
      :src="logoUrl"
      :alt="`${model.title} logo`"
      class="tw-h-6 tw-w-6 tw-shrink-0 tw-rounded tw-object-contain"
    />
    <ProviderIcon v-else :provider="model.provider" size="sm" />
    <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-text-body-sm tw-font-medium tw-text-ink">
      {{ model.title }}
    </span>
    <span
      class="tw-flex tw-h-6 tw-w-6 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-sm tw-bg-surface-3/70 tw-text-ink-muted"
      :class="[chevronTransition, open ? 'tw-rotate-180' : '']"
      aria-hidden="true"
    >
      <font-awesome-icon icon="chevron-down" class="tw-h-2.5 tw-w-2.5" />
    </span>
  </span>
</template>
