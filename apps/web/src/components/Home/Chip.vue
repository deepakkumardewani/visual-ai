<script setup lang="ts">
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { storeToRefs } from 'pinia';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);

defineProps<{
  text: string;
  icon?: IconDefinition;
}>();
</script>
<template>
  <v-chip v-motion-pop-visible-once class="my-2" :color="isDark ? '#C98A5A' : '#9E7D35'" label>
    <font-awesome-icon v-if="icon" :icon="icon" class="tw-mr-2" />
    {{ text }}
  </v-chip>
</template>
<style scoped lang="scss"></style>
