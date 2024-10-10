<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { GroupedObject, groupByDate } from '@/pages/utils'
import { useUserStore } from '@/stores/user'
// import grouped from '@/utils/groupedHistory.json'
import { downloadImage } from '@/utils/helpers'

const userStore = useUserStore()
const { history } = storeToRefs(userStore)
const groupedHistory = ref<GroupedObject[]>([])
const deleteImage = (imageId: string) => {
  // Implement delete functionality
  console.log('Deleting image:', imageId)
}

watch(
  history,
  (newHistory) => {
    if (newHistory) {
      console.log(newHistory)
      groupedHistory.value = groupByDate(newHistory)
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <v-list>
    <v-list-item v-for="item in groupedHistory" :key="item.title" class="tw-mb-6">
      <div class="tw-text-xl tw-font-bold tw-mb-2 tw-text-neutral-400">{{ item.title }}</div>

      <div
        class="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-grid-cols-5 tw-gap-4"
      >
        <v-hover v-slot="{ isHovering, props }" v-for="subItem in item.data" :key="subItem._id">
          <div v-bind="props" class="tw-aspect-square tw-overflow-hidden tw-rounded-lg tw-relative">
            <div class="tw-bg-neutral-700 tw-p-1 lg:tw-p-1.5">
              <img
                :src="subItem.imageUrl !== '' ? subItem.imageUrl : subItem.enhanced"
                :alt="subItem.featureType"
                class="tw-w-full tw-h-full tw-object-cover"
              />
              <div
                v-if="isHovering"
                class="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-end tw-pr-2 tw-mr-2 tw-mt-2"
              >
                <v-btn
                  icon
                  size="x-small"
                  color="black"
                  class="tw-mb-2"
                  @click="downloadImage(subItem.imageUrl)"
                >
                  <v-icon color="white">fas fa-download</v-icon>
                </v-btn>
                <v-btn icon size="x-small" color="black" @click="deleteImage(subItem._id)">
                  <v-icon color="white">fas fa-trash-alt</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-hover>
      </div>
    </v-list-item>
  </v-list>
</template>

<style scoped lang="scss">
.v-btn {
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
}
</style>
