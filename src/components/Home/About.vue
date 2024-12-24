<script setup lang="ts">
import { useParallax } from '@vueuse/core'
import { useDisplay } from 'vuetify'

import Chip from '@/components/Home/Chip.vue'

const { mobile } = useDisplay()
const container = ref(null)
const { tilt, roll } = useParallax(container)
const SCALE_FACTOR = mobile.value ? 0 : 25
const aboutImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/about.jpg`
</script>
<template>
  <div id="about" class="tw-mt-14">
    <v-row class="tw-justify-center">
      <v-col cols="12" md="8" class="tw-px-4 md:tw-px-8">
        <div class="tw-flex tw-flex-col tw-justify-center tw-items-center">
          <Chip v-motion-pop-visible-once text="About" />
          <div v-motion-slide-visible-left class="text-h4 font-weight-bold my-4 tw-text-center">
            <span class="tw-text-2xl md:tw-text-4xl">
              Unleash the Power of AI Image Generation
            </span>
          </div>
          <div
            v-motion-slide-visible-right
            class="my-4 tw-text-lg md:tw-text-xl tw-px-2 md:tw-px-0"
          >
            <p class="tw-text-center text-body-1 text-medium-emphasis">
              Our AI-powered image generator uses advanced deep learning models to transform your
              text into stunning, high-quality visuals. By leveraging the latest advancements in
              natural language processing and computer vision, we're able to create unique and
              captivating images that bring your ideas to life.
            </p>
          </div>
        </div>
        <div
          class="tw-flex tw-rounded-lg tw-justify-center tw-items-center tw-h-[300px] md:tw-h-[500px]"
          v-motion
          :initial="{
            perspective: 800,
            opacity: 0,
            rotateX: 14
          }"
          :visibleOnce="{
            opacity: 1,
            rotateX: 0
          }"
          :duration="1000"
          :delay="200"
        >
          <v-parallax
            ref="container"
            scale="0.9"
            class="tw-rounded-lg"
            :style="{
              transform: `
            rotateX(${roll * SCALE_FACTOR}deg)
            rotateY(${tilt * SCALE_FACTOR}deg)
            `
            }"
            :src="aboutImage"
          ></v-parallax>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped></style>
