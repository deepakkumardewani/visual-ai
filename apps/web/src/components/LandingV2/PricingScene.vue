<script setup lang="ts">
import { CREDIT_PACKS } from '@visual-ai/shared';
import { computed, onMounted, ref } from 'vue';

import PricingPlanCard from '@/components/LandingV2/PricingPlanCard.vue';
import { usePricingCatalog } from '@/composables/usePricingCatalog';
import { usePrimaryCta } from '@/components/LandingV2/composables/usePrimaryCta';
import { CREDIT_PACKS_PLAN, FREE_PLAN, PRO_PLAN } from '@/utils/pricingPlans';

const primaryCta = usePrimaryCta();
const { formatPackPrice, hasServerPrices, loadPrices, proPrice } = usePricingCatalog();

const cheapestPack = CREDIT_PACKS.reduce((lowest, pack) =>
  pack.priceMinor < lowest.priceMinor ? pack : lowest,
);
const fromPrice = computed(() => formatPackPrice(cheapestPack));
const FREE_FIGURE = 'Free';
const CADENCE_FREE = 'No card needed';
const CADENCE_PRO = 'per month';
const CADENCE_PACKS = `${cheapestPack.credits} credits, one-time`;
const PRICE_LEAD = 'From';
// Fallback prices mix USD (Pro) and INR (packs), so none are shown rather than a misleading pair.
const PRICE_NOTE = 'See current prices';

const root = ref<HTMLElement | null>(null);

// Same read-only GET /payments/prices the /pricing page makes. The price stays hidden (space
// reserved) until it settles so the currency never flips on screen; the composable logs a failure
// and the formatted fallback is shown.
const priceResolved = ref(false);
onMounted(async () => {
  try {
    await loadPrices();
  } finally {
    priceResolved.value = true;
  }
});
const priceHidden = computed(() => !priceResolved.value);
const showNote = computed(() => priceResolved.value && !hasServerPrices.value);
</script>

<template>
  <section id="pricing" ref="root" class="pricing lv2-section" aria-labelledby="pricing-title">
    <div class="lv2-container pricing__inner">
      <header class="pricing__head">
        <p class="lv2-eyebrow">Pricing</p>
        <h2 id="pricing-title" class="lv2-display">Free to start. Credits when you need more.</h2>
      </header>

      <div class="pricing__cards">
        <PricingPlanCard
          lead
          :name="FREE_PLAN.name"
          :price="FREE_FIGURE"
          :cadence="CADENCE_FREE"
          :points="FREE_PLAN.points"
          :cta="primaryCta.label.value"
          :to="primaryCta.to.value"
        />
        <PricingPlanCard
          :name="PRO_PLAN.name"
          :price="showNote ? PRICE_NOTE : proPrice"
          :price-note="showNote"
          :price-hidden="priceHidden"
          :cadence="CADENCE_PRO"
          :points="PRO_PLAN.points"
          :cta="PRO_PLAN.cta"
          :to="PRO_PLAN.to"
        />
        <PricingPlanCard
          :name="CREDIT_PACKS_PLAN.name"
          :price-lead="showNote ? undefined : PRICE_LEAD"
          :price="showNote ? PRICE_NOTE : fromPrice"
          :price-note="showNote"
          :price-hidden="priceHidden"
          :cadence="CADENCE_PACKS"
          :points="CREDIT_PACKS_PLAN.points"
          :cta="CREDIT_PACKS_PLAN.cta"
          :to="CREDIT_PACKS_PLAN.to"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pricing__inner {
  display: grid;
  gap: var(--lv2-space-3xl);
}

.pricing__head {
  display: grid;
  gap: var(--lv2-space-lg);
  max-width: 40rem;
}

.pricing__cards {
  display: grid;
  gap: var(--lv2-space-lg);
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .pricing__cards {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--lv2-space-xl);
  }
}
</style>
