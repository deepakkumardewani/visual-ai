<script setup lang="ts">
import { useUser } from 'vue-clerk'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import { type ImageBody, useGenerateStore } from '@/stores/generate'
import { PROMPTS } from '@/utils/constants'
import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants'

const { smAndUp } = useDisplay()
const generateStore = useGenerateStore()

const { isSignedIn } = useUser()
const route = useRoute()
const router = useRouter()
const prompt = ref<string>('')
const noOfOutputs = ref<number>(1)
const outputQuality = ref<number>(0)
const aspectRatio = ref<string>('1:1')
const outputFormat = ref<string>('jpg')
const menu = ref(false)

type Feature = {
  title: string
  icon: string
}
const feature = ref<Feature>({
  title: 'AI Image Generator',
  icon: '$image'
})
const features = ref<Feature[]>([
  {
    title: 'AI Image Generator',
    icon: '$image'
  },
  {
    title: 'Image Upscaler',
    icon: '$upscale'
  },
  {
    title: 'Colorize Image',
    icon: '$colorize'
  },
  {
    title: 'Revive Old Photos',
    icon: '$camera'
  }
])

async function generateImage() {
  if (isSignedIn.value) {
    const input: ImageBody = {
      prompt: prompt.value,
      noOfOutputs: noOfOutputs.value,
      outputQuality: outputQuality.value === 0 ? 50 : 100,
      aspectRatio: aspectRatio.value,
      outputFormat: outputFormat.value
    }
    generateStore.generateImage(input)
  } else {
    // Show sign in modal
    router.push('/signin')
  }
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
  <div class="mb-6">
    <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">Prompt</p>

    <v-textarea
      v-if="smAndUp"
      v-model.trim="prompt"
      variant="outlined"
      rounded="2"
      placeholder="Describe your image"
      no-resize
      hide-details
      density="compact"
    ></v-textarea>
    <div v-else class="d-flex">
      <v-text-field
        v-model.trim="prompt"
        variant="outlined"
        rounded="2"
        placeholder="Describe your image"
        no-resize
        hide-details
        density="compact"
      ></v-text-field>

      <v-menu v-model="menu" :close-on-content-click="false" location="bottom" offset="10">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="pa-2 mx-1" variant="tonal" size="sm">
            <v-icon icon="fa:fas fa-gear" />
          </v-btn>
        </template>

        <v-card min-width="405">
          <div class="mb-6 pa-4">
            <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">
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
            <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">Size</p>
            <v-select
              :items="ASPECT_RATIOS"
              item-title="title"
              density="compact"
              variant="outlined"
              hide-details
              v-model="aspectRatio"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item :disabled="item.raw.isPro" v-bind="props">
                  <template v-slot:append>
                    <v-icon v-if="item.raw.isPro" size="x-small" icon="fa:fas fa-square" />
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>
          <div class="mb-6">
            <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">
              Image Format
            </p>
            <v-select
              :items="IMAGE_FORMATS"
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
            <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">
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

          <!-- <v-card-actions>
                <v-spacer></v-spacer>
  
                <v-btn variant="text" @click="menu = false"> Cancel </v-btn>
                <v-btn color="primary" variant="text" @click="menu = false"> Save </v-btn>
              </v-card-actions> -->
        </v-card>
      </v-menu>
    </div>

    <div class="d-flex mt-2">
      <div class="text-caption">No inspiration?</div>
      <v-btn @click="randomPrompt" variant="text" size="x-small" class="text-caption mx-2"
        >Try random</v-btn
      >
    </div>

    <div class="mb-6" v-if="smAndUp">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">
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

    <div class="mb-6" v-if="smAndUp">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">Size</p>
      <v-select
        :items="ASPECT_RATIOS"
        item-title="title"
        density="compact"
        variant="outlined"
        hide-details
        v-model="aspectRatio"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props">
            <template v-slot:append>
              <v-icon v-if="item.raw.isPro" color="yellow" size="x-small" icon="fa:fas fa-crown" />
            </template>
          </v-list-item>
        </template>
      </v-select>
    </div>
    <div class="mb-6" v-if="smAndUp">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">
        Image Format
      </p>
      <v-select
        :items="IMAGE_FORMATS"
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
    <div class="mb-6" v-if="smAndUp">
      <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-neutral-900 text-heading">
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
  </div>

  <div>
    <v-btn @click="generateImage" :disabled="prompt === ''" color="purple-lighten-2" block dark
      >Create</v-btn
    >
  </div>
</template>

<style lang="scss" scoped></style>
