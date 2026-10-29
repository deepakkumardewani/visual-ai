<script setup lang="ts">
import { faChevronLeft, faChevronRight, faXmark } from '@/plugins/icons';
import { computed, nextTick, ref, watch } from 'vue';

import { useFocusTrap } from '@/composables/useFocusTrap';
import { useIntro } from '@/composables/useIntro';

import FeatureList from './FeatureList.vue';
import IntroSlide from './IntroSlide.vue';
import { INTRO_SLIDES, INTRO_SLIDE_COUNT } from './slides';
import { startTour } from './tour';

const SWIPE_THRESHOLD_PX = 48;
const TITLE_ID = 'whats-new-title';
const NAV_BUTTON_CLASS =
  'tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-border tw-bg-surface-2 tw-text-ink-primary tw-transition-colors tw-duration-fast hover:enabled:tw-bg-surface-3 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-2 motion-reduce:tw-transition-none';

const { isOpen, dismiss, useAutoShow } = useIntro();
useAutoShow();

const activeIndex = ref(0);
const dialogRef = ref<HTMLElement | null>(null);
const touchStartX = ref<number | null>(null);
let returnFocusTo: HTMLElement | null = null;

const activeSlide = computed(() => INTRO_SLIDES[activeIndex.value]);
const isFirst = computed(() => activeIndex.value === 0);
const isLast = computed(() => activeIndex.value === INTRO_SLIDE_COUNT - 1);
const liveMessage = computed(
  () => `Feature ${activeIndex.value + 1} of ${INTRO_SLIDE_COUNT}: ${activeSlide.value.title}`,
);

useFocusTrap(dialogRef, isOpen);

watch(isOpen, async (open) => {
  if (open) {
    activeIndex.value = 0;
    returnFocusTo = document.activeElement as HTMLElement | null;
    return;
  }
  await nextTick();
  returnFocusTo?.focus?.();
  returnFocusTo = null;
});

function goTo(index: number) {
  activeIndex.value = Math.min(Math.max(index, 0), INTRO_SLIDE_COUNT - 1);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    void dismiss();
  } else if (event.key === 'ArrowRight') {
    goTo(activeIndex.value + 1);
  } else if (event.key === 'ArrowLeft') {
    goTo(activeIndex.value - 1);
  }
}

function onTouchStart(event: TouchEvent) {
  touchStartX.value = event.changedTouches[0]?.clientX ?? null;
}

function onTouchEnd(event: TouchEvent) {
  const startX = touchStartX.value;
  touchStartX.value = null;
  const endX = event.changedTouches[0]?.clientX;
  if (startX === null || endX === undefined) return;
  const delta = endX - startX;
  if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
  goTo(activeIndex.value + (delta < 0 ? 1 : -1));
}

