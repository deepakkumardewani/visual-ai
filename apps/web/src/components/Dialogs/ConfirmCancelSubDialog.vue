<script setup lang="ts">
import { ref } from 'vue';

import { useDialogStore } from '@/stores/dialog';

import AppModal from '@/components/AppModal.vue';

import { cancelSubscription } from '@/utils/payment';

const dialogStore = useDialogStore();
const loading = ref(false);

async function handleConfirm() {
  try {
    loading.value = true;
    await cancelSubscription();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
    dialogStore.hideCancelSubscription();
  }
}
</script>

<template>
  <AppModal
    :open="dialogStore.showCancelSubscriptionDialog"
    max-width="28rem"
    labelled-by="cancel-sub-title"
    described-by="cancel-sub-desc"
    @close="dialogStore.hideCancelSubscription"
  >
    <template #title>
      <span id="cancel-sub-title">Cancel subscription</span>
    </template>

    <p id="cancel-sub-desc" class="cancel-sub__copy">
      Are you sure you want to cancel your subscription? This action cannot be undone.
    </p>

    <template #actions>
      <button
        type="button"
        class="modal-btn modal-btn--ghost"
        :disabled="loading"
        @click="dialogStore.hideCancelSubscription"
      >
        Keep subscription
      </button>
      <button
        type="button"
        class="modal-btn modal-btn--danger"
        :disabled="loading"
        @click="handleConfirm"
      >
        {{ loading ? 'Cancelling…' : 'Cancel subscription' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.cancel-sub__copy {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}

.modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.55rem 1.15rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    opacity 150ms ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.modal-btn--ghost {
  border-color: rgb(var(--tw-border));
  background: transparent;
  color: rgb(var(--tw-ink-primary));

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-2));
  }
}

.modal-btn--danger {
  border-color: rgba(176, 60, 60, 0.45);
  background: rgba(176, 60, 60, 0.12);
  color: #e08585;

  &:hover:not(:disabled) {
    background: rgba(176, 60, 60, 0.2);
  }
}

:global(html:not(.tw-dark)) .modal-btn--danger {
  color: #b03c3c;
}
</style>
