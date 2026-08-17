<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { FeatureType } from '@/types';
import type { Model } from '@/types/model';

import BeforeAfter from '@/components/Landing/BeforeAfter.vue';
import { APP_SURFACE } from '@/utils/dashboardRoutes';
import { getProviderDisplayName } from '@/utils/models';

interface Props {
  model: Model;
  source: string;
  upscaled: string;
}

const props = defineProps<Props>();
const router = useRouter();

const displayedProvider = computed(() => getProviderDisplayName(props.model.provider));

/** Hide provider when it just repeats the model title (e.g. "Pruna" / "Pruna"). */
const showProvider = computed(() => {
  return displayedProvider.value.toLowerCase() !== props.model.title.toLowerCase();
});

function handleSelectModel() {
  router.push({
    name: APP_SURFACE.CREATE,
    params: { feature: FeatureType.UPSCALE },
    query: { model: props.model.id },
  });
}
</script>

<template>
  <article class="comparison-card">
    <!-- Media first: photos are the hero; tops align naturally across the grid -->
    <div class="comparison-card__media">
      <BeforeAfter
        fill
        :before="source"
        :after="upscaled"
        before-label="Original"
        :after-label="model.title"
      />
    </div>

    <div class="comparison-card__body">
      <header class="comparison-card__meta">
        <div class="comparison-card__heading">
          <div class="comparison-card__title-row">
            <h3 class="comparison-card__title">{{ model.title }}</h3>
            <span class="comparison-card__badge" :data-tier="model.tier">{{ model.tier }}</span>
          </div>
          <p v-if="showProvider" class="comparison-card__provider">{{ displayedProvider }}</p>
        </div>
        <p class="comparison-card__description">{{ model.description }}</p>
      </header>

      <button type="button" class="comparison-card__cta" @click="handleSelectModel">
        Try {{ model.title }}
        <svg
          class="comparison-card__cta-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.comparison-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: rgb(var(--tw-surface-1));
  border: 1px solid rgb(var(--tw-hairline) / 0.9);
  border-radius: 12px;
}

/* Full-bleed hero — no chrome padding around the comparison */
.comparison-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  flex-shrink: 0;
  overflow: hidden;
  background: rgb(var(--tw-canvas));
}

.comparison-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1.25rem;
  padding: 1.25rem 1.25rem 1.25rem;
}

/* Tight cluster: title → provider → description */
.comparison-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comparison-card__heading {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.comparison-card__title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.comparison-card__title {
  margin: 0;
  min-width: 0;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: rgb(var(--tw-ink-primary));
}

.comparison-card__provider {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgb(var(--tw-accent));
}

.comparison-card__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 4px;
  border: 1px solid transparent;

  /* Warm palette only — no green/blue SaaS chips */
  &[data-tier='budget'] {
    color: rgb(var(--tw-ink-muted));
    border-color: rgb(var(--tw-hairline));
    background: transparent;
  }

  &[data-tier='standard'] {
    color: rgb(var(--tw-accent));
    border-color: rgb(var(--tw-accent) / 0.35);
    background: rgb(var(--tw-accent) / 0.08);
  }

  &[data-tier='premium'] {
    color: rgb(201 168 76);
    border-color: rgb(201 168 76 / 0.4);
    background: rgb(201 168 76 / 0.1);
  }
}

.comparison-card__description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: rgb(var(--tw-ink-muted));
}

.comparison-card__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: auto;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: rgb(var(--tw-accent));
  color: rgb(var(--tw-canvas));
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 150ms ease,
    transform 150ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: rgb(217 153 106);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 3px;
  }
}

.comparison-card__cta-icon {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 640px) {
  .comparison-card__body {
    padding: 1rem;
    gap: 1rem;
  }

  .comparison-card__media {
    aspect-ratio: 4 / 3;
  }
}
</style>
