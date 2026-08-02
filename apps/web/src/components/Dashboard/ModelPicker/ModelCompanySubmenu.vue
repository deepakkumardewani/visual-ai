<script setup lang="ts">
import type { Model } from '@/types/model';

import ModelOption from '@/components/Dashboard/ModelPicker/ModelOption.vue';

defineProps<{
  companyName: string;
  models: Model[];
  selectedModel: Model;
}>();

defineEmits<{
  selectModel: [model: Model];
}>();
</script>

<template>
  <!-- Transparent tw-pl-2 bridges the gap to the company row, keeping the pointer inside the hover area -->
  <div class="tw-fixed tw-z-50 tw-flex tw-max-h-[inherit] tw-flex-col tw-pl-2">
    <div
      class="tw-flex tw-max-h-[inherit] tw-w-[min(20rem,calc(100vw-2rem))] tw-flex-col tw-overflow-hidden tw-rounded-md tw-border tw-border-hairline tw-bg-surface-1 tw-p-1 tw-shadow-md"
    >
      <h4
        class="tw-mb-1 tw-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-px-2 tw-py-1 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        {{ companyName }} models
      </h4>

      <div class="tw-flex tw-min-h-0 tw-flex-col tw-gap-0.5 tw-overflow-y-auto no-scrollbar">
        <ModelOption
          v-for="model in models"
          :key="`${model.id}-${model.title}`"
          :model="model"
          :selected="selectedModel.id === model.id && selectedModel.title === model.title"
          @select="$emit('selectModel', model)"
        />
      </div>
    </div>
  </div>
</template>

<!-- Note: A11y improvement needed - hover-only interaction is not keyboard-accessible. -->
<!-- Screen reader support and keyboard navigation (arrow keys, Enter) should be added in follow-up. -->
