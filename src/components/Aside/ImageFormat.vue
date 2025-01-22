<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

import Heading from '@/components/Aside/Heading.vue'

import { IMAGE_FORMATS } from '@/utils/constants'

const appStore = useAppStore()
const userStore = useUserStore()
const vSelectLightColor = ref('#9333ea')
const vSelectDarkColor = ref('#6b21a8')
const router = useRouter()
const { isDark } = storeToRefs(appStore)
const { isPro } = storeToRefs(userStore)
const outputFormat = ref<any>(IMAGE_FORMATS[0].title)

function handleFormatSelected(item: any) {
  if (!isPro.value && item.isPro) {
    outputFormat.value = IMAGE_FORMATS[0].title
    router.push('/pricing')
  } else {
    outputFormat.value = item
  }
}

defineExpose({
  outputFormat
})
</script>
<template>
  <Heading title="Format" />
  <v-select
    :items="IMAGE_FORMATS"
    v-model="outputFormat"
    density="compact"
    variant="outlined"
    item-title="title"
    hide-details
    :color="isDark ? vSelectLightColor : vSelectDarkColor"
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
</template>
<style scoped lang="scss"></style>
