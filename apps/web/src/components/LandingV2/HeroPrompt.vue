<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  prompt: string;
  /** How many characters are shown as typed. The full prompt is always in the DOM. */
  typed: number;
}>();

const typedText = computed(() => props.prompt.slice(0, props.typed));
const restText = computed(() => props.prompt.slice(props.typed));
const isTyping = computed(() => props.typed < props.prompt.length);
</script>

<template>
  <div class="prompt">
    <p class="prompt__label lv2-eyebrow">Prompt</p>
    <p class="prompt__text">
      <span class="tw-sr-only">{{ prompt }}</span>
      <!-- Untyped text stays in place, transparent, so the bar never changes size while typing. -->
      <span aria-hidden="true">
        <span>{{ typedText }}</span>
        <span class="prompt__caret" :class="{ 'prompt__caret--typing': isTyping }"></span>
        <span class="prompt__rest">{{ restText }}</span>
      </span>
    </p>
  </div>
</template>

<style scoped lang="scss">
.prompt {
  display: grid;
  gap: var(--lv2-space-xs);
  max-width: 34rem;
  padding: var(--lv2-space-md) var(--lv2-space-lg) var(--lv2-space-md) var(--lv2-space-md);
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 12px;
  background-color: rgb(var(--tw-surface-1) / 0.82);
}

.prompt__label {
  font-size: 0.68rem;
}

.prompt__text {
  margin: 0;
  font-size: var(--lv2-text-small);
  line-height: 1.6;
  color: rgb(var(--tw-ink-secondary));
}

.prompt__rest {
  color: transparent;
}

/* Zero-width so the caret never pushes text around. */
.prompt__caret {
  position: relative;
  display: inline-block;
  width: 0;
  height: 1em;
  vertical-align: text-bottom;

  &::after {
    content: '';
    position: absolute;
    left: 1px;
    top: 0.05em;
    width: 2px;
    height: 1.05em;
    background-color: var(--lv2-copper);
    opacity: 0;
  }
}

.prompt__caret--typing::after {
  opacity: 1;
}

@media (prefers-reduced-motion: no-preference) {
  .prompt__caret::after {
    animation: caret-fade 1.1s steps(1, end) 3;
  }

  .prompt__caret--typing::after {
    animation: none;
  }
}

@keyframes caret-fade {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
