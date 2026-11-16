<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';

import { DESKTOP_QUERY } from '@/components/LandingV2/composables/useSceneMotion';
import ShowcaseRail from '@/components/LandingV2/ShowcaseRail.vue';
import ShowcaseRows from '@/components/LandingV2/ShowcaseRows.vue';
import type { ShowcaseMediaProps } from '@/components/LandingV2/showcaseLayout';

defineProps<ShowcaseMediaProps>();

const isDesktop = useMediaQuery(DESKTOP_QUERY);
</script>

<!-- The default DOM media layer: drifting rows on desktop, a swipe rail below 900px. -->
<template>
  <ShowcaseRows v-if="isDesktop" :items="items" :get-progress="getProgress" />
  <ShowcaseRail v-else :items="items" />
</template>
