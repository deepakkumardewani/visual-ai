<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SignedIn, SignedOut } from 'vue-clerk'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

import CustomButton from '@/components/CustomButton.vue'
import Coin from '@/components/Header/Coin.vue'
import FeatureSelect from '@/components/Header/FeatureSelect.vue'
import Logo from '@/components/Header/Logo.vue'
import PricingDialog from '@/components/Header/PricingDialog.vue'
import Tabs from '@/components/Header/Tabs.vue'
import UserMenu from '@/components/Header/UserMenu.vue'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

const { smAndUp } = useDisplay()
const userStore = useUserStore()
const { credits } = storeToRefs(userStore)
const dialogStore = useDialogStore()
const route = useRoute()

watch(credits, (newCredits) => {
  if (newCredits < 5) {
    dialogStore.showLowCredits()
  }
})
</script>
<template>
  <v-app-bar :elevation="0" color="transparent">
    <v-row class="align-center">
      <v-col :cols="smAndUp ? 4 : route.path === '/dashboard' ? 7 : 5">
        <div class="tw-relative tw-flex tw-min-w-0 tw-shrink-0 tw-items-center tw-gap-3">
          <Logo />
          <div class="tw-relative tw-min-w-0 tw-flex-1 tw-lg:tw-flex-none">
            <FeatureSelect />
          </div>
        </div>
      </v-col>

      <v-col v-if="smAndUp" cols="5">
        <SignedIn>
          <Tabs v-if="route.path === '/dashboard'" />
        </SignedIn>
      </v-col>
      <v-col :cols="smAndUp ? 3 : route.path === '/dashboard' ? 5 : 7">
        <div class="tw-flex tw-shrink-0 tw-gap-4">
          <div id="export-area" class="ml-auto tw-flex tw-items-center tw-gap-4 tw-lg:tw-gap-4">
            <!-- SignedOut -->
            <SignedOut>
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
                color="purple-lighten-2"
                size="small"
                to="/signin"
              >
                Sign In
              </v-btn>
            </SignedOut>

            <!-- SignedIn -->
            <SignedIn>
              <Coin v-if="route.path === '/dashboard'" />
              <!-- <ThemeButton v-if="route.path === '/dashboard'" /> -->
              <!-- <v-btn
                v-if="route.path !== '/dashboard'"
                class="mx-4"
                size="small"
                variant="tonal"
                color="purple-lighten-2"
                to="/dashboard"
              >
                Launch App
              </v-btn> -->

              <CustomButton v-if="route.path !== '/dashboard'" title="Launch App" />
              <UserMenu />
            </SignedIn>
          </div>
        </div>
      </v-col>

      <!-- <v-col :cols="!mobile && route.path !== '/dashboard' ? 4 : 2">
        <v-app-bar-title class="mx-4 text-h5"> </v-app-bar-title>
      </v-col>
      <v-col cols="2"> </v-col>
      <v-col
        v-if="!mobile && route.path !== '/dashboard'"
        cols="4"
        class="d-flex justify-center align-center"
      >
        <v-btn variant="text">About</v-btn>
        <v-btn variant="text">Gallery</v-btn>
        <v-btn variant="text">Features</v-btn>
      </v-col>
    -->
    </v-row>
  </v-app-bar>
  <PricingDialog />
</template>
