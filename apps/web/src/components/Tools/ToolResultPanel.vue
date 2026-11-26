<script setup lang="ts">
import type { MediaJobState } from '@/composables/useMediaJob';

import JobProgress from '@/components/Studio/JobProgress.vue';
import StudioEmptyState from '@/components/Studio/StudioEmptyState.vue';
import StudioErrorState from '@/components/Studio/StudioErrorState.vue';

defineProps<{
  state: MediaJobState;
  emptyTitle: string;
  emptyDescription: string;
}>();

const emit = defineEmits<{ retry: []; dismiss: [] }>();
</script>

<template>
  <JobProgress
    v-if="state.phase === 'queued' || state.phase === 'submitting'"
    stage="queued"
    :elapsed-ms="0"
  />
  <JobProgress
    v-else-if="state.phase === 'running'"
    :stage="state.stage"
    :elapsed-ms="state.elapsedMs"
  />
  <slot v-else-if="state.phase === 'succeeded'" :asset="state.asset" />
  <StudioErrorState
    v-else-if="state.phase === 'failed'"
    :message="state.message"
    :no-charge="state.noCharge"
    @action="emit('retry')"
  />
  <StudioErrorState
    v-else-if="state.phase === 'rejected'"
    :message="state.message"
    action-label="Dismiss"
    @action="emit('dismiss')"
  />
  <StudioEmptyState v-else :title="emptyTitle" :description="emptyDescription" />
</template>
