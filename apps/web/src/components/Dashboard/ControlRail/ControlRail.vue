<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from 'vue-clerk';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

import { type ImageBody } from '@/types';

import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import MobileSettingsMenu from '@/components/Dashboard/ControlRail/MobileSettingsMenu.vue';
import ModelPicker from '@/components/Dashboard/ControlRail/ModelPicker.vue';
import PromptBox from '@/components/Dashboard/ControlRail/PromptBox.vue';
import SignupDialog from '@/components/Dialogs/SignupDialog.vue';
import GenerateButton from '@/components/Dashboard/ControlRail/GenerateButton.vue';
import SettingsCluster from '@/components/Dashboard/ControlRail/SettingsCluster.vue';

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

const isPremium = computed(() => mode.value.tier === 'premium');

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
    router.push('/pricing');
  }
});
</script>

<template>
  <div data-testid="control-rail" class="tw-p-3">
    <div class="tw-mb-6">
      <div v-if="smAndUp" class="tw-relative">
        <PromptBox />
      </div>
      <div v-else class="tw-flex">
        <div class="tw-w-[90%]">
          <PromptBox />
        </div>
        <div class="tw-flex tw-w-[10%] tw-items-center tw-mb-2">
          <MobileSettingsMenu class="tw-mt-2" />
        </div>
      </div>

      <div class="tw-mb-6">
        <ModelPicker />
      </div>

      <div v-if="smAndUp" class="tw-mb-6">
        <SettingsCluster />
      </div>
    </div>

    <GenerateButton
      :disabled="typingPrompt === '' || isLoading"
      :loading="isLoading"
      :premium="isPremium"
      @click="generateImage"
    />

    <SignupDialog />
  </div>
</template>
