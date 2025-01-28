<script setup lang="ts">
import { FeatureIconMap } from '@/pages/utils'
import { storeToRefs } from 'pinia'

import { IImageObject } from '@/types'

import { useAppStore } from '@/stores/app'

const props = defineProps<{
  item: IImageObject
}>()

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
</script>
<template>
  <v-chip size="small" :color="isDark ? 'black' : 'white'" label variant="flat">
    <div>
      <v-icon
        :icon="
          isDark
            ? `${FeatureIconMap[props.item.featureType as keyof typeof FeatureIconMap]}Dark`
            : FeatureIconMap[props.item.featureType as keyof typeof FeatureIconMap]
        "
        size="medium"
        start
      ></v-icon>
    </div>
    <div class="tw-text-xs tw-text-black dark:tw-text-white">
      {{ props.item.featureType }}
    </div>
  </v-chip>
</template>
<style scoped lang="scss"></style>
