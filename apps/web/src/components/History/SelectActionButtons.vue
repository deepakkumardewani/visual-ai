<script setup lang="ts">
import { faDownload, faImages, faPlus, fasHeart, faTrashAlt } from '@/plugins/icons';
import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import type { IImageObject } from '@/types';

import { useCollectionsStore } from '@/stores/collections';
import { useGenerateStore } from '@/stores/generate';

import { bulkDelete, bulkDownload, bulkFavorite } from '@/utils/helpers';

const generateStore = useGenerateStore();
const collectionsStore = useCollectionsStore();
const { isDeleting, isFavoriting } = storeToRefs(generateStore);
const { collections, isMutating } = storeToRefs(collectionsStore);

const props = defineProps<{
  selectedImages: IImageObject[];
}>();

const pickerOpen = ref(false);
const createMode = ref(false);
const newName = ref('');
/** TODO(collections): restore New collection / Create & add when we ship albums. */
const ENABLE_COLLECTION_CREATE = false;
const pickerRoot = ref<HTMLElement | null>(null);

onClickOutside(pickerRoot, () => {
  pickerOpen.value = false;
  createMode.value = false;
  newName.value = '';
});

const isBusy = computed(() => isDeleting.value || isFavoriting.value || isMutating.value);

const selectedIds = computed(
  () => props.selectedImages.map((item) => item._id).filter(Boolean) as string[],
);

const handleBulkDelete = async () => {
  await bulkDelete(props.selectedImages);
};
const handleBulkFavorite = async () => {
  await bulkFavorite(props.selectedImages);
};
const handleBulkDownload = async () => {
  await bulkDownload(props.selectedImages);
};

function togglePicker() {
  if (isBusy.value) return;
  pickerOpen.value = !pickerOpen.value;
  if (!pickerOpen.value) {
    createMode.value = false;
    newName.value = '';
  }
}

async function addToCollection(collectionId: string) {
  if (!selectedIds.value.length || isBusy.value) return;
  const result = await collectionsStore.addImages(collectionId, selectedIds.value);
  if (result) {
    pickerOpen.value = false;
    createMode.value = false;
    newName.value = '';
  }
}

async function createAndAdd() {
  const name = newName.value.trim();
  if (!name || isBusy.value) return;
  const created = await collectionsStore.createCollection(name);
  if (!created) return;
  await addToCollection(created.id);
}
</script>

<template>
  <div class="tw-flex tw-items-center tw-gap-2">
    <button type="button" class="bulk-btn" :disabled="isBusy" @click="handleBulkDownload">
      <font-awesome-icon :icon="faDownload" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      <span class="tw-hidden sm:tw-inline">Download</span>
    </button>

    <button type="button" class="bulk-btn" :disabled="isBusy" @click="handleBulkFavorite">
      <font-awesome-icon :icon="fasHeart" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      <span class="tw-hidden sm:tw-inline">Favorite</span>
    </button>

    <div ref="pickerRoot" class="tw-relative">
      <button
        type="button"
        class="bulk-btn"
        :disabled="isBusy"
        :aria-expanded="pickerOpen"
        aria-haspopup="menu"
        @click="togglePicker"
      >
        <font-awesome-icon :icon="faImages" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
        <span class="tw-hidden sm:tw-inline">Add to collection</span>
      </button>

      <div v-if="pickerOpen" class="picker" role="menu" aria-label="Add to collection">
        <button
          v-for="collection in collections"
          :key="collection.id"
          type="button"
          class="picker__item"
          role="menuitem"
          :disabled="isBusy"
          @click="addToCollection(collection.id)"
        >
          <span class="picker__name">{{ collection.name }}</span>
          <span class="picker__count">{{ collection.count }}</span>
        </button>

        <p v-if="collections.length === 0 && !createMode" class="picker__empty">
          No collections yet
        </p>

        <template v-if="ENABLE_COLLECTION_CREATE">
          <div class="picker__divider" />

          <button
            v-if="!createMode"
            type="button"
            class="picker__item picker__item--muted"
            role="menuitem"
            @click="createMode = true"
          >
            <font-awesome-icon :icon="faPlus" class="tw-h-3 tw-w-3" aria-hidden="true" />
            New collection
          </button>

          <form v-else class="picker__create" @submit.prevent="createAndAdd">
            <input
              v-model="newName"
              type="text"
              maxlength="60"
              placeholder="Collection name"
              class="picker__input"
              autocomplete="off"
            />
            <button type="submit" class="picker__create-btn" :disabled="!newName.trim() || isBusy">
              Create & add
            </button>
          </form>
        </template>
      </div>
    </div>

    <button
      type="button"
      class="bulk-btn bulk-btn--danger"
      :disabled="isBusy"
      @click="handleBulkDelete"
    >
      <font-awesome-icon :icon="faTrashAlt" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      <span class="tw-hidden sm:tw-inline">Delete</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.bulk-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 0.875rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 9999px;
  background: rgb(var(--tw-surface-2));
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--tw-ink));
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-3));
    border-color: rgba(201, 138, 90, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.bulk-btn--danger:hover:not(:disabled) {
  color: rgb(248 113 113);
  border-color: rgba(248, 113, 113, 0.4);
}

.picker {
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 12.5rem;
  max-width: 16rem;
  max-height: 16rem;
  overflow-y: auto;
  padding: 0.4rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 0.65rem;
  background: rgb(var(--tw-surface-1));
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.picker__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.25rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  color: rgb(var(--tw-ink));
  font-size: 0.8125rem;
  text-align: left;

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-2));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.picker__item--muted {
  color: rgb(var(--tw-ink-muted));
  justify-content: flex-start;
}

.picker__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker__count,
.picker__empty {
  color: rgb(var(--tw-ink-faint));
  font-size: 0.75rem;
}

.picker__empty {
  margin: 0;
  padding: 0.5rem;
}

.picker__divider {
  height: 1px;
  margin: 0.25rem 0;
  background: rgb(var(--tw-hairline));
}

.picker__create {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.25rem;
}

.picker__input {
  min-height: 2.1rem;
  padding: 0 0.6rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 0.45rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink));
  font-size: 0.8125rem;

  &:focus {
    outline: none;
    border-color: rgba(201, 138, 90, 0.55);
  }
}

.picker__create-btn {
  min-height: 2.1rem;
  border-radius: 9999px;
  border: 1px solid rgba(201, 138, 90, 0.4);
  background: rgb(var(--tw-surface-3));
  color: rgb(var(--tw-ink));
  font-size: 0.75rem;
  font-weight: 500;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
