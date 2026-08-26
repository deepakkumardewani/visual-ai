<script setup lang="ts">
import AppModal from '@/components/AppModal.vue';
import CreditCostBadge from '@/components/primitives/CreditCostBadge.vue';

withDefaults(
  defineProps<{
    open: boolean;
    actionName: string;
    creditCost: number;
    extraCopy?: string;
    layer?: number;
  }>(),
  {
    extraCopy: '',
    layer: 2,
  },
);

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <AppModal
    :open="open"
    max-width="28rem"
    :layer="layer"
    labelled-by="chain-confirm-title"
    described-by="chain-confirm-desc"
    @close="emit('close')"
  >
    <template #title>
      <span id="chain-confirm-title">{{ actionName }}</span>
    </template>

    <div id="chain-confirm-desc" class="chain-confirm__body">
      <p v-if="extraCopy" class="chain-confirm__copy">{{ extraCopy }}</p>
      <p class="chain-confirm__copy">
        This uses
        <CreditCostBadge :cost="creditCost" />. Continue?
      </p>
    </div>

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
.chain-confirm__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chain-confirm__copy {
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
  cursor: pointer;
  transition:
    filter 150ms ease,
    background-color 150ms ease;

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
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
