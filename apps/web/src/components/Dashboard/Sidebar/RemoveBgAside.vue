<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, onMounted, ref } from 'vue';
import { useUser } from 'vue-clerk';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { useFeatureSubmit } from '@/composables/useFeatureSubmit';
import { useLocal } from '@/composables/local';

import FeatureCta from '@/components/Dashboard/FeatureCta.vue';
import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';

import { getTransformCreditCost } from '@/utils/generationCredits';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const appStore = useAppStore();
const generateStore = useGenerateStore();
const localStore = useLocal();

const { isSignedIn } = useUser();
const { credits } = storeToRefs(userStore);
const { progressUrl } = storeToRefs(appStore);
const { removeBgInProgress } = storeToRefs(generateStore);

const imageUpload = ref<InstanceType<typeof ImageUpload> | null>(null);
const canSubmit = computed(() => Boolean(imageUpload.value?.image) && !removeBgInProgress.value);
const creditCost = getTransformCreditCost();

async function removeBackground() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }
  if (credits.value < creditCost) {
    dialogStore.showLowCredits();
    return;
  }
  if (!imageUpload.value?.image) return;

  const jobId = uuidv4();
  localStore.setLocal('removeBgJobId', jobId);

  generateStore.removeBgImage({
    image: imageUpload.value.image,
    jobId,
  });
  progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
  appStore.removeBgOpen();
  localStorage.setItem('remove_bgInProgress', 'true');
  removeBgInProgress.value = true;
}

useFeatureSubmit(FeatureType.REMOVE_BG, {
  canSubmit: () => canSubmit.value,
  submit: () => removeBackground(),
});

onMounted(() => {
  const raw = localStorage.getItem('remove_bgInProgress');
  if (!raw) return;
  try {
    if (JSON.parse(raw) === true) {
      removeBgInProgress.value = true;
      const jobId = localStore.getLocal('removeBgJobId');
      if (jobId) {
        progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
        appStore.removeBgOpen();
      }
    }
  } catch {
    localStorage.removeItem('remove_bgInProgress');
  }
});
</script>

<template>
  <div
    data-testid="remove-bg-aside"
    class="tw-flex tw-flex-col tw-gap-6"
    aria-label="Remove background settings"
  >
    <ImageUpload ref="imageUpload" />

    <FeatureCta
      label="Remove background"
      test-id="remove-bg-cta"
      :cost="creditCost"
      :loading="removeBgInProgress"
      :disabled="!canSubmit"
      full-width
      @click="removeBackground"
    />
  </div>
</template>
