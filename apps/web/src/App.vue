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
import Toast from '@/components/primitives/Toast.vue';

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
// global chrome is suppressed on '/'.
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
  <div class="tw-flex tw-min-h-dvh tw-flex-col tw-bg-canvas tw-font-body">
    <AppHeader v-if="isHeaderVisible" />
    <div
      class="tw-flex-1"
      :class="{
        'tw-h-[98vh] tw-overflow-y-hidden': overflowHidden && !isExploreViewer,
        'tw-h-[100dvh] tw-overflow-hidden': isExploreViewer,
        'tw-pt-0': isLanding || isExploreViewer,
        'tw-pt-14': isHeaderVisible && !isLanding && !isExploreViewer,
      }"
    >
      <router-view />
      <ReferralDialog />
    </div>
    <AppFooter v-if="isFooterVisible" />

    <Toast v-model="snackbar" :timeout="snackbarTimeout" :text="snackbarText" />
  </div>
</template>
