<script setup lang="ts">
 /**
 * Two-column dashboard layout: control rail (left) + result canvas (right).
 * Responsive: stacks rail above canvas on viewports below `sm`.
 */
</script>

<template>
  <div
    data-testid="dashboard-shell"
    class="dashboard-shell tw-bg-canvas tw-max-h-[calc(100vh-60px)] tw-min-h-[calc(100vh-60px)]"
  >
    <div class="dashboard-shell__grid tw-grid tw-h-full tw-gap-1 tw-p-1 tw-pb-2">
      <aside
        data-testid="dashboard-rail"
        class="dashboard-shell__rail tw-overflow-y-auto tw-rounded-card tw-border tw-border-hairline tw-bg-surface-1 tw-p-1 no-scrollbar"
      >
        <slot name="rail" />
      </aside>

      <main
        data-testid="dashboard-canvas"
        class="dashboard-shell__canvas tw-h-full tw-overflow-y-auto tw-rounded-card tw-bg-canvas tw-p-1 no-scrollbar"
      >
        <slot name="canvas" />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-shell__grid {
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
}

@media (min-width: 640px) {
  .dashboard-shell__grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
    grid-template-rows: 1fr;
  }
}
</style>
