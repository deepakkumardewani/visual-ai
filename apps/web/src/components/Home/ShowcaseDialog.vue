<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import AppModal from '@/components/AppModal.vue';
import LandingButton from '@/components/Landing/LandingButton.vue';
import { aspectValue, formatPlate, toCssAspectRatio } from '@/components/LandingV2/showcaseLayout';
import { useShowcaseCopy } from '@/components/LandingV2/useShowcaseCopy';
import { useTryPromptLink } from '@/components/LandingV2/useTryPromptLink';
import { faChevronLeft, faChevronRight } from '@/plugins/icons';
import type { GalleryItem } from '@/utils/landing';

const props = defineProps<{
  /** The open image, or null when the dialog is closed. */
  item: GalleryItem | null;
  index: number;
  total: number;
}>();

const emit = defineEmits<{
  close: [];
  next: [];
  prev: [];
}>();

const TITLE_ID = 'showcase-dialog-title';
const PROMPT_ID = 'showcase-dialog-prompt';
/** Widest the dialog gets; landscape images fill it. */
const DIALOG_MAX_WIDTH = '72rem';
/**
 * Everything beside the image on wide screens: the words column (22rem), the
 * grid gap (1.5rem) and the modal body's side padding (2 x 1.5rem). Keep in
 * step with the wide-screen rules below and AppModal's body padding.
 */
const DIALOG_CHROME_WIDTH = '26.5rem';
/** The image's wide-screen height cap, mirrored from `.sd__img` below. */
const IMAGE_MAX_HEIGHT = 'min(62dvh, 44rem)';

const NOTE_SIGNED_IN =
  'Opens the studio with this prompt filled in. Nothing runs until you press Generate.';
const NOTE_SIGNED_OUT =
  'Sign in first, then the studio opens with this prompt filled in. Nothing runs until you press Generate.';

const isOpen = computed(() => props.item !== null);
const prompt = computed(() => props.item?.prompt ?? '');
const { href: tryLink, isSignedIn } = useTryPromptLink(prompt);
const tryNote = computed(() => (isSignedIn.value ? NOTE_SIGNED_IN : NOTE_SIGNED_OUT));
const { state: copyState, label: copyLabel, copy, reset: resetCopy } = useShowcaseCopy();
const announcement = ref('');

/** The panel hugs a portrait image instead of centring it in an empty 72rem panel. */
const dialogWidth = computed(() => {
  if (!props.item) return DIALOG_MAX_WIDTH;
  const ratio = aspectValue(props.item.aspectRatio);
  return `min(${DIALOG_MAX_WIDTH}, calc(${IMAGE_MAX_HEIGHT} * ${ratio} + ${DIALOG_CHROME_WIDTH}))`;
});

/**
 * Paging swaps the image while focus stays on Next, so tell screen readers
 * what arrived, and drop "Copied" feedback that belonged to the last prompt.
 */
watch(
  () => props.item,
  (next, previous) => {
    resetCopy();
    announcement.value =
      next && previous ? `Image ${props.index + 1} of ${props.total}. ${next.prompt}` : '';
  },
);

