<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

import SideBySide from '@/components/SideBySide.vue'
import { FeatureType, ImageObject } from '@/pages/utils'
import { useDialogStore } from '@/stores/dialog'
import { deleteImage, downloadImage } from '@/utils/helpers'

const { mobile } = useDisplay()
const dialogStore = useDialogStore()
const { showImageDialog } = storeToRefs(dialogStore)

defineProps<{
  item: ImageObject | null
}>()
</script>
<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? '100%' : '1000'"
    :max-height="mobile ? '100%' : '1000'"
    v-model="showImageDialog"
    content-class="tw-flex tw-items-center tw-justify-center"
  >
    <v-card class="tw-flex tw-flex-col tw-h-[95vh] tw-w-[95vw]">
      <div class="action-buttons tw-flex tw-p-4">
        <div class="tw-flex tw-flex-1 tw-justify-start">
          <v-btn icon size="small" variant="text" @click="dialogStore.hideImage()">
            <v-icon>fas fa-times</v-icon>
          </v-btn>
        </div>
        <div class="tw-flex tw-flex-1 tw-gap-3 tw-justify-end">
          <v-btn icon size="x-small" variant="text" @click="downloadImage($event, item?.imageUrl)">
            <v-icon>fas fa-download</v-icon>
          </v-btn>

          <v-btn icon size="x-small" variant="text" @click="deleteImage($event, item?._id ?? '')">
            <v-icon>fas fa-trash-alt</v-icon>
          </v-btn>
        </div>
      </div>
      <div v-if="item?.prompt" class="tw-font-normal tw-px-6">
        {{ item?.prompt }}
      </div>
      <div class="image tw-flex-grow tw-flex tw-items-center tw-justify-center tw-p-0">
        <div v-if="item?.featureType === FeatureType.IMAGE">
          <v-img
            :src="item?.imageUrl"
            height="70vh"
            :width="mobile ? '100vw' : '60vw'"
            contain
          ></v-img>
        </div>
        <div v-if="item?.featureType !== FeatureType.IMAGE">
          <SideBySide
            :original-image="item?.original ?? ''"
            :enhanced-image="item?.enhanced ?? ''"
          />
        </div>
      </div>

      <div class="tw-flex tw-gap-2 tw-justify-end tw-p-4 dimension">
        <v-icon size="small">far fa-file</v-icon>
        <div>{{ item?.width }} x {{ item?.height }}</div>
      </div>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss"></style>
