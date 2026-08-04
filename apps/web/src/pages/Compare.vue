<script setup lang="ts">
import ComparisonCard from '@/components/Compare/ComparisonCard.vue';
import { UPSCALER_SHOWCASE, getShowcaseEntry } from '@/utils/upscalerShowcase';
import { UPSCALER_MODELS } from '@/utils/models';

/**
 * Map showcase entries to comparison cards
 * Each model gets its corresponding showcase images
 */
const comparisonCards = UPSCALER_SHOWCASE.map((entry) => {
  const model = UPSCALER_MODELS.find((m) => m.id === entry.modelKey);

  if (!model) {
    console.warn(`Model not found for showcase entry: ${entry.modelKey}`);
    return null;
  }

  return {
    model,
    source: entry.source,
    upscaled: entry.upscaled,
  };
}).filter(
  (card): card is { model: (typeof UPSCALER_MODELS)[0]; source: string; upscaled: string } =>
    card !== null,
);
</script>

<template>
  <div class="compare-page">
    <!-- Header -->
    <section class="compare-page__header">
      <div class="compare-page__container">
        <h1 class="compare-page__title">Upscaler Comparison</h1>
        <p class="compare-page__subtitle">
          Explore how different upscaling models handle various image types. Slide each image to
          compare the before and after results.
        </p>
      </div>
    </section>

    <!-- Comparison Grid -->
    <section class="compare-page__content">
      <div class="compare-page__container">
        <div class="compare-page__grid">
          <ComparisonCard
            v-for="(card, idx) in comparisonCards"
            :key="idx"
            :model="card.model"
            :source="card.source"
            :upscaled="card.upscaled"
          />
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="compare-page__footer">
      <div class="compare-page__container">
        <div class="compare-page__footer-content">
          <h2 class="compare-page__footer-title">Ready to upscale?</h2>
          <p class="compare-page__footer-text">
            Choose your favorite upscaler and start creating stunning high-quality images today.
          </p>
          <router-link to="/dashboard" class="compare-page__footer-cta">
            Go to Dashboard
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
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.compare-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0a07 0%, #1a140f 100%);
  color: rgb(var(--tw-ink-primary));
}

.compare-page__container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.compare-page__header {
  padding: 4rem 0;
  text-align: center;
  border-bottom: 1px solid rgba(201, 138, 90, 0.1);
}

.compare-page__title {
  margin: 0 0 1rem 0;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  background: linear-gradient(135deg, #c98a5a 0%, #f5d5b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Source Sans 3', system-ui, sans-serif;
}

.compare-page__subtitle {
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  font-size: 1.125rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-primary) / 0.8);
}

.compare-page__content {
  padding: 4rem 0;
}

.compare-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.compare-page__footer {
  padding: 4rem 0;
  background: rgba(201, 138, 90, 0.05);
  border-top: 1px solid rgba(201, 138, 90, 0.1);
}

.compare-page__footer-content {
  text-align: center;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.compare-page__footer-title {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  font-weight: 700;
  font-family: 'Source Sans 3', system-ui, sans-serif;
}

.compare-page__footer-text {
  margin: 0 0 2rem 0;
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-primary) / 0.8);
}

.compare-page__footer-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #c98a5a 0%, #a0723a 100%);
  color: #1a1410;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: 'Source Sans 3', system-ui, sans-serif;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(201, 138, 90, 0.3);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

@media (max-width: 768px) {
  .compare-page__header {
    padding: 2rem 0;
  }

  .compare-page__title {
    font-size: 2rem;
  }

  .compare-page__subtitle {
    font-size: 1rem;
  }

  .compare-page__content {
    padding: 2rem 0;
  }

  .compare-page__grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .compare-page__footer {
    padding: 2rem 0;
  }

  .compare-page__footer-title {
    font-size: 1.5rem;
  }
}
</style>
