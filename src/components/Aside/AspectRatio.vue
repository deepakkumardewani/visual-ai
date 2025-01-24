<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useAsideStore } from '@/stores/aside'
import { useUserStore } from '@/stores/user'

import Heading from '@/components/Aside/Heading.vue'

import { ASPECT_RATIOS } from '@/utils/constants'

const appStore = useAppStore()
const userStore = useUserStore()
const asideStore = useAsideStore()
const vSelectLightColor = ref('#9333ea')
const vSelectDarkColor = ref('#6b21a8')
const router = useRouter()
const { isDark } = storeToRefs(appStore)
const { isPro } = storeToRefs(userStore)
const { aspectRatio } = storeToRefs(asideStore)

function handleSizeSelected(item: any) {
  if (!isPro.value && item.isPro) {
    aspectRatio.value = ASPECT_RATIOS[0]
    router.push('/pricing')
  } else {
    aspectRatio.value = item
  }
}

onMounted(() => {
  aspectRatio.value = ASPECT_RATIOS[0]
})
</script>
<template>
  <Heading title="Size" />
  <v-select
    :items="ASPECT_RATIOS"
    v-model="aspectRatio"
    :color="isDark ? vSelectLightColor : vSelectDarkColor"
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
</template>
<style scoped lang="scss"></style>
