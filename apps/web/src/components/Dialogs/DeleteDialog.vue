<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import AppModal from '@/components/AppModal.vue';

import { useFetch } from '@/composables/useFetch';

const userStore = useUserStore();
const { userId } = storeToRefs(userStore);
const router = useRouter();
const dialogStore = useDialogStore();
const { showDeleteDialog } = storeToRefs(dialogStore);

const agree = ref(false);
const loading = ref(false);

async function deleteAccount() {
  if (!agree.value) return;
  loading.value = true;
  try {
    const { error, data } = await useFetch(`/api/users/${userId.value}`, {
      method: 'DELETE',
      headers: {
        mode: 'cors',
      },
    });
    if (data) {
      dialogStore.hideDelete();
      router.push('/');
    }
    if (error) {
      console.error(error);
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppModal
    :open="showDeleteDialog"
    max-width="34rem"
    labelled-by="delete-account-title"
    @close="dialogStore.hideDelete"
  >
    <template #title>
      <span id="delete-account-title" class="delete__warn">Delete account</span>
    </template>

    <div class="delete__body">
      <p class="delete__lead">You're about to delete your account. This action is irreversible.</p>
      <p class="delete__copy">
        Deleting your account will permanently remove all of your information from our systems. This
        includes any AI-generated creations.
      </p>

      <label class="delete__check">
        <input v-model="agree" type="checkbox" class="delete__checkbox" />
        <span>I understand that deleting my account is permanent and irreversible.</span>
      </label>
    </div>

    <template #actions>
      <button type="button" class="modal-btn modal-btn--ghost" @click="dialogStore.hideDelete">
        No, go back
      </button>
      <button
        type="button"
        class="modal-btn modal-btn--danger"
        :disabled="!agree || loading"
        @click="deleteAccount"
      >
        {{ loading ? 'Deleting…' : 'Yes, delete account' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.delete__warn {
  color: #e08585;
}

:global(html:not(.tw-dark)) .delete__warn {
  color: #b03c3c;
}

.delete__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.delete__lead {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.delete__copy {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}

.delete__check {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-top: 0.35rem;
  font-size: 0.9rem;
  line-height: 1.45;
  color: rgb(var(--tw-ink-primary));
  cursor: pointer;
}

.delete__checkbox {
  margin-top: 0.2rem;
  width: 1.05rem;
  height: 1.05rem;
  accent-color: #c9a84c;
  flex-shrink: 0;
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
    opacity: 0.45;
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
