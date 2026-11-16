<script setup lang="ts">
import { CREDIT_PACKS, DAILY_CREDITS, SIGNUP_CREDITS } from '@visual-ai/shared';
import { computed, onMounted, ref } from 'vue';

import LandingButton from '@/components/Landing/LandingButton.vue';
import RollingNumber from '@/components/LandingV2/RollingNumber.vue';
import { usePricingCatalog } from '@/composables/usePricingCatalog';
import { usePrimaryCta } from '@/components/LandingV2/composables/usePrimaryCta';

const primaryCta = usePrimaryCta();
const { formatPackPrice, loadPrices } = usePricingCatalog();

const cheapestPack = CREDIT_PACKS.reduce((lowest, pack) =>
  pack.priceMinor < lowest.priceMinor ? pack : lowest,
);
const fromPrice = computed(() => formatPackPrice(cheapestPack));
const bestSavingPercent = Math.max(...CREDIT_PACKS.map((pack) => pack.savingsPercent));

const root = ref<HTMLElement | null>(null);

// Same read-only GET /payments/prices the /pricing page makes. The price stays hidden (space
// reserved) until it settles so the currency never flips on screen; the composable logs a failure
// and the formatted fallback is shown.
const priceResolved = ref(false);
onMounted(async () => {
  try {
    await loadPrices();
  } finally {
    priceResolved.value = true;
  }
});
</script>

<template>
  <section id="pricing" ref="root" class="pricing lv2-section" aria-labelledby="pricing-title">
    <div class="lv2-container pricing__inner">
      <header class="pricing__head">
        <p class="lv2-eyebrow">Pricing</p>
        <h2 id="pricing-title" class="lv2-display">Free to start. Credits when you need more.</h2>
      </header>

      <div class="pricing__columns">
        <div class="col col--free">
          <h3 class="col__name">Free</h3>
          <p class="col__figure col__figure--gold">
            <RollingNumber :value="SIGNUP_CREDITS" />
          </p>
          <p class="col__caption">persistent credits when you sign up</p>
          <p class="col__figure col__figure--small">
            <RollingNumber :value="DAILY_CREDITS.free" />
          </p>
          <p class="col__caption">daily credits, reset if unused</p>
          <LandingButton :to="primaryCta.to.value" size="lg">
            {{ primaryCta.label.value }}
          </LandingButton>
        </div>

        <div class="col col--buy">
          <h3 class="col__name">Buy credits</h3>
          <p class="col__figure">
            <RollingNumber :value="bestSavingPercent" /><span class="col__unit" aria-hidden="true"
              >%</span
            ><span class="sr-only">%</span>
          </p>
          <p class="col__caption">most you save, on the larger packs</p>
          <p class="col__line">
            Packs start at
            <strong class="col__strong" :class="{ 'col__strong--pending': !priceResolved }">{{
              fromPrice
            }}</strong>
            for {{ cheapestPack.credits }} credits.
          </p>
          <LandingButton to="/pricing#packs" variant="ghost" size="lg"
            >See credit packs</LandingButton
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pricing__inner {
  display: grid;
  gap: var(--lv2-space-4xl);
}

.pricing__head {
  display: grid;
  gap: var(--lv2-space-lg);
  max-width: 40rem;
}

.pricing__columns {
  display: grid;
  gap: var(--lv2-space-4xl);
}

.col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--lv2-space-sm);
}

.col__name {
  margin: 0 0 var(--lv2-space-md);
  color: var(--lv2-copper-text);
  font-size: var(--lv2-text-label);
  font-weight: 600;
  letter-spacing: var(--lv2-tracking-label);
  text-transform: uppercase;
}

.col__figure {
  margin: 0;
  font-family: var(--lv2-font-display);
  font-size: clamp(5rem, 3rem + 10vw, 11rem);
  line-height: 1;
  letter-spacing: var(--lv2-tracking-display);
}

/* The one solid-gold moment in this scene. */
.col__figure--gold {
  color: var(--lv2-gold);
}

.col__caption {
  margin: 0 0 var(--lv2-space-lg);
  color: rgb(var(--tw-ink-muted));
  font-size: var(--lv2-text-lede);
}

.col__figure--small {
  font-size: clamp(3.5rem, 2rem + 6vw, 6.5rem);
}

.col__unit {
  font-size: 0.5em;
  vertical-align: top;
  margin-left: 0.08em;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.col__line {
  margin: 0 0 var(--lv2-space-lg);
  max-width: 24ch;
  text-wrap: balance;
  font-family: var(--lv2-font-display);
  font-size: var(--lv2-text-title);
  line-height: 1.2;
  color: rgb(var(--tw-ink-secondary));
}

.col__strong {
  font-weight: 400;
  color: rgb(var(--tw-ink-primary));
  transition: opacity 0.4s var(--lv2-ease-out);
}

/* Space stays reserved; the figure fades in once the localized price has resolved. */
.col__strong--pending {
  opacity: 0;
}

@media (min-width: 900px) {
  .pricing__columns {
    grid-template-columns: 1.4fr 1fr;
    align-items: start;
  }
}
</style>
