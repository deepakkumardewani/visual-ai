import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from '@/composables/useFetch';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';
import { FeatureType } from '@/types';
import type { IImage, IImageObject } from '@/types';
import {
  applyReferralCode,
  bulkDelete,
  bulkFavorite,
  contactForm,
  deleteImage,
  bulkDownload,
  downloadHistoryImage,
  downloadItemImage,
  downloadImage,
  favoriteImage,
  formatFileSize,
  getDownloadImageUrl,
  getPublicIds,
} from '@/utils/helpers';

type FetchResult = {
  data: { value: unknown };
  error: { value: unknown };
  response?: {
    value: { status?: number; ok?: boolean; json?: () => Promise<{ message: string }> } | null;
  };
};

function mockFetchJson(result: FetchResult) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => result,
  } as unknown as ReturnType<typeof useFetch>);
}

function imageObject(overrides: Partial<IImageObject> = {}): IImageObject {
  return {
    _id: 'gen_1',
    userId: 'user_1',
    prompt: 'a fox',
    featureType: FeatureType.IMAGE,
    isFavorite: false,
    images: [{ name: 'a', resolution: '1k', aiImagePublicId: 'ai/1', format: 'png' } as IImage],
    ...overrides,
  };
}

describe('formatFileSize', () => {
  it('returns an empty string for missing or zero bytes', () => {
    expect(formatFileSize(undefined)).toBe('');
    expect(formatFileSize(0)).toBe('');
  });

  it('formats kilobytes and megabytes', () => {
    expect(formatFileSize(1536)).toBe('2 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
  });
});

describe('getPublicIds', () => {
  it('collects ai public ids for image generations', () => {
    expect(
      getPublicIds([
        imageObject({
          images: [
            { name: 'a', resolution: '1k', aiImagePublicId: 'ai/1' } as IImage,
            { name: 'b', resolution: '1k' } as IImage,
          ],
        }),
      ]),
    ).toEqual(['ai/1']);
  });

  it('collects original and enhanced ids for transform features', () => {
    expect(
      getPublicIds([
        imageObject({
          featureType: FeatureType.UPSCALE,
          images: [
            {
              name: 'a',
              resolution: '4k',
              originalPublicId: 'orig/1',
              enhancedPublicId: 'enh/1',
            } as IImage,
          ],
        }),
      ]),
    ).toEqual(['orig/1', 'enh/1']);
  });

  it('returns an empty list when nothing is deletable', () => {
    expect(getPublicIds([])).toEqual([]);
    expect(getPublicIds([imageObject({ images: [] })])).toEqual([]);
  });

  it('collects only the original id when an enhance image has no enhanced id', () => {
    expect(
      getPublicIds([
        imageObject({
          featureType: FeatureType.UPSCALE,
          images: [{ name: 'a', resolution: '4k', originalPublicId: 'orig/only' } as IImage],
        }),
      ]),
    ).toEqual(['orig/only']);
  });
});

describe('getDownloadImageUrl', () => {
  it('prefers the ai image url and never builds a url from a public id', () => {
    const url = getDownloadImageUrl({
      name: 'a',
      resolution: '1k',
      aiImagePublicId: 'folder/ai',
      aiImageUrl: 'https://cdn.example/direct.webp',
      enhancedImageUrl: 'https://cdn.example/enh.webp',
      format: 'webp',
    } as IImage);
    expect(url).toBe('https://cdn.example/direct.webp');
  });

  it('falls back to the enhanced then original url, then an empty string', () => {
    expect(getDownloadImageUrl({ enhancedImageUrl: 'https://cdn.example/e.png' } as IImage)).toBe(
      'https://cdn.example/e.png',
    );
    expect(getDownloadImageUrl({ originalImageUrl: 'https://cdn.example/o.png' } as IImage)).toBe(
      'https://cdn.example/o.png',
    );
    expect(getDownloadImageUrl({ aiImagePublicId: 'folder/ai' } as IImage)).toBe('');
  });
});

describe('store-backed helpers', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(useFetch).mockReset();
  });

  it('deleteImage stops the event, tracks the id, and removes the row on success', async () => {
    const user = useUserStore();
    const generate = useGenerateStore();
    const dialog = useDialogStore();
    const hideImage = vi.spyOn(dialog, 'hideImage');
    user.userId = 'user_1';
    user.history = [imageObject(), imageObject({ _id: 'keep' })];

    mockFetchJson({ data: { value: { imageId: 'gen_1' } }, error: { value: null } });

    const event = { stopPropagation: vi.fn() } as unknown as Event;
    await deleteImage(event, imageObject());

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(useFetch).toHaveBeenCalledWith(
      '/image/delete',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(generate.isDeleting).toBe(false);
    expect(user.history.map((item) => item._id)).toEqual(['keep']);
    expect(hideImage).toHaveBeenCalled();
  });

  it('deleteImage clears the deleting flag when the request fails', async () => {
    const generate = useGenerateStore();
    mockFetchJson({ data: { value: null }, error: { value: { message: 'nope' } } });

    await deleteImage({ stopPropagation: vi.fn() } as unknown as Event, imageObject());

    expect(generate.isDeleting).toBe(false);
    expect(generate.deletingImageIds).not.toContain('gen_1');
  });

  it('deleteImage skips tracking when the row has no id and ignores empty success payloads', async () => {
    const generate = useGenerateStore();
    mockFetchJson({ data: { value: null }, error: { value: null } });

    await deleteImage(
      { stopPropagation: vi.fn() } as unknown as Event,
      imageObject({ _id: undefined as never }),
    );

    expect(generate.deletingImageIds).toEqual([]);
    expect(generate.isDeleting).toBe(true);
  });

  it('favoriteImage updates isFavorite on the matching history item', async () => {
    const user = useUserStore();
    const generate = useGenerateStore();
    user.history = [imageObject({ isFavorite: false })];
    mockFetchJson({ data: { value: { isFavorite: true } }, error: { value: null } });

    await favoriteImage({ stopPropagation: vi.fn() } as unknown as Event, 'gen_1');

    expect(user.history[0].isFavorite).toBe(true);
    expect(generate.isFavoriting).toBe(false);
  });

  it('favoriteImage leaves unmatched history rows untouched', async () => {
    const user = useUserStore();
    user.history = [imageObject({ _id: 'other', isFavorite: false })];
    mockFetchJson({ data: { value: { isFavorite: true } }, error: { value: null } });

    await favoriteImage({ stopPropagation: vi.fn() } as unknown as Event, 'gen_1');

    expect(user.history[0].isFavorite).toBe(false);
  });

  it('favoriteImage leaves the busy flag on when there is no payload', async () => {
    const generate = useGenerateStore();
    mockFetchJson({ data: { value: null }, error: { value: null } });

    await favoriteImage({ stopPropagation: vi.fn() } as unknown as Event, 'gen_1');

    expect(generate.isFavoriting).toBe(false);
  });

  it('favoriteImage resets the flag and leaves history unchanged on error', async () => {
    const user = useUserStore();
    const generate = useGenerateStore();
    user.history = [imageObject({ isFavorite: false })];
    mockFetchJson({ data: { value: null }, error: { value: { message: 'fail' } } });

    await favoriteImage({ stopPropagation: vi.fn() } as unknown as Event, 'gen_1');

    expect(user.history[0].isFavorite).toBe(false);
    expect(generate.isFavoriting).toBe(false);
  });

  it('bulkFavorite marks listed items as favorite', async () => {
    const user = useUserStore();
    user.history = [imageObject({ _id: 'a' }), imageObject({ _id: 'b' })];
    mockFetchJson({ data: { value: { ok: true } }, error: { value: null } });

    await bulkFavorite([imageObject({ _id: 'a' })]);

    expect(user.history[0].isFavorite).toBe(true);
    expect(user.history[1].isFavorite).toBe(false);
  });

  it('bulkFavorite clears the busy flag on error', async () => {
    const history = useHistoryStore();
    mockFetchJson({ data: { value: null }, error: { value: { message: 'fail' } } });

    await bulkFavorite([imageObject()]);

    expect(history.isBulkFavoriting).toBe(false);
  });

  it('bulkFavorite ignores an empty success payload', async () => {
    const user = useUserStore();
    user.history = [imageObject({ isFavorite: false })];
    mockFetchJson({ data: { value: null }, error: { value: null } });

    await bulkFavorite([imageObject()]);

    expect(user.history[0].isFavorite).toBe(false);
  });

  it('bulkDelete clears the busy flag on error', async () => {
    const history = useHistoryStore();
    mockFetchJson({ data: { value: null }, error: { value: { message: 'fail' } } });

    await bulkDelete([imageObject()]);

    expect(history.isBulkDeleting).toBe(false);
  });

  it('bulkDelete leaves history unchanged without a payload', async () => {
    const user = useUserStore();
    user.history = [imageObject()];
    mockFetchJson({ data: { value: null }, error: { value: null } });

    await bulkDelete([imageObject()]);

    expect(user.history).toHaveLength(1);
  });

  it('bulkDownload requests the server endpoint per stored image and skips empty rows', async () => {
    mockFetchJson({
      data: { value: { url: 'https://cdn.example/dl.jpg' } },
      error: { value: null },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['x'], { type: 'image/jpeg' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement);

    await bulkDownload([
      undefined as never,
      imageObject({
        images: [
          { name: 'a', resolution: '1k', aiImagePublicId: 'ai/1', format: 'png' } as IImage,
          { name: 'b', resolution: '1k' } as IImage,
        ],
      }),
      imageObject({
        _id: 'gen_2',
        featureType: FeatureType.UPSCALE,
        images: [
          { name: 'c', resolution: '4k', enhancedPublicId: 'enh/1', format: 'jpg' } as IImage,
          { name: 'd', resolution: '4k' } as IImage,
        ],
      }),
    ]);

    expect(useFetch).toHaveBeenCalledTimes(2);
    expect(useFetch).toHaveBeenCalledWith('/images/gen_1/download?index=0');
    expect(useFetch).toHaveBeenCalledWith('/images/gen_2/download?index=0');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example/dl.jpg');
  });

  it('bulkDownload contains a malformed entry and still processes the others', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('404') } });

    await expect(
      bulkDownload([
        imageObject({ _id: 'broken', images: undefined as unknown as IImage[] }),
        imageObject({ _id: 'gen_ok' }),
      ]),
    ).resolves.toBeUndefined();

    expect(useFetch).toHaveBeenCalledTimes(1);
    expect(useFetch).toHaveBeenCalledWith('/images/gen_ok/download?index=0');
  });

  it('downloadHistoryImage returns false without an id or when the endpoint fails', async () => {
    await expect(downloadHistoryImage(undefined, undefined)).resolves.toBe(false);
    expect(useFetch).not.toHaveBeenCalled();

    mockFetchJson({ data: { value: null }, error: { value: new Error('404') } });
    await expect(downloadHistoryImage(undefined, 'gen_1', 2)).resolves.toBe(false);
    expect(useFetch).toHaveBeenCalledWith('/images/gen_1/download?index=2');
  });

  describe('downloadItemImage', () => {
    const providerUrl = 'https://replicate.delivery/pbxt/result.png';
    const providerImage = { aiImageUrl: providerUrl } as IImage;
    const fetchMock = vi.fn();

    let originalUrlFns: { create: typeof URL.createObjectURL; revoke: typeof URL.revokeObjectURL };

    beforeEach(() => {
      fetchMock.mockReset();
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['x'], { type: 'image/png' }),
      });
      vi.stubGlobal('fetch', fetchMock);
      originalUrlFns = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
      URL.createObjectURL = () => 'blob:x';
      URL.revokeObjectURL = () => {};
    });

    afterEach(() => {
      URL.createObjectURL = originalUrlFns.create;
      URL.revokeObjectURL = originalUrlFns.revoke;
      vi.unstubAllGlobals();
    });

    it('uses the plan-aware endpoint for saved entries', async () => {
      mockFetchJson({
        data: { value: { url: 'https://cdn.example/orig.png' } },
        error: { value: null },
      });
      const item = imageObject({
        _id: 'gen_1',
        images: [providerImage, providerImage],
      });

      await expect(downloadItemImage(undefined, item, 1)).resolves.toBe(true);

      expect(useFetch).toHaveBeenCalledWith('/images/gen_1/download?index=1');
      expect(fetchMock).toHaveBeenCalledWith('https://cdn.example/orig.png');
    });

    it('sends the resolved index to the endpoint when the requested one is out of range', async () => {
      mockFetchJson({
        data: { value: { url: 'https://cdn.example/orig.png' } },
        error: { value: null },
      });
      const item = imageObject({ _id: 'gen_1', images: [providerImage] });

      await expect(downloadItemImage(undefined, item, 5)).resolves.toBe(true);

      expect(useFetch).toHaveBeenCalledWith('/images/gen_1/download?index=0');
    });

    it('downloads the provider URL for unsaved entries without an _id', async () => {
      const item = imageObject({ _id: undefined, images: [providerImage] });

      await expect(downloadItemImage(undefined, item)).resolves.toBe(true);

      expect(useFetch).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith(providerUrl);
    });

    it('returns false when the item has no images', async () => {
      await expect(downloadItemImage(undefined, imageObject({ images: [] }))).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('stops event propagation', async () => {
      const event = new Event('click');
      const stop = vi.spyOn(event, 'stopPropagation');
      await downloadItemImage(event, imageObject({ _id: undefined, images: [providerImage] }));
      expect(stop).toHaveBeenCalled();
    });
  });

  it('bulkDelete removes matching history rows', async () => {
    const user = useUserStore();
    const history = useHistoryStore();
    user.history = [imageObject({ _id: 'a' }), imageObject({ _id: 'b' })];
    mockFetchJson({ data: { value: { ok: true } }, error: { value: null } });

    await bulkDelete([imageObject({ _id: 'a' })]);

    expect(user.history.map((item) => item._id)).toEqual(['b']);
    expect(history.isBulkDeleting).toBe(false);
  });

  it('applyReferralCode stores credits and hides the dialog', async () => {
    const user = useUserStore();
    const dialog = useDialogStore();
    const hideReferral = vi.spyOn(dialog, 'hideReferral');
    const setCredits = vi.spyOn(user, 'setCredits');
    mockFetchJson({ data: { value: { credits: 80 } }, error: { value: null } });

    await applyReferralCode('FRIEND');

    expect(setCredits).toHaveBeenCalledWith(80);
    expect(hideReferral).toHaveBeenCalled();
  });

  it('applyReferralCode throws the API message on 400', async () => {
    mockFetchJson({
      data: { value: null },
      error: { value: { message: 'used' } },
      response: { value: { status: 400, json: async () => ({ message: 'Already used' }) } },
    });

    await expect(applyReferralCode('USED')).rejects.toThrow('Already used');
  });

  it('applyReferralCode throws a generic error for other failures', async () => {
    mockFetchJson({
      data: { value: null },
      error: { value: { message: 'down' } },
      response: { value: { status: 500 } },
    });

    await expect(applyReferralCode('X')).rejects.toThrow('Something went wrong');
  });

  it('contactForm throws on 400 and on unexpected errors', async () => {
    mockFetchJson({
      data: { value: null },
      error: { value: true },
      response: { value: { status: 400, json: async () => ({ message: 'Invalid email' }) } },
    });
    await expect(
      contactForm({ name: 'A', email: 'bad', subject: 'Hi', message: 'Hello' }),
    ).rejects.toThrow('Invalid email');

    mockFetchJson({
      data: { value: null },
      error: { value: true },
      response: { value: { status: 503 } },
    });
    await expect(
      contactForm({ name: 'A', email: 'a@b.co', subject: 'Hi', message: 'Hello' }),
    ).rejects.toThrow('Something went wrong');
  });

  it('applyReferralCode does nothing when the payload is empty', async () => {
    const dialog = useDialogStore();
    const hideReferral = vi.spyOn(dialog, 'hideReferral');
    mockFetchJson({ data: { value: null }, error: { value: null } });

    await applyReferralCode('EMPTY');
    expect(hideReferral).not.toHaveBeenCalled();
  });

  it('contactForm throws a generic error when the response has no status', async () => {
    mockFetchJson({
      data: { value: null },
      error: { value: true },
      response: { value: null },
    });
    await expect(
      contactForm({ name: 'A', email: 'a@b.co', subject: 'Hi', message: 'Hello' }),
    ).rejects.toThrow('Something went wrong');
  });

  it('contactForm resolves when the API accepts the message', async () => {
    mockFetchJson({
      data: { value: { ok: true } },
      error: { value: null },
      response: { value: { ok: true } },
    });
    await expect(
      contactForm({ name: 'A', email: 'a@b.co', subject: 'Hi', message: 'Hello' }),
    ).resolves.toBeUndefined();
  });

  it('contactForm throws when the response is not ok without a fetch error', async () => {
    mockFetchJson({
      data: { value: { message: 'Server error' } },
      error: { value: null },
      response: { value: { ok: false, status: 500 } },
    });
    await expect(
      contactForm({ name: 'A', email: 'a@b.co', subject: 'Hi', message: 'Hello' }),
    ).rejects.toThrow('Something went wrong');
  });
});

describe('downloadImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns false when no image url is given', async () => {
    await expect(downloadImage()).resolves.toBe(false);
  });

  it('creates a download link from the fetched blob', async () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
      remove,
    } as unknown as HTMLAnchorElement);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['x'], { type: 'image/jpeg' }),
      }),
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });

    const event = { stopPropagation: vi.fn() } as unknown as Event;
    await expect(downloadImage(event, 'https://cdn.example/a.webp')).resolves.toBe(true);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
  });

  it('returns false when fetch is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(downloadImage(undefined, 'https://cdn.example/missing.png')).resolves.toBe(false);
  });

  it('returns false when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(downloadImage(undefined, 'https://cdn.example/a.png')).resolves.toBe(false);
  });

  it('falls back to the path extension when the blob has no mime type', async () => {
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const anchor = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['x'], { type: '' }),
      }),
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });

    await downloadImage(undefined, 'https://cdn.example/photo.webp?x=1');
    expect(anchor.download).toMatch(/\.webp$/);

    await downloadImage(undefined, '.');
    expect(anchor.download).toMatch(/\.png$/);
  });
});
