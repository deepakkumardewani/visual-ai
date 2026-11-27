<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import AppModal from '@/components/AppModal.vue';
import LandingButton from '@/components/Landing/LandingButton.vue';
import { formatPlate } from '@/components/Home/showcaseLayout';
import { useShowcaseCopy } from '@/components/Home/useShowcaseCopy';
import { useTryPromptLink } from '@/components/Home/useTryPromptLink';
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
/**
 * One width for every image: the dialog never resizes as visitors page between
 * portrait, square and landscape plates; the image letterboxes inside instead.
 */
const DIALOG_WIDTH = '72rem';

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
    :max-width="DIALOG_WIDTH"
    :labelled-by="TITLE_ID"
    :described-by="PROMPT_ID"
    trap-focus
    @close="emit('close')"
  >
    <div v-if="item" class="home sd" data-lenis-prevent>
      <div class="sd__frame">
        <img :key="item.url" class="sd__img" :src="item.url" :alt="item.prompt" decoding="async" />
      </div>

      <div class="sd__side">
        <h2 :id="TITLE_ID" class="home-eyebrow sd__plate">
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
        </nav>
      </div>

      <p class="tw-sr-only" aria-live="polite">{{ announcement }}</p>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
/* `.home` brings the landing tokens into the teleported panel; the panel paints its own surface. */
/*
 * The dialog is one fixed size whatever the image's shape: a fixed media frame
 * the image letterboxes into, and a words column that scrolls on its own if a
 * prompt runs long, so neither can grow the panel.
 *
 * `--sd-chrome` is what AppModal adds around this body vertically: its body
 * padding (1.25rem + 1.5rem) and panel border (2 x 1px), rounded up so the
 * panel (capped at 92dvh) never needs its own scrollbar.
 */
.sd {
  --sd-chrome: 3rem;
  --sd-height: calc(92dvh - var(--sd-chrome));
  --sd-frame-height: 38dvh;

  display: grid;
  grid-template-rows: var(--sd-frame-height) minmax(0, 1fr);
  gap: var(--home-space-lg);
  box-sizing: border-box;
  height: var(--sd-height);
  /* Clears the modal's close button, which sits over the top-right corner. */
  padding-top: var(--home-space-xl);
  background: transparent;
}

.sd__frame {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: 10px;
  background-color: rgb(var(--tw-surface-2));
}

.sd__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sd__side {
  display: flex;
  flex-direction: column;
  gap: var(--home-space-md);
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* Room for focus rings, which the scroll container would otherwise clip. */
  padding-inline: var(--home-space-2xs);
}

.sd__total {
  color: rgb(var(--tw-ink-faint));
}

.sd__prompt {
  margin: 0;
  font-family: var(--home-font-display);
  font-size: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);
  line-height: 1.45;
  color: rgb(var(--tw-ink-primary));
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.sd__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--home-space-sm);
  align-items: center;
  margin-top: var(--home-space-xs);
}

.sd__copy {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--home-space-lg);
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  background: transparent;
  color: rgb(var(--tw-ink-primary));
  font: 600 var(--home-text-small) / 1 var(--home-font-body);
  cursor: pointer;
  transition: border-color 200ms var(--home-ease-out);

  &:hover {
    border-color: var(--home-copper);
  }
}

.sd__copy--copied {
  color: var(--home-gold);
  border-color: var(--home-gold);
}

.sd__copy--failed {
  color: var(--home-copper-text);
}

.sd__note {
  margin: 0;
  font-size: var(--home-text-small);
  line-height: 1.5;
  color: rgb(var(--tw-ink-muted));
}

.sd__nav {
  display: flex;
  gap: var(--home-space-xs);
  align-items: center;
  margin-top: auto;
  padding-top: var(--home-space-md);
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
    border-color 200ms var(--home-ease-out),
    color 200ms var(--home-ease-out);

  &:hover {
    border-color: var(--home-copper);
    color: rgb(var(--tw-ink-primary));
  }
}

/* Narrow screens stack the words under the image; pin paging to the column's foot so it is in view. */
@media (max-width: 899px) {
  .sd__nav {
    position: sticky;
    bottom: 0;
    z-index: 1;
    padding-bottom: var(--home-space-sm);
    background-color: rgb(var(--tw-surface-1));
  }
}

/* Wide screens: image and words side by side, the prompt column never wider than a reading line. */
@media (min-width: 900px) {
  .sd {
    --sd-height: min(40rem, calc(92dvh - var(--sd-chrome)));

    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr) 22rem;
    padding-top: 0;
  }

  .sd__side {
    padding-top: var(--home-space-xl);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sd__copy,
  .sd__step {
    transition: none;
  }
}
</style>
