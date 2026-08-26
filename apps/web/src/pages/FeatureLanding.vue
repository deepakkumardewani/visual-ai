<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import AmbientCanvas from '@/components/Landing/AmbientCanvas.vue';
import FaqSection from '@/components/Landing/FaqSection.vue';
import FeatureLandingHero from '@/components/Landing/FeatureLandingHero.vue';
import FeatureLandingMore from '@/components/Landing/FeatureLandingMore.vue';
import FeatureLandingSteps from '@/components/Landing/FeatureLandingSteps.vue';
import LandingFooter from '@/components/Landing/LandingFooter.vue';
import LandingNav from '@/components/Landing/LandingNav.vue';
import { useLenis } from '@/composables/useLenis';
import { usePageSeo } from '@/composables/usePageSeo';
import { featureLandingByPath, otherFeatureLandings } from '@/utils/featureLandings';
import { toolBySeoPath } from '@/utils/landing';
import { breadcrumbJsonLd, faqPageJsonLd } from '@/utils/seo';

const route = useRoute();
const landing = computed(() => featureLandingByPath(route.path));
const tool = computed(() => (landing.value ? toolBySeoPath(landing.value.path) : undefined));
const morePages = computed(() => otherFeatureLandings(route.path));

const jsonLd = computed(() => {
  const page = landing.value;
  if (!page) return [];
  return [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: page.h1, path: page.path },
    ]),
    faqPageJsonLd(page.faqs),
  ];
});

useLenis();

usePageSeo(() => {
  const page = landing.value;
  if (!page) {
    return {
      title: 'Visual AI',
      description: 'AI image studio',
      path: route.path,
      robots: 'noindex, follow',
    };
  }
  return {
    title: page.title,
    description: page.description,
    path: page.path,
    jsonLd: jsonLd.value,
  };
});
</script>

<template>
  <div v-if="landing" class="fl">
    <AmbientCanvas />
    <LandingNav />
    <main>
      <FeatureLandingHero :landing="landing" :tool="tool" />
      <FeatureLandingSteps
        :heading="landing.howHeading"
        :heading-id="`how-${landing.feature}`"
        :steps="landing.steps"
      />
      <FaqSection :faqs="landing.faqs" heading="Questions people ask" />
      <FeatureLandingMore :pages="morePages" />
    </main>
    <LandingFooter />
  </div>
</template>

<style scoped lang="scss">
.fl {
  position: relative;
  min-height: 100vh;
  background: rgb(var(--tw-canvas));
  color: rgb(var(--tw-ink-primary));
  font-family: 'Source Sans 3', system-ui, sans-serif;
  overflow-x: hidden;
}
</style>
