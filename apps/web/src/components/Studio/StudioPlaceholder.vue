<script setup lang="ts">
import { computed } from 'vue';

import StudioShell, { type StudioAccent } from '@/components/Studio/StudioShell.vue';

import { APP_SURFACE } from '@/utils/dashboardRoutes';

const props = defineProps<{ studio: StudioAccent; label: string }>();

const heading = computed(() => `${props.label} studio is coming soon`);
</script>

<template>
  <StudioShell :studio="studio">
    <div
      data-testid="studio-placeholder"
      class="tw-flex tw-flex-col tw-items-start tw-gap-4 tw-border-l-2 tw-border-studio-accent tw-py-2 tw-pl-5"
    >
      <h1 class="tw-font-display tw-text-display-md tw-text-ink-primary">
        {{ heading }}
      </h1>
      <p class="tw-max-w-prose tw-text-body-base tw-text-ink-muted">
        We are still building this part of the studio. Nothing here costs credits yet, and your
        image tools keep working as usual.
      </p>
      <router-link
        :to="{ name: APP_SURFACE.CREATE }"
        data-testid="studio-placeholder-back"
        class="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-chip tw-border tw-border-border tw-bg-surface-2 tw-px-4 tw-text-sm tw-font-medium tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-surface-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
      >
        Back to Image
      </router-link>
    </div>
  </StudioShell>
</template>
