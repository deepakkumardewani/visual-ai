<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { FeatureType, type IImage, type IImageObject } from '@/types';

import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { groupByDate } from '@/pages/utils';

import ImageDialog from '@/components/Dialogs/ImageDialog.vue';
import ImageActionButtons from '@/components/History/ImageActionButtons.vue';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const asideStore = useAsideStore();
const generateStore = useGenerateStore();

const { history } = storeToRefs(userStore);
const { typingPrompt, aspectRatio, noOfOutputs } = storeToRefs(asideStore);
const { isLoading, activePrompt, errMsg } = storeToRefs(generateStore);

const imageDialogItem = ref<IImageObject | undefined>();

const imageHistory = computed(() =>
  history.value
    .filter((item) => item.featureType === FeatureType.IMAGE)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
);

const groupedHistory = computed(() => groupByDate(imageHistory.value.slice()));

const pendingTiles = computed(() => Array.from({ length: noOfOutputs.value }, (_, i) => i));

/**
 * The single row whose tiles should reveal-in: the one that was just added
 * by the generation that finished. Every other row — including everything
 * present at mount — is never "fresh", so only that one row's images animate.
 */
const freshRowId = ref<string | null>(null);

watch(isLoading, (loading, wasLoading) => {
  if (wasLoading && !loading) {
    freshRowId.value = imageHistory.value[0]?._id ?? null;
  }
});

function settleFreshRow() {
  freshRowId.value = null;
}

const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;

function getImageUrl(image: IImage): string {
  if (image.aiImagePublicId) {
    return `${cloudinaryBaseUrl}/q_auto,f_auto/${image.aiImagePublicId}`;
  }
  return image.aiImageUrl ?? '';
}

/** "3:2" → "3 / 2" for the CSS aspect-ratio property. */
function cssAspect(ratio: string | undefined): string {
  if (!ratio?.includes(':')) return '1 / 1';
  return ratio.replace(':', ' / ');
}

function tileAspect(item: IImageObject): string {
  return cssAspect(item.images[0]?.aspectRatio);
}

function dimensions(item: IImageObject): string {
  const first = item.images[0];
  return first?.width && first?.height ? `${first.width}×${first.height}` : '';
}

function generationTime(item: IImageObject): string {
  return new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function showImage(item: IImageObject) {
  imageDialogItem.value = item;
  dialogStore.showImage(item._id);
}

function onTileKeydown(event: KeyboardEvent, item: IImageObject) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    showImage(item);
  }
}

function handleRemix(prompt: string) {
  typingPrompt.value = prompt;
}
</script>

