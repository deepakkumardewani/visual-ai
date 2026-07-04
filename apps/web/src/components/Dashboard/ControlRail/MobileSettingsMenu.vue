<script setup lang="ts">
import { ref } from "vue";

import { faGear } from "@/plugins/icons";

import { useDashboardMotion } from "@/composables/useDashboardMotion";

import Popover from "@/components/primitives/Popover.vue";
import SettingsCluster from "@/components/Dashboard/ControlRail/SettingsCluster.vue";

const isOpen = ref(false);
const { interactiveTransition } = useDashboardMotion();
</script>

<template>
  <Popover v-model:open="isOpen" placement="bottom-end">
    <template #trigger="{ open }">
      <span
        data-testid="mobile-settings-trigger"
        :class="[
          'tw-inline-flex tw-min-h-[44px] tw-min-w-[44px] tw-items-center tw-justify-center tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-1 tw-text-ink-muted hover:tw-border-accent/40 hover:tw-text-accent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]',
          interactiveTransition,
          open ? 'tw-border-accent/50 tw-text-accent' : '',
        ]"
        aria-label="Open generation settings"
      >
        <font-awesome-icon :icon="faGear" class="tw-h-4 tw-w-4" aria-hidden="true" />
      </span>
    </template>

    <div data-testid="mobile-settings-panel" class="tw-w-[min(24rem,calc(100vw-2rem))]">
      <SettingsCluster />
    </div>
  </Popover>
</template>
