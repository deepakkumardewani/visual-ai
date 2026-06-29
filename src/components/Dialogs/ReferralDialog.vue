<script setup lang="ts">
import { faGift, faTicket } from "@/plugins/icons";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

import { useDialogStore } from "@/stores/dialog";
import { useUserStore } from "@/stores/user";

import { applyReferralCode } from "@/utils/helpers";

const userStore = useUserStore();
const dialogStore = useDialogStore();
const { showReferralDialog } = storeToRefs(dialogStore);
const { userDetails } = storeToRefs(userStore);
const referralCode = ref("");
const loading = ref(false);
const errorMessage = ref("");

const isValidCode = computed(() => {
  if (!referralCode.value) {
    return false;
  }
  if (referralCode.value.length !== 6) {
    return false;
  }
  if (referralCode.value === userDetails.value?.referralCode) {
    return false;
  }
  return true;
});

const validateCode = () => {
  if (!referralCode.value) {
    errorMessage.value = "";
    return false;
  }
  if (referralCode.value.length !== 6) {
    errorMessage.value = "Referral code must be 6 characters long";
    return false;
  }
  if (referralCode.value === userDetails.value?.referralCode) {
    errorMessage.value = "You cannot use your own referral code";
    return false;
  }
  errorMessage.value = "";
  return true;
};

const apply = async () => {
  if (!validateCode()) return;
  loading.value = true;
  try {
    await applyReferralCode(referralCode.value);
  } catch (error: any) {
    console.error("error", error);
    errorMessage.value = error.message || "Something went wrong";
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  showReferralDialog.value = false;
  referralCode.value = "";
  errorMessage.value = "";
};
</script>

<template>
  <v-dialog
    v-model="showReferralDialog"
    width="400"
    transition="dialog-bottom-transition"
    :scrim="true"
    class="rounded-lg"
  >
    <v-card class="pa-4 rounded-lg" elevation="8">
      <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <v-card-title class="tw-text-h5 tw-font-bold pa-0">
          <font-awesome-icon :icon="faGift" color="purple-accent-4" class="mr-2" />
          Enter Referral Code
        </v-card-title>
        <v-btn
          icon="fas fa-times"
          variant="text"
          size="small"
          @click="closeDialog"
          class="tw-transition-all hover:tw-rotate-90"
        />
      </div>

      <v-card-text class="pa-0 mt-2">
        <p class="text-body-2 text-grey-darken-1 mb-4">
          Enter a valid referral code to receive your bonus credits!
        </p>
        <v-text-field
          v-model="referralCode"
          label="Referral Code"
          :error-messages="errorMessage"
          :maxlength="6"
          placeholder="Enter 6 character code"
          variant="outlined"
          class="rounded-lg"
          :loading="loading"
          @input="validateCode"
        >
          <template #prepend-inner>
            <font-awesome-icon :icon="faTicket" color="grey-darken-1" />
          </template>
        </v-text-field>
      </v-card-text>

      <v-card-actions class="pa-0 mt-4">
        <v-btn
          block
          color="purple-accent-4"
          :loading="loading"
          :disabled="!isValidCode"
          variant="elevated"
          height="48"
          @click="apply"
          class="text-body-1 font-weight-bold"
        >
          Apply Code
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
