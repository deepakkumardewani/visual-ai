<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted } from 'vue';

import FeedbackDetailPanel from '@/components/Admin/FeedbackDetailPanel.vue';
import FeedbackFilterBar from '@/components/Admin/FeedbackFilterBar.vue';
import FeedbackList from '@/components/Admin/FeedbackList.vue';
import FeedbackSummaryStrip from '@/components/Admin/FeedbackSummaryStrip.vue';
import { useAdminFeedback } from '@/composables/useAdminFeedback';
import { usePageSeo } from '@/composables/usePageSeo';

const SKELETON_ROW_COUNT = 4;
/** Matches `lg:` in the template: below it the list and detail swap, so focus has to follow. */
const SPLIT_VIEW_QUERY = '(min-width: 1024px)';

usePageSeo({
  title: 'Feedback inbox – Visual AI',
  description: 'Admin inbox for user feedback.',
  path: '/admin/feedback',
  robots: 'noindex,nofollow',
});

const admin = useAdminFeedback();
const { filters, items, summary, state, selected, selectedId, saving, saveError } = admin;

function focusAfterSwap(selector: string) {
  if (window.matchMedia(SPLIT_VIEW_QUERY).matches) return;
  void nextTick(() => document.querySelector<HTMLElement>(selector)?.focus());
}

function onSelect(id: string) {
  admin.select(id);
  focusAfterSwap('[data-testid="feedback-detail"]');
}

function onBack() {
  const id = selectedId.value;
  admin.select(null);
  if (id) focusAfterSwap(`[data-testid="feedback-row-${id}"]`);
}

onMounted(admin.load);
onBeforeUnmount(admin.dispose);
</script>

<template>
  <main
    class="tw-mx-auto tw-flex tw-w-full tw-max-w-[1200px] tw-flex-col tw-gap-6 tw-px-4 tw-py-8 sm:tw-px-6"
  >
    <header class="tw-flex tw-flex-col tw-gap-1">
      <h1 class="tw-m-0 tw-font-display tw-text-3xl tw-text-ink-primary">Feedback</h1>
      <p class="tw-m-0 tw-text-sm tw-text-ink-muted">What people are telling you, newest first.</p>
    </header>

    <FeedbackSummaryStrip :summary="summary" :loading="state === 'loading'" />
    <FeedbackFilterBar v-model="filters" />

    <div
      v-if="state === 'error' || state === 'rate-limited'"
      role="alert"
      class="tw-flex tw-flex-col tw-items-start tw-gap-3 tw-rounded-card tw-border tw-border-border tw-bg-surface-1 tw-p-5"
    >
      <p class="tw-m-0 tw-text-sm tw-text-ink-primary">
        {{
          state === 'rate-limited'
            ? 'Too many requests. Wait a few minutes, then reload the list.'
            : 'Could not load feedback.'
        }}
      </p>
      <button type="button" class="admin-btn" @click="admin.load">Try again</button>
    </div>

    <div
      v-else-if="state === 'loading' && !items.length"
      class="tw-flex tw-flex-col tw-gap-2"
      aria-busy="true"
      aria-label="Loading feedback"
    >
      <div
        v-for="n in SKELETON_ROW_COUNT"
        :key="n"
        class="tw-h-24 tw-animate-pulse tw-rounded-card tw-bg-surface-2 motion-reduce:tw-animate-none"
      />
    </div>

    <div
      v-else-if="state === 'ready' && !items.length"
      class="tw-flex tw-flex-col tw-items-start tw-gap-3 tw-rounded-card tw-border tw-border-dashed tw-border-border tw-p-8"
    >
      <p class="tw-m-0 tw-text-base tw-text-ink-primary">
        {{ admin.hasFilters.value ? 'Nothing matches these filters.' : 'No feedback yet.' }}
      </p>
      <button
        v-if="admin.hasFilters.value"
        type="button"
        class="admin-btn"
        @click="admin.resetFilters"
      >
        Clear filters
      </button>
    </div>

    <div
      v-else
      class="tw-grid tw-gap-5 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
      :aria-busy="state === 'loading'"
    >
      <div class="tw-flex-col tw-gap-4" :class="selected ? 'tw-hidden lg:tw-flex' : 'tw-flex'">
        <FeedbackList :items="items" :selected-id="selectedId" @select="onSelect" />
        <nav
          v-if="admin.pageCount.value > 1"
          class="tw-flex tw-items-center tw-justify-between"
          aria-label="Pages"
        >
          <button
            type="button"
            class="admin-btn"
            :disabled="filters.page <= 1"
            @click="admin.goToPage(filters.page - 1)"
          >
            Previous
          </button>
          <span class="tw-text-sm tw-tabular-nums tw-text-ink-muted">
            Page {{ filters.page }} of {{ admin.pageCount.value }}
          </span>
          <button
            type="button"
            class="admin-btn"
            :disabled="filters.page >= admin.pageCount.value"
            @click="admin.goToPage(filters.page + 1)"
          >
            Next
          </button>
        </nav>
      </div>
      <div :class="selected ? 'tw-block' : 'tw-hidden lg:tw-block'">
        <FeedbackDetailPanel
          v-if="selected"
          :item="selected"
          :saving="saving"
          :save-error="saveError"
          :failed-saves="admin.failedSaves.value"
          :saved="admin.saved.value"
          @back="onBack"
          @update-status="admin.setStatus"
          @save-note="admin.saveNote"
        />
        <p
          v-else
          class="tw-m-0 tw-rounded-card tw-border tw-border-dashed tw-border-border tw-p-8 tw-text-sm tw-text-ink-muted"
        >
          Pick an item to read it, set its status or add a note.
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.admin-btn {
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  background: transparent;
  color: rgb(var(--tw-ink-primary));
  font-size: 0.875rem;
  transition:
    background-color 150ms ease,
    transform 150ms ease;

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-2));
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.45;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:active:not(:disabled) {
      transform: none;
    }
  }
}
</style>
