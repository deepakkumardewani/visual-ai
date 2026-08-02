<script setup lang="ts">
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { computed } from 'vue';

import type { ExploreFeedItem } from '@/types';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { getAuthorAvatarColor } from '@/utils/authorAvatarColor';

const props = defineProps<{
  item: ExploreFeedItem;
}>();

const emit = defineEmits<{
  remix: [prompt: string];
  open: [id: string];
}>();

const { imageHoverZoom, interactiveTransition, pressable } = useDashboardMotion();

const aspectRatioStyle = computed(() => {
  const [width, height] = props.item.aspectRatio.split(':').map(Number);
  if (!width || !height) return '3 / 4';
  return `${width} / ${height}`;
});

const imageAlt = computed(
  () => `Community generation by ${props.item.author}: ${props.item.prompt.slice(0, 80)}`,
);

const authorInitials = computed(() => {
  const parts = props.item.author.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
});

const avatarColor = computed(() =>
  getAuthorAvatarColor(props.item.authorUserId || props.item.author),
);

function handleRemix(event: MouseEvent) {
  event.stopPropagation();
  emit('remix', props.item.prompt);
}

function handleOpen() {
  emit('open', props.item.id);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleOpen();
  }
}
</script>

<template>
  <article
    data-testid="community-card"
    class="community-card tw-group tw-relative tw-mb-2 tw-cursor-pointer tw-break-inside-avoid tw-overflow-hidden tw-rounded-card focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-2 focus-within:tw-ring-2 focus-within:tw-ring-accent/50"
    tabindex="0"
    :aria-label="`Open creation by ${item.author}`"
    @click="handleOpen"
    @keydown="handleKeydown"
  >
    <div class="tw-relative tw-overflow-hidden" :style="{ aspectRatio: aspectRatioStyle }">
      <img
        :src="item.imageUrl"
        :alt="imageAlt"
        loading="lazy"
        decoding="async"
        class="tw-h-full tw-w-full tw-object-cover"
        :class="imageHoverZoom"
      />

      <!-- Full-card dim + bottom gradient for text contrast -->
      <div
        class="community-card__veil tw-pointer-events-none tw-absolute tw-inset-0"
        aria-hidden="true"
      />
      <div
        class="community-card__scrim tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-28"
        aria-hidden="true"
      />

      <div
        class="community-card__meta tw-absolute tw-inset-x-0 tw-top-0 tw-flex tw-items-center tw-gap-1.5 tw-p-2"
      >
        <span
          class="tw-flex tw-h-6 tw-w-6 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-eyebrow tw-font-semibold tw-text-canvas tw-ring-1 tw-ring-hairline/40"
          :style="{ backgroundColor: avatarColor }"
          aria-hidden="true"
        >
          {{ authorInitials }}
        </span>
        <p
          class="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-text-ink"
          :title="item.author"
        >
          {{ item.author }}
        </p>
      </div>

      <div
        class="community-card__meta tw-absolute tw-inset-x-0 tw-bottom-0 tw-flex tw-flex-col tw-items-center tw-gap-1.5 tw-px-2.5 tw-pb-2.5 tw-pt-6"
      >
        <p
          class="tw-line-clamp-2 tw-w-full tw-text-center tw-text-eyebrow tw-leading-snug tw-text-ink"
          :title="item.prompt"
        >
          {{ item.prompt }}
        </p>

        <button
          type="button"
          data-testid="community-remix-button"
          class="tw-inline-flex tw-h-8 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1 tw-rounded-full tw-bg-accent tw-px-3 tw-text-eyebrow tw-font-semibold tw-text-canvas hover:tw-brightness-110 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
          :class="[interactiveTransition, pressable]"
          :aria-label="`Remix prompt by ${item.author}`"
          :title="item.modelName || undefined"
          @click="handleRemix"
        >
          <font-awesome-icon
            :icon="faWandMagicSparkles"
            class="tw-text-eyebrow"
            aria-hidden="true"
          />
          Remix
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.community-card__veil {
  background: rgb(var(--tw-canvas) / 0.45);
  opacity: 0;
  transition: opacity 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

.community-card__scrim {
  background: linear-gradient(
    to top,
    rgb(var(--tw-canvas) / 0.85),
    rgb(var(--tw-canvas) / 0.35),
    transparent
  );
  opacity: 0;
  transition: opacity 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

.community-card__meta {
  opacity: 0;
  transition: opacity 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

.community-card:hover .community-card__veil,
.community-card:focus-within .community-card__veil {
  opacity: 1;
}

.community-card:hover .community-card__scrim,
.community-card:focus-within .community-card__scrim {
  opacity: 1;
}

.community-card:hover .community-card__meta,
.community-card:focus-within .community-card__meta {
  opacity: 1;
}

/* Touch / coarse pointers: keep overlays readable without hover */
@media (hover: none), (pointer: coarse) {
  .community-card__veil {
    opacity: 0.55;
  }

  .community-card__scrim {
    opacity: 1;
  }

  .community-card__meta {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .community-card__veil,
  .community-card__scrim,
  .community-card__meta {
    transition: none;
  }
}
</style>
