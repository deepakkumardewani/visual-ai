<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useAppStore } from "@/stores/app";
import { useAsideStore } from "@/stores/aside";
import { useUserStore } from "@/stores/user";

import Heading from "@/components/Aside/Heading.vue";

import { IMAGE_FORMATS } from "@/utils/constants";

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();
const asideStore = useAsideStore();

const { isDark } = storeToRefs(appStore);
const { isPro } = storeToRefs(userStore);
const { imageFormat } = storeToRefs(asideStore);

const vSelectLightColor = ref("#9333ea");
const vSelectDarkColor = ref("#6b21a8");

function handleFormatSelected(item: any) {
  if (!isPro.value && item.isPro) {
    imageFormat.value = IMAGE_FORMATS[0];
    router.push("/pricing");
  } else {
    imageFormat.value = item;
  }
}

onMounted(() => {
  imageFormat.value = IMAGE_FORMATS[0];
});
</script>
<template>
  <Heading title="Format" />
  <v-select
    :items="IMAGE_FORMATS"
    v-model="imageFormat"
    density="compact"
    variant="outlined"
    hide-details
    item-title="title"
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
