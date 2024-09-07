<script setup lang="ts">
import { useUser } from 'vue-clerk'
import { useRoute, useRouter } from 'vue-router'

import { type ImageBody, useGenerateStore } from '@/stores/generate'

const router = useRouter()

const { isSignedIn } = useUser()

const generateStore = useGenerateStore()

const resolution = ref<string>('0')
const imageUrl = ref<string>('')
const image = ref()
const highResolution = ref<boolean>(false)
const scratched = ref<boolean>(false)
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
      dense
      @change="uploadImage"
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
    <div class="tw-flex tw-items-center tw-gap-2">
      <v-checkbox
        v-model="highResolution"
        color="red"
        label="High Resolution"
        value="red"
        hide-details
      ></v-checkbox>

      <v-tooltip>
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" size="x-small" icon="fas fa-circle-info"></v-icon>
        </template>
        <span>Select this if the image is High Resolution</span>
      </v-tooltip>
    </div>
    <div class="tw-flex tw-items-center tw-gap-2">
      <v-checkbox
        v-model="scratched"
        color="red"
        label="Scratched"
        value="red"
        hide-details
      ></v-checkbox>
      <v-tooltip>
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" size="x-small" icon="fas fa-circle-info"></v-icon>
        </template>
        <span>Select this if the image is Scratched</span>
      </v-tooltip>
    </div>
  </div>
  <div>
    <v-btn @click="generateImage" :disabled="image === null" color="purple-lighten-2" block dark
      >Revive</v-btn
    >
  </div>
</template>
<style scoped></style>
