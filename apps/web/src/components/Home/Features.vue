<script setup lang="ts">
import { faClockRotateLeft, faExpand, faPalette, faWandMagicSparkles } from '@/plugins/icons';
import { ref } from 'vue';
import { useDisplay } from 'vuetify';

import Chip from '@/components/Home/Chip.vue';

const videoRefs = ref<{ [key: string]: HTMLVideoElement | null }>({});

const setVideoRef = (el: HTMLVideoElement | null, ref: string) => {
  if (el) {
    videoRefs.value[ref] = el;
  }
};

const { mobile } = useDisplay();
interface Feature {
  title: string;
  description: string;
  url: string;
  ref: string;
  icon: any; // Changed to any to support FontAwesome IconDefinition
}

const playVideo = (ref: string) => {
  const video = videoRefs.value[ref];
  if (video) {
    // Add a small delay to ensure video is ready
    setTimeout(() => {
      video.play().catch((err) => {
        console.warn('Video playback failed:', err);
      });
    }, 100);
  }
};

const features = ref<Feature[]>([
  {
    title: 'Text-to-Image',
    description: 'Transform your ideas into stunning images with our advanced AI',
    url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/owrcv8j8uo1p9nhlxeh2.mp4',
    ref: 'textToImageVideo',
    icon: faWandMagicSparkles,
  },
  {
    title: 'Upscale',
    description: 'Enhance image quality and resolution without losing details',
    url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/x9zn6em8ylbyqhdn8mki.mp4',
    ref: 'upscaleVideo',
    icon: faExpand,
  },
  {
    title: 'Colorize',
    description: 'Bring black and white images to life with vibrant colors',
    url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915531/videos/yh5jyyyc0zsm5pnuq4k3.mp4',
    ref: 'colorizeVideo',
    icon: faPalette,
  },
  {
    title: 'Restore',
    description: 'Repair and enhance old or damaged photos',
    url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/fvxprtyuurm49silhq1i.mp4',
    ref: 'restoreVideo',
    icon: faClockRotateLeft,
  },
]);

// Try to play videos when component is mounted
// onMounted(() => {
//   Object.keys(videoRefs.value).forEach((ref) => {
//     playVideo(ref)
//   })
// })
</script>

<template>
  <div id="features" class="tw-relative">
    <div class="tw-text-center tw-mt-8 tw-py-2 tw-top-0 tw-z-10 tw-bg-background">
      <v-chip v-motion-pop-visible-once class="tw-mb-3 md:tw-mb-4" color="#C98A5A" label
        >Features</v-chip
      >
      <div
        v-motion-pop-visible-once
        class="tw-text-3xl md:tw-text-4xl lg:tw-text-5xl font-weight-bold"
      >
        What We Offer
      </div>
    </div>

    <div class="feature-container">
      <div
        v-for="(feature, index) in features"
        :key="index"
        class="feature-section tw-mb-12 sm:tw-mb-0"
        :class="{ 'tw-min-h-screen': !mobile }"
      >
        <div class="tw-w-[98%] md:tw-w-[90%] tw-max-w-4xl tw-text-center tw-min-w-[85%]">
          <Chip :text="feature.title" :icon="feature.icon" />

          <p v-motion-slide-visible-once-left class="tw-mb-4 md:tw-mb-6 tw-text-sm md:tw-text-2xl">
            {{ feature.description }}
          </p>

          <div
            class="tw-border tw-rounded-lg tw-border-slate-900 dark:tw-border-slate-500 tw-overflow-hidden"
            v-motion
            :initial="{
              perspective: 800,
              rotateX: 14,
              opacity: 0.5,
            }"
            :visibleOnce="{
              opacity: 1,
              rotateX: 0,
              transition: {
                onComplete: () => {
                  playVideo(feature.ref);
                },
              },
            }"
            :delay="300"
            :duration="800"
          >
            <video
              class="tw-w-full tw-rounded-lg"
              :ref="(el) => setVideoRef(el as HTMLVideoElement, feature.ref)"
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
  overflow-x: hidden;
}

.feature-section {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--v-theme-background);
}

@media (min-width: 768px) {
  .feature-section {
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
