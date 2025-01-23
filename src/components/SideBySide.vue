<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

import { ImgComparisonSlider } from '@img-comparison-slider/vue'

defineProps<{
  originalImage: string
  enhancedImage: string
  inDialog?: boolean
}>()

const { mobile } = useDisplay()
const originalImageLoaded = ref(false)
const enhancedImageLoaded = ref(false)
const ready = ref(false)

watch([originalImageLoaded, enhancedImageLoaded], ([original, enhanced]) => {
  if (original && enhanced) {
    ready.value = true
  }
})
</script>

<template>
  <ImgComparisonSlider :class="{ 'tw-outline-none': ready }" hover="hover" value="25">
    <figure slot="first" class="before">
      <img
        v-show="ready"
        class="tw-rounded-md"
        :class="[
          mobile
            ? 'tw-h-full  tw-w-full'
            : inDialog
              ? 'tw-h-[80vh] tw-w-auto'
              : 'tw-h-[85vh] tw-w-full'
        ]"
        :src="originalImage"
        @load="originalImageLoaded = true"
      />
      <figcaption>Before</figcaption>
    </figure>
    <figure slot="second" class="after">
      <img
        v-show="ready"
        class="tw-rounded-md"
        :class="[
          mobile
            ? 'tw-h-full  tw-w-full'
            : inDialog
              ? 'tw-h-[80vh] tw-w-auto'
              : 'tw-h-[85vh] tw-w-full'
        ]"
        :src="enhancedImage"
        @load="enhancedImageLoaded = true"
      />
      <figcaption>After</figcaption>
    </figure>
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

.v-skeleton-loader {
  height: 100% !important;
}

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
