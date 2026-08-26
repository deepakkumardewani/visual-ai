<script setup lang="ts">
import CreditCostBadge from '@/components/primitives/CreditCostBadge.vue';

export type FinishToolTile = {
  title: string;
  description: string;
  to: string;
  costs: number[];
};

defineProps<{
  tools: FinishToolTile[];
}>();
</script>

<template>
  <div class="finish">
    <h3 class="finish__title">Finish tools</h3>
    <div class="finish__grid">
      <router-link
        v-for="(tool, i) in tools"
        :key="tool.to"
        v-reveal="{ delay: 0.04 * i }"
        class="finish__tile"
        :to="tool.to"
      >
        <div class="finish__top">
          <h4 class="finish__name">{{ tool.title }}</h4>
          <span class="finish__costs">
            <CreditCostBadge
              v-for="(cost, costIndex) in tool.costs"
              :key="`${tool.to}-${costIndex}`"
              :cost="cost"
            />
          </span>
        </div>
        <p class="finish__desc">{{ tool.description }}</p>
      </router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
.finish {
  margin-top: clamp(2rem, 4vw, 2.75rem);
}

.finish__title {
  margin: 0 0 1rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #d29467;
}

.finish__grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.finish__tile {
  display: block;
  padding: 1.15rem 1.25rem;
  background: #1a1511;
  border: 1px solid #2d2319;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: #6b5e51;
    background: #221a14;
  }
}

.finish__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.45rem;
}

.finish__name {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: 1.05rem;
  color: rgb(var(--tw-ink-primary));
}

.finish__costs {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.finish__desc {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.55;
  color: rgb(var(--tw-ink-muted));
}
</style>
