import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from '@/composables/useFetch';
import { useSavedPromptsStore } from '@/stores/savedPrompts';

type FetchResult<T> = {
  data: { value: T | null };
  error: { value: unknown };
};

function mockFetchJson<T>(result: FetchResult<T>) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => result,
  } as unknown as ReturnType<typeof useFetch>);
}

const promptA = {
  id: 'p1',
  name: 'Sunset',
  prompt: 'golden hour beach',
  modelId: 'FLUX_BASIC',
  createdAt: '2026-01-01',
};

describe('useSavedPromptsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const store = useSavedPromptsStore();
    expect(store.prompts).toEqual([]);
    expect(store.isLoading).toBe(false);
    expect(store.isSaving).toBe(false);
    expect(store.isDeletingId).toBeNull();
    expect(store.hasFetched).toBe(false);
  });

  it('fetchPrompts stores the list on success', async () => {
    mockFetchJson({
      data: { value: { prompts: [promptA] } },
      error: { value: null },
    });
    const store = useSavedPromptsStore();
    await store.fetchPrompts();
    expect(store.prompts).toEqual([promptA]);
    expect(store.hasFetched).toBe(true);
    expect(store.isLoading).toBe(false);
  });

  it('fetchPrompts defaults to an empty list when the payload is missing', async () => {
    mockFetchJson({ data: { value: null }, error: { value: null } });
    const store = useSavedPromptsStore();
    await store.fetchPrompts();
    expect(store.prompts).toEqual([]);
    expect(store.hasFetched).toBe(true);
  });

  it('fetchPrompts throws when the request errors', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('boom') } });
    const store = useSavedPromptsStore();
    await expect(store.fetchPrompts()).rejects.toThrow('Could not load saved prompts');
    expect(store.isLoading).toBe(false);
    expect(store.hasFetched).toBe(false);
  });

  it('fetchPrompts wraps non-Error throws', async () => {
    vi.mocked(useFetch).mockReturnValue({
      json: async () => {
        throw 'network';
      },
    } as unknown as ReturnType<typeof useFetch>);
    const store = useSavedPromptsStore();
    await expect(store.fetchPrompts()).rejects.toThrow('Could not load saved prompts');
  });

  it('fetchPrompts is a no-op while a request is already in flight', async () => {
    let resolveJson: (value: FetchResult<{ prompts: (typeof promptA)[] }>) => void = () => {};
    vi.mocked(useFetch).mockReturnValue({
      json: () =>
        new Promise((resolve) => {
          resolveJson = resolve;
        }),
    } as unknown as ReturnType<typeof useFetch>);

    const store = useSavedPromptsStore();
    const first = store.fetchPrompts();
    await store.fetchPrompts();
    expect(useFetch).toHaveBeenCalledTimes(1);
    resolveJson({ data: { value: { prompts: [] } }, error: { value: null } });
    await first;
  });

  it('createPrompt rejects blank name or prompt', async () => {
    const store = useSavedPromptsStore();
    await expect(store.createPrompt({ name: '  ', prompt: 'ok' })).rejects.toThrow(
      'Name and prompt are required',
    );
    await expect(store.createPrompt({ name: 'ok', prompt: '   ' })).rejects.toThrow(
      'Name and prompt are required',
    );
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('createPrompt prepends a saved prompt and includes modelId', async () => {
    mockFetchJson({
      data: { value: { prompt: promptA } },
      error: { value: null },
    });
    const store = useSavedPromptsStore();
    store.prompts = [{ ...promptA, id: 'old' }];
    const created = await store.createPrompt({
      name: ' Sunset ',
      prompt: ' golden hour beach ',
      modelId: 'FLUX_BASIC',
    });
    expect(created).toEqual(promptA);
    expect(store.prompts[0]).toEqual(promptA);
    expect(useFetch).toHaveBeenCalledWith(
      '/saved-prompts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Sunset',
          prompt: 'golden hour beach',
          modelId: 'FLUX_BASIC',
        }),
      }),
    );
    expect(store.isSaving).toBe(false);
  });

  it('createPrompt omits modelId when it is not provided', async () => {
    mockFetchJson({
      data: { value: { prompt: promptA } },
      error: { value: null },
    });
    const store = useSavedPromptsStore();
    await store.createPrompt({ name: 'A', prompt: 'B' });
    expect(JSON.parse(vi.mocked(useFetch).mock.calls[0][1]!.body as string)).toEqual({
      name: 'A',
      prompt: 'B',
    });
  });

  it('createPrompt throws when the API returns an error or empty prompt', async () => {
    mockFetchJson({ data: { value: null }, error: { value: { status: 500 } } });
    const store = useSavedPromptsStore();
    await expect(store.createPrompt({ name: 'A', prompt: 'B' })).rejects.toThrow(
      'Could not save prompt',
    );
  });

  it('createPrompt wraps non-Error throws', async () => {
    vi.mocked(useFetch).mockReturnValue({
      json: async () => {
        throw 500;
      },
    } as unknown as ReturnType<typeof useFetch>);
    const store = useSavedPromptsStore();
    await expect(store.createPrompt({ name: 'A', prompt: 'B' })).rejects.toThrow(
      'Could not save prompt',
    );
  });

  it('deletePrompt is a no-op for an empty id or in-flight delete', async () => {
    const store = useSavedPromptsStore();
    await store.deletePrompt('');
    expect(useFetch).not.toHaveBeenCalled();

    store.isDeletingId = 'busy';
    await store.deletePrompt('p1');
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('deletePrompt removes the item on success', async () => {
    mockFetchJson({ data: { value: { success: true } }, error: { value: null } });
    const store = useSavedPromptsStore();
    store.prompts = [promptA];
    await store.deletePrompt('p1');
    expect(store.prompts).toEqual([]);
    expect(store.isDeletingId).toBeNull();
  });

  it('deletePrompt throws when the request errors', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('nope') } });
    const store = useSavedPromptsStore();
    await expect(store.deletePrompt('p1')).rejects.toThrow('Could not delete prompt');
  });

  it('deletePrompt wraps non-Error throws', async () => {
    vi.mocked(useFetch).mockReturnValue({
      json: async () => {
        throw 'fail';
      },
    } as unknown as ReturnType<typeof useFetch>);
    const store = useSavedPromptsStore();
    await expect(store.deletePrompt('p1')).rejects.toThrow('Could not delete prompt');
  });
});
