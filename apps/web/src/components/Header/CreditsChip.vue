<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useDialogStore } from "@/stores/dialog";
import { useUserStore } from "@/stores/user";

import AnimatedCounter from "@/components/Header/AnimatedCounter.vue";

const userStore = useUserStore();
const dialogStore = useDialogStore();
const router = useRouter();
const smAndUp = useMediaQuery("(min-width: 600px)");
const { credits, isPro, hasJustSubscribed } = storeToRefs(userStore);
const isOpen = ref(false);

function openMenu() {
  isOpen.value = true;
}

function closeMenu() {
  isOpen.value = false;
}

function onMouseEnter() {
  if (smAndUp.value) {
    openMenu();
  }
}

function onMouseLeave() {
  if (smAndUp.value) {
    closeMenu();
  }
}

function toggleMenu() {
  if (!smAndUp.value) {
    isOpen.value = !isOpen.value;
  }
}
</script>

<template>
  <div
    class="tw-relative tw-inline-flex"
    data-testid="credits-chip-root"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <button
      type="button"
      data-testid="credits-chip"
      aria-label="View credits"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      class="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-border tw-bg-surface-1/60 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-ink-primary tw-transition-colors hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
      @click="toggleMenu"
    >
      <font-awesome-icon
        v-if="smAndUp"
        icon="fa-solid fa-coins"
        class="tw-text-xs tw-text-accent"
        aria-hidden="true"
      />
      <AnimatedCounter :number="credits" :animate="hasJustSubscribed" />
    </button>

    <div
      v-if="isOpen"
      data-testid="credits-chip-menu"
      class="tw-absolute tw-right-0 tw-top-full tw-z-50 tw-mt-2 tw-min-w-[14rem] tw-rounded-md tw-border tw-border-border tw-bg-surface-1 tw-p-3 tw-text-center tw-text-sm tw-text-ink-primary tw-shadow-elevated"
      role="tooltip"
    >
      <div>
        <span class="tw-font-bold">{{ credits }}</span> credits left for today. Reset tomorrow.
      </div>
      <div class="tw-mt-1">
        <template v-if="!isPro">
          <button
            type="button"
            class="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-yellow-600 tw-underline hover:tw-text-decoration-none dark:tw-text-yellow-500"
            @click="router.push('/pricing')"
          >
            Subscribe to Pro
          </button>
          for more or
        </template>
        <button
          type="button"
          class="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-yellow-600 tw-underline hover:tw-text-decoration-none dark:tw-text-yellow-500"
          @click="dialogStore.showBuyCredits"
        >
          Buy Credits
        </button>
      </div>
    </div>
  </div>
</template>
