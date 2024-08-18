<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useDialogStore } from '@/stores/dialog'

const dialogStore = useDialogStore()

const { isRevealed } = storeToRefs(dialogStore)
</script>
<template>
  <v-dialog v-model="isRevealed" width="auto">
    <v-card
      max-width="400"
      prepend-icon="mdi-update"
      text="Your application will relaunch automatically after the update is complete."
      title="Update in progress"
    >
      <template v-slot:actions>
        <v-btn class="ms-auto" text="Ok" @click="dialogStore.cancel"></v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>
