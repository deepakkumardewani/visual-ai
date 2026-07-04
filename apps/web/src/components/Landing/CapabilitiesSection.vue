<script setup lang="ts">
import { MODELS } from '@/utils/landing';
</script>

<template>
  <section id="models" class="caps">
    <div class="caps__head">
      <p v-reveal class="eyebrow">Under the hood</p>
      <h2 v-reveal="{ delay: 0.05 }" class="caps__title">Serious models. Sensible controls.</h2>
      <p v-reveal="{ delay: 0.1 }" class="caps__sub">
        Speed for drafts, fidelity for finals — pick the model that fits the job and move on.
      </p>
    </div>

    <div class="caps__models">
      <article
        v-for="(model, i) in MODELS"
        :key="model.title"
        v-reveal="{ delay: i * 0.06 }"
        class="model"
      >
        <div class="model__top">
          <h3 class="model__name">{{ model.title }}</h3>
          <span v-if="model.isPro" class="model__pro">Pro</span>
        </div>
        <p class="model__desc">{{ model.description }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.caps {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: clamp(4rem, 8vw, 7rem) 1.5rem;
}

.caps__head {
  max-width: 42rem;
  margin-bottom: clamp(2.5rem, 5vw, 3.5rem);
}
.caps__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 1rem 0 0;
}
.caps__sub {
  margin: 1rem 0 0;
  font-size: 1.1rem;
  line-height: 1.65;
  color: rgb(var(--tw-ink-muted));
}

.caps__models {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.model {
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
.model__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}
.model__name {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: 1.2rem;
  color: rgb(var(--tw-ink-primary));
  margin: 0;
}
.model__pro {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c98a5a;
  padding: 0.2rem 0.55rem;
  border: 1px solid rgba(201, 138, 90, 0.4);
  border-radius: 9999px;
}
.model__desc {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}

@media (prefers-reduced-motion: reduce) {
  .model:hover {
    transform: none;
  }
}
</style>
