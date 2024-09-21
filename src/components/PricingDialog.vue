<script setup lang="ts">
import { storeToRefs } from 'pinia'

import FAQ from '@/components/FAQ.vue'
import Pricing from '@/components/Pricing.vue'
import { useDialogStore } from '@/stores/dialog'
import { PRICING_FAQS } from '@/utils/constants'

const dialogStore = useDialogStore()
const { isRevealed } = storeToRefs(dialogStore)
</script>
<template>
  <v-dialog v-model="isRevealed" transition="dialog-bottom-transition" fullscreen>
    <v-card>
      <v-toolbar color="transparent">
        <v-btn icon @click="dialogStore.cancel">
          <v-icon>fas fa-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text>
        <div class="d-flex text-center justify-center align-center tw-font-semibold text-h2">
          Unlock the Full Power of Visual AI
        </div>

        <Pricing />

        <FAQ :faqs="PRICING_FAQS" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
