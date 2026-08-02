<script setup lang="ts">
import type { Model } from '@/types/model';
import { computed } from 'vue';

import { groupModelsByCompany } from '@/utils/models';

import ModelCompanyGroup from '@/components/Dashboard/ModelPicker/ModelCompanyGroup.vue';
import ModelOption from '@/components/Dashboard/ModelPicker/ModelOption.vue';

const props = defineProps<{
  models: Model[];
  selectedModel: Model;
}>();

defineEmits<{
  selectModel: [model: Model];
}>();

const groupedModels = computed(() => groupModelsByCompany(props.models));

const featuredModels = computed(() => groupedModels.value.get('Featured') ?? []);

const companyGroups = computed(() =>
  [...groupedModels.value].filter(([companyName]) => companyName !== 'Featured'),
);
</script>

<template>
  <div
    role="listbox"
    aria-label="Select a model"
    class="tw-max-h-[min(24rem,60vh)] tw-w-[min(22rem,calc(100vw-2rem))] tw-overflow-y-auto no-scrollbar"
  >
    <div v-if="featuredModels.length" class="tw-mb-3">
      <h3
        class="tw-mb-1 tw-px-2 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        Featured
      </h3>
      <div class="tw-flex tw-flex-col tw-gap-0.5">
        <ModelOption
          v-for="model in featuredModels"
          :key="`${model.id}-${model.title}`"
          :model="model"
          :selected="selectedModel.id === model.id && selectedModel.title === model.title"
          @select="$emit('selectModel', model)"
        />
      </div>
    </div>

    <div v-if="companyGroups.length">
      <h3
        class="tw-mb-1 tw-px-2 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        All Models
      </h3>
      <div class="tw-flex tw-flex-col tw-gap-0.5">
        <ModelCompanyGroup
          v-for="[companyName, models] in companyGroups"
          :key="companyName"
          :company-name="companyName"
          :models="models"
          :selected-model="selectedModel"
          @select-model="$emit('selectModel', $event)"
        />
      </div>
    </div>
  </div>
</template>
