<script setup lang="ts">
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import ImageUpload from '@/components/Aside/ImageUpload.vue'
import { useGenerateStore } from '@/stores/generate'

const router = useRouter()
const { isSignedIn } = useUser()
const generateStore = useGenerateStore()

const imageUpload = ref()
// const highResolution = ref<boolean>(false)
// const scratched = ref<boolean>(false)
async function generateImage() {
  if (isSignedIn.value) {
    const body = {
      image: imageUpload?.value?.image
    }
    generateStore.reviveOldImage(body)
  } else {
    router.push('/signin')
  }
}
</script>
<template>
  <ImageUpload ref="imageUpload" />
  <!-- <div class="mb-4">
    <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
      <div class="tw-flex-1">
        <div class="tw-flex tw-items-center tw-gap-2">
          <v-checkbox
            v-model="highResolution"
            color="purple-lighten-2"
            label="High Resolution"
            hide-details
          ></v-checkbox>

          <v-tooltip text="Select this if the image is High Resolution">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="x-small" icon="fas fa-circle-info"></v-icon>
            </template>
          </v-tooltip>
        </div>
      </div>
      <div class="tw-flex-1">
        <div class="tw-flex tw-items-center tw-gap-2">
          <v-checkbox
            v-model="scratched"
            color="purple-lighten-2"
            label="Scratched"
            hide-details
          ></v-checkbox>
          <v-tooltip text="Select this if the image has scratches">
            <template v-slot:activator="{ props }">
              <v-icon v-bind="props" size="x-small" icon="fas fa-circle-info"></v-icon>
            </template>
          </v-tooltip>
        </div>
      </div>
    </div>
  </div> -->
  <div>
    <v-btn
      @click="generateImage"
      :disabled="!imageUpload?.image"
      color="purple-lighten-2"
      block
      dark
      >Revive</v-btn
    >
  </div>
</template>
<style scoped></style>
