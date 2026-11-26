<script setup lang="ts">
import { ref } from 'vue';

import { SKETCH_BRUSH_SIZE, type SketchTool } from '@/composables/useSketchCanvas';

const SIZE_ID = 'sketch-size';
const CLEAR_PROMPT = 'Clear the whole sketch?';

const tool = defineModel<SketchTool>('tool', { required: true });
const size = defineModel<number>('size', { required: true });
defineProps<{ canUndo: boolean; hasContent: boolean }>();
const emit = defineEmits<{ undo: []; clear: [] }>();

const confirmingClear = ref(false);

function confirmClear() {
  confirmingClear.value = false;
  emit('clear');
}

const TOOLS: { value: SketchTool; label: string }[] = [
  { value: 'brush', label: 'Brush' },
  { value: 'eraser', label: 'Eraser' },
];
</script>

<template>
  <div class="toolbar" role="toolbar" aria-label="Sketch tools" data-testid="sketch-toolbar">
    <div class="toolbar__group" role="radiogroup" aria-label="Drawing tool">
      <label v-for="item in TOOLS" :key="item.value" class="toolbar__tool">
        <input
          v-model="tool"
          type="radio"
          name="sketch-tool"
          class="tw-sr-only"
          :value="item.value"
          :data-testid="`sketch-tool-${item.value}`"
        />
        <span>{{ item.label }}</span>
      </label>
    </div>

    <label :for="SIZE_ID" class="toolbar__size">
      <span>Size {{ size }}</span>
      <input
        :id="SIZE_ID"
        v-model.number="size"
        type="range"
        :min="SKETCH_BRUSH_SIZE.min"
        :max="SKETCH_BRUSH_SIZE.max"
        data-testid="sketch-size"
      />
    </label>

    <button
      type="button"
      class="toolbar__btn"
      :disabled="!canUndo"
      data-testid="sketch-undo"
      @click="emit('undo')"
    >
      Undo
    </button>

    <div v-if="confirmingClear" class="toolbar__confirm" role="group" :aria-label="CLEAR_PROMPT">
      <span>{{ CLEAR_PROMPT }}</span>
      <button
        type="button"
        class="toolbar__btn"
        data-testid="sketch-clear-confirm"
        @click="confirmClear"
      >
        Clear
      </button>
      <button type="button" class="toolbar__btn" @click="confirmingClear = false">Keep</button>
    </div>
    <button
      v-else
      type="button"
      class="toolbar__btn"
      :disabled="!canUndo"
      data-testid="sketch-clear"
      @click="confirmingClear = true"
    >
      Clear
    </button>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;

  &__group {
    display: inline-flex;
    gap: 0.5rem;
  }

  &__tool span,
  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0 1rem;
    border: 1px solid rgb(var(--tw-border));
    border-radius: 0.75rem;
    background: transparent;
    color: rgb(var(--tw-ink-primary));
    cursor: pointer;
  }

  &__tool input:checked + span {
    border-color: rgb(var(--studio-accent));
    background: rgb(var(--studio-accent) / 0.12);
  }

  &__tool input:focus-visible + span,
  &__btn:focus-visible,
  &__size input:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }

  &__btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &__size {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    color: rgb(var(--tw-ink-primary));

    input {
      min-height: 44px;
      accent-color: rgb(var(--studio-accent));
    }
  }

  &__confirm {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    color: rgb(var(--tw-ink-primary));
  }
}
</style>
