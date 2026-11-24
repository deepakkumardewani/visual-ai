<script setup lang="ts">
import {
  getModelDefinition,
  TTS_DEFAULT_VOICE,
  TTS_VOICES,
  type SpeechModelKey,
} from '@visual-ai/shared';
import { computed, ref, watch } from 'vue';

/** Below this many voices a search box only adds noise. */
const SEARCH_MIN_VOICES = 6;

const props = defineProps<{ modelKey: SpeechModelKey }>();
const voice = defineModel<string>({ required: true });

const query = ref('');
const notice = ref('');

const catalog = computed(() => getModelDefinition(props.modelKey).media?.voices);
const voices = computed(() => (catalog.value ? TTS_VOICES[catalog.value] : []));
const visibleVoices = computed(() => {
  const needle = query.value.trim().toLowerCase();
  return voices.value.filter((entry) => entry.id.toLowerCase().includes(needle));
});
const showSearch = computed(() => voices.value.length > SEARCH_MIN_VOICES);

/** Keeps the selection when the new model has it, otherwise falls back to its default (R-TTS-7). */
watch(
  () => props.modelKey,
  () => {
    notice.value = '';
    query.value = '';
    if (!catalog.value || voices.value.some((entry) => entry.id === voice.value)) return;
    // defineModel does not reflect the write until the parent re-renders, so build the notice from the const.
    const fallback = TTS_DEFAULT_VOICE[catalog.value];
    voice.value = fallback;
    notice.value = `Voice changed to ${fallback}`;
  },
  { immediate: true },
);
</script>

<template>
  <fieldset
    class="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-border-0 tw-p-0"
    data-testid="voice-select"
  >
    <legend class="tw-mb-2 tw-p-0 tw-text-sm tw-font-semibold tw-text-ink-primary">Voice</legend>
    <input
      v-if="showSearch"
      v-model="query"
      type="search"
      class="voice-search"
      aria-label="Search voices"
      placeholder="Search voices"
      data-testid="voice-search"
    />
    <div class="voice-list" data-testid="voice-list">
      <label
        v-for="entry in visibleVoices"
        :key="entry.id"
        class="voice-option"
        :class="{ 'voice-option--on': voice === entry.id }"
        data-testid="voice-option"
      >
        <input
          v-model="voice"
          type="radio"
          name="speech-voice"
          class="voice-option__input"
          :value="entry.id"
        />
        <span class="tw-font-medium tw-text-ink-primary">{{ entry.id }}</span>
      </label>
      <p v-if="!visibleVoices.length" class="tw-m-0 tw-p-3 tw-text-sm tw-text-ink-muted">
        No voice matches "{{ query }}".
      </p>
    </div>
    <p
      class="tw-m-0 tw-min-h-[1rem] tw-text-xs tw-text-ink-muted"
      role="status"
      data-testid="voice-notice"
    >
      {{ notice }}
    </p>
  </fieldset>
</template>

<style scoped lang="scss">
.voice-search {
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.voice-list {
  display: flex;
  flex-direction: column;
  max-height: 14rem;
  overflow-y: auto;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
}

.voice-option {
  position: relative;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0.5rem 0.875rem;
  align-items: center;
  background: rgb(var(--tw-surface-1));
  cursor: pointer;

  &:hover {
    background: rgb(var(--tw-surface-2));
  }

  &--on {
    background: rgb(var(--tw-surface-2));
    box-shadow: inset 3px 0 0 rgb(var(--studio-accent));
  }

  &:has(:focus-visible) {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: -2px;
  }
}

.voice-option__input {
  position: absolute;
  opacity: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}
</style>
