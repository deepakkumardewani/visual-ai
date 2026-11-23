<script setup lang="ts">
/**
 * Two-column studio layout: compose column (up to ~560 px) and a sticky result column on
 * desktop, a single column on mobile. `studio` scopes the `--studio-accent` token pair.
 */
export type StudioAccent = 'video' | 'song' | 'music' | 'speech' | 'tools';

defineProps<{ studio: StudioAccent }>();
</script>

<template>
  <div
    :data-studio="studio"
    data-testid="studio-shell"
    class="tw-mx-auto tw-grid tw-w-full tw-max-w-6xl tw-grid-cols-1 tw-gap-6 tw-px-4 tw-py-6 lg:tw-grid-cols-[minmax(0,35rem)_minmax(0,1fr)] lg:tw-gap-10 lg:tw-px-6"
  >
    <section data-testid="studio-compose" class="tw-min-w-0">
      <slot />
    </section>
    <aside
      v-if="$slots.result"
      data-testid="studio-result"
      class="tw-min-w-0 lg:tw-sticky lg:tw-top-[calc(var(--app-header-h,64px)+1.5rem)] lg:tw-self-start"
    >
      <slot name="result" />
    </aside>
  </div>
</template>
