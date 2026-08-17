<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import AnimatedCounter from '@/components/Header/AnimatedCounter.vue';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const router = useRouter();
const { credits, isPro, hasJustSubscribed } = storeToRefs(userStore);

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const isLow = computed(() => credits.value > 0 && credits.value <= 3);

onClickOutside(rootRef, () => {
  isOpen.value = false;
});

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
}

function goToPricing() {
  closeMenu();
  router.push('/pricing');
}

function buyCredits() {
  closeMenu();
  dialogStore.showBuyCredits();
}
</script>

<template>
  <div
    ref="rootRef"
    class="credits-chip tw-relative tw-inline-flex"
    data-testid="credits-chip-root"
  >
    <button
      type="button"
      data-testid="credits-chip"
      aria-label="View credits. Free credits refresh daily"
      title="Free credits refresh daily"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      class="credits-chip__trigger tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-border/60 tw-bg-surface-1/50 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-border-accent/40 hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
      :class="{ 'credits-chip__trigger--low tw-border-gold/40 tw-text-gold': isLow }"
      @click="toggleMenu"
    >
      <font-awesome-icon
        icon="fa-solid fa-coins"
        class="tw-text-xs tw-text-accent"
        :class="{ 'tw-text-gold': isLow }"
        aria-hidden="true"
      />
      <AnimatedCounter :number="credits" :animate="hasJustSubscribed" />
    </button>

    <transition name="credits-chip-fade">
      <div
        v-if="isOpen"
        data-testid="credits-chip-menu"
        class="credits-chip__panel tw-absolute tw-right-0 tw-top-full tw-z-50 tw-mt-2 tw-min-w-[16rem] tw-rounded-md tw-border tw-border-border tw-bg-surface-1 tw-p-4 tw-shadow-elevated"
        role="dialog"
        tabindex="-1"
      >
        <div class="credits-chip__headline tw-flex tw-items-baseline tw-gap-2">
          <span class="tw-font-display tw-text-2xl tw-font-bold tw-text-ink-primary">{{
            credits
          }}</span>
          <span class="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-ink-muted"
            >credits left</span
          >
        </div>
        <p class="tw-mt-1 tw-text-xs tw-text-ink-muted">Free credits refresh daily.</p>

        <div class="credits-chip__actions tw-mt-3 tw-flex tw-flex-col tw-gap-2">
          <template v-if="!isPro">
            <button
              type="button"
              class="credits-chip__cta tw-inline-flex tw-items-center tw-justify-center tw-rounded-chip tw-bg-gradient-gold tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-canvas tw-transition-opacity tw-duration-fast hover:tw-opacity-90 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold"
              @click="goToPricing"
            >
              Subscribe to Pro
            </button>
            <button
              type="button"
              class="tw-inline-flex tw-items-center tw-justify-center tw-rounded-chip tw-border tw-border-border tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
              @click="buyCredits"
            >
              Buy Credits
            </button>
          </template>
          <button
            v-else
            type="button"
            class="credits-chip__cta tw-inline-flex tw-items-center tw-justify-center tw-rounded-chip tw-bg-gradient-gold tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-canvas tw-transition-opacity tw-duration-fast hover:tw-opacity-90 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold"
            @click="buyCredits"
          >
            Buy Credits
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.credits-chip__panel:focus {
  outline: none;
}

:global(html:not(.tw-dark)) .credits-chip__trigger--low {
  color: #9e7d35;
  border-color: rgba(158, 125, 53, 0.4);
}

.credits-chip-fade-enter-active,
.credits-chip-fade-leave-active {
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
}

.credits-chip-fade-enter-from,
.credits-chip-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
