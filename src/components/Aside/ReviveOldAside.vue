<script setup lang="ts">
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import ImageUpload from '@/components/Aside/ImageUpload.vue'
import { useGenerateStore } from '@/stores/generate'

const router = useRouter()

const { isSignedIn } = useUser()

const generateStore = useGenerateStore()

const imageUpload = ref()
const image = ref()
const highResolution = ref<boolean>(false)
const scratched = ref<boolean>(false)
async function generateImage() {
  if (isSignedIn.value) {
    const body = {
      image: image.value,
      scratched: scratched.value,
      highResolution: highResolution.value
    }
    console.log(body)

    generateStore.reviveOldImage(body)
  } else {
    router.push('/signin')
  }
}
</script>
<template>
  <ImageUpload ref="imageUpload" />
  <div class="mb-6">
    <div class="tw-flex tw-items-center tw-gap-2">
      <v-checkbox
        v-model="highResolution"
        color="purple-lighten-2"
        label="High Resolution"
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
        color="purple-lighten-2"
        label="Scratched"
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
