<script setup lang="ts">
import { faChevronDown, faRocket } from '@/plugins/icons'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuth } from 'vue-clerk'

import { useAppStore } from '@/stores/app'

import FeatureScroll from '@/components/Home/FeatureScroll.vue'

const { isSignedIn } = useAuth()
const showScrollIndicator = ref(true)
const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

const heroImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/hero.png`

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
    <v-container class="tw-pt-0">
      <v-row class="align-center justify-center">
        <v-col cols="12" md="10" lg="8" class="tw-pt-0">
          <div class="tw-flex tw-flex-col tw-gap-2 md:tw-gap-4 tw-mb-4">
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
              class="tw-text-5xl md:tw-text-4xl lg:tw-text-5xl tw-font-bold tw-text-slate-900 dark:tw-text-neutral-100 text-center"
            >
              Bring Images to Life with
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
              class="tw-text-6xl md:tw-text-7xl lg:tw-text-8xl tw-font-bold tw-bg-gradient-to-r tw-from-purple-500 tw-to-pink-500 dark:tw-from-purple-400 dark:tw-to-pink-400 tw-bg-clip-text tw-text-transparent text-center"
            >
              Visual AI
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
    <!-- <SignedOut> -->
    <div
      v-if="!isSignedIn"
      v-motion
      :initial="{
        opacity: 0,
        y: 40
      }"
      :visibleOnce="{
        opacity: 1,
        y: 0
      }"
      :delay="250"
      :duration="600"
      class="tw-flex tw-justify-center tw-my-12"
    >
      <v-btn
        to="/signup"
        class="text-none tw-px-8"
        color="purple-lighten-1"
        size="x-large"
        variant="flat"
        elevation="2"
      >
        <font-awesome-icon :icon="faRocket" class="tw-mr-2" />
        Get Started - It's Free
      </v-btn>
    </div>
    <!-- </SignedOut> -->

    <v-container class="tw-m-0">
      <v-row class="align-center justify-center">
        <v-col cols="12">
          <div
            class="tw-border tw-rounded-lg tw-border-slate-900 dark:tw-border-slate-500 tw-overflow-hidden"
            v-motion
            :initial="{
              y: 60,
              perspective: 800,
              rotateX: 10,
              opacity: isDark ? 0.7 : 1
            }"
            :visibleOnce="{
              y: 0
            }"
            :delay="250"
            :duration="700"
          >
            <v-img :src="heroImage" class="tw-rounded-lg" />
          </div>
        </v-col>
      </v-row>
    </v-container>

    <FeatureScroll />

    <!-- Improved scroll indicator -->
    <Transition name="fade">
      <div
        v-show="showScrollIndicator"
        class="scroll-indicator tw-bg-white/80 dark:tw-bg-slate-800/80 tw-backdrop-blur-sm tw-rounded-full tw-p-3 tw-cursor-pointer"
        @click="scrollToAbout"
      >
        <font-awesome-icon
          :icon="faChevronDown"
          class="bounce tw-text-2xl tw-text-purple-500 dark:tw-text-purple-400"
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
