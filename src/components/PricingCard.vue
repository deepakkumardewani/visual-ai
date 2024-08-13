<script setup lang="ts">
interface Plan {
  title: string
  price: string
  features: string[]
}
defineProps<{
  plan: Plan
}>()
</script>

<template>
  <v-card class="mx-auto my-8 pa-4 rounded-lg" elevation="16" max-width="344">
    <v-card-item>
      <v-card-title> {{ plan.title }} </v-card-title>

      <v-card-subtitle>
        <div class="d-flex my-2">
          <span class="text-h5 font-weight-bold dollar mr-1">$</span>
          <span class="text-h4 font-weight-bold mb-n1">{{ plan.price }}</span>
          <span class="text-body-2 month-text">/month</span>
        </div>
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="my-4">
        <v-btn color="purple-lighten-2" block>Subscribe</v-btn>
      </div>

      <div class="my-2">
        <div class="text-h6 my-4">Includes:</div>
        <div class="d-flex my-2" v-for="(feature, index) in plan.features" :key="index">
          <v-icon icon="fa:fas fa-check" color="green" />
          <p class="text-body-2 mx-2">{{ feature }}</p>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.dollar,
.month-text {
  align-content: end;
}
</style>
