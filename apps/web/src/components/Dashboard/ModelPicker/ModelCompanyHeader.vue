<script setup lang="ts">
import type { Model } from '@/types/model';
import { computed } from 'vue';

import { getModelLogoUrl } from '@/utils/models';

import ProviderIcon from '@/components/primitives/ProviderIcon.vue';

const props = defineProps<{
  company: string;
  models: Model[];
}>();

const logoUrl = computed(() => getModelLogoUrl(props.models[0]?.iconUrl));
const provider = computed(() => props.models[0]?.provider);
</script>

<template>
  <div
    data-testid="model-company-header"
    class="tw-flex tw-items-center tw-gap-2 tw-sticky tw-top-[var(--picker-tier-header-h)] tw-z-[1] tw-bg-surface-1 tw-px-2 tw-py-1"
  >
    <img
      v-if="logoUrl"
      :src="logoUrl"
      :alt="`${company} logo`"
      class="tw-h-5 tw-w-5 tw-shrink-0 tw-rounded tw-object-contain"
    />
    <ProviderIcon v-else-if="provider" :provider="provider" size="sm" />
    <span
      class="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-text-ink-muted"
      :title="company"
    >
      {{ company }}
    </span>
  </div>
</template>
