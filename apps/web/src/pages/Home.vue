<script setup lang="ts">
import '@/components/Home/home.scss';

import FinalCtaScene from '@/components/Home/FinalCtaScene.vue';
import GlHeroWall from '@/components/Home/GlHeroWall.vue';
import GlShowcaseMedia from '@/components/Home/GlShowcaseMedia.vue';
import GlTransition from '@/components/Home/GlTransition.vue';
import HeroScene from '@/components/Home/HeroScene.vue';
import HomeLenis from '@/components/Home/HomeLenis.vue';
import ModelsScene from '@/components/Home/ModelsScene.vue';
import PricingScene from '@/components/Home/PricingScene.vue';
import ShowcaseScene from '@/components/Home/ShowcaseScene.vue';
import ToolsScene from '@/components/Home/ToolsScene.vue';
import { useDocumentDarkScope } from '@/components/Home/composables/useDocumentDarkScope';
import { useScrollTriggerHygiene } from '@/components/Home/composables/useScrollTriggerHygiene';
import FaqSection from '@/components/Landing/FaqSection.vue';
import LandingFooter from '@/components/Landing/LandingFooter.vue';
import LandingNav from '@/components/Landing/LandingNav.vue';

import { usePageSeo } from '@/composables/usePageSeo';
import { FAQS } from '@/utils/landing';
import { faqPageJsonLd, organizationJsonLd, webApplicationJsonLd } from '@/utils/seo';

usePageSeo({
  title: 'Visual AI – AI image generator',
  description:
    'Generate images from text, then upscale, colorize, restore old photos, and remove backgrounds in one Visual AI studio. Start free, then buy credits.',
  path: '/',
  // FaqSection below renders the default FAQS, so the FAQ schema matches visible content.
  jsonLd: [webApplicationJsonLd(), organizationJsonLd(), faqPageJsonLd(FAQS)],
});

useDocumentDarkScope();
useScrollTriggerHygiene();
</script>

<template>
  <div class="home tw-dark">
    <LandingNav />
    <main>
      <HeroScene :wall="GlHeroWall" />
      <ToolsScene />
      <ShowcaseScene :media="GlShowcaseMedia" />
      <ModelsScene />
      <PricingScene />
      <FaqSection centered />
      <FinalCtaScene />
    </main>
    <LandingFooter />
    <GlTransition />
    <!-- Last child, so Lenis is destroyed after every scene has reverted its triggers. -->
    <HomeLenis />
  </div>
</template>

<style scoped lang="scss">
/* The home page is dark-only; the shared nav's theme toggle would do nothing here. */
:deep(.nav__theme-btn) {
  display: none;
}

/*
 * The FAQ is shared with the FAQ page and feature landers, so its block
 * rhythm and left edge are brought in line with the scenes from the outside:
 * same half-gap padding. The column stays centred, so only the gutters are
 * set as margin; a left --home-edge margin pushed it right on wide screens.
 */
.home :deep(.faq) {
  margin: 0 var(--home-gutter);
  padding: var(--home-section-y) 0;
}
</style>
