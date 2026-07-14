<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import ConfirmCancelSubDialog from '@/components/Dialogs/ConfirmCancelSubDialog.vue';

import { RAZORPAY_PRODUCTS } from '@/utils/constants';
import { initiatePayment } from '@/utils/payment';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const { userDetails, isPro } = storeToRefs(userStore);
const isLoading = ref(false);
const router = useRouter();
const isMobile = useMediaQuery('(max-width: 600px)');

async function handlePlan() {
  if (!isPro.value) {
    try {
      isLoading.value = true;
      const product = RAZORPAY_PRODUCTS[4];
      await initiatePayment(product, true);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      isLoading.value = false;
    }
    return;
  }

  dialogStore.showCancelSubscription();
}

function goToPayments() {
  router.push('/profile?tab=payments');
}
</script>

<template>
  <div class="subscription">
    <section class="subscription__section">
      <h2 class="subscription__heading">Plan</h2>
      <div class="subscription__card">
        <div class="subscription__plan-row">
          <span
            class="subscription__badge"
            :class="isPro ? 'subscription__badge--pro' : 'subscription__badge--free'"
          >
            {{ isPro ? 'Pro' : 'Free' }}
          </span>
          <button
            type="button"
            class="btn"
            :class="isPro ? 'btn--danger' : 'btn--primary'"
            :disabled="isLoading"
            @click="handlePlan"
          >
            {{ isLoading ? 'Working…' : isPro ? 'Cancel subscription' : 'Upgrade plan' }}
          </button>
        </div>
      </div>
      <p class="subscription__meta">
        See limits on the
        <router-link to="/pricing" class="subscription__link">pricing page</router-link>
      </p>
    </section>

    <section class="subscription__section">
      <h2 class="subscription__heading">Billing information</h2>
      <div class="subscription__card">
        <div class="subscription__billing-row">
          <span class="subscription__email">{{ userDetails?.email || '—' }}</span>
          <button v-if="!isMobile" type="button" class="btn btn--ghost" @click="goToPayments">
            Billing history
          </button>
        </div>
      </div>
      <button v-if="isMobile" type="button" class="subscription__text-link" @click="goToPayments">
        Billing history
      </button>
    </section>
  </div>
  <ConfirmCancelSubDialog />
</template>

<style scoped lang="scss">
.subscription {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 36rem;
}

.subscription__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.subscription__heading {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-muted));
}

.subscription__card {
  padding: 1rem 1.1rem;
  border: 1px solid rgb(var(--tw-border) / 0.7);
  border-radius: 12px;
  background: rgb(var(--tw-surface-2) / 0.45);
}

.subscription__plan-row,
.subscription__billing-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.subscription__badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.subscription__badge--pro {
  background: rgba(201, 168, 76, 0.16);
  color: #c9a84c;
}

.subscription__badge--free {
  background: rgb(var(--tw-surface-3));
  color: rgb(var(--tw-ink-muted));
}

.subscription__email {
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-muted));
  word-break: break-all;
}

.subscription__meta {
  margin: 0;
  font-size: 0.85rem;
  color: rgb(var(--tw-ink-muted));
}

.subscription__link,
.subscription__text-link {
  color: #c98a5a;
  font-weight: 600;
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: inherit;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
    border-radius: 2px;
  }
}

.subscription__text-link {
  align-self: flex-start;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 150ms ease,
    background-color 150ms ease,
    border-color 150ms ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.btn--primary {
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }
}

.btn--ghost {
  border-color: rgb(var(--tw-border));
  background: transparent;
  color: rgb(var(--tw-ink-primary));

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-3) / 0.45);
  }
}

.btn--danger {
  border-color: rgba(176, 60, 60, 0.4);
  background: rgba(176, 60, 60, 0.1);
  color: #e08585;

  &:hover:not(:disabled) {
    background: rgba(176, 60, 60, 0.18);
  }
}

:global(html:not(.tw-dark)) .btn--danger {
  color: #b03c3c;
}

:global(html:not(.tw-dark)) .subscription__badge--pro {
  color: #9e7d35;
}
</style>
