<script setup lang="ts">
import { faGift } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, ref } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import { REFERRAL_BONUS } from '@visual-ai/shared';

import AppModal from '@/components/AppModal.vue';

const COPY_REVERT_MS = 2000;

const dialogStore = useDialogStore();
const userStore = useUserStore();
const { referralOfferDialog } = storeToRefs(dialogStore);
const { userDetails } = storeToRefs(userStore);

const copied = ref(false);
let revertTimer: ReturnType<typeof setTimeout> | undefined;

function clearRevertTimer() {
  if (revertTimer !== undefined) {
    clearTimeout(revertTimer);
    revertTimer = undefined;
  }
}

async function copyReferralCode() {
  const code = userDetails.value?.referralCode ?? '';
  if (!code) return;

  try {
    await navigator.clipboard.writeText(code);
    copied.value = true;
    clearRevertTimer();
    revertTimer = setTimeout(() => {
      copied.value = false;
      revertTimer = undefined;
    }, COPY_REVERT_MS);
  } catch (err) {
    console.error('Failed to copy referral code:', err);
  }
}

onBeforeUnmount(() => {
  clearRevertTimer();
});
</script>

<template>
  <AppModal
    :open="referralOfferDialog"
    max-width="30rem"
    labelled-by="referral-offer-title"
    described-by="referral-offer-desc"
    @close="dialogStore.hideReferralOffer"
  >
    <template #title>
      <span id="referral-offer-title" class="offer__title">
        <font-awesome-icon :icon="faGift" class="offer__icon" aria-hidden="true" />
        Refer a friend
      </span>
    </template>

    <div class="offer" data-testid="referral-offer-dialog">
      <p class="offer__headline">
        You both get <strong>{{ REFERRAL_BONUS }} free credits</strong> when they sign up with your
        code.
      </p>

      <p id="referral-offer-desc" class="offer__how">
        Share your code at checkout. When a friend creates an account and applies it, you each
        receive {{ REFERRAL_BONUS }} bonus credits.
      </p>

      <div class="offer__code-block">
        <p class="offer__code-label">Your referral code</p>
        <code class="offer__code" data-testid="referral-offer-code">
          {{ userDetails?.referralCode ?? '—' }}
        </code>
      </div>

      <button
        type="button"
        class="offer__copy"
        data-testid="referral-offer-copy-btn"
        :aria-label="copied ? 'Referral code copied' : 'Copy referral code'"
        @click="copyReferralCode"
      >
        {{ copied ? 'Copied' : 'Copy code' }}
      </button>

      <p class="offer__live" aria-live="polite" aria-atomic="true">
        {{ copied ? 'Referral code copied to clipboard.' : '' }}
      </p>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.offer__title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.offer__icon {
  color: rgb(var(--tw-accent));
  font-size: 0.95rem;
}

.offer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.offer__headline {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.45;
  color: rgb(var(--tw-ink-primary));
}

.offer__how {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: rgb(var(--tw-ink-muted));
}

.offer__code-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.1rem;
  border: 1px solid rgb(var(--tw-border) / 0.85);
  border-radius: 12px;
  background: rgb(var(--tw-surface-2));
}

.offer__code-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-muted));
}

.offer__code {
  display: block;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgb(var(--tw-ink-primary));
  word-break: break-all;
}

.offer__copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  width: 100%;
  padding: 0.65rem 1.25rem;
  border: 0;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  background: rgb(var(--tw-accent));
  color: rgb(var(--tw-canvas));
  transition: opacity 150ms ease;

  &:hover {
    opacity: 0.92;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 2px;
  }
}

.offer__live {
  min-height: 1.25rem;
  margin: 0;
  font-size: 0.85rem;
  color: rgb(var(--tw-ink-muted));
}

@media (prefers-reduced-motion: reduce) {
  .offer__copy {
    transition: none;
  }
}
</style>
