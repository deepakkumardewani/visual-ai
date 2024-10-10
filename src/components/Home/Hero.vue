<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SignedOut } from 'vue-clerk'
import { useRouter } from 'vue-router'

import LoginModal from '@/components/LoginModal.vue'
import { useLocal } from '@/composables/local'
// import { useDialogStore } from '@/stores/dialog'
import { useGenerateStore } from '@/stores/generate'

// const dialogStore = useDialogStore()
const router = useRouter()

const generateStore = useGenerateStore()
const { isLoading } = storeToRefs(generateStore)
const { setLocal, getLocal } = useLocal()
const prompt = ref<string>('')
const image = ref<string>('')
async function generateImg() {
  const localDetails = getLocal('details')
  if (localDetails.isImageGenerated) {
    // dialogStore.reveal()
    router.push({ path: '/generate', query: { prompt: prompt.value } })
  } else {
    await generateStore.generateImage({ prompt: prompt.value })
    image.value = generateStore.image
    const details = {
      prompt: prompt.value,
      image: image.value,
      isImageGenerated: true
    }

    // store details to localStorage
    setLocal('details', details)
  }
}

// onMounted(() => {
//   const details = getLocal('details')
//   if (details.image !== '') {
//     image.value = JSON.parse(localStorage.getItem('details') ?? '').image
//   }
//   if (details.prompt !== '') {
//     prompt.value = JSON.parse(localStorage.getItem('details') ?? '').prompt
//   }
// })
</script>
<template>
  <div id="hero">
    <v-row class="align-center justify-center">
      <v-col cols="12">
        <div class="text-h4 text-sm-h1 font-weight-bold text-center">
          <span> Turn Your Text Into Stunning Images </span>
        </div>
      </v-col>
    </v-row>
    <v-row class="align-center justify-center">
      <v-col cols="12" sm="8">
        <div class="text-h6 text-sm-h4 text-center">
          <p class="text-center">
            Our AI-powered image generator allows you to create unique, high-quality images from
            your text in just a few clicks.
          </p>
        </div>
      </v-col>
    </v-row>
    <SignedOut>
      <v-row class="align-center justify-center">
        <v-col cols="12" sm="9">
          <v-text-field
            v-model="prompt"
            variant="outlined"
            rounded="2"
            placeholder="Enter your prompt"
            hide-details
            density="compact"
          ></v-text-field>
        </v-col>
        <v-col cols="6" sm="3">
          <v-btn block @click="generateImg" dark>Create Image</v-btn>
        </v-col>
      </v-row>
      <v-row class="align-center justify-center">
        <v-col cols="12" sm="12">
          <div class="rounded-lg border-thin" :class="{ 'demo-img': isLoading || image !== '' }">
            <v-skeleton-loader v-if="isLoading" type="image"></v-skeleton-loader>
            <v-img v-else class="w-100" aspect-ratio="16/9" cover :src="image"></v-img>
          </div>
        </v-col>
      </v-row>
    </SignedOut>

    <LoginModal />
  </div>
</template>

<style scoped lang="scss">
.demo-img {
  height: 400px;
  width: 100%;
}

:deep(.v-skeleton-loader) {
  height: 100%;
  .v-skeleton-loader__image {
    height: 100%;
  }
}
</style>
