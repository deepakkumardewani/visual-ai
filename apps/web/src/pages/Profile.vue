<script setup lang="ts">
import { faCreditCard, faCrown, fasHeart, faUser } from '@/plugins/icons';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import History from '@/components/History/History.vue';
import Payments from '@/components/Profile/Payments.vue';
import Subscription from '@/components/Profile/Subscription.vue';
import UserDetails from '@/components/Profile/UserDetails.vue';

type ProfileTab = 'user' | 'favorites' | 'payments' | 'subscription';

const TAB_IDS: ProfileTab[] = ['user', 'favorites', 'payments', 'subscription'];

const NAV_ITEMS = [
  { id: 'user' as const, label: 'Profile', description: 'Name, email, account', icon: faUser },
  {
    id: 'favorites' as const,
    label: 'Favorites',
    description: 'Saved generations',
    icon: fasHeart,
  },
  {
    id: 'payments' as const,
    label: 'Payments',
    description: 'Billing history',
    icon: faCreditCard,
  },
  {
    id: 'subscription' as const,
    label: 'Subscription',
    description: 'Plan and credits',
    icon: faCrown,
  },
];

const route = useRoute();
const router = useRouter();
const activeTab = ref<ProfileTab>('user');

const activeNav = computed(() => NAV_ITEMS.find((item) => item.id === activeTab.value));

function isValidTab(value: unknown): value is ProfileTab {
  return typeof value === 'string' && TAB_IDS.includes(value as ProfileTab);
}

function setTab(tab: ProfileTab) {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  router.replace({
    query: {
      ...route.query,
      tab,
    },
  });
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
        <p class="profile__eyebrow">Account</p>
        <h1 class="profile__title">{{ activeNav?.label ?? 'Profile' }}</h1>
        <p class="profile__subtitle">{{ activeNav?.description }}</p>
      </header>

      <div class="profile__layout">
        <nav class="profile__nav" aria-label="Account sections">
          <button
            v-for="item in NAV_ITEMS"
            :key="item.id"
            type="button"
            class="profile__nav-item"
            :class="{ 'profile__nav-item--active': activeTab === item.id }"
            :aria-current="activeTab === item.id ? 'page' : undefined"
            @click="setTab(item.id)"
          >
            <font-awesome-icon :icon="item.icon" class="profile__nav-icon" aria-hidden="true" />
            <span class="profile__nav-copy">
              <span class="profile__nav-label">{{ item.label }}</span>
              <span class="profile__nav-desc">{{ item.description }}</span>
            </span>
          </button>
        </nav>

        <main
          class="profile__panel"
          :class="{ 'profile__panel--flush': activeTab === 'favorites' }"
          tabindex="-1"
        >
          <UserDetails v-if="activeTab === 'user'" />
          <History v-else-if="activeTab === 'favorites'" :is-favorites="true" />
          <Payments v-else-if="activeTab === 'payments'" />
          <Subscription v-else-if="activeTab === 'subscription'" />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile {
  position: relative;
  min-height: calc(100dvh - 3.5rem);
  overflow: hidden;
  background: rgb(var(--tw-canvas));
  color: rgb(var(--tw-ink-primary));
}

.profile__ambient {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 10% 0%, rgba(201, 168, 76, 0.08), transparent 55%),
    radial-gradient(ellipse 50% 35% at 90% 10%, rgba(201, 138, 90, 0.06), transparent 50%);
}

.profile__shell {
  position: relative;
  z-index: 1;
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

.profile__intro {
  margin-bottom: 1.5rem;
}

.profile__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d29467;
}

.profile__title {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: rgb(var(--tw-ink-primary));
}

.profile__subtitle {
  margin: 0.4rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-muted));
}

.profile__layout {
  display: grid;
  gap: 1.25rem;
}

.profile__nav {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.profile__nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 44px;
  flex-shrink: 0;
  padding: 0.65rem 0.9rem;
  border: 1px solid rgb(var(--tw-border) / 0.7);
  border-radius: 999px;
  background: rgb(var(--tw-surface-1) / 0.7);
  color: rgb(var(--tw-ink-muted));
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;

  &:hover {
    border-color: rgba(201, 168, 76, 0.35);
    background: rgb(var(--tw-surface-2));
    color: rgb(var(--tw-ink-primary));
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.profile__nav-item--active {
  border-color: rgba(201, 168, 76, 0.55);
  background: rgba(201, 168, 76, 0.12);
  color: rgb(var(--tw-ink-primary));
  box-shadow: 0 0 0 1px rgba(201, 168, 76, 0.15);
}

.profile__nav-icon {
  width: 0.85rem;
  flex-shrink: 0;
  color: inherit;
}

.profile__nav-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  text-align: left;
}

.profile__nav-label {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
}

.profile__nav-desc {
  display: none;
  font-size: 0.75rem;
  line-height: 1.3;
  color: rgb(var(--tw-ink-muted));
  font-weight: 400;
}

.profile__panel {
  min-width: 0;
  border: 1px solid rgb(var(--tw-border) / 0.65);
  border-radius: 16px;
  background: rgb(var(--tw-surface-1) / 0.72);
  backdrop-filter: blur(10px);
  padding: 1.25rem;
}

.profile__panel--flush {
  padding: 0;
  overflow: hidden;
}

@media (min-width: 900px) {
  .profile__shell {
    padding: 2rem 1.5rem 4rem;
  }

  .profile__layout {
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 1.5rem;
    align-items: start;
  }

  .profile__nav {
    flex-direction: column;
    overflow: visible;
    position: sticky;
    top: 5rem;
    gap: 0.4rem;
  }

  .profile__nav-item {
    width: 100%;
    border-radius: 12px;
    padding: 0.85rem 1rem;
  }

  .profile__nav-desc {
    display: block;
  }

  .profile__nav-item--active .profile__nav-desc {
    color: rgb(var(--tw-ink-muted));
  }

  .profile__panel {
    padding: 1.75rem;
    min-height: 28rem;
  }

  .profile__panel--flush {
    padding: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile__nav-item {
    transition: none;
  }

  .profile__panel {
    backdrop-filter: none;
  }
}
</style>
