<script setup lang="ts">
 /**
 * Dev-only scratch surface to verify DESIGN.md tokens resolve via Tailwind.
 * Used in PrimitivesPlayground and token audit tests.
 */
</script>

<template>
  <div data-testid="token-scratch" class="tw-bg-canvas tw-p-6 tw-text-ink-primary">
    <div class="tw-bg-surface-1 tw-p-4 tw-text-ink tw-shadow-card tw-rounded-card">
      <p class="tw-text-ink-muted">Surface 1</p>
      <p class="tw-text-ink-faint">Faint ink</p>
      <p class="tw-text-accent">Accent</p>
      <p class="tw-text-accent-hover">Accent hover</p>
      <p class="tw-bg-accent-subtle tw-text-accent">Accent subtle</p>
      <p class="tw-text-gold">Gold</p>
      <p class="tw-text-gold-muted">Gold muted</p>
    </div>

    <div class="tw-mt-4 tw-grid tw-gap-2 sm:tw-grid-cols-2">
      <div class="tw-rounded-sm tw-bg-surface-2 tw-p-3 tw-shadow-accent">Radius sm</div>
      <div class="tw-rounded-md tw-bg-surface-3 tw-p-3 tw-shadow-elevated">Radius md</div>
      <div class="tw-rounded-lg tw-bg-surface-2 tw-p-3 tw-shadow-gold-glow">Radius lg</div>
      <div class="tw-h-1 tw-bg-accent-line">Accent line</div>
    </div>

    <div class="tw-mt-4 tw-font-display tw-text-display-md">Display</div>
    <div class="tw-font-body tw-text-body-base">Body base</div>
    <div class="tw-text-eyebrow tw-uppercase">Eyebrow</div>

    <div class="tw-mt-4 tw-transition-opacity tw-duration-base tw-ease-soft hover:tw-opacity-80">
      Motion base
    </div>

    <div
      class="tw-mt-4 tw-border tw-border-hairline tw-bg-canvas-light tw-p-3 tw-text-ink-primary-light"
    >
      Light canvas
    </div>
    <div
      class="tw-mt-2 tw-border tw-border-light tw-bg-surface-light-1 tw-p-3 tw-text-ink-muted-light"
    >
      Light surface
    </div>
  </div>
</template>
