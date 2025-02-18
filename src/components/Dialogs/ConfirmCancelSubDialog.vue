<script setup lang="ts">
// import { ref } from 'vue'
import { storeToRefs } from 'pinia'

import { useDialogStore } from '@/stores/dialog'

import { cancelSubscription } from '@/utils/payment'

const dialogStore = useDialogStore()
const { showCancelSubscriptionDialog } = storeToRefs(dialogStore)

const loading = ref(false)
const handleConfirm = async () => {
  try {
    loading.value = true
    await cancelSubscription()
  } catch (error) {
  } finally {
    loading.value = false
    showCancelSubscriptionDialog.value = false
  }
}
</script>

<template>
  <v-dialog
    v-model="showCancelSubscriptionDialog"
    max-width="500px"
    @click:outside="dialogStore.hideCancelSubscription"
  >
    <v-card class="tw-p-6">
      <v-card-title class="tw-text-center tw-text-xl tw-mb-4">
        <v-icon color="warning" size="small"> fas fa-triangle-exclamation</v-icon>
        Cancel Subscription
      </v-card-title>

      <v-card-text class="tw-text-center tw-mb-6">
        Are you sure you want to cancel your subscription? This action cannot be undone.
      </v-card-text>

      <v-card-actions class="tw-flex tw-justify-center tw-gap-4">
        <v-btn
          color="green"
          variant="outlined"
          :disabled="loading"
          @click="dialogStore.hideCancelSubscription"
        >
          Keep Subscription
        </v-btn>
        <v-btn color="error" :loading="loading" @click="handleConfirm"> Cancel Subscription </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.v-card-actions {
  padding: 16px;
}
</style>
