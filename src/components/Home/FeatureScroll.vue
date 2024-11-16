<script setup lang="ts">
import { ref } from 'vue'

const features = ref(['Text-To-Image', 'Upscale', 'Colorize', 'Revive'])
</script>
<template>
  <div
    class="tw-flex-nowrap tw-inline-flex tw-my-2 tw-overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)] tw-w-full"
  >
    <ul
      class="tw-flex tw-items-center tw-justify-center md:tw-justify-start [&_li]:tw-mx-8 md:[&_li]:tw-mx-10 tw-animate-infinite-scroll md:tw-animate-infinite-scroll tw-font-bold tw-text-neutral-500 tw-text-lg md:tw-text-4xl tw-w-max"
    >
      <li v-for="(feature, index) in features" :key="index" class="tw-whitespace-nowrap">
        {{ feature }}
      </li>
    </ul>
    <ul
      class="tw-flex tw-items-center tw-justify-center md:tw-justify-start [&_li]:tw-mx-8 md:[&_li]:tw-mx-10 tw-animate-infinite-scroll md:tw-animate-infinite-scroll tw-font-bold tw-text-neutral-500 tw-text-lg md:tw-text-4xl tw-w-max"
    >
      <li v-for="(feature, index) in features" :key="index" class="tw-whitespace-nowrap">
        {{ feature }}
      </li>
    </ul>
  </div>
</template>
<style scoped lang="scss"></style>
