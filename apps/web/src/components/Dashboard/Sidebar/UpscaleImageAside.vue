<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, onMounted, ref } from 'vue';
import { useUser } from 'vue-clerk';
import { useRouter } from 'vue-router';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { useFeatureSubmit } from '@/composables/useFeatureSubmit';
import { useLocal } from '@/composables/local';

import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';
import UpscaleModelPicker from '@/components/Dashboard/ModelPicker/UpscaleModelPicker.vue';

import { IMAGE_FORMATS } from '@/utils/constants';
import { UPSCALER_MODELS } from '@/utils/models';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const localStore = useLocal();
const appStore = useAppStore();
const asideStore = useAsideStore();
const router = useRouter();
const generateStore = useGenerateStore();

const { isSignedIn } = useUser();
const { progressUrl } = storeToRefs(appStore);
const { isPro, credits } = storeToRefs(userStore);
const { upscaleInProgress } = storeToRefs(generateStore);
const { imageFormat, upscaleModel, selectedUpscaleModelFields } = storeToRefs(asideStore);

const imageUpload = ref<InstanceType<typeof ImageUpload> | null>(null);
const scale = ref<number>(2);

const SEGMENT_BASE =
  'tw-relative tw-flex tw-h-8 tw-flex-1 tw-items-center tw-justify-center tw-gap-1 tw-rounded-sm tw-text-body-sm tw-font-medium tw-transition-colors tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]';

function segmentClass(active: boolean) {
  return [
    SEGMENT_BASE,
    active
      ? 'tw-bg-surface-3 tw-text-ink tw-shadow-sm'
      : 'tw-text-ink-muted hover:tw-bg-surface-3/50 hover:tw-text-ink',
  ];
}

const hasImage = computed(() => Boolean(imageUpload.value?.image));
const canSubmit = computed(() => hasImage.value && !upscaleInProgress.value);

const showScale = computed(() => Boolean(selectedUpscaleModelFields.value?.scale));
const scaleOptions = computed(() => {
  const scaleField = selectedUpscaleModelFields.value?.scale;
  if (!scaleField) return [];
  return Object.keys(scaleField.values)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);
});

const showOutputFormat = computed(() => Boolean(selectedUpscaleModelFields.value?.outputFormat));
const outputFormatOptions = computed(() => {
  const registryValues = selectedUpscaleModelFields.value?.outputFormat?.values;
  if (!registryValues) return IMAGE_FORMATS;
  return IMAGE_FORMATS.filter((f) => {
    const key = f.title.toLowerCase();
    return registryValues.includes(key) || (key === 'jpg' && registryValues.includes('jpeg'));
  });
});

const formatGridClass = computed(() => {
  const cols = outputFormatOptions.value.length;
  if (cols <= 1) return 'tw-grid-cols-1';
  if (cols === 2) return 'tw-grid-cols-2';
  return 'tw-grid-cols-3';
});

const outputDimensions = computed(() => {
  const upload = imageUpload.value;
  if (!upload?.width || !upload?.height) return '';
  return `${upload.width * scale.value}×${upload.height * scale.value}px`;
});

function selectFormat(format: (typeof IMAGE_FORMATS)[number]) {
  if (!isPro.value && format.isPro) {
    imageFormat.value = IMAGE_FORMATS[0];
    router.push('/pricing');
    return;
  }
  imageFormat.value = format;
}

function isProLocked(optionIsPro: boolean) {
  return optionIsPro && !isPro.value;
}

async function upscaleImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }
  if ((!isPro.value && credits.value < 3) || (isPro.value && credits.value === 0)) {
    dialogStore.showLowCredits();
    return;
  }
  if (!imageUpload.value?.image) return;

  const jobId = uuidv4();
  localStore.setLocal('upscaleJobId', jobId);
  const file = imageUpload.value.image;

  generateStore.upscaleImage({
    jobId,
    image: file,
    format: file.name.split('.').pop(),
    scale,
    outputFormat: imageFormat.value.title.toLowerCase(),
    model: upscaleModel.value.id,
  });

  progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
  appStore.upscaleOpen();
  localStorage.setItem('upscaleInProgress', 'true');
  upscaleInProgress.value = true;
}

useFeatureSubmit(FeatureType.UPSCALE, {
  canSubmit: () => canSubmit.value,
  submit: () => upscaleImage(),
});

onMounted(() => {
  const raw = localStorage.getItem('upscaleInProgress');
  if (!raw) return;
  try {
    if (JSON.parse(raw) === true) {
      upscaleInProgress.value = true;
      const jobId = localStore.getLocal('upscaleJobId');
      if (jobId) {
        progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
        appStore.upscaleOpen();
      }
    }
  } catch {
    localStorage.removeItem('upscaleInProgress');
  }
});
</script>

<template>
  <div
    data-testid="upscale-aside"
    class="tw-flex tw-flex-col tw-gap-6"
    aria-label="Image upscaler settings"
  >
    <ImageUpload ref="imageUpload" />

    <section class="tw-flex tw-flex-col tw-gap-1.5">
      <span class="tw-text-eyebrow tw-font-semibold tw-text-ink-faint"> Model </span>
      <UpscaleModelPicker
        :models="UPSCALER_MODELS"
        v-model:selected="upscaleModel"
        :fallback="UPSCALER_MODELS[0]"
      />
    </section>

    <section v-if="showScale" class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-faint"
      >
        Scale
      </span>
      <div
        class="tw-grid tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
        :class="`tw-grid-cols-${Math.min(scaleOptions.length, 4)}`"
        role="group"
        aria-label="Upscale factor"
      >
        <button
          v-for="scaleOption in scaleOptions"
          :key="scaleOption"
          type="button"
          :aria-pressed="scale === scaleOption"
          :class="segmentClass(scale === scaleOption)"
          @click="scale = scaleOption"
        >
          {{ scaleOption }}x
        </button>
      </div>
      <p v-if="outputDimensions" class="tw-text-eyebrow tw-text-ink-faint">
        Output {{ outputDimensions }}
      </p>
    </section>

    <section v-if="showOutputFormat" class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-faint"
      >
        Format
      </span>
      <div
        class="tw-grid tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
        :class="formatGridClass"
        role="group"
        aria-label="Output format"
      >
        <button
          v-for="format in outputFormatOptions"
          :key="format.title"
          type="button"
          :aria-pressed="imageFormat.title === format.title"
          :class="segmentClass(imageFormat.title === format.title)"
          @click="selectFormat(format)"
        >
          {{ format.title }}
          <span
            v-if="isProLocked(format.isPro)"
            class="tw-absolute tw-right-1 tw-top-1 tw-h-1 tw-w-1 tw-rounded-full tw-bg-gold"
            aria-hidden="true"
          />
          <span v-if="isProLocked(format.isPro)" class="tw-sr-only">(Pro)</span>
        </button>
      </div>
    </section>

    <button
      type="button"
      data-testid="upscale-cta"
      class="tw-flex tw-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-bg-accent tw-text-body-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-canvas tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.35)] tw-transition-[filter] tw-duration-fast hover:tw-brightness-110 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
      :disabled="!canSubmit"
      :aria-busy="upscaleInProgress"
      @click="upscaleImage"
    >
      <span
        v-if="upscaleInProgress"
        class="tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-canvas/30 tw-border-t-canvas"
        aria-hidden="true"
      />
      <span v-else>Upscale</span>
    </button>
  </div>
</template>
