<script setup lang="ts">
import { useEventSource } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import type { JobStatus } from '@/types'

import { useAuthStore } from '@/stores/auth'
import { useDialogStore } from '@/stores/dialog'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

import Heading from '@/components/Aside/Heading.vue'
import ImageUpload from '@/components/Aside/ImageUpload.vue'

import { IMAGE_SIZES } from '@/utils/constants'

const { getToken } = useAuthStore()

const userStore = useUserStore()
const dialogStore = useDialogStore()
const router = useRouter()
const { isSignedIn } = useUser()
const generateStore = useGenerateStore()
const { userId, history, isPro, credits } = storeToRefs(userStore)
const { upscaleInProgress, images } = storeToRefs(generateStore)

const SCALE = {
  '2X': 2,
  '4X': 4,
  '6X': 6,
  '8X': 8
}

const progressUrl = ref('')
const { data, close, open } = useEventSource(progressUrl, [], {
  immediate: false
})
const imageUpload = ref()
const scale = ref<string>('2X')
const creativity = ref<number>(0.1)
const showAlert = ref<boolean>(false)
const prompt = ref<string>('')
const negativePrompt = ref<string>('')

async function generateImage() {
  if (!isSignedIn.value) {
    router.push('/signin')
    return
  }

  if (!isPro.value && credits.value < 3) {
    dialogStore.showLowCredits()
    return
  }

  if (isPro.value && credits.value === 0) {
    dialogStore.showLowCredits()
    return
  }

  console.log('generateImage')
  progressUrl.value = ''
  if (isSignedIn.value) {
    const token = await getToken()
    const data = {
      prompt: prompt.value,
      negativePrompt: negativePrompt.value,
      image: imageUpload?.value?.image,
      format: imageUpload?.value?.image.name.split('.').pop(),
      creativity: creativity.value,
      scale: SCALE[scale.value as keyof typeof SCALE]
    }

    generateStore.upscaleImage(data)
    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?userId=${userId.value}&token=${token}`
    showAlert.value = true
    open()
    localStorage.setItem('upscaleInProgress', 'true')
    upscaleInProgress.value = true
    console.log('upscaleInProgress', upscaleInProgress.value)
  } else {
    router.push('/signin')
  }
}

watch(data, (newVal) => {
  const data: JobStatus = JSON.parse(newVal as string)
  if (data.status === 'processing') {
    showAlert.value = true
    localStorage.setItem('upscaleInProgress', 'true')
    upscaleInProgress.value = true
  }
  if (data.status === 'completed') {
    close()
    showAlert.value = false
    localStorage.setItem('upscaleInProgress', 'false')
    upscaleInProgress.value = false
    images.value = data.image.images
    history.value.push(data.image)
    userStore.setCredits(data.userCreditsRemaining)
  }
})

onMounted(async () => {
  const inProgress = JSON.parse(localStorage.getItem('upscaleInProgress') as string)
  console.log('inProgress', inProgress)
  if (inProgress === true) {
    const token = await getToken()
    const userDetails = JSON.parse(localStorage.getItem('userDetails') as string)
    upscaleInProgress.value = true
    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?userId=${userDetails.userId}&token=${token}`
    open()
  }
})

onUnmounted(() => {
  // close()
  // showAlert.value = false
  // // localStorage.setItem('upscaleInProgress', 'false')
  // upscaleInProgress.value = false
})
</script>
<template>
  <ImageUpload ref="imageUpload" />
  <div class="mb-2">
    <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
      <div class="tw-flex-1">
        <Heading title="Scale" />
        <v-select
          :items="IMAGE_SIZES"
          item-title="title"
          density="compact"
          variant="outlined"
          hide-details
          v-model="scale"
        >
          <template v-slot:item="{ props }">
            <v-list-item v-bind="props"> </v-list-item>
          </template>
        </v-select>
      </div>
      <div class="tw-flex-1">
        <Heading title="Creativity" />
        <v-slider v-model="creativity" :max="1" :min="0.1">
          <template v-slot:append>
            <div class="tw-text-sm tw-text-gray-500 tw-w-4">
              {{ creativity.toFixed(1) }}
            </div>
          </template>
        </v-slider>
      </div>
    </div>
    <!-- <Heading title="Scale" />
    <v-btn-toggle v-model="scale" mandatory variant="outlined" divided>
      <v-btn text="2X"></v-btn>
      <v-btn text="3X"></v-btn>
      <v-btn text="4X"></v-btn>
      <v-btn text="8X">
        <template v-slot:append>
          <v-icon size="x-small" icon="$star" />
        </template>
      </v-btn>
    </v-btn-toggle> -->
    <!-- <div>
      <span class="text-caption">
        Upscaled Image size: {{ RESOLUTION[resolution as keyof typeof RESOLUTION] }}
      </span>
    </div> -->
  </div>
  <div class="mb-6">
    <Heading title="Prompt" />
    <v-text-field
      v-model.trim="prompt"
      variant="outlined"
      rounded="2"
      placeholder="Describe your image for better results"
      hide-details
      density="compact"
    ></v-text-field>
  </div>
  <div>
    <v-btn
      @click="generateImage"
      text="Upscale"
      :disabled="!imageUpload?.image"
      color="purple-lighten-2"
      block
      dark
    >
    </v-btn>
  </div>
</template>

<style scoped></style>
