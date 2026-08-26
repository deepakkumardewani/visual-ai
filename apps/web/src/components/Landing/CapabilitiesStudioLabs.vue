<script setup lang="ts">
export type StudioLabChip = {
  name: string;
  count: number;
};

defineProps<{
  labs: StudioLabChip[];
}>();
</script>

<template>
  <div class="labs">
    <div class="labs__head">
      <h3 class="labs__title">Also in the studio</h3>
      <p class="labs__sub">Full roster and per-model costs live on pricing.</p>
    </div>
    <ul class="labs__list">
      <li v-for="lab in labs" :key="lab.name">
        <router-link
          class="labs__chip"
          to="/pricing#model-costs"
          :aria-label="`${lab.name}, ${lab.count} ${lab.count === 1 ? 'model' : 'models'}`"
        >
          <span class="labs__name">{{ lab.name }}</span>
          <span class="labs__count">{{ lab.count }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.labs {
  margin-top: clamp(2rem, 4vw, 2.75rem);
}

.labs__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.75rem 1.25rem;
  margin-bottom: 1rem;
}

.labs__title {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #d29467;
}

.labs__sub {
  margin: 0;
  font-size: 0.88rem;
  color: rgb(var(--tw-ink-muted));
}

.labs__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.labs__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid #2d2319;
  border-radius: 9999px;
  background: #1a1511;
  color: rgb(var(--tw-ink-primary));
  text-decoration: none;
  font-size: 0.88rem;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: #6b5e51;
    background: #221a14;
  }
}

.labs__name {
  letter-spacing: 0.01em;
}

.labs__count {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #c9a84c;
  min-width: 1.25rem;
  text-align: center;
}
</style>
