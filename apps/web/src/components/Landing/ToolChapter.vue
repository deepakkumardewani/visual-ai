<script setup lang="ts">
import LandingButton from '@/components/Landing/LandingButton.vue';
import BeforeAfter from '@/components/Landing/BeforeAfter.vue';

import type { ToolChapter } from '@/utils/landing';

defineProps<{ tool: ToolChapter; index: number }>();
</script>

<template>
  <article class="chapter" :class="{ 'chapter--flip': index % 2 === 1 }">
    <div class="chapter__text">
      <p v-reveal class="chapter__eyebrow">
        <span class="chapter__num">{{ String(index + 1).padStart(2, '0') }}</span>
        {{ tool.eyebrow }}
      </p>
      <h3 v-reveal="{ delay: 0.05 }" class="chapter__title">{{ tool.title }}</h3>
      <p v-reveal="{ delay: 0.1 }" class="chapter__body">{{ tool.body }}</p>
      <ul class="chapter__points">
        <li
          v-for="(point, i) in tool.points"
          :key="point"
          v-reveal="{ delay: 0.15 + i * 0.06 }"
          class="chapter__point"
        >
          {{ point }}
        </li>
      </ul>
      <div v-reveal="{ delay: 0.3 }" class="chapter__cta">
        <LandingButton :to="tool.ctaTo" variant="ghost">{{ tool.ctaLabel }} →</LandingButton>
      </div>
    </div>

    <div v-reveal="{ y: 40 }" class="chapter__media">
      <BeforeAfter
        v-if="tool.media.kind === 'compare'"
        :before="tool.media.before"
        :after="tool.media.after"
      />
      <div v-else class="cluster">
        <img
          v-for="(src, i) in tool.media.images"
          :key="src"
          :src="src"
          :alt="`${tool.eyebrow} example ${i + 1}`"
          class="cluster__img"
          :class="`cluster__img--${i}`"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.chapter {
  max-width: 80rem;
  margin: 0 auto;
  /* Half the section rhythm — chapters stack inside one section, so gaps stay tight. */
  padding: clamp(2.5rem, 4vw, 4rem) 1.5rem;
  display: grid;
  gap: clamp(2rem, 5vw, 4.5rem);
  align-items: center;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;

    &--flip .chapter__text {
      order: 2;
    }
  }
}

.chapter__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d29467;
  margin-bottom: 1.25rem;
}
.chapter__num {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-muted));
  letter-spacing: 0;
}

.chapter__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: rgb(var(--tw-ink-primary));
  margin: 0;
}

.chapter__body {
  margin: 1.25rem 0 0;
  max-width: 34rem;
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgb(var(--tw-ink-muted));
}

.chapter__points {
  list-style: none;
  margin: 1.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.chapter__point {
  position: relative;
  padding-left: 1.5rem;
  font-size: 0.98rem;
  color: rgb(var(--tw-ink-primary));

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 7px;
    height: 7px;
    border-radius: 2px;
    background: #c98a5a;
    transform: rotate(45deg);
  }
}

.chapter__cta {
  margin-top: 2.25rem;
}

.cluster {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  grid-template-rows: repeat(2, 1fr);
  gap: 0.85rem;
  height: 100%;
}
.cluster__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid #3a2e22;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
}
.cluster__img--0 {
  grid-row: span 2;
}
</style>
