<script setup lang="ts">
 /**
 * Two-column dashboard layout: control rail (left) + result canvas (right).
 * Responsive: stacks rail above canvas on viewports below `sm`.
 */
</script>

<template>
  <div
    data-testid="dashboard-shell"
    class="dashboard-shell tw-h-[calc(100vh-60px)] tw-max-h-[calc(100vh-60px)] tw-min-h-0 tw-overflow-hidden tw-bg-canvas"
  >
    <div
      class="dashboard-shell__grid tw-grid tw-h-full tw-min-h-0 tw-gap-x-1 tw-gap-y-1 tw-px-1 tw-py-3"
    >
      <aside
        data-testid="dashboard-rail"
        class="dashboard-shell__rail tw-min-h-0 tw-h-full tw-overflow-y-auto tw-rounded-card tw-border tw-border-hairline tw-bg-surface-1 tw-p-1 no-scrollbar"
      >
        <slot name="rail" />
      </aside>

      <main
        data-testid="dashboard-canvas"
        class="dashboard-shell__canvas tw-min-h-0 tw-h-full tw-overflow-hidden tw-rounded-card tw-bg-canvas"
      >
        <slot name="canvas" />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-shell__grid {
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
}

@media (min-width: 640px) {
  .dashboard-shell__grid {
    grid-template-columns: minmax(0, 17rem) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
}
</style>
