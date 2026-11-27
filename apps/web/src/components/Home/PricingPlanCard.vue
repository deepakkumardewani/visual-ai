<script setup lang="ts">
import LandingButton from '@/components/Landing/LandingButton.vue';

defineProps<{
  name: string;
  /** Pre-formatted, localized. Empty until known, space stays reserved. */
  price: string;
  priceLead?: string;
  cadence: string;
  points: readonly string[];
  cta: string;
  to: string;
  /** The lead plan: gold figure and the only filled button. */
  lead?: boolean;
  priceHidden?: boolean;
  /** Neutral line shown in the figure slot instead of a number, at body size. */
  priceNote?: boolean;
}>();
</script>

<template>
  <article class="card" :class="{ 'card--lead': lead }">
    <h3 class="card__name">{{ name }}</h3>
    <p class="card__price">
      <span v-if="priceLead" class="card__lead">{{ priceLead }}</span>
      <span
        class="card__figure"
        :class="{ 'card__figure--pending': priceHidden, 'card__figure--note': priceNote }"
        >{{ price }}</span
      >
    </p>
    <p class="card__cadence">{{ cadence }}</p>
    <ul class="card__points">
      <li v-for="point in points" :key="point" class="card__point">{{ point }}</li>
    </ul>
    <LandingButton :to="to" :variant="lead ? 'primary' : 'ghost'" size="lg" class="card__cta">
      {{ cta }}
    </LandingButton>
  </article>
</template>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--lv2-space-xl) var(--lv2-space-lg);
  border-top: 1px solid rgb(var(--tw-hairline));
}

.card--lead {
  border-top-color: var(--lv2-gold);
}

.card__name {
  margin: 0;
  color: var(--lv2-copper-text);
  font-size: var(--lv2-text-label);
  font-weight: 600;
  letter-spacing: var(--lv2-tracking-label);
  text-transform: uppercase;
}

.card__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--lv2-space-xs);
  margin: var(--lv2-space-lg) 0 0;
  font-family: var(--lv2-font-display);
  --card-figure-size: clamp(3rem, 2.2rem + 2.4vw, 4.5rem);
  font-size: var(--card-figure-size);
  /* Keeps the card height when the figure is swapped for a smaller note. */
  min-height: var(--card-figure-size);
  line-height: 1;
  letter-spacing: var(--lv2-tracking-display);
}

.card__lead {
  font-family: var(--lv2-font-body);
  font-size: var(--lv2-text-small);
  letter-spacing: 0;
  color: rgb(var(--tw-ink-muted));
}

.card--lead .card__figure {
  color: var(--lv2-gold);
}

.card__figure {
  transition: opacity 0.4s var(--lv2-ease-out);
}

/* A note is not a price: body type, same slot, so card heights do not change. */
.card__figure--note {
  font-family: var(--lv2-font-body);
  font-size: var(--lv2-text-body);
  letter-spacing: 0;
  color: rgb(var(--tw-ink-muted));
}

/* Space stays reserved; the localized price fades in once it has settled. */
.card__figure--pending {
  opacity: 0;
}

.card__cadence {
  margin: var(--lv2-space-xs) 0 0;
  color: rgb(var(--tw-ink-muted));
  font-size: var(--lv2-text-small);
}

.card__points {
  flex: 1;
  margin: var(--lv2-space-xl) 0;
  padding: 0;
  list-style: none;
  display: grid;
  align-content: start;
  gap: var(--lv2-space-sm);
}

.card__point {
  padding-left: var(--lv2-space-lg);
  position: relative;
  color: rgb(var(--tw-ink-secondary));
  font-size: var(--lv2-text-body);
  line-height: 1.45;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.5em;
    width: 0.5rem;
    height: 1px;
    background: var(--lv2-copper);
  }
}
</style>
