<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';

const props = withDefaults(
  defineProps<{
    title: string;
    storageKey: string;
    defaultOpen?: boolean;
  }>(),
  { defaultOpen: true },
);

const { interactiveTransition } = useDashboardMotion();
const isOpen = ref(props.defaultOpen);

function readStored(): boolean | null {
  try {
    const raw = localStorage.getItem(props.storageKey);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'boolean' ? parsed : null;
  } catch {
    return null;
  }
}

function persist(value: boolean) {
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode write failures.
  }
}

function toggle() {
  isOpen.value = !isOpen.value;
}

onMounted(() => {
  const stored = readStored();
  if (stored !== null) isOpen.value = stored;
});

watch(isOpen, (value) => {
  persist(value);
});
</script>

<template>
  <div :data-testid="`aside-disclosure-${storageKey}`" class="tw-flex tw-flex-col tw-gap-2">
    <button
      type="button"
      class="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-rounded-md tw-px-0.5 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
      :class="interactiveTransition"
      :aria-expanded="isOpen"
      :aria-controls="`aside-disclosure-panel-${storageKey}`"
      @click="toggle"
    >
      <span class="tw-text-eyebrow tw-font-semibold tw-tracking-wide tw-text-ink-muted">
        {{ title }}
      </span>
      <font-awesome-icon
        icon="chevron-down"
        class="tw-h-3 tw-w-3 tw-shrink-0 tw-text-ink-faint tw-transition-transform tw-duration-fast tw-ease-soft motion-reduce:tw-transition-none"
        :class="isOpen ? 'tw-rotate-0' : '-tw-rotate-90'"
        aria-hidden="true"
      />
    </button>

    <div
      v-show="isOpen"
      :id="`aside-disclosure-panel-${storageKey}`"
      class="tw-flex tw-flex-col tw-gap-4"
      role="region"
      :aria-label="title"
    >
      <slot />
    </div>
  </div>
</template>
