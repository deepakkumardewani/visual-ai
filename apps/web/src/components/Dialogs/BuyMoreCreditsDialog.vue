<script setup lang="ts">
import { faCoins } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { useDialogStore } from '@/stores/dialog';

import AppModal from '@/components/AppModal.vue';

import { RAZORPAY_PRODUCTS } from '@/utils/constants';
import { initiatePayment } from '@/utils/payment';

const dialogStore = useDialogStore();
const { showBuyCreditsDialog } = storeToRefs(dialogStore);

const loading = ref(false);
const packages = RAZORPAY_PRODUCTS.filter((product) => product.type === 'single');
const selectedIndex = ref(0);
const currentPackage = computed(() => packages[selectedIndex.value]);

async function handlePurchase() {
  loading.value = true;
  try {
    await initiatePayment(currentPackage.value);
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
    max-width="34rem"
    labelled-by="buy-credits-title"
    @close="dialogStore.hideBuyCredits"
  >
    <template #title>
      <span id="buy-credits-title">Buy more credits</span>
    </template>

    <div class="buy">
      <div class="buy__summary">
        <div class="buy__credits">
          <font-awesome-icon :icon="faCoins" class="buy__coin" aria-hidden="true" />
          <div>
            <div class="buy__credits-value">{{ currentPackage?.credits }}</div>
            <div class="buy__credits-label">Credits</div>
          </div>
        </div>
        <div class="buy__price">
          <div class="buy__price-value">INR {{ currentPackage?.price }}</div>
          <div v-if="currentPackage?.savings" class="buy__savings">
            Save {{ currentPackage.savings }}
          </div>
        </div>
      </div>

      <div class="buy__packages" role="radiogroup" aria-label="Credit packages">
        <button
          v-for="(pkg, index) in packages"
          :key="pkg.credits"
          type="button"
          class="buy__pkg"
          :class="{ 'buy__pkg--active': selectedIndex === index }"
          role="radio"
          :aria-checked="selectedIndex === index"
          @click="selectedIndex = index"
        >
          <span class="buy__pkg-credits">{{ pkg.credits }}</span>
          <span class="buy__pkg-price">₹{{ pkg.price }}</span>
        </button>
      </div>
    </div>

    <template #actions>
      <button
        type="button"
        class="modal-btn modal-btn--primary"
        :disabled="loading"
        @click="handlePurchase"
      >
        {{ loading ? 'Processing…' : 'Buy now' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.buy__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.buy__credits {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.buy__coin {
  color: #c9a84c;
  font-size: 1.75rem;
}

.buy__credits-value {
  font-size: 2rem;
  font-weight: 700;
  color: #c9a84c;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.buy__credits-label {
  font-size: 0.8rem;
  color: rgb(var(--tw-ink-muted));
}

.buy__price {
  text-align: right;
}

.buy__price-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.buy__savings {
  font-size: 0.8rem;
  color: #6faf7a;
}

.buy__packages {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;

  @media (min-width: 520px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.buy__pkg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-height: 4.5rem;
  padding: 0.75rem 0.5rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 12px;
  background: rgb(var(--tw-surface-2) / 0.45);
  color: rgb(var(--tw-ink-primary));
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    box-shadow 150ms ease;

  &:hover {
    border-color: rgba(201, 168, 76, 0.4);
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.buy__pkg--active {
  border-color: rgba(201, 168, 76, 0.65);
  background: rgba(201, 168, 76, 0.12);
  box-shadow: 0 0 0 1px rgba(201, 168, 76, 0.2);
}

.buy__pkg-credits {
  font-size: 1.1rem;
  font-weight: 700;
}

.buy__pkg-price {
  font-size: 0.8rem;
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
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;
}
</style>
