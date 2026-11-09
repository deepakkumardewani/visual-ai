<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';

const dialogStore = useDialogStore();
const { isPro } = storeToRefs(useUserStore());
const { historyCap, historyFullLevel, savedCount } = storeToRefs(useHistoryStore());

const message = computed(() =>
  historyFullLevel.value === 'full'
    ? "History full - new creations won't be saved. Delete old images to make room."
    : `History almost full (${savedCount.value}/${historyCap.value}). Delete old images to keep saving new ones.`,
);
</script>

<template>
  <p
    v-if="historyFullLevel !== 'none'"
    role="status"
    data-testid="history-full-note"
    :data-level="historyFullLevel"
    :class="[
      'tw-m-0 tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-1 tw-text-caption',
      historyFullLevel === 'full' ? 'tw-text-gold' : 'tw-text-ink-muted',
    ]"
  >
    <font-awesome-icon icon="fa-solid fa-circle-info" aria-hidden="true" />
    <span>{{ message }}</span>
    <button
      v-if="!isPro"
      type="button"
      data-testid="history-full-upgrade"
      class="tw-font-semibold tw-text-accent hover:tw-underline"
      @click="dialogStore.showPricing()"
    >
      Upgrade
    </button>
  </p>
</template>
