<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useUser } from 'vue-clerk'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { VListItemTitle } from 'vuetify/components'

import Heading from '@/components/Aside/Heading.vue'
import PremiumDialog from '@/components/Dialogs/PremiumDialog.vue'
import { useAppStore } from '@/stores/app'
import { type Mode } from '@/stores/aside'
import { useDialogStore } from '@/stores/dialog'
import { type ImageBody, useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'
import { FLUX_MODES, MODEL_IDS } from '@/utils/constants'
import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants'
import PROMPTS from '@/utils/prompts.json'

const route = useRoute()
const router = useRouter()
const generateStore = useGenerateStore()
const appStore = useAppStore()
const dialogStore = useDialogStore()
const userStore = useUserStore()
const { smAndUp } = useDisplay()
const { isSignedIn } = useUser()
const { userDetails } = storeToRefs(userStore)
const { isDark } = storeToRefs(appStore)

const prompt = ref<string>('')
const typingPrompt = ref<string>('')
const isTyping = ref(false)
const noOfOutputs = ref<number>(1)
const outputQuality = ref<number>(0)
const aspectRatio = ref<any>(ASPECT_RATIOS[0])
const outputFormat = ref<string>('JPG')
const menu = ref(false)
const textAreaFocused = ref(false)
const mode = ref<Mode>(FLUX_MODES[0])
const textareaRef = ref()

const disableModifyVariations = computed(() => {
  return mode.value.id === MODEL_IDS.FLUX_PRO || mode.value.id === MODEL_IDS.FLUX_1_1_PRO
})
function handleSelected(item: Mode) {
  if (!userDetails.value?.isPro && item.isPro) {
    mode.value = FLUX_MODES[1]
    dialogStore.showPremium()
  } else {
    mode.value = item
    if (item.id === MODEL_IDS.FLUX_PRO || item.id === MODEL_IDS.FLUX_1_1_PRO) {
      noOfOutputs.value = 1
    }
  }
}

function handleSizeSelected(item: any) {
  if (!userDetails.value?.isPro && item.isPro) {
    aspectRatio.value = ASPECT_RATIOS[0]
    dialogStore.showPremium()
  } else {
    aspectRatio.value = item
  }
}

async function generateImage() {
  if (isSignedIn.value) {
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
  } else {
    // Show sign in modal
    router.push('/signin')
  }
}

function randomPrompt() {
  const randomIndex = Math.floor(Math.random() * PROMPTS.length)
  const newPrompt = PROMPTS[randomIndex]
  typingPrompt.value = ''
  typePrompt(newPrompt)
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
      if (!userDetails.value?.isPro) {
        dialogStore.showPremium()
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

onMounted(() => {
  focusTextArea(true)
  prompt.value = (route.query.prompt as string) ?? ''
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
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:title>
                          <div class="tw-flex tw-gap-3 tw-items-start tw-justify-start">
                            <div>
                              <v-icon :icon="item.raw.icon" />
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
                          <v-icon :icon="item.raw.icon" />
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
                      <v-btn variant="text" @click="handleImageVariations('subtract')">
                        <v-icon icon="fa:fas fa-minus" />
                      </v-btn>
                    </div>
                    <div class="tw-flex-1 tw-text-center">
                      <span class="tw-text-lg tw-font-semibold">{{ noOfOutputs }}</span>
                    </div>
                    <div class="tw-flex-1 tw-text-center">
                      <v-btn variant="text" @click="handleImageVariations('add')">
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
        :prepend-inner-icon="isDark ? `${mode.icon}Dark` : mode.icon"
        density="compact"
        item-title="title"
        return-object
        hide-details
        @update:model-value="handleSelected"
      >
        <template v-slot:item="{ item, props }">
          <v-list-item v-bind="props" :max-width="smAndUp ? '330' : '350'">
            <template v-slot:prepend>
              <div
                class="tw-flex tw-justify-start tw-align-top mr-2"
                :class="smAndUp ? 'mt-n6' : 'mt-n7'"
              >
                <v-icon ize="small" :icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" />
              </div>
            </template>

            <template v-slot:title>
              <div class="tw-flex tw-gap-1 tw-items-center">
                <VListItemTitle>{{ item.raw.title }}</VListItemTitle>
                <v-icon
                  icon="$star"
                  v-if="!userDetails?.isPro && item.raw.isPro"
                  size="x-small"
                ></v-icon>
              </div>
            </template>

            <v-list-item-subtitle v-html="item.raw.description" class="wrap-text">
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
            <v-btn> SD </v-btn>
            <v-btn> HD </v-btn>
          </v-btn-toggle>
        </div>
        <div class="tw-flex-1">
          <Heading title="Images" />
          <div
            class="tw-flex tw-justify-between tw-items-center tw-border tw-border-neutral-500 tw-rounded tw-h-[36px]"
          >
            <div class="tw-flex-1 tw-mb-1 tw-justify-center tw-text-center">
              <v-icon size="small" icon="$layers" />
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
            density="compact"
            variant="outlined"
            hide-details
            v-model="aspectRatio"
            item-title="title"
            return-object
            @update:model-value="handleSizeSelected"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" width="250">
                <template v-slot:append>
                  <v-icon
                    v-if="!userDetails?.isPro && item.raw.isPro"
                    size="x-small"
                    icon="$star"
                  />
                </template>
                <template v-slot:title>
                  <div class="tw-flex tw-gap-3 tw-items-start tw-justify-start">
                    <div>
                      <v-icon :icon="item.raw.icon" />
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
                  <v-icon :icon="item.raw.icon" />
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
            item-title="title"
            density="compact"
            variant="outlined"
            hide-details
            v-model="outputFormat"
          >
            <template v-slot:item="{ props }">
              <v-list-item v-bind="props"> </v-list-item>
            </template>
          </v-select>
        </div>
      </div>
    </div>
    <div class="mb-6" v-if="smAndUp"></div>
  </div>

  <div>
    <v-btn
      @click="generateImage"
      :disabled="typingPrompt === ''"
      color="purple-lighten-2"
      block
      dark
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
.v-textarea :deep(.v-field__input) {
  transition: none;
}
</style>
