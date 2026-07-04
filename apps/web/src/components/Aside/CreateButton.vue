<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);

defineProps<{
  disabled: boolean;
}>();
</script>
<template>
  <v-btn :disabled="disabled" :color="isDark ? '#C98A5A' : '#C9A84C'" block dark>Create</v-btn>
</template>
