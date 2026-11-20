<script setup lang="ts">
import { DAILY_CREDITS, SIGNUP_CREDITS } from '@visual-ai/shared';

import LandingButton from '@/components/Landing/LandingButton.vue';
</script>

<template>
  <header class="hero">
    <p class="eyebrow">Credits</p>
    <h1 class="hero__title">Start free. Go further with Pro.</h1>
    <p class="hero__lede">
      Start with {{ SIGNUP_CREDITS }} persistent credits and {{ DAILY_CREDITS.free }} new ones every
      day. Upgrade to Pro for {{ DAILY_CREDITS.pro }} a day and premium models, or top up with a
      pack whenever you need more.
    </p>
    <LandingButton href="#comparison" size="lg">Compare plans</LandingButton>
  </header>
</template>

<style scoped lang="scss">
.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  max-width: 40rem;
  padding: clamp(1.5rem, 4vw, 3rem) 0 0;
}

.hero__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: rgb(var(--tw-ink-primary));
  margin: 0.75rem 0 0;
}

.hero__lede {
  max-width: 38ch;
  margin: 1.25rem 0 1.75rem;
  font-size: 1.125rem;
  line-height: 1.65;
  color: rgb(var(--tw-ink-secondary));
}
</style>
