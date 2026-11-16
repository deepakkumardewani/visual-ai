<script setup lang="ts">
import type { ToolChapter } from '@/utils/landing';

import ToolCluster from '@/components/LandingV2/ToolCluster.vue';
import ToolWipe from '@/components/LandingV2/ToolWipe.vue';

import { STAGE_ASPECT_RATIO } from '@/components/LandingV2/toolsMedia';

defineProps<{
  tools: readonly ToolChapter[];
}>();
</script>

<!-- Desktop pinned stage: one layer per chapter, stacked in a single fixed-ratio box. -->
<template>
  <div class="stage" :style="{ aspectRatio: STAGE_ASPECT_RATIO }">
    <div
      v-for="tool in tools"
      :key="tool.id"
      class="stage__layer"
      :class="`stage__layer--${tool.media.kind}`"
      data-stage-layer
      :data-kind="tool.media.kind"
    >
      <ToolWipe
        v-if="tool.media.kind === 'compare'"
        :before="tool.media.before"
        :after="tool.media.after"
        :label="tool.eyebrow"
      />
      <ToolCluster v-else :tool="tool" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.stage {
  position: relative;
  width: 100%;
}

.stage__layer {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}
</style>
