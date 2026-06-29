<script setup lang="ts">
import { storeToRefs } from "pinia";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "vue-clerk";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { type ImageBody } from "@/types";

import { useAppStore } from "@/stores/app";
import { useAsideStore } from "@/stores/aside";
import { useDialogStore } from "@/stores/dialog";
import { useGenerateStore } from "@/stores/generate";
import { useUserStore } from "@/stores/user";

import AspectRatio from "@/components/Aside/AspectRatio.vue";
import CreateButton from "@/components/Aside/CreateButton.vue";
import ImageFormat from "@/components/Aside/ImageFormat.vue";
import ImageVariation from "@/components/Aside/ImageVariation.vue";
import Menu from "@/components/Aside/Menu.vue";
import Mode from "@/components/Aside/Mode.vue";
import OutputQuality from "@/components/Aside/OutputQuality.vue";
import Prompt from "@/components/Aside/Prompt.vue";
import SignupDialog from "@/components/Dialogs/SignupDialog.vue";

const router = useRouter();
const generateStore = useGenerateStore();
const appStore = useAppStore();
const dialogStore = useDialogStore();
const asideStore = useAsideStore();
const userStore = useUserStore();

const { smAndUp } = useDisplay();
const { isSignedIn } = useUser();
const { isPro, credits } = storeToRefs(userStore);
const { progressUrl } = storeToRefs(appStore);
const { isLoading } = storeToRefs(generateStore);

const { aspectRatio, noOfOutputs, outputQuality, imageFormat, mode, typingPrompt } =
  storeToRefs(asideStore);

async function generateImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }

  if (credits.value === 0) {
    dialogStore.showLowCredits();
    return;
  }

  const jobId = uuidv4();
  const input: ImageBody = {
    jobId,
    modelId: mode.value.id,
    imageType: aspectRatio.value.type,
    modelName: mode.value.title,
    prompt: typingPrompt.value,
    noOfOutputs: noOfOutputs.value,
    outputQuality: outputQuality.value === 0 ? 70 : 100,
    aspectRatio: aspectRatio.value.title,
    outputFormat: imageFormat.value.title.toLowerCase(),
  };

  generateStore.generateImage(input);

  progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
  appStore.imageOpen();
}

watch(outputQuality, (newVal) => {
  if (!isPro.value && newVal === 1) {
    outputQuality.value = 0;
    router.push("/pricing");
  }
});
</script>
<template>
  <div class="mb-6">
    <div v-if="smAndUp" class="tw-relative">
      <Prompt />
    </div>
    <div v-else class="tw-flex">
      <div class="tw-w-[90%]">
        <Prompt />
      </div>
      <div class="tw-w-[10%] tw-flex tw-items-center tw-mb-2">
        <Menu class="tw-mt-2" />
      </div>
    </div>

    <div class="mb-6">
      <Mode />
    </div>
    <div class="mb-6" v-if="smAndUp">
      <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
        <div class="tw-flex-1">
          <OutputQuality />
        </div>
        <div class="tw-flex-1">
          <ImageVariation />
        </div>
      </div>
    </div>

    <div class="mb-6" v-if="smAndUp">
      <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
        <div class="tw-flex-1">
          <AspectRatio />
        </div>
        <div class="tw-flex-1">
          <ImageFormat />
        </div>
      </div>
    </div>
  </div>

  <div>
    <CreateButton @click="generateImage" :disabled="typingPrompt === '' || isLoading" />
  </div>
  <SignupDialog />
</template>

<style lang="scss" scoped>
.custom-menu {
  margin-left: 100px !important;
}
.v-select__menu {
  margin-left: 10px !important;
}
.v-textarea :deep(.v-field__input) {
  transition: none;
}
</style>
