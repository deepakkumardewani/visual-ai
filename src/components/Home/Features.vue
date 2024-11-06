<script setup lang="ts">
import { type Ref, ref } from 'vue'

const textToImageVideo = ref<HTMLVideoElement | undefined>(undefined)
const upscaleVideo = ref<HTMLVideoElement | undefined>(undefined)
const colorizeVideo = ref<HTMLVideoElement | undefined>(undefined)
const restoreVideo = ref<HTMLVideoElement | undefined>(undefined)

interface Feature {
  title: string
  url: string
  ref: string
  videoRef: Ref<HTMLVideoElement | undefined>
}
const features = ref<Feature[]>([
  {
    title: 'Text-to-Image',
    url: '/src/assets/videos/texttoimage.mp4',
    ref: 'textToImageVideo',
    videoRef: textToImageVideo
  },
  {
    title: 'Upscale',
    url: '/src/assets/videos/upscale.mp4',
    ref: 'upscaleVideo',
    videoRef: upscaleVideo
  },
  {
    title: 'Colorize',
    url: '/src/assets/videos/colorize.mp4',
    ref: 'colorizeVideo',
    videoRef: colorizeVideo
  },
  {
    title: 'Restore',
    url: '/src/assets/videos/revive.mp4',
    ref: 'restoreVideo',
    videoRef: restoreVideo
  }
])
</script>
<template>
  <div id="features" class="mt-16">
    <v-row class="tw-items-start tw-justify-start">
      <v-col cols="12">
        <!-- <div class="tw-flex tw-justify-center tw-items-center">
          <v-chip class="my-4" color="purple-lighten-2" label> Features </v-chip>
        </div> -->
        <div class="text-h4 text-center font-weight-bold my-4">
          <span> What we offer </span>
        </div>
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="tw-flex tw-flex-col tw-justify-center tw-items-center tw-mb-8"
        >
          <v-chip v-motion-pop-visible-once class="tw-my-4" color="purple-lighten-2" label>
            {{ feature.title }}
          </v-chip>
          <div
            class="tw-w-[90%] tw-border tw-rounded-lg tw-border-slate-900 dark:tw-border-slate-500"
            v-motion
            :initial="{
              perspective: 800,
              rotateX: 14,
              opacity: 0.5
            }"
            :visibleOnce="{
              opacity: 1,
              rotateX: 0,
              transition: {
                onComplete: () => {
                  if (Array.isArray(feature.videoRef)) {
                    feature.videoRef[0]?.play()
                  } else {
                    feature.videoRef?.play()
                  }
                }
              }
            }"
            :delay="100"
            :duration="700"
          >
            <video class="tw-rounded-lg" :ref="feature.ref" :src="feature.url" loop muted></video>
          </div>
        </div>

        <!-- <v-row v-for="(feature, index) in features" :key="index">
          <v-col cols="12" sm="8">
            <div class="tw-flex tw-justify-center tw-items-center">
              <v-chip class="tw-my-4" color="purple-lighten-2" label> {{ feature.title }} </v-chip>
            </div>
            <div>
              <video :src="feature.url" autoplay loop muted></video>
            </div>
          </v-col>
        </v-row> -->
        <!-- <v-row class="align-center justify-center">
          <v-col cols="12" sm="8">
            <div class="d-flex justify-center align-center">
              <v-chip class="my-4" color="purple-lighten-2" label> Upscale </v-chip>
            </div>
          </v-col>
        </v-row>
        <v-row class="align-center justify-center">
          <v-col cols="12" sm="8">
            <div class="d-flex justify-center align-center">
              <v-chip class="my-4" color="purple-lighten-2" label> Colorize </v-chip>
            </div>
          </v-col>
        </v-row>
        <v-row class="align-center justify-center">
          <v-col cols="12" sm="8">
            <div class="d-flex justify-center align-center">
              <v-chip class="my-4" color="purple-lighten-2" label> Restore </v-chip>
            </div>
          </v-col>
        </v-row> -->
        <!-- <v-row class="text-center my-4">
          <v-col cols="12" sm="4">
            <div class="text-h2 text-md-h2 text-lg-h1 font-weight-bold">FAST</div>
            <div class="my-4">
              <v-chip class="mr-4 mb-2" size="large"> State-of-the-art Image Generation</v-chip>
            </div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-h2 text-xs-h5 text-md-h2 text-lg-h1 font-weight-bold">SIMPLE</div>
            <div class="my-4">
              <v-chip class="mr-4 mb-2" size="large"> Top of the line prompt following</v-chip>
            </div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-h2 text-xs-h5 text-md-h2 text-lg-h1 font-weight-bold">HUGE</div>
            <div class="my-4">
              <v-chip class="mr-4 mb-2" size="large"> 12 Billion parameters</v-chip>
            </div>
          </v-col>
        </v-row>
        <div class="my-4 text-center">
          <v-chip
            class="mr-4 mb-2"
            size="x-large"
            v-for="(feature, index) in features"
            :key="index"
            >{{ feature }}</v-chip
          >
        </div> -->
      </v-col>
    </v-row>
  </div>
</template>

<style scoped></style>
