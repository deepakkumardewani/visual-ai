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

import { getTransformCreditCost } from '@/utils/generationCredits';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const generateStore = useGenerateStore();
const appStore = useAppStore();

const { isSignedIn } = useUser();
const { progressUrl } = storeToRefs(appStore);
const { credits, userId } = storeToRefs(userStore);
const { reviveInProgress } = storeToRefs(generateStore);

const imageUpload = ref<InstanceType<typeof ImageUpload> | null>(null);
const canSubmit = computed(() => Boolean(imageUpload.value?.image) && !reviveInProgress.value);
const creditCost = getTransformCreditCost();

async function reviveImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }
  if (credits.value < creditCost) {
    dialogStore.showLowCredits();
    return;
  }
  if (!imageUpload.value?.image) return;

  generateStore.reviveOldImage({
    image: imageUpload.value.image,
  });
  progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?userId=${userId.value}`;
  appStore.reviveOpen();
  localStorage.setItem('reviveInProgress', 'true');
  reviveInProgress.value = true;
}

useFeatureSubmit(FeatureType.REVIVE, {
  canSubmit: () => canSubmit.value,
  submit: () => reviveImage(),
});

onMounted(() => {
  const raw = localStorage.getItem('reviveInProgress');
  if (!raw) return;
  try {
    if (JSON.parse(raw) === true) {
      reviveInProgress.value = true;
      appStore.reviveOpen();
    }
  } catch {
    localStorage.removeItem('reviveInProgress');
  }
});
</script>

<template>
  <div
    data-testid="revive-aside"
    class="tw-flex tw-flex-col tw-gap-6"
    aria-label="Revive photo settings"
  >
    <ImageUpload ref="imageUpload" />

    <FeatureCta
      label="Revive"
      test-id="revive-cta"
      :cost="creditCost"
      :loading="reviveInProgress"
      :disabled="!canSubmit"
      full-width
      @click="reviveImage"
    />
  </div>
</template>
