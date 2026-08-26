<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

import LandingButton from '@/components/Landing/LandingButton.vue';

import { SHOWCASE } from '@/utils/landing';

const THUMBS = SHOWCASE.slice(0, 3);
const auth = useAuthStore();
</script>

<template>
  <section class="cta">
    <div class="cta__inner">
      <div v-reveal class="cta__thumbs" aria-hidden="true">
        <img
          v-for="(item, i) in THUMBS"
          :key="item.url"
          :src="item.url"
          alt=""
          class="cta__thumb"
          :class="`cta__thumb--${i}`"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h2 v-reveal="{ delay: 0.06 }" class="cta__title">Your next image is one prompt away.</h2>
      <p v-reveal="{ delay: 0.12 }" class="cta__sub">
        Generate, upscale, colorize, and revive — 50 persistent credits at signup and 30 more every
        day.
      </p>
      <div v-reveal="{ delay: 0.18 }" class="cta__actions">
        <LandingButton :to="auth.isSignedIn ? '/create' : '/signin'" size="lg">
          {{ auth.isSignedIn ? 'Open studio' : 'Start free' }}
        </LandingButton>
        <LandingButton to="/pricing" variant="ghost" size="lg">See pricing</LandingButton>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.cta {
  position: relative;
  z-index: 1;
  padding: clamp(3.5rem, 6vw, 5.5rem) 1.5rem;
}
.cta__inner {
  position: relative;
  max-width: 54rem;
  margin: 0 auto;
  text-align: center;
  padding: clamp(2.75rem, 6vw, 4.5rem) clamp(1.5rem, 5vw, 3.5rem);
  border: 1px solid rgba(201, 168, 76, 0.35);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(120% 140% at 50% 0%, rgba(201, 168, 76, 0.22) 0%, rgba(201, 168, 76, 0) 60%),
    #1d1610;
  box-shadow:
    0 0 70px rgba(201, 168, 76, 0.14),
    0 24px 80px rgba(0, 0, 0, 0.55);

  /* Top edge highlight — the card reads as lit from above */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(232, 201, 107, 0.8), transparent);
  }
}

.cta__thumbs {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 2rem;
}
.cta__thumb {
  width: clamp(4.5rem, 9vw, 6rem);
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(232, 201, 107, 0.35);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);

  &--0 {
    transform: rotate(-7deg) translate(0.6rem, 0.35rem);
  }
  &--1 {
    position: relative;
    z-index: 1;
    transform: translateY(-0.4rem);
  }
  &--2 {
    transform: rotate(7deg) translate(-0.6rem, 0.35rem);
  }
}

.cta__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4.5vw, 3.25rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 0;
}
.cta__sub {
  margin: 1.25rem auto 0;
  max-width: 32rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}
.cta__actions {
  margin-top: 2.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}
</style>
