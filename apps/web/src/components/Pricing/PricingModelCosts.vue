<script setup lang="ts">
import {
  getMediaCreditCost,
  getModelKind,
  MODEL_REGISTRY,
  TTS_BILLING_UNIT_CHARS,
} from '@visual-ai/shared';
import type { MediaCostInput, MediaModelKey, MediaPricing, ModelKind } from '@visual-ai/shared';

import type { PricingBand, PricingBoardColumn } from '@/composables/usePricingCatalog';

defineProps<{
  board: PricingBoardColumn[];
}>();

type MediaCostVariant = { label: string; cost: number };
type MediaCostRow = {
  key: MediaModelKey;
  label: string;
  unit: string;
  variants: MediaCostVariant[];
};
type MediaCostGroup = { kind: ModelKind; title: string; rows: MediaCostRow[] };

const MEDIA_GROUPS: Array<{ kind: ModelKind; title: string }> = [
  { kind: 'song', title: 'Song' },
  { kind: 'music', title: 'Music' },
  { kind: 'tts', title: 'Speech' },
  { kind: 'video', title: 'Video' },
  { kind: 'tool', title: 'Tools' },
];

/** Helper-only models (voice cloning) are billed inside their own flow, not listed here. */
const UNLISTED_MEDIA_KEYS: ReadonlySet<string> = new Set(['MINIMAX_VOICE_CLONE']);

const ONE_SECOND = 1;
const CHARS_PER_K = 1000;

function unitLabel(pricing: MediaPricing): string {
  if (pricing.unit === 'file') return 'per file';
  if (pricing.unit === 'second') return 'per second';
  if (pricing.unit === 'run') {
    return pricing.blockSec ? `per ${pricing.blockSec} s of video` : 'per run';
  }
  return `per ${TTS_BILLING_UNIT_CHARS / CHARS_PER_K}K characters`;
}

/** One priced variant per resolution (and draft) for per-second models, else a single one. */
function costVariants(key: MediaModelKey, pricing: MediaPricing): MediaCostVariant[] {
  const price = (input: MediaCostInput) => getMediaCreditCost(key, input);
  if (pricing.unit === 'second') {
    const second = (resolution: string, draft?: boolean) =>
      price({ kind: 'seconds', durationSec: ONE_SECOND, resolution, draft });
    const full = Object.keys(pricing.byResolution ?? {}).map((resolution) => ({
      label: resolution,
      cost: second(resolution),
    }));
    const drafts = Object.keys(pricing.draftByResolution ?? {}).map((resolution) => ({
      label: `${resolution} draft`,
      cost: second(resolution, true),
    }));
    return [...full, ...drafts];
  }
  if (pricing.unit === 'file') return [{ label: '', cost: price({ kind: 'file' }) }];
  if (pricing.unit === 'run') {
    const input: MediaCostInput = pricing.blockSec
      ? { kind: 'blocks', videoSec: pricing.blockSec }
      : { kind: 'run' };
    return [{ label: '', cost: price(input) }];
  }
  return [
    {
      label: '',
      cost: price({ kind: 'chars', chars: TTS_BILLING_UNIT_CHARS }),
    },
  ];
}

function buildMediaGroups(): MediaCostGroup[] {
  const rowsByKind = new Map<ModelKind, MediaCostRow[]>();
  for (const [key, model] of Object.entries(MODEL_REGISTRY)) {
    const pricing = model?.media?.pricing;
    if (!model || !pricing || UNLISTED_MEDIA_KEYS.has(key)) continue;
    const kind = getModelKind(model);
    const row: MediaCostRow = {
      key: key as MediaModelKey,
      label: model.label,
      unit: unitLabel(pricing),
      variants: costVariants(key as MediaModelKey, pricing),
    };
    rowsByKind.set(kind, [...(rowsByKind.get(kind) ?? []), row]);
  }
  return MEDIA_GROUPS.flatMap(({ kind, title }) => {
    const rows = rowsByKind.get(kind);
    return rows ? [{ kind, title, rows }] : [];
  });
}

const mediaGroups = buildMediaGroups();

function uniqueCosts(band: PricingBand) {
  return [...new Set(band.rows.map((row) => row.cost))];
}

function hasSplitCosts(band: PricingBand) {
  return uniqueCosts(band).length > 1;
}

function rateAriaLabel(band: PricingBand) {
  const costs = uniqueCosts(band);
  if (costs.length === 1) {
    return `${costs[0]} credits`;
  }
  return `${Math.min(...costs)}–${Math.max(...costs)} credits`;
}
</script>

