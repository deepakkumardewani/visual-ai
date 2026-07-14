<script setup lang="ts">
import { faGift } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { useDialogStore } from '@/stores/dialog';

import AppModal from '@/components/AppModal.vue';
import ReferralCode from '@/components/ReferralCode.vue';

const dialogStore = useDialogStore();
const { referralOfferDialog } = storeToRefs(dialogStore);
</script>

<template>
  <AppModal
    :open="referralOfferDialog"
    max-width="30rem"
    labelled-by="referral-offer-title"
    @close="dialogStore.hideReferralOffer"
  >
    <template #title>
      <span id="referral-offer-title" class="offer__title">
        <font-awesome-icon :icon="faGift" class="offer__icon" aria-hidden="true" />
        Special referral offer
      </span>
    </template>

    <div class="offer">
      <p class="offer__lead">
        Refer a friend and get <strong>1 month of Pro access</strong> for free.
      </p>
      <p class="offer__meta">Limited time offer</p>

      <div class="offer__box">
        <p class="offer__box-copy">
          Share your unique referral code. After they sign up and use your code, you'll be upgraded
          to Pro for a month.
        </p>
        <ReferralCode />
      </div>
    </div>

    <template #actions>
      <button
        type="button"
        class="modal-btn modal-btn--primary"
        @click="dialogStore.hideReferralOffer"
      >
        Close
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.offer__title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.offer__icon {
  color: #c9a84c;
  font-size: 0.95rem;
}

.offer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.offer__lead {
  margin: 0;
  text-align: center;
  font-size: 1rem;
  color: rgb(var(--tw-ink-primary));
}

.offer__meta {
  margin: 0 0 0.75rem;
  text-align: center;
  font-size: 0.8rem;
  color: rgb(var(--tw-ink-muted));
}

.offer__box {
  padding: 1.25rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #c9a84c 0%, #9e7d35 100%);
  color: #fff;
}

.offer__box-copy {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.55rem 1.25rem;
  border: 0;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.modal-btn--primary {
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;

  &:hover {
    opacity: 0.92;
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}
</style>
