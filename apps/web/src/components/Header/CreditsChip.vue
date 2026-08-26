<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import AnimatedCounter from '@/components/Header/AnimatedCounter.vue';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const { credits, dailyCredits, hasJustSubscribed } = storeToRefs(userStore);

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const totalCredits = computed(() => (dailyCredits.value || 0) + (credits.value || 0));
const isLow = computed(() => totalCredits.value > 0 && totalCredits.value <= 3);
const tooltipText = computed(
  () => `${dailyCredits.value || 0} daily · resets at midnight\n${credits.value || 0} credits`,
);

onClickOutside(rootRef, () => {
  isOpen.value = false;
});

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
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
      aria-label="View credits. Daily credits refresh at midnight"
      :title="tooltipText"
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
      <AnimatedCounter :number="totalCredits" :animate="hasJustSubscribed" />
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
            totalCredits
          }}</span>
          <span class="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-ink-muted"
            >credits available</span
          >
        </div>

        <div class="tw-mt-3 tw-space-y-1 tw-text-xs tw-text-ink-muted">
          <p>{{ dailyCredits || 0 }} daily · resets at midnight</p>
          <p>{{ credits || 0 }} persistent credits</p>
        </div>

        <div class="credits-chip__actions tw-mt-4">
          <button
            type="button"
            class="credits-chip__cta tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-rounded-chip tw-bg-gradient-gold tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-canvas tw-transition-opacity tw-duration-fast hover:tw-opacity-90 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold"
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
