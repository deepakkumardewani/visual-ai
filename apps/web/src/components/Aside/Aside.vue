<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';

import AIImageAside from '@/components/Aside/AIImageAside.vue';
import ColorizeImageAside from '@/components/Aside/ColorizeImageAside.vue';
import ReviveOldAside from '@/components/Aside/ReviveOldAside.vue';
import UpscaleImageAside from '@/components/Aside/UpscaleImageAside.vue';
import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';

const appStore = useAppStore();
const { feature } = storeToRefs(appStore);
</script>
<template>
  <div
    class="pa-3 dark:tw-bg-[#170220] tw-bg-[#efebf3] tw-rounded tw-h-full tw-overflow-y-auto no-scrollbar"
  >
    <AIImageAside v-if="feature === FeatureType.IMAGE" />
    <UpscaleImageAside v-if="feature === 'upscale'" />
    <ReviveOldAside v-if="feature === 'revive'" />
    <ColorizeImageAside v-if="feature === 'colorize'" />

    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </div>
</template>

<style scoped lang="scss"></style>
