<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

import { FeatureType, type IImageObject } from "@/types";

import { useAsideStore } from "@/stores/aside";
import { useDialogStore } from "@/stores/dialog";
import { useUserStore } from "@/stores/user";

import ImageDialog from "@/components/Dialogs/ImageDialog.vue";

const userStore = useUserStore();
const dialogStore = useDialogStore();
const asideStore = useAsideStore();
const { history } = storeToRefs(userStore);
const { typingPrompt } = storeToRefs(asideStore);

const imageDialogItem = ref<IImageObject | undefined>();

const imageHistory = computed(() =>
  history.value.filter((item) => item.featureType === FeatureType.IMAGE),
);

const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;

function getImageUrl(item: IImageObject): string {
  const image = item.images[0];
  if (!image) return "";
  if (image.aiImagePublicId) {
    return `${cloudinaryBaseUrl}/q_auto,f_auto/${image.aiImagePublicId}`;
  }
  return image.aiImageUrl ?? "";
}

function showImage(item: IImageObject) {
  imageDialogItem.value = item;
  dialogStore.showImage();
}

function handleRemix(prompt: string) {
  typingPrompt.value = prompt;
}
</script>

<template>
  <section
    data-testid="user-generations-grid"
    aria-label="Your generations"
    class="tw-px-4 tw-py-6 sm:tw-px-6"
  >
    <header class="tw-mb-5">
      <h2 class="tw-text-lg tw-font-semibold tw-text-ink">Your creations</h2>
    </header>

    <div class="user-generations-grid" role="list">
      <article
        v-for="item in imageHistory"
        :key="item._id"
        role="listitem"
        data-testid="user-generation-card"
        class="tw-group tw-break-inside-avoid tw-overflow-hidden tw-rounded-card tw-border tw-border-hairline tw-bg-surface-1 tw-shadow-card tw-transition-[border-color,box-shadow] tw-duration-fast hover:tw-border-accent/30 hover:tw-shadow-elevated"
      >
        <button
          type="button"
          class="tw-block tw-w-full tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
          @click="showImage(item)"
        >
          <div class="tw-aspect-square tw-overflow-hidden tw-bg-surface-2">
            <img
              v-if="getImageUrl(item)"
              :src="getImageUrl(item)"
              :alt="item.prompt.slice(0, 80)"
              loading="lazy"
              class="tw-h-full tw-w-full tw-object-cover tw-transition-transform tw-duration-fast group-hover:tw-scale-[1.02] motion-reduce:group-hover:tw-scale-100"
            />
          </div>
          <div class="tw-p-3">
            <p class="tw-line-clamp-2 tw-text-sm tw-text-ink-muted">{{ item.prompt }}</p>
            <p class="tw-mt-1 tw-text-xs tw-text-ink-faint">{{ item.modelName }}</p>
          </div>
        </button>
      </article>
    </div>

    <ImageDialog :item="imageDialogItem" />
  </section>
</template>

<style scoped lang="scss">
.user-generations-grid {
  column-count: 1;
  column-gap: 1rem;

  @media (min-width: 640px) {
    column-count: 2;
  }

  @media (min-width: 1024px) {
    column-count: 3;
  }

  article {
    margin-bottom: 1rem;
  }
}
</style>
