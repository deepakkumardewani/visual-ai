<script setup lang="ts">
import { faCreditCard, fasHeart, faUser } from '@/plugins/icons';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import History from '@/components/History/History.vue';
import Payments from '@/components/Profile/Payments.vue';
import UserDetails from '@/components/Profile/UserDetails.vue';

type ProfileTab = 'user' | 'favorites' | 'payments';

const TAB_IDS: ProfileTab[] = ['user', 'favorites', 'payments'];
const TAB_COUNT = TAB_IDS.length;
const PANEL_ID = 'profile-panel';

const NAV_ITEMS = [
  { id: 'user' as const, label: 'Profile', icon: faUser },
  { id: 'favorites' as const, label: 'Favorites', icon: fasHeart },
  { id: 'payments' as const, label: 'Payments', icon: faCreditCard },
];

const route = useRoute();
const router = useRouter();
const activeTab = ref<ProfileTab>('user');
const tabRefs = ref<(HTMLButtonElement | null)[]>([]);

const activeTabIndex = computed(() => TAB_IDS.indexOf(activeTab.value));

const sliderStyle = computed(() => ({
  transform: `translateX(${activeTabIndex.value * 100}%)`,
  width: `calc(${100 / TAB_COUNT}% - 0.25rem)`,
}));

function isValidTab(value: unknown): value is ProfileTab {
  return typeof value === 'string' && TAB_IDS.includes(value as ProfileTab);
}

function setTab(tab: ProfileTab) {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  void router.replace({
    query: {
      ...route.query,
      tab,
    },
  });
}

function focusTab(index: number) {
  tabRefs.value[index]?.focus();
}

function onKeydown(event: KeyboardEvent, index: number) {
  const lastIndex = TAB_COUNT - 1;
  let nextIndex: number | null = null;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = index === lastIndex ? 0 : index + 1;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = index === 0 ? lastIndex : index - 1;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = lastIndex;
  }

  if (nextIndex === null) return;

  event.preventDefault();
  setTab(TAB_IDS[nextIndex]);
  focusTab(nextIndex);
}

function syncTabFromRoute() {
  const tabQuery = route.query.tab;
  activeTab.value = isValidTab(tabQuery) ? tabQuery : 'user';
}

onMounted(syncTabFromRoute);
watch(() => route.query.tab, syncTabFromRoute);
</script>

<template>
  <div class="profile">
    <div class="profile__ambient" aria-hidden="true" />

    <div class="profile__shell">
      <header class="profile__intro">
        <h1 class="profile__title">Account</h1>
      </header>

      <div class="profile__layout">
        <nav class="profile__nav" aria-label="Account sections">
          <div class="profile__nav-track" role="tablist">
            <button
              v-for="(item, index) in NAV_ITEMS"
              :key="item.id"
              :ref="(el) => (tabRefs[index] = el as HTMLButtonElement | null)"
              type="button"
              role="tab"
              class="profile__nav-item"
              :class="{ 'profile__nav-item--active': activeTab === item.id }"
              :aria-selected="activeTab === item.id"
              :aria-controls="PANEL_ID"
              :tabindex="activeTab === item.id ? 0 : -1"
              @click="setTab(item.id)"
              @keydown="onKeydown($event, index)"
            >
              <font-awesome-icon :icon="item.icon" class="profile__nav-icon" aria-hidden="true" />
              <span class="profile__nav-label">{{ item.label }}</span>
            </button>
            <div aria-hidden="true" class="profile__nav-slider" :style="sliderStyle" />
          </div>
        </nav>

        <main
          :id="PANEL_ID"
          class="profile__panel"
          :class="{ 'profile__panel--flush': activeTab === 'favorites' }"
        >
          <UserDetails v-if="activeTab === 'user'" />
          <History v-else-if="activeTab === 'favorites'" :is-favorites="true" embedded />
          <Payments v-else-if="activeTab === 'payments'" />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile {
  position: relative;
  min-height: calc(100dvh - 3.5rem);
  overflow-x: hidden;
  background: rgb(var(--tw-canvas));
  color: rgb(var(--tw-ink-primary));
}

.profile__ambient {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 10% 0%, rgb(var(--tw-accent) / 0.08), transparent 55%),
    radial-gradient(ellipse 50% 35% at 90% 10%, rgb(var(--tw-accent) / 0.06), transparent 50%);
}

.profile__shell {
  position: relative;
  z-index: 1;
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

.profile__intro {
  margin-bottom: 2rem;
}

.profile__title {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: 2rem;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: rgb(var(--tw-ink-primary));
}

.profile__layout {
  display: grid;
  gap: 1.5rem;
}

.profile__nav {
  min-width: 0;
}

.profile__nav-track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: 0.25rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 999px;
  background: rgb(var(--tw-surface-1));
}

.profile__nav-item {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--tw-ink-muted));
  cursor: pointer;
  transition:
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 180ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    color: rgb(var(--tw-ink-primary));
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 2px;
  }
}

.profile__nav-item--active {
  color: rgb(var(--tw-ink-primary));
}

.profile__nav-slider {
  pointer-events: none;
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.25rem;
  border-radius: 999px;
  background: rgb(var(--tw-surface-3));
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.profile__nav-icon {
  width: 0.8rem;
  flex-shrink: 0;
  color: inherit;
}

.profile__nav-label {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
}

.profile__panel {
  min-width: 0;
}

.profile__panel--flush {
  overflow: visible;
}

@media (min-width: 900px) {
  .profile__shell {
    padding: 2rem 1.5rem 4rem;
  }

  .profile__layout {
    grid-template-columns: 10.5rem minmax(0, 1fr);
    gap: 3rem;
    align-items: start;
  }

  .profile__nav {
    position: sticky;
    top: 5rem;
  }

  .profile__nav-track {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.125rem;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .profile__nav-slider {
    display: none;
  }

  .profile__nav-item {
    width: 100%;
    justify-content: flex-start;
    min-height: 2.5rem;
    padding: 0.4rem 0.75rem;
    border-radius: 0.5rem;
    background: transparent;

    &:hover {
      background: rgb(var(--tw-surface-2) / 0.6);
    }
  }

  .profile__nav-item--active {
    background: rgb(var(--tw-surface-2));
    color: rgb(var(--tw-ink-primary));
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile__nav-item,
  .profile__nav-slider {
    transition: none;
  }
}
</style>
