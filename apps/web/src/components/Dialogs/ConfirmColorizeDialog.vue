<script setup lang="ts">
import AppModal from '@/components/AppModal.vue';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <AppModal
    :open="open"
    max-width="28rem"
    labelled-by="colorize-confirm-title"
    described-by="colorize-confirm-desc"
    @close="emit('close')"
  >
    <template #title>
      <span id="colorize-confirm-title">Already looks colored</span>
    </template>

    <p id="colorize-confirm-desc" class="colorize-confirm__copy">
      This image already looks colored. Colorize anyway? It still uses credits.
    </p>

    <template #actions>
      <button type="button" class="modal-btn modal-btn--ghost" @click="emit('close')">
        Cancel
      </button>
      <button type="button" class="modal-btn modal-btn--primary" @click="emit('confirm')">
        Continue
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.colorize-confirm__copy {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}

.modal-btn {
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition:
    filter 150ms ease,
    background-color 150ms ease;
}

.modal-btn--ghost {
  background: transparent;
  color: rgb(var(--tw-ink-muted));

  &:hover {
    background: rgb(var(--tw-surface-2));
    color: rgb(var(--tw-ink));
  }
}

.modal-btn--primary {
  background: rgb(var(--tw-accent));
  color: rgb(var(--tw-canvas));

  &:hover {
    filter: brightness(1.1);
  }
}
</style>
