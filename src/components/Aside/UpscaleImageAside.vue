<script setup lang="ts">
import { useEventSource } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import Heading from '@/components/Aside/Heading.vue'
import ImageUpload from '@/components/Aside/ImageUpload.vue'
import { useAuthStore } from '@/stores/auth'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

const { getToken } = useAuthStore()
const token = await getToken()

const userStore = useUserStore()

let progressUrl = ref(`${import.meta.env.VITE_API_BASEPATH}/upscale/progress`)
const { data, close, open } = useEventSource(progressUrl, [], {
  immediate: false
})
const router = useRouter()
const { isSignedIn } = useUser()
const generateStore = useGenerateStore()
const { userId } = storeToRefs(userStore)
const { upscaleInProgress, originalImage, enhancedImage } = storeToRefs(generateStore)
const SCALE = {
  0: 2,
  1: 3,
  2: 4,
  3: 8
}

const imageUpload = ref()
const scale = ref<number>(0)
const creativity = ref<number>(0.1)
const showAlert = ref<boolean>(false)
const prompt = ref<string>('')
const negativePrompt = ref<string>('')
async function generateImage() {
  if (isSignedIn.value) {
    const data = {
      prompt: prompt.value,
      negativePrompt: negativePrompt.value,
      image: imageUpload?.value?.image,
      format: imageUpload?.value?.image.name.split('.').pop(),
      creativity: creativity.value,
      scale: SCALE[scale.value as keyof typeof SCALE]
    }
    console.log(data)

    generateStore.upscaleImage(data)
    progressUrl.value = `${progressUrl.value}?userId=${userId.value}&token=${token}`
    showAlert.value = true
    open()
    localStorage.setItem('upscaleInProgress', 'true')
    upscaleInProgress.value = true
  } else {
    router.push('/signin')
  }
}

watch(data, (newVal) => {
  const data = JSON.parse(newVal as string)
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
    originalImage.value = data.original
    enhancedImage.value = data.enhanced
    userStore.setCredits(data.userCreditsRemaining)
  }
})

onMounted(async () => {
  const inProgress = JSON.parse(localStorage.getItem('upscaleInProgress') as string)
  if (inProgress === true) {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') as string)
    upscaleInProgress.value = true
    progressUrl.value = `${progressUrl.value}?userId=${userDetails.userId}&token=${token}`
    open()
  }
})

onUnmounted(() => {
  showAlert.value = false
  localStorage.setItem('upscaleInProgress', 'false')
  upscaleInProgress.value = false
})
</script>
<template>
  <ImageUpload ref="imageUpload" />
  <div class="mb-6">
    <Heading title="Scale" />
    <v-btn-toggle v-model="scale" mandatory variant="outlined" divided>
      <v-btn text="2X"></v-btn>
      <v-btn text="3X"></v-btn>
      <v-btn text="4X"></v-btn>
      <v-btn text="8X">
        <template v-slot:append>
          <v-icon size="x-small" icon="$star" />
        </template>
      </v-btn>
    </v-btn-toggle>
    <!-- <div>
      <span class="text-caption">
        Upscaled Image size: {{ RESOLUTION[resolution as keyof typeof RESOLUTION] }}
      </span>
    </div> -->
  </div>
  <div class="mb-6">
    <Heading title="Creativity" />
    <v-slider v-model="creativity" :max="1" :min="0.1">
      <template v-slot:append>
        <div class="tw-text-sm tw-text-gray-500 tw-w-4">
          {{ creativity.toFixed(1) }}
        </div>
      </template>
    </v-slider>
  </div>
  <div class="mb-6">
    <Heading title="Prompt" />
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
