<script setup lang="ts">
import { faHeart, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";

import { useDashboardMotion } from "@/composables/useDashboardMotion";

import type { CommunityFeedItem } from "@/utils/communityMock";

const props = defineProps<{
  item: CommunityFeedItem;
}>();

const emit = defineEmits<{
  remix: [prompt: string];
}>();

const { cardHover, imageHoverZoom, interactiveTransition, pressable } = useDashboardMotion();

const aspectRatioStyle = computed(() => {
  const [width, height] = props.item.aspectRatio.split(":").map(Number);
  if (!width || !height) return "3 / 4";
  return `${width} / ${height}`;
});

const imageAlt = computed(
  () => `Community generation by ${props.item.author}: ${props.item.prompt.slice(0, 80)}`,
);

function handleRemix() {
  emit("remix", props.item.prompt);
}
</script>

<template>
  <article
    data-testid="community-card"
    class="tw-group tw-break-inside-avoid tw-overflow-hidden tw-rounded-card tw-border tw-border-surface-3/60 tw-bg-surface-1 tw-shadow-card"
    :class="cardHover"
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
    </div>

    <div class="tw-flex tw-items-center tw-gap-3 tw-p-3">
      <div class="tw-min-w-0 tw-flex-1">
        <p class="tw-truncate tw-text-sm tw-font-medium tw-text-ink" :title="item.author">
          {{ item.author }}
        </p>
        <p
          class="tw-mt-0.5 tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-ink-muted"
          :aria-label="`${item.likes} likes`"
        >
          <font-awesome-icon :icon="faHeart" class="tw-text-accent" aria-hidden="true" />
          <span>{{ item.likes.toLocaleString() }}</span>
        </p>
      </div>

      <button
        type="button"
        data-testid="community-remix-button"
        class="tw-inline-flex tw-min-h-11 tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-chip tw-bg-surface-2 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-ink hover:tw-bg-surface-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        :class="[interactiveTransition, pressable]"
        :aria-label="`Remix prompt by ${item.author}`"
        @click="handleRemix"
      >
        <font-awesome-icon :icon="faWandMagicSparkles" aria-hidden="true" />
        Remix
      </button>
    </div>
  </article>
</template>
