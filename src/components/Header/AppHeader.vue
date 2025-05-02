<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { SignedIn, SignedOut } from 'vue-clerk'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import CustomButton from '@/components/CustomButton.vue'
import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue'
import ProUpgradeDialog from '@/components/Dialogs/ProUpgradeDialog.vue'
import ReferralOfferDialog from '@/components/Dialogs/ReferralOfferDialog.vue'
import Coin from '@/components/Header/Coin.vue'
import FeatureSelect from '@/components/Header/FeatureSelect.vue'
import Logo from '@/components/Header/Logo.vue'
import ReferralOffer from '@/components/Header/ReferralOffer.vue'
import Tabs from '@/components/Header/Tabs.vue'
import ThemeButton from '@/components/Header/ThemeButton.vue'
import UserMenu from '@/components/Header/UserMenu.vue'

const { smAndUp } = useDisplay()
const userStore = useUserStore()
const dialogStore = useDialogStore()
const { isPro } = storeToRefs(userStore)
const route = useRoute()
const appStore = useAppStore()
const { isDark, tab } = storeToRefs(appStore)

const isThemeButtonVisible = computed(() => {
  return route.path !== '/privacy' && route.path !== '/terms' && route.path !== '/refund'
})

// Function to check if pro upgrade dialog has been shown
const hasProDialogBeenShown = () => {
  return localStorage.getItem('proUpgradeShown') === 'true'
}

// Function to mark pro dialog as shown
const markProDialogAsShown = () => {
  localStorage.setItem('proUpgradeShown', 'true')
}

watch(isPro, (newValue) => {
  if (newValue && !hasProDialogBeenShown()) {
    dialogStore.showProUpgrade()
    markProDialogAsShown()
  }
})
</script>
<template>
  <div>
    <SignedIn>
      <ReferralOffer v-if="!smAndUp && route.path === '/dashboard'" />
    </SignedIn>
    <v-app-bar
      :elevation="0"
      :class="{ header: !smAndUp && route.path === '/dashboard' }"
      :color="route.path === '/' ? 'transparent' : isDark ? '#3b0764' : '#a855f7'"
    >
      <v-row class="align-center">
        <v-col :cols="smAndUp ? 4 : route.path === '/dashboard' ? 7 : 6">
          <div class="tw-relative tw-flex tw-min-w-0 tw-shrink-0 tw-items-center tw-gap-3">
            <Logo />
            <div class="tw-relative tw-min-w-0 tw-flex-1 tw-lg:tw-flex-none">
              <FeatureSelect v-if="route.path === '/dashboard' && tab === 1" />
            </div>
          </div>
        </v-col>

        <v-col v-if="smAndUp" cols="5">
          <SignedIn>
            <Tabs v-if="route.path === '/dashboard'" />
          </SignedIn>
        </v-col>
        <v-col :cols="smAndUp ? 3 : route.path === '/dashboard' ? 5 : 6">
          <div class="tw-flex tw-shrink-0 tw-gap-4 tw-mr-3">
            <div id="export-area" class="ml-auto tw-flex tw-items-center tw-gap-4 tw-lg:tw-gap-4">
              <SignedOut>
                <ThemeButton v-if="isThemeButtonVisible" />
                <v-btn
                  v-if="route.path === '/'"
                  class="mx-4"
                  variant="tonal"
                  size="small"
                  color="purple-lighten-2"
                  to="/dashboard"
                  >Try it now</v-btn
                >

                <v-btn
                  v-if="route.path === '/dashboard'"
                  class="mx-4"
                  variant="tonal"
                  :color="isDark ? 'purple-lighten-2' : 'purple-darken-5'"
                  size="small"
                  to="/signin"
                >
                  Sign In
                </v-btn>
              </SignedOut>

              <SignedIn>
                <!-- Only show ReferralOffer on desktop -->
                <ReferralOffer v-if="smAndUp && route.path === '/dashboard'" />
                <Coin v-if="route.path === '/dashboard'" />
                <CustomButton v-if="route.path !== '/dashboard'" title="Dashboard" />
                <UserMenu />
              </SignedIn>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-app-bar>
    <!-- <PricingDialog /> -->
    <BuyMoreCreditsDialog />
    <ReferralOfferDialog />
    <ProUpgradeDialog />
  </div>
</template>

<style scoped lang="scss">
.header {
  position: relative !important;
}
</style>
