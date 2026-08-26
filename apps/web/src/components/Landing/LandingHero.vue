<script setup lang="ts">
import { gsap } from 'gsap';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

import { scrollToSection } from '@/composables/useLenis';
import { useReducedMotion } from '@/composables/useReducedMotion';

import LandingButton from '@/components/Landing/LandingButton.vue';

import { SHOWCASE, STATS } from '@/utils/landing';

const HEADLINE_WORDS = ['One', 'studio', 'for', 'every', 'image', 'you', 'still', 'need.'];
const feature = SHOWCASE[0];
const reduced = useReducedMotion();
const root = ref<HTMLElement | null>(null);
const visual = ref<HTMLElement | null>(null);
const auth = useAuthStore();
let ctx: gsap.Context | null = null;

onMounted(() => {
  if (reduced.value || !root.value) return;

  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero__eyebrow', { opacity: 0, y: 16, duration: 0.6 })
      .from('.hero__word', { yPercent: 115, opacity: 0, duration: 0.85, stagger: 0.07 }, '-=0.25')
      .from('.hero__sub', { opacity: 0, y: 20, duration: 0.6 }, '-=0.45')
      .from('.hero__cta', { opacity: 0, y: 18, duration: 0.55, stagger: 0.1 }, '-=0.35')
      .from('.hero__stat', { opacity: 0, y: 18, duration: 0.5, stagger: 0.08 }, '-=0.3')
      .from('.hero__visual', { opacity: 0, y: 48, scale: 0.96, duration: 1.1 }, '-=1');

    if (visual.value) {
      gsap.to(visual.value, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  }, root.value);
});

onBeforeUnmount(() => ctx?.revert());
</script>

<template>
  <section ref="root" class="hero" aria-labelledby="hero-title">
    <div class="hero__text">
      <p class="hero__eyebrow"><span class="hero__dot"></span> Image Studio</p>

      <h1 id="hero-title" class="hero__title">
        <span v-for="(word, i) in HEADLINE_WORDS" :key="i" class="hero__line">
          <span class="hero__word">{{ word }}</span>
        </span>
      </h1>

      <p class="hero__sub">
        Generate from a prompt, then upscale to 4K, colorize, restore, or cut the background —
        without switching apps.
      </p>

      <div class="hero__ctas">
        <LandingButton class="hero__cta" :to="auth.isSignedIn ? '/create' : '/signin'" size="lg">
          {{ auth.isSignedIn ? 'Open studio' : 'Start free' }}
        </LandingButton>
        <LandingButton
          class="hero__cta"
          variant="ghost"
          size="lg"
          href="#showcase"
          @click.prevent="scrollToSection('#showcase')"
        >
          See the work
        </LandingButton>
      </div>

      <dl class="hero__stats">
        <div v-for="stat in STATS" :key="stat.label" class="hero__stat">
          <dt class="hero__stat-value">{{ stat.value }}</dt>
          <dd class="hero__stat-label">{{ stat.label }}</dd>
        </div>
      </dl>
    </div>

    <div class="hero__visual-wrap">
      <figure ref="visual" class="hero__visual">
        <img :src="feature.url" :alt="feature.prompt" class="hero__img" fetchpriority="high" />
        <figcaption class="hero__prompt">
          <span class="hero__prompt-label">Prompt</span>
          {{ feature.prompt }}
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: clamp(5.5rem, 8vw, 7rem) 1.5rem clamp(3rem, 5vw, 4rem);
  display: grid;
  gap: clamp(2.5rem, 5vw, 4rem);
  align-items: center;

  @media (min-width: 980px) {
    grid-template-columns: 1.05fr 0.95fr;
  }
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-muted));
  margin-bottom: 1.5rem;
}
.hero__dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: #c98a5a;
  box-shadow: 0 0 0 4px rgba(201, 138, 90, 0.18);
}

.hero__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2.75rem, 6vw, 4.5rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  /* Solid gold — precious, rare, luminous on near-black. No gradient text (design ban). */
  color: #c9a84c;
  margin: 0;
}
.hero__line {
  display: inline-flex;
  overflow: hidden;
  vertical-align: bottom;
  margin-right: 0.26em;
  padding-bottom: 0.08em;
}
.hero__word {
  display: inline-block;
}

.hero__sub {
  margin: 1.75rem 0 0;
  max-width: 34rem;
  font-size: clamp(1.05rem, 1.6vw, 1.25rem);
  line-height: 1.65;
  color: rgb(var(--tw-ink-muted));
}

.hero__ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2.25rem;
}

.hero__stats {
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 1.5rem 2.5rem;
  margin: 2.25rem 0 0;
  padding-top: 1.5rem;
  border-top: 1px solid #2d2319;

  @media (min-width: 560px) {
    grid-template-columns: repeat(3, auto);
  }
}
.hero__stat-value {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.6rem;
  color: rgb(var(--tw-ink-primary));
  line-height: 1.1;
}
.hero__stat-label {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: rgb(var(--tw-ink-muted));
}

.hero__visual-wrap {
  perspective: 1200px;
}
.hero__visual {
  position: relative;
  margin: 0 auto;
  max-width: 32rem;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #3a2e22;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  transform: rotateY(-4deg) rotateX(2deg);
  transform-style: preserve-3d;
}
.hero__img {
  display: block;
  width: 100%;
  height: auto;
  /* 3:4 capped to the viewport so the card and the stats row resolve inside the fold */
  aspect-ratio: 3 / 4;
  max-height: min(68vh, 38rem);
  object-fit: cover;
}
.hero__prompt {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  padding: 0.85rem 1rem;
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-primary));
  background: rgba(24, 18, 14, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(240, 232, 220, 0.12);
  border-radius: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hero__prompt-label {
  display: block;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #c98a5a;
  margin-bottom: 0.2rem;
}

@media (min-width: 980px) {
  .hero__visual {
    transform: rotateY(-7deg) rotateX(3deg);
  }
}
</style>
