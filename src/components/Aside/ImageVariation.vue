<script setup lang="ts">
import { faMinus, faPlus } from "@/plugins/icons";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { type Mode } from "@/types";

import { useAppStore } from "@/stores/app";
import { useAsideStore } from "@/stores/aside";
import { useUserStore } from "@/stores/user";

import Heading from "@/components/Aside/Heading.vue";

import { FLUX_MODES, MODEL_IDS } from "@/utils/constants";

const userStore = useUserStore();
const router = useRouter();
const asideStore = useAsideStore();
const appStore = useAppStore();

const { isDark } = storeToRefs(appStore);
const { isPro } = storeToRefs(userStore);
const { noOfOutputs } = storeToRefs(asideStore);
const mode = ref<Mode>(FLUX_MODES[0]);

const disableModifyVariations = computed(() => {
  return mode.value.id === MODEL_IDS.FLUX_PRO || mode.value.id === MODEL_IDS.FLUX_1_1_PRO;
});

function handleImageVariations(type: string) {
  if (type === "subtract") {
    if (noOfOutputs.value === 4) {
      noOfOutputs.value = 2;
    } else if (noOfOutputs.value > 1) {
      noOfOutputs.value = 1;
    }
  } else {
    if (noOfOutputs.value === 2) {
      if (!isPro.value) {
        router.push("/pricing");
      } else {
        noOfOutputs.value = 4;
      }
    } else if (noOfOutputs.value === 1) {
      noOfOutputs.value = 2;
    }
  }
}

onMounted(() => {
  noOfOutputs.value = 1;
});
</script>
<template>
  <Heading title="Images" />
  <div
    class="tw-flex tw-justify-between tw-items-center tw-border tw-border-neutral-500 tw-rounded tw-h-[36px]"
  >
    <div class="tw-flex-1 tw-mb-1 tw-justify-center tw-text-center">
      <v-icon size="small" :icon="isDark ? '$layersDark' : '$layers'" />
    </div>
    <div class="tw-flex-1 tw-text-center">
      <v-btn
        size="small"
        :disabled="disableModifyVariations"
        variant="text"
        @click="handleImageVariations('subtract')"
      >
        <font-awesome-icon :icon="faMinus" />
      </v-btn>
    </div>
    <div class="tw-flex-1 tw-text-center">
      <span class="tw-text-lg">{{ noOfOutputs }}</span>
    </div>
    <div class="tw-flex-1 tw-text-center">
      <v-btn
        size="small"
        :disabled="disableModifyVariations"
        variant="text"
        @click="handleImageVariations('add')"
      >
        <font-awesome-icon :icon="faPlus" />
      </v-btn>
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
