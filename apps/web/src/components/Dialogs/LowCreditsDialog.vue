<script setup lang="ts">
import { faCoins, faCreditCard } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import AppModal from '@/components/AppModal.vue';

const dialogStore = useDialogStore();
const userStore = useUserStore();
const appStore = useAppStore();
const { feature } = storeToRefs(appStore);

function closeDialog() {
  dialogStore.showLowCreditsDialog = false;
}

function handleBuyCredits() {
  closeDialog();
  dialogStore.showBuyCredits();
}

const isCritical = computed(() => (userStore.dailyCredits || 0) + (userStore.credits || 0) <= 5);

const creditRequirement = computed(() => {
  // Unified cost for all users (no Pro distinction)
  if (feature.value === FeatureType.IMAGE) return 1;
  if (
    feature.value === FeatureType.UPSCALE ||
    feature.value === FeatureType.COLORIZE ||
    feature.value === FeatureType.REVIVE ||
    feature.value === FeatureType.REMOVE_BG
  ) {
    return 2; // Utility models cost 2 credits
  }
  return 1;
});

const featureText = computed(() => {
  switch (feature.value) {
    case FeatureType.UPSCALE:
    case 'image_upscaler':
      return 'upscale an image';
    case FeatureType.COLORIZE:
    case 'colorize_image':
      return 'colorize an image';
    case FeatureType.REVIVE:
    case 'revive_old_photos':
      return 'revive an old photo';
    case FeatureType.REMOVE_BG:
      return 'remove a background';
    case FeatureType.IMAGE:
    case 'generate':
      return 'generate an AI image';
    default:
      return 'generate an AI image';
  }
});
</script>

<template>
  <AppModal
    :open="dialogStore.showLowCreditsDialog"
    max-width="30rem"
    labelled-by="low-credits-title"
    @close="closeDialog"
  >
    <template #title>
      <span id="low-credits-title" class="low__title">
        <font-awesome-icon
          :icon="faCoins"
          class="low__icon"
          :class="{ 'low__icon--critical': isCritical }"
          aria-hidden="true"
        />
        Low credits
      </span>
    </template>

    <div class="low">
      <p class="low__copy">
        You are running low on credits. To {{ featureText }},
        {{ creditRequirement }}
        {{ creditRequirement === 1 ? 'credit is' : 'credits are' }} required.
      </p>

      <div class="low__chip" :class="{ 'low__chip--critical': isCritical }">
        <font-awesome-icon :icon="faCoins" aria-hidden="true" />
        {{ (userStore.dailyCredits || 0) + (userStore.credits || 0) }} credits available
      </div>
    </div>

    <template #actions>
      <button type="button" class="modal-btn modal-btn--primary" @click="handleBuyCredits">
        <font-awesome-icon :icon="faCreditCard" aria-hidden="true" />
        Buy Credits
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.low__title {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.low__icon {
  color: #c9a84c;
}

.low__icon--critical {
  color: #e08585;
}

.low__copy {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
  text-align: center;
}

.low__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  min-height: 2.5rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(201, 168, 76, 0.45);
  color: #c9a84c;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.low__chip--critical {
  border-color: rgba(176, 60, 60, 0.45);
  color: #e08585;
}

.low {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0.55rem 1.15rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.modal-btn--primary {
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;
  border: 0;
}

.modal-btn--ghost {
  border-color: rgb(var(--tw-border));
  background: transparent;
  color: rgb(var(--tw-ink-primary));

  &:hover {
    background: rgb(var(--tw-surface-2));
  }
}
</style>
