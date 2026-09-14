import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isLoaded = ref(false);
const isSignedIn = ref(false);
const getToken = vi.fn().mockResolvedValue('clerk-token');

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isLoaded, isSignedIn }),
  useAuth: () => ({ getToken }),
}));

import { useAuthStore } from '@/stores/auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    isLoaded.value = false;
    isSignedIn.value = false;
  });

  it('exposes clerk auth state and getToken', () => {
    const store = useAuthStore();
    expect(store.isLoaded).toBe(false);
    expect(store.isSignedIn).toBe(false);
    expect(typeof store.getToken).toBe('function');
  });

  it('reflects signed-in clerk state', async () => {
    isLoaded.value = true;
    isSignedIn.value = true;
    const store = useAuthStore();
    expect(store.isLoaded).toBe(true);
    expect(store.isSignedIn).toBe(true);
    await expect(store.getToken()).resolves.toBe('clerk-token');
  });
});
