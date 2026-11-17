<script setup lang="ts">
import type { Component } from 'vue';

import './landingV2.scss';

import LandingFooter from '@/components/Landing/LandingFooter.vue';
import LandingNav from '@/components/Landing/LandingNav.vue';
import HeroScene from '@/components/LandingV2/HeroScene.vue';
import LandingV2Lenis from '@/components/LandingV2/LandingV2Lenis.vue';
import FaqSection from '@/components/Landing/FaqSection.vue';
import FinalCtaScene from '@/components/LandingV2/FinalCtaScene.vue';
import ModelsScene from '@/components/LandingV2/ModelsScene.vue';
import PricingScene from '@/components/LandingV2/PricingScene.vue';
import ShowcaseScene from '@/components/LandingV2/ShowcaseScene.vue';
import ToolsScene from '@/components/LandingV2/ToolsScene.vue';
import { useDocumentDarkScope } from '@/components/LandingV2/composables/useDocumentDarkScope';
import { useScrollTriggerHygiene } from '@/components/LandingV2/composables/useScrollTriggerHygiene';

/**
 * Shared shell for every landing candidate. /v2 renders it bare; a candidate
 * such as /v3 swaps in its own media renderers through these props.
 */
defineProps<{
  /** Hero wall renderer. Receives `HeroWallProps`; defaults to the DOM wall. */
  heroWall?: Component;
  /** Showcase media renderer, consumed by the showcase scene once it lands. */
  showcaseMedia?: Component;
  /** Optional overlay rendered after the footer, e.g. a WebGL scene transition. */
  transition?: Component;
}>();

useDocumentDarkScope();
useScrollTriggerHygiene();
</script>

<template>
  <div class="lv2 tw-dark">
    <LandingNav />
    <main>
      <HeroScene :wall="heroWall" />
      <ToolsScene />
      <ShowcaseScene :media="showcaseMedia" />
      <ModelsScene />
      <PricingScene />
      <FaqSection centered />
      <FinalCtaScene />
    </main>
    <LandingFooter />
    <component :is="transition" v-if="transition" />
    <!-- Last child, so Lenis is destroyed after every scene has reverted its triggers. -->
    <LandingV2Lenis />
  </div>
</template>

<style scoped lang="scss">
/* The candidate is dark-only; the shared nav's theme toggle would do nothing here. */
:deep(.nav__theme-btn),
:deep(.nav__sheet-theme-btn) {
  display: none;
}

/*
 * The FAQ is shared with the live landing and not edited here, so its block
 * rhythm and left edge are brought in line with the scenes from the outside:
 * same half-gap padding. The column stays centred, so only the gutters are
 * set as margin; a left --lv2-edge margin pushed it right on wide screens.
 */
.lv2 :deep(.faq) {
  margin: 0 var(--lv2-gutter);
  padding: var(--lv2-section-y) 0;
}
</style>
