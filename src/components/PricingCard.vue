<script setup lang="ts">
import { type Plan } from '@/stores/app'

defineProps<{
  plan: Plan
}>()
</script>

<template>
  <v-card class="mx-auto my-8 pa-4 rounded-lg" elevation="16" min-height="400" max-width="360">
    <v-card-item class="text-center">
      <v-card-title> {{ plan.title }} </v-card-title>

      <v-card-subtitle>
        <div class="d-flex my-2 align-center justify-center">
          <span class="text-h4 font-weight-bold">${{ plan.price }}</span>
          <!-- <span class="text-h4 font-weight-bold mb-n1">{{ plan.price }}</span> -->
          <span class="text-body-2 mt-3">/month</span>
        </div>
        <div>
          <p class="text-caption">{{ plan.description }}</p>
        </div>
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="my-4">
        <v-btn :disabled="plan.isFree" color="purple-lighten-2" block>{{
          plan.isFree ? 'Subscribed' : 'Subscribe'
        }}</v-btn>
      </div>

      <div class="my-2">
        <div class="text-h6 my-4">Includes:</div>
        <div
          class="d-flex my-2 align-center"
          v-for="(feature, index) in plan.features"
          :key="index"
        >
          <v-icon
            :icon="feature.available ? 'fa:fas fa-check' : 'fa:fas fa-times'"
            :color="feature.available ? 'green' : 'red'"
          />
          <p class="text-body-2 mx-2">{{ feature.title }}</p>
          <v-tooltip v-if="!feature.available" location="top">
            <template #activator="{ props }">
              <v-icon
                size="x-small"
                v-bind="props"
                :icon="!feature.available ? 'fa:far fa-circle-question' : ''"
              />
            </template>
            <span>{{ feature.tooltip }}</span>
          </v-tooltip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss"></style>
