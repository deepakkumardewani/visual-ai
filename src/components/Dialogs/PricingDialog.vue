<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useDialogStore } from '@/stores/dialog'

import FAQ from '@/components/FAQ.vue'
import Pricing from '@/components/Pricing.vue'

import { PRICING_FAQS } from '@/utils/constants'

const dialogStore = useDialogStore()
const { showPricingDialog } = storeToRefs(dialogStore)
</script>
<template>
  <v-dialog v-model="showPricingDialog" transition="dialog-bottom-transition" fullscreen>
    <v-card>
      <v-toolbar color="transparent">
        <div class="tw-flex tw-items-center tw-justify-between tw-w-full tw-px-4">
          <v-btn icon @click="dialogStore.hidePricing">
            <v-icon>fas fa-close</v-icon>
          </v-btn>
        </div>
      </v-toolbar>

      <v-card-text>
        <div class="tw-text-center tw-font-semibold tw-text-6xl">
          Unlock the Full Power of Visual AI
        </div>

        <Pricing />

        <FAQ :faqs="PRICING_FAQS" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
