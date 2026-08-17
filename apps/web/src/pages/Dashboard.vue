<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';

import { useComposerPersistence } from '@/composables/useComposerPersistence';
import { useGlobalShortcuts } from '@/composables/useGlobalShortcuts';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';
import ResultCanvas from '@/components/Dashboard/Canvas/ResultCanvas.vue';
import PromptBar from '@/components/Dashboard/Composer/PromptBar.vue';
import DashboardShell from '@/components/Dashboard/DashboardShell.vue';
import MobileSettingsSheet from '@/components/Dashboard/MobileSettingsSheet.vue';
import ExploreFeed from '@/components/Dashboard/Feed/ExploreFeed.vue';
import DashboardSidebar from '@/components/Dashboard/Sidebar/DashboardSidebar.vue';
import NavTabs from '@/components/Header/NavTabs.vue';
import History from '@/components/History/History.vue';
import SignupDialog from '@/components/Dialogs/SignupDialog.vue';

import { faSliders } from '@/plugins/icons';

import {
  APP_SURFACE,
  APP_SURFACE_TAB,
  isAppShellRoute,
  resolveCreateFeature,
  tabFromRouteName,
} from '@/utils/dashboardRoutes';

/** Match DashboardShell / Tailwind `sm` (640px), not Vuetify’s 600px `xs`. */
const CREATE_SM_UP = 640;

const appStore = useAppStore();
const { tab, feature } = storeToRefs(appStore);
const route = useRoute();
const { xs, width } = useDisplay();

useComposerPersistence();
useGlobalShortcuts();

const isImageFeature = computed(() => !feature.value || feature.value === FeatureType.IMAGE);
const isSmUp = computed(() => width.value >= CREATE_SM_UP);
const settingsOpen = ref(false);

watch(isSmUp, (up) => {
  if (up) settingsOpen.value = false;
});

/** Keep Pinia tab/feature in sync with the URL so existing consumers keep working. */
function syncStoresFromRoute() {
  const nextTab = tabFromRouteName(route.name);
  if (nextTab !== null) {
    tab.value = nextTab;
  }

  if (route.name === APP_SURFACE.CREATE) {
    appStore.setFeature(resolveCreateFeature(route.params.feature));
  }
}

watch(
  () => [route.name, route.params.feature] as const,
  () => {
    syncStoresFromRoute();
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="isAppShellRoute(route) && xs"
    data-testid="dashboard-mobile-tabs"
    class="tw-mt-1 tw-bg-surface-1"
  >
    <NavTabs />
  </div>

  <div v-show="tab === APP_SURFACE_TAB.create" data-testid="dashboard-generate-panel">
    <DashboardShell>
      <template #rail>
        <DashboardSidebar v-if="isSmUp" />
      </template>
      <template #canvas>
        <div class="tw-flex tw-h-full tw-min-h-0 tw-flex-col">
          <!-- Desktop: prompt stays on top -->
          <div
            v-if="isImageFeature && isSmUp"
            class="tw-shrink-0 tw-px-3 tw-pb-2 tw-pt-3 sm:tw-px-6 sm:tw-pt-5"
          >
            <PromptBar />
          </div>

          <div class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto no-scrollbar">
            <ResultCanvas />
          </div>

          <!-- Mobile: settings + prompt docked to viewport bottom (safe-area aware) -->
          <div
            v-if="!isSmUp"
            data-testid="mobile-composer-dock"
            class="tw-shrink-0 tw-border-t tw-border-hairline tw-bg-surface-1/95 tw-px-3 tw-pt-2 tw-backdrop-blur-md"
            :style="{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }"
          >
            <div class="tw-mb-2 tw-flex tw-items-center">
              <button
                type="button"
                data-testid="mobile-settings-trigger"
                class="tw-inline-flex tw-min-h-10 tw-min-w-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-hairline tw-bg-surface-2 tw-px-3 tw-text-sm tw-font-medium tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent"
                @click="settingsOpen = true"
              >
                <font-awesome-icon :icon="faSliders" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
                Settings
              </button>
            </div>
            <PromptBar v-if="isImageFeature" />
          </div>
        </div>
      </template>
    </DashboardShell>

    <MobileSettingsSheet v-model="settingsOpen">
      <DashboardSidebar v-if="!isSmUp" />
    </MobileSettingsSheet>

    <SignupDialog />
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </div>

  <div
    v-show="tab === APP_SURFACE_TAB.explore"
    data-testid="dashboard-explore-panel"
    class="tw-h-[calc(100vh-60px)] tw-overflow-y-auto tw-bg-canvas no-scrollbar"
  >
    <ExploreFeed />
  </div>

  <div
    v-show="tab === APP_SURFACE_TAB.assets"
    data-testid="dashboard-assets-panel"
    class="tw-h-[calc(100vh-60px)] tw-overflow-y-auto tw-bg-canvas no-scrollbar"
  >
    <History />
  </div>
</template>
