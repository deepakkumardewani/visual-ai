<script setup>
import { useDialogStore } from '@/stores/dialog'

const dialogStore = useDialogStore()
const { showLowCreditsDialog } = storeToRefs(dialogStore)
</script>
<template>
  <v-dialog v-model="showLowCreditsDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h5">Low Credits</v-card-title>
      <v-card-text> You're low on credits. Please buy more to continue generating. </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="showLowCreditsDialog = false">Close</v-btn>
        <v-btn color="primary">Buy Credits</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
