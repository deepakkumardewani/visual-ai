<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

import ImageUpload from '@/components/Aside/ImageUpload.vue'

const router = useRouter()
const { isSignedIn } = useUser()
const dialogStore = useDialogStore()
const userStore = useUserStore()
const generateStore = useGenerateStore()
const appStore = useAppStore()
const { isPro, credits } = storeToRefs(userStore)
const { reviveInProgress } = storeToRefs(generateStore)

const imageUpload = ref()

async function generateImage() {
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
      image: imageUpload?.value?.image
    }
    generateStore.reviveOldImage(body)
    appStore.reviveSource.open()
    localStorage.setItem('reviveInProgress', 'true')
    reviveInProgress.value = true
  } else {
    router.push('/signin')
  }
}

onMounted(async () => {
  const inProgress = JSON.parse(localStorage.getItem('reviveInProgress') as string)
  if (inProgress === true) {
    reviveInProgress.value = true
    appStore.reviveSource.open()
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
