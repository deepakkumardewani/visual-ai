<script setup lang="ts">
import {
  faChevronDown,
  faCrown,
  faLink,
  faMoon,
  faSignOutAlt,
  faSun,
  faUser,
  faUsers,
} from '@/plugins/icons';
import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';
import { useClerk } from 'vue-clerk';
import { useRouter } from 'vue-router';

import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import ReferralCopyDialog from '@/components/Dialogs/ReferralCopyDialog.vue';
import ReferralDialog from '@/components/Dialogs/ReferralDialog.vue';

const router = useRouter();
const dialogStore = useDialogStore();
const appStore = useAppStore();
const userStore = useUserStore();
const { userDetails, isPro } = storeToRefs(userStore);
const { isDark } = storeToRefs(appStore);
const { signOut } = useClerk();

const fullName = ref('');
const email = ref('');
const userImage = ref('');
const userInitials = ref('');
const menu = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);
const itemRefs = ref<(HTMLButtonElement | null)[]>([]);

const subscriptionStatus = computed(() => (isPro.value ? 'Pro' : 'Free'));

function getUserInitials() {
  const first = userDetails.value?.firstName ?? '';
  const last = userDetails.value?.lastName ?? '';
  if (!first && !last) return '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

function updateUserInfo() {
  if (userDetails.value) {
    fullName.value = userDetails.value.fullName ?? '';
    email.value = userDetails.value.email ?? '';
    userImage.value = userDetails.value.imageUrl ?? '';
    userInitials.value = getUserInitials();
  }
}

watch(() => userDetails.value, updateUserInfo, { immediate: true, deep: true });

onClickOutside(rootRef, () => {
  menu.value = false;
});

const menuItems = computed(() => [
  { id: 'profile', label: 'View Profile', icon: faUser, action: goToProfile },
  {
    id: 'subscription',
    label: 'My Subscription',
    icon: faCrown,
    action: goToSubscription,
    badge: subscriptionStatus.value,
  },
  { id: 'use-referral', label: 'Use Referral Code', icon: faUsers, action: showReferralDialog },
  { id: 'refer-earn', label: 'Refer & Earn Credits', icon: faLink, action: copyReferralCode },
]);

function toggleMenu() {
  menu.value = !menu.value;
  if (menu.value) {
    nextTick(() => itemRefs.value[0]?.focus());
  }
}

function closeMenu() {
  menu.value = false;
  triggerRef.value?.focus();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
    event.preventDefault();
    menu.value = true;
    nextTick(() => itemRefs.value[0]?.focus());
  }
}

function onItemKeydown(event: KeyboardEvent, index: number) {
  const items = menuItems.value;
  const lastIndex = items.length - 1;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const next = index === lastIndex ? 0 : index + 1;
    itemRefs.value[next]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const prev = index === 0 ? lastIndex : index - 1;
    itemRefs.value[prev]?.focus();
  } else if (event.key === 'Home') {
    event.preventDefault();
    itemRefs.value[0]?.focus();
  } else if (event.key === 'End') {
    event.preventDefault();
    itemRefs.value[lastIndex]?.focus();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
  }
}

function goToProfile() {
  closeMenu();
  router.push({ name: 'profile' });
}

function goToSubscription() {
  closeMenu();
  router.push({ name: 'profile', query: { tab: 'subscription' } });
}

function showReferralDialog() {
  closeMenu();
  dialogStore.showReferral();
}

function copyReferralCode() {
  closeMenu();
  dialogStore.showCopyReferral();
}

function handleSignOut() {
  closeMenu();
  signOut({ redirectUrl: '/' });
}

function setItemRef(index: number) {
  return (el: Element | null) => {
    itemRefs.value[index] = el as HTMLButtonElement | null;
  };
}
</script>

