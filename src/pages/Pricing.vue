<script setup lang="ts">
import FAQ from '@/components/FAQ.vue'
import PricingCard from '@/components/PricingCard.vue'

import { PRICING_FAQS, PRO_PLAN, STARTER_PLAN } from '@/utils/constants'

definePage({
  alias: ['/pricing']
})
</script>
<template>
  <div id="pricing" class="mt-5">
    <v-row class="text-center">
      <v-col cols="12">
        <div class="tw-text-center tw-font-semibold tw-text-6xl">
          Unlock the Full Power of Visual AI
        </div>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" sm="5">
        <PricingCard :plan="STARTER_PLAN" />
      </v-col>
      <v-col cols="12" sm="5">
        <PricingCard :plan="PRO_PLAN" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <FAQ :faqs="PRICING_FAQS" />
      </v-col>
    </v-row>
  </div>
</template>

<style scoped></style>
