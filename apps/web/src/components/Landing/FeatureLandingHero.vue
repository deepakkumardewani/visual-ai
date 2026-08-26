<script setup lang="ts">
import LandingButton from '@/components/Landing/LandingButton.vue';
import LandingToolMedia from '@/components/Landing/LandingToolMedia.vue';

import type { FeatureLandingCopy } from '@/utils/featureLandings';
import type { ToolChapter } from '@/utils/landing';

defineProps<{
  landing: FeatureLandingCopy;
  tool: ToolChapter | undefined;
}>();
</script>

<template>
  <header class="hero">
    <nav class="hero__crumbs" aria-label="Breadcrumb">
      <ol>
        <li><router-link to="/">Home</router-link></li>
        <li aria-current="page">{{ landing.keyword }}</li>
      </ol>
    </nav>

    <div class="hero__copy">
      <p class="hero__eyebrow">
        <span class="hero__dot" aria-hidden="true"></span>
        {{ landing.keyword }}
      </p>
      <h1 class="hero__h1">{{ landing.h1 }}</h1>
      <p class="hero__def">{{ landing.definition }}</p>
      <div class="hero__ctas">
        <LandingButton :to="landing.createPath" size="lg">{{ landing.ctaLabel }}</LandingButton>
        <LandingButton to="/pricing" variant="ghost" size="lg">See credit packs</LandingButton>
      </div>
    </div>

    <div v-if="tool" class="hero__media">
      <LandingToolMedia :media="tool.media" :label="tool.eyebrow" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: clamp(5.5rem, 8vw, 7rem) 1.5rem clamp(3rem, 6vw, 5rem);
  display: grid;
  gap: 1.5rem clamp(2rem, 5vw, 4.5rem);
  align-items: center;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'crumbs'
    'copy'
    'media';

  @media (min-width: 960px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    grid-template-areas:
      'crumbs crumbs'
      'copy media';
  }
}

.hero__crumbs {
  grid-area: crumbs;
}

.hero__crumbs ol {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
  color: rgb(var(--tw-ink-muted));
}

.hero__crumbs li:not(:last-child)::after {
  content: '/';
  margin-left: 0.5rem;
  opacity: 0.45;
}

.hero__crumbs a {
  color: inherit;
}

.hero__copy {
  grid-area: copy;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d29467;
}

.hero__dot {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 9999px;
  background: #c98a5a;
  box-shadow: 0 0 0 4px rgba(201, 138, 90, 0.18);
}

.hero__h1 {
  margin: 0;
  max-width: 22ch;
  font-family: 'Young Serif', Georgia, serif;
  font-size: clamp(2.15rem, 4.6vw, 3.5rem);
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: rgb(var(--tw-ink-primary));
}

.hero__def {
  margin: 1.5rem 0 0;
  max-width: 38rem;
  font-size: clamp(1.05rem, 1.5vw, 1.15rem);
  line-height: 1.7;
  color: rgb(var(--tw-ink-muted));
}

.hero__ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin-top: 2.25rem;
}

.hero__media {
  grid-area: media;
  min-height: 20rem;
}
</style>
