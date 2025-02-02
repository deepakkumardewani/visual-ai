<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

import { useAsideStore } from '@/stores/aside'
import { useGenerateStore } from '@/stores/generate'

import Heading from '@/components/Aside/Heading.vue'

import { MODEL_IDS } from '@/utils/constants'
import PROMPTS from '@/utils/prompts.json'
import REALISTIC_PROMPTS from '@/utils/realisticPrompts.json'

const asideStore = useAsideStore()
const generateStore = useGenerateStore()
const { mobile } = useDisplay()
const { mode, typingPrompt } = storeToRefs(asideStore)
const { promptText } = storeToRefs(generateStore)

const prompt = ref<string>('')
const isTyping = ref(false)
const textAreaFocused = ref(false)
const textareaRef = ref()

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
  textareaRef.value.focus()
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

watch(typingPrompt, (newVal) => {
  promptText.value = newVal
})

onMounted(() => {
  typingPrompt.value = promptText.value ?? ''
})
</script>
<template>
  <div class="tw-flex tw-items-center tw-gap-1">
    <Heading title="Prompt" />
    <v-tooltip location="top">
      <template v-slot:activator="{ props }">
        <v-icon v-bind="props" icon="fas fa-circle-info" size="small" class="tw-text-gray-400" />
      </template>
      <span>Describe style, subject, colors, mood, and composition of your desired image</span>
    </v-tooltip>
  </div>
  <v-textarea
    ref="textareaRef"
    v-model.trim="typingPrompt"
    variant="outlined"
    rounded="2"
    :rows="mobile ? (textAreaFocused ? 3 : 1) : 3"
    placeholder="Describe your image"
    no-resize
    clearable
    hide-details
    density="compact"
    :readonly="isTyping"
    @update:focused="textAreaFocused = !textAreaFocused"
  ></v-textarea>

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
</template>
<style scoped lang="scss"></style>
