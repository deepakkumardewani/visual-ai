<script setup lang="ts">
import { type Ref, ref } from 'vue'
import { useDisplay } from 'vuetify'

const textToImageVideo = ref<HTMLVideoElement | undefined>(undefined)
const upscaleVideo = ref<HTMLVideoElement | undefined>(undefined)
const colorizeVideo = ref<HTMLVideoElement | undefined>(undefined)
const restoreVideo = ref<HTMLVideoElement | undefined>(undefined)

const { mobile } = useDisplay()
interface Feature {
  title: string
  description: string
  url: string
  ref: string
  videoRef: Ref<HTMLVideoElement | undefined>
  icon: string
}

const features = ref<Feature[]>([
  {
    title: 'Text-to-Image',
    description: 'Transform your ideas into stunning images with our advanced AI',
    url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/owrcv8j8uo1p9nhlxeh2.mp4',
    ref: 'textToImageVideo',
    videoRef: textToImageVideo,
    icon: 'fa-solid fa-wand-magic-sparkles'
  },
  {
    title: 'Upscale',
    description: 'Enhance image quality and resolution without losing details',
    url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/x9zn6em8ylbyqhdn8mki.mp4',
    ref: 'upscaleVideo',
    videoRef: upscaleVideo,
    icon: 'fa-solid fa-expand'
  },
  {
    title: 'Colorize',
    description: 'Bring black and white images to life with vibrant colors',
    url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915531/videos/yh5jyyyc0zsm5pnuq4k3.mp4',
    ref: 'colorizeVideo',
    videoRef: colorizeVideo,
    icon: 'fa-solid fa-palette'
  },
  {
    title: 'Restore',
    description: 'Repair and enhance old or damaged photos',
    url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/fvxprtyuurm49silhq1i.mp4',
    ref: 'restoreVideo',
    videoRef: restoreVideo,
    icon: 'fa-solid fa-clock-rotate-left'
  }
])
</script>

<template>
  <div id="features" class="tw-relative">
    <div class="tw-text-center tw-py-8 md:tw-py-16 tw-top-0 tw-z-10 tw-bg-background">
      <v-chip class="tw-mb-3 md:tw-mb-4" color="purple-lighten-2" label>Features</v-chip>
      <div class="tw-text-3xl md:tw-text-4xl lg:tw-text-5xl font-weight-bold tw-mb-4">
        What We Offer
      </div>
    </div>

    <div class="feature-container">
      <div
        v-for="(feature, index) in features"
        :key="index"
        class="feature-section"
        :class="{ 'tw-min-h-screen': !mobile }"
      >
        <div
          class="tw-w-[95%] md:tw-w-[90%] tw-max-w-4xl tw-mx-auto tw-text-center tw-px-4 md:tw-px-0 tw-min-w-[85%]"
        >
          <v-chip
            v-motion-pop-visible-once
            class="tw-mb-4 md:tw-mb-6"
            color="purple-lighten-2"
            label
          >
            <v-icon :icon="feature.icon" start class="tw-mr-2" />
            {{ feature.title }}
          </v-chip>

          <p
            class="text-subtitle-1 text-medium-emphasis tw-mb-4 md:tw-mb-6 tw-text-sm md:tw-text-base"
          >
            {{ feature.description }}
          </p>

          <div
            class="tw-border tw-rounded-lg tw-border-slate-900 dark:tw-border-slate-500 tw-overflow-hidden"
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
            <video
              class="tw-w-full tw-rounded-lg"
              :ref="feature.ref"
              :src="feature.url"
              loop
              muted
              playsinline
            ></video>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature-container {
  min-height: 100vh;
  overflow-x: hidden;
}

.feature-section {
  width: 100%;
  padding: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--v-theme-background);
}

@media (min-width: 768px) {
  .feature-section {
    padding: 2rem 0;
  }
}

/* Hide scrollbar for Chrome, Safari and Opera */
.feature-container::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.feature-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
