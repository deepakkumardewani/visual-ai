<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';
import ResultCanvas from '@/components/Dashboard/Canvas/ResultCanvas.vue';
import PromptBar from '@/components/Dashboard/Composer/PromptBar.vue';
import DashboardShell from '@/components/Dashboard/DashboardShell.vue';
import ExploreFeed from '@/components/Dashboard/Feed/ExploreFeed.vue';
import DashboardSidebar from '@/components/Dashboard/Sidebar/DashboardSidebar.vue';
import NavTabs from '@/components/Header/NavTabs.vue';
import History from '@/components/History/History.vue';
import SignupDialog from '@/components/Dialogs/SignupDialog.vue';

const appStore = useAppStore();
const { tab, feature } = storeToRefs(appStore);
const route = useRoute();
const { xs } = useDisplay();

const isImageFeature = computed(() => !feature.value || feature.value === FeatureType.IMAGE);
</script>

<template>
  <div
    v-if="route.path === '/dashboard' && xs"
    data-testid="dashboard-mobile-tabs"
    class="tw-mt-1 tw-bg-surface-1"
  >
    <NavTabs />
  </div>

  <div v-show="tab === 1" data-testid="dashboard-generate-panel">
    <DashboardShell>
      <template #rail>
        <DashboardSidebar />
      </template>
      <template #canvas>
        <div class="tw-flex tw-h-full tw-min-h-0 tw-flex-col">
          <div
            v-if="isImageFeature"
            class="tw-shrink-0 tw-px-3 tw-pb-2 tw-pt-3 sm:tw-px-6 sm:tw-pt-5"
          >
            <PromptBar />
          </div>
          <div class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto no-scrollbar">
            <ResultCanvas />
          </div>
        </div>
      </template>
    </DashboardShell>
    <SignupDialog />
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </div>

  <div
    v-show="tab === 2"
    data-testid="dashboard-explore-panel"
    class="tw-h-[calc(100vh-60px)] tw-overflow-y-auto tw-bg-canvas no-scrollbar"
  >
    <ExploreFeed />
  </div>

  <div
    v-show="tab === 3"
    data-testid="dashboard-assets-panel"
    class="tw-h-[calc(100vh-60px)] tw-overflow-y-auto tw-bg-canvas no-scrollbar"
  >
    <History />
  </div>
</template>
