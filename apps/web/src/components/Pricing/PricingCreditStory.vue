<script setup lang="ts">
import { DAILY_CREDITS, formatCreditRange, SIGNUP_CREDITS } from '@visual-ai/shared';

import { creditEconomyLines, creditEconomyPhrase } from '@/utils/creditCopy';
import { dailyResetLabel } from '@/utils/dailyReset';

const economy = creditEconomyLines();
const overallRange = {
  min: Math.min(...economy.map((line) => line.range.min)),
  max: Math.max(...economy.map((line) => line.range.max)),
};
const economyCopy = economy.map((line) => `${creditEconomyPhrase(line)}.`).join(' ');

const beats = [
  {
    label: 'Daily Credits',
    value: String(DAILY_CREDITS.free),
    copy: `${dailyResetLabel()} in your local time. Use them that day — unused daily credits do not roll over.`,
  },
  {
    label: 'Persistent Credits',
    value: '∞',
    copy: `The ${SIGNUP_CREDITS} you get at signup, plus every pack you buy. They never expire and sit beside your daily allowance.`,
  },
  {
    label: 'Pay Per Use',
    value: formatCreditRange(overallRange),
    copy: `${economyCopy} Each model is priced by what it costs us to run, and the studio shows the cost before you run.`,
  },
] as const;
</script>

<template>
  <section class="story" aria-labelledby="how-credits-title">
    <div class="story__intro">
      <p class="eyebrow">The economy</p>
      <h2 id="how-credits-title" class="story__title">How Credits Work</h2>
      <p class="story__lede">One currency across every plan. Spend only on the model you pick.</p>
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
  padding: clamp(2rem, 4vw, 3rem) 0 0;

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
