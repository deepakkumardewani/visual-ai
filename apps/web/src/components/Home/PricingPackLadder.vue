<script setup lang="ts">
import type { CreditPack } from '@visual-ai/shared';

defineProps<{
  packs: readonly CreditPack[];
  formatPrice: (pack: CreditPack) => string;
  /** Prices stay hidden (row height kept) until the buyer's currency is known, or if it never is. */
  pricesHidden?: boolean;
}>();
</script>

<template>
  <ul class="ladder" aria-label="Credit packs">
    <li
      v-for="pack in packs"
      :key="pack.id"
      class="ladder__row"
      :class="{ 'ladder__row--popular': pack.popular }"
      :data-testid="`home-pack-${pack.id}`"
    >
      <span class="ladder__credits">
        {{ pack.credits.toLocaleString() }} credits
        <span v-if="pack.popular" class="ladder__tag">Most popular</span>
      </span>
      <span class="ladder__price" :class="{ 'ladder__price--pending': pricesHidden }">
        {{ formatPrice(pack) }}
      </span>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.ladder {
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
}

/* A ledger: hairline-ruled rows, figures right-aligned on tabular numerals. */
.ladder__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--home-space-md);
  padding: var(--home-space-sm) 0;
  border-bottom: 1px solid rgb(var(--tw-hairline));
  color: rgb(var(--tw-ink-secondary));
  font-size: var(--home-text-body);
  font-variant-numeric: tabular-nums;

  &:first-child {
    border-top: 1px solid rgb(var(--tw-hairline));
  }
}

.ladder__credits {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: var(--home-space-sm);
}

/* The suggested pick: parchment ink, gold figure and label, gold hairlines either side. */
.ladder__row--popular {
  color: rgb(var(--tw-ink-primary));
  border-bottom-color: color-mix(in srgb, var(--home-gold) 55%, transparent);

  & .ladder__price {
    color: var(--home-gold);
  }
}

.ladder__row:has(+ .ladder__row--popular) {
  border-bottom-color: color-mix(in srgb, var(--home-gold) 55%, transparent);
}

.ladder__tag {
  color: var(--home-gold);
  font-size: var(--home-text-label);
  font-weight: 600;
  letter-spacing: var(--home-tracking-label);
  text-transform: uppercase;
}

.ladder__price {
  font-family: var(--home-font-display);
  white-space: nowrap;
  transition: opacity 0.4s var(--home-ease-out);
}

.ladder__price--pending {
  opacity: 0;
}
</style>
