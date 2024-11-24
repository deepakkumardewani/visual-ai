<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import { applyReferralCode } from '@/utils/helpers'

const userStore = useUserStore()
const dialogStore = useDialogStore()
const { showReferralDialog } = storeToRefs(dialogStore)
const { userDetails } = storeToRefs(userStore)
const referralCode = ref('')
const loading = ref(false)
const errorMessage = ref('')

const isValidCode = computed(() => {
  if (!referralCode.value) {
    return false
  }
  if (referralCode.value.length !== 6) {
    return false
  }
  if (referralCode.value === userDetails.value?.referralCode) {
    return false
  }
  return true
})

const validateCode = () => {
  if (!referralCode.value) {
    errorMessage.value = ''
    return false
  }
  if (referralCode.value.length !== 6) {
    errorMessage.value = 'Referral code must be 6 characters long'
    return false
  }
  if (referralCode.value === userDetails.value?.referralCode) {
    errorMessage.value = 'You cannot use your own referral code'
    return false
  }
  errorMessage.value = ''
  return true
}

const apply = async () => {
  if (!validateCode()) return
  loading.value = true
  try {
    await applyReferralCode(referralCode.value)
  } catch (error: any) {
    console.error('error', error)
    errorMessage.value = error.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-dialog v-model="showReferralDialog" width="400" opacity="0.4" scrim="black">
    <v-card class="pa-4">
      <v-card-title class="text-center text-h5 font-weight-bold mb-4">
        Enter Referral Code
      </v-card-title>

      <v-card-text>
        <v-text-field
          v-model="referralCode"
          label="Referral Code"
          :error-messages="errorMessage"
          :maxlength="6"
          placeholder="Enter 6 character code"
          variant="outlined"
          @input="validateCode"
        ></v-text-field>
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          color="purple-accent-4"
          :loading="loading"
          :disabled="!isValidCode"
          variant="elevated"
          @click="apply"
          class="px-8"
        >
          Apply Now
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
