<script setup lang="ts">
import { faCopy } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const { userDetails } = storeToRefs(userStore);

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const snackbar = ref(false);
const snackbarTimeout = ref(2000);
const copyReferralCode = async () => {
  try {
    await navigator.clipboard.writeText(userDetails.value?.referralCode ?? '');
    snackbar.value = true;
  } catch (err) {
    console.error('Failed to copy referral code:', err);
  }
};
</script>

<template>
  <div class="tw-flex tw-items-center tw-gap-3">
    <span class="tw-bg-[#C9A84C] tw-text-white tw-px-4 tw-py-3 tw-rounded tw-flex-1 tw-font-mono">
      {{ userDetails?.referralCode }}
    </span>
    <v-btn :color="isDark ? '#C98A5A' : '#C9A84C'" size="lg" icon @click="copyReferralCode">
      <font-awesome-icon :icon="faCopy" />
    </v-btn>
  </div>

  <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" location="bottom right" color="#C9A84C">
    Referral code copied to clipboard!
  </v-snackbar>
</template>
