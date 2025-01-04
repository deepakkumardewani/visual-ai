<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useUser } from 'vue-clerk'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { VListItemTitle } from 'vuetify/components'

import { type ImageBody } from '@/types'

import { useAppStore } from '@/stores/app'
import { type Mode } from '@/stores/aside'
import { useDialogStore } from '@/stores/dialog'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

import CreateButton from '@/components/Aside/CreateButton.vue'
import Heading from '@/components/Aside/Heading.vue'

import { FLUX_MODES, MODEL_IDS } from '@/utils/constants'
import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants'
import PROMPTS from '@/utils/prompts.json'
import REALISTIC_PROMPTS from '@/utils/realisticPrompts.json'

// const route = useRoute()
const router = useRouter()
const generateStore = useGenerateStore()
const appStore = useAppStore()
const dialogStore = useDialogStore()
const userStore = useUserStore()
const { smAndUp } = useDisplay()
const { isSignedIn } = useUser()
const { isPro, credits } = storeToRefs(userStore)
const { isDark } = storeToRefs(appStore)
const { promptText } = storeToRefs(generateStore)

const prompt = ref<string>('')
const typingPrompt = ref<string>('')
const isTyping = ref(false)
const noOfOutputs = ref<number>(1)
const outputQuality = ref<number>(0)
const aspectRatio = ref<any>(ASPECT_RATIOS[0])
const outputFormat = ref<any>(IMAGE_FORMATS[0].title)
const menu = ref(false)
const textAreaFocused = ref(false)
const mode = ref<Mode>(FLUX_MODES[0])
const textareaRef = ref()

const disableModifyVariations = computed(() => {
  return mode.value.id === MODEL_IDS.FLUX_PRO || mode.value.id === MODEL_IDS.FLUX_1_1_PRO
})
function handleSelected(item: Mode) {
  if (!isPro.value && item.isPro) {
    mode.value = FLUX_MODES[1]
    router.push('/pricing')
    // dialogStore.showPricing()
  } else {
    mode.value = item
    if (item.id === MODEL_IDS.FLUX_PRO || item.id === MODEL_IDS.FLUX_1_1_PRO) {
      noOfOutputs.value = 1
    }
  }
}

function handleSizeSelected(item: any) {
  if (!isPro.value && item.isPro) {
    aspectRatio.value = ASPECT_RATIOS[0]
    router.push('/pricing')
  } else {
    aspectRatio.value = item
  }
}

function handleFormatSelected(item: any) {
  if (!isPro.value && item.isPro) {
    outputFormat.value = IMAGE_FORMATS[0].title
    router.push('/pricing')
  } else {
    outputFormat.value = item
  }
}

async function generateImage() {
  if (!isSignedIn.value) {
    router.push('/signin')
    return
  }

  if (credits.value === 0) {
    dialogStore.showLowCredits()
    return
  }

  const input: ImageBody = {
    modelId: mode.value.id,
    imageType: aspectRatio.value.type,
    modelName: mode.value.title,
    prompt: typingPrompt.value,
    noOfOutputs: noOfOutputs.value,
    outputQuality: outputQuality.value === 0 ? 70 : 100,
    aspectRatio: aspectRatio.value.title,
    outputFormat: outputFormat.value.toLowerCase()
  }

  generateStore.generateImage(input)
}

function randomPrompt() {
  let newPrompt = ''
  if (mode.value.id === MODEL_IDS.FLUX_REALISM) {
    const randomIndex = Math.floor(Math.random() * REALISTIC_PROMPTS.length)
    newPrompt = REALISTIC_PROMPTS[randomIndex]
  } else {
    const randomIndex = Math.floor(Math.random() * PROMPTS.length)
    newPrompt = PROMPTS[randomIndex]
  }
  typingPrompt.value = ''
  typePrompt(newPrompt)
  promptText.value = newPrompt
}

function typePrompt(text: string) {
  isTyping.value = true
  typingPrompt.value = ''
  prompt.value = ''

  let i = 0
  const typingInterval = setInterval(() => {
    if (i < text.length) {
      typingPrompt.value += text.charAt(i)
      i++
    } else {
      clearInterval(typingInterval)
      prompt.value = typingPrompt.value
      isTyping.value = false
    }
  }, 5)
}

function handleImageVariations(type: string) {
  if (type === 'subtract') {
    if (noOfOutputs.value === 4) {
      noOfOutputs.value = 2
    } else if (noOfOutputs.value > 1) {
      noOfOutputs.value = 1
    }
  } else {
    if (noOfOutputs.value === 2) {
      if (!isPro.value) {
        router.push('/pricing')
      } else {
        noOfOutputs.value = 4
      }
    } else if (noOfOutputs.value === 1) {
      noOfOutputs.value = 2
    }
  }
}

function focusTextArea(event: any) {
  textareaRef.value.focus()
  event ? (textAreaFocused.value = true) : (textAreaFocused.value = false)
}

watch(outputQuality, (newVal) => {
  if (!isPro.value && newVal === 1) {
    outputQuality.value = 0
    router.push('/pricing')
  }
})

