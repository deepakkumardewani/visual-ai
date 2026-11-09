<script setup lang="ts">
import { computed } from 'vue';

import FaqSection from '@/components/Landing/FaqSection.vue';
import PricingComparison from '@/components/Pricing/PricingComparison.vue';
import PricingCreditStory from '@/components/Pricing/PricingCreditStory.vue';
import PricingHero from '@/components/Pricing/PricingHero.vue';
import PricingModelCosts from '@/components/Pricing/PricingModelCosts.vue';
import PricingPacks from '@/components/Pricing/PricingPacks.vue';
import PricingProCard from '@/components/Pricing/PricingProCard.vue';
import { usePricingCatalog } from '@/composables/usePricingCatalog';
import { PRICING_FAQS } from '@/utils/constants';

const { pricingBoard, creditPacks } = usePricingCatalog();

const pricingFaqs = computed(() =>
  PRICING_FAQS.map((faq) => ({
    question: faq.question,
    answer: faq.answer.replace(/<br\s*\/?>/gi, '\n\n'),
  })),
);
</script>

<template>
  <div class="pricing-layout" data-testid="pricing-layout">
    <PricingHero />
    <PricingComparison />
    <PricingProCard class="pricing-layout__pro" />
    <PricingPacks :packs="creditPacks" />
    <PricingCreditStory />
    <PricingModelCosts :board="pricingBoard" />
    <FaqSection :faqs="pricingFaqs" heading="Before you buy." />
  </div>
</template>

<style scoped lang="scss">
.pricing-layout {
  width: min(72rem, calc(100% - 2rem));
  margin: 0 auto;
  padding: 0 0 3rem;
  color: rgb(var(--tw-ink-primary));
  font-family: 'Source Sans 3', system-ui, sans-serif;
}

.pricing-layout__pro {
  margin: 1.5rem 0 0;
  max-width: none;
}

:deep(.costs) {
  padding-top: clamp(2rem, 4vw, 3rem);
}

:deep(.faq) {
  max-width: none;
  margin: 0;
  padding: clamp(2rem, 4vw, 3rem) 0 0;
}

:deep(.faq__a) {
  white-space: pre-line;
}
</style>