<template>
  <div ref="rootRef" class="user-menu tw-relative tw-inline-flex tw-shrink-0">
    <button
      ref="triggerRef"
      type="button"
      data-testid="user-menu-trigger"
      aria-haspopup="menu"
      :aria-expanded="menu"
      class="user-menu__trigger tw-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-border/60 tw-bg-surface-1/50 tw-py-1 tw-pl-1 tw-pr-2.5 tw-transition-colors tw-duration-fast hover:tw-border-accent/40 hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
      @click="toggleMenu"
      @keydown="onTriggerKeydown"
    >
      <span
        class="user-menu__avatar tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-surface-3 tw-text-xs tw-font-semibold tw-text-ink-primary tw-ring-1 tw-ring-border/60"
      >
        <img
          v-if="userImage"
          :src="userImage"
          :alt="fullName"
          class="tw-h-full tw-w-full tw-object-cover"
        />
        <span v-else aria-hidden="true">{{ userInitials }}</span>
      </span>
      <font-awesome-icon
        :icon="faChevronDown"
        class="tw-text-[0.625rem] tw-text-ink-muted tw-transition-transform tw-duration-fast"
        :class="{ 'tw-rotate-180': menu }"
        aria-hidden="true"
      />
    </button>

    <transition name="user-menu-fade">
      <div
        v-if="menu"
        data-testid="user-menu-panel"
        role="menu"
        class="user-menu__panel tw-absolute tw-right-0 tw-top-full tw-z-50 tw-mt-2 tw-w-[18rem] tw-overflow-hidden tw-rounded-md tw-border tw-border-border tw-bg-surface-1 tw-shadow-elevated"
      >
        <div class="user-menu__header tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3.5">
          <span
            class="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-surface-3 tw-text-sm tw-font-semibold tw-text-ink-primary tw-ring-1 tw-ring-border/60"
          >
            <img
              v-if="userImage"
              :src="userImage"
              :alt="fullName"
              class="tw-h-full tw-w-full tw-object-cover"
            />
            <span v-else aria-hidden="true">{{ userInitials }}</span>
          </span>
          <span class="tw-min-w-0 tw-flex-1">
            <span class="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-ink-primary">{{
              fullName || 'Your account'
            }}</span>
            <span v-if="email" class="tw-block tw-truncate tw-text-xs tw-text-ink-muted">{{
              email
            }}</span>
          </span>
        </div>

        <div class="user-menu__divider tw-h-px tw-bg-border/60" />

        <div class="user-menu__items tw-py-1.5" role="group" aria-label="Account">
          <button
            v-for="(item, index) in menuItems"
            :key="item.id"
            :ref="setItemRef(index)"
            type="button"
            role="menuitem"
            :data-testid="`user-menu-item-${item.id}`"
            class="user-menu__item tw-flex tw-w-full tw-items-center tw-gap-3 tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw:bg-surface-2 focus-visible:tw-bg-surface-2 focus-visible:tw-outline-none"
            @click="item.action()"
            @keydown="onItemKeydown($event, index)"
          >
            <font-awesome-icon
              :icon="item.icon"
              class="tw-shrink-0 tw-text-xs tw-text-ink-muted"
              aria-hidden="true"
            />
            <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-font-medium">{{ item.label }}</span>
            <span
              v-if="item.badge"
              class="user-menu__badge tw-inline-flex tw-items-center tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-wide"
              :class="
                item.badge === 'Pro'
                  ? 'tw-bg-gold/15 tw-text-gold'
                  : 'tw-bg-surface-3 tw-text-ink-muted'
              "
            >
              {{ item.badge }}
            </span>
          </button>
        </div>

        <div class="user-menu__divider tw-h-px tw-bg-border/60" />

        <div class="user-menu__items tw-py-1.5" role="group" aria-label="Session">
          <button
            type="button"
            role="menuitem"
            data-testid="user-menu-item-theme"
            class="user-menu__item tw-flex tw-w-full tw-items-center tw-gap-3 tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw:bg-surface-2 focus-visible:tw:bg-surface-2 focus-visible:tw-outline-none"
            @click="appStore.toggleTheme"
          >
            <span class="tw-inline-flex tw-w-4 tw-shrink-0 tw-justify-center">
              <font-awesome-icon
                :icon="isDark ? faSun : faMoon"
                class="tw-text-xs tw-text-ink-muted"
                aria-hidden="true"
              />
            </span>
            <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-font-medium">{{
              isDark ? 'Light Mode' : 'Dark Mode'
            }}</span>
            <span
              class="tw-inline-flex tw-min-w-[2.75rem] tw-items-center tw-justify-center tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[0.625rem] tw-font-medium tw-uppercase tw-tracking-wide tw-text-ink-muted"
              :class="isDark ? 'tw-bg-surface-3' : 'tw-bg-gold/10 tw-text-gold'"
            >
              {{ isDark ? 'Dark' : 'Light' }}
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            data-testid="user-menu-item-logout"
            class="user-menu__item user-menu__item--danger tw-flex tw-w-full tw-items-center tw-gap-3 tw-border-0 tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw:bg-[#8B2E2E]/20 hover:tw-text-[#E08585] focus-visible:tw:bg-[#8B2E2E]/20 focus-visible:tw-outline-none"
            @click="handleSignOut"
          >
            <font-awesome-icon
              :icon="faSignOutAlt"
              class="tw-shrink-0 tw-text-xs"
              aria-hidden="true"
            />
            <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-font-medium">Log out</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
  <ReferralDialog />
  <ReferralCopyDialog />
</template>

<style scoped>
:global(html:not(.tw-dark)) .user-menu__item--danger:hover {
  background-color: rgba(176, 60, 60, 0.1);
  color: #b03c3c;
}

:global(html:not(.tw-dark)) .user-menu__item--danger:focus-visible {
  background-color: rgba(176, 60, 60, 0.1);
}

:global(html:not(.tw-dark)) .user-menu__badge--pro {
  color: #9e7d35;
}

.user-menu-fade-enter-active,
.user-menu-fade-leave-active {
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
}

.user-menu-fade-enter-from,
.user-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
