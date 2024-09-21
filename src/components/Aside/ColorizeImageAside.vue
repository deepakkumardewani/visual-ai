<script setup lang="ts">
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import Heading from '@/components/Aside/Heading.vue'
import ImageUpload from '@/components/Aside/ImageUpload.vue'
import { type Mode } from '@/stores/aside'
import { useGenerateStore } from '@/stores/generate'
import { MODEL_IDS } from '@/utils/constants'

const router = useRouter()
// const route = useRoute()
const { isSignedIn } = useUser()
const { smAndUp } = useDisplay()
const generateStore = useGenerateStore()

const imageUpload = ref()
const modes = ref([
  {
    title: 'Basic',
    id: MODEL_IDS.COLORIZE_BASIC,
    description: 'Applies Basic coloring',
    icon: 'fas fa-palette'
  },
  {
    title: 'Advanced',
    id: MODEL_IDS.COLORIZE_ADVANCED,
    description: 'Applies Advanced photo-realistic coloring',
    icon: 'fas fa-eraser'
  }
])
const mode = ref<Mode>(modes.value[0])

function handleSelected(item: Mode) {
  mode.value = item
}

async function generateImage() {
  if (isSignedIn.value) {
    const body = {
      image: imageUpload?.value?.image,
      modelId: mode.value.id
    }
    console.log('body', body)

    generateStore.colorizeImage(body)
  } else {
    // Show sign in modal
    router.push('/signin')
  }
}
</script>
<template>
  <div class="mb-6">
    <ImageUpload ref="imageUpload" />
    <Heading title="Mode" />
    <v-select
      @update:model-value="handleSelected"
      :items="modes"
      v-model="mode"
      bg-color="transparent"
      variant="outlined"
      :prepend-inner-icon="mode.icon"
      density="compact"
      hide-details
      item-title="title"
      return-object
    >
      <template v-slot:item="{ item, props }">
        <v-list-item v-bind="props" :max-width="smAndUp ? '300' : '350'">
          <template v-slot:prepend>
            <div
              class="tw-flex tw-justify-start tw-align-top mr-2"
              :class="smAndUp ? 'mt-n3' : 'mt-n5'"
            >
              <v-icon ize="small" :icon="item.raw.icon" />
            </div>
          </template>
          <v-list-item-subtitle v-html="item.raw.description" class="wrap-text">
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-select>
  </div>
  <div>
    <v-btn
      @click="generateImage"
      :disabled="!imageUpload?.image"
      color="purple-lighten-2"
      block
      dark
      >Colorize</v-btn
    >
  </div>
</template>
<style scoped>
.wrap-text {
  line-clamp: unset !important;
  -webkit-line-clamp: unset !important;
}
</style>
