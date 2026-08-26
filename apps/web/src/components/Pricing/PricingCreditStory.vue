<script setup lang="ts">
const beats = [
  {
    label: 'Daily Credits',
    value: '30',
    copy: 'Refreshed at midnight. Use them that day — unused daily credits do not roll over.',
  },
  {
    label: 'Persistent Credits',
    value: '∞',
    copy: 'The 50 you get at signup, plus every pack you buy. They never expire and sit beside your daily allowance.',
  },
  {
    label: 'Pay Per Use',
    value: '1–8',
    copy: 'Budget generation is 1 credit. Utilities are 2. Premium models and upscalers run 4–8. The studio shows the cost before you run.',
  },
] as const;
</script>

<template>
  <section class="story" aria-labelledby="how-credits-title">
    <div class="story__intro">
      <p class="eyebrow">The economy</p>
      <h2 id="how-credits-title" class="story__title">How Credits Work</h2>
      <p class="story__lede">
        One currency. No subscription tiers. Spend only on the model you pick.
      </p>
    </div>

    <dl class="story__list">
      <div v-for="beat in beats" :key="beat.label" class="story__row">
        <dt>
          <span class="story__value">{{ beat.value }}</span>
          <span class="story__label">{{ beat.label }}</span>
        </dt>
        <dd>{{ beat.copy }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped lang="scss">
.story {
  display: grid;
  gap: clamp(2rem, 4vw, 3.5rem);
  padding: clamp(3.5rem, 7vw, 5.5rem) 0 0;

  @media (min-width: 880px) {
    grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
    align-items: start;
    gap: 4rem;
  }
}

.story__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 0.75rem 0 0;
}

.story__lede {
  margin: 1rem 0 0;
  max-width: 32ch;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-secondary));
}

.story__list {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.story__row {
  display: grid;
  gap: 0.75rem 2rem;
  padding: 1.5rem 0;
  border-top: 1px solid rgb(var(--tw-hairline));

  &:last-child {
    border-bottom: 1px solid rgb(var(--tw-hairline));
  }

  @media (min-width: 640px) {
    grid-template-columns: 11rem minmax(0, 1fr);
    align-items: baseline;
  }
}

.story__row dt {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
}

.story__value {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.75rem;
  line-height: 1;
  color: rgb(var(--tw-accent));
}

.story__label {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.story__row dd {
  margin: 0;
  max-width: 48ch;
  font-size: 1rem;
  line-height: 1.65;
  color: rgb(var(--tw-ink-secondary));
}
</style>
