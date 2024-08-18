<script setup lang="ts">
import { SignedIn, useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import { useGenerateStore } from '@/stores/generate'
import type { ImageBody } from '@/stores/generate'

const router = useRouter()
const { isSignedIn } = useUser()

const generateStore = useGenerateStore()
const { isLoading, image } = generateStore
const prompt = ref<string>('')
const noOfOutputs = ref<number>(1)
const outputQuality = ref<number>(0)
const aspectRatio = ref<string>('1:1')
const outputFormat = ref<string>('jpg')

async function generateImage() {
  const input: ImageBody = {
    prompt: prompt.value,
    noOfOutputs: noOfOutputs.value,
    outputQuality: outputQuality.value === 0 ? 50 : 100,
    aspectRatio: aspectRatio.value,
    outputFormat: outputFormat.value
  }
  generateStore.generateImage(input)
}

watch(isSignedIn, (value) => {
  console.log('isSignedIn', value)
  if (!value) {
    router.push('/')
  }
})
</script>
<template>
  <SignedIn>
    <v-container class="mt-16">
      <v-row>
        <v-col cols="4">
          <div class="mb-6">
            <h3>Create an image from the prompt</h3>

            <v-textarea
              v-model="prompt"
              variant="outlined"
              rounded="2"
              placeholder="Enter your prompt"
              hide-details
              density="compact"
            ></v-textarea>
          </div>
          <div class="mb-6">
            <h3>Number of Image Variations</h3>
            <v-select
              :items="[1, 2, 3, 4]"
              variant="outlined"
              hide-details
              density="compact"
              v-model="noOfOutputs"
            ></v-select>
          </div>
          <div class="mb-6">
            <h3>Choose a model</h3>
            <v-btn-toggle v-model="outputQuality" mandatory variant="outlined" block divided>
              <v-btn>Standard</v-btn>
              <v-btn>HD</v-btn>
            </v-btn-toggle>
            <!-- <v-slider
              label="Output Quality"
              v-model="outputQuality"
              :max="100"
              :min="0"
              :step="10"
              thumb-label="always"
            ></v-slider> -->
          </div>
          <div class="mb-6">
            <h3>Select the shape</h3>
            <v-select
              :items="['1:1', '4:3', '16:9', '21:9']"
              density="compact"
              variant="outlined"
              v-model="aspectRatio"
            ></v-select>
          </div>
          <div class="mb-6">
            <h3>Select the format</h3>
            <v-select
              :items="['png', 'jpeg', 'webp']"
              variant="outlined"
              v-model="outputFormat"
            ></v-select>
          </div>
          <div>
            <v-btn @click="generateImage" color="purple-lighten-2" block dark>Generate Image</v-btn>
          </div>
        </v-col>
        <v-col cols="8">
          <div class="h-100 image rounded-lg border-thin d-flex align-center justify-center">
            <v-skeleton-loader v-if="generateStore.isLoading" type="image"></v-skeleton-loader>
            <v-img
              v-else
              width="auto"
              :aspect-ratio="aspectRatio.replace(':', '/')"
              cover
              :src="generateStore.image"
            >
              <template v-slot:error>
                <v-img
                  class="mx-auto"
                  height="300"
                  max-width="500"
                  src="https://picsum.photos/500/300?image=232"
                ></v-img>
              </template>
            </v-img>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="10"> </v-col>
        <v-col cols="2"> </v-col>
      </v-row>
    </v-container>
  </SignedIn>
</template>

<style scoped lang="scss">
:deep(.v-skeleton-loader) {
  height: 100%;
  width: 100%;
  .v-skeleton-loader__image {
    height: 100%;
  }
}

.image {
  width: 100%;
}
</style>
