<script setup lang="ts">
defineProps<{
  heading: string;
  headingId: string;
  steps: string[];
}>();
</script>

<template>
  <section class="how" :aria-labelledby="headingId">
    <header class="how__head">
      <p class="how__eyebrow">In the studio</p>
      <h2 :id="headingId" class="how__title">{{ heading }}</h2>
    </header>

    <ol class="how__list">
      <li v-for="(step, i) in steps" :key="i" class="how__step">
        <span class="how__n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
        <p class="how__text">{{ step }}</p>
      </li>
    </ol>
  </section>
</template>

<style scoped lang="scss">
.how {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 5.5rem) 1.5rem;
  display: grid;
  gap: clamp(2rem, 4vw, 3.5rem);

  @media (min-width: 900px) {
    grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr);
    gap: clamp(3rem, 6vw, 5rem);
    align-items: start;
  }
}

.how__eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d29467;
}

.how__title {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

.how__list {
  display: grid;
  gap: 1.75rem 2.5rem;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: 720px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem 2.25rem;
  }
}

.how__step {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgb(var(--tw-hairline));
}

.how__n {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.75rem;
  line-height: 1;
  color: #c9a84c;
}

.how__text {
  margin: 0;
  max-width: 28rem;
  font-size: 1rem;
  line-height: 1.65;
  color: rgb(var(--tw-ink-muted));
}
</style>
