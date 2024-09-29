<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUser } from 'vue-clerk'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import Heading from '@/components/Aside/Heading.vue'
import PremiumDialog from '@/components/PremiumDialog.vue'
import { useAppStore } from '@/stores/app'
import { type Mode } from '@/stores/aside'
import { useDialogStore } from '@/stores/dialog'
import { type ImageBody, useGenerateStore } from '@/stores/generate'
import { FLUX_MODES } from '@/utils/constants'
import { PROMPTS } from '@/utils/constants'
import { ASPECT_RATIOS, IMAGE_FORMATS, IMAGE_VARIATIONS } from '@/utils/constants'

type ImageVariation = {
  title: string
  isPro: boolean
  value: number
}
const { smAndUp } = useDisplay()
const generateStore = useGenerateStore()
const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
const dialogStore = useDialogStore()
const { isSignedIn } = useUser()
const route = useRoute()
const router = useRouter()
const prompt = ref<string>('')
const noOfOutputs = ref<ImageVariation>(IMAGE_VARIATIONS[0])
const outputQuality = ref<number>(0)
const aspectRatio = ref<string>('1:1')
const outputFormat = ref<string>('jpg')
const menu = ref(false)
const textAreaFocused = ref(false)
const mode = ref<Mode>(FLUX_MODES[0])

function handleSelected(item: Mode) {
  mode.value = item
}

