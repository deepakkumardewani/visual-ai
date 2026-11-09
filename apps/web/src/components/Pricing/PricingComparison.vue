<script setup lang="ts">
import { DAILY_CREDITS, HISTORY_CAP, PLAN } from '@visual-ai/shared';

interface PlanColumn {
  id: string;
  name: string;
  featured: boolean;
  rows: readonly { label: string; value: string }[];
}

const PLANS: readonly PlanColumn[] = [
  {
    id: PLAN.FREE,
    name: 'Free',
    featured: false,
    rows: [
      { label: 'Daily credits', value: `${DAILY_CREDITS.free} per day` },
      { label: 'History', value: `${HISTORY_CAP[PLAN.FREE]} images` },
      { label: 'Models', value: 'Budget and standard models' },
      { label: 'Queue', value: 'Standard queue' },
      { label: 'Privacy', value: 'Generations appear in Explore' },
    ],
  },
  {
    id: PLAN.PRO,
    name: 'Pro',
    featured: true,
    rows: [
      { label: 'Daily credits', value: `${DAILY_CREDITS.pro} per day` },
      { label: 'History', value: `${HISTORY_CAP[PLAN.PRO]} images` },
      { label: 'Models', value: 'Every model, including the premium ones' },
      { label: 'Queue', value: 'Priority queue, your jobs start first' },
      { label: 'Privacy', value: 'Generations stay private' },
    ],
  },
];
</script>

<template>
  <section id="comparison" class="compare" aria-labelledby="compare-title">
    <div class="compare__intro">
      <p class="eyebrow">Plans</p>
      <h2 id="compare-title" class="compare__title">Free or Pro</h2>
    </div>

    <div class="compare__grid">
      <article
        v-for="plan in PLANS"
        :key="plan.id"
        class="plan"
        :class="{ 'plan--featured': plan.featured }"
        :data-testid="`plan-${plan.id}`"
      >
        <h3 class="plan__name">{{ plan.name }}</h3>
        <dl class="plan__rows">
          <div v-for="row in plan.rows" :key="row.label" class="plan__row">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.compare {
  padding: clamp(2rem, 4vw, 3rem) 0 0;
}

.compare__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 0.75rem 0 0;
}

.compare__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  margin-top: 1.5rem;

  @media (min-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.plan {
  padding: 1.5rem;
  background: rgb(var(--tw-surface-2));
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 1.15rem;
}

.plan--featured {
  background: rgb(var(--tw-surface-3));
  border-color: color-mix(in oklab, rgb(var(--tw-accent)) 45%, rgb(var(--tw-hairline)));
}

.plan__name {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: 1.5rem;
  color: rgb(var(--tw-ink-primary));
}

.plan__rows {
  margin: 1rem 0 0;
}

.plan__row {
  display: grid;
  gap: 0.15rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgb(var(--tw-hairline));

  dt {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgb(var(--tw-ink-muted));
  }

  dd {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    color: rgb(var(--tw-ink-primary));
  }
}
</style>
