<script setup lang="ts">
import { useLenis } from '@/composables/useLenis';

import AmbientCanvas from '@/components/Landing/AmbientCanvas.vue';
import CapabilitiesSection from '@/components/Landing/CapabilitiesSection.vue';
import FaqSection from '@/components/Landing/FaqSection.vue';
import FinalCta from '@/components/Landing/FinalCta.vue';
import LandingFooter from '@/components/Landing/LandingFooter.vue';
import LandingHero from '@/components/Landing/LandingHero.vue';
import LandingNav from '@/components/Landing/LandingNav.vue';
import PricingTeaser from '@/components/Landing/PricingTeaser.vue';
import ShowcaseGallery from '@/components/Landing/ShowcaseGallery.vue';
import ToolChapter from '@/components/Landing/ToolChapter.vue';

import { TOOLS } from '@/utils/landing';

useLenis();
</script>

<template>
  <div class="landing">
    <AmbientCanvas />
    <LandingNav />

    <main>
      <LandingHero />

      <section id="tools" class="tools">
        <header class="tools__head">
          <p v-reveal class="eyebrow">What's inside</p>
          <h2 v-reveal="{ delay: 0.05 }" class="tools__title">Four tools, one studio.</h2>
          <p v-reveal="{ delay: 0.1 }" class="tools__sub">
            Everything you need to make, sharpen, and rescue an image — without juggling five
            different apps.
          </p>
        </header>

        <ToolChapter v-for="(tool, i) in TOOLS" :key="tool.id" :tool="tool" :index="i" />
      </section>

      <ShowcaseGallery />
      <CapabilitiesSection />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
    </main>

    <LandingFooter />
  </div>
</template>

<style scoped lang="scss">
.landing {
  position: relative;
  background-color: rgb(var(--tw-canvas));
  color: rgb(var(--tw-ink-primary));
  font-family: 'Source Sans 3', system-ui, sans-serif;
  overflow-x: hidden;
}

.tools {
  position: relative;
  z-index: 1;
}
.tools__head {
  max-width: 42rem;
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 4rem) 1.5rem 0;
  text-align: center;
}
.tools__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 1rem 0 0;
}
.tools__sub {
  margin: 1rem auto 0;
  font-size: 1.1rem;
  line-height: 1.65;
  color: rgb(var(--tw-ink-muted));
}
</style>
