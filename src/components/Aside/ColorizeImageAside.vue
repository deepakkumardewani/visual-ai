<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

// import Heading from '@/components/Aside/Heading.vue'
import ImageUpload from '@/components/Aside/ImageUpload.vue'
import PremiumDialog from '@/components/Dialogs/PremiumDialog.vue'

import { MODEL_IDS } from '@/utils/constants'

const userStore = useUserStore()
const dialogStore = useDialogStore()
const appStore = useAppStore()
const { isPro, credits, userId } = storeToRefs(userStore)
const { progressUrl } = storeToRefs(appStore)
const router = useRouter()
const { isSignedIn } = useUser()
// const { smAndUp } = useDisplay()
const generateStore = useGenerateStore()
const { colorizeInProgress } = storeToRefs(generateStore)

const imageUpload = ref()
// const modes = ref([
//   {
//     title: 'Basic',
//     id: MODEL_IDS.COLORIZE_BASIC,
//     description: 'Applies Basic coloring',
//     icon: 'fas fa-palette',
//     isPro: false
//   },
//   {
//     title: 'Advanced',
//     id: MODEL_IDS.COLORIZE_ADVANCED,
//     description: 'Applies Advanced photo-realistic coloring',
//     icon: 'fas fa-eraser',
//     isPro: true
//   }
// ])
// const mode = ref<Mode>(modes.value[0])

// function handleSelected(item: Mode) {
//   if (!userDetails.value?.isPro && item.isPro) {
//     mode.value = modes.value[0]
//     dialogStore.showPremium()
//   } else {
//     mode.value = item
//   }
// }

async function colorizeImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup()
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

  if (isSignedIn.value) {
    const body = {
      image: imageUpload?.value?.image,
      modelId: MODEL_IDS.COLORIZE_ADVANCED
    }
    generateStore.colorizeImage(body)
    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?userId=${userId.value}`
    appStore.colorizeOpen()
    localStorage.setItem('colorizeInProgress', 'true')
    colorizeInProgress.value = true
  } else {
    // Show sign in modal
    router.push('/signin')
  }
}

onMounted(async () => {
  const inProgress = JSON.parse(localStorage.getItem('colorizeInProgress') as string)
  if (inProgress === true) {
    colorizeInProgress.value = true
    appStore.colorizeOpen()
  }
})
</script>
<template>
  <div class="mb-6">
    <ImageUpload ref="imageUpload" />
  </div>
  <div>
    <v-btn
      @click="colorizeImage"
      text="Colorize"
      :disabled="!imageUpload?.image || colorizeInProgress"
      color="purple-lighten-2"
      block
      dark
    >
    </v-btn>
  </div>
  <PremiumDialog />
</template>
<style scoped>
.wrap-text {
  line-clamp: unset !important;
  -webkit-line-clamp: unset !important;
}
</style>
