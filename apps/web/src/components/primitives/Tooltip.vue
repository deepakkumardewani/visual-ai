<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    text: string;
    placement?: 'top' | 'bottom';
  }>(),
  { placement: 'top' },
);

const triggerRef = ref<HTMLElement | null>(null);
const visible = ref(false);
const tipStyle = ref<Record<string, string>>({});
let showTimer: ReturnType<typeof setTimeout> | null = null;

function clearShowTimer() {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
}

function positionTip() {
  const el = triggerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const centerX = Math.round(rect.left + rect.width / 2);
  if (props.placement === 'bottom') {
    tipStyle.value = {
      position: 'fixed',
      top: `${Math.round(rect.bottom + 8)}px`,
      left: `${centerX}px`,
      transform: 'translateX(-50%)',
      zIndex: '70',
    };
    return;
  }
  tipStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.top - 8)}px`,
    left: `${centerX}px`,
    transform: 'translate(-50%, -100%)',
    zIndex: '70',
  };
}

function show() {
  if (!props.text) return;
  clearShowTimer();
  showTimer = setTimeout(() => {
    visible.value = true;
    nextTick(positionTip);
  }, 180);
}

function hide() {
  clearShowTimer();
  visible.value = false;
}

function onScrollOrResize() {
  if (visible.value) positionTip();
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);
}

onBeforeUnmount(() => {
  clearShowTimer();
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
  }
});
</script>

<template>
  <span
    ref="triggerRef"
    class="tw-inline-flex"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
    <Teleport to="body">
      <div
        v-if="visible"
        role="tooltip"
        class="tw-pointer-events-none tw-w-max tw-max-w-[12rem] tw-rounded-md tw-border tw-border-hairline tw-bg-surface-1 tw-px-2 tw-py-1 tw-text-caption tw-leading-snug tw-text-ink tw-shadow-elevated"
        :style="tipStyle"
      >
        {{ text }}
      </div>
    </Teleport>
  </span>
</template>
