<script setup lang="ts">
import PricingCard from '@/components/PricingCard.vue'

import { PRO_PLAN, STARTER_PLAN } from '@/utils/constants'
</script>
<template>
  <div id="pricing" class="mt-5">
    <v-row class="text-center">
      <v-col cols="12">
        <!-- <div>
          <v-chip class="my-4" color="purple-lighten-2" label> Pricing </v-chip>
        </div> -->

        <!-- <div class="text-h4 font-weight-bold my-4">
          <span> Compare the prices </span>
        </div> -->
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
  </div>
</template>

<style scoped></style>
