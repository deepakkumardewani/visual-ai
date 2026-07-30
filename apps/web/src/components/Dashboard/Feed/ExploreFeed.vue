<script setup lang="ts">
import CommunityFeed from '@/components/Dashboard/Canvas/CommunityFeed.vue';
</script>

<template>
  <div data-testid="explore-feed" class="tw-min-h-full tw-bg-canvas">
    <CommunityFeed
      dense
      switch-to-create-on-remix
      show-load-more
      title="Community Creations"
      subtitle=""
    />
  </div>
</template>
