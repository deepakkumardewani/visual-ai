<script setup lang="ts">
import { faTimes } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { useDialogStore } from '@/stores/dialog';

import AppModal from '@/components/AppModal.vue';
import { PRO_PERKS } from '@/utils/proPerks';

const dialogStore = useDialogStore();
const { showProPerksDialog } = storeToRefs(dialogStore);
</script>

<template>
  <AppModal
    :open="showProPerksDialog"
    max-width="30rem"
    :show-close="false"
    labelled-by="pro-perks-title"
    @close="dialogStore.hideProPerks"
  >
    <div class="pro-perks" data-testid="pro-perks-dialog">
      <div class="pro-perks__top">
        <h2 id="pro-perks-title" class="pro-perks__title">Your Pro perks</h2>
        <button
          type="button"
          class="pro-perks__close"
          aria-label="Close dialog"
          @click="dialogStore.hideProPerks()"
        >
          <font-awesome-icon :icon="faTimes" aria-hidden="true" />
        </button>
      </div>
      <ul class="pro-perks__list">
        <li v-for="perk in PRO_PERKS" :key="perk">{{ perk }}</li>
      </ul>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.pro-perks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pro-perks__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-right: 0.25rem;
}

.pro-perks__title {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 400;
}

.pro-perks__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--tw-ink-muted));
  cursor: pointer;

  &:hover {
    background: rgb(var(--tw-surface-2));
    color: rgb(var(--tw-ink-primary));
  }
}

.pro-perks__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0 0 0 1.1rem;
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-secondary));
}
</style>
