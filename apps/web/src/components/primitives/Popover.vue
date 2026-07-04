<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { nextTick, ref, watch } from 'vue';

import { useFocusTrap } from '@/composables/useFocusTrap';

const props = withDefaults(
  defineProps<{
    open?: boolean;
    placement?: 'bottom-start' | 'bottom-end' | 'top-start';
  }>(),
  {
    open: undefined,
    placement: 'bottom-start',
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const internalOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const triggerElement = ref<HTMLElement | null>(null);

const isControlled = props.open !== undefined;
const isOpen = ref(isControlled ? props.open : internalOpen.value);

watch(
  () => props.open,
  (value) => {
    if (isControlled && value !== undefined) {
      isOpen.value = value;
    }
  },
);

const setOpen = (value: boolean) => {
  isOpen.value = value;
  if (!isControlled) {
    internalOpen.value = value;
  }
  emit('update:open', value);
};

const toggle = () => setOpen(!isOpen.value);
const close = () => setOpen(false);

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggle();
  } else if (event.key === 'ArrowDown' && !isOpen.value) {
    event.preventDefault();
    setOpen(true);
  } else if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault();
    close();
    triggerElement.value?.focus();
  }
};

const onPanelKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
    triggerElement.value?.focus();
    return;
  }

  const panel = panelRef.value;
  if (!panel) return;

  const items = Array.from(
    panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [role="option"], [role="menuitem"]',
    ),
  );
  if (items.length === 0) return;

  const activeIndex = items.indexOf(document.activeElement as HTMLElement);

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const next = activeIndex === -1 ? 0 : (activeIndex + 1) % items.length;
    items[next]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const next = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
    items[next]?.focus();
  } else if (event.key === 'Home') {
    event.preventDefault();
    items[0]?.focus();
  } else if (event.key === 'End') {
    event.preventDefault();
    items[items.length - 1]?.focus();
  }
};

watch(isOpen, async (open) => {
  if (open) {
    await nextTick();
    panelRef.value?.focus();

    const firstItem = panelRef.value?.querySelector<HTMLElement>(
      'button:not([disabled]), [role="option"], [role="menuitem"]',
    );
    firstItem?.focus();
  }
});

onClickOutside(
  panelRef,
  (event) => {
    if (!isOpen.value) return;
    const target = event.target as Node;
    if (triggerRef.value?.contains(target)) return;
    close();
  },
  { ignore: [triggerRef] },
);

useFocusTrap(panelRef, isOpen);

const placementClass: Record<string, string> = {
  'bottom-start': 'tw-left-0 tw-top-full tw-mt-2',
  'bottom-end': 'tw-right-0 tw-top-full tw-mt-2',
  'top-start': 'tw-left-0 tw-bottom-full tw-mb-2',
};
</script>

<template>
  <div ref="triggerRef" class="tw-relative tw-inline-block">
    <button
      ref="triggerElement"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      class="tw-inline-flex tw-min-h-[44px] tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-1 tw-px-4 tw-py-2 tw-text-ink tw-transition-colors tw-duration-fast hover:tw-border-accent/40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] motion-reduce:tw-transition-none"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="isOpen" />
    </button>

    <div
      v-if="isOpen"
      ref="panelRef"
      role="dialog"
      tabindex="-1"
      :class="['tw-absolute tw-z-50 tw-min-w-[12rem]', placementClass[placement]]"
      @keydown="onPanelKeydown"
    >
      <div
        class="tw-rounded-md tw-border tw-border-hairline tw-bg-surface-1 tw-p-3 tw-shadow-elevated"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
