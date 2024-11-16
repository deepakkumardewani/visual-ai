<script setup lang="ts">
import { useTheme } from 'vuetify'

import { type Plan } from '@/stores/app'

const theme = useTheme()
const props = defineProps<{
  plan: Plan
}>()

// Compute background color based on theme and whether it's a premium plan
const cardBackground = computed(() => {
  if (!props.plan.isFree) {
    return theme.global.current.value.dark ? 'bg-purple-darken-4' : 'bg-purple-lighten-5'
  }
  return ''
})

// Compute text color based on theme
const priceColor = computed(() => {
  return theme.global.current.value.dark ? 'text-purple-lighten-2' : 'text-purple-darken-2'
})
</script>

<template>
  <v-card
    :class="['mx-auto my-4 rounded-lg transition-shadow hover:elevation-24', cardBackground]"
    elevation="8"
    min-height="450"
    max-width="360"
  >
    <v-card-item class="text-center pt-6">
      <v-card-title class="text-h4 font-weight-bold">
        {{ plan.title }}
      </v-card-title>

      <v-card-subtitle>
        <div class="d-flex my-2 align-center justify-center">
          <span :class="['text-h3 font-weight-bold', priceColor]">${{ plan.price }}</span>
          <span class="text-subtitle-1 ml-1 mt-4">/month</span>
        </div>
        <p class="text-body-1">{{ plan.description }}</p>
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="my-2">
        <v-btn
          :disabled="plan.isFree"
          :color="plan.isFree ? 'grey' : 'purple'"
          :variant="plan.isFree ? 'outlined' : 'elevated'"
          size="large"
          block
          class="transition-transform hover:scale-102"
        >
          {{ plan.isFree ? 'Current Plan' : 'Upgrade Now' }}
        </v-btn>
      </div>

      <v-divider class="my-4"></v-divider>

      <div class="my-4">
        <div class="text-h6 mb-4 font-weight-medium">Features:</div>
        <div
          class="d-flex my-3 align-center"
          v-for="(feature, index) in plan.features"
          :key="index"
        >
          <v-icon
            :icon="feature.available ? 'fas fa-check' : 'fas fa-times'"
            :color="feature.available ? 'success' : 'error'"
            class="mr-2"
          />
          <p class="text-body-1">{{ feature.title }}</p>
          <v-tooltip v-if="!feature.available" location="top">
            <template #activator="{ props }">
              <v-icon
                size="small"
                v-bind="props"
                :icon="!feature.available ? 'fa:far fa-circle-question' : ''"
                class="ml-2"
                color="grey"
              />
            </template>
            <span>{{ feature.tooltip }}</span>
          </v-tooltip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.scale-102 {
  transform: scale(1.02);
}
</style>
