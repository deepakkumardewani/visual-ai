<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';

const visible = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    timeout?: number;
    text?: string;
  }>(),
  { timeout: 2000, text: '' },
);

let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function scheduleHide() {
  clearHideTimer();
  if (!visible.value) return;
  if (props.timeout < 0) return;
  hideTimer = setTimeout(() => {
    visible.value = false;
  }, props.timeout);
}

watch(visible, scheduleHide);
watch(() => props.timeout, scheduleHide);

onBeforeUnmount(clearHideTimer);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      role="status"
      class="tw-fixed tw-bottom-4 tw-right-4 tw-z-[10000] tw-max-w-sm tw-rounded tw-px-4 tw-py-3 tw-text-sm tw-text-neutral-900 tw-shadow-lg"
      style="background-color: #c9a84c"
    >
      {{ text }}
    </div>
  </Teleport>
</template>
