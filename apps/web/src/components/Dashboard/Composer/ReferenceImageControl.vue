<script setup lang="ts">
/**
 * Reference-image trigger for models with registry `imageInput`.
 * Supported: click opens info popover → Add reference → file picker.
 * Unsupported: disabled control + tooltip (no popover).
 */
import { storeToRefs } from 'pinia';
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { ACCEPTED_IMAGE_ACCEPT, validateImageFile } from '@/composables/useImageDrop';
import { useAsideStore } from '@/stores/aside';

import Popover from '@/components/primitives/Popover.vue';

const asideStore = useAsideStore();
const { referenceImage, supportsImageInput } = storeToRefs(asideStore);
const { interactiveTransition } = useDashboardMotion();

const infoOpen = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const disabledTriggerRef = ref<HTMLElement | null>(null);
const tipVisible = ref(false);
const tipStyle = ref<Record<string, string>>({});

const addLabel = computed(() => (referenceImage.value ? 'Replace reference' : 'Add reference'));

const disabledTooltip = 'This model doesn’t support reference images';

function positionTip() {
  const el = disabledTriggerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  tipStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 6)}px`,
    left: `${Math.round(rect.left)}px`,
    zIndex: '60',
  };
}

function showTip() {
  positionTip();
  tipVisible.value = true;
  nextTick(positionTip);
}

function hideTip() {
  tipVisible.value = false;
}

function onScrollOrResize() {
  if (tipVisible.value) positionTip();
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
  }
});

function openFilePicker() {
  infoOpen.value = false;
  fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const result = validateImageFile(file);
  if (!result.ok) return;
  asideStore.setReferenceImage(result.file);
}
</script>

<template>
  <div data-testid="reference-image-control" class="reference-image-control tw-shrink-0">
    <input
      ref="fileInputRef"
      type="file"
      :accept="ACCEPTED_IMAGE_ACCEPT"
      class="tw-sr-only"
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileChange"
    />

    <!-- Unsupported model: disabled + teleported tooltip (avoids prompt-bar overflow clip) -->
    <div
      v-if="!supportsImageInput"
      ref="disabledTriggerRef"
      data-testid="reference-image-disabled"
      class="tw-relative tw-z-10"
      @mouseenter="showTip"
      @mouseleave="hideTip"
      @focusin="showTip"
      @focusout="hideTip"
    >
      <button
        type="button"
        data-testid="reference-image-trigger"
        disabled
        class="tw-inline-flex tw-h-8 tw-w-8 tw-cursor-not-allowed tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-hairline/60 tw-bg-surface-2/40 tw-text-ink-faint tw-opacity-50"
        :aria-label="disabledTooltip"
        :aria-describedby="tipVisible ? 'reference-image-tooltip' : undefined"
      >
        <span class="tw-relative tw-inline-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center">
          <font-awesome-icon icon="images" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
          <span
            class="tw-absolute -tw-right-1 -tw-top-1 tw-flex tw-h-2.5 tw-w-2.5 tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-3 tw-text-ink-faint"
            aria-hidden="true"
          >
            <font-awesome-icon icon="plus" class="tw-h-1.5 tw-w-1.5" />
          </span>
        </span>
      </button>

      <Teleport to="body">
        <div
          v-if="tipVisible"
          id="reference-image-tooltip"
          role="tooltip"
          data-testid="reference-image-tooltip"
          class="tw-pointer-events-none tw-w-max tw-max-w-[14rem] tw-rounded-md tw-border tw-border-hairline tw-bg-surface-1 tw-px-2.5 tw-py-1.5 tw-text-caption tw-leading-snug tw-text-ink tw-shadow-elevated"
          :style="tipStyle"
        >
          {{ disabledTooltip }}
        </div>
      </Teleport>
    </div>

    <!-- Supported model: popover → file picker -->
    <Popover v-else v-model:open="infoOpen" placement="bottom-start">
      <template #trigger="{ open }">
        <span
          data-testid="reference-image-trigger"
          :class="[
            'tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-text-ink-muted',
            interactiveTransition,
            open ? 'tw-text-ink' : '',
          ]"
          aria-label="Add reference image"
        >
          <span class="tw-relative tw-inline-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center">
            <font-awesome-icon icon="images" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
            <span
              class="tw-absolute -tw-right-1 -tw-top-1 tw-flex tw-h-2.5 tw-w-2.5 tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-3 tw-text-ink"
              aria-hidden="true"
            >
              <font-awesome-icon icon="plus" class="tw-h-1.5 tw-w-1.5" />
            </span>
          </span>
        </span>
      </template>

      <div
        data-testid="reference-image-info"
        class="tw-flex tw-w-[16.5rem] tw-flex-col tw-gap-3"
        role="dialog"
        aria-label="Image reference"
      >
        <div class="tw-flex tw-items-start tw-justify-between tw-gap-2">
          <span class="tw-text-body-sm tw-font-semibold tw-text-ink">Reference</span>
          <button
            type="button"
            class="tw-inline-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-sm tw-text-ink-muted hover:tw-text-ink"
            aria-label="Close"
            @click="infoOpen = false"
          >
            <font-awesome-icon icon="xmark" class="tw-h-3 tw-w-3" aria-hidden="true" />
          </button>
        </div>

        <div
          class="tw-flex tw-gap-2.5 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-2.5"
        >
          <span
            class="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-sm tw-bg-surface-3 tw-text-ink-muted"
            aria-hidden="true"
          >
            <font-awesome-icon icon="images" class="tw-h-4 tw-w-4" />
          </span>
          <div class="tw-min-w-0 tw-flex-1">
            <p class="tw-text-body-sm tw-font-medium tw-text-ink">Image Reference</p>
            <p class="tw-mt-0.5 tw-text-caption tw-leading-snug tw-text-ink-muted">
              Add a reference of a scene, character, or object to guide generation.
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="reference-image-add"
          class="tw-inline-flex tw-h-9 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-bg-accent tw-text-body-sm tw-font-semibold tw-text-canvas hover:tw-bg-accent-hover focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
          @click="openFilePicker"
        >
          <font-awesome-icon icon="plus" class="tw-h-3 tw-w-3" aria-hidden="true" />
          {{ addLabel }}
        </button>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
.reference-image-control :deep(.tw-relative.tw-inline-block > button) {
  min-height: 2rem;
  min-width: 2rem;
  height: 2rem;
  width: 2rem;
  padding: 0;
  border-radius: 0.375rem;
  border-color: rgb(var(--tw-hairline) / 0.6);
  background: rgb(var(--tw-surface-2) / 0.6);
}

.reference-image-control :deep(.tw-relative.tw-inline-block > button:hover) {
  border-color: color-mix(in srgb, rgb(var(--tw-ink)) 25%, transparent);
  background: rgb(var(--tw-surface-2));
}
</style>
