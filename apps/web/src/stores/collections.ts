import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { CollectionDto, CollectionListItem } from '@visual-ai/shared';

import { useFetch } from '@/composables/useFetch';
import { useUserStore } from '@/stores/user';
import { createLogger } from '@/utils/logger';

const log = createLogger('collections');

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<CollectionListItem[]>([]);
  const selectedCollectionId = ref<string | null>(null);
  const isLoading = ref(false);
  const isMutating = ref(false);

  function getUserId() {
    return useUserStore().userId;
  }

  async function fetchCollections() {
    const userId = getUserId();
    if (!userId) return;

    isLoading.value = true;
    try {
      const { data, error } = await useFetch(
        `/collections?userId=${encodeURIComponent(userId)}`,
      ).json<{ success: boolean; collections: CollectionListItem[] }>();

      if (error.value) {
        log.error('fetchCollections failed', { error: error.value, userId });
        return;
      }

      collections.value = data.value?.collections ?? [];
    } finally {
      isLoading.value = false;
    }
  }

  function selectCollection(id: string | null) {
    selectedCollectionId.value = id;
  }

  function upsertLocal(collection: CollectionDto) {
    const imageIds = collection.imageIds ?? [];
    const listItem: CollectionListItem = {
      ...collection,
      count: imageIds.length,
      coverImageIds: imageIds.slice(0, 4),
    };
    const index = collections.value.findIndex((item) => item.id === listItem.id);
    if (index === -1) {
      collections.value = [listItem, ...collections.value];
      return;
    }
    collections.value.splice(index, 1, listItem);
  }

  async function createCollection(name: string) {
    const userId = getUserId();
    if (!userId) return null;

    const trimmed = name.trim();
    if (!trimmed) return null;

    isMutating.value = true;
    try {
      const { data, error } = await useFetch('/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: trimmed }),
      }).json<{ success: boolean; collection: CollectionDto }>();

      if (error.value) {
        log.error('createCollection failed', { error: error.value, userId });
        return null;
      }

      const collection = data.value?.collection;
      if (collection) upsertLocal(collection);
      return collection ?? null;
    } finally {
      isMutating.value = false;
    }
  }

  async function renameCollection(collectionId: string, name: string) {
    const userId = getUserId();
    if (!userId) return null;

    const trimmed = name.trim();
    if (!trimmed) return null;

    isMutating.value = true;
    try {
      const { data, error } = await useFetch(`/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: trimmed }),
      }).json<{ success: boolean; collection: CollectionDto }>();

      if (error.value) {
        log.error('renameCollection failed', { error: error.value, collectionId });
        return null;
      }

      const collection = data.value?.collection;
      if (collection) upsertLocal(collection);
      return collection ?? null;
    } finally {
      isMutating.value = false;
    }
  }

  async function deleteCollection(collectionId: string) {
    const userId = getUserId();
    if (!userId) return false;

    isMutating.value = true;
    try {
      const { error } = await useFetch(`/collections/${collectionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).json();

      if (error.value) {
        log.error('deleteCollection failed', { error: error.value, collectionId });
        return false;
      }

      collections.value = collections.value.filter((item) => item.id !== collectionId);
      if (selectedCollectionId.value === collectionId) {
        selectedCollectionId.value = null;
      }
      return true;
    } finally {
      isMutating.value = false;
    }
  }

  async function addImages(collectionId: string, imageIds: string[]) {
    const userId = getUserId();
    if (!userId || imageIds.length === 0) return null;

    isMutating.value = true;
    try {
      const { data, error } = await useFetch(`/collections/${collectionId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, imageIds }),
      }).json<{ success: boolean; collection: CollectionDto }>();

      if (error.value) {
        log.error('addImages failed', { error: error.value, collectionId });
        return null;
      }

      const collection = data.value?.collection;
      if (collection) upsertLocal(collection);
      return collection ?? null;
    } finally {
      isMutating.value = false;
    }
  }

  async function removeImages(collectionId: string, imageIds: string[]) {
    const userId = getUserId();
    if (!userId || imageIds.length === 0) return null;

    isMutating.value = true;
    try {
      const { data, error } = await useFetch(`/collections/${collectionId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, imageIds }),
      }).json<{ success: boolean; collection: CollectionDto }>();

      if (error.value) {
        log.error('removeImages failed', { error: error.value, collectionId });
        return null;
      }

      const collection = data.value?.collection;
      if (collection) upsertLocal(collection);
      return collection ?? null;
    } finally {
      isMutating.value = false;
    }
  }

  return {
    collections,
    selectedCollectionId,
    isLoading,
    isMutating,
    fetchCollections,
    selectCollection,
    createCollection,
    renameCollection,
    deleteCollection,
    addImages,
    removeImages,
  };
});
