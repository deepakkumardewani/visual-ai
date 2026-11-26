<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { computed, nextTick, ref } from 'vue';

import type { MediaAssetDto } from '@visual-ai/shared';

import {
  type HandoffTarget,
  handoffTargetsFor,
  useStudioHandoff,
} from '@/composables/useStudioHandoff';

const props = defineProps<{ asset: MediaAssetDto }>();

const { open: openTarget } = useStudioHandoff();

const targets = computed(() => handoffTargetsFor(props.asset));
const menuId = `handoff-menu-${props.asset.id}`;
const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const items = ref<HTMLButtonElement[]>([]);

type FocusStep = 'first' | 'last' | 'next' | 'previous';

function focusItem(step: FocusStep) {
  const list = items.value;
  if (!list.length) return;
  const current = list.indexOf(document.activeElement as HTMLButtonElement);
  const index = {
    first: 0,
    last: list.length - 1,
    next: (current + 1) % list.length,
    previous: (current - 1 + list.length) % list.length,
  }[step];
  list[index]?.focus();
}

async function openMenu(step: FocusStep = 'first') {
  isOpen.value = true;
  await nextTick();
  focusItem(step);
}

function closeMenu(returnFocus: boolean) {
  isOpen.value = false;
  if (returnFocus) trigger.value?.focus();
}

function choose(target: HandoffTarget) {
  closeMenu(false);
  void openTarget(target, props.asset);
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') openIfKey(event, 'first');
  else if (event.key === 'ArrowUp') openIfKey(event, 'last');
}

function openIfKey(event: KeyboardEvent, step: FocusStep) {
  event.preventDefault();
  void openMenu(step);
}

const MENU_KEY_STEPS: Record<string, FocusStep> = {
  ArrowDown: 'next',
  ArrowUp: 'previous',
  Home: 'first',
  End: 'last',
};

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeMenu(true);
    return;
  }
  // Tab leaves the menu; focus goes back to the trigger so it continues from a known place.
  if (event.key === 'Tab') {
    closeMenu(true);
    return;
  }
  const step = MENU_KEY_STEPS[event.key];
  if (!step) return;
  event.preventDefault();
  focusItem(step);
}

onClickOutside(root, () => {
  if (isOpen.value) closeMenu(false);
});
</script>

<template>
  <div v-if="targets.length" ref="root" class="handoff" data-testid="handoff-menu">
    <button
      ref="trigger"
      type="button"
      class="handoff__trigger"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? menuId : undefined"
      data-testid="handoff-trigger"
      @click="isOpen ? closeMenu(true) : openMenu()"
      @keydown="onTriggerKeydown"
    >
      Use in...
    </button>
    <ul
      v-if="isOpen"
      :id="menuId"
      role="menu"
      aria-label="Use in"
      class="handoff__menu"
      @keydown="onMenuKeydown"
    >
      <li v-for="target in targets" :key="target.routeName" role="none">
        <button
          ref="items"
          type="button"
          role="menuitem"
          class="handoff__item"
          :data-testid="`handoff-${target.routeName}`"
          @click="choose(target)"
        >
          {{ target.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.handoff {
  position: relative;
  align-self: flex-start;
}

.handoff__trigger,
.handoff__item {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1rem;
  font-size: 0.875rem;
  color: rgb(var(--tw-ink-primary));
  cursor: pointer;
  transition: background-color 150ms ease;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent, var(--tw-ink-primary)));
    outline-offset: 2px;
  }
}

.handoff__trigger {
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  background: transparent;
}

.handoff__menu {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  z-index: 20;
  min-width: 12rem;
  max-width: calc(100vw - 2rem);
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
}

.handoff__item {
  width: 100%;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  text-align: left;
  white-space: nowrap;
}

.handoff__trigger:hover,
.handoff__item:hover,
.handoff__item:focus-visible {
  background: rgb(var(--tw-surface-2));
}

@media (prefers-reduced-motion: reduce) {
  .handoff__trigger,
  .handoff__item {
    transition: none;
  }
}
</style>
