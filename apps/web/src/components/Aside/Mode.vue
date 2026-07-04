<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { VListItem, VListItemSubtitle, VListItemTitle, VSelect } from "vuetify/components";

import { type Mode } from "@/types";

import { useAppStore } from "@/stores/app";
import { useAsideStore } from "@/stores/aside";
import { useUserStore } from "@/stores/user";

import Heading from "@/components/Aside/Heading.vue";

import { FLUX_MODES, MODEL_IDS } from "@/utils/constants";

const userStore = useUserStore();
const router = useRouter();
const appStore = useAppStore();

const vSelectLightColor = ref("#9333ea");
const vSelectDarkColor = ref("#6b21a8");
const { isPro } = storeToRefs(userStore);
const { isDark } = storeToRefs(appStore);
const { smAndUp } = useDisplay();
const asideStore = useAsideStore();
const { noOfOutputs, mode } = storeToRefs(asideStore);
function handleSelected(item: Mode) {
  if (!isPro.value && item.isPro) {
    mode.value = FLUX_MODES[1];
    router.push("/pricing");
  } else {
    mode.value = item;
    if (item.id === MODEL_IDS.FLUX_PRO || item.id === MODEL_IDS.FLUX_1_1_PRO) {
      noOfOutputs.value = 1;
    }
  }
}
</script>
<template>
  <Heading title="Mode" />
  <v-select
    :items="FLUX_MODES"
    v-model="mode"
    bg-color="transparent"
    variant="outlined"
    :color="isDark ? vSelectLightColor : vSelectDarkColor"
    :prepend-inner-icon="isDark ? `${mode.icon}Dark` : mode.icon"
    density="compact"
    item-title="title"
    return-object
    hide-details
    @update:model-value="handleSelected"
  >
    <template v-slot:item="{ item, props }">
      <v-list-item v-bind="props" :max-width="smAndUp ? '330' : '400'">
        <template v-slot:prepend>
          <div
            class="tw-flex tw-justify-start tw-align-top mr-2"
            :class="smAndUp ? 'mt-n6' : 'mt-n7'"
          >
            <v-icon ize="small" :icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" />
          </div>
        </template>

        <template v-slot:title>
          <div class="tw-flex tw-gap-2 tw-items-center">
            <VListItemTitle class="tw-text-black dark:tw-text-white">{{
              item.raw.title
            }}</VListItemTitle>
            <v-icon icon="$star" v-if="!isPro && item.raw.isPro" size="x-small"></v-icon>
          </div>
        </template>

        <v-list-item-subtitle
          v-html="item.raw.description"
          class="wrap-text tw-text-black dark:tw-text-white"
        >
        </v-list-item-subtitle>
      </v-list-item>
      <v-divider v-if="item.raw.id === MODEL_IDS.FLUX_PRO" />
    </template>
  </v-select>
</template>

<style lang="scss" scoped>
// this is to prevent the text from being cut off in the v-select
.wrap-text {
  line-clamp: unset !important;
  -webkit-line-clamp: unset !important;
}
</style>
