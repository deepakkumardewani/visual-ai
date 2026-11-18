<script setup lang="ts">
import type { Model } from '@/types/model';
import { computed } from 'vue';

import { groupModelsByCompany } from '@/utils/models';

import ModelCompanyHeader from '@/components/Dashboard/ModelPicker/ModelCompanyHeader.vue';
import ModelOption from '@/components/Dashboard/ModelPicker/ModelOption.vue';

const props = defineProps<{
  models: Model[];
  selectedModel: Model;
}>();

defineEmits<{
  selectModel: [model: Model];
}>();

// Featured models repeat in their tier section on purpose: Featured is a shortcut, not a bucket.
const sections = computed(() => groupModelsByCompany(props.models));

const isSelected = (model: Model) =>
  props.selectedModel.id === model.id && props.selectedModel.title === model.title;
</script>

<template>
  <div
    role="listbox"
    aria-label="Select a model"
    class="tw-max-h-[min(24rem,60vh)] tw-w-[min(26rem,calc(100vw-2rem))] tw-overflow-y-auto no-scrollbar [--picker-tier-header-h:1.75rem]"
  >
    <section
      v-for="group in sections"
      :key="group.section"
      :data-testid="`model-section-${group.section.toLowerCase()}`"
      class="tw-mb-3 last:tw-mb-0"
    >
      <h3
        class="tw-sticky tw-top-0 tw-z-[2] tw-flex tw-h-[var(--picker-tier-header-h)] tw-items-center tw-border-b tw-border-hairline tw-bg-surface-1 tw-px-2 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        {{ group.section }}
      </h3>

      <div v-if="'models' in group" class="tw-flex tw-flex-col tw-gap-0.5">
        <ModelOption
          v-for="model in group.models"
          :key="`${group.section}-${model.id}-${model.title}`"
          :model="model"
          :selected="isSelected(model)"
          @select="$emit('selectModel', model)"
        />
      </div>

      <template v-else>
        <div
          v-for="companyGroup in group.companies"
          :key="`${group.section}-${companyGroup.company}`"
        >
          <ModelCompanyHeader :company="companyGroup.company" :models="companyGroup.models" />
          <div class="tw-flex tw-flex-col tw-gap-0.5">
            <ModelOption
              v-for="model in companyGroup.models"
              :key="`${group.section}-${model.id}-${model.title}`"
              :model="model"
              :selected="isSelected(model)"
              @select="$emit('selectModel', model)"
            />
          </div>
        </div>
      </template>
    </section>
  </div>
</template>
