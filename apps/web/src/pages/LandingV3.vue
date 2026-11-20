<script setup lang="ts">
import LandingV2Page from '@/components/LandingV2/LandingV2Page.vue';
import GlHeroWall from '@/components/LandingV3/GlHeroWall.vue';
import GlShowcaseMedia from '@/components/LandingV3/GlShowcaseMedia.vue';
import GlTransition from '@/components/LandingV3/GlTransition.vue';
import { usePageSeo } from '@/composables/usePageSeo';

// A design candidate under review, kept out of search until it replaces /.
usePageSeo({
  title: 'Visual AI – AI image generator and photo tools',
  description:
    'Generate images from a prompt, then upscale, colorize, restore old photos or remove backgrounds in one studio.',
  path: '/v3',
  robots: 'noindex,nofollow',
});
</script>

<template>
  <LandingV2Page
    :hero-wall="GlHeroWall"
    :showcase-media="GlShowcaseMedia"
    :transition="GlTransition"
  />
</template>
