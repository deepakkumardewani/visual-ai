<script setup lang="ts">
// import { storeToRefs } from 'pinia'
// import { SignedOut } from 'vue-clerk'
// import { useRouter } from 'vue-router'
import LoginDialog from '@/components/Dialogs/LoginDialog.vue'
import FeatureScroll from '@/components/Home/FeatureScroll.vue'

// import { useLocal } from '@/composables/local'
// // import { useDialogStore } from '@/stores/dialog'
// import { useGenerateStore } from '@/stores/generate'

// const dialogStore = useDialogStore()
// const router = useRouter()

// const generateStore = useGenerateStore()
// const { isLoading } = storeToRefs(generateStore)
// const { setLocal, getLocal } = useLocal()
// const prompt = ref<string>('')
// const image = ref<string>('')
// async function generateImg() {
//   const localDetails = getLocal('details')
//   if (localDetails.isImageGenerated) {
//     // dialogStore.reveal()
//     router.push({ path: '/generate', query: { prompt: prompt.value } })
//   } else {
//     await generateStore.generateImage({ prompt: prompt.value })
//     image.value = generateStore.image
//     const details = {
//       prompt: prompt.value,
//       image: image.value,
//       isImageGenerated: true
//     }

//     // store details to localStorage
//     setLocal('details', details)
//   }
// }

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
        <div
          class="text-h4 text-sm-h1 font-weight-bold tw-text-slate-900 dark:tw-text-neutral-100 text-center"
        >
          <div
            v-motion
            :initial="{
              opacity: 0,
              x: -100
            }"
            :visibleOnce="{
              opacity: 1,
              x: 0
            }"
            :delay="100"
            :duration="300"
          >
            Bring Images to Life
          </div>
          <div
            v-motion
            :initial="{
              opacity: 0,
              x: -100
            }"
            :visibleOnce="{
              opacity: 1,
              x: 0
            }"
            :delay="200"
            :duration="300"
          >
            with Visual AI
          </div>
          <div
            v-motion
            :initial="{
              opacity: 0,
              x: -100
            }"
            :visibleOnce="{
              opacity: 1,
              x: 0
            }"
            :delay="300"
            :duration="300"
          >
            It's Fast and Simple
          </div>
        </div>
      </v-col>
    </v-row>

    <FeatureScroll />

    <div class="tw-flex tw-justify-center tw-mt-12 tw-mb-36">
      <v-btn to="/signin" class="text-none" color="purple-lighten-1" size="large" variant="flat"
        >Get Started - it's Free</v-btn
      >
    </div>
    <!-- <v-row class="align-center justify-center">
      <v-col cols="12" sm="8">
      </v-col>
    </v-row> -->

    <!-- <SignedOut>
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
    </SignedOut> -->

    <LoginDialog />
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
