<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useDisplay } from "vuetify";

import { useAppStore } from "@/stores/app";
import { useDialogStore } from "@/stores/dialog";

const dialogStore = useDialogStore();
const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const { showProUpgradeDialog } = storeToRefs(dialogStore);
const { smAndUp } = useDisplay();

const features = [
  {
    icon: "fa-solid fa-bolt",
    title: "Priority Processing",
    description: "Get faster image generation and processing",
  },
  {
    icon: "fa-solid fa-images",
    title: "Higher Quality",
    description: "Access to premium image quality settings",
  },
  {
    icon: "fa-solid fa-download",
    title: "Unlimited Downloads",
    description: "Download as many images as you need",
  },
  {
    icon: "fa-solid fa-credit-card",
    title: "Reduced Credit Usage",
    description: "Use fewer credits for special operations",
  },
];
</script>

<template>
  <v-dialog v-model="showProUpgradeDialog" :max-width="smAndUp ? '600px' : '95%'">
    <v-card :color="isDark ? '#3b0764' : '#f5f3ff'" class="tw-p-6 tw-overflow-hidden tw-relative">
      <!-- Background decoration -->
      <div class="tw-absolute tw-right-0 tw-top-0 tw-opacity-10">
        <v-icon icon="fa-solid fa-crown" size="150"></v-icon>
      </div>

      <!-- Header section -->
      <div class="tw-text-center tw-mb-6">
        <v-avatar size="80" color="amber" class="tw-mb-4">
          <v-icon icon="fa-solid fa-crown" size="40" color="white"></v-icon>
        </v-avatar>
        <v-card-title class="text-h4 tw-font-bold tw-mb-2">🎉 Welcome to Pro!</v-card-title>
        <v-card-subtitle class="tw-text-lg">
          Your experience just got a major upgrade
        </v-card-subtitle>
      </div>

      <!-- Features section -->
      <v-card-text class="tw-py-4">
        <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            :class="[
              'tw-p-4 tw-rounded-lg tw-flex tw-items-center tw-gap-3',
              isDark ? 'tw-bg-purple-900/50' : 'tw-bg-purple-100',
            ]"
          >
            <v-avatar
              size="40"
              :color="isDark ? 'purple-darken-1' : 'purple'"
              class="tw-flex-shrink-0"
            >
              <v-icon :icon="feature.icon" color="white" size="18"></v-icon>
            </v-avatar>
            <div>
              <h3 class="tw-font-semibold tw-mb-1">{{ feature.title }}</h3>
              <p class="tw-text-sm tw-opacity-80">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- Action button -->
      <v-card-actions class="tw-justify-center tw-mt-4">
        <v-btn
          size="large"
          color="purple"
          variant="elevated"
          class="tw-px-8 tw-py-2"
          @click="dialogStore.hideProUpgrade"
        >
          Start Creating
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
