<script setup lang="ts">
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import Heading from '@/components/Aside/Heading.vue'
import ImageUpload from '@/components/Aside/ImageUpload.vue'
import { useGenerateStore } from '@/stores/generate'

const router = useRouter()

const { isSignedIn } = useUser()

const generateStore = useGenerateStore()

const SCALE = {
  0: 2,
  1: 3,
  2: 4,
  3: 8
}

const imageUpload = ref()
const scale = ref<number>(0)
const creativity = ref<number>(0.1)
const image = ref()
const prompt = ref<string>('')
const negativePrompt = ref<string>('')
async function generateImage() {
  if (isSignedIn.value) {
    const data = {
      prompt: prompt.value,
      negativePrompt: negativePrompt.value,
      image: image.value,
      creativity: creativity.value,
      scale: SCALE[scale.value as keyof typeof SCALE]
    }

    generateStore.upscaleImage(data)
  } else {
    // Show sign in modal
    router.push('/signin')
  }
}
</script>
<template>
  <ImageUpload ref="imageUpload" />
  <div class="mb-6">
    <Heading title="Scale" />
    <v-btn-toggle v-model="scale" mandatory variant="outlined" divided>
      <v-btn>2X</v-btn>
      <v-btn>3X</v-btn>
      <v-btn>4X</v-btn>
      <v-btn
        >8X
        <template v-slot:append>
          <v-icon size="x-small" icon="fa:fas fa-lock" />
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
        <!-- <v-text-field
        v-model="creativity"
        density="compact"
        style="width: 70px"
        type="number"
        hide-details
        single-line
      ></v-text-field> -->
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
    <v-btn @click="generateImage" :disabled="!image" color="purple-lighten-2" block dark
      >Upscale</v-btn
    >
  </div>
</template>

<style scoped></style>
