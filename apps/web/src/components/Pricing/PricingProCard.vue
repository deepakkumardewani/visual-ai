<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, shallowRef } from 'vue';

import { useRouter } from 'vue-router';

import LandingButton from '@/components/Landing/LandingButton.vue';
import { usePricingCatalog } from '@/composables/usePricingCatalog';
import { PAYMENT_TOAST } from '@/payments/constants';
import { usePurchase } from '@/payments/usePurchase';
import { useUserStore } from '@/stores/user';
import { HISTORY_CAP, MODEL_REGISTRY, PLAN, PREMIUM_MODEL_KEYS } from '@visual-ai/shared';

const PRO_MODEL_NAMES = PREMIUM_MODEL_KEYS.map((key) => MODEL_REGISTRY[key].label).join(', ');

const PRO_PERKS = [
  `Keep up to ${HISTORY_CAP[PLAN.PRO]} images in your history`,
  `Premium models: ${PRO_MODEL_NAMES}`,
  'Your generations stay private, hidden from Explore',
  'Priority queue: your jobs start first',
] as const;

const router = useRouter();
const userStore = useUserStore();
const { isPro, userDetails } = storeToRefs(userStore);
const { proPrice, loadPrices } = usePricingCatalog();
const { subscribe, isPurchasing } = usePurchase();
const statusMessage = shallowRef('');

onMounted(() => {
  void loadPrices();
});

async function upgrade() {
  statusMessage.value = '';
  if (!userDetails.value) {
    void router.push({ name: 'signin', query: { redirect: '/pricing' } });
    return;
  }

  const outcome = await subscribe();
  if (outcome === 'already_pro') {
    statusMessage.value = PAYMENT_TOAST.ALREADY_PRO;
  }
}
</script>

<template>
  <section class="pro-card" aria-labelledby="pro-card-title" data-testid="pricing-pro-card">
    <div class="pro-card__head">
      <p class="pro-card__eyebrow">Pro</p>
      <h3 id="pro-card-title" class="pro-card__title">Visual AI Pro</h3>
      <p class="pro-card__price">
        <span data-testid="pro-price">{{ proPrice }}</span>
        <span class="pro-card__per">/ month</span>
      </p>
    </div>

    <ul class="pro-card__perks">
      <li v-for="perk in PRO_PERKS" :key="perk">{{ perk }}</li>
    </ul>

    <LandingButton
      class="pro-card__cta"
      variant="primary"
      size="md"
      type="button"
      data-testid="pro-subscribe"
      :disabled="isPro || isPurchasing"
      @click="upgrade"
    >
      {{ isPro ? "You're on Pro" : isPurchasing ? 'Opening checkout…' : 'Upgrade to Pro' }}
    </LandingButton>

    <p v-if="statusMessage" class="pro-card__status" role="status" data-testid="pro-status">
      {{ statusMessage }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.pro-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.75rem;
  background: rgb(var(--tw-surface-3));
  border: 1px solid color-mix(in oklab, rgb(var(--tw-accent)) 45%, rgb(var(--tw-hairline)));
  border-radius: 1.15rem;
  color: rgb(var(--tw-ink-primary));
}

.pro-card__eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--tw-accent));
}

.pro-card__title {
  margin: 0.25rem 0 0;
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: 1.75rem;
}

.pro-card__price {
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.pro-card__per {
  margin-left: 0.35rem;
  font-size: 0.95rem;
  font-weight: 400;
  color: rgb(var(--tw-ink-muted));
}

.pro-card__perks {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0 0 0 1.1rem;
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-secondary));
}

.pro-card__cta {
  width: 100%;
}

.pro-card__status {
  margin: 0;
  font-size: 0.9rem;
  color: rgb(var(--tw-ink-secondary));
}
</style>
