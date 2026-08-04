<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import BeforeAfter from '@/components/Landing/BeforeAfter.vue';
import type { Model } from '@/types/model';
import { getProviderDisplayName } from '@/utils/models';

interface Props {
  model: Model;
  source: string;
  upscaled: string;
}

const props = defineProps<Props>();
const router = useRouter();

const displayedProvider = computed(() => getProviderDisplayName(props.model.provider));

/**
 * Deep-link to the dashboard with this model preselected
 */
const handleSelectModel = () => {
  router.push({
    name: 'dashboard',
    query: { tool: 'upscale', model: props.model.id },
  });
};
</script>

<template>
  <div class="comparison-card">
    <!-- Header -->
    <div class="comparison-card__header">
      <div class="comparison-card__info">
        <h3 class="comparison-card__title">{{ model.title }}</h3>
        <p class="comparison-card__provider">{{ displayedProvider }}</p>
      </div>

      <!-- Tier badge -->
      <div class="comparison-card__badge" :data-tier="model.tier">
        {{ model.tier }}
      </div>
    </div>

    <!-- Description -->
    <p class="comparison-card__description">{{ model.description }}</p>

    <!-- Best at -->
    <p v-if="model.bestAt" class="comparison-card__best-at">
      <span class="comparison-card__best-at-label">Best at:</span>
      {{ model.bestAt }}
    </p>

    <!-- Before/After slider -->
    <div class="comparison-card__slider">
      <BeforeAfter
        :before="source"
        :after="upscaled"
        :before-label="`Original`"
        :after-label="`Upscaled (${model.title})`"
      />
    </div>

    <!-- CTA -->
    <button class="comparison-card__cta" @click="handleSelectModel">
      <span>Try {{ model.title }}</span>
      <svg
        class="comparison-card__cta-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>

<style scoped lang="scss">
.comparison-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1410 0%, #2d2318 100%);
  border: 1px solid rgba(201, 138, 90, 0.2);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(201, 138, 90, 0.4);
    box-shadow: 0 8px 32px rgba(201, 138, 90, 0.1);
  }
}

.comparison-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.comparison-card__info {
  flex: 1;
}

.comparison-card__title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
  font-family: 'Source Sans 3', system-ui, sans-serif;
}

.comparison-card__provider {
  margin: 0;
  font-size: 0.875rem;
  color: #c98a5a;
  font-weight: 500;
}

.comparison-card__badge {
  padding: 0.375rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 9999px;
  white-space: nowrap;

  &[data-tier='budget'] {
    background: rgba(76, 175, 80, 0.2);
    color: #7cb342;
  }

  &[data-tier='standard'] {
    background: rgba(33, 150, 243, 0.2);
    color: #42a5f5;
  }

  &[data-tier='premium'] {
    background: rgba(255, 193, 7, 0.2);
    color: #ffa726;
  }
}

.comparison-card__description {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-primary) / 0.9);
}

.comparison-card__best-at {
  margin: 0;
  font-size: 0.875rem;
  color: rgb(var(--tw-ink-primary) / 0.75);
  font-style: italic;
}

.comparison-card__best-at-label {
  color: #c98a5a;
  font-weight: 600;
  font-style: normal;
}

.comparison-card__slider {
  min-height: 400px;
  overflow: hidden;
  border-radius: 12px;
}

.comparison-card__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #c98a5a 0%, #a0723a 100%);
  color: #1a1410;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Source Sans 3', system-ui, sans-serif;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(201, 138, 90, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.comparison-card__cta-icon {
  width: 1.25rem;
  height: 1.25rem;
}

@media (max-width: 640px) {
  .comparison-card {
    padding: 1.5rem;
    gap: 1rem;
  }

  .comparison-card__title {
    font-size: 1.25rem;
  }

  .comparison-card__header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .comparison-card__slider {
    min-height: 280px;
  }
}
</style>
