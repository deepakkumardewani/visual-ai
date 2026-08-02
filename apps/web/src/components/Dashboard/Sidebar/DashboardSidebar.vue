<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';

import ColorizeImageAside from '@/components/Dashboard/Sidebar/ColorizeImageAside.vue';
import ImageGenerateAside from '@/components/Dashboard/Sidebar/ImageGenerateAside.vue';
import RemoveBgAside from '@/components/Dashboard/Sidebar/RemoveBgAside.vue';
import ReviveOldAside from '@/components/Dashboard/Sidebar/ReviveOldAside.vue';
import UpscaleImageAside from '@/components/Dashboard/Sidebar/UpscaleImageAside.vue';

const appStore = useAppStore();
const { feature } = storeToRefs(appStore);
</script>

<template>
  <nav
    data-testid="dashboard-sidebar"
    class="tw-flex tw-flex-col tw-gap-7 tw-p-4"
    aria-label="Feature settings"
  >
    <ImageGenerateAside v-if="!feature || feature === FeatureType.IMAGE" />
    <UpscaleImageAside v-else-if="feature === FeatureType.UPSCALE" />
    <ColorizeImageAside v-else-if="feature === FeatureType.COLORIZE" />
    <ReviveOldAside v-else-if="feature === FeatureType.REVIVE" />
    <RemoveBgAside v-else-if="feature === FeatureType.REMOVE_BG" />
  </nav>
</template>
