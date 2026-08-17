<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import type { Model } from '@/types/model';

import { useUserStore } from '@/stores/user';

import ModelOption from '@/components/Dashboard/ModelPicker/ModelOption.vue';
import ModelPickerTrigger from '@/components/Dashboard/ModelPicker/ModelPickerTrigger.vue';
import Popover from '@/components/primitives/Popover.vue';

const props = defineProps<{
  models: Model[];
  selected: Model;
  fallback: Model;
}>();

const emit = defineEmits<{
  'update:selected': [model: Model];
}>();

const router = useRouter();
const userStore = useUserStore();
const { isPro } = storeToRefs(userStore);

const isOpen = ref(false);

function handleSelect(model: Model) {
  if (!isPro.value && model.isPro) {
    emit('update:selected', props.fallback);
    isOpen.value = false;
    router.push('/pricing');
    return;
  }

  emit('update:selected', model);
  isOpen.value = false;
}
</script>

<template>
  <div data-testid="upscale-model-picker">
    <Popover v-model:open="isOpen" placement="bottom-start">
      <template #trigger="{ open }">
        <ModelPickerTrigger :model="props.selected" :open="open" />
      </template>

      <div
        role="listbox"
        aria-label="Upscale models"
        class="tw-flex tw-max-h-80 tw-w-[min(22rem,calc(100vw-2rem))] tw-flex-col tw-gap-0.5 tw-overflow-y-auto"
      >
        <ModelOption
          v-for="model in props.models"
          :key="model.id"
          :model="model"
          :selected="model.id === props.selected.id"
          @select="handleSelect(model)"
        />
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
