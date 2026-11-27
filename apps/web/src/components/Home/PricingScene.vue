<script setup lang="ts">
import { CREDIT_PACKS } from '@visual-ai/shared';
import { computed, onMounted, ref } from 'vue';

import PricingPackLadder from '@/components/Home/PricingPackLadder.vue';
import PricingPlanCard from '@/components/Home/PricingPlanCard.vue';
import { usePricingCatalog } from '@/composables/usePricingCatalog';
import { usePrimaryCta } from '@/components/Home/composables/usePrimaryCta';
import { CREDIT_PACKS_PLAN, FREE_PLAN, PRO_PLAN } from '@/utils/pricingPlans';

const primaryCta = usePrimaryCta();
const { formatPackPrice, hasServerPrices, loadPrices, proPrice } = usePricingCatalog();

// CREDIT_PACKS is ordered smallest first, so the first pack is the cheapest.
const fromPrice = computed(() => formatPackPrice(CREDIT_PACKS[0]));
const FREE_FIGURE = 'Free';
const CADENCE_FREE = 'No card needed';
const CADENCE_PRO = 'per month';
const CADENCE_PACKS = 'One-time, credits never expire';
const PRICE_LEAD = 'From';
// Pack currency depends on the buyer's country; if it can't be resolved no pack price is guessed.
const PRICE_NOTE = 'See current prices';

const root = ref<HTMLElement | null>(null);

// Same read-only GET /payments/prices the /pricing page makes. Pack prices stay hidden (space
// reserved) until it settles so the currency never flips on screen.
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
  <section id="pricing" ref="root" class="pricing home-section" aria-labelledby="pricing-title">
    <div class="home-container pricing__inner">
      <header class="pricing__head">
        <p class="home-eyebrow">Pricing</p>
        <h2 id="pricing-title" class="home-display">Free to start. Credits when you need more.</h2>
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
        <!-- Pro is one USD price everywhere, so it never waits on /payments/prices. -->
        <PricingPlanCard
          :name="PRO_PLAN.name"
          :price="proPrice"
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
        >
          <PricingPackLadder
            :packs="CREDIT_PACKS"
            :format-price="formatPackPrice"
            :prices-hidden="priceHidden || showNote"
          />
        </PricingPlanCard>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pricing__inner {
  display: grid;
  gap: var(--home-space-3xl);
}

.pricing__head {
  display: grid;
  gap: var(--home-space-lg);
  max-width: 40rem;
}

.pricing__cards {
  display: grid;
  gap: var(--home-space-lg);
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .pricing__cards {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--home-space-xl);
  }
}
</style>
