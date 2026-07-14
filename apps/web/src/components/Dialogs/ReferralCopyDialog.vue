<script setup lang="ts">
import { faCoins, faGift, faTimes } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import AppModal from '@/components/AppModal.vue';
import ReferralCode from '@/components/ReferralCode.vue';

const dialogStore = useDialogStore();
const userStore = useUserStore();
const { showCopyReferralDialog } = storeToRefs(dialogStore);
const { credits } = storeToRefs(userStore);
</script>

<template>
  <AppModal
    :open="showCopyReferralDialog"
    max-width="36rem"
    :show-close="false"
    labelled-by="referral-copy-title"
    @close="dialogStore.hideCopyReferral"
  >
    <div class="ref-copy">
      <div class="ref-copy__top">
        <h2 id="referral-copy-title" class="ref-copy__title">Your account balance</h2>
        <button
          type="button"
          class="ref-copy__close"
          aria-label="Close dialog"
          @click="dialogStore.hideCopyReferral()"
        >
          <font-awesome-icon :icon="faTimes" aria-hidden="true" />
        </button>
      </div>

      <div class="ref-copy__balance">
        <font-awesome-icon :icon="faCoins" class="ref-copy__coins" aria-hidden="true" />
        <span class="ref-copy__credits">{{ credits ?? 0 }} credits</span>
      </div>
      <p class="ref-copy__copy">
        Credits are used to generate AI images and access other features.
      </p>
      <p class="ref-copy__copy">
        AI image generation costs 1 credit on both free and pro plans. Other features like upscaling
        and colorization cost 1 credit on Pro and 3 credits on Free.
      </p>

      <h3 class="ref-copy__section">Earn more credits</h3>
      <div class="ref-copy__offer">
        <p class="ref-copy__offer-text">
          <font-awesome-icon :icon="faGift" class="ref-copy__gift" aria-hidden="true" />
          Give 50 credits and earn 50 credits for each new referral who signs up.
        </p>
        <ReferralCode />
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.ref-copy {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.ref-copy__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-right: 0.25rem;
}

.ref-copy__title {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 400;
}

.ref-copy__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--tw-ink-muted));
  cursor: pointer;

  &:hover {
    background: rgb(var(--tw-surface-2));
    color: rgb(var(--tw-ink-primary));
  }
}

.ref-copy__balance {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.ref-copy__coins {
  color: #c9a84c;
  font-size: 1.75rem;
}

.ref-copy__credits {
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ref-copy__copy {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  line-height: 1.55;
  color: rgb(var(--tw-ink-muted));
}

.ref-copy__section {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  font-weight: 600;
}

.ref-copy__offer {
  padding: 1.25rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #c9a84c 0%, #9e7d35 100%);
  color: #fff;
}

.ref-copy__offer-text {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.ref-copy__gift {
  margin-right: 0.35rem;
}
</style>
