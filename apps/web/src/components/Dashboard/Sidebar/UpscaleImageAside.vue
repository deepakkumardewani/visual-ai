<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, onMounted, ref } from 'vue';
import { useUser } from 'vue-clerk';
import { useRouter } from 'vue-router';

import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { useLocal } from '@/composables/local';

import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';

import { IMAGE_FORMATS, IMAGE_SIZES } from '@/utils/constants';

const SCALE_FACTORS = {
  '2X': 2,
  '4X': 4,
} as const;

type ScaleKey = keyof typeof SCALE_FACTORS;

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
const { imageFormat } = storeToRefs(asideStore);

const imageUpload = ref<InstanceType<typeof ImageUpload> | null>(null);
const scale = ref<ScaleKey>('2X');
const creativity = ref(0.1);
const prompt = ref('');
const negativePrompt = ref('');

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

const outputDimensions = computed(() => {
  const upload = imageUpload.value;
  if (!upload?.width || !upload?.height) return '';
  const factor = SCALE_FACTORS[scale.value];
  return `${upload.width * factor}×${upload.height * factor}px`;
});

function selectScale(value: string) {
  if (value === '2X' || value === '4X') scale.value = value;
}

function selectFormat(format: (typeof IMAGE_FORMATS)[number]) {
  if (!isPro.value && format.isPro) {
    imageFormat.value = IMAGE_FORMATS[0];
    router.push('/pricing');
    return;
  }
  imageFormat.value = format;
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
    prompt: prompt.value,
    negativePrompt: negativePrompt.value,
    image: file,
    format: file.name.split('.').pop(),
    creativity: creativity.value,
    scale: SCALE_FACTORS[scale.value],
    outputFormat: imageFormat.value.title.toLowerCase(),
  });

  progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
  appStore.upscaleOpen();
  localStorage.setItem('upscaleInProgress', 'true');
  upscaleInProgress.value = true;
}

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

    <section class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-faint"
      >
        Scale
      </span>
      <div
        class="tw-grid tw-grid-cols-2 tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
        role="group"
        aria-label="Upscale factor"
      >
        <button
          v-for="size in IMAGE_SIZES"
          :key="size"
          type="button"
          :aria-pressed="scale === size"
          :class="segmentClass(scale === size)"
          @click="selectScale(size)"
        >
          {{ size }}
        </button>
      </div>
      <p v-if="outputDimensions" class="tw-text-eyebrow tw-text-ink-faint">
        Output {{ outputDimensions }}
      </p>
    </section>

    <section class="tw-flex tw-flex-col tw-gap-2">
      <span
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-faint"
      >
        Format
      </span>
      <div
        class="tw-grid tw-grid-cols-3 tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
        role="group"
        aria-label="Output format"
      >
        <button
          v-for="format in IMAGE_FORMATS"
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

    <section class="tw-flex tw-flex-col tw-gap-2">
      <div class="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <span
          class="tw-flex tw-items-center tw-gap-1.5 tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-faint"
        >
          Creativity
          <span
            class="tw-inline-flex tw-h-3.5 tw-w-3.5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-ink-faint tw-text-[9px] tw-font-bold tw-text-ink-faint"
            title="Higher values invent more detail; lower values stay closer to the original."
            aria-label="Creativity help"
          >
            i
          </span>
        </span>
        <span class="tw-text-body-sm tw-tabular-nums tw-text-ink-muted">{{
          creativity.toFixed(1)
        }}</span>
      </div>
      <input
        v-model.number="creativity"
        type="range"
        min="0.1"
        max="1"
        step="0.1"
        data-testid="upscale-creativity"
        class="feature-slider tw-w-full"
        aria-label="Creativity"
      />
    </section>

    <section class="tw-flex tw-flex-col tw-gap-2">
      <label
        for="upscale-prompt"
        class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-widest tw-text-ink-faint"
      >
        Prompt
      </label>
      <input
        id="upscale-prompt"
        v-model.trim="prompt"
        type="text"
        placeholder="Describe details to enhance…"
        data-testid="upscale-prompt"
        class="tw-h-10 tw-w-full tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-px-3 tw-text-body-sm tw-text-ink placeholder:tw-text-ink-faint focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-2"
      />
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

<style scoped>
.feature-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 999px;
  background: rgb(var(--tw-surface-3));
  outline: none;
}

.feature-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: rgb(var(--tw-ink-muted));
  border: 2px solid rgb(var(--tw-surface-1));
  cursor: pointer;
}

.feature-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: rgb(var(--tw-ink-muted));
  border: 2px solid rgb(var(--tw-surface-1));
  cursor: pointer;
}
</style>
