<script setup lang="ts">
import { faGift, faTicket } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import AppModal from '@/components/AppModal.vue';

import { applyReferralCode } from '@/utils/helpers';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const { showReferralDialog } = storeToRefs(dialogStore);
const { userDetails } = storeToRefs(userStore);
const referralCode = ref('');
const loading = ref(false);
const errorMessage = ref('');

const isValidCode = computed(() => {
  if (!referralCode.value) return false;
  if (referralCode.value.length !== 6) return false;
  if (referralCode.value === userDetails.value?.referralCode) return false;
  return true;
});

function validateCode() {
  if (!referralCode.value) {
    errorMessage.value = '';
    return false;
  }
  if (referralCode.value.length !== 6) {
    errorMessage.value = 'Referral code must be 6 characters long';
    return false;
  }
  if (referralCode.value === userDetails.value?.referralCode) {
    errorMessage.value = 'You cannot use your own referral code';
    return false;
  }
  errorMessage.value = '';
  return true;
}

async function apply() {
  if (!validateCode()) return;
  loading.value = true;
  try {
    await applyReferralCode(referralCode.value);
  } catch (error: unknown) {
    console.error('error', error);
    errorMessage.value = error instanceof Error ? error.message : 'Something went wrong';
  } finally {
    loading.value = false;
  }
}

function closeDialog() {
  dialogStore.hideReferral();
  referralCode.value = '';
  errorMessage.value = '';
}
</script>

<template>
  <AppModal
    :open="showReferralDialog"
    max-width="26rem"
    labelled-by="referral-dialog-title"
    @close="closeDialog"
  >
    <template #title>
      <span id="referral-dialog-title" class="ref__title">
        <font-awesome-icon :icon="faGift" class="ref__icon" aria-hidden="true" />
        Enter referral code
      </span>
    </template>

    <div class="ref">
      <p class="ref__copy">Enter a valid referral code to receive your bonus credits.</p>

      <label class="field">
        <span class="field__label">Referral code</span>
        <span class="field__control">
          <font-awesome-icon :icon="faTicket" class="field__icon" aria-hidden="true" />
          <input
            v-model="referralCode"
            class="field__input"
            type="text"
            maxlength="6"
            placeholder="6-character code"
            autocomplete="off"
            :disabled="loading"
            @input="validateCode"
          />
        </span>
        <span v-if="errorMessage" class="field__error" role="alert">{{ errorMessage }}</span>
      </label>
    </div>

    <template #actions>
      <button
        type="button"
        class="modal-btn modal-btn--primary"
        :disabled="!isValidCode || loading"
        @click="apply"
      >
        {{ loading ? 'Applying…' : 'Apply code' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.ref__title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.ref__icon {
  color: #c9a84c;
}

.ref__copy {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: rgb(var(--tw-ink-muted));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field__label {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgb(var(--tw-ink-muted));
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
}

.field__icon {
  position: absolute;
  left: 0.85rem;
  color: rgb(var(--tw-ink-muted));
  pointer-events: none;
}

.field__input {
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 0.85rem 0.65rem 2.4rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 10px;
  background: rgb(var(--tw-surface-2) / 0.65);
  color: rgb(var(--tw-ink-primary));
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &:focus {
    outline: none;
    border-color: rgba(201, 168, 76, 0.55);
    box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
  }
}

.field__error {
  font-size: 0.8rem;
  color: #e08585;
}

.modal-btn {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.55rem 1.25rem;
  border: 0;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.modal-btn--primary {
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;
}
</style>
