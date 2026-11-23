<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ChevronCaret from '@/components/primitives/ChevronCaret.vue';
import Popover from '@/components/primitives/Popover.vue';

import type { NavMenuGroupDef, NavMenuItem } from '@/utils/dashboardRoutes';

const props = withDefaults(
  defineProps<{
    group: NavMenuGroupDef;
    active: boolean;
    /** Roving tab stop: only the active nav entry sits in the page tab order. */
    tabbable?: boolean;
  }>(),
  { tabbable: true },
);

const route = useRoute();
const router = useRouter();

const open = ref(false);
const triggerId = `nav-menu-trigger-${props.group.id}`;

function closeAndRestoreFocus() {
  open.value = false;
  document.getElementById(triggerId)?.focus();
}

/** Tab leaves the menu: close it and hand focus back so the next Tab continues in the header. */
function onTab(event: KeyboardEvent) {
  event.preventDefault();
  closeAndRestoreFocus();
}

function navigate(item: NavMenuItem) {
  open.value = false;
  void router.push({ name: item.routeName });
}
</script>

<template>
  <Popover v-model:open="open" unstyled-trigger>
    <template #trigger="{ open: isOpen, triggerProps }">
      <button
        v-bind="triggerProps as Record<string, unknown>"
        :id="triggerId"
        :data-testid="`nav-menu-${group.id}`"
        :aria-label="`${group.label} menu`"
        :tabindex="tabbable ? 0 : -1"
        class="tw-relative tw-z-[1] tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-3 tw-text-sm tw-font-medium tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
        :class="{ 'tw-font-semibold tw-text-ink-primary': active }"
      >
        {{ group.label }}
        <ChevronCaret :open="isOpen" :boxed="false" />
      </button>
    </template>

    <div
      class="tw-flex tw-w-72 tw-max-w-full tw-flex-col tw-gap-1"
      :data-testid="`nav-menu-panel-${group.id}`"
      @keydown.tab="onTab"
    >
      <button
        v-for="item in group.items"
        :key="item.routeName"
        type="button"
        :data-testid="`nav-menu-item-${item.routeName}`"
        :aria-current="route.name === item.routeName ? 'page' : undefined"
        class="tw-flex tw-min-h-11 tw-w-full tw-items-start tw-gap-3 tw-rounded-chip tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-left tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
        @click="navigate(item)"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="tw-mt-0.5 tw-shrink-0 tw-text-ink-muted"
        >
          <path :d="item.iconPath" />
        </svg>
        <span class="tw-flex tw-min-w-0 tw-flex-col">
          <span class="tw-text-sm tw-font-medium tw-text-ink-primary">{{ item.label }}</span>
          <span
            :data-testid="`nav-menu-item-desc-${item.routeName}`"
            class="tw-truncate tw-text-xs tw-text-ink-muted"
          >
            {{ item.description }}
          </span>
        </span>
      </button>
    </div>
  </Popover>
</template>
