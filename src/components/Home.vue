<script setup lang="ts">
import { useFetch } from '@vueuse/core'

const prompt = ref<string>('')
const noOfOutputs = ref<string>('1')
const outputQuality = ref<number>(80)
const aspectRatio = ref<string>('1:1')
const outputFormat = ref<string>('jpg')
const isLoading = ref<boolean>(false)
const image = ref<string>('')
function generateImage() {
  const myToken = 'r8_4GE7yf9OrL4IBF9qKoolk1NVWesuyrd3XAKRe'
  const url = `https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions`
  const { isFetching, error, data } = useFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${myToken}`
    },
    body: JSON.stringify({
      prompt: prompt.value,
      no_of_outputs: noOfOutputs.value,
      output_quality: outputQuality.value,
      aspect_ratio: aspectRatio.value,
      output_format: outputFormat.value
    })
  })
  console.log('isLoading', isLoading)
  console.log('error', error)
  console.log('data', data)
  isLoading.value = isFetching.value

  //   async beforeFetch({ url, options, cancel }) {

  //       if (!myToken) cancel()

  //       options.headers = {
  //         ...options.headers,
  //         Authorization: `Bearer ${myToken}`,
  //         'Content-Type': 'application/json'
  //       }

  //       return {
  //         options
  //       }
  //     }
}
</script>
<template>
  <v-container class="text-center">
    <v-row>
      <v-col cols="12">
        <div class="text-h2 font-weight-bold">
          <span> Turn Your Text Into Stunning Images </span>
        </div>
      </v-col>
    </v-row>
    <v-row class="align-center justify-center">
      <v-col cols="8">
        <div class="text-h4 text-center">
          <p class="text-center">
            Our AI-powered image generator allows you to create unique, high-quality images from
            your text in just a few clicks.
          </p>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <div class="mb-4">
          <v-text-field
            v-model="prompt"
            variant="outlined"
            rounded="2"
            placeholder="Enter your text"
            hide-details
            density="compact"
          ></v-text-field>
        </div>
        <div class="mb-4">
          <v-select
            label="Number of Outputs"
            :items="['1', '2', '3', '4']"
            variant="outlined"
            v-model="noOfOutputs"
          ></v-select>
        </div>
        <div class="mb-4">
          <v-slider
            label="Output Quality"
            v-model="outputQuality"
            :max="100"
            :min="0"
            :step="10"
            thumb-label="always"
          ></v-slider>
        </div>
        <div class="mb-4">
          <v-select
            label="Aspect Ratio"
            :items="['1:1', '4:3', '16:9', '21:9']"
            variant="outlined"
            v-model="aspectRatio"
          ></v-select>
        </div>
        <div class="mb-4">
          <v-select
            label="Output Format"
            :items="['png', 'jpeg', 'webp']"
            variant="outlined"
            v-model="outputFormat"
          ></v-select>
        </div>
        <div>
          <v-btn @click="generateImage" dark>Generate Image</v-btn>
        </div>
      </v-col>
      <v-col cols="8">
        <div class="h-100 rounded-lg border-thin">
          <v-skeleton-loader v-if="isLoading" type="image"></v-skeleton-loader>
          <!-- <v-img
          v-else
        :aspect-ratio="1"
        src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
        width="300"
      ></v-img> -->
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="10"> </v-col>
      <v-col cols="2"> </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
:deep(.v-skeleton-loader) {
  height: 100%;
  .v-skeleton-loader__image {
    height: 100%;
  }
}
</style>
