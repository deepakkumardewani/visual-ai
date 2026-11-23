<script setup lang="ts">
import { MEDIA_SHORTCUTS } from '@visual-ai/shared';

import AppModal from '@/components/AppModal.vue';

import { shortcutsHelpOpen } from '@/composables/useGlobalShortcuts';

const TITLE_ID = 'shortcuts-title';
</script>

<template>
  <AppModal
    :open="shortcutsHelpOpen"
    max-width="26rem"
    :labelled-by="TITLE_ID"
    @close="shortcutsHelpOpen = false"
  >
    <div data-testid="shortcuts-popover" class="tw-p-5">
      <h2 :id="TITLE_ID" class="tw-m-0 tw-mb-3 tw-text-base tw-font-semibold tw-text-ink-primary">
        Keyboard shortcuts
      </h2>
      <dl class="shortcuts-list">
        <div v-for="shortcut in MEDIA_SHORTCUTS" :key="shortcut.id" class="shortcuts-list__row">
          <dt>
            <kbd class="shortcuts-list__key">{{ shortcut.label }}</kbd>
          </dt>
          <dd>{{ shortcut.description }}</dd>
        </div>
      </dl>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.shortcuts-list {
  margin: 0;
  display: grid;
  gap: 0.25rem;
}

.shortcuts-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.25rem;
  font-size: 0.875rem;
  color: rgb(var(--tw-ink-muted));

  dd {
    margin: 0;
    text-align: right;
  }
}

.shortcuts-list__key {
  padding: 0.125rem 0.5rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 0.8125rem;
  color: rgb(var(--tw-ink-primary));
  white-space: nowrap;
}
</style>
