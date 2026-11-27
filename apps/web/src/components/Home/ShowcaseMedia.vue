<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';

import { DESKTOP_QUERY } from '@/components/Home/composables/useSceneMotion';
import ShowcaseDialog from '@/components/Home/ShowcaseDialog.vue';
import ShowcaseRail from '@/components/Home/ShowcaseRail.vue';
import ShowcaseRows from '@/components/Home/ShowcaseRows.vue';
import type { ShowcaseMediaProps } from '@/components/Home/showcaseLayout';
import { useShowcaseLightbox } from '@/components/Home/useShowcaseLightbox';

const props = defineProps<ShowcaseMediaProps>();

const isDesktop = useMediaQuery(DESKTOP_QUERY);
const lightbox = useShowcaseLightbox(() => props.items.length);
const openItem = computed(() =>
  lightbox.openIndex.value === null ? null : (props.items[lightbox.openIndex.value] ?? null),
);
</script>

<!-- The default DOM media layer: drifting rows on desktop, a swipe rail below 900px. -->
<template>
  <ShowcaseRows v-if="isDesktop" :items="items" :get-progress="getProgress" @open="lightbox.open" />
  <ShowcaseRail v-else :items="items" @open="lightbox.open" />
  <ShowcaseDialog
    :item="openItem"
    :index="lightbox.openIndex.value ?? 0"
    :total="items.length"
    @close="lightbox.close"
    @next="lightbox.next"
    @prev="lightbox.prev"
  />
</template>
