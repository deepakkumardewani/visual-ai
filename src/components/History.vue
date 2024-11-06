<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

import ImageDialog from '@/components/Dialogs/ImageDialog.vue'
import { FeatureType, GroupedObject, ImageObject, groupByDate } from '@/pages/utils'
import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'
import { deleteImage, downloadImage, favoriteImage } from '@/utils/helpers'

const { mobile } = useDisplay()
const userStore = useUserStore()
const dialogStore = useDialogStore()
const { history } = storeToRefs(userStore)
const appStore = useAppStore()
const { tab } = storeToRefs(appStore)
const groupedHistory = ref<GroupedObject[]>([])
const imageDialogItem = ref<ImageObject | null>(null)
const showImage = (item: ImageObject) => {
  imageDialogItem.value = item
  dialogStore.showImage()
}

const props = withDefaults(defineProps<{ isFavorites?: boolean }>(), {
  isFavorites: false
})

function create() {
  tab.value = 1
}
watch(
  history,
  (newHistory) => {
    if (newHistory) {
      if (props.isFavorites) {
        groupedHistory.value = groupByDate(newHistory.filter((item) => item.isFavorite))
      } else {
        groupedHistory.value = groupByDate(newHistory)
      }
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div
    v-if="groupedHistory.length === 0"
    class="tw-flex tw-justify-center tw-items-center tw-h-full"
  >
    <div class="tw-text-center tw-text-neutral-400">
      You have not created any thing yet. Go ahead and
      <span @click="create" class="tw-text-[#ba68c8] tw-cursor-pointer tw-font-bold">create</span>
      something.
    </div>
  </div>
  <div v-for="item in groupedHistory" :key="item.title" class="tw-mb-6 tw-p-4">
    <div class="tw-text-xl tw-font-bold tw-mb-2 tw-text-neutral-400">{{ item.title }}</div>

    <div
      class="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-grid-cols-5 tw-gap-4"
    >
      <template v-for="subItem in item.data" :key="subItem._id">
        <v-hover v-slot="{ isHovering, props }">
          <TransitionGroup name="image-list" tag="div">
            <div
              :key="subItem._id"
              v-bind="props"
              class="tw-aspect-square tw-overflow-hidden tw-rounded-lg tw-relative"
            >
              <div
                @click="showImage(subItem)"
                class="tw-cursor-pointer tw-bg-darkBorder dark:tw-bg-lightBorder tw-p-1 lg:tw-p-1.5 tw-aspect-square"
              >
                <v-img
                  :aspect-ratio="1"
                  cover
                  :src="subItem.imageUrl !== '' ? subItem.imageUrl : subItem.enhanced"
                  :alt="subItem.featureType"
                  class="tw-rounded-sm"
                >
                  <template v-slot:placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-progress-circular
                        color="grey-lighten-4"
                        indeterminate
                      ></v-progress-circular>
                    </div>
                  </template>
                </v-img>
                <div
                  v-if="(isHovering || mobile) && subItem.featureType !== FeatureType.IMAGE"
                  class="tw-absolute tw-inset-0 tw-flex tw-flex-row tw-items-start lg:tw-mx-3 lg:tw-my-3 tw-mx-2 tw-my-2"
                >
                  <v-chip size="small" color="black" label variant="flat">
                    <div>
                      <v-icon icon="fas fa-expand" size="x-small" start></v-icon>
                    </div>
                    <div class="tw-text-xs">{{ subItem.featureType }}</div>
                  </v-chip>
                </div>
                <div
                  v-if="isHovering"
                  class="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-gap-2 tw-items-end tw-pr-2 tw-mr-2 tw-mt-4"
                >
                  <v-btn
                    icon
                    size="x-small"
                    color="black"
                    @click="downloadImage($event, subItem.imageUrl)"
                  >
                    <v-icon color="white">fas fa-download</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    color="black"
                    @click="favoriteImage($event, subItem._id)"
                  >
                    <v-icon color="white">{{
                      subItem.isFavorite ? 'fas fa-heart' : 'far fa-heart'
                    }}</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    color="black"
                    @click="deleteImage($event, subItem._id)"
                  >
                    <v-icon color="white">fas fa-trash-alt</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </v-hover>
      </template>
    </div>
  </div>
  <ImageDialog :item="imageDialogItem" />
</template>

<style scoped lang="scss">
.v-btn {
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
}

.image-list-move,
.image-list-enter-active,
.image-list-leave-active {
  transition: all 0.3s ease;
}

.image-list-enter-from,
.image-list-leave-to {
  opacity: 0;
}

.image-list-leave-active {
  position: absolute;
}
</style>
