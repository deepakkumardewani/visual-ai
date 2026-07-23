<script setup lang="ts">
import { computed, ref } from 'vue';

import { ASPECT_RATIOS, PRIMARY_ASPECT_COUNT } from '@/utils/constants';

import ChevronCaret from '@/components/primitives/ChevronCaret.vue';

type AspectOption = (typeof ASPECT_RATIOS)[number];

const props = defineProps<{
  options: AspectOption[];
  modelValue: AspectOption;
  isPro: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AspectOption];
  'pro-required': [];
}>();

const expanded = ref(false);

const primaryOptions = computed(() => props.options.slice(0, PRIMARY_ASPECT_COUNT));
const extraOptions = computed(() => props.options.slice(PRIMARY_ASPECT_COUNT));

const selectedIsExtra = computed(() =>
  extraOptions.value.some((r) => r.title === props.modelValue.title),
);

const primaryGridClass = computed(() => {
  const cols = Math.min(PRIMARY_ASPECT_COUNT, Math.max(1, primaryOptions.value.length));
  if (cols <= 1) return 'tw-grid-cols-1';
  if (cols === 2) return 'tw-grid-cols-2';
  if (cols === 3) return 'tw-grid-cols-3';
  return 'tw-grid-cols-4';
});

/** Larger frame preview for the primary row; extras use a slightly smaller frame. */
const PRIMARY_ICON_MAX_PX = 22;
const EXTRA_ICON_MAX_PX = 18;

function aspectIconSize(title: string, maxPx: number) {
  if (title === 'auto' || !title.includes(':')) {
    return { width: maxPx, height: maxPx };
  }
  const [w, h] = title.split(':').map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { width: maxPx, height: maxPx };
  }
  const scale = maxPx / Math.max(w, h);
  return { width: Math.max(6, Math.round(w * scale)), height: Math.max(6, Math.round(h * scale)) };
}

function isProLocked(optionIsPro: boolean) {
  return optionIsPro && !props.isPro;
}

function select(ratio: AspectOption) {
  if (!props.isPro && ratio.isPro) {
    emit('pro-required');
    return;
  }
  emit('update:modelValue', ratio);
  if (primaryOptions.value.some((r) => r.title === ratio.title)) {
    expanded.value = false;
  }
}

