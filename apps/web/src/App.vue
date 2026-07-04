<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";

import { useAppStore } from "@/stores/app";

import AppFooter from "@/components/AppFooter.vue";
import ReferralDialog from "@/components/Dialogs/ReferralDialog.vue";
import AppHeaderV2 from "@/components/Header/AppHeaderV2.vue";

const appStore = useAppStore();
const { tab, snackbar, snackbarTimeout, snackbarText } = storeToRefs(appStore);
const route = useRoute();
const { isDark } = storeToRefs(useAppStore());
// The landing page ships its own immersive nav, footer and dark canvas, so the
// global Vuetify chrome (and purple gradient) is suppressed on '/'.
const isLanding = computed(() => route.path === "/");
const isHeaderVisible = computed(() => {
  return (
    !isLanding.value &&
    route.path !== "/signin" &&
    route.path !== "/login" &&
    route.path !== "/signup"
  );
});
const overflowHidden = computed(() => {
  return route.path === "/dashboard" && tab.value === 1;
});
const isFooterVisible = computed(() => {
  return (
    !isLanding.value &&
    route.path !== "/signin" &&
    route.path !== "/login" &&
    route.path !== "/signup" &&
    route.path !== "/dashboard"
  );
});
onMounted(() => {
  // add dark mode for tailwind css on load
  document.documentElement.classList.add("tw-dark");
});
</script>
<template>
  <v-app :class="isLanding ? 'landing-bg' : isDark ? 'dark-bg' : 'light-bg'">
    <AppHeaderV2 v-if="isHeaderVisible" />
    <v-main
      :class="{
        'tw-h-[98vh] tw-overflow-y-hidden': overflowHidden,
        'tw-pt-0': isLanding,
        'tw-pt-14': isHeaderVisible && !isLanding,
      }"
    >
      <router-view />
      <ReferralDialog />
    </v-main>
    <div v-if="isFooterVisible" class="tw-relative tw-flex tw-py-1 tw-items-center">
      <div class="tw-flex-grow tw-border-t tw-border-neutral-600"></div>
    </div>
    <AppFooter v-if="isFooterVisible" />

    <v-snackbar
      v-model="snackbar"
      :timeout="snackbarTimeout"
      location="bottom right"
      color="purple-accent-4"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>

<style scoped lang="scss">
.dark-bg {
  background: #18120e;
}
.light-bg {
  background: #faf6f1;
}
.landing-bg {
  background: #18120e;
}
</style>
