<script setup lang="ts">
import type { Model } from '@/types/model';
import { computed, nextTick, ref } from 'vue';

import { getModelLogoUrl } from '@/utils/models';

import ModelCompanySubmenu from '@/components/Dashboard/ModelPicker/ModelCompanySubmenu.vue';
import ProviderIcon from '@/components/primitives/ProviderIcon.vue';

const props = defineProps<{
  companyName: string;
  models: Model[];
  selectedModel: Model;
}>();

defineEmits<{
  selectModel: [model: Model];
}>();

const isHovered = ref(false);
const rowRef = ref<HTMLElement | null>(null);
const submenuStyle = ref({ top: '0px', left: '0px' });

const companyLogoUrl = computed(() => getModelLogoUrl(props.models[0]?.iconUrl));
const companyIconProvider = computed(() => props.models[0]?.provider);

async function openSubmenu() {
  isHovered.value = true;
  await nextTick();
  const rect = rowRef.value?.getBoundingClientRect();
  if (!rect) return;
  submenuStyle.value = { top: `${rect.top}px`, left: `${rect.right}px` };
}

function closeSubmenu() {
  isHovered.value = false;
}
</script>

<template>
  <!--
    The submenu is a DOM child of this wrapper, so moving the pointer from the
    row into the submenu never fires mouseleave — no close timer needed.
    It uses position:fixed, which escapes the model list's scroll clipping.
  -->
  <div @mouseenter="openSubmenu" @mouseleave="closeSubmenu">
    <div
      ref="rowRef"
      class="tw-flex tw-items-center tw-gap-2 tw-rounded-chip tw-px-2 tw-py-1.5 tw-transition-colors"
      :class="[isHovered ? 'tw-bg-surface-2' : '']"
    >
      <img
        v-if="companyLogoUrl"
        :src="companyLogoUrl"
        :alt="`${companyName} logo`"
        class="tw-h-6 tw-w-6 tw-shrink-0 tw-rounded tw-object-contain"
      />
      <ProviderIcon v-else-if="companyIconProvider" :provider="companyIconProvider" size="sm" />

      <span class="tw-flex-1 tw-text-sm tw-font-medium tw-text-ink">{{ companyName }}</span>

      <span aria-hidden="true" class="tw-text-ink-muted">›</span>
    </div>

    <ModelCompanySubmenu
      v-if="isHovered"
      :style="submenuStyle"
      :company-name="companyName"
      :models="models"
      :selected-model="selectedModel"
      @select-model="$emit('selectModel', $event)"
    />
  </div>
</template>
