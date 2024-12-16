<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const dialogStore = useDialogStore()
const userStore = useUserStore()

const closeDialog = () => {
  dialogStore.showLowCreditsDialog = false
}

const handleNavigateToPricing = () => {
  closeDialog()
  router.push('/pricing')
}

const handleBuyCredits = () => {
  closeDialog()
  dialogStore.showBuyCredits()
}
</script>

<template>
  <v-dialog v-model="dialogStore.showLowCreditsDialog" max-width="500">
    <v-card class="tw-p-6">
      <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <v-card-title class="tw-flex tw-items-center !tw-p-0">
          <v-icon icon="$coin" color="warning" size="large" class="tw-mr-2" />
          <span class="tw-text-xl tw-font-semibold">Low Credits Alert</span>
        </v-card-title>
        <v-btn icon="fas fa-xmark" variant="text" size="small" @click="closeDialog" />
      </div>

      <v-card-text class="tw-text-center">
        <p class="tw-mb-4">
          You are running low on credits. To continue generating AI images, add more credits or
          subscribe to pro.
        </p>
        <div class="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-mb-4">
          <span class="tw-text-lg tw-font-medium"> {{ userStore.credits }} credits remaining </span>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn color="primary" @click="handleNavigateToPricing" prepend-icon="fas fa-crown">
          Upgrade Plan
        </v-btn>
        <v-btn color="secondary" @click="handleBuyCredits" prepend-icon="fas fa-credit-card">
          Buy Credits
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
