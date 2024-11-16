<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { useDialogStore } from '@/stores/dialog'
import { PADDLE_PRODUCTS, openPaddleCheckout } from '@/utils/helpers'

const dialogStore = useDialogStore()
const { showBuyCreditsDialog } = storeToRefs(dialogStore)

const loading = ref(false)
const price = ref(0)
const packages = ref(PADDLE_PRODUCTS)

const currentPackageIndex = ref(0)
const currentPackage = computed(() => packages.value[currentPackageIndex.value])

watch(price, (newVal) => {
  currentPackageIndex.value = newVal - 1
})

const getTrackColor = (index: number) => {
  return index <= currentPackageIndex.value ? 'purple-accent-4' : 'grey'
}

const handlePurchase = async () => {
  loading.value = true
  try {
    await openPaddleCheckout(currentPackage.value.priceId)
  } catch (error) {
    console.error('Purchase failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-dialog v-model="showBuyCreditsDialog" width="600" opacity="0.7" scrim="black">
    <v-card class="tw-rounded-xl">
      <div class="tw-text-2xl tw-font-bold tw-p-6">Buy More Credits</div>
      <v-divider></v-divider>

      <div class="tw-p-6">
        <div class="tw-flex tw-justify-between tw-items-center tw-mb-8">
          <div class="tw-flex tw-items-center tw-gap-3">
            <v-icon size="40" icon="$coin" class="tw-text-purple-accent-4" />
            <div class="tw-flex tw-flex-col">
              <div class="tw-text-4xl tw-font-bold tw-text-purple-accent-4">
                {{ currentPackage.coins }}
              </div>
              <div class="tw-text-gray-500 tw-text-sm">Credits</div>
            </div>
          </div>
          <div class="tw-flex tw-flex-col tw-items-end">
            <div class="tw-text-3xl tw-font-bold">${{ currentPackage.price }}</div>
            <div v-if="currentPackage.savings" class="tw-text-green-500 tw-text-sm">
              Save {{ currentPackage.savings }}
            </div>
          </div>
        </div>

        <v-slider
          v-model="price"
          min="1"
          max="4"
          step="1"
          color="purple-accent-4"
          :track-color="getTrackColor"
          show-ticks="always"
          :ticks="{ 1: '200', 2: '450', 3: '960', 4: '2000' }"
        ></v-slider>

        <v-btn
          color="purple-accent-4"
          size="large"
          block
          class="tw-mt-6"
          elevation="0"
          :loading="loading"
          @click="handlePurchase"
        >
          Purchase Now
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
:deep(.v-slider .v-slider-track__fill) {
  background: linear-gradient(90deg, #9c27b0 0%, #aa00ff 100%);
}

:deep(.v-slider .v-slider-thumb__surface) {
  border: 3px solid #9c27b0;
}
</style>
