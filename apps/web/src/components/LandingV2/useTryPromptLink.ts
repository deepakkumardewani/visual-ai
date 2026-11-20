import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useUser } from 'vue-clerk';
import { useRouter } from 'vue-router';

import { PROMPT_QUERY_KEY } from '@/composables/useStudioPromptPrefill';
import { FeatureType } from '@/types';
import { createFeatureLocation } from '@/utils/dashboardRoutes';

/**
 * Link to the image studio with `prompt` waiting in the composer. Signed-out
 * visitors (and anyone while Clerk is still loading) go through sign-in first,
 * which sends them on to the same studio URL. The studio only fills the text
 * box; it never submits. `isSignedIn` lets the caller describe that route
 * honestly.
 */
export function useTryPromptLink(prompt: MaybeRefOrGetter<string>) {
  const router = useRouter();
  const { isSignedIn: clerkSignedIn } = useUser();
  const isSignedIn = computed(() => clerkSignedIn.value === true);

  const href = computed(() => {
    const studio = router.resolve(
      createFeatureLocation(FeatureType.IMAGE, { [PROMPT_QUERY_KEY]: toValue(prompt) }),
    ).fullPath;
    if (isSignedIn.value) return studio;
    return router.resolve({ name: 'signin', query: { redirect: studio } }).fullPath;
  });

  return { href, isSignedIn };
}
