<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useUser } from 'vue-clerk';
import { useRoute } from 'vue-router';

import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

import AppFooter from '@/components/AppFooter.vue';
import ReferralDialog from '@/components/Dialogs/ReferralDialog.vue';
import AppHeader from '@/components/Header/AppHeader.vue';

import { APP_SURFACE, isAppShellRoute } from '@/utils/dashboardRoutes';

const appStore = useAppStore();
const userStore = useUserStore();
const { user, isLoaded } = useUser();
const { snackbar, snackbarTimeout, snackbarText } = storeToRefs(appStore);
const route = useRoute();

watch(
  [user, isLoaded],
  ([currentUser, loaded]) => {
    if (!loaded || !currentUser) return;
    void userStore.syncFromClerk(currentUser.id);
  },
  { immediate: true },
);
// The landing page ships its own immersive nav and footer, so the
// global Vuetify chrome is suppressed on '/'.
const isLanding = computed(() => route.path === '/');
const isExploreViewer = computed(() => route.name === 'explore-image');
const isHeaderVisible = computed(() => {
  return (
    !isLanding.value &&
    !isExploreViewer.value &&
    route.path !== '/signin' &&
    route.path !== '/login' &&
    route.path !== '/signup'
  );
});
const overflowHidden = computed(() => {
  return route.name === APP_SURFACE.CREATE || isExploreViewer.value;
});
const isFooterVisible = computed(() => {
  return (
    !isLanding.value &&
    !isExploreViewer.value &&
    !isAppShellRoute(route) &&
    route.path !== '/signin' &&
    route.path !== '/login' &&
    route.path !== '/signup'
  );
});
</script>
<template>
  <v-app class="tw-bg-canvas">
    <AppHeader v-if="isHeaderVisible" />
    <v-main
      :class="{
        'tw-h-[98vh] tw-overflow-y-hidden': overflowHidden && !isExploreViewer,
        'tw-h-[100dvh] tw-overflow-hidden': isExploreViewer,
        'tw-pt-0': isLanding || isExploreViewer,
        'tw-pt-14': isHeaderVisible && !isLanding && !isExploreViewer,
      }"
    >
      <router-view />
      <ReferralDialog />
    </v-main>
    <AppFooter v-if="isFooterVisible" />

    <v-snackbar
      v-model="snackbar"
      :timeout="snackbarTimeout"
      location="bottom right"
      color="#C9A84C"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>
