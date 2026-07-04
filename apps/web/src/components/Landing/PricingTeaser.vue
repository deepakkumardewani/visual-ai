<script setup lang="ts">
import LandingButton from '@/components/Landing/LandingButton.vue';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    cadence: 'forever',
    featured: false,
    points: [
      '20 credits, every day',
      'All four tools included',
      'Standard quality, JPG export',
      'Two variations per prompt',
    ],
    cta: 'Start free',
    to: '/signup',
  },
  {
    name: 'Pro',
    price: '₹299',
    cadence: 'per month',
    featured: true,
    points: [
      '1,000 credits a month, with rollover',
      'High-quality output, lower credit cost',
      'PNG & WebP, all seven ratios',
      'Up to four variations per prompt',
    ],
    cta: 'Go Pro',
    to: '/pricing',
  },
] as const;
</script>

<template>
  <section id="pricing" class="pricing">
    <div class="pricing__head">
      <p v-reveal class="eyebrow">Pricing</p>
      <h2 v-reveal="{ delay: 0.05 }" class="pricing__title">
        Start free. Upgrade when it earns it.
      </h2>
      <p v-reveal="{ delay: 0.1 }" class="pricing__sub">
        No card to begin. Move to Pro when you want more credits, higher quality, and every format.
      </p>
    </div>

    <div class="pricing__grid">
      <article
        v-for="(plan, i) in plans"
        :key="plan.name"
        v-reveal="{ delay: i * 0.1 }"
        class="plan"
        :class="{ 'plan--featured': plan.featured }"
      >
        <span v-if="plan.featured" class="plan__badge">Most popular</span>
        <h3 class="plan__name">{{ plan.name }}</h3>
        <p class="plan__price">
          {{ plan.price }}<span class="plan__cadence">/ {{ plan.cadence }}</span>
        </p>
        <ul class="plan__points">
          <li v-for="point in plan.points" :key="point" class="plan__point">{{ point }}</li>
        </ul>
        <LandingButton :to="plan.to" :variant="plan.featured ? 'primary' : 'ghost'" size="lg">
          {{ plan.cta }}
        </LandingButton>
      </article>
    </div>

    <p v-reveal class="pricing__foot">
      <router-link to="/pricing" class="pricing__link">Compare every plan detail →</router-link>
    </p>
  </section>
</template>

<style scoped lang="scss">
.pricing {
  position: relative;
  z-index: 1;
  max-width: 70rem;
  margin: 0 auto;
  padding: clamp(4rem, 8vw, 7rem) 1.5rem;
}

.pricing__head {
  max-width: 40rem;
  margin: 0 auto clamp(2.5rem, 5vw, 3.5rem);
  text-align: center;
}
.pricing__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 1rem 0 0;
}
.pricing__sub {
  margin: 1rem 0 0;
  font-size: 1.1rem;
  color: rgb(var(--tw-ink-muted));
}

.pricing__grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;

  @media (min-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.plan {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  padding: 2rem;
  background: #221a14;
  border: 1px solid #2d2319;
  border-radius: 20px;
  position: relative;

  &--featured {
    /* Gold border: rare/precious highlight for the featured card */
    border-color: rgba(201, 168, 76, 0.5);
    box-shadow:
      0 0 32px rgba(201, 168, 76, 0.12),
      0 8px 40px rgba(0, 0, 0, 0.3);
    background: #251d15;
  }
}
.plan__badge {
  position: absolute;
  top: -0.7rem;
  right: 1.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #18120e;
  /* Gold gradient badge to match CTA treatment */
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 100%);
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
}
.plan__name {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: 1.4rem;
  color: rgb(var(--tw-ink-primary));
  margin: 0;
}
.plan__price {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 2.75rem;
  color: rgb(var(--tw-ink-primary));
  margin: 0.75rem 0 0;
  line-height: 1;
}
.plan__cadence {
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 0.95rem;
  color: #6b5e51;
  margin-left: 0.4rem;
}
.plan__points {
  list-style: none;
  margin: 1.75rem 0 2rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}
.plan__point {
  position: relative;
  padding-left: 1.6rem;
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-primary));

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.45em;
    width: 8px;
    height: 5px;
    /* demote-hairline: 1px thin amber, recedes as ambient */
    border-left: 1px solid rgba(201, 138, 90, 0.5);
    border-bottom: 1px solid rgba(201, 138, 90, 0.5);
    transform: rotate(-45deg);
  }
}

.pricing__foot {
  margin: 2.5rem 0 0;
  text-align: center;
}
.pricing__link {
  font-size: 0.95rem;
  font-weight: 600;
  color: #c98a5a;
  text-decoration: none;

  &:hover {
    color: #d9996a;
  }
}
</style>
