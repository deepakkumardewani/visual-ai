<script setup lang="ts">
import { faCheck } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed, shallowRef } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import AppModal from '@/components/AppModal.vue';

import { RAZORPAY_PRODUCTS } from '@/utils/constants';
import { initiatePayment } from '@/utils/payment';

const BUDGET_IMAGE_CREDIT_COST = 1;

const dialogStore = useDialogStore();
const userStore = useUserStore();
const { showBuyCreditsDialog } = storeToRefs(dialogStore);
const { credits, dailyCredits } = storeToRefs(userStore);

const loading = shallowRef(false);
const successBalance = shallowRef<number | null>(null);
const packages = RAZORPAY_PRODUCTS.filter((product) => product.type === 'single');
const selectedIndex = shallowRef(0);

const currentPackage = computed(() => packages[selectedIndex.value]);

const bestValueIndex = computed(() => {
  return packages.reduce((maxIdx, pkg, idx) => {
    const savings = parseFloat(pkg.savings?.replace('%', '') || '0');
    const currentSavings = parseFloat(packages[maxIdx].savings?.replace('%', '') || '0');
    return savings > currentSavings ? idx : maxIdx;
  }, 0);
});

const mostPopularIndex = computed(() => {
  const ranked = packages
    .map((pkg, idx) => ({ idx, credits: pkg.credits }))
    .sort((a, b) => b.credits - a.credits);
  return ranked[1]?.idx ?? 0;
});

const totalCredits = computed(() => credits.value + dailyCredits.value);

function perCreditRate(price: number, creditCount: number) {
  return (price / creditCount).toFixed(2);
}

function estimatedBudgetImages(creditCount: number) {
  return Math.floor(creditCount / BUDGET_IMAGE_CREDIT_COST);
}

async function handlePurchase() {
  loading.value = true;
  try {
    await initiatePayment(currentPackage.value);
    successBalance.value = totalCredits.value + currentPackage.value.credits;
    setTimeout(() => {
      successBalance.value = null;
      dialogStore.hideBuyCredits();
    }, 2000);
  } catch (error) {
    console.error('Purchase failed:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppModal
    :open="showBuyCreditsDialog"
    max-width="44rem"
    labelled-by="buy-credits-title"
    @close="dialogStore.hideBuyCredits"
  >
    <template #title>
      <span id="buy-credits-title">Buy more credits</span>
    </template>

    <template v-if="successBalance !== null">
      <div class="success-state">
        <div class="success-icon">
          <font-awesome-icon :icon="faCheck" aria-hidden="true" />
        </div>
        <h3 class="success-title">Purchase successful</h3>
        <p class="success-balance">
          New balance: <strong>{{ successBalance }}</strong> credits
        </p>
      </div>
    </template>

    <template v-else>
      <div class="buy">
        <p class="balance">
          <span class="balance__label">Balance</span>
          <span class="balance__math">
            <span class="balance__num">{{ dailyCredits }}</span>
            <span class="balance__unit">daily</span>
            <span class="balance__op">+</span>
            <span class="balance__num">{{ credits }}</span>
            <span class="balance__op">=</span>
            <span class="balance__num balance__num--total">{{ totalCredits }}</span>
          </span>
        </p>

        <div class="packages-section">
          <p class="packages-hint">Larger packs cost less per credit</p>

          <div class="buy__packages" role="radiogroup" aria-label="Credit packages">
            <button
              v-for="(pkg, index) in packages"
              :key="pkg.credits"
              type="button"
              class="buy__pkg"
              :class="{
                'buy__pkg--active': selectedIndex === index,
                'buy__pkg--best-value': index === bestValueIndex,
                'buy__pkg--popular': index === mostPopularIndex,
              }"
              role="radio"
              :aria-checked="selectedIndex === index"
              @click="selectedIndex = index"
            >
              <span v-if="index === bestValueIndex" class="badge badge--value">Best value</span>
              <span v-else-if="index === mostPopularIndex" class="badge badge--popular">
                Most popular
              </span>

              <span class="pkg-credits">{{ pkg.credits }}</span>
              <span class="pkg-credits-label">credits</span>
              <span class="pkg-price">₹{{ pkg.price }}</span>
              <span v-if="pkg.savings" class="pkg-savings">Save {{ pkg.savings }}</span>
              <span v-else class="pkg-savings pkg-savings--empty">&nbsp;</span>
              <span class="pkg-meta"> ₹{{ perCreditRate(pkg.price, pkg.credits) }}/credit </span>
              <span class="pkg-estimate"
                >≈ {{ estimatedBudgetImages(pkg.credits) }} budget images</span
              >
            </button>
          </div>
        </div>

        <p class="trust-line">Secure payment via Razorpay. Credits apply instantly.</p>
      </div>
    </template>

    <template v-if="successBalance === null" #actions>
      <button
        type="button"
        class="modal-btn modal-btn--primary"
        :disabled="loading"
        @click="handlePurchase"
      >
        {{ loading ? 'Processing…' : `Buy ${currentPackage?.credits} credits` }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  text-align: center;
}

.success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: rgb(111 175 122 / 0.15);
  color: #6faf7a;
  font-size: 1.5rem;
}

.success-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
  margin: 0;
}

.success-balance {
  font-size: 1rem;
  color: rgb(var(--tw-ink-secondary));
  margin: 0;

  strong {
    color: #c9a84c;
    font-weight: 700;
  }
}

.buy {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.balance {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.75rem 1rem;
  margin: 0;
}

.balance__label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-muted));
}

.balance__math {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.45rem;
  font-variant-numeric: tabular-nums;
}

.balance__num {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.balance__num--total {
  font-size: 1.25rem;
  color: #c9a84c;
}

.balance__unit,
.balance__op {
  font-size: 0.8rem;
  color: rgb(var(--tw-ink-muted));
}

.packages-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.packages-hint {
  margin: 0;
  font-size: 0.85rem;
  color: rgb(var(--tw-ink-muted));
}

.buy__packages {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: stretch;

  @media (min-width: 560px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.buy__pkg {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  min-height: 11.5rem;
  padding: 1.75rem 0.85rem 0.9rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 12px;
  background: rgb(var(--tw-surface-2) / 0.35);
  color: rgb(var(--tw-ink-primary));
  text-align: left;
  cursor: pointer;
  transition:
    border-color 200ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 200ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: rgb(201 168 76 / 0.45);
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }

  &.buy__pkg--active {
    border-color: #c9a84c;
    background: rgb(201 168 76 / 0.1);
  }
}

.badge {
  position: absolute;
  top: 0.55rem;
  left: 0.7rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;

  &.badge--value {
    color: #6faf7a;
  }

  &.badge--popular {
    color: #c9a84c;
  }
}

.pkg-credits {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: #c9a84c;
  font-variant-numeric: tabular-nums;
}

.pkg-credits-label {
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-muted));
}

.pkg-price {
  margin-top: 0.35rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.pkg-savings {
  min-height: 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #6faf7a;
}

.pkg-savings--empty {
  visibility: hidden;
}

.pkg-meta,
.pkg-estimate {
  font-size: 0.7rem;
  line-height: 1.35;
  color: rgb(var(--tw-ink-muted));
}

.trust-line {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: rgb(var(--tw-ink-muted));
}

.modal-btn {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border: 0;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.modal-btn--primary {
  background: #c9a84c;
  color: rgb(var(--tw-canvas));
}

@media (prefers-reduced-motion: reduce) {
  .buy__pkg {
    transition: none;
  }
}
</style>
