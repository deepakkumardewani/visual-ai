<script setup lang="ts">
import { useRouter } from 'vue-router';

import { FeatureType } from '@/types';

import { useAsideStore } from '@/stores/aside';

import { createFeatureLocation } from '@/utils/dashboardRoutes';

interface StarterPrompt {
  id: string;
  label: string;
  style: string;
  prompt: string;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'morning-still',
    label: 'Quiet morning',
    style: 'Still life',
    prompt:
      'Soft morning light through linen curtains on a wooden table, ceramic cup and folded newspaper, warm documentary photograph',
  },
  {
    id: 'workshop',
    label: 'Workshop hands',
    style: 'Portrait',
    prompt:
      'Elderly craftsman in a sunlit wood workshop, dust in the air, gentle film portrait, shallow depth of field',
  },
  {
    id: 'coast-dusk',
    label: 'Coast at dusk',
    style: 'Landscape',
    prompt:
      'Misty coastal footpath at dusk, muted sea and heather, painterly atmosphere, restrained color palette',
  },
  {
    id: 'vessel',
    label: 'Ceramic vessel',
    style: 'Object study',
    prompt:
      'Hand-thrown ceramic vessel on a stone ledge, museum lighting, quiet negative space, archival photograph',
  },
  {
    id: 'botanical',
    label: 'Wildflower study',
    style: 'Botanical',
    prompt:
      'Vintage botanical study of wildflowers pressed on cream paper, delicate watercolor texture, scientific illustration',
  },
  {
    id: 'noir-alley',
    label: 'Rain alley',
    style: 'Noir',
    prompt:
      'Rain-slicked city alley with soft neon reflections, noir mood, cinematic grain, night photography',
  },
];

const router = useRouter();
const asideStore = useAsideStore();

function applyStarter(item: StarterPrompt) {
  void router.push(createFeatureLocation(FeatureType.IMAGE));
  asideStore.typingPrompt = item.prompt;
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="composer-textarea-input"]',
    );
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  });
}
</script>

<template>
  <section
    data-testid="starter-prompts-grid"
    aria-label="Starter prompts"
    class="starter-grid tw-w-full tw-px-4 tw-pb-12 tw-pt-6 sm:tw-px-6"
  >
    <header class="tw-mb-8 tw-max-w-xl tw-text-left">
      <h2 class="tw-font-display tw-text-display-md tw-text-ink">Your creations</h2>
      <p class="tw-mt-2 tw-text-sm tw-leading-relaxed tw-text-ink-muted">
        Begin with a quiet prompt. One click fills the bar — edit freely, then generate.
      </p>
    </header>

    <ul class="starter-list" role="list">
      <li v-for="item in STARTER_PROMPTS" :key="item.id">
        <button
          type="button"
          class="starter-card"
          :data-testid="`starter-prompt-${item.id}`"
          :aria-label="`Use starter prompt: ${item.label}`"
          @click="applyStarter(item)"
        >
          <span class="starter-card__style">{{ item.style }}</span>
          <span class="starter-card__label">{{ item.label }}</span>
          <span class="starter-card__prompt">{{ item.prompt }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.starter-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.starter-card {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 1rem 1.1rem 1.15rem;
  text-align: left;
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--tw-hairline) / 0.8);
  background: rgb(var(--tw-surface-1) / 0.55);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: rgb(201 138 90 / 0.4);
    background: rgb(var(--tw-surface-2) / 0.7);
  }

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: no-preference) {
    &:hover {
      transform: translateY(-1px);
    }
  }
}

.starter-card__style {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c98a5a;
}

.starter-card__label {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: rgb(var(--tw-ink));
}

.starter-card__prompt {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: rgb(var(--tw-ink-muted));
}
</style>
