<script setup lang="ts">
import ComparisonCard from '@/components/Compare/ComparisonCard.vue';
import LandingFooter from '@/components/Landing/LandingFooter.vue';
import { FeatureType } from '@/types';
import { APP_SURFACE } from '@/utils/dashboardRoutes';
import { usePageSeo } from '@/composables/usePageSeo';
import { UPSCALER_SHOWCASE } from '@/utils/upscalerShowcase';
import { UPSCALER_MODELS } from '@/utils/models';
import { itemListJsonLd } from '@/utils/seo';

const comparisonCards = UPSCALER_SHOWCASE.map((entry) => {
  const model = UPSCALER_MODELS.find((m) => m.id === entry.modelKey);
  if (!model) return null;
  return {
    model,
    source: entry.source,
    upscaled: entry.upscaled,
  };
}).filter(
  (card): card is { model: (typeof UPSCALER_MODELS)[0]; source: string; upscaled: string } =>
    card !== null,
);

const createUpscaleTo = {
  name: APP_SURFACE.CREATE,
  params: { feature: FeatureType.UPSCALE },
};

usePageSeo({
  title: 'Compare upscale models – Visual AI',
  description:
    'Side-by-side before and after samples for Visual AI upscalers. Drag the slider to compare models, then upscale your own image with credits.',
  path: '/compare',
  jsonLd: itemListJsonLd({
    name: 'Visual AI upscale models',
    description: 'Compare Visual AI upscalers with before-and-after samples.',
    items: comparisonCards.map((card) => ({
      name: card.model.title,
      path: '/compare',
      description: card.model.description,
    })),
  }),
});
</script>

<template>
  <div class="compare-page">
    <section class="compare-page__header">
      <div class="compare-page__container">
        <h1 class="compare-page__title">Compare upscale models</h1>
        <p class="compare-page__subtitle">
          Each card shows a different sample. Drag the slider to compare the original with that
          model's upscale.
        </p>
      </div>
    </section>

    <section class="compare-page__content">
      <div class="compare-page__container">
        <div class="compare-page__grid">
          <ComparisonCard
            v-for="card in comparisonCards"
            :key="card.model.id"
            :model="card.model"
            :source="card.source"
            :upscaled="card.upscaled"
          />
        </div>
      </div>
    </section>

    <section class="compare-page__footer">
      <div class="compare-page__container compare-page__footer-inner">
        <div class="compare-page__footer-copy">
          <h2 class="compare-page__footer-title">Try it on your image</h2>
          <p class="compare-page__footer-text">
            Open the upscaler, pick a model, and upload a file.
          </p>
        </div>
        <router-link :to="createUpscaleTo" class="compare-page__footer-cta">
          Open upscaler
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </section>
  </div>
  <LandingFooter />
</template>

<style scoped lang="scss">
.compare-page {
  min-height: 100vh;
  background: rgb(var(--tw-canvas));
  color: rgb(var(--tw-ink-primary));
}

.compare-page__container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 3vw, 2rem);
}

/* Editorial intro — left-aligned, airy */
.compare-page__header {
  padding: clamp(2.5rem, 6vw, 4.5rem) 0 clamp(2rem, 4vw, 3rem);
}

.compare-page__title {
  margin: 0 0 0.75rem;
  max-width: 20ch;
  font-family: 'Young Serif', Georgia, serif;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: rgb(var(--tw-ink-primary));
}

.compare-page__subtitle {
  margin: 0;
  max-width: 36rem;
  font-size: 1.0625rem;
  line-height: 1.55;
  color: rgb(var(--tw-ink-muted));
}

.compare-page__content {
  padding: 0 0 clamp(3rem, 6vw, 5rem);
}

/* Generous separation between cards; stretch so CTAs align when meta wraps */
.compare-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1.25rem, 2.5vw, 2rem);
  align-items: stretch;
}

.compare-page__footer {
  padding: clamp(2.5rem, 5vw, 4rem) 0;
  border-top: 1px solid rgb(var(--tw-hairline) / 0.7);
}

.compare-page__footer-inner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem 2.5rem;
  flex-wrap: wrap;
}

.compare-page__footer-copy {
  max-width: 28rem;
}

.compare-page__footer-title {
  margin: 0 0 0.4rem;
  font-family: 'Young Serif', Georgia, serif;
  font-size: clamp(1.25rem, 2.5vw, 1.625rem);
  font-weight: 400;
  line-height: 1.25;
}

.compare-page__footer-text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-muted));
}

.compare-page__footer-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.75rem 1.25rem;
  background: rgb(var(--tw-accent));
  color: rgb(var(--tw-canvas));
  border-radius: 8px;
  text-decoration: none;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  transition: background 150ms ease;

  &:hover {
    background: rgb(217 153 106);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
}

@media (max-width: 860px) {
  .compare-page__grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .compare-page__footer-inner {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
