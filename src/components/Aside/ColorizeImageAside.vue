<script setup lang="ts">
import { useUser } from 'vue-clerk'
import { useRoute, useRouter } from 'vue-router'

import { useGenerateStore } from '@/stores/generate'
import { MODEL_IDS } from '@/utils/constants'

type Mode = {
  title: string
  id: string
  description: string
  icon: string
}
const router = useRouter()
const route = useRoute()
const { isSignedIn } = useUser()

const generateStore = useGenerateStore()

const imageUrl = ref<string>('')
const image = ref()
const modes = ref([
  {
    title: 'Basic',
    id: MODEL_IDS.COLORIZE_BASIC,
    description: 'Basic coloring of the image',
    icon: 'fas fa-palette'
  },
  {
    title: 'Advanced',
    id: MODEL_IDS.COLORIZE_ADVANCED,
    description: 'Advanced photo-realistic coloring of the image',
    icon: 'fas fa-eraser'
  }
])
const mode = ref<Mode>(modes.value[0])

function handleSelected(item: Mode) {
  mode.value = item
}

async function generateImage() {
  if (isSignedIn.value) {
    // post file to server
    const formData = new FormData()
    formData.append('file', image.value)
    const body = {
      image: formData,
      mode: mode.value.id
    }
    generateStore.colorizeImage(body)
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
    <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">Mode</p>
    <v-select
      v-if="route.path === '/dashboard'"
      @update:model-value="handleSelected"
      :items="modes"
      v-model="mode"
      max-width="250"
      bg-color="transparent"
      color="purple-lighten-3"
      variant="outlined"
      :prepend-inner-icon="mode.icon"
      density="compact"
      hide-details
      item-title="title"
      item-value="title"
      return-object
    >
      <template v-slot:item="{ item, props }">
        <v-list-item v-bind="props" :prepend-icon="item.raw.icon" max-width="250">
          <v-list-item-subtitle v-html="item.raw.description" class="wrap-text">
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-select>
  </div>
  <div>
    <v-btn @click="generateImage" :disabled="image === null" color="purple-lighten-2" block dark
      >Colorize</v-btn
    >
  </div>
</template>
<style scoped>
.wrap-text {
  line-clamp: unset !important;
  -webkit-line-clamp: unset !important;
}
</style>
