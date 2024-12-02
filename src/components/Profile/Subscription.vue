<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import { useUserStore } from '@/stores/user'

import { cancelSubscription, openPaddleCheckout } from '@/utils/helpers'

const userStore = useUserStore()
const { userDetails, isPro } = storeToRefs(userStore)
const isLoading = ref(false)

async function handlePlan() {
  if (!isPro.value) {
    try {
      const PRICE_ID = 'pri_01jbx76xqnmyy9v3tmkf62c3cp'
      await openPaddleCheckout(PRICE_ID, true)
    } catch (error) {
      console.error('Purchase failed:', error)
    }
  } else {
    try {
      //TODO: show a confirm dialog
      isLoading.value = true
      await cancelSubscription()
    } catch (error) {
      console.error('Cancellation failed:', error)
    } finally {
      isLoading.value = false
    }
  }
}
</script>

<template>
  <v-container class="tw-max-w-3xl tw-mx-auto tw-py-8">
    <v-row justify="center">
      <v-col cols="12" sm="8">
        <h1 class="tw-text-2xl tw-font-medium tw-mb-8">My subscription</h1>

        <!-- Plan Section -->
        <div class="tw-mb-8">
          <h2 class="tw-text-white tw-mb-4">Plan</h2>
          <v-card variant="outlined" class="tw-p-4 tw-transition-all" elevation="0">
            <div class="tw-flex tw-justify-between tw-items-center">
              <span class="text-grey-darken-3 tw-font-medium">{{ isPro ? 'Pro' : 'Free' }}</span>
              <v-btn
                @click="handlePlan"
                :color="isPro ? 'red' : 'purple'"
                variant="text"
                class="tw-font-medium"
                :loading="isLoading"
                :disabled="isLoading"
              >
                {{ isPro ? 'Cancel subscription' : 'Upgrade plan' }}
              </v-btn>
            </div>
          </v-card>
        </div>

        <!-- Credits Section -->
        <div class="tw-mb-8">
          <h2 class="tw-text-white tw-mb-4">Credits</h2>
          <v-card variant="outlined" class="tw-p-4 tw-transition-all" elevation="0">
            <div class="tw-mb-2 text-grey-darken-3">
              Limited daily use of generative AI and edition tools
            </div>
            <div class="tw-text-sm text-grey-darken-1">
              See limits on the
              <v-btn
                to="/pricing"
                variant="text"
                color="purple-lighten-1"
                class="tw-font-medium tw-px-1 tw-min-w-0 !tw-lowercase"
                density="compact"
              >
                pricing page
              </v-btn>
            </div>
          </v-card>
        </div>

        <!-- Billing Information Section -->
        <div>
          <h2 class="tw-text-white tw-mb-4">Billing information</h2>
          <v-card variant="outlined" class="tw-p-4 tw-transition-all" elevation="0">
            <div class="tw-flex tw-justify-between tw-items-center">
              <span class="text-grey-darken-1">{{ userDetails?.email }}</span>
              <v-btn
                to="/profile?tab=payments"
                color="purple-lighten-1"
                variant="text"
                class="tw-font-medium"
              >
                Billing history
              </v-btn>
            </div>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-card {
  border-color: rgb(var(--v-border-color)) !important;
}
</style>
