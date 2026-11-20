<script setup lang="ts">
import { storeToRefs } from 'pinia';

import type { IImageObject } from '@/types';
import { HISTORY_CAP, PLAN } from '@visual-ai/shared';
import { computed } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';

import { downloadItemImage } from '@/utils/helpers';

const props = defineProps<{
  result: IImageObject;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

const dialogStore = useDialogStore();
const { isPro } = storeToRefs(useUserStore());
const { historyCap: cap, savedCount: rawSavedCount } = storeToRefs(useHistoryStore());

// The server cap bounds saved history, so a downgraded user over the cap still reads "cap/cap".
const savedCount = computed(() => Math.min(rawSavedCount.value, cap.value));

function download(event: Event) {
  // The result has no stored copy, so this downloads the provider (Replicate) URL.
  void downloadItemImage(event, props.result, 0);
}

function upgrade() {
  dialogStore.showPricing();
}
</script>

<template>
  <div
    role="status"
    data-testid="unsaved-result-notice"
    class="tw-mx-4 tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-rounded-card tw-border tw-border-gold/40 tw-bg-gold/10 tw-px-4 tw-py-3 tw-text-sm tw-text-ink sm:tw-mx-6"
  >
    <p class="tw-m-0 tw-min-w-0 tw-flex-1">
      History full ({{ savedCount }}/{{ cap }}) - this image wasn't saved. Download it within ~1
      hour.
    </p>
    <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      <button
        v-if="!isPro"
        type="button"
        data-testid="unsaved-upgrade"
        class="tw-rounded-chip tw-border tw-border-border tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold"
        @click="upgrade"
      >
        Upgrade to Pro ({{ HISTORY_CAP[PLAN.PRO] }} history)
      </button>
      <button
        type="button"
        data-testid="unsaved-download"
        aria-label="Download image"
        class="tw-rounded-chip tw-bg-accent tw-p-2 tw-text-canvas"
        @click="download"
      >
        <font-awesome-icon icon="fa-solid fa-download" aria-hidden="true" />
      </button>
      <button
        type="button"
        data-testid="unsaved-dismiss"
        aria-label="Dismiss"
        class="tw-rounded-chip tw-p-2 tw-text-ink-muted hover:tw-text-ink"
        @click="emit('dismiss')"
      >
        <font-awesome-icon icon="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
