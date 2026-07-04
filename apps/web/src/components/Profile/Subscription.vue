<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { useDialogStore } from "@/stores/dialog";
import { useUserStore } from "@/stores/user";

import ConfirmCancelSubDialog from "@/components/Dialogs/ConfirmCancelSubDialog.vue";

import { RAZORPAY_PRODUCTS } from "@/utils/constants";
import { cancelSubscription, initiatePayment } from "@/utils/payment";

const userStore = useUserStore();
const dialogStore = useDialogStore();
const { userDetails, isPro } = storeToRefs(userStore);
const isLoading = ref(false);
const router = useRouter();
const { mobile } = useDisplay();
async function handlePlan() {
  if (!isPro.value) {
    try {
      isLoading.value = true;
      const product = RAZORPAY_PRODUCTS[4];
      await initiatePayment(product, true);
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      isLoading.value = false;
    }
  } else {
    try {
      //TODO: show a confirm dialog
      dialogStore.showCancelSubscription();
      isLoading.value = true;
      await cancelSubscription();
    } catch (error) {
      console.error("Cancellation failed:", error);
    } finally {
      isLoading.value = false;
    }
  }
}
</script>

<template>
  <v-container class="tw-max-w-3xl tw-mx-auto tw-py-8">
    <v-row justify="center">
      <v-col cols="12" sm="8">
        <h1 class="tw-text-2xl tw-font-medium tw-mb-8">My subscription</h1>

        <!-- Plan Section -->
        <div class="tw-mb-8">
          <h2 class="tw-text-white tw-mb-4">Plan</h2>
          <v-card variant="outlined" class="tw-p-4 tw-transition-all" elevation="0">
            <div class="tw-flex tw-justify-between tw-items-center">
              <v-chip :color="isPro ? 'purple-accent-4' : 'grey'" size="large" class="tw-ml-2">
                {{ isPro ? "Pro" : "Free" }}
              </v-chip>
              <v-btn
                @click="handlePlan"
                :color="isPro ? 'red-lighten-1' : 'purple-lighten-1'"
                variant="tonal"
                class="tw-font-medium"
                :loading="isLoading"
                :disabled="isLoading"
              >
                {{ isPro ? "Cancel subscription" : "Upgrade plan" }}
              </v-btn>
            </div>
          </v-card>
          <div class="tw-flex tw-items-center tw-text-sm text-grey-darken-1 tw-mt-2">
            <div>See limits on the</div>
            <v-btn
              to="/pricing"
              variant="text"
              color="purple-lighten-1"
              class="tw-font-medium tw-px-1 tw-min-w-0 !tw-lowercase"
              density="compact"
            >
              pricing page
            </v-btn>
          </div>
        </div>

        <!-- Credits Section -->
        <!-- <div class="tw-mb-8">
          <h2 class="tw-text-white tw-mb-4">Credits</h2>
          <v-card variant="outlined" class="tw-p-4 tw-transition-all" elevation="0">
            <div class="tw-mb-2 text-grey-darken-3">
              Limited daily use of generative AI and edition tools
            </div>
            <div class="tw-text-sm text-grey-darken-1">
              See limits on the
              <v-btn
                to="/pricing"
                variant="text"
                color="purple-lighten-1"
                class="tw-font-medium tw-px-1 tw-min-w-0 !tw-lowercase"
                density="compact"
              >
                pricing page
              </v-btn>
            </div>
          </v-card>
        </div> -->

        <!-- Billing Information Section -->
        <div>
          <h2 class="tw-text-white tw-mb-4">Billing information</h2>
          <v-card variant="outlined" class="tw-p-4 tw-transition-all" elevation="0">
            <div class="tw-flex tw-justify-between tw-items-center">
              <span class="text-grey-darken-1">{{ userDetails?.email }}</span>
              <v-btn
                v-if="!mobile"
                @click="router.push('/profile?tab=payments')"
                color="purple-lighten-1"
                variant="tonal"
                class="tw-font-medium"
              >
                Billing history
              </v-btn>
            </div>
          </v-card>
          <div class="tw-mt-2">
            <v-btn
              v-if="mobile"
              @click="router.push('/profile?tab=payments')"
              color="purple-lighten-1"
              variant="text"
              class="tw-font-medium tw-p-0"
            >
              Billing history
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
  <ConfirmCancelSubDialog />
</template>

<style scoped>
.v-card {
  border-color: rgb(var(--v-border-color)) !important;
}
</style>
