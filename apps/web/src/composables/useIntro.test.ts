import { CURRENT_INTRO_VERSION } from '@visual-ai/shared';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';

const fetchMock = vi.hoisted(() => ({ useFetch: vi.fn() }));
vi.mock('@/composables/useFetch', () => fetchMock);

const USER_ID = 'user-1';
const SEEN_KEY = `intro-seen:${USER_ID}`;

type IntroModule = typeof import('./useIntro');
type UserStoreModule = typeof import('@/stores/user');

function putResult(failed: boolean) {
  return {
    json: () => Promise.resolve({ error: { value: failed ? new Error('boom') : null } }),
  };
}

async function setup(
  opts: { userId?: string; seen?: string | null; ready?: boolean; profile?: boolean } = {},
) {
  vi.resetModules();
  const { useIntro } = (await import('./useIntro')) as IntroModule;
  const { useUserStore } = (await import('@/stores/user')) as UserStoreModule;
  setActivePinia(createPinia());
  const store = useUserStore();
  store.userId = opts.userId ?? USER_ID;
  store.isReady = opts.ready ?? true;
  store.userDetails = (opts.profile ?? true) ? ({ seenIntroVersion: null } as never) : null;
  const intro = useIntro();
  const wrapper = mount(
    defineComponent({
      setup() {
        intro.useAutoShow();
        return () => null;
      },
    }),
  );
  return { store, intro, wrapper };
}

describe('useIntro', () => {
  beforeEach(() => {
    window.localStorage.clear();
    fetchMock.useFetch.mockReset();
    fetchMock.useFetch.mockReturnValue(putResult(false));
  });

  describe('auto show matrix', () => {
    it('shows when profile is ready, flag absent and DB version is old', async () => {
      const { intro } = await setup();
      expect(intro.isOpen.value).toBe(true);
    });

    it('stays closed when the DB version is current', async () => {
      vi.resetModules();
      const { store, intro } = await setup({ profile: false });
      store.userDetails = { seenIntroVersion: CURRENT_INTRO_VERSION } as never;
      await nextTick();
      expect(intro.isOpen.value).toBe(false);
    });

    it('stays closed when the localStorage flag is set', async () => {
      window.localStorage.setItem(SEEN_KEY, '1');
      const { intro } = await setup();
      expect(intro.isOpen.value).toBe(false);
    });

    it('stays closed without a user id', async () => {
      const { intro } = await setup({ userId: '' });
      expect(intro.isOpen.value).toBe(false);
    });

    it('stays closed while the profile is loading, then opens when ready', async () => {
      const { store, intro } = await setup({ ready: false, profile: false });
      expect(intro.isOpen.value).toBe(false);

      store.userDetails = { seenIntroVersion: null } as never;
      await nextTick();
      expect(intro.isOpen.value).toBe(false);

      store.isReady = true;
      await nextTick();
      expect(intro.isOpen.value).toBe(true);
    });

    it('stays closed when ready but the profile failed to load', async () => {
      const { intro } = await setup({ profile: false });
      expect(intro.isOpen.value).toBe(false);
    });

    it('treats an unreadable localStorage as not seen', async () => {
      const spy = vi.fn(() => {
        throw new Error('denied');
      });
      vi.stubGlobal('localStorage', { getItem: spy, setItem: vi.fn(), clear: vi.fn() });
      const { intro } = await setup();
      expect(intro.isOpen.value).toBe(true);
      expect(spy).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('does not re-evaluate while already open', async () => {
      const { store, intro } = await setup();
      store.credits = 5;
      store.userDetails = { seenIntroVersion: null } as never;
      await nextTick();
      expect(intro.isOpen.value).toBe(true);
    });
  });

  describe('dismiss', () => {
    it('closes, writes the flag first, then PUTs the version and updates the profile', async () => {
      const { store, intro } = await setup();
      await intro.dismiss();

      expect(intro.isOpen.value).toBe(false);
      expect(window.localStorage.getItem(SEEN_KEY)).toBe('1');
      expect(fetchMock.useFetch).toHaveBeenCalledTimes(1);
      const [path, init] = fetchMock.useFetch.mock.calls[0];
      expect(path).toBe('/users/intro-seen');
      expect(init.method).toBe('PUT');
      expect(JSON.parse(init.body)).toEqual({ version: CURRENT_INTRO_VERSION });
      expect(store.userDetails?.seenIntroVersion).toBe(CURRENT_INTRO_VERSION);
    });

    it('retries once when the PUT reports an error, then succeeds', async () => {
      fetchMock.useFetch.mockReturnValueOnce(putResult(true)).mockReturnValueOnce(putResult(false));
      const { store, intro } = await setup();
      await intro.dismiss();

      expect(fetchMock.useFetch).toHaveBeenCalledTimes(2);
      expect(store.userDetails?.seenIntroVersion).toBe(CURRENT_INTRO_VERSION);
    });

    it('retries once when the PUT throws, then gives up leaving the localStorage guard', async () => {
      fetchMock.useFetch.mockImplementation(() => {
        throw new Error('network');
      });
      const { store, intro } = await setup();
      await intro.dismiss();

      expect(fetchMock.useFetch).toHaveBeenCalledTimes(2);
      expect(window.localStorage.getItem(SEEN_KEY)).toBe('1');
      expect(store.userDetails?.seenIntroVersion).toBeNull();
    });

    it('does not reopen after a failed PUT because the flag guards it', async () => {
      fetchMock.useFetch.mockReturnValue(putResult(true));
      const { intro } = await setup();
      await intro.dismiss();
      const second = await setup({ profile: true });
      expect(second.intro.isOpen.value).toBe(false);
    });

    it('survives a localStorage write failure and still PUTs', async () => {
      const spy = vi.fn(() => {
        throw new Error('quota');
      });
      vi.stubGlobal('localStorage', { getItem: vi.fn(() => null), setItem: spy, clear: vi.fn() });
      const { intro } = await setup();
      await intro.dismiss();

      expect(spy).toHaveBeenCalled();
      expect(fetchMock.useFetch).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });

    it('updates nothing when the profile vanished before the PUT resolved', async () => {
      const { store, intro } = await setup();
      const pending = intro.dismiss();
      store.userDetails = null;
      await pending;
      expect(store.userDetails).toBeNull();
    });

    it('does nothing beyond closing when there is no user id', async () => {
      const { store, intro } = await setup();
      intro.open();
      store.userId = '';
      await intro.dismiss();
      expect(fetchMock.useFetch).not.toHaveBeenCalled();
    });
  });

  describe('manual open', () => {
    it('opens regardless of seen state and never writes on dismiss', async () => {
      window.localStorage.setItem(SEEN_KEY, '1');
      const { intro } = await setup();
      expect(intro.isOpen.value).toBe(false);

      intro.open();
      expect(intro.isOpen.value).toBe(true);
      await intro.dismiss();

      expect(intro.isOpen.value).toBe(false);
      expect(fetchMock.useFetch).not.toHaveBeenCalled();
    });
  });

  describe('storage event (second tab)', () => {
    function fire(key: string | null, newValue: string | null) {
      window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
    }

    it('closes the modal when another tab sets the seen flag', async () => {
      const { intro } = await setup();
      fire(SEEN_KEY, '1');
      expect(intro.isOpen.value).toBe(false);
    });

    it('ignores other keys and other values', async () => {
      const { intro } = await setup();
      fire('other', '1');
      fire(SEEN_KEY, '0');
      expect(intro.isOpen.value).toBe(true);
      await flushPromises();
    });
  });
});
