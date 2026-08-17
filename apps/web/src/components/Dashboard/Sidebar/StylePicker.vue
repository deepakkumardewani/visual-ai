<script setup lang="ts">
import { computed, ref } from 'vue';

import { STYLE_PRESETS, type StyleId } from '@visual-ai/shared';

import ChevronCaret from '@/components/primitives/ChevronCaret.vue';
import Popover from '@/components/primitives/Popover.vue';

const props = defineProps<{
  modelValue: StyleId;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: StyleId];
}>();

const isOpen = ref(false);

/** Warm atelier gradients — fallback when a style thumbnail fails to load. */
const STYLE_TILE_GRADIENTS: Record<string, string> = {
  none: 'linear-gradient(145deg, #2A2119 0%, #1D1712 55%, #15110D 100%)',
  '3d_render': 'linear-gradient(145deg, #3A3228 0%, #C98A5A55 45%, #1D1712 100%)',
  acrylic: 'linear-gradient(145deg, #5C3A2A 0%, #C98A5A88 40%, #2A2119 100%)',
  anime: 'linear-gradient(145deg, #2A2119 0%, #A8988866 50%, #C98A5A44 100%)',
  cinematic: 'linear-gradient(160deg, #0D0A07 0%, #2A2119 40%, #C9A84C33 100%)',
  creative: 'linear-gradient(135deg, #2A2119 0%, #D9996A44 50%, #1D1712 100%)',
  dynamic: 'linear-gradient(120deg, #15110D 0%, #C98A5A66 35%, #0D0A07 100%)',
  fashion: 'linear-gradient(145deg, #F0E8DC22 0%, #2A2119 50%, #C98A5A33 100%)',
  game_concept: 'linear-gradient(150deg, #1D1712 0%, #6B5E51 45%, #C98A5A44 100%)',
  graphic_2d: 'linear-gradient(90deg, #2A2119 0%, #C98A5A55 50%, #15110D 100%)',
  graphic_3d: 'linear-gradient(145deg, #A8988844 0%, #2A2119 55%, #C9A84C33 100%)',
  illustration: 'linear-gradient(145deg, #3A2E24 0%, #C98A5A66 55%, #1D1712 100%)',
  photography: 'linear-gradient(180deg, #1D1712 0%, #6B5E51 60%, #0D0A07 100%)',
  portrait: 'linear-gradient(145deg, #2A2119 0%, #C98A5A77 40%, #15110D 100%)',
  raytraced: 'linear-gradient(145deg, #0D0A07 0%, #C9A84C44 50%, #2A2119 100%)',
  stock_photo: 'linear-gradient(145deg, #F0E8DC18 0%, #2A2119 60%, #A8988844 100%)',
};

const DEFAULT_TILE_GRADIENT = STYLE_TILE_GRADIENTS.none;

const selectedLabel = computed(
  () => STYLE_PRESETS.find((preset) => preset.id === props.modelValue)?.label ?? '',
);

function tileGradient(styleId: string): string {
  return STYLE_TILE_GRADIENTS[styleId] ?? DEFAULT_TILE_GRADIENT;
}

function hideBrokenThumb(event: Event) {
  const img = event.currentTarget as HTMLImageElement;
  img.hidden = true;
}

function select(styleId: StyleId) {
  emit('update:modelValue', styleId);
  isOpen.value = false;
}
</script>

<template>
  <div data-testid="style-picker">
    <Popover v-model:open="isOpen" placement="bottom-start">
      <template #trigger="{ open }">
        <span
          :class="[
            'tw-inline-flex tw-min-h-[44px] tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2/60 tw-px-3 tw-py-1.5 tw-text-left tw-transition-colors tw-duration-fast',
            open
              ? 'tw-border-accent/50 tw-bg-surface-2'
              : 'hover:tw-border-accent/30 hover:tw-bg-surface-2',
          ]"
        >
          <span class="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5">
            <span
              class="tw-relative tw-h-7 tw-w-7 tw-shrink-0 tw-overflow-hidden tw-rounded-sm tw-ring-1 tw-ring-inset tw-ring-hairline"
              :style="{ background: tileGradient(modelValue) }"
              aria-hidden="true"
            >
              <img
                v-if="modelValue !== 'none'"
                :src="`/styles/${modelValue}.webp`"
                alt=""
                class="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover"
                @error="hideBrokenThumb"
              />
            </span>
            <span class="tw-truncate tw-text-body-sm tw-font-medium tw-text-ink">{{
              selectedLabel
            }}</span>
          </span>
          <ChevronCaret :open="open" :boxed="false" />
        </span>
      </template>

      <div
        role="listbox"
        aria-label="Style preset"
        class="tw-w-[min(21rem,calc(100vw-2rem))] tw-p-1.5"
      >
        <div class="tw-grid tw-grid-cols-3 tw-gap-1.5">
          <button
            v-for="preset in STYLE_PRESETS"
            :key="preset.id"
            type="button"
            role="option"
            :data-testid="`style-${preset.id}`"
            :aria-selected="modelValue === preset.id"
            class="tw-group tw-flex tw-flex-col tw-gap-1.5 tw-rounded-sm tw-p-1 tw-text-left tw-transition-[background-color,box-shadow] tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
            :class="modelValue === preset.id ? 'tw-bg-surface-2 tw-ring-1 tw-ring-accent/40' : ''"
            @click="select(preset.id)"
          >
            <span
              class="tw-relative tw-flex tw-aspect-[4/3] tw-w-full tw-overflow-hidden tw-rounded-[3px] tw-ring-1 tw-ring-inset tw-ring-hairline"
              :style="{ background: tileGradient(preset.id) }"
              aria-hidden="true"
            >
              <img
                v-if="preset.id !== 'none'"
                :src="`/styles/${preset.id}.webp`"
                alt=""
                class="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover"
                @error="hideBrokenThumb"
              />
            </span>
            <span
              class="tw-line-clamp-2 tw-min-h-[2.1em] tw-px-0.5 tw-text-center tw-text-[11px] tw-font-medium tw-leading-tight tw-text-balance"
              :class="
                modelValue === preset.id
                  ? 'tw-text-ink'
                  : 'tw-text-ink-muted group-hover:tw-text-ink'
              "
            >
              {{ preset.label }}
            </span>
          </button>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
:deep(.tw-relative.tw-inline-block) {
  display: block;
  width: 100%;
}

:deep(.tw-relative.tw-inline-block > button) {
  width: 100%;
  min-height: 44px;
  justify-content: flex-start;
  padding: 0;
  border: none;
  background: transparent;
}
</style>
