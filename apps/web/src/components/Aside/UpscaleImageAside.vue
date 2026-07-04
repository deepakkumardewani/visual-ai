<script setup lang="ts">
import { storeToRefs } from "pinia";
import { v4 as uuidv4 } from "uuid";
import { computed, onMounted, ref } from "vue";
import { useUser } from "vue-clerk";
import { useRouter } from "vue-router";

import type { SegmentedOption } from "@/types/primitives";

import { useAppStore } from "@/stores/app";
import { useAsideStore } from "@/stores/aside";
import { useDialogStore } from "@/stores/dialog";
import { useGenerateStore } from "@/stores/generate";
import { useUserStore } from "@/stores/user";

import { useLocal } from "@/composables/local";

import Heading from "@/components/Aside/Heading.vue";
import ImageUpload from "@/components/Aside/ImageUpload.vue";
import SegmentedControl from "@/components/primitives/SegmentedControl.vue";
import SignupDialog from "@/components/Dialogs/SignupDialog.vue";

import { IMAGE_FORMATS, IMAGE_SIZES } from "@/utils/constants";

const userStore = useUserStore();
const dialogStore = useDialogStore();
const localStore = useLocal();
const appStore = useAppStore();
const asideStore = useAsideStore();
const router = useRouter();
const { isSignedIn } = useUser();
const { progressUrl } = storeToRefs(appStore);
const generateStore = useGenerateStore();
const { isPro, credits } = storeToRefs(userStore);
const { upscaleInProgress } = storeToRefs(generateStore);
const { imageFormat } = storeToRefs(asideStore);

const formatOptions: SegmentedOption<string>[] = IMAGE_FORMATS.map((format) => ({
  label: format.title,
  value: format.title,
}));

const formatValue = computed({
  get: () => imageFormat.value.title,
  set: (title: string) => {
    const item = IMAGE_FORMATS.find((format) => format.title === title);
    if (!item) return;

    if (!isPro.value && item.isPro) {
      imageFormat.value = IMAGE_FORMATS[0];
      router.push("/pricing");
    } else {
      imageFormat.value = item;
    }
  },
});

const SCALE = {
  "2X": 2,
  "4X": 4,
};

const imageUpload = ref();
const scale = ref<string>("2X");
const creativity = ref<number>(0.1);
const prompt = ref<string>("");
const negativePrompt = ref<string>("");
// Add computed property for output dimensions
const outputDimensions = computed(() => {
  if (imageUpload.value?.width && imageUpload.value?.height) {
    const multiplier = SCALE[scale.value as keyof typeof SCALE];
    return `${imageUpload.value?.width * multiplier}x${imageUpload.value?.height * multiplier}px`;
  }
  return "";
});

async function upscaleImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }

  if (!isPro.value && credits.value < 3) {
    dialogStore.showLowCredits();
    return;
  }

  if (isPro.value && credits.value === 0) {
    dialogStore.showLowCredits();
    return;
  }

  if (isSignedIn.value) {
    const jobId = uuidv4();
    localStore.setLocal("upscaleJobId", jobId);
    const data = {
      jobId,
      prompt: prompt.value,
      negativePrompt: negativePrompt.value,
      image: imageUpload?.value?.image,
      format: imageUpload?.value?.image.name.split(".").pop(),
      creativity: creativity.value,
      scale: SCALE[scale.value as keyof typeof SCALE],
      outputFormat: imageFormat.value.title.toLowerCase(),
    };

    generateStore.upscaleImage(data);

    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
    appStore.upscaleOpen();
    localStorage.setItem("upscaleInProgress", "true");
    upscaleInProgress.value = true;
  } else {
    router.push("/signin");
  }
}

onMounted(async () => {
  const inProgress = JSON.parse(localStorage.getItem("upscaleInProgress") as string);
  // console.log('inProgress', inProgress)
  if (inProgress === true) {
    upscaleInProgress.value = true;
    const jobId = localStore.getLocal("upscaleJobId");
    if (jobId) {
      progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
      appStore.upscaleOpen();
    }
  }
});
</script>
<template>
  <ImageUpload ref="imageUpload" />
  <div class="tw-mb-4">
    <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
      <div class="tw-flex-1">
        <Heading title="Scale" />
        <v-select
          :items="IMAGE_SIZES"
          item-title="title"
          density="compact"
          variant="outlined"
          hide-details
          v-model="scale"
        >
          <template v-slot:item="{ props }">
            <v-list-item v-bind="props"> </v-list-item>
          </template>
        </v-select>
        <div v-if="outputDimensions" class="tw-text-xs tw-text-gray-500 tw-mt-1">
          Output size: {{ outputDimensions }}
        </div>
      </div>

      <div class="tw-flex-1">
        <SegmentedControl v-model="formatValue" :options="formatOptions" label="Format" />
      </div>
    </div>
    <!-- <Heading title="Scale" />
    <v-btn-toggle v-model="scale" mandatory variant="outlined" divided>
      <v-btn text="2X"></v-btn>
      <v-btn text="3X"></v-btn>
      <v-btn text="4X"></v-btn>
      <v-btn text="8X">
        <template v-slot:append>
          <v-icon size="x-small" icon="$star" />
        </template>
      </v-btn>
    </v-btn-toggle> -->
    <!-- <div>
      <span class="text-caption">
        Upscaled Image size: {{ RESOLUTION[resolution as keyof typeof RESOLUTION] }}
      </span>
    </div> -->
  </div>
  <div class="tw-mb-4">
    <div class="tw-flex tw-items-center tw-gap-1">
      <Heading title="Creativity" />
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" icon="fas fa-circle-info" size="small" class="tw-text-gray-400" />
        </template>
        <span
          >Higher creativity values will generate more artistic variations, while lower values stay
          closer to the original image</span
        >
      </v-tooltip>
    </div>
    <v-slider v-model="creativity" :max="1" :min="0.1" hide-details>
      <template v-slot:append>
        <div class="tw-text-sm tw-text-gray-500 tw-w-4">
          {{ creativity.toFixed(1) }}
        </div>
      </template>
    </v-slider>
  </div>
  <div class="tw-mb-4">
    <Heading title="Prompt" />
    <v-text-field
      v-model.trim="prompt"
      variant="outlined"
      rounded="2"
      placeholder="Describe your image for better results"
      hide-details
      density="compact"
    ></v-text-field>
  </div>
  <div>
    <v-btn
      @click="upscaleImage"
      text="Upscale"
      :disabled="!imageUpload?.image || upscaleInProgress"
      color="purple-lighten-2"
      block
      dark
    >
    </v-btn>
  </div>
  <SignupDialog />
</template>
