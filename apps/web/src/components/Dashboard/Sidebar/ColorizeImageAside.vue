<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useUser } from 'vue-clerk';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { useFeatureSubmit } from '@/composables/useFeatureSubmit';

import FeatureCta from '@/components/Dashboard/FeatureCta.vue';
import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';

import { MODEL_IDS } from '@/utils/constants';
import { getTransformCreditCost } from '@/utils/generationCredits';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const appStore = useAppStore();
const generateStore = useGenerateStore();

const { isSignedIn } = useUser();
const { credits, userId } = storeToRefs(userStore);
const { progressUrl } = storeToRefs(appStore);
const { colorizeInProgress } = storeToRefs(generateStore);

const imageUpload = ref<InstanceType<typeof ImageUpload> | null>(null);
const canSubmit = computed(() => Boolean(imageUpload.value?.image) && !colorizeInProgress.value);
const creditCost = getTransformCreditCost();

async function colorizeImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }
  if (credits.value < creditCost) {
    dialogStore.showLowCredits();
    return;
  }
  if (!imageUpload.value?.image) return;

  generateStore.colorizeImage({
    image: imageUpload.value.image,
    modelId: MODEL_IDS.COLORIZE_ADVANCED,
  });
  progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?userId=${userId.value}`;
  appStore.colorizeOpen();
  localStorage.setItem('colorizeInProgress', 'true');
  colorizeInProgress.value = true;
}

useFeatureSubmit(FeatureType.COLORIZE, {
  canSubmit: () => canSubmit.value,
  submit: () => colorizeImage(),
});

onMounted(() => {
  const raw = localStorage.getItem('colorizeInProgress');
  if (!raw) return;
  try {
    if (JSON.parse(raw) === true) {
      colorizeInProgress.value = true;
      appStore.colorizeOpen();
    }
  } catch {
    localStorage.removeItem('colorizeInProgress');
  }
});
</script>

<template>
  <div
    data-testid="colorize-aside"
    class="tw-flex tw-flex-col tw-gap-6"
    aria-label="Colorize image settings"
  >
    <ImageUpload ref="imageUpload" />

    <FeatureCta
      label="Colorize"
      test-id="colorize-cta"
      :cost="creditCost"
      :loading="colorizeInProgress"
      :disabled="!canSubmit"
      full-width
      @click="colorizeImage"
    />
  </div>
</template>
