<script setup lang="ts">
import { useRoute } from 'vue-router'

import { useDialogStore } from '@/stores/dialog'

const route = useRoute()
const dialogStore = useDialogStore()
</script>

<template>
  <v-btn
    v-if="route.path === '/dashboard'"
    size="small"
    variant="outlined"
    color="amber"
    class="tw-border-amber-500"
    @click="dialogStore.showReferralOffer()"
  >
    <v-icon left size="small" class="tw-mr-1">fa-solid fa-gift</v-icon>
    Free Pro
  </v-btn>
</template>

<style scoped></style>
