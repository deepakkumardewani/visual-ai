<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { credits } = storeToRefs(userStore)
const dialogStore = useDialogStore()
</script>
<template>
  <v-menu open-on-hover location="bottom end" offset="5">
    <template v-slot:activator="{ props }">
      <div
        v-bind="props"
        class="tw-flex tw-items-center tw-p-4 tw-gap-3 tw-h-8 tw-justify-center tw-border-2 tw-border-purple-900 tw-rounded-full"
      >
        <div>
          <v-icon size="x-small" icon="$coin" />
        </div>
        <div class="tw-font-bold">{{ credits }}</div>
      </div>
    </template>
    <v-card class="pa-3 text-center tw-text-sm">
      <div>
        <span class="tw-font-bold">{{ credits }}</span> images left for today
      </div>
      <div>
        <span
          @click="dialogStore.reveal"
          class="tw-text-yellow-500 tw-underline hover:tw-text-decoration-none tw-cursor-pointer"
          >Subscribe to Pro</span
        >
        for more
      </div>
    </v-card>
  </v-menu>
</template>

<style scoped></style>
