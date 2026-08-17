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

import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';

import { getTransformCreditCost } from '@/utils/generationCredits';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const appStore = useAppStore();
const generateStore = useGenerateStore();
const localStore = useLocal();

const { isSignedIn } = useUser();
const { isPro, credits } = storeToRefs(userStore);
const { progressUrl } = storeToRefs(appStore);
const { removeBgInProgress } = storeToRefs(generateStore);

const imageUpload = ref<InstanceType<typeof ImageUpload> | null>(null);
const canSubmit = computed(() => Boolean(imageUpload.value?.image) && !removeBgInProgress.value);
const creditCost = computed(() => getTransformCreditCost(Boolean(isPro.value)));

async function removeBackground() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }
  if ((!isPro.value && credits.value < creditCost.value) || (isPro.value && credits.value === 0)) {
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

    <button
      type="button"
      data-testid="remove-bg-cta"
      class="tw-flex tw-h-11 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-accent tw-px-4 tw-text-body-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-canvas tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.35)] tw-transition-[filter] tw-duration-fast hover:tw-brightness-110 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
      :disabled="!canSubmit"
      :aria-busy="removeBgInProgress"
      @click="removeBackground"
    >
      <span
        v-if="removeBgInProgress"
        class="tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-canvas/30 tw-border-t-canvas"
        aria-hidden="true"
      />
      <template v-else>
        <span>Remove background</span>
        <span class="tw-font-medium tw-normal-case tw-tracking-normal tw-opacity-80"
          >· {{ creditCost }} {{ creditCost === 1 ? 'credit' : 'credits' }}</span
        >
      </template>
    </button>
  </div>
</template>
