<script setup lang="ts">
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faCropSimple,
  faEraser,
  faRotateLeft,
  faRotateRight,
  faScissors,
  faWaveSquare,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { computed, ref } from 'vue';

import type { EditorDisabledReason } from '@/composables/useAudioEditor';

const EMPTY_SELECTION_HINT = 'Drag on the waveform to select a part.';

const REASON_COPY: Record<Exclude<EditorDisabledReason, null>, string> = {
  'no-region': 'Select a part of the waveform first.',
  removed: 'This selection is on audio you already removed.',
};

type ToolId = 'trim' | 'cut' | 'fade-in' | 'fade-out' | 'normalize' | 'undo' | 'redo' | 'reset';

interface Tool {
  id: ToolId;
  label: string;
  icon: IconDefinition;
  /** True when the tool acts on the selection and is gated by it. */
  needsRegion: boolean;
}

const TOOLS: readonly Tool[] = [
  { id: 'trim', label: 'Trim', icon: faCropSimple, needsRegion: true },
  { id: 'cut', label: 'Cut', icon: faScissors, needsRegion: true },
  { id: 'fade-in', label: 'Fade in', icon: faArrowTrendUp, needsRegion: true },
  { id: 'fade-out', label: 'Fade out', icon: faArrowTrendDown, needsRegion: true },
  { id: 'normalize', label: 'Normalize', icon: faWaveSquare, needsRegion: false },
  { id: 'undo', label: 'Undo', icon: faRotateLeft, needsRegion: false },
  { id: 'redo', label: 'Redo', icon: faRotateRight, needsRegion: false },
  { id: 'reset', label: 'Reset', icon: faEraser, needsRegion: false },
];

const props = defineProps<{
  blockedReason: EditorDisabledReason;
  hasRegion: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isEdited: boolean;
  normalized: boolean;
}>();

const emit = defineEmits<{ action: [id: ToolId] }>();

const buttons = ref<HTMLButtonElement[]>([]);
const activeIndex = ref(0);

const disabledReasons = computed<Partial<Record<ToolId, string>>>(() => {
  const reasons: Partial<Record<ToolId, string>> = {};
  for (const tool of TOOLS) {
    if (tool.needsRegion && props.blockedReason)
      reasons[tool.id] = REASON_COPY[props.blockedReason];
  }
  if (!props.canUndo) reasons.undo = 'Nothing to undo.';
  if (!props.canRedo) reasons.redo = 'Nothing to redo.';
  if (!props.isEdited) reasons.reset = 'There are no edits to reset.';
  return reasons;
});

function onClick(tool: Tool) {
  // aria-disabled keeps the button focusable so keyboard users can read the reason.
  if (disabledReasons.value[tool.id]) return;
  emit('action', tool.id);
}

function focusButton(index: number) {
  const next = (index + TOOLS.length) % TOOLS.length;
  activeIndex.value = next;
  buttons.value[next]?.focus();
}

function onKeydown(event: KeyboardEvent, index: number) {
  const moves: Record<string, number> = {
    ArrowRight: index + 1,
    ArrowDown: index + 1,
    ArrowLeft: index - 1,
    ArrowUp: index - 1,
    Home: 0,
    End: TOOLS.length - 1,
  };
  if (!(event.key in moves)) return;
  event.preventDefault();
  focusButton(moves[event.key]);
}
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2" data-testid="editor-toolbar">
    <div role="toolbar" aria-label="Audio edit tools" class="tw-flex tw-flex-wrap tw-gap-2">
      <button
        v-for="(tool, index) in TOOLS"
        :key="tool.id"
        :ref="(el) => (buttons[index] = el as HTMLButtonElement)"
        type="button"
        :data-testid="`editor-${tool.id}`"
        :aria-disabled="Boolean(disabledReasons[tool.id])"
        :aria-pressed="tool.id === 'normalize' ? normalized : undefined"
        :title="disabledReasons[tool.id]"
        :tabindex="index === activeIndex ? 0 : -1"
        class="editor-tool tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-border tw-bg-surface-1 tw-px-4 tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
        @click="onClick(tool)"
        @keydown="onKeydown($event, index)"
        @focus="activeIndex = index"
      >
        <font-awesome-icon :icon="tool.icon" aria-hidden="true" />
        {{ tool.label }}
        <span v-if="disabledReasons[tool.id]" class="tw-sr-only">
          , unavailable. {{ disabledReasons[tool.id] }}
        </span>
      </button>
    </div>
    <p v-if="!hasRegion" data-testid="editor-hint" class="tw-m-0 tw-text-sm tw-text-ink-muted">
      {{ EMPTY_SELECTION_HINT }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.editor-tool[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-tool[aria-pressed='true'] {
  border-color: rgb(var(--tw-accent));
  background: rgb(var(--tw-accent) / 0.12);
}
</style>
