<script setup lang="ts">
import { useFetch } from '@vueuse/core'
import { SignedIn, useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

const router = useRouter()
const { isSignedIn } = useUser()

const prompt = ref<string>('')
const noOfOutputs = ref<number>(1)
const outputQuality = ref<number>(80)
const aspectRatio = ref<string>('1:1')
const outputFormat = ref<string>('jpg')
const isLoading = ref<boolean>(false)
const image = ref<string>('')

async function generateImage() {
  isLoading.value = true
  const url = `http://localhost:3001/api/generate`
  const { error, data } = await useFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt.value,
      num_outputs: noOfOutputs.value,
      output_quality: outputQuality.value,
      aspect_ratio: aspectRatio.value,
      output_format: outputFormat.value
    })
  })
  console.log('error', error.value)
  console.log('data', JSON.parse(data.value as string).image[0])
  isLoading.value = false
  image.value = JSON.parse(data.value as string).image[0]
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
    <v-container class="text-center">
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
              :items="[1, 2, 3, 4]"
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
            <v-img v-else width="auto" aspect-ratio="16/9" cover :src="image"></v-img>
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
  .v-skeleton-loader__image {
    height: 100%;
  }
}
</style>
