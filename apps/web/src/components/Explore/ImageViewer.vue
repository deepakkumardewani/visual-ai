<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import type { ExploreFeedItem } from '@/types';
import { FeatureType } from '@/types';

import { useAsideStore } from '@/stores/aside';
import { useExploreStore } from '@/stores/explore';

import ConfirmColorizeDialog from '@/components/Dialogs/ConfirmColorizeDialog.vue';
import ViewerDetails from '@/components/Explore/ViewerDetails.vue';
import ViewerFilmstrip from '@/components/Explore/ViewerFilmstrip.vue';
import ViewerStage from '@/components/Explore/ViewerStage.vue';
import { prefetchImageUrls, useExploreViewerNav } from '@/composables/useExploreViewerNav';
import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { useImageChainActions } from '@/composables/useImageChainActions';
import { useShareActions } from '@/composables/useShareActions';
import { useViewerTransform } from '@/composables/useViewerTransform';
import { faChevronLeft, faLink } from '@/plugins/icons';
import { detectMonochrome } from '@/utils/detectMonochrome';
import { APP_SURFACE, createFeatureLocation } from '@/utils/dashboardRoutes';
import { downloadImage } from '@/utils/helpers';
import { createLogger } from '@/utils/logger';

const props = defineProps<{
  item: ExploreFeedItem;
}>();

const log = createLogger('explore-viewer');
const router = useRouter();
const exploreStore = useExploreStore();
const asideStore = useAsideStore();

const { activeIndex, activeId, items, hasMore } = storeToRefs(exploreStore);
const { typingPrompt } = storeToRefs(asideStore);
const { interactiveTransition, pressable } = useDashboardMotion();
const { showToast, shareLink, copyPrompt } = useShareActions();
const { useAsReference, sendToUpscale, sendToRemoveBg } = useImageChainActions();

const detailsPanelRef = ref<HTMLElement | null>(null);
const detailsOpen = ref(false);

const itemRef = toRef(props, 'item');
const {
  isProcessing,
  processingLabel,
  originalUrl,
  resultUrl,
  hasResult,
  resultIsTransparent,
  pendingColorizeConfirm,
  startAction,
  requestColorizeConfirm,
  cancelColorizeConfirm,
  confirmColorize,
} = useViewerTransform(itemRef);

const navEnabled = computed(() => !isProcessing.value);

const canPrev = computed(() => activeIndex.value > 0);
const canNext = computed(
  () => activeIndex.value >= 0 && (activeIndex.value < items.value.length - 1 || hasMore.value),
);

const imageAlt = computed(
  () => `Generation by ${props.item.author}: ${props.item.prompt.slice(0, 80)}`,
);

const stageImageUrl = computed(() =>
  hasResult.value && resultUrl.value ? resultUrl.value : props.item.imageUrl,
);

async function navigateToId(id: string | null) {
  if (!id) return;
  await router.replace({ name: 'explore-image', params: { id } });
}

async function handlePrev() {
  if (isProcessing.value) return;
  const id = await exploreStore.goPrev();
  await navigateToId(id);
}

async function handleNext() {
  if (isProcessing.value) return;
  const id = await exploreStore.goNext();
  await navigateToId(id);
}

async function handleSelect(id: string) {
  if (isProcessing.value) return;
  if (id === activeId.value) return;
  exploreStore.setActiveId(id);
  await navigateToId(id);
  const index = exploreStore.activeIndex;
  if (index >= 0 && items.value.length - index - 1 <= 3 && hasMore.value) {
    void exploreStore.loadMore();
  }
}

function leaveViewer() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push({ name: APP_SURFACE.EXPLORE });
}

async function handleCopyPrompt() {
  await copyPrompt(props.item.prompt);
}

function handleRemix() {
  typingPrompt.value = props.item.prompt;
  void router.push(createFeatureLocation(FeatureType.IMAGE));
}

async function handleDownload(event?: Event) {
  const url = stageImageUrl.value;
  if (!url) {
    showToast('Nothing to download');
    return;
  }
  const ok = await downloadImage(event, url);
  if (ok) {
    showToast(hasResult.value ? 'Result downloaded' : 'Image downloaded');
    return;
  }
  showToast('Could not download image');
}

