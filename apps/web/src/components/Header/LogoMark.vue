<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    size?: number;
    /** Rounded-square fill. */
    background?: string;
    /** Main copper tone of the V and background glow. */
    accent?: string;
    /** Lighter copper used at the top of the V gradient. */
    accentLight?: string;
  }>(),
  {
    size: 34,
    background: '#1c1713',
    accent: '#c98a5a',
    accentLight: '#e0a878',
  },
);

// Unique per instance so multiple marks on one page don't collide on def ids.
const uid = useId();
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        :id="`${uid}-v`"
        x1="32"
        y1="13.5"
        x2="32"
        y2="50.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" :stop-color="accentLight" />
        <stop offset="1" :stop-color="accent" />
      </linearGradient>
      <!-- Warm glow rising from behind the V -->
      <radialGradient :id="`${uid}-glow`" cx="0.5" cy="0.62" r="0.75">
        <stop offset="0" :stop-color="accent" stop-opacity="0.38" />
        <stop offset="0.55" :stop-color="accent" stop-opacity="0.12" />
        <stop offset="1" :stop-color="accent" stop-opacity="0" />
      </radialGradient>
      <!-- Light from above: bright top rim fading into shadowed bottom -->
      <linearGradient
        :id="`${uid}-rim`"
        x1="32"
        y1="0"
        x2="32"
        y2="64"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.28" />
        <stop offset="0.25" stop-color="#ffffff" stop-opacity="0.06" />
        <stop offset="1" stop-color="#000000" stop-opacity="0.35" />
      </linearGradient>
      <filter :id="`${uid}-lift`" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="1.6"
          stdDeviation="1.6"
          flood-color="#000000"
          flood-opacity="0.55"
        />
      </filter>
    </defs>
    <rect width="64" height="64" rx="14" :fill="background" />
    <rect width="64" height="64" rx="14" :fill="`url(#${uid}-glow)`" />
    <!-- V mark traced from the original logo: two slanted bars -->
    <path
      d="M10.75 13.5h9.75l8.1 15-4.8 8.6zM43.4 13.5h9.7L33 50.4h-2L27.1 42.9z"
      :fill="`url(#${uid}-v)`"
      :filter="`url(#${uid}-lift)`"
    />
    <rect
      x="0.75"
      y="0.75"
      width="62.5"
      height="62.5"
      rx="13.25"
      :stroke="`url(#${uid}-rim)`"
      stroke-width="1.5"
      fill="none"
    />
  </svg>
</template>
