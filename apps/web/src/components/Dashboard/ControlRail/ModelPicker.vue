<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import type { Model } from "@/types/model";

import { useAsideStore } from "@/stores/aside";
import { useUserStore } from "@/stores/user";

import Heading from "@/components/Aside/Heading.vue";
import ModelChip from "@/components/Dashboard/Composer/ModelChip.vue";
import ModelOption from "@/components/Dashboard/ControlRail/ModelOption.vue";
import ModelPickerTrigger from "@/components/Dashboard/ControlRail/ModelPickerTrigger.vue";
import Popover from "@/components/primitives/Popover.vue";

const { chip = false } = defineProps<{
  chip?: boolean;
}>();

import { MODEL_IDS } from "@/utils/modelIds";
import { FLUX_MODES, getProviderDisplayName, groupModelsByProvider, MODELS } from "@/utils/models";

const router = useRouter();
const asideStore = useAsideStore();
const userStore = useUserStore();

const { isPro } = storeToRefs(userStore);
const { mode, noOfOutputs } = storeToRefs(asideStore);

const groupedModels = computed(() => groupModelsByProvider(MODELS));
const isOpen = ref(false);

function isSelected(model: Model): boolean {
  return mode.value.id === model.id && mode.value.title === model.title;
}

function handleSelect(model: Model) {
  if (!isPro.value && model.isPro) {
    mode.value = FLUX_MODES[1];
    isOpen.value = false;
    router.push("/pricing");
    return;
  }

  mode.value = model;

  if (model.id === MODEL_IDS.FLUX_PRO || model.id === MODEL_IDS.FLUX_1_1_PRO) {
    noOfOutputs.value = 1;
  }

  isOpen.value = false;
}
</script>

<template>
  <div data-testid="model-picker">
    <Heading v-if="!chip" title="Model" />

    <Popover v-model:open="isOpen" placement="bottom-start">
      <template #trigger="{ open }">
        <ModelChip v-if="chip" :model="mode" :open="open" />
        <ModelPickerTrigger v-else :model="mode" :open="open" />
      </template>

      <div
        role="listbox"
        aria-label="Select a model"
        class="tw-max-h-[min(24rem,60vh)] tw-w-[min(22rem,calc(100vw-2rem))] tw-overflow-y-auto"
      >
        <section
          v-for="[provider, models] in groupedModels"
          :key="provider"
          class="tw-mb-3 last:tw-mb-0"
        >
          <h3
            class="tw-mb-1 tw-px-2 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-muted"
          >
            {{ getProviderDisplayName(provider) }}
          </h3>

          <div class="tw-flex tw-flex-col tw-gap-0.5">
            <ModelOption
              v-for="model in models"
              :key="`${model.id}-${model.title}`"
              :model="model"
              :selected="isSelected(model)"
              @select="handleSelect(model)"
            />
          </div>

          <div
            v-if="provider === 'bfl' && models.some((m) => m.id === MODEL_IDS.FLUX_PRO)"
            class="tw-my-2 tw-border-t tw-border-hairline"
            role="separator"
          />
        </section>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
:deep(.tw-relative.tw-inline-block) {
  display: block;
  width: 100%;
}

:deep(.tw-relative.tw-inline-block > button) {
  width: 100%;
  min-height: 44px;
  justify-content: flex-start;
}
</style>
