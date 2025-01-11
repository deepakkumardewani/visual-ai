<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useDialogStore } from '@/stores/dialog'

import { ImgComparisonSlider } from '@img-comparison-slider/vue'

const router = useRouter()
const dialogStore = useDialogStore()
const { signupDialog } = storeToRefs(dialogStore)

const aiImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/ai-image.jpg`
const upscaleImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/upscale.jpg`
const upscaleImage1 = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/upscale-1.png`
const colorizeImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/bw.webp`
const colorizeImage1 = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/bw-1.png`
const reviveImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/revive.png`
const reviveImage1 = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/revive-1.png`

const handleSignup = () => {
  signupDialog.value = false
  router.push('/signup')
}

const handleLogin = () => {
  signupDialog.value = false
  router.push('/signin')
}
</script>

<template>
  <v-dialog v-model="signupDialog" max-width="1200">
    <v-card class="dialog-bg tw-border tw-border-gray-800">
      <v-card-text class="tw-p-12">
        <div class="tw-flex tw-gap-16">
          <div class="tw-flex tw-flex-col tw-justify-center tw-gap-8 tw-w-[400px]">
            <div class="tw-text-left">
              <h2 class="tw-text-2xl tw-font-normal tw-text-indigo-300 tw-mb-2">
                Ready to create?
              </h2>
              <h1 class="tw-text-[42px] tw-leading-tight tw-font-bold tw-text-white tw-mb-4">
                Sign up for free!
              </h1>
              <p class="tw-text-gray-400 tw-text-base tw-leading-relaxed">
                AI tools that do the hard work for you — easily generate images, upscales, and more.
                Get started now!
              </p>
            </div>

            <div class="tw-flex tw-gap-3">
              <v-btn
                color="primary"
                size="x-large"
                @click="handleSignup"
                class="tw-h-12 tw-flex-1 tw-capitalize tw-bg-gradient-to-r tw-from-indigo-500 tw-to-purple-500"
              >
                Sign up for free
              </v-btn>
              <v-btn
                variant="outlined"
                size="x-large"
                @click="handleLogin"
                class="tw-h-12 tw-flex-1 tw-capitalize tw-border-gray-700 hover:tw-border-indigo-500"
              >
                Login
              </v-btn>
            </div>
          </div>

          <div class="tw-grid tw-grid-cols-2 tw-gap-6 tw-flex-1">
            <div class="feature-card tw-relative tw-group tw-overflow-hidden">
              <v-img
                cover
                :src="aiImage"
                class="tw-rounded-2xl tw-w-full"
                :class="{ 'tw-brightness-75': true }"
              />
              <div class="tw-absolute tw-bottom-6 tw-left-6 tw-z-10">
                <div
                  class="tw-bg-indigo-500/30 tw-backdrop-blur-md tw-px-3 tw-py-1 tw-rounded-lg tw-mb-2 tw-inline-block"
                >
                  <span class="tw-text-sm tw-text-indigo-200">Image generator</span>
                </div>
                <h3 class="tw-text-2xl tw-font-bold tw-text-white">Create stunning images</h3>
              </div>
            </div>

            <div class="feature-card tw-relative tw-group tw-overflow-hidden">
              <ImgComparisonSlider class="tw-outline-none" hover="hover" value="25">
                <figure slot="first" class="before tw-h-full">
                  <img
                    class="tw-rounded-md tw-h-full tw-w-full tw-object-fill"
                    :src="upscaleImage"
                  />
                </figure>
                <figure slot="second" class="after tw-h-full">
                  <img
                    class="tw-rounded-md tw-h-full tw-w-full tw-object-fill"
                    :src="upscaleImage1"
                  />
                </figure>
              </ImgComparisonSlider>
              <div class="tw-absolute tw-bottom-6 tw-left-6 tw-z-10">
                <div
                  class="tw-bg-indigo-500/30 tw-backdrop-blur-md tw-px-3 tw-py-1 tw-rounded-lg tw-mb-2 tw-inline-block"
                >
                  <span class="tw-text-sm tw-text-indigo-200">Upscale</span>
                </div>
                <h3 class="tw-text-2xl tw-font-bold tw-text-white">Enhance resolution</h3>
              </div>
            </div>

            <div class="feature-card tw-relative tw-group tw-overflow-hidden">
              <ImgComparisonSlider class="tw-outline-none" hover="hover" value="25">
                <figure slot="first" class="before tw-h-full">
                  <img
                    class="tw-rounded-md tw-h-full tw-w-full tw-object-fill"
                    :src="colorizeImage"
                  />
                </figure>
                <figure slot="second" class="after tw-h-full">
                  <img
                    class="tw-rounded-md tw-h-full tw-w-full tw-object-fill"
                    :src="colorizeImage1"
                  />
                </figure>
              </ImgComparisonSlider>
              <div class="tw-absolute tw-bottom-6 tw-left-6 tw-z-10">
                <div
                  class="tw-bg-indigo-500/30 tw-backdrop-blur-md tw-px-3 tw-py-1 tw-rounded-lg tw-mb-2 tw-inline-block"
                >
                  <span class="tw-text-sm tw-text-indigo-200">Colorize</span>
                </div>
                <h3 class="tw-text-2xl tw-font-bold tw-text-white">Colorize photos</h3>
              </div>
            </div>

            <div class="feature-card tw-relative tw-group tw-overflow-hidden">
              <ImgComparisonSlider class="tw-outline-none" hover="hover" value="25">
                <figure slot="first" class="before tw-h-full">
                  <img
                    class="tw-rounded-md tw-h-full tw-w-full tw-object-cover"
                    :src="reviveImage"
                  />
                </figure>
                <figure slot="second" class="after tw-h-full">
                  <img
                    class="tw-rounded-md tw-h-full tw-w-full tw-object-cover"
                    :src="reviveImage1"
                  />
                </figure>
              </ImgComparisonSlider>
              <div class="tw-absolute tw-bottom-6 tw-left-6 tw-z-10">
                <div
                  class="tw-bg-indigo-500/30 tw-backdrop-blur-md tw-px-3 tw-py-1 tw-rounded-lg tw-mb-2 tw-inline-block"
                >
                  <span class="tw-text-sm tw-text-indigo-200">Revive</span>
                </div>
                <h3 class="tw-text-2xl tw-font-bold tw-text-white">Revive old photos</h3>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dialog-bg {
  background: linear-gradient(165deg, rgba(30, 30, 45, 1) 0%, rgba(15, 15, 25, 1) 100%);
  box-shadow: 0 0 40px rgba(66, 66, 160, 0.1);
}

.feature-card {
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 1rem;
  height: 150px;
}

.v-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(30, 30, 45, 0) 0%,
    rgba(30, 30, 45, 0.8) 70%,
    rgba(30, 30, 45, 0.95) 100%
  );
  border-radius: 1rem;
}
</style>
