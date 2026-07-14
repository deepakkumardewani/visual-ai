<script lang="ts" setup>
import { SHOWCASE } from '@/utils/landing';

const STRIP_ITEMS = SHOWCASE.slice(0, 10);
const LOOP = [...STRIP_ITEMS, ...STRIP_ITEMS];
</script>

<template>
  <section class="strip" aria-label="Sample generations">
    <div class="strip__track">
      <figure v-for="(item, i) in LOOP" :key="i" class="strip__print">
        <img
          :src="item.url"
          :alt="item.prompt"
          class="strip__img"
          loading="lazy"
          decoding="async"
        />
        <figcaption class="strip__caption">“{{ item.prompt }}”</figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped lang="scss">
.strip {
  position: relative;
  z-index: 1;
  padding: clamp(2rem, 5vw, 3.5rem) 0;
  border-bottom: 1px solid rgb(var(--tw-border));
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}

.strip__track {
  display: flex;
  gap: 1.25rem;
  width: max-content;
  animation: strip-marquee 45s linear infinite;
}

.strip:hover .strip__track {
  animation-play-state: paused;
}

.strip__print {
  margin: 0;
  width: 13rem;
  flex-shrink: 0;
  background: rgb(var(--tw-surface-1));
  border: 1px solid rgb(var(--tw-border));
  border-radius: 4px;
  padding: 0.6rem 0.6rem 0.8rem;
  transform: rotate(-1deg);
  transition: transform 0.25s ease;
}

.strip__print:nth-child(even) {
  transform: rotate(1.2deg);
}

.strip__print:hover {
  transform: rotate(0deg) translateY(-6px);
}

.strip__img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 2px;
}

.strip__caption {
  margin-top: 0.6rem;
  font-family: 'Young Serif', Georgia, serif;
  font-style: italic;
  font-size: 0.78rem;
  color: rgb(var(--tw-ink-muted));
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes strip-marquee {
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .strip__track {
    animation: none;
  }
}
</style>
