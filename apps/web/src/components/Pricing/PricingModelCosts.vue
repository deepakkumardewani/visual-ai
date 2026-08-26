<script setup lang="ts">
import type { PricingBand, PricingBoardColumn } from '@/composables/usePricingCatalog';

defineProps<{
  board: PricingBoardColumn[];
}>();

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
</style>
