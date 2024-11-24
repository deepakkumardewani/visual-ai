<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

const dialogStore = useDialogStore()
const userStore = useUserStore()
const { showCopyReferralDialog } = storeToRefs(dialogStore)
const { userDetails } = storeToRefs(userStore)

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
const snackbar = ref(false)
const snackbarTimeout = ref(2000)

const copyReferralCode = async () => {
  try {
    await navigator.clipboard.writeText(userDetails.value?.referralCode ?? '')
    snackbar.value = true
  } catch (err) {
    console.error('Failed to copy referral code:', err)
  }
}
</script>

<template>
  <v-dialog v-model="showCopyReferralDialog" max-width="600">
    <v-card>
      <v-card-text>
        <div class="tw-flex tw-justify-between tw-items-center tw-mb-8">
          <div class="tw-text-2xl tw-font-medium tw-w-full tw-text-center">
            Your account balance
          </div>
          <v-btn icon variant="text" @click="dialogStore.hideCopyReferral()" size="small">
            <v-icon icon="fas fa-times"></v-icon>
          </v-btn>
        </div>

        <div class="tw-text-center tw-mb-8">
          <div class="tw-flex tw-items-center tw-justify-center tw-gap-3 tw-mb-4">
            <v-icon icon="fas fa-coins" color="amber" size="x-large"></v-icon>
            <span class="tw-text-3xl tw-font-bold">{{ userDetails?.credits ?? 0 }} credits</span>
          </div>
          <p class="tw-text-gray-600 dark:tw-text-gray-400 tw-mb-3">
            Credits are used to generate AI images and access premium features.
          </p>
          <p class="tw-text-gray-600 dark:tw-text-gray-400">
            Each image generation costs 1 credit.
          </p>
        </div>

        <div class="tw-mb-8">
          <h3 class="tw-text-lg tw-font-medium tw-mb-4">Earn more credits</h3>

          <div class="tw-bg-[#9333ea] dark:tw-bg-[#6b21a8] tw-p-6 tw-rounded-lg">
            <p class="tw-mb-4 tw-text-white">
              Give 50 credits and earn 50 credits for each new referral who sign up for Application
            </p>
            <div class="tw-flex tw-items-center tw-gap-3">
              <span
                class="tw-bg-[#a855f7] tw-text-white tw-px-4 tw-py-3 tw-rounded tw-flex-1 tw-font-mono"
              >
                {{ userDetails?.referralCode }}
              </span>
              <v-btn :color="isDark ? '#6b21a8' : '#9333ea'" icon @click="copyReferralCode">
                <v-icon icon="fas fa-copy"></v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <v-snackbar
    v-model="snackbar"
    :timeout="snackbarTimeout"
    location="bottom right"
    color="purple-accent-4"
  >
    Referral code copied to clipboard!
  </v-snackbar>
</template>