watch(typingPrompt, (newVal) => {
  promptText.value = newVal
})

onMounted(() => {
  focusTextArea(true)
  typingPrompt.value = promptText.value ?? ''
})
</script>
<template>
  <div class="mb-6">
    <Heading title="Prompt" />
    <div v-if="smAndUp" class="tw-relative">
      <v-textarea
        ref="textareaRef"
        v-model.trim="typingPrompt"
        variant="outlined"
        rounded="2"
        rows="3"
        no-resize
        hide-details
        placeholder="Describe your image"
        density="compact"
        :readonly="isTyping"
      ></v-textarea>
    </div>
    <div v-else class="d-flex">
      <div class="tw-w-[85%]">
        <v-textarea
          ref="textareaRef"
          v-model.trim="typingPrompt"
          variant="outlined"
          rounded="2"
          :rows="textAreaFocused ? 3 : 1"
          placeholder="Describe your image"
          no-resize
          clearable
          hide-details
          density="compact"
          @update:focused="focusTextArea"
          :readonly="isTyping"
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

          <v-card min-width="400" class="pa-4">
            <div class="mb-6">
              <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
                <div class="tw-flex-1">
                  <Heading title="Size" />
                  <v-select
                    :items="ASPECT_RATIOS"
                    v-model="aspectRatio"
                    :color="isDark ? '#9333ea' : '#6b21a8'"
                    density="compact"
                    variant="outlined"
                    hide-details
                    item-title="title"
                    return-object
                    @update:model-value="handleSizeSelected"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" width="250">
                        <template v-slot:append>
                          <v-icon v-if="!isPro && item.raw.isPro" size="x-small" icon="$star" />
                        </template>
                        <template v-slot:title>
                          <div class="tw-flex tw-gap-3 tw-items-start tw-justify-start">
                            <div>
                              <v-icon :icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" />
                            </div>
                            <div>
                              <VListItemTitle>{{ item.raw.title }}</VListItemTitle>
                            </div>
                            <div>
                              <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
                            </div>
                          </div>
                        </template>
                      </v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                      <div class="tw-flex tw-gap-3">
                        <div>
                          <v-icon :icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" />
                        </div>
                        <div>
                          <VListItemTitle>{{ item.raw.title }}</VListItemTitle>
                        </div>
                      </div>
                    </template>
                  </v-select>
                </div>
                <div class="tw-flex-1">
                  <Heading title="Format" />
                  <v-select
                    :items="IMAGE_FORMATS"
                    v-model="outputFormat"
                    density="compact"
                    variant="outlined"
                    item-title="title"
                    hide-details
                    :color="isDark ? '#9333ea' : '#6b21a8'"
                    return-object
                    @update:model-value="handleFormatSelected"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:append>
                          <v-icon v-if="!isPro && item.raw.isPro" size="x-small" icon="$star" />
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
                    mandatory
                    variant="outlined"
                    density="compact"
                    block
                    divided
                  >
                    <v-btn :color="isDark ? '#9333ea' : '#6b21a8'"> SD </v-btn>
                    <v-btn :color="isDark ? '#9333ea' : '#6b21a8'"
                      >HD
                      <template v-if="!isPro" v-slot:append>
                        <v-icon size="x-small" icon="$star" />
                      </template>
                    </v-btn>
                  </v-btn-toggle>
                </div>
                <div class="tw-w-1/2">
                  <Heading title="Variations" />

                  <div
                    class="tw-flex tw-justify-between tw-items-center tw-border tw-border-neutral-500 tw-rounded tw-h-[36px]"
                  >
                    <div class="tw-flex-1 tw-mb-1 tw-justify-center tw-text-center">
                      <v-icon size="small" :icon="isDark ? '$layersDark' : '$layers'" />
                    </div>
                    <div class="tw-flex-1 tw-text-center">
                      <v-btn
                        size="small"
                        :disabled="disableModifyVariations"
                        variant="text"
                        @click="handleImageVariations('subtract')"
                      >
                        <v-icon icon="fa:fas fa-minus" />
                      </v-btn>
                    </div>
                    <div class="tw-flex-1 tw-text-center">
                      <span class="tw-text-lg">{{ noOfOutputs }}</span>
                    </div>
                    <div class="tw-flex-1 tw-text-center">
                      <v-btn
                        size="small"
                        :disabled="disableModifyVariations"
                        variant="text"
                        @click="handleImageVariations('add')"
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
      <v-btn
        :disabled="isTyping"
        @click="randomPrompt"
        variant="text"
        size="x-small"
        class="text-caption mx-2"
        >Ask Visual AI</v-btn
      >
    </div>

    <div class="mb-6">
      <Heading title="Mode" />
      <v-select
        :items="FLUX_MODES"
        v-model="mode"
        bg-color="transparent"
        variant="outlined"
        :color="isDark ? '#9333ea' : '#6b21a8'"
        :prepend-inner-icon="isDark ? `${mode.icon}Dark` : mode.icon"
        density="compact"
        item-title="title"
        return-object
        hide-details
        @update:model-value="handleSelected"
      >
        <template v-slot:item="{ item, props }">
          <v-list-item v-bind="props" :max-width="smAndUp ? '330' : '400'">
            <template v-slot:prepend>
              <div
                class="tw-flex tw-justify-start tw-align-top mr-2"
                :class="smAndUp ? 'mt-n6' : 'mt-n7'"
              >
                <v-icon ize="small" :icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" />
              </div>
            </template>

            <template v-slot:title>
              <div class="tw-flex tw-gap-2 tw-items-center">
                <VListItemTitle class="tw-text-black dark:tw-text-white">{{
                  item.raw.title
                }}</VListItemTitle>
                <v-icon icon="$star" v-if="!isPro && item.raw.isPro" size="x-small"></v-icon>
              </div>
            </template>

            <v-list-item-subtitle
              v-html="item.raw.description"
              class="wrap-text tw-text-black dark:tw-text-white"
            >
            </v-list-item-subtitle>
          </v-list-item>
          <v-divider v-if="item.raw.id === MODEL_IDS.FLUX_PRO" />
        </template>
      </v-select>
    </div>
    <div class="mb-6" v-if="smAndUp">
      <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
        <div class="tw-flex-1">
          <Heading title="Quality" />
          <v-btn-toggle
            v-model="outputQuality"
            mandatory
            variant="outlined"
            density="compact"
            block
            divided
          >
            <v-btn :color="isDark ? '#9333ea' : '#6b21a8'"> SD </v-btn>
            <v-btn :color="isDark ? '#9333ea' : '#6b21a8'"
              >HD
              <template v-if="!isPro" v-slot:append>
                <v-icon size="x-small" icon="$star" />
              </template>
            </v-btn>
          </v-btn-toggle>
        </div>
        <div class="tw-flex-1">
          <Heading title="Images" />
          <div
            class="tw-flex tw-justify-between tw-items-center tw-border tw-border-neutral-500 tw-rounded tw-h-[36px]"
          >
            <div class="tw-flex-1 tw-mb-1 tw-justify-center tw-text-center">
              <v-icon size="small" :icon="isDark ? '$layersDark' : '$layers'" />
            </div>
            <div class="tw-flex-1 tw-text-center">
              <v-btn
                size="small"
                :disabled="disableModifyVariations"
                variant="text"
                @click="handleImageVariations('subtract')"
              >
                <v-icon icon="fa:fas fa-minus" />
              </v-btn>
            </div>
            <div class="tw-flex-1 tw-text-center">
              <span class="tw-text-lg">{{ noOfOutputs }}</span>
            </div>
            <div class="tw-flex-1 tw-text-center">
              <v-btn
                size="small"
                :disabled="disableModifyVariations"
                variant="text"
                @click="handleImageVariations('add')"
              >
                <v-icon icon="fa:fas fa-plus" />
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-6" v-if="smAndUp">
      <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
        <div class="tw-flex-1">
          <Heading title="Size" />
          <v-select
            :items="ASPECT_RATIOS"
            v-model="aspectRatio"
            :color="isDark ? '#9333ea' : '#6b21a8'"
            density="compact"
            variant="outlined"
            hide-details
            item-title="title"
            return-object
            @update:model-value="handleSizeSelected"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" width="250">
                <template v-slot:append>
                  <v-icon v-if="!isPro && item.raw.isPro" size="x-small" icon="$star" />
                </template>
                <template v-slot:title>
                  <div class="tw-flex tw-gap-3 tw-items-start tw-justify-start">
                    <div>
                      <v-icon :icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" />
                    </div>
                    <div>
                      <VListItemTitle>{{ item.raw.title }}</VListItemTitle>
                    </div>
                    <div>
                      <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
                    </div>
                  </div>
                </template>
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <div class="tw-flex tw-gap-3">
                <div>
                  <v-icon :icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" />
                </div>
                <div>
                  <VListItemTitle>{{ item.raw.title }}</VListItemTitle>
                </div>
              </div>
            </template>
          </v-select>
        </div>
        <div class="tw-flex-1">
          <Heading title="Format" />
          <v-select
            :items="IMAGE_FORMATS"
            v-model="outputFormat"
            density="compact"
            variant="outlined"
            item-title="title"
            hide-details
            :color="isDark ? '#9333ea' : '#6b21a8'"
            return-object
            @update:model-value="handleFormatSelected"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:append>
                  <v-icon v-if="!isPro && item.raw.isPro" size="x-small" icon="$star" />
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>
      </div>
    </div>
    <div class="mb-6" v-if="smAndUp"></div>
  </div>

  <div>
    <CreateButton @click="generateImage" :disabled="typingPrompt === ''" />
  </div>

  <!-- <PremiumDialog /> -->
  <!-- <BuyMoreCreditsDialog />
  <LowCreditsDialog /> -->
</template>

<style lang="scss" scoped>
.wrap-text {
  line-clamp: unset !important;
  -webkit-line-clamp: unset !important;
}
.custom-menu {
  margin-left: 100px !important;
}
.v-select__menu {
  margin-left: 10px !important;
}
.v-textarea :deep(.v-field__input) {
  transition: none;
}
</style>
