import { defineStore } from 'pinia';

export const useHistoryStore = defineStore('history', () => {
  const selectedSize = ref('medium');
  const searchQuery = ref('');
  const selectedFeatureTypes = ref<string[]>([]);
  const isBulkDeleting = ref(false);
  const isBulkFavoriting = ref(false);
  const isBulkDownloading = ref(false);
  return {
    selectedSize,
    searchQuery,
    selectedFeatureTypes,
    isBulkDeleting,
    isBulkFavoriting,
    isBulkDownloading,
  };
});
