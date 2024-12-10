<script setup lang="ts">
// Add ref for controlling scroll indicator visibility
import { onMounted, onUnmounted, ref } from 'vue'
import { SignedOut } from 'vue-clerk'

import FeatureScroll from '@/components/Home/FeatureScroll.vue'

const showScrollIndicator = ref(true)

// Handle scroll event to hide indicator when user starts scrolling
function handleScroll() {
  if (window.scrollY > 100) {
    showScrollIndicator.value = false
  } else {
    showScrollIndicator.value = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const scrollToAbout = () => {
  const aboutSection = document.querySelector('#about')
  if (aboutSection) {
    aboutSection.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div id="hero" class="tw-min-h-[85vh] tw-flex tw-flex-col tw-items-center tw-justify-center">
    <v-container>
      <v-row class="align-center justify-center">
        <v-col cols="12" md="10" lg="8">
          <!-- Improved heading container -->
          <div class="tw-flex tw-flex-col tw-gap-2 md:tw-gap-4 tw-mb-12">
            <div
              v-motion
              :initial="{
                opacity: 0,
                y: 40
              }"
              :visibleOnce="{
                opacity: 1,
                y: 0
              }"
              :delay="100"
              :duration="600"
              class="tw-text-6xl md:tw-text-8xl lg:tw-text-7xl tw-font-bold tw-text-slate-900 dark:tw-text-neutral-100 text-center"
            >
              Bring Images to Lifeeeee
            </div>
            <div
              v-motion
              :initial="{
                opacity: 0,
                y: 40
              }"
              :visibleOnce="{
                opacity: 1,
                y: 0
              }"
              :delay="200"
              :duration="600"
              class="text-h3 text-sm-h1 font-weight-bold tw-bg-gradient-to-r tw-from-purple-500 tw-to-pink-500 dark:tw-from-purple-400 dark:tw-to-pink-400 tw-bg-clip-text tw-text-transparent text-center"
            >
              with Visual AI
            </div>
            <div
              v-motion
              :initial="{
                opacity: 0,
                y: 40
              }"
              :visibleOnce="{
                opacity: 1,
                y: 0
              }"
              :delay="300"
              :duration="600"
              class="text-h4 text-sm-h3 tw-text-slate-600 dark:tw-text-neutral-300 text-center"
            >
              It's Fast and Simple
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <FeatureScroll />

    <SignedOut>
      <div class="tw-flex tw-justify-center tw-mt-12 tw-mb-24">
        <v-btn
          to="/signup"
          class="text-none tw-px-8"
          color="purple-lighten-1"
          size="x-large"
          variant="flat"
          elevation="2"
        >
          <v-icon left class="mr-2">fa-solid fa-rocket</v-icon>
          Get Started - It's Free
        </v-btn>
      </div>
    </SignedOut>

    <!-- Improved scroll indicator -->
    <Transition name="fade">
      <div
        v-show="showScrollIndicator"
        class="scroll-indicator tw-bg-white/80 dark:tw-bg-slate-800/80 tw-backdrop-blur-sm tw-rounded-full tw-p-3 tw-cursor-pointer"
        @click="scrollToAbout"
      >
        <v-icon
          icon="fa-solid fa-chevron-down"
          size="large"
          class="bounce tw-text-purple-500 dark:tw-text-purple-400"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.demo-img {
  height: 400px;
  width: 100%;
}

:deep(.v-skeleton-loader) {
  height: 100%;
  .v-skeleton-loader__image {
    height: 100%;
  }
}

// Update scroll indicator styles
.scroll-indicator {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.bounce {
  animation: bounce 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(5px);
  }
  50% {
    transform: translateY(-10px);
  }
}

// Smoother fade transition
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) translateX(-50%);
}
</style>
