import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getToken = vi.fn().mockResolvedValue('clerk-token');

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isLoaded: { value: true }, isSignedIn: { value: true } }),
  useAuth: () => ({ getToken }),
}));

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from '@/composables/useFetch';
import { useUserStore } from '@/stores/user';

function mockFetchJson(result: { data: { value: unknown }; error: { value: unknown } }) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => result,
  } as unknown as ReturnType<typeof useFetch>);
}

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('has correct initial state', () => {
    const store = useUserStore();
    expect(store.userId).toBe('');
    expect(store.credits).toBe(0);
    expect(store.dailyCredits).toBe(0);
    expect(store.userDetails).toBeNull();
    expect(store.history).toEqual([]);
    expect(store.payments).toEqual([]);
    expect(store.isReady).toBe(false);
    expect(store.hasCredits).toBe(false);
    expect(store.hasJustSubscribed).toBe(false);
  });

  it('setCredits updates balance and hasCredits', () => {
    const store = useUserStore();
    store.setCredits(5);
    expect(store.credits).toBe(5);
    expect(store.hasCredits).toBe(true);
    expect(store.canAffordOutputs(2, 2)).toBe(true);
    expect(store.canAffordOutputs(4, 2)).toBe(false);
  });

  it('getUserDetails is a no-op without a user id', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const store = useUserStore();
    await store.getUserDetails();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.isReady).toBe(false);
  });

  it('getUserDetails hydrates profile, history, and credits', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          userId: 'user_1',
          credits: 12,
          dailyCredits: 3,
          history: [{ _id: 'h1' }],
          payments: [{ id: 'pay_1' }],
        }),
      }),
    );
    const store = useUserStore();
    store.userId = 'user_1';
    await store.getUserDetails();
    expect(store.userDetails?.userId).toBe('user_1');
    expect(store.credits).toBe(12);
    expect(store.dailyCredits).toBe(3);
    expect(store.history).toEqual([{ _id: 'h1' }]);
    expect(store.payments).toEqual([{ id: 'pay_1' }]);
    expect(store.isReady).toBe(true);
    expect(JSON.parse(localStorage.getItem('userDetails')!)).toEqual({ userId: 'user_1' });
    expect(getToken).toHaveBeenCalled();
  });

  it('getUserDetails does not overwrite existing localStorage userDetails', async () => {
    localStorage.setItem('userDetails', JSON.stringify({ userId: 'cached' }));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          userId: 'user_1',
          credits: 1,
        }),
      }),
    );
    const store = useUserStore();
    store.userId = 'user_1';
    await store.getUserDetails();
    expect(JSON.parse(localStorage.getItem('userDetails')!)).toEqual({ userId: 'cached' });
    expect(store.history).toEqual([]);
    expect(store.payments).toEqual([]);
    expect(store.dailyCredits).toBe(0);
  });

  it('getUserDetails leaves details unset when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );
    const store = useUserStore();
    store.userId = 'user_1';
    await store.getUserDetails();
    expect(store.userDetails).toBeNull();
    expect(store.isReady).toBe(true);
  });

  it('getUserDetails marks ready after a network throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const store = useUserStore();
    store.userId = 'user_1';
    await store.getUserDetails();
    expect(store.isReady).toBe(true);
  });

  it('syncFromClerk is a no-op for an empty clerk id', async () => {
    const store = useUserStore();
    await store.syncFromClerk('');
    expect(store.userId).toBe('');
  });

  it('syncFromClerk sets the user id and loads details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ userId: 'clerk_1', credits: 8 }),
      }),
    );
    const store = useUserStore();
    await store.syncFromClerk('clerk_1');
    expect(store.userId).toBe('clerk_1');
    expect(store.credits).toBe(8);
  });

  it('updateName returns true on success and false on error', async () => {
    mockFetchJson({ data: { value: { success: true } }, error: { value: null } });
    const store = useUserStore();
    store.userId = 'user_1';
    await expect(store.updateName('Ada', 'Lovelace')).resolves.toBe(true);
    expect(store.isUpdatingName).toBe(false);

    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    await expect(store.updateName('Ada', 'Lovelace')).resolves.toBe(false);
  });

  it('updateName returns false when useFetch throws', async () => {
    vi.mocked(useFetch).mockReturnValue({
      json: async () => {
        throw new Error('network');
      },
    } as unknown as ReturnType<typeof useFetch>);
    const store = useUserStore();
    await expect(store.updateName('Ada', 'Lovelace')).resolves.toBe(false);
    expect(store.isUpdatingName).toBe(false);
  });

  it('updateUsername returns true on success and false on error', async () => {
    mockFetchJson({ data: { value: { success: true } }, error: { value: null } });
    const store = useUserStore();
    store.userId = 'user_1';
    await expect(store.updateUsername('ada')).resolves.toBe(true);
    expect(store.isUpdatingUsername).toBe(false);

    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    await expect(store.updateUsername('ada')).resolves.toBe(false);
  });

  it('updateUsername returns false when useFetch throws', async () => {
    vi.mocked(useFetch).mockReturnValue({
      json: async () => {
        throw new Error('network');
      },
    } as unknown as ReturnType<typeof useFetch>);
    const store = useUserStore();
    await expect(store.updateUsername('ada')).resolves.toBe(false);
    expect(store.isUpdatingUsername).toBe(false);
  });
});
