<script setup lang="ts">
import { faTimes } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

// import { ref } from 'vue'
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import ReferralCode from '@/components/ReferralCode.vue';

const dialogStore = useDialogStore();
const userStore = useUserStore();
const { showCopyReferralDialog } = storeToRefs(dialogStore);
const { credits } = storeToRefs(userStore);
</script>

<template>
  <v-dialog v-model="showCopyReferralDialog" max-width="600">
    <v-card>
      <v-card-text>
        <div class="tw-flex tw-justify-between tw-items-center tw-mb-8">
          <div class="tw-text-2xl tw-font-medium tw-w-full tw-text-center">
            Your account balance
          </div>
          <v-btn icon variant="text" @click="dialogStore.hideCopyReferral()" size="lg">
            <font-awesome-icon :icon="faTimes" />
          </v-btn>
        </div>

        <div class="tw-text-center tw-mb-8">
          <div class="tw-flex tw-items-center tw-justify-center tw-gap-3 tw-mb-4">
            <v-icon icon="fas fa-coins" color="amber" size="x-large"></v-icon>
            <span class="tw-text-3xl tw-font-bold">{{ credits ?? 0 }} credits</span>
          </div>
          <p class="tw-text-gray-600 dark:tw-text-gray-400 tw-mb-3">
            Credits are used to generate AI images and access other features.
          </p>
          <p class="tw-text-gray-600 dark:tw-text-gray-400">
            AI image generation costs 1 credits on both free and pro plans.
            <br />
            Other features like upscaling, colorization, etc. costs 1 credit on a pro plan and 3
            credits on a free plan.
          </p>
        </div>

        <div class="tw-mb-8">
          <h3 class="tw-text-lg tw-font-medium tw-mb-4">Earn more credits</h3>

          <div class="tw-bg-[#C9A84C] dark:tw-bg-[#C98A5A] tw-p-6 tw-rounded-lg">
            <p class="tw-mb-4 tw-text-white">
              Give 50 credits and earn 50 credits for each new referral who sign up for the
              application
            </p>
            <ReferralCode />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