<template>
  <section data-testid="user-generations-grid" aria-label="Your generations" class="creations-grid">
    <header class="tw-mb-8 tw-flex tw-items-baseline tw-gap-2.5">
      <h2 class="tw-text-lg tw-font-semibold tw-tracking-tight tw-text-ink">Your creations</h2>
      <span
        class="tw-rounded-full tw-bg-surface-2 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-ink-muted"
      >
        {{ imageHistory.length }}
      </span>
    </header>

    <div
      v-if="errMsg"
      data-testid="generation-error"
      role="alert"
      class="tw-mb-5 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-card tw-border tw-border-red-500/30 tw-bg-red-500/10 tw-px-4 tw-py-3 tw-text-sm tw-text-ink"
    >
      <span>{{ errMsg }}</span>
      <button
        type="button"
        class="tw-shrink-0 tw-text-ink-muted hover:tw-text-ink"
        aria-label="Dismiss error"
        @click="errMsg = ''"
      >
        <font-awesome-icon icon="xmark" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      </button>
    </div>

    <div
      v-if="!isLoading && imageHistory.length === 0"
      data-testid="empty-creations"
      class="tw-flex tw-flex-col tw-items-start tw-gap-1.5 tw-rounded-card tw-border tw-border-dashed tw-border-hairline tw-px-6 tw-py-10"
    >
      <p class="tw-text-sm tw-font-medium tw-text-ink">Nothing here yet</p>
      <p class="tw-text-sm tw-text-ink-muted">
        Describe an idea in the prompt bar above and your creations will appear here.
      </p>
    </div>

    <div class="creations-stack">
      <!-- Pending generation: appears in place, above previous creations -->
      <article
        v-if="isLoading"
        data-testid="pending-generation-row"
        aria-live="polite"
        class="generation-row"
      >
        <div class="tw-mb-3 tw-flex tw-items-center tw-gap-2 tw-text-sm">
          <span class="pending-dot" aria-hidden="true" />
          <span class="tw-font-medium tw-text-ink">
            Generating {{ noOfOutputs }} {{ noOfOutputs === 1 ? 'image' : 'images' }}
          </span>
          <span class="tw-min-w-0 tw-truncate tw-text-ink-muted">{{ activePrompt }}</span>
        </div>
        <div class="generation-tiles">
          <div
            v-for="i in pendingTiles"
            :key="i"
            data-testid="pending-tile"
            class="pending-tile tw-rounded-card"
            :style="{ aspectRatio: cssAspect(aspectRatio.title), animationDelay: `${-i * 1.9}s` }"
          >
            <font-awesome-icon
              icon="wand-magic-sparkles"
              class="pending-tile__icon"
              aria-hidden="true"
            />
          </div>
        </div>
      </article>

      <section
        v-for="group in groupedHistory"
        :key="group.title"
        data-testid="generation-date-group"
        class="date-group"
      >
        <h3 class="date-group__title">
          {{ group.title }}
        </h3>

        <div class="date-group__rows">
          <article
            v-for="item in group.data"
            :key="item._id"
            data-testid="user-generation-card"
            class="generation-row"
            :class="{ 'generation-row--fresh': item._id === freshRowId }"
            @animationend="settleFreshRow"
          >
            <!-- Primary: images are the hero -->
            <div class="generation-tiles">
              <div
                v-for="(img, index) in item.images"
                :key="img._id || img.name || index"
                role="button"
                tabindex="0"
                class="generation-tile tw-group tw-relative tw-overflow-hidden tw-rounded-card tw-bg-surface-2 tw-ring-1 tw-ring-hairline/60 tw-transition-shadow tw-duration-fast hover:tw-shadow-elevated hover:tw-ring-accent/40 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
                :style="{ aspectRatio: tileAspect(item), animationDelay: `${index * 90}ms` }"
                :aria-label="`View image ${index + 1} of ${item.images.length}: ${item.prompt.slice(0, 60)}`"
                @click="showImage(item)"
                @keydown="onTileKeydown($event, item)"
              >
                <img
                  v-if="getImageUrl(img)"
                  :src="getImageUrl(img)"
                  :alt="item.prompt.slice(0, 80)"
                  loading="lazy"
                  class="tw-h-full tw-w-full tw-object-cover tw-transition-transform tw-duration-base tw-ease-soft group-hover:tw-scale-[1.03] motion-reduce:tw-transition-none motion-reduce:group-hover:tw-scale-100"
                />

                <div class="tile-overlay tw-pointer-events-none tw-absolute tw-inset-0">
                  <div
                    class="tw-absolute tw-inset-x-0 tw-top-0 tw-h-16 tw-bg-gradient-to-b tw-from-black/45 tw-to-transparent"
                  />
                  <div
                    class="tw-pointer-events-auto tw-absolute tw-right-2 tw-top-2 tw-flex tw-flex-col tw-gap-1.5"
                    @click.stop
                  >
                    <ImageActionButtons :item="item" :image-index="index" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Secondary: prompt + remix -->
            <div class="generation-caption tw-mt-3">
              <div class="tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-3">
                <p class="generation-prompt" :title="item.prompt">
                  {{ item.prompt }}
                </p>
                <button
                  type="button"
                  class="remix-btn tw-shrink-0 tw-rounded-sm tw-px-1.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 hover:tw-text-accent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent"
                  :aria-label="`Remix prompt: ${item.prompt.slice(0, 60)}`"
                  @click="handleRemix(item.prompt)"
                >
                  <font-awesome-icon icon="rotate-right" class="tw-mr-1 tw-h-2.5 tw-w-2.5" />
                  Remix
                </button>
              </div>

              <!-- Tertiary: quiet meta line -->
              <p class="generation-meta">
                <span>{{ item.modelName }}</span>
                <template v-if="dimensions(item)">
                  <span class="generation-meta__sep" aria-hidden="true">·</span>
                  <span>{{ dimensions(item) }}</span>
                </template>
                <span class="generation-meta__sep" aria-hidden="true">·</span>
                <span>{{ generationTime(item) }}</span>
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>

    <ImageDialog :item="imageDialogItem" />
  </section>
