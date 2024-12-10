<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { FeatureSelect } from '@/types'

import { useAppStore } from '@/stores/app'

import { FEATURES } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

const features = ref<FeatureSelect[]>(FEATURES)

const feature = ref<FeatureSelect>(features.value[0])

// Initialize feature based on query param if it exists
onMounted(() => {
  if (route.path === '/dashboard') {
    const featureId = route.query.feature as string
    if (featureId) {
      const selectedFeature = features.value.find((f) => f.name === featureId)
      if (selectedFeature) {
        feature.value = selectedFeature
        appStore.setFeature(selectedFeature.id)
      }
    } else {
      appStore.setFeature(feature.value.id)
      // router.replace({
      //   query: { feature: feature.value.name }
      // })
    }
  }
})

function handleSelected(item: FeatureSelect) {
  appStore.setFeature(item.id)
  // Update query parameter when feature changes
  router.replace({
    query: { ...route.query, feature: item.name }
  })
}
</script>
<template>
  <v-select
    @update:model-value="handleSelected"
    :items="features"
    v-model="feature"
    max-width="250"
    bg-color="transparent"
    :color="isDark ? 'purple-lighten-3' : 'purple-darken-3'"
    variant="outlined"
    density="compact"
    hide-details
    item-title="title"
    item-value="title"
    return-object
  >
    <template v-slot:item="{ item, props }">
      <v-list-item :prepend-icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" v-bind="props">
      </v-list-item>
    </template>
  </v-select>
</template>

<style scoped></style>