async function showMeAround() {
  void dismiss();
  // Let the modal unmount (and release its focus trap) before the tour takes over.
  await nextTick();
  await startTour();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="whats-new tw-fixed tw-inset-0 tw-z-[60] tw-flex tw-items-center tw-justify-center tw-p-4 max-sm:tw-p-0"
      data-testid="whats-new-backdrop"
    >
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-roledescription="carousel"
        :aria-labelledby="TITLE_ID"
        data-testid="whats-new-modal"
        class="whats-new__panel tw-grid tw-overflow-hidden tw-rounded-2xl tw-border tw-border-hairline tw-bg-surface-1 tw-text-ink tw-shadow-elevated max-sm:tw-h-dvh max-sm:tw-w-screen max-sm:tw-max-w-none max-sm:tw-rounded-none max-sm:tw-border-0"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <div
          class="whats-new__stage tw-relative tw-min-h-0 tw-overflow-hidden tw-bg-surface-2"
          data-testid="whats-new-stage"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <IntroSlide
            v-for="(slide, index) in INTRO_SLIDES"
            v-show="index === activeIndex"
            :key="slide.id"
            :slide="slide"
            :load="index === activeIndex || index === activeIndex + 1"
            :playing="index === activeIndex"
          />
        </div>

        <div class="tw-flex tw-min-h-0 tw-flex-col tw-gap-3 tw-p-5 max-sm:tw-gap-2 max-sm:tw-p-4">
          <header class="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <h2
              :id="TITLE_ID"
              class="tw-m-0 tw-font-display tw-text-lg tw-font-normal tw-text-ink-primary"
            >
              What's new in V2
            </h2>
            <div class="tw-flex tw-items-center tw-gap-1">
              <button
                type="button"
                data-testid="whats-new-skip"
                class="tw-min-h-9 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2.5 tw-text-body-sm tw-text-ink-muted hover:tw-text-ink"
                @click="dismiss()"
              >
                Skip
              </button>
              <button
                type="button"
                data-testid="whats-new-close"
                aria-label="Close"
                class="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-ink-muted hover:tw-bg-surface-2 hover:tw-text-ink"
                @click="dismiss()"
              >
                <font-awesome-icon :icon="faXmark" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div class="tw-hidden tw-min-h-0 sm:tw-block">
            <FeatureList :slides="INTRO_SLIDES" :active-index="activeIndex" @select="goTo" />
          </div>

          <ol
            class="tw-m-0 tw-hidden tw-list-none tw-gap-1 tw-p-0 max-sm:tw-flex"
            aria-label="Progress"
            data-testid="whats-new-progress"
          >
            <li v-for="(slide, index) in INTRO_SLIDES" :key="slide.id" class="tw-flex-1">
              <button
                type="button"
                :aria-label="`Go to feature ${index + 1}: ${slide.title}`"
                :aria-current="index === activeIndex ? 'true' : undefined"
                class="tw-h-1.5 tw-w-full tw-rounded-full tw-border-0 tw-p-0"
                :class="index === activeIndex ? 'tw-bg-accent' : 'tw-bg-surface-3'"
                @click="goTo(index)"
              />
            </li>
          </ol>

          <section class="tw-mt-auto tw-flex tw-flex-col tw-gap-1" aria-live="polite">
            <h3
              class="tw-m-0 tw-text-base tw-font-semibold tw-text-ink-primary"
              data-testid="whats-new-slide-title"
            >
              {{ activeSlide.title }}
            </h3>
            <p
              class="tw-m-0 tw-text-body-sm tw-text-ink-muted"
              data-testid="whats-new-slide-description"
            >
              {{ activeSlide.description }}
            </p>
          </section>

          <div v-if="isLast" class="tw-flex tw-gap-2" data-testid="whats-new-final-actions">
            <button
              type="button"
              data-testid="whats-new-tour"
              class="tw-inline-flex tw-h-10 tw-flex-1 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-accent tw-px-3 tw-text-body-sm tw-font-semibold tw-text-canvas hover:tw-bg-accent-hover focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
              @click="showMeAround"
            >
              Show me around
            </button>
            <button
              type="button"
              data-testid="whats-new-done"
              class="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2 tw-px-4 tw-text-body-sm tw-font-semibold tw-text-ink hover:tw-border-accent/40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
              @click="dismiss()"
            >
              Done
            </button>
          </div>

          <footer
            class="tw-flex tw-items-center tw-justify-between tw-border-t tw-border-hairline tw-pt-3"
          >
            <span
              class="tw-text-body-sm tw-tabular-nums tw-text-ink-muted"
              data-testid="whats-new-counter"
              >{{ activeIndex + 1 }} / {{ INTRO_SLIDE_COUNT }}</span
            >
            <div class="tw-flex tw-gap-2">
              <button
                type="button"
                aria-label="Previous feature"
                data-testid="whats-new-prev"
                :disabled="isFirst"
                :class="NAV_BUTTON_CLASS"
                @click="goTo(activeIndex - 1)"
              >
                <font-awesome-icon :icon="faChevronLeft" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next feature"
                data-testid="whats-new-next"
                :disabled="isLast"
                :class="NAV_BUTTON_CLASS"
                @click="goTo(activeIndex + 1)"
              >
                <font-awesome-icon :icon="faChevronRight" aria-hidden="true" />
              </button>
            </div>
          </footer>
        </div>

        <p class="tw-sr-only" role="status" data-testid="whats-new-live">{{ liveMessage }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.whats-new {
  background: rgba(8, 6, 4, 0.72);
  backdrop-filter: blur(8px);
}

.whats-new__panel {
  width: min(1040px, 100%);
  height: min(620px, 100%);
  grid-template-columns: 62fr 38fr;
  outline: none;
}

@media (max-width: 639px) {
  .whats-new__panel {
    width: 100vw;
    height: 100dvh;
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 40%) minmax(0, 1fr);
  }
}
</style>
