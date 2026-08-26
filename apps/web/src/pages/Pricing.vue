<script setup lang="ts">
import { computed } from 'vue';

import FaqSection from '@/components/Landing/FaqSection.vue';
import LandingFooter from '@/components/Landing/LandingFooter.vue';
import PricingCreditStory from '@/components/Pricing/PricingCreditStory.vue';
import PricingHero from '@/components/Pricing/PricingHero.vue';
import PricingModelCosts from '@/components/Pricing/PricingModelCosts.vue';
import PricingPacks from '@/components/Pricing/PricingPacks.vue';
import { usePageSeo } from '@/composables/usePageSeo';
import { usePricingCatalog } from '@/composables/usePricingCatalog';
import { PRICING_FAQS } from '@/utils/constants';
import { faqPageJsonLd } from '@/utils/seo';

const { pricingBoard, creditPacks } = usePricingCatalog();

const pricingFaqs = computed(() =>
  PRICING_FAQS.map((faq) => ({
    question: faq.question,
    answer: faq.answer.replace(/<br\s*\/?>/gi, '\n\n'),
  })),
);

usePageSeo({
  title: 'Buy credits – Visual AI image tools',
  description:
    'Buy Visual AI credits for text-to-image, upscale, colorize, and photo restore. Start with free daily credits, then pay only for what you generate.',
  path: '/pricing',
  jsonLd: faqPageJsonLd(PRICING_FAQS),
});
</script>

<template>
  <div id="pricing" class="pricing-page">
    <PricingHero />
    <PricingPacks :packs="creditPacks" />
    <PricingCreditStory />
    <PricingModelCosts :board="pricingBoard" />
    <FaqSection :faqs="pricingFaqs" heading="Before you buy." />
  </div>
  <LandingFooter />
</template>

<style scoped lang="scss">
.pricing-page {
  width: min(72rem, calc(100% - 2rem));
  margin: 0 auto 4rem;
  padding: 0 0 3rem;
  color: rgb(var(--tw-ink-primary));
  font-family: 'Source Sans 3', system-ui, sans-serif;
}

:deep(.faq) {
  max-width: none;
  margin: 0;
  padding: clamp(3.5rem, 7vw, 5.5rem) 0 0;
}

:deep(.faq__a) {
  white-space: pre-line;
}
</style>
