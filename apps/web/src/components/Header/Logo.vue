<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = withDefaults(
  defineProps<{
    /** Show mark + wordmark. Landing can hide the mark for a text-only brand. */
    showMark?: boolean;
    /** Force wordmark even on dashboard. */
    forceWordmark?: boolean;
  }>(),
  {
    showMark: true,
    forceWordmark: false,
  },
);

const route = useRoute();
const router = useRouter();
const isMobile = useMediaQuery('(max-width: 600px)');

const logoImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/logo.png`;

const showWordmark = computed(() => props.forceWordmark || route.path !== '/dashboard');

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
      v-if="showMark"
      :src="logoImage"
      :width="isMobile ? 30 : 34"
      :height="isMobile ? 30 : 34"
      class="tw-block tw-shrink-0 tw-rounded-[6px] tw-transition-transform tw-duration-fast tw-ease-out group-hover:tw-scale-[1.04]"
      alt=""
      aria-hidden="true"
    />
    <span v-if="showWordmark" class="logo__wordmark tw-flex tw-items-baseline">
      <span class="logo__name">Visual</span>
      <span class="logo__accent">AI</span>
    </span>
  </button>
</template>

<style scoped>
.logo__name,
.logo__accent {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.4rem;
  line-height: 1;
  letter-spacing: -0.01em;
}

.logo__name {
  color: rgb(var(--tw-ink-primary));
}

.logo__accent {
  color: #c98a5a;
  margin-left: 0.15em;
}

@media (min-width: 640px) {
  .logo__name,
  .logo__accent {
    font-size: 1.5rem;
  }
}
</style>
