<script setup lang="ts">
import type { IntroSlideData } from './slides';

defineProps<{
  slides: readonly IntroSlideData[];
  activeIndex: number;
}>();

defineEmits<{ select: [index: number] }>();
</script>

<template>
  <ol
    data-testid="intro-feature-list"
    aria-label="Features"
    class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-p-0"
  >
    <li v-for="(slide, index) in slides" :key="slide.id">
      <button
        type="button"
        :data-testid="`intro-feature-${index + 1}`"
        :aria-current="index === activeIndex ? 'true' : undefined"
        class="tw-flex tw-min-h-8 tw-w-full tw-items-center tw-gap-2.5 tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-left tw-text-body-sm tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
        :class="
          index === activeIndex
            ? 'tw-bg-accent-subtle tw-font-semibold tw-text-accent'
            : 'tw-bg-transparent tw-text-ink-muted hover:tw-bg-surface-2 hover:tw-text-ink'
        "
        @click="$emit('select', index)"
      >
        <span class="tw-w-4 tw-shrink-0 tw-text-caption tw-tabular-nums" aria-hidden="true">{{
          index + 1
        }}</span>
        <span class="tw-min-w-0 tw-truncate">{{ slide.title }}</span>
      </button>
    </li>
  </ol>
</template>
