<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import NotFoundFrame from '@/components/NotFound/NotFoundFrame.vue';
import { usePageSeo } from '@/composables/usePageSeo';

interface NextStop {
  to: string;
  label: string;
}

const NEXT_STOPS: NextStop[] = [
  { to: '/gallery', label: 'Browse the gallery' },
  { to: '/examples', label: 'See examples' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact us' },
];

const route = useRoute();
const requestedPath = computed(() => route.path);

// Soft 404 in a SPA: keep it out of the index, and point canonical at home so the
// bogus URL never becomes its own canonical.
usePageSeo({
  title: 'Page not found – Visual AI',
  description:
    'This page does not exist. Head back to Visual AI to generate, upscale or restore images.',
  path: '/',
  robots: 'noindex, follow',
});
</script>

<template>
  <main class="tw-mx-auto tw-w-full tw-max-w-[1100px] tw-px-6 tw-py-12 md:tw-py-20">
    <div class="tw-grid tw-items-center tw-gap-12 md:tw-grid-cols-[1.1fr_0.9fr] md:tw-gap-16">
      <section class="tw-order-2 md:tw-order-1">
        <p class="eyebrow tw-mb-4">Error 404</p>
        <h1 class="tw-m-0 tw-font-display tw-text-display-xl tw-text-ink">
          Nothing rendered here.
        </h1>
        <p class="tw-mt-5 tw-max-w-prose tw-text-body-lg tw-text-ink-muted">
          The page you asked for isn't in the studio. It may have moved, or the link is off by a
          character. Your work is untouched.
        </p>

        <div class="tw-mt-8 tw-flex tw-flex-wrap tw-gap-3">
          <router-link
            to="/create"
            class="cta cta--primary tw-font-body tw-text-body-base tw-font-semibold"
          >
            Open the studio
          </router-link>
          <router-link
            to="/"
            class="cta cta--ghost tw-font-body tw-text-body-base tw-font-semibold"
          >
            Back home
          </router-link>
        </div>

        <nav class="tw-mt-10" aria-label="Other places to go">
          <ul class="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-p-0">
            <li v-for="stop in NEXT_STOPS" :key="stop.to">
              <router-link
                :to="stop.to"
                class="tw-text-body-sm tw-text-ink-muted tw-underline tw-decoration-hairline tw-underline-offset-4 hover:tw-text-ink"
              >
                {{ stop.label }}
              </router-link>
            </li>
          </ul>
        </nav>
      </section>

      <div class="tw-order-1 tw-flex tw-justify-center md:tw-order-2 md:tw-justify-end">
        <NotFoundFrame :requested-path="requestedPath" />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.cta {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 1.5rem;
  border-radius: 0.375rem;
  text-decoration: none;
  transition:
    background-color 300ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 300ms cubic-bezier(0.16, 1, 0.3, 1);

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 3px;
  }

  &--primary {
    background: #c98a5a;
    color: #1c140e;
    border: 1px solid #c98a5a;

    &:hover {
      background: #d9996a;
    }
  }

  &--ghost {
    color: rgb(var(--tw-ink));
    border: 1px solid rgb(var(--tw-border));

    &:hover {
      border-color: rgb(var(--tw-accent));
    }
  }
}
</style>
