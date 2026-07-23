<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { SignedIn, SignedOut, useAuth } from 'vue-clerk';
import { useRoute } from 'vue-router';

import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import CustomButton from '@/components/CustomButton.vue';
import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import ProUpgradeDialog from '@/components/Dialogs/ProUpgradeDialog.vue';
import ReferralOfferDialog from '@/components/Dialogs/ReferralOfferDialog.vue';
import CreditsChip from '@/components/Header/CreditsChip.vue';
import FeatureSelect from '@/components/Header/FeatureSelect.vue';
import Logo from '@/components/Header/Logo.vue';
import NavTabs from '@/components/Header/NavTabs.vue';
import ReferralOffer from '@/components/Header/ReferralOffer.vue';
import ThemeButton from '@/components/Header/ThemeButton.vue';
import UserMenu from '@/components/Header/UserMenu.vue';

const smAndUp = useMediaQuery('(min-width: 600px)');
const { isLoaded: isAuthLoaded } = useAuth();
const userStore = useUserStore();
const dialogStore = useDialogStore();
const route = useRoute();
const { isPro, isReady: isUserReady } = storeToRefs(userStore);
const appStore = useAppStore();
const { tab } = storeToRefs(appStore);

const isDashboard = computed(() => route.path === '/dashboard');

const isThemeButtonVisible = computed(() => {
  return route.path !== '/privacy' && route.path !== '/terms' && route.path !== '/refund';
});

const showDesktopNavTabs = computed(() => smAndUp.value && isDashboard.value);

/** Dashboard is auth-gated — show tabs once Clerk is loaded (don't wait for SignedIn). */
const showNavTabs = computed(() => Boolean(isAuthLoaded.value) && isDashboard.value);

/**
 * Right chrome needs credits/profile data. Keep a layout-matched skeleton until
 * Clerk is loaded and (on dashboard) user details have synced.
 */
const showEndSkeleton = computed(() => {
  if (!isAuthLoaded.value) return true;
  if (isDashboard.value && !isUserReady.value) return true;
  return false;
});

function hasProDialogBeenShown() {
  return localStorage.getItem('proUpgradeShown') === 'true';
}

function markProDialogAsShown() {
  localStorage.setItem('proUpgradeShown', 'true');
}

watch(isPro, (newValue) => {
  if (newValue && !hasProDialogBeenShown()) {
    dialogStore.showProUpgrade();
    markProDialogAsShown();
  }
});
</script>

<template>
  <div data-testid="app-header-v2">
    <SignedIn>
      <ReferralOffer v-if="!smAndUp && isDashboard" />
    </SignedIn>
    <header
      class="header-v2 tw-fixed tw-left-0 tw-right-0 tw-top-0 tw-z-50 tw-h-16 tw-bg-surface-1/80 tw-backdrop-blur-[14px]"
      :class="{ 'header-v2--dashboard-mobile': !smAndUp && isDashboard }"
    >
      <div
        class="header-v2__inner tw-mx-auto tw-flex tw-h-16 tw-w-full tw-items-center tw-gap-3 tw-px-4 lg:tw-gap-5 lg:tw-px-6"
      >
        <div
          class="header-v2__start tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3 lg:tw-flex-none lg:tw-basis-1/4"
        >
          <Logo />
          <div
            v-if="isDashboard && tab === 1"
            class="tw-relative tw-hidden tw-min-w-0 tw-flex-1 md:tw-block lg:tw-flex-none"
          >
            <FeatureSelect />
          </div>
        </div>

        <div
          v-if="showDesktopNavTabs"
          class="header-v2__center tw-hidden tw-flex-1 tw-justify-center md:tw-flex"
        >
          <div
            v-if="!showNavTabs"
            aria-hidden="true"
            class="tw-h-11 tw-w-full tw-max-w-md tw-animate-pulse tw-rounded-full tw-bg-surface-2"
          />
          <NavTabs v-else />
        </div>

        <div
          class="header-v2__end tw-ml-auto tw-flex tw-shrink-0 tw-items-center tw-gap-2 lg:tw-basis-1/4 lg:tw-justify-end lg:tw-gap-3"
        >
          <div
            v-if="showEndSkeleton"
            aria-hidden="true"
            data-testid="header-end-skeleton"
            class="tw-flex tw-items-center tw-gap-2 lg:tw-gap-3"
          >
            <div
              v-if="isDashboard"
              class="tw-h-9 tw-w-[4.5rem] tw-animate-pulse tw-rounded-chip tw-bg-surface-2"
            />
            <div
              v-if="isDashboard"
              class="tw-h-9 tw-w-[4.75rem] tw-animate-pulse tw-rounded-chip tw-bg-surface-2"
            />
            <div class="tw-h-9 tw-w-9 tw-animate-pulse tw-rounded-full tw-bg-surface-2" />
          </div>
          <div v-else id="export-area" class="tw-flex tw-items-center tw-gap-2 lg:tw-gap-3">
            <SignedOut>
              <ThemeButton v-if="isThemeButtonVisible" />
              <router-link
                v-if="route.path === '/'"
                to="/dashboard"
                class="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-chip tw-border tw-border-accent/30 tw-bg-accent/10 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-accent/20 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
              >
                Try it now
              </router-link>
              <router-link
                v-if="isDashboard"
                to="/signin"
                data-testid="header-sign-in"
                class="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-chip tw-border tw-border-border tw-bg-surface-1/60 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
              >
                Sign In
              </router-link>
            </SignedOut>

            <SignedIn>
              <ReferralOffer v-if="smAndUp && isDashboard" />
              <CreditsChip v-if="isDashboard" />
              <router-link
                v-if="isDashboard && !isPro"
                to="/pricing"
                data-testid="header-upgrade-btn"
                class="tw-inline-flex tw-min-h-9 tw-items-center tw-justify-center tw-rounded-chip tw-bg-gradient-gold tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-canvas tw-transition-opacity tw-duration-fast hover:tw-opacity-90 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold"
              >
                Upgrade
              </router-link>
              <CustomButton v-if="!isDashboard" title="Dashboard" />
              <UserMenu />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
    <BuyMoreCreditsDialog />
    <ReferralOfferDialog />
    <ProUpgradeDialog />
  </div>
</template>

<style scoped lang="scss">
.header-v2 {
  border-bottom: 1px solid transparent;
  border-image: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.35), transparent) 1;
}

.header-v2--dashboard-mobile {
  position: relative !important;
}

@media (prefers-reduced-motion: reduce) {
  .header-v2 {
    backdrop-filter: none;
  }
}
</style>
