<script setup lang="ts">
import { useEventSource } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import type { JobStatus } from '@/types'

import { useAuthStore } from '@/stores/auth'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

import ImageUpload from '@/components/Aside/ImageUpload.vue'

const router = useRouter()
const { isSignedIn } = useUser()
const userStore = useUserStore()
const generateStore = useGenerateStore()
const { userId, history } = storeToRefs(userStore)
const { reviveInProgress, images } = storeToRefs(generateStore)
const { getToken } = useAuthStore()
const token = await getToken()
const progressUrl = ref('')
const { data, close, open } = useEventSource(progressUrl, [], {
  immediate: false
})
const imageUpload = ref()

async function generateImage() {
  if (isSignedIn.value) {
    const body = {
      image: imageUpload?.value?.image
    }
    generateStore.reviveOldImage(body)
    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?userId=${userId.value}&token=${token}`
    open()
    localStorage.setItem('reviveInProgress', 'true')
    reviveInProgress.value = true
  } else {
    router.push('/signin')
  }
}

watch(data, (newVal) => {
  const data: JobStatus = JSON.parse(newVal as string)
  if (data.status === 'processing') {
    localStorage.setItem('reviveInProgress', 'true')
    reviveInProgress.value = true
  }
  if (data.status === 'completed') {
    close()
    localStorage.setItem('reviveInProgress', 'false')
    reviveInProgress.value = false
    images.value = data.image.images
    history.value.push(data.image)
    userStore.setCredits(data.userCreditsRemaining)
  }
})

onMounted(async () => {
  const inProgress = JSON.parse(localStorage.getItem('reviveInProgress') as string)
  if (inProgress === true) {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') as string)
    reviveInProgress.value = true
    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?userId=${userDetails.userId}&token=${token}`
    open()
  }
})
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
