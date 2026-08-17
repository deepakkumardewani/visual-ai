<script setup lang="ts">
import { computed } from 'vue';

import { useGenerateStore } from '@/stores/generate';

const props = defineProps<{
  feature: string;
}>();

const generateStore = useGenerateStore();

const message = computed(() => generateStore.errMsg[props.feature] ?? '');
const canRetry = computed(() => Boolean(generateStore.retryByFeature[props.feature]));

function dismiss() {
  generateStore.clearFeatureError(props.feature);
}

async function retry() {
  await generateStore.retryFailed(props.feature);
}
</script>

<template>
  <div
    v-if="message"
    data-testid="generation-error"
    role="alert"
    class="tw-mb-5 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-card tw-border tw-border-red-500/30 tw-bg-red-500/10 tw-px-4 tw-py-3 tw-text-sm tw-text-ink"
  >
    <span class="tw-min-w-0 tw-flex-1">{{ message }}</span>
    <div class="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
      <button
        v-if="canRetry"
        type="button"
        data-testid="generation-error-retry"
        class="tw-rounded-sm tw-border tw-border-hairline tw-bg-surface-2 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-ink hover:tw-border-accent/40 hover:tw-text-accent"
        @click="retry"
      >
        Retry
      </button>
      <button
        type="button"
        class="tw-text-ink-muted hover:tw-text-ink"
        aria-label="Dismiss error"
        @click="dismiss"
      >
        <font-awesome-icon icon="xmark" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
