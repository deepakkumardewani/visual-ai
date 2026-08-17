<script setup lang="ts">
import type { Model } from '@/types/model';
import { computed } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { getTierCreditLabel } from '@/utils/generationCredits';
import { getModelBestForHint, getModelLogoUrl, getModelSpeedHint } from '@/utils/models';

import ProviderIcon from '@/components/primitives/ProviderIcon.vue';

const props = defineProps<{
  model: Model;
  selected?: boolean;
}>();

defineEmits<{
  select: [];
}>();

const { interactiveTransition, pressable } = useDashboardMotion();

const logoUrl = computed(() => getModelLogoUrl(props.model.iconUrl));
const speedHint = computed(() => getModelSpeedHint(props.model.id));
const costLabel = computed(() => getTierCreditLabel(props.model.tier));
const bestFor = computed(() => getModelBestForHint(props.model));
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
    <img
      v-if="logoUrl"
      :src="logoUrl"
      :alt="`${model.title} logo`"
      class="tw-h-8 tw-w-8 tw-shrink-0 tw-rounded tw-object-contain"
    />
    <ProviderIcon v-else :provider="model.provider" size="sm" />

    <span class="tw-min-w-0 tw-flex-1">
      <span class="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
        <span class="tw-truncate tw-text-sm tw-font-semibold tw-text-ink">{{ model.title }}</span>
        <span class="tw-flex tw-shrink-0 tw-items-center tw-gap-1">
          <span
            v-if="speedHint"
            class="tw-inline-flex tw-items-center tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-1 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wide tw-text-ink-muted"
          >
            {{ speedHint }}
          </span>
          <span
            class="tw-inline-flex tw-items-center tw-rounded-chip tw-border tw-border-accent/30 tw-bg-accent-subtle tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-tabular-nums tw-text-accent"
          >
            {{ costLabel }}
          </span>
        </span>
      </span>

      <span class="tw-mt-0.5 tw-block tw-truncate tw-text-xs tw-text-ink-muted">
        Best for {{ bestFor }}
      </span>
    </span>
  </button>
</template>