function toggleExpanded() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2" data-testid="aspect-ratio-picker">
    <div
      class="tw-grid tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1"
      :class="primaryGridClass"
      role="group"
      aria-label="Aspect ratio"
    >
      <button
        v-for="ratio in primaryOptions"
        :key="ratio.title"
        type="button"
        :data-testid="`aspect-${ratio.title}`"
        :aria-pressed="modelValue.title === ratio.title"
        :aria-label="`${ratio.name} ${ratio.title}`"
        class="tw-relative tw-flex tw-min-h-[3.5rem] tw-flex-col tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-sm tw-px-1 tw-py-2 tw-text-caption tw-font-medium tw-transition-[color,background-color] tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        :class="
          modelValue.title === ratio.title
            ? 'tw-bg-surface-3 tw-text-ink tw-shadow-sm'
            : 'tw-text-ink-muted hover:tw-bg-surface-3/60 hover:tw-text-ink'
        "
        @click="select(ratio)"
      >
        <span class="tw-flex tw-h-6 tw-w-full tw-items-center tw-justify-center" aria-hidden="true">
          <span
            class="tw-block tw-rounded-[2px] tw-border-2 tw-border-current"
            :class="modelValue.title === ratio.title ? 'tw-opacity-90' : 'tw-opacity-55'"
            :style="{
              width: `${aspectIconSize(ratio.title, PRIMARY_ICON_MAX_PX).width}px`,
              height: `${aspectIconSize(ratio.title, PRIMARY_ICON_MAX_PX).height}px`,
            }"
          />
        </span>
        <span class="tw-leading-none">{{ ratio.title }}</span>
        <span
          v-if="isProLocked(ratio.isPro)"
          class="tw-absolute tw-right-1 tw-top-1 tw-h-1 tw-w-1 tw-rounded-full tw-bg-gold"
          aria-hidden="true"
        />
        <span v-if="isProLocked(ratio.isPro)" class="tw-sr-only">(Pro)</span>
      </button>
    </div>

    <div v-if="extraOptions.length > 0" class="tw-flex tw-flex-col tw-gap-2">
      <button
        type="button"
        data-testid="aspect-more-trigger"
        class="tw-flex tw-h-9 tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2 tw-px-3 tw-text-body-sm tw-font-medium tw-text-ink tw-transition-[color,background-color,border-color] tw-duration-fast hover:tw-border-accent/40 hover:tw-bg-surface-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        :aria-expanded="expanded"
        aria-controls="aspect-more-panel"
        @click="toggleExpanded"
      >
        <span class="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2">
          <span
            v-if="selectedIsExtra"
            class="tw-flex tw-h-5 tw-w-5 tw-shrink-0 tw-items-center tw-justify-center"
            aria-hidden="true"
          >
            <span
              class="tw-block tw-rounded-[2px] tw-border-2 tw-border-current tw-opacity-80"
              :style="{
                width: `${aspectIconSize(modelValue.title, 14).width}px`,
                height: `${aspectIconSize(modelValue.title, 14).height}px`,
              }"
            />
          </span>
          <!-- Ratio strings only — friendly names are local UI labels, not from model docs -->
          <span class="tw-truncate">{{ selectedIsExtra ? modelValue.title : 'More sizes' }}</span>
          <span v-if="!selectedIsExtra" class="tw-shrink-0 tw-text-ink-muted"
            >· {{ extraOptions.length }}</span
          >
        </span>
        <ChevronCaret :open="expanded" />
      </button>

      <div
        id="aspect-more-panel"
        class="aspect-more-panel"
        :data-open="expanded ? 'true' : 'false'"
        :aria-hidden="!expanded"
      >
        <div class="aspect-more-panel__inner">
          <div
            class="tw-grid tw-grid-cols-3 tw-gap-1 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-p-1 sm:tw-grid-cols-4"
            role="listbox"
            aria-label="More aspect ratios"
          >
            <button
              v-for="ratio in extraOptions"
              :key="ratio.title"
              type="button"
              role="option"
              :data-testid="`aspect-more-${ratio.title}`"
              :aria-selected="modelValue.title === ratio.title"
              :aria-label="`${ratio.name} ${ratio.title}`"
              class="tw-relative tw-flex tw-min-h-[3.25rem] tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-sm tw-px-1 tw-py-2 tw-text-caption tw-font-medium tw-transition-[color,background-color] tw-duration-fast focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
              :class="
                modelValue.title === ratio.title
                  ? 'tw-bg-surface-3 tw-text-ink tw-shadow-sm'
                  : 'tw-text-ink-muted hover:tw-bg-surface-3/60 hover:tw-text-ink'
              "
              :tabindex="expanded ? 0 : -1"
              @click="select(ratio)"
            >
              <span
                class="tw-flex tw-h-5 tw-w-full tw-items-center tw-justify-center"
                aria-hidden="true"
              >
                <span
                  class="tw-block tw-rounded-[2px] tw-border-2 tw-border-current"
                  :class="modelValue.title === ratio.title ? 'tw-opacity-90' : 'tw-opacity-55'"
                  :style="{
                    width: `${aspectIconSize(ratio.title, EXTRA_ICON_MAX_PX).width}px`,
                    height: `${aspectIconSize(ratio.title, EXTRA_ICON_MAX_PX).height}px`,
                  }"
                />
              </span>
              <span class="tw-leading-none">{{ ratio.title }}</span>
              <span
                v-if="isProLocked(ratio.isPro)"
                class="tw-absolute tw-right-1 tw-top-1 tw-h-1 tw-w-1 tw-rounded-full tw-bg-gold"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Height via grid-template-rows — transform/opacity-friendly expand without animating height */
.aspect-more-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.aspect-more-panel[data-open='true'] {
  grid-template-rows: 1fr;
}

.aspect-more-panel__inner {
  overflow: hidden;
  min-height: 0;
}

@media (prefers-reduced-motion: reduce) {
  .aspect-more-panel {
    transition: none;
  }
}
</style>
