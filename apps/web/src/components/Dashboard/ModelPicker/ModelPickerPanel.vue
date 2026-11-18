<script setup lang="ts">
import type { Model } from '@/types/model';
import { computed, ref } from 'vue';

import { filterModelsBySearch, groupModelsByCompany } from '@/utils/models';

import ModelCompanyHeader from '@/components/Dashboard/ModelPicker/ModelCompanyHeader.vue';
import ModelOption from '@/components/Dashboard/ModelPicker/ModelOption.vue';
import ModelPickerSearch from '@/components/Dashboard/ModelPicker/ModelPickerSearch.vue';

const props = defineProps<{
  models: Model[];
  selectedModel: Model;
}>();

defineEmits<{
  selectModel: [model: Model];
}>();

// Featured models repeat in their tier section on purpose: Featured is a shortcut, not a bucket.
// The panel is unmounted on close, so the query resets with it.
const query = ref('');
const searchRef = ref<InstanceType<typeof ModelPickerSearch> | null>(null);
const sections = computed(() =>
  groupModelsByCompany(filterModelsBySearch(props.models, query.value)),
);

function clearQuery() {
  query.value = '';
  searchRef.value?.focus();
}

const isSelected = (model: Model) =>
  props.selectedModel.id === model.id && props.selectedModel.title === model.title;
</script>

<template>
  <!--
    Sticky stack: search, then tier header, then company header. ModelCompanyHeader pins to
    --picker-tier-header-h, so that variable is the search + tier height to clear both bars.
  -->
  <div
    class="tw-max-h-[min(24rem,60vh)] tw-w-[min(26rem,calc(100vw-2rem))] tw-overflow-y-auto no-scrollbar [--picker-search-h:2.75rem] [--picker-tier-h:1.75rem] [--picker-tier-header-h:calc(var(--picker-search-h)+var(--picker-tier-h))]"
  >
    <ModelPickerSearch ref="searchRef" v-model="query" />

    <div
      v-if="sections.length === 0"
      data-testid="model-search-empty"
      role="status"
      class="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-px-2 tw-py-8 tw-text-center tw-text-sm tw-text-ink-muted"
    >
      <p>
        No models match
        <span class="tw-break-all tw-font-semibold tw-text-ink"
          >&ldquo;{{ query.trim() }}&rdquo;</span
        >
      </p>
      <button
        type="button"
        data-testid="model-search-empty-clear"
        class="tw-min-h-[44px] tw-rounded-chip tw-px-3 tw-text-sm tw-font-medium tw-text-accent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent"
        @click="clearQuery"
      >
        Clear search
      </button>
    </div>

    <div v-else role="listbox" aria-label="Select a model">
      <section
        v-for="group in sections"
        :key="group.section"
        :data-testid="`model-section-${group.section.toLowerCase()}`"
        class="tw-mb-3 last:tw-mb-0"
      >
        <h3
          class="tw-sticky tw-top-[var(--picker-search-h)] tw-z-[2] tw-flex tw-h-[var(--picker-tier-h)] tw-items-center tw-border-b tw-border-hairline tw-bg-surface-1 tw-px-2 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
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
  </div>
</template>
