<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, onMounted, ref } from 'vue';
import { useUser } from 'vue-clerk';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { useFeatureSubmit } from '@/composables/useFeatureSubmit';
import { useLocal } from '@/composables/local';

import FeatureCta from '@/components/Dashboard/FeatureCta.vue';
import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';
import UpscaleModelPicker from '@/components/Dashboard/ModelPicker/UpscaleModelPicker.vue';

import { IMAGE_FORMATS } from '@/utils/constants';
import { UPSCALER_MODELS } from '@/utils/models';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const localStore = useLocal();
const appStore = useAppStore();
const asideStore = useAsideStore();
const generateStore = useGenerateStore();

const { isSignedIn } = useUser();
const { progressUrl } = storeToRefs(appStore);
const { credits } = storeToRefs(userStore);
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
const creditCost = computed(() => upscaleModel.value.creditCost ?? 2);
const isPremium = computed(() => upscaleModel.value.tier === 'premium');

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
  imageFormat.value = format;
}

async function upscaleImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }
  if (credits.value < creditCost.value) {
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
      <router-link
        to="/compare"
        data-testid="upscale-compare-link"
        class="tw-text-eyebrow tw-text-ink-faint tw-underline-offset-2 hover:tw-text-ink hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
      >
        Compare model samples
      </router-link>
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
        </button>
      </div>
    </section>

    <FeatureCta
      label="Upscale"
      test-id="upscale-cta"
      :cost="creditCost"
      :loading="upscaleInProgress"
      :disabled="!canSubmit"
      :premium="isPremium"
      full-width
      @click="upscaleImage"
    />
  </div>
</template>
