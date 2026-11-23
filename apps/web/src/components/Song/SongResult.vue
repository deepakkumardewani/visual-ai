<script setup lang="ts">
import { computed, ref } from 'vue';

import type { MediaAssetDto } from '@visual-ai/shared';

import EditorToolbar from '@/components/Audio/EditorToolbar.vue';
import ExportDialog from '@/components/Audio/ExportDialog.vue';
import WaveformEditor from '@/components/Audio/WaveformEditor.vue';
import ResultCard from '@/components/Studio/ResultCard.vue';

import { useAudioEditor } from '@/composables/useAudioEditor';
import type { PlayerTrack } from '@/stores/player';

const props = defineProps<{ asset: MediaAssetDto }>();

const track = computed<PlayerTrack>(() => ({
  id: props.asset.id,
  title: props.asset.title,
  src: props.asset.url,
  artworkUrl: props.asset.posterUrl,
}));

const editor = useAudioEditor(track);
const isExportOpen = ref(false);

const TOOL_ACTIONS = {
  trim: editor.trimToRegion,
  cut: editor.cutRegion,
  'fade-in': () => editor.fade('in'),
  'fade-out': () => editor.fade('out'),
  normalize: editor.toggleNormalize,
  undo: editor.undo,
  redo: editor.redo,
  reset: editor.reset,
} as const;

function onAction(id: keyof typeof TOOL_ACTIONS) {
  TOOL_ACTIONS[id]();
}
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-4" data-testid="song-result">
    <ResultCard :asset="asset" />
    <section
      aria-label="Edit your song"
      class="tw-flex tw-flex-col tw-gap-3 tw-rounded-card tw-border tw-border-border tw-bg-surface-1 tw-p-3"
      data-testid="song-editor"
    >
      <p
        v-if="editor.status.value === 'loading'"
        role="status"
        class="tw-m-0 tw-text-sm tw-text-ink-muted"
      >
        Drawing the waveform...
      </p>
      <div
        v-else-if="editor.status.value === 'error'"
        role="alert"
        class="tw-flex tw-flex-col tw-items-start tw-gap-2"
      >
        <p class="tw-m-0 tw-text-sm tw-text-ink-primary">
          We could not draw the waveform for this song.
        </p>
        <button
          type="button"
          class="tw-min-h-11 tw-rounded-full tw-border tw-border-border tw-bg-surface-2 tw-px-4 tw-text-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
          @click="editor.load()"
        >
          Try again
        </button>
      </div>
      <template v-else-if="editor.media.value">
        <WaveformEditor
          :media="editor.media.value"
          :peaks="editor.peaks.value"
          :source-duration="editor.sourceDuration.value"
          :edit="editor.edit.value"
          :region="editor.region.value"
          :title="asset.title"
          @update:region="editor.setRegion"
        />
        <EditorToolbar
          :blocked-reason="editor.editBlockedReason.value"
          :has-region="Boolean(editor.region.value)"
          :can-undo="editor.canUndo.value"
          :can-redo="editor.canRedo.value"
          :is-edited="editor.isEdited.value"
          :normalized="editor.edit.value.normalize"
          @action="onAction"
        />
        <button
          type="button"
          data-testid="song-export"
          class="tw-min-h-11 tw-self-start tw-rounded-full tw-border tw-border-border tw-bg-surface-2 tw-px-5 tw-text-sm tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
          @click="isExportOpen = true"
        >
          Export
        </button>
        <ExportDialog
          v-model:open="isExportOpen"
          :asset-id="asset.id"
          :track="track"
          :edit="editor.edit.value"
          :source-duration="editor.sourceDuration.value"
        />
      </template>
    </section>
  </div>
</template>
