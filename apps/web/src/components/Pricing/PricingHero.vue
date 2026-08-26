<script setup lang="ts">
import LandingButton from '@/components/Landing/LandingButton.vue';
</script>

<template>
  <header class="hero">
    <p class="eyebrow">Credits</p>
    <h1 class="hero__title">Free Forever, Always</h1>
    <p class="hero__lede">
      Start with 50 persistent credits, earn 30 more every day, and buy a pack only when you want
      more headroom. Nothing expires except unused daily credits.
    </p>
    <LandingButton href="#packs" size="lg">Buy a credit pack</LandingButton>
  </header>
</template>

<style scoped lang="scss">
.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  max-width: 40rem;
  padding: clamp(2.5rem, 6vw, 4.5rem) 0 0;
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
