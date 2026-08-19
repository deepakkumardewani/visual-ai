<script setup lang="ts">
/**
 * Mobile-only bottom sheet for Create feature settings (DashboardSidebar).
 * Custom sheet to match Dashboard polish tokens and avoid
 * duplicate aside mounts with the desktop rail.
 */
import { onKeyStroke } from '@vueuse/core';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

function close() {
  isOpen.value = false;
}

onKeyStroke('Escape', () => {
  if (isOpen.value) close();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      data-testid="mobile-settings-sheet"
      class="mobile-settings-sheet tw-fixed tw-inset-0 tw-z-50 tw-flex tw-flex-col tw-justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Feature settings"
    >
      <button
        type="button"
        data-testid="mobile-settings-scrim"
        class="tw-absolute tw-inset-0 tw-border-0 tw-bg-canvas/70 tw-p-0"
        aria-label="Dismiss settings"
        @click="close"
      />

      <div
        class="mobile-settings-sheet__panel tw-relative tw-z-10 tw-flex tw-max-h-[min(85vh,40rem)] tw-flex-col tw-overflow-hidden tw-rounded-t-2xl tw-border tw-border-b-0 tw-border-hairline tw-bg-surface-1 tw-text-ink tw-shadow-[0_-12px_40px_rgba(0,0,0,0.35)]"
      >
        <header
          class="tw-flex tw-shrink-0 tw-flex-col tw-items-center tw-border-b tw-border-hairline tw-px-3 tw-pb-2 tw-pt-2"
        >
          <div
            class="tw-mb-2 tw-h-1 tw-w-10 tw-rounded-full tw-bg-ink-faint/50"
            aria-hidden="true"
          />
          <div class="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2">
            <h2 class="tw-text-sm tw-font-semibold tw-tracking-tight tw-text-ink">Settings</h2>
            <button
              type="button"
              data-testid="mobile-settings-close"
              class="tw-inline-flex tw-min-h-10 tw-min-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-text-ink-muted hover:tw-bg-surface-2 hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent"
              aria-label="Close settings"
              @click="close"
            >
              <font-awesome-icon icon="xmark" class="tw-h-4 tw-w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div class="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain no-scrollbar">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
