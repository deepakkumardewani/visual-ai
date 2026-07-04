<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useDisplay } from "vuetify";

import { IImageObject } from "@/types";

import { useAppStore } from "@/stores/app";
import { useGenerateStore } from "@/stores/generate";

import { bulkDelete, bulkDownload, bulkFavorite } from "@/utils/helpers";

const { mobile } = useDisplay();
const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const generateStore = useGenerateStore();
const { isDeleting, isFavoriting } = storeToRefs(generateStore);

const props = defineProps<{
  selectedImages: IImageObject[];
}>();

const handleBulkDelete = async () => {
  await bulkDelete(props.selectedImages);
};
const handleBulkFavorite = async () => {
  await bulkFavorite(props.selectedImages);
};
const handleBulkDownload = async () => {
  await bulkDownload(props.selectedImages);
};
</script>
<template>
  <div class="tw-flex tw-gap-2 tw-items-center">
    <v-btn
      :icon="mobile"
      :variant="mobile ? 'text' : 'tonal'"
      :size="mobile ? 'small' : 'default'"
      :color="isDark ? 'grey-darken-3' : 'grey-lighten-3'"
      class="tw-rounded-lg tw-p-0 tw-transition-all hover:tw-scale-105"
      :disabled="isDeleting || isFavoriting"
      @click="handleBulkDownload"
    >
      <v-icon class="tw-mr-0 sm:tw-mr-2" :color="isDark ? 'white' : 'black'"
        >fas fa-download</v-icon
      >
      <span v-if="!mobile" class="tw-text-sm" :class="isDark ? 'tw-text-white' : 'tw-text-black'"
        >Download</span
      >
    </v-btn>

    <v-btn
      :icon="mobile"
      :variant="mobile ? 'text' : 'tonal'"
      :size="mobile ? 'small' : 'default'"
      :color="isDark ? 'grey-darken-3' : 'grey-lighten-3'"
      class="tw-rounded-lg tw-transition-all hover:tw-scale-105"
      :disabled="isDeleting || isFavoriting"
      @click="handleBulkFavorite"
    >
      <v-icon class="tw-mr-2" :color="isDark ? 'white' : 'black'">fas fa-heart</v-icon>
      <span v-if="!mobile" class="tw-text-sm" :class="isDark ? 'tw-text-white' : 'tw-text-black'"
        >Favorite</span
      >
    </v-btn>

    <v-btn
      :icon="mobile"
      :variant="mobile ? 'text' : 'tonal'"
      :size="mobile ? 'small' : 'default'"
      :color="isDark ? 'grey-darken-3' : 'grey-lighten-3'"
      class="tw-rounded-lg tw-transition-all hover:tw-scale-105"
      :loading="isDeleting || isFavoriting"
      @click="handleBulkDelete"
    >
      <v-icon class="tw-mr-2" :color="isDark ? 'white' : 'black'">fas fa-trash-alt</v-icon>
      <span v-if="!mobile" class="tw-text-sm" :class="isDark ? 'tw-text-white' : 'tw-text-black'"
        >Delete</span
      >
    </v-btn>
  </div>
</template>
<style scoped lang="scss">
.v-btn {
  text-transform: none;
}
</style>