<template>
  <section id="model-costs" class="costs" aria-labelledby="model-costs-title">
    <div class="costs__intro">
      <p class="eyebrow">Studio rates</p>
      <h2 id="model-costs-title" class="costs__title">Model Credit Costs</h2>
      <p class="costs__lede">
        Here's what credits buy. The studio shows the exact cost before anything runs.
      </p>
    </div>

    <div class="costs__board">
      <article v-for="column in board" :key="column.category" class="costs__col">
        <h3 class="costs__cat">{{ column.category }}</h3>
        <p class="costs__blurb">{{ column.blurb }}</p>

        <div v-for="band in column.bands" :key="band.title" class="band">
          <div class="band__copy">
            <p class="band__title">{{ band.title }}</p>
            <p v-if="band.hint" class="band__hint">{{ band.hint }}</p>
            <template v-for="row in band.rows" :key="`${row.cost}-${row.names}`">
              <p v-if="row.names" class="band__names">
                <span v-if="hasSplitCosts(band)" class="band__cost-chip">{{ row.cost }}</span>
                {{ row.names }}
              </p>
            </template>
          </div>
          <p class="band__rate" :aria-label="rateAriaLabel(band)">
            <CreditCostBadge v-if="!hasSplitCosts(band)" :cost="uniqueCosts(band)[0]" />
            <template v-else>
              <font-awesome-icon icon="coins" class="band__rate-icon" aria-hidden="true" />
              {{ Math.min(...uniqueCosts(band)) }}–{{ Math.max(...uniqueCosts(band)) }}
            </template>
          </p>
        </div>
      </article>
    </div>

    <div class="media" data-testid="media-costs">
      <div class="media__intro">
        <h3 class="media__title">Audio, video and tools</h3>
        <p class="media__lede">
          Priced by what you generate, so the number depends on the unit shown.
        </p>
      </div>

      <div class="media__groups">
        <div v-for="group in mediaGroups" :key="group.kind" class="media__group">
          <h4 class="costs__cat">{{ group.title }}</h4>
          <ul class="media__list">
            <li
              v-for="row in group.rows"
              :key="row.key"
              class="media__row"
              :data-testid="`media-cost-${row.key}`"
            >
              <div class="media__copy">
                <p class="band__title">{{ row.label }}</p>
                <p class="band__hint">{{ row.unit }}</p>
              </div>
              <ul class="media__rates">
                <li
                  v-for="variant in row.variants"
                  :key="variant.label"
                  class="media__rate"
                  :data-testid="`media-cost-${row.key}-${variant.label || 'base'}`"
                >
                  <span v-if="variant.label" class="media__variant">{{ variant.label }}</span>
                  <CreditCostBadge :cost="variant.cost" />
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.costs {
  padding: clamp(3.5rem, 7vw, 5.5rem) 0 0;
}

.costs__intro {
  max-width: 40rem;
  margin-bottom: clamp(1.75rem, 3vw, 2.5rem);
}

.costs__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 0.75rem 0 0;
}

.costs__lede {
  margin: 1rem 0 0;
  max-width: 52ch;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-secondary));
}

.costs__board {
  display: grid;
  gap: 2.25rem;
  align-items: start;

  @media (min-width: 880px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem 2.5rem;
  }
}

.costs__cat {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(var(--tw-accent));
}

.costs__blurb {
  margin: 0.5rem 0 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-secondary));
  max-width: 36ch;
}

.band {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem 1rem;
  align-items: start;
  padding: 0.9rem 0;
  border-top: 1px solid rgb(var(--tw-hairline));

  &:last-child {
    border-bottom: 1px solid rgb(var(--tw-hairline));
  }
}

.band__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.band__hint {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: rgb(var(--tw-ink-muted));
}

.band__names {
  margin: 0.45rem 0 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: rgb(var(--tw-ink-muted));
}

.band__cost-chip {
  display: inline-block;
  margin-right: 0.35rem;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--tw-ink-primary));
}

.band__rate {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
  white-space: nowrap;
}

.band__rate-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.media {
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
}

.media__title {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  color: rgb(var(--tw-ink-primary));
}

.media__lede {
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-secondary));
}

.media__groups {
  display: grid;
  gap: 2rem;
  margin-top: 1.5rem;

  @media (min-width: 880px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem 2.5rem;
  }
}

.media__list,
.media__rates {
  list-style: none;
  margin: 0;
  padding: 0;
}

.media__list {
  margin-top: 0.75rem;
}

.media__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem 1rem;
  align-items: start;
  padding: 0.8rem 0;
  border-top: 1px solid rgb(var(--tw-hairline));

  &:last-child {
    border-bottom: 1px solid rgb(var(--tw-hairline));
  }
}

.media__rates {
  display: grid;
  gap: 0.35rem;
  justify-items: end;
}

.media__rate {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.media__variant {
  font-size: 0.8rem;
  font-weight: 400;
  color: rgb(var(--tw-ink-muted));
}
</style>
