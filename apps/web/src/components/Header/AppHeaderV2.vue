<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, watch } from "vue";
import { SignedIn, SignedOut } from "vue-clerk";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";

import { useAppStore } from "@/stores/app";
import { useDialogStore } from "@/stores/dialog";
import { useUserStore } from "@/stores/user";

import CustomButton from "@/components/CustomButton.vue";
import BuyMoreCreditsDialog from "@/components/Dialogs/BuyMoreCreditsDialog.vue";
import ProUpgradeDialog from "@/components/Dialogs/ProUpgradeDialog.vue";
import ReferralOfferDialog from "@/components/Dialogs/ReferralOfferDialog.vue";
import CreditsChip from "@/components/Header/CreditsChip.vue";
import FeatureSelect from "@/components/Header/FeatureSelect.vue";
import Logo from "@/components/Header/Logo.vue";
import NavTabs from "@/components/Header/NavTabs.vue";
import ReferralOffer from "@/components/Header/ReferralOffer.vue";
import ThemeButton from "@/components/Header/ThemeButton.vue";
import UserMenu from "@/components/Header/UserMenu.vue";

const { smAndUp } = useDisplay();
const userStore = useUserStore();
const dialogStore = useDialogStore();
const route = useRoute();
const { isPro } = storeToRefs(userStore);
const appStore = useAppStore();
const { tab } = storeToRefs(appStore);

const isDashboard = computed(() => route.path === "/dashboard");

const isThemeButtonVisible = computed(() => {
  return route.path !== "/privacy" && route.path !== "/terms" && route.path !== "/refund";
});

const showDesktopNavTabs = computed(() => smAndUp.value && isDashboard.value);

function hasProDialogBeenShown() {
  return localStorage.getItem("proUpgradeShown") === "true";
}

function markProDialogAsShown() {
  localStorage.setItem("proUpgradeShown", "true");
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
      class="header-v2 tw-fixed tw-left-0 tw-right-0 tw-top-0 tw-z-50 tw-h-14 tw-border-b"
      :class="{ 'header-v2--dashboard-mobile': !smAndUp && isDashboard }"
    >
      <div
        class="header-v2__inner tw-flex tw-h-14 tw-w-full tw-items-center tw-gap-3 tw-px-3 lg:tw-px-4"
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
          <SignedIn>
            <NavTabs />
          </SignedIn>
        </div>

        <div
          class="header-v2__end tw-ml-auto tw-flex tw-shrink-0 tw-items-center tw-gap-2 lg:tw-basis-1/4 lg:tw-justify-end lg:tw-gap-3"
        >
          <div id="export-area" class="tw-flex tw-items-center tw-gap-2 lg:tw-gap-3">
            <SignedOut>
              <ThemeButton v-if="isThemeButtonVisible" />
              <router-link
                v-if="route.path === '/'"
                to="/dashboard"
                class="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-accent/30 tw-bg-accent/10 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-ink-primary hover:tw-bg-accent/20"
              >
                Try it now
              </router-link>
              <router-link
                v-if="isDashboard"
                to="/signin"
                data-testid="header-sign-in"
                class="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-border tw-bg-surface-1/60 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-ink-primary hover:tw-bg-surface-2"
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
                class="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-bg-gradient-gold tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-canvas tw-transition-opacity hover:tw-opacity-90 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold"
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
  backdrop-filter: blur(12px);
  background: rgb(24 18 14 / 0.8);
  border-bottom-color: rgb(58 46 34 / 0.65);
}

.header-v2--dashboard-mobile {
  position: relative !important;
}

:global(.tw-dark) .header-v2 {
  background: rgb(24 18 14 / 0.8);
}

:global(html:not(.tw-dark)) .header-v2 {
  background: rgb(250 246 241 / 0.85);
  border-bottom-color: rgb(217 207 198 / 0.85);
}
</style>
