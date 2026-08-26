<script setup lang="ts">
import { computed, shallowRef } from 'vue';

import { useRouter } from 'vue-router';

import LandingButton from '@/components/Landing/LandingButton.vue';
import { useUserStore } from '@/stores/user';
import type { RazorpayProduct } from '@/types';
import { initiatePayment } from '@/utils/payment';

const props = defineProps<{
  packs: RazorpayProduct[];
}>();

const router = useRouter();
const userStore = useUserStore();
const buyingId = shallowRef<number | null>(null);

const featuredId = computed(() => {
  return props.packs.reduce((best, pack) => {
    const savings = Number.parseFloat(pack.savings?.replace('%', '') || '0');
    const bestSavings = Number.parseFloat(best.savings?.replace('%', '') || '0');
    return savings > bestSavings ? pack : best;
  }, props.packs[0]).id;
});

const orderedPacks = computed(() => {
  return [...props.packs].sort((a, b) => {
    if (a.id === featuredId.value) return -1;
    if (b.id === featuredId.value) return 1;
    return 0;
  });
});

function perCredit(pack: RazorpayProduct) {
  return (pack.price / pack.credits).toFixed(2);
}

async function buyPack(pack: RazorpayProduct) {
  if (!userStore.userDetails) {
    void router.push({ name: 'signin', query: { redirect: '/pricing' } });
    return;
  }

  buyingId.value = pack.id;
  try {
    await initiatePayment(pack);
  } finally {
    buyingId.value = null;
  }
}
</script>

<template>
  <section id="packs" class="packs" aria-labelledby="packs-title">
    <div class="packs__intro">
      <p class="eyebrow">Top up</p>
      <h2 id="packs-title" class="packs__title">Buy Credits</h2>
      <p class="packs__lede">
        Larger packs offer better value. Purchased credits apply as soon as payment clears, and they
        never expire.
      </p>
    </div>

    <div class="packs__grid">
      <article
        v-for="pack in orderedPacks"
        :key="pack.id"
        class="pack"
        :class="{ 'pack--featured': pack.id === featuredId }"
      >
        <p v-if="pack.savings" class="pack__save">Save {{ pack.savings }}</p>
        <h3 class="pack__credits">{{ pack.credits }} credits</h3>
        <p class="pack__price">₹{{ pack.price }}</p>
        <p class="pack__unit">₹{{ perCredit(pack) }} per credit</p>
        <LandingButton
          class="pack__cta"
          :variant="pack.id === featuredId ? 'primary' : 'ghost'"
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
  padding: clamp(3.5rem, 7vw, 5.5rem) 0 0;
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
    grid-template-columns: 1.15fr repeat(3, minmax(0, 1fr));
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

.pack--featured {
  border-color: color-mix(in oklab, rgb(var(--tw-accent)) 45%, rgb(var(--tw-hairline)));
  background: rgb(var(--tw-surface-3));

  @media (min-width: 1100px) {
    padding: 2rem 1.75rem 1.6rem;
  }
}

.pack__save {
  margin: 0 0 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--tw-canvas));
  background: rgb(var(--tw-accent));
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
}

.pack__credits {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: 1.45rem;
  color: rgb(var(--tw-ink-primary));
}

.pack--featured .pack__credits {
  font-size: 1.85rem;
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
