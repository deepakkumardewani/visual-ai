<script setup lang="ts">
import LandingV2Page from '@/components/LandingV2/LandingV2Page.vue';
import { usePageSeo } from '@/composables/usePageSeo';

// A design candidate under review, kept out of search until it replaces /.
usePageSeo({
  title: 'Visual AI – AI image generator and photo tools',
  description:
    'Generate images from a prompt, then upscale, colorize, restore old photos or remove backgrounds in one studio.',
  path: '/v2',
  robots: 'noindex,nofollow',
});
</script>

<template>
  <LandingV2Page />
</template>
