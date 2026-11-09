import { getHistoryFullLevel, HISTORY_CAP, type HistoryFullLevel } from '@visual-ai/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { useUserStore } from '@/stores/user';

export const useHistoryStore = defineStore('history', () => {
  const selectedSize = ref('medium');
  const searchQuery = ref('');
  const selectedFeatureTypes = ref<string[]>([]);
  const isBulkDeleting = ref(false);
  const isBulkFavoriting = ref(false);
  const isBulkDownloading = ref(false);

  const userStore = useUserStore();
  const historyCap = computed(() => HISTORY_CAP[userStore.plan]);
  // Only entries with an `_id` are saved server-side; unsaved at-cap results also live in
  // `userStore.history` and must not count toward the cap.
  const savedCount = computed(() => userStore.history.filter((item) => item._id).length);
  // Users over the cap (e.g. downgraded) evaluate as full.
  // Unknown until the user sync finishes, so no note flashes while loading.
  const historyFullLevel = computed<HistoryFullLevel>(() =>
    userStore.isReady ? getHistoryFullLevel(savedCount.value, historyCap.value) : 'none',
  );

  return {
    historyCap,
    savedCount,
    historyFullLevel,
    selectedSize,
    searchQuery,
    selectedFeatureTypes,
    isBulkDeleting,
    isBulkFavoriting,
    isBulkDownloading,
  };
});