async function handleUseAsReference() {
  await useAsReference(props.item.imageUrl, {
    fileName: `explore-reference-${props.item.id}`,
    navigateToDashboard: true,
  });
}

async function handleShare() {
  await shareLink({ title: 'Explore creation', url: window.location.href });
}

async function handleUpscale() {
  await sendToUpscale(props.item.imageUrl, { navigateToDashboard: true });
}

async function handleColorize() {
  try {
    const isMono = await detectMonochrome(props.item.imageUrl);
    if (!isMono) {
      requestColorizeConfirm();
      return;
    }
  } catch (err) {
    log.error('monochrome detection failed', { error: err });
    // Fail open — ask before spending credits on uncertain color images.
    requestColorizeConfirm();
    return;
  }
  await startAction('colorize');
}

async function handleRemoveBg() {
  await sendToRemoveBg(props.item.imageUrl, { navigateToDashboard: true });
}

useExploreViewerNav(
  {
    onPrev: () => void handlePrev(),
    onNext: () => void handleNext(),
    onEscape: leaveViewer,
    onCopyPrompt: () => void handleCopyPrompt(),
    onRemix: handleRemix,
  },
  {
    enabled: navEnabled,
    ignoreWheelTarget: detailsPanelRef,
  },
);

watch(
  () => [activeIndex.value, items.value] as const,
  () => {
    const index = activeIndex.value;
    if (index < 0) return;
    prefetchImageUrls([items.value[index - 1]?.imageUrl, items.value[index + 1]?.imageUrl]);
  },
  { immediate: true },
);
</script>

<template>
  <div
    data-testid="explore-image-viewer"
    class="tw-flex tw-h-[100dvh] tw-flex-col tw-overflow-hidden tw-bg-canvas tw-text-ink md:tw-h-screen"
  >
    <header
      class="tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-hairline tw-px-3 tw-py-2.5 sm:tw-px-4"
    >
      <button
        type="button"
        data-testid="explore-viewer-back"
        class="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-chip tw-px-2 tw-text-sm tw-font-medium tw-text-ink hover:tw-bg-surface-2"
        :class="[interactiveTransition, pressable]"
        @click="leaveViewer"
      >
        <font-awesome-icon :icon="faChevronLeft" aria-hidden="true" />
        Explore
      </button>

      <button
        type="button"
        data-testid="explore-viewer-share"
        class="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-chip tw-px-2 tw-text-sm tw-font-medium tw-text-ink hover:tw-bg-surface-2"
        :class="[interactiveTransition, pressable]"
        aria-label="Share link"
        @click="handleShare"
      >
        <font-awesome-icon :icon="faLink" aria-hidden="true" />
        <span class="tw-hidden sm:tw-inline">Share</span>
      </button>
    </header>

    <div class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden md:tw-flex-row">
      <div class="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-overflow-hidden">
        <ViewerStage
          :image-url="item.imageUrl"
          :alt="imageAlt"
          :can-prev="canPrev"
          :can-next="canNext"
          :processing="isProcessing"
          :processing-label="processingLabel"
          :original-url="hasResult ? originalUrl : null"
          :result-url="hasResult ? resultUrl : null"
          :transparent-result="resultIsTransparent"
          @prev="handlePrev"
          @next="handleNext"
        />

        <ViewerFilmstrip :items="items" :active-id="item.id" @select="handleSelect" />
      </div>

      <div ref="detailsPanelRef" class="tw-min-h-0 tw-shrink-0 md:tw-flex md:tw-h-full">
        <ViewerDetails
          :item="item"
          :processing="isProcessing"
          :has-result="hasResult"
          v-model:details-open="detailsOpen"
          @remix="handleRemix"
          @copy-prompt="handleCopyPrompt"
          @download="handleDownload"
          @use-as-reference="handleUseAsReference"
          @upscale="handleUpscale"
          @colorize="handleColorize"
          @remove-bg="handleRemoveBg"
        />
      </div>
    </div>

    <ConfirmColorizeDialog
      :open="pendingColorizeConfirm"
      @close="cancelColorizeConfirm"
      @confirm="confirmColorize"
    />
  </div>
</template>
