<script setup lang="ts">
import PricingCard from '@/components/PricingCard.vue'

const starterPlan = {
  title: 'Starter',
  price: '0',
  features: ['5 credits/day', 'Standard quality images', 'Only Webp format']
}

const proPlan = {
  title: 'Pro',
  price: '4.99',
  features: ['300 credits/month', 'High quality images', 'Webp, PNG & JPG formats']
}
</script>
<template>
  <div id="pricing" class="mt-16">
    <v-row>
      <v-col cols="12">
        <v-chip class="my-4" color="purple-lighten-2" label> Pricing </v-chip>
        <div class="text-h4 font-weight-bold my-4">
          <span> Compare the prices </span>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="6">
        <PricingCard :plan="starterPlan" />
      </v-col>
      <v-col cols="6">
        <PricingCard :plan="proPlan" />
      </v-col>
    </v-row>
  </div>
</template>

<style scoped></style>
