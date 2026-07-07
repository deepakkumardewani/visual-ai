<script setup lang="ts">
import type { Model } from '@/types/model';
import { computed } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { getModelLogoUrl } from '@/utils/models';

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
    <!-- Display model logo or fallback to provider icon -->
    <img
      v-if="logoUrl"
      :src="logoUrl"
      :alt="`${model.title} logo`"
      class="tw-h-8 tw-w-8 tw-shrink-0 tw-rounded tw-object-contain"
    />
    <ProviderIcon v-else :provider="model.provider" size="sm" />

    <span class="tw-min-w-0 tw-flex-1">
      <span class="tw-block tw-text-sm tw-font-semibold tw-text-ink">{{ model.title }}</span>

      <span class="tw-mt-0.5 tw-block tw-text-xs tw-text-ink-muted">{{ model.description }}</span>
    </span>
  </button>
</template>
