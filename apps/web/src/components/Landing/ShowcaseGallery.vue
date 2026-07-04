<script setup lang="ts">
import LandingButton from '@/components/Landing/LandingButton.vue';

import { SHOWCASE } from '@/utils/landing';
</script>

<template>
  <section id="showcase" class="showcase">
    <div class="showcase__head">
      <p v-reveal class="eyebrow">Showcase</p>
      <h2 v-reveal="{ delay: 0.05 }" class="showcase__title">Made with Visual AI.</h2>
      <p v-reveal="{ delay: 0.1 }" class="showcase__sub">
        A small slice of what creators have generated — real prompts, untouched output.
      </p>
    </div>

    <div class="wall">
      <figure v-for="item in SHOWCASE" :key="item.url" class="tile">
        <img :src="item.url" :alt="item.prompt" class="tile__img" loading="lazy" decoding="async" />
        <figcaption class="tile__overlay">
          <span class="tile__prompt">{{ item.prompt }}</span>
        </figcaption>
      </figure>
    </div>

    <div v-reveal class="showcase__foot">
      <LandingButton to="/gallery" variant="ghost">Explore the full gallery →</LandingButton>
    </div>
  </section>
</template>

<style scoped lang="scss">
.showcase {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: clamp(4rem, 8vw, 7rem) 1.5rem;
}

.showcase__head {
  max-width: 40rem;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
}
.showcase__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 1rem 0 0;
}
.showcase__sub {
  margin: 1rem 0 0;
  font-size: 1.1rem;
  color: rgb(var(--tw-ink-muted));
}

.wall {
  column-count: 2;
  column-gap: 1rem;

  @media (min-width: 700px) {
    column-count: 3;
  }
  @media (min-width: 1100px) {
    column-count: 4;
  }
}

.tile {
  position: relative;
  margin: 0 0 1rem;
  break-inside: avoid;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #2d2319;
  cursor: pointer;
}
.tile__img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.tile:hover .tile__img {
  transform: scale(1.05);
}

.tile__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 1rem;
  background: linear-gradient(to top, rgba(24, 18, 14, 0.92) 0%, rgba(24, 18, 14, 0) 60%);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.tile:hover .tile__overlay {
  opacity: 1;
}
.tile__prompt {
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-primary));
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.showcase__foot {
  margin-top: 2.5rem;
  display: flex;
  justify-content: center;
}

@media (prefers-reduced-motion: reduce) {
  .tile__img,
  .tile:hover .tile__img {
    transition: none;
    transform: none;
  }
}
</style>
