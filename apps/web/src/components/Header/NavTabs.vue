<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAppStore } from '@/stores/app';

import NavMenuGroup from '@/components/Header/NavMenuGroup.vue';

import {
  APP_SURFACE,
  APP_SURFACE_TAB,
  NAV_MENU_GROUPS,
  createFeatureLocation,
  tabFromRouteName,
  type NavMenuGroupDef,
} from '@/utils/dashboardRoutes';
import { FeatureType } from '@/types';

const props = withDefaults(defineProps<{ variant?: 'pill' | 'segmented' }>(), {
  variant: 'pill',
});

interface LinkEntry {
  kind: 'link';
  id: number;
  name: string;
  testId: string;
  routeName: string;
}

interface MenuEntry {
  kind: 'menu';
  id: number;
  testId: string;
  group: NavMenuGroupDef;
}

type NavEntry = LinkEntry | MenuEntry;

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { feature } = storeToRefs(appStore);

const IMAGE_TAB: LinkEntry = {
  kind: 'link',
  id: APP_SURFACE_TAB.create,
  name: 'Image',
  testId: 'nav-tab-create',
  routeName: APP_SURFACE.CREATE,
};
const VIDEO_TAB: LinkEntry = {
  kind: 'link',
  id: APP_SURFACE_TAB.video,
  name: 'Video',
  testId: 'nav-tab-video',
  routeName: APP_SURFACE.VIDEO,
};
const EXPLORE_TAB: LinkEntry = {
  kind: 'link',
  id: APP_SURFACE_TAB.explore,
  name: 'Explore',
  testId: 'nav-tab-explore',
  routeName: APP_SURFACE.EXPLORE,
};
const ASSETS_TAB: LinkEntry = {
  kind: 'link',
  id: APP_SURFACE_TAB.assets,
  name: 'Assets',
  testId: 'nav-tab-assets',
  routeName: APP_SURFACE.ASSETS,
};

const MENU_ENTRIES: MenuEntry[] = NAV_MENU_GROUPS.map((group) => ({
  kind: 'menu',
  id: group.tab,
  testId: `nav-menu-${group.id}`,
  group,
}));

/** Track padding (p-1 = 0.25rem per side) the slider must not overlap. */
const TRACK_INSET_REM = 0.5;

const isSegmented = computed(() => props.variant === 'segmented');

/** On mobile the Audio and Tools groups live in the accordion, so the segmented row only has links. */
const entries = computed<NavEntry[]>(() =>
  isSegmented.value
    ? [IMAGE_TAB, VIDEO_TAB, EXPLORE_TAB, ASSETS_TAB]
    : [IMAGE_TAB, VIDEO_TAB, ...MENU_ENTRIES, EXPLORE_TAB, ASSETS_TAB],
);

const navEl = ref<HTMLElement | null>(null);

const routeTabId = computed(() => tabFromRouteName(route.name) ?? APP_SURFACE_TAB.create);
const activeIndex = computed(() =>
  entries.value.findIndex((entry) => entry.id === routeTabId.value),
);
const hasActiveEntry = computed(() => activeIndex.value >= 0);

function isActive(entry: NavEntry) {
  return entry.id === routeTabId.value;
}

function selectLink(entry: LinkEntry) {
  if (entry.routeName === APP_SURFACE.CREATE) {
    void router.push(createFeatureLocation(feature.value || FeatureType.IMAGE, route.query));
    return;
  }

  void router.push({ name: entry.routeName });
}

function focusEntry(entry: NavEntry) {
  navEl.value?.querySelector<HTMLElement>(`[data-testid="${entry.testId}"]`)?.focus();
}

/** Arrow keys move focus; a link tab also activates, a menu trigger only receives focus. */
function moveTo(index: number) {
  const target = entries.value[index];
  if (target.kind === 'link') selectLink(target);
  focusEntry(target);
}

function targetIndex(key: string, index: number): number | null {
  const lastIndex = entries.value.length - 1;
  if (key === 'ArrowRight') return index === lastIndex ? 0 : index + 1;
  if (key === 'ArrowLeft') return index === 0 ? lastIndex : index - 1;
  if (key === 'Home') return 0;
  if (key === 'End') return lastIndex;
  return null;
}

function onKeydown(event: KeyboardEvent, index: number) {
  const next = targetIndex(event.key, index);
  if (next === null) return;
  event.preventDefault();
  moveTo(next);
}

/** The first entry is the fallback tab stop when the current route matches none (segmented mobile). */
function isTabStop(entry: NavEntry, index: number) {
  return hasActiveEntry.value ? isActive(entry) : index === 0;
}
</script>

<template>
  <nav
    ref="navEl"
    data-testid="nav-tabs"
    aria-label="Dashboard sections"
    class="nav-tabs tw-w-full"
    :class="isSegmented ? 'nav-tabs--segmented' : 'tw-max-w-xl'"
  >
    <div
      class="nav-tabs__track tw-relative tw-flex tw-rounded-full tw-border tw-border-border tw-bg-surface-2/60 tw-p-1"
      role="tablist"
    >
      <template v-for="(entry, index) in entries" :key="entry.id">
        <button
          v-if="entry.kind === 'link'"
          type="button"
          role="tab"
          :data-testid="entry.testId"
          :data-tour="entry.name === 'Explore' ? 'explore-tab' : undefined"
          :aria-selected="isActive(entry)"
          :tabindex="isTabStop(entry, index) ? 0 : -1"
          class="nav-tabs__tab tw-relative tw-z-[1] tw-min-h-11 tw-min-w-0 tw-flex-1 tw-basis-0 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-font-medium tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
          :class="{ 'nav-tabs__tab--active tw-text-ink-primary': isActive(entry) }"
          @click="selectLink(entry)"
          @keydown="onKeydown($event, index)"
        >
          {{ entry.name }}
        </button>
        <NavMenuGroup
          v-else
          class="tw-min-w-0 tw-flex-1 tw-basis-0"
          :group="entry.group"
          :active="isActive(entry)"
          :tabbable="isTabStop(entry, index)"
          @keydown="onKeydown($event, index)"
        />
      </template>
      <div
        aria-hidden="true"
        class="nav-tabs__slider tw-pointer-events-none tw-absolute tw-bottom-1 tw-left-1 tw-top-1 tw-rounded-full tw-bg-surface-3 tw-shadow-sm tw-ring-1 tw-ring-border tw-transition-transform tw-duration-300 tw-ease-out motion-reduce:tw-transition-none"
        :class="{ 'tw-opacity-0': !hasActiveEntry }"
        :style="{
          transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          width: `calc((100% - ${TRACK_INSET_REM}rem) / ${entries.length})`,
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
