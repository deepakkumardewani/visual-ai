<script setup lang="ts">
import LandingFooter from '@/components/Landing/LandingFooter.vue';
import PricingLayout from '@/components/Pricing/PricingLayout.vue';
import { usePageSeo } from '@/composables/usePageSeo';
import { PRICING_FAQS } from '@/utils/constants';
import { faqPageJsonLd } from '@/utils/seo';

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
    <PricingLayout />
  </div>
  <LandingFooter />
</template>

<style scoped lang="scss">
.pricing-page {
  margin-bottom: 4rem;
}
</style>
