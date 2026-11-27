import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { adminGuard } from '@/router/adminGuard';

const to = { fullPath: '/admin/feedback' };

function deps(overrides: Partial<Parameters<typeof adminGuard>[1]> = {}) {
  return {
    isLoaded: ref<boolean | undefined>(true),
    isSignedIn: ref<boolean | undefined>(true),
    fetchAccess: vi.fn().mockResolvedValue(true),
    clerkTimeoutMs: 20,
    ...overrides,
  };
}

describe('adminGuard', () => {
  it('lets an admin through', async () => {
    expect(await adminGuard(to, deps())).toBe(true);
  });

  it('sends signed-out visitors to signin with a redirect', async () => {
    const d = deps({ isSignedIn: ref(false) });
    expect(await adminGuard(to, d)).toEqual({
      name: 'signin',
      query: { redirect: '/admin/feedback' },
    });
    expect(d.fetchAccess).not.toHaveBeenCalled();
  });

  it('sends non-admins home', async () => {
    expect(await adminGuard(to, deps({ fetchAccess: vi.fn().mockResolvedValue(false) }))).toEqual({
      path: '/',
    });
  });

  it('waits for Clerk to load before checking access', async () => {
    const isLoaded = ref<boolean | undefined>(false);
    const d = deps({ isLoaded, clerkTimeoutMs: 1000 });
    const result = adminGuard(to, d);
    isLoaded.value = true;
    expect(await result).toBe(true);
    expect(d.fetchAccess).toHaveBeenCalledTimes(1);
  });

  it('goes home if Clerk never loads', async () => {
    const d = deps({ isLoaded: ref(false) });
    expect(await adminGuard(to, d)).toEqual({ path: '/' });
    expect(d.fetchAccess).not.toHaveBeenCalled();
  });
});
