<script setup lang="ts">
import { computed } from 'vue';

import AppModal from '@/components/AppModal.vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    imageCount?: number;
    loading?: boolean;
    /** Raise above another open modal (e.g. image preview). */
    layer?: number;
  }>(),
  {
    imageCount: 1,
    loading: false,
    layer: 0,
  },
);

const emit = defineEmits<{
  close: [];
  confirm: [event: Event];
}>();

const deleteTargetLabel = computed(() =>
  props.imageCount > 1 ? `these ${props.imageCount} images` : 'this image',
);

function onConfirm(event: Event) {
  emit('confirm', event);
}
</script>

<template>
  <AppModal
    :open="open"
    max-width="28rem"
    :layer="layer"
    labelled-by="delete-generation-title"
    described-by="delete-generation-desc"
    @close="emit('close')"
  >
    <template #title>
      <span id="delete-generation-title" class="delete-confirm__warn">Delete generation</span>
    </template>

    <p id="delete-generation-desc" class="delete-confirm__copy">
      Are you sure you want to delete {{ deleteTargetLabel }}? This action cannot be undone.
    </p>

    <template #actions>
      <button type="button" class="modal-btn modal-btn--ghost" @click="emit('close')">Keep</button>
      <button
        type="button"
        class="modal-btn modal-btn--danger"
        :disabled="loading"
        @click="onConfirm($event)"
      >
        {{ loading ? 'Deleting…' : 'Delete' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.delete-confirm__warn {
  color: #e08585;
}

:global(html:not(.tw-dark)) .delete-confirm__warn {
  color: #b03c3c;
}

.delete-confirm__copy {
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
