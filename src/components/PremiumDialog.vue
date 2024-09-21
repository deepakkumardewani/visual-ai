<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useDialogStore } from '@/stores/dialog'

const dialogStore = useDialogStore()
const { showPremiumDialog } = storeToRefs(dialogStore)

const features = [
  {
    title: 'AI Image Generator',
    description: 'Create images in realtime'
  },
  {
    title: 'Upscale Images',
    description: 'Upscale images in high resolution'
  },
  {
    title: 'Colorize Images',
    description: 'Put color back into your images'
  },
  {
    title: 'Deoldify Images',
    description: 'Bring your old photos back to life'
  }
]
</script>
<template>
  <div class="text-center">
    <v-dialog max-width="1000" v-model="showPremiumDialog" width="auto">
      <v-card class="no-scrollbar">
        <v-card-text class="pa-0">
          <div
            class="tw-flex tw-flex-col md:tw-flex-row tw-bg-gradient-to-br tw-from-purple-950 tw-via-purple-900 tw-to-purple-800 tw-p-4 tw-pb-0"
          >
            <!-- Features column -->
            <div
              class="tw-absolute md:tw-relative tw-inset-0 md:tw-w-[50%] tw-items-center tw-justify-center tw-p-4 tw-px-7 tw-pr-20"
            >
              <h1 class="tw-text-white tw-text-5xl tw-font-medium tw-py-6">
                Unlock the full potential of Visual AI
              </h1>
              <p class="tw-text-white tw-text-xl tw-mt-4 tw-font-bold">
                Get full access to all AI features and more generations.
              </p>
              <div class="tw-py-4">
                <ul class="tw-list-none tw-text-white tw-space-y-2 tw-flex tw-flex-col">
                  <li v-for="feature in features" :key="feature.title" class="tw-flex">
                    <v-icon icon="fas fa-circle" size="8" color="white" class="tw-mr-2 tw-mt-2" />
                    <div>
                      <span class="tw-font-bold tw-text-xl">{{ feature.title }}</span>
                      <span class="tw-ml-2 tw-text-lg">{{ feature.description }}</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div class="tw-py-4 tw-text-center">
                <v-btn color="yellow-darken-3" block dark class="font-weight-bold">
                  Get Premium
                </v-btn>

                <div
                  @click="dialogStore.hidePremium()"
                  class="tw-text-white tw-my-3 tw-cursor-pointer"
                >
                  Maybe later
                </div>
              </div>
            </div>

            <!-- Image column -->
            <div class="tw-hidden md:tw-block tw-relative tw-w-full md:tw-w-[50%] tw-h-screen">
              <img
                src="../assets/about.jpg"
                alt="AI Generated Image"
                class="tw-object-cover tw-w-full tw-h-full tw-rounded-t-full"
              />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
