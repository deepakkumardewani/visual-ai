<script setup lang="ts">
import FAQ from '@/components/FAQ.vue';
import LandingFooter from '@/components/Landing/LandingFooter.vue';

import { usePageSeo } from '@/composables/usePageSeo';
import { GENERAL_FAQS } from '@/utils/constants';
import { faqPageJsonLd } from '@/utils/seo';

usePageSeo({
  title: 'FAQs – Visual AI credits and tools',
  description:
    'Answers about Visual AI credits, text-to-image, upscaling, colorize, photo restore, and billing. Learn how the studio works before you generate.',
  path: '/faqs',
  jsonLd: faqPageJsonLd(GENERAL_FAQS),
});
</script>
<template>
  <div class="tw-max-w-screen-lg tw-mx-auto">
    <FAQ heading-tag="h1" :faqs="GENERAL_FAQS" />
  </div>
  <LandingFooter />
</template>

<style scoped></style>
