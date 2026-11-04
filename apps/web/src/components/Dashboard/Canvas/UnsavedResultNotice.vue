<script setup lang="ts">
import { storeToRefs } from 'pinia';

import type { IImageObject } from '@/types';
import { HISTORY_CAP, PLAN } from '@visual-ai/shared';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import { downloadItemImage } from '@/utils/helpers';

const props = defineProps<{
  result: IImageObject;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

const GRID_TEST_ID = 'user-generations-grid';

const dialogStore = useDialogStore();
const { isPro } = storeToRefs(useUserStore());

function download(event: Event) {
  // The result has no stored copy, so this downloads the provider (Replicate) URL.
  void downloadItemImage(event, props.result, 0);
}

function upgrade() {
  dialogStore.showPricing();
}

function showHistory() {
  document.querySelector(`[data-testid="${GRID_TEST_ID}"]`)?.scrollIntoView({ behavior: 'smooth' });
}
</script>

<template>
  <div
    role="status"
    data-testid="unsaved-result-notice"
    class="tw-mx-4 tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-rounded-card tw-border tw-border-gold/40 tw-bg-gold/10 tw-px-4 tw-py-3 tw-text-sm tw-text-ink sm:tw-mx-6"
  >
    <p class="tw-m-0 tw-min-w-0 tw-flex-1">
      Not saved to history. This link expires in about 1 hour, download it now.
    </p>
    <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      <button
        type="button"
        data-testid="unsaved-download"
        class="tw-rounded-chip tw-bg-accent tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-canvas"
        @click="download"
      >
        Download
      </button>
      <button
        v-if="isPro"
        type="button"
        data-testid="unsaved-free-space"
        class="tw-rounded-chip tw-border tw-border-border tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold"
        @click="showHistory"
      >
        Delete images to free space
      </button>
      <button
        v-else
        type="button"
        data-testid="unsaved-upgrade"
        class="tw-rounded-chip tw-border tw-border-border tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold"
        @click="upgrade"
      >
        Upgrade to Pro ({{ HISTORY_CAP[PLAN.PRO] }} history)
      </button>
      <button
        type="button"
        data-testid="unsaved-dismiss"
        aria-label="Dismiss notice"
        class="tw-rounded-chip tw-px-2 tw-py-1.5 tw-text-xs tw-text-ink-muted"
        @click="emit('dismiss')"
      >
        Dismiss
      </button>
    </div>
  </div>
</template>