</template>

<style scoped lang="scss">
.creations-grid {
  padding: 1.5rem 2.5rem 3rem;
}

.creations-stack {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.date-group {
  padding-bottom: 0.5rem;
}

.date-group + .date-group {
  margin-top: 2.75rem;
  padding-top: 2.25rem;
  border-top: 1px solid rgb(var(--tw-hairline) / 0.75);
}

.date-group__title {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: rgb(var(--tw-ink));
}

.date-group__rows {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.generation-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.generation-tile {
  cursor: pointer;
}

/* Overlay chrome appears on hover, focus, or always on touch */
.tile-overlay {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.generation-tile:hover .tile-overlay,
.generation-tile:focus-within .tile-overlay {
  opacity: 1;
}

@media (hover: none) {
  .tile-overlay {
    opacity: 1;
  }
}

/* Secondary caption sits tight under the images */
.generation-prompt {
  margin: 0;
  min-width: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 0.875rem;
  line-height: 1.45;
  color: rgb(var(--tw-ink));
}

.generation-meta {
  margin: 0.375rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: rgb(var(--tw-ink-faint));
}

.generation-meta__sep {
  margin-inline: 0.35rem;
}

/* Generous separation between generations; tight within a row */
.generation-row + .generation-row {
  padding-top: 2rem;
  border-top: 1px solid rgb(var(--tw-hairline) / 0.55);
}

/* Only the row that just finished generating reveals its tiles */
.generation-row--fresh .generation-tile {
  animation: tile-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes tile-reveal {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (hover: hover) {
  .remix-btn {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .generation-row:hover .remix-btn,
  .remix-btn:focus-visible {
    opacity: 1;
  }
}

/* --- Pending tiles --- */
.pending-dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: #c98a5a;
  animation: pending-pulse 2.4s ease-in-out infinite;
}

.pending-tile {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--tw-surface-2));
  box-shadow: inset 0 0 0 1px rgb(var(--tw-hairline) / 0.5);

  &::before {
    content: '';
    position: absolute;
    top: -20%;
    left: -20%;
    width: 75%;
    aspect-ratio: 1;
    border-radius: 9999px;
    background: radial-gradient(circle, rgba(201, 138, 90, 0.16), transparent 70%);
    filter: blur(28px);
    animation: pending-drift 7s ease-in-out infinite alternate;
    animation-delay: inherit;
  }
}

.pending-tile__icon {
  position: relative;
  width: 1.1rem;
  height: 1.1rem;
  color: rgba(201, 138, 90, 0.5);
  animation: pending-pulse 2.4s ease-in-out infinite;
  animation-delay: inherit;
}

@keyframes pending-drift {
  from {
    transform: translate(0, 0);
    opacity: 0.65;
  }
  to {
    transform: translate(150%, 130%);
    opacity: 1;
  }
}

@keyframes pending-pulse {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .generation-row--fresh .generation-tile,
  .pending-tile::before,
  .pending-tile__icon,
  .pending-dot {
    animation: none;
  }
}
</style>
