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

import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';

import { MODEL_IDS } from '@/utils/constants';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const appStore = useAppStore();
const generateStore = useGenerateStore();

const { isSignedIn } = useUser();
const { isPro, credits, userId } = storeToRefs(userStore);
const { progressUrl } = storeToRefs(appStore);
const { colorizeInProgress } = storeToRefs(generateStore);

const imageUpload = ref<InstanceType<typeof ImageUpload> | null>(null);
const canSubmit = computed(() => Boolean(imageUpload.value?.image) && !colorizeInProgress.value);

async function colorizeImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }
  if ((!isPro.value && credits.value < 3) || (isPro.value && credits.value === 0)) {
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

    <button
      type="button"
      data-testid="colorize-cta"
      class="tw-flex tw-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-bg-accent tw-text-body-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-canvas tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.35)] tw-transition-[filter] tw-duration-fast hover:tw-brightness-110 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
      :disabled="!canSubmit"
      :aria-busy="colorizeInProgress"
      @click="colorizeImage"
    >
      <span
        v-if="colorizeInProgress"
        class="tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-canvas/30 tw-border-t-canvas"
        aria-hidden="true"
      />
      <span v-else>Colorize</span>
    </button>
  </div>
</template>
