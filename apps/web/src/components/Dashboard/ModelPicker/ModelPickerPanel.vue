<script setup lang="ts">
import type { Model } from '@/types/model';
import { PREMIUM_MODEL_KEYS, type ModelKey } from '@visual-ai/shared';
import { computed } from 'vue';

import ModelOption from '@/components/Dashboard/ModelPicker/ModelOption.vue';

const props = defineProps<{
  models: Model[];
  selectedModel: Model;
}>();

defineEmits<{
  selectModel: [model: Model];
}>();

const isPremium = (model: Model) => PREMIUM_MODEL_KEYS.includes(model.id as ModelKey);

// Featured models repeat in their tier section on purpose: Featured is a shortcut, not a bucket.
const sections = computed(() =>
  [
    { title: 'Featured', models: props.models.filter((m) => m.featured) },
    { title: 'Free', models: props.models.filter((m) => !isPremium(m)) },
    { title: 'Pro', models: props.models.filter(isPremium) },
  ].filter((section) => section.models.length > 0),
);
</script>

<template>
  <div
    role="listbox"
    aria-label="Select a model"
    class="tw-max-h-[min(24rem,60vh)] tw-w-[min(26rem,calc(100vw-2rem))] tw-overflow-y-auto no-scrollbar"
  >
    <section
      v-for="section in sections"
      :key="section.title"
      :data-testid="`model-section-${section.title.toLowerCase()}`"
      class="tw-mb-3 last:tw-mb-0"
    >
      <h3
        class="tw-mb-1 tw-px-2 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
      >
        {{ section.title }}
      </h3>
      <div class="tw-flex tw-flex-col tw-gap-0.5">
        <ModelOption
          v-for="model in section.models"
          :key="`${model.id}-${model.title}`"
          :model="model"
          :selected="selectedModel.id === model.id && selectedModel.title === model.title"
          @select="$emit('selectModel', model)"
        />
      </div>
    </section>
  </div>
</template>
