<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useUser } from 'vue-clerk';
import { useRoute, useRouter } from 'vue-router';

import { useAppStore } from '@/stores/app';
import { useDialogStore, CHAIN_ACTION_LABELS } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import AppFooter from '@/components/AppFooter.vue';
import ConfirmChainActionDialog from '@/components/Dialogs/ConfirmChainActionDialog.vue';
import ReferralDialog from '@/components/Dialogs/ReferralDialog.vue';
import AppHeader from '@/components/Header/AppHeader.vue';
import Toast from '@/components/primitives/Toast.vue';

import { APP_SURFACE, isAppShellRoute } from '@/utils/dashboardRoutes';

const appStore = useAppStore();
const userStore = useUserStore();
const dialogStore = useDialogStore();
const { user, isLoaded } = useUser();
const { snackbar, snackbarTimeout, snackbarText } = storeToRefs(appStore);
const { showChainActionDialog, chainAction, chainActionCreditCost, chainActionExtraCopy } =
  storeToRefs(dialogStore);
const route = useRoute();
const router = useRouter();
const chainActionName = computed(() => CHAIN_ACTION_LABELS[chainAction.value]);

watch(
  [user, isLoaded],
  ([currentUser, loaded]) => {
    if (!loaded) return;
    if (!currentUser) {
      // Signed-out visitors never fetch a profile; the header waits on this flag.
      userStore.isReady = true;
      const protectedRoute = route.name === 'profile' || route.name === 'explore-image';
      if (protectedRoute) {
        void router.replace({ name: 'signin', query: { redirect: route.fullPath } });
      }
      return;
    }
    void userStore.syncFromClerk(currentUser.id);
  },
  { immediate: true },
);
// Landing, its design candidates and keyword feature landers ship their own nav/footer.
const CANDIDATE_LANDING_PATHS: ReadonlySet<string> = new Set(['/v2', '/v3']);
const isMarketingShell = computed(
  () =>
    route.path === '/' ||
    CANDIDATE_LANDING_PATHS.has(route.path) ||
    String(route.name ?? '').startsWith('seo-'),
);
const isExploreViewer = computed(() => route.name === 'explore-image');
const isHeaderVisible = computed(() => {
  return (
    !isMarketingShell.value &&
    !isExploreViewer.value &&
    route.path !== '/signin' &&
    route.path !== '/login' &&
    route.path !== '/signup'
  );
});
const overflowHidden = computed(() => {
  return route.name === APP_SURFACE.CREATE || isExploreViewer.value;
});
/** Public marketing/legal pages ship LandingFooter themselves. Keep AppHeader. */
const MARKETING_FOOTER_PATHS = new Set([
  '/pricing',
  '/compare',
  '/contact',
  '/examples',
  '/gallery',
  '/faqs',
  '/privacy',
  '/terms',
  '/refund',
]);
const isFooterVisible = computed(() => {
  return (
    !isMarketingShell.value &&
    !isExploreViewer.value &&
    !isAppShellRoute(route) &&
    !MARKETING_FOOTER_PATHS.has(route.path) &&
    route.path !== '/signin' &&
    route.path !== '/login' &&
    route.path !== '/signup'
  );
});

/** At 640-767px the dashboard header is in flow (banner + header): drop the fixed-header offset and let the h-dvh column let the shell flex-fill the remaining space. */
const isHeaderInFlowBand = computed(
  () => isHeaderVisible.value && isAppShellRoute(route) && !isExploreViewer.value,
);
</script>
<template>
  <div
    class="tw-flex tw-min-h-dvh tw-flex-col tw-bg-canvas tw-font-body"
    :class="{ 'sm:max-md:tw-h-dvh': isHeaderInFlowBand }"
  >
    <AppHeader v-if="isHeaderVisible" />
    <div
      class="tw-flex-1"
      :class="{
        'tw-h-[98vh] tw-overflow-y-hidden': overflowHidden && !isExploreViewer,
        'tw-h-[100dvh] tw-overflow-hidden': isExploreViewer,
        'tw-pt-0': isMarketingShell || isExploreViewer,
        'tw-pt-14': isHeaderVisible && !isMarketingShell && !isExploreViewer,
        'sm:max-md:tw-flex sm:max-md:tw-h-auto sm:max-md:tw-min-h-0 sm:max-md:tw-flex-col sm:max-md:tw-pt-0 sm:max-md:[&>div]:tw-flex sm:max-md:[&>div]:tw-min-h-0 sm:max-md:[&>div]:tw-flex-1 sm:max-md:[&>div]:tw-flex-col':
          isHeaderInFlowBand,
      }"
    >
      <router-view />
      <ReferralDialog />
    </div>
    <AppFooter v-if="isFooterVisible" />

    <Toast v-model="snackbar" :timeout="snackbarTimeout" :text="snackbarText" />
    <ConfirmChainActionDialog
      :open="showChainActionDialog"
      :action-name="chainActionName"
      :credit-cost="chainActionCreditCost"
      :extra-copy="chainActionExtraCopy"
      @close="dialogStore.resolveChainAction(false)"
      @confirm="dialogStore.resolveChainAction(true)"
    />
  </div>
</template>
