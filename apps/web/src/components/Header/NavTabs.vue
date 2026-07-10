<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const { tab } = storeToRefs(appStore);

const tabs = [
  { id: 1, name: 'Create' },
  { id: 2, name: 'Explore' },
  { id: 3, name: 'Assets' },
] as const;

const tabRefs = ref<(HTMLButtonElement | null)[]>([]);

const activeTabIndex = computed(() => tabs.findIndex((item) => item.id === tab.value));

function selectTab(id: number) {
  tab.value = id;
}

function focusTab(index: number) {
  tabRefs.value[index]?.focus();
}

function onKeydown(event: KeyboardEvent, index: number) {
  const lastIndex = tabs.length - 1;

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    const next = index === lastIndex ? 0 : index + 1;
    selectTab(tabs[next].id);
    focusTab(next);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    const prev = index === 0 ? lastIndex : index - 1;
    selectTab(tabs[prev].id);
    focusTab(prev);
  } else if (event.key === 'Home') {
    event.preventDefault();
    selectTab(tabs[0].id);
    focusTab(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    selectTab(tabs[lastIndex].id);
    focusTab(lastIndex);
  }
}
</script>

<template>
  <nav
    data-testid="nav-tabs"
    aria-label="Dashboard sections"
    class="nav-tabs tw-w-full tw-max-w-md"
  >
    <div
      class="nav-tabs__track tw-relative tw-flex tw-rounded-full tw-border tw-border-border tw-bg-surface-2/60 tw-p-1"
      role="tablist"
    >
      <button
        v-for="(tabItem, index) in tabs"
        :key="tabItem.id"
        :ref="(el) => (tabRefs[index] = el as HTMLButtonElement | null)"
        type="button"
        role="tab"
        :data-testid="`nav-tab-${tabItem.name.toLowerCase()}`"
        :aria-selected="tab === tabItem.id"
        :tabindex="tab === tabItem.id ? 0 : -1"
        class="nav-tabs__tab tw-relative tw-z-[1] tw-min-h-11 tw-flex-1 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-3 tw-text-sm tw-font-medium tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
        :class="{ 'nav-tabs__tab--active tw-text-ink-primary': tab === tabItem.id }"
        @click="selectTab(tabItem.id)"
        @keydown="onKeydown($event, index)"
      >
        {{ tabItem.name }}
      </button>
      <div
        aria-hidden="true"
        class="nav-tabs__slider tw-pointer-events-none tw-absolute tw-bottom-1 tw-left-1 tw-top-1 tw-rounded-full tw-bg-surface-3 tw-shadow-sm tw-ring-1 tw-ring-border tw-transition-transform tw-duration-300 tw-ease-out"
        :style="{
          transform: `translateX(${activeTabIndex * 100}%)`,
          width: `calc(${100 / tabs.length}% - 0.25rem)`,
        }"
      />
    </div>
  </nav>
</template>

<style scoped lang="scss">
.nav-tabs__tab--active {
  font-weight: 600;
}
</style>
