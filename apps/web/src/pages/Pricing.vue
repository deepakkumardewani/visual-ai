<script setup lang="ts">
import FAQ from '@/components/FAQ.vue';
import PricingCard from '@/components/PricingCard.vue';

import { PRICING_FAQS, PRO_PLAN, STARTER_PLAN } from '@/utils/constants';
</script>

<template>
  <div id="pricing" class="tw-mt-5">
    <div class="tw-w-full tw-px-3 tw-text-center">
      <div class="tw-text-center tw-font-display tw-text-4xl tw-font-semibold sm:tw-text-6xl">
        Unlock the Full Power of
        <span
          class="tw-bg-gradient-to-r tw-from-[#9E7D35] tw-to-[#7A6428] tw-bg-clip-text tw-text-transparent dark:tw-from-[#D4B577] dark:tw-to-[#C9A84C]"
          >Visual AI</span
        >
      </div>
    </div>
    <div class="tw-flex tw-flex-wrap tw-justify-center">
      <div class="tw-w-full tw-px-3 sm:tw-w-5/12">
        <PricingCard :plan="STARTER_PLAN" />
      </div>
      <div class="tw-w-full tw-px-3 sm:tw-w-5/12">
        <PricingCard :plan="PRO_PLAN" />
      </div>
    </div>

    <div class="tw-w-full tw-px-3">
      <FAQ :faqs="PRICING_FAQS" />
    </div>
  </div>
</template>
