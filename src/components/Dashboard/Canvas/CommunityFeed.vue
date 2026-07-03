<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useAsideStore } from "@/stores/aside";

import CommunityCard from "@/components/Dashboard/Canvas/CommunityCard.vue";

import { COMMUNITY_FEED } from "@/utils/communityMock";

const asideStore = useAsideStore();
const { typingPrompt } = storeToRefs(asideStore);

function handleRemix(prompt: string) {
  typingPrompt.value = prompt;
}
</script>

<template>
  <section
    data-testid="community-feed"
    aria-label="Community generations"
    class="tw-h-full tw-w-full tw-overflow-y-auto tw-px-4 tw-py-6 sm:tw-px-6"
  >
    <header class="tw-mb-5">
      <h2 class="tw-text-lg tw-font-semibold tw-text-ink">Community creations</h2>
      <p class="tw-mt-1 tw-text-sm tw-text-ink-muted">
        Explore what others are making. Remix a prompt to get started.
      </p>
    </header>

    <div class="community-feed-grid" role="list" aria-label="Community generation cards">
      <CommunityCard
        v-for="item in COMMUNITY_FEED"
        :key="item.id"
        role="listitem"
        :item="item"
        @remix="handleRemix"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.community-feed-grid {
  column-count: 1;
  column-gap: 1rem;

  @media (min-width: 640px) {
    column-count: 2;
  }

  @media (min-width: 1024px) {
    column-count: 3;
  }
}

.community-feed-grid :deep(article) {
  margin-bottom: 1rem;
}
</style>
