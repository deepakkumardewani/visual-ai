import { watch } from 'vue';
import type { Ref } from 'vue';
import { useUser } from 'vue-clerk';
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';

import { fetchAdminAccess } from '@/utils/feedbackApi';
import { ADMIN_GUARD_CLERK_TIMEOUT_MS } from '@/utils/feedbackUi';

export const ADMIN_FEEDBACK_ROUTE = 'admin-feedback';

export interface AdminGuardDeps {
  isLoaded: Ref<boolean | undefined>;
  isSignedIn: Ref<boolean | undefined>;
  fetchAccess: () => Promise<boolean>;
  clerkTimeoutMs?: number;
}

const HOME: RouteLocationRaw = { path: '/' };

/** On a hard reload Clerk has no token yet; deciding early would bounce the admin home. */
function waitForClerk(isLoaded: Ref<boolean | undefined>, timeoutMs: number): Promise<boolean> {
  if (isLoaded.value) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      stop();
      resolve(false);
    }, timeoutMs);
    const stop = watch(isLoaded, (loaded) => {
      if (!loaded) return;
      clearTimeout(timer);
      stop();
      resolve(true);
    });
  });
}

/** Signed-out visitors go to signin, signed-in non-admins (or a failed check) go home. */
export async function adminGuard(
  to: Pick<RouteLocationNormalized, 'fullPath'>,
  deps: AdminGuardDeps,
): Promise<true | RouteLocationRaw> {
  const loaded = await waitForClerk(
    deps.isLoaded,
    deps.clerkTimeoutMs ?? ADMIN_GUARD_CLERK_TIMEOUT_MS,
  );
  if (!loaded) return HOME;
  if (deps.isSignedIn.value === false) {
    return { name: 'signin', query: { redirect: to.fullPath } };
  }
  return (await deps.fetchAccess()) ? true : HOME;
}

export function adminGuardForRoute(to: RouteLocationNormalized) {
  const { isLoaded, isSignedIn } = useUser();
  return adminGuard(to, { isLoaded, isSignedIn, fetchAccess: fetchAdminAccess });
}
