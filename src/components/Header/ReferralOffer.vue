<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import { useDisplay } from "vuetify";

import { useDialogStore } from "@/stores/dialog";
import { useUserStore } from "@/stores/user";

const dialogStore = useDialogStore();
const { smAndUp } = useDisplay();
const userStore = useUserStore();
const { isPro } = storeToRefs(userStore);

// Computed property to determine if user data has loaded
const isUserDataLoaded = ref(false);

// Set isUserDataLoaded to true after the first API response has been received
watch(
  () => userStore.userDetails,
  (newValue) => {
    if (newValue) {
      isUserDataLoaded.value = true;
    }
  },
  { immediate: true },
);
</script>

<template>
  <template v-if="isUserDataLoaded && !isPro">
    <!-- Mobile version - full width banner -->
    <div
      v-if="!smAndUp"
      class="tw-w-full tw-bg-amber-500 tw-text-white tw-py-2 tw-text-center tw-cursor-pointer"
      @click="dialogStore.showReferralOffer()"
    >
      <v-icon size="small" class="tw-mr-1">fa-solid fa-gift</v-icon>
      Refer a friend and get Free Pro
    </div>

    <!-- Desktop version - button -->
    <v-btn
      v-else
      size="small"
      variant="outlined"
      color="amber"
      class="tw-border-amber-500"
      @click="dialogStore.showReferralOffer()"
    >
      <v-icon left size="small" class="tw-mr-1">fa-solid fa-gift</v-icon>
      Free Pro
    </v-btn>
  </template>
</template>

<style scoped></style>
