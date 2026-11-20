<script setup lang="ts">
import { useEventListener, useScrollLock } from '@vueuse/core';
import { nextTick, ref, toRef, watch } from 'vue';

import { useFocusTrap } from '@/composables/useFocusTrap';
import { useReducedMotion } from '@/composables/useReducedMotion';

const props = defineProps<{
  open: boolean;
  /** Accessible name of the dialog. */
  label: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const sheetRef = ref<HTMLElement | null>(null);
const previouslyFocused = ref<HTMLElement | null>(null);
const bodyLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null);
const reducedMotion = useReducedMotion();

useFocusTrap(sheetRef, toRef(props, 'open'));

// Capture phase + stopImmediatePropagation: when nested in another dialog (Settings sheet at <640px),
// Escape must close only this topmost sheet, not the parent's window-level Escape handler too.
useEventListener(
  window,
  'keydown',
  (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !props.open) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    emit('close');
  },
  { capture: true },
);

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) emit('close');
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      bodyLocked.value = true;
      // The focus trap lands on the search field; focus the sheet itself so the on-screen keyboard stays down.
      await nextTick();
      sheetRef.value?.focus();
      return;
    }
    bodyLocked.value = false;
    const restoreTarget = previouslyFocused.value;
    previouslyFocused.value = null;
    if (restoreTarget?.isConnected) restoreTarget.focus();
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="picker-sheet" :css="!reducedMotion">
      <div
        v-if="open"
        data-testid="model-picker-sheet-backdrop"
        class="picker-sheet tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-end tw-bg-black/50"
        role="presentation"
        @click="onBackdropClick"
      >
        <div
          ref="sheetRef"
          data-testid="model-picker-sheet"
          role="dialog"
          aria-modal="true"
          :aria-label="label"
          tabindex="-1"
          class="picker-sheet__panel tw-flex tw-max-h-[85dvh] tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-t-2xl tw-border-t tw-border-hairline tw-bg-surface-1 tw-pb-[env(safe-area-inset-bottom)] tw-shadow-elevated focus:tw-outline-none"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.picker-sheet-enter-active,
.picker-sheet-leave-active {
  transition: background-color 0.2s ease;
}

.picker-sheet-enter-active .picker-sheet__panel,
.picker-sheet-leave-active .picker-sheet__panel {
  transition: transform 0.2s ease;
}

.picker-sheet-enter-from,
.picker-sheet-leave-to {
  background-color: transparent;
}

.picker-sheet-enter-from .picker-sheet__panel,
.picker-sheet-leave-to .picker-sheet__panel {
  transform: translateY(100%);
}
</style>
