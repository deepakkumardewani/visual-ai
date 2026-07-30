<script setup lang="ts">
import { faTimes } from '@/plugins/icons';
import { onKeyStroke, useScrollLock } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    maxWidth?: string;
    fullscreen?: boolean;
    showClose?: boolean;
    labelledBy?: string;
    describedBy?: string;
    /** When false, Escape will not close the modal (useful for stacked confirms). */
    closeOnEscape?: boolean;
    /** When false, clicking the backdrop will not close the modal. */
    closeOnOverlay?: boolean;
    /** Stacking layer — increases z-index so nested confirms sit above. */
    layer?: number;
  }>(),
  {
    maxWidth: '32rem',
    fullscreen: false,
    showClose: true,
    labelledBy: 'app-modal-title',
    describedBy: undefined,
    closeOnEscape: true,
    closeOnOverlay: true,
    layer: 0,
  },
);

const emit = defineEmits<{
  close: [];
  'update:open': [value: boolean];
}>();

const panelRef = ref<HTMLElement | null>(null);
const bodyLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null);

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

function close() {
  emit('update:open', false);
  emit('close');
}

function onOverlayClick(event: MouseEvent) {
  if (!props.closeOnOverlay) return;
  if (event.target === event.currentTarget) close();
}

const overlayStyle = computed(() => ({
  zIndex: 1200 + props.layer * 20,
}));

onKeyStroke('Escape', (event) => {
  if (!props.open || !props.closeOnEscape) return;
  event.preventDefault();
  close();
});

watch(
  () => props.open,
  (open) => {
    // Nested modals share body lock — only unlock when this instance closes if still top-level.
    if (open) {
      bodyLocked.value = true;
      requestAnimationFrame(() => panelRef.value?.focus());
    } else if (props.layer === 0) {
      bodyLocked.value = false;
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="app-modal">
      <div
        v-if="isOpen"
        class="app-modal"
        :class="{ 'app-modal--fullscreen': fullscreen }"
        :style="overlayStyle"
        role="presentation"
        @click="onOverlayClick"
      >
        <div
          ref="panelRef"
          class="app-modal__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelledBy"
          :aria-describedby="describedBy"
          :style="fullscreen ? undefined : { maxWidth }"
          tabindex="-1"
          @click.stop
        >
          <button
            v-if="showClose"
            type="button"
            class="app-modal__close"
            aria-label="Close dialog"
            @click="close"
          >
            <font-awesome-icon :icon="faTimes" aria-hidden="true" />
          </button>

          <header v-if="$slots.title" class="app-modal__header">
            <h2 :id="labelledBy" class="app-modal__title">
              <slot name="title" />
            </h2>
          </header>

          <div class="app-modal__body">
            <slot />
          </div>

          <footer v-if="$slots.actions" class="app-modal__actions">
            <slot name="actions" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.app-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 6, 4, 0.72);
  backdrop-filter: blur(8px);
}

.app-modal--fullscreen {
  padding: 0;
}

.app-modal__panel {
  position: relative;
  /* width is 100% so the maxWidth prop can actually expand the dialog */
  width: 100%;
  max-width: 32rem;
  max-height: 92dvh;
  overflow: auto;
  border: 1px solid rgb(var(--tw-border) / 0.75);
  border-radius: 16px;
  background: rgb(var(--tw-surface-1));
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(201, 168, 76, 0.08);
  color: rgb(var(--tw-ink-primary));
  outline: none;
}

.app-modal--fullscreen .app-modal__panel {
  width: 100%;
  max-width: none;
  max-height: none;
  height: 100%;
  border-radius: 0;
}

.app-modal__close {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  z-index: 2;
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
  transition:
    background-color 150ms ease,
    color 150ms ease;

  &:hover {
    background: rgb(var(--tw-surface-2));
    color: rgb(var(--tw-ink-primary));
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.app-modal__header {
  padding: 1.5rem 3.25rem 0 1.5rem;
}

.app-modal__title {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 400;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
}

.app-modal__body {
  padding: 1.25rem 1.5rem 1.5rem;
}

.app-modal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 0 1.5rem 1.5rem;
}

.app-modal-enter-active,
.app-modal-leave-active {
  transition: opacity 180ms ease;

  .app-modal__panel {
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }
}

.app-modal-enter-from,
.app-modal-leave-to {
  opacity: 0;

  .app-modal__panel {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-modal {
    backdrop-filter: none;
  }

  .app-modal-enter-active,
  .app-modal-leave-active,
  .app-modal-enter-active .app-modal__panel,
  .app-modal-leave-active .app-modal__panel {
    transition: none;
  }
}
</style>
