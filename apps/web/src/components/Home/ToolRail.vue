<script setup lang="ts">
import type { ToolChapter } from '@/utils/landing';

import { chapterNumber } from '@/components/Home/toolsMedia';

defineProps<{
  tools: readonly ToolChapter[];
  active: number;
}>();
</script>

<!-- 01 to 05 progress rail. The fill line is scaled by the stage timeline. -->
<template>
  <div class="rail">
    <ol class="rail__list" :style="{ '--rail-steps': tools.length }">
      <li
        v-for="(tool, index) in tools"
        :key="tool.id"
        class="rail__step"
        :class="{ 'rail__step--active': index === active, 'rail__step--done': index < active }"
        :aria-current="index === active ? 'step' : undefined"
      >
        <span class="rail__number">{{ chapterNumber(index) }}</span>
        <span class="visually-hidden">{{ tool.eyebrow }}</span>
      </li>
    </ol>
    <div class="rail__track" aria-hidden="true">
      <span class="rail__fill" data-rail-fill></span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rail {
  display: flex;
  flex-direction: column;
  gap: var(--home-space-sm);
}

.rail__list {
  /* Equal columns, so each number sits over its own fifth of the progress line. */
  display: grid;
  grid-template-columns: repeat(var(--rail-steps), minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.rail__step {
  color: rgb(var(--tw-ink-faint));
  transition: color 0.4s var(--home-ease-out);
}

.rail__step--done {
  color: rgb(var(--tw-ink-muted));
}

.rail__step--active {
  color: rgb(var(--tw-ink-primary));
}

.rail__number {
  font-family: var(--home-font-display);
  font-size: var(--home-text-body);
  font-variant-numeric: tabular-nums;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.rail__track {
  position: relative;
  height: 1px;
  overflow: hidden;
  background-color: rgb(var(--tw-hairline));
}

.rail__fill {
  position: absolute;
  inset: 0;
  background-color: var(--home-copper);
  transform-origin: left center;
}
</style>
