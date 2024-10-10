<script setup lang="ts">
import { ImgComparisonSlider } from '@img-comparison-slider/vue'

defineProps<{
  originalImage: string
  enhancedImage: string
}>()
</script>
<template>
  <ImgComparisonSlider class="tw-w-full">
    <!-- eslint-disable -->
    <!-- <img class="tw-w-full" slot="first" :src="originalImage" />
                <img class="tw-w-full" slot="second" :src="enhancedImage" /> -->
    <figure slot="first" class="before">
      <img class="tw-w-full" width="100%" :src="originalImage" />
      <figcaption>Before</figcaption>
    </figure>
    <figure slot="second" class="after">
      <img class="tw-w-full" width="100%" :src="enhancedImage" />
      <figcaption>After</figcaption>
    </figure>
    <!-- eslint-enable -->
  </ImgComparisonSlider>
</template>

<style scoped lang="scss">
.before,
.after {
  margin: 0;
}

.before figcaption,
.after figcaption {
  background: #fff;
  border: 1px solid #c0c0c0;
  border-radius: 12px;
  color: #2e3452;
  opacity: 0.8;
  padding: 12px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  line-height: 100%;
}

.before figcaption {
  left: 12px;
}

.after figcaption {
  right: 12px;
}
</style>
