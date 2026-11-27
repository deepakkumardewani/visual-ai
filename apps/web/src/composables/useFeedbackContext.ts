import type { FeedbackContext } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';

import { buildFeedbackContext, readBrowserContext } from '@/utils/feedbackContext';

/** Snapshot of where the user is and what they use, captured at submit time. */
export function useFeedbackContext() {
  const route = useRoute();
  const asideStore = useAsideStore();
  const userStore = useUserStore();
  const { mode } = storeToRefs(asideStore);
  const { plan, credits } = storeToRefs(userStore);

  return function captureContext(): FeedbackContext {
    return buildFeedbackContext({
      routePath: route.path,
      lastModelId: mode.value.id,
      plan: plan.value,
      credits: credits.value,
      ...readBrowserContext(),
    });
  };
}
