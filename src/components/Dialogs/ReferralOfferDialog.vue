<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'

import ReferralCode from '@/components/ReferralCode.vue'

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

const dialogStore = useDialogStore()
const { referralOfferDialog } = storeToRefs(dialogStore)
</script>

<template>
  <v-dialog v-model="referralOfferDialog" max-width="500px">
    <v-card :color="isDark ? 'grey-darken-4' : 'white'" class="tw-p-4">
      <v-card-title class="tw-text-center tw-text-xl tw-font-bold tw-mb-4">
        <v-icon icon="fa-solid fa-gift" color="purple" class="tw-mr-2" />
        Special Referral Offer
      </v-card-title>

      <v-card-text>
        <div class="tw-p-4 tw-rounded-lg tw-mb-6">
          <p
            class="tw-font-semibold tw-text-center"
            :class="isDark ? 'tw-text-white' : 'tw-text-purple-900'"
          >
            Refer a friend and get <span class="tw-font-bold">1 month of Pro access</span> for FREE!
          </p>
          <p
            class="tw-text-sm tw-mt-2 tw-text-center"
            :class="isDark ? 'tw-text-gray-300' : 'tw-text-gray-700'"
          >
            Limited time offer
          </p>
        </div>
        <div class="tw-bg-[#9333ea] dark:tw-bg-[#6b21a8] tw-p-6 tw-rounded-lg">
          <p class="tw-mb-4">
            Share your unique referral code with friends. After they signup and use your code,
            you'll automatically be upgraded to Pro for a month!
          </p>

          <ReferralCode />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="purple" @click="dialogStore.hideReferralOffer()" variant="tonal">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
