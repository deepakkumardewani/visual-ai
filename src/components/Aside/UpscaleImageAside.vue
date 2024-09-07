<script setup lang="ts">
import { useUser } from 'vue-clerk'
import { useRoute, useRouter } from 'vue-router'

import { type ImageBody, useGenerateStore } from '@/stores/generate'

const router = useRouter()

const { isSignedIn } = useUser()

const generateStore = useGenerateStore()

const RESOLUTION = {
  '0': '2048*2048',
  '1': '4096*4096',
  '2': '8192*8192'
}

const resolution = ref<string>('0')
const imageUrl = ref<string>('')
const image = ref()
const prompt = ref<string>('')
async function generateImage() {
  if (isSignedIn.value) {
    // post file to server
    const formData = new FormData()
    formData.append('file', image.value)
    const body = {
      image: formData,
      resolution: resolution.value
    }
    generateStore.upscaleImage(body)
  } else {
    // Show sign in modal
    router.push('/signin')
  }
}

// function createImage(file: Blob) {
//   const reader = new FileReader()

//   reader.onload = (e) => {
//     imageUrl.value = e.target?.result as string
//   }
//   if (file) {
//     reader.readAsDataURL(file)
//   }
// }

function uploadImage(e: any) {
  const image = e.target.files[0]
  const reader = new FileReader()
  reader.readAsDataURL(image)
  reader.onload = (e) => {
    imageUrl.value = e.target?.result as string
    console.log(imageUrl.value)
  }
}

// function onFileChange(file: Blob) {
//   if (!file) {
//     return
//   }
//   createImage(file)
// }
</script>
<template>
  <div>
    <v-file-input
      v-model="image"
      type="file"
      name="image"
      outlined
      :show-size="1000"
      @change="uploadImage"
      density="compact"
      color="deep-purple-accent-4"
      placeholder="Upload image"
      prepend-icon="fas fa-camera"
      variant="outlined"
      counter
      hide-details
    />
  </div>
  <div v-if="imageUrl" class="tw-flex tw-justify-center pa-2">
    <v-img :src="imageUrl" max-height="100" max-width="100" class="tw-rounded-lg" />
  </div>
  <div class="mb-6">
    <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">Resolution</p>
    <v-btn-toggle v-model="resolution" mandatory variant="outlined" block divided>
      <v-btn>2K</v-btn>
      <v-btn>4K</v-btn>
      <v-btn
        >8K
        <template v-slot:append>
          <v-icon size="x-small" icon="fa:fas fa-lock" />
        </template>
      </v-btn>
    </v-btn-toggle>
    <div>
      <span class="text-caption">
        Upscaled Image size: {{ RESOLUTION[resolution as keyof typeof RESOLUTION] }}
      </span>
    </div>
  </div>
  <div class="mb-6">
    <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">Prompt</p>
    <v-textarea
      v-model.trim="prompt"
      variant="outlined"
      rounded="2"
      placeholder="Describe your image for better results"
      no-resize
      hide-details
      density="compact"
    ></v-textarea>
  </div>
  <div>
    <v-btn @click="generateImage" :disabled="image === null" color="purple-lighten-2" block dark
      >Upscale</v-btn
    >
  </div>
</template>

<style scoped></style>
