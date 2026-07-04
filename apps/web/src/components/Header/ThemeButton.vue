<script setup lang="ts">
import { faMoon, faSun } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
</script>

<template>
  <button
    type="button"
    class="theme-btn tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-border/60 tw-bg-surface-1/50 tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-border-accent/40 hover:tw-bg-surface-2 hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
    :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    @click="appStore.toggleTheme"
  >
    <font-awesome-icon
      :icon="isDark ? faSun : faMoon"
      class="tw-text-sm tw-transition-transform tw-duration-fast tw-ease-out"
      :class="{ 'theme-btn__icon--rotate': isDark }"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>
.theme-btn__icon--rotate {
  transform: rotate(-12deg);
}
</style>
