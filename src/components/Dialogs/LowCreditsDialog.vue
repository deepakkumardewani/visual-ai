<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const dialogStore = useDialogStore()
const userStore = useUserStore()

const appStore = useAppStore()
const { feature } = storeToRefs(appStore)
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

const creditTextColor = computed(() => {
  return userStore.credits <= 5 ? 'error' : 'warning'
})

const creditRequirement = computed(() => {
  const isPaidPlan = userStore.isPro
  if (feature.value === 'generate') {
    return 1
  }
  return isPaidPlan ? 1 : 3
})

const featureText = computed(() => {
  switch (feature.value) {
    case 'image_upscaler':
      return 'upscale an image'
    case 'colorize_image':
      return 'colorize an image'
    case 'revive_old_photos':
      return 'revive an old photo'
    case 'generate':
      return 'generate an AI image'
    default:
      return 'generate an AI image'
  }
})
</script>

<template>
  <v-dialog v-model="dialogStore.showLowCreditsDialog" max-width="500">
    <v-card class="tw-p-6 tw-rounded-lg">
      <div class="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <v-card-title class="tw-flex tw-items-center !tw-p-0">
          <v-icon icon="$coin" :color="creditTextColor" size="x-large" class="tw-mr-3" />
          <span class="tw-text-2xl tw-font-bold">Low Credits Alert</span>
        </v-card-title>
        <v-btn
          icon="fas fa-xmark"
          variant="text"
          size="small"
          class="tw-opacity-70 hover:tw-opacity-100"
          @click="closeDialog"
        />
      </div>

      <v-card-text class="tw-text-center tw-py-4">
        <p class="tw-text-lg tw-mb-6 tw-text-gray-400">
          You are running low on credits. To {{ featureText }}, {{ creditRequirement }}
          {{ creditRequirement === 1 ? 'credit is' : 'credits are' }} required. To continue, add
          more credits or subscribe to pro
          <template v-if="!userStore.isPro && feature !== 'generate'">
            to reduce credit usage to 1 credit per operation</template
          >.
        </p>
        <v-chip :color="creditTextColor" variant="outlined" size="large" class="tw-px-6 tw-py-3">
          <v-icon start icon="fas fa-coins" class="tw-mr-2" />
          <span class="tw-text-xl tw-font-bold">{{ userStore.credits }} credits remaining</span>
        </v-chip>
      </v-card-text>

      <v-card-actions class="tw-justify-center tw-gap-4 tw-mt-4">
        <v-btn
          color="primary"
          size="large"
          variant="elevated"
          class="tw-px-6"
          @click="handleNavigateToPricing"
        >
          <v-icon start icon="fas fa-crown" class="tw-mr-2" />
          Upgrade Plan
        </v-btn>
        <v-btn
          color="secondary"
          size="large"
          variant="elevated"
          class="tw-px-6"
          @click="handleBuyCredits"
        >
          <v-icon start icon="fas fa-credit-card" class="tw-mr-2" />
          Buy Credits
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
