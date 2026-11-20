<script setup lang="ts">
import type { ToolChapter } from '@/utils/landing';

import LandingButton from '@/components/Landing/LandingButton.vue';

import { chapterNumber } from '@/components/LandingV2/toolsMedia';

defineProps<{
  tool: ToolChapter;
  index: number;
}>();
</script>

<template>
  <div class="chapter-copy">
    <p class="lv2-eyebrow chapter-copy__eyebrow">
      <span class="chapter-copy__number">{{ chapterNumber(index) }}</span>
      {{ tool.eyebrow }}
    </p>
    <h3 class="chapter-copy__title">{{ tool.title }}</h3>
    <p class="chapter-copy__body">{{ tool.body }}</p>
    <ul class="chapter-copy__points">
      <li v-for="point in tool.points" :key="point" class="chapter-copy__point">{{ point }}</li>
    </ul>
    <LandingButton class="chapter-copy__cta" :to="tool.ctaTo" variant="ghost">
      {{ tool.ctaLabel }}
    </LandingButton>
  </div>
</template>

<style scoped lang="scss">
.chapter-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.chapter-copy__eyebrow {
  display: flex;
  gap: var(--lv2-space-sm);
}

.chapter-copy__number {
  color: rgb(var(--tw-ink-faint));
}

.chapter-copy__title {
  margin: var(--lv2-space-md) 0 0;
  font-family: var(--lv2-font-display);
  font-weight: 400;
  font-size: var(--lv2-text-display);
  line-height: var(--lv2-leading-display);
  letter-spacing: var(--lv2-tracking-display);
  color: rgb(var(--tw-ink-primary));
  text-wrap: balance;
}

.chapter-copy__body {
  margin: var(--lv2-space-lg) 0 0;
  max-width: 34rem;
  font-size: var(--lv2-text-body);
  line-height: var(--lv2-leading-body);
  color: rgb(var(--tw-ink-muted));
  text-wrap: pretty;
}

.chapter-copy__points {
  display: flex;
  flex-direction: column;
  margin: var(--lv2-space-lg) 0 0;
  padding: 0;
  /* Body width, so the hairlines are one length in every chapter instead of each list's longest line. */
  align-self: stretch;
  max-width: 34rem;
  list-style: none;
}

.chapter-copy__point {
  padding: var(--lv2-space-xs) 0;
  border-top: 1px solid rgb(var(--tw-hairline));
  font-size: var(--lv2-text-small);
  line-height: 1.5;
  color: rgb(var(--tw-ink-secondary));
}

.chapter-copy__cta {
  margin-top: var(--lv2-space-xl);
}
</style>