async function generateImage() {
  if (isSignedIn.value) {
    const input: ImageBody = {
      prompt: prompt.value,
      noOfOutputs: noOfOutputs.value.value,
      outputQuality: outputQuality.value === 0 ? 70 : 100,
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

function handleImageVariations(selected: any) {
  if (selected.isPro) {
    dialogStore.showPremium()
  }
}

function focusTextArea(event: any) {
  event ? (textAreaFocused.value = true) : (textAreaFocused.value = false)
}

onMounted(() => {
  prompt.value = (route.query.prompt as string) ?? ''
})
</script>
<template>
  <div class="mb-6">
    <Heading title="Prompt" />
    <v-textarea
      v-if="smAndUp"
      v-model.trim="prompt"
      variant="outlined"
      rounded="2"
      rows="3"
      placeholder="Describe your image"
      no-resize
      hide-details
      density="compact"
    ></v-textarea>
    <div v-else class="d-flex">
      <div class="tw-w-[85%]">
        <v-textarea
          v-model.trim="prompt"
          variant="outlined"
          rounded="2"
          :rows="textAreaFocused ? 3 : 1"
          placeholder="Describe your image"
          no-resize
          clearable
          hide-details
          density="compact"
          @update:focused="focusTextArea"
        ></v-textarea>
      </div>

      <div class="tw-w-[15%]">
        <v-menu
          v-model="menu"
          content-class="custom-menu"
          :close-on-content-click="false"
          location="bottom"
          offset="10"
        >
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" class="pa-2 ml-4" variant="tonal" size="sm">
              <v-icon icon="fa:fas fa-gear" />
            </v-btn>
          </template>

          <v-card min-width="360" class="pa-4">
            <div class="mb-6">
              <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
                <div class="tw-flex-1">
                  <Heading title="Size" />
                  <v-select
                    :items="ASPECT_RATIOS"
                    item-title="title"
                    density="compact"
                    variant="outlined"
                    hide-details
                    v-model="aspectRatio"
                  >
                    <template v-slot:item="{ props }">
                      <v-list-item v-bind="props"> </v-list-item>
                    </template>
                  </v-select>
                </div>
                <div class="tw-flex-1">
                  <Heading title="Format" />
                  <v-select
                    :items="IMAGE_FORMATS"
                    item-title="title"
                    density="compact"
                    variant="outlined"
                    hide-details
                    v-model="outputFormat"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item :disabled="item.raw.isPro" v-bind="props">
                        <template v-slot:append>
                          <v-icon v-if="item.raw.isPro" size="x-small" icon="$star" />
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>
                </div>
              </div>
            </div>
            <div class="mb-6">
              <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
                <div class="tw-w-1/2">
                  <Heading title="Image Quality" />
                  <v-btn-toggle
                    v-model="outputQuality"
                    density="compact"
                    mandatory
                    variant="outlined"
                  >
                    <v-btn>SD</v-btn>
                    <v-btn>HD</v-btn>
                  </v-btn-toggle>
                </div>
                <div class="tw-w-1/2">
                  <Heading title="Variations" />

                  <div
                    class="tw-flex tw-justify-between tw-items-center border-thin tw-rounded tw-h-[36px]"
                  >
                    <div class="tw-flex-1 tw-text-center">
                      <v-btn
                        variant="text"
                        @click="noOfOutputs.value = Math.max(1, noOfOutputs.value - 1)"
                      >
                        <v-icon icon="fa:fas fa-minus" />
                      </v-btn>
                    </div>
                    <div class="tw-flex-1 tw-text-center">
                      <span class="tw-text-lg tw-font-semibold">{{ noOfOutputs.value }}</span>
                    </div>
                    <div class="tw-flex-1 tw-text-center">
                      <v-btn
                        variant="text"
                        @click="noOfOutputs.value = Math.min(4, noOfOutputs.value + 1)"
                      >
                        <v-icon icon="fa:fas fa-plus" />
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card>
        </v-menu>
      </div>
    </div>

    <div class="d-flex mt-2 mb-4">
      <div class="text-caption">No inspiration?</div>
      <v-btn @click="randomPrompt" variant="text" size="x-small" class="text-caption mx-2"
        >Try random</v-btn
      >
    </div>

    <div class="mb-6">
      <Heading title="Mode" />
      <v-select
        @update:model-value="handleSelected"
        :items="FLUX_MODES"
        v-model="mode"
        bg-color="transparent"
        variant="outlined"
        :prepend-inner-icon="isDark ? `${mode.icon}Dark` : mode.icon"
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
                :class="smAndUp ? 'mt-n6' : 'mt-n7'"
              >
                <v-icon ize="small" :icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" />
              </div>
            </template>
            <v-list-item-subtitle v-html="item.raw.description" class="wrap-text">
            </v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-select>
    </div>
    <div class="mb-6" v-if="smAndUp">
      <Heading title="Image Quality" />
      <v-btn-toggle v-model="outputQuality" mandatory variant="outlined" block divided>
        <v-btn>SD</v-btn>
        <v-btn>HD </v-btn>
      </v-btn-toggle>
    </div>

    <div class="mb-6" v-if="smAndUp">
      <Heading title="Size" />
      <v-select
        :items="ASPECT_RATIOS"
        item-title="title"
        density="compact"
        variant="outlined"
        hide-details
        v-model="aspectRatio"
      >
        <template v-slot:item="{ props }">
          <v-list-item v-bind="props"> </v-list-item>
        </template>
      </v-select>
    </div>
    <div class="mb-6" v-if="smAndUp">
      <Heading title="Image Format" />
      <v-select
        :items="IMAGE_FORMATS"
        item-title="title"
        density="compact"
        variant="outlined"
        hide-details
        v-model="outputFormat"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props">
            <template v-slot:append>
              <v-icon v-if="item.raw.isPro" size="x-small" icon="$star" />
            </template>
          </v-list-item>
        </template>
      </v-select>
    </div>
    <div class="mb-6" v-if="smAndUp">
      <Heading title="Image Variations" />
      <v-select
        :items="IMAGE_VARIATIONS"
        variant="outlined"
        hide-details
        density="compact"
        v-model="noOfOutputs"
        @update:model-value="handleImageVariations"
        item-title="title"
        item-value="value"
        return-object
      >
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props">
            <template v-slot:append>
              <v-icon v-if="item.raw.isPro" size="x-small" icon="$star" />
            </template>
          </v-list-item>
        </template>
      </v-select>
    </div>
  </div>

  <div>
    <v-btn @click="generateImage" :disabled="prompt === ''" color="purple-lighten-2" block dark
      >Create</v-btn
    >
  </div>

  <PremiumDialog />
</template>

<style lang="scss" scoped>
.wrap-text {
  line-clamp: unset !important;
  -webkit-line-clamp: unset !important;
}
.custom-menu {
  margin-left: 100px !important;
  background-color: red;
}
.v-select__menu {
  margin-left: 10px !important;
}
</style>
