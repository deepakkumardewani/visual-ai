<script setup lang="ts">
import BeforeAfter from '@/components/Landing/BeforeAfter.vue';

import type { ToolChapter } from '@/utils/landing';

defineProps<{
  media: ToolChapter['media'];
  label: string;
}>();
</script>

<template>
  <BeforeAfter v-if="media.kind === 'compare'" :before="media.before" :after="media.after" />
  <div v-else class="cluster">
    <img
      v-for="(src, i) in media.images"
      :key="src"
      :src="src"
      :alt="`${label} example ${i + 1}`"
      class="cluster__img"
      :class="`cluster__img--${i}`"
      loading="lazy"
      decoding="async"
    />
  </div>
</template>

<style scoped lang="scss">
.cluster {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  grid-template-rows: repeat(2, 1fr);
  gap: 0.75rem;
  height: 100%;
  min-height: 20rem;
}
.cluster__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.875rem;
  border: 1px solid rgb(var(--tw-hairline));
}
.cluster__img--0 {
  grid-row: span 2;
}
</style>
