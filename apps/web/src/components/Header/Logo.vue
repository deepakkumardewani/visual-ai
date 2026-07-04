<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const isMobile = useMediaQuery('(max-width: 600px)');

const logoImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/logo.png`;

function goHome() {
  router.push('/');
}
</script>

<template>
  <button
    type="button"
    class="logo tw-group tw-flex tw-items-center tw-gap-2.5 tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-accent"
    :aria-label="route.path === '/dashboard' ? 'Visual AI home' : 'Visual AI'"
    @click="goHome"
  >
    <img
      :src="logoImage"
      :width="isMobile ? 30 : 34"
      :height="isMobile ? 30 : 34"
      class="tw-block tw-shrink-0 tw-rounded-[6px] tw-transition-transform tw-duration-fast tw-ease-out group-hover:tw-scale-[1.04]"
      alt=""
      aria-hidden="true"
    />
    <span v-if="route.path !== '/dashboard'" class="logo__wordmark tw-flex tw-items-baseline">
      <span
        class="logo__name tw-font-display tw-text-2xl tw-leading-none tw-text-gold sm:tw-text-[1.625rem]"
      >
        Visual AI
      </span>
      <span
        class="logo__tm tw-ml-0.5 tw-font-display tw-text-[0.5rem] tw-font-bold tw-leading-none tw-text-gold tw-opacity-70"
      >
        TM
      </span>
    </span>
  </button>
</template>

<style scoped>
.logo__name {
  letter-spacing: -0.01em;
}

/* Light theme: gold.muted for contrast on light canvas */
:global(html:not(.tw-dark)) .logo__name,
:global(html:not(.tw-dark)) .logo__tm {
  color: #9e7d35;
}
</style>
