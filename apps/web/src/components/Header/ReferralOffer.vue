<script setup lang="ts">
import { faGift } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const dialogStore = useDialogStore();
const isMobile = useMediaQuery('(max-width: 600px)');
const userStore = useUserStore();

const isUserDataLoaded = ref(false);

watch(
  () => userStore.userDetails,
  (newValue) => {
    if (newValue) isUserDataLoaded.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <template v-if="isUserDataLoaded">
    <button
      v-if="isMobile"
      type="button"
      data-testid="referral-offer-mobile"
      class="referral-offer--mobile tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-border-0 tw-bg-gold/15 tw-px-4 tw-py-2 tw-text-center tw-text-sm tw-font-medium tw-text-gold tw-transition-colors hover:tw-bg-gold/25"
      @click="dialogStore.showReferralOffer()"
    >
      <font-awesome-icon :icon="faGift" class="tw-text-xs" aria-hidden="true" />
      Refer a friend and earn credits
    </button>

    <button
      v-else
      type="button"
      data-testid="referral-offer-desktop"
      class="referral-offer--desktop tw-inline-flex tw-h-9 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-gold/40 tw-bg-gold/10 tw-px-3 tw-text-sm tw-font-medium tw-text-gold tw-transition-colors tw-duration-fast hover:tw-border-gold/60 hover:tw-bg-gold/15 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold"
      @click="dialogStore.showReferralOffer()"
    >
      <font-awesome-icon :icon="faGift" class="tw-text-xs" aria-hidden="true" />
      Earn credits
    </button>
  </template>
</template>

<style scoped>
/* Light theme: gold.muted for readable contrast */
:global(html:not(.tw-dark)) .referral-offer--mobile,
:global(html:not(.tw-dark)) .referral-offer--desktop {
  color: #9e7d35;
  border-color: rgba(158, 125, 53, 0.4);
  background-color: rgba(158, 125, 53, 0.1);
}

:global(html:not(.tw-dark)) .referral-offer--mobile:hover,
:global(html:not(.tw-dark)) .referral-offer--desktop:hover {
  background-color: rgba(158, 125, 53, 0.18);
}
</style>
