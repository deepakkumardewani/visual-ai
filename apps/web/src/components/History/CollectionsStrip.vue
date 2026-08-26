<script setup lang="ts">
import { faImages, faPlus } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import type { CollectionListItem } from '@visual-ai/shared';
import type { IImage, IImageObject } from '@/types';

import { useAppStore } from '@/stores/app';
import { useCollectionsStore } from '@/stores/collections';
import { useUserStore } from '@/stores/user';

import Popover from '@/components/primitives/Popover.vue';
import Tooltip from '@/components/primitives/Tooltip.vue';

const collectionsStore = useCollectionsStore();
const userStore = useUserStore();
const appStore = useAppStore();

const { collections, selectedCollectionId, isMutating } = storeToRefs(collectionsStore);
const { history } = storeToRefs(userStore);
const { snackbar, snackbarText } = storeToRefs(appStore);

const createOpen = ref(false);
const newName = ref('');
/** TODO(collections): restore All chip + New-collection chip + form when we ship albums. */
const ENABLE_COLLECTION_ALL = false;
const ENABLE_COLLECTION_CREATE = false;

const showStrip = computed(
  () => ENABLE_COLLECTION_CREATE || ENABLE_COLLECTION_ALL || collections.value.length > 0,
);

const historyById = computed(() => {
  const map = new Map<string, IImageObject>();
  for (const item of history.value) {
    if (item._id) map.set(item._id, item);
  }
  return map;
});

onMounted(() => {
  void collectionsStore.fetchCollections();
});

function getThumbUrl(image: IImage | undefined) {
  if (!image) return '';
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const publicId = image.aiImagePublicId ?? image.enhancedPublicId;
  if (publicId) {
    return `${cloudinaryBaseUrl}/q_auto,f_auto,w_80,h_80,c_fill/${publicId}`;
  }
  return image.aiImageUrl ?? image.enhancedImageUrl ?? '';
}

function coverUrls(collection: CollectionListItem): string[] {
  return collection.coverImageIds
    .map((id) => {
      const item = historyById.value.get(id);
      return getThumbUrl(item?.images?.[0]);
    })
    .filter(Boolean)
    .slice(0, 4);
}

function selectAll() {
  collectionsStore.selectCollection(null);
}

function selectCollection(id: string) {
  collectionsStore.selectCollection(selectedCollectionId.value === id ? null : id);
}

async function submitCreate() {
  const name = newName.value.trim();
  if (!name || isMutating.value) return;
  const created = await collectionsStore.createCollection(name);
  if (created) {
    newName.value = '';
    createOpen.value = false;
    snackbarText.value = `Created “${created.name}”. Select images, then Add to collection.`;
    snackbar.value = true;
  }
}
</script>

<template>
  <div v-if="showStrip" class="collections-strip" data-testid="collections-strip">
    <button
      v-if="ENABLE_COLLECTION_ALL"
      type="button"
      class="collection-chip"
      :class="{ 'collection-chip--active': selectedCollectionId === null }"
      @click="selectAll"
    >
      <span class="collection-chip__placeholder" aria-hidden="true">
        <font-awesome-icon :icon="faImages" class="tw-h-3 tw-w-3" />
      </span>
      <span class="collection-chip__meta">
        <span class="collection-chip__name">All</span>
      </span>
    </button>

    <button
      v-for="collection in collections"
      :key="collection.id"
      type="button"
      class="collection-chip"
      :class="{ 'collection-chip--active': selectedCollectionId === collection.id }"
      :aria-label="`${collection.name}, ${collection.count} images`"
      @click="selectCollection(collection.id)"
    >
      <span class="collection-chip__covers" aria-hidden="true">
        <template v-if="coverUrls(collection).length">
          <img
            v-for="(url, index) in coverUrls(collection).slice(0, 2)"
            :key="`${collection.id}-${index}`"
            :src="url"
            alt=""
            class="collection-chip__thumb"
            :style="{ zIndex: 2 - index, marginLeft: index ? '-0.4rem' : '0' }"
          />
        </template>
        <span v-else class="collection-chip__placeholder">
          <font-awesome-icon :icon="faImages" class="tw-h-3 tw-w-3" />
        </span>
      </span>
      <span class="collection-chip__meta">
        <span class="collection-chip__name">{{ collection.name }}</span>
        <span class="collection-chip__count">{{ collection.count }}</span>
      </span>
    </button>

    <Popover
      v-if="ENABLE_COLLECTION_CREATE"
      v-model:open="createOpen"
      placement="bottom-start"
      unstyled-trigger
    >
      <template #trigger="{ triggerProps }">
        <Tooltip text="Create a collection">
          <button
            v-bind="triggerProps"
            type="button"
            class="collection-new"
            aria-label="New collection"
          >
            <font-awesome-icon :icon="faPlus" class="tw-h-3 tw-w-3" aria-hidden="true" />
            <span>New</span>
          </button>
        </Tooltip>
      </template>
      <form class="create-form" @submit.prevent="submitCreate">
        <p class="create-form__title">New collection</p>
        <p class="create-form__hint">
          Saves a named album. It stays empty until you select images and choose Add to collection.
        </p>
        <label class="create-form__label" for="new-collection-name">Name</label>
        <input
          id="new-collection-name"
          v-model="newName"
          type="text"
          maxlength="60"
          placeholder="e.g. Product shots"
          class="create-form__input"
          autocomplete="off"
        />
        <button type="submit" class="create-form__submit" :disabled="!newName.trim() || isMutating">
          Create
        </button>
      </form>
    </Popover>
  </div>
</template>

<style scoped lang="scss">
.collections-strip {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  overflow-x: auto;
  padding: 0.85rem 2.5rem 0.4rem;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.collection-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0.25rem 0.7rem 0.25rem 0.35rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 9999px;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-muted));
  font-size: 0.75rem;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: rgba(201, 138, 90, 0.35);
    color: rgb(var(--tw-ink));
  }
}

.collection-chip--active {
  border-color: rgba(201, 138, 90, 0.55);
  background: rgb(var(--tw-surface-2));
  color: rgb(var(--tw-ink));
}

.collection-new {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.25rem;
  padding: 0 0.85rem 0 0.7rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 9999px;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-muted));
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: rgba(201, 138, 90, 0.35);
    color: rgb(var(--tw-ink));
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 3px;
  }
}

.collection-chip__covers,
.collection-chip__placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.collection-chip__placeholder {
  border-radius: 9999px;
  background: rgb(var(--tw-surface-2));
  color: rgb(var(--tw-ink-faint));
}

.collection-chip__thumb {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  object-fit: cover;
  border: 1px solid rgb(var(--tw-canvas));
}

.collection-chip__meta {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  min-width: 0;
}

.collection-chip__name {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.collection-chip__count {
  color: rgb(var(--tw-ink-faint));
  font-variant-numeric: tabular-nums;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 16rem;
  max-width: 18rem;
  padding: 0.25rem;
}

.create-form__title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--tw-ink));
}

.create-form__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: rgb(var(--tw-ink-muted));
}

.create-form__label {
  font-size: 0.75rem;
  color: rgb(var(--tw-ink-faint));
}

.create-form__input {
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 0.5rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink));
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: rgba(201, 138, 90, 0.55);
  }
}

.create-form__submit {
  min-height: 2.25rem;
  border-radius: 9999px;
  background: rgb(var(--tw-surface-3));
  border: 1px solid rgba(201, 138, 90, 0.4);
  color: rgb(var(--tw-ink));
  font-size: 0.8125rem;
  font-weight: 500;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
