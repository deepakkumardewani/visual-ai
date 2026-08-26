<script setup lang="ts">
import CreditCostBadge from '@/components/primitives/CreditCostBadge.vue';
import type { Model } from '@/types/model';

defineProps<{
  models: Model[];
}>();
</script>

<template>
  <div class="featured">
    <article
      v-for="(model, i) in models"
      :key="model.id"
      v-reveal="{ delay: i * 0.05 }"
      class="featured__card"
    >
      <div class="featured__top">
        <h3 class="featured__name">{{ model.title }}</h3>
        <CreditCostBadge v-if="model.creditCost != null" :cost="model.creditCost" />
      </div>
      <p class="featured__desc">{{ model.description }}</p>
      <dl v-if="model.bestAt" class="featured__meta">
        <dt class="featured__meta-label">Best at</dt>
        <dd class="featured__meta-value">{{ model.bestAt }}</dd>
        <dd v-if="model.companyName" class="featured__lab">{{ model.companyName }}</dd>
      </dl>
    </article>
  </div>
</template>

<style scoped lang="scss">
.featured {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.featured__card {
  padding: 1.5rem;
  background: #221a14;
  border: 1px solid #2d2319;
  border-radius: 16px;
  transition:
    border-color 0.25s ease,
    transform 0.25s ease,
    background-color 0.25s ease;

  &:hover {
    border-color: #6b5e51;
    background: #2d2319;
    transform: translateY(-3px);
  }
}

.featured__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.featured__name {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: 1.2rem;
  color: rgb(var(--tw-ink-primary));
  margin: 0;
}

.featured__desc {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}

.featured__meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 1.1rem 0 0;
  padding-top: 1rem;
  border-top: 1px solid #2d2319;
}

.featured__meta-label {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #d29467;
}

.featured__meta-value {
  margin: 0;
  font-size: 0.85rem;
  color: rgb(var(--tw-ink-primary));
}

.featured__lab {
  margin: 0 0 0 auto;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgb(var(--tw-ink-muted));
  padding: 0.15rem 0.5rem;
  border: 1px solid #3a2e22;
  border-radius: 9999px;
}

@media (prefers-reduced-motion: reduce) {
  .featured__card:hover {
    transform: none;
  }
}
</style>
