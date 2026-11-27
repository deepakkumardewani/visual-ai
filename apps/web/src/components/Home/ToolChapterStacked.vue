<script setup lang="ts">
import type { ToolChapter } from '@/utils/landing';

import BeforeAfter from '@/components/Landing/BeforeAfter.vue';
import ToolChapterCopy from '@/components/LandingV2/ToolChapterCopy.vue';
import ToolCluster from '@/components/LandingV2/ToolCluster.vue';
import ToolCutoutCards from '@/components/LandingV2/ToolCutoutCards.vue';

import { STAGE_ASPECT_RATIO } from '@/components/LandingV2/toolsMedia';

defineProps<{
  tool: ToolChapter;
  index: number;
}>();
</script>

<!-- One chapter for mobile and reduced motion: copy, then a slider the visitor drags. -->
<template>
  <article class="stacked" data-stacked-chapter>
    <div class="stacked__media" data-stacked-part>
      <div
        v-if="tool.media.kind === 'compare'"
        class="stacked__compare"
        :style="{ aspectRatio: STAGE_ASPECT_RATIO }"
      >
        <BeforeAfter :before="tool.media.before" :after="tool.media.after" fill />
      </div>
      <ToolCutoutCards v-else-if="tool.media.kind === 'cutout'" :pairs="tool.media.pairs" />
      <ToolCluster v-else :tool="tool" />
    </div>
    <ToolChapterCopy class="stacked__copy" :tool="tool" :index="index" data-stacked-part />
  </article>
</template>

<style scoped lang="scss">
.stacked {
  display: grid;
  gap: var(--lv2-space-xl);
}

.stacked__compare {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background-color: rgb(var(--tw-surface-2));
}

/* Reduced motion on a wide screen: an asymmetric two-column spread, media leading. */
@media (min-width: 900px) {
  .stacked {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    align-items: center;
    gap: var(--lv2-space-3xl);
  }

  .stacked:nth-child(even) .stacked__media {
    order: 2;
  }
}
</style>
