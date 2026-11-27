import { requiresPro } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';

import { useAppStore } from '@/stores/app';
import { DEFAULT_MODE, useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';

/**
 * Swaps a Pro-only model for the default once a free user's plan is known.
 * A premium model can arrive from persisted composer state or a remix of a
 * premium image; waiting for `isReady` keeps a Pro user's choice intact while
 * their plan is still loading.
 */
export function usePremiumModelFallback(): void {
  const { mode } = storeToRefs(useAsideStore());
  const { isPro, isReady } = storeToRefs(useUserStore());
  const appStore = useAppStore();

  watch(
    [isReady, isPro, () => mode.value.id],
    ([ready, pro, modelId]) => {
      if (!ready || pro || !requiresPro(modelId)) return;
      const lockedTitle = mode.value.title;
      mode.value = DEFAULT_MODE;
      appStore.snackbarText = `${lockedTitle} is a Pro model. Switched to ${DEFAULT_MODE.title}.`;
      appStore.snackbar = true;
    },
    { immediate: true },
  );
}
