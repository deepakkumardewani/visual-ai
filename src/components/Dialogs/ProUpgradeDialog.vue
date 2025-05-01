<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useDialogStore } from '@/stores/dialog'

const dialogStore = useDialogStore()
const { showProUpgradeDialog } = storeToRefs(dialogStore)
</script>

<template>
  <v-dialog v-model="showProUpgradeDialog" max-width="500">
    <v-card class="tw-p-6">
      <v-card-title class="text-h5 tw-mb-4">🎉 Welcome to Pro!</v-card-title>
      <v-card-text>
        <p class="tw-text-lg">
          Congratulations on upgrading to Pro! You now have access to all premium features.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialogStore.hideProUpgrade">Got it!</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
