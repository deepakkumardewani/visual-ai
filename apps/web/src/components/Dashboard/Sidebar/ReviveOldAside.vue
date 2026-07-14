<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useUser } from 'vue-clerk';

import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import ImageUpload from '@/components/Dashboard/Sidebar/ImageUpload.vue';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const generateStore = useGenerateStore();
const appStore = useAppStore();

const { isSignedIn } = useUser();
const { progressUrl } = storeToRefs(appStore);
const { isPro, credits, userId } = storeToRefs(userStore);
const { reviveInProgress } = storeToRefs(generateStore);

const imageUpload = ref<InstanceType<typeof ImageUpload> | null>(null);
const canSubmit = computed(() => Boolean(imageUpload.value?.image) && !reviveInProgress.value);

async function reviveImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }
  if ((!isPro.value && credits.value < 3) || (isPro.value && credits.value === 0)) {
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

    <button
      type="button"
      data-testid="revive-cta"
      class="tw-flex tw-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-bg-accent tw-text-body-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-canvas tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.35)] tw-transition-[filter] tw-duration-fast hover:tw-brightness-110 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
      :disabled="!canSubmit"
      :aria-busy="reviveInProgress"
      @click="reviveImage"
    >
      <span
        v-if="reviveInProgress"
        class="tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-canvas/30 tw-border-t-canvas"
        aria-hidden="true"
      />
      <span v-else>Revive</span>
    </button>
  </div>
</template>
