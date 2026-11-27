<script setup lang="ts">
import type { Model } from '@/types/model';
import { MODEL_REGISTRY, requiresPro, type ModelKey } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { computed, useId } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { getModelBestForHint, getModelLogoUrl } from '@/utils/models';

import PremiumLockBadge from '@/components/Dashboard/ModelPicker/PremiumLockBadge.vue';
import ProviderIcon from '@/components/primitives/ProviderIcon.vue';
import Tooltip from '@/components/primitives/Tooltip.vue';

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
const creditCost = computed(() => props.model.creditCost ?? 1);
// Only models whose registry entry accepts a reference image show the icon.
// Missing `max` means a single image, matching stores/aside.ts.
const imageInput = computed(() => MODEL_REGISTRY[props.model.id as ModelKey]?.fields?.imageInput);
const referenceTooltip = computed(() => `Up to ${imageInput.value?.max ?? 1} reference images`);
const bestFor = computed(() => getModelBestForHint(props.model));
const isLocked = computed(() => !isPro.value && requiresPro(props.model.id));
// Not aria-disabled: a locked option stays actionable (it opens the upgrade prompt).
const lockHintId = useId();

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
    class="tw-flex tw-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-chip tw-px-2 tw-text-left hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
    :class="[
      interactiveTransition,
      pressable,
      selected ? 'tw-bg-surface-2 tw-ring-1 tw-ring-accent/30' : '',
    ]"
    :data-locked="isLocked || undefined"
    :aria-describedby="isLocked ? lockHintId : undefined"
    @click="onClick"
  >
    <img
      v-if="logoUrl"
      :src="logoUrl"
      :alt="`${model.title} logo`"
      class="tw-h-7 tw-w-7 tw-shrink-0 tw-rounded tw-object-contain tw-bg-surface-2"
    />
    <ProviderIcon v-else :provider="model.provider" size="sm" />

    <span
      data-testid="model-option-label"
      class="tw-flex tw-min-w-0 tw-flex-1 tw-items-baseline tw-gap-2 tw-text-sm"
    >
      <span
        data-testid="model-option-name"
        class="tw-max-w-[60%] tw-shrink-0 tw-truncate tw-font-semibold tw-text-ink"
        :title="model.title"
        >{{ model.title }}</span
      >
      <span class="tw-sr-only">, </span>
      <span
        data-testid="model-option-description"
        class="tw-min-w-0 tw-flex-1 tw-truncate tw-text-xs tw-text-ink-muted"
        :title="bestFor"
        >{{ bestFor }}</span
      >
    </span>

    <Tooltip v-if="imageInput" :text="referenceTooltip">
      <span
        data-testid="reference-image-icon"
        class="tw-inline-flex tw-text-xs tw-text-ink-muted"
        role="img"
        :aria-label="referenceTooltip"
      >
        <font-awesome-icon icon="fa-solid fa-images" aria-hidden="true" />
      </span>
    </Tooltip>

    <PremiumLockBadge v-if="isLocked" />
    <span v-if="isLocked" :id="lockHintId" class="tw-sr-only"
      >Requires Pro. Opens upgrade options.</span
    >

    <span
      class="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1 tw-tabular-nums tw-text-xs tw-font-medium tw-text-ink"
      :aria-label="`${creditCost} credits`"
    >
      <font-awesome-icon
        icon="fa-solid fa-coins"
        class="tw-text-[10px] tw-text-accent"
        aria-hidden="true"
      />
      {{ creditCost }}
    </span>
  </button>
</template>
