<script setup lang="ts">
import { useObjectUrl } from '@vueuse/core';
import { computed, ref, toRef, watch } from 'vue';

import AppModal from '@/components/AppModal.vue';

import {
  estimateExportBytes,
  useAudioExport,
  type ExportFormat,
} from '@/composables/useAudioExport';
import type { EditState } from '@/utils/audioEditMath';
import { formatFileSize } from '@/utils/helpers';
import type { PlayerTrack } from '@/stores/player';

const FORMATS: ReadonlyArray<{
  id: ExportFormat;
  label: string;
  hint: string;
}> = [
  { id: 'mp3', label: 'MP3', hint: 'Small file, plays everywhere' },
  { id: 'wav', label: 'WAV', hint: 'Lossless, larger file' },
];
const PERCENT = 100;
const TITLE_ID = 'export-dialog-title';

const props = defineProps<{
  open: boolean;
  assetId: string;
  track: PlayerTrack;
  edit: EditState;
  sourceDuration: number;
}>();

const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const format = ref<ExportFormat>('mp3');
const exporter = useAudioExport({
  track: toRef(props, 'track'),
  edit: toRef(props, 'edit'),
  sourceDuration: toRef(props, 'sourceDuration'),
});

const percent = computed(() => Math.round(exporter.progress.value * PERCENT));
const downloadUrl = useObjectUrl(computed(() => exporter.result.value?.blob));
const savedVersion = exporter.savedVersion;
const sizeLabels = computed(
  () => new Map(FORMATS.map(({ id }) => [id, formatFileSize(estimateExportBytes(props.edit, id))])),
);

function close() {
  exporter.cancel();
  exporter.reset();
  emit('update:open', false);
}

// Changing the choice after a finished render would offer a file that no longer matches it.
watch(format, () => exporter.reset());
watch(
  () => props.open,
  (open) => !open && exporter.cancel(),
);
</script>

<template>
  <AppModal
    :open="open"
    trap-focus
    :labelled-by="TITLE_ID"
    max-width="28rem"
    @update:open="(value) => !value && close()"
  >
    <template #title>Export your song</template>

    <div class="tw-flex tw-flex-col tw-gap-4" data-testid="export-dialog">
      <fieldset
        class="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-border-0 tw-p-0"
        :disabled="exporter.isEncoding.value"
      >
        <legend class="tw-mb-2 tw-p-0 tw-text-sm tw-text-ink-muted">Format</legend>
        <label
          v-for="option in FORMATS"
          :key="option.id"
          class="export-option tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-card tw-border tw-border-border tw-bg-surface-1 tw-px-4 tw-py-2 tw-transition-colors tw-duration-fast motion-reduce:tw-transition-none"
          :class="{ 'export-option--active': format === option.id }"
        >
          <input
            v-model="format"
            type="radio"
            name="export-format"
            :value="option.id"
            :data-testid="`export-format-${option.id}`"
            class="tw-h-4 tw-w-4 tw-accent-accent"
          />
          <span class="tw-flex tw-flex-1 tw-flex-col">
            <span class="tw-text-sm tw-font-medium tw-text-ink-primary">{{ option.label }}</span>
            <span class="tw-text-xs tw-text-ink-muted">{{ option.hint }}</span>
          </span>
          <span class="tw-text-sm tw-text-ink-muted" :data-testid="`export-size-${option.id}`">
            About {{ sizeLabels.get(option.id) }}
          </span>
        </label>
      </fieldset>

      <div v-if="exporter.isEncoding.value" class="tw-flex tw-flex-col tw-gap-2">
        <div
          role="progressbar"
          aria-label="Exporting"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="percent"
          class="tw-h-2 tw-overflow-hidden tw-rounded-full tw-bg-surface-2"
          data-testid="export-progress"
        >
          <div
            class="export-bar tw-h-full tw-bg-accent tw-transition-[width] tw-duration-fast motion-reduce:tw-transition-none"
            :style="{ width: `${percent}%` }"
          />
        </div>
        <p role="status" class="tw-m-0 tw-text-sm tw-text-ink-muted">Exporting {{ percent }}%</p>
      </div>

      <p
        v-if="exporter.errorMessage.value"
        role="alert"
        class="tw-m-0 tw-text-sm tw-text-ink-primary"
        data-testid="export-error"
      >
        {{ exporter.errorMessage.value }}
      </p>
      <p
        v-if="savedVersion"
        role="status"
        class="tw-m-0 tw-text-sm tw-text-ink-primary"
        data-testid="export-saved"
      >
        Saved as a new version. No credits were used.
      </p>
      <p
        v-if="exporter.saveError.value"
        role="alert"
        class="tw-m-0 tw-text-sm tw-text-ink-primary"
        data-testid="export-save-error"
      >
        {{ exporter.saveError.value }}
      </p>
    </div>

    <template #actions>
      <button
        v-if="exporter.isEncoding.value"
        type="button"
        data-testid="export-cancel"
        class="export-btn"
        @click="exporter.cancel()"
      >
        Cancel
      </button>
      <template v-else-if="exporter.result.value">
        <a
          :href="downloadUrl"
          :download="exporter.result.value.filename"
          data-testid="export-download"
          class="export-btn export-btn--primary"
        >
          Download
        </a>
        <button
          type="button"
          data-testid="export-save"
          class="export-btn"
          :disabled="exporter.isSaving.value || Boolean(savedVersion)"
          @click="exporter.saveVersion(assetId)"
        >
          {{ exporter.isSaving.value ? 'Saving...' : 'Save as new version' }}
        </button>
      </template>
      <button
        v-else
        type="button"
        data-testid="export-start"
        class="export-btn export-btn--primary"
        @click="exporter.start(format)"
      >
        {{ exporter.errorMessage.value ? 'Try again' : 'Export' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.export-option--active {
  border-color: rgb(var(--tw-accent));
  background: rgb(var(--tw-accent) / 0.12);
}

.export-option:focus-within {
  outline: 2px solid rgb(var(--tw-accent));
  outline-offset: 2px;
}

.export-btn {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0 1.25rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  background: rgb(var(--tw-surface-2));
  color: rgb(var(--tw-ink-primary));
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.export-btn--primary {
  border-color: transparent;
  background: rgb(var(--tw-accent));
  color: rgb(var(--tw-canvas));
}
</style>
