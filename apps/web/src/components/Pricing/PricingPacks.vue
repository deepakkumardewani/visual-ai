<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';

import { useRouter } from 'vue-router';

import LandingButton from '@/components/Landing/LandingButton.vue';
import { usePricingCatalog } from '@/composables/usePricingCatalog';
import { usePurchase } from '@/payments/usePurchase';
import { useUserStore } from '@/stores/user';
import type { CreditPack } from '@visual-ai/shared';

defineProps<{
  packs: CreditPack[];
}>();

const router = useRouter();
const userStore = useUserStore();
const { start } = usePurchase();
const { formatPackPrice, formatPackPer100Credits, packSavingsPercent, loadPrices } =
  usePricingCatalog();
const buyingId = shallowRef<string | null>(null);

onMounted(loadPrices);

function savingsLabel(pack: CreditPack) {
  const percent = packSavingsPercent(pack);
  return percent > 0 ? `${percent}%` : undefined;
}

async function buyPack(pack: CreditPack) {
  if (!userStore.userDetails) {
    void router.push({ name: 'signin', query: { redirect: '/pricing' } });
    return;
  }

  buyingId.value = pack.id;
  try {
    await start(pack.id);
  } finally {
    buyingId.value = null;
  }
}
</script>

<template>
  <section id="packs" class="packs" aria-labelledby="packs-title">
    <div class="packs__intro">
      <p class="eyebrow">Top up</p>
      <h2 id="packs-title" class="packs__title">Top up any plan</h2>
      <p class="packs__lede">
        Free or Pro, packs add credits on top of your daily allowance. Larger packs offer better
        value, apply as soon as payment clears, and never expire.
      </p>
    </div>

    <div class="packs__grid">
      <article
        v-for="pack in packs"
        :key="pack.id"
        class="pack"
        :class="{ 'pack--popular': pack.popular }"
        :aria-label="
          pack.popular ? `${pack.credits.toLocaleString()} credits, most popular` : undefined
        "
        :data-testid="`pack-${pack.id}`"
      >
        <div class="pack__tags">
          <p v-if="pack.popular" class="pack__popular">Most popular</p>
          <p v-if="savingsLabel(pack)" class="pack__save">Save {{ savingsLabel(pack) }}</p>
        </div>
        <h3 class="pack__credits">{{ pack.credits.toLocaleString() }} credits</h3>
        <p class="pack__price">{{ formatPackPrice(pack) }}</p>
        <p class="pack__unit">{{ formatPackPer100Credits(pack) }} per 100 credits</p>
        <LandingButton
          class="pack__cta"
          :variant="pack.popular ? 'primary' : 'ghost'"
          size="md"
          type="button"
          :disabled="buyingId === pack.id"
          @click="buyPack(pack)"
        >
          {{ buyingId === pack.id ? 'Opening checkout…' : 'Buy this pack' }}
        </LandingButton>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.packs {
  padding: clamp(2rem, 4vw, 3rem) 0 0;
}

.packs__intro {
  max-width: 36rem;
  margin-bottom: clamp(2rem, 4vw, 3rem);
}

.packs__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 0.75rem 0 0;
}

.packs__lede {
  margin: 1rem 0 0;
  max-width: 48ch;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-secondary));
}

.packs__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1100px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: stretch;
  }
}

.pack {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 1.5rem 1.5rem 1.35rem;
  background: rgb(var(--tw-surface-2));
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 1.15rem;
}

/* The one pack we steer people to: raised surface, accent hairline, the only filled CTA. */
.pack--popular {
  border-color: color-mix(in oklab, rgb(var(--tw-accent)) 55%, rgb(var(--tw-hairline)));
  background: rgb(var(--tw-surface-3));
  box-shadow: 0 0 0 1px color-mix(in oklab, rgb(var(--tw-accent)) 18%, transparent);

  @media (min-width: 1100px) {
    transform: translateY(-0.5rem);
  }
}

.pack__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.5rem;
  margin-bottom: 0.5rem;
}

.pack__popular,
.pack__save {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
}

.pack__popular {
  color: rgb(var(--tw-canvas));
  background: rgb(var(--tw-accent));
}

.pack__save {
  color: rgb(var(--tw-ink-secondary));
  border: 1px solid rgb(var(--tw-hairline));
}

.pack__credits {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: 1.45rem;
  color: rgb(var(--tw-ink-primary));
}

.pack__price {
  margin: 0.35rem 0 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.pack__unit {
  margin: 0.2rem 0 1.15rem;
  font-size: 0.85rem;
  color: rgb(var(--tw-ink-muted));
}

.pack__cta {
  margin-top: auto;
  width: 100%;
}
</style>
