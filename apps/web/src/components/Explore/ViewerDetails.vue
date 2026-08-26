<script setup lang="ts">
import { computed } from 'vue';

import type { ExploreFeedItem } from '@/types';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import {
  faCopy,
  faDownload,
  faExpand,
  faObjectUngroup,
  faPalette,
  faUpload,
  faWandMagicSparkles,
} from '@/plugins/icons';
import { getAuthorAvatarColor } from '@/utils/authorAvatarColor';
import { getTransformCreditCost } from '@/utils/generationCredits';

const props = defineProps<{
  item: ExploreFeedItem;
  detailsOpen?: boolean;
  processing?: boolean;
  /** True after colorize / upscale / remove-bg completes in this session. */
  hasResult?: boolean;
}>();

const emit = defineEmits<{
  remix: [];
  copyPrompt: [];
  download: [];
  useAsReference: [];
  upscale: [];
  colorize: [];
  removeBg: [];
  'update:detailsOpen': [value: boolean];
}>();

const { interactiveTransition, pressable } = useDashboardMotion();
const creditCost = getTransformCreditCost();
const creditLabel = `${creditCost} credit${creditCost === 1 ? '' : 's'}`;

const authorInitials = computed(() => {
  const parts = props.item.author.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
});

const avatarColor = computed(() =>
  getAuthorAvatarColor(props.item.authorUserId || props.item.author),
);

const formattedDate = computed(() => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
    }).format(new Date(props.item.createdAt));
  } catch {
    return props.item.createdAt;
  }
});

const chips = computed(() => {
  const list: string[] = [];
  if (props.item.modelName) list.push(props.item.modelName);
  if (props.item.aspectRatio) list.push(props.item.aspectRatio);
  return list;
});

const downloadLabel = computed(() => (props.hasResult ? 'Download result' : 'Download'));
</script>

<template>
  <aside
    data-testid="explore-viewer-details"
    class="viewer-details tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-border-hairline tw-bg-surface-1"
  >
    <button
      type="button"
      class="viewer-details__mobile-toggle tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-text-left md:tw-hidden"
      :aria-expanded="detailsOpen"
      @click="emit('update:detailsOpen', !detailsOpen)"
    >
      <span class="tw-text-sm tw-font-semibold tw-text-ink">Details & actions</span>
      <span class="tw-text-xs tw-text-ink-muted">{{ detailsOpen ? 'Hide' : 'Show' }}</span>
    </button>

    <div
      class="viewer-details__body tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto tw-px-4 tw-pb-5 md:tw-px-5 md:tw-pb-6 md:tw-pt-5"
      :class="{ 'viewer-details__body--collapsed': !detailsOpen }"
    >
      <!-- Identity — tight group -->
      <header class="viewer-details__identity tw-flex tw-shrink-0 tw-items-center tw-gap-3">
        <span
          class="tw-flex tw-h-9 tw-w-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-xs tw-font-semibold tw-text-canvas tw-ring-1 tw-ring-hairline/40"
          :style="{ backgroundColor: avatarColor }"
          aria-hidden="true"
        >
          {{ authorInitials }}
        </span>
        <div class="tw-min-w-0">
          <p class="tw-truncate tw-text-sm tw-font-semibold tw-text-ink" :title="item.author">
            {{ item.author }}
          </p>
          <p class="tw-mt-0.5 tw-text-xs tw-text-ink-muted">{{ formattedDate }}</p>
        </div>
      </header>

      <!-- Prompt — content-sized; scrolls when long, never eats the column -->
      <section class="viewer-details__prompt-block tw-flex tw-shrink-0 tw-flex-col">
        <div class="tw-flex tw-items-center tw-gap-2">
          <h2
            class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-wide tw-text-ink-muted"
          >
            Prompt
          </h2>
          <button
            type="button"
            data-testid="explore-viewer-copy"
            class="tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-chip tw-text-ink-muted hover:tw-bg-surface-2 hover:tw-text-ink"
            :class="[interactiveTransition, pressable]"
            aria-label="Copy prompt"
            title="Copy prompt"
            @click="emit('copyPrompt')"
          >
            <font-awesome-icon :icon="faCopy" aria-hidden="true" />
          </button>
        </div>

        <div class="viewer-details__prompt tw-mt-2">
          <p class="tw-whitespace-pre-wrap tw-pr-1 tw-text-sm tw-leading-relaxed tw-text-ink">
            {{ item.prompt || 'No prompt available.' }}
          </p>
        </div>

        <div v-if="chips.length" class="tw-mt-3 tw-flex tw-flex-wrap tw-gap-1.5">
          <span
            v-for="chip in chips"
            :key="chip"
            class="tw-rounded-chip tw-bg-surface-2 tw-px-2.5 tw-py-1 tw-text-eyebrow tw-font-medium tw-text-ink-muted"
          >
            {{ chip }}
          </span>
        </div>
      </section>

      <!-- Spacer: pins footer without stretching prompt -->
      <div class="viewer-details__spacer tw-min-h-4 tw-flex-1" aria-hidden="true" />

      <!-- Actions — sticky visual base -->
      <div class="viewer-details__footer tw-flex tw-shrink-0 tw-flex-col">
        <!-- Enhance — single panel, quieter than CTAs -->
        <section class="viewer-details__enhance-group" aria-label="Enhance tools">
          <h2
            class="tw-text-eyebrow tw-font-semibold tw-uppercase tw-tracking-wide tw-text-ink-muted"
          >
            Enhance
          </h2>
          <p class="tw-mt-1 tw-text-xs tw-leading-snug tw-text-ink-muted">
            Colorize runs here. Upscale and remove background open the studio.
          </p>
          <div class="viewer-details__enhance-list tw-mt-2">
            <button
              type="button"
              data-testid="explore-viewer-upscale"
              class="viewer-details__enhance"
              :class="[interactiveTransition, pressable]"
              :disabled="processing"
              @click="emit('upscale')"
            >
              <span class="tw-inline-flex tw-items-center tw-gap-2.5">
                <font-awesome-icon :icon="faExpand" aria-hidden="true" />
                Upscale this
              </span>
              <span class="viewer-details__credit">{{ creditLabel }}</span>
            </button>
            <button
              type="button"
              data-testid="explore-viewer-colorize"
              class="viewer-details__enhance"
              :class="[interactiveTransition, pressable]"
              :disabled="processing"
              @click="emit('colorize')"
            >
              <span class="tw-inline-flex tw-items-center tw-gap-2.5">
                <font-awesome-icon :icon="faPalette" aria-hidden="true" />
                Colorize
              </span>
              <span class="viewer-details__credit">{{ creditLabel }}</span>
            </button>
            <button
              type="button"
              data-testid="explore-viewer-remove-bg"
              class="viewer-details__enhance"
              :class="[interactiveTransition, pressable]"
              :disabled="processing"
              @click="emit('removeBg')"
            >
              <span class="tw-inline-flex tw-items-center tw-gap-2.5">
                <font-awesome-icon :icon="faObjectUngroup" aria-hidden="true" />
                Remove background
              </span>
              <span class="viewer-details__credit">{{ creditLabel }}</span>
            </button>
          </div>
        </section>

        <!-- Primary: Remix is the wax-seal CTA; Download promoted after enhance -->
        <div class="viewer-details__primary tw-flex tw-flex-col tw-gap-2">
          <button
            type="button"
            data-testid="explore-viewer-remix"
            class="viewer-details__cta"
            :class="[
              interactiveTransition,
              pressable,
              hasResult ? 'viewer-details__cta--quiet' : '',
            ]"
            :disabled="processing"
            @click="emit('remix')"
          >
            <font-awesome-icon :icon="faWandMagicSparkles" aria-hidden="true" />
            Remix
          </button>

          <button
            type="button"
            data-testid="explore-viewer-download"
            class="viewer-details__cta"
            :class="[
              interactiveTransition,
              pressable,
              hasResult ? '' : 'viewer-details__cta--quiet',
            ]"
            :disabled="processing"
            :aria-label="downloadLabel"
            @click="emit('download')"
          >
            <font-awesome-icon :icon="faDownload" aria-hidden="true" />
            {{ downloadLabel }}
          </button>

          <button
            type="button"
            data-testid="explore-viewer-reference"
            class="viewer-details__ghost"
            :class="[interactiveTransition, pressable]"
            :disabled="processing"
            @click="emit('useAsReference')"
          >
            <font-awesome-icon :icon="faUpload" aria-hidden="true" />
            Use as reference
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.viewer-details {
  border-top-width: 1px;
  border-top-style: solid;

  @media (min-width: 768px) {
    width: 20rem;
    flex-shrink: 0;
    border-top: none;
    border-left-width: 1px;
    border-left-style: solid;
  }

  @media (min-width: 1024px) {
    width: 22rem;
  }
}

