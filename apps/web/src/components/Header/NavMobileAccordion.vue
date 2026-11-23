<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ChevronCaret from '@/components/primitives/ChevronCaret.vue';

import {
  NAV_MENU_GROUPS,
  tabFromRouteName,
  type NavMenuGroupDef,
  type NavMenuItem,
} from '@/utils/dashboardRoutes';

const route = useRoute();
const router = useRouter();

/** One group open at a time keeps the sticky mobile header short. */
const openGroupId = ref<NavMenuGroupDef['id'] | null>(null);

const activeTab = computed(() => tabFromRouteName(route.name));
const openGroup = computed(() => NAV_MENU_GROUPS.find((group) => group.id === openGroupId.value));

const panelId = (group: NavMenuGroupDef) => `nav-accordion-panel-${group.id}`;

function toggle(group: NavMenuGroupDef) {
  openGroupId.value = openGroupId.value === group.id ? null : group.id;
}

function navigate(item: NavMenuItem) {
  openGroupId.value = null;
  void router.push({ name: item.routeName });
}
</script>

<template>
  <div data-testid="nav-mobile-accordion" class="tw-mt-2">
    <div class="tw-flex tw-gap-2">
      <button
        v-for="group in NAV_MENU_GROUPS"
        :id="`nav-accordion-trigger-${group.id}`"
        :key="group.id"
        type="button"
        :data-testid="`nav-accordion-${group.id}`"
        :aria-expanded="openGroupId === group.id"
        :aria-controls="panelId(group)"
        class="tw-inline-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-2 tw-rounded-chip tw-border tw-border-border tw-bg-surface-2/60 tw-px-3 tw-text-sm tw-font-medium tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
        :class="{ 'tw-font-semibold tw-text-ink-primary': activeTab === group.tab }"
        @click="toggle(group)"
      >
        {{ group.label }}
        <ChevronCaret :open="openGroupId === group.id" :boxed="false" />
      </button>
    </div>

    <ul
      v-if="openGroup"
      :id="panelId(openGroup)"
      :data-testid="`nav-accordion-panel-${openGroup.id}`"
      :aria-labelledby="`nav-accordion-trigger-${openGroup.id}`"
      class="tw-mt-1 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0"
    >
      <li v-for="item in openGroup.items" :key="item.routeName">
        <button
          type="button"
          :data-testid="`nav-accordion-item-${item.routeName}`"
          :aria-current="route.name === item.routeName ? 'page' : undefined"
          class="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-chip tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
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
            class="tw-shrink-0 tw-text-ink-muted"
          >
            <path :d="item.iconPath" />
          </svg>
          <span class="tw-min-w-0 tw-flex-1 tw-truncate">
            {{ item.label }}
            <span class="tw-text-xs tw-text-ink-muted">{{ item.description }}</span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
