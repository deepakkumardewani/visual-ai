<script setup lang="ts">
import { useRoute } from 'vue-router'

import { useGenerateStore } from '@/stores/generate'
import type { ImageBody } from '@/stores/generate'
import { PROMPTS } from '@/stores/generate'

const generateStore = useGenerateStore()

const route = useRoute()
const prompt = ref<string>('')
const noOfOutputs = ref<number>(1)
const outputQuality = ref<number>(0)
const aspectRatio = ref<string>('1:1')
const outputFormat = ref<string>('jpg')
const imgFormats = [
  {
    title: 'jpg',
    isPro: false
  },
  {
    title: 'png',
    isPro: true
  },
  {
    title: 'webp',
    isPro: true
  }
]

const aspectRatios = [
  {
    title: '1:1',
    isPro: false
  },
  {
    title: '16:9',
    isPro: false
  },
  {
    title: '21:9',
    isPro: true
  },
  {
    title: '2:3',
    isPro: true
  },
  {
    title: '3:2',
    isPro: true
  },
  {
    title: '4:5',
    isPro: true
  },
  {
    title: '5:4',
    isPro: true
  },
  {
    title: '9:16',
    isPro: true
  },
  {
    title: '9:21',
    isPro: true
  }
]

async function generateImage() {
  const input: ImageBody = {
    prompt: prompt.value,
    noOfOutputs: noOfOutputs.value,
    outputQuality: outputQuality.value === 0 ? 50 : 100,
    aspectRatio: aspectRatio.value,
    outputFormat: outputFormat.value
  }
  generateStore.generateImage(input)
}

function randomPrompt() {
  const randomIndex = Math.floor(Math.random() * PROMPTS.length)
  prompt.value = PROMPTS[randomIndex]
}
onMounted(() => {
  prompt.value = (route.query.prompt as string) ?? ''
})
</script>
<template>
  <div class="pa-4 dark:tw-bg-neutral-900">
    <div class="mb-6">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 dark:tw-text-white">
        Prompt
      </p>

      <v-textarea
        v-model="prompt"
        variant="outlined"
        rounded="2"
        placeholder="Describe your image"
        no-resize
        hide-details
        density="compact"
      ></v-textarea>

      <div class="d-flex mt-2">
        <div class="text-caption">No inspiration?</div>
        <v-btn @click="randomPrompt" variant="text" size="x-small" class="text-caption mx-2"
          >Try random</v-btn
        >
      </div>
    </div>

    <div class="mb-6">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 dark:tw-text-white">
        Image Quality
      </p>
      <v-btn-toggle v-model="outputQuality" mandatory variant="outlined" block divided>
        <v-btn>SD</v-btn>
        <v-btn
          >HD
          <template v-slot:append>
            <v-icon size="x-small" icon="fa:fas fa-lock" />
          </template>
        </v-btn>
      </v-btn-toggle>
    </div>
    <div class="mb-6">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 dark:tw-text-white">Size</p>
      <v-select
        :items="aspectRatios"
        item-title="title"
        density="compact"
        variant="outlined"
        hide-details
        v-model="aspectRatio"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item :disabled="item.raw.isPro" v-bind="props">
            <template v-slot:append>
              <v-icon v-if="item.raw.isPro" size="x-small" icon="fa:fas fa-lock" />
            </template>
          </v-list-item>
        </template>
      </v-select>
    </div>
    <div class="mb-6">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 dark:tw-text-white">
        Image Format
      </p>
      <v-select
        :items="imgFormats"
        item-title="title"
        density="compact"
        variant="outlined"
        hide-details
        v-model="outputFormat"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item :disabled="item.raw.isPro" v-bind="props" append-icon="fa:fas fa-lock">
            <template v-slot:append>
              <v-icon v-if="item.raw.isPro" size="x-small" icon="fa:fas fa-lock" />
            </template>
          </v-list-item>
        </template>
      </v-select>
    </div>
    <div class="mb-6">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 dark:tw-text-white">
        Image Variations
      </p>
      <v-select
        :items="[1, 2, 3, 4]"
        variant="outlined"
        hide-details
        density="compact"
        v-model="noOfOutputs"
      ></v-select>
    </div>
    <div>
      <v-btn @click="generateImage" color="purple-lighten-2" block dark>Create</v-btn>
    </div>
  </div>
</template>

<style scoped></style>
