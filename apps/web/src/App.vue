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

const appStore = useAppStore();
const userStore = useUserStore();
const { user, isLoaded } = useUser();
const { tab, snackbar, snackbarTimeout, snackbarText } = storeToRefs(appStore);
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
  return (route.path === '/dashboard' && tab.value === 1) || isExploreViewer.value;
});
const isFooterVisible = computed(() => {
  return (
    !isLanding.value &&
    !isExploreViewer.value &&
    route.path !== '/signin' &&
    route.path !== '/login' &&
    route.path !== '/signup' &&
    route.path !== '/dashboard'
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
    <div v-if="isFooterVisible" class="tw-relative tw-flex tw-py-1 tw-items-center">
      <div class="tw-flex-grow tw-border-t tw-border-neutral-600"></div>
    </div>
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
