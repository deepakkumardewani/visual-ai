<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';
import { computed } from 'vue';

import SongResult from '@/components/Song/SongResult.vue';
import SongComposer from '@/components/Song/SongComposer.vue';
import {
  SONG_EXAMPLE_IDEAS,
  songDisabledReason,
  type SongExampleIdea,
} from '@/components/Song/songPresets';
import JobProgress from '@/components/Studio/JobProgress.vue';
import StudioActionBar from '@/components/Studio/StudioActionBar.vue';
import StudioEmptyState from '@/components/Studio/StudioEmptyState.vue';
import StudioErrorState from '@/components/Studio/StudioErrorState.vue';
import StudioShell from '@/components/Studio/StudioShell.vue';
import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';

import { useMediaCost } from '@/composables/useMediaCost';
import { useMediaDraft } from '@/composables/useMediaDraft';
import { useMediaJob } from '@/composables/useMediaJob';
import { usePageSeo } from '@/composables/usePageSeo';

const SONG_ENDPOINT = '/generate/audio/song';
const SONG_MODEL = 'MINIMAX_MUSIC_26';
const EMPTY_TITLE = 'Your first song';
const EMPTY_DESCRIPTION = 'Describe a style and paste or write lyrics to make your first song.';

usePageSeo({
  title: 'Song studio – Visual AI',
  description: 'Turn your lyrics and a style description into a full song.',
  path: '/audio/song',
});

const { draft } = useMediaDraft();
const job = useMediaJob();
const { cost, estimated } = useMediaCost({ modelKey: SONG_MODEL, input: { kind: 'file' } });

const disabledReason = computed(() => songDisabledReason(draft.prompt, draft.lyrics));
const state = computed(() => job.state.value);

function fillExample(idea: SongExampleIdea) {
  draft.prompt = `${idea.genre}, ${idea.mood}`;
  draft.lyrics = idea.lyricsSeed;
}

function generate() {
  if (disabledReason.value || job.isBusy.value) return;
  void job.submit(SONG_ENDPOINT, { prompt: draft.prompt.trim(), lyrics: draft.lyrics });
}

onKeyStroke('Enter', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  generate();
});
</script>

<template>
  <StudioShell studio="song">
    <h1 class="tw-m-0 tw-mb-6 tw-font-display tw-text-display-md tw-text-ink-primary">
      Song studio
    </h1>
    <SongComposer
      v-model:prompt="draft.prompt"
      v-model:lyrics="draft.lyrics"
      @example="fillExample"
    />
    <div class="tw-mt-6">
      <StudioActionBar
        :cost="cost ?? 0"
        :estimated="estimated"
        :disabled="Boolean(disabledReason)"
        :disabled-reason="disabledReason"
        :busy="job.isBusy.value"
        @generate="generate"
      />
    </div>

    <template #result>
      <JobProgress
        v-if="state.phase === 'queued' || state.phase === 'submitting'"
        stage="queued"
        :elapsed-ms="0"
      />
      <JobProgress
        v-else-if="state.phase === 'running'"
        :stage="state.stage"
        :elapsed-ms="state.elapsedMs"
      />
      <SongResult v-else-if="state.phase === 'succeeded'" :asset="state.asset" />
      <StudioErrorState
        v-else-if="state.phase === 'failed'"
        :message="state.message"
        :no-charge="state.noCharge"
        @action="job.retry()"
      />
      <StudioErrorState
        v-else-if="state.phase === 'rejected'"
        :message="state.message"
        action-label="Dismiss"
        @action="job.reset()"
      />
      <StudioEmptyState
        v-else
        :title="EMPTY_TITLE"
        :description="EMPTY_DESCRIPTION"
        example-label="Try an example"
        @example="fillExample(SONG_EXAMPLE_IDEAS[0])"
      />
    </template>
    <BuyMoreCreditsDialog />
    <LowCreditsDialog />
  </StudioShell>
</template>
