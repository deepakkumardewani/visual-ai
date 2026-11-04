<script setup lang="ts">
import type { Model } from '@/types/model';
import { PREMIUM_MODEL_KEYS, type ModelKey } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { getModelBestForHint, getModelLogoUrl, getModelSpeedHint } from '@/utils/models';

import PremiumLockBadge from '@/components/Dashboard/ModelPicker/PremiumLockBadge.vue';
import ProviderIcon from '@/components/primitives/ProviderIcon.vue';

const props = defineProps<{
  model: Model;
  selected?: boolean;
}>();

const emit = defineEmits<{
  select: [];
}>();

const dialogStore = useDialogStore();
const { isPro } = storeToRefs(useUserStore());

const { interactiveTransition, pressable } = useDashboardMotion();

const logoUrl = computed(() => getModelLogoUrl(props.model.iconUrl));
const speedHint = computed(() => getModelSpeedHint(props.model.id));
const creditCost = computed(() => props.model.creditCost ?? 1);
const bestFor = computed(() => getModelBestForHint(props.model));
const isLocked = computed(
  () => !isPro.value && PREMIUM_MODEL_KEYS.includes(props.model.id as ModelKey),
);

// Locked models upsell instead of selecting, so a free user never queues a request the API rejects.
function onClick() {
  if (isLocked.value) {
    dialogStore.showPricing();
    return;
  }
  emit('select');
}
</script>

<template>
  <button
    type="button"
    role="option"
    :aria-selected="selected"
    data-testid="model-option"
    class="tw-flex tw-w-full tw-items-start tw-gap-3 tw-rounded-chip tw-p-2 tw-text-left hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
    :class="[
      interactiveTransition,
      pressable,
      selected ? 'tw-bg-surface-2 tw-ring-1 tw-ring-accent/30' : '',
    ]"
    :data-locked="isLocked || undefined"
    @click="onClick"
  >
    <img
      v-if="logoUrl"
      :src="logoUrl"
      :alt="`${model.title} logo`"
      class="tw-h-8 tw-w-8 tw-shrink-0 tw-rounded tw-object-contain tw-bg-surface-2"
    />
    <ProviderIcon v-else :provider="model.provider" size="sm" />

    <span class="tw-min-w-0 tw-flex-1">
      <span class="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-ink">{{
        model.title
      }}</span>
      <span class="tw-mt-0.5 tw-line-clamp-2 tw-text-xs tw-leading-snug tw-text-ink-muted">
        {{ bestFor }}
      </span>
    </span>

    <span class="tw-flex tw-shrink-0 tw-flex-col tw-items-end tw-gap-1 tw-pt-0.5">
      <PremiumLockBadge v-if="isLocked" />
      <span
        v-if="speedHint"
        class="tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wide tw-text-ink-muted"
      >
        {{ speedHint }}
      </span>
      <span
        class="tw-inline-flex tw-items-center tw-gap-1 tw-tabular-nums tw-text-xs tw-font-medium tw-text-ink"
        :aria-label="`${creditCost} credits`"
      >
        <font-awesome-icon
          icon="fa-solid fa-coins"
          class="tw-text-[10px] tw-text-accent"
          aria-hidden="true"
        />
        {{ creditCost }}
      </span>
    </span>
  </button>
</template>
