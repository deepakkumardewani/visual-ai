<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";

import { useAppStore } from "@/stores/app";

import BuyMoreCreditsDialog from "@/components/Dialogs/BuyMoreCreditsDialog.vue";
import LowCreditsDialog from "@/components/Dialogs/LowCreditsDialog.vue";
import ControlRail from "@/components/Dashboard/ControlRail/ControlRail.vue";
import DashboardShell from "@/components/Dashboard/DashboardShell.vue";
import ResultCanvas from "@/components/Dashboard/Canvas/ResultCanvas.vue";
import Tabs from "@/components/Header/Tabs.vue";
import History from "@/components/History/History.vue";

const appStore = useAppStore();
const { tab } = storeToRefs(appStore);
const route = useRoute();
const { xs } = useDisplay();
</script>

<template>
  <div
    v-if="route.path === '/dashboard' && xs"
    data-testid="dashboard-mobile-tabs"
    class="bg-asideBg tw-mt-1"
  >
    <Tabs />
  </div>

  <div v-show="tab === 1" data-testid="dashboard-generate-panel">
    <DashboardShell>
      <template #rail>
        <ControlRail />
        <BuyMoreCreditsDialog />
        <LowCreditsDialog />
      </template>
      <template #canvas>
        <ResultCanvas />
      </template>
    </DashboardShell>
  </div>

  <div
    v-show="tab === 2"
    data-testid="dashboard-history-panel"
    class="tw-h-[calc(100vh-60px)] tw-overflow-y-auto no-scrollbar"
  >
    <History />
  </div>
</template>