/** Arrow keys page through the showcase; a modifier means the visitor wants something else. */
function onArrow(event: KeyboardEvent, direction: 'next' | 'prev'): void {
  if (!isOpen.value || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  if (direction === 'next') emit('next');
  else emit('prev');
}

onKeyStroke('ArrowRight', (event) => onArrow(event, 'next'));
onKeyStroke('ArrowLeft', (event) => onArrow(event, 'prev'));
</script>

<template>
  <AppModal
    :open="isOpen"
    :max-width="dialogWidth"
    :labelled-by="TITLE_ID"
    :described-by="PROMPT_ID"
    trap-focus
    @close="emit('close')"
  >
    <div v-if="item" class="lv2 sd" data-lenis-prevent>
      <div class="sd__frame">
        <img
          :key="item.url"
          class="sd__img"
          :src="item.url"
          :alt="item.prompt"
          :style="{ aspectRatio: toCssAspectRatio(item.aspectRatio) }"
          decoding="async"
        />
      </div>

      <div class="sd__side">
        <h2 :id="TITLE_ID" class="lv2-eyebrow sd__plate">
          No. {{ formatPlate(index) }}
          <span class="sd__total">/ {{ formatPlate(total - 1) }}</span>
        </h2>
        <p :id="PROMPT_ID" class="sd__prompt">{{ item.prompt }}</p>

        <div class="sd__actions">
          <LandingButton :to="tryLink" variant="primary">Try this prompt</LandingButton>
          <button
            type="button"
            class="sd__copy"
            :class="`sd__copy--${copyState}`"
            @click="copy(item.prompt)"
          >
            {{ copyLabel }}
          </button>
        </div>
        <p class="sd__note">{{ tryNote }}</p>

        <nav class="sd__nav" aria-label="Showcase images">
          <button type="button" class="sd__step" aria-label="Previous image" @click="emit('prev')">
            <font-awesome-icon :icon="faChevronLeft" aria-hidden="true" />
          </button>
          <button type="button" class="sd__step" aria-label="Next image" @click="emit('next')">
            <font-awesome-icon :icon="faChevronRight" aria-hidden="true" />
          </button>
          <span class="sd__hint" aria-hidden="true">Arrow keys also work</span>
        </nav>
      </div>

      <p class="tw-sr-only" aria-live="polite">{{ announcement }}</p>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
/* `.lv2` brings the landing tokens into the teleported panel; the panel paints its own surface. */
.sd {
  display: grid;
  gap: var(--lv2-space-lg);
  /* Clears the modal's close button, which sits over the top-right corner. */
  padding-top: var(--lv2-space-xl);
  background: transparent;
  overflow: visible;
}

.sd__frame {
  display: grid;
  place-items: center;
  min-width: 0;
}

.sd__img {
  display: block;
  max-width: 100%;
  /* Narrow screens stack the words under the image; keep the actions above the fold. */
  max-height: 42dvh;
  width: auto;
  height: auto;
  border-radius: 10px;
  background-color: rgb(var(--tw-surface-2));
  object-fit: contain;
}

.sd__side {
  display: flex;
  flex-direction: column;
  gap: var(--lv2-space-md);
  min-width: 0;
}

.sd__total {
  color: rgb(var(--tw-ink-faint));
}

.sd__prompt {
  margin: 0;
  font-family: var(--lv2-font-display);
  font-size: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);
  line-height: 1.45;
  color: rgb(var(--tw-ink-primary));
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.sd__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lv2-space-sm);
  align-items: center;
  margin-top: var(--lv2-space-xs);
}

.sd__copy {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--lv2-space-lg);
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  background: transparent;
  color: rgb(var(--tw-ink-primary));
  font: 600 var(--lv2-text-small) / 1 var(--lv2-font-body);
  cursor: pointer;
  transition: border-color 200ms var(--lv2-ease-out);

  &:hover {
    border-color: var(--lv2-copper);
  }
}

.sd__copy--copied {
  color: var(--lv2-gold);
  border-color: var(--lv2-gold);
}

.sd__copy--failed {
  color: var(--lv2-copper-text);
}

.sd__note {
  margin: 0;
  font-size: var(--lv2-text-small);
  line-height: 1.5;
  color: rgb(var(--tw-ink-muted));
}

.sd__nav {
  display: flex;
  gap: var(--lv2-space-xs);
  align-items: center;
  margin-top: auto;
  padding-top: var(--lv2-space-md);
  border-top: 1px solid rgb(var(--tw-hairline));
}

.sd__step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  background: transparent;
  color: rgb(var(--tw-ink-secondary));
  cursor: pointer;
  transition:
    border-color 200ms var(--lv2-ease-out),
    color 200ms var(--lv2-ease-out);

  &:hover {
    border-color: var(--lv2-copper);
    color: rgb(var(--tw-ink-primary));
  }
}

.sd__hint {
  margin-left: var(--lv2-space-xs);
  font-size: var(--lv2-text-label);
  color: rgb(var(--tw-ink-faint));
}

@media (hover: none) {
  .sd__hint {
    display: none;
  }
}

/* Narrow screens stack the words under the image; pin paging to the panel's foot so it is in view. */
@media (max-width: 899px) {
  .sd__nav {
    position: sticky;
    bottom: 0;
    z-index: 1;
    padding-bottom: var(--lv2-space-sm);
    background-color: rgb(var(--tw-surface-1));
  }
}

/* Wide screens: image and words side by side, the prompt column never wider than a reading line. */
@media (min-width: 900px) {
  .sd {
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
    align-items: stretch;
    padding-top: 0;
  }

  .sd__side {
    padding-top: var(--lv2-space-xl);
  }

  .sd__img {
    max-height: min(62dvh, 44rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sd__copy,
  .sd__step {
    transition: none;
  }
}
</style>
