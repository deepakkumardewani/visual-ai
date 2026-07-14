<script setup lang="ts">
import { faTimes } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { useDialogStore } from '@/stores/dialog';

import AppModal from '@/components/AppModal.vue';
import FAQ from '@/components/FAQ.vue';

import { PRICING_FAQS } from '@/utils/constants';

import Pricing from '@/pages/Pricing.vue';

const dialogStore = useDialogStore();
const { showPricingDialog } = storeToRefs(dialogStore);
</script>

<template>
  <AppModal
    :open="showPricingDialog"
    fullscreen
    :show-close="false"
    labelled-by="pricing-dialog-title"
    @close="dialogStore.hidePricing"
  >
    <div class="pricing-dialog">
      <div class="pricing-dialog__toolbar">
        <button
          type="button"
          class="pricing-dialog__close"
          aria-label="Close pricing"
          @click="dialogStore.hidePricing"
        >
          <font-awesome-icon :icon="faTimes" aria-hidden="true" />
        </button>
      </div>

      <h2 id="pricing-dialog-title" class="pricing-dialog__title">
        Unlock the full power of Visual AI
      </h2>

      <Pricing />
      <FAQ :faqs="PRICING_FAQS" />
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.pricing-dialog {
  padding-bottom: 2rem;
}

.pricing-dialog__toolbar {
  display: flex;
  justify-content: flex-end;
  margin: -0.5rem -0.5rem 0.5rem;
}

.pricing-dialog__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--tw-ink-muted));
  cursor: pointer;

  &:hover {
    background: rgb(var(--tw-surface-2));
    color: rgb(var(--tw-ink-primary));
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.pricing-dialog__title {
  margin: 0 0 1.5rem;
  text-align: center;
  font-family: 'Young Serif', Georgia, serif;
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 400;
  letter-spacing: -0.02em;
}
</style>
