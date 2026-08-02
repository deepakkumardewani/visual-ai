<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRouter } from 'vue-router';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useExploreStore } from '@/stores/explore';
import { useUserStore } from '@/stores/user';

import CommunityCard from '@/components/Dashboard/Canvas/CommunityCard.vue';

const props = withDefaults(
  defineProps<{
    /** When true, switches to Create tab on remix (Explore tab). */
    switchToCreateOnRemix?: boolean;
    title?: string;
    subtitle?: string;
    showLoadMore?: boolean;
    /** Denser masonry + left header for Explore; looser for Create empty-state. */
    dense?: boolean;
  }>(),
  {
    switchToCreateOnRemix: false,
    title: 'Looking for inspiration?',
    subtitle: 'Remix a community prompt to get started.',
    showLoadMore: false,
    dense: false,
  },
);

const router = useRouter();
const exploreStore = useExploreStore();
const asideStore = useAsideStore();
const appStore = useAppStore();
const userStore = useUserStore();

const { items, isLoading, isLoadingMore, error, isEmpty, hasMore, hasFetched } =
  storeToRefs(exploreStore);
const { typingPrompt } = storeToRefs(asideStore);
const { tab, feature } = storeToRefs(appStore);
const { userId } = storeToRefs(userStore);

watch(
  userId,
  (id) => {
    if (!id || hasFetched.value || isLoading.value) return;
    void exploreStore.loadFeed();
  },
  { immediate: true },
);

function handleRemix(prompt: string) {
  typingPrompt.value = prompt;
  if (props.switchToCreateOnRemix) {
    feature.value = FeatureType.IMAGE;
    tab.value = 1;
  }
}

function handleOpen(id: string) {
  exploreStore.setActiveId(id);
  void router.push({ name: 'explore-image', params: { id } });
}
</script>

<template>
  <section
    data-testid="community-feed"
    aria-label="Community generations"
    class="tw-w-full"
    :class="dense ? 'tw-px-2 tw-py-4 sm:tw-px-3 sm:tw-py-5' : 'tw-px-4 tw-py-6 sm:tw-px-6'"
  >
    <header
      class="tw-mb-5 sm:tw-mb-6"
      :class="dense ? 'tw-px-1 tw-text-left' : 'tw-mt-2 tw-text-center'"
    >
      <h2 class="tw-font-display tw-text-display-md tw-text-ink">
        {{ title }}
      </h2>
      <p
        v-if="subtitle"
        class="tw-mt-1 tw-max-w-xl tw-text-sm tw-text-ink-muted"
        :class="{ 'tw-mx-auto': !dense }"
      >
        {{ subtitle }}
      </p>
    </header>

    <div
      v-if="isLoading && items.length === 0"
      data-testid="community-feed-loading"
      aria-busy="true"
      aria-label="Loading community creations"
      class="community-feed-grid"
      :class="{ 'community-feed-grid--dense': dense }"
    >
      <div
        v-for="n in 8"
        :key="n"
        class="tw-break-inside-avoid tw-animate-pulse tw-rounded-card tw-bg-surface-2"
        :class="dense ? 'tw-mb-2' : 'tw-mb-4'"
        :style="{ height: n % 2 === 0 ? '280px' : '200px' }"
      />
    </div>

    <div
      v-else-if="error && items.length === 0"
      data-testid="community-feed-error"
      role="alert"
      class="tw-mx-auto tw-max-w-md tw-rounded-card tw-border tw-border-hairline tw-bg-surface-1 tw-px-5 tw-py-8 tw-text-center"
    >
      <p class="tw-text-sm tw-text-ink-muted">{{ error }}</p>
      <button
        type="button"
        class="tw-mt-4 tw-min-h-11 tw-rounded-chip tw-bg-surface-2 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-ink hover:tw-bg-surface-3"
        @click="exploreStore.loadFeed()"
      >
        Try again
      </button>
    </div>

    <div
      v-else-if="isEmpty"
      data-testid="community-feed-empty"
      class="tw-mx-auto tw-max-w-md tw-px-5 tw-py-12 tw-text-center"
    >
      <p class="tw-text-sm tw-text-ink-muted">
        No community creations yet. Be among the first to generate something inspiring.
      </p>
    </div>

    <template v-else>
      <div
        class="community-feed-grid"
        :class="{ 'community-feed-grid--dense': dense }"
        role="list"
        aria-label="Community generation cards"
      >
        <CommunityCard
          v-for="item in items"
          :key="item.id"
          role="listitem"
          :item="item"
          @remix="handleRemix"
          @open="handleOpen"
        />
      </div>

      <div v-if="showLoadMore && hasMore" class="tw-mt-6 tw-flex tw-justify-center sm:tw-mt-8">
        <button
          type="button"
          data-testid="community-feed-load-more"
          class="tw-min-h-11 tw-rounded-chip tw-bg-surface-2 tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-ink hover:tw-bg-surface-3 disabled:tw-opacity-60"
          :disabled="isLoadingMore"
          @click="exploreStore.loadMore()"
        >
          {{ isLoadingMore ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
.community-feed-grid {
  column-count: 1;
  column-gap: 0.75rem;

  @media (min-width: 640px) {
    column-count: 2;
  }

  @media (min-width: 1024px) {
    column-count: 3;
  }

  @media (min-width: 1280px) {
    column-count: 4;
  }
}

.community-feed-grid--dense {
  column-gap: 0.5rem;

  @media (min-width: 1024px) {
    column-count: 4;
  }

  @media (min-width: 1536px) {
    column-count: 5;
  }
}

.community-feed-grid:not(.community-feed-grid--dense) :deep(article) {
  margin-bottom: 0.75rem;
}
</style>
