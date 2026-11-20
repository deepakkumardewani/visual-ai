<script setup lang="ts">
import { faGem } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useHeaderBreakpoint } from '@/composables/useHeaderBreakpoint';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import CreditsChip from '@/components/Header/CreditsChip.vue';
import ReferralOffer from '@/components/Header/ReferralOffer.vue';
import UserMenu from '@/components/Header/UserMenu.vue';
import Tooltip from '@/components/primitives/Tooltip.vue';

const UPGRADE_LABEL = 'Upgrade to Pro';

const { isMobile, isTablet } = useHeaderBreakpoint();
const dialogStore = useDialogStore();
const { isPro, isReady } = storeToRefs(useUserStore());

const isIconOnly = computed(() => isMobile.value || isTablet.value);
const showUpgrade = computed(() => isReady.value && !isPro.value);
</script>

<template>
  <ReferralOffer v-if="!isMobile" :icon-only="isIconOnly" />

  <template v-if="showUpgrade">
    <Tooltip v-if="isIconOnly" :text="UPGRADE_LABEL" placement="bottom">
      <button
        type="button"
        data-testid="upgrade-button"
        :aria-label="UPGRADE_LABEL"
        class="upgrade-button tw-inline-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gold/40 tw-bg-gold/10 tw-text-sm tw-text-gold tw-transition-colors tw-duration-fast hover:tw-bg-gold/20 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold"
        @click="dialogStore.showPricing()"
      >
        <font-awesome-icon :icon="faGem" aria-hidden="true" />
      </button>
    </Tooltip>
    <button
      v-else
      type="button"
      data-testid="upgrade-button"
      :aria-label="UPGRADE_LABEL"
      class="upgrade-button tw-inline-flex tw-h-11 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-gold/40 tw-bg-gold/10 tw-px-3 tw-text-sm tw-font-semibold tw-text-gold tw-transition-colors tw-duration-fast hover:tw-bg-gold/20 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold"
      @click="dialogStore.showPricing()"
    >
      <font-awesome-icon :icon="faGem" class="tw-text-xs" aria-hidden="true" />
      {{ UPGRADE_LABEL }}
    </button>
  </template>

  <CreditsChip />
  <UserMenu />
</template>

<style scoped>
/* Light theme: gold.muted for readable contrast */
:global(html:not(.tw-dark)) .upgrade-button {
  color: #9e7d35;
  border-color: rgba(158, 125, 53, 0.4);
  background-color: rgba(158, 125, 53, 0.1);
}
</style>