/* Tight identity → short breath → prompt; footer sits on spacer, not void */
.viewer-details__prompt-block {
  margin-top: 1.25rem;
}

.viewer-details__prompt {
  max-height: 9.5rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--tw-hairline)) transparent;

  @media (min-width: 768px) {
    max-height: 12rem;
  }
}

.viewer-details__footer {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgb(var(--tw-hairline) / 0.55);
}

/* Copper wax-seal primary */
.viewer-details__cta {
  display: inline-flex;
  min-height: 2.75rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  background: rgb(var(--tw-accent));
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--tw-canvas));

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 3px;
  }
}

/* Solid secondary — clearly readable, never near-invisible */
.viewer-details__cta--quiet {
  background: rgb(var(--tw-surface-2));
  color: rgb(var(--tw-ink));
  border: 1px solid rgb(var(--tw-hairline) / 0.65);

  &:hover:not(:disabled) {
    filter: none;
    background: rgb(var(--tw-surface-3));
  }
}

/* Tertiary text action */
.viewer-details__ghost {
  display: inline-flex;
  min-height: 2.25rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  background: transparent;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-muted));

  &:hover:not(:disabled) {
    color: rgb(var(--tw-ink));
    background: rgb(var(--tw-surface-2) / 0.55);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 2px;
  }
}

/* One panel — rows share a quiet surface instead of competing cards */
.viewer-details__enhance-list {
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--tw-hairline) / 0.55);
  background: rgb(var(--tw-surface-2) / 0.35);
}

.viewer-details__enhance {
  display: inline-flex;
  min-height: 2.75rem;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: none;
  border-bottom: 1px solid rgb(var(--tw-hairline) / 0.4);
  background: transparent;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--tw-ink));
  text-align: left;

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-2));
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: -2px;
  }
}

.viewer-details__credit {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--tw-ink-muted));
}

.viewer-details__body--collapsed {
  @media (max-width: 767px) {
    display: none;
  }
}
</style>
