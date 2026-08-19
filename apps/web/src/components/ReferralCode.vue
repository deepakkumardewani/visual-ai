<script setup lang="ts">
import { faCopy } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const { userDetails } = storeToRefs(userStore);

const appStore = useAppStore();
const { isDark, snackbar, snackbarText } = storeToRefs(appStore);

const copyReferralCode = async () => {
  try {
    await navigator.clipboard.writeText(userDetails.value?.referralCode ?? '');
    snackbarText.value = 'Referral code copied to clipboard!';
    snackbar.value = true;
  } catch (err) {
    console.error('Failed to copy referral code:', err);
  }
};
</script>

<template>
  <div class="tw-flex tw-items-center tw-gap-3">
    <span class="tw-flex-1 tw-rounded tw-bg-[#C9A84C] tw-px-4 tw-py-3 tw-font-mono tw-text-white">
      {{ userDetails?.referralCode }}
    </span>
    <button
      type="button"
      class="tw-inline-flex tw-h-12 tw-w-12 tw-shrink-0 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-text-white"
      :style="{ backgroundColor: isDark ? '#C98A5A' : '#C9A84C' }"
      aria-label="Copy referral code"
      @click="copyReferralCode"
    >
      <font-awesome-icon :icon="faCopy" />
    </button>
  </div>
</template>
